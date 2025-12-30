const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { Permission, Role, ID } = require("node-appwrite");

async function createCompleteBusinessMetrics() {
  try {
    console.log("🔧 Creating complete business_metrics collection...");

    const permissions = [
      Permission.read(Role.any()),
      Permission.create(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ];

    const collectionName = "Business & Supply Metrics (Complete)";

    // Create collection with auto-generated ID
    const collection = await db.createCollection(
      env.APPWRITE_DATABASE_ID,
      ID.unique(),
      collectionName,
      permissions,
      true
    );

    const collectionId = collection.$id;
    console.log(
      `✅ Created collection: ${collectionName} (ID: ${collectionId})`
    );

    // Wait for collection to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Define all required attributes for BusinessSupplyTower
    const attributes = [
      // Core identification
      { name: "itemId", type: "string", size: 100, required: true },

      // Inventory data
      { name: "currentStock", type: "integer", required: true, default: 0 },
      { name: "reservedStock", type: "integer", required: true, default: 0 },
      { name: "availableStock", type: "integer", required: true, default: 0 },
      { name: "reorderLevel", type: "integer", required: true, default: 0 },
      { name: "stockoutRisk", type: "float", required: false, default: 0.0 },

      // Financial metrics
      { name: "costPrice", type: "float", required: false, default: 0.0 },
      { name: "sellingPrice", type: "float", required: true },
      { name: "marginPercent", type: "float", required: false, default: 0.0 },
      { name: "marginBand", type: "string", size: 20, required: false },

      // Logistics data
      { name: "warehouseLocation", type: "string", size: 100, required: false },
      { name: "averageDeliveryTime", type: "integer", required: false },
      { name: "shippingCost", type: "float", required: false, default: 0.0 },
      {
        name: "deliveryComplexity",
        type: "float",
        required: false,
        default: 1.0,
      },

      // Strategic priorities
      {
        name: "isStrategicCategory",
        type: "boolean",
        required: false,
        default: false,
      },
      { name: "isPromoted", type: "boolean", required: false, default: false },
      { name: "promotionBoost", type: "float", required: false, default: 1.0 },
      {
        name: "isSponsoredByVendor",
        type: "boolean",
        required: false,
        default: false,
      },
      { name: "sponsorBoost", type: "float", required: false, default: 1.0 },

      // Computed scores
      {
        name: "businessBoostScalar",
        type: "float",
        required: false,
        default: 1.0,
      },
      {
        name: "supplySuppression",
        type: "float",
        required: false,
        default: 0.0,
      },

      // Metadata
      { name: "lastUpdated", type: "datetime", required: true },
      { name: "isActive", type: "boolean", required: false, default: true },
    ];

    console.log(`📝 Adding ${attributes.length} attributes...`);

    for (const attr of attributes) {
      try {
        console.log(`  • ${attr.name} (${attr.type})`);

        if (attr.type === "string") {
          await db.createStringAttribute(
            env.APPWRITE_DATABASE_ID,
            collectionId,
            attr.name,
            attr.size,
            attr.required,
            !attr.required && attr.default !== undefined ? attr.default : null
          );
        } else if (attr.type === "integer") {
          await db.createIntegerAttribute(
            env.APPWRITE_DATABASE_ID,
            collectionId,
            attr.name,
            attr.required,
            null,
            null,
            !attr.required && attr.default !== undefined ? attr.default : null
          );
        } else if (attr.type === "float") {
          await db.createFloatAttribute(
            env.APPWRITE_DATABASE_ID,
            collectionId,
            attr.name,
            attr.required,
            null,
            null,
            !attr.required && attr.default !== undefined ? attr.default : null
          );
        } else if (attr.type === "boolean") {
          await db.createBooleanAttribute(
            env.APPWRITE_DATABASE_ID,
            collectionId,
            attr.name,
            attr.required,
            !attr.required && attr.default !== undefined ? attr.default : null
          );
        } else if (attr.type === "datetime") {
          await db.createDatetimeAttribute(
            env.APPWRITE_DATABASE_ID,
            collectionId,
            attr.name,
            attr.required
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (attrError) {
        if (attrError.code === 409) {
          console.log(`    ⚠️ ${attr.name} already exists`);
        } else {
          console.error(`    ❌ Error with ${attr.name}:`, attrError.message);
        }
      }
    }

    console.log("\n🎉 Complete business_metrics collection created!");
    console.log(`📊 Collection ID: ${collectionId}`);

    // Verify attributes
    const finalAttributes = await db.listAttributes(
      env.APPWRITE_DATABASE_ID,
      collectionId
    );
    console.log(
      `✅ Verified ${finalAttributes.attributes.length} attributes created`
    );

    return collectionId;
  } catch (error) {
    console.error(
      "❌ Error creating complete business metrics:",
      error.message
    );
    console.error("Full error:", error);
  }
}

createCompleteBusinessMetrics();
