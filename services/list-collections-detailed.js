const { db } = require("./src/appwrite");
const { env } = require("./src/env");

async function listAllCollections() {
  try {
    console.log("🔍 Checking all collections in the database...\n");

    const collections = await db.listCollections(env.APPWRITE_DATABASE_ID);

    console.log(
      `📊 Found ${collections.collections.length} total collections:\n`
    );

    // Sort by creation date (newest first)
    const sorted = collections.collections.sort(
      (a, b) => new Date(b.$createdAt) - new Date(a.$createdAt)
    );

    sorted.forEach((collection, index) => {
      const date = new Date(collection.$createdAt).toLocaleString();
      console.log(`${index + 1}. ${collection.name}`);
      console.log(`   ID: ${collection.$id}`);
      console.log(`   Created: ${date}`);
      console.log(`   Documents: ${collection.documentsCount || 0}`);
      console.log("");
    });

    // Check specifically for recommendation collections
    const recommendationKeywords = [
      "user_sessions",
      "user_behavior",
      "item_embeddings",
      "recommendation_weights",
      "behavior_events",
      "sessions",
      "embeddings",
      "weights",
    ];

    console.log(
      "🎯 Looking for recommendation collections by ID or name patterns:"
    );
    const found = [];

    sorted.forEach((collection) => {
      const idMatch = recommendationKeywords.some((keyword) =>
        collection.$id.includes(keyword)
      );
      const nameMatch = recommendationKeywords.some((keyword) =>
        collection.name.toLowerCase().includes(keyword)
      );

      if (idMatch || nameMatch) {
        found.push(collection);
        console.log(
          `✅ ${collection.name} (${collection.$id}) - matches keyword`
        );
      }
    });

    if (found.length === 0) {
      console.log("❌ No recommendation collections found by keyword matching");
    } else {
      console.log(
        `\n📈 Found ${found.length} recommendation-related collections!`
      );
    }

    return collections.collections;
  } catch (error) {
    console.error("❌ Error listing collections:", error.message);
    throw error;
  }
}

listAllCollections();
