// routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../../middleware/authMiddleware");
const {
  getSalesAnalytics,
  exportAnalyticsData,
} = require("../../controllers/VendorControllers/VendorsanalyticsController");

router.use(authenticateToken);

router.get("/analytics", getSalesAnalytics);
router.get("/analytics/export", exportAnalyticsData);

module.exports = router;
