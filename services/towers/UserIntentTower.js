const { Client, Databases, Query, ID } = require("node-appwrite");
const { env } = require("../../src/env");

/**
 * User Intent Tower - Captures what the user wants
 *
 * This tower learns user preferences and intent through:
 * - Search queries and behavior patterns
 * - Purchase history from orders collection
 * - Cart interactions and browsing patterns
 * - Session data and user preferences
 * - Time-based intent decay
 *
 * Output: UserIntentEmbedding (D=128) + short-term intent score
 * Key Properties: Real-time learning, time decay, cold-start handling
 */

class UserIntentTower {
  constructor(appwriteClient = null, databaseId = null) {
    this.client = appwriteClient;
    this.databases = appwriteClient
      ? new Databases(appwriteClient)
      : new Databases(new Client());
    this.databaseId = databaseId || env.APPWRITE_DATABASE_ID;

    // Configuration
    this.EMBEDDING_DIMENSION = 128;
    this.TIME_DECAY_HOURS = 24; // How many hours to look back
    this.SESSION_TIMEOUT_MINUTES = 30;

    // Time decay factors
    this.RECENT_DECAY = 0.9; // Last hour
    this.MEDIUM_DECAY = 0.7; // 1-6 hours
    this.OLD_DECAY = 0.3; // 6-24 hours

    // Weight importance
    this.WEIGHTS = {
      SEARCH: 1.0, // Search queries are strongest signal
      PURCHASE: 0.9, // Purchase behavior
      CLICK: 0.7, // Click behavior
      VIEW: 0.4, // View behavior
      CART: 0.8, // Add to cart
      SESSION: 0.3, // Session patterns
    };
  }

  // ============================================================================
  // CORE INTENT COMPUTATION
  // ============================================================================

  /**
   * Compute user intent embedding and score
   * @param {string} userId - User identifier
   * @param {string} sessionId - Current session identifier
   * @param {Object} context - Request context (device, location, etc.)
   * @returns {Object} { userIntentEmbedding: Array, shortTermIntentScore: Number }
   */
  async computeUserIntent(userId, sessionId, context = {}) {
    try {
      // Validate and handle missing sessionId
      if (!sessionId || sessionId === "null" || sessionId === "undefined") {
        // console.log(`No sessionId provided for user: ${userId}`);
        // Generate a temporary sessionId for this request
        sessionId = `temp_${userId}_${Date.now()}`;
        // console.log(`Generated temporary sessionId: ${sessionId}`);
      }

      // 1. Get recent user behavior (time-decayed)
      const recentBehavior = await this.getRecentBehavior(userId, sessionId);

      // 2. Get current session data
      const sessionData = await this.getCurrentSession(userId, sessionId);

      // 3. Handle cold start case
      if (recentBehavior.length === 0 && !sessionData) {
        return this.getColdStartIntent(context);
      }

      // 4. Extract features from behavior
      const features = this.extractBehaviorFeatures(
        recentBehavior,
        sessionData,
        context
      );

      // 5. Compute intent embedding
      const embedding = this.computeEmbedding(features);

      // 6. Compute short-term intent score
      const intentScore = this.computeIntentScore(features, embedding);

      // 7. Update session with computed values
      await this.updateSessionIntent(userId, sessionId, embedding, intentScore);

      return {
        userIntentEmbedding: embedding,
        shortTermIntentScore: intentScore,
        features: features, // For debugging
        collectionTracking: {
          userSessionsConnected: !!env.USER_SESSIONS_COLLECTION_ID,
          sessionId: sessionId,
          dataWritten: true,
        },
      };
    } catch (error) {
      console.error("Error computing user intent:", error);
      return this.getFallbackIntent(context);
    }
  }

  // ============================================================================
  // DATA RETRIEVAL
  // ============================================================================

