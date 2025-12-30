const { db } = require("./src/appwrite");
const { env } = require("./src/env");

async function findRecommendationCollections() {
  try {
    const collections = await db.listCollections(env.APPWRITE_DATABASE_ID);

    const targetNames = [
      "User Sessions",
      "User Behavior Events",
      "Item Embeddings",
      "Tower Fusion Weights",
    ];

    console.log("🎯 Found Recommendation Collections:");
    let foundCount = 0;
    collections.collections.forEach((col) => {
      if (targetNames.includes(col.name)) {
        console.log(`✅ ${col.name} - ID: ${col.$id}`);
        foundCount++;
      }
    });

    if (foundCount === 0) {
      console.log("❌ No recommendation collections found by name");
      console.log("\nLooking for similar names...");
      collections.collections.forEach((col) => {
        const name = col.name.toLowerCase();
        if (
          name.includes("session") ||
          name.includes("behavior") ||
          name.includes("embedding") ||
          name.includes("weight") ||
          name.includes("tower") ||
          name.includes("fusion")
        ) {
          console.log(`? ${col.name} - ID: ${col.$id}`);
        }
      });
    } else {
      console.log(`\n📊 Found ${foundCount}/4 recommendation collections!`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

findRecommendationCollections();
