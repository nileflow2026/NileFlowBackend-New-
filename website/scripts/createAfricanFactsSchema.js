/**
 * Database Schema Creation Script for African Facts
 *
 * This script creates the necessary collections and attributes in Appwrite
 * for storing African cultural facts, proverbs, and educational content.
 *
 * Run this script once to set up your database structure.
 *
 * Usage:
 * node scripts/createAfricanFactsSchema.js
 */

const sdk = require("node-appwrite");

// Initialize Appwrite Client
const client = new sdk.Client()
  .setEndpoint("YOUR_APPWRITE_ENDPOINT") // e.g., https://cloud.appwrite.io/v1
  .setProject("YOUR_PROJECT_ID")
  .setKey("YOUR_API_KEY"); // Server API Key with Database permissions

const databases = new sdk.Databases(client);

// Configuration
const DATABASE_ID = "YOUR_DATABASE_ID";
const AFRICAN_FACTS_COLLECTION = "africanFacts";
const AFRICAN_PROVERBS_COLLECTION = "africanProverbs";

/**
 * Create African Facts Collection
 */
async function createAfricanFactsCollection() {
  try {
    console.log("Creating African Facts collection...");

    // Create collection
    const collection = await databases.createCollection(
      DATABASE_ID,
      AFRICAN_FACTS_COLLECTION,
      "African Facts",
      [
        sdk.Permission.read(sdk.Role.any()), // Public read access
        sdk.Permission.write(sdk.Role.users()), // Only authenticated users can write
      ]
    );

    console.log("✓ Collection created:", collection.$id);

    // Create attributes
    const attributes = [
      // Category (required)
      {
        key: "category",
        type: "string",
        size: 50,
        required: true,
        array: false,
      },
      // Title (required)
      {
        key: "title",
        type: "string",
        size: 200,
        required: true,
        array: false,
      },
      // Description (required)
      {
        key: "description",
        type: "string",
        size: 2000,
        required: true,
        array: false,
      },
      // Image URL (required)
      {
        key: "image",
        type: "url",
        required: true,
        array: false,
      },
      // Location (required)
      {
        key: "location",
        type: "string",
        size: 100,
        required: true,
        array: false,
      },
      // Icon name (optional, for Lucide icons)
      {
        key: "iconName",
        type: "string",
        size: 50,
        required: false,
        array: false,
      },
      // Gradient colors (optional)
      {
        key: "gradient",
        type: "string",
        size: 100,
        required: false,
        array: false,
      },
      // Tags (array)
      {
        key: "tags",
        type: "string",
        size: 50,
        required: false,
        array: true,
      },
      // Duration (optional, for events like migrations)
      {
        key: "duration",
        type: "string",
        size: 100,
        required: false,
        array: false,
      },
      // Population (optional, for cultural groups)
      {
        key: "population",
        type: "string",
        size: 50,
        required: false,
        array: false,
      },
      // Height (optional, for mountains)
      {
        key: "height",
        type: "string",
        size: 50,
        required: false,
        array: false,
      },
      // Count (optional, for historical sites)
      {
        key: "count",
        type: "string",
        size: 50,
        required: false,
        array: false,
      },
      // Tradition (optional, for cultural practices)
      {
        key: "tradition",
        type: "string",
        size: 100,
        required: false,
        array: false,
      },
      // Origin (optional, for historical origins)
      {
        key: "origin",
        type: "string",
        size: 100,
        required: false,
        array: false,
      },
      // Size (optional, for geographical features)
      {
        key: "size",
        type: "string",
        size: 50,
        required: false,
        array: false,
      },
      // Animals (optional, for wildlife)
      {
        key: "animals",
        type: "string",
        size: 200,
        required: false,
        array: false,
      },
      // Featured (boolean, for homepage display)
      {
        key: "featured",
        type: "boolean",
        required: false,
        array: false,
        default: false,
      },
      // Sort order (integer)
      {
        key: "sortOrder",
        type: "integer",
        required: false,
        array: false,
        default: 0,
      },
      // Active status (boolean)
      {
        key: "active",
        type: "boolean",
        required: false,
        array: false,
        default: true,
      },
    ];

    // Create each attribute
    for (const attr of attributes) {
      try {
        if (attr.type === "string") {
          await databases.createStringAttribute(
            DATABASE_ID,
            AFRICAN_FACTS_COLLECTION,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
            attr.array
          );
        } else if (attr.type === "integer") {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            AFRICAN_FACTS_COLLECTION,
            attr.key,
            attr.required,
            null, // min
            null, // max
            attr.default,
            attr.array
          );
        } else if (attr.type === "boolean") {
          await databases.createBooleanAttribute(
            DATABASE_ID,
            AFRICAN_FACTS_COLLECTION,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
        } else if (attr.type === "url") {
          await databases.createUrlAttribute(
            DATABASE_ID,
            AFRICAN_FACTS_COLLECTION,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
        }
        console.log(`✓ Created attribute: ${attr.key}`);
      } catch (error) {
        console.error(`✗ Error creating attribute ${attr.key}:`, error.message);
      }
    }

    // Create indexes for better query performance
    console.log("\nCreating indexes...");

    try {
      await databases.createIndex(
        DATABASE_ID,
        AFRICAN_FACTS_COLLECTION,
        "category_index",
        "key",
        ["category"]
      );
      console.log("✓ Created index: category_index");
    } catch (error) {
      console.error("✗ Error creating category index:", error.message);
    }

    try {
      await databases.createIndex(
        DATABASE_ID,
        AFRICAN_FACTS_COLLECTION,
        "featured_index",
        "key",
        ["featured"]
      );
      console.log("✓ Created index: featured_index");
    } catch (error) {
      console.error("✗ Error creating featured index:", error.message);
    }

    try {
      await databases.createIndex(
        DATABASE_ID,
        AFRICAN_FACTS_COLLECTION,
        "active_index",
        "key",
        ["active"]
      );
      console.log("✓ Created index: active_index");
    } catch (error) {
      console.error("✗ Error creating active index:", error.message);
    }

    console.log("\n✓ African Facts collection setup complete!");
  } catch (error) {
    console.error("Error creating African Facts collection:", error);
  }
}

/**
 * Create African Proverbs Collection
 */
async function createAfricanProverbsCollection() {
  try {
    console.log("\nCreating African Proverbs collection...");

    // Create collection
    const collection = await databases.createCollection(
      DATABASE_ID,
      AFRICAN_PROVERBS_COLLECTION,
      "African Proverbs",
      [
        sdk.Permission.read(sdk.Role.any()), // Public read access
        sdk.Permission.write(sdk.Role.users()), // Only authenticated users can write
      ]
    );

    console.log("✓ Collection created:", collection.$id);

    // Create attributes
    const attributes = [
      {
        key: "proverb",
        type: "string",
        size: 500,
        required: true,
        array: false,
      },
      {
        key: "language",
        type: "string",
        size: 50,
        required: false,
        array: false,
      },
      {
        key: "country",
        type: "string",
        size: 100,
        required: false,
        array: false,
      },
      {
        key: "region",
        type: "string",
        size: 100,
        required: false,
        array: false,
      },
      {
        key: "translation",
        type: "string",
        size: 500,
        required: false,
        array: false,
      },
      {
        key: "active",
        type: "boolean",
        required: false,
        array: false,
        default: true,
      },
      {
        key: "sortOrder",
        type: "integer",
        required: false,
        array: false,
        default: 0,
      },
    ];

    // Create each attribute
    for (const attr of attributes) {
      try {
        if (attr.type === "string") {
          await databases.createStringAttribute(
            DATABASE_ID,
            AFRICAN_PROVERBS_COLLECTION,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
            attr.array
          );
        } else if (attr.type === "integer") {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            AFRICAN_PROVERBS_COLLECTION,
            attr.key,
            attr.required,
            null,
            null,
            attr.default,
            attr.array
          );
        } else if (attr.type === "boolean") {
          await databases.createBooleanAttribute(
            DATABASE_ID,
            AFRICAN_PROVERBS_COLLECTION,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
        }
        console.log(`✓ Created attribute: ${attr.key}`);
      } catch (error) {
        console.error(`✗ Error creating attribute ${attr.key}:`, error.message);
      }
    }

    console.log("\n✓ African Proverbs collection setup complete!");
  } catch (error) {
    console.error("Error creating African Proverbs collection:", error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("=".repeat(60));
  console.log("African Facts & Proverbs Database Setup");
  console.log("=".repeat(60));
  console.log("\n");

  await createAfricanFactsCollection();
  await createAfricanProverbsCollection();

  console.log("\n" + "=".repeat(60));
  console.log("Setup Complete!");
  console.log("=".repeat(60));
  console.log("\nNext steps:");
  console.log("1. Update your backend API to expose endpoints:");
  console.log("   - GET /api/african-facts");
  console.log("   - GET /api/african-facts/:id");
  console.log("   - GET /api/african-facts/categories");
  console.log("   - GET /api/african-proverbs");
  console.log("2. Add sample data to your collections");
  console.log("3. Test the endpoints with your frontend");
}

// Run the script
main().catch(console.error);
