// services/add-transaction-fees-to-orders.js
const { Client, Databases } = require("node-appwrite");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

/**
 * Add transaction_fees field to orders collection for payout calculations
 */
async function addTransactionFeesToOrders() {
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const ordersCollection = process.env.APPWRITE_ORDERS_COLLECTION;

  console.log("🔧 Adding transaction_fees field to orders collection...");
  console.log("Database ID:", databaseId);
  console.log("Orders Collection ID:", ordersCollection);

  try {
    // Add transaction_fees field
    await databases.createFloatAttribute(
      databaseId,
      ordersCollection,
      "transaction_fees",
      false, // not required initially
      0 // default value
    );

    console.log("✅ Added transaction_fees field to orders collection");

    console.log("\n📋 Field Details:");
    console.log("• transaction_fees (float) - Transaction processing fees for this order");
    console.log("• Used in payout calculation: vendor_payout = order_total - transaction_fees - commission_earned");
    console.log("• Default value: 0 (can be calculated if not provided)");

  } catch (error) {
    if (error.code === 409) {
      console.log("⚠️  transaction_fees field already exists");
    } else {
      console.error("❌ Error adding transaction_fees field:", error);
      throw error;
    }
  }

  console.log("\n✅ Orders collection is now ready for vendor payout calculations");
}

// Run the setup
if (require.main === module) {
  addTransactionFeesToOrders()
    .then(() => {
      console.log("✅ Setup completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Setup failed:", error);
      process.exit(1);
    });
}

module.exports = { addTransactionFeesToOrders };