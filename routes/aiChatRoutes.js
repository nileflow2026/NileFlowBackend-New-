// routes/aiChatRoutes.js
const express = require("express");
const router = express.Router();
const {
  handleAiChat,
  healthCheck,
} = require("../controllers/aiChatController");

// Import middleware
const authenticateToken = require("../middleware/authMiddleware");
const { apiLimiter } = require("../middleware/rate-limiter");

// AI Chat endpoint with authentication and rate limiting
router.post(
  "/chat",
  authenticateToken, // Ensure user is authenticated
  apiLimiter, // Apply rate limiting
  handleAiChat // Main AI chat handler
);

// Health check endpoint for monitoring
router.get("/health", healthCheck);

module.exports = router;
