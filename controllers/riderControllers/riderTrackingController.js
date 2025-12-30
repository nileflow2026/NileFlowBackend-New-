// controllers/riderControllers/riderTrackingController.js
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const { Query } = require("node-appwrite");

// Import socket service for real-time updates
let socketService = null;
try {
  socketService = require("../../services/socketService");
} catch (error) {
  console.log("Socket service not available:", error.message);
}

/**
 * Update rider location during delivery (for riders)
 * PATCH /api/rider/delivery/:deliveryId/location
 */
const updateRiderLocation = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { latitude, longitude, status, heading, speed } = req.body;
    const riderId = req.rider.userId; // From rider auth middleware

    console.log(
      `📍 Updating location for rider ${riderId}, delivery: ${deliveryId}`
    );

    if (!deliveryId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Delivery ID, latitude, and longitude are required",
      });
    }

    // Update location data in delivery record
    const updateData = {
      currentLatitude: latitude,
      currentLongitude: longitude,
      updatedAt: new Date().toISOString(),
    };

    // Add optional fields if provided
    if (status) updateData.status = status;
    if (heading !== undefined) updateData.heading = heading;
    if (speed !== undefined) updateData.speed = speed;

    // Update the delivery record with new location
    const updatedDelivery = await db.updateDocument(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      deliveryId,
      updateData
    );

    console.log("✅ Rider location updated successfully");

    // Broadcast real-time location update via WebSocket
    if (socketService && socketService.broadcastRiderLocation) {
      try {
        const locationData = {
          riderId: riderId,
          deliveryId: deliveryId,
          latitude: latitude,
          longitude: longitude,
          status: updatedDelivery.status,
          heading: heading,
          speed: speed,
          timestamp: new Date().toISOString(),
          customerName: updatedDelivery.customerName,
          deliveryAddress: updatedDelivery.deliveryAddress,
        };

        // Broadcast to both customer and rider rooms
        socketService.broadcastRiderLocation(deliveryId, locationData);
        socketService.broadcastLocationUpdate(deliveryId, locationData);

        console.log("📡 Real-time location broadcasted to customer and rider");
      } catch (socketError) {
        console.log(
          "❌ Failed to broadcast rider location:",
          socketError.message
        );
      }
    }

    res.json({
      success: true,
      message: "Location updated successfully",
      data: {
        deliveryId: deliveryId,
        riderId: riderId,
        latitude: latitude,
        longitude: longitude,
        status: updatedDelivery.status,
        heading: heading,
        speed: speed,
        timestamp: updatedDelivery.updatedAt,
        pickupAddress: updatedDelivery.pickupAddress,
        deliveryAddress: updatedDelivery.deliveryAddress,
      },
    });
  } catch (error) {
    console.error("Error updating rider location:", error);

    if (error.code === 404) {
      return res.status(404).json({
        success: false,
        message: "Delivery record not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update location",
      error: error.message,
    });
  }
};

/**
 * Start delivery tracking (rider begins journey)
 * POST /api/rider/delivery/:deliveryId/start
 */
const startDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { latitude, longitude } = req.body;
    const riderId = req.rider.userId; // From rider auth middleware

    console.log(
      `🚀 Starting delivery tracking for rider ${riderId}, delivery: ${deliveryId}`
    );

    // Update delivery status to "picked_up" and set initial location
    const updateData = {
      status: "picked_up",
      startedAt: new Date().toISOString(),
      currentLatitude: latitude,
      currentLongitude: longitude,
      updatedAt: new Date().toISOString(),
    };

    const updatedDelivery = await db.updateDocument(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      deliveryId,
      updateData
    );

    console.log("✅ Delivery started successfully");

    // Broadcast delivery start via WebSocket
    if (socketService && socketService.broadcastDeliveryStart) {
      try {
        const startData = {
          deliveryId: deliveryId,
          riderId: riderId,
          status: "picked_up",
          startedAt: updateData.startedAt,
          currentLocation: {
            latitude: latitude,
            longitude: longitude,
          },
          customerName: updatedDelivery.customerName,
          riderName: req.rider.name,
        };

        socketService.broadcastDeliveryStart(deliveryId, startData);
        console.log("📡 Delivery start broadcasted to customer");
      } catch (socketError) {
        console.log(
          "❌ Failed to broadcast delivery start:",
          socketError.message
        );
      }
    }

    res.json({
      success: true,
      message: "Delivery tracking started",
      data: {
        deliveryId: deliveryId,
        riderId: riderId,
        status: "picked_up",
        startedAt: updateData.startedAt,
        currentLatitude: latitude,
        currentLongitude: longitude,
        pickupAddress: updatedDelivery.pickupAddress,
        deliveryAddress: updatedDelivery.deliveryAddress,
        customerName: updatedDelivery.customerName,
        customerPhone: updatedDelivery.customerPhone,
      },
    });
  } catch (error) {
    console.error("Error starting delivery:", error);

    if (error.code === 404) {
      return res.status(404).json({
        success: false,
        message: "Delivery record not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to start delivery",
      error: error.message,
    });
  }
};

/**
 * Complete delivery (rider marks as delivered)
 * POST /api/rider/delivery/:deliveryId/complete
 */
const completeDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { latitude, longitude, notes } = req.body;
    const riderId = req.rider.userId; // From rider auth middleware

    console.log(
      `✅ Completing delivery for rider ${riderId}, delivery: ${deliveryId}`
    );

    // Update delivery status to "delivered"
    const updateData = {
      status: "delivered",
      completedAt: new Date().toISOString(),
      completionLatitude: latitude,
      completionLongitude: longitude,
      deliveryNotes: notes,
      paymentStatus: "completed", // Mark payment as completed for Cash on Delivery
      updatedAt: new Date().toISOString(),
    };

    const updatedDelivery = await db.updateDocument(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      deliveryId,
      updateData
    );

    console.log("✅ Delivery completed successfully");

    // Broadcast delivery completion via WebSocket
    if (socketService && socketService.broadcastDeliveryComplete) {
      try {
        const completionData = {
          deliveryId: deliveryId,
          riderId: riderId,
          status: "delivered",
          completedAt: updateData.completedAt,
          completionLocation: {
            latitude: latitude,
            longitude: longitude,
          },
          notes: notes,
          customerName: updatedDelivery.customerName,
          riderName: req.rider.name,
        };

        socketService.broadcastDeliveryComplete(deliveryId, completionData);
        console.log("📡 Delivery completion broadcasted to customer");
      } catch (socketError) {
        console.log(
          "❌ Failed to broadcast delivery completion:",
          socketError.message
        );
      }
    }

    res.json({
      success: true,
      message: "Delivery completed successfully",
      data: {
        deliveryId: deliveryId,
        riderId: riderId,
        status: "delivered",
        completedAt: updateData.completedAt,
        completionLatitude: latitude,
        completionLongitude: longitude,
        notes: notes,
        deliveryFee: updatedDelivery.deliveryFee,
        totalEarnings:
          updatedDelivery.riderEarnings || updatedDelivery.deliveryFee,
      },
    });
  } catch (error) {
    console.error("Error completing delivery:", error);

    if (error.code === 404) {
      return res.status(404).json({
        success: false,
        message: "Delivery record not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to complete delivery",
      error: error.message,
    });
  }
};

module.exports = {
  updateRiderLocation,
  startDelivery,
  completeDelivery,
};
