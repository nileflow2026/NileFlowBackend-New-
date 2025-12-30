// Test what attributes exist in business_metrics_complete collection
require("dotenv/config");
const { db } = require("./src/appwrite");
const { env } = require("./src/env");

async function testMinimalDocument() {
  try {
    console.log("Testing minimal document creation...");

    // Try to create a minimal test document
    const response = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      "business_metrics_complete",
      "unique()",
      {
        itemId: "test_minimal_item_" + Date.now(),
        currentStock: 10,
        reservedStock: 2,
        availableStock: 8,
        reorderLevel: 5,
        stockoutRisk: 0.1,
        costPrice: 10.0,
        sellingPrice: 15.0,
        marginPercent: 33.33,
        marginBand: "medium",
        warehouseLocation: "main",
        averageDeliveryTime: 3,
        shippingCost: 5.0,
        deliveryComplexity: 1.0,
        isStrategicCategory: false,
        isPromoted: false,
        promotionBoost: 1.0,
        isSponsoredByVendor: false,
        sponsorBoost: 1.0,
        businessBoostScalar: 1.0,
        supplySuppression: 0.0,
        lastUpdated: new Date().toISOString(),
        isActive: true,
      }
    );

    console.log("✅ Minimal document created successfully:", response.itemId);
    console.log("Document attributes:", Object.keys(response));

    // Now delete it
    await db.deleteDocument(
      env.APPWRITE_DATABASE_ID,
      "business_metrics_complete",
      response.$id
    );
    console.log("✅ Test document deleted");
  } catch (error) {
    console.log("❌ Error:", error.message);
    console.log("Error details:", error.response || error);
  }
}

testMinimalDocument();
