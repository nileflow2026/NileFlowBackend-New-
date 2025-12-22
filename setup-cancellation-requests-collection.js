const { Client, Databases, ID } = require("node-appwrite");
const { env } = require("./src/env");

async function setupCancellationRequestsCollection() {
  const client = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT)
    .setProject(env.APPWRITE_PROJECT_ID)
    .setKey(env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  const databaseId = env.APPWRITE_DATABASE_ID;
  const collectionId = env.APPWRITE_CANCELLATION_REQUESTS_COLLECTION_ID;

  console.log("🚀 Setting up Cancellation Requests Collection...");
  console.log("Database ID:", databaseId);
  console.log("Collection ID:", collectionId);

  try {
    // Check if collection exists
    await databases.getCollection(databaseId, collectionId);
    console.log("✅ Collection exists");
  } catch (error) {
    console.error(
      "❌ Collection not found. Please create it in Appwrite Console first."
    );
    console.log("\nTo create the collection:");
    console.log("1. Go to Appwrite Console > Databases");
    console.log(`2. Select database: ${databaseId}`);
    console.log("3. Create a new collection with ID:", collectionId);
    console.log("4. Run this script again");
    return;
  }

  console.log("\n📝 Creating attributes...");

  const attributes = [
    {
      key: "orderId",
      type: "string",
      size: 255,
      required: true,
      array: false,
    },
    {
      key: "userId",
      type: "string",
      size: 255,
      required: true,
      array: false,
    },
    {
      key: "customerEmail",
      type: "string",
      size: 255,
      required: true,
      array: false,
    },
    {
      key: "customerName",
      type: "string",
      size: 255,
      required: true,
      array: false,
    },
    {
      key: "reason",
      type: "string",
      size: 500,
      required: true,
      array: false,
    },
    {
      key: "additionalDetails",
      type: "string",
      size: 1000,
      required: false,
      array: false,
    },
    {
      key: "status",
      type: "string",
      size: 50,
      required: false,
      array: false,
      default: "pending",
    },
    {
      key: "requestedAt",
      type: "string",
      size: 100,
      required: true,
      array: false,
    },
    {
      key: "reviewedAt",
      type: "string",
      size: 100,
      required: false,
      array: false,
    },
    {
      key: "reviewedBy",
      type: "string",
      size: 255,
      required: false,
      array: false,
    },
    {
      key: "orderAmount",
      type: "integer",
      required: true,
      array: false,
    },
    {
      key: "orderStatus",
      type: "string",
      size: 100,
      required: true,
      array: false,
    },
    {
      key: "paymentMethod",
      type: "string",
      size: 100,
      required: true,
      array: false,
    },
    {
      key: "adminNotes",
      type: "string",
      size: 1000,
      required: false,
      array: false,
    },
  ];

  for (const attr of attributes) {
    try {
      if (attr.type === "string") {
        await databases.createStringAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.size,
          attr.required,
          attr.default,
          attr.array
        );
      } else if (attr.type === "integer") {
        await databases.createIntegerAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.required,
          undefined,
          undefined,
          attr.default
        );
      }
      console.log(
        `✅ Created: ${attr.key} (${attr.type}, ${
          attr.required ? "required" : "optional"
        })`
      );

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      if (error.code === 409) {
        console.log(`⚠️  Attribute ${attr.key} already exists, skipping...`);
      } else {
        console.error(`❌ Failed to create ${attr.key}:`, error.message);
      }
    }
  }

  console.log("\n🎉 Setup complete!");
  console.log(
    "\n💡 Note: Attributes may take a few moments to become available in Appwrite"
  );
  console.log("✅ Script completed successfully");
}

setupCancellationRequestsCollection().catch(console.error);
