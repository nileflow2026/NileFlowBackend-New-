const express = require("express");
const router = express.Router();
const {
  getAllAfricanFacts,
  getAfricanFactById,
  getAfricanFactsCategories,
  getFeaturedAfricanFacts,
  getAfricanProverbs,
  getAfricanStats,
} = require("../controllers/FeatuersControllers/africanFactsController");

/**
 * GET /api/african-facts
 * Get all African facts with optional filtering
 */
router.get("/african-facts", getAllAfricanFacts);

/**
 * GET /api/african-facts/meta/categories
 * Get all available categories
 */
router.get("/african-facts/meta/categories", getAfricanFactsCategories);

/**
 * GET /api/african-facts/featured
 * Get featured African facts
 */
router.get("/african-facts/featured", getFeaturedAfricanFacts);

/**
 * GET /api/african-facts/:id
 * Get single African fact by ID
 */
router.get("/african-facts/:id", getAfricanFactById);

/**
 * GET /api/african-proverbs
 * Get African proverbs
 */
router.get("/african-proverbs", getAfricanProverbs);

/**
 * GET /api/african-stats
 * Get African statistics
 */
router.get("/african-stats", getAfricanStats);

module.exports = router;
