const { Client, Databases, ID, Permission, Role } = require("node-appwrite");
const { db } = require("../src/appwrite");
const { env } = require("../src/env");

/**
 * Multi-Tower Recommendation System - Appwrite Schema Setup
 *
 * This file contains all the collection schemas needed for the recommendation system.
 * Each tower has its own data requirements, plus shared collections for coordination.
 */

class RecommendationSchemas {
  constructor(client = null, databaseId = null) {
    this.client = client;
    this.databases = client ? new Databases(client) : db; // Use existing db if no client provided
    this.databaseId = databaseId || env.APPWRITE_DATABASE_ID; // Use existing database by default
  }

  // Helper method to get default permissions for collections
  getDefaultPermissions() {
    return [
      Permission.read(Role.any()),
      Permission.create(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ];
  }

  async initializeDatabase() {
    try {
      // Check if we're using an existing database or need to create a new one
      const databases = await this.databases.list();
      const existingDb = databases.databases.find(
        (db) => db.$id === this.databaseId
      );

      if (!existingDb) {
        await this.databases.create(
          this.databaseId,
          "Nile Flow Recommendations"
        );
        console.log("✅ Recommendation database created");
      } else {
        console.log("✅ Using existing database:", existingDb.name);
      }
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Database already exists");
      } else {
        console.error("❌ Database initialization error:", error);
        throw error;
      }
    }
  }

  // ============================================================================
  // USER INTENT TOWER SCHEMAS
  // ============================================================================

  async createUserSessionsCollection() {
    const collectionId = "user_sessions";
    const collectionName = "User Sessions";

    // First create the collection
    const collection = await this.databases.createCollection(
      this.databaseId,
      collectionId,
      collectionName,
      this.getDefaultPermissions(),
      true // documentSecurity
    );

    console.log(`📝 Adding attributes to ${collectionName}...`);

    // Then add attributes
    const attributes = [
      { name: "userId", type: "string", size: 100, required: true },
      { name: "sessionId", type: "string", size: 100, required: true },
      { name: "deviceType", type: "string", size: 50, required: true },
      { name: "location", type: "string", size: 100, required: false },
      { name: "language", type: "string", size: 10, required: true },
      { name: "startTime", type: "datetime", required: true },
      { name: "lastActivity", type: "datetime", required: true },
      { name: "isActive", type: "boolean", required: true, default: true },
      { name: "totalViews", type: "integer", required: true, default: 0 },
      { name: "totalClicks", type: "integer", required: true, default: 0 },
      { name: "totalSearches", type: "integer", required: true, default: 0 },
      { name: "sessionDuration", type: "integer", required: true, default: 0 },
      {
        name: "priceRangeInterest",
        type: "string",
        size: 200,
        required: false,
      },
      { name: "categoryInterest", type: "string", size: 1000, required: false },
      { name: "brandInterest", type: "string", size: 1000, required: false },
      {
        name: "userIntentEmbedding",
        type: "string",
        size: 2000,
        required: false,
      },
      {
        name: "shortTermIntentScore",
        type: "float",
        required: false,
        default: 0.0,
      },
    ];

    for (const attr of attributes) {
      try {
        if (attr.type === "string") {
          await this.databases.createStringAttribute(
            this.databaseId,
            collectionId,
            attr.name,
            attr.size,
            attr.required,
            attr.default || null
          );
        } else if (attr.type === "integer") {
          await this.databases.createIntegerAttribute(
            this.databaseId,
            collectionId,
            attr.name,
            attr.required,
            null, // min
            null, // max
            attr.default || null
          );
        } else if (attr.type === "float") {
          await this.databases.createFloatAttribute(
            this.databaseId,
            collectionId,
            attr.name,
            attr.required,
            null, // min
            null, // max
            attr.default || null
          );
        } else if (attr.type === "boolean") {
          await this.databases.createBooleanAttribute(
            this.databaseId,
            collectionId,
            attr.name,
            attr.required,
            attr.default || null
          );
        } else if (attr.type === "datetime") {
          await this.databases.createDatetimeAttribute(
            this.databaseId,
            collectionId,
            attr.name,
            attr.required
          );
        }
      } catch (error) {
        if (error.code !== 409) {
          // Attribute already exists
          console.error(`Error adding ${attr.name}:`, error.message);
        }
      }
    }

    return collection;
  }

