const { db } = require("./src/appwrite");
const { env } = require("./src/env");
const { Permission, Role, ID } = require("node-appwrite");

async function createContextProfilesCollection() {
  try {
    console.log(
      "🌍 Creating context_profiles collection for ContextCultureTower..."
    );

    const permissions = [
      Permission.read(Role.any()),
      Permission.create(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ];

    const collectionName = "Context & Culture Profiles";

    // Create collection with auto-generated ID
    const collection = await db.createCollection(
      env.APPWRITE_DATABASE_ID,
      ID.unique(),
      collectionName,
      permissions,
      true
    );

    const collectionId = collection.$id;
    console.log(
      `✅ Created collection: ${collectionName} (ID: ${collectionId})`
    );

    // Wait for collection to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Define attributes for context profiles
    const attributes = [
      // Core identification
      { name: "profileKey", type: "string", size: 200, required: true },
      { name: "country", type: "string", size: 10, required: true },
      { name: "countryName", type: "string", size: 100, required: false },
      { name: "city", type: "string", size: 100, required: false },
      { name: "language", type: "string", size: 10, required: true },
      { name: "currency", type: "string", size: 10, required: false },

      // Cultural preferences (stored as JSON strings)
      {
        name: "preferredCategories",
        type: "string",
        size: 5000,
        required: false,
      },
      { name: "preferredBrands", type: "string", size: 5000, required: false },
      {
        name: "preferredPriceRanges",
        type: "string",
        size: 1000,
        required: false,
      },
      { name: "peakHours", type: "string", size: 1000, required: false },
      { name: "seasonalTrends", type: "string", size: 5000, required: false },

      // Usage statistics
      { name: "userCount", type: "integer", required: false, default: 0 },
      {
        name: "totalInteractions",
        type: "integer",
        required: false,
        default: 0,
      },
      {
        name: "avgSessionDuration",
        type: "float",
        required: false,
        default: 0.0,
      },

      // Temporal data
      { name: "lastUpdated", type: "datetime", required: true },
      { name: "createdAt", type: "datetime", required: false },
      { name: "isActive", type: "boolean", required: false, default: true },

      // Performance metrics
      { name: "conversionRate", type: "float", required: false, default: 0.0 },
      { name: "avgOrderValue", type: "float", required: false, default: 0.0 },
    ];

    console.log(`📝 Adding ${attributes.length} attributes...`);

    for (const attr of attributes) {
      try {
        let attribute;

        switch (attr.type) {
          case "string":
            attribute = await db.createStringAttribute(
              env.APPWRITE_DATABASE_ID,
              collectionId,
              attr.name,
              attr.size,
              attr.required,
              attr.default || null
            );
            break;

          case "integer":
            attribute = await db.createIntegerAttribute(
              env.APPWRITE_DATABASE_ID,
              collectionId,
              attr.name,
              attr.required,
              attr.min || null,
              attr.max || null,
              attr.default !== undefined ? attr.default : null
            );
            break;

          case "float":
            attribute = await db.createFloatAttribute(
              env.APPWRITE_DATABASE_ID,
              collectionId,
              attr.name,
              attr.required,
              attr.min || null,
              attr.max || null,
              attr.default !== undefined ? attr.default : null
            );
            break;

          case "boolean":
            attribute = await db.createBooleanAttribute(
              env.APPWRITE_DATABASE_ID,
              collectionId,
              attr.name,
              attr.required,
              attr.default !== undefined ? attr.default : null
            );
            break;

          case "datetime":
            attribute = await db.createDatetimeAttribute(
              env.APPWRITE_DATABASE_ID,
              collectionId,
              attr.name,
              attr.required,
              attr.default || null
            );
            break;

          default:
            console.log(`⚠️  Unknown attribute type: ${attr.type}`);
            continue;
        }

        console.log(`  ✅ Added ${attr.name} (${attr.type})`);
      } catch (error) {
        console.log(`  ⚠️  Failed to add ${attr.name}:`, error.message);
      }

      // Small delay between attribute creation
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Create indexes for common queries
    console.log("📑 Creating indexes...");

    try {
      // Index for profile key (primary lookup)
      await db.createIndex(
        env.APPWRITE_DATABASE_ID,
        collectionId,
        "idx_profile_key",
        "key",
        ["profileKey"]
      );
      console.log("  ✅ Created index: idx_profile_key");

      // Index for country lookups
      await db.createIndex(
        env.APPWRITE_DATABASE_ID,
        collectionId,
        "idx_country",
        "key",
        ["country"]
      );
      console.log("  ✅ Created index: idx_country");

      // Index for language lookups
      await db.createIndex(
        env.APPWRITE_DATABASE_ID,
        collectionId,
        "idx_language",
        "key",
        ["language"]
      );
      console.log("  ✅ Created index: idx_language");

      // Index for active profiles
      await db.createIndex(
        env.APPWRITE_DATABASE_ID,
        collectionId,
        "idx_active",
        "key",
        ["isActive"]
      );
      console.log("  ✅ Created index: idx_active");
    } catch (error) {
      console.log("⚠️  Some indexes failed to create:", error.message);
    }

    console.log("\n🎉 Context profiles collection setup complete!");
    console.log(`📊 Collection: ${collectionName} (${collectionId})`);
    console.log(`📍 Database: ${env.APPWRITE_DATABASE_ID}`);
    console.log(`🌍 Ready for African cultural context analysis!`);
  } catch (error) {
    console.error("❌ Failed to create context profiles collection:", error);
    console.error("Error details:", error.response || error.message);
  }
}

// Run the setup
createContextProfilesCollection();
