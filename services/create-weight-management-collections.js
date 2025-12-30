const { db, ID } = require("./src/appwrite");
const { env } = require("./src/env");

/**
 * Create Weight Management Collections for ConfigDrivenWeightsSystem
 *
 * This script creates all necessary collections for:
 * - Weight configurations and experiments
 * - A/B testing and performance tracking
 * - User experiment assignments
 * - Weight usage analytics
 */

async function createWeightManagementCollections() {
  const DATABASE_ID = env.APPWRITE_DATABASE_ID;

  console.log("🚀 Creating Weight Management Collections...\n");

  // Will store Appwrite-generated collection IDs
  const collectionIds = {
    weightConfigurations: null,
    weightExperiments: null,
    experimentAssignments: null,
    weightPerformance: null,
    weightUsageLogs: null,
  };

  const collections = [
    {
      key: "weightConfigurations",
      name: "Weight Configurations",
      description: "Stores different fusion weight configurations",
      attributes: [
        { key: "configId", type: "string", size: 255, required: true },
        { key: "intentWeight", type: "double", required: false, default: 0.3 },
        { key: "itemWeight", type: "double", required: false, default: 0.25 },
        { key: "contextWeight", type: "double", required: false, default: 0.2 },
        { key: "trustWeight", type: "double", required: false, default: 0.15 },
        {
          key: "businessWeight",
          type: "double",
          required: false,
          default: 0.1,
        },
        { key: "riskPenalty", type: "double", required: false, default: 0.05 },
        { key: "description", type: "string", size: 1000, required: false },
        { key: "isActive", type: "boolean", required: false, default: true },
        { key: "createdAt", type: "string", size: 255, required: true },
        { key: "updatedAt", type: "string", size: 255, required: true },
      ],
      indexes: [
        { key: "configId_index", attributes: ["configId"] },
        { key: "isActive_index", attributes: ["isActive"] },
      ],
    },
    {
      key: "weightExperiments",
      name: "Weight Experiments",
      description: "A/B testing experiments for weight optimization",
      attributes: [
        { key: "name", type: "string", size: 255, required: true },
        { key: "description", type: "string", size: 1000, required: false },
        { key: "status", type: "string", size: 50, required: true }, // active, completed, paused
        { key: "variants", type: "string", size: 5000, required: true }, // JSON array
        {
          key: "targetingCriteria",
          type: "string",
          size: 2000,
          required: false,
        }, // JSON object
        { key: "primaryMetric", type: "string", size: 100, required: true },
        {
          key: "requiredSampleSize",
          type: "integer",
          required: false,
          default: 1000,
        },
        { key: "startDate", type: "string", size: 255, required: true },
        { key: "endDate", type: "string", size: 255, required: true },
        { key: "createdAt", type: "string", size: 255, required: true },
        { key: "updatedAt", type: "string", size: 255, required: true },
      ],
      indexes: [
        { key: "status_index", attributes: ["status"] },
        { key: "dates_index", attributes: ["startDate", "endDate"] },
      ],
    },
    {
      key: "experimentAssignments",
      name: "Experiment Assignments",
      description: "User assignments to experiment variants",
      attributes: [
        { key: "userId", type: "string", size: 255, required: true },
        { key: "experimentId", type: "string", size: 255, required: true },
        { key: "variantId", type: "string", size: 255, required: true },
        { key: "assignedAt", type: "string", size: 255, required: true },
      ],
      indexes: [
        { key: "userId_index", attributes: ["userId"] },
        { key: "experiment_index", attributes: ["experimentId"] },
        {
          key: "user_experiment_index",
          attributes: ["userId", "experimentId"],
        },
      ],
    },
    {
      key: "weightPerformance",
      name: "Weight Performance",
      description: "Performance metrics for weight configurations",
      attributes: [
        { key: "userId", type: "string", size: 255, required: true },
        { key: "configId", type: "string", size: 255, required: true },
        {
          key: "clickThroughRate",
          type: "double",
          required: false,
          default: 0,
        },
        { key: "purchaseRate", type: "double", required: false, default: 0 },
        { key: "addToCartRate", type: "double", required: false, default: 0 },
        { key: "diversityScore", type: "double", required: false, default: 0 },
        {
          key: "culturalRelevance",
          type: "double",
          required: false,
          default: 0,
        },
        {
          key: "userSatisfaction",
          type: "double",
          required: false,
          default: 0,
        },
        { key: "timestamp", type: "string", size: 255, required: true },
      ],
      indexes: [
        { key: "configId_index", attributes: ["configId"] },
        { key: "timestamp_index", attributes: ["timestamp"] },
        { key: "config_time_index", attributes: ["configId", "timestamp"] },
      ],
    },
    {
      key: "weightUsageLogs",
      name: "Weight Usage Logs",
      description: "Detailed logs of weight usage for analytics",
      attributes: [
        { key: "userId", type: "string", size: 255, required: true },
        { key: "configId", type: "string", size: 255, required: true },
        { key: "weights", type: "string", size: 1000, required: true }, // JSON object
        { key: "context", type: "string", size: 2000, required: false }, // JSON object
        { key: "timestamp", type: "string", size: 255, required: true },
      ],
      indexes: [
        { key: "userId_index", attributes: ["userId"] },
        { key: "configId_index", attributes: ["configId"] },
        { key: "timestamp_index", attributes: ["timestamp"] },
      ],
    },
  ];

  for (const collection of collections) {
    try {
      console.log(`📦 Creating ${collection.name}...`);

      // Create collection with Appwrite-generated ID
      const createdCollection = await db.createCollection(
        DATABASE_ID,
        ID.unique(),
        collection.name,
        ['read("any")', 'write("any")']
      );

      // Store the generated ID
      collectionIds[collection.key] = createdCollection.$id;

      console.log(
        `✅ Created collection: ${collection.name} (ID: ${createdCollection.$id})`
      );

      // Add attributes
      console.log("🔧 Adding attributes...");
      for (const attr of collection.attributes) {
        try {
          if (attr.type === "string") {
            await db.createStringAttribute(
              DATABASE_ID,
              createdCollection.$id,
              attr.key,
              attr.size,
              attr.required,
              attr.default || null
            );
          } else if (attr.type === "integer") {
            await db.createIntegerAttribute(
              DATABASE_ID,
              createdCollection.$id,
              attr.key,
              attr.required,
              null, // min
              null, // max
              attr.default || null
            );
          } else if (attr.type === "double") {
            await db.createFloatAttribute(
              DATABASE_ID,
              createdCollection.$id,
              attr.key,
              attr.required,
              null, // min
              null, // max
              attr.default || null
            );
          } else if (attr.type === "boolean") {
            await db.createBooleanAttribute(
              DATABASE_ID,
              createdCollection.$id,
              attr.key,
              attr.required,
              attr.default || false
            );
          }

          console.log(`  ✅ Added ${attr.key} (${attr.type})`);
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`  ❌ Error adding ${attr.key}:`, error.message);
        }
      }

      // Create indexes
      console.log("📊 Creating indexes...");
      for (const index of collection.indexes) {
        try {
          await db.createIndex(
            DATABASE_ID,
            createdCollection.$id,
            index.key,
            "key",
            index.attributes
          );
          console.log(`  ✅ Created ${index.key}`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`  ❌ Error creating ${index.key}:`, error.message);
        }
      }

      console.log(`🎉 ${collection.name} setup complete!\n`);
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log(
          `⚠️  Collection ${collection.name} already exists, skipping...\n`
        );
      } else {
        console.error(`❌ Failed to create ${collection.name}:`, error.message);
      }
    }
  }

  console.log("🎉 All Weight Management Collections setup complete!");

  console.log("\n📝 Generated Collection IDs:");
  Object.entries(collectionIds).forEach(([key, id]) => {
    console.log(`  ${key}: ${id}`);
  });

  // Create default weight configuration
  console.log("\n🔧 Creating default weight configuration...");
  try {
    await db.createDocument(
      DATABASE_ID,
      collectionIds.weightConfigurations,
      ID.unique(),
      {
        configId: "default",
        intentWeight: 0.3,
        itemWeight: 0.25,
        contextWeight: 0.2,
        trustWeight: 0.15,
        businessWeight: 0.1,
        riskPenalty: 0.05,
        description: "Default production weight configuration",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    console.log("✅ Created default weight configuration");
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("⚠️  Default weight configuration already exists");
    } else {
      console.error("❌ Error creating default configuration:", error.message);
    }
  }

  console.log("\n📋 Schema Summary:");
  console.log(
    `- ${collectionIds.weightConfigurations}: Weight fusion configurations`
  );
  console.log(`- ${collectionIds.weightExperiments}: A/B testing experiments`);
  console.log(
    `- ${collectionIds.experimentAssignments}: User-to-variant assignments`
  );
  console.log(
    `- ${collectionIds.weightPerformance}: Performance metrics tracking`
  );
  console.log(`- ${collectionIds.weightUsageLogs}: Detailed usage analytics`);
}

// Run if called directly
if (require.main === module) {
  createWeightManagementCollections()
    .then(() => {
      console.log("\\n✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = createWeightManagementCollections;