  async createUserBehaviorEvents() {
    return await this.databases.createCollection(
      this.databaseId,
      env.APPWRITE_RECOMMENDATION_USER_EVENTS_COLLECTION_ID || "user_behavior_events",
      "User Behavior Events",
      this.getDefaultPermissions(),
      {
        userId: { type: "string", size: 100, required: true },
        sessionId: { type: "string", size: 100, required: true },
        eventType: { type: "string", size: 50, required: true }, // 'view', 'click', 'search', 'add_to_cart', 'purchase'
        itemId: { type: "string", size: 100, required: false },
        searchQuery: { type: "string", size: 500, required: false },

        timestamp: { type: "datetime", required: true },
        timeOnPage: { type: "integer", required: false }, // seconds

        // Context at time of event
        deviceType: { type: "string", size: 50, required: true },
        location: { type: "string", size: 100, required: false },
        referrer: { type: "string", size: 200, required: false },

        // Event metadata
        metadata: { type: "string", size: 1000, required: false }, // JSON for extra data
      }
    );
  }

  // ============================================================================
  // ITEM REPRESENTATION TOWER SCHEMAS
  // ============================================================================

  async createItemEmbeddings() {
    return await this.databases.createCollection(
      this.databaseId,
      "item_embeddings",
      "Item Embeddings",
      this.getDefaultPermissions(),
      {
        itemId: { type: "string", size: 100, required: true },

        // Static features
        category: { type: "string", size: 100, required: true },
        subcategory: { type: "string", size: 100, required: false },
        brand: { type: "string", size: 100, required: true },
        priceUSD: { type: "float", required: true },
        priceBand: { type: "string", size: 20, required: true }, // 'budget', 'mid', 'premium'

        // Text embeddings (computed)
        titleEmbedding: { type: "string", size: 2000, required: false }, // JSON array
        descriptionEmbedding: { type: "string", size: 2000, required: false }, // JSON array

        // Dynamic features (updated frequently)
        stockLevel: { type: "integer", required: true, default: 0 },
        stockVelocity: { type: "float", required: false, default: 0.0 }, // items/day
        popularityScore: { type: "float", required: false, default: 0.0 },
        trendingScore: { type: "float", required: false, default: 0.0 },

        // Seller information
        sellerId: { type: "string", size: 100, required: true },
        sellerReputation: { type: "float", required: false, default: 0.0 },

        // Final item embedding (computed by Item Tower)
        itemEmbedding: { type: "string", size: 2000, required: false }, // JSON array of floats

        // Metadata
        lastUpdated: { type: "datetime", required: true },
        isActive: { type: "boolean", required: true, default: true },
      }
    );
  }

  // ============================================================================
  // CONTEXT & CULTURE TOWER SCHEMAS (AFRICA-FIRST MOAT)
  // ============================================================================

  async createContextProfiles() {
    return await this.databases.createCollection(
      this.databaseId,
      "context_profiles",
      "Context & Culture Profiles",
      this.getDefaultPermissions(),
      {
        profileKey: { type: "string", size: 200, required: true }, // country_city_language

        // Geographic context
        country: { type: "string", size: 10, required: true },
        countryName: { type: "string", size: 100, required: true },
        city: { type: "string", size: 100, required: false },
        currency: { type: "string", size: 10, required: true },
        language: { type: "string", size: 10, required: true },

        // Cultural preferences (learned)
        preferredCategories: { type: "string", size: 1000, required: false }, // JSON array with scores
        preferredBrands: { type: "string", size: 1000, required: false }, // JSON array with scores
        preferredPriceRanges: { type: "string", size: 500, required: false }, // JSON object

        // Temporal patterns
        peakHours: { type: "string", size: 200, required: false }, // JSON array [0-23]
        peakDaysOfWeek: { type: "string", size: 100, required: false }, // JSON array [0-6]
        seasonalTrends: { type: "string", size: 1000, required: false }, // JSON object

        // Festival and events calendar
        upcomingFestivals: { type: "string", size: 2000, required: false }, // JSON array
        localEvents: { type: "string", size: 2000, required: false }, // JSON array

        // Buying patterns
        averageOrderValue: { type: "float", required: false, default: 0.0 },
        preferredPaymentMethods: { type: "string", size: 500, required: false }, // JSON array

        // Context multipliers (computed)
        contextRelevanceMultiplier: {
          type: "float",
          required: false,
          default: 1.0,
        },
        seasonalBoostVector: { type: "string", size: 1000, required: false }, // JSON array

        // Metadata
        lastUpdated: { type: "datetime", required: true },
        userCount: { type: "integer", required: true, default: 0 }, // Number of users in this context
        isActive: { type: "boolean", required: true, default: true },
      }
    );
  }

