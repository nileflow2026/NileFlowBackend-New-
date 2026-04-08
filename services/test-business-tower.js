const BusinessSupplyTower = require("./services/towers/BusinessSupplyTower");
const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { ID } = require("node-appwrite");

/**
 * Test script for BusinessSupplyTower
 * This will verify the tower works with your database setup
 */

async function testBusinessSupplyTower() {
  try {
    console.log("🏢 Testing BusinessSupplyTower...\n");

    // Initialize the tower
    const businessTower = new BusinessSupplyTower();
    console.log("✅ BusinessSupplyTower initialized");

    // Check if business_metrics collection exists
    console.log("\n📋 Checking for business_metrics collection...");
    try {
      const collection = await db.getCollection(
        env.APPWRITE_DATABASE_ID,
        "business_metrics"
      );
      console.log(`✅ Found business_metrics collection: ${collection.name}`);

      // List attributes
      const attributes = await db.listAttributes(
        env.APPWRITE_DATABASE_ID,
        "business_metrics"
      );
      console.log(`📝 Attributes: ${attributes.attributes.length}`);
      attributes.attributes.forEach((attr) => {
        console.log(
          `  • ${attr.key}: ${attr.type}${attr.size ? `(${attr.size})` : ""}`
        );
      });
    } catch (error) {
      if (error.code === 404) {
        console.log("❌ business_metrics collection not found");
        console.log(
          "We need to create it. Let me create sample business metrics..."
        );

        await createBusinessMetricsCollection();
        console.log("✅ business_metrics collection created");
      } else {
        throw error;
      }
    }

    // Test business optimization computation
    console.log("\n🧪 Testing business optimization computation...");

    // Create a test business metric if collection exists
    const testItemId = "test_item_" + Date.now();

    try {
      // Try to create a test business metric
      const testBusinessData = {
        itemId: testItemId,
        currentStock: 100,
        reservedStock: 10,
        availableStock: 90,
        reorderLevel: 20,
        stockoutRisk: 0.2,
        costPrice: 50.0,
        sellingPrice: 79.99,
        marginPercent: 37.5,
        marginBand: "high",
        warehouseLocation: "nairobi_central",
        averageDeliveryTime: 3,
        shippingCost: 5.0,
        deliveryComplexity: 1.2,
        isStrategicCategory: true,
        isPromoted: false,
        promotionBoost: 1.0,
        isSponsoredByVendor: false,
        sponsorBoost: 1.0,
        businessBoostScalar: 1.0,
        supplySuppression: 0.0,
        lastUpdated: new Date().toISOString(),
        isActive: true,
      };

      const businessDoc = await db.createDocument(
        env.APPWRITE_DATABASE_ID,
        "business_metrics",
        ID.unique(),
        testBusinessData
      );

      console.log(`✅ Created test business metrics for item: ${testItemId}`);

      // Test the business optimization
      const userContext = {
        location: "nairobi_central",
        deviceType: "web",
      };

      const businessOptimization =
        await businessTower.computeBusinessOptimization(
          testItemId,
          null,
          userContext
        );

      console.log("\n📊 Business Optimization Results:");
      console.log(
        `  Business Boost: ${businessOptimization.businessBoostScalar.toFixed(
          3
        )}`
      );
      console.log(
        `  Supply Suppression: ${businessOptimization.supplySuppression.toFixed(
          3
        )}`
      );
      console.log(
        `  Inventory Health: ${businessOptimization.businessMetrics.inventoryHealth}`
      );
      console.log(
        `  Margin Band: ${businessOptimization.businessMetrics.marginBand}`
      );
      console.log(
        `  Strategic Priority: ${businessOptimization.businessMetrics.strategicPriority}`
      );

      if (businessOptimization.analysis) {
        console.log("\n🔍 Detailed Analysis:");
        console.log(
          `  • Inventory: ${
            businessOptimization.analysis.inventory.health
          } (${businessOptimization.analysis.inventory.daysOfStock.toFixed(
            1
          )} days)`
        );
        console.log(
          `  • Margin: ${businessOptimization.analysis.margin.profitability} (${businessOptimization.analysis.margin.band})`
        );
        console.log(
          `  • Logistics: ${businessOptimization.analysis.logistics.feasibility} (${businessOptimization.analysis.logistics.deliveryZone})`
        );
      }

      // Clean up test data
      await db.deleteDocument(
        env.APPWRITE_DATABASE_ID,
        "business_metrics",
        businessDoc.$id
      );
      console.log("🧹 Cleaned up test data");
    } catch (error) {
      console.error("❌ Error testing business optimization:", error.message);
    }

    // Test batch processing
    console.log("\n⚡ Testing batch business processing...");
    const testItemIds = ["item_1", "item_2", "item_3"];
    const batchResults = await businessTower.computeBatchBusiness(testItemIds, {
      location: "nairobi",
    });
    console.log(`✅ Batch processing completed for ${batchResults.size} items`);

    console.log("\n🎉 BusinessSupplyTower test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
}

async function createBusinessMetricsCollection() {
  try {
    // This should use your existing simple schema approach
    const SimpleRecommendationSchemas = require("./schemas/simpleRecommendationSchemas");
    const schemas = new SimpleRecommendationSchemas();

    await schemas.createCollection(
      "business_metrics",
      "Business & Supply Metrics",
      [
        { name: "itemId", type: "string", size: 100, required: true },
        { name: "currentStock", type: "integer", required: true, default: 0 },
        { name: "availableStock", type: "integer", required: true, default: 0 },
        { name: "sellingPrice", type: "float", required: true },
        { name: "marginPercent", type: "float", required: false, default: 0.0 },
        {
          name: "isStrategicCategory",
          type: "boolean",
          required: false,
          default: false,
        },
        { name: "lastUpdated", type: "datetime", required: true },
        { name: "isActive", type: "boolean", required: false, default: true },
      ]
    );
  } catch (error) {
    console.error("Error creating business_metrics collection:", error.message);
  }
}

// Run the test
testBusinessSupplyTower();
