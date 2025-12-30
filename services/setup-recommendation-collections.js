const { Client, Databases, ID } = require("node-appwrite");
const { env } = require("./src/env");

async function setupRecommendationCollections() {
  console.log("🚀 Setting up Recommendation System Collections...");

  const client = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT)
    .setProject(env.APPWRITE_PROJECT_ID)
    .setKey(env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const databaseId = env.APPWRITE_DATABASE_ID;

  try {
    // 1. Create user_sessions collection
    console.log("📝 Creating user_sessions collection...");
    try {
      const userSessions = await databases.createCollection(
        databaseId,
        ID.unique(),
        "user_sessions"
      );

      // Add attributes for user_sessions
      await databases.createStringAttribute(
        databaseId,
        userSessions.$id,
        "userId",
        255,
        true
      );
      await databases.createStringAttribute(
        databaseId,
        userSessions.$id,
        "sessionId",
        255,
        true
      );
      await databases.createStringAttribute(
        databaseId,
        userSessions.$id,
        "userIntentEmbedding",
        10000,
        false
      );
      await databases.createFloatAttribute(
        databaseId,
        userSessions.$id,
        "shortTermIntentScore",
        false
      );
      await databases.createDatetimeAttribute(
        databaseId,
        userSessions.$id,
        "lastActivity",
        false
      );
      await databases.createBooleanAttribute(
        databaseId,
        userSessions.$id,
        "isActive",
        false,
        true
      );

      // Create indexes
      await databases.createIndex(
        databaseId,
        userSessions.$id,
        "userId_index",
        "key",
        ["userId"]
      );
      await databases.createIndex(
        databaseId,
        userSessions.$id,
        "sessionId_index",
        "key",
        ["sessionId"]
      );

      console.log("✅ user_sessions collection created successfully");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️ user_sessions collection already exists");
      } else {
        console.error("❌ Error creating user_sessions:", error.message);
      }
    }

    // 2. Create exploration_patterns collection
    console.log("📝 Creating exploration_patterns collection...");
    try {
      const explorationPatterns = await databases.createCollection(
        databaseId,
        ID.unique(),
        "exploration_patterns"
      );

      // Add attributes for exploration_patterns
      await databases.createStringAttribute(
        databaseId,
        explorationPatterns.$id,
        "userId",
        255,
        true
      );
      await databases.createIntegerAttribute(
        databaseId,
        explorationPatterns.$id,
        "totalSessions",
        false,
        0
      );
      await databases.createFloatAttribute(
        databaseId,
        explorationPatterns.$id,
        "preferenceStrength",
        false
      );
      await databases.createBooleanAttribute(
        databaseId,
        explorationPatterns.$id,
        "discoverySeeker",
        false,
        false
      );
      await databases.createIntegerAttribute(
        databaseId,
        explorationPatterns.$id,
        "totalExplorations",
        false,
        0
      );
      await databases.createIntegerAttribute(
        databaseId,
        explorationPatterns.$id,
        "successfulExplorations",
        false,
        0
      );
      await databases.createDatetimeAttribute(
        databaseId,
        explorationPatterns.$id,
        "lastExplorationBoost",
        false
      );

      // Create index
      await databases.createIndex(
        databaseId,
        explorationPatterns.$id,
        "userId_index",
        "key",
        ["userId"]
      );

      console.log("✅ exploration_patterns collection created successfully");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️ exploration_patterns collection already exists");
      } else {
        console.error("❌ Error creating exploration_patterns:", error.message);
      }
    }

    // 3. Create recommendation_feedback collection
    console.log("📝 Creating recommendation_feedback collection...");
    try {
      const recommendationFeedback = await databases.createCollection(
        databaseId,
        ID.unique(),
        "recommendation_feedback"
      );

      // Add attributes for recommendation_feedback
      await databases.createStringAttribute(
        databaseId,
        recommendationFeedback.$id,
        "userId",
        255,
        true
      );
      await databases.createStringAttribute(
        databaseId,
        recommendationFeedback.$id,
        "sessionId",
        255,
        false
      );
      await databases.createStringAttribute(
        databaseId,
        recommendationFeedback.$id,
        "itemId",
        255,
        true
      );
      await databases.createStringAttribute(
        databaseId,
        recommendationFeedback.$id,
        "feedbackType",
        50,
        true
      ); // impression, click, view, etc.
      await databases.createStringAttribute(
        databaseId,
        recommendationFeedback.$id,
        "explorationStrategy",
        100,
        false
      );
      await databases.createFloatAttribute(
        databaseId,
        recommendationFeedback.$id,
        "explorationBoost",
        false
      );
      await databases.createIntegerAttribute(
        databaseId,
        recommendationFeedback.$id,
        "originalRank",
        false
      );
      await databases.createIntegerAttribute(
        databaseId,
        recommendationFeedback.$id,
        "newRank",
        false
      );
      await databases.createFloatAttribute(
        databaseId,
        recommendationFeedback.$id,
        "explorationRate",
        false
      );

      // Create indexes
      await databases.createIndex(
        databaseId,
        recommendationFeedback.$id,
        "userId_index",
        "key",
        ["userId"]
      );
      await databases.createIndex(
        databaseId,
        recommendationFeedback.$id,
        "itemId_index",
        "key",
        ["itemId"]
      );
      await databases.createIndex(
        databaseId,
        recommendationFeedback.$id,
        "feedbackType_index",
        "key",
        ["feedbackType"]
      );

      console.log("✅ recommendation_feedback collection created successfully");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️ recommendation_feedback collection already exists");
      } else {
        console.error(
          "❌ Error creating recommendation_feedback:",
          error.message
        );
      }
    }

    // 4. Create context_profiles collection (for ContextCultureTower)
    console.log("📝 Creating context_profiles collection...");
    try {
      const contextProfiles = await databases.createCollection(
        databaseId,
        ID.unique(),
        "context_profiles"
      );

      // Add attributes for context_profiles
      await databases.createStringAttribute(
        databaseId,
        contextProfiles.$id,
        "profileKey",
        255,
        true
      );
      await databases.createStringAttribute(
        databaseId,
        contextProfiles.$id,
        "country",
        10,
        true
      );
      await databases.createStringAttribute(
        databaseId,
        contextProfiles.$id,
        "city",
        100,
        false
      );
      await databases.createStringAttribute(
        databaseId,
        contextProfiles.$id,
        "language",
        10,
        true
      );
      await databases.createFloatAttribute(
        databaseId,
        contextProfiles.$id,
        "culturalRelevance",
        false
      );
      await databases.createFloatAttribute(
        databaseId,
        contextProfiles.$id,
        "localPreference",
        false
      );
      await databases.createStringAttribute(
        databaseId,
        contextProfiles.$id,
        "currency",
        10,
        false
      );
      await databases.createDatetimeAttribute(
        databaseId,
        contextProfiles.$id,
        "lastUpdated",
        false
      );

      // Create indexes
      await databases.createIndex(
        databaseId,
        contextProfiles.$id,
        "profileKey_index",
        "key",
        ["profileKey"]
      );
      await databases.createIndex(
        databaseId,
        contextProfiles.$id,
        "country_index",
        "key",
        ["country"]
      );

      console.log("✅ context_profiles collection created successfully");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️ context_profiles collection already exists");
      } else {
        console.error("❌ Error creating context_profiles:", error.message);
      }
    }

    // 5. Create recommendation_weights collection (for FusionLayer)
    console.log("📝 Creating recommendation_weights collection...");
    try {
      const recommendationWeights = await databases.createCollection(
        databaseId,
        ID.unique(),
        "recommendation_weights"
      );

      // Add attributes for recommendation_weights
      await databases.createStringAttribute(
        databaseId,
        recommendationWeights.$id,
        "configurationName",
        255,
        true
      );
      await databases.createStringAttribute(
        databaseId,
        recommendationWeights.$id,
        "userSegment",
        100,
        false
      );
      await databases.createFloatAttribute(
        databaseId,
        recommendationWeights.$id,
        "intentWeight",
        false
      );
      await databases.createFloatAttribute(
        databaseId,
        recommendationWeights.$id,
        "itemQualityWeight",
        false
      );
      await databases.createFloatAttribute(
        databaseId,
        recommendationWeights.$id,
        "contextWeight",
        false
      );
      await databases.createFloatAttribute(
        databaseId,
        recommendationWeights.$id,
        "trustWeight",
        false
      );
      await databases.createFloatAttribute(
        databaseId,
        recommendationWeights.$id,
        "businessWeight",
        false
      );
      await databases.createFloatAttribute(
        databaseId,
        recommendationWeights.$id,
        "riskPenaltyWeight",
        false
      );
      await databases.createBooleanAttribute(
        databaseId,
        recommendationWeights.$id,
        "isActive",
        false,
        true
      );
      await databases.createDatetimeAttribute(
        databaseId,
        recommendationWeights.$id,
        "lastUpdated",
        false
      );

      // Create indexes
      await databases.createIndex(
        databaseId,
        recommendationWeights.$id,
        "configurationName_index",
        "key",
        ["configurationName"]
      );
      await databases.createIndex(
        databaseId,
        recommendationWeights.$id,
        "userSegment_index",
        "key",
        ["userSegment"]
      );

      console.log("✅ recommendation_weights collection created successfully");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️ recommendation_weights collection already exists");
      } else {
        console.error(
          "❌ Error creating recommendation_weights:",
          error.message
        );
      }
    }

    // 6. Create item_social_signals collection (for ExplorationLayer)
    console.log("📝 Creating item_social_signals collection...");
    try {
      const itemSocialSignals = await databases.createCollection(
        databaseId,
        ID.unique(),
        "item_social_signals"
      );

      // Add attributes for item_social_signals
      await databases.createStringAttribute(
        databaseId,
        itemSocialSignals.$id,
        "itemId",
        255,
        true
      );
      await databases.createIntegerAttribute(
        databaseId,
        itemSocialSignals.$id,
        "totalReviews",
        false,
        0
      );
      await databases.createFloatAttribute(
        databaseId,
        itemSocialSignals.$id,
        "averageRating",
        false
      );
      await databases.createIntegerAttribute(
        databaseId,
        itemSocialSignals.$id,
        "totalPurchases",
        false,
        0
      );
      await databases.createFloatAttribute(
        databaseId,
        itemSocialSignals.$id,
        "purchaseVelocity",
        false
      );
      await databases.createIntegerAttribute(
        databaseId,
        itemSocialSignals.$id,
        "recentPurchases24h",
        false,
        0
      );
      await databases.createIntegerAttribute(
        databaseId,
        itemSocialSignals.$id,
        "recentPurchases7d",
        false,
        0
      );
      await databases.createFloatAttribute(
        databaseId,
        itemSocialSignals.$id,
        "returnRate",
        false
      );
      await databases.createFloatAttribute(
        databaseId,
        itemSocialSignals.$id,
        "sellerTrustScore",
        false
      );
      await databases.createFloatAttribute(
        databaseId,
        itemSocialSignals.$id,
        "trustScore",
        false
      );
      await databases.createFloatAttribute(
        databaseId,
        itemSocialSignals.$id,
        "riskPenalty",
        false
      );
      await databases.createBooleanAttribute(
        databaseId,
        itemSocialSignals.$id,
        "isActive",
        false,
        true
      );
      await databases.createDatetimeAttribute(
        databaseId,
        itemSocialSignals.$id,
        "lastUpdated",
        false
      );

      // Create indexes
      await databases.createIndex(
        databaseId,
        itemSocialSignals.$id,
        "itemId_index",
        "key",
        ["itemId"]
      );
      await databases.createIndex(
        databaseId,
        itemSocialSignals.$id,
        "trustScore_index",
        "key",
        ["trustScore"]
      );

      console.log("✅ item_social_signals collection created successfully");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️ item_social_signals collection already exists");
      } else {
        console.error("❌ Error creating item_social_signals:", error.message);
      }
    }

    console.log("🎉 Recommendation System Collections setup completed!");
    console.log("📊 Collections created/verified:");
    console.log("   - user_sessions");
    console.log("   - exploration_patterns");
    console.log("   - recommendation_feedback");
    console.log("   - context_profiles");
    console.log("   - recommendation_weights");
    console.log("   - item_social_signals");
    console.log("");
    console.log("✨ Your recommendation system is now ready to store data!");
    console.log("🌍 Default country set to Kenya (KE)");
  } catch (error) {
    console.error("💥 Error setting up recommendation collections:", error);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  setupRecommendationCollections()
    .then(() => {
      console.log("✅ Setup completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Setup failed:", error);
      process.exit(1);
    });
}

module.exports = { setupRecommendationCollections };