  async createWeatherContext() {
    return await this.databases.createCollection(
      this.databaseId,
      "weather_context",
      "Weather Context",
      this.getDefaultPermissions(),
      {
        locationKey: { type: "string", size: 100, required: true }, // country_city

        // Current weather
        temperature: { type: "float", required: false },
        humidity: { type: "float", required: false },
        condition: { type: "string", size: 50, required: false }, // sunny, rainy, etc.
        season: { type: "string", size: 20, required: true }, // wet, dry, harmattan, etc.

        // Weather-influenced categories
        boostedCategories: { type: "string", size: 1000, required: false }, // JSON array
        suppressedCategories: { type: "string", size: 1000, required: false }, // JSON array

        timestamp: { type: "datetime", required: true },
        isActive: { type: "boolean", required: true, default: true },
      }
    );
  }

  // ============================================================================
  // SOCIAL PROOF & TRUST TOWER SCHEMAS
  // ============================================================================

  async createItemSocialSignals() {
    return await this.databases.createCollection(
      this.databaseId,
      "item_social_signals",
      "Item Social Signals",
      this.getDefaultPermissions(),
      {
        itemId: { type: "string", size: 100, required: true },

        // Review metrics
        totalReviews: { type: "integer", required: true, default: 0 },
        averageRating: { type: "float", required: false, default: 0.0 },
        rating5Star: { type: "integer", required: true, default: 0 },
        rating4Star: { type: "integer", required: true, default: 0 },
        rating3Star: { type: "integer", required: true, default: 0 },
        rating2Star: { type: "integer", required: true, default: 0 },
        rating1Star: { type: "integer", required: true, default: 0 },

        // Purchase signals
        totalPurchases: { type: "integer", required: true, default: 0 },
        purchaseVelocity: { type: "float", required: false, default: 0.0 }, // purchases/day
        recentPurchases24h: { type: "integer", required: true, default: 0 },
        recentPurchases7d: { type: "integer", required: true, default: 0 },

        // Trust signals
        returnRate: { type: "float", required: false, default: 0.0 },
        refundRate: { type: "float", required: false, default: 0.0 },
        fraudFlags: { type: "integer", required: true, default: 0 },

        // Seller trust
        sellerTrustScore: { type: "float", required: false, default: 0.5 },
        sellerResponseTime: { type: "integer", required: false }, // hours
        sellerRating: { type: "float", required: false, default: 0.0 },

        // Computed scores
        trustScore: { type: "float", required: false, default: 0.5 },
        riskPenalty: { type: "float", required: false, default: 0.0 },
        socialProofBoost: { type: "float", required: false, default: 1.0 },

        // Metadata
        lastUpdated: { type: "datetime", required: true },
        isActive: { type: "boolean", required: true, default: true },
      }
    );
  }

  // ============================================================================
  // BUSINESS & SUPPLY TOWER SCHEMAS
  // ============================================================================

