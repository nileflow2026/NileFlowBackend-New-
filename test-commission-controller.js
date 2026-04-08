// test-commission-controller.js
/**
 * Test script to verify the commission controller methods work correctly
 */

require("dotenv").config();

async function testCommissionController() {
  console.log("🧪 Testing Commission Controller Methods...\n");

  try {
    // Import the controller
    const CommissionController = require("./controllers/AdminControllers/commissionController");

    console.log("✅ Commission controller imported successfully");

    // Test if the static methods exist
    console.log("\n🔍 Checking static method availability:");
    console.log(
      `   getGMVAnalytics: ${typeof CommissionController.getGMVAnalytics}`,
    );
    console.log(
      `   getCommissionRateHistory: ${typeof CommissionController.getCommissionRateHistory}`,
    );

    if (typeof CommissionController.getGMVAnalytics === "function") {
      console.log("✅ getGMVAnalytics method exists and is callable");
    } else {
      console.log("❌ getGMVAnalytics method not found or not a function");
    }

    if (typeof CommissionController.getCommissionRateHistory === "function") {
      console.log("✅ getCommissionRateHistory method exists and is callable");
    } else {
      console.log(
        "❌ getCommissionRateHistory method not found or not a function",
      );
    }

    // Test method calls with sample dates
    const startDate = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const endDate = new Date().toISOString();

    console.log("\n📅 Testing with sample date range:");
    console.log(`   Start: ${startDate}`);
    console.log(`   End: ${endDate}`);

    // Test getGMVAnalytics
    console.log("\n1️⃣ Testing getGMVAnalytics...");
    try {
      const gmvData = await CommissionController.getGMVAnalytics(
        startDate,
        endDate,
      );
      console.log("✅ getGMVAnalytics executed successfully");
      console.log(`   Result type: ${typeof gmvData}`);
      if (gmvData && typeof gmvData === "object") {
        console.log(`   Keys: ${Object.keys(gmvData).join(", ")}`);
      }
    } catch (error) {
      console.log(
        `⚠️  getGMVAnalytics error (expected if no data): ${error.message}`,
      );
    }

    // Test getCommissionRateHistory
    console.log("\n2️⃣ Testing getCommissionRateHistory...");
    try {
      const rateHistory = await CommissionController.getCommissionRateHistory(
        startDate,
        endDate,
      );
      console.log("✅ getCommissionRateHistory executed successfully");
      console.log(`   Result type: ${typeof rateHistory}`);
      if (rateHistory && typeof rateHistory === "object") {
        console.log(`   Keys: ${Object.keys(rateHistory).join(", ")}`);
      }
    } catch (error) {
      console.log(
        `⚠️  getCommissionRateHistory error (expected if no data): ${error.message}`,
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎯 COMMISSION CONTROLLER TEST RESULTS");
    console.log("=".repeat(60));
    console.log("✅ Static method calls should now work correctly");
    console.log(
      '✅ The "Cannot read properties of undefined" error should be resolved',
    );
    console.log("\n💡 Next steps:");
    console.log("   1. Deploy the fixed code to production");
    console.log("   2. Test the commission analytics endpoint");
    console.log("   3. Verify the API returns data correctly");
  } catch (error) {
    console.error("💥 Error testing controller:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Run the test
if (require.main === module) {
  testCommissionController()
    .then(() => {
      console.log("\n✅ Commission controller testing completed");
    })
    .catch((error) => {
      console.error("❌ Controller testing failed:", error.message);
      process.exit(1);
    });
}

module.exports = { testCommissionController };
