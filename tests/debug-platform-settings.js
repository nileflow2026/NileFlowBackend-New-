// tests/debug-platform-settings.js
const {
  platformSettingsService,
} = require("../services/platformSettingsService");
const { env } = require("../src/env");

/**
 * Debug Script - Platform Settings Configuration
 *
 * This script helps diagnose platform settings issues by:
 * 1. Checking environment variable configuration
 * 2. Testing database connectivity
 * 3. Verifying platform settings collection exists
 * 4. Checking for required settings (commission_rate)
 * 5. Testing service methods
 */

async function debugPlatformSettings() {
  console.log("🔧 Platform Settings Debug Script");
  console.log("=".repeat(50));

  // Step 1: Check environment variables
  console.log("\n📋 Environment Variables:");
  console.log(`APPWRITE_DATABASE_ID: ${env.APPWRITE_DATABASE_ID || "NOT SET"}`);
  console.log(
    `APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID: ${env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID || "NOT SET"}`,
  );
  console.log(`APPWRITE_ENDPOINT: ${env.APPWRITE_ENDPOINT || "NOT SET"}`);
  console.log(`APPWRITE_PROJECT_ID: ${env.APPWRITE_PROJECT_ID || "NOT SET"}`);

  if (!env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID) {
    console.error(
      "❌ APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID not found in environment",
    );
    console.log("\n💡 To fix this:");
    console.log(
      "1. Ensure your .env file has: APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID=6971ba5000383e449ce5",
    );
    console.log(
      "2. Restart your application to load new environment variables",
    );
    return;
  }

  // Step 2: Test service initialization
  try {
    console.log("\n🚀 Testing service initialization...");
    console.log(`Service database ID: ${platformSettingsService.databaseId}`);
    console.log(
      `Service collection ID: ${platformSettingsService.collectionId}`,
    );

    if (!platformSettingsService.collectionId) {
      throw new Error("Service collection ID is empty");
    }

    console.log("✅ Service initialized correctly");
  } catch (error) {
    console.error("❌ Service initialization failed:", error.message);
    return;
  }

  // Step 3: Test database connectivity and collection access
  try {
    console.log("\n🔗 Testing database connectivity...");

    const { db } = require("../services/appwriteService");
    const collection = await db.getCollection(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID,
    );

    console.log("✅ Collection accessible:", collection.name);
    console.log(`📊 Collection has ${collection.attributes.length} attributes`);
  } catch (error) {
    console.error("❌ Database connectivity failed:", error.message);
    console.log("\n💡 Possible fixes:");
    console.log("1. Verify collection ID is correct: 6971ba5000383e449ce5");
    console.log("2. Check Appwrite API key has database permissions");
    console.log("3. Ensure collection exists in the specified database");
    return;
  }

  // Step 4: List all settings in the collection
  try {
    console.log("\n📄 Listing all platform settings...");

    const { db } = require("../services/appwriteService");
    const allSettings = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID,
    );

    console.log(`📋 Found ${allSettings.documents.length} settings:`);
    allSettings.documents.forEach((doc, index) => {
      console.log(
        `  ${index + 1}. ${doc.settingKey}: ${doc.settingValue} (${doc.settingType})`,
      );
    });
  } catch (error) {
    console.error("❌ Failed to list settings:", error.message);
    return;
  }

  // Step 5: Test commission rate retrieval
  try {
    console.log("\n💰 Testing commission rate retrieval...");

    const commissionRate = await platformSettingsService.getCommissionRate();
    console.log(
      `✅ Commission rate retrieved: ${(commissionRate * 100).toFixed(2)}%`,
    );
  } catch (error) {
    console.error("❌ Commission rate retrieval failed:", error.message);
    console.log("\n💡 This might mean:");
    console.log("1. No 'commission_rate' setting exists in the collection");
    console.log("2. The setting exists but is marked as inactive");
    console.log("3. Database query permissions issue");

    // Try to create the missing commission_rate setting
    try {
      console.log("\n🌱 Attempting to seed commission_rate setting...");

      const { db } = require("../services/appwriteService");
      const { ID } = require("node-appwrite");

      await db.createDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID,
        ID.unique(),
        {
          settingKey: "commission_rate",
          settingValue: "0.00", // 0% commission
          settingType: "commission",
          description: "Platform commission rate as decimal (0.05 = 5%)",
          lastUpdatedBy: "debug_script",
          isActive: true,
          effectiveFrom: new Date().toISOString(),
        },
      );

      console.log("✅ Commission rate setting created (0%)");
      console.log("🔄 Retry the commission controller now");
    } catch (seedError) {
      console.error(
        "❌ Failed to seed commission_rate setting:",
        seedError.message,
      );
    }
  }

  // Step 6: Test other service methods
  try {
    console.log("\n🧪 Testing service configuration validation...");

    const isValid = await platformSettingsService.validateConfiguration();
    console.log(`Configuration valid: ${isValid ? "✅ Yes" : "❌ No"}`);
  } catch (error) {
    console.error("❌ Configuration validation failed:", error.message);
  }

  console.log("\n" + "=".repeat(50));
  console.log("🎯 Debug Summary:");
  console.log("If you see ✅ marks above, your platform settings should work");
  console.log("If you see ❌ marks, follow the suggested fixes");
  console.log("=".repeat(50));
}

// Run debug script
if (require.main === module) {
  debugPlatformSettings()
    .then(() => {
      console.log("\n✅ Debug script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Debug script failed:", error);
      process.exit(1);
    });
}

module.exports = { debugPlatformSettings };
