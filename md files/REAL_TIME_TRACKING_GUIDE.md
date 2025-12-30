# Real-Time Tracking Implementation Guide - "Uber-like" Live Tracking

This guide provides complete frontend implementation examples for both **Customer** and **Rider** apps to integrate with the real-time tracking system.

## 🎯 Overview

Your backend now supports:

- ✅ Real-time location updates via WebSocket
- ✅ Delivery status notifications
- ✅ Route management for riders
- ✅ Uber-like live tracking experience

## 📡 WebSocket Events

### Customer Events (Receive)

- `joined-tracking` - Confirmation of joining tracking room
- `rider-location-update` - Live rider location updates
- `delivery-started` - Notification when rider begins delivery
- `delivery-completed` - Notification when delivery is complete
- `delivery-status-update` - Status changes during delivery

### Rider Events (Send/Receive)

- `join-rider-delivery` - Join delivery tracking room
- `rider-location-broadcast` - Send location to customers
- `route-update` - Receive navigation route
- `delivery-status-update` - Receive status updates

## 🛒 Customer App Implementation

### 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Customer Tracking Service (React/JavaScript)

```javascript
// services/trackingService.js
import io from "socket.io-client";

class CustomerTrackingService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Connect to WebSocket server
  connect(orderId, userId) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(process.env.REACT_APP_API_URL || "http://localhost:3000", {
      transports: ["websocket", "polling"],
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      console.log("🔗 Connected to tracking server");
      this.isConnected = true;

      // Join order tracking room
      this.socket.emit("join-order-tracking", { orderId, userId });
    });

    this.socket.on("joined-tracking", (data) => {
      console.log("✅ Joined tracking room:", data.roomName);
      this.emit("tracking-ready", data);
    });

    // Listen for real-time location updates
    this.socket.on("rider-location-update", (locationData) => {
      console.log("📍 Rider location update:", locationData);
      this.emit("location-update", locationData);
    });

    // Listen for delivery start
    this.socket.on("delivery-started", (startData) => {
      console.log("🚀 Delivery started:", startData);
      this.emit("delivery-started", startData);
    });

    // Listen for delivery completion
    this.socket.on("delivery-completed", (completionData) => {
      console.log("✅ Delivery completed:", completionData);
      this.emit("delivery-completed", completionData);
    });

    // Listen for status updates
    this.socket.on("delivery-status-update", (statusData) => {
      console.log("📢 Status update:", statusData);
      this.emit("status-update", statusData);
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from tracking server");
      this.isConnected = false;
      this.emit("disconnected");
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
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const customerTrackingService = new CustomerTrackingService();
```

### 3. Customer Map Component (React with Google Maps)

