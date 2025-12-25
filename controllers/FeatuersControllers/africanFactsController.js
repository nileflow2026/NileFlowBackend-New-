const { Databases, Query } = require("node-appwrite");
const { client } = require("../../services/appwriteService");
const { env } = require("../../src/env");

const databases = new Databases(client);

const DATABASE_ID = env.APPWRITE_DATABASE_ID;
const AFRICAN_FACTS_COLLECTION =
  env.AFRICAN_FACTS_COLLECTION_ID || "africanFacts";
const AFRICAN_PROVERBS_COLLECTION =
  env.AFRICAN_PROVERBS_COLLECTION_ID || "africanProverbs";

/**
 * Get all African facts with optional filtering
 * GET /api/african-facts
 */
const getAllAfricanFacts = async (req, res) => {
  try {
    const { category, search, limit = 100 } = req.query;

    const queries = [
      Query.equal("active", true),
      Query.orderDesc("sortOrder"),
      Query.limit(parseInt(limit)),
    ];

    if (category && category !== "all") {
      queries.push(Query.equal("category", category));
    }

    if (search) {
      queries.push(Query.search("title", search));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      AFRICAN_FACTS_COLLECTION,
      queries
    );

    res.json({
      success: true,
      facts: response.documents,
      total: response.total,
    });
  } catch (error) {
    console.error("Error fetching African facts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch African facts",
      message: error.message,
    });
  }
};

/**
 * Get single African fact by ID
 * GET /api/african-facts/:id
 */
const getAfricanFactById = async (req, res) => {
  try {
    const document = await databases.getDocument(
      DATABASE_ID,
      AFRICAN_FACTS_COLLECTION,
      req.params.id
    );

    res.json({
      success: true,
      fact: document,
    });
  } catch (error) {
    console.error("Error fetching fact:", error);
    res.status(404).json({
      success: false,
      error: "Fact not found",
      message: error.message,
    });
  }
};

/**
 * Get all available categories
 * GET /api/african-facts/meta/categories
 */
const getAfricanFactsCategories = async (req, res) => {
  try {
    const categories = [
      { id: "all", name: "All Wonders", icon: "Globe" },
      { id: "culture", name: "Cultural Heritage", icon: "Shield" },
      { id: "nature", name: "Natural Wonders", icon: "Mountain" },
      { id: "history", name: "Historical Facts", icon: "Award" },
      { id: "art", name: "Art & Creativity", icon: "Sparkles" },
      { id: "wildlife", name: "Wildlife & Safari", icon: "Trophy" },
    ];

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
      message: error.message,
    });
  }
};

/**
 * Get featured African facts
 * GET /api/african-facts/featured
 */
const getFeaturedAfricanFacts = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const response = await databases.listDocuments(
      DATABASE_ID,
      AFRICAN_FACTS_COLLECTION,
      [
        Query.equal("active", true),
        Query.equal("featured", true),
        Query.orderDesc("sortOrder"),
        Query.limit(parseInt(limit)),
      ]
    );

    res.json({
      success: true,
      facts: response.documents,
      total: response.total,
    });
  } catch (error) {
    console.error("Error fetching featured facts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch featured facts",
      message: error.message,
    });
  }
};

/**
 * Get African proverbs
 * GET /api/african-proverbs
 */
const getAfricanProverbs = async (req, res) => {
  try {
    const { limit = 7 } = req.query;

    const response = await databases.listDocuments(
      DATABASE_ID,
      AFRICAN_PROVERBS_COLLECTION,
      [
        Query.equal("active", true),
        Query.orderDesc("sortOrder"),
        Query.limit(parseInt(limit)),
      ]
    );

    res.json({
      success: true,
      proverbs: response.documents.map((doc) => doc.proverb),
      proverbsData: response.documents,
      total: response.total,
    });
  } catch (error) {
    console.error("Error fetching proverbs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch proverbs",
      message: error.message,
    });
  }
};

/**
 * Get African statistics
 * GET /api/african-stats
 */
const getAfricanStats = async (req, res) => {
  try {
    // You can make these dynamic by counting from your database if needed
    const stats = {
      countries: 54,
      languages: 2000,
      ethnicGroups: 3000,
      naturalWonders: 7,
      musicalTraditions: 500,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch stats",
      message: error.message,
    });
  }
};

module.exports = {
  getAllAfricanFacts,
  getAfricanFactById,
  getAfricanFactsCategories,
  getFeaturedAfricanFacts,
  getAfricanProverbs,
  getAfricanStats,
};
