// middleware/requirePremium.js
const { users } = require("../services/appwriteService");
const logger = require("../utils/logger");

/**
 * Middleware to ensure user has active premium subscription
 * Usage: router.get('/premium-feature', authenticate, requirePremium, controller.action);
 */
const requirePremium = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.$id;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Please log in to access this feature",
      });
    }

    // Fetch user from Appwrite
    const user = await users.get(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check premium status from user preferences
    const isPremium = user.prefs?.isPremium || false;
    const subscriptionExpiresAt = user.prefs?.subscriptionExpiresAt;

    // Check if subscription expired
    const now = new Date();
    const isExpired =
      subscriptionExpiresAt && new Date(subscriptionExpiresAt) < now;

    if (isExpired && isPremium) {
      // Auto-expire the subscription
      try {
        await users.updatePrefs(userId, {
          ...user.prefs,
          isPremium: false,
        });
        logger.info(`Auto-expired subscription for user ${userId}`);
      } catch (updateError) {
        logger.error("Error auto-expiring subscription:", updateError);
      }

      return res.status(403).json({
        error: "Premium subscription expired",
        message:
          "Your Nile Premium subscription has expired. Please renew to access this feature.",
        expired: true,
        expiresAt: subscriptionExpiresAt,
      });
    }

    if (!isPremium) {
      return res.status(403).json({
        error: "Premium subscription required",
        message:
          "This feature is only available to Nile Premium members. Subscribe now for just 200 KSH/month!",
        subscriptionUrl: "/subscription/subscribe",
      });
    }

    // Attach premium status to request for downstream use
    req.isPremium = true;
    req.subscriptionExpiresAt = subscriptionExpiresAt;

    next();
  } catch (error) {
    logger.error("Error checking premium status:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to verify premium status",
    });
  }
};

/**
 * Optional middleware to check premium status without blocking
 * Adds isPremium flag to request but allows non-premium users through
 * Usage: router.get('/feature', authenticate, checkPremiumStatus, controller.action);
 */
const checkPremiumStatus = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.$id;

    if (!userId) {
      req.isPremium = false;
      return next();
    }

    const user = await users.get(userId);

    if (!user) {
      req.isPremium = false;
      return next();
    }

    const isPremium = user.prefs?.isPremium || false;
    const subscriptionExpiresAt = user.prefs?.subscriptionExpiresAt;

    // Check if expired
    const now = new Date();
    const isExpired =
      subscriptionExpiresAt && new Date(subscriptionExpiresAt) < now;

    if (isExpired && isPremium) {
      req.isPremium = false;
      req.premiumExpired = true;
    } else {
      req.isPremium = isPremium;
      req.premiumExpired = false;
    }

    req.subscriptionExpiresAt = subscriptionExpiresAt;

    next();
  } catch (error) {
    logger.error("Error checking premium status (non-blocking):", error);
    req.isPremium = false;
    next();
  }
};

module.exports = {
  requirePremium,
  checkPremiumStatus,
};
