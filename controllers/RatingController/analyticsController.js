const { db } = require("../../services/appwriteService");
const { Query, ID } = require("node-appwrite");
const { env } = require("../../src/env");

/**
 * Get Overall Rating Analytics
 */
const getOverallRatingAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;

    console.log("📊 Getting overall rating analytics...");

    const queries = [
      Query.equal("status", "active"),
      Query.limit(parseInt(limit)),
      Query.orderDesc("createdAt"),
    ];

    // Add date filtering if provided
    if (startDate) {
      const startDateTime = new Date(
        startDate + "T00:00:00.000Z"
      ).toISOString();
      queries.push(Query.greaterThanEqual("createdAt", startDateTime));
    }

    if (endDate) {
      const endDateTime = new Date(endDate + "T23:59:59.999Z").toISOString();
      queries.push(Query.lessThanEqual("createdAt", endDateTime));
    }

    const ratings = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.RATINGS_COLLECTION_ID,
      queries
    );

    const analytics = {
      totalRatings: ratings.documents.length,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      totalRiders: new Set(),
      totalCustomers: new Set(),
      recentRatings: [],
      topComments: [],
    };

    if (ratings.documents.length > 0) {
      // Calculate average rating and distribution
      let totalRatingSum = 0;
      ratings.documents.forEach((rating) => {
        totalRatingSum += rating.riderRating;
        analytics.ratingDistribution[rating.riderRating]++;
        analytics.totalRiders.add(rating.riderId);
        analytics.totalCustomers.add(rating.customerId);
      });

      analytics.averageRating =
        Math.round((totalRatingSum / ratings.documents.length) * 10) / 10;
      analytics.totalRiders = analytics.totalRiders.size;
      analytics.totalCustomers = analytics.totalCustomers.size;

      // Get recent ratings (last 10)
      analytics.recentRatings = ratings.documents
        .slice(0, 10)
        .map((rating) => ({
          id: rating.$id,
          riderId: rating.riderId,
          customerName: rating.customerName,
          riderRating: rating.riderRating,
          deliveryRating: rating.deliveryRating,
          comment: rating.comment,
          createdAt: rating.createdAt,
        }));

      // Get ratings with meaningful comments
      analytics.topComments = ratings.documents
        .filter((rating) => rating.comment && rating.comment.trim().length > 10)
        .slice(0, 5)
        .map((rating) => ({
          customerName: rating.customerName,
          riderRating: rating.riderRating,
          comment: rating.comment,
          createdAt: rating.createdAt,
        }));
    }

    console.log(
      `✅ Overall analytics: ${analytics.totalRatings} ratings, ${analytics.averageRating}/5 avg`
    );

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Get overall analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch overall analytics",
    });
  }
};

/**
 * Get Rider Performance Analytics
 */
