// debug-orders-collection.js
/**
 * Debug script to inspect the orders collection structure
 */

require("dotenv").config();
const { Client, Databases } = require("node-appwrite");

async function inspectOrdersCollection() {
  console.log("🔍 Inspecting Orders Collection Structure...\n");

  try {
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const ordersCollectionId = process.env.APPWRITE_ORDERS_COLLECTION;

    console.log(`📊 Database ID: ${databaseId}`);
    console.log(`📋 Orders Collection ID: ${ordersCollectionId}\n`);

    // Get collection info
    console.log("📋 Getting collection attributes...");
    const collection = await databases.getCollection(
      databaseId,
      ordersCollectionId,
    );

    console.log(`\n✅ Collection Name: ${collection.name}`);
    console.log(`📊 Total Attributes: ${collection.attributes.length}\n`);

    // List all attributes with their types
    console.log("📝 COLLECTION ATTRIBUTES:");
    console.log("=".repeat(50));

    const commissionAttributes = [];

    collection.attributes.forEach((attr, index) => {
      const typeBadge = attr.type.toUpperCase().padEnd(10);
      const requiredBadge = attr.required ? "✅ REQ" : "⚪ OPT";

      console.log(
        `${(index + 1).toString().padStart(2)}. [${typeBadge}] ${attr.key.padEnd(25)} ${requiredBadge}`,
      );

      // Look for commission-related attributes
      if (attr.key.toLowerCase().includes("commission")) {
        commissionAttributes.push(attr);
      }
    });

    // Show commission-specific attributes
    if (commissionAttributes.length > 0) {
      console.log("\n💰 COMMISSION-RELATED ATTRIBUTES:");
      console.log("=".repeat(50));
      commissionAttributes.forEach((attr) => {
        console.log(`✅ ${attr.key} (${attr.type})`);
        if (attr.default !== undefined) {
          console.log(`   Default: ${attr.default}`);
        }
        if (attr.array) {
          console.log(`   Array: ${attr.array}`);
        }
      });
    } else {
      console.log("\n❌ NO COMMISSION-RELATED ATTRIBUTES FOUND!");
      console.log("   This might be why the commission queries are failing.");
    }

    // Try to fetch a sample order to see actual data structure
    console.log("\n📄 SAMPLE ORDER DATA:");
    console.log("=".repeat(50));

    try {
      const sampleOrders = await databases.listDocuments(
        databaseId,
        ordersCollectionId,
        [],
        1, // Limit to 1 document
      );

      if (sampleOrders.documents.length > 0) {
        const sampleOrder = sampleOrders.documents[0];
        console.log("✅ Sample order found:");
        console.log(`   Order ID: ${sampleOrder.$id}`);

        // Check for commission fields
        const possibleCommissionFields = [
          "commission_earned",
          "commission",
          "commission_amount",
          "vendor_commission",
          "platform_commission",
        ];

        console.log("\n💰 Commission field check:");
        possibleCommissionFields.forEach((field) => {
          if (sampleOrder[field] !== undefined) {
            console.log(
              `   ✅ ${field}: ${sampleOrder[field]} (${typeof sampleOrder[field]})`,
            );
          } else {
            console.log(`   ❌ ${field}: not found`);
          }
        });

        // Show all fields for debugging
        console.log("\n📋 All fields in sample order:");
        Object.keys(sampleOrder).forEach((key) => {
          if (!key.startsWith("$")) {
            // Skip system fields
            const value = sampleOrder[key];
            const type = typeof value;
            console.log(`   ${key}: ${value} (${type})`);
          }
        });
      } else {
        console.log("❌ No orders found in collection");
      }
    } catch (sampleError) {
      console.log(`❌ Could not fetch sample order: ${sampleError.message}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎯 DIAGNOSIS SUMMARY");
    console.log("=".repeat(60));

    if (commissionAttributes.length === 0) {
      console.log("❌ ISSUE IDENTIFIED: No commission_earned attribute found");
      console.log(
        "💡 SOLUTION: You need to add the commission_earned attribute to your orders collection",
      );
      console.log(
        "   OR update your queries to use the correct attribute name",
      );
    } else {
      console.log(
        "✅ Commission attributes found - check query syntax and data types",
      );
    }
  } catch (error) {
    console.error("💥 Error inspecting collection:", error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
      console.error(`   Error Type: ${error.type}`);
    }
  }
}

// Run the inspection
if (require.main === module) {
  inspectOrdersCollection()
    .then(() => {
      console.log("\n✅ Collection inspection completed");
    })
    .catch((error) => {
      console.error("❌ Inspection failed:", error.message);
      process.exit(1);
    });
}

module.exports = { inspectOrdersCollection };