  async getRecentBehavior(userId, sessionId) {
    try {
      const cutoffTime = new Date(
        Date.now() - this.TIME_DECAY_HOURS * 60 * 60 * 1000
      );

      // Get recent orders (purchase behavior)
      let behaviors = [];

      if (env.APPWRITE_ORDER_COLLECTION_ID) {
        try {
          // Try different possible customer ID field names
          let ordersResponse;
          const possibleFields = [
            "userId",
            "customerId",
            "user_id",
            "customer_id",
          ];

          for (const fieldName of possibleFields) {
            try {
              ordersResponse = await this.databases.listDocuments(
                this.databaseId,
                env.APPWRITE_ORDERS_COLLECTION,
                [
                  Query.equal(fieldName, userId),
                  Query.greaterThanEqual(
                    "$createdAt",
                    cutoffTime.toISOString()
                  ),
                  Query.orderDesc("$createdAt"),
                  Query.limit(100),
                ]
              );
              break; // Success, exit the loop
            } catch (fieldError) {
              if (fieldError.message.includes("Attribute not found")) {
                continue; // Try next field name
              } else {
                throw fieldError; // Other error, propagate it
              }
            }
          }

          if (ordersResponse) {
            // Convert orders to behavior events
            behaviors = ordersResponse.documents
              .map((order) => ({
                eventType: "purchase",
                itemId: order.productId || order.itemId,
                timestamp: new Date(order.$createdAt),
                timeOnPage: 0,
                deviceType: "web",
                location: order.deliveryAddress || null,
                metadata: {
                  amount: order.totalAmount,
                  status: order.status,
                  orderId: order.$id,
                },
              }))
              .filter((b) => b.itemId); // Filter out orders without product IDs

            // console.log(
            //   `📊 UserIntent: Found ${behaviors.length} purchase behaviors for user ${userId}`
            // );
          }
        } catch (error) {
          console.warn(
            "Could not fetch orders for user intent:",
            error.message
          );
        }
      }

      // Get cart interactions if available
      if (env.APPWRITE_CART_COLLECTION_ID) {
        try {
          // Try different possible customer ID field names for cart
          let cartResponse;
          const possibleFields = [
            "userId",
            "customerId",
            "user_id",
            "customer_id",
          ];

          for (const fieldName of possibleFields) {
            try {
              cartResponse = await this.databases.listDocuments(
                this.databaseId,
                env.APPWRITE_CART_COLLECTION_ID,
                [
                  Query.equal(fieldName, userId),
                  Query.greaterThanEqual(
                    "$updatedAt",
                    cutoffTime.toISOString()
                  ),
                  Query.orderDesc("$updatedAt"),
                  Query.limit(50),
                ]
              );
              break; // Success, exit the loop
            } catch (fieldError) {
              if (fieldError.message.includes("Attribute not found")) {
                continue; // Try next field name
              } else {
                throw fieldError; // Other error, propagate it
              }
            }
          }

          if (cartResponse) {
            const cartBehaviors = cartResponse.documents
              .map((cartItem) => ({
                eventType: "cart",
                itemId: cartItem.productId || cartItem.itemId,
                timestamp: new Date(cartItem.$updatedAt),
                timeOnPage: 0,
                deviceType: "web",
                location: null,
                metadata: {
                  quantity: cartItem.quantity,
                  price: cartItem.price,
                },
              }))
              .filter((b) => b.itemId);

            behaviors = behaviors.concat(cartBehaviors);
            // console.log(
            //   `🛒 UserIntent: Found ${cartBehaviors.length} cart behaviors for user ${userId}`
            // );
          }
        } catch (error) {
          console.warn(
            "Could not fetch cart data for user intent:",
            error.message
          );
        }
      }

      // Sort by timestamp (most recent first)
      behaviors.sort((a, b) => b.timestamp - a.timestamp);

      return behaviors.slice(0, 100); // Limit for performance
    } catch (error) {
      console.error("Error retrieving recent behavior:", error);
      return [];
    }
  }

