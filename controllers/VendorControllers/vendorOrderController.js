// controllers/vendorOrderController.js
const { Query } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");

// Get vendor's orders
const getvendorOrders = async (req, res) => {
  try {
    const vendorId = req.user.userId;

    // 1. Get vendor's products
    const vendorProducts = await db.listDocuments(
      env.VENDOR_DATABASE_ID,
      env.VENDOR_PRODUCTS_COLLECTION_ID,
      [Query.equal("vendorId", vendorId)]
    );

    const vendorProductIds = vendorProducts.documents.map(
      (product) => product.$id
    );

    // 2. Get all orders
    const allOrders = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [Query.orderDesc("$createdAt"), Query.limit(100)]
    );

    // 3. Filter orders that contain vendor's products
    const vendorOrders = [];

    for (const order of allOrders.documents) {
      try {
        const items = JSON.parse(order.items || "[]");
        const vendorItems = items.filter((item) =>
          vendorProductIds.includes(item.productId)
        );

        if (vendorItems.length > 0) {
          // Calculate vendor's revenue from this order
          const vendorAmount = vendorItems.reduce(
            (sum, item) => sum + item.price * (item.quantity || 1),
            0
          );

          vendorOrders.push({
            orderId: order.orderId || order.$id,
            customerEmail: order.customerEmail,
            username: order.username,
            createdAt: order.createdAt,
            amount: vendorAmount,
            totalAmount: order.amount,
            items: order.items,
            status: order.status || "pending",
            paymentStatus: order.paymentStatus || "pending",
            paymentMethod: order.paymentMethod || "COD",
            sessionId: order.sessionId,
            stockUpdated: order.stockUpdated,
            stockConfirmed: order.stockConfirmed,
          });
        }
      } catch (error) {
        console.error("Error processing order:", error);
      }
    }

    res.json({
      success: true,
      data: {
        orders: vendorOrders,
        total: vendorOrders.length,
        stats: {
          total: vendorOrders.length,
          pending: vendorOrders.filter((o) => o.status === "pending").length,
          processing: vendorOrders.filter((o) => o.status === "processing")
            .length,
          shipped: vendorOrders.filter((o) => o.status === "shipped").length,
          completed: vendorOrders.filter((o) => o.status === "completed")
            .length,
          cancelled: vendorOrders.filter((o) => o.status === "cancelled")
            .length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
    });
  }
};

// Update order status
const updateorderstatus = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }

    // Validate vendor has access to this order
    const vendorProducts = await db.listDocuments(
      env.VENDOR_DATABASE_ID,
      env.VENDOR_PRODUCTS_COLLECTION_ID,
      [Query.equal("vendorId", vendorId)]
    );

    const vendorProductIds = vendorProducts.documents.map(
      (product) => product.$id
    );

    // Get the order
    let order;
    try {
      // Try to find by orderId field
      const orders = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        [Query.equal("orderId", orderId)]
      );

      if (orders.documents.length > 0) {
        order = orders.documents[0];
      } else {
        // Fallback: try by document ID
        order = await db.getDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ORDERS_COLLECTION,
          orderId
        );
      }
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check if order contains vendor's products
    try {
      const items = JSON.parse(order.items || "[]");
      const hasVendorProducts = items.some((item) =>
        vendorProductIds.includes(item.productId)
      );

      if (!hasVendorProducts) {
        return res.status(403).json({
          success: false,
          error: "You don't have permission to update this order",
        });
      }
    } catch (error) {
      console.error("Error checking order items:", error);
    }

    // Update order status
    const updatedOrder = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      order.$id,
      {
        status: status,
        updatedAt: new Date().toISOString(),
      }
    );

    // Create notification
    try {
      await createNotification({
        message: `Order ${order.orderId || orderId} status updated to ${status} by vendor`,
        type: "order_status_updated",
        username: "Vendor",
        userId: vendorId,
        email: order.customerEmail,
        metadata: JSON.stringify({
          orderId: order.orderId || orderId,
          oldStatus: order.status,
          newStatus: status,
          updatedBy: "vendor",
        }),
      });
    } catch (notificationError) {
      console.error("Notification error:", notificationError);
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: {
        orderId: order.orderId || orderId,
        status: status,
      },
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update order status",
    });
  }
};

module.exports = {
  getvendorOrders,
  updateorderstatus,
};