const getRiderPerformance = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      limit = 50,
      sortBy = "averageRating",
    } = req.query;

    console.log("🏆 Getting rider performance analytics...");

    // Get all active ratings
    const queries = [
      Query.equal("status", "active"),
      Query.limit(1000), // Get more ratings for accurate analytics
    ];

    if (startDate) {
      const startDateTime = new Date(
        startDate + "T00:00:00.000Z"
      ).toISOString();
      queries.push(Query.greaterThanEqual("createdAt", startDateTime));
    }

    if (endDate) {
      const endDateTime = new Date(endDate + "T23:59:59.999Z").toISOString();
      queries.push(Query.lessThanEqual("createdAt", endDateTime));
    }

    const ratings = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.RATINGS_COLLECTION_ID,
      queries
    );

    // Group ratings by rider
    const riderStats = {};
    ratings.documents.forEach((rating) => {
      const riderId = rating.riderId;

      if (!riderStats[riderId]) {
        riderStats[riderId] = {
          riderId,
          totalRatings: 0,
          totalRiderRating: 0,
          totalDeliveryRating: 0,
          averageRiderRating: 0,
          averageDeliveryRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          recentRatings: [],
          commentsCount: 0,
          lastRatingDate: null,
        };
      }

      const stats = riderStats[riderId];
      stats.totalRatings++;
      stats.totalRiderRating += rating.riderRating;
      stats.totalDeliveryRating += rating.deliveryRating || rating.riderRating;
      stats.ratingDistribution[rating.riderRating]++;

      if (rating.comment && rating.comment.trim()) {
        stats.commentsCount++;
      }

      stats.recentRatings.push({
        riderRating: rating.riderRating,
        deliveryRating: rating.deliveryRating,
        comment: rating.comment,
        customerName: rating.customerName,
        createdAt: rating.createdAt,
      });

      // Update last rating date
      if (
        !stats.lastRatingDate ||
        new Date(rating.createdAt) > new Date(stats.lastRatingDate)
      ) {
        stats.lastRatingDate = rating.createdAt;
      }
    });

    // Calculate averages and sort recent ratings
    const riderPerformance = Object.values(riderStats).map((stats) => {
      stats.averageRiderRating =
        Math.round((stats.totalRiderRating / stats.totalRatings) * 10) / 10;
      stats.averageDeliveryRating =
        Math.round((stats.totalDeliveryRating / stats.totalRatings) * 10) / 10;
      stats.recentRatings = stats.recentRatings
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5); // Keep only 5 most recent

      return stats;
    });

    // Sort riders
    let sortedRiders = riderPerformance;
    switch (sortBy) {
      case "totalRatings":
        sortedRiders = riderPerformance.sort(
          (a, b) => b.totalRatings - a.totalRatings
        );
        break;
      case "recentActivity":
        sortedRiders = riderPerformance.sort(
          (a, b) => new Date(b.lastRatingDate) - new Date(a.lastRatingDate)
        );
        break;
      default: // averageRating
        sortedRiders = riderPerformance.sort(
          (a, b) => b.averageRiderRating - a.averageRiderRating
        );
    }

    // Get rider names (you might want to optimize this with a single query)
    const ridersWithNames = await Promise.all(
      sortedRiders.slice(0, parseInt(limit)).map(async (stats) => {
        try {
          const rider = await db.getDocument(
            env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
            env.RIDER_COLLECTION_ID,
            stats.riderId
          );
          return {
            ...stats,
            riderName: rider.name,
            riderPhone: rider.phone,
          };
        } catch (error) {
          return {
            ...stats,
            riderName: "Unknown Rider",
            riderPhone: "",
          };
        }
      })
    );

    console.log(
      `✅ Rider performance: ${ridersWithNames.length} riders analyzed`
    );

    res.json({
      success: true,
      riders: ridersWithNames,
      summary: {
        totalRiders: riderPerformance.length,
        totalRatings: ratings.documents.length,
        averageRating:
          ratings.documents.length > 0
            ? Math.round(
                (ratings.documents.reduce((sum, r) => sum + r.riderRating, 0) /
                  ratings.documents.length) *
                  10
              ) / 10
            : 0,
      },
    });
  } catch (error) {
    console.error("Get rider performance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch rider performance",
    });
  }
};

/**
 * Get Individual Rider Analytics
 */