  async getCurrentSession(userId, sessionId) {
    try {
      // Handle null or undefined sessionId
      if (!sessionId) {
        console.warn("No sessionId provided for user:", userId);
        return null;
      }

      const response = await this.databases.listDocuments(
        this.databaseId,
        env.USER_SESSIONS_COLLECTION_ID || "user_sessions",
        [
          Query.equal("userId", userId),
          Query.equal("sessionId", sessionId),
          Query.equal("isActive", true),
        ]
      );

      if (response.documents.length === 0) {
        return null;
      }

      const session = response.documents[0];
      return {
        sessionId: session.sessionId,
        deviceType: session.deviceType,
        location: session.location,
        language: session.language,
        startTime: new Date(session.startTime),
        lastActivity: new Date(session.lastActivity),
        totalViews: session.totalViews,
        totalClicks: session.totalClicks,
        totalSearches: session.totalSearches,
        sessionDuration: session.sessionDuration,
        priceRangeInterest: session.priceRangeInterest
          ? JSON.parse(session.priceRangeInterest)
          : null,
        categoryInterest: session.categoryInterest
          ? JSON.parse(session.categoryInterest)
          : [],
        brandInterest: session.brandInterest
          ? JSON.parse(session.brandInterest)
          : [],
      };
    } catch (error) {
      console.error("Error retrieving session data:", error);
      return null;
    }
  }

  // ============================================================================
  // FEATURE EXTRACTION
  // ============================================================================

  extractBehaviorFeatures(behaviors, session, context) {
    const now = new Date();

    // Initialize feature buckets
    const features = {
      // Search patterns
      searchQueries: [],
      searchCategories: new Map(),
      searchBrands: new Map(),

      // Item interactions
      viewedItems: new Map(),
      clickedItems: new Map(),
      cartItems: new Map(),
      purchasedItems: new Map(),

      // Category preferences (time-weighted)
      categoryScores: new Map(),
      brandScores: new Map(),
      priceInterest: { min: 0, max: 0, avg: 0, count: 0 },

      // Temporal patterns
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      sessionAge: session ? (now - session.startTime) / (1000 * 60) : 0, // minutes

      // Device/context
      deviceType:
        context.deviceType || (session ? session.deviceType : "unknown"),
      location: context.location || (session ? session.location : "unknown"),
      language: context.language || (session ? session.language : "en"),
    };

    // Process each behavior event
    for (const behavior of behaviors) {
      const timeWeight = this.getTimeWeight(behavior.timestamp, now);
      const eventWeight = this.WEIGHTS[behavior.eventType.toUpperCase()] || 0.1;
      const finalWeight = timeWeight * eventWeight;

      // Process based on event type
      switch (behavior.eventType) {
        case "search":
          if (behavior.searchQuery) {
            features.searchQueries.push({
              query: behavior.searchQuery,
              timestamp: behavior.timestamp,
              weight: finalWeight,
            });
          }
          break;

        case "view":
          if (behavior.itemId) {
            const current = features.viewedItems.get(behavior.itemId) || 0;
            features.viewedItems.set(behavior.itemId, current + finalWeight);
          }
          break;

        case "click":
          if (behavior.itemId) {
            const current = features.clickedItems.get(behavior.itemId) || 0;
            features.clickedItems.set(behavior.itemId, current + finalWeight);
          }
          break;

        case "add_to_cart":
          if (behavior.itemId) {
            const current = features.cartItems.get(behavior.itemId) || 0;
            features.cartItems.set(behavior.itemId, current + finalWeight);
          }
          break;

        case "purchase":
          if (behavior.itemId) {
            const current = features.purchasedItems.get(behavior.itemId) || 0;
            features.purchasedItems.set(behavior.itemId, current + finalWeight);
          }
          break;
      }

      // Extract metadata if available
      if (behavior.metadata) {
        if (behavior.metadata.category) {
          const current =
            features.categoryScores.get(behavior.metadata.category) || 0;
          features.categoryScores.set(
            behavior.metadata.category,
            current + finalWeight
          );
        }

        if (behavior.metadata.brand) {
          const current =
            features.brandScores.get(behavior.metadata.brand) || 0;
          features.brandScores.set(
            behavior.metadata.brand,
            current + finalWeight
          );
        }

        if (behavior.metadata.price && behavior.metadata.price > 0) {
          features.priceInterest.min =
            features.priceInterest.count === 0
              ? behavior.metadata.price
              : Math.min(features.priceInterest.min, behavior.metadata.price);
          features.priceInterest.max = Math.max(
            features.priceInterest.max,
            behavior.metadata.price
          );
          features.priceInterest.avg =
            (features.priceInterest.avg * features.priceInterest.count +
              behavior.metadata.price) /
            (features.priceInterest.count + 1);
          features.priceInterest.count++;
        }
      }
    }

    // Add session-level features
    if (session) {
      features.sessionViews = session.totalViews;
      features.sessionClicks = session.totalClicks;
      features.sessionSearches = session.totalSearches;
      features.sessionDuration = session.sessionDuration;
      features.sessionIntensity =
        (session.totalClicks + session.totalViews) /
        Math.max(1, session.sessionDuration / 60); // events per minute
    }

    return features;
  }

