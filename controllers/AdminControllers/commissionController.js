// controllers/AdminControllers/commissionController.js
const {
  platformSettingsService,
} = require("../../services/platformSettingsService");
const { commissionService } = require("../../services/commissionService");
const { VendorPayoutService } = require("../../services/vendorPayoutService");
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
 * 5. Vendor payout management and reconciliation
 *
 * Security: All endpoints require admin authentication
 * Audit: All changes are logged with user ID and reason
 * Financial Integrity: No retroactive changes to historical orders
 */
class CommissionController {
  constructor() {
    this.vendorPayoutService = new VendorPayoutService();
  }
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
      const gmvData = await CommissionController.getGMVAnalytics(
        start,
        end,
        vendorId,
      );

      // Get commission rate history for the period
      const rateHistory = await CommissionController.getCommissionRateHistory(
        start,
        end,
      );

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
   * GET /api/admin/commission/gmv
   * Get GMV data with daily breakdown for charts
   */
  static async getGMVData(req, res) {
    try {
      // Verify admin authentication
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      const { timeframe = "30d", vendorId } = req.query;

      // Calculate date range based on timeframe
      const now = new Date();
      const daysBack =
        {
          "7d": 7,
          "30d": 30,
          "90d": 90,
          "1y": 365,
          last7: 7,
          last30: 30,
          last90: 90,
          lastyear: 365,
        }[timeframe] || 30;

      const startDate = new Date(
        now.getTime() - daysBack * 24 * 60 * 60 * 1000,
      ).toISOString();
      const endDate = now.toISOString();

      // Get GMV data with daily breakdown
      const gmvData = await CommissionController.getGMVWithDailyBreakdown(
        startDate,
        endDate,
        vendorId,
      );

      res.json({
        success: true,
        data: gmvData,
        generatedAt: new Date().toISOString(),
        period: {
          startDate,
          endDate,
          days: daysBack,
          timeframe,
        },
      });
    } catch (error) {
      console.error("Error getting GMV data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve GMV data",
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
      };
    }
  }

  /**
   * Helper: Get GMV analytics with daily breakdown for charts
   */
  static async getGMVWithDailyBreakdown(startDate, endDate, vendorId = null) {
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

      // Calculate totals
      const totalGMV = orders.documents.reduce(
        (sum, order) => sum + (parseFloat(order.transaction_amount) || 0),
        0,
      );

      const orderCount = orders.documents.length;
      const averageOrderValue = orderCount > 0 ? totalGMV / orderCount : 0;

      // Group orders by day for daily breakdown
      const dailyGMV = {};

      orders.documents.forEach((order) => {
        const date = new Date(order.$createdAt);
        const dayKey = date.toISOString().split("T")[0]; // YYYY-MM-DD format
        const amount = parseFloat(order.transaction_amount) || 0;

        if (!dailyGMV[dayKey]) {
          dailyGMV[dayKey] = {
            date: dayKey,
            gmv: 0,
            orders: 0,
            day: date.toLocaleDateString("en-US", { weekday: "short" }),
            fullDate: date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          };
        }

        dailyGMV[dayKey].gmv += amount;
        dailyGMV[dayKey].orders += 1;
      });

      // Convert to array and sort by date
      const dailyGMVArray = Object.values(dailyGMV).sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );

      // Round GMV values
      dailyGMVArray.forEach((day) => {
        day.gmv = Math.round(day.gmv * 100) / 100;
      });

