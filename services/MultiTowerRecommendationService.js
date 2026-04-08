const { Databases, Query } = require("node-appwrite");
const { env } = require("../src/env");

// Import all tower systems
const UserIntentTower = require("./towers/UserIntentTower");
const ItemRepresentationTower = require("./towers/ItemRepresentationTower");
const ContextCultureTower = require("./towers/ContextCultureTower");
const SocialProofTrustTower = require("./towers/SocialProofTrustTower");
const BusinessSupplyTower = require("./towers/BusinessSupplyTower");

// Import fusion and exploration systems
const FusionLayer = require("./FusionLayer");
const ExplorationLayer = require("./ExplorationLayer");

// Import learning systems
const FeedbackLoopSystem = require("./FeedbackLoopSystem");
const ConfigDrivenWeightsSystem = require("./ConfigDrivenWeightsSystem");

/**
 * Multi-Tower Recommendation Service - Simplified Working Version
 *
 * This is a simplified version that works without the full tower dependencies.
 * It provides mock recommendations with the same API structure as the full system.
 */

class MultiTowerRecommendationService {
  constructor(appwriteClient, databaseId = null) {
    this.client = appwriteClient;
    this.databases = new Databases(appwriteClient);
    this.databaseId = databaseId || env.APPWRITE_DATABASE_ID;

    // Initialize all tower systems
    this.userIntentTower = new UserIntentTower(appwriteClient, this.databaseId);
    this.itemRepresentationTower = new ItemRepresentationTower(
      appwriteClient,
      this.databaseId
    );
    this.contextCultureTower = new ContextCultureTower(
      appwriteClient,
      this.databaseId
    );
    this.socialProofTrustTower = new SocialProofTrustTower(
      appwriteClient,
      this.databaseId
    );
    this.businessSupplyTower = new BusinessSupplyTower(
      appwriteClient,
      this.databaseId
    );

    // Initialize coordination systems
    this.fusionLayer = new FusionLayer(appwriteClient, this.databaseId);
    this.explorationLayer = new ExplorationLayer(
      appwriteClient,
      this.databaseId
    );
    this.feedbackSystem = new FeedbackLoopSystem(
      appwriteClient,
      this.databaseId
    );
    this.weightsSystem = new ConfigDrivenWeightsSystem(
      appwriteClient,
      this.databaseId
    );

    // System configuration
    this.SYSTEM_CONFIG = {
      MAX_RECOMMENDATIONS: 50,
      DEFAULT_RECOMMENDATIONS: 20,
      CACHE_TTL: 5 * 60, // 5 minutes
      MIN_QUALITY_SCORE: 0.3,
      MIN_TRUST_SCORE: 0.2,
      MAX_BUSINESS_INFLUENCE: 0.4,
      ENABLE_CULTURAL_BOOST: true,
      CULTURAL_WEIGHT_MULTIPLIER: 1.2,
      MIN_TOWERS_REQUIRED: 3,
      DEGRADED_MODE_THRESHOLD: 2,
      REQUEST_TIMEOUT: 10000,
      ENABLE_PERFORMANCE_TRACKING: true,
      LOG_DETAILED_METRICS: true,
    };

    // Mock product data
    this.mockProducts = [
      {
        id: "1",
        name: "Samsung Galaxy A54 5G",
        price: 350000,
        currency: "NGN",
        imageUrl: "https://via.placeholder.com/300x300?text=Galaxy+A54",
        rating: 4.3,
        category: "Electronics",
        culturalRelevance: 0.8,
        trustScore: 0.9,
      },
      {
        id: "2",
        name: "Nike Air Force 1",
        price: 85000,
        currency: "NGN",
        imageUrl: "https://via.placeholder.com/300x300?text=Air+Force+1",
        rating: 4.5,
        category: "Fashion",
        culturalRelevance: 0.7,
        trustScore: 0.85,
      },
      {
        id: "3",
        name: "Ankara Print Dress",
        price: 25000,
        currency: "NGN",
        imageUrl: "https://via.placeholder.com/300x300?text=Ankara+Dress",
        rating: 4.7,
        category: "Fashion",
        culturalRelevance: 0.95, // High cultural relevance
        trustScore: 0.8,
      },
    ];
  }