  // ============================================================================
  // EMBEDDING COMPUTATION
  // ============================================================================

  computeEmbedding(features) {
    // Initialize embedding with zeros
    const embedding = new Array(this.EMBEDDING_DIMENSION).fill(0.0);

    try {
      // Dimensions allocation:
      // 0-31: Category preferences (32 dims)
      // 32-63: Brand preferences (32 dims)
      // 64-95: Behavioral patterns (32 dims)
      // 96-127: Contextual features (32 dims)

      // 1. Category preferences (0-31)
      this.embedCategoryPreferences(features, embedding, 0, 32);

      // 2. Brand preferences (32-63)
      this.embedBrandPreferences(features, embedding, 32, 32);

      // 3. Behavioral patterns (64-95)
      this.embedBehavioralPatterns(features, embedding, 64, 32);

      // 4. Contextual features (96-127)
      this.embedContextualFeatures(features, embedding, 96, 32);

      // 5. Normalize embedding
      return this.normalizeEmbedding(embedding);
    } catch (error) {
      console.error("Error computing embedding:", error);
      return embedding; // Return zeros on error
    }
  }

  embedCategoryPreferences(features, embedding, start, length) {
    const categories = Array.from(features.categoryScores.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by score descending
      .slice(0, length); // Take top categories

    for (let i = 0; i < categories.length && i < length; i++) {
      const [category, score] = categories[i];
      embedding[start + i] = Math.tanh(score); // Normalize to [-1, 1]
    }
  }

  embedBrandPreferences(features, embedding, start, length) {
    const brands = Array.from(features.brandScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, length);

    for (let i = 0; i < brands.length && i < length; i++) {
      const [brand, score] = brands[i];
      embedding[start + i] = Math.tanh(score);
    }
  }

  embedBehavioralPatterns(features, embedding, start, length) {
    // Behavioral intensity features
    const behaviorScores = [
      Math.log(1 + features.viewedItems.size) / 10, // Viewing diversity
      Math.log(1 + features.clickedItems.size) / 10, // Click diversity
      Math.log(1 + features.cartItems.size) / 10, // Cart diversity
      Math.log(1 + features.purchasedItems.size) / 10, // Purchase diversity
      Math.log(1 + features.searchQueries.length) / 10, // Search activity
      features.sessionIntensity || 0, // Session intensity
      features.timeOfDay / 24.0, // Time of day (normalized)
      features.dayOfWeek / 7.0, // Day of week (normalized)
      Math.min(1.0, features.sessionAge / 120), // Session age (normalized to 2 hours)
      features.priceInterest.count > 0
        ? Math.log(1 + features.priceInterest.avg) / 10
        : 0, // Price interest level
    ];

    // Fill behavioral features
    for (let i = 0; i < behaviorScores.length && i < length; i++) {
      embedding[start + i] = Math.tanh(behaviorScores[i]);
    }
  }

  embedContextualFeatures(features, embedding, start, length) {
    // Simple contextual encoding (can be enhanced with learned embeddings)
    const contextFeatures = [
      features.deviceType === "mobile" ? 1.0 : 0.0,
      features.deviceType === "desktop" ? 1.0 : 0.0,
      features.deviceType === "tablet" ? 1.0 : 0.0,
      features.language === "en" ? 1.0 : 0.0,
      features.language === "fr" ? 1.0 : 0.0,
      features.language === "ar" ? 1.0 : 0.0,
      // Add more contextual features as needed
    ];

    for (let i = 0; i < contextFeatures.length && i < length; i++) {
      embedding[start + i] = contextFeatures[i];
    }
  }

  normalizeEmbedding(embedding) {
    // L2 normalization
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      return embedding.map((val) => val / norm);
    }
    return embedding;
  }

  // ============================================================================
  // INTENT SCORE COMPUTATION
  // ============================================================================

