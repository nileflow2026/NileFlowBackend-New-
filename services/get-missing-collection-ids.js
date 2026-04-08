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

    console.log("🔍 All Collections in database:");
    console.log(`Total collections: ${collections.collections.length}`);

    collections.collections.forEach((collection) => {
      console.log(`- ${collection.name}: ${collection.$id}`);
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

getCollectionIds();