```jsx
// components/CustomerTrackingMap.jsx
import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { customerTrackingService } from "../services/trackingService";

const CustomerTrackingMap = ({ orderId, userId, deliveryAddress }) => {
  const [riderLocation, setRiderLocation] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState("assigned");
  const [directions, setDirections] = useState(null);
  const [riderInfo, setRiderInfo] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  useEffect(() => {
    // Connect to tracking service
    customerTrackingService.connect(orderId, userId);

    // Set up event listeners
    customerTrackingService.on("location-update", handleLocationUpdate);
    customerTrackingService.on("delivery-started", handleDeliveryStarted);
    customerTrackingService.on("delivery-completed", handleDeliveryCompleted);
    customerTrackingService.on("status-update", handleStatusUpdate);

    return () => {
      // Cleanup
      customerTrackingService.off("location-update", handleLocationUpdate);
      customerTrackingService.off("delivery-started", handleDeliveryStarted);
      customerTrackingService.off(
        "delivery-completed",
        handleDeliveryCompleted
      );
      customerTrackingService.off("status-update", handleStatusUpdate);
      customerTrackingService.disconnect();
    };
  }, [orderId, userId]);

  const handleLocationUpdate = (locationData) => {
    setRiderLocation({
      lat: locationData.latitude,
      lng: locationData.longitude,
    });

    // Update route if rider location changed significantly
    if (deliveryAddress && isLoaded) {
      calculateRoute(locationData);
    }
  };

  const handleDeliveryStarted = (startData) => {
    setDeliveryStatus("picked_up");
    setRiderInfo({
      name: startData.riderName,
      status: "On the way",
    });
  };

  const handleDeliveryCompleted = (completionData) => {
    setDeliveryStatus("delivered");
    setRiderInfo((prev) => ({
      ...prev,
      status: "Delivered",
    }));
  };

  const handleStatusUpdate = (statusData) => {
    setDeliveryStatus(statusData.status);
  };

  const calculateRoute = (currentLocation) => {
    if (!window.google || !deliveryAddress) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
        destination: deliveryAddress,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
        }
      }
    );
  };

  const getStatusColor = () => {
    switch (deliveryStatus) {
      case "assigned":
        return "#ffa500";
      case "picked_up":
        return "#2196f3";
      case "in_transit":
        return "#4caf50";
      case "delivered":
        return "#8bc34a";
      default:
        return "#757575";
    }
  };

  const getStatusText = () => {
    switch (deliveryStatus) {
      case "assigned":
        return "Rider Assigned";
      case "picked_up":
        return "Order Picked Up";
      case "in_transit":
        return "On the Way";
      case "delivered":
        return "Delivered";
      default:
        return "Preparing";
    }
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="tracking-container">
      {/* Status Header */}
      <div
        className="status-header"
        style={{
          backgroundColor: getStatusColor(),
          color: "white",
          padding: "16px",
          textAlign: "center",
        }}
      >
        <h3>{getStatusText()}</h3>
        {riderInfo && (
          <p>
            Rider: {riderInfo.name} - {riderInfo.status}
          </p>
        )}
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={riderLocation || { lat: -1.286389, lng: 36.817223 }} // Default to Nairobi
        zoom={15}
      >
        {/* Rider Location Marker */}
        {riderLocation && (
          <Marker
            position={riderLocation}
            title="Rider Location"
            icon={{
              url: "/rider-icon.png", // Add rider icon
              scaledSize: new window.google.maps.Size(40, 40),
            }}
          />
        )}

        {/* Delivery Address Marker */}
        {deliveryAddress && (
          <Marker
            position={deliveryAddress}
            title="Delivery Address"
            icon={{
              url: "/destination-icon.png", // Add destination icon
              scaledSize: new window.google.maps.Size(40, 40),
            }}
          />
        )}

        {/* Route */}
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>

      {/* Live Status Updates */}
      <div
        className="live-updates"
        style={{
          padding: "16px",
          backgroundColor: "#f5f5f5",
        }}
      >
        <p>🔴 Live Tracking Active</p>
        {riderLocation && (
          <p>📍 Last Update: {new Date().toLocaleTimeString()}</p>
        )}
      </div>
    </div>
  );
};

export default CustomerTrackingMap;
```

## 🏍️ Rider App Implementation

### 1. Rider Tracking Service

