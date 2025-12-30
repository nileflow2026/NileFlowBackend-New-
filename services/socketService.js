// services/socketService.js
const { Server } = require("socket.io");

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Map of userId -> socketId
    this.riderRooms = new Map(); // Map of riderId -> room name
  }

  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL_PROD || "http://localhost:5173",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      console.log("🔗 Client connected:", socket.id);

      // Handle customer joining order tracking room
      socket.on("join-order-tracking", (data) => {
        const { orderId, userId } = data;
        const roomName = `order-${orderId}`;

        socket.join(roomName);
        this.connectedUsers.set(userId, socket.id);

        console.log(
          `👤 Customer ${userId} joined tracking room for order ${orderId}`
        );

        // Send confirmation
        socket.emit("joined-tracking", { orderId, roomName });
      });

      // Handle rider joining delivery room
      socket.on("join-rider-delivery", (data) => {
        const { riderId, deliveryId } = data;
        const riderRoom = `rider-${riderId}`;
        const deliveryRoom = `delivery-${deliveryId}`;

        socket.join(riderRoom);
        socket.join(deliveryRoom);
        this.riderRooms.set(riderId, { riderRoom, deliveryRoom });

        console.log(
          `🏍️ Rider ${riderId} joined delivery room for ${deliveryId}`
        );

        // Send confirmation with room info
        socket.emit("joined-delivery", {
          riderId,
          deliveryId,
          rooms: [riderRoom, deliveryRoom],
        });
      });

      // Handle rider location updates (real-time)
      socket.on("rider-location-update", (data) => {
        const {
          orderId,
          riderId,
          latitude,
          longitude,
          status,
          speed,
          heading,
        } = data;

        // Broadcast to all customers tracking this order
        const orderRoom = `order-${orderId}`;
        socket.to(orderRoom).emit("live-location-update", {
          orderId,
          riderId,
          currentLatitude: latitude,
          currentLongitude: longitude,
          status,
          speed: speed || 0,
          heading: heading || 0,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `📍 Broadcasting location update for order ${orderId} to room ${orderRoom}`
        );
      });

      // Handle rider status updates
      socket.on("rider-status-update", (data) => {
        const { orderId, riderId, status, message } = data;

        const orderRoom = `order-${orderId}`;
        socket.to(orderRoom).emit("delivery-status-update", {
          orderId,
          riderId,
          status,
          message,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `📢 Broadcasting status update: ${status} for order ${orderId}`
        );
      });

      // Handle route updates for riders
      socket.on("request-route", (data) => {
        const { riderId, from, to } = data;

        // Send route calculation request back to rider
        // This could integrate with Google Maps, Mapbox, or other routing services
        socket.emit("route-calculated", {
          riderId,
          route: {
            from,
            to,
            // Add route points, distance, duration etc.
            // This would typically come from a routing API
          },
        });
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);

        // Clean up user mappings
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            break;
          }
        }

        // Clean up rider rooms
        for (const [riderId, rooms] of this.riderRooms.entries()) {
          // Could check if this socket belongs to this rider and clean up
        }
      });
    });

    console.log("🚀 Socket.IO server initialized");
    return this.io;
  }

  // Method to broadcast location updates from API endpoints
  broadcastLocationUpdate(orderId, locationData) {
    if (this.io) {
      const roomName = `order-${orderId}`;
      this.io.to(roomName).emit("live-location-update", {
        orderId,
        ...locationData,
        timestamp: new Date().toISOString(),
      });
      console.log(`📡 API broadcast to room ${roomName}:`, locationData);
    }
  }

  // Method to broadcast status changes
  broadcastStatusUpdate(orderId, statusData) {
    if (this.io) {
      const roomName = `order-${orderId}`;
      this.io.to(roomName).emit("delivery-status-update", {
        orderId,
        ...statusData,
        timestamp: new Date().toISOString(),
      });
      console.log(`📢 API status broadcast to room ${roomName}:`, statusData);
    }
  }

  // Method to send route to rider
  sendRouteToRider(riderId, routeData) {
    if (this.io) {
      const riderRoom = `rider-${riderId}`;
      this.io.to(riderRoom).emit("route-update", {
        riderId,
        ...routeData,
        timestamp: new Date().toISOString(),
      });
      console.log(`🗺️ Route sent to rider ${riderId}:`, routeData);
    }
  }

  // Broadcast rider-specific location data
  broadcastRiderLocation(deliveryId, locationData) {
    if (!this.io) {
      console.log("❌ Socket.IO not initialized");
      return;
    }

    const riderRoom = `delivery-${deliveryId}`;
    const orderRoom = `order-${deliveryId}`;

    // Send to both rider and customer rooms
    this.io.to(riderRoom).emit("rider-location-update", locationData);
    this.io.to(orderRoom).emit("rider-location-update", locationData);

    console.log(
      `📡 Rider location broadcasted to rooms: ${riderRoom}, ${orderRoom}`
    );
  }

  // Broadcast delivery start notification
  broadcastDeliveryStart(deliveryId, startData) {
    if (!this.io) {
      console.log("❌ Socket.IO not initialized");
      return;
    }

    const orderRoom = `order-${deliveryId}`;
    this.io.to(orderRoom).emit("delivery-started", startData);

    console.log(`📡 Delivery start broadcasted to room: ${orderRoom}`);
  }

  // Broadcast delivery completion notification
  broadcastDeliveryComplete(deliveryId, completionData) {
    if (!this.io) {
      console.log("❌ Socket.IO not initialized");
      return;
    }

    const orderRoom = `order-${deliveryId}`;
    this.io.to(orderRoom).emit("delivery-completed", completionData);

    console.log(`📡 Delivery completion broadcasted to room: ${orderRoom}`);
  }
}

// Export singleton instance
const socketService = new SocketService();
module.exports = socketService;
