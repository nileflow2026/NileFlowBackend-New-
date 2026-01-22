// test-vendor-payout-system.js
const { VendorPayoutService } = require("./services/vendorPayoutService");
const { db } = require("./services/appwriteService");
const { env } = require("./src/env");
const { Query, ID } = require("node-appwrite");

/**
 * Test Script for Vendor Payout System
 * 
 * This script validates the complete vendor payout workflow:
 * 1. Creates test order data
 * 2. Calculates vendor payouts
 * 3. Generates payout batch
 * 4. Simulates payout execution
 * 5. Verifies audit trail
 * 6. Generates reconciliation report
 */

class VendorPayoutSystemTest {
  constructor() {
    this.vendorPayoutService = new VendorPayoutService();
    this.testVendorId = "test_vendor_123";
    this.testOrderIds = [];
    this.testBatchId = null;
    this.testPayoutId = null;
  }

  async runCompleteTest() {
    console.log("🧪 Starting Vendor Payout System Test...\n");

    try {
      // Test 1: Setup test data
      await this.setupTestData();
      
      // Test 2: Calculate vendor payouts
      await this.testPayoutCalculation();
      
      // Test 3: Generate payout batch
      await this.testBatchGeneration();
      
      // Test 4: Execute payout batch
      await this.testPayoutExecution();
      
      // Test 5: Complete payout
      await this.testPayoutCompletion();
      
      // Test 6: Verify reconciliation
      await this.testReconciliation();
      
      // Test 7: Verify audit trail
      await this.testAuditTrail();
      
      // Test 8: Cleanup test data
      await this.cleanupTestData();
      
      console.log("\n✅ All tests passed! Vendor payout system is working correctly.");
      
    } catch (error) {
      console.error("\n❌ Test failed:", error);
      await this.cleanupTestData();
      process.exit(1);
    }
  }

  async setupTestData() {
    console.log("📝 Setting up test data...");

    // Create test orders with commission and payout data
    const orderData = [
      {
        amount: 100.00,
        vendor_id: this.testVendorId,
        status: "COMPLETED",
        commission_earned: 5.00,
        transaction_fees: 3.50,
        items: JSON.stringify([{
          productId: "test_product_1",
          productName: "Test Product 1",
          price: 100.00,
          quantity: 1
        }])
      },
      {
        amount: 200.00, 
        vendor_id: this.testVendorId,
        status: "COMPLETED",
        commission_earned: 10.00,
        transaction_fees: 7.00,
        items: JSON.stringify([{
          productId: "test_product_2",
          productName: "Test Product 2",
          price: 200.00,
          quantity: 1
        }])
      },
      {
        amount: 150.00,
        vendor_id: this.testVendorId,
        status: "COMPLETED", 
        commission_earned: 7.50,
        transaction_fees: 5.25,
        items: JSON.stringify([{
          productId: "test_product_3",
          productName: "Test Product 3", 
          price: 150.00,
          quantity: 1
        }])
      }
    ];

    for (const order of orderData) {
      try {
        const testOrder = await db.createDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ORDERS_COLLECTION,
          ID.unique(),
          {
            ...order,
            createdAt: new Date().toISOString(),
            paid_out: false,
            gmv_eligible: true
          }
        );
        
        this.testOrderIds.push(testOrder.$id);
        console.log(`  ✓ Created test order: ${testOrder.$id} (${order.amount} KES)`);
      } catch (error) {
        console.error(`  ❌ Failed to create test order:`, error.message);
        throw error;
      }
    }