  computeIntentScore(features, embedding) {
    try {
      // Intent score combines multiple signals:
      // 1. Behavioral intensity
      // 2. Recency of activity
      // 3. Session engagement
      // 4. Embedding confidence

      // 1. Behavioral intensity (0-1)
      const totalInteractions =
        features.viewedItems.size +
        features.clickedItems.size +
        features.cartItems.size +
        features.purchasedItems.size +
        features.searchQueries.length;
      const behavioralIntensity = Math.min(1.0, totalInteractions / 50); // Normalize to 50 interactions

      // 2. Recency boost (recent activity = higher intent)
      const recentActivity =
        features.sessionAge < 5 ? 1.0 : Math.exp(-features.sessionAge / 30); // 30 min decay

      // 3. Session engagement
      const sessionEngagement = features.sessionIntensity
        ? Math.min(1.0, features.sessionIntensity / 2)
        : 0.1; // events per minute

      // 4. Embedding confidence (how "focused" is the embedding)
      const embeddingConfidence = this.computeEmbeddingConfidence(embedding);

      // Combine scores with weights
      const intentScore =
        0.3 * behavioralIntensity +
        0.2 * recentActivity +
        0.3 * sessionEngagement +
        0.2 * embeddingConfidence;

      return Math.min(1.0, Math.max(0.0, intentScore));
    } catch (error) {
      console.error("Error computing intent score:", error);
      return 0.1; // Low default score
    }
  }

