// controllers/riderAnalyticsController.js
const { db } = require("../services/appwriteService");
const { env } = require("../src/env");
const { Query } = require("node-appwrite");

const log = {
  info: (...args) => console.info("[rider-analytics]", ...args),
  error: (...args) => console.error("[rider-analytics]", ...args),
};

/**
 * Helper: Get date ranges
 */
const getDateRanges = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    today: today.toISOString(),
    yesterday: yesterday.toISOString(),
    thisWeekStart: thisWeekStart.toISOString(),
    lastWeekStart: lastWeekStart.toISOString(),
    thisMonthStart: thisMonthStart.toISOString(),
    lastMonthStart: lastMonthStart.toISOString(),
    lastMonthEnd: lastMonthEnd.toISOString(),
  };
};

/**
 * Calculate delivery success rate
 */
const calculateSuccessRate = async (riderId, startDate, endDate) => {
  try {
    const queries = [
      Query.equal("riderId", riderId),
      Query.greaterThanEqual("createdAt", startDate),
      Query.lessThanEqual("createdAt", endDate),
    ];

    const allDeliveries = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      queries
    );

    const completedDeliveries = allDeliveries.documents.filter(
      (d) => d.status === "delivered"
    );

    const failedDeliveries = allDeliveries.documents.filter(
      (d) => d.status === "failed"
    );

    const total = allDeliveries.total;
    const successRate =
      total > 0 ? (completedDeliveries.length / total) * 100 : 0;

    return {
      total,
      completed: completedDeliveries.length,
      failed: failedDeliveries.length,
      successRate: parseFloat(successRate.toFixed(2)),
    };
  } catch (error) {
    log.error("Calculate success rate error:", error);
    return { total: 0, completed: 0, failed: 0, successRate: 0 };
  }
};

/**
 * Calculate average delivery time
 */
const calculateAvgDeliveryTime = async (riderId, startDate, endDate) => {
  try {
    const queries = [
      Query.equal("riderId", riderId),
      Query.equal("status", "delivered"),
      Query.greaterThanEqual("createdAt", startDate),
      Query.lessThanEqual("createdAt", endDate),
    ];

    const deliveries = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      queries
    );

    if (deliveries.total === 0) {
      return { averageMinutes: 0, fastestMinutes: 0, slowestMinutes: 0 };
    }

    const times = deliveries.documents
      .filter((d) => d.completedAt && d.createdAt)
      .map((d) => {
        const start = new Date(d.createdAt).getTime();
        const end = new Date(d.completedAt).getTime();
        return (end - start) / (1000 * 60); // Convert to minutes
      });

    if (times.length === 0) {
      return { averageMinutes: 0, fastestMinutes: 0, slowestMinutes: 0 };
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const fastest = Math.min(...times);
    const slowest = Math.max(...times);

    return {
      averageMinutes: parseFloat(avg.toFixed(2)),
      fastestMinutes: parseFloat(fastest.toFixed(2)),
      slowestMinutes: parseFloat(slowest.toFixed(2)),
    };
  } catch (error) {
    log.error("Calculate avg delivery time error:", error);
    return { averageMinutes: 0, fastestMinutes: 0, slowestMinutes: 0 };
  }
};

/**
 * Get customer ratings breakdown
 */
const getCustomerRatings = async (riderId, startDate, endDate) => {
  try {
    const queries = [
      Query.equal("riderId", riderId),
      Query.greaterThanEqual("createdAt", startDate),
      Query.lessThanEqual("createdAt", endDate),
    ];

    const deliveries = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      queries
    );

    const ratings = deliveries.documents
      .filter((d) => d.customerRating)
      .map((d) => d.customerRating);

    if (ratings.length === 0) {
      return {
        average: 0,
        total: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    ratings.forEach((rating) => {
      breakdown[rating] = (breakdown[rating] || 0) + 1;
    });

    return {
      average: parseFloat(avg.toFixed(2)),
      total: ratings.length,
      breakdown,
    };
  } catch (error) {
    log.error("Get customer ratings error:", error);
    return {
      average: 0,
      total: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }
};

/**
 * Analyze peak hours
 */
const analyzePeakHours = async (riderId, startDate, endDate) => {
  try {
    const queries = [
      Query.equal("riderId", riderId),
      Query.greaterThanEqual("createdAt", startDate),
      Query.lessThanEqual("createdAt", endDate),
    ];

    const deliveries = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      queries
    );

    const hourlyData = Array(24).fill(0);

    deliveries.documents.forEach((delivery) => {
      const hour = new Date(delivery.createdAt).getHours();
      hourlyData[hour]++;
    });

    const peakHour = hourlyData.indexOf(Math.max(...hourlyData));

    return {
      hourlyBreakdown: hourlyData,
      peakHour,
      peakHourDeliveries: hourlyData[peakHour],
    };
  } catch (error) {
    log.error("Analyze peak hours error:", error);
    return {
      hourlyBreakdown: Array(24).fill(0),
      peakHour: 0,
      peakHourDeliveries: 0,
    };
  }
};

/**
 * Calculate earnings trend
 */
const calculateEarningsTrend = async (riderId, days = 30) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const queries = [
      Query.equal("riderId", riderId),
      Query.equal("paymentStatus", "completed"),
      Query.greaterThanEqual("completedAt", startDate.toISOString()),
      Query.lessThanEqual("completedAt", endDate.toISOString()),
    ];

    const deliveries = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      queries
    );

    // Group by date
    const dailyEarnings = {};

    deliveries.documents.forEach((delivery) => {
      const date = new Date(delivery.completedAt).toISOString().split("T")[0];
      dailyEarnings[date] =
        (dailyEarnings[date] || 0) + (delivery.riderEarning || 0);
    });

    // Fill missing dates with 0
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      trend.push({
        date: dateStr,
        earnings: dailyEarnings[dateStr] || 0,
      });
    }

    return trend;
  } catch (error) {
    log.error("Calculate earnings trend error:", error);
    return [];
  }
};

