const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { Permission, Role } = require("node-appwrite");

async function testCollectionCreation() {
  try {
    console.log("🧪 Testing collection creation...");

    // Get default permissions
    const permissions = [
      Permission.read(Role.any()),
      Permission.create(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ];

    // Try to create a simple test collection
    const testId = "test_" + Date.now();
    console.log(`📝 Creating test collection: ${testId}`);

    const collection = await db.createCollection(
      env.APPWRITE_DATABASE_ID,
      testId,
      "Test Collection",
      permissions,
      true // documentSecurity
    );

    console.log("✅ Test collection created:", collection.$id);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Add a test attribute
    console.log("📝 Adding test attribute...");
    await db.createStringAttribute(
      env.APPWRITE_DATABASE_ID,
      testId,
      "testField",
      50,
      true // required
    );

    console.log("✅ Test attribute added successfully!");

    // Clean up - delete the test collection
    console.log("🧹 Cleaning up test collection...");
    await db.deleteCollection(env.APPWRITE_DATABASE_ID, testId);
    console.log("✅ Test collection deleted");

    console.log("\n🎉 Collection creation test PASSED!");
    console.log(
      "The API is working correctly. Let's try the recommendation setup again."
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
}

testCollectionCreation();
