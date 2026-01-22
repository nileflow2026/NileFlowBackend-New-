// setup-platform-settings-collection.js
const { Client, Databases, ID } = require("node-appwrite");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function setupPlatformSettingsCollection() {
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID;

  console.log("🚀 Setting up Platform Settings Collection...");
  console.log("Database ID:", databaseId);
  console.log("Collection ID:", collectionId);

  if (
    !collectionId ||
    collectionId === "your_platform_settings_collection_id"
  ) {
    console.error(
      "❌ Please set APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID in .env file",
    );
    console.log("\nTo create a collection:");
    console.log("1. Go to Appwrite Console");
    console.log("2. Navigate to Databases");
    console.log("3. Create a new collection called 'platform_settings'");
    console.log("4. Copy the Collection ID");
    console.log(
      "5. Add it to .env: APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID=your_collection_id",
    );
    return;
  }

  try {
    // Verify collection exists or create it
    let collection;
    try {
      collection = await databases.getCollection(databaseId, collectionId);
      console.log("✅ Collection exists");
    } catch (error) {
      if (error.code === 404) {
        console.log("📝 Creating platform_settings collection...");
        collection = await databases.createCollection(
          databaseId,
          collectionId,
          "Platform Settings",
        );
        console.log("✅ Collection created");
      } else {
        throw error;
      }
    }

    // Define required attributes for platform settings
    const attributes = [
      {
        key: "settingKey",
        type: "string",
        size: 100,
        required: true,
        description:
          "Unique identifier for the setting (e.g., 'commission_rate')",
      },
      {
        key: "settingValue",
        type: "string", // Store as string for flexibility (JSON, numbers, booleans)
        size: 1000,
        required: true,
        description: "The actual setting value",
      },
      {
        key: "settingType",
        type: "string",
        size: 50,
        required: true,
        description: "Type of setting: 'commission', 'tax', 'general', etc.",
      },
      {
        key: "description",
        type: "string",
        size: 500,
        required: false,
        description: "Human-readable description of the setting",
      },
      {
        key: "lastUpdatedBy",
        type: "string",
        size: 255,
        required: true,
        description: "Admin user ID who last updated this setting",
      },
      {
        key: "validationRules",
        type: "string",
        size: 1000,
        required: false,
        description:
          "JSON string containing validation rules (min, max, format)",
      },
      {
        key: "isActive",
        type: "boolean",
        required: false,
        default: true,
        description: "Whether this setting is currently active",
      },
      {
        key: "effectiveFrom",
        type: "datetime",
        required: false,
        description: "When this setting becomes effective (for future changes)",
      },
    ];

    // Create attributes
    console.log("\n📝 Creating attributes...");
    for (const attr of attributes) {
      try {
        if (attr.type === "string") {
          await databases.createStringAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
          );
        } else if (attr.type === "boolean") {
          await databases.createBooleanAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
          );
        } else if (attr.type === "datetime") {
          await databases.createDatetimeAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
          );
        }
        console.log(`✅ ${attr.key} attribute created`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️  ${attr.key} attribute already exists`);
        } else {
          console.error(`❌ Error creating ${attr.key}:`, error.message);
        }
      }
    }

    // Create unique index for settingKey to prevent duplicates
    try {
      await databases.createIndex(
        databaseId,
        collectionId,
        "unique_setting_key",
        "unique",
        ["settingKey"],
      );
      console.log("✅ Unique index for settingKey created");
    } catch (error) {
      if (error.code === 409) {
        console.log("⚠️  Unique index already exists");
      } else {
        console.error("❌ Error creating unique index:", error.message);
      }
    }

    // Create index for settingType for faster queries
    try {
      await databases.createIndex(
        databaseId,
        collectionId,
        "setting_type_index",
        "key",
        ["settingType"],
      );
      console.log("✅ Index for settingType created");
    } catch (error) {
      if (error.code === 409) {
        console.log("⚠️  SettingType index already exists");
      } else {
        console.error("❌ Error creating settingType index:", error.message);
      }
    }

    // Seed initial commission setting if it doesn't exist
    console.log("\n🌱 Seeding initial platform settings...");
    try {
      const existingSettings = await databases.listDocuments(
        databaseId,
        collectionId,
      );

      const hasCommissionSetting = existingSettings.documents.some(
        (doc) => doc.settingKey === "commission_rate",
      );

      if (!hasCommissionSetting) {
        await databases.createDocument(databaseId, collectionId, ID.unique(), {
          settingKey: "commission_rate",
          settingValue: "0.00", // Start with 0% commission
          settingType: "commission",
          description: "Platform commission rate as decimal (0.05 = 5%)",
          lastUpdatedBy: "system", // System default
          validationRules: JSON.stringify({
            type: "number",
            min: 0,
            max: 1,
            step: 0.001,
          }),
          isActive: true,
          effectiveFrom: new Date().toISOString(),
        });
        console.log("✅ Initial commission rate setting created (0%)");

        // Also create commission history tracking setting
        await databases.createDocument(databaseId, collectionId, ID.unique(), {
          settingKey: "commission_history_retention_days",
          settingValue: "3650", // 10 years
          settingType: "commission",
          description: "How long to retain commission calculation history",
          lastUpdatedBy: "system",
          validationRules: JSON.stringify({
            type: "integer",
            min: 365,
            max: 7300,
          }),
          isActive: true,
          effectiveFrom: new Date().toISOString(),
        });
        console.log("✅ Commission history retention setting created");

        // Create GMV calculation setting
        await databases.createDocument(databaseId, collectionId, ID.unique(), {
          settingKey: "gmv_calculation_method",
          settingValue: "completed_orders", // Options: "completed_orders", "all_paid_orders"
          settingType: "general",
          description: "Method used for calculating Gross Merchandise Value",
          lastUpdatedBy: "system",
          validationRules: JSON.stringify({
            type: "enum",
            allowed: [
              "completed_orders",
              "all_paid_orders",
              "delivered_orders",
            ],
          }),
          isActive: true,
          effectiveFrom: new Date().toISOString(),
        });
        console.log("✅ GMV calculation method setting created");
      } else {
        console.log("⚠️  Commission settings already exist, skipping seed");
      }
    } catch (seedError) {
      console.error("❌ Error seeding initial settings:", seedError.message);
    }

    console.log("\n🔍 Verifying collection schema...");
    const finalCollection = await databases.getCollection(
      databaseId,
      collectionId,
    );

    const requiredAttributes = [
      "settingKey",
      "settingValue",
      "settingType",
      "description",
      "lastUpdatedBy",
      "validationRules",
      "isActive",
      "effectiveFrom",
    ];

    const missingAttributes = requiredAttributes.filter(
      (attr) => !finalCollection.attributes.some((a) => a.key === attr),
    );

    if (missingAttributes.length === 0) {
      console.log("✅ All required attributes are present");
      console.log(
        `📊 Collection has ${finalCollection.attributes.length} attributes`,
      );

      // Display current documents
      const docs = await databases.listDocuments(databaseId, collectionId);
      console.log(
        `📄 Collection has ${docs.documents.length} settings documents`,
      );

      docs.documents.forEach((doc) => {
        console.log(
          `   • ${doc.settingKey}: ${doc.settingValue} (${doc.settingType})`,
        );
      });
    } else {
      console.error("❌ Missing attributes:", missingAttributes);
    }
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    throw error;
  }
}

// Commission Setting Value Object Interface (for documentation)
/**
 * Commission Rate Setting Structure:
 * {
 *   settingKey: "commission_rate",
 *   settingValue: "0.025", // 2.5% as decimal string
 *   settingType: "commission",
 *   description: "Platform commission rate as decimal (0.025 = 2.5%)",
 *   lastUpdatedBy: "admin_user_id",
 *   validationRules: "{\"type\":\"number\",\"min\":0,\"max\":1,\"step\":0.001}",
 *   isActive: true,
 *   effectiveFrom: "2026-01-22T12:00:00.000Z"
 * }
 */

setupPlatformSettingsCollection()
  .then(() => {
    console.log(
      "\n✅ Platform Settings Collection setup completed successfully",
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Platform Settings Collection setup failed:", error);
    process.exit(1);
  });
