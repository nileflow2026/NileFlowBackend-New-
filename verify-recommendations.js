const { db } = require("./src/appwrite");
const { env } = require("./src/env");

async function listRecommendationCollections() {
  try {
    console.log("📊 Checking recommendation collections...");

    const collections = await db.listCollections(env.APPWRITE_DATABASE_ID);

    console.log("\n🗂️  All Collections in your database:");
    collections.collections.forEach((collection) => {
      console.log(`- ${collection.name} (ID: ${collection.$id})`);
    });

    console.log("\n🎯 Recommendation System Collections:");
    const recommendationCollections = collections.collections.filter((col) =>
      [
        "user_sessions",
        "user_behavior_events",
        "item_embeddings",
        "recommendation_weights",
      ].includes(col.$id)
    );

    if (recommendationCollections.length === 0) {
      console.log("❌ No recommendation collections found");
    } else {
      recommendationCollections.forEach((collection) => {
        console.log(`✅ ${collection.name} (${collection.$id})`);
      });
      console.log(
        `\n📈 ${recommendationCollections.length}/4 core collections ready!`
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

listRecommendationCollections();
