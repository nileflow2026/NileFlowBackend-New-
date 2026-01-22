// test-commission-queries.js
/**
 * Test script to verify commission queries work correctly after fixes
 */

require("dotenv").config();
const { Client, Databases, Query } = require("node-appwrite");

async function testCommissionQueries() {
  console.log("🧪 Testing Commission Queries After Fix...\n");

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

    // Test 1: Query with greaterThan commission_earned > 0 (fixed version)
    console.log('1️⃣ Testing Query.greaterThan("commission_earned", 0)...');
    try {
      const result1 = await databases.listDocuments(
        databaseId,
        ordersCollectionId,
        [Query.greaterThan("commission_earned", 0)],
      );
      console.log(
        `✅ Query successful: Found ${result1.documents.length} orders with commission > 0`,
      );
    } catch (error) {
      console.log(`❌ Query failed: ${error.message}`);
    }

    // Test 2: Query with greaterThanEqual commission_earned >= 0 (TOT service version)
    console.log(
      '\n2️⃣ Testing Query.greaterThanEqual("commission_earned", 0)...',
    );
    try {
      const result2 = await databases.listDocuments(
        databaseId,
        ordersCollectionId,
        [Query.greaterThanEqual("commission_earned", 0)],
      );
      console.log(
        `✅ Query successful: Found ${result2.documents.length} orders with commission >= 0`,
      );
    } catch (error) {
      console.log(`❌ Query failed: ${error.message}`);
    }

    // Test 3: Simple query without commission filter
    console.log("\n3️⃣ Testing simple query without commission filter...");
    try {
      const result3 = await databases.listDocuments(
        databaseId,
        ordersCollectionId,
        [],
      );
      console.log(
        `✅ Query successful: Found ${result3.documents.length} total orders`,
      );

      if (result3.documents.length > 0) {
        const sample = result3.documents[0];
        console.log(
          `   Sample commission_earned: ${sample.commission_earned} (${typeof sample.commission_earned})`,
        );
      }
    } catch (error) {
      console.log(`❌ Query failed: ${error.message}`);
    }

    // Test 4: The old problematic queries (should fail)
    console.log(
      "\n4️⃣ Testing the old problematic queries (these should fail)...",
    );

    console.log('   Testing Query.notEqual("commission_earned", null)...');
    try {
      const badResult1 = await databases.listDocuments(
        databaseId,
        ordersCollectionId,
        [Query.notEqual("commission_earned", null)],
      );
      console.log(
        `⚠️  Unexpected success: ${badResult1.documents.length} documents (this query should have failed)`,
      );
    } catch (error) {
      console.log(`✅ Query correctly failed: ${error.message}`);
    }

    console.log('   Testing Query.isNotNull("commission_earned")...');
    try {
      const badResult2 = await databases.listDocuments(
        databaseId,
        ordersCollectionId,
        [Query.isNotNull("commission_earned")],
      );
      console.log(
        `⚠️  Unexpected success: ${badResult2.documents.length} documents (this query should have failed)`,
      );
    } catch (error) {
      console.log(`✅ Query correctly failed: ${error.message}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎯 COMMISSION QUERY TEST RESULTS");
    console.log("=".repeat(60));
    console.log("✅ Fixed queries should now work correctly");
    console.log("✅ The commission analytics error should be resolved");
    console.log("\n💡 Next steps:");
    console.log("   1. Deploy the fixed code to production");
    console.log("   2. Test the commission analytics endpoint");
    console.log("   3. Verify TOT reporting works correctly");
  } catch (error) {
    console.error("💥 Error testing queries:", error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
      console.error(`   Error Type: ${error.type}`);
    }
  }
}

// Run the test
if (require.main === module) {
  testCommissionQueries()
    .then(() => {
      console.log("\n✅ Commission query testing completed");
    })
    .catch((error) => {
      console.error("❌ Query testing failed:", error.message);
      process.exit(1);
    });
}

module.exports = { testCommissionQueries };
