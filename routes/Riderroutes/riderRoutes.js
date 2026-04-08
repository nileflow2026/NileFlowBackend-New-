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
  getAllDeliveries,
  getRiderEarnings,
  updateDeliveryStatus,
  getRiders,
  assignDeliveryToRider,
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
 * Debug: Get All Deliveries
 */
router.get("/debug/all-deliveries", getAllDeliveries);

/**
 * Get Rider Earnings
 */
router.get("/earnings", riderAuthMiddleware, getRiderEarnings);

router.get("/riders", getRiders);

/**
 * Update Delivery Status
 */
router.patch(
  "/deliveries/:deliveryId/status",
  riderAuthMiddleware,
  updateDeliveryStatus
);

module.exports = router;