/**
 * Get delivery status breakdown
 */
const getDeliveryStatusBreakdown = async (riderId, startDate, endDate) => {
  try {
    const queries = [
      Query.equal("riderId", riderId),
      Query.greaterThanEqual("createdAt", startDate),
      Query.lessThanEqual("createdAt", endDate),
    ];

    const deliveries = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      queries
    );

    const breakdown = {
      assigned: 0,
      picked_up: 0,
      in_transit: 0,
      delivered: 0,
      failed: 0,
    };

    deliveries.documents.forEach((delivery) => {
      if (breakdown[delivery.status] !== undefined) {
        breakdown[delivery.status]++;
      }
    });

    return breakdown;
  } catch (error) {
    log.error("Get delivery status breakdown error:", error);
    return {
      assigned: 0,
      picked_up: 0,
      in_transit: 0,
      delivered: 0,
      failed: 0,
    };
  }
};

/**
 * Calculate distance traveled
 */
const calculateDistanceTraveled = async (riderId, startDate, endDate) => {
  try {
    const queries = [
      Query.equal("riderId", riderId),
      Query.equal("status", "delivered"),
      Query.greaterThanEqual("createdAt", startDate),
      Query.lessThanEqual("createdAt", endDate),
    ];

    const deliveries = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      queries
    );

    const totalDistance = deliveries.documents.reduce(
      (sum, delivery) => sum + (delivery.distance || 0),
      0
    );

    return {
      totalKm: parseFloat(totalDistance.toFixed(2)),
      averageKm:
        deliveries.total > 0
          ? parseFloat((totalDistance / deliveries.total).toFixed(2))
          : 0,
    };
  } catch (error) {
    log.error("Calculate distance traveled error:", error);
    return { totalKm: 0, averageKm: 0 };
  }
};

