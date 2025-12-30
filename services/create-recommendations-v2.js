const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { Permission, Role } = require("node-appwrite");

async function createRecommendationCollectionsV2() {
  try {
    console.log("🚀 Creating Recommendation Collections (V2)...");

    const permissions = [
      Permission.read(Role.any()),
      Permission.create(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ];

    const collections = [
      {
        id: "user_sessions_v2",
        name: "User Sessions V2",
        attributes: [
          { name: "userId", type: "string", size: 100, required: true },
          { name: "sessionId", type: "string", size: 100, required: true },
          { name: "deviceType", type: "string", size: 50, required: true },
          { name: "startTime", type: "datetime", required: true },
          { name: "isActive", type: "boolean", required: false, default: true },
        ],
      },
      {
        id: "user_behavior_events_v2",
        name: "User Behavior Events V2",
        attributes: [
          { name: "userId", type: "string", size: 100, required: true },
          { name: "eventType", type: "string", size: 50, required: true },
          { name: "itemId", type: "string", size: 100, required: false },
          { name: "timestamp", type: "datetime", required: true },
        ],
      },
      {
        id: "item_embeddings_v2",
        name: "Item Embeddings V2",
        attributes: [
          { name: "itemId", type: "string", size: 100, required: true },
          { name: "category", type: "string", size: 100, required: true },
          { name: "brand", type: "string", size: 100, required: true },
          { name: "priceUSD", type: "float", required: true },
          {
            name: "popularityScore",
            type: "float",
            required: false,
            default: 0.0,
          },
        ],
      },
    ];

    for (const collectionConfig of collections) {
      try {
        console.log(`\n📝 Creating ${collectionConfig.name}...`);

        // Create collection
        const collection = await db.createCollection(
          env.APPWRITE_DATABASE_ID,
          collectionConfig.id,
          collectionConfig.name,
          permissions,
          true
        );

        console.log(`✅ Created: ${collection.$id}`);

        // Wait for collection to be ready
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Add attributes
        console.log(
          `📝 Adding ${collectionConfig.attributes.length} attributes...`
        );

        for (const attr of collectionConfig.attributes) {
          try {
            console.log(`  • ${attr.name} (${attr.type})`);

            if (attr.type === "string") {
              await db.createStringAttribute(
                env.APPWRITE_DATABASE_ID,
                collectionConfig.id,
                attr.name,
                attr.size,
                attr.required,
                !attr.required && attr.default !== undefined
                  ? attr.default
                  : null
              );
            } else if (attr.type === "float") {
              await db.createFloatAttribute(
                env.APPWRITE_DATABASE_ID,
                collectionConfig.id,
                attr.name,
                attr.required,
                null,
                null,
                !attr.required && attr.default !== undefined
                  ? attr.default
                  : null
              );
            } else if (attr.type === "boolean") {
              await db.createBooleanAttribute(
                env.APPWRITE_DATABASE_ID,
                collectionConfig.id,
                attr.name,
                attr.required,
                !attr.required && attr.default !== undefined
                  ? attr.default
                  : null
              );
            } else if (attr.type === "datetime") {
              await db.createDatetimeAttribute(
                env.APPWRITE_DATABASE_ID,
                collectionConfig.id,
                attr.name,
                attr.required
              );
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (attrError) {
            if (attrError.code === 409) {
              console.log(`    ⚠️ ${attr.name} already exists`);
            } else {
              console.error(
                `    ❌ Error with ${attr.name}:`,
                attrError.message
              );
            }
          }
        }

        console.log(`✅ ${collectionConfig.name} complete!`);
      } catch (collError) {
        if (collError.code === 409) {
          console.log(`⚠️ ${collectionConfig.name} already exists`);
        } else {
          console.error(
            `❌ Error creating ${collectionConfig.name}:`,
            collError.message
          );
        }
      }
    }

    console.log("\n🎉 Recommendation collections setup complete!");

    // Verify what was created
    console.log("\n📊 Verifying collections...");
    const allCollections = await db.listCollections(env.APPWRITE_DATABASE_ID);
    const createdCollections = allCollections.collections.filter(
      (col) =>
        col.$id.includes("user_sessions") ||
        col.$id.includes("behavior") ||
        col.$id.includes("embeddings")
    );

    console.log("Found recommendation collections:");
    createdCollections.forEach((col) => {
      console.log(`✅ ${col.name} (${col.$id})`);
    });
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    console.error(error);
  }
}

createRecommendationCollectionsV2();
