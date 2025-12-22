const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const { ID } = require("node-appwrite");
const { createNotification } = require("./Clientnotification");
const {
  sendCancellationRequestEmail,
} = require("../../services/send-confirmation");

/**
 * Handle order cancellation request from customer
 * POST /api/orders/cancel-request
 */
const handleCancelRequest = async (req, res) => {
  try {
    const {
      orderId,
      reason,
      additionalDetails,
      userId,
      customerEmail,
      customerName,
    } = req.body;

    console.log("=== ORDER CANCELLATION REQUEST ===");
    console.log("Request Body:", JSON.stringify(req.body, null, 2));

    // Validate input
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get order from database
    let order;
    try {
      order = await db.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        orderId
      );
    } catch (error) {
      console.error("Order not found:", error);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order belongs to user
    if (order.users !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to cancel this order",
      });
    }

    // Check if order is eligible for cancellation
    const eligibleStatuses = [
      "pending",
      "processing",
      "ordered",
      "pending payment",
    ];
    const currentStatus = (
      order.orderStatus?.toLowerCase() ||
      order.status?.toLowerCase() ||
      ""
    ).toLowerCase();

    if (!eligibleStatuses.includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${
          order.orderStatus || order.status
        }. Order must be in pending or processing status.`,
      });
    }

    // Check if order is too old (more than 24 hours)
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const hoursSinceOrder = (now - orderDate) / (1000 * 60 * 60);

    if (hoursSinceOrder > 24) {
      // Still allow request but flag for manual review
      console.warn(
        `⚠️ Order ${orderId} is ${hoursSinceOrder.toFixed(
          1
        )} hours old (>24h), flagging for manual review`
      );
    }

    // Create cancellation request document
    const requestId = ID.unique();
    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CANCELLATION_REQUESTS_COLLECTION_ID,
      requestId,
      {
        orderId,
        userId,
        customerEmail: customerEmail || order.customerEmail,
        customerName: customerName || order.username,
        reason,
        additionalDetails: additionalDetails || "",
        status: "pending",
        requestedAt: new Date().toISOString(),
        orderAmount: order.amount,
        orderStatus: order.orderStatus || order.status,
        paymentMethod: order.paymentMethod,
      }
    );

    console.log(`✅ Cancellation request created: ${requestId}`);

    // Send notification to customer
    try {
      await createNotification({
        userId,
        message: `Your cancellation request for order ${orderId} has been received. We'll review it within 24 hours.`,
        type: "order",
        username: customerName || order.username,
        email: customerEmail || order.customerEmail,
      });
      console.log("✅ Customer notification sent");
    } catch (notifError) {
      console.warn("Notification error (non-critical):", notifError.message);
    }

    // Send email to customer
    try {
      await sendCancellationRequestEmail({
        customerEmail: customerEmail || order.customerEmail,
        customerName: customerName || order.username,
        orderId,
        reason,
      });
      console.log("✅ Cancellation request email sent");
    } catch (emailError) {
      console.warn("Email error (non-critical):", emailError.message);
    }

    // TODO: Notify admin team (optional)
    // await notifyAdminTeam('New cancellation request', { orderId, reason });

    return res.status(200).json({
      success: true,
      message:
        "Cancellation request submitted successfully. Our team will review it within 24 hours.",
      requestId,
      reviewTime: "24 hours",
    });
  } catch (error) {
    console.error("❌ Cancel request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit cancellation request",
      error: error.message,
    });
  }
};

module.exports = {
  handleCancelRequest,
};
