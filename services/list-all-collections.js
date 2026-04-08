const { db } = require("./src/appwrite");
const { env } = require("./src/env");

async function listAllCollections() {
  try {
    const collections = await db.listCollections(env.APPWRITE_DATABASE_ID);
    console.log("📚 All collections in database:");
    collections.collections
      .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
      .forEach((col, index) => {
        const isRecent =
          new Date(col.$createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
        const indicator = isRecent ? "🆕" : "  ";
        console.log(`${indicator} ${index + 1}. ${col.name} (ID: ${col.$id})`);
        if (isRecent) {
          console.log(`    Created: ${col.$createdAt}`);
        }
      });

    // Look specifically for v2 collections
    const v2Collections = collections.collections.filter((col) =>
      col.$id.includes("v2")
    );
    if (v2Collections.length > 0) {
      console.log("\n🎯 Found V2 Collections:");
      v2Collections.forEach((col) => {
        console.log(`✅ ${col.name} - ID: ${col.$id}`);
      });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

listAllCollections();