const riderAnalyticsController = {
  /**
   * Get comprehensive analytics dashboard
   */
  async getDashboardAnalytics(req, res) {
    try {
      const riderId = req.rider.riderId;
      const { period = "today" } = req.query; // today, week, month, custom

      const dateRanges = getDateRanges();
      let startDate, endDate;

      switch (period) {
        case "today":
          startDate = dateRanges.today;
          endDate = new Date().toISOString();
          break;
        case "week":
          startDate = dateRanges.thisWeekStart;
          endDate = new Date().toISOString();
          break;
        case "month":
          startDate = dateRanges.thisMonthStart;
          endDate = new Date().toISOString();
          break;
        default:
          startDate = req.query.startDate || dateRanges.today;
          endDate = req.query.endDate || new Date().toISOString();
      }

      // Fetch all analytics data in parallel
      const [
        successRate,
        avgDeliveryTime,
        customerRatings,
        peakHours,
        earningsTrend,
        statusBreakdown,
        distance,
      ] = await Promise.all([
        calculateSuccessRate(riderId, startDate, endDate),
        calculateAvgDeliveryTime(riderId, startDate, endDate),
        getCustomerRatings(riderId, startDate, endDate),
        analyzePeakHours(riderId, startDate, endDate),
        calculateEarningsTrend(riderId, 30),
        getDeliveryStatusBreakdown(riderId, startDate, endDate),
        calculateDistanceTraveled(riderId, startDate, endDate),
      ]);

      // Get total earnings for the period
      const earningsQueries = [
        Query.equal("riderId", riderId),
        Query.equal("paymentStatus", "completed"),
        Query.greaterThanEqual("completedAt", startDate),
        Query.lessThanEqual("completedAt", endDate),
      ];

      const earningsData = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.DELIVERIES_COLLECTION_ID,
        earningsQueries
      );

      const totalEarnings = earningsData.documents.reduce(
        (sum, d) => sum + (d.riderEarning || 0),
        0
      );

      res.json({
        success: true,
        period,
        dateRange: { startDate, endDate },
        analytics: {
          earnings: {
            total: parseFloat(totalEarnings.toFixed(2)),
            deliveryCount: earningsData.total,
            averagePerDelivery:
              earningsData.total > 0
                ? parseFloat((totalEarnings / earningsData.total).toFixed(2))
                : 0,
            trend: earningsTrend,
          },
          performance: {
            successRate,
            avgDeliveryTime,
            customerRatings,
            statusBreakdown,
          },
          activity: {
            peakHours,
            distance,
          },
        },
      });
    } catch (error) {
      log.error("Get dashboard analytics error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch analytics",
      });
    }
  },

  /**
   * Get earnings summary with comparison
   */
  async getEarningsSummary(req, res) {
    try {
      const riderId = req.rider.riderId;
      const dateRanges = getDateRanges();

      // Today vs Yesterday
      const todayQueries = [
        Query.equal("riderId", riderId),
        Query.equal("paymentStatus", "completed"),
        Query.greaterThanEqual("completedAt", dateRanges.today),
      ];

      const yesterdayQueries = [
        Query.equal("riderId", riderId),
        Query.equal("paymentStatus", "completed"),
        Query.greaterThanEqual("completedAt", dateRanges.yesterday),
        Query.lessThan("completedAt", dateRanges.today),
      ];

      // This Week vs Last Week
      const thisWeekQueries = [
        Query.equal("riderId", riderId),
        Query.equal("paymentStatus", "completed"),
        Query.greaterThanEqual("completedAt", dateRanges.thisWeekStart),
      ];

      const lastWeekQueries = [
        Query.equal("riderId", riderId),
        Query.equal("paymentStatus", "completed"),
        Query.greaterThanEqual("completedAt", dateRanges.lastWeekStart),
        Query.lessThan("completedAt", dateRanges.thisWeekStart),
      ];

      // This Month vs Last Month
      const thisMonthQueries = [
        Query.equal("riderId", riderId),
        Query.equal("paymentStatus", "completed"),
        Query.greaterThanEqual("completedAt", dateRanges.thisMonthStart),
      ];

      const lastMonthQueries = [
        Query.equal("riderId", riderId),
        Query.equal("paymentStatus", "completed"),
        Query.greaterThanEqual("completedAt", dateRanges.lastMonthStart),
        Query.lessThanEqual("completedAt", dateRanges.lastMonthEnd),
      ];

      const [
        todayData,
        yesterdayData,
        thisWeekData,
        lastWeekData,
        thisMonthData,
        lastMonthData,
      ] = await Promise.all([
        db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.DELIVERIES_COLLECTION_ID,
          todayQueries
        ),
        db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.DELIVERIES_COLLECTION_ID,
          yesterdayQueries
        ),
        db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.DELIVERIES_COLLECTION_ID,
          thisWeekQueries
        ),
        db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.DELIVERIES_COLLECTION_ID,
          lastWeekQueries
        ),
        db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.DELIVERIES_COLLECTION_ID,
          thisMonthQueries
        ),
        db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.DELIVERIES_COLLECTION_ID,
          lastMonthQueries
        ),
      ]);

      const calculateEarnings = (docs) =>
        docs.reduce((sum, d) => sum + (d.riderEarning || 0), 0);

      const todayEarnings = calculateEarnings(todayData.documents);
      const yesterdayEarnings = calculateEarnings(yesterdayData.documents);
      const thisWeekEarnings = calculateEarnings(thisWeekData.documents);
      const lastWeekEarnings = calculateEarnings(lastWeekData.documents);
      const thisMonthEarnings = calculateEarnings(thisMonthData.documents);
      const lastMonthEarnings = calculateEarnings(lastMonthData.documents);

      const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return parseFloat((((current - previous) / previous) * 100).toFixed(2));
      };

      res.json({
        success: true,
        summary: {
          today: {
            earnings: parseFloat(todayEarnings.toFixed(2)),
            deliveries: todayData.total,
            change: calculateChange(todayEarnings, yesterdayEarnings),
          },
          thisWeek: {
            earnings: parseFloat(thisWeekEarnings.toFixed(2)),
            deliveries: thisWeekData.total,
            change: calculateChange(thisWeekEarnings, lastWeekEarnings),
          },
          thisMonth: {
            earnings: parseFloat(thisMonthEarnings.toFixed(2)),
            deliveries: thisMonthData.total,
            change: calculateChange(thisMonthEarnings, lastMonthEarnings),
          },
        },
      });
    } catch (error) {
      log.error("Get earnings summary error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch earnings summary",
      });
    }
  },

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(req, res) {
    try {
      const riderId = req.rider.riderId;
      const { days = 7 } = req.query;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const [successRate, avgDeliveryTime, customerRatings] = await Promise.all(
        [
          calculateSuccessRate(
            riderId,
            startDate.toISOString(),
            endDate.toISOString()
          ),
          calculateAvgDeliveryTime(
            riderId,
            startDate.toISOString(),
            endDate.toISOString()
          ),
          getCustomerRatings(
            riderId,
            startDate.toISOString(),
            endDate.toISOString()
          ),
        ]
      );

      res.json({
        success: true,
        metrics: {
          successRate,
          avgDeliveryTime,
          customerRatings,
        },
      });
    } catch (error) {
      log.error("Get performance metrics error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch performance metrics",
      });
    }
  },
};

module.exports = riderAnalyticsController;