const getIndividualRiderAnalytics = async (req, res) => {
  try {
    const { riderId } = req.params;
    const { startDate, endDate } = req.query;

    console.log(`🎯 Getting analytics for rider: ${riderId}`);

    // Get rider info
    let riderInfo = { name: "Unknown Rider", phone: "", email: "" };
    try {
      const rider = await db.getDocument(
        env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
        env.RIDER_COLLECTION_ID,
        riderId
      );
      riderInfo = {
        name: rider.name,
        phone: rider.phone,
        email: rider.email || "",
        status: rider.status,
        joinedAt: rider.createdAt,
      };
    } catch (error) {
      console.log("Could not fetch rider info:", error.message);
    }

    // Get rider ratings
    const queries = [
      Query.equal("riderId", riderId),
      Query.equal("status", "active"),
      Query.limit(500),
      Query.orderDesc("createdAt"),
    ];

    if (startDate) {
      const startDateTime = new Date(
        startDate + "T00:00:00.000Z"
      ).toISOString();
      queries.push(Query.greaterThanEqual("createdAt", startDateTime));
    }

    if (endDate) {
      const endDateTime = new Date(endDate + "T23:59:59.999Z").toISOString();
      queries.push(Query.lessThanEqual("createdAt", endDateTime));
    }

    const ratings = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.RATINGS_COLLECTION_ID,
      queries
    );

    if (ratings.documents.length === 0) {
      return res.json({
        success: true,
        rider: riderInfo,
        analytics: {
          totalRatings: 0,
          averageRiderRating: 0,
          averageDeliveryRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          ratingTrends: [],
          recentRatings: [],
          customerFeedback: [],
        },
      });
    }

    // Calculate analytics
    const analytics = {
      totalRatings: ratings.documents.length,
      averageRiderRating: 0,
      averageDeliveryRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      ratingTrends: [],
      recentRatings: [],
      customerFeedback: [],
    };

    let totalRiderRating = 0;
    let totalDeliveryRating = 0;

    ratings.documents.forEach((rating) => {
      totalRiderRating += rating.riderRating;
      totalDeliveryRating += rating.deliveryRating || rating.riderRating;
      analytics.ratingDistribution[rating.riderRating]++;
    });

    analytics.averageRiderRating =
      Math.round((totalRiderRating / ratings.documents.length) * 10) / 10;
    analytics.averageDeliveryRating =
      Math.round((totalDeliveryRating / ratings.documents.length) * 10) / 10;

    // Rating trends (group by week)
    const trends = {};
    ratings.documents.forEach((rating) => {
      const date = new Date(rating.createdAt);
      const weekStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - date.getDay()
      );
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!trends[weekKey]) {
        trends[weekKey] = { date: weekKey, ratings: [], count: 0, average: 0 };
      }

      trends[weekKey].ratings.push(rating.riderRating);
      trends[weekKey].count++;
    });

    analytics.ratingTrends = Object.values(trends)
      .map((trend) => ({
        date: trend.date,
        count: trend.count,
        average:
          Math.round(
            (trend.ratings.reduce((sum, r) => sum + r, 0) / trend.count) * 10
          ) / 10,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-12); // Last 12 weeks

    // Recent ratings
    analytics.recentRatings = ratings.documents.slice(0, 20).map((rating) => ({
      id: rating.$id,
      customerName: rating.customerName,
      riderRating: rating.riderRating,
      deliveryRating: rating.deliveryRating,
      comment: rating.comment,
      orderId: rating.orderId,
      deliveryId: rating.deliveryId,
      createdAt: rating.createdAt,
    }));

    // Customer feedback (ratings with comments)
    analytics.customerFeedback = ratings.documents
      .filter((rating) => rating.comment && rating.comment.trim().length > 5)
      .slice(0, 10)
      .map((rating) => ({
        customerName: rating.customerName,
        riderRating: rating.riderRating,
        comment: rating.comment,
        createdAt: rating.createdAt,
      }));

    console.log(
      `✅ Individual rider analytics: ${analytics.totalRatings} ratings, ${analytics.averageRiderRating}/5 avg`
    );

    res.json({
      success: true,
      rider: riderInfo,
      analytics,
    });
  } catch (error) {
    console.error("Get individual rider analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch rider analytics",
    });
  }
};

/**
 * Get Rating Trends Over Time
 */
const getRatingTrends = async (req, res) => {
  try {
    const { period = "week", startDate, endDate } = req.query; // week, month, day

    console.log(`📈 Getting rating trends by ${period}...`);

    const queries = [Query.equal("status", "active"), Query.limit(1000)];

    if (startDate) {
      const startDateTime = new Date(
        startDate + "T00:00:00.000Z"
      ).toISOString();
      queries.push(Query.greaterThanEqual("createdAt", startDateTime));
    }

    if (endDate) {
      const endDateTime = new Date(endDate + "T23:59:59.999Z").toISOString();
      queries.push(Query.lessThanEqual("createdAt", endDateTime));
    }

    const ratings = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.RATINGS_COLLECTION_ID,
      queries
    );

    const trends = {};

    ratings.documents.forEach((rating) => {
      const date = new Date(rating.createdAt);
      let periodKey;

      switch (period) {
        case "day":
          periodKey = date.toISOString().split("T")[0];
          break;
        case "month":
          periodKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;
          break;
        default: // week
          const weekStart = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() - date.getDay()
          );
          periodKey = weekStart.toISOString().split("T")[0];
      }

      if (!trends[periodKey]) {
        trends[periodKey] = {
          period: periodKey,
          totalRatings: 0,
          ratingSum: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      trends[periodKey].totalRatings++;
      trends[periodKey].ratingSum += rating.riderRating;
      trends[periodKey].ratingDistribution[rating.riderRating]++;
    });

    const trendData = Object.values(trends)
      .map((trend) => ({
        ...trend,
        averageRating:
          Math.round((trend.ratingSum / trend.totalRatings) * 10) / 10,
      }))
      .sort((a, b) => new Date(a.period) - new Date(b.period));

    console.log(`✅ Rating trends: ${trendData.length} ${period}s analyzed`);

    res.json({
      success: true,
      trends: trendData,
      summary: {
        totalPeriods: trendData.length,
        totalRatings: ratings.documents.length,
        overallAverage:
          ratings.documents.length > 0
            ? Math.round(
                (ratings.documents.reduce((sum, r) => sum + r.riderRating, 0) /
                  ratings.documents.length) *
                  10
              ) / 10
            : 0,
      },
    });
  } catch (error) {
    console.error("Get rating trends error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch rating trends",
    });
  }
};