    console.log(`✅ Created ${this.testOrderIds.length} test orders\n`);
  }

  async testPayoutCalculation() {
    console.log("💰 Testing payout calculation...");

    for (const orderId of this.testOrderIds) {
      try {
        const result = await this.vendorPayoutService.calculateOrderVendorPayout(orderId);
        
        if (!result.success) {
          throw new Error(`Payout calculation failed: ${result.error}`);
        }

        console.log(`  ✓ Order ${orderId}: Payout = ${result.vendor_payout} KES`);
        console.log(`    - Order Total: ${result.order_total} KES`);
        console.log(`    - Transaction Fees: ${result.transaction_fees} KES`);
        console.log(`    - Commission: ${result.commission_earned} KES`);
      } catch (error) {
        console.error(`  ❌ Payout calculation failed for ${orderId}:`, error.message);
        throw error;
      }
    }

    console.log("✅ Payout calculations completed successfully\n");
  }

  async testBatchGeneration() {
    console.log("📦 Testing batch generation...");

    try {
      const batchResult = await this.vendorPayoutService.generatePayoutBatch(
        this.testVendorId,
        {
          adminUserId: "test_admin",
          description: "Test batch generation"
        }
      );

      if (!batchResult.success) {
        throw new Error(`Batch generation failed: ${batchResult.message}`);
      }

      this.testBatchId = batchResult.batch_id;
      
      console.log(`  ✓ Generated batch: ${batchResult.batch_id}`);
      console.log(`  ✓ Total amount: ${batchResult.total_amount} KES`);
      console.log(`  ✓ Order count: ${batchResult.order_count}`);
      console.log(`  ✓ Orders included: ${batchResult.order_ids.length}`);

    } catch (error) {
      console.error("  ❌ Batch generation failed:", error.message);
      throw error;
    }

    console.log("✅ Batch generation completed successfully\n");
  }

  async testPayoutExecution() {
    console.log("🚀 Testing payout execution...");

    try {
      const executionResult = await this.vendorPayoutService.executePayoutBatch(
        this.testBatchId,
        {
          payment_method: "MPESA",
          vendor_payment_details: {
            phone_number: "+254700123456",
            account_name: "Test Vendor",
            payment_type: "B2C"
          },
          adminUserId: "test_admin",
          external_reference: "TEST_REF_" + Date.now(),
          notes: "Test payout execution"
        }
      );

      if (!executionResult.success) {
        throw new Error(`Payout execution failed: ${executionResult.message}`);
      }

      this.testPayoutId = executionResult.payout_id;

      console.log(`  ✓ Payout initiated: ${executionResult.payout_id}`);
      console.log(`  ✓ Payment method: ${executionResult.payment_method}`);
      console.log(`  ✓ Amount: ${executionResult.amount} KES`);
      console.log(`  ✓ Status: ${executionResult.status}`);

    } catch (error) {
      console.error("  ❌ Payout execution failed:", error.message);
      throw error;
    }

    console.log("✅ Payout execution completed successfully\n");
  }

  async testPayoutCompletion() {
    console.log("✅ Testing payout completion...");

    try {
      const completionResult = await this.vendorPayoutService.completePayoutTransaction(
        this.testPayoutId,
        {
          external_reference: "MPESA_CONF_" + Date.now(),
          adminUserId: "test_admin",
          notes: "Test payout completion - payment confirmed"
        }
      );

      if (!completionResult.success) {
        throw new Error(`Payout completion failed: ${completionResult.message}`);
      }

      console.log(`  ✓ Payout completed: ${completionResult.payout_id}`);
      console.log(`  ✓ Batch completed: ${completionResult.batch_id}`);
      console.log(`  ✓ Orders paid: ${completionResult.orders_paid}`);
      console.log(`  ✓ Total amount: ${completionResult.amount} KES`);

    } catch (error) {
      console.error("  ❌ Payout completion failed:", error.message);
      throw error;
    }

    console.log("✅ Payout completion successful\n");
  }

  async testReconciliation() {
    console.log("📊 Testing reconciliation report...");

    try {
      const reconciliation = await this.vendorPayoutService.getVendorPayoutSummary(
        this.testVendorId
      );

      if (!reconciliation.success) {
        throw new Error(`Reconciliation failed: ${reconciliation.message}`);
      }

      const summary = reconciliation.summary;

      console.log("  ✓ Reconciliation Summary:");
      console.log(`    - Total Orders: ${summary.total_orders}`);
      console.log(`    - Paid Orders: ${summary.paid_orders}`);
      console.log(`    - Total GMV: ${summary.total_gmv} KES`);
      console.log(`    - Total Commission: ${summary.total_commission} KES`);
      console.log(`    - Total Fees: ${summary.total_transaction_fees} KES`);
      console.log(`    - Total Vendor Payout: ${summary.total_vendor_payout} KES`);
      console.log(`    - Total Paid Out: ${summary.total_paid_out} KES`);
      console.log(`    - Outstanding Balance: ${summary.outstanding_balance} KES`);

      // Verify reconciliation accuracy
      if (summary.outstanding_balance !== 0) {
        console.warn("  ⚠️  Outstanding balance is not zero - this might indicate an issue");
      }

      if (summary.total_paid_out !== summary.total_vendor_payout) {
        throw new Error("Reconciliation mismatch: Paid amount doesn't match total payout");
      }

    } catch (error) {
      console.error("  ❌ Reconciliation failed:", error.message);
      throw error;
    }

    console.log("✅ Reconciliation test passed\n");
  }

  async testAuditTrail() {
    console.log("📋 Testing audit trail...");

    try {
      // Get audit logs for the batch
      const batchAudits = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PAYOUT_AUDIT_LOGS_COLLECTION_ID,
        [
          Query.equal("entity_id", this.testBatchId),
          Query.orderDesc("timestamp"),
          Query.limit(10)
        ]
      );

      // Get audit logs for the payout
      const payoutAudits = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PAYOUT_AUDIT_LOGS_COLLECTION_ID,
        [
          Query.equal("entity_id", this.testPayoutId),
          Query.orderDesc("timestamp"),
          Query.limit(10)
        ]
      );

      console.log(`  ✓ Batch audit entries: ${batchAudits.documents.length}`);
      console.log(`  ✓ Payout audit entries: ${payoutAudits.documents.length}`);

      // Verify required audit events exist
      const expectedEvents = ["BATCH_CREATED", "PAYOUT_INITIATED", "PAYOUT_COMPLETED"];
      const allAudits = [...batchAudits.documents, ...payoutAudits.documents];
      
      for (const expectedEvent of expectedEvents) {
        const eventExists = allAudits.some(audit => audit.event_type === expectedEvent);
        if (eventExists) {
          console.log(`  ✓ Found audit event: ${expectedEvent}`);
        } else {
          throw new Error(`Missing required audit event: ${expectedEvent}`);
        }
      }

      // Display sample audit entries
      console.log("  ✓ Sample audit entries:");
      allAudits.slice(0, 3).forEach(audit => {
        console.log(`    - ${audit.event_type} at ${audit.timestamp} by ${audit.performed_by}`);
      });

    } catch (error) {
      console.error("  ❌ Audit trail test failed:", error.message);
      throw error;
    }

    console.log("✅ Audit trail test passed\n");
  }

  async cleanupTestData() {
    console.log("🧹 Cleaning up test data...");

    try {
      // Delete test orders
      for (const orderId of this.testOrderIds) {
        try {
          await db.deleteDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_ORDERS_COLLECTION,
            orderId
          );
          console.log(`  ✓ Deleted test order: ${orderId}`);
        } catch (error) {
          console.warn(`  ⚠️  Could not delete test order ${orderId}: ${error.message}`);
        }
      }

      // Delete test batch
      if (this.testBatchId) {
        try {
          const batchResult = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_VENDOR_PAYOUT_BATCHES_COLLECTION_ID,
            [Query.equal("batch_id", this.testBatchId)]
          );

          if (batchResult.documents.length > 0) {
            await db.deleteDocument(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_VENDOR_PAYOUT_BATCHES_COLLECTION_ID,
              batchResult.documents[0].$id
            );
            console.log(`  ✓ Deleted test batch: ${this.testBatchId}`);
          }
        } catch (error) {
          console.warn(`  ⚠️  Could not delete test batch: ${error.message}`);
        }
      }

      // Delete test payout
      if (this.testPayoutId) {
        try {
          const payoutResult = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_VENDOR_PAYOUTS_COLLECTION_ID,
            [Query.equal("payout_id", this.testPayoutId)]
          );

          if (payoutResult.documents.length > 0) {
            await db.deleteDocument(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_VENDOR_PAYOUTS_COLLECTION_ID,
              payoutResult.documents[0].$id
            );
            console.log(`  ✓ Deleted test payout: ${this.testPayoutId}`);
          }
        } catch (error) {
          console.warn(`  ⚠️  Could not delete test payout: ${error.message}`);
        }
      }

      // Note: We'll keep audit logs for reference

      console.log("✅ Cleanup completed\n");

    } catch (error) {
      console.error("❌ Cleanup failed:", error);
      // Don't throw - cleanup failure shouldn't fail the test
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const test = new VendorPayoutSystemTest();
  test.runCompleteTest()
    .then(() => {
      console.log("🎉 Vendor Payout System Test Suite Completed Successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Test Suite Failed:", error);
      process.exit(1);
    });
}

module.exports = VendorPayoutSystemTest;