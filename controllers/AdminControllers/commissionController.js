// controllers/AdminControllers/commissionController.js
const {
  platformSettingsService,
} = require("../../services/platformSettingsService");
const { commissionService } = require("../../services/commissionService");
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const { Query } = require("node-appwrite");
const { logAuditFromRequest } = require("../../utils/auditLogger");

/**
 * Commission Management Controller
 *
 * Provides secure admin endpoints for:
 * 1. Reading current commission rates
 * 2. Updating commission rates (with audit logging)
 * 3. Viewing commission analytics and GMV metrics
 * 4. Managing commission calculations
 *
 * Security: All endpoints require admin authentication
 * Audit: All changes are logged with user ID and reason
 * Financial Integrity: No retroactive changes to historical orders
 */
class CommissionController {
  /**
   * GET /api/admin/commission/settings
   * Get current commission rate and settings
   */
  static async getCommissionSettings(req, res) {
    try {
      // Verify admin authentication
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      // Get current commission rate
      const currentRate = await platformSettingsService.getCommissionRate();

      // Get all commission-related settings
      const allSettings = await platformSettingsService.getCommissionSettings();

      // Get GMV calculation method
      const gmvMethod = await platformSettingsService.getGMVCalculationMethod();

      res.json({
        success: true,
        data: {
          currentCommissionRate: {
            decimal: currentRate,
            percentage: `${(currentRate * 100).toFixed(2)}%`,
            basisPoints: Math.round(currentRate * 10000), // 0.05 = 500 basis points
          },
          gmvCalculationMethod: gmvMethod,
          allSettings: allSettings,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error getting commission settings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve commission settings",
        details: error.message,
      });
    }
  }

  /**
   * PUT /api/admin/commission/rate
   * Update commission rate with validation and audit logging
   */
  static async updateCommissionRate(req, res) {
    try {
      // Verify admin authentication
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      const { commissionRate, reason, effectiveDate } = req.body;
      const adminUserId = req.user.userId || req.user.$id;

      // Input validation
      if (typeof commissionRate !== "number") {
        return res.status(400).json({
          success: false,
          error:
            "Commission rate must be a number (decimal format, e.g., 0.05 for 5%)",
          example: "For 2.5%: use 0.025",
        });
      }

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error:
            "Reason for commission rate change must be at least 10 characters",
          example:
            "Adjusting commission to improve profitability based on Q1 review",
        });
      }

      // Parse effective date if provided
      let effectiveFrom = null;
      if (effectiveDate) {
        effectiveFrom = new Date(effectiveDate);
        if (isNaN(effectiveFrom.getTime())) {
          return res.status(400).json({
            success: false,
            error:
              "Invalid effective date format. Use ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)",
          });
        }
      }

      // Update commission rate through platform settings service
      const updateResult = await platformSettingsService.updateCommissionRate(
        commissionRate,
        adminUserId,
        reason.trim(),
        effectiveFrom,
      );

      if (!updateResult.success) {
        return res.status(400).json({
          success: false,
          error: updateResult.message,
          currentRate: updateResult.currentRate,
          requestedRate: updateResult.requestedRate,
        });
      }

      // Log audit event
      await logAuditFromRequest(
        req,
        "Commission rate updated",
        "PlatformSettings",
        updateResult.changeId,
        {
          previousRate: updateResult.previousRate,
          newRate: updateResult.newRate,
          reason: reason.trim(),
          effectiveFrom: updateResult.effectiveFrom,
        },
      );

      console.log(
        `📊 Commission rate updated by admin ${adminUserId}: ${(updateResult.previousRate * 100).toFixed(2)}% → ${(updateResult.newRate * 100).toFixed(2)}%`,
      );

      res.json({
        success: true,
        message: updateResult.message,
        data: {
          changeId: updateResult.changeId,
          previousRate: {
            decimal: updateResult.previousRate,
            percentage: `${(updateResult.previousRate * 100).toFixed(2)}%`,
          },
          newRate: {
            decimal: updateResult.newRate,
            percentage: `${(updateResult.newRate * 100).toFixed(2)}%`,
          },
          effectiveFrom: updateResult.effectiveFrom,
          updatedBy: updateResult.updatedBy,
          reason: reason.trim(),
          impactNote:
            "This rate will only apply to NEW orders. Historical orders remain unchanged.",
        },
      });
    } catch (error) {
      console.error("Error updating commission rate:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update commission rate",
        details: error.message,
      });
    }
  }

  /**
   * GET /api/admin/commission/analytics
   * Get comprehensive commission and GMV analytics
   */
  static async getCommissionAnalytics(req, res) {
    try {
      // Verify admin authentication
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      const {
        startDate,
        endDate,
        vendorId,
        period = "30d", // Default to last 30 days
      } = req.query;

      // Calculate date range based on period if no explicit dates provided
      let start = startDate;
      let end = endDate || new Date().toISOString();

      if (!start) {
        const now = new Date();
        const daysBack =
          {
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "1y": 365,
          }[period] || 30;

        start = new Date(
          now.getTime() - daysBack * 24 * 60 * 60 * 1000,
        ).toISOString();
      }

      // Get commission analytics
      const commissionData = await commissionService.getCommissionAnalytics({
        startDate: start,
        endDate: end,
        vendorId,
      });

      // Get GMV data
      const gmvData = await this.getGMVAnalytics(start, end, vendorId);

      // Get commission rate history for the period
      const rateHistory = await this.getCommissionRateHistory(start, end);

      res.json({
        success: true,
        data: {
          period: {
            startDate: start,
            endDate: end,
            days: Math.ceil(
              (new Date(end) - new Date(start)) / (24 * 60 * 60 * 1000),
            ),
          },
          commission: commissionData.metrics,
          gmv: gmvData,
          rateHistory: rateHistory,
          vendor: vendorId ? { id: vendorId } : { scope: "All vendors" },
          generatedAt: new Date().toISOString(),
          currency: "KES", // or get from platform settings
        },
      });
    } catch (error) {
      console.error("Error getting commission analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve commission analytics",
        details: error.message,
      });
    }
  }

  /**
   * POST /api/admin/commission/calculate-batch
   * Batch calculate commission for multiple orders (backfill/correction)
   */
  static async batchCalculateCommissions(req, res) {
    try {
      // Verify admin authentication
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      const { orderIds, options = {} } = req.body;
      const adminUserId = req.user.userId || req.user.$id;

      // Input validation
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: "orderIds must be a non-empty array",
          example: ["order_123", "order_456"],
        });
      }

      if (orderIds.length > 100) {
        return res.status(400).json({
          success: false,
          error: "Batch size cannot exceed 100 orders",
          provided: orderIds.length,
        });
      }

      // Log batch commission calculation start
      await logAuditFromRequest(
        req,
        "Batch commission calculation started",
        "Orders",
        "batch_calc",
        {
          orderCount: orderIds.length,
          options: options,
        },
      );

      console.log(
        `📊 Starting batch commission calculation for ${orderIds.length} orders by admin ${adminUserId}`,
      );

      // Process batch calculation
      const batchResult = await commissionService.batchCalculateCommissions(
        orderIds,
        {
          ...options,
          batchDelay: options.batchDelay || 100, // Small delay between calculations
        },
      );

      // Log batch completion
      await logAuditFromRequest(
        req,
        "Batch commission calculation completed",
        "Orders",
        "batch_calc",
        {
          ...batchResult,
          processedBy: adminUserId,
        },
      );

      res.json({
        success: true,
        message: `Batch commission calculation completed`,
        data: {
          results: batchResult,
          processedBy: adminUserId,
          processedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error in batch commission calculation:", error);
      res.status(500).json({
        success: false,
        error: "Batch commission calculation failed",
        details: error.message,
      });
    }
  }

  /**
   * GET /api/admin/commission/order/:orderId
   * Get commission details for a specific order
   */
  static async getOrderCommissionDetails(req, res) {
    try {
      // Verify admin authentication
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: "Order ID is required",
        });
      }

      // Get order details
      const order = await commissionService.getOrderById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found",
        });
      }

      // Check commission calculation eligibility
      const eligibility = commissionService.checkCommissionEligibility(order);

      res.json({
        success: true,
        data: {
          orderId: order.$id,
          orderAmount: parseFloat(order.amount),
          currency: order.currency,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt || order.$createdAt,
          commission: {
            earned: order.commission_earned || 0,
            rateUsed: order.commission_rate_used || 0,
            ratePercentage: order.commission_rate_used
              ? `${(order.commission_rate_used * 100).toFixed(2)}%`
              : "0%",
            calculatedAt: order.commission_calculated_at,
            financialStatus: order.financial_status || "pending",
          },
          gmv: {
            eligible: order.gmv_eligible !== false,
            transactionAmount:
              order.transaction_amount || parseFloat(order.amount),
          },
          vendor: {
            id: order.vendor_id,
            isMultiVendor: false, // You can enhance this based on your item structure
          },
          eligibility: eligibility,
          auditTrail: {
            lastUpdated: order.updatedAt || order.$updatedAt,
            commissionErrors: order.commission_error || null,
          },
        },
      });
    } catch (error) {
      console.error("Error getting order commission details:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve order commission details",
        details: error.message,
      });
    }
  }

  /**
   * Helper: Get GMV analytics for a date range
   */
  static async getGMVAnalytics(startDate, endDate, vendorId = null) {
    try {
      const queries = [
        Query.equal("gmv_eligible", true),
        Query.greaterThan("transaction_amount", 0),
      ];

      if (startDate) {
        queries.push(Query.greaterThanEqual("$createdAt", startDate));
      }

      if (endDate) {
        queries.push(Query.lessThanEqual("$createdAt", endDate));
      }

      if (vendorId) {
        queries.push(Query.equal("vendor_id", vendorId));
      }

      const orders = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        queries,
      );

      const totalGMV = orders.documents.reduce(
        (sum, order) => sum + (parseFloat(order.transaction_amount) || 0),
        0,
      );

      const orderCount = orders.documents.length;
      const averageOrderValue = orderCount > 0 ? totalGMV / orderCount : 0;

      return {
        totalGMV: Math.round(totalGMV * 100) / 100,
        orderCount,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      };
    } catch (error) {
      console.error("Error calculating GMV analytics:", error);
      return {
        totalGMV: 0,
        orderCount: 0,
        averageOrderValue: 0,
        error: error.message,
      };
    }
  }

  /**
   * Helper: Get commission rate history for audit purposes
   */
  static async getCommissionRateHistory(startDate, endDate) {
    try {
      // This would ideally come from audit logs or commission history table
      // For now, return current rate as a placeholder
      const currentRate = await platformSettingsService.getCommissionRate();

      return [
        {
          date: startDate,
          rate: currentRate,
          percentage: `${(currentRate * 100).toFixed(2)}%`,
          note: "Rate history tracking requires audit log integration",
        },
      ];
    } catch (error) {
      console.error("Error getting commission rate history:", error);
      return [];
    }
  }
}

module.exports = CommissionController;