      return {
        totalGMV: Math.round(totalGMV * 100) / 100,
        orderCount,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        daily_gmv: dailyGMVArray,
        period: {
          startDate,
          endDate,
          days: Math.ceil(
            (new Date(endDate) - new Date(startDate)) / (24 * 60 * 60 * 1000),
          ),
        },
      };
    } catch (error) {
      console.error(
        "Error calculating GMV analytics with daily breakdown:",
        error,
      );
      return {
        totalGMV: 0,
        orderCount: 0,
        averageOrderValue: 0,
        daily_gmv: [],
        period: { startDate, endDate, days: 0 },
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

  // ===================================================================
  // VENDOR PAYOUT RECONCILIATION ENDPOINTS
  // ===================================================================

  /**
   * GET /api/admin/finance/vendor-payouts
   * Finance dashboard - Get vendor payout reconciliation report
   * 
   * This is the main CFO endpoint for financial reconciliation.
   * Returns complete financial picture for each vendor.
   */
  static async getVendorPayoutReconciliation(req, res) {
    try {
      // Verify admin authentication
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      const {
        period, // Format: YYYY-MM or "current" or "last-month"
        vendor_id,
        include_details = false
      } = req.query;

      console.log(`📊 Admin ${req.user.userId} requesting vendor payout reconciliation for period: ${period}`);

      // Parse period parameter
      let startDate, endDate;
      if (period) {
        if (period === "current") {
          const now = new Date();
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (period === "last-month") {
          const now = new Date();
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (period.match(/^\d{4}-\d{2}$/)) {
          // Format: YYYY-MM
          const [year, month] = period.split("-").map(Number);
          startDate = new Date(year, month - 1, 1);
          endDate = new Date(year, month, 0);
        } else {
          return res.status(400).json({
            success: false,
            error: "Invalid period format. Use YYYY-MM, 'current', or 'last-month'",
            examples: ["2025-01", "current", "last-month"]
          });
        }
      }

      // Get list of active vendors from orders
      const vendorQueries = [Query.equal("status", "COMPLETED")];
      if (startDate && endDate) {
        vendorQueries.push(Query.greaterThanEqual("$createdAt", startDate.toISOString()));
        vendorQueries.push(Query.lessThanEqual("$createdAt", endDate.toISOString()));
      }
      if (vendor_id) {
        vendorQueries.push(Query.equal("vendor_id", vendor_id));
      }

      const ordersResult = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDERS_COLLECTION,
        vendorQueries
      );

      // Get unique vendor IDs
      const vendorIds = [...new Set(ordersResult.documents
        .map(order => order.vendor_id)
        .filter(id => id)
      )];

      if (vendorIds.length === 0) {
        return res.json({
          success: true,
          data: {
            period: {
              start: startDate?.toISOString(),
              end: endDate?.toISOString(),
              display: period
            },
            vendors: [],
            summary: {
              total_vendors: 0,
              total_gmv: 0,
              total_commission: 0,
              total_fees: 0,
              total_payable: 0,
              total_paid_out: 0,
              outstanding_balance: 0
            }
          }
        });
      }

      // Initialize vendor payout service instance
      const vendorPayoutService = new VendorPayoutService();
      const vendorReports = [];
      let totalGMV = 0;
      let totalCommission = 0;
      let totalFees = 0;
      let totalPayable = 0;
      let totalPaidOut = 0;
      let totalOutstanding = 0;

      // Get reconciliation data for each vendor
      for (const vendorId of vendorIds) {
        try {
          const summary = await vendorPayoutService.getVendorPayoutSummary(vendorId, {
            startDate,
            endDate
          });

          if (summary.success) {
            const vendorData = {
              vendor_id: vendorId,
              vendor_name: `Vendor ${vendorId}`, // Could be enhanced with vendor service lookup
              ...summary.summary
            };

            // Add detailed order breakdown if requested
            if (include_details === "true") {
              const unpaidOrders = await vendorPayoutService.getUnpaidOrdersForVendor(vendorId, {
                startDate,
                endDate
              });
              vendorData.unpaid_orders = unpaidOrders.map(order => ({
                order_id: order.$id,
                amount: parseFloat(order.amount || 0),
                vendor_payout: parseFloat(order.vendor_payout || 0),
                created_at: order.$createdAt,
                commission_earned: parseFloat(order.commission_earned || 0)
              }));
            }

            vendorReports.push(vendorData);

            // Add to totals
            totalGMV += vendorData.total_gmv;
            totalCommission += vendorData.total_commission;
            totalFees += vendorData.total_transaction_fees;
            totalPayable += vendorData.total_vendor_payout;
            totalPaidOut += vendorData.total_paid_out;
            totalOutstanding += vendorData.outstanding_balance;
          }
        } catch (error) {
          console.error(`Error getting summary for vendor ${vendorId}:`, error);
          // Continue with other vendors
        }
      }

      // Sort vendors by outstanding balance (highest first)
      vendorReports.sort((a, b) => b.outstanding_balance - a.outstanding_balance);

      // Log successful reconciliation request
      await logAuditFromRequest(
        req,
        "Vendor payout reconciliation accessed",
        "VendorPayouts",
        "reconciliation_report",
        {
          period: period,
          vendor_count: vendorReports.length,
          total_outstanding: totalOutstanding
        }
      );

      res.json({
        success: true,
        data: {
          period: {
            start: startDate?.toISOString(),
            end: endDate?.toISOString(),
            display: period || "all-time"
          },
          vendors: vendorReports,
          summary: {
            total_vendors: vendorReports.length,
            total_gmv: Math.round(totalGMV * 100) / 100,
            total_commission: Math.round(totalCommission * 100) / 100,
            total_fees: Math.round(totalFees * 100) / 100,
            total_payable: Math.round(totalPayable * 100) / 100,
            total_paid_out: Math.round(totalPaidOut * 100) / 100,
            outstanding_balance: Math.round(totalOutstanding * 100) / 100
          },
          generated_at: new Date().toISOString(),
          currency: "KES"
        }
      });

    } catch (error) {
      console.error("Error generating vendor payout reconciliation:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate reconciliation report",
        details: error.message
      });
    }
  }

  /**
   * POST /api/admin/finance/vendor-payouts/calculate
   * Calculate vendor payouts for completed orders (bulk operation)
   */
  static async calculateVendorPayouts(req, res) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      const { order_ids, vendor_id, force_recalculation = false } = req.body;
      const adminUserId = req.user.userId || req.user.$id;

      // Validate input
      if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: "order_ids must be a non-empty array"
        });
      }

      if (order_ids.length > 100) {
        return res.status(400).json({
          success: false,
          error: "Cannot process more than 100 orders at once"
        });
      }

      console.log(`💰 Admin ${adminUserId} calculating vendor payouts for ${order_ids.length} orders`);

      const vendorPayoutService = new VendorPayoutService();
      const results = [];
      let successful = 0;
      let failed = 0;
      let alreadyCalculated = 0;

      // Process each order
      for (const orderId of order_ids) {
        try {
          const result = await vendorPayoutService.calculateOrderVendorPayout(orderId);
          
          if (result.success) {
            if (result.already_calculated && !force_recalculation) {
              alreadyCalculated++;
            } else {
              successful++;
            }
            results.push({
              order_id: orderId,
              status: "success",
              vendor_payout: result.vendor_payout,
              vendor_id: result.vendor_id
            });
          } else {
            failed++;
            results.push({
              order_id: orderId,
              status: "failed",
              error: result.error
            });
          }
        } catch (error) {
          failed++;
          results.push({
            order_id: orderId,
            status: "failed",
            error: error.message
          });
        }
      }

      // Log batch calculation
      await logAuditFromRequest(
        req,
        "Vendor payout calculation batch",
        "VendorPayouts",
        "batch_calculation",
        {
          order_count: order_ids.length,
          successful,
          failed,
          already_calculated: alreadyCalculated
        }
      );

      res.json({
        success: true,
        message: `Processed ${order_ids.length} orders`,
        data: {
          total_orders: order_ids.length,
          successful,
          failed,
          already_calculated: alreadyCalculated,
          results: results.slice(0, 20), // Limit response size
          processed_by: adminUserId,
          processed_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Error calculating vendor payouts:", error);
      res.status(500).json({
        success: false,
        error: "Failed to calculate vendor payouts",
        details: error.message
      });
    }
  }

  /**
   * POST /api/admin/finance/vendor-payouts/generate-batch
   * Generate payout batch for a vendor
   */
  static async generateVendorPayoutBatch(req, res) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      const {
        vendor_id,
        start_date,
        end_date,
        max_amount,
        description = "Admin-generated payout batch"
      } = req.body;
      const adminUserId = req.user.userId || req.user.$id;

      if (!vendor_id) {
        return res.status(400).json({
          success: false,
          error: "vendor_id is required"
        });
      }

      console.log(`🎯 Admin ${adminUserId} generating payout batch for vendor ${vendor_id}`);

      const vendorPayoutService = new VendorPayoutService();
      
      const batchResult = await vendorPayoutService.generatePayoutBatch(vendor_id, {
        adminUserId,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
        maxAmount: max_amount,
        description
      });

      if (!batchResult.success) {
        return res.status(400).json({
          success: false,
          error: batchResult.message,
          vendor_id
        });
      }

      // Log batch generation
      await logAuditFromRequest(
        req,
        "Vendor payout batch generated",
        "VendorPayouts",
        batchResult.batch_id,
        {
          vendor_id,
          total_amount: batchResult.total_amount,
          order_count: batchResult.order_count
        }
      );

      res.json({
        success: true,
        message: "Payout batch generated successfully",
        data: {
          batch_id: batchResult.batch_id,
          vendor_id,
          total_amount: batchResult.total_amount,
          order_count: batchResult.order_count,
          orders: batchResult.selected_orders,
          generated_by: adminUserId,
          generated_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Error generating vendor payout batch:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate payout batch",
        details: error.message
      });
    }
  }

  /**
   * POST /api/admin/finance/vendor-payouts/execute-batch
   * Execute payout for a generated batch
   */
  static async executeVendorPayoutBatch(req, res) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      const {
        batch_id,
        payment_method, // "MPESA" or "BANK"
        vendor_payment_details, // Vendor's payment info
        external_reference, // Optional transaction reference
        notes
      } = req.body;
      const adminUserId = req.user.userId || req.user.$id;

      // Validate required fields
      if (!batch_id) {
        return res.status(400).json({
          success: false,
          error: "batch_id is required"
        });
      }

      if (!payment_method || !["MPESA", "BANK"].includes(payment_method)) {
        return res.status(400).json({
          success: false,
          error: "payment_method must be either 'MPESA' or 'BANK'"
        });
      }

      if (!vendor_payment_details) {
        return res.status(400).json({
          success: false,
          error: "vendor_payment_details is required"
        });
      }

      console.log(`💳 Admin ${adminUserId} executing payout batch ${batch_id}`);

      const vendorPayoutService = new VendorPayoutService();
      
      const executionResult = await vendorPayoutService.executePayoutBatch(batch_id, {
        payment_method,
        vendor_payment_details,
        adminUserId,
        external_reference,
        notes
      });

      if (!executionResult.success) {
        return res.status(400).json({
          success: false,
          error: executionResult.message
        });
      }

      // Log payout execution
      await logAuditFromRequest(
        req,
        "Vendor payout executed",
        "VendorPayouts",
        executionResult.payout_id,
        {
          batch_id,
          payment_method,
          amount: executionResult.amount,
          vendor_id: executionResult.vendor_id
        }
      );

      res.json({
        success: true,
        message: "Payout initiated successfully",
        data: {
          payout_id: executionResult.payout_id,
          batch_id,
          vendor_id: executionResult.vendor_id,
          amount: executionResult.amount,
          payment_method,
          status: "PENDING",
          initiated_by: adminUserId,
          initiated_at: executionResult.initiated_at,
          next_steps: [
            "Monitor external payment system for completion",
            "Call complete-payout endpoint once payment is confirmed",
            "Or call fail-payout endpoint if payment fails"
          ]
        }
      });

    } catch (error) {
      console.error("Error executing vendor payout batch:", error);
      res.status(500).json({
        success: false,
        error: "Failed to execute payout batch",
        details: error.message
      });
    }
  }

  /**
   * POST /api/admin/finance/vendor-payouts/complete-payout
   * Mark payout as completed after successful external payment
   */
  static async completeVendorPayout(req, res) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      const {
        payout_id,
        external_reference, // Final transaction reference from payment provider
        notes
      } = req.body;
      const adminUserId = req.user.userId || req.user.$id;

      if (!payout_id) {
        return res.status(400).json({
          success: false,
          error: "payout_id is required"
        });
      }

      console.log(`✅ Admin ${adminUserId} completing payout ${payout_id}`);

      const vendorPayoutService = new VendorPayoutService();
      
      const completionResult = await vendorPayoutService.completePayoutTransaction(payout_id, {
        external_reference,
        adminUserId,
        notes
      });

      if (!completionResult.success) {
        return res.status(400).json({
          success: false,
          error: completionResult.message
        });
      }

      // Log payout completion
      await logAuditFromRequest(
        req,
        "Vendor payout completed",
        "VendorPayouts",
        payout_id,
        {
          batch_id: completionResult.batch_id,
          vendor_id: completionResult.vendor_id,
          amount: completionResult.amount,
          orders_paid: completionResult.orders_paid,
          external_reference
        }
      );

      res.json({
        success: true,
        message: "Payout completed successfully",
        data: {
          payout_id,
          batch_id: completionResult.batch_id,
          vendor_id: completionResult.vendor_id,
          amount: completionResult.amount,
          orders_paid: completionResult.orders_paid,
          completed_by: adminUserId,
          completed_at: completionResult.completed_at,
          external_reference,
          status: "SUCCESS"
        }
      });

    } catch (error) {
      console.error("Error completing vendor payout:", error);
      res.status(500).json({
        success: false,
        error: "Failed to complete payout",
        details: error.message
      });
    }
  }

  /**
   * POST /api/admin/finance/vendor-payouts/fail-payout
   * Mark payout as failed if external payment fails
   */
  static async failVendorPayout(req, res) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      const {
        payout_id,
        failure_reason,
        retry_possible = false
      } = req.body;
      const adminUserId = req.user.userId || req.user.$id;

      if (!payout_id) {
        return res.status(400).json({
          success: false,
          error: "payout_id is required"
        });
      }

      if (!failure_reason) {
        return res.status(400).json({
          success: false,
          error: "failure_reason is required"
        });
      }

      console.log(`❌ Admin ${adminUserId} marking payout ${payout_id} as failed: ${failure_reason}`);

      const vendorPayoutService = new VendorPayoutService();
      
      const failureResult = await vendorPayoutService.failPayoutTransaction(payout_id, {
        failure_reason,
        adminUserId,
        retry_possible
      });

      if (!failureResult.success) {
        return res.status(400).json({
          success: false,
          error: failureResult.message
        });
      }

      // Log payout failure
      await logAuditFromRequest(
        req,
        "Vendor payout failed",
        "VendorPayouts",
        payout_id,
        {
          batch_id: failureResult.batch_id,
          vendor_id: failureResult.vendor_id,
          failure_reason,
          retry_possible
        }
      );

      res.json({
        success: true,
        message: "Payout marked as failed",
        data: {
          payout_id,
          batch_id: failureResult.batch_id,
          vendor_id: failureResult.vendor_id,
          status: "FAILED",
          failure_reason,
          retry_possible,
          failed_by: adminUserId,
          failed_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Error marking payout as failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to mark payout as failed",
        details: error.message
      });
    }
  }

  /**
   * GET /api/admin/finance/vendor-payouts/audit/:entity_id
   * Get complete audit trail for a payout entity (batch, payout, or order)
   */
  static async getPayoutAuditTrail(req, res) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      const { entity_id } = req.params;
      const { limit = 100 } = req.query;

      if (!entity_id) {
        return res.status(400).json({
          success: false,
          error: "entity_id is required"
        });
      }

      console.log(`📋 Admin ${req.user.userId} requesting audit trail for ${entity_id}`);

      // Get audit logs for the entity
      const auditLogs = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PAYOUT_AUDIT_LOGS_COLLECTION_ID,
        [
          Query.equal("entity_id", entity_id),
          Query.orderDesc("timestamp"),
          Query.limit(parseInt(limit))
        ]
      );

      res.json({
        success: true,
        data: {
          entity_id,
          audit_trail: auditLogs.documents.map(log => ({
            audit_id: log.audit_id,
            event_type: log.event_type,
            entity_type: log.entity_type,
            vendor_id: log.vendor_id,
            amount: log.amount,
            previous_status: log.previous_status,
            new_status: log.new_status,
            performed_by: log.performed_by,
            timestamp: log.timestamp,
            details: log.details ? JSON.parse(log.details) : null,
            ip_address: log.ip_address
          })),
          total_entries: auditLogs.documents.length,
          generated_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Error getting payout audit trail:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get audit trail",
        details: error.message
      });
    }
  }
}

module.exports = CommissionController;
