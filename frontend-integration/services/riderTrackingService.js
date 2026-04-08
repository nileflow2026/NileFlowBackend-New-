// services/riderTrackingService.js
import io from "socket.io-client";

class RiderTrackingService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.watchId = null;
    this.isTracking = false;
    this.currentDelivery = null;
    this.riderId = null;
    this.authToken = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Initialize connection for a rider
  connect(riderId, authToken) {
    if (this.socket) {
      this.disconnect();
    }

    this.riderId = riderId;
    this.authToken = authToken;

    // Use your backend URL
    const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";

    this.socket = io(backendUrl, {
      auth: { token: authToken },
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("🔗 Rider connected to tracking server");
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit("connected", { riderId });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Rider disconnected from tracking server:", reason);
      this.isConnected = false;
      this.emit("disconnected", { reason });
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Rider connection error:", error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
        this.emit("connection-failed", { error: error.message });
      } else {
        this.emit("connection-error", {
          error: error.message,
          attempt: this.reconnectAttempts,
        });
      }
    });

    this.socket.on("reconnect", () => {
      console.log("🔄 Rider reconnected to tracking server");
      this.reconnectAttempts = 0;
      this.emit("reconnected");
    });

    // Listen for route updates
    this.socket.on("route-update", (routeData) => {
      console.log("🗺️ Route update received:", routeData);
      this.emit("route-update", routeData);
    });

    return this.socket;
  }

  // Join delivery room for real-time updates
  joinDeliveryRoom(deliveryId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("join-rider-delivery", {
        riderId: this.riderId,
        deliveryId: deliveryId,
      });

      this.socket.on("joined-delivery", (data) => {
        console.log("✅ Joined delivery room:", data.rooms);
        this.emit("delivery-room-joined", data);
      });
    } else {
      console.warn("Cannot join delivery room: not connected to server");
    }
  }

  // Start GPS tracking for a delivery
  startLocationTracking(deliveryId) {
    this.currentDelivery = deliveryId;
    this.joinDeliveryRoom(deliveryId);

    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      this.emit("location-error", { error: "Geolocation not supported" });
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          deliveryId: deliveryId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };

        // Send location to backend API
        this.updateLocationOnServer(locationData);

        // Also broadcast via WebSocket for real-time updates
        this.broadcastLocation(locationData);

        // Emit to local listeners
        this.emit("location-update", locationData);
      },
      (error) => {
        console.error("GPS Error:", error);
        this.emit("location-error", { error: error.message });
      },
      options
    );

    this.isTracking = true;
    console.log(`📍 Started location tracking for delivery: ${deliveryId}`);
  }

  // Update location on server via API call
  async updateLocationOnServer(locationData) {
    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:3000"
        }/api/rider/delivery/${locationData.deliveryId}/location`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            heading: locationData.heading,
            speed: locationData.speed,
          }),
        }
      );

      if (response.ok) {
        console.log("📍 Location updated on server");
        const result = await response.json();
        this.emit("server-location-updated", result.data);
      } else {
        const error = await response.json();
        console.error("Failed to update location on server:", error);
        this.emit("server-location-error", error);
      }
    } catch (error) {
      console.error("Failed to update location:", error);
      this.emit("server-location-error", { error: error.message });
    }
  }

  // Broadcast location via WebSocket for real-time updates
  broadcastLocation(locationData) {
    if (this.socket && this.isConnected) {
      this.socket.emit("rider-location-update", {
        orderId: locationData.deliveryId, // Using deliveryId as orderId for room matching
        riderId: this.riderId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        status: "in_transit",
        speed: locationData.speed,
        heading: locationData.heading,
      });
    }
  }

  // Start delivery (call API and begin tracking)
  async startDelivery(deliveryId, currentLocation) {
    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:3000"
        }/api/rider/delivery/${deliveryId}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("🚀 Delivery started successfully");

        // Start location tracking
        this.startLocationTracking(deliveryId);

        this.emit("delivery-started", result.data);
        return result;
      } else {
        const error = await response.json();
        console.error("Failed to start delivery:", error);
        this.emit("delivery-start-error", error);
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error("Failed to start delivery:", error);
      this.emit("delivery-start-error", { error: error.message });
      return { success: false, error: error.message };
    }
  }

  // Complete delivery
  async completeDelivery(deliveryId, currentLocation, notes = "") {
    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:3000"
        }/api/rider/delivery/${deliveryId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            notes,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Delivery completed successfully");

        // Stop location tracking
        this.stopLocationTracking();

        this.emit("delivery-completed", result.data);
        return result;
      } else {
        const error = await response.json();
        console.error("Failed to complete delivery:", error);
        this.emit("delivery-complete-error", error);
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error("Failed to complete delivery:", error);
      this.emit("delivery-complete-error", { error: error.message });
      return { success: false, error: error.message };
    }
  }

  // Stop location tracking
  stopLocationTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    this.currentDelivery = null;
    console.log("📍 Location tracking stopped");
  }

  // Request route from current location to destination
  requestRoute(from, to) {
    if (this.socket && this.isConnected) {
      this.socket.emit("request-route", {
        riderId: this.riderId,
        from,
        to,
      });
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  // Send a message to the server (if needed)
  sendMessage(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Cannot send message: not connected to server");
    }
  }

  // Disconnect from server
  disconnect() {
    this.stopLocationTracking();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Get current tracking status
  getTrackingStatus() {
    return {
      isConnected: this.isConnected,
      isTracking: this.isTracking,
      currentDelivery: this.currentDelivery,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id || null,
    };
  }

  // Get current location (one-time)
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }
}

// Export singleton instance
export const riderTrackingService = new RiderTrackingService();
export default riderTrackingService;
