// routes/riderTrackingRoutes.js
const express = require("express");
const router = express.Router();
const riderAuth = require("../middleware/RiderMiddleware/riderAuthMiddleware");
const {
  updateRiderLocation,
  startDelivery,
  completeDelivery,
} = require("../controllers/riderControllers/riderTrackingController");

// Apply rider authentication middleware to all routes
router.use(riderAuth);

/**
 * @route PATCH /api/rider/delivery/:deliveryId/location
 * @desc Update rider location during delivery
 * @access Private (Rider only)
 */
router.patch("/delivery/:deliveryId/location", updateRiderLocation);

/**
 * @route POST /api/rider/delivery/:deliveryId/start
 * @desc Start delivery tracking (rider begins journey)
 * @access Private (Rider only)
 */
router.post("/delivery/:deliveryId/start", startDelivery);

/**
 * @route POST /api/rider/delivery/:deliveryId/complete
 * @desc Complete delivery (rider marks as delivered)
 * @access Private (Rider only)
 */
router.post("/delivery/:deliveryId/complete", completeDelivery);

module.exports = router;
