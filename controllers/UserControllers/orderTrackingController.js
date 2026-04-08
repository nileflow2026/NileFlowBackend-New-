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
 * Get Order Status and Details
 * GET /api/orders/tracking/:orderId
 */
const getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;


    console.log("Fetching order status for:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    let order;

    try {
      // First try to get by document ID
      order = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDER_COLLECTION || env.APPWRITE_ORDER_COLLECTION_ID,
        orderId
      );
    } catch (error) {
      // If that fails, try to find by orderId field
      try {
        const orderQuery = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ORDER_COLLECTION || env.APPWRITE_ORDER_COLLECTION_ID,
          [Query.equal("orderId", orderId), Query.limit(1)]
        );

        if (orderQuery.documents.length > 0) {
          order = orderQuery.documents[0];
        }
      } catch (queryError) {
        console.error("Error querying by orderId field:", queryError);
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }



    // Prepare response data
    const responseData = {
      success: true,
      data: {
        orderId: order.orderId || order.$id,
        orderStatus: order.orderStatus || order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        amount: order.amount,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        createdAt: order.createdAt || order.$createdAt,
        updatedAt: order.updatedAt || order.$updatedAt,
        customerName: order.customerName || order.username,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        items: order.items ? JSON.parse(order.items) : [],
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery,
        deliveryInstructions: order.deliveryInstructions,
        riderId: order.riderId,
        riderName: order.riderName,
        riderPhone: order.riderPhone,
        // Premium features
        isPremiumOrder: order.isPremiumOrder || false,
        premiumDiscountAmount: order.premiumDiscountAmount || 0,
        deliverySavings: order.deliverySavings || 0,
        milesBonus: order.milesBonus || 0,
      },
    };

    // If order has a rider, get rider details
    let riderDetails = null;
    
    // First check if riderId exists directly on the order
    if (order.riderId) {
      try {
        riderDetails = await db.getDocument(
          env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
          env.RIDER_COLLECTION_ID || "riders",
          order.riderId
        );
        console.log("Found rider details from order.riderId:", riderDetails.name);
      } catch (riderError) {
        console.log("Could not fetch rider details from order.riderId:", riderError.message);
      }
    }
    
    // If no rider found on order, check delivery record for assigned rider
    if (!riderDetails) {
      try {
        console.log("Checking delivery record for rider assignment...");
        const delivery = await db.getDocument(
          env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
          env.DELIVERIES_COLLECTION_ID,
          orderId // Using orderId as delivery ID since they're the same
        );
        
        if (delivery.riderId) {
          console.log("Found riderId in delivery record:", delivery.riderId);
          riderDetails = await db.getDocument(
            env.RIDER_DATABASE_ID,
            env.RIDER_COLLECTION_ID,
            delivery.riderId
          );
          console.log("Fetched rider details from delivery record:", riderDetails.name);
          
          // Also add delivery-specific information to the response
          responseData.data.deliveryStatus = delivery.status;
          responseData.data.assignedAt = delivery.assignedAt;
          responseData.data.pickupAddress = delivery.pickupAddress;
          responseData.data.deliveryAddress = delivery.deliveryAddress;
        }
      } catch (deliveryError) {
        console.log("Could not fetch delivery record or rider details:", deliveryError.message);
      }
    }

    // Add rider details to response if found
    if (riderDetails) {
      responseData.data.riderDetails = {
        name: riderDetails.name || riderDetails.fullName,
        phone: riderDetails.phone,
        avatar: riderDetails.avatar,
        rating: riderDetails.rating,
        status: riderDetails.status,
      };
    }

    console.log(
      "Order status fetched successfully:",
      order.orderStatus || order.status
    );
    res.json(responseData);
  } catch (error) {
    console.error("Error fetching order status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Update Live Location (for simulation purposes)
 * PATCH /api/orders/tracking/:orderId/location
 */
const updateLiveLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude, status } = req.body;

    console.log("Updating location for order:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Update location data in delivery record
    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (latitude && longitude) {
      updateData.currentLatitude = latitude;
      updateData.currentLongitude = longitude;
    }

    if (status) {
      updateData.status = status;
    }

    // Update the delivery record with location data
    const updatedDelivery = await db.updateDocument(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      orderId,
      updateData
    );

    console.log("✅ Delivery location updated successfully");

    // Broadcast location update via WebSocket for real-time tracking
    if (socketService && socketService.broadcastLocationUpdate) {
      try {
        const locationData = {
          orderId: orderId,
          latitude: updatedDelivery.currentLatitude,
          longitude: updatedDelivery.currentLongitude,
          status: updatedDelivery.status,
          timestamp: new Date().toISOString(),
          pickupAddress: updatedDelivery.pickupAddress,
          deliveryAddress: updatedDelivery.deliveryAddress,
        };
        
        socketService.broadcastLocationUpdate(orderId, locationData);
        console.log("📡 Location update broadcasted via WebSocket");
      } catch (socketError) {
        console.log("❌ Failed to broadcast via WebSocket:", socketError.message);
      }
    }

    res.json({
      success: true,
      message: "Location updated successfully",
      data: {
        orderId: orderId,
        deliveryStatus: updatedDelivery.status,
        currentLatitude: updatedDelivery.currentLatitude,
        currentLongitude: updatedDelivery.currentLongitude,
        updatedAt: updatedDelivery.updatedAt,
        pickupAddress: updatedDelivery.pickupAddress,
        deliveryAddress: updatedDelivery.deliveryAddress,
      },
    });
  } catch (error) {
    console.error("Error updating location:", error);
    
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
 * Get Multiple Orders for User
 * GET /api/orders/tracking
 */
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { status, limit = 10, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const queries = [
      Query.equal("userId", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(parseInt(limit)),
      Query.offset(parseInt(offset)),
    ];

    // Add status filter if provided
    if (status) {
      queries.push(Query.equal("orderStatus", status));
    }

    const orders = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION || env.APPWRITE_ORDERS_COLLECTION_ID,
      queries
    );

    const processedOrders = orders.documents.map((order) => ({
      orderId: order.orderId || order.$id,
      orderStatus: order.orderStatus || order.status,
      paymentStatus: order.paymentStatus,
      amount: order.amount,
      createdAt: order.createdAt || order.$createdAt,
      updatedAt: order.updatedAt || order.$updatedAt,
      itemsCount: order.items ? JSON.parse(order.items).length : 0,
      isPremiumOrder: order.isPremiumOrder || false,
      trackingNumber: order.trackingNumber,
    }));

    res.json({
      success: true,
      data: {
        orders: processedOrders,
        total: orders.total,
        hasMore: orders.total > parseInt(offset) + parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

/**
 * Get Live Location and Delivery Info
 * GET /api/orders/tracking/:orderId/location
 */
const getLiveLocation = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("Fetching live location for order:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Fetch delivery record for live location data
    try {
      const delivery = await db.getDocument(
        env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
        env.DELIVERIES_COLLECTION_ID,
        orderId
      );

      // Return live location and delivery information
      res.json({
        success: true,
        data: {
          orderId: orderId,
          deliveryStatus: delivery.status,
          currentLatitude: delivery.currentLatitude,
          currentLongitude: delivery.currentLongitude,
          pickupAddress: delivery.pickupAddress,
          deliveryAddress: delivery.deliveryAddress,
          riderId: delivery.riderId,
          customerName: delivery.customerName,
          customerPhone: delivery.customerPhone,
          assignedAt: delivery.assignedAt,
          updatedAt: delivery.updatedAt,
          estimatedDelivery: delivery.estimatedDelivery,
        },
      });
    } catch (deliveryError) {
      // If no delivery record found, return basic info without live location
      console.log("No delivery record found, order may not be assigned yet");
      
      return res.json({
        success: true,
        data: {
          orderId: orderId,
          deliveryStatus: "not_assigned",
          currentLatitude: null,
          currentLongitude: null,
          pickupAddress: null,
          deliveryAddress: null,
          riderId: null,
          message: "Order not yet assigned to a rider",
        },
      });
    }
  } catch (error) {
    console.error("Error fetching live location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch live location",
      error: error.message,
    });
  }
};

module.exports = {
  getOrderStatus,
  updateLiveLocation,
  getLiveLocation,
  getUserOrders,
};
