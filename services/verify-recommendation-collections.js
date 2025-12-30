const { db } = require("./src/appwrite");
const { env } = require("./src/env");

async function verifyRecommendationCollections() {
  try {
    console.log("🔍 Looking for recommendation collections...");

    // Expected collection IDs based on what we created
    const expectedCollections = [
      "user_sessions",
      "user_behavior_events",
      "item_embeddings",
      "recommendation_weights",
      "user_sessions_v2",
      "user_behavior_events_v2",
      "item_embeddings_v2",
    ];

    const collections = await db.listCollections(env.APPWRITE_DATABASE_ID);
    const foundCollections = [];

    console.log("📊 Checking for expected collections:");
    for (const expectedId of expectedCollections) {
      const found = collections.collections.find(
        (col) => col.$id === expectedId
      );
      if (found) {
        console.log(`✅ Found: ${found.name} (ID: ${found.$id})`);
        foundCollections.push(found);
      } else {
        console.log(`❌ Not found: ${expectedId}`);
      }
    }

    if (foundCollections.length === 0) {
      console.log("\n🔍 Searching by name patterns...");
      const namePatterns = [
        "Item Embeddings",
        "User Sessions",
        "User Behavior",
        "Recommendation",
        "Tower Fusion",
      ];

      for (const pattern of namePatterns) {
        const matches = collections.collections.filter((col) =>
          col.name.includes(pattern)
        );
        if (matches.length > 0) {
          console.log(`📋 Collections matching "${pattern}":`);
          matches.forEach((col) => {
            console.log(`  ✅ ${col.name} (ID: ${col.$id})`);
            foundCollections.push(col);
          });
        }
      }
    }

    // Show details for found collections
    console.log(
      `\n📈 Found ${foundCollections.length} recommendation collections`
    );

    for (const col of foundCollections) {
      try {
        console.log(`\n📋 ${col.name} (${col.$id}):`);
        const attributes = await db.listAttributes(
          env.APPWRITE_DATABASE_ID,
          col.$id
        );
        if (attributes.attributes.length > 0) {
          attributes.attributes.forEach((attr) => {
            console.log(
              `  • ${attr.key}: ${attr.type}${
                attr.size ? `(${attr.size})` : ""
              } ${attr.required ? "[Required]" : "[Optional]"}`
            );
          });
        } else {
          console.log("  No attributes found");
        }
      } catch (error) {
        console.log(`  ❌ Could not fetch attributes: ${error.message}`);
      }
    }

    if (foundCollections.length > 0) {
      console.log("\n🎉 Recommendation system collections are ready!");
      console.log("You can now start using the recommendation system.");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

verifyRecommendationCollections();
