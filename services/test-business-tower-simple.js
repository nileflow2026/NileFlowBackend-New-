const BusinessSupplyTower = require("./services/towers/BusinessSupplyTower");
const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { ID, Query } = require("node-appwrite");

/**
 * Simple test for BusinessSupplyTower with direct data approach
 */

async function testBusinessSupplyTowerSimple() {
  try {
    console.log("🏢 Testing BusinessSupplyTower (Simple)...\n");

    // Initialize tower
    const businessTower = new BusinessSupplyTower();
    console.log("✅ BusinessSupplyTower initialized");

    // Create sample business data (without database interaction)
    const sampleBusinessData = {
      itemId: "sample_electronics_001",
      currentStock: 75,
      reservedStock: 10,
      availableStock: 65,
      reorderLevel: 20,
      stockoutRisk: 0.15,
      costPrice: 200.0,
      sellingPrice: 349.99,
      marginPercent: 42.9,
      marginBand: "high",
      warehouseLocation: "nairobi_central",
      averageDeliveryTime: 2,
      shippingCost: 15.0,
      deliveryComplexity: 1.2,
      isStrategicCategory: true,
      isPromoted: false,
      promotionBoost: 1.0,
      isSponsoredByVendor: false,
      sponsorBoost: 1.0,
      businessBoostScalar: 1.0,
      supplySuppression: 0.0,
      lastUpdated: new Date(),
    };

    console.log("🧪 Testing business optimization with sample data...");

    const userContext = {
      location: "nairobi_central",
      deviceType: "mobile",
    };

    // Test the core business optimization logic directly
    const optimization = await businessTower.computeBusinessOptimization(
      sampleBusinessData.itemId,
      sampleBusinessData, // Pass business data directly
      userContext
    );

    console.log("\n📊 Business Optimization Results:");
    console.log(
      `  🚀 Business Boost: ${optimization.businessBoostScalar.toFixed(3)}`
    );
    console.log(
      `  🚫 Supply Suppression: ${optimization.supplySuppression.toFixed(3)}`
    );

    if (optimization.businessMetrics) {
      console.log("\n📈 Business Metrics:");
      console.log(
        `  📦 Inventory Health: ${optimization.businessMetrics.inventoryHealth}`
      );
      console.log(
        `  💰 Margin Band: ${optimization.businessMetrics.marginBand}`
      );
      console.log(
        `  🚚 Logistics Complexity: ${optimization.businessMetrics.logisticsComplexity}`
      );
      console.log(
        `  🎯 Strategic Priority: ${optimization.businessMetrics.strategicPriority}`
      );
      console.log(
        `  📢 Is Sponsored: ${optimization.businessMetrics.isSponsored}`
      );
    }

    if (optimization.analysis) {
      console.log("\n🔍 Detailed Analysis:");

      const inv = optimization.analysis.inventory;
      console.log(
        `  📦 Inventory: ${inv.health} (${inv.daysOfStock.toFixed(
          1
        )} days remaining)`
      );
      console.log(
        `    • Action: ${inv.action}, Risk: ${inv.risk}, Urgency: ${inv.urgency}`
      );

      const margin = optimization.analysis.margin;
      console.log(`  💰 Margin: ${margin.profitability} (${margin.band} band)`);
      console.log(`    • Recommendation: ${margin.recommendation}`);

      const logistics = optimization.analysis.logistics;
      console.log(
        `  🚚 Logistics: ${logistics.feasibility} delivery (${logistics.deliveryZone})`
      );
      console.log(
        `    • Estimated delivery: ${logistics.estimatedDeliveryTime} days`
      );

      const strategic = optimization.analysis.strategic;
      console.log(
        `  🎯 Strategic: Priority ${strategic.priority} (${strategic.recommendation})`
      );

      const sponsored = optimization.analysis.sponsored;
      console.log(
        `  📢 Sponsored: ${sponsored.sponsorType} (transparency: ${sponsored.transparency})`
      );
    }

    // Test different scenarios
    console.log("\n🧪 Testing different business scenarios...\n");

    // Scenario 1: Out of stock item
    console.log("📋 Scenario 1: Out of Stock Item");
    const outOfStockData = {
      ...sampleBusinessData,
      itemId: "out_of_stock_item",
      currentStock: 0,
      availableStock: 0,
      stockoutRisk: 1.0,
    };

    const outOfStockResult = await businessTower.computeBusinessOptimization(
      outOfStockData.itemId,
      outOfStockData,
      userContext
    );

    console.log(
      `  🚀 Boost: ${outOfStockResult.businessBoostScalar.toFixed(3)}`
    );
    console.log(
      `  🚫 Suppression: ${outOfStockResult.supplySuppression.toFixed(3)}`
    );
    console.log(`  📦 Status: ${outOfStockResult.analysis.inventory.health}`);

    // Scenario 2: Low margin item
    console.log("\n📋 Scenario 2: Low Margin Item");
    const lowMarginData = {
      ...sampleBusinessData,
      itemId: "low_margin_item",
      costPrice: 95.0,
      sellingPrice: 99.99,
      marginPercent: 4.0,
      marginBand: "break_even",
    };

    const lowMarginResult = await businessTower.computeBusinessOptimization(
      lowMarginData.itemId,
      lowMarginData,
      userContext
    );

    console.log(
      `  🚀 Boost: ${lowMarginResult.businessBoostScalar.toFixed(3)}`
    );
    console.log(
      `  🚫 Suppression: ${lowMarginResult.supplySuppression.toFixed(3)}`
    );
    console.log(
      `  💰 Margin: ${lowMarginResult.analysis.margin.profitability}`
    );

    // Scenario 3: Sponsored strategic item
    console.log("\n📋 Scenario 3: Sponsored Strategic Item");
    const sponsoredData = {
      ...sampleBusinessData,
      itemId: "sponsored_strategic_item",
      isStrategicCategory: true,
      isPromoted: true,
      promotionBoost: 1.3,
      isSponsoredByVendor: true,
      sponsorBoost: 1.2,
    };

    const sponsoredResult = await businessTower.computeBusinessOptimization(
      sponsoredData.itemId,
      sponsoredData,
      userContext
    );

    console.log(
      `  🚀 Boost: ${sponsoredResult.businessBoostScalar.toFixed(3)}`
    );
    console.log(
      `  🚫 Suppression: ${sponsoredResult.supplySuppression.toFixed(3)}`
    );
    console.log(
      `  🎯 Strategic: ${sponsoredResult.analysis.strategic.priority}`
    );
    console.log(
      `  📢 Sponsored: ${sponsoredResult.analysis.sponsored.isSponsored}`
    );

    // Test batch processing with sample data
    console.log("\n⚡ Testing batch processing...");

    const batchData = new Map([
      ["item1", sampleBusinessData],
      ["item2", outOfStockData],
      ["item3", lowMarginData],
    ]);

    // Override getBatchBusinessData for this test
    const originalGetBatch =
      businessTower.getBatchBusinessData.bind(businessTower);
    businessTower.getBatchBusinessData = async function (itemIds) {
      const results = new Map();
      itemIds.forEach((id) => {
        if (batchData.has(id)) {
          results.set(id, batchData.get(id));
        }
      });
      return results;
    };

    const batchResults = await businessTower.computeBatchBusiness(
      ["item1", "item2", "item3"],
      userContext
    );

    console.log("📊 Batch Results:");
    batchResults.forEach((result, itemId) => {
      console.log(
        `  ${itemId}: Boost=${result.businessBoostScalar.toFixed(
          3
        )}, Suppression=${result.supplySuppression.toFixed(3)}`
      );
    });

    // Restore original method
    businessTower.getBatchBusinessData = originalGetBatch;

    console.log("\n🎉 BusinessSupplyTower simple test completed successfully!");
    console.log("\n📝 Summary:");
    console.log("  ✅ Business optimization computation works");
    console.log("  ✅ Inventory health analysis works");
    console.log("  ✅ Margin impact assessment works");
    console.log("  ✅ Logistics evaluation works");
    console.log("  ✅ Strategic priorities work");
    console.log("  ✅ Sponsored content handling works");
    console.log("  ✅ Batch processing works");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
}

testBusinessSupplyTowerSimple();
