const SimpleRecommendationSchemas = require("./schemas/simpleRecommendationSchemas");

/**
 * Setup script for Multi-Tower Recommendation System
 * This will create all recommendation collections in your existing database
 */

async function setupRecommendationSystem() {
  try {
    console.log("🚀 Starting Recommendation System setup...");
    console.log("📍 Using existing database from environment variables");

    // Use the simplified schemas
    const schemas = new SimpleRecommendationSchemas();

    // Run the setup
    await schemas.setupCoreCollections();

    console.log("✨ Setup completed successfully!");
    console.log("📊 Your recommendation system core collections are ready!");
  } catch (error) {
    console.error("💥 Setup failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

// Run the setup
setupRecommendationSystem();
