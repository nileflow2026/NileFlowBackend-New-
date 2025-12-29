const { Client, Databases, ID } = require("node-appwrite");
const { env } = require("./src/env");

const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT)
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const db = new Databases(client);

async function updateAddressCollection() {
  console.log("🔧 Updating address collection to support pickup addresses...");

  try {
    // First, get the current collection structure
    const collection = await db.getCollection(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ADDRESS_COLLECTION_ID
    );

    console.log(`✅ Found collection: ${collection.name}`);

    // Check if 'type' attribute already exists
    const hasTypeAttribute = collection.attributes.some(
      (attr) => attr.key === "type"
    );

    if (!hasTypeAttribute) {
      // Add 'type' attribute to distinguish pickup addresses from regular addresses
      try {
        await db.createStringAttribute(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ADDRESS_COLLECTION_ID,
          "type",
          50,
          false, // not required (existing addresses won't have this)
          "delivery" // default value for existing addresses
        );
        console.log("✅ Added 'type' attribute to address collection");
        console.log("   - Type field added with default value 'delivery'");
        console.log("   - Pickup addresses will be marked as type 'pickup'");
      } catch (error) {
        if (error.code === 409) {
          console.log("ℹ️  'type' attribute already exists");
        } else {
          throw error;
        }
      }
    } else {
      console.log("ℹ️  'type' attribute already exists");
    }

    // Check if 'updatedAt' attribute exists
    const hasUpdatedAtAttribute = collection.attributes.some(
      (attr) => attr.key === "updatedAt"
    );

    if (!hasUpdatedAtAttribute) {
      try {
        await db.createStringAttribute(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ADDRESS_COLLECTION_ID,
          "updatedAt",
          255,
          false // not required
        );
        console.log("✅ Added 'updatedAt' attribute to address collection");
      } catch (error) {
        if (error.code === 409) {
          console.log("ℹ️  'updatedAt' attribute already exists");
        } else {
          throw error;
        }
      }
    } else {
      console.log("ℹ️  'updatedAt' attribute already exists");
    }

    console.log("\n🎉 Address collection update completed!");
    console.log("\n📋 Address collection now supports:");
    console.log("   ✓ Regular delivery addresses (type: 'delivery')");
    console.log("   ✓ Pickup addresses (type: 'pickup')");
    console.log("   ✓ Updated timestamp tracking");

    console.log("\n🚀 New API endpoints available:");
    console.log(
      "   POST /api/customerauth/pickup-address - Save pickup address"
    );
    console.log("   GET /api/customerauth/pickup-address - Get pickup address");
  } catch (error) {
    console.error("❌ Error updating address collection:", error);
    console.error("   Message:", error.message);
    if (error.code) {
      console.error("   Code:", error.code);
    }
  }
}

// Run the setup
updateAddressCollection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });
