// services/setup-vendor-payout-collections.js
const { Client, Databases, ID } = require("node-appwrite");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

/**
 * Creates collections for vendor payout system with audit-ready structure
 *
 * Collections created:
 * 1. vendor_payout_batches - Groups orders by vendor for payout processing
 * 2. vendor_payouts - Records actual payout transactions
 * 3. payout_audit_logs - Comprehensive audit trail for all payout operations
 */
async function setupVendorPayoutCollections() {
  const databaseId = process.env.APPWRITE_DATABASE_ID;

  console.log("🚀 Setting up Vendor Payout Collections...");
  console.log("Database ID:", databaseId);

  try {
    // 1. Create Vendor Payout Batches Collection
    console.log("\n📊 Creating vendor_payout_batches collection...");

    const batchCollection = await databases.createCollection(
      databaseId,
      ID.unique(), // collection ID
      "Vendor Payout Batches", // collection name
    );

    // Add attributes for payout batches
    await databases.createStringAttribute(
      databaseId,
      batchCollection.$id,
      "batch_id", // unique batch identifier
      50,
      true, // required
    );

    await databases.createStringAttribute(
      databaseId,
      batchCollection.$id,
      "vendor_id", // vendor this batch belongs to
      50,
      true,
    );

    await databases.createFloatAttribute(
      databaseId,
      batchCollection.$id,
      "total_amount", // total payout amount for this batch
      true,
    );

    await databases.createStringAttribute(
      databaseId,
      batchCollection.$id,
      "order_ids", // JSON array of order IDs included
      10000,
      true,
    );

    await databases.createDatetimeAttribute(
      databaseId,
      batchCollection.$id,
      "period_start", // payout period start date
      true,
    );

    await databases.createDatetimeAttribute(
      databaseId,
      batchCollection.$id,
      "period_end", // payout period end date
      true,
    );

    await databases.createEnumAttribute(
      databaseId,
      batchCollection.$id,
      "status", // batch processing status
      ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      true
    );

    await databases.createDatetimeAttribute(
      databaseId,
      batchCollection.$id,
      "created_at",
      true,
    );

    await databases.createDatetimeAttribute(
      databaseId,
      batchCollection.$id,
      "updated_at",
      false,
    );

    await databases.createStringAttribute(
      databaseId,
      batchCollection.$id,
      "created_by", // admin user who created the batch
      50,
      true,
    );

    await databases.createIntegerAttribute(
      databaseId,
      batchCollection.$id,
      "order_count", // number of orders in this batch
      true,
    );

    console.log("✅ Created vendor_payout_batches collection");

    // 2. Create Vendor Payouts Collection (actual payout records)
    console.log("\n💰 Creating vendor_payouts collection...");

    const payoutCollection = await databases.createCollection(
      databaseId,
      "vendor_payouts",
      "Vendor Payouts"
    );

    await databases.createStringAttribute(
      databaseId,
      payoutCollection.$id,
      "payout_id", // unique payout transaction identifier
      50,
      true,
    );

    await databases.createStringAttribute(
      databaseId,
      payoutCollection.$id,
      "batch_id", // links to payout batch
      50,
      true,
    );

    await databases.createStringAttribute(
      databaseId,
      payoutCollection.$id,
      "vendor_id",
      50,
      true,
    );

    await databases.createFloatAttribute(
      databaseId,
      payoutCollection.$id,
      "amount", // actual payout amount
      true,
    );

    await databases.createEnumAttribute(
      databaseId,
      payoutCollection.$id,
      "payment_method",
      ["MPESA", "BANK"],
      true,
    );

    await databases.createStringAttribute(
      databaseId,
      payoutCollection.$id,
      "external_reference", // bank/MPesa transaction ID
      200,
      false,
    );

    await databases.createEnumAttribute(
      databaseId,
      payoutCollection.$id,
      "status",
      ["PENDING", "SUCCESS", "FAILED"],
      true
    );

    await databases.createDatetimeAttribute(
      databaseId,
      payoutCollection.$id,
      "initiated_at",
      true,
    );

    await databases.createDatetimeAttribute(
      databaseId,
      payoutCollection.$id,
      "completed_at",
      false,
    );

    await databases.createStringAttribute(
      databaseId,
      payoutCollection.$id,
      "failure_reason", // reason if payout failed
      500,
      false,
    );

    await databases.createStringAttribute(
      databaseId,
      payoutCollection.$id,
      "initiated_by", // admin who initiated payout
      50,
      true,
    );

    await databases.createStringAttribute(
      databaseId,
      payoutCollection.$id,
      "vendor_payment_details", // JSON with vendor's payment info
      2000,
      false,
    );

    console.log("✅ Created vendor_payouts collection");

    // 3. Create Payout Audit Logs Collection
    console.log("\n📋 Creating payout_audit_logs collection...");

    const auditCollection = await databases.createCollection(
      databaseId,
      "payout_audit_logs",
      "Payout Audit Logs"
    );

    await databases.createStringAttribute(
      databaseId,
      auditCollection.$id,
      "audit_id",
      50,
      true,
    );

    await databases.createEnumAttribute(
      databaseId,
      auditCollection.$id,
      "event_type",
      [
        "BATCH_CREATED",
        "BATCH_PROCESSED",
        "PAYOUT_INITIATED",
        "PAYOUT_COMPLETED",
        "PAYOUT_FAILED",
        "ORDER_MARKED_PAID",
      ],
      true,
    );

    await databases.createStringAttribute(
      databaseId,
      auditCollection.$id,
      "entity_id", // batch_id, payout_id, or order_id
      50,
      true,
    );

    await databases.createStringAttribute(
      databaseId,
      auditCollection.$id,
      "entity_type", // "BATCH", "PAYOUT", "ORDER"
      20,
      true,
    );

    await databases.createStringAttribute(
      databaseId,
      auditCollection.$id,
      "vendor_id",
      50,
      true,
    );

    await databases.createFloatAttribute(
      databaseId,
      auditCollection.$id,
      "amount",
      false,
    );

    await databases.createStringAttribute(
      databaseId,
      auditCollection.$id,
      "previous_status", // status before the change
      50,
      false,
    );

    await databases.createStringAttribute(
      databaseId,
      auditCollection.$id,
      "new_status", // status after the change
      50,
      false,
    );

    await databases.createStringAttribute(
      databaseId,
      auditCollection.$id,
      "performed_by", // admin user who performed the action
      50,
      true,
    );

    await databases.createDatetimeAttribute(
      databaseId,
      auditCollection.$id,
      "timestamp",
      true,
    );

    await databases.createStringAttribute(
      databaseId,
      auditCollection.$id,
      "details", // JSON with additional details
      2000,
      false,
    );

    await databases.createStringAttribute(
      databaseId,
      auditCollection.$id,
      "ip_address", // for security tracking
      45,
      false,
    );

    console.log("✅ Created payout_audit_logs collection");

    // 4. Update orders collection to add payout tracking fields
    console.log("\n📦 Adding payout tracking fields to orders collection...");

    const ordersCollection = process.env.APPWRITE_ORDERS_COLLECTION;

    try {
      // Add paid_out flag
      await databases.createBooleanAttribute(
        databaseId,
        ordersCollection,
        "paid_out",
        false,
        false, // default false
      );

      // Add payout_batch_id to track which batch this order belongs to
      await databases.createStringAttribute(
        databaseId,
        ordersCollection,
        "payout_batch_id",
        50,
        false,
      );

      // Add vendor_payout amount (calculated once, stored forever)
      await databases.createFloatAttribute(
        databaseId,
        ordersCollection,
        "vendor_payout",
        false,
      );

      // Add payout_calculated_at timestamp
      await databases.createDatetimeAttribute(
        databaseId,
        ordersCollection,
        "payout_calculated_at",
        false,
      );

      console.log("✅ Added payout tracking fields to orders collection");
    } catch (error) {
      if (error.code === 409) {
        console.log("⚠️  Payout fields already exist in orders collection");
      } else {
        throw error;
      }
    }

    // 5. Create necessary indexes for efficient queries
    console.log("\n📑 Creating database indexes...");

    // Index for batch queries by vendor and status
    await databases.createIndex(
      databaseId,
      batchCollection.$id,
      "idx_vendor_status",
      "key",
      ["vendor_id", "status"],
    );

    // Index for payout queries by status and date
    await databases.createIndex(
      databaseId,
      payoutCollection.$id,
      "idx_status_date",
      "key",
      ["status", "initiated_at"],
    );

    // Index for audit logs by entity and timestamp
    await databases.createIndex(
      databaseId,
      auditCollection.$id,
      "idx_entity_timestamp",
      "key",
      ["entity_id", "timestamp"],
    );

    // Index for unpaid orders
    await databases.createIndex(
      databaseId,
      ordersCollection,
      "idx_unpaid_orders",
      "key",
      ["status", "paid_out", "vendor_id"],
    );

    console.log("✅ Created database indexes");

    console.log("\n🎉 Vendor Payout Collections Setup Complete!");
    console.log("\nCreated Collections:");
    console.log(`- vendor_payout_batches: ${batchCollection.$id}`);
    console.log(`- vendor_payouts: ${payoutCollection.$id}`);
    console.log(`- payout_audit_logs: ${auditCollection.$id}`);
    console.log(
      "\n⚠️  Remember to add these collection IDs to your .env file:",
    );
    console.log(
      `APPWRITE_VENDOR_PAYOUT_BATCHES_COLLECTION_ID=${batchCollection.$id}`,
    );
    console.log(
      `APPWRITE_VENDOR_PAYOUTS_COLLECTION_ID=${payoutCollection.$id}`,
    );
    console.log(
      `APPWRITE_PAYOUT_AUDIT_LOGS_COLLECTION_ID=${auditCollection.$id}`,
    );
  } catch (error) {
    console.error("❌ Error setting up payout collections:", error);

    if (error.code === 409) {
      console.log(
        "⚠️  Some collections may already exist. Check your database.",
      );
    }

    throw error;
  }
}

// Run the setup
if (require.main === module) {
  setupVendorPayoutCollections()
    .then(() => {
      console.log("✅ Setup completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Setup failed:", error);
      process.exit(1);
    });
}

module.exports = { setupVendorPayoutCollections };