  computeEmbeddingConfidence(embedding) {
    // Confidence based on how "peaked" the embedding is
    // Higher values in fewer dimensions = more focused intent
    const maxVal = Math.max(...embedding.map(Math.abs));
    const meanVal =
      embedding.reduce((sum, val) => sum + Math.abs(val), 0) / embedding.length;

    return maxVal > 0 ? (maxVal - meanVal) / maxVal : 0;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  getTimeWeight(eventTime, currentTime) {
    const hoursAgo = (currentTime - eventTime) / (1000 * 60 * 60);

    if (hoursAgo <= 1) {
      return this.RECENT_DECAY;
    } else if (hoursAgo <= 6) {
      return this.MEDIUM_DECAY;
    } else if (hoursAgo <= 24) {
      return this.OLD_DECAY;
    } else {
      return 0.1; // Very old events get minimal weight
    }
  }

  getColdStartIntent(context) {
    // Default intent for new users
    const embedding = new Array(this.EMBEDDING_DIMENSION).fill(0.0);

    // Set some basic contextual features
    if (context.deviceType === "mobile") embedding[96] = 1.0;
    if (context.language === "en") embedding[99] = 1.0;

    return {
      userIntentEmbedding: embedding,
      shortTermIntentScore: 0.1, // Low intent for cold start
      coldStart: true,
    };
  }

  getFallbackIntent(context) {
    // Fallback when computation fails
    return {
      userIntentEmbedding: new Array(this.EMBEDDING_DIMENSION).fill(0.0),
      shortTermIntentScore: 0.05,
      error: true,
    };
  }

  async updateSessionIntent(userId, sessionId, embedding, intentScore) {
    try {
      // Create or update session even for temporary sessionIds to track data
      if (!sessionId || sessionId === "null" || sessionId === "undefined") {
        // console.log(`Invalid sessionId, skipping session update`);
        return;
      }

      // Check if session exists
      const sessions = await this.databases.listDocuments(
        this.databaseId,
        env.USER_SESSIONS_COLLECTION_ID || "user_sessions",
        [Query.equal("userId", userId), Query.equal("sessionId", sessionId)]
      );

      if (sessions.documents.length > 0) {
        // Update existing session
        await this.databases.updateDocument(
          this.databaseId,
          env.USER_SESSIONS_COLLECTION_ID || "user_sessions",
          sessions.documents[0].$id,
          {
            userIntentEmbedding: JSON.stringify(embedding),
            shortTermIntentScore: intentScore,
            lastActivity: new Date().toISOString(),
          }
        );
        // console.log(
        //   `✅ UserIntent: Updated session ${sessionId} in collection ${env.USER_SESSIONS_COLLECTION_ID}`
        // );
      } else {
        // Create new session record
        await this.databases.createDocument(
          this.databaseId,
          env.USER_SESSIONS_COLLECTION_ID || "user_sessions",
          ID.unique(),
          {
            userId: userId,
            sessionId: sessionId,
            userIntentEmbedding: JSON.stringify(embedding),
            shortTermIntentScore: intentScore,
            deviceType: "unknown",
            location: null,
            language: "en",
            startTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            isActive: true,
            totalViews: 1,
            totalClicks: 0,
            totalPurchases: 0,
          }
        );
        // console.log(
        //   `✅ UserIntent: Created new session ${sessionId} in collection ${env.USER_SESSIONS_COLLECTION_ID}`
        // );
      }
    } catch (error) {
      console.error("Error updating session intent:", error);
      // Don't throw - this is not critical for the response
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async trackBehavior(userId, sessionId, eventType, data = {}) {
    try {
      await this.databases.createDocument(
        this.databaseId,
        env.USER_BEHAVIOR_COLLECTION_ID || "user_behavior",
        ID.unique(), // Auto-generate ID
        {
          userId,
          sessionId,
          eventType,
          itemId: data.itemId || null,
          searchQuery: data.searchQuery || null,
          timestamp: new Date().toISOString(),
          timeOnPage: data.timeOnPage || null,
          deviceType: data.deviceType || "unknown",
          location: data.location || null,
          referrer: data.referrer || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        }
      );

      // Update session counters
      await this.updateSessionCounters(userId, sessionId, eventType);
    } catch (error) {
      console.error("Error tracking behavior:", error);
      throw error;
    }
  }

  async updateSessionCounters(userId, sessionId, eventType) {
    try {
      const sessions = await this.databases.listDocuments(
        this.databaseId,
        env.USER_SESSIONS_COLLECTION_ID || "user_sessions",
        [Query.equal("userId", userId), Query.equal("sessionId", sessionId)]
      );

      if (sessions.documents.length > 0) {
        const session = sessions.documents[0];
        const updates = {
          lastActivity: new Date().toISOString(),
        };

        switch (eventType) {
          case "view":
            updates.totalViews = (session.totalViews || 0) + 1;
            break;
          case "click":
            updates.totalClicks = (session.totalClicks || 0) + 1;
            break;
          case "search":
            updates.totalSearches = (session.totalSearches || 0) + 1;
            break;
        }

        // Update session duration
        const sessionStart = new Date(session.startTime);
        const now = new Date();
        updates.sessionDuration = Math.floor((now - sessionStart) / 1000); // seconds

        await this.databases.updateDocument(
          this.databaseId,
          env.USER_SESSIONS_COLLECTION_ID || "user_sessions",
          session.$id,
          updates
        );
      }
    } catch (error) {
      console.error("Error updating session counters:", error);
    }
  }

  async createOrUpdateSession(
    userId,
    sessionId,
    deviceType,
    location,
    language
  ) {
    try {
      const existing = await this.databases.listDocuments(
        this.databaseId,
        env.USER_SESSIONS_COLLECTION_ID || "user_sessions",
        [Query.equal("userId", userId), Query.equal("sessionId", sessionId)]
      );

      if (existing.documents.length > 0) {
        // Update existing session
        await this.databases.updateDocument(
          this.databaseId,
          env.USER_SESSIONS_COLLECTION_ID || "user_sessions",
          existing.documents[0].$id,
          {
            lastActivity: new Date().toISOString(),
            isActive: true,
          }
        );
        return existing.documents[0];
      } else {
        // Create new session
        const newSession = await this.databases.createDocument(
          this.databaseId,
          env.USER_SESSIONS_COLLECTION_ID || "user_sessions",
          ID.unique(),
          {
            userId,
            sessionId,
            deviceType,
            location,
            language,
            startTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            isActive: true,
            totalViews: 0,
            totalClicks: 0,
            totalSearches: 0,
            sessionDuration: 0,
          }
        );
        // console.log(
        //   `✅ UserIntent: Created session ${sessionId} in collection ${
        //     env.USER_SESSIONS_COLLECTION_ID || "user_sessions"
        //   }`
        // );
        return newSession;
      }
    } catch (error) {
      console.error("Error creating/updating session:", error);
      throw error;
    }
  }
}

module.exports = UserIntentTower;
