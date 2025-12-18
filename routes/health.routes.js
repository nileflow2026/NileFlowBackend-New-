// routes/health.routes.js
const express = require("express");
const AppwriteSessionService = require("../services/AppwriteSessionService");
const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "auth-service",
  });
});

router.get("/health/appwrite", async (req, res) => {
  try {
    await AppwriteSessionService.ensureConnected();
    const users = await AppwriteSessionService.getUsers();
    const userCount = await users.list([], 1);

    res.json({
      status: "connected",
      appwrite: "healthy",
      users: userCount.total,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      appwrite: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
