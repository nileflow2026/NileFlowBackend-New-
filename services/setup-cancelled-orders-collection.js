const { Client, Databases, ID } = require("node-appwrite");
require("dotenv").config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function setupCancelledOrdersCollection() {
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_CANCELLED_ORDERS_COLLECTION_ID;

  console.log("🚀 Setting up Cancelled Orders Collection...");
  console.log("Database ID:", databaseId);
  console.log("Collection ID:", collectionId);

  if (!collectionId || collectionId === "your_cancelled_orders_collection_id") {
    console.error(
      "❌ Please set APPWRITE_CANCELLED_ORDERS_COLLECTION_ID in .env file"
    );
    console.log("\nTo create a collection:");
    console.log("1. Go to Appwrite Console");
    console.log("2. Navigate to Databases");
    console.log("3. Create a new collection called 'cancelled_orders'");
    console.log("4. Copy the Collection ID");
    console.log("5. Update APPWRITE_CANCELLED_ORDERS_COLLECTION_ID in .env");
    process.exit(1);
  }

  try {
    // Verify collection exists
    try {
      await databases.getCollection(databaseId, collectionId);
      console.log("✅ Collection exists");
    } catch (error) {
      console.error(
        "❌ Collection not found. Please create it first in Appwrite Console."
      );
      process.exit(1);
    }

    const attributes = [
      {
        name: "originalOrderId",
        type: "string",
        size: 255,
        required: true,
        array: false,
      },
      {
        name: "users",
        type: "string",
        size: 255,
        required: true,
        array: false,
      },
      {
        name: "customerEmail",
        type: "string",
        size: 255,
        required: true,
        array: false,
      },
      {
        name: "username",
        type: "string",
        size: 255,
        required: true,
        array: false,
      },
      {
        name: "items",
        type: "string",
        size: 65535,
        required: true,
        array: false,
      },
      {
        name: "amount",
        type: "integer",
        required: true,
        array: false,
      },
      {
        name: "currency",
        type: "string",
        size: 10,
        required: true,
        array: false,
      },
      {
        name: "paymentMethod",
        type: "string",
        size: 100,
        required: true,
        array: false,
      },
      {
        name: "orderStatus",
        type: "string",
        size: 50,
        required: true,
        array: false,
      },
      {
        name: "paymentStatus",
        type: "string",
        size: 50,
        required: true,
        array: false,
      },
      {
        name: "cancellationReason",
        type: "string",
        size: 500,
        required: true,
        array: false,
      },
      {
        name: "failureType",
        type: "string",
        size: 50,
        required: true,
        array: false,
      },
      {
        name: "mpesaReceiptNumber",
        type: "string",
        size: 255,
        required: false,
        array: false,
      },
      {
        name: "mpesaPhone",
        type: "string",
        size: 20,
        required: false,
        array: false,
      },
      {
        name: "originalCreatedAt",
        type: "string",
        size: 50,
        required: true,
        array: false,
      },
      {
        name: "cancelledAt",
        type: "string",
        size: 50,
        required: true,
        array: false,
      },
      {
        name: "createdAt",
        type: "string",
        size: 50,
        required: true,
        array: false,
      },
    ];

    console.log("\n📝 Creating attributes...\n");

    for (const attr of attributes) {
      try {
        if (attr.type === "string") {
          await databases.createStringAttribute(
            databaseId,
            collectionId,
            attr.name,
            attr.size,
            attr.required,
            null, // default value
            attr.array
          );
        } else if (attr.type === "integer") {
          await databases.createIntegerAttribute(
            databaseId,
            collectionId,
            attr.name,
            attr.required,
            null, // min
            null, // max
            null, // default
            attr.array
          );
        }

        console.log(
          `✅ Created: ${attr.name} (${attr.type}${
            attr.required ? ", required" : ", optional"
          })`
        );

        // Wait a bit between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️  Skipped: ${attr.name} (already exists)`);
        } else {
          console.error(`❌ Failed to create ${attr.name}:`, error.message);
        }
      }
    }

    console.log("\n🎉 Setup complete!");
    console.log(
      "\n💡 Note: Attributes may take a few moments to become available in Appwrite."
    );
    console.log(
      "   Check the Appwrite Console to verify all attributes are created."
    );
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
}

setupCancelledOrdersCollection()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
