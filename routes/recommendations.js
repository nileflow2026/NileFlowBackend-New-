const express = require("express");
const { Client } = require("node-appwrite");
const MultiTowerRecommendationService = require("../services/MultiTowerRecommendationService");
const { env } = require("../src/env");
const router = express.Router();

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

// Initialize recommendation service (singleton)
let recommendationService = null;

// Middleware to ensure service is initialized
async function ensureServiceInitialized(req, res, next) {
  try {
    if (!recommendationService) {
      recommendationService = new MultiTowerRecommendationService(client);
      await recommendationService.initialize();
    }
    next();
  } catch (error) {
    console.error("Error initializing recommendation service:", error);
    res.status(500).json({
      success: false,
      error: "Recommendation service initialization failed",
      message: error.message,
    });
  }
}

// ============================================================================
// MAIN RECOMMENDATION ENDPOINTS
// ============================================================================

/**
 * GET /api/recommendations/:userId
 * Get personalized recommendations for a user
 */
router.get("/:userId", ensureServiceInitialized, async (req, res) => {
  try {
    const startTime = Date.now();
    const userId = req.params.userId;

    // Extract query parameters
    const {
      sessionId = null,
      numRecommendations = 20,
      category = null,
      excludeItems = null,
      includeExploration = true,
      deviceType = "web",
      language = "en",
      country = null,
    } = req.query;

    // Build context from request
    const context = {
      deviceType: deviceType,
      language: language,
      country: country || req.headers["cf-ipcountry"] || "KE", // Default to Kenya
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
      category: category,

      // Add request context
      ip: req.ip,
      source: "api",
      endpoint: "get_recommendations",
    };

    // Parse excluded items
    let parsedExcludeItems = [];
    if (excludeItems) {
      try {
        parsedExcludeItems =
          typeof excludeItems === "string"
            ? excludeItems.split(",")
            : excludeItems;
      } catch (error) {
        console.warn("Error parsing excludeItems:", error);
      }
    }

    // Build recommendation request
    const requestData = {
      userId: userId,
      sessionId: sessionId,
      numRecommendations: Math.min(parseInt(numRecommendations), 50), // Cap at 50
      context: context,
      excludeItems: parsedExcludeItems,
      includeExploration:
        includeExploration === "true" || includeExploration === true,
      abTestParticipation: true,
    };

    console.log(
      `📊 Recommendation request for user ${userId}: ${numRecommendations} items`
    );

    // Get recommendations
    const result = await recommendationService.getRecommendations(requestData);

    // Add API metadata
    result.data.metadata = {
      ...result.data.metadata,
      apiVersion: "1.0",
      processingTime: Date.now() - startTime,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
    };

    console.log(
      "🔍 API Response:",
      JSON.stringify(
        {
          success: result.success,
          recommendationsCount: result.data.recommendations.length,
          total: result.data.total,
          hasRecommendations: Array.isArray(result.data.recommendations),
          firstItem: result.data.recommendations[0] || "none",
        },
        null,
        2
      )
    );

    res.json(result);
  } catch (error) {
    console.error("Error in recommendation API:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
      data: {
        recommendations: [],
        total: 0,
        metadata: {
          error: true,
          fallback: false,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
});

/**v
 * POST /api/recommendations/batch
 * Get recommendations for multiple users (batch processing)
 */
router.post("/batch", ensureServiceInitialized, async (req, res) => {
  try {
    const { requests } = req.body;

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid batch request format",
        message: "Expected array of recommendation requests",
      });
    }

    if (requests.length > 10) {
      return res.status(400).json({
        success: false,
        error: "Batch size too large",
        message: "Maximum 10 requests per batch",
      });
    }

    console.log(`📦 Batch recommendation request: ${requests.length} users`);

    // Process requests in parallel
    const batchPromises = requests.map(async (request, index) => {
      try {
        const result = await recommendationService.getRecommendations(request);
        return { index, success: true, data: result };
      } catch (error) {
        console.error(`Error processing batch request ${index}:`, error);
        return {
          index,
          success: false,
          error: error.message,
          data: {
            recommendations: [],
            total: 0,
            metadata: { error: true, timestamp: new Date().toISOString() },
          },
        };
      }
    });

    const results = await Promise.allSettled(batchPromises);

    // Format batch response
    const batchResponse = {
      success: true,
      data: {
        results: results.map((result) =>
          result.status === "fulfilled"
            ? result.value
            : {
                success: false,
                error: "Request processing failed",
              }
        ),
        total: requests.length,
        successful: results.filter(
          (r) => r.status === "fulfilled" && r.value.success
        ).length,
        metadata: {
          processingTime: Date.now() - Date.now(),
          timestamp: new Date().toISOString(),
        },
      },
    };

    res.json(batchResponse);
  } catch (error) {
    console.error("Error in batch recommendation API:", error);
    res.status(500).json({
      success: false,
      error: "Batch processing failed",
      message: error.message,
    });
  }
});

// ============================================================================
// FEEDBACK ENDPOINTS
// ============================================================================

/**
 * POST /api/recommendations/feedback
 * Process user feedback on recommendations
 */
router.post("/feedback", ensureServiceInitialized, async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      itemId,
      feedbackType, // 'impression', 'click', 'add_to_cart', 'purchase', 'ignore', 'remove_from_cart', 'return'
      requestId = null,
      position = null,
      purchaseAmount = null,
      context = {},
    } = req.body;

    // Validate required fields
    if (!userId || !itemId || !feedbackType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "userId, itemId, and feedbackType are required",
      });
    }

    // Validate feedback type
    const validFeedbackTypes = [
      "impression",
      "click",
      "add_to_cart",
      "purchase",
      "ignore",
      "remove_from_cart",
      "return",
    ];
    if (!validFeedbackTypes.includes(feedbackType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid feedback type",
        message: `feedbackType must be one of: ${validFeedbackTypes.join(
          ", "
        )}`,
      });
    }

    // Build feedback data
    const feedbackData = {
      userId: userId,
      sessionId: sessionId,
      itemId: itemId,
      feedbackType: feedbackType,
      requestId: requestId,
      position: position,
      purchaseAmount: purchaseAmount,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        deviceType: context.deviceType || req.headers["user-agent"],
        language: context.language || "en",
        source: "api",
      },
    };

    console.log(
      `💬 Processing feedback: ${feedbackType} for item ${itemId} from user ${userId}`
    );

    // Process feedback
    const success = await recommendationService.processFeedback(feedbackData);

    res.json({
      success: success,
      data: {
        processed: success,
        feedbackId: feedbackData.feedbackId,
        timestamp: feedbackData.timestamp,
      },
      message: success
        ? "Feedback processed successfully"
        : "Failed to process feedback",
    });
  } catch (error) {
    console.error("Error processing feedback:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process feedback",
      message: error.message,
    });
  }
});

