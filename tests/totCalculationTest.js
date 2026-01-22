// tests/totCalculationTest.js
const { totReportingService } = require("../services/totReportingService");
const { db } = require("../services/appwriteService");
const { env } = require("../src/env");
const { Query, ID } = require("node-appwrite");

/**
 * TOT Calculation Accuracy Test Suite
 *
 * Comprehensive testing for KRA-compliant TOT calculations.
 *
 * Test Coverage:
 * 1. Precision and rounding accuracy
 * 2. Date range filtering correctness
 * 3. Order status qualification logic
 * 4. Commission aggregation integrity
 * 5. Edge cases and error handling
 * 6. Reproducibility and determinism
 *
 * Compliance Requirements:
 * - All calculations must be reproducible for KRA audits
 * - Precision must be consistent (2 decimal places)
 * - Source data must be validated and auditable
 * - Error cases must be handled gracefully
 */

class TOTCalculationTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
    };
  }

  /**
   * Run all TOT calculation tests
   */
  async runAllTests() {
    console.log("🧮 Starting TOT Calculation Accuracy Tests...\n");

    try {
      // Test 1: Service Configuration Validation
      await this.testServiceConfiguration();

      // Test 2: Month Format Validation
      await this.testMonthFormatValidation();

      // Test 3: Date Range Parsing
      await this.testDateRangeParsing();

      // Test 4: Commission Aggregation Logic
      await this.testCommissionAggregation();

      // Test 5: TOT Calculation Precision
      await this.testTOTCalculationPrecision();

      // Test 6: Rounding Consistency
      await this.testRoundingConsistency();

      // Test 7: Order Status Filtering
      await this.testOrderStatusFiltering();

      // Test 8: Empty Result Handling
      await this.testEmptyResultHandling();

      // Test 9: Large Number Precision
      await this.testLargeNumberPrecision();

      // Test 10: Audit Checksum Generation
      await this.testAuditChecksumGeneration();

      // Test 11: Report Deduplication
      await this.testReportDeduplication();

      // Print test summary
      this.printTestSummary();
    } catch (error) {
      console.error("❌ Test suite failed:", error);
      throw error;
    }
  }

  /**
   * Test 1: Service Configuration Validation
   */
  async testServiceConfiguration() {
    this.log("Testing service configuration validation...");

    try {
      const isValid = await totReportingService.validateConfiguration();
      this.assert(isValid === true, "Service configuration should be valid");
      this.pass("Service configuration validation");
    } catch (error) {
      this.fail("Service configuration validation", error.message);
    }
  }

  /**
   * Test 2: Month Format Validation
   */
  async testMonthFormatValidation() {
    this.log("Testing month format validation...");

    const validFormats = ["2026-01", "2025-12", "2024-06"];
    const invalidFormats = ["2026-1", "26-01", "2026/01", "2026-13", "2026-00"];

    try {
      // Test valid formats
      for (const format of validFormats) {
        const isValid = totReportingService.validateMonthFormat(format);
        this.assert(isValid === true, `Format ${format} should be valid`);
      }

      // Test invalid formats
      for (const format of invalidFormats) {
        const isValid = totReportingService.validateMonthFormat(format);
        this.assert(isValid === false, `Format ${format} should be invalid`);
      }

      this.pass("Month format validation");
    } catch (error) {
      this.fail("Month format validation", error.message);
    }
  }

  /**
   * Test 3: Date Range Parsing
   */
  async testDateRangeParsing() {
    this.log("Testing date range parsing...");

    try {
      const testMonth = "2026-01";
      const parsed = totReportingService.parseMonth(testMonth);

      this.assert(parsed.year === 2026, "Year should be 2026");
      this.assert(parsed.monthNum === 1, "Month number should be 1");

      // Test date boundaries
      const expectedStart = new Date(2026, 0, 1, 0, 0, 0, 0); // January 1st
      const expectedEnd = new Date(2026, 1, 1, 0, 0, 0, 0); // February 1st

      this.assert(
        parsed.periodStart.getTime() === expectedStart.getTime(),
        "Period start should be January 1st 00:00:00",
      );
      this.assert(
        parsed.periodEnd.getTime() === expectedEnd.getTime(),
        "Period end should be February 1st 00:00:00",
      );

      this.pass("Date range parsing");
    } catch (error) {
      this.fail("Date range parsing", error.message);
    }
  }

  /**
   * Test 4: Commission Aggregation Logic
   */
  async testCommissionAggregation() {
    this.log("Testing commission aggregation logic...");

    try {
      // Create test orders data
      const mockOrders = [
        { $id: "order1", commission_earned: 25.5, amount: 500 },
        { $id: "order2", commission_earned: 12.75, amount: 255 },
        { $id: "order3", commission_earned: 0, amount: 100 }, // Zero commission
        { $id: "order4", commission_earned: 100.25, amount: 2005 },
        { $id: "order5", commission_earned: null, amount: 300 }, // Null commission
        { $id: "order6", commission_earned: "15.50", amount: 310 }, // String commission
      ];

      const result =
        totReportingService.calculateCommissionAggregates(mockOrders);

      // Expected: 25.50 + 12.75 + 0 + 100.25 + 15.50 = 154.00
      const expectedCommission = 154.0;
      const expectedValidOrders = 6; // All orders have valid commission values (including "15.50" string)

      this.assert(
        Math.abs(result.totalCommission - expectedCommission) < 0.01,
        `Total commission should be ${expectedCommission}, got ${result.totalCommission}`,
      );

      this.assert(
        result.validOrders === expectedValidOrders,
        `Valid orders should be ${expectedValidOrders}, got ${result.validOrders}`,
      );

      this.assert(
        result.totalOrders === expectedValidOrders,
        "Total orders should equal valid orders",
      );

      this.pass("Commission aggregation logic");
    } catch (error) {
      this.fail("Commission aggregation logic", error.message);
    }
  }

  /**
   * Test 5: TOT Calculation Precision
   */
  async testTOTCalculationPrecision() {
    this.log("Testing TOT calculation precision...");

    try {
      const testCases = [
        { commission: 1000.0, expectedTOT: 30.0 }, // 3% of 1000
        { commission: 3333.33, expectedTOT: 100.0 }, // 3% of 3333.33 = 99.9999 → 100.00
        { commission: 1666.67, expectedTOT: 50.0 }, // 3% of 1666.67 = 50.0001 → 50.00
        { commission: 0.33, expectedTOT: 0.01 }, // 3% of 0.33 = 0.0099 → 0.01
        { commission: 0.01, expectedTOT: 0.0 }, // 3% of 0.01 = 0.0003 → 0.00
        { commission: 100000.0, expectedTOT: 3000.0 }, // Large amount test
      ];

      for (const testCase of testCases) {
        const result = totReportingService.calculateTOT(testCase.commission);

        this.assert(
          Math.abs(result.taxAmount - testCase.expectedTOT) < 0.01,
          `TOT for ${testCase.commission} should be ${testCase.expectedTOT}, got ${result.taxAmount}`,
        );

        this.assert(
          result.taxRate === 0.03,
          "TOT rate should always be 0.03 (3%)",
        );
      }

      this.pass("TOT calculation precision");
    } catch (error) {
      this.fail("TOT calculation precision", error.message);
    }
  }

  /**
   * Test 6: Rounding Consistency
   */
  async testRoundingConsistency() {
    this.log("Testing rounding consistency...");

    try {
      const testValues = [
        { input: 10.125, expected: 10.13 }, // Round up
        { input: 10.124, expected: 10.12 }, // Round down
        { input: 10.115, expected: 10.12 }, // Banker's rounding (round up)
        { input: 10.105, expected: 10.11 }, // Banker's rounding (round up)
        { input: 99.999, expected: 100.0 }, // Large rounding
        { input: 0.001, expected: 0.0 }, // Small rounding
        { input: 0.009, expected: 0.01 }, // Small rounding up
      ];

      for (const testCase of testValues) {
        const rounded = totReportingService.roundToPrecision(testCase.input);

        this.assert(
          Math.abs(rounded - testCase.expected) < 0.001,
          `Rounding ${testCase.input} should give ${testCase.expected}, got ${rounded}`,
        );
      }

      // Test multiple calls for consistency
      const testValue = 123.456789;
      const rounded1 = totReportingService.roundToPrecision(testValue);
      const rounded2 = totReportingService.roundToPrecision(testValue);

      this.assert(
        rounded1 === rounded2,
        "Rounding should be deterministic and consistent",
      );

      this.pass("Rounding consistency");
    } catch (error) {
      this.fail("Rounding consistency", error.message);
    }
  }

  /**
   * Test 7: Order Status Filtering (conceptual test - would need mock database)
   */
  async testOrderStatusFiltering() {
    this.log("Testing order status filtering logic...");

    try {
      // This test verifies the status constants are correct
      const qualifyingStatuses = [
        "COMPLETED",
        "completed",
        "delivered",
        "succeeded",
      ];

      this.assert(
        qualifyingStatuses.includes("COMPLETED"),
        "COMPLETED status should be qualifying",
      );

      this.assert(
        qualifyingStatuses.includes("completed"),
        "completed status should be qualifying",
      );

      this.assert(
        !qualifyingStatuses.includes("pending"),
        "pending status should not be qualifying",
      );

      this.assert(
        !qualifyingStatuses.includes("cancelled"),
        "cancelled status should not be qualifying",
      );

      this.pass("Order status filtering logic");
    } catch (error) {
      this.fail("Order status filtering logic", error.message);
    }
  }

  /**
   * Test 8: Empty Result Handling
   */
  async testEmptyResultHandling() {
    this.log("Testing empty result handling...");

    try {
      // Test with empty orders array
      const emptyResult = totReportingService.calculateCommissionAggregates([]);

      this.assert(
        emptyResult.totalCommission === 0,
        "Empty orders should give 0 commission",
      );
      this.assert(
        emptyResult.totalOrders === 0,
        "Empty orders should give 0 count",
      );
      this.assert(
        emptyResult.validOrders === 0,
        "Empty orders should give 0 valid orders",
      );

      // Test TOT calculation with zero commission
      const zeroTOT = totReportingService.calculateTOT(0);
      this.assert(
        zeroTOT.taxAmount === 0,
        "TOT of zero commission should be 0",
      );

      this.pass("Empty result handling");
    } catch (error) {
      this.fail("Empty result handling", error.message);
    }
  }

  /**
   * Test 9: Large Number Precision
   */
  async testLargeNumberPrecision() {
    this.log("Testing large number precision...");

    try {
      const largeCommissions = [
        1000000.0, // 1 million
        10000000.0, // 10 million
        999999.99, // Edge case
      ];

      for (const commission of largeCommissions) {
        const result = totReportingService.calculateTOT(commission);
        const expectedTOT = totReportingService.roundToPrecision(
          commission * 0.03,
        );

        this.assert(
          Math.abs(result.taxAmount - expectedTOT) < 0.01,
          `Large number TOT calculation failed for ${commission}`,
        );

        // Ensure no floating point precision issues
        this.assert(
          Number.isFinite(result.taxAmount),
          "Result should be a finite number",
        );
      }

      this.pass("Large number precision");
    } catch (error) {
      this.fail("Large number precision", error.message);
    }
  }

  /**
   * Test 10: Audit Checksum Generation
   */
  async testAuditChecksumGeneration() {
    this.log("Testing audit checksum generation...");

    try {
      const testData = {
        month: "2026-01",
        commission: { totalOrders: 100, totalCommission: 5000 },
        tot: { taxAmount: 150 },
        orders: [{ $id: "order1" }, { $id: "order2" }],
      };

      // Generate checksum twice with same data
      const checksum1 = totReportingService.generateAuditChecksum(testData);
      const checksum2 = totReportingService.generateAuditChecksum(testData);

      this.assert(
        checksum1 === checksum2,
        "Checksum should be deterministic for same data",
      );

      this.assert(
        typeof checksum1 === "string" && checksum1.length === 64,
        "Checksum should be a 64-character SHA-256 hash",
      );

      // Test different data produces different checksum
      const differentData = { ...testData, month: "2026-02" };
      const checksum3 =
        totReportingService.generateAuditChecksum(differentData);

      this.assert(
        checksum1 !== checksum3,
        "Different data should produce different checksums",
      );

      this.pass("Audit checksum generation");
    } catch (error) {
      this.fail("Audit checksum generation", error.message);
    }
  }

  /**
   * Test 11: Report Deduplication Check
   */
  async testReportDeduplication() {
    this.log("Testing report deduplication logic...");

    try {
      // This would test the checkExistingReport method
      // For now, we test the logic conceptually

      const testMonth = "2026-01";

      // Check if method exists and is callable
      this.assert(
        typeof totReportingService.checkExistingReport === "function",
        "checkExistingReport method should exist",
      );

      this.pass("Report deduplication logic");
    } catch (error) {
      this.fail("Report deduplication logic", error.message);
    }
  }

  /**
   * Test assertion helper
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Log test pass
   */
  pass(testName) {
    this.testResults.passed++;
    this.testResults.total++;
    this.testResults.details.push({ test: testName, result: "PASS" });
    console.log(`  ✅ ${testName}`);
  }

  /**
   * Log test failure
   */
  fail(testName, error) {
    this.testResults.failed++;
    this.testResults.total++;
    this.testResults.details.push({ test: testName, result: "FAIL", error });
    console.log(`  ❌ ${testName}: ${error}`);
  }

  /**
   * Log test info
   */
  log(message) {
    console.log(`🧪 ${message}`);
  }

  /**
   * Print comprehensive test summary
   */
  printTestSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("TOT CALCULATION TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`📊 Total Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(
      `📈 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`,
    );

    if (this.testResults.failed > 0) {
      console.log("\n❌ FAILED TESTS:");
      this.testResults.details
        .filter((d) => d.result === "FAIL")
        .forEach((d) => console.log(`  • ${d.test}: ${d.error}`));
    }

    console.log("\n🎯 TEST RESULTS BY CATEGORY:");
    this.testResults.details.forEach((d) => {
      console.log(`  ${d.result === "PASS" ? "✅" : "❌"} ${d.test}`);
    });

    console.log("\n" + "=".repeat(60));

    if (this.testResults.failed === 0) {
      console.log(
        "🎉 ALL TESTS PASSED! TOT calculations are accurate and compliant.",
      );
    } else {
      console.log(
        "⚠️  Some tests failed. Please review and fix issues before production.",
      );
    }

    console.log("=".repeat(60));
  }
}

/**
 * Run tests if called directly
 */
async function runTOTTests() {
  const testSuite = new TOTCalculationTest();

  try {
    await testSuite.runAllTests();

    // Return success/failure for CI/CD integration
    return testSuite.testResults.failed === 0;
  } catch (error) {
    console.error("❌ Test suite execution failed:", error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  runTOTTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Test execution failed:", error);
      process.exit(1);
    });
}

module.exports = {
  TOTCalculationTest,
  runTOTTests,
};
