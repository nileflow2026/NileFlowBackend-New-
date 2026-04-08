const { Client, Databases, ID, Permission, Role } = require("node-appwrite");
const { db } = require("../src/appwrite");
const { env } = require("../src/env");

/**
 * Simplified Multi-Tower Recommendation System - Appwrite Schema Setup
 *
 * This creates the core collections needed for the recommendation system
 * using the correct node-appwrite API format.
 */

class SimpleRecommendationSchemas {
  constructor(client = null, databaseId = null) {
    this.client = client;
    this.databases = client ? new Databases(client) : db;
    this.databaseId = databaseId || env.APPWRITE_DATABASE_ID;
  }

  // Helper method to get default permissions for collections
  getDefaultPermissions() {
    return [
      Permission.read(Role.any()),
      Permission.create(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ];
  }

  async initializeDatabase() {
    try {
      const databases = await this.databases.list();
      const existingDb = databases.databases.find(
        (db) => db.$id === this.databaseId
      );

      if (!existingDb) {
        await this.databases.create(
          this.databaseId,
          "Nile Flow Recommendations"
        );
        console.log("✅ Recommendation database created");
      } else {
        console.log("✅ Using existing database:", existingDb.name);
      }
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Database already exists");
      } else {
        console.error("❌ Database initialization error:", error);
        throw error;
      }
    }
  }

  async createCollection(collectionId, collectionName, attributes) {
    try {
      // First create the collection
      console.log(`📝 Creating ${collectionName} collection...`);
      const collection = await this.databases.createCollection(
        this.databaseId,
        collectionId,
        collectionName,
        this.getDefaultPermissions(),
        true // documentSecurity
      );

      // Add a small delay to ensure collection is ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(`📝 Adding attributes to ${collectionName}...`);

      // Then add attributes
      for (const attr of attributes) {
        try {
          if (attr.type === "string") {
            await this.databases.createStringAttribute(
              this.databaseId,
              collectionId,
              attr.name,
              attr.size,
              attr.required,
              attr.default || null
            );
          } else if (attr.type === "integer") {
            await this.databases.createIntegerAttribute(
              this.databaseId,
              collectionId,
              attr.name,
              attr.required,
              null, // min
              null, // max
              attr.default || null
            );
          } else if (attr.type === "float") {
            await this.databases.createFloatAttribute(
              this.databaseId,
              collectionId,
              attr.name,
              attr.required,
              null, // min
              null, // max
              attr.default || null
            );
          } else if (attr.type === "boolean") {
            await this.databases.createBooleanAttribute(
              this.databaseId,
              collectionId,
              attr.name,
              attr.required,
              attr.default || null
            );
          } else if (attr.type === "datetime") {
            await this.databases.createDatetimeAttribute(
              this.databaseId,
              collectionId,
              attr.name,
              attr.required
            );
          }

          // Small delay between attribute creations
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          if (error.code !== 409) {
            // Attribute already exists
            console.error(`Error adding ${attr.name}:`, error.message);
          }
        }
      }

      return collection;
    } catch (error) {
      if (error.code === 409) {
        console.log(`⚠️  ${collectionName} already exists`);
        return { $id: collectionId };
      } else {
        throw error;
      }
    }
  }

  async setupCoreCollections() {
    console.log("🚀 Setting up Core Recommendation System collections...");

    try {
      await this.initializeDatabase();

      // 1. User Sessions Collection
      await this.createCollection("user_sessions", "User Sessions", [
        { name: "userId", type: "string", size: 100, required: true },
        { name: "sessionId", type: "string", size: 100, required: true },
        { name: "deviceType", type: "string", size: 50, required: true },
        { name: "language", type: "string", size: 10, required: true },
        { name: "startTime", type: "datetime", required: true },
        { name: "lastActivity", type: "datetime", required: true },
        { name: "isActive", type: "boolean", required: true, default: true },
        { name: "totalViews", type: "integer", required: true, default: 0 },
        { name: "totalClicks", type: "integer", required: true, default: 0 },
      ]);

      // 2. User Behavior Events Collection
      await this.createCollection(
        "user_behavior_events",
        "User Behavior Events",
        [
          { name: "userId", type: "string", size: 100, required: true },
          { name: "sessionId", type: "string", size: 100, required: true },
          { name: "eventType", type: "string", size: 50, required: true },
          { name: "itemId", type: "string", size: 100, required: false },
          { name: "timestamp", type: "datetime", required: true },
          { name: "deviceType", type: "string", size: 50, required: true },
        ]
      );

      // 3. Item Embeddings Collection
      await this.createCollection("item_embeddings", "Item Embeddings", [
        { name: "itemId", type: "string", size: 100, required: true },
        { name: "category", type: "string", size: 100, required: true },
        { name: "brand", type: "string", size: 100, required: true },
        { name: "priceUSD", type: "float", required: true },
        { name: "stockLevel", type: "integer", required: true, default: 0 },
        {
          name: "popularityScore",
          type: "float",
          required: false,
          default: 0.0,
        },
        { name: "lastUpdated", type: "datetime", required: true },
        { name: "isActive", type: "boolean", required: true, default: true },
      ]);

      // 4. Recommendation Weights Collection
      await this.createCollection(
        "recommendation_weights",
        "Tower Fusion Weights",
        [
          { name: "configName", type: "string", size: 100, required: true },
          { name: "version", type: "string", size: 20, required: true },
          {
            name: "intentWeight",
            type: "float",
            required: true,
            default: 0.25,
          },
          {
            name: "itemQualityWeight",
            type: "float",
            required: true,
            default: 0.2,
          },
          {
            name: "contextWeight",
            type: "float",
            required: true,
            default: 0.15,
          },
          { name: "trustWeight", type: "float", required: true, default: 0.2 },
          { name: "isActive", type: "boolean", required: true, default: false },
        ]
      );

      console.log("🎉 Core Recommendation System setup complete!");
      console.log("📊 Your recommendation system is ready to use.");
    } catch (error) {
      console.error("💥 Setup failed:", error);
      throw error;
    }
  }
}

module.exports = SimpleRecommendationSchemas;
