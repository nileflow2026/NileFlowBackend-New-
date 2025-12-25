const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { checkPremiumStatus } = require("../middleware/premiumMiddleware");
const PremiumBenefitsService = require("../services/premiumBenefitsService");
const logger = require("../utils/logger");

/**
 * GET /api/premium/deals
 * Get exclusive deals for premium users
 */
router.get("/deals", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.$id;
    const deals = await PremiumBenefitsService.getPremiumDeals(userId);

    if (deals.error) {
      return res
        .status(deals.isPremium ? 500 : 403)
        .json({ error: deals.error });
    }

    return res.json(deals);
  } catch (error) {
    logger.error("Error fetching premium deals:", error);
    return res.status(500).json({ error: "Failed to fetch premium deals" });
  }
});

/**
 * GET /api/premium/benefits-info
 * Get premium benefits information for user
 */
router.get("/benefits-info", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.$id;

    // Check premium status
    const statusCheck = await PremiumBenefitsService.checkFreeDelivery(userId);

    if (!statusCheck.isPremium) {
      return res.json({
        isPremium: false,
        benefits: {
          nilesMultiplier: "2x",
          freeDelivery: "Available for premium users",
          exclusiveDeals: "Up to 15% off",
          monthlySavings: "Calculated based on your orders",
        },
      });
    }

    return res.json({
      isPremium: true,
      freeDeliveryMinimum: statusCheck.freeDeliveryMinimum,
      standardDeliveryMinimum: statusCheck.standardDeliveryMinimum,
      benefits: {
        nilesMultiplier: "2x (currently active)",
        freeDelivery: "Active on all orders",
        exclusiveDeals: "Access to premium-only products",
        monthlySavings: "Track your savings in monthly summary",
      },
    });
  } catch (error) {
    logger.error("Error fetching premium benefits info:", error);
    return res.status(500).json({ error: "Failed to fetch benefits info" });
  }
});

/**
 * POST /api/premium/calculate-discount
 * Calculate discount for a specific order total
 */
router.post("/calculate-discount", authenticateToken, async (req, res) => {
  try {
    const { orderTotal } = req.body;
    const userId = req.user.userId || req.user.$id;

    if (!orderTotal || orderTotal <= 0) {
      return res.status(400).json({ error: "Valid order total required" });
    }

    const discount = await PremiumBenefitsService.applyPremiumDiscount(
      userId,
      orderTotal
    );

    if (discount.error) {
      return res
        .status(discount.isPremium ? 500 : 403)
        .json({ error: discount.error });
    }

    return res.json({
      originalTotal: orderTotal,
      discountAmount: discount.discountAmount,
      discountPercentage: discount.discountPercentage,
      newTotal: discount.newTotal,
      savings: discount.discountAmount,
    });
  } catch (error) {
    logger.error("Error calculating premium discount:", error);
    return res.status(500).json({ error: "Failed to calculate discount" });
  }
});

/**
 * POST /api/premium/calculate-miles
 * Calculate Nile Miles for a specific order total
 */
router.post("/calculate-miles", authenticateToken, async (req, res) => {
  try {
    const { orderTotal } = req.body;
    const userId = req.user.userId || req.user.$id;

    if (!orderTotal || orderTotal <= 0) {
      return res.status(400).json({ error: "Valid order total required" });
    }

    const baseMiles = Math.floor(orderTotal / 10);
    const milesResult = await PremiumBenefitsService.awardNileMiles(
      userId,
      baseMiles
    );

    if (milesResult.error) {
      return res
        .status(milesResult.isPremium ? 500 : 403)
        .json({ error: milesResult.error });
    }

    return res.json({
      orderTotal,
      baseMiles,
      actualMiles: milesResult.milesAwarded,
      multiplier: milesResult.isPremium ? "2x" : "1x",
      bonus: milesResult.isPremium ? baseMiles : 0,
    });
  } catch (error) {
    logger.error("Error calculating Nile Miles:", error);
    return res.status(500).json({ error: "Failed to calculate miles" });
  }
});

module.exports = router;
