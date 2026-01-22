// services/commissionService.js
const { db } = require("./appwriteService");
const { env } = require("../src/env");
const { platformSettingsService } = require("./platformSettingsService");
const { Query, ID } = require("node-appwrite");

/**
 * Commission Service
 *
 * Handles all commission-related calculations and tracking with fintech-grade precision:
 * 1. Calculates commission for orders atomically
 * 2. Ensures idempotency (no double calculations)
 * 3. Maintains audit trails
 * 4. Provides commission analytics
 *
 * Key Financial Principles:
 * - All calculations are deterministic and repeatable
 * - Commission rates are captured at time of calculation (no retroactive changes)
 * - GMV tracking is separate from commission calculation
 * - All operations are auditable
 */
class CommissionService {
  constructor() {
    this.databaseId = env.APPWRITE_DATABASE_ID;
    this.ordersCollectionId = env.APPWRITE_ORDERS_COLLECTION;

    // Track processed orders to prevent double calculation
    this.processedOrders = new Map();

    // Clean up processed orders cache every 30 minutes
    setInterval(
      () => {
        const now = Date.now();
        const thirtyMinutes = 30 * 60 * 1000;
        for (const [orderId, timestamp] of this.processedOrders.entries()) {
          if (now - timestamp > thirtyMinutes) {
            this.processedOrders.delete(orderId);
          }
        }
      },
      30 * 60 * 1000,
    );
  }

  /**
   * Calculate and store commission for a completed order
   * This is the main entry point called when an order is marked as completed
   *
   * @param {string} orderId - The order ID
   * @param {Object} orderData - Order data object
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Commission calculation result
   */
  async calculateOrderCommission(orderId, orderData = null, options = {}) {
    const lockKey = `commission_calc_${orderId}`;

    // Prevent double processing
    if (this.processedOrders.has(lockKey)) {
      console.warn(
        `Commission calculation already in progress for order ${orderId}`,
      );
      return {
        success: false,
        message: "Commission calculation already processed",
        orderId,
      };
    }

    this.processedOrders.set(lockKey, Date.now());

    try {
      // Get order data if not provided
      const order = orderData || (await this.getOrderById(orderId));

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Check if commission already calculated
      if (order.commission_calculated_at && !options.forceRecalculation) {
        console.log(`Commission already calculated for order ${orderId}`);
        return {
          success: true,
          message: "Commission already calculated",
          orderId,
          commission_earned: order.commission_earned,
          commission_rate_used: order.commission_rate_used,
          calculated_at: order.commission_calculated_at,
        };
      }

      // Validate order is eligible for commission calculation
      const eligibilityCheck = this.checkCommissionEligibility(order);
      if (!eligibilityCheck.eligible) {
        console.log(
          `Order ${orderId} not eligible for commission: ${eligibilityCheck.reason}`,
        );
        return {
          success: false,
          message: eligibilityCheck.reason,
          orderId,
          eligible: false,
        };
      }

      // Calculate commission using current platform rate
      const commissionCalculation =
        await platformSettingsService.calculateCommission(
          parseFloat(order.amount),
          options.customCommissionRate,
        );

      // Extract vendor information from order items
      const vendorInfo = await this.extractVendorInfo(order);

      // Prepare commission data for order update
      const commissionData = {
        commission_earned: commissionCalculation.commissionAmount,
        commission_rate_used: commissionCalculation.commissionRate,
        transaction_amount: parseFloat(order.amount), // For GMV calculation
        vendor_id: vendorInfo.primaryVendorId,
        gmv_eligible: this.isOrderGMVEligible(order),
        commission_calculated_at: new Date().toISOString(),
        financial_status: "calculated",
        updatedAt: new Date().toISOString(),
      };

      // Update order with commission data atomically
      const updatedOrder = await db.updateDocument(
        this.databaseId,
        this.ordersCollectionId,
        orderId,
        commissionData,
      );

      // Log successful commission calculation
      this.logCommissionCalculation({
        orderId,
        orderAmount: parseFloat(order.amount),
        commissionRate: commissionCalculation.commissionRate,
        commissionAmount: commissionCalculation.commissionAmount,
        vendorId: vendorInfo.primaryVendorId,
        calculatedAt: commissionData.commission_calculated_at,
      });

      console.log(
        `✅ Commission calculated for order ${orderId}: ${commissionCalculation.commissionAmount} (${(commissionCalculation.commissionRate * 100).toFixed(2)}%)`,
      );

      return {
        success: true,
        orderId,
        orderAmount: parseFloat(order.amount),
        commission_earned: commissionCalculation.commissionAmount,
        commission_rate_used: commissionCalculation.commissionRate,
        commission_percent: commissionCalculation.commissionPercent,
        transaction_amount: commissionData.transaction_amount,
        vendor_id: vendorInfo.primaryVendorId,
        gmv_eligible: commissionData.gmv_eligible,
        calculated_at: commissionData.commission_calculated_at,
        message: `Commission calculated: ${commissionCalculation.commissionAmount} at ${commissionCalculation.commissionPercent}%`,
      };
    } catch (error) {
      console.error(
        `Error calculating commission for order ${orderId}:`,
        error,
      );

      // Update order to mark commission calculation as failed
      try {
        await db.updateDocument(
          this.databaseId,
          this.ordersCollectionId,
          orderId,
          {
            financial_status: "calculation_failed",
            commission_error: error.message,
            updatedAt: new Date().toISOString(),
          },
        );
      } catch (updateError) {
        console.error(
          "Failed to update order with commission error:",
          updateError,
        );
      }

      throw new Error(`Commission calculation failed: ${error.message}`);
    } finally {
      // Clean up processing lock
      this.processedOrders.delete(lockKey);
    }
  }

