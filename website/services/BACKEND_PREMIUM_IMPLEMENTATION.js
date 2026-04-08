/**
 * BACKEND IMPLEMENTATION EXAMPLES
 *
 * Node.js/Express implementation examples for Premium Subscription endpoints
 * Adapt these to your specific backend framework and payment provider
 */

// ============================================================================
// EXAMPLE: Express Router Setup
// ============================================================================

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth"); // Your auth middleware
const SubscriptionController = require("../controllers/subscriptionController");

// All routes require authentication
router.use(authenticate);

// Get current user's subscription status
router.get("/status", SubscriptionController.getStatus);

// Subscribe to premium
router.post("/subscribe", SubscriptionController.subscribe);

// Cancel subscription
router.post("/cancel", SubscriptionController.cancel);

// Renew subscription
router.post("/renew", SubscriptionController.renew);

// Get monthly savings summary
router.get("/monthly-summary", SubscriptionController.getMonthlySummary);

// Get premium-only deals
router.get("/premium-deals", SubscriptionController.getPremiumDeals);

module.exports = router;

// ============================================================================
// EXAMPLE: Subscription Controller
// ============================================================================

const User = require("../models/User");
const Subscription = require("../models/Subscription");
const PaymentService = require("../services/paymentService");

class SubscriptionController {
  /**
   * GET /api/subscription/status
   * Get current user's premium status
   */
  static async getStatus(req, res) {
    try {
      const userId = req.user.id; // From auth middleware
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if subscription is expired
      const now = new Date();
      const isExpired =
        user.subscriptionExpiresAt &&
        new Date(user.subscriptionExpiresAt) < now;

      if (isExpired && user.isPremium) {
        // Expire the subscription
        user.isPremium = false;
        await user.save();
      }

      return res.json({
        isPremium: user.isPremium,
        expiresAt: user.subscriptionExpiresAt,
        subscriptionId: user.subscriptionId,
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch subscription status" });
    }
  }

  /**
   * POST /api/subscription/subscribe
   * Subscribe user to premium
   */
  static async subscribe(req, res) {
    try {
      const userId = req.user.id;
      const { paymentMethod, amount, currency } = req.body;

      // Validate amount (should be 200 KSH)
      if (amount !== 200 || currency !== "KSH") {
        return res.status(400).json({ error: "Invalid subscription amount" });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if already premium
      if (user.isPremium && new Date(user.subscriptionExpiresAt) > new Date()) {
        return res.status(400).json({
          error: "Already subscribed to premium",
          expiresAt: user.subscriptionExpiresAt,
        });
      }

      // Process payment
      let paymentResult;
      if (paymentMethod === "nile-pay") {
        paymentResult = await PaymentService.processNilePayment({
          userId,
          amount,
          currency,
          description: "Nile Premium Subscription - 1 Month",
        });
      } else if (paymentMethod === "paypal") {
        paymentResult = await PaymentService.processPayPalPayment({
          userId,
          amount,
          currency,
          description: "Nile Premium Subscription - 1 Month",
        });
      } else {
        return res.status(400).json({ error: "Invalid payment method" });
      }

      if (!paymentResult.success) {
        return res.status(400).json({
          error: "Payment failed",
          message: paymentResult.message,
        });
      }

      // Calculate expiry date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Update user
      user.isPremium = true;
      user.subscriptionId = paymentResult.subscriptionId || `sub_${Date.now()}`;
      user.subscriptionExpiresAt = expiresAt;
      user.subscriptionStartedAt = new Date();
      user.subscriptionCancelledAt = null;
      await user.save();

      // Create subscription record
      const subscription = new Subscription({
        userId,
        status: "active",
        amount,
        currency,
        paymentMethod,
        expiresAt,
        startDate: new Date(),
      });
      await subscription.save();

      // Send confirmation email/notification
      // await NotificationService.sendPremiumWelcome(user);

      return res.json({
        success: true,
        subscriptionId: user.subscriptionId,
        expiresAt: user.subscriptionExpiresAt,
        message: "Successfully subscribed to Nile Premium",
      });
    } catch (error) {
      console.error("Error subscribing to premium:", error);
      return res.status(500).json({ error: "Failed to subscribe" });
    }
  }

  /**
   * POST /api/subscription/cancel
   * Cancel premium subscription (benefits remain until period end)
   */
  static async cancel(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.isPremium) {
        return res
          .status(400)
          .json({ error: "No active subscription to cancel" });
      }

      // Mark as cancelled (but keep benefits until expiry)
      user.subscriptionCancelledAt = new Date();
      await user.save();

      // Update subscription record
      await Subscription.findOneAndUpdate(
        { userId, status: "active" },
        {
          status: "cancelled",
          cancelledAt: new Date(),
        }
      );

      // Cancel auto-renewal with payment provider
      // await PaymentService.cancelRecurring(user.subscriptionId);

      return res.json({
        success: true,
        message: `Subscription cancelled. Benefits will remain active until ${new Date(
          user.subscriptionExpiresAt
        ).toLocaleDateString()}`,
        expiresAt: user.subscriptionExpiresAt,
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return res.status(500).json({ error: "Failed to cancel subscription" });
    }
  }

  /**
   * POST /api/subscription/renew
   * Renew expired or cancelled subscription
   */
  static async renew(req, res) {
    try {
      const userId = req.user.id;
      const { paymentMethod, amount, currency } = req.body;

      // Validate
      if (amount !== 200 || currency !== "KSH") {
        return res.status(400).json({ error: "Invalid subscription amount" });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Process payment
      const paymentResult =
        paymentMethod === "nile-pay"
          ? await PaymentService.processNilePayment({
              userId,
              amount,
              currency,
              description: "Nile Premium Renewal - 1 Month",
            })
          : await PaymentService.processPayPalPayment({
              userId,
              amount,
              currency,
              description: "Nile Premium Renewal - 1 Month",
            });

      if (!paymentResult.success) {
        return res.status(400).json({ error: "Payment failed" });
      }

      // Calculate new expiry (30 days from now or from current expiry if still active)
      const now = new Date();
      const currentExpiry = user.subscriptionExpiresAt
        ? new Date(user.subscriptionExpiresAt)
        : now;
      const baseDate = currentExpiry > now ? currentExpiry : now;

      const newExpiresAt = new Date(baseDate);
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);

      // Update user
      user.isPremium = true;
      user.subscriptionExpiresAt = newExpiresAt;
      user.subscriptionCancelledAt = null;
      await user.save();

      // Update or create subscription record
      await Subscription.findOneAndUpdate(
        { userId, status: { $in: ["cancelled", "expired"] } },
        {
          status: "active",
          expiresAt: newExpiresAt,
          cancelledAt: null,
          updatedAt: new Date(),
        },
        { upsert: true }
      );

      return res.json({
        success: true,
        subscriptionId: user.subscriptionId,
        expiresAt: user.subscriptionExpiresAt,
        message: "Subscription renewed successfully",
      });
    } catch (error) {
      console.error("Error renewing subscription:", error);
      return res.status(500).json({ error: "Failed to renew subscription" });
    }
  }

  /**
   * GET /api/subscription/monthly-summary
   * Get monthly savings breakdown for premium users
   */
  static async getMonthlySummary(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user || !user.isPremium) {
        return res.status(403).json({ error: "Premium subscription required" });
      }

      // Get current month's orders
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const orders = await Order.find({
        userId,
        createdAt: { $gte: startOfMonth },
        status: { $in: ["completed", "shipped", "delivered"] },
      });

      // Calculate savings
      let deliverySavings = 0;
      let milesBonus = 0;
      let exclusiveDeals = 0;

      for (const order of orders) {
        // Delivery savings (assume standard shipping is 150 KSH)
        deliverySavings += 150;

        // Miles bonus (premium gets 2x, so bonus is the base miles)
        const baseMiles = Math.floor(order.total / 10);
        milesBonus += baseMiles; // The bonus miles earned

        // Exclusive deals savings
        if (order.premiumDiscount) {
          exclusiveDeals += order.premiumDiscount;
        }
      }

      const totalSavings = deliverySavings + milesBonus * 0.1 + exclusiveDeals; // Convert miles to KSH value
      const subscriptionCost = 200;

      return res.json({
        totalSavings: Math.round(totalSavings),
        deliverySavings,
        milesBonus,
        exclusiveDeals,
        subscriptionCost,
        netSavings: Math.round(totalSavings - subscriptionCost),
      });
    } catch (error) {
      console.error("Error fetching monthly summary:", error);
      return res.status(500).json({ error: "Failed to fetch monthly summary" });
    }
  }

  /**
   * GET /api/subscription/premium-deals
   * Get products with premium-only discounts
   */
  static async getPremiumDeals(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user || !user.isPremium) {
        return res.status(403).json({ error: "Premium subscription required" });
      }

      // Get products marked as premium deals
      const premiumDeals = await Product.find({
        premiumDeal: true,
        isActive: true,
        stock: { $gt: 0 },
      })
        .select(
          "name price premiumPrice image description category premiumEligible"
        )
        .limit(50)
        .sort({ createdAt: -1 });

      return res.json(premiumDeals);
    } catch (error) {
      console.error("Error fetching premium deals:", error);
      return res.status(500).json({ error: "Failed to fetch premium deals" });
    }
  }
}