```javascript
// services/riderTrackingService.js
import io from "socket.io-client";

class RiderTrackingService {
  constructor() {
    this.socket = null;
    this.watchId = null;
    this.isTracking = false;
    this.deliveryId = null;
    this.riderId = null;
  }

  // Connect and start tracking
  startTracking(deliveryId, riderId, authToken) {
    this.deliveryId = deliveryId;
    this.riderId = riderId;

    // Connect to WebSocket
    this.socket = io(process.env.REACT_APP_API_URL || "http://localhost:3000", {
      auth: { token: authToken },
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("🔗 Rider connected to tracking server");

      // Join rider delivery room
      this.socket.emit("join-rider-delivery", { riderId, deliveryId });
    });

    // Start GPS tracking
    this.startGPSTracking();
  }

  // Start GPS location tracking
  startGPSTracking() {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          accuracy: position.coords.accuracy,
        };

        // Send location to backend API
        this.updateLocationOnServer(locationData);
      },
      (error) => {
        console.error("GPS Error:", error);
      },
      options
    );

    this.isTracking = true;
  }

  // Update location on server via API call
  async updateLocationOnServer(locationData) {
    try {
      const response = await fetch(
        `/api/rider/delivery/${this.deliveryId}/location`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("riderToken")}`,
          },
          body: JSON.stringify(locationData),
        }
      );

      if (response.ok) {
        console.log("📍 Location updated on server");
      }
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  }

  // Start delivery
  async startDelivery(currentLocation) {
    try {
      const response = await fetch(
        `/api/rider/delivery/${this.deliveryId}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("riderToken")}`,
          },
          body: JSON.stringify({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }),
        }
      );

      if (response.ok) {
        console.log("🚀 Delivery started");
        return await response.json();
      }
    } catch (error) {
      console.error("Failed to start delivery:", error);
    }
  }

  // Complete delivery
  async completeDelivery(currentLocation, notes = "") {
    try {
      const response = await fetch(
        `/api/rider/delivery/${this.deliveryId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("riderToken")}`,
          },
          body: JSON.stringify({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            notes,
          }),
        }
      );

      if (response.ok) {
        console.log("✅ Delivery completed");
        this.stopTracking();
        return await response.json();
      }
    } catch (error) {
      console.error("Failed to complete delivery:", error);
    }
  }

  // Stop tracking
  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isTracking = false;
  }
}

export const riderTrackingService = new RiderTrackingService();
```

### 2. Rider Map Component

```jsx
// components/RiderDeliveryMap.jsx
import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { riderTrackingService } from "../services/riderTrackingService";

