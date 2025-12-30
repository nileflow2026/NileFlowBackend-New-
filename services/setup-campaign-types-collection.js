/**
 * Seed script for campaign types collection
 * Creates the campaign types collection with default values
 * Run this script to initialize the campaign types in your database
 */

const { Databases, Client, ID, Permission, Role } = require("node-appwrite");
require("dotenv").config();

const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const COLLECTION_ID = "campaign-types";

const campaignTypes = [
  {
    id: "marketing",
    name: "Marketing",
    description: "Product promotions and featured items",
    color: "#007bff",
    icon: "📢",
    sortOrder: 1,
  },
  {
    id: "promotional",
    name: "Promotional",
    description: "Special offers and discounts",
    color: "#dc3545",
    icon: "🎯",
    sortOrder: 2,
  },
  {
    id: "announcement",
    name: "Announcement",
    description: "Company news and updates",
    color: "#28a745",
    icon: "📣",
    sortOrder: 3,
  },
  {
    id: "educational",
    name: "Educational",
    description: "Tips, tutorials, and helpful content",
    color: "#6f42c1",
    icon: "🎓",
    sortOrder: 4,
  },
];

const createCampaignTypesCollection = async () => {
  try {
    console.log("Creating campaign types collection...");

    // Try to create the collection
    try {
      await databases.createCollection(
        DATABASE_ID,
        COLLECTION_ID,
        "Campaign Types",
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users()),
        ]
      );
      console.log("✓ Collection created successfully");
    } catch (error) {
      if (error.code === 409) {
        console.log("ℹ Collection already exists");
      } else {
        throw error;
      }
    }

    // Create attributes
    const attributes = [
      { key: "name", size: 100, required: true },
      { key: "description", size: 500, required: false },
      { key: "color", size: 20, required: false },
      { key: "icon", size: 10, required: false },
      { key: "sortOrder", required: false },
      { key: "isActive", required: false, default: true },
    ];

    for (const attr of attributes) {
      try {
        if (attr.key === "sortOrder") {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            attr.key,
            attr.required,
            undefined,
            undefined,
            attr.default
          );
        } else if (attr.key === "isActive") {
          await databases.createBooleanAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            attr.key,
            attr.required,
            attr.default
          );
        } else {
          await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            attr.key,
            attr.size,
            attr.required,
            attr.default
          );
        }
        console.log(`✓ Created attribute: ${attr.key}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ Attribute ${attr.key} already exists`);
        } else {
          console.error(`Error creating attribute ${attr.key}:`, error.message);
        }
      }
    }

    // Wait a bit for attributes to be ready
    console.log("Waiting for attributes to be ready...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Seed the campaign types
    console.log("Seeding campaign types...");
    for (const campaignType of campaignTypes) {
      try {
        const document = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          campaignType.id,
          {
            name: campaignType.name,
            description: campaignType.description,
            color: campaignType.color,
            icon: campaignType.icon,
            sortOrder: campaignType.sortOrder,
            isActive: true,
          }
        );
        console.log(`✓ Created campaign type: ${campaignType.name}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ Campaign type ${campaignType.name} already exists`);
        } else {
          console.error(`Error creating ${campaignType.name}:`, error.message);
        }
      }
    }

    console.log("\n🎉 Campaign types collection setup completed!");
    console.log(
      "You can now fetch campaign types from: GET /api/admin/newsletter/campaign-types"
    );
  } catch (error) {
    console.error("Error setting up campaign types collection:", error);
    process.exit(1);
  }
};

// Run the script
createCampaignTypesCollection();