  /**
   * Calculate commission for multiple orders (batch processing)
   * Useful for backfilling historical orders or processing delayed calculations
   *
   * @param {Array<string>} orderIds - Array of order IDs
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Batch processing results
   */
  async batchCalculateCommissions(orderIds, options = {}) {
    console.log(
      `📊 Starting batch commission calculation for ${orderIds.length} orders`,
    );

    const results = {
      total: orderIds.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      summary: [],
    };

    for (const orderId of orderIds) {
      try {
        const result = await this.calculateOrderCommission(
          orderId,
          null,
          options,
        );

        results.processed++;

        if (result.success) {
          results.successful++;
          results.summary.push({
            orderId,
            status: "success",
            commission: result.commission_earned,
            rate: result.commission_rate_used,
          });
        } else {
          results.skipped++;
          results.summary.push({
            orderId,
            status: "skipped",
            reason: result.message,
          });
        }

        // Small delay to prevent overwhelming the database
        if (options.batchDelay) {
          await new Promise((resolve) =>
            setTimeout(resolve, options.batchDelay),
          );
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          orderId,
          error: error.message,
        });

        results.summary.push({
          orderId,
          status: "failed",
          error: error.message,
        });
      }
    }

    console.log(
      `✅ Batch commission calculation completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`,
    );