/**
 * POST /api/recommendations/feedback/batch
 * Process multiple feedback events at once
 */
router.post("/feedback/batch", ensureServiceInitialized, async (req, res) => {
  try {
    const { feedbackEvents } = req.body;

    if (
      !feedbackEvents ||
      !Array.isArray(feedbackEvents) ||
      feedbackEvents.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid batch feedback format",
        message: "Expected array of feedback events",
      });
    }

    if (feedbackEvents.length > 50) {
      return res.status(400).json({
        success: false,
        error: "Batch size too large",
        message: "Maximum 50 feedback events per batch",
      });
    }

    console.log(
      `📦 Batch feedback processing: ${feedbackEvents.length} events`
    );

    // Process feedback events in parallel
    const feedbackPromises = feedbackEvents.map(async (feedback, index) => {
      try {
        const success = await recommendationService.processFeedback(feedback);
        return { index, success, feedbackId: feedback.feedbackId };
      } catch (error) {
        console.error(`Error processing batch feedback ${index}:`, error);
        return { index, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(feedbackPromises);
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;

    res.json({
      success: true,
      data: {
        total: feedbackEvents.length,
        successful: successful,
        failed: feedbackEvents.length - successful,
        results: results.map((r) =>
          r.status === "fulfilled" ? r.value : { success: false }
        ),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in batch feedback processing:", error);
    res.status(500).json({
      success: false,
      error: "Batch feedback processing failed",
      message: error.message,
    });
  }
});

/**
 * POST /api/recommendations/feedback/impressions
 * Track recommendation impressions for analytics and learning
 */
router.post(
  "/feedback/impressions",
  ensureServiceInitialized,
  async (req, res) => {
    try {
      const { impressions, userId } = req.body;

      if (
        !impressions ||
        !Array.isArray(impressions) ||
        impressions.length === 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid impressions format",
          message: "Expected array of impression events",
        });
      }

      // If no userId provided in body, log this for debugging
      if (!userId) {
        console.log(
          "⚠️ No userId provided in impression request body, using anonymous"
        );
      }

      if (impressions.length > 100) {
        return res.status(400).json({
          success: false,
          error: "Too many impressions",
          message: "Maximum 100 impressions per batch",
        });
      }

      // Process each impression
      const results = [];
      let successful = 0;

      for (const impression of impressions) {
        try {
          // Validate impression structure
          if (!impression.itemId || !impression.sessionId) {
            results.push({ success: false, error: "Missing required fields" });
            continue;
          }

          // Create standardized impression feedback
          const impressionFeedback = {
            userId: userId || impression.userId || "anonymous", // Use body userId first, then impression userId, then anonymous
            itemId: impression.itemId,
            sessionId: impression.sessionId,
            feedbackType: "impression",
            position: impression.position || 0,
            context: impression.context || "recommendation_display",
            timestamp: impression.timestamp || Date.now(),
            metadata: {
              deviceType: impression.deviceType || "unknown",
              source: "frontend_tracking",
            },
          };

          // Process the impression through the feedback system
          const result = await recommendationService.processFeedback(
            impressionFeedback
          );

          if (result) {
            successful++;
            results.push({ success: true });
          } else {
            results.push({ success: false, error: "Processing failed" });
          }
        } catch (error) {
          console.error("Error processing impression:", error);
          results.push({ success: false, error: error.message });
        }
      }

      console.log(
        `📊 Processed ${successful}/${impressions.length} impressions`
      );
      console.log(
        `💾 Impressions stored in collection: ${
          env.RECOMMENDATION_FEEDBACK_COLLECTION_ID ? "✅" : "❌"
        } (${env.RECOMMENDATION_FEEDBACK_COLLECTION_ID || "MISSING"})`
      );

      res.json({
        success: true,
        data: {
          total: impressions.length,
          successful: successful,
          failed: impressions.length - successful,
          message: `Successfully tracked ${successful} impressions`,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error in impressions processing:", error);
      res.status(500).json({
        success: false,
        error: "Impressions processing failed",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/recommendations/feedback/clicks
 * Track recommendation clicks for analytics and learning
 */
router.post("/feedback/clicks", ensureServiceInitialized, async (req, res) => {
  try {
    const { clicks } = req.body;

    if (!clicks || !Array.isArray(clicks) || clicks.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid clicks format",
        message: "Expected array of click events",
      });
    }

    let successful = 0;

    // Process each click event
    for (const click of clicks) {
      try {
        const { userId, itemId, sessionId, timestamp, position } = click;

        if (!userId || !itemId) {
          console.warn(
            "Invalid click event - missing userId or itemId:",
            click
          );
          continue;
        }

        // Track click feedback (using the same method and format as main feedback endpoint)
        const feedbackData = {
          userId: userId,
          sessionId: sessionId,
          itemId: itemId,
          feedbackType: "click",
          requestId: null,
          position: position || null,
          purchaseAmount: null,
          timestamp: timestamp || new Date().toISOString(),
          context: {
            source: "api",
            endpoint: "clicks",
          },
        };

        await recommendationService.processFeedback(feedbackData);

        successful++;
      } catch (clickError) {
        console.error("Error tracking individual click:", clickError);
      }
    }

    res.json({
      success: true,
      data: {
        total: clicks.length,
        successful: successful,
        failed: clicks.length - successful,
        message: `Successfully tracked ${successful} clicks`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in clicks processing:", error);
    res.status(500).json({
      success: false,
      error: "Clicks processing failed",
      message: error.message,
    });
  }
});

// ============================================================================
// ANALYTICS AND MONITORING ENDPOINTS
// ============================================================================

/**
 * GET /api/recommendations/metrics
 * Get system performance metrics
 */
router.get("/metrics", ensureServiceInitialized, async (req, res) => {
  try {
    const metrics = await recommendationService.getSystemMetrics();

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting system metrics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve metrics",
      message: error.message,
    });
  }
});

/**
 * GET /api/recommendations/health
 * System health check endpoint
 */
router.get("/health", ensureServiceInitialized, async (req, res) => {
  try {
    const isHealthy = await recommendationService.checkSystemHealth();
    const systemHealth = recommendationService.systemHealth;

    const healthStatus = {
      status: isHealthy ? "healthy" : "unhealthy",
      degradedMode: systemHealth.degradedMode,
      towers: Object.fromEntries(systemHealth.towerStatus),
      lastCheck: systemHealth.lastHealthCheck,
      timestamp: new Date().toISOString(),
    };

    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json({
      success: isHealthy,
      data: healthStatus,
    });
  } catch (error) {
    console.error("Error checking system health:", error);
    res.status(503).json({
      success: false,
      error: "Health check failed",
      data: {
        status: "error",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/recommendations/analytics/:userId
 * Get user-specific recommendation analytics
 */
router.get("/analytics/:userId", ensureServiceInitialized, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { timeframe = "7d" } = req.query;

    // This would typically fetch from the feedback system
    const analytics = {
      userId: userId,
      timeframe: timeframe,
      totalRecommendations: 150,
      clickThroughRate: 0.12,
      purchaseRate: 0.03,
      addToCartRate: 0.08,
      topCategories: [
        { category: "Electronics", count: 45 },
        { category: "Fashion", count: 32 },
        { category: "Home & Garden", count: 28 },
      ],
      culturalRelevanceScore: 0.78,
      explorationRate: 0.15,
      lastActivity: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting user analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve user analytics",
      message: error.message,
    });
  }
});

// ============================================================================
// ADMIN ENDPOINTS (for testing and configuration)
// ============================================================================

/**
 * POST /api/recommendations/admin/clear-cache
 * Clear recommendation cache (admin only)
 */
router.post(
  "/admin/clear-cache",
  ensureServiceInitialized,
  async (req, res) => {
    try {
      // Add admin authentication here in production

      recommendationService.recommendationCache.clear();
      recommendationService.cacheStats = { hits: 0, misses: 0 };

      res.json({
        success: true,
        data: {
          message: "Cache cleared successfully",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error clearing cache:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear cache",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/recommendations/admin/weights/update
 * Update fusion weights configuration (admin only)
 */
router.post(
  "/admin/weights/update",
  ensureServiceInitialized,
  async (req, res) => {
    try {
      // Add admin authentication here in production

      const { configId, weights } = req.body;

      if (!configId || !weights) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
          message: "configId and weights are required",
        });
      }

      // Update weights configuration
      const newConfigId =
        await recommendationService.weightsSystem.createWeightConfiguration(
          weights
        );

      res.json({
        success: true,
        data: {
          configId: newConfigId,
          weights: weights,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error updating weights:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update weights",
        message: error.message,
      });
    }
  }
);

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

router.use((error, req, res, next) => {
  console.error("Recommendation API error:", error);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
