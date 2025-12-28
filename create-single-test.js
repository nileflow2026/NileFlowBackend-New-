const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { Permission, Role } = require("node-appwrite");

async function createSingleCollection() {
  try {
    console.log("🧪 Creating a single test recommendation collection...");

    const permissions = [
      Permission.read(Role.any()),
      Permission.create(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ];

    const collectionId = "rec_sessions_" + Date.now();
    const collectionName = "Recommendation Sessions Test";

    console.log(`📝 Creating collection: ${collectionId}`);

    // Create the collection
    const collection = await db.createCollection(
      env.APPWRITE_DATABASE_ID,
      collectionId,
      collectionName,
      permissions,
      true // documentSecurity
    );

    console.log("✅ Collection created successfully!");
    console.log(`   ID: ${collection.$id}`);
    console.log(`   Name: ${collection.name}`);
    console.log(`   Database: ${collection.databaseId}`);

    // Verify it exists by listing collections
    console.log("\n🔍 Verifying collection exists...");
    const allCollections = await db.listCollections(env.APPWRITE_DATABASE_ID);
    const found = allCollections.collections.find(
      (col) => col.$id === collectionId
    );

    if (found) {
      console.log("✅ Collection verified in database listing");
      console.log(`   Found: ${found.name} (${found.$id})`);
    } else {
      console.log("❌ Collection NOT found in database listing");
      console.log("This indicates a timing or API issue");
    }

    // Wait and try to add an attribute
    console.log("\n⏳ Waiting 3 seconds before adding attribute...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("📝 Adding test attribute...");
    await db.createStringAttribute(
      env.APPWRITE_DATABASE_ID,
      collectionId,
      "userId",
      100,
      true
    );

    console.log("✅ Attribute added successfully!");

    // Final verification
    console.log("\n🏁 Final verification...");
    const finalCheck = await db.listCollections(env.APPWRITE_DATABASE_ID);
    const finalFound = finalCheck.collections.find(
      (col) => col.$id === collectionId
    );

    if (finalFound) {
      console.log(`✅ SUCCESS! Collection exists: ${finalFound.name}`);

      // Check attributes
      const attributes = await db.listAttributes(
        env.APPWRITE_DATABASE_ID,
        collectionId
      );
      console.log(`📋 Attributes: ${attributes.attributes.length}`);
      attributes.attributes.forEach((attr) => {
        console.log(`   • ${attr.key} (${attr.type})`);
      });
    } else {
      console.log("❌ Collection still not found");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  }
}

createSingleCollection();
