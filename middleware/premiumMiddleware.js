// middleware/premiumMiddleware.js
const { users } = require("../services/appwriteService");
const PremiumBenefitsService = require("../services/premiumBenefitsService");
const logger = require("../utils/logger");

/**
 * Middleware to add premium benefits to order processing
 * Apply this to order creation routes
 */
const applyPremiumBenefits = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.$id;
    const { cart, total } = req.body;

    if (!userId || !cart || !total) {
      return next(); // Skip if missing required data
    }

    // Apply premium discount
    const discountResult = await PremiumBenefitsService.applyPremiumDiscount(
      userId,
      cart,
      total
    );

    // Check delivery eligibility
    const deliveryResult = await PremiumBenefitsService.checkFreeDelivery(
      userId,
      total
    );

    // Add premium benefits to request for order processing
    req.premiumBenefits = {
      discount: discountResult,
      delivery: deliveryResult,
      isPremium: discountResult.isPremium,
    };

    // Update total if discount applied
    if (discountResult.discount > 0) {
      req.body.premiumDiscount = discountResult.discount;
      req.body.originalTotal = total;
      req.body.total = total - discountResult.discount;
    }

    // Update delivery fee
    req.body.deliveryFee = deliveryResult.deliveryFee;
    req.body.finalTotal =
      (req.body.total || total) + deliveryResult.deliveryFee;

    logger.info(`Premium benefits applied for user ${userId}:`, {
      discount: discountResult.discount,
      deliveryFee: deliveryResult.deliveryFee,
      isPremium: discountResult.isPremium,
    });

    next();
  } catch (error) {
    logger.error("Error applying premium benefits:", error);
    // Don't fail the request, just proceed without premium benefits
    next();
  }
};

/**
 * Middleware to award Nile Miles after successful order
 * Apply this after order is confirmed/paid
 */
const awardNileMiles = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.$id;
    const orderId = req.orderId || req.body.orderId;
    const orderTotal = req.body.total || req.body.originalTotal;

    if (!userId || !orderId || !orderTotal) {
      logger.warn("Missing data for Nile Miles award:", {
        userId,
        orderId,
        orderTotal,
      });
      return next();
    }

    // Award miles in background (don't block response)
    PremiumBenefitsService.awardNileMiles(userId, orderTotal, orderId)
      .then((result) => {
        if (result.success) {
          logger.info(
            `Awarded ${result.milesAwarded} miles to user ${userId} (bonus: ${result.bonusMiles})`
          );
        } else {
          logger.error("Failed to award Nile Miles:", result.error);
        }
      })
      .catch((error) => {
        logger.error("Error in background miles award:", error);
      });

    next();
  } catch (error) {
    logger.error("Error in Nile Miles middleware:", error);
    next(); // Don't block the response
  }
};

/**
 * Middleware to check premium status and add to request
 */
const checkPremiumStatus = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.$id;

    if (!userId) {
      return next();
    }

    const user = await users.get(userId);
    const isPremium = user.prefs?.isPremium || false;
    const subscriptionExpiresAt = user.prefs?.subscriptionExpiresAt;

    // Check if subscription is expired
    let isExpired = false;
    if (subscriptionExpiresAt) {
      isExpired = new Date(subscriptionExpiresAt) < new Date();
    }

    req.premiumStatus = {
      isPremium: isPremium && !isExpired,
      subscriptionExpiresAt,
      isExpired,
      user,
    };

    next();
  } catch (error) {
    logger.error("Error checking premium status:", error);
    req.premiumStatus = {
      isPremium: false,
      isExpired: true,
    };
    next();
  }
};

module.exports = {
  applyPremiumBenefits,
  awardNileMiles,
  checkPremiumStatus,
};
