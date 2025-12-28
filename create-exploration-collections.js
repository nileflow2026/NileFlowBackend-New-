const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { ID } = require("node-appwrite");

/**
 * Create Exploration Layer Collections
 *
 * Creates the database collections needed for ExplorationLayer functionality:
 * - recommendation_feedback: Stores user feedback on exploration recommendations
 * - exploration_patterns: Tracks user exploration preferences and success rates
 * - exploration_analytics: Analytics for exploration performance
 */

async function createExplorationCollections() {
  const DATABASE_ID = env.APPWRITE_DATABASE_ID;
  console.log("🚀 Creating Exploration Layer Collections...");

  try {
    // 1. Create recommendation_feedback collection (if it doesn't exist)
    let feedbackCollectionId;
    try {
      const feedbackCollection = await db.createCollection(
        DATABASE_ID,
        ID.unique(),
        "Recommendation Feedback",
        ['read("any")', 'write("any")']
      );
      feedbackCollectionId = feedbackCollection.$id;
      console.log(`✅ recommendation_feedback collection created with ID: ${feedbackCollectionId}`);
    } catch (error) {
      if (
        error.message.includes("already exists") ||
        error.message.includes(
          "Collection with the requested ID already exists"
        )
      ) {
        console.log("ℹ️ recommendation_feedback collection already exists");
      } else {
        console.error(
          "❌ Error creating recommendation_feedback collection:",
          error.message
        );
      }
    }

    // 2. Add attributes for recommendation_feedback
    const feedbackAttributes = [
      // Core identification
      { key: "requestId", type: "string", size: 100, required: true },
      { key: "userId", type: "string", size: 100, required: true },
      { key: "itemId", type: "string", size: 100, required: true },
      { key: "sessionId", type: "string", size: 100, required: false },

      // Feedback types (boolean flags for efficient querying)
      { key: "impression", type: "boolean", required: true, default: false },
      { key: "click", type: "boolean", required: true, default: false },
      { key: "purchase", type: "boolean", required: true, default: false },
      { key: "ignore", type: "boolean", required: true, default: false },

      // Exploration context
      {
        key: "wasExploration",
        type: "boolean",
        required: true,
        default: false,
      },
      { key: "explorationStrategy", type: "string", size: 50, required: false },
      { key: "explorationBoost", type: "double", required: false, default: 0 },

      // Position information
      { key: "positionInList", type: "integer", required: false },
      { key: "totalRecommendations", type: "integer", required: false },

      // Timestamps
      { key: "impressionTime", type: "string", size: 50, required: false },
      { key: "clickTime", type: "string", size: 50, required: false },
      { key: "purchaseTime", type: "string", size: 50, required: false },

      // Metadata
      { key: "createdAt", type: "string", size: 50, required: true },
      { key: "updatedAt", type: "string", size: 50, required: true },
    ];

    console.log("🔧 Adding recommendation_feedback attributes...");
    for (const attr of feedbackAttributes) {
      try {
        if (attr.type === "string") {
          await db.createStringAttribute(
            DATABASE_ID,
            feedbackCollectionId,
            attr.key,
            attr.size,
            attr.required,
            attr.default || null
          );
        } else if (attr.type === "boolean") {
          await db.createBooleanAttribute(
            DATABASE_ID,
            "recommendation_feedback",
            attr.key,
            attr.required,
            attr.default !== undefined ? attr.default : null
          );
        } else if (attr.type === "integer") {
          await db.createIntegerAttribute(
            DATABASE_ID,
            feedbackCollectionId,
            attr.key,
            attr.required,
            null, // min
            null, // max
            attr.default || null
          );
        } else if (attr.type === "double") {
          await db.createFloatAttribute(
            DATABASE_ID,
            feedbackCollectionId,
            attr.key,
            attr.required,
            null, // min
            null, // max
            attr.default || null
          );
        }

        console.log(`✅ Added ${attr.key} (${attr.type})`);
        await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay
      } catch (error) {
        if (error.message.includes("already exists")) {
          console.log(`ℹ️ ${attr.key} attribute already exists`);
        } else {
          console.error(`❌ Error adding ${attr.key}:`, error.message);
        }
      }
    }

    // 3. Create exploration_patterns collection
    let patternsCollectionId;
    try {
      const patternsCollection = await db.createCollection(
        DATABASE_ID,
        ID.unique(),
        "User Exploration Patterns",
        ['read("any")', 'write("any")']
      );
      patternsCollectionId = patternsCollection.$id;
      console.log(`✅ exploration_patterns collection created with ID: ${patternsCollectionId}`);
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️ exploration_patterns collection already exists");
      } else {
        console.error(
          "❌ Error creating exploration_patterns collection:",
          error.message
        );
      }
    }

    // 4. Add attributes for exploration_patterns
    const patternsAttributes = [
      { key: "userId", type: "string", size: 100, required: true },

      // Exploration profile
      { key: "totalSessions", type: "integer", required: true, default: 0 },
      { key: "totalExplorations", type: "integer", required: true, default: 0 },
      {
        key: "successfulExplorations",
        type: "integer",
        required: true,
        default: 0,
      },
      {
        key: "preferenceStrength",
        type: "double",
        required: false,
        default: 0.5,
      },
      {
        key: "discoverySeeker",
        type: "boolean",
        required: true,
        default: false,
      },

      // Strategy performance
      {
        key: "epsilonGreedySuccess",
        type: "double",
        required: false,
        default: 0,
      },
      { key: "newItemSuccess", type: "double", required: false, default: 0 },
      {
        key: "categoryDiverseSuccess",
        type: "double",
        required: false,
        default: 0,
      },
      {
        key: "serendipitySuccess",
        type: "double",
        required: false,
        default: 0,
      },
      { key: "trendingSuccess", type: "double", required: false, default: 0 },
      { key: "culturalSuccess", type: "double", required: false, default: 0 },

      // Timestamps
      {
        key: "lastExplorationBoost",
        type: "string",
        size: 50,
        required: false,
      },
      { key: "lastUpdated", type: "string", size: 50, required: true },
      { key: "createdAt", type: "string", size: 50, required: true },
    ];

    console.log("🔧 Adding exploration_patterns attributes...");
    for (const attr of patternsAttributes) {
      try {
        if (attr.type === "string") {
          await db.createStringAttribute(
            DATABASE_ID,
            patternsCollectionId,
            attr.key,
            attr.size,
            attr.required,
            attr.default || null
          );
        } else if (attr.type === "boolean") {
          await db.createBooleanAttribute(
            DATABASE_ID,
            patternsCollectionId,
            attr.key,
            attr.required,
            attr.default !== undefined ? attr.default : null
          );
        } else if (attr.type === "integer") {
          await db.createIntegerAttribute(
            DATABASE_ID,
            patternsCollectionId,
            attr.key,
            attr.required,
            null,
            null,
            attr.default || null
          );
        } else if (attr.type === "double") {
          await db.createFloatAttribute(
            DATABASE_ID,
            patternsCollectionId,
            attr.key,
            attr.required,
            null,
            null,
            attr.default || null
          );
        }

        console.log(`✅ Added ${attr.key} (${attr.type})`);
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        if (error.message.includes("already exists")) {
          console.log(`ℹ️ ${attr.key} attribute already exists`);
        } else {
          console.error(`❌ Error adding ${attr.key}:`, error.message);
        }
      }
    }

    // 5. Create indexes for performance
    console.log("\n📊 Creating indexes...");
    
    // Only create indexes if we have valid collection IDs
    if (feedbackCollectionId && patternsCollectionId) {
      const indexes = [
        // Feedback indexes
        {
          collectionId: feedbackCollectionId,
          key: "userId_index",
          attributes: ["userId"],
        },
        {
          collectionId: feedbackCollectionId,
          key: "itemId_index",
          attributes: ["itemId"],
        },
        {
          collectionId: feedbackCollectionId,
          key: "session_index",
          attributes: ["sessionId"],
        },
        {
          collectionId: feedbackCollectionId,
          key: "exploration_index",
          attributes: ["wasExploration"],
        },

        // Pattern indexes
        {
          collectionId: patternsCollectionId,
          key: "userId_patterns_index",
          attributes: ["userId"],
        },
        {
          collectionId: patternsCollectionId,
          key: "discovery_seeker_index",
          attributes: ["discoverySeeker"],
        },
      ];

      for (const index of indexes) {
        try {
          await db.createIndex(
            DATABASE_ID,
            index.collectionId,
            index.key,
            "key",
            index.attributes
          );
          console.log(`✅ Created ${index.key}`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          if (error.message.includes("already exists")) {
            console.log(`ℹ️ ${index.key} index already exists`);
          } else {
            console.error(`❌ Error creating ${index.key}:`, error.message);
          }
        }
      }
    }

    console.log("\n🎉 Exploration Layer collections setup complete!");

    // Show summary
    console.log("\n📋 Collections Summary:");
    console.log(
      "1. recommendation_feedback - User feedback on recommendations"
    );
    console.log("   - Tracks impressions, clicks, purchases, ignores");
    console.log("   - Stores exploration context and strategy information");
    console.log("   - Enables learning from exploration outcomes");

    console.log("2. exploration_patterns - User exploration profiles");
    console.log("   - Tracks user exploration success rates by strategy");
    console.log(
      "   - Stores preference strength and discovery seeking behavior"
    );
    console.log("   - Enables personalized exploration rate adjustments");
  } catch (error) {
    console.error("❌ Failed to create exploration collections:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createExplorationCollections()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = createExplorationCollections;