  async createBusinessMetrics() {
    return await this.databases.createCollection(
      this.databaseId,
      "business_metrics",
      "Business & Supply Metrics",
      this.getDefaultPermissions(),
      {
        itemId: { type: "string", size: 100, required: true },

        // Inventory data
        currentStock: { type: "integer", required: true, default: 0 },
        reservedStock: { type: "integer", required: true, default: 0 },
        availableStock: { type: "integer", required: true, default: 0 },
        reorderLevel: { type: "integer", required: true, default: 0 },
        stockoutRisk: { type: "float", required: false, default: 0.0 },

        // Financial metrics
        costPrice: { type: "float", required: false, default: 0.0 },
        sellingPrice: { type: "float", required: true },
        marginPercent: { type: "float", required: false, default: 0.0 },
        marginBand: { type: "string", size: 20, required: false }, // 'low', 'medium', 'high'

        // Logistics constraints
        warehouseLocation: { type: "string", size: 100, required: false },
        averageDeliveryTime: { type: "integer", required: false }, // days
        shippingCost: { type: "float", required: false, default: 0.0 },
        deliveryComplexity: { type: "float", required: false, default: 1.0 }, // 1.0 = normal

        // Strategic priorities
        isStrategicCategory: {
          type: "boolean",
          required: true,
          default: false,
        },
        isPromoted: { type: "boolean", required: true, default: false },
        promotionBoost: { type: "float", required: false, default: 1.0 },
        isSponsoredByVendor: {
          type: "boolean",
          required: true,
          default: false,
        },
        sponsorBoost: { type: "float", required: false, default: 1.0 },

        // Computed business scores
        businessBoostScalar: { type: "float", required: false, default: 1.0 },
        supplySuppression: { type: "float", required: false, default: 0.0 },

        // Metadata
        lastUpdated: { type: "datetime", required: true },
        isActive: { type: "boolean", required: true, default: true },
      }
    );
  }

  // ============================================================================
  // FUSION & SYSTEM COORDINATION SCHEMAS
  // ============================================================================

  async createRecommendationWeights() {
    return await this.databases.createCollection(
      this.databaseId,
      "recommendation_weights",
      "Tower Fusion Weights",
      this.getDefaultPermissions(),
      {
        configName: { type: "string", size: 100, required: true }, // 'default', 'mobile', 'web', etc.
        version: { type: "string", size: 20, required: true },

        // Tower weights (w1-w6 in fusion formula)
        intentWeight: { type: "float", required: true, default: 0.25 }, // w1
        itemQualityWeight: { type: "float", required: true, default: 0.2 }, // w2
        contextWeight: { type: "float", required: true, default: 0.15 }, // w3 (Africa advantage!)
        trustWeight: { type: "float", required: true, default: 0.2 }, // w4
        businessWeight: { type: "float", required: true, default: 0.1 }, // w5
        riskPenaltyWeight: { type: "float", required: true, default: 0.1 }, // w6

        // Exploration parameters
        epsilonGreedy: { type: "float", required: true, default: 0.1 },
        newItemQuota: { type: "float", required: true, default: 0.05 }, // 5% new items
        categoryExploration: { type: "float", required: true, default: 0.03 },

        // Safety limits
        minTrustThreshold: { type: "float", required: true, default: 0.3 },
        maxRiskTolerance: { type: "float", required: true, default: 0.7 },

        // A/B testing
        isActive: { type: "boolean", required: true, default: false },
        trafficPercent: { type: "float", required: true, default: 0.0 }, // 0-100
        testStartDate: { type: "datetime", required: false },
        testEndDate: { type: "datetime", required: false },

        // Performance tracking
        conversionRate: { type: "float", required: false, default: 0.0 },
        clickThroughRate: { type: "float", required: false, default: 0.0 },
        revenue: { type: "float", required: false, default: 0.0 },

        createdAt: { type: "datetime", required: true },
        updatedAt: { type: "datetime", required: true },
      }
    );
  }

  async createRecommendationLogs() {
    return await this.databases.createCollection(
      this.databaseId,
      "recommendation_logs",
      "Recommendation Request Logs",
      this.getDefaultPermissions(),
      {
        requestId: { type: "string", size: 100, required: true },
        userId: { type: "string", size: 100, required: true },
        sessionId: { type: "string", size: 100, required: true },

        // Request context
        requestType: { type: "string", size: 50, required: true }, // 'homepage', 'search', 'category', etc.
        location: { type: "string", size: 100, required: false },
        deviceType: { type: "string", size: 50, required: true },
        timestamp: { type: "datetime", required: true },

        // Tower outputs (for debugging)
        intentScore: { type: "float", required: false },
        itemScores: { type: "string", size: 2000, required: false }, // JSON array
        contextMultiplier: { type: "float", required: false },
        trustScores: { type: "string", size: 2000, required: false }, // JSON array
        businessBoosts: { type: "string", size: 2000, required: false }, // JSON array

        // Final recommendations
        recommendedItems: { type: "string", size: 5000, required: false }, // JSON array of item IDs
        finalScores: { type: "string", size: 5000, required: false }, // JSON array

        // Config used
        weightsVersion: { type: "string", size: 20, required: false },
        explorationApplied: { type: "boolean", required: true, default: false },

        // Performance
        processingTimeMs: { type: "integer", required: false },
        towerLatencies: { type: "string", size: 500, required: false }, // JSON object

        // Metadata
        isActive: { type: "boolean", required: true, default: true },
      }
    );
  }

