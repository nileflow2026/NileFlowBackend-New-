const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { ID } = require("node-appwrite");

/**
 * Create Social Signals Collection Schema
 *
 * This collection stores social proof and trust data for items:
 * - Review metrics and quality
 * - Purchase velocity and momentum
 * - Seller trust and reputation
 * - Fraud detection flags
 * - Computed trust scores
 */

async function createSocialSignalsCollection() {
  const DATABASE_ID = env.APPWRITE_DATABASE_ID;

  console.log("🚀 Creating Social Signals Collection...");

  try {
    // 1. Create the collection with auto-generated ID
    const collection = await db.createCollection(
      DATABASE_ID,
      ID.unique(),
      "Item Social Signals",
      ['read("any")', 'write("any")']
    );

    const collectionId = collection.$id;
    console.log(
      `✅ Social signals collection created with ID: ${collectionId}`
    );

    // 2. Create attributes for social signals
    const attributes = [
      // Core item identification
      { key: "itemId", type: "string", size: 255, required: true },
      { key: "isActive", type: "boolean", required: true, default: true },

      // Review metrics
      { key: "totalReviews", type: "integer", required: false, default: 0 },
      { key: "averageRating", type: "double", required: false, default: 0 },
      { key: "rating5Star", type: "integer", required: false, default: 0 },
      { key: "rating4Star", type: "integer", required: false, default: 0 },
      { key: "rating3Star", type: "integer", required: false, default: 0 },
      { key: "rating2Star", type: "integer", required: false, default: 0 },
      { key: "rating1Star", type: "integer", required: false, default: 0 },

      // Purchase metrics
      { key: "totalPurchases", type: "integer", required: false, default: 0 },
      { key: "purchaseVelocity", type: "double", required: false, default: 0 },
      {
        key: "recentPurchases24h",
        type: "integer",
        required: false,
        default: 0,
      },
      {
        key: "recentPurchases7d",
        type: "integer",
        required: false,
        default: 0,
      },

      // Trust metrics
      { key: "returnRate", type: "double", required: false, default: 0 },
      { key: "refundRate", type: "double", required: false, default: 0 },
      { key: "fraudFlags", type: "integer", required: false, default: 0 },

      // Seller metrics
      {
        key: "sellerTrustScore",
        type: "double",
        required: false,
        default: 0.5,
      },
      {
        key: "sellerResponseTime",
        type: "double",
        required: false,
        default: 24,
      },
    ];

    // Add attributes in batches (avoid overwhelming the API)
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

    // Add computed score attributes in a second batch (if we hit limits)
    const computedAttributes = [
      { key: "sellerRating", type: "double", required: false, default: 0 },
      { key: "trustScore", type: "double", required: false, default: 0.5 },
      { key: "riskPenalty", type: "double", required: false, default: 0 },
      {
        key: "socialProofBoost",
        type: "double",
        required: false,
        default: 1.0,
      },
      { key: "lastUpdated", type: "string", size: 255, required: false },
    ];

    console.log("\\n🔧 Adding computed score attributes...");

    for (const attr of computedAttributes) {
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
      { key: "itemId_index", attributes: ["itemId"] },
      { key: "trustScore_index", attributes: ["trustScore"] },
      { key: "velocity_index", attributes: ["purchaseVelocity"] },
      { key: "rating_index", attributes: ["averageRating"] },
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

    console.log("\\n🎉 Social signals collection setup complete!");
    console.log(`Collection ID: ${collectionId}`);

    // Show schema summary
    console.log("\\n📋 Schema Summary:");
    console.log("- Core: itemId, isActive");
    console.log("- Reviews: totalReviews, averageRating, rating distributions");
    console.log("- Purchases: totalPurchases, velocity, recent activity");
    console.log("- Trust: returnRate, refundRate, fraudFlags");
    console.log("- Seller: trustScore, responseTime, rating");
    console.log("- Computed: trustScore, riskPenalty, socialProofBoost");
  } catch (error) {
    console.error("❌ Failed to create social signals collection:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createSocialSignalsCollection()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = createSocialSignalsCollection;
