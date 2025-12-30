const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { Permission, Role } = require("node-appwrite");

async function testCreateRecommendationCollection() {
  try {
    console.log("🧪 Testing recommendation collection creation...\n");

    const collectionId = "test_recommendations_" + Date.now(); // Unique ID
    const collectionName = "Test Recommendations";

    console.log("📝 Creating test collection with ID:", collectionId);

    // Create collection
    const collection = await db.createCollection(
      env.APPWRITE_DATABASE_ID,
      collectionId,
      collectionName,
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      true // documentSecurity
    );

    console.log("✅ Collection created successfully!");
    console.log("   ID:", collection.$id);
    console.log("   Name:", collection.name);

    // Add a test attribute
    console.log("\n📝 Adding test attribute...");
    await db.createStringAttribute(
      env.APPWRITE_DATABASE_ID,
      collectionId,
      "testField",
      100,
      true
    );

    console.log("✅ Attribute added successfully!");

    // Verify the collection exists
    console.log("\n🔍 Verifying collection exists...");
    const verifyCollection = await db.getCollection(
      env.APPWRITE_DATABASE_ID,
      collectionId
    );
    console.log("✅ Collection verified:", verifyCollection.name);

    // List attributes
    const attributes = await db.listAttributes(
      env.APPWRITE_DATABASE_ID,
      collectionId
    );
    console.log(`✅ Found ${attributes.attributes.length} attributes:`);
    attributes.attributes.forEach((attr) => {
      console.log(`   - ${attr.key} (${attr.type})`);
    });

    console.log("\n🎉 Test successful! The API is working correctly.");
    console.log(
      "💡 This means your recommendation collections should be created too."
    );

    return collection;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
    throw error;
  }
}

testCreateRecommendationCollection();
