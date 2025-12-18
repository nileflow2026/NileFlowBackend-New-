// routes/riderRoutes.js
const express = require("express");
const router = express.Router();
const riderAuthMiddleware = require("../../middleware/RiderMiddleware/riderAuthMiddleware");

const {
  getCurrentRider,
} = require("../../controllers/RiderControler/riderAuthController");
const {
  updateRiderProfile,
  updateRiderStatus,
  getRiderDeliveries,
  getRiderEarnings,
  updateDeliveryStatus,
} = require("../../controllers/RiderControler/RiderController");

/**
 * Get Rider Profile
 */
router.get("/profile", riderAuthMiddleware, getCurrentRider);

/**
 * Update Rider Profile
 */
router.patch("/profile", riderAuthMiddleware, updateRiderProfile);

/**
 * Update Rider Status (online/offline/busy)
 */
router.patch("/status", riderAuthMiddleware, updateRiderStatus);

/**
 * Get Rider Deliveries
 */
router.get("/deliveries", riderAuthMiddleware, getRiderDeliveries);

/**
 * Get Rider Earnings
 */
router.get("/earnings", riderAuthMiddleware, getRiderEarnings);

/**
 * Update Delivery Status
 */
router.patch(
  "/deliveries/:deliveryId/status",
  riderAuthMiddleware,
  updateDeliveryStatus
);

module.exports = router;
