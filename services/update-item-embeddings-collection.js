// Check and update item_embeddings collection for ItemRepresentationTower
require("dotenv/config");
const { db } = require("./src/appwrite");
const { env } = require("./src/env");

async function checkAndUpdateItemEmbeddingsCollection() {
  try {
    console.log("🔍 Checking item_embeddings collection attributes...");

    // Test current collection by trying to create a minimal document
    try {
      const testDoc = await db.createDocument(
        env.APPWRITE_DATABASE_ID,
        "item_embeddings",
        "unique()",
        {
          itemId: "test_check_" + Date.now(),
          category: "test",
          brand: "test",
          priceUSD: 10.0,
          lastUpdated: new Date().toISOString(),
          isActive: true,
        }
      );

      console.log("✅ Basic document creation works");
      console.log("📋 Available attributes:", Object.keys(testDoc));

      // Delete test document
      await db.deleteDocument(
        env.APPWRITE_DATABASE_ID,
        "item_embeddings",
        testDoc.$id
      );
      console.log("🗑️  Test document cleaned up");
    } catch (error) {
      console.log("❌ Error testing collection:", error.message);
    }

    // Add missing attributes needed by ItemRepresentationTower
    console.log(
      "\n🔧 Adding missing attributes for ItemRepresentationTower..."
    );

    const requiredAttributes = [
      { name: "itemEmbedding", type: "string", size: 10000, required: false },
      { name: "subcategory", type: "string", size: 100, required: false },
      { name: "priceBand", type: "string", size: 20, required: false },
      { name: "stockLevel", type: "integer", required: false, default: 0 },
      { name: "stockVelocity", type: "float", required: false, default: 0.0 },
      { name: "popularityScore", type: "float", required: false, default: 0.0 },
      { name: "trendingScore", type: "float", required: false, default: 0.0 },
      { name: "sellerId", type: "string", size: 100, required: false },
      {
        name: "sellerReputation",
        type: "float",
        required: false,
        default: 0.5,
      },
      { name: "titleEmbedding", type: "string", size: 5000, required: false },
      {
        name: "descriptionEmbedding",
        type: "string",
        size: 5000,
        required: false,
      },
    ];

    for (const attr of requiredAttributes) {
      try {
        let attribute;

        switch (attr.type) {
          case "string":
            attribute = await db.createStringAttribute(
              env.APPWRITE_DATABASE_ID,
              "item_embeddings",
              attr.name,
              attr.size,
              attr.required,
              attr.default || null
            );
            break;

          case "integer":
            attribute = await db.createIntegerAttribute(
              env.APPWRITE_DATABASE_ID,
              "item_embeddings",
              attr.name,
              attr.required,
              attr.min || null,
              attr.max || null,
              attr.default !== undefined ? attr.default : null
            );
            break;

          case "float":
            attribute = await db.createFloatAttribute(
              env.APPWRITE_DATABASE_ID,
              "item_embeddings",
              attr.name,
              attr.required,
              attr.min || null,
              attr.max || null,
              attr.default !== undefined ? attr.default : null
            );
            break;

          default:
            console.log(`⚠️  Unknown attribute type: ${attr.type}`);
            continue;
        }

        console.log(`✅ Added ${attr.name} (${attr.type})`);
      } catch (error) {
        if (error.message.includes("already exists")) {
          console.log(`ℹ️  ${attr.name} already exists`);
        } else {
          console.log(`⚠️  Failed to add ${attr.name}:`, error.message);
        }
      }

      // Small delay between attribute creation
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("\n🎉 item_embeddings collection update completed!");
  } catch (error) {
    console.error("❌ Failed to update item_embeddings collection:", error);
  }
}

// Run the update
checkAndUpdateItemEmbeddingsCollection();
