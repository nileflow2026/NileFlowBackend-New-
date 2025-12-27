const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const {
  getAdminProfile,
  getUsers,
} = require("../controllers/AdminControllers/userController");
const {
  getAuditLogs,
} = require("../controllers/AdminControllers/auditLoggerController");
const { users } = require("../src/appwrite");

const defaultPreferences = {
  preferredPaymentMethod: "Credit Card",
  preferredShippingMethod: "Standard Shipping",
  emailNotifications: true,
  smsNotifications: true,
  marketingEmails: false,
  orderNotifications: true,
  promotionalNotifications: false,
  currency: "KSh",
  language: "en",
  timezone: "Africa/Nairobi",
  theme: "light",
};

// Protected route
router.get("/admin/profile", authenticateToken, getAdminProfile);
router.get("/audit-logs", authenticateToken, getAuditLogs);
router.get("/users", authenticateToken, getUsers);
router.get(
  "/users/:userId/preferences",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Validate userId
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      // Appwrite Users API Implementation
      try {
        // Get user preferences using Appwrite Users API
        const userPreferences = await users.getPrefs(userId);

        // If no preferences exist, return defaults
        const preferences =
          Object.keys(userPreferences).length === 0
            ? defaultPreferences
            : { ...defaultPreferences, ...userPreferences };

        console.log(`Fetching preferences for user: ${userId}`);

        res.status(200).json({
          success: true,
          preferences: preferences,
          message: "User preferences retrieved successfully",
        });
      } catch (appwriteError) {
        console.error("Appwrite Users API error:", appwriteError);

        if (appwriteError.code === 404) {
          return res.status(404).json({
            success: false,
            error: "User not found",
            message: "The specified user does not exist",
          });
        }

        throw appwriteError;
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user preferences",
        message: error.message,
      });
    }
  }
);
/**
 * PUT /api/users/:userId/preferences
 * Update all user preferences using Appwrite Users API
 */
router.put(
  "/users/:userId/preferences",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { preferences } = req.body;

      // Validate input
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      if (!preferences || typeof preferences !== "object") {
        return res.status(400).json({
          success: false,
          error: "Valid preferences object is required",
        });
      }

      // Appwrite Users API Implementation
      try {
        // Update user preferences using Appwrite Users API
        const updatedPreferences = await users.updatePrefs(userId, preferences);

        console.log("Updated preferences for user:", userId);

        res.status(200).json({
          success: true,
          preferences: updatedPreferences,
          message: "User preferences updated successfully",
        });
      } catch (appwriteError) {
        console.error("Appwrite Users API error:", appwriteError);

        if (appwriteError.code === 404) {
          return res.status(404).json({
            success: false,
            error: "User not found",
            message: "The specified user does not exist",
          });
        }

        throw appwriteError;
      }
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user preferences",
        message: error.message,
      });
    }
  }
);

/**
 * PATCH /api/users/:userId/preferences
 * Partially update user preferences using Appwrite Users API
 */
router.patch(
  "/api/users/:userId/preferences",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      // Appwrite Users API Implementation
      try {
        // Get current preferences first
        const currentPreferences = await users.getPrefs(userId);

        // Merge with updates
        const updatedPreferences = await users.updatePrefs(userId, {
          ...currentPreferences,
          ...updates,
        });

        console.log(
          `Partially updated preferences for user: ${userId}`,
          updates
        );

        res.status(200).json({
          success: true,
          preferences: updatedPreferences,
          message: "User preferences partially updated successfully",
        });
      } catch (appwriteError) {
        console.error("Appwrite Users API error:", appwriteError);

        if (appwriteError.code === 404) {
          return res.status(404).json({
            success: false,
            error: "User not found",
            message: "The specified user does not exist",
          });
        }

        throw appwriteError;
      }
    } catch (error) {
      console.error("Error partially updating user preferences:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user preferences",
        message: error.message,
      });
    }
  }
);

module.exports = router;