const RiderDeliveryMap = ({ delivery, riderId, authToken }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(delivery.status);
  const [isTracking, setIsTracking] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    // Get initial location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCurrentLocation(location);
        calculateRouteToDestination(location);
      });
    }

    return () => {
      riderTrackingService.stopTracking();
    };
  }, []);

  const calculateRouteToDestination = (startLocation) => {
    if (!window.google || !delivery.deliveryAddress) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: startLocation,
        destination: delivery.deliveryAddress,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
        }
      }
    );
  };

  const handleStartTracking = () => {
    if (!currentLocation) return;

    riderTrackingService.startTracking(delivery.$id, riderId, authToken);
    setIsTracking(true);
  };

  const handleStartDelivery = async () => {
    if (!currentLocation) return;

    const result = await riderTrackingService.startDelivery(currentLocation);
    if (result) {
      setDeliveryStatus("picked_up");
    }
  };

  const handleCompleteDelivery = async () => {
    if (!currentLocation) return;

    const notes = prompt("Any delivery notes?");
    const result = await riderTrackingService.completeDelivery(
      currentLocation,
      notes
    );
    if (result) {
      setDeliveryStatus("delivered");
      setIsTracking(false);
    }
  };

  const getActionButton = () => {
    switch (deliveryStatus) {
      case "assigned":
        return (
          <div>
            <button
              onClick={handleStartTracking}
              className="btn-primary"
              disabled={isTracking}
            >
              {isTracking
                ? "🔴 Live Tracking Active"
                : "📍 Start Live Tracking"}
            </button>
            <button
              onClick={handleStartDelivery}
              className="btn-success"
              disabled={!isTracking}
            >
              🚀 Start Delivery
            </button>
          </div>
        );
      case "picked_up":
      case "in_transit":
        return (
          <button onClick={handleCompleteDelivery} className="btn-complete">
            ✅ Mark as Delivered
          </button>
        );
      case "delivered":
        return <div className="completed-status">✅ Delivery Completed</div>;
      default:
        return null;
    }
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="rider-map-container">
      {/* Delivery Info Header */}
      <div className="delivery-info">
        <h3>Delivery to: {delivery.customerName}</h3>
        <p>📍 {delivery.deliveryAddress}</p>
        <p>📞 {delivery.customerPhone}</p>
        <p>
          Status:{" "}
          <strong>{deliveryStatus.replace("_", " ").toUpperCase()}</strong>
        </p>
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "400px" }}
        center={currentLocation || { lat: -1.286389, lng: 36.817223 }}
        zoom={15}
      >
        {/* Current Location */}
        {currentLocation && (
          <Marker
            position={currentLocation}
            title="Your Location"
            icon={{
              url: "/rider-current-location.png",
              scaledSize: new window.google.maps.Size(40, 40),
            }}
          />
        )}

        {/* Delivery Destination */}
        {delivery.deliveryAddress && (
          <Marker
            position={delivery.deliveryAddress}
            title="Delivery Address"
            icon={{
              url: "/destination-icon.png",
              scaledSize: new window.google.maps.Size(40, 40),
            }}
          />
        )}

        {/* Route */}
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>

      {/* Action Buttons */}
      <div className="action-buttons">{getActionButton()}</div>

      {/* Live Status */}
      {isTracking && (
        <div className="tracking-status">
          <p>🔴 Live tracking active - Customers can see your location</p>
          <p>📍 Last update: {new Date().toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
};

export default RiderDeliveryMap;
```

## 🎯 Usage Examples

### Customer App Usage

```jsx
// In your order tracking page
import CustomerTrackingMap from "./components/CustomerTrackingMap";

function OrderTrackingPage({ orderId, userId }) {
  const [deliveryAddress, setDeliveryAddress] = useState(null);

  useEffect(() => {
    // Fetch order details including delivery address
    fetchOrderDetails(orderId).then((order) => {
      setDeliveryAddress({
        lat: order.deliveryLatitude,
        lng: order.deliveryLongitude,
      });
    });
  }, [orderId]);

  return (
    <div>
      <h1>Track Your Order</h1>
      <CustomerTrackingMap
        orderId={orderId}
        userId={userId}
        deliveryAddress={deliveryAddress}
      />
    </div>
  );
}
```

### Rider App Usage

```jsx
// In your delivery management page
import RiderDeliveryMap from "./components/RiderDeliveryMap";

function DeliveryPage({ delivery, riderId, authToken }) {
  return (
    <div>
      <h1>Active Delivery</h1>
      <RiderDeliveryMap
        delivery={delivery}
        riderId={riderId}
        authToken={authToken}
      />
    </div>
  );
}
```

## 📱 Testing the Implementation

### 1. Test Customer Tracking

1. Place an order and get the orderId
2. Visit the customer tracking page
3. Assign a rider to the delivery in admin panel
4. Open the rider app and start tracking
5. Watch real-time updates in customer app

### 2. Test Rider Tracking

1. Log in as a rider
2. View assigned deliveries
3. Start live tracking
4. Start the delivery
5. Move around to see location updates
6. Complete the delivery

### 3. Real-time Features to Verify

- ✅ Customer sees rider approaching in real-time
- ✅ Rider gets turn-by-turn navigation
- ✅ Live status updates (picked up, in transit, delivered)
- ✅ WebSocket reconnection handling
- ✅ Location accuracy and update frequency

## 🔧 API Endpoints Summary

### Customer Endpoints

- `GET /api/orders/tracking/:orderId` - Get order status with rider details
- `GET /api/orders/tracking/:orderId/location` - Get current delivery location

### Rider Endpoints

- `PATCH /api/rider/delivery/:deliveryId/location` - Update rider location
- `POST /api/rider/delivery/:deliveryId/start` - Start delivery
- `POST /api/rider/delivery/:deliveryId/complete` - Complete delivery

### WebSocket Events

- Customer: `join-order-tracking`, receives `rider-location-update`, `delivery-started`, `delivery-completed`
- Rider: `join-rider-delivery`, sends location via API calls

Your backend now supports Uber-like real-time tracking! 🚀
