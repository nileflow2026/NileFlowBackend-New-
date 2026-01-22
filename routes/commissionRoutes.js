// routes/commissionRoutes.js
const express = require("express");
const CommissionController = require("../controllers/AdminControllers/commissionController");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Commission Management Routes
 *
 * All routes require admin authentication and provide:
 * - Commission rate management
 * - GMV and commission analytics
 * - Batch commission calculations
 * - Individual order commission details
 */

// GET /api/admin/commission/settings - Get current commission settings
router.get(
  "/settings",
  authenticateToken,
  CommissionController.getCommissionSettings,
);

// PUT /api/admin/commission/rate - Update commission rate (with audit logging)
router.put(
  "/rate",
  authenticateToken,
  CommissionController.updateCommissionRate,
);

// GET /api/admin/commission/analytics - Get commission and GMV analytics
router.get(
  "/analytics",
  authenticateToken,
  CommissionController.getCommissionAnalytics,
);

// GET /api/admin/commission/gmv - Get GMV data with daily breakdown
router.get(
  "/gmv",
  authenticateToken,
  CommissionController.getGMVData,
);

// POST /api/admin/commission/calculate-batch - Batch calculate commissions
router.post(
  "/calculate-batch",
  authenticateToken,
  CommissionController.batchCalculateCommissions,
);

// GET /api/admin/commission/order/:orderId - Get commission details for specific order
router.get(
  "/order/:orderId",
  authenticateToken,
  CommissionController.getOrderCommissionDetails,
);

module.exports = router;
