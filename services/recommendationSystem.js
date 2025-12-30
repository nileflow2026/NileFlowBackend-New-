const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { ID } = require("node-appwrite");

/**
 * Recommendation System Usage Examples
 *
 * This shows how to use the recommendation collections once they're set up.
 * Based on the collections you mentioned seeing in your database.
 */

class RecommendationSystem {
  constructor() {
    this.databaseId = env.APPWRITE_DATABASE_ID;
  }

  // ============================================================================
  // USER SESSION TRACKING
  // ============================================================================

  async createUserSession(userId, deviceType = "web", language = "en") {
    try {
      const sessionData = {
        userId: userId,
        sessionId: ID.unique(),
        deviceType: deviceType,
        language: language,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        totalViews: 0,
        totalClicks: 0,
        isActive: true,
      };

      const session = await db.createDocument(
        this.databaseId,
        "user_sessions", // Using the main user_sessions collection
        ID.unique(),
        sessionData
      );

      console.log("✅ User session created:", session.$id);
      return session;
    } catch (error) {
      console.error("❌ Error creating user session:", error.message);
      throw error;
    }
  }

  // ============================================================================
  // BEHAVIOR EVENT TRACKING
  // ============================================================================

  async trackUserBehavior(userId, sessionId, eventType, itemId = null) {
    try {
      const behaviorData = {
        userId: userId,
        sessionId: sessionId,
        eventType: eventType, // 'view', 'click', 'search', 'add_to_cart', 'purchase'
        itemId: itemId,
        timestamp: new Date().toISOString(),
        deviceType: "web", // You can make this dynamic
      };

      const behavior = await db.createDocument(
        this.databaseId,
        "user_behavior_events", // Using the main user_behavior_events collection
        ID.unique(),
        behaviorData
      );

      console.log(`✅ Tracked ${eventType} event for user ${userId}`);
      return behavior;
    } catch (error) {
      console.error("❌ Error tracking behavior:", error.message);
      throw error;
    }
  }

  // ============================================================================
  // ITEM EMBEDDINGS MANAGEMENT
  // ============================================================================

  async createItemEmbedding(itemId, category, brand, priceUSD) {
    try {
      const embeddingData = {
        itemId: itemId,
        category: category,
        brand: brand,
        priceUSD: priceUSD,
        stockLevel: 100, // Default stock
        popularityScore: 0.0,
        lastUpdated: new Date().toISOString(),
        isActive: true,
      };

      const embedding = await db.createDocument(
        this.databaseId,
        "item_embeddings", // or 'item_embeddings_v2'
        ID.unique(),
        embeddingData
      );

      console.log(`✅ Created embedding for item ${itemId}`);
      return embedding;
    } catch (error) {
      console.error("❌ Error creating item embedding:", error.message);
      throw error;
    }
  }

  // ============================================================================
  // RECOMMENDATION RETRIEVAL
  // ============================================================================

  async getRecommendationsForUser(userId, limit = 10) {
    try {
      // This is a simplified recommendation algorithm
      // In a real system, this would use ML models and complex scoring

      console.log(`🔍 Getting recommendations for user: ${userId}`);

      // 1. Get user's recent behavior
      const recentBehavior = await db.listDocuments(
        this.databaseId,
        "user_behavior_events",
        [
          `userId=${userId}`,
          `eventType=view`, // Focus on viewed items
        ]
      );

      // 2. Get popular items (simplified)
      const popularItems = await db.listDocuments(
        this.databaseId,
        "item_embeddings",
        [],
        limit
      );

      console.log(
        `✅ Found ${popularItems.documents.length} items for recommendations`
      );

      // 3. Simple recommendation logic (in real system, use ML)
      const recommendations = popularItems.documents.map((item) => ({
        itemId: item.itemId,
        category: item.category,
        brand: item.brand,
        price: item.priceUSD,
        score: item.popularityScore,
        reason: "Popular item in " + item.category,
      }));

      return recommendations;
    } catch (error) {
      console.error("❌ Error getting recommendations:", error.message);
      return [];
    }
  }

  // ============================================================================
  // TESTING METHODS
  // ============================================================================

  async testRecommendationSystem() {
    try {
      console.log("🧪 Testing Recommendation System...\n");

      const userId = "test_user_" + Date.now();
      console.log(`👤 Testing with user: ${userId}`);

      // 1. Create a user session
      const session = await this.createUserSession(userId, "web", "en");

      // 2. Track some behavior
      await this.trackUserBehavior(
        userId,
        session.sessionId,
        "view",
        "item_123"
      );
      await this.trackUserBehavior(
        userId,
        session.sessionId,
        "click",
        "item_456"
      );

      // 3. Create some test item embeddings
      await this.createItemEmbedding(
        "item_123",
        "Electronics",
        "Samsung",
        299.99
      );
      await this.createItemEmbedding(
        "item_456",
        "Electronics",
        "Apple",
        999.99
      );

      // 4. Get recommendations
      const recommendations = await this.getRecommendationsForUser(userId, 5);

      console.log("\n🎯 Recommendations:");
      recommendations.forEach((rec, index) => {
        console.log(
          `${index + 1}. ${rec.brand} - ${rec.category} ($${rec.price})`
        );
        console.log(`   Reason: ${rec.reason}`);
      });

      console.log("\n🎉 Recommendation system test completed successfully!");
    } catch (error) {
      console.error("❌ Test failed:", error.message);
    }
  }
}

module.exports = RecommendationSystem;

// If running this file directly, run the test
if (require.main === module) {
  const recSystem = new RecommendationSystem();
  recSystem.testRecommendationSystem();
}