module.exports = SubscriptionController;

// ============================================================================
// EXAMPLE: Payment Service (Mock Implementation)
// ============================================================================

class PaymentService {
  /**
   * Process payment via Nile Pay
   */
  static async processNilePayment({ userId, amount, currency, description }) {
    try {
      // TODO: Integrate with actual Nile Pay API
      // This is a mock implementation

      console.log("Processing Nile Pay payment:", {
        userId,
        amount,
        currency,
        description,
      });

      // In production, call your payment gateway:
      // const response = await axios.post('https://api.nilepay.com/charge', {
      //   userId,
      //   amount,
      //   currency,
      //   description
      // });

      // Mock success response
      return {
        success: true,
        subscriptionId: `sub_nilepay_${Date.now()}`,
        transactionId: `txn_${Date.now()}`,
        message: "Payment successful",
      };
    } catch (error) {
      console.error("Nile Pay payment error:", error);
      return {
        success: false,
        message: error.message || "Payment failed",
      };
    }
  }

  /**
   * Process payment via PayPal
   */
  static async processPayPalPayment({ userId, amount, currency, description }) {
    try {
      // TODO: Integrate with PayPal API
      // This is a mock implementation

      console.log("Processing PayPal payment:", {
        userId,
        amount,
        currency,
        description,
      });

      // In production, use PayPal SDK:
      // const paypal = require('@paypal/checkout-server-sdk');
      // ... PayPal implementation

      // Mock success response
      return {
        success: true,
        subscriptionId: `sub_paypal_${Date.now()}`,
        transactionId: `txn_${Date.now()}`,
        message: "Payment successful",
      };
    } catch (error) {
      console.error("PayPal payment error:", error);
      return {
        success: false,
        message: error.message || "Payment failed",
      };
    }
  }

