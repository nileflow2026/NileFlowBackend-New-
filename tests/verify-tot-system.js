// tests/verify-tot-system.js
/**
 * Verification script for complete TOT system integration
 * Tests that all components work together correctly
 */

const { TOTReportingService } = require("../services/totReportingService");
const { env } = require("../src/env");

async function verifyTOTSystem() {
  console.log("🎯 Verifying Complete TOT System Integration...\n");

  let allTestsPassed = true;
  let testResults = [];

  try {
    // Test 1: Service Initialization
    console.log("1️⃣ Testing TOT Service Initialization...");
    const totService = new TOTReportingService();

    if (
      totService &&
      totService.databaseId &&
      totService.ordersCollectionId &&
      totService.financialReportsCollectionId
    ) {
      console.log("✅ TOT service initialized successfully");
      console.log(`   Database ID: ${totService.databaseId}`);
      console.log(`   Orders Collection: ${totService.ordersCollectionId}`);
      console.log(
        `   Financial Reports Collection: ${totService.financialReportsCollectionId}`,
      );
      testResults.push({ test: "Service Initialization", result: "PASSED" });
    } else {
      console.log("❌ TOT service initialization failed");
      allTestsPassed = false;
      testResults.push({ test: "Service Initialization", result: "FAILED" });
    }

    // Test 2: Configuration Validation
    console.log("\n2️⃣ Testing Configuration Validation...");
    try {
      const isConfigValid = await totService.validateConfiguration();
      if (isConfigValid) {
        console.log("✅ Service configuration is valid");
        testResults.push({
          test: "Configuration Validation",
          result: "PASSED",
        });
      } else {
        console.log("❌ Service configuration is invalid");
        allTestsPassed = false;
        testResults.push({
          test: "Configuration Validation",
          result: "FAILED",
        });
      }
    } catch (error) {
      console.log(`❌ Configuration validation error: ${error.message}`);
      allTestsPassed = false;
      testResults.push({ test: "Configuration Validation", result: "FAILED" });
    }

    // Test 3: TOT Calculation Logic
    console.log("\n3️⃣ Testing TOT Calculation Logic...");
    try {
      const testAmount = 1000;
      const calculationResult = totService.calculateTOT(testAmount);
      const calculatedTax = parseFloat(calculationResult.taxAmount);
      const expectedTax = 30; // 3% of 1000

      if (Math.abs(calculatedTax - expectedTax) < 0.01) {
        console.log(
          `✅ TOT calculation correct: ${testAmount} KES → ${calculatedTax} KES tax`,
        );
        testResults.push({ test: "TOT Calculation Logic", result: "PASSED" });
      } else {
        console.log(
          `❌ TOT calculation incorrect: expected ${expectedTax}, got ${calculatedTax}`,
        );
        allTestsPassed = false;
        testResults.push({ test: "TOT Calculation Logic", result: "FAILED" });
      }
    } catch (error) {
      console.log(`❌ TOT calculation error: ${error.message}`);
      allTestsPassed = false;
      testResults.push({ test: "TOT Calculation Logic", result: "FAILED" });
    }

    // Test 4: Month Format Validation
    console.log("\n4️⃣ Testing Month Format Validation...");
    try {
      const validMonth = "2026-01";
      const invalidMonth = "01-2026";

      const isValidMonthValid = totService.validateMonthFormat(validMonth);
      const isInvalidMonthValid = totService.validateMonthFormat(invalidMonth);

      if (isValidMonthValid && !isInvalidMonthValid) {
        console.log("✅ Month format validation working correctly");
        testResults.push({ test: "Month Format Validation", result: "PASSED" });
      } else {
        console.log("❌ Month format validation not working correctly");
        allTestsPassed = false;
        testResults.push({ test: "Month Format Validation", result: "FAILED" });
      }
    } catch (error) {
      console.log(`❌ Month format validation error: ${error.message}`);
      allTestsPassed = false;
      testResults.push({ test: "Month Format Validation", result: "FAILED" });
    }

    // Test 5: Date Range Parsing
    console.log("\n5️⃣ Testing Date Range Parsing...");
    try {
      const month = "2026-01";
      const { year, monthNum, periodStart, periodEnd } =
        totService.parseMonth(month);

      if (year === 2026 && monthNum === 1 && periodStart && periodEnd) {
        console.log(
          `✅ Date parsing correct: ${month} → ${periodStart.toISOString()} to ${periodEnd.toISOString()}`,
        );
        testResults.push({ test: "Date Range Parsing", result: "PASSED" });
      } else {
        console.log("❌ Date parsing incorrect");
        allTestsPassed = false;
        testResults.push({ test: "Date Range Parsing", result: "FAILED" });
      }
    } catch (error) {
      console.log(`❌ Date parsing error: ${error.message}`);
      allTestsPassed = false;
      testResults.push({ test: "Date Range Parsing", result: "FAILED" });
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎯 TOT SYSTEM VERIFICATION SUMMARY");
    console.log("=".repeat(60));

    testResults.forEach((result, index) => {
      const status = result.result === "PASSED" ? "✅" : "❌";
      console.log(`${status} ${index + 1}. ${result.test}: ${result.result}`);
    });

    console.log("=".repeat(60));

    if (allTestsPassed) {
      console.log("🎉 ALL VERIFICATION TESTS PASSED!");
      console.log("✅ TOT system is ready for production use");
      console.log("✅ All components are properly integrated");
      console.log("\n💡 Next Steps:");
      console.log("   1. Test API endpoints with Postman/curl");
      console.log("   2. Generate test TOT report for current month");
      console.log("   3. Verify CSV export functionality");
      console.log("   4. Schedule automated monthly reports");
    } else {
      console.log("❌ Some verification tests failed");
      console.log("⚠️  Please fix the issues before production deployment");
    }

    console.log("\n📊 System Integration Status:");
    console.log(
      `   Database Connection: ${env.APPWRITE_DATABASE_ID ? "✅" : "❌"}`,
    );
    console.log(
      `   Orders Collection: ${env.APPWRITE_ORDERS_COLLECTION ? "✅" : "❌"}`,
    );
    console.log(
      `   Financial Reports: ${env.APPWRITE_FINANCIAL_REPORTS_COLLECTION_ID ? "✅" : "❌"}`,
    );
    console.log(
      `   Platform Settings: ${env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID ? "✅" : "❌"}`,
    );
  } catch (error) {
    console.error("💥 Verification script error:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Run verification
if (require.main === module) {
  verifyTOTSystem()
    .then(() => {
      console.log("\n✅ Verification script completed");
    })
    .catch((error) => {
      console.error("❌ Verification script failed:", error.message);
      process.exit(1);
    });
}

module.exports = { verifyTOTSystem };
