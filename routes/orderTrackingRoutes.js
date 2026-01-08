const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const {
  getOrderStatus,
  updateLiveLocation,
  getLiveLocation,
  getUserOrders,
} = require("../controllers/UserControllers/orderTrackingController");

/**
 * Order Tracking Routes
 *
 * These routes handle order status tracking and real-time updates
 * for the frontend tracking system.
 */

/**
 * GET /api/orders/tracking
 * Get all orders for the authenticated user
 * Query params:
 * - status: Filter by order status (optional)
 * - limit: Number of orders to return (default: 10)
 * - offset: Number of orders to skip (default: 0)
 */
router.get("/tracking", authenticateToken, getUserOrders);

/**
 * GET /api/orders/tracking/:orderId
 * Get detailed order status and tracking information
 *
 * This replaces the frontend's direct database call:
 * databases.getDocument(Config.databaseId, Config.orderCollectionId, orderId)
 */
router.get("/tracking/:orderId", authenticateToken, getOrderStatus);

/**
 * GET /api/orders/tracking/:orderId/location
 * Get current live location and delivery information
 * Returns: currentLatitude, currentLongitude, deliveryStatus, addresses, etc.
 */
router.get("/tracking/:orderId/location", authenticateToken, getLiveLocation);

/**
 * PATCH /api/orders/tracking/:orderId/location
 * Update order location (for testing/simulation purposes)
 * Body: { latitude, longitude, status }
 */
router.patch(
  "/tracking/:orderId/location",
  authenticateToken,
  updateLiveLocation
);

// Optional: Public route for order tracking (without authentication)
// Useful if customers want to check order status without logging in
/**
 * GET /api/orders/public-tracking/:orderId/:trackingCode
 * Public order tracking (no authentication required)
 * Requires a tracking code for security
 */
router.get("/public-tracking/:orderId/:trackingCode", async (req, res) => {
  try {
    const { orderId, trackingCode } = req.params;

    // This would need to be implemented with proper tracking code validation
    // For now, we'll just return a basic response
    res.status(501).json({
      success: false,
      message:
        "Public tracking not yet implemented. Please use the authenticated endpoint.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
