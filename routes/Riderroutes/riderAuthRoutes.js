// routes/riderAuthRoutes.js
const express = require("express");
const riderAuthController = require("../../controllers/RiderControler/riderAuthController");
const router = express.Router();
const riderAuthMiddleware = require("../../middleware/RiderMiddleware/riderAuthMiddleware");

// Public routes
router.post("/register", riderAuthController.registerRider);
router.post("/login", riderAuthController.loginRider);
router.post("/refresh", riderAuthController.handleRefreshToken);
router.post("/logout", riderAuthController.logoutRider);

// Protected route
router.get("/me", riderAuthMiddleware, riderAuthController.getCurrentRider);

module.exports = router;
