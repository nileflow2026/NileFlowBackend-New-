// services/customerTrackingService.js
import io from "socket.io-client";

class CustomerTrackingService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Connect to WebSocket server
  connect(orderId, userId) {
    if (this.socket) {
      this.disconnect();
    }

    // Use your backend URL
    const backendUrl =  "http://localhost:3000";

    this.socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("🔗 Connected to live tracking server");
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Join order tracking room for real-time updates
      this.socket.emit("join-order-tracking", { orderId, userId });
      this.emit("connected", { orderId, userId });
    });

    this.socket.on("joined-tracking", (data) => {
      console.log("✅ Joined tracking room:", data.roomName);
      this.emit("tracking-ready", data);
    });

    // Listen for real-time rider location updates
    this.socket.on("rider-location-update", (locationData) => {
      console.log("📍 Real-time rider location:", locationData);
      this.emit("location-update", locationData);
    });

    // Listen for live location updates (from API calls)
    this.socket.on("live-location-update", (locationData) => {
      console.log("📍 Live location update:", locationData);
      this.emit("location-update", locationData);
    });

    // Listen for delivery start notification
    this.socket.on("delivery-started", (startData) => {
      console.log("🚀 Delivery started notification:", startData);
      this.emit("delivery-started", startData);
    });

    // Listen for delivery completion notification
    this.socket.on("delivery-completed", (completionData) => {
      console.log("✅ Delivery completed:", completionData);
      this.emit("delivery-completed", completionData);
    });

    // Listen for general status updates
    this.socket.on("delivery-status-update", (statusData) => {
      console.log("📢 Delivery status update:", statusData);
      this.emit("status-update", statusData);
    });

    // Handle disconnection
    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from tracking server:", reason);
      this.isConnected = false;
      this.emit("disconnected", { reason });
    });

    // Handle connection errors
    this.socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
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

    // Handle reconnection success
    this.socket.on("reconnect", () => {
      console.log("🔄 Reconnected to tracking server");
      this.reconnectAttempts = 0;
      this.emit("reconnected");
    });

    return this.socket;
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
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id || null,
    };
  }
}

// Export singleton instance
export const customerTrackingService = new CustomerTrackingService();
export default customerTrackingService;
