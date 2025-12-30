/**
 * Seed Rewards Script
 * Automatically adds all reward documents to Appwrite
 *
 * Usage: node scripts/seedRewards.js
 */

const { db } = require("./services/appwriteService");
const { env } = require("./src/env");
const { ID, Query } = require("node-appwrite");
require("dotenv").config();

const rewards = [
  {
    key: "a_pen",
    name: "Premium Pen",
    miles: 50,
    description: "Limited edition African design pen",
    active: true,
  },
  {
    key: "free_delivery",
    name: "Free Delivery",
    miles: 250,
    description: "Express delivery on any order",
    active: true,
  },
  {
    key: "5_percent_off",
    name: "5% Discount",
    miles: 500,
    description: "5% off your next purchase",
    active: true,
  },
  {
    key: "premium_sale",
    name: "Premium Access",
    miles: 1000,
    description: "Early access to premium sales",
    active: true,
  },
  {
    key: "hoodie",
    name: "Premium Hoodie",
    miles: 2000,
    description: "Exclusive African design hoodie",
    active: true,
  },
  {
    key: "gold_member",
    name: "Gold Membership",
    miles: 5000,
    description: "One year gold membership",
    active: true,
  },
];

async function seedRewards() {
  try {
    console.log("🌱 Starting rewards seeding...\n");

    const databaseId = env.APPWRITE_DATABASE_ID;
    const collectionId = env.APPWRITE_REWARD_COLLECTION_ID;

    console.log(`📦 Database ID: ${databaseId}`);
    console.log(`📦 Collection ID: ${collectionId}\n`);

    // Check if rewards already exist
    console.log("🔍 Checking for existing rewards...\n");

    let existingCount = 0;
    const existingKeys = [];

    for (const reward of rewards) {
      try {
        const docs = await db.listDocuments(databaseId, collectionId, [
          Query.equal("key", reward.key),
        ]);

        if (docs.documents.length > 0) {
          existingCount++;
          existingKeys.push(reward.key);
          console.log(`✅ ${reward.name} (${reward.key}) - Already exists`);
        }
      } catch (error) {
        console.log(`⚠️  Could not check ${reward.key}: ${error.message}`);
      }
    }

    console.log(`\nFound ${existingCount} existing reward(s)\n`);

    // Add missing rewards
    console.log("➕ Adding missing rewards...\n");
    let addedCount = 0;

    for (const reward of rewards) {
      if (existingKeys.includes(reward.key)) {
        continue; // Skip already existing rewards
      }

      try {
        const doc = await db.createDocument(
          databaseId,
          collectionId,
          ID.unique(),
          reward
        );

        console.log(
          `✨ Added: ${reward.name} (${reward.key}) - ${reward.miles} miles`
        );
        addedCount++;
      } catch (error) {
        console.error(`❌ Failed to add ${reward.name}: ${error.message}`);
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`📊 Total added: ${addedCount}`);
    console.log(`📊 Already existed: ${existingCount}`);
    console.log(`📊 Total rewards: ${rewards.length}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

seedRewards();
