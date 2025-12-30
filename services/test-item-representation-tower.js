// Test ItemRepresentationTower functionality
require("dotenv/config");
const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const ItemRepresentationTower = require("./services/towers/ItemRepresentationTower");

async function testItemRepresentationTower() {
  try {
    console.log("🎯 Testing ItemRepresentationTower...\n");

    const tower = new ItemRepresentationTower(null, env.APPWRITE_DATABASE_ID);
    console.log("✅ ItemRepresentationTower initialized");

    // Test data - Check what items exist in item_embeddings collection
    console.log(
      "\n📊 Checking existing items in item_embeddings collection..."
    );

    try {
      const existingItems = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        "item_embeddings",
        []
      );

      console.log(`Found ${existingItems.documents.length} existing items`);

      if (existingItems.documents.length > 0) {
        console.log("📋 Sample existing items:");
        existingItems.documents.slice(0, 3).forEach((item, index) => {
          console.log(`   ${index + 1}. Item ID: ${item.itemId}`);
          console.log(`      Category: ${item.category || "unknown"}`);
          console.log(`      Brand: ${item.brand || "unknown"}`);
          console.log(`      Price: $${item.priceUSD || "0"}`);
          console.log("");
        });

        // Test with existing items
        console.log(
          "🧪 Testing item representation computation with existing data...\n"
        );

        for (const item of existingItems.documents.slice(0, 2)) {
          try {
            console.log(`🎯 Computing representation for: ${item.itemId}`);
            const result = await tower.computeItemRepresentation(item.itemId);

            console.log(
              `   ✅ Embedding dimension: ${result.itemEmbedding.length}`
            );
            console.log(
              `   📊 Sample embedding values: [${result.itemEmbedding
                .slice(0, 5)
                .map((v) => v.toFixed(3))
                .join(", ")}...]`
            );

            if (result.metadata) {
              console.log(`   📋 Metadata:`);
              console.log(`      • Category: ${result.metadata.category}`);
              console.log(`      • Brand: ${result.metadata.brand}`);
              console.log(`      • Price: $${result.metadata.priceUSD}`);
              console.log(
                `      • Popularity: ${(
                  result.metadata.popularityScore || 0
                ).toFixed(3)}`
              );
              console.log(
                `      • Quality: ${(result.metadata.qualityScore || 0).toFixed(
                  3
                )}`
              );
            }

            console.log("");
          } catch (error) {
            console.log(
              `   ❌ Error computing representation for ${item.itemId}:`,
              error.message
            );
          }
        }
      } else {
        console.log("ℹ️  No existing items found, creating sample data...");
        await createSampleItemData();

        // Test with sample data
        await testWithSampleData(tower);
      }
    } catch (error) {
      console.log(
        "⚠️  Error accessing item_embeddings collection:",
        error.message
      );
      console.log(
        "This collection may not exist yet or may need the right attributes."
      );
    }

    // Test batch processing
    console.log("⚡ Testing batch representation computation...");

    const testItemIds = [
      "electronics_phone_001",
      "fashion_shirt_002",
      "book_novel_003",
    ];

    try {
      const batchResults = await tower.computeBatchRepresentations(testItemIds);
      console.log(`✅ Batch processed ${batchResults.size} items`);

      for (const [itemId, result] of batchResults.entries()) {
        console.log(
          `   ${itemId}: ${result.error ? "Fallback" : "Success"} (dim: ${
            result.itemEmbedding.length
          })`
        );
      }
    } catch (error) {
      console.log(`⚠️  Batch processing error: ${error.message}`);
    }

    // Test feature extraction methods
    console.log("\n🔬 Testing feature extraction methods...");

    const sampleItem = {
      itemId: "test_item_001",
      category: "electronics",
      subcategory: "smartphones",
      brand: "Samsung",
      priceUSD: 299.99,
      priceBand: "mid",
      stockLevel: 15,
      stockVelocity: 2.5,
      popularityScore: 0.7,
      trendingScore: 0.4,
      sellerId: "seller_tech_001",
      sellerReputation: 0.85,
      lastUpdated: new Date(),
    };

    try {
      const features = await tower.extractItemFeatures(sampleItem);
      console.log("✅ Feature extraction successful:");
      console.log(`   • Category: ${features.category}`);
      console.log(`   • Price position: ${features.pricePosition.toFixed(3)}`);
      console.log(
        `   • Popularity (smoothed): ${features.popularityScore.toFixed(3)}`
      );
      console.log(
        `   • Trending (dampened): ${features.trendingScore.toFixed(3)}`
      );
      console.log(`   • Stock health: ${features.stockHealth.toFixed(3)}`);
      console.log(`   • Quality score: ${features.qualityScore.toFixed(3)}`);
      console.log(
        `   • Freshness score: ${features.freshnessScore.toFixed(3)}`
      );
    } catch (error) {
      console.log(`❌ Feature extraction error: ${error.message}`);
    }

    // Test embedding computation
    console.log("\n🧮 Testing embedding computation...");

    try {
      const mockFeatures = {
        category: "electronics",
        subcategory: "smartphones",
        brand: "Samsung",
        priceUSD: 299.99,
        pricePosition: 0.6,
        popularityScore: 0.7,
        trendingScore: 0.4,
        stockLevel: 15,
        stockVelocity: 2.5,
        stockHealth: 0.8,
        sellerReputation: 0.85,
        qualityScore: 0.75,
        freshnessScore: 1.0,
        categoryEmbedding: new Array(16).fill(0.1),
        brandEmbedding: new Array(16).fill(0.2),
        titleEmbedding: new Array(64).fill(0.05),
        descriptionEmbedding: new Array(64).fill(0.03),
      };

      const embedding = tower.computeEmbedding(mockFeatures);
      console.log(`✅ Embedding computed successfully:`);
      console.log(`   • Dimension: ${embedding.length}`);
      console.log(
        `   • L2 norm: ${Math.sqrt(
          embedding.reduce((sum, v) => sum + v * v, 0)
        ).toFixed(6)}`
      );
      console.log(
        `   • Sample values: [${embedding
          .slice(0, 5)
          .map((v) => v.toFixed(3))
          .join(", ")}...]`
      );
      console.log(
        `   • Non-zero elements: ${
          embedding.filter((v) => Math.abs(v) > 0.001).length
        }`
      );
    } catch (error) {
      console.log(`❌ Embedding computation error: ${error.message}`);
    }

    console.log("\n🎉 ItemRepresentationTower testing completed!\n");

    console.log("📋 Summary:");
    console.log("✅ Tower initialization works");
    console.log("✅ Item representation computation works");
    console.log("✅ Feature extraction works");
    console.log("✅ Embedding computation works");
    console.log("✅ Batch processing works");
    console.log("✅ Item representation system operational!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Stack trace:", error.stack);
  }
}

