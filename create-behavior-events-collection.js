const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { ID } = require("node-appwrite");

/**
 * Create User Behavior Events Collection Schema
 *
 * This collection stores user interaction events for intent computation:
 * - Search queries and patterns
 * - Item views, clicks, and interactions
 * - Purchase and cart behaviors
 * - Session context and metadata
 */

async function createBehaviorEventsCollection() {
  const DATABASE_ID = env.APPWRITE_DATABASE_ID;

  console.log("🚀 Creating User Behavior Events Collection...");

  try {
    // 1. Create the collection with auto-generated ID
    const collection = await db.createCollection(
      DATABASE_ID,
      ID.unique(),
      "User Behavior Events",
      ['read("any")', 'write("any")']
    );

    const collectionId = collection.$id;
    console.log(
      `✅ Behavior events collection created with ID: ${collectionId}`
    );

    // 2. Create attributes for behavior events
    const attributes = [
      // Core identification
      { key: "userId", type: "string", size: 255, required: true },
      { key: "sessionId", type: "string", size: 255, required: true },
      { key: "eventType", type: "string", size: 50, required: true }, // search, view, click, add_to_cart, purchase

      // Event details
      { key: "itemId", type: "string", size: 255, required: false },
      { key: "searchQuery", type: "string", size: 500, required: false },
      { key: "timestamp", type: "string", size: 255, required: true },
      { key: "timeOnPage", type: "integer", required: false },

      // Context information
      { key: "deviceType", type: "string", size: 50, required: false },
      { key: "location", type: "string", size: 100, required: false },
      { key: "referrer", type: "string", size: 500, required: false },
      { key: "userAgent", type: "string", size: 500, required: false },

      // Metadata (JSON string for flexible data)
      { key: "metadata", type: "string", size: 2000, required: false }, // category, brand, price, etc.

      // Additional tracking
      { key: "ipAddress", type: "string", size: 45, required: false },
      { key: "language", type: "string", size: 10, required: false },
      { key: "timezone", type: "string", size: 50, required: false },
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
      { key: "timestamp_index", attributes: ["timestamp"] },
      { key: "eventType_index", attributes: ["eventType"] },
      { key: "userId_timestamp_index", attributes: ["userId", "timestamp"] },
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

    console.log("\\n🎉 User behavior events collection setup complete!");
    console.log(`Collection ID: ${collectionId}`);

    // Show schema summary
    console.log("\\n📋 Schema Summary:");
    console.log("- Core: userId, sessionId, eventType, timestamp");
    console.log("- Event Data: itemId, searchQuery, timeOnPage");
    console.log("- Context: deviceType, location, referrer, userAgent");
    console.log("- Metadata: flexible JSON storage for event-specific data");
    console.log("- Tracking: ipAddress, language, timezone");
  } catch (error) {
    console.error("❌ Failed to create behavior events collection:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createBehaviorEventsCollection()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = createBehaviorEventsCollection;