  // ============================================================================
  // FEEDBACK & LEARNING SCHEMAS
  // ============================================================================

  async createRecommendationFeedback() {
    return await this.databases.createCollection(
      this.databaseId,
      "recommendation_feedback",
      "Recommendation Feedback",
      this.getDefaultPermissions(),
      {
        requestId: { type: "string", size: 100, required: true },
        userId: { type: "string", size: 100, required: true },
        itemId: { type: "string", size: 100, required: true },

        // Feedback types
        impression: { type: "boolean", required: true, default: false },
        click: { type: "boolean", required: true, default: false },
        addToCart: { type: "boolean", required: true, default: false },
        purchase: { type: "boolean", required: true, default: false },
        ignore: { type: "boolean", required: true, default: false },

        // Feedback timing
        impressionTime: { type: "datetime", required: false },
        clickTime: { type: "datetime", required: false },
        addToCartTime: { type: "datetime", required: false },
        purchaseTime: { type: "datetime", required: false },

        // Position information
        positionInList: { type: "integer", required: false },
        totalRecommendations: { type: "integer", required: false },

        // Value information
        clickValue: { type: "float", required: false, default: 0.0 },
        purchaseValue: { type: "float", required: false, default: 0.0 },

        // Learning flags
        processed: { type: "boolean", required: true, default: false },
        learningApplied: { type: "boolean", required: true, default: false },

        createdAt: { type: "datetime", required: true },
        updatedAt: { type: "datetime", required: true },
      }
    );
  }

  // ============================================================================
  // MASTER SETUP FUNCTION
  // ============================================================================

  async setupAllCollections() {
    console.log("🚀 Setting up Multi-Tower Recommendation System schemas...");

    try {
      await this.initializeDatabase();

      // Setup all collections
      const collections = [
        {
          name: "User Sessions",
          fn: () => this.createUserSessionsCollection(),
        },
        {
          name: "User Behavior Events",
          fn: () => this.createUserBehaviorEvents(),
        },
        { name: "Item Embeddings", fn: () => this.createItemEmbeddings() },
        { name: "Context Profiles", fn: () => this.createContextProfiles() },
        { name: "Weather Context", fn: () => this.createWeatherContext() },
        {
          name: "Item Social Signals",
          fn: () => this.createItemSocialSignals(),
        },
        { name: "Business Metrics", fn: () => this.createBusinessMetrics() },
        {
          name: "Recommendation Weights",
          fn: () => this.createRecommendationWeights(),
        },
        {
          name: "Recommendation Logs",
          fn: () => this.createRecommendationLogs(),
        },
        {
          name: "Recommendation Feedback",
          fn: () => this.createRecommendationFeedback(),
        },
      ];

      for (const collection of collections) {
        try {
          await collection.fn();
          console.log(`✅ ${collection.name} collection created`);
        } catch (error) {
          if (error.code === 409) {
            console.log(`⚠️  ${collection.name} already exists`);
          } else {
            console.error(`❌ Error creating ${collection.name}:`, error);
          }
        }
      }

      console.log("🎉 Multi-Tower Recommendation System setup complete!");
    } catch (error) {
      console.error("💥 Setup failed:", error);
      throw error;
    }
  }
}

module.exports = RecommendationSchemas;

// Usage example with existing appwrite setup:
/*
const RecommendationSchemas = require('./schemas/recommendationSchemas');

// Option 1: Use your existing database (recommended)
const schemas = new RecommendationSchemas();
schemas.setupAllCollections();

// Option 2: Create a separate database for recommendations
const schemasWithNewDb = new RecommendationSchemas(null, 'nile_flow_recommendations');
schemasWithNewDb.setupAllCollections();

// Option 3: Use with a custom client and database
const { Client } = require('node-appwrite');
const customClient = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('your-project-id')
  .setKey('your-api-key');

const schemasWithCustomClient = new RecommendationSchemas(customClient, 'custom_db_id');
schemasWithCustomClient.setupAllCollections();
*/
