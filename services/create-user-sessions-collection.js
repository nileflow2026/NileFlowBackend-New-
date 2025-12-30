const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { ID } = require("node-appwrite");

/**
 * Create User Sessions Collection Schema
 *
 * This collection stores user session data for intent computation:
 * - Session metadata and context
 * - Aggregated session metrics
 * - Intent embeddings and scores
 * - Session-level preferences
 */

async function createUserSessionsCollection() {
  const DATABASE_ID = env.APPWRITE_DATABASE_ID;

  console.log("🚀 Creating User Sessions Collection...");

  try {
    // 1. Create the collection with auto-generated ID
    const collection = await db.createCollection(
      DATABASE_ID,
      ID.unique(),
      "User Sessions",
      ['read("any")', 'write("any")']
    );

    const collectionId = collection.$id;
    console.log(`✅ User sessions collection created with ID: ${collectionId}`);

    // 2. Create attributes for user sessions
    const attributes = [
      // Core identification
      { key: "userId", type: "string", size: 255, required: true },
      { key: "sessionId", type: "string", size: 255, required: true },
      { key: "isActive", type: "boolean", required: true, default: true },

      // Session metadata
      { key: "deviceType", type: "string", size: 50, required: false },
      { key: "location", type: "string", size: 100, required: false },
      { key: "language", type: "string", size: 10, required: false },
      { key: "timezone", type: "string", size: 50, required: false },
      { key: "userAgent", type: "string", size: 500, required: false },
      { key: "ipAddress", type: "string", size: 45, required: false },

      // Session timestamps
      { key: "startTime", type: "string", size: 255, required: true },
      { key: "lastActivity", type: "string", size: 255, required: true },
      { key: "endTime", type: "string", size: 255, required: false },

      // Session metrics
      { key: "totalViews", type: "integer", required: false, default: 0 },
      { key: "totalClicks", type: "integer", required: false, default: 0 },
      { key: "totalSearches", type: "integer", required: false, default: 0 },
      { key: "sessionDuration", type: "integer", required: false, default: 0 }, // seconds

      // Intent computation results
      {
        key: "userIntentEmbedding",
        type: "string",
        size: 5000,
        required: false,
      }, // JSON array
      {
        key: "shortTermIntentScore",
        type: "double",
        required: false,
        default: 0.1,
      },

      // Session-level interests (JSON strings)
      { key: "priceRangeInterest", type: "string", size: 500, required: false },
      { key: "categoryInterest", type: "string", size: 1000, required: false },
      { key: "brandInterest", type: "string", size: 1000, required: false },
    ];

    // Add attributes
    console.log("🔧 Adding attributes...");

    for (const attr of attributes) {
      try {
        if (attr.type === "string") {
          await db.createStringAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.size,
            attr.required,
            attr.default || null
          );
        } else if (attr.type === "integer") {
          await db.createIntegerAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required,
            null, // min
            null, // max
            attr.default || null
          );
        } else if (attr.type === "double") {
          await db.createFloatAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required,
            null, // min
            null, // max
            attr.default || null
          );
        } else if (attr.type === "boolean") {
          await db.createBooleanAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required,
            attr.default || false
          );
        }

        console.log(`✅ Added ${attr.key} (${attr.type})`);

        // Small delay between attributes
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Error adding ${attr.key}:`, error.message);
      }
    }

    // 3. Create indexes for performance
    console.log("\\n📊 Creating indexes...");

    const indexes = [
      { key: "userId_index", attributes: ["userId"] },
      { key: "sessionId_index", attributes: ["sessionId"] },
      { key: "userId_sessionId_index", attributes: ["userId", "sessionId"] },
      { key: "isActive_index", attributes: ["isActive"] },
      { key: "intentScore_index", attributes: ["shortTermIntentScore"] },
    ];

    for (const index of indexes) {
      try {
        await db.createIndex(
          DATABASE_ID,
          collectionId,
          index.key,
          "key", // type
          index.attributes
        );
        console.log(`✅ Created ${index.key}`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Error creating ${index.key}:`, error.message);
      }
    }

    console.log("\\n🎉 User sessions collection setup complete!");
    console.log(`Collection ID: ${collectionId}`);

    // Show schema summary
    console.log("\\n📋 Schema Summary:");
    console.log("- Core: userId, sessionId, isActive");
    console.log("- Context: deviceType, location, language, timezone");
    console.log("- Timestamps: startTime, lastActivity, endTime");
    console.log(
      "- Metrics: totalViews, totalClicks, totalSearches, sessionDuration"
    );
    console.log("- Intent: userIntentEmbedding (128D), shortTermIntentScore");
    console.log(
      "- Interests: priceRangeInterest, categoryInterest, brandInterest"
    );
  } catch (error) {
    console.error("❌ Failed to create user sessions collection:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createUserSessionsCollection()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = createUserSessionsCollection;