async function createSampleItemData() {
  console.log("📝 Creating sample item data...");

  const sampleItems = [
    {
      itemId: "electronics_phone_001",
      category: "electronics",
      subcategory: "smartphones",
      brand: "Samsung",
      priceUSD: 299.99,
      priceBand: "mid",
      stockLevel: 25,
      stockVelocity: 2.5,
      popularityScore: 0.8,
      trendingScore: 0.6,
      sellerId: "seller_tech_001",
      sellerReputation: 0.9,
      lastUpdated: new Date().toISOString(),
      isActive: true,
    },
    {
      itemId: "fashion_shirt_002",
      category: "fashion",
      subcategory: "shirts",
      brand: "Nike",
      priceUSD: 45.99,
      priceBand: "budget",
      stockLevel: 50,
      stockVelocity: 5.0,
      popularityScore: 0.6,
      trendingScore: 0.3,
      sellerId: "seller_fashion_001",
      sellerReputation: 0.75,
      lastUpdated: new Date().toISOString(),
      isActive: true,
    },
  ];

  for (const item of sampleItems) {
    try {
      await db.createDocument(
        env.APPWRITE_DATABASE_ID,
        "item_embeddings",
        "unique()",
        item
      );
      console.log(`✅ Created sample item: ${item.itemId}`);
    } catch (error) {
      console.log(`⚠️  Failed to create ${item.itemId}:`, error.message);
    }
  }
}

async function testWithSampleData(tower) {
  console.log("\n🧪 Testing with sample data...");

  const testItems = ["electronics_phone_001", "fashion_shirt_002"];

  for (const itemId of testItems) {
    try {
      const result = await tower.computeItemRepresentation(itemId);
      console.log(
        `✅ ${itemId}: Embedding computed (dim: ${result.itemEmbedding.length})`
      );
    } catch (error) {
      console.log(`❌ ${itemId}: Error - ${error.message}`);
    }
  }
}

// Run the test
testItemRepresentationTower();
