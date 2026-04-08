// services/gmvAnalyticsService.js
const { db } = require("./appwriteService");
const { env } = require("../src/env");
const { Query } = require("node-appwrite");

/**
 * GMV and Commission Analytics Service
 *
 * Provides comprehensive financial analytics including:
 * 1. Gross Merchandise Value (GMV) calculations
 * 2. Commission tracking and trending
 * 3. Vendor performance analytics
 * 4. Revenue forecasting
 * 5. Time-series financial data
 *
 * Key Features:
 * - Real-time and historical analytics
 * - Multi-vendor support
 * - Configurable date ranges
 * - Export-ready data formats
 * - Audit-trail compliance
 */
class GMVAnalyticsService {
  constructor() {
    this.databaseId = env.APPWRITE_DATABASE_ID;
    this.ordersCollectionId = env.APPWRITE_ORDERS_COLLECTION;

    // Cache for expensive calculations (TTL: 10 minutes)
    this.analyticsCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes

    // Clean cache every 15 minutes
    setInterval(
      () => {
        const now = Date.now();
        for (const [key, cached] of this.analyticsCache.entries()) {
          if (now - cached.timestamp > this.cacheTimeout) {
            this.analyticsCache.delete(key);
          }
        }
      },
      15 * 60 * 1000,
    );
  }

