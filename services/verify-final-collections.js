const { db } = require("./src/appwrite");
const { env } = require("./src/env");

async function verifyRecommendationCollections() {
  try {
    const collections = await db.listCollections(env.APPWRITE_DATABASE_ID);
    const recCollections = collections.collections.filter(
      (col) =>
        col.$id.includes("v2") ||
        col.$id.includes("user_sessions") ||
        col.$id.includes("behavior") ||
        col.$id.includes("embeddings")
    );

    console.log("🎯 Recommendation Collections Created:");
    recCollections.forEach((col) => {
      console.log(`✅ ${col.name} - ID: ${col.$id}`);
    });

    console.log(`\n📊 Total: ${recCollections.length} collections ready!`);

    // Show attributes for each collection
    for (const col of recCollections) {
      try {
        console.log(`\n📋 Attributes for ${col.name}:`);
        const attributes = await db.listAttributes(
          env.APPWRITE_DATABASE_ID,
          col.$id
        );
        attributes.attributes.forEach((attr) => {
          console.log(
            `  • ${attr.key} (${attr.type}) - Required: ${attr.required}`
          );
        });
      } catch (error) {
        console.log(`  ❌ Could not fetch attributes: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

verifyRecommendationCollections();
