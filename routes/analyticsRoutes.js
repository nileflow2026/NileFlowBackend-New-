const express = require("express");
const router = express.Router();
const {
  getOverallRatingAnalytics,
  getRiderPerformance,
  getIndividualRiderAnalytics,
  getRatingTrends,
  getCustomerFeedback,
} = require("../controllers/RatingController/analyticsController");

// Middleware (add your auth middleware as needed)
// const { verifyAdmin } = require('../middleware/auth');

/**
 * Rating Analytics Routes
 */

// Overall rating analytics
router.get("/analytics/overall", getOverallRatingAnalytics);

// Rider performance analytics
router.get("/analytics/riders/performance", getRiderPerformance);

// Individual rider analytics
router.get("/analytics/riders/:riderId", getIndividualRiderAnalytics);

// Rating trends over time
router.get("/analytics/trends", getRatingTrends);

// Customer feedback analysis
router.get("/analytics/feedback", getCustomerFeedback);

module.exports = router;