    return results;
  }

  /**
   * Check if an order is eligible for commission calculation
   *
   * @param {Object} order - Order object
   * @returns {Object} Eligibility result
   */
  checkCommissionEligibility(order) {
    // Order must have a valid amount
    if (!order.amount || parseFloat(order.amount) <= 0) {
      return { eligible: false, reason: "Invalid or zero order amount" };
    }

    // Order must be in a completed state (depending on your business logic)
    const eligibleStatuses = [
      "completed",
      "delivered",
      "succeeded",
      "confirmed",
    ];
    const paymentStatus = (order.paymentStatus || "").toLowerCase();
    const orderStatus = (order.orderStatus || "").toLowerCase();

    if (
      !eligibleStatuses.some(
        (status) =>
          paymentStatus.includes(status) || orderStatus.includes(status),
      )
    ) {
      return {
        eligible: false,
        reason: `Order status not eligible for commission (payment: ${order.paymentStatus}, order: ${order.orderStatus})`,
      };
    }

    // Order must not be cancelled or refunded
    const ineligibleStatuses = ["cancelled", "refunded", "failed", "disputed"];
    if (
      ineligibleStatuses.some(
        (status) =>
          paymentStatus.includes(status) || orderStatus.includes(status),
      )
    ) {
      return {
        eligible: false,
        reason: `Order has ineligible status (${order.orderStatus}/${order.paymentStatus})`,
      };
    }

    // Order must have items
    try {
      const items = JSON.parse(order.items || "[]");
      if (!Array.isArray(items) || items.length === 0) {
        return { eligible: false, reason: "Order has no items" };
      }
    } catch (e) {
      return { eligible: false, reason: "Invalid order items format" };
    }

    return { eligible: true };
  }

  /**
   * Extract vendor information from order items
   *
   * @param {Object} order - Order object
   * @returns {Promise<Object>} Vendor information
   */
  async extractVendorInfo(order) {
    try {
      const items = JSON.parse(order.items || "[]");
      const vendorIds = new Set();

      // Extract vendor IDs from items (assuming items have vendorId field)
      // This is business-logic dependent - adjust based on your item structure
      for (const item of items) {
        if (item.vendorId) {
          vendorIds.add(item.vendorId);
        }
        // Alternative: extract from productId if you have a products service
        // const product = await getProductById(item.productId);
        // if (product.vendorId) vendorIds.add(product.vendorId);
      }

      const vendorList = Array.from(vendorIds);

      return {
        primaryVendorId: vendorList.length > 0 ? vendorList[0] : null, // Use first vendor as primary
        allVendorIds: vendorList,
        isMultiVendor: vendorList.length > 1,
      };
    } catch (error) {
      console.warn("Error extracting vendor info from order:", error);
      return {
        primaryVendorId: null,
        allVendorIds: [],
        isMultiVendor: false,
      };
    }
  }

  /**
   * Check if order should be included in GMV calculation
   *
   * @param {Object} order - Order object
   * @returns {boolean} Whether order is GMV eligible
   */
  isOrderGMVEligible(order) {
    // GMV = Gross Merchandise Value = total value of completed transactions

    // Exclude test orders
    if (order.customerEmail && order.customerEmail.includes("test")) {
      return false;
    }

    // Exclude refunded/cancelled orders
    const ineligibleStatuses = ["cancelled", "refunded", "failed"];
    const orderStatus = (order.orderStatus || "").toLowerCase();
    const paymentStatus = (order.paymentStatus || "").toLowerCase();

    if (
      ineligibleStatuses.some(
        (status) =>
          orderStatus.includes(status) || paymentStatus.includes(status),
      )
    ) {
      return false;
    }

    // Must have valid transaction amount
    const amount = parseFloat(order.amount);
    if (isNaN(amount) || amount <= 0) {
      return false;
    }

    return true;
  }

  /**
   * Get order by ID
   *
   * @param {string} orderId - Order ID
   * @returns {Promise<Object|null>} Order object or null
   */
  async getOrderById(orderId) {
    try {
      return await db.getDocument(
        this.databaseId,
        this.ordersCollectionId,
        orderId,
      );
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get commission analytics for a date range
   *
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Commission analytics
   */
  async getCommissionAnalytics(params = {}) {
    const { startDate, endDate, vendorId } = params;

    try {
      const queries = [Query.greaterThan("commission_earned", 0)];

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
        this.databaseId,
        this.ordersCollectionId,
        queries,
      );

      // Calculate metrics
      const totalOrders = orders.documents.length;
      const totalCommission = orders.documents.reduce(
        (sum, order) => sum + (parseFloat(order.commission_earned) || 0),
        0,
      );
      const totalGMV = orders.documents
        .filter((order) => order.gmv_eligible)
        .reduce(
          (sum, order) => sum + (parseFloat(order.transaction_amount) || 0),
          0,
        );

      const averageCommissionRate =
        totalOrders > 0
          ? orders.documents.reduce(
              (sum, order) =>
                sum + (parseFloat(order.commission_rate_used) || 0),
              0,
            ) / totalOrders
          : 0;

      return {
        period: {
          startDate: startDate || "All time",
          endDate: endDate || "All time",
        },
        metrics: {
          totalOrders,
          totalCommission: Math.round(totalCommission * 100) / 100,
          totalGMV: Math.round(totalGMV * 100) / 100,
          averageCommissionRate:
            Math.round(averageCommissionRate * 10000) / 10000,
          averageCommissionPercent: `${(averageCommissionRate * 100).toFixed(2)}%`,
        },
        vendorId: vendorId || "All vendors",
      };
    } catch (error) {
      console.error("Error getting commission analytics:", error);
      throw error;
    }
  }

  /**
   * Log commission calculation for audit purposes
   */
  logCommissionCalculation(data) {
    console.log("💰 COMMISSION CALCULATION LOG", {
      timestamp: new Date().toISOString(),
      orderId: data.orderId,
      orderAmount: data.orderAmount,
      commissionRate: `${(data.commissionRate * 100).toFixed(3)}%`,
      commissionAmount: data.commissionAmount,
      vendorId: data.vendorId,
      calculatedAt: data.calculatedAt,
    });
  }

  /**
   * Validate commission service configuration
   */
  async validateConfiguration() {
    try {
      if (!this.ordersCollectionId) {
        console.error("❌ Orders collection ID not configured");
        return false;
      }

      // Test platform settings service
      const isSettingsValid =
        await platformSettingsService.validateConfiguration();
      if (!isSettingsValid) {
        return false;
      }

      // Test orders collection access
      await db.getCollection(this.databaseId, this.ordersCollectionId);

      console.log("✅ Commission service configured correctly");
      return true;
    } catch (error) {
      console.error(
        "❌ Commission service configuration error:",
        error.message,
      );
      return false;
    }
  }
}

// Export singleton instance
const commissionService = new CommissionService();

module.exports = {
  CommissionService,
  commissionService,
};
