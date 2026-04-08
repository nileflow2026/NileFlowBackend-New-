// routes/admin/vendorPayoutRoutes.js
const express = require("express");
const CommissionController = require("../../controllers/AdminControllers/commissionController");
const {
  preventDoublePayout,
  acquireLock,
  releaseLock,
  rateLimitFinancialOperations,
  validateFinancialData
} = require("../../middleware/payoutSafetyMiddleware");
const { verifyAdminAuth } = require("../../middleware/auth.middleware");

const router = express.Router();

/**
 * Vendor Payout Routes
 * 
 * All routes require admin authentication and are protected by safety middleware.
 * These routes provide complete vendor payout management for the finance team.
 * 
 * Route Security Stack:
 * 1. Admin authentication verification
 * 2. Rate limiting for sensitive operations
 * 3. Financial data validation
 * 4. Double payout prevention
 * 5. Distributed locking for critical operations
 * 6. Comprehensive audit logging
 */

// ===================================================================
// RECONCILIATION & REPORTING ENDPOINTS
// ===================================================================

/**
 * GET /api/admin/finance/vendor-payouts
 * Main CFO reconciliation endpoint - get complete financial picture
 * 
 * Query Parameters:
 * - period: YYYY-MM, "current", "last-month" (optional)
 * - vendor_id: specific vendor (optional)
 * - include_details: "true" to include order details (optional)
 */
router.get(
  "/vendor-payouts",
  verifyAdminAuth,
  rateLimitFinancialOperations,
  CommissionController.getVendorPayoutReconciliation
);

/**
 * GET /api/admin/finance/vendor-payouts/audit/:entity_id
 * Get complete audit trail for any payout entity (batch/payout/order)
 * 
 * Path Parameters:
 * - entity_id: batch_id, payout_id, or order_id
 * 
 * Query Parameters:
 * - limit: max entries to return (default: 100)
 */
router.get(
  "/vendor-payouts/audit/:entity_id",
  verifyAdminAuth,
  CommissionController.getPayoutAuditTrail
);

// ===================================================================
// PAYOUT CALCULATION ENDPOINTS
// ===================================================================

/**
 * POST /api/admin/finance/vendor-payouts/calculate
 * Calculate vendor payout amounts for completed orders (bulk operation)
 * 
 * Body:
 * - order_ids: array of order IDs to calculate payouts for
 * - force_recalculation: boolean (optional, default: false)
 */
router.post(
  "/vendor-payouts/calculate",
  verifyAdminAuth,
  rateLimitFinancialOperations,
  validateFinancialData,
  preventDoublePayout,
  CommissionController.calculateVendorPayouts
);

// ===================================================================
// BATCH MANAGEMENT ENDPOINTS
// ===================================================================

/**
 * POST /api/admin/finance/vendor-payouts/generate-batch
 * Generate payout batch for a vendor from unpaid orders
 * 
 * Body:
 * - vendor_id: vendor to generate batch for (required)
 * - start_date: filter orders from this date (optional)
 * - end_date: filter orders to this date (optional)
 * - max_amount: maximum total payout amount (optional)
 * - description: batch description (optional)
 */
router.post(
  "/vendor-payouts/generate-batch",
  verifyAdminAuth,
  rateLimitFinancialOperations,
  validateFinancialData,
  preventDoublePayout,
  acquireLock,
  CommissionController.generateVendorPayoutBatch,
  releaseLock
);

// ===================================================================
// PAYOUT EXECUTION ENDPOINTS
// ===================================================================

/**
 * POST /api/admin/finance/vendor-payouts/execute-batch
 * Execute payout for a generated batch (initiate external payment)
 * 
 * Body:
 * - batch_id: batch to execute (required)
 * - payment_method: "MPESA" or "BANK" (required)
 * - vendor_payment_details: vendor's payment info (required)
 * - external_reference: transaction reference (optional)
 * - notes: execution notes (optional)
 */
router.post(
  "/vendor-payouts/execute-batch",
  verifyAdminAuth,
  rateLimitFinancialOperations,
  validateFinancialData,
  preventDoublePayout,
  acquireLock,
  CommissionController.executeVendorPayoutBatch,
  releaseLock
);

/**
 * POST /api/admin/finance/vendor-payouts/complete-payout
 * Mark payout as completed after successful external payment
 * 
 * Body:
 * - payout_id: payout to complete (required)
 * - external_reference: final transaction reference (optional)
 * - notes: completion notes (optional)
 */
router.post(
  "/vendor-payouts/complete-payout",
  verifyAdminAuth,
  rateLimitFinancialOperations,
  preventDoublePayout,
  acquireLock,
  CommissionController.completeVendorPayout,
  releaseLock
);

/**
 * POST /api/admin/finance/vendor-payouts/fail-payout
 * Mark payout as failed if external payment fails
 * 
 * Body:
 * - payout_id: payout to fail (required)
 * - failure_reason: reason for failure (required)
 * - retry_possible: whether batch can be retried (optional, default: false)
 */
router.post(
  "/vendor-payouts/fail-payout",
  verifyAdminAuth,
  preventDoublePayout,
  acquireLock,
  CommissionController.failVendorPayout,
  releaseLock
);

// ===================================================================
// HEALTH CHECK ENDPOINTS
// ===================================================================

/**
 * GET /api/admin/finance/vendor-payouts/health
 * System health check for payout infrastructure
 */
router.get("/vendor-payouts/health", verifyAdminAuth, async (req, res) => {
  try {
    const { VendorPayoutService } = require("../../services/vendorPayoutService");
    const { db } = require("../../services/appwriteService");
    const { env } = require("../../src/env");
    
    // Check database connectivity
    const dbHealth = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [{ limit: 1 }]
    );
    
    // Check payout collections exist
    const collections = [
      env.APPWRITE_VENDOR_PAYOUT_BATCHES_COLLECTION_ID,
      env.APPWRITE_VENDOR_PAYOUTS_COLLECTION_ID,
      env.APPWRITE_PAYOUT_AUDIT_LOGS_COLLECTION_ID
    ];
    
    const collectionStatus = {};
    for (const collectionId of collections) {
      try {
        await db.listDocuments(env.APPWRITE_DATABASE_ID, collectionId, [{ limit: 1 }]);
        collectionStatus[collectionId] = "healthy";
      } catch (error) {
        collectionStatus[collectionId] = "error: " + error.message;
      }
    }
    
    // Check for any pending operations
    const pendingBatches = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_VENDOR_PAYOUT_BATCHES_COLLECTION_ID,
      [{ equal: ["status", "PENDING"] }]
    );
    
    const pendingPayouts = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_VENDOR_PAYOUTS_COLLECTION_ID,
      [{ equal: ["status", "PENDING"] }]
    );
    
    res.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {
        database_connectivity: "healthy",
        payout_collections: collectionStatus,
        pending_operations: {
          batches: pendingBatches.total || 0,
          payouts: pendingPayouts.total || 0
        }
      },
      version: "1.0.0"
    });
    
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      success: false,
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;