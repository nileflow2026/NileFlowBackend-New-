// setup-subscriptions-collection.js
const { Client, Databases, ID } = require("node-appwrite");
require("dotenv").config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function setupSubscriptionsCollection() {
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID;

  console.log("🚀 Setting up Subscriptions Collection...");
  console.log("Database ID:", databaseId);
  console.log("Collection ID:", collectionId);

  if (!collectionId || collectionId === "your_subscriptions_collection_id") {
    console.error(
      "❌ Please set APPWRITE_SUBSCRIPTIONS_COLLECTION_ID in .env file"
    );
    console.log("\nTo create a collection:");
    console.log("1. Go to Appwrite Console");
    console.log("2. Navigate to Databases");
    console.log("3. Create a new collection called 'subscriptions'");
    console.log("4. Copy the Collection ID");
    console.log(
      "5. Add it to .env: APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=your_collection_id"
    );
    return;
  }

  try {
    // Add checkoutRequestId attribute
    console.log("\n📝 Adding checkoutRequestId attribute...");
    try {
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        "checkoutRequestId",
        255,
        false // Not required
      );
      console.log("✅ checkoutRequestId attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("⚠️  checkoutRequestId attribute already exists");
      } else {
        console.error("❌ Error creating checkoutRequestId:", error.message);
      }
    }

    // Verify all required attributes exist
    console.log("\n🔍 Verifying collection schema...");
    const collection = await databases.getCollection(databaseId, collectionId);

    const requiredAttributes = [
      "userId",
      "status",
      "amount",
      "currency",
      "paymentMethod",
      "expiresAt",
      "startedAt",
      "transactionId",
      "subscriptionId",
      "checkoutRequestId",
      "cancelledAt",
      "renewedAt",
      "sevenDayReminderSent",
      "threeDayReminderSent",
      "autoRenewed",
      "renewalFailed",
      "renewalFailureReason",
      "renewalFailedAt",
      "lastRenewalTransactionId",
      "expiredAt",
      "stripeEventId",
      "paymentConfirmedAt",
    ];

    console.log("\n📋 Collection attributes:");
    collection.attributes.forEach((attr) => {
      console.log(`  - ${attr.key} (${attr.type})`);
    });

    const missingAttributes = requiredAttributes.filter(
      (attr) => !collection.attributes.find((a) => a.key === attr)
    );

    if (missingAttributes.length > 0) {
      console.log("\n⚠️  Missing attributes:");
      missingAttributes.forEach((attr) => console.log(`  - ${attr}`));
      console.log(
        "\nPlease create these attributes manually in Appwrite Console:"
      );
      console.log("userId: string, 255, required");
      console.log("status: string, 50, required");
      console.log("amount: integer, required");
      console.log("currency: string, 10, required");
      console.log("paymentMethod: string, 50, required");
      console.log("expiresAt: datetime, required");
      console.log("startedAt: datetime, required");
      console.log("transactionId: string, 255, not required");
      console.log("subscriptionId: string, 255, not required");
      console.log("checkoutRequestId: string, 255, not required");
      console.log("cancelledAt: datetime, not required");
      console.log("renewedAt: datetime, not required");
      console.log("sevenDayReminderSent: boolean, not required, default false");
      console.log("threeDayReminderSent: boolean, not required, default false");
      console.log("autoRenewed: boolean, not required, default false");
      console.log("renewalFailed: boolean, not required, default false");
      console.log("renewalFailureReason: string, 500, not required");
      console.log("renewalFailedAt: datetime, not required");
      console.log("lastRenewalTransactionId: string, 255, not required");
      console.log("expiredAt: datetime, not required");
      console.log("stripeEventId: string, 255, not required");
      console.log("paymentConfirmedAt: datetime, not required");
    } else {
      console.log("\n✅ All required attributes exist!");
    }

    // Check indexes
    console.log("\n🔍 Checking indexes...");
    console.log("📋 Current indexes:");
    collection.indexes.forEach((idx) => {
      console.log(`  - ${idx.key}: ${idx.attributes.join(", ")}`);
    });

    console.log("\n✅ Setup complete!");
    console.log("\n📖 Usage:");
    console.log(
      "1. Frontend initiates subscription with POST /api/subscription/subscribe"
    );
    console.log("2. User gets STK push on phone");
    console.log(
      "3. Frontend polls GET /api/subscription/payment-status/:checkoutRequestId"
    );
    console.log(
      "4. When user confirms payment, M-Pesa callback updates status to 'active'"
    );
    console.log("5. User gets premium access!");
  } catch (error) {
    console.error("❌ Error setting up collection:", error.message);
    console.error(error);
  }
}

setupSubscriptionsCollection();
