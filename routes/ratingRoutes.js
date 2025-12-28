const express = require("express");
const router = express.Router();

const {
  submitRating,
  getRiderRatings,
  getDeliveryRating,
  canRateDelivery,
  getRatingReminder,
} = require("../controllers/RatingController/ratingController");

// Middleware (add your auth middleware as needed)
// const { verifyCustomer } = require('../middleware/auth');

/**
 * Rating Routes
 */

// Submit rating for delivery/rider
router.post("/submit", submitRating);

// Check if delivery can be rated
router.get("/can-rate/:deliveryId", canRateDelivery);

// Get specific delivery rating
router.get("/delivery/:deliveryId", getDeliveryRating);

// Get all ratings for a rider
router.get("/rider/:riderId", getRiderRatings);

// Get rating reminder data (for emails/notifications)
router.get("/reminder/:deliveryId", getRatingReminder);

module.exports = router;