  /**
   * Generate comprehensive financial dashboard data
   *
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Complete financial analytics
   */
  async generateFinancialDashboard(params = {}) {
    const {
      startDate,
      endDate,
      vendorId,
      period = "30d",
      includeProjections = false,
    } = params;

    try {
      // Calculate date range
      const dateRange = this.calculateDateRange(startDate, endDate, period);

      // Generate cache key
      const cacheKey = `dashboard_${JSON.stringify({ ...dateRange, vendorId, period })}`;

      // Check cache first
      if (this.analyticsCache.has(cacheKey)) {
        const cached = this.analyticsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log("📊 Returning cached financial dashboard");
          return cached.data;
        }
      }

      console.log("📊 Generating fresh financial dashboard analytics...");

      // Get all relevant orders for the period
      const orders = await this.getOrdersForPeriod(dateRange, vendorId);

      // Calculate core metrics
      const [
        gmvMetrics,
        commissionMetrics,
        vendorBreakdown,
        timeSeriesData,
        orderStatusMetrics,
      ] = await Promise.all([
        this.calculateGMVMetrics(orders),
        this.calculateCommissionMetrics(orders),
        this.calculateVendorBreakdown(orders),
        this.generateTimeSeriesData(orders, dateRange),
        this.calculateOrderStatusMetrics(orders),
      ]);

      // Generate projections if requested
      let projections = null;
      if (includeProjections) {
        projections = await this.generateProjections(timeSeriesData, dateRange);
      }

      const dashboardData = {
        period: {
          startDate: dateRange.start,
          endDate: dateRange.end,
          days: Math.ceil(
            (new Date(dateRange.end) - new Date(dateRange.start)) /
              (24 * 60 * 60 * 1000),
          ),
          label: this.getPeriodLabel(period),
        },
        summary: {
          totalGMV: gmvMetrics.totalGMV,
          totalOrders: orders.length,
          totalCommission: commissionMetrics.totalCommission,
          averageOrderValue: gmvMetrics.averageOrderValue,
          averageCommissionRate: commissionMetrics.averageCommissionRate,
          commissionAsPercentageOfGMV:
            gmvMetrics.totalGMV > 0
              ? (
                  (commissionMetrics.totalCommission / gmvMetrics.totalGMV) *
                  100
                ).toFixed(2)
              : "0.00",
        },
        gmv: {
          ...gmvMetrics,
          trend: this.calculateGMVTrend(timeSeriesData),
        },
        commission: {
          ...commissionMetrics,
          trend: this.calculateCommissionTrend(timeSeriesData),
        },
        vendors: vendorBreakdown,
        orderStatus: orderStatusMetrics,
        timeSeries: timeSeriesData,
        projections: projections,
        metadata: {
          generatedAt: new Date().toISOString(),
          cachedUntil: new Date(Date.now() + this.cacheTimeout).toISOString(),
          orderCount: orders.length,
          currency: "KES",
        },
      };

      // Cache the result
      this.analyticsCache.set(cacheKey, {
        data: dashboardData,
        timestamp: Date.now(),
      });

      return dashboardData;
    } catch (error) {
      console.error("Error generating financial dashboard:", error);
      throw new Error(
        `Financial dashboard generation failed: ${error.message}`,
      );
    }
  }

  /**
   * Calculate comprehensive GMV metrics
   *
   * @param {Array} orders - Array of order documents
   * @returns {Object} GMV metrics
   */
  calculateGMVMetrics(orders) {
    const gmvEligibleOrders = orders.filter(
      (order) =>
        order.gmv_eligible !== false &&
        parseFloat(order.transaction_amount || order.amount) > 0,
    );

    const totalGMV = gmvEligibleOrders.reduce((sum, order) => {
      return sum + parseFloat(order.transaction_amount || order.amount || 0);
    }, 0);

    const averageOrderValue =
      gmvEligibleOrders.length > 0 ? totalGMV / gmvEligibleOrders.length : 0;

    // Calculate GMV by payment method
    const gmvByPaymentMethod = {};
    gmvEligibleOrders.forEach((order) => {
      const method = order.paymentMethod || "Unknown";
      gmvByPaymentMethod[method] =
        (gmvByPaymentMethod[method] || 0) +
        parseFloat(order.transaction_amount || order.amount || 0);
    });

    // Calculate median order value
    const orderValues = gmvEligibleOrders
      .map((order) => parseFloat(order.transaction_amount || order.amount || 0))
      .sort((a, b) => a - b);

    const medianOrderValue =
      orderValues.length > 0
        ? orderValues[Math.floor(orderValues.length / 2)]
        : 0;

    return {
      totalGMV: Math.round(totalGMV * 100) / 100,
      eligibleOrders: gmvEligibleOrders.length,
      totalOrders: orders.length,
      gmvEligibilityRate:
        orders.length > 0
          ? ((gmvEligibleOrders.length / orders.length) * 100).toFixed(2)
          : "0.00",
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      medianOrderValue: Math.round(medianOrderValue * 100) / 100,
      gmvByPaymentMethod: Object.fromEntries(
        Object.entries(gmvByPaymentMethod).map(([method, value]) => [
          method,
          Math.round(value * 100) / 100,
        ]),
      ),
    };
  }

  /**
   * Calculate comprehensive commission metrics
   *
   * @param {Array} orders - Array of order documents
   * @returns {Object} Commission metrics
   */
  calculateCommissionMetrics(orders) {
    const commissionOrders = orders.filter(
      (order) =>
        order.commission_earned && parseFloat(order.commission_earned) > 0,
    );

    const totalCommission = commissionOrders.reduce((sum, order) => {
      return sum + parseFloat(order.commission_earned || 0);
    }, 0);

    const averageCommissionRate =
      commissionOrders.length > 0
        ? commissionOrders.reduce((sum, order) => {
            return sum + parseFloat(order.commission_rate_used || 0);
          }, 0) / commissionOrders.length
        : 0;

    const averageCommissionPerOrder =
      commissionOrders.length > 0
        ? totalCommission / commissionOrders.length
        : 0;

    // Calculate commission by rate bands
    const commissionByRate = {};
    commissionOrders.forEach((order) => {
      const rate = parseFloat(order.commission_rate_used || 0);
      const rateBand = `${(rate * 100).toFixed(1)}%`;
      commissionByRate[rateBand] =
        (commissionByRate[rateBand] || 0) +
        parseFloat(order.commission_earned || 0);
    });

    // Financial status breakdown
    const statusBreakdown = {};
    orders.forEach((order) => {
      const status = order.financial_status || "pending";
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    return {
      totalCommission: Math.round(totalCommission * 100) / 100,
      commissionOrders: commissionOrders.length,
      averageCommissionRate: Math.round(averageCommissionRate * 10000) / 10000, // 4 decimal places
      averageCommissionPercent: `${(averageCommissionRate * 100).toFixed(2)}%`,
      averageCommissionPerOrder:
        Math.round(averageCommissionPerOrder * 100) / 100,
      commissionCalculationRate:
        orders.length > 0
          ? ((commissionOrders.length / orders.length) * 100).toFixed(2)
          : "0.00",
      commissionByRate: Object.fromEntries(
        Object.entries(commissionByRate).map(([rate, value]) => [
          rate,
          Math.round(value * 100) / 100,
        ]),
      ),
      financialStatusBreakdown: statusBreakdown,
    };
  }

  /**
   * Calculate vendor-specific breakdown
   *
   * @param {Array} orders - Array of order documents
   * @returns {Array} Vendor performance data
   */
  calculateVendorBreakdown(orders) {
    const vendorData = {};

    orders.forEach((order) => {
      const vendorId = order.vendor_id || "unassigned";

      if (!vendorData[vendorId]) {
        vendorData[vendorId] = {
          vendorId,
          orders: 0,
          totalGMV: 0,
          totalCommission: 0,
          averageOrderValue: 0,
        };
      }

      const orderValue = parseFloat(
        order.transaction_amount || order.amount || 0,
      );
      const commission = parseFloat(order.commission_earned || 0);

      vendorData[vendorId].orders += 1;
      vendorData[vendorId].totalGMV += orderValue;
      vendorData[vendorId].totalCommission += commission;
    });

    // Calculate averages and sort by GMV
    const vendorList = Object.values(vendorData)
      .map((vendor) => ({
        ...vendor,
        averageOrderValue:
          vendor.orders > 0
            ? Math.round((vendor.totalGMV / vendor.orders) * 100) / 100
            : 0,
        totalGMV: Math.round(vendor.totalGMV * 100) / 100,
        totalCommission: Math.round(vendor.totalCommission * 100) / 100,
      }))
      .sort((a, b) => b.totalGMV - a.totalGMV);

    return vendorList;
  }

  /**
   * Generate time-series data for trending
   *
   * @param {Array} orders - Array of order documents
   * @param {Object} dateRange - Date range object
   * @returns {Array} Time series data points
   */
  generateTimeSeriesData(orders, dateRange) {
    const timeSeriesData = [];
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    // Determine the appropriate time bucket (day, week, month)
    const daysDiff = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
    const bucketType =
      daysDiff <= 7 ? "day" : daysDiff <= 90 ? "week" : "month";

    // Group orders by time bucket
    const buckets = new Map();

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt || order.$createdAt);
      const bucketKey = this.getBucketKey(orderDate, bucketType);

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, {
          date: bucketKey,
          orders: 0,
          gmv: 0,
          commission: 0,
        });
      }

      const bucket = buckets.get(bucketKey);
      bucket.orders += 1;
      bucket.gmv += parseFloat(order.transaction_amount || order.amount || 0);
      bucket.commission += parseFloat(order.commission_earned || 0);
    });

    // Convert to sorted array
    return Array.from(buckets.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((bucket) => ({
        ...bucket,
        gmv: Math.round(bucket.gmv * 100) / 100,
        commission: Math.round(bucket.commission * 100) / 100,
        averageOrderValue:
          bucket.orders > 0
            ? Math.round((bucket.gmv / bucket.orders) * 100) / 100
            : 0,
      }));
  }

  /**
   * Calculate order status metrics
   *
   * @param {Array} orders - Array of order documents
   * @returns {Object} Order status breakdown
   */
  calculateOrderStatusMetrics(orders) {
    const statusCounts = {};
    const paymentStatusCounts = {};
    let completedOrders = 0;
    let pendingOrders = 0;

    orders.forEach((order) => {
      const orderStatus = order.orderStatus || "Unknown";
      const paymentStatus = order.paymentStatus || "Unknown";

      statusCounts[orderStatus] = (statusCounts[orderStatus] || 0) + 1;
      paymentStatusCounts[paymentStatus] =
        (paymentStatusCounts[paymentStatus] || 0) + 1;

      // Categorize as completed or pending
      const completedStatuses = ["completed", "delivered", "confirmed"];
      const pendingStatuses = ["pending", "processing", "ordered"];

      if (
        completedStatuses.some((status) =>
          orderStatus.toLowerCase().includes(status.toLowerCase()),
        )
      ) {
        completedOrders++;
      } else if (
        pendingStatuses.some((status) =>
          orderStatus.toLowerCase().includes(status.toLowerCase()),
        )
      ) {
        pendingOrders++;
      }
    });

    return {
      orderStatusBreakdown: statusCounts,
      paymentStatusBreakdown: paymentStatusCounts,
      completionRate:
        orders.length > 0
          ? ((completedOrders / orders.length) * 100).toFixed(2)
          : "0.00",
      completedOrders,
      pendingOrders,
      otherOrders: orders.length - completedOrders - pendingOrders,
    };
  }

  /**
   * Get orders for a specific period with optional vendor filtering
   *
   * @param {Object} dateRange - Date range object
   * @param {string|null} vendorId - Optional vendor filter
   * @returns {Promise<Array>} Filtered orders
   */
  async getOrdersForPeriod(dateRange, vendorId = null) {
    const queries = [];

    if (dateRange.start) {
      queries.push(Query.greaterThanEqual("$createdAt", dateRange.start));
    }

    if (dateRange.end) {
      queries.push(Query.lessThanEqual("$createdAt", dateRange.end));
    }

    if (vendorId) {
      queries.push(Query.equal("vendor_id", vendorId));
    }

    // Get all documents (handling pagination)
    let allOrders = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await db.listDocuments(
        this.databaseId,
        this.ordersCollectionId,
        [
          ...queries,
          Query.limit(limit),
          Query.offset(offset),
          Query.orderDesc("$createdAt"),
        ],
      );

      allOrders = allOrders.concat(response.documents);

      if (response.documents.length < limit) {
        break; // No more documents
      }

      offset += limit;
    }

    return allOrders;
  }

  /**
   * Calculate date range based on period
   */
  calculateDateRange(startDate, endDate, period) {
    const now = new Date();
    let start = startDate;
    let end = endDate || now.toISOString();

    if (!start) {
      const daysBack =
        {
          "7d": 7,
          "30d": 30,
          "90d": 90,
          "1y": 365,
          ytd: Math.ceil(
            (now - new Date(now.getFullYear(), 0, 1)) / (24 * 60 * 60 * 1000),
          ),
          mtd: now.getDate(),
        }[period] || 30;

      start = new Date(
        now.getTime() - daysBack * 24 * 60 * 60 * 1000,
      ).toISOString();
    }

    return { start, end };
  }

  /**
   * Get bucket key for time series grouping
   */
  getBucketKey(date, bucketType) {
    const d = new Date(date);

    switch (bucketType) {
      case "day":
        return d.toISOString().split("T")[0]; // YYYY-MM-DD
      case "week":
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        return startOfWeek.toISOString().split("T")[0];
      case "month":
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
      default:
        return d.toISOString().split("T")[0];
    }
  }

  /**
   * Get human-readable period label
   */
  getPeriodLabel(period) {
    const labels = {
      "7d": "Last 7 Days",
      "30d": "Last 30 Days",
      "90d": "Last 90 Days",
      "1y": "Last Year",
      ytd: "Year to Date",
      mtd: "Month to Date",
    };

    return labels[period] || "Custom Period";
  }

  /**
   * Calculate GMV trend (simplified)
   */
  calculateGMVTrend(timeSeriesData) {
    if (timeSeriesData.length < 2) return "insufficient_data";

    const firstHalf = timeSeriesData.slice(
      0,
      Math.floor(timeSeriesData.length / 2),
    );
    const secondHalf = timeSeriesData.slice(
      Math.floor(timeSeriesData.length / 2),
    );

    const firstHalfAvg =
      firstHalf.reduce((sum, point) => sum + point.gmv, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, point) => sum + point.gmv, 0) / secondHalf.length;

    if (secondHalfAvg > firstHalfAvg * 1.05) return "increasing";
    if (secondHalfAvg < firstHalfAvg * 0.95) return "decreasing";
    return "stable";
  }

  /**
   * Calculate commission trend (simplified)
   */
  calculateCommissionTrend(timeSeriesData) {
    if (timeSeriesData.length < 2) return "insufficient_data";

    const firstHalf = timeSeriesData.slice(
      0,
      Math.floor(timeSeriesData.length / 2),
    );
    const secondHalf = timeSeriesData.slice(
      Math.floor(timeSeriesData.length / 2),
    );

    const firstHalfAvg =
      firstHalf.reduce((sum, point) => sum + point.commission, 0) /
      firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, point) => sum + point.commission, 0) /
      secondHalf.length;

    if (secondHalfAvg > firstHalfAvg * 1.05) return "increasing";
    if (secondHalfAvg < firstHalfAvg * 0.95) return "decreasing";
    return "stable";
  }

  /**
   * Generate basic projections (placeholder - can be enhanced with ML)
   */
  async generateProjections(timeSeriesData, dateRange) {
    // Simple linear projection based on recent trend
    // In production, this would use more sophisticated forecasting

    if (timeSeriesData.length < 3) {
      return {
        available: false,
        reason: "Insufficient historical data for projections",
      };
    }

    const recentData = timeSeriesData.slice(-7); // Last 7 data points
    const avgGMV =
      recentData.reduce((sum, point) => sum + point.gmv, 0) / recentData.length;
    const avgCommission =
      recentData.reduce((sum, point) => sum + point.commission, 0) /
      recentData.length;

    return {
      available: true,
      next30Days: {
        projectedGMV: Math.round(avgGMV * 30 * 100) / 100,
        projectedCommission: Math.round(avgCommission * 30 * 100) / 100,
        confidence: "low", // Simple projection has low confidence
        basedOn: `${recentData.length} recent data points`,
      },
      methodology: "Simple average of recent performance",
      disclaimer:
        "Projections are estimates based on historical data and should not be used for financial planning",
    };
  }

  /**
   * Clear analytics cache
   */
  clearCache() {
    this.analyticsCache.clear();
    console.log("📊 Analytics cache cleared");
  }
}

// Export singleton instance
const gmvAnalyticsService = new GMVAnalyticsService();

module.exports = {
  GMVAnalyticsService,
  gmvAnalyticsService,
};