  async initialize() {
    try {
      // console.log("🚀 Initializing Multi-Tower Recommendation Service...");

      // Initialize system state first
      this.systemHealth = {
        isHealthy: true,
        towerStatus: new Map(),
        lastHealthCheck: new Date().toISOString(),
        degradedMode: false,
      };

      this.recommendationCache = new Map();
      this.cacheStats = { hits: 0, misses: 0 };

      this.metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
      };

      // Initialize all towers with graceful fallback
      const towerInitPromises = [
        this.initializeTowerSafely("UserIntent", this.userIntentTower),
        this.initializeTowerSafely(
          "ItemRepresentation",
          this.itemRepresentationTower
        ),
        this.initializeTowerSafely("ContextCulture", this.contextCultureTower),
        this.initializeTowerSafely(
          "SocialProofTrust",
          this.socialProofTrustTower
        ),
        this.initializeTowerSafely("BusinessSupply", this.businessSupplyTower),
      ];

      const towerResults = await Promise.allSettled(towerInitPromises);
      let healthyTowers = 0;

      towerResults.forEach((result, index) => {
        const towerNames = [
          "UserIntent",
          "ItemRepresentation",
          "ContextCulture",
          "SocialProofTrust",
          "BusinessSupply",
        ];
        const towerName = towerNames[index];

        if (result.status === "fulfilled" && result.value) {
          this.systemHealth.towerStatus.set(towerName, true);
          healthyTowers++;
        } else {
          console.warn(
            `⚠️ ${towerName} tower failed to initialize:`,
            result.reason
          );
          this.systemHealth.towerStatus.set(towerName, false);
        }
      });

      // Initialize coordination systems with fallback
      await this.initializeCoordinationSystems();

      // Set system health based on tower status
      this.systemHealth.isHealthy =
        healthyTowers >= this.SYSTEM_CONFIG.MIN_TOWERS_REQUIRED;
      this.systemHealth.degradedMode =
        healthyTowers < this.SYSTEM_CONFIG.DEGRADED_MODE_THRESHOLD;

      if (this.systemHealth.degradedMode) {
        console.warn(
          `⚠️ System running in degraded mode (${healthyTowers}/5 towers healthy)`
        );
      }

      // Start periodic tasks
      setInterval(() => {
        this.cleanCache();
      }, 300000); // Clean cache every 5 minutes

      // console.log(
      //   `✅ Multi-Tower Recommendation Service initialized (${healthyTowers}/5 towers healthy)`
      // );
      return true;
    } catch (error) {
      console.error(
        "Error initializing Multi-Tower Recommendation Service:",
        error
      );
      throw error;
    }
  }

  async initializeTowerSafely(towerName, tower) {
    try {
      if (tower && typeof tower.initialize === "function") {
        await tower.initialize();
        // console.log(`✅ ${towerName} tower initialized`);
        return true;
      } else {
        // console.log(
        //   `ℹ️ ${towerName} tower has no initialize method, marking as ready`
        // );
        return true;
      }
    } catch (error) {
      console.error(
        `❌ ${towerName} tower initialization failed:`,
        error.message
      );
      return false;
    }
  }

  async initializeCoordinationSystems() {
    try {
      const systems = [
        { name: "FusionLayer", system: this.fusionLayer },
        { name: "ExplorationLayer", system: this.explorationLayer },
        { name: "FeedbackSystem", system: this.feedbackSystem },
        { name: "WeightsSystem", system: this.weightsSystem },
      ];

      for (const { name, system } of systems) {
        try {
          if (system && typeof system.initialize === "function") {
            await system.initialize();
            // console.log(`✅ ${name} initialized`);
          }
        } catch (error) {
          console.warn(
            `⚠️ ${name} initialization failed, continuing without:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.warn(
        "Some coordination systems failed to initialize:",
        error.message
      );
    }
  }

  async getRecommendations(requestData) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const {
        userId,
        sessionId,
        numRecommendations = this.SYSTEM_CONFIG.DEFAULT_RECOMMENDATIONS,
        context = {},
        excludeItems = [],
        includeExploration = true,
      } = requestData;

      // console.log(`🔍 Processing recommendation request for user ${userId}`);

      // Check cache
      const cacheKey = this.generateCacheKey(requestData);
      const cachedResult = this.getCachedRecommendations(cacheKey);
      if (cachedResult) {
        this.metrics.successfulRequests++;
        return this.formatResponse(cachedResult, {
          cached: true,
          latency: Date.now() - startTime,
        });
      }

      // Get dynamic fusion weights
      const fusionWeights = this.weightsSystem?.getFusionWeights
        ? await this.weightsSystem.getFusionWeights(userId, context)
        : this.getFusionWeights(context);

      // Process recommendations using towers
      const recommendations = await this.processRecommendationRequest({
        ...requestData,
        fusionWeights,
      });

      const result = {
        recommendations: recommendations,
        metadata: {
          userId: userId,
          sessionId: sessionId || `session_${Date.now()}`,
          fusionWeights: fusionWeights,
          culturalBoost: this.getCulturalBoost(context),
          explorationApplied: includeExploration,
          towerHealth: Object.fromEntries(this.systemHealth.towerStatus),
          processingTime: Date.now() - startTime,
        },
      };

      // Cache results
      this.cacheRecommendations(cacheKey, result);

      this.metrics.successfulRequests++;
      // console.log(
      //   `✅ Generated ${recommendations.length} recommendations for user ${userId}`
      // );

      // Log collection connection status for debugging
      // console.log(`📊 Collection Status Check:`);
      // console.log(
      //   `   User Sessions: ${env.USER_SESSIONS_COLLECTION_ID ? "✅" : "❌"} (${
      //     env.USER_SESSIONS_COLLECTION_ID || "MISSING"
      //   })`
      // );
      // console.log(
      //   `   Context Profiles: ${
      //     env.CONTEXT_PROFILES_COLLECTION_ID ? "✅" : "❌"
      //   } (${env.CONTEXT_PROFILES_COLLECTION_ID || "MISSING"})`
      // );
      // console.log(
      //   `   Social Signals: ${
      //     env.ITEM_SOCIAL_SIGNALS_COLLECTION_ID ? "✅" : "❌"
      //   } (${env.ITEM_SOCIAL_SIGNALS_COLLECTION_ID || "MISSING"})`
      // );
      // console.log(
      //   `   Feedback: ${
      //     env.RECOMMENDATION_FEEDBACK_COLLECTION_ID ? "✅" : "❌"
      //   } (${env.RECOMMENDATION_FEEDBACK_COLLECTION_ID || "MISSING"})`
      // );
      // console.log(
      //   `   Weights: ${
      //     env.RECOMMENDATION_WEIGHTS_COLLECTION_ID ? "✅" : "❌"
      //   } (${env.RECOMMENDATION_WEIGHTS_COLLECTION_ID || "MISSING"})`
      // );
      // console.log(
      //   `   Exploration: ${
      //     env.EXPLORATION_PATTERNS_COLLECTION_ID ? "✅" : "❌"
      //   } (${env.EXPLORATION_PATTERNS_COLLECTION_ID || "MISSING"})`
      // );

      return this.formatResponse(result, {
        latency: Date.now() - startTime,
        cached: false,
      });
    } catch (error) {
      this.metrics.failedRequests++;
      console.error("Error generating recommendations:", error);

      const fallback = this.getFallbackRecommendations(requestData);
      return this.formatResponse(fallback, {
        error: true,
        fallback: true,
        latency: Date.now() - startTime,
      });
    }
  }

  applyCulturalIntelligence(recommendations, context) {
    const culturalBoost = this.getCulturalBoost(context);

    return recommendations.map((rec) => ({
      ...rec,
      finalScore:
        (rec.rating / 5.0) *
        (1 + (rec.culturalRelevance || 0.5) * (culturalBoost - 1)),
    }));
  }

  getCulturalBoost(context) {
    let boost = 1.0;

    // African country boost
    const africanCountries = ["NG", "GH", "KE", "ZA", "EG"];
    if (africanCountries.includes(context.country)) {
      boost = 1.15;
    }

    return boost;
  }

  getFusionWeights(context) {
    return {
      INTENT_WEIGHT: 0.3,
      ITEM_WEIGHT: 0.25,
      CONTEXT_WEIGHT: 0.2,
      TRUST_WEIGHT: 0.15,
      BUSINESS_WEIGHT: 0.1,
    };
  }

  async processRecommendationRequest(requestData) {
    try {
      const {
        userId,
        sessionId,
        context,
        numRecommendations,
        excludeItems,
        includeExploration,
        fusionWeights,
      } = requestData;

      // console.log(`🏢 Processing with towers for user ${userId}`);

      // Compute tower scores in parallel with timeout protection
      const towerPromises = [
        this.computeWithTimeout("UserIntent", () =>
          this.userIntentTower.computeUserIntent(userId, sessionId, context)
        ),
        this.computeWithTimeout("ItemRepresentation", () =>
          this.itemRepresentationTower.computeBatchRepresentations(
            this.getTopItemIds(numRecommendations * 3)
          )
        ),
        this.computeWithTimeout("ContextCulture", () =>
          this.contextCultureTower.computeContextualRelevance(userId, context)
        ),
        this.computeWithTimeout("SocialProofTrust", () =>
          this.socialProofTrustTower.computeTrustAndRisk(userId, context)
        ),
        this.computeWithTimeout("BusinessSupply", () =>
          this.businessSupplyTower.computeBusinessOptimization(userId, context)
        ),
      ];

      const towerResults = await Promise.allSettled(towerPromises);
      const towerData = this.processTowerResults(towerResults);

      // If too many towers failed, use fallback
      if (towerData.healthyTowers < this.SYSTEM_CONFIG.MIN_TOWERS_REQUIRED) {
        console.warn("Using fallback due to tower failures");
        return this.getFallbackRecommendations(requestData).recommendations;
      }

      // Fuse tower outputs - convert tower data to items array
      const itemCandidates = await this.extractItemCandidatesFromTowers(
        towerData.results
      );
      const fusedCandidates = await this.fusionLayer.fuseRecommendations(
        itemCandidates,
        { userId, context, excludeItems },
        "default"
      );

      // Apply exploration if enabled
      let finalRecommendations = fusedCandidates;
      if (includeExploration) {
        finalRecommendations = await this.explorationLayer.applyExploration(
          fusedCandidates,
          { userId, sessionId, context, numRecommendations }
        );
      }

      // Apply final filtering
      return this.applyFinalFiltering(finalRecommendations, {
        excludeItems,
        numRecommendations,
        context,
      });
    } catch (error) {
      console.error("Error in tower processing:", error);
      // Fallback to simple recommendations
      return this.getFallbackRecommendations(requestData).recommendations;
    }
  }

  async computeWithTimeout(towerName, computation, timeout = 5000) {
    try {
      return await Promise.race([
        computation(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`${towerName} tower timeout`)),
            timeout
          )
        ),
      ]);
    } catch (error) {
      console.warn(`${towerName} tower failed:`, error.message);
      return this.getEmptyTowerResult(towerName);
    }
  }

  processTowerResults(towerResults) {
    const results = {};
    const towerHealth = {};
    let healthyTowers = 0;

    const towers = [
      "UserIntent",
      "ItemRepresentation",
      "ContextCulture",
      "SocialProofTrust",
      "BusinessSupply",
    ];

    for (let i = 0; i < towerResults.length; i++) {
      const towerName = towers[i];
      const result = towerResults[i];

      if (result.status === "fulfilled" && result.value) {
        results[towerName] = result.value;
        towerHealth[towerName] = "healthy";
        healthyTowers++;
      } else {
        console.warn(`${towerName} tower failed:`, result.reason?.message);
        results[towerName] = this.getEmptyTowerResult(towerName);
        towerHealth[towerName] = "failed";
      }
    }

    return { results, towerHealth, healthyTowers };
  }

  getEmptyTowerResult(towerName) {
    switch (towerName) {
      case "UserIntent":
        return { intentEmbedding: new Array(128).fill(0), confidence: 0 };
      case "ItemRepresentation":
        return new Map(); // Empty Map for batch processing
      case "ContextCulture":
        return { culturalBoosts: {}, contextScores: {}, confidence: 0 };
      case "SocialProofTrust":
        return { trustScores: {}, socialBoosts: {}, riskScores: {} };
      case "BusinessSupply":
        return { businessBoosts: {}, inventoryScores: {}, marginImpacts: {} };
      default:
        return {};
    }
  }

  applyFinalFiltering(recommendations, options) {
    const { excludeItems, numRecommendations, context } = options;

    let filtered = recommendations || [];

    // Remove excluded items
    if (excludeItems && excludeItems.length > 0) {
      filtered = filtered.filter(
        (rec) => !excludeItems.includes(rec.itemId || rec.id)
      );
    }

    // Apply quality threshold
    filtered = filtered.filter(
      (rec) =>
        (rec.finalScore || rec.score || 0) >=
        this.SYSTEM_CONFIG.MIN_QUALITY_SCORE
    );

    // Sort by final score
    filtered.sort(
      (a, b) => (b.finalScore || b.score || 0) - (a.finalScore || a.score || 0)
    );

    // Take top N recommendations
    return filtered.slice(0, numRecommendations);
  }

  generateCacheKey(requestData) {
    const { userId, numRecommendations, context } = requestData;
    return `rec_${userId}_${numRecommendations}_${JSON.stringify(context)}`;
  }

  getCachedRecommendations(cacheKey) {
    const cached = this.recommendationCache.get(cacheKey);
    if (!cached) {
      this.cacheStats.misses++;
      return null;
    }

    if (Date.now() - cached.timestamp > this.SYSTEM_CONFIG.CACHE_TTL * 1000) {
      this.recommendationCache.delete(cacheKey);
      this.cacheStats.misses++;
      return null;
    }

    this.cacheStats.hits++;
    return cached.data;
  }

  cacheRecommendations(cacheKey, recommendations) {
    this.recommendationCache.set(cacheKey, {
      data: recommendations,
      timestamp: Date.now(),
    });
  }

  cleanCache() {
    const now = Date.now();
    const ttl = this.SYSTEM_CONFIG.CACHE_TTL * 1000;

    for (const [key, value] of this.recommendationCache.entries()) {
      if (now - value.timestamp > ttl) {
        this.recommendationCache.delete(key);
      }
    }
  }

  async processFeedback(feedbackData) {
    try {
      // console.log(
      //   `💬 Feedback received: ${feedbackData.feedbackType} for item ${feedbackData.itemId}`
      // );

      // Use the actual feedback system to process and store the feedback
      const result = await this.feedbackSystem.processFeedback(feedbackData);

      if (result) {
        // console.log(
        //   `✅ Feedback successfully processed and stored to database`
        // );
      } else {
        // console.log(`❌ Feedback processing failed`);
      }

      return result;
    } catch (error) {
      console.error("Error processing feedback:", error);
      return false;
    }
  }

  getFallbackRecommendations(requestData) {
    const { numRecommendations = this.SYSTEM_CONFIG.DEFAULT_RECOMMENDATIONS } =
      requestData;

    const fallback = this.mockProducts
      .sort((a, b) => b.rating - a.rating)
      .slice(0, numRecommendations);

    return {
      recommendations: fallback,
      metadata: {
        fallback: true,
        fusionWeights: this.getFusionWeights({}),
        culturalBoost: 1.0,
      },
    };
  }

  async checkSystemHealth() {
    try {
      this.systemHealth.lastHealthCheck = new Date().toISOString();
      this.systemHealth.degradedMode = false;
      return true;
    } catch (error) {
      console.error("Health check failed:", error);
      this.systemHealth.degradedMode = true;
      return false;
    }
  }

  async getSystemMetrics() {
    const cacheHitRate =
      this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) ||
      0;

    return {
      cacheStats: this.cacheStats,
      systemHealth: this.systemHealth,
      totalRequests: this.metrics.totalRequests,
      cacheHitRate: cacheHitRate,
    };
  }

  formatResponse(recommendations, metadata = {}) {
    return {
      success: !metadata.error,
      data: {
        recommendations: recommendations.recommendations || recommendations,
        total: (recommendations.recommendations || recommendations).length,
        metadata: {
          ...metadata,
          ...(recommendations.metadata || {}),
          timestamp: new Date().toISOString(),
        },
      },
    };
  }
  // Helper method to get top item IDs for batch processing
  async getTopItemIds(limit = 50) {
    try {
      // console.log("🔍 Attempting to fetch product IDs from database...");
      // console.log(
      //   "📋 Products collection ID:",
      //   env.APPWRITE_PRODUCT_COLLECTION_ID
      // );
      // console.log("🗄️ Database ID:", this.databaseId);

      // Get real products from your database
      if (env.APPWRITE_PRODUCT_COLLECTION_ID) {
        const response = await this.databases.listDocuments(
          this.databaseId,
          env.APPWRITE_PRODUCT_COLLECTION_ID,
          [
            Query.limit(limit),
            Query.orderDesc("$createdAt"), // Get newest products first
          ]
        );

        // console.log(
        //   `✅ Successfully fetched ${response.documents.length} product IDs from database`
        // );
        const productIds = response.documents.map((doc) => doc.$id);
        // console.log("📦 First 5 product IDs:", productIds.slice(0, 5));
        return productIds;
      } else {
        // console.warn(
        //   "⚠️ APPWRITE_PRODUCT_COLLECTION_ID not configured, using fallback"
        // );
      }
    } catch (error) {
      console.error("❌ Failed to fetch product IDs:", {
        message: error.message,
        code: error.code,
        type: error.type,
        collectionId: env.APPWRITE_PRODUCT_COLLECTION_ID,
        databaseId: this.databaseId,
      });
    }

    // Fallback to mock IDs if database fetch fails
    // console.log("🔄 Using mock product IDs as fallback");
    return Array.from({ length: limit }, (_, i) => `item_${i + 1}`);
  }

  // Extract item candidates from tower results
  async extractItemCandidatesFromTowers(towerResults) {
    const items = [];

    // Get items from ItemRepresentation tower if available
    if (
      towerResults.ItemRepresentation &&
      towerResults.ItemRepresentation.size
    ) {
      // If it's a Map from batch processing
      for (const [itemId, data] of towerResults.ItemRepresentation) {
        const productData = await this.fetchProductData(itemId);
        items.push({
          itemId: itemId,
          itemEmbedding: data.itemEmbedding || [],
          category: data.category || "general",
          finalScore: 0.5,
          ...data,
          ...productData, // Add real product data
        });
      }
    } else if (
      towerResults.ItemRepresentation &&
      towerResults.ItemRepresentation.candidates
    ) {
      // If it has candidates array
      for (const candidate of towerResults.ItemRepresentation.candidates) {
        const productData = await this.fetchProductData(candidate.itemId);
        items.push({
          ...candidate,
          ...productData, // Add real product data
        });
      }
    }

    // If no items found, get some real products as fallback
    if (items.length === 0) {
      const productIds = await this.getTopItemIds(10);
      for (const itemId of productIds) {
        const productData = await this.fetchProductData(itemId);
        items.push({
          itemId: itemId,
          category: "general",
          finalScore: Math.random() * 0.5 + 0.5,
          fallback: true,
          ...productData, // Add real product data
        });
      }
    }

    return items;
  }

  // Fetch product data from database
  async fetchCategoryName(categoryId) {
    try {
      if (!env.APPWRITE_CATEGORIES_COLLECTION_ID || !categoryId) {
        return null;
      }

      const category = await this.databases.getDocument(
        this.databaseId,
        env.APPWRITE_CATEGORIES_COLLECTION_ID,
        categoryId
      );

      return category.name || category.categoryName || category.title || null;
    } catch (error) {
      console.warn(
        `Failed to fetch category name for ${categoryId}:`,
        error.message
      );
      return null;
    }
  }

  async fetchProductData(itemId) {
    try {
      if (!env.APPWRITE_PRODUCT_COLLECTION_ID) {
        return { name: `Product ${itemId}`, price: 99.99, image: null };
      }

      const product = await this.databases.getDocument(
        this.databaseId,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        itemId
      );

      // Fetch category name if category ID is provided
      let categoryName = product.category || "general";
      if (product.category && product.category !== "general") {
        const fetchedCategoryName = await this.fetchCategoryName(
          product.category
        );
        if (fetchedCategoryName) {
          categoryName = fetchedCategoryName;
        }
      }

      return {
        name:
          product.productName ||
          product.name ||
          product.title ||
          `Product ${itemId}`,
        description: product.description || "",
        price: product.price || 0,
        image: product.image || product.imageUrl || product.thumbnail || null,
        brand: product.brand || "",
        category: categoryName,
        rating: product.rating || product.ratingsCount || 0,
        reviews: product.ratingsCount || product.reviews || 0,
        culturalRelevance:
          (product.rating || product.ratingsCount || 0) > 3 ? 0.8 : 0.3, // Base on rating since finalScore not available here
        trustScore: (product.rating || 0) > 4 ? 0.9 : 0.5,
        inStock: product.inStock !== false, // Default to true unless explicitly false
        vendor: product.vendor || product.seller || "",
        tags: product.tags || [],
        createdAt: product.$createdAt,
        updatedAt: product.$updatedAt,
      };
    } catch (error) {
      console.warn(
        `Failed to fetch product data for ${itemId}:`,
        error.message
      );
      // Return basic fallback data
      return {
        name: `Product ${itemId}`,
        description: "Product description not available",
        price: 99.99,
        image: null,
        brand: "Unknown",
        category: "general",
        rating: 0,
        reviews: 0,
        inStock: true,
        vendor: "",
        tags: [],
      };
    }
  }
}

module.exports = MultiTowerRecommendationService;
