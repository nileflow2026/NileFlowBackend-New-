const { Client, Databases } = require("node-appwrite");
const { env } = require("./src/env");

const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT)
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function getCollectionIds() {
  try {
    const collections = await databases.listCollections(
      env.APPWRITE_DATABASE_ID
    );

    const targetCollections = ["recommendation_weights", "item_social_signals"];

    console.log("🔍 Missing Collection IDs:");
    targetCollections.forEach((name) => {
      const collection = collections.collections.find((c) => c.name === name);
      if (collection) {
        console.log(`${name.toUpperCase()}_COLLECTION_ID=${collection.$id}`);
      } else {
        console.log(`❌ ${name} collection not found`);
      }
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

getCollectionIds();
