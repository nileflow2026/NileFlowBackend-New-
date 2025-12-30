const BusinessSupplyTower = require("./services/towers/BusinessSupplyTower");
const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { ID } = require("node-appwrite");

/**
 * Complete test for BusinessSupplyTower with proper business_metrics collection
 */

async function testBusinessSupplyTowerComplete() {
  try {
    console.log("🏢 Testing BusinessSupplyTower (Complete)...\n");

    // Initialize tower with correct collection
    const businessTower = new BusinessSupplyTower();

    // Update the collection ID in the tower to use our complete version
    businessTower.databaseId = env.APPWRITE_DATABASE_ID;

    console.log("✅ BusinessSupplyTower initialized");

    // Create test business data
    const testItems = [
      {
        itemId: "electronics_smartphone_001",
        currentStock: 50,
        reservedStock: 5,
        availableStock: 45,
        reorderLevel: 10,
        stockoutRisk: 0.1,
        costPrice: 400.0,
        sellingPrice: 599.99,
        marginPercent: 33.3,
        marginBand: "high",
        warehouseLocation: "nairobi_central",
        averageDeliveryTime: 2,
        shippingCost: 10.0,
        deliveryComplexity: 1.1,
        isStrategicCategory: true,
        isPromoted: false,
        promotionBoost: 1.0,
        isSponsoredByVendor: false,
        sponsorBoost: 1.0,
        businessBoostScalar: 1.0,
        supplySuppression: 0.0,
        lastUpdated: new Date().toISOString(),
        isActive: true,
      },
      {
        itemId: "fashion_dress_002",
        currentStock: 5,
        reservedStock: 2,
        availableStock: 3,
        reorderLevel: 15,
        stockoutRisk: 0.8,
        costPrice: 25.0,
        sellingPrice: 49.99,
        marginPercent: 50.0,
        marginBand: "high",
        warehouseLocation: "lagos_main",
        averageDeliveryTime: 5,
        shippingCost: 8.0,
        deliveryComplexity: 1.3,
        isStrategicCategory: true,
        isPromoted: true,
        promotionBoost: 1.4,
        isSponsoredByVendor: true,
        sponsorBoost: 1.2,
        businessBoostScalar: 1.0,
        supplySuppression: 0.0,
        lastUpdated: new Date().toISOString(),
        isActive: true,
      },
      {
        itemId: "home_furniture_003",
        currentStock: 0,
        reservedStock: 0,
        availableStock: 0,
        reorderLevel: 5,
        stockoutRisk: 1.0,
        costPrice: 120.0,
        sellingPrice: 199.99,
        marginPercent: 40.0,
        marginBand: "high",
        warehouseLocation: "accra_west",
        averageDeliveryTime: 14,
        shippingCost: 35.0,
        deliveryComplexity: 2.0,
        isStrategicCategory: false,
        isPromoted: false,
        promotionBoost: 1.0,
        isSponsoredByVendor: false,
        sponsorBoost: 1.0,
        businessBoostScalar: 1.0,
        supplySuppression: 0.0,
        lastUpdated: new Date().toISOString(),
        isActive: true,
      },
    ];

    console.log("📦 Creating test business metrics data...");
    const createdDocs = [];

    for (const item of testItems) {
      try {
        const doc = await db.createDocument(
          env.APPWRITE_DATABASE_ID,
          "business_metrics_complete",
          ID.unique(),
          item
        );
        createdDocs.push(doc);
        console.log(`  ✅ Created metrics for ${item.itemId}`);
      } catch (error) {
        console.error(`  ❌ Error creating ${item.itemId}:`, error.message);
      }
    }

    console.log(
      `\n🧪 Testing business optimization for ${createdDocs.length} items...\n`
    );

    // Test each item individually
    for (const doc of createdDocs) {
      console.log(`🔍 Analyzing: ${doc.itemId}`);

      // Override collection name in the tower for this test
      const originalGetBusinessMetrics =
        businessTower.getBusinessMetrics.bind(businessTower);
      businessTower.getBusinessMetrics = async function (itemId) {
        try {
          const response = await this.databases.listDocuments(
            this.databaseId,
            "business_metrics_complete", // Use complete collection
            [`itemId=${itemId}`, "isActive=true"]
          );

          if (response.documents.length === 0) {
            return null;
          }

          const doc = response.documents[0];
          return {
            itemId: doc.itemId,
            currentStock: doc.currentStock || 0,
            reservedStock: doc.reservedStock || 0,
            availableStock: doc.availableStock || 0,
            reorderLevel: doc.reorderLevel || 0,
            stockoutRisk: doc.stockoutRisk || 0,
            costPrice: doc.costPrice || 0,
            sellingPrice: doc.sellingPrice || 0,
            marginPercent: doc.marginPercent || 0,
            marginBand: doc.marginBand || "low",
            warehouseLocation: doc.warehouseLocation || "unknown",
            averageDeliveryTime: doc.averageDeliveryTime || 7,
            shippingCost: doc.shippingCost || 0,
            deliveryComplexity: doc.deliveryComplexity || 1.0,
            isStrategicCategory: doc.isStrategicCategory || false,
            isPromoted: doc.isPromoted || false,
            promotionBoost: doc.promotionBoost || 1.0,
            isSponsoredByVendor: doc.isSponsoredByVendor || false,
            sponsorBoost: doc.sponsorBoost || 1.0,
            businessBoostScalar: doc.businessBoostScalar || 1.0,
            supplySuppression: doc.supplySuppression || 0.0,
            lastUpdated: new Date(doc.lastUpdated),
          };
        } catch (error) {
          console.error(
            `Error retrieving business metrics for ${itemId}:`,
            error
          );
          return null;
        }
      };

      const userContext = {
        location: "nairobi_central",
        deviceType: "mobile",
      };

      try {
        const optimization = await businessTower.computeBusinessOptimization(
          doc.itemId,
          null,
          userContext
        );

        console.log(
          `  📊 Business Boost: ${optimization.businessBoostScalar.toFixed(3)}`
        );
        console.log(
          `  🚫 Supply Suppression: ${optimization.supplySuppression.toFixed(
            3
          )}`
        );

        if (optimization.businessMetrics) {
          console.log(
            `  📦 Inventory: ${optimization.businessMetrics.inventoryHealth}`
          );
          console.log(
            `  💰 Margin: ${optimization.businessMetrics.marginBand}`
          );
          console.log(
            `  🎯 Strategic: ${optimization.businessMetrics.strategicPriority}`
          );
          console.log(
            `  📢 Sponsored: ${optimization.businessMetrics.isSponsored}`
          );
        }

        if (optimization.analysis) {
          console.log(`  🔍 Analysis:`);
          console.log(
            `    • Inventory: ${
              optimization.analysis.inventory.health
            } (${optimization.analysis.inventory.daysOfStock.toFixed(
              1
            )} days, ${optimization.analysis.inventory.action})`
          );
          console.log(
            `    • Margin: ${optimization.analysis.margin.profitability} (${optimization.analysis.margin.recommendation})`
          );
          console.log(
            `    • Logistics: ${optimization.analysis.logistics.feasibility} (${optimization.analysis.logistics.deliveryZone})`
          );
        }

        console.log(""); // Empty line for separation
      } catch (error) {
        console.error(
          `  ❌ Error computing optimization for ${doc.itemId}:`,
          error.message
        );
      }
    }

    // Test batch processing
    console.log("⚡ Testing batch business optimization...");
    const itemIds = createdDocs.map((doc) => doc.itemId);

    // Override batch method too
    businessTower.getBatchBusinessData = async function (itemIds) {
      const results = new Map();
      try {
        const response = await this.databases.listDocuments(
          this.databaseId,
          "business_metrics_complete",
          [`itemId=${itemIds.join(",")}`, "isActive=true"]
        );

        for (const doc of response.documents) {
          results.set(doc.itemId, {
            itemId: doc.itemId,
            currentStock: doc.currentStock || 0,
            reservedStock: doc.reservedStock || 0,
            availableStock: doc.availableStock || 0,
            reorderLevel: doc.reorderLevel || 0,
            stockoutRisk: doc.stockoutRisk || 0,
            costPrice: doc.costPrice || 0,
            sellingPrice: doc.sellingPrice || 0,
            marginPercent: doc.marginPercent || 0,
            marginBand: doc.marginBand || "low",
            warehouseLocation: doc.warehouseLocation || "unknown",
            averageDeliveryTime: doc.averageDeliveryTime || 7,
            shippingCost: doc.shippingCost || 0,
            deliveryComplexity: doc.deliveryComplexity || 1.0,
            isStrategicCategory: doc.isStrategicCategory || false,
            isPromoted: doc.isPromoted || false,
            promotionBoost: doc.promotionBoost || 1.0,
            isSponsoredByVendor: doc.isSponsoredByVendor || false,
            sponsorBoost: doc.sponsorBoost || 1.0,
            lastUpdated: new Date(doc.lastUpdated),
          });
        }
      } catch (error) {
        console.error("Error retrieving batch business data:", error);
      }
      return results;
    };

    const batchResults = await businessTower.computeBatchBusiness(itemIds, {
      location: "nairobi",
    });
    console.log(`✅ Batch processed ${batchResults.size} items`);

    batchResults.forEach((result, itemId) => {
      console.log(
        `  ${itemId}: Boost=${result.businessBoostScalar.toFixed(
          3
        )}, Suppression=${result.supplySuppression.toFixed(3)}`
      );
    });

    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");
    for (const doc of createdDocs) {
      try {
        await db.deleteDocument(
          env.APPWRITE_DATABASE_ID,
          "business_metrics_complete",
          doc.$id
        );
        console.log(`  ✅ Deleted ${doc.itemId}`);
      } catch (error) {
        console.error(`  ❌ Error deleting ${doc.itemId}:`, error.message);
      }
    }

    console.log("\n🎉 BusinessSupplyTower complete test finished!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
}

testBusinessSupplyTowerComplete();