  /**
   * Cancel recurring payment
   */
  static async cancelRecurring(subscriptionId) {
    try {
      // TODO: Cancel recurring billing with payment provider
      console.log("Cancelling recurring payment for:", subscriptionId);

      return { success: true };
    } catch (error) {
      console.error("Error cancelling recurring payment:", error);
      return { success: false };
    }
  }
}

module.exports = PaymentService;

// ============================================================================
// EXAMPLE: Cron Job for Expiring Subscriptions
// ============================================================================

const cron = require("node-cron");

/**
 * Run daily to expire subscriptions
 * Schedule: Every day at 00:00 (midnight)
 */
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running subscription expiry check...");

    const now = new Date();

    // Find expired subscriptions
    const expiredUsers = await User.find({
      isPremium: true,
      subscriptionExpiresAt: { $lt: now },
    });

    console.log(`Found ${expiredUsers.length} expired subscriptions`);

    // Expire them
    for (const user of expiredUsers) {
      user.isPremium = false;
      await user.save();

      // Update subscription record
      await Subscription.findOneAndUpdate(
        { userId: user._id, status: "active" },
        { status: "expired" }
      );

      // Send notification
      // await NotificationService.sendSubscriptionExpired(user);

      console.log(`Expired subscription for user ${user._id}`);
    }

    console.log("Subscription expiry check completed");
  } catch (error) {
    console.error("Error in subscription expiry cron:", error);
  }
});

// ============================================================================
// EXAMPLE: Middleware to Check Premium Status
// ============================================================================

/**
 * Middleware to ensure user has active premium subscription
 */
const requirePremium = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if subscription expired
    const now = new Date();
    const isExpired =
      user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < now;

    if (!user.isPremium || isExpired) {
      return res.status(403).json({
        error: "Premium subscription required",
        message: "This feature is only available to Nile Premium members",
      });
    }

    // Attach premium status to request
    req.isPremium = true;
    next();
  } catch (error) {
    console.error("Error checking premium status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Usage:
// router.get('/premium-deals', authenticate, requirePremium, SubscriptionController.getPremiumDeals);

module.exports = { requirePremium };
