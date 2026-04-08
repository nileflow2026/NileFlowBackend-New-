const { db } = require("./src/appwrite");
const { env } = require("./src/env");

async function checkCollectionAttributes() {
  try {
    console.log("🔍 Checking attributes for recommendation collections...\n");

    // List of collection IDs to check
    const collectionIds = [
      "item_embeddings",
      "user_sessions",
      "user_behavior_events",
      "recommendation_weights",
      "user_sessions_v2",
      "user_behavior_events_v2",
      "item_embeddings_v2",
    ];

    for (const collectionId of collectionIds) {
      try {
        console.log(`📋 Collection: ${collectionId}`);

        // First check if collection exists
        const collection = await db.getCollection(
          env.APPWRITE_DATABASE_ID,
          collectionId
        );
        console.log(`   ✅ Found: ${collection.name}`);

        // Get attributes
        const attributes = await db.listAttributes(
          env.APPWRITE_DATABASE_ID,
          collectionId
        );

        if (attributes.attributes.length > 0) {
          console.log("   📝 Attributes:");
          attributes.attributes.forEach((attr) => {
            const sizeInfo = attr.size ? `(${attr.size})` : "";
            const requiredInfo = attr.required ? "[Required]" : "[Optional]";
            const defaultInfo =
              attr.default !== null ? ` Default: ${attr.default}` : "";
            console.log(
              `     • ${attr.key}: ${attr.type}${sizeInfo} ${requiredInfo}${defaultInfo}`
            );
          });
        } else {
          console.log("   📭 No attributes found");
        }

        console.log("");
      } catch (error) {
        if (error.code === 404) {
          console.log(`   ❌ Collection "${collectionId}" not found`);
        } else {
          console.log(
            `   ❌ Error checking "${collectionId}": ${error.message}`
          );
        }
        console.log("");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkCollectionAttributes();
