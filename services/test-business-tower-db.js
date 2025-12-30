// Test BusinessSupplyTower with real database integration
require("dotenv/config");
const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const BusinessSupplyTower = require("./services/towers/BusinessSupplyTower");

async function testBusinessTowerWithDatabase() {
  try {
    console.log(
      "🏢 Testing BusinessSupplyTower with database integration...\n"
    );

    const tower = new BusinessSupplyTower(null, env.APPWRITE_DATABASE_ID);

    // First, let's check if we have any business metrics data
    console.log("📊 Checking existing business metrics data...");
    let hasData = false;
    try {
      const existingData = await tower.getBusinessMetrics(
        "electronics_phone_001"
      );
      if (existingData) {
        console.log("✅ Found existing data for electronics_phone_001");
        hasData = true;
      }
    } catch (error) {
      console.log("ℹ️  No existing data found");
    }

    if (!hasData) {
      // Create sample business metrics
      console.log("\n📝 Creating sample business metrics data...");
      const sampleMetrics = [
        {
          itemId: "electronics_phone_001",
          category: "electronics",
          subCategory: "smartphones",
          currentStock: 25,
          reservedStock: 3,
          availableStock: 22,
          reorderLevel: 10,
          maxStock: 100,
          avgDailySales: 2.5,
          costPrice: 250.0,
          sellingPrice: 350.0,
          marginPercent: 28.57,
          isPremiumItem: true,
          isStrategicItem: true,
          vendorId: "vendor_tech_001",
          supplierId: "supplier_samsung",
          leadTimeDays: 7,
          deliveryComplexity: "same_city",
          avgDeliveryDays: 2,
          returnRate: 0.05,
          rating: 4.5,
          reviewCount: 150,
          isSponsored: false,
          sponsorshipAmount: 0,
          lastUpdated: new Date().toISOString(),
        },
        {
          itemId: "fashion_shirt_002",
          category: "fashion",
          subCategory: "shirts",
          currentStock: 0,
          reservedStock: 0,
          availableStock: 0,
          reorderLevel: 20,
          maxStock: 200,
          avgDailySales: 5.0,
          costPrice: 15.0,
          sellingPrice: 25.0,
          marginPercent: 40.0,
          isPremiumItem: false,
          isStrategicItem: false,
          vendorId: "vendor_fashion_001",
          supplierId: "supplier_textiles",
          leadTimeDays: 14,
          deliveryComplexity: "cross_city",
          avgDeliveryDays: 5,
          returnRate: 0.15,
          rating: 4.0,
          reviewCount: 80,
          isSponsored: true,
          sponsorshipAmount: 50.0,
          lastUpdated: new Date().toISOString(),
        },
        {
          itemId: "food_snacks_003",
          category: "food",
          subCategory: "snacks",
          currentStock: 150,
          reservedStock: 10,
          availableStock: 140,
          reorderLevel: 50,
          maxStock: 300,
          avgDailySales: 12.0,
          costPrice: 2.5,
          sellingPrice: 3.0,
          marginPercent: 16.67,
          isPremiumItem: false,
          isStrategicItem: true,
          vendorId: "vendor_food_001",
          supplierId: "supplier_snacks",
          leadTimeDays: 3,
          deliveryComplexity: "same_city",
          avgDeliveryDays: 1,
          returnRate: 0.02,
          rating: 3.8,
          reviewCount: 200,
          isSponsored: false,
          sponsorshipAmount: 0,
          lastUpdated: new Date().toISOString(),
        },
      ];

      // Insert sample metrics
      for (const metrics of sampleMetrics) {
        try {
          await tower.storeBusinessMetrics(metrics.itemId, metrics);
          console.log(`✅ Created business metrics for ${metrics.itemId}`);
        } catch (err) {
          console.log(
            `⚠️  Failed to create metrics for ${metrics.itemId}:`,
            err.message
          );
        }
      }
    }

    console.log("\n🧪 Testing business optimization with database data...");

    // Test with each item
    const testItems = [
      "electronics_phone_001",
      "fashion_shirt_002",
      "food_snacks_003",
    ];

    for (const itemId of testItems) {
      try {
        console.log(`\n📱 Testing item: ${itemId}`);
        const businessData = await tower.getBusinessMetrics(itemId);

        if (businessData) {
          const optimization = await tower.computeBusinessOptimization(itemId);

          console.log(
            `  🚀 Business Boost: ${optimization.businessBoostScalar.toFixed(
              3
            )}`
          );
          console.log(
            `  🚫 Supply Suppression: ${optimization.supplySuppression.toFixed(
              3
            )}`
          );
          console.log(
            `  📦 Inventory: ${optimization.analysis.inventory.status} (${(
              optimization.analysis.inventory.daysRemaining || 0
            ).toFixed(1)} days)`
          );
          console.log(
            `  💰 Margin: ${optimization.analysis.margin.band} (${businessData.marginPercent}%)`
          );
          console.log(
            `  🚚 Logistics: ${
              optimization.analysis.logistics.complexity
            } delivery (${
              optimization.analysis.logistics.estimatedDays || 0
            } days)`
          );
          console.log(
            `  🎯 Strategic: ${businessData.isStrategicCategory ? "Yes" : "No"}`
          );
          console.log(
            `  📢 Sponsored: ${businessData.isSponsoredByVendor ? "Yes" : "No"}`
          );
        } else {
          console.log(`  ⚠️  No business data found for ${itemId}`);
        }
      } catch (error) {
        console.log(`  ❌ Error testing ${itemId}:`, error.message);
      }
    }

    // Test batch optimization
    console.log("\n⚡ Testing batch optimization...");
    try {
      const batchResults = await tower.computeBatchOptimization(testItems);
      console.log("📊 Batch optimization results:");

      for (const [itemId, result] of Object.entries(batchResults)) {
        if (result.success) {
          console.log(
            `  ${itemId}: Boost=${result.businessBoostScalar.toFixed(
              3
            )}, Suppression=${result.supplySuppression.toFixed(3)}`
          );
        } else {
          console.log(`  ${itemId}: Error - ${result.error}`);
        }
      }
    } catch (error) {
      console.log("❌ Batch optimization failed:", error.message);
    }

    console.log(
      "\n🎉 BusinessSupplyTower database integration test completed!"
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Stack trace:", error.stack);
  }
}

// Run the test
testBusinessTowerWithDatabase();