/**
 * Get Customer Feedback Analysis
 */
const getCustomerFeedback = async (req, res) => {
  try {
    const { limit = 50, minRating, maxRating, hasComment } = req.query;

    console.log("💬 Getting customer feedback analysis...");

    const queries = [
      Query.equal("status", "active"),
      Query.limit(parseInt(limit)),
      Query.orderDesc("createdAt"),
    ];

    if (minRating) {
      queries.push(Query.greaterThanEqual("riderRating", parseInt(minRating)));
    }

    if (maxRating) {
      queries.push(Query.lessThanEqual("riderRating", parseInt(maxRating)));
    }

    const ratings = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.RATINGS_COLLECTION_ID,
      queries
    );

    let feedback = ratings.documents.map((rating) => ({
      id: rating.$id,
      customerName: rating.customerName,
      riderId: rating.riderId,
      riderRating: rating.riderRating,
      deliveryRating: rating.deliveryRating,
      comment: rating.comment,
      orderId: rating.orderId,
      createdAt: rating.createdAt,
    }));

    // Filter by comment presence if specified
    if (hasComment === "true") {
      feedback = feedback.filter(
        (f) => f.comment && f.comment.trim().length > 0
      );
    } else if (hasComment === "false") {
      feedback = feedback.filter(
        (f) => !f.comment || f.comment.trim().length === 0
      );
    }

    // Analyze sentiment (basic analysis)
    const analysis = {
      totalFeedback: feedback.length,
      withComments: feedback.filter(
        (f) => f.comment && f.comment.trim().length > 0
      ).length,
      averageRating:
        feedback.length > 0
          ? Math.round(
              (feedback.reduce((sum, f) => sum + f.riderRating, 0) /
                feedback.length) *
                10
            ) / 10
          : 0,
      ratingBreakdown: {
        excellent: feedback.filter((f) => f.riderRating === 5).length,
        good: feedback.filter((f) => f.riderRating === 4).length,
        average: feedback.filter((f) => f.riderRating === 3).length,
        poor: feedback.filter((f) => f.riderRating === 2).length,
        terrible: feedback.filter((f) => f.riderRating === 1).length,
      },
      commonWords: getCommonWords(
        feedback.map((f) => f.comment).filter(Boolean)
      ),
    };

    console.log(
      `✅ Customer feedback: ${analysis.totalFeedback} total, ${analysis.withComments} with comments`
    );

    res.json({
      success: true,
      feedback,
      analysis,
    });
  } catch (error) {
    console.error("Get customer feedback error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customer feedback",
    });
  }
};

/**
 * Helper function to extract common words from comments
 */
function getCommonWords(comments, limit = 10) {
  const wordCount = {};
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "was",
    "is",
    "are",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "my",
    "your",
    "his",
    "our",
    "their",
  ]);

  comments.forEach((comment) => {
    if (!comment) return;

    const words = comment
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
  });

  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

module.exports = {
  getOverallRatingAnalytics,
  getRiderPerformance,
  getIndividualRiderAnalytics,
  getRatingTrends,
  getCustomerFeedback,
};
