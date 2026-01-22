// services/setup-order-commission-tracking.js
const { Client, Databases } = require("node-appwrite");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

/**
 * Add commission tracking and GMV fields to existing orders collection
 *
 * This script adds the following fields to track financial metrics:
 * - commission_earned: Calculated commission amount for this order
 * - commission_rate_used: Commission rate that was applied
 * - transaction_amount: Net transaction amount (for GMV calculation)
 * - vendor_id: ID of the vendor (for vendor-specific analytics)
 * - gmv_eligible: Whether this order counts toward GMV
 * - commission_calculated_at: When commission was calculated
 */
async function setupOrderCommissionTracking() {
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_ORDERS_COLLECTION;

  console.log("🚀 Adding Commission Tracking to Orders Collection...");
  console.log("Database ID:", databaseId);
  console.log("Orders Collection ID:", collectionId);

  if (!collectionId) {
    console.error(
      "❌ APPWRITE_ORDERS_COLLECTION not found in environment variables",
    );
    console.log(
      "Please ensure your .env file has APPWRITE_ORDERS_COLLECTION set",
    );
    return;
  }

  try {
    // Verify orders collection exists
    const collection = await databases.getCollection(databaseId, collectionId);
    console.log(`✅ Orders collection found: ${collection.name}`);

    // Define commission tracking attributes to add
    const commissionAttributes = [
      {
        key: "commission_earned",
        type: "float",
        required: false,
        default: 0.0,
        description:
          "Commission amount earned from this order (calculated, not dynamic)",
      },
      {
        key: "commission_rate_used",
        type: "float",
        required: false,
        default: 0.0,
        description:
          "Commission rate that was applied when order was processed",
      },
      {
        key: "transaction_amount",
        type: "float",
        required: false,
        description:
          "Net transaction amount for GMV calculation (usually same as order total)",
      },
      {
        key: "vendor_id",
        type: "string",
        size: 255,
        required: false,
        description: "Primary vendor ID for this order (for vendor analytics)",
      },
      {
        key: "gmv_eligible",
        type: "boolean",
        required: false,
        default: true,
        description:
          "Whether this order should be included in GMV calculations",
      },
      {
        key: "commission_calculated_at",
        type: "datetime",
        required: false,
        description:
          "Timestamp when commission was calculated for audit purposes",
      },
      {
        key: "financial_status",
        type: "string",
        size: 50,
        required: false,
        default: "pending",
        description:
          "Financial processing status: pending, calculated, settled, disputed",
      },
    ];

    console.log("\n📝 Adding commission tracking attributes...");

    for (const attr of commissionAttributes) {
      try {
        if (attr.type === "float") {
          await databases.createFloatAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.min,
            attr.max,
            attr.default,
          );
        } else if (attr.type === "string") {
          await databases.createStringAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
          );
        } else if (attr.type === "boolean") {
          await databases.createBooleanAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
          );
        } else if (attr.type === "datetime") {
          await databases.createDatetimeAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
          );
        }

        console.log(`✅ ${attr.key} (${attr.type}) - ${attr.description}`);

        // Small delay between attribute creations
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️  ${attr.key} attribute already exists`);
        } else {
          console.error(`❌ Error creating ${attr.key}:`, error.message);
        }
      }
    }

    // Create indexes for better query performance
    console.log("\n🔍 Creating performance indexes...");

    const indexes = [
      {
        name: "commission_earned_index",
        type: "key",
        attributes: ["commission_earned"],
        description: "For commission analytics queries",
      },
      {
        name: "gmv_eligible_index",
        type: "key",
        attributes: ["gmv_eligible", "financial_status"],
        description: "For GMV calculation queries",
      },
      {
        name: "vendor_commission_index",
        type: "key",
        attributes: ["vendor_id", "commission_earned"],
        description: "For vendor-specific commission analytics",
      },
      {
        name: "financial_status_index",
        type: "key",
        attributes: ["financial_status", "$createdAt"],
        description: "For financial reporting and status tracking",
      },
    ];

    for (const index of indexes) {
      try {
        await databases.createIndex(
          databaseId,
          collectionId,
          index.name,
          index.type,
          index.attributes,
        );
        console.log(`✅ ${index.name} - ${index.description}`);

        // Small delay between index creations
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️  ${index.name} already exists`);
        } else {
          console.error(`❌ Error creating ${index.name}:`, error.message);
        }
      }
    }

    // Verify all attributes were added successfully
    console.log("\n🔍 Verifying commission tracking setup...");
    const updatedCollection = await databases.getCollection(
      databaseId,
      collectionId,
    );

    const expectedAttributes = commissionAttributes.map((attr) => attr.key);
    const actualAttributes = updatedCollection.attributes.map(
      (attr) => attr.key,
    );

    const missingAttributes = expectedAttributes.filter(
      (expected) => !actualAttributes.includes(expected),
    );

    if (missingAttributes.length === 0) {
      console.log("✅ All commission tracking attributes added successfully");
      console.log(
        `📊 Orders collection now has ${updatedCollection.attributes.length} total attributes`,
      );

      // Display newly added attributes
      console.log("\n📋 Commission Tracking Attributes Added:");
      commissionAttributes.forEach((attr) => {
        const found = updatedCollection.attributes.find(
          (a) => a.key === attr.key,
        );
        if (found) {
          console.log(`   • ${attr.key} (${attr.type}) - ${attr.description}`);
        }
      });
    } else {
      console.error("❌ Missing attributes:", missingAttributes);
      console.log("Please check the errors above and run the script again");
    }

    // Show sample order document structure with new fields
    console.log(
      "\n📄 Sample Order Document Structure (with commission tracking):",
    );
    console.log({
      $id: "order_123456",
      userId: "user_789",
      customerEmail: "customer@example.com",
      username: "Customer Name",
      items: '[{"productId":"prod_1","price":100,"quantity":2}]',
      amount: 250.0,
      currency: "KES",
      paymentMethod: "M-Pesa",
      orderStatus: "Completed",
      paymentStatus: "succeeded",

      // NEW COMMISSION TRACKING FIELDS
      commission_earned: 12.5, // 5% of 250.00
      commission_rate_used: 0.05, // 5% rate that was active
      transaction_amount: 250.0, // Same as amount for GMV
      vendor_id: "vendor_abc123", // Primary vendor
      gmv_eligible: true, // Counts toward GMV
      commission_calculated_at: "2026-01-22T12:00:00.000Z",
      financial_status: "calculated", // Commission processed

      createdAt: "2026-01-22T10:00:00.000Z", // ✅ Immutable timestamp
      updatedAt: "2026-01-22T12:00:00.000Z",
    });

    console.log("\n💡 Next Steps:");
    console.log(
      "1. Update order creation logic to calculate commission_earned",
    );
    console.log("2. Set transaction_amount = order amount for GMV tracking");
    console.log("3. Mark gmv_eligible = true for completed orders");
    console.log("4. Set vendor_id from product information");
    console.log(
      "5. Update existing orders with backfilled commission data (optional)",
    );
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    throw error;
  }
}

setupOrderCommissionTracking()
  .then(() => {
    console.log("\n✅ Order commission tracking setup completed successfully");
    console.log(
      "Orders collection is now ready for GMV and commission calculation",
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Order commission tracking setup failed:", error);
    process.exit(1);
  });
