// controllers/subscriptionController.js
const { db, users } = require("../services/appwriteService");
const { env } = require("../src/env");
const { ID, Query } = require("node-appwrite");
const PaymentService = require("../services/paymentService");
const SubscriptionValidationService = require("../services/subscriptionValidation");
const SubscriptionMetrics = require("../services/subscriptionMetrics");
const logger = require("../utils/logger");

class SubscriptionController {
  /**
   * GET /api/subscription/status
   * Get current user's premium subscription status
   */
  static async getStatus(req, res) {
    try {
      const userId = req.user.userId || req.user.$id;

      // Fetch user from Appwrite
      const user = await users.get(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Parse premium data from user prefs or labels
      const isPremium = user.prefs?.isPremium || false;
      const subscriptionExpiresAt = user.prefs?.subscriptionExpiresAt || null;
      const subscriptionId = user.prefs?.subscriptionId || null;

      // Check if subscription is expired
      const now = new Date();
      const isExpired =
        subscriptionExpiresAt && new Date(subscriptionExpiresAt) < now;

      if (isExpired && isPremium) {
        // Expire the subscription
        await users.updatePrefs(userId, {
          ...user.prefs,
          isPremium: false,
        });

        logger.info(`Subscription expired for user ${userId}`);

        return res.json({
          isPremium: false,
          expiresAt: subscriptionExpiresAt,
          subscriptionId,
          expired: true,
        });
      }

      return res.json({
        isPremium,
        expiresAt: subscriptionExpiresAt,
        subscriptionId,
        expired: false,
      });
    } catch (error) {
      logger.error("Error fetching subscription status:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch subscription status" });
    }
  }

  /**
   * GET /api/subscription/payment-status/:checkoutRequestId
   * Check payment status for pending subscription
   */
  static async checkPaymentStatus(req, res) {
    try {
      const { checkoutRequestId } = req.params;
      const userId = req.user.userId || req.user.$id;

      if (!checkoutRequestId) {
        return res.status(400).json({ error: "Checkout request ID required" });
      }

      // Find subscription by checkoutRequestId
      if (env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        try {
          const subscriptions = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
            [
              Query.equal("checkoutRequestId", checkoutRequestId),
              Query.equal("userId", userId),
            ]
          );

          if (subscriptions.documents.length > 0) {
            const subscription = subscriptions.documents[0];
            return res.json({
              status: subscription.status,
              isPremium: subscription.status === "active",
              expiresAt: subscription.expiresAt,
              subscriptionId: subscription.subscriptionId,
            });
          } else {
            return res.status(404).json({ error: "Subscription not found" });
          }
        } catch (dbError) {
          logger.error("Error fetching payment status:", dbError);
          return res
            .status(500)
            .json({ error: "Failed to fetch payment status" });
        }
      }

      return res.status(404).json({ error: "Subscriptions not configured" });
    } catch (error) {
      logger.error("Error checking payment status:", error);
      return res.status(500).json({ error: "Failed to check payment status" });
    }
  }

  /**
   * POST /api/subscription/confirm-payment
   * Confirm Stripe payment and activate subscription after Payment Sheet success
   */
  static async confirmStripePayment(req, res) {
    try {
      const userId = req.user.userId || req.user.$id;
      const { paymentIntentId, subscriptionId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment Intent ID required" });
      }

      logger.info(
        `Confirming Stripe payment for user ${userId}, PaymentIntent: ${paymentIntentId}`
      );

      // Initialize Stripe to check payment status
      const Stripe = require("stripe");
      const stripe = new Stripe(require("../src/env").env.STRIPE_SECRET_KEY);

      // Retrieve the PaymentIntent to check its status
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (paymentIntent.status !== "succeeded") {
        logger.warn(
          `PaymentIntent ${paymentIntentId} status is ${paymentIntent.status}, not succeeded`
        );
        return res.status(400).json({
          error: "Payment not completed",
          status: paymentIntent.status,
        });
      }

      // Find the pending subscription
      if (env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        try {
          let subscriptions;

          if (subscriptionId) {
            // Search by subscriptionId if provided
            subscriptions = await db.listDocuments(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
              [
                Query.equal("subscriptionId", subscriptionId),
                Query.equal("userId", userId),
                Query.equal("status", "pending"),
                Query.limit(1),
              ]
            );
          } else {
            // Search by paymentIntentId (transactionId)
            subscriptions = await db.listDocuments(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
              [
                Query.equal("transactionId", paymentIntentId),
                Query.equal("userId", userId),
                Query.equal("status", "pending"),
                Query.limit(1),
              ]
            );
          }

          if (subscriptions.documents.length === 0) {
            return res
              .status(404)
              .json({ error: "Pending subscription not found" });
          }

          const subscription = subscriptions.documents[0];

          // Update subscription to active
          await db.updateDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
            subscription.$id,
            {
              status: "active",
              transactionId: paymentIntentId,
            }
          );

          // Get user and update premium status
          const user = await users.get(userId);

          // Update user prefs with premium status
          await users.updatePrefs(userId, {
            ...user.prefs,
            isPremium: true,
            subscriptionId: subscription.subscriptionId,
            subscriptionExpiresAt: subscription.expiresAt,
            subscriptionStartedAt: subscription.startedAt,
            subscriptionCancelledAt: null,
          });

          // Update user collection document attributes if exists
          if (env.APPWRITE_USER_COLLECTION_ID) {
            try {
              const userDocs = await db.listDocuments(
                env.APPWRITE_DATABASE_ID,
                env.APPWRITE_USER_COLLECTION_ID,
                [Query.equal("email", user.email)]
              );
              if (userDocs.documents.length > 0) {
                await db.updateDocument(
                  env.APPWRITE_DATABASE_ID,
                  env.APPWRITE_USER_COLLECTION_ID,
                  userDocs.documents[0].$id,
                  {
                    isPremium: true,
                    subscriptionId: subscription.subscriptionId,
                    startedAt: subscription.startedAt,
                    cancelledAt: null,
                  }
                );
              }
            } catch (docError) {
              logger.error("Error updating user document:", docError);
            }
          }

          logger.info(
            `✅ Stripe payment confirmed! User ${userId} premium activated until ${subscription.expiresAt}`
          );

          return res.json({
            success: true,
            message: "Premium subscription activated successfully!",
            isPremium: true,
            expiresAt: subscription.expiresAt,
            subscriptionId: subscription.subscriptionId,
          });
        } catch (dbError) {
          logger.error("Error confirming payment:", dbError);
          return res.status(500).json({ error: "Failed to confirm payment" });
        }
      }

      return res.status(500).json({ error: "Subscriptions not configured" });
    } catch (error) {
      logger.error("Error confirming Stripe payment:", error);
      return res.status(500).json({ error: "Failed to confirm payment" });
    }
  }

  /**
   * POST /api/subscription/subscribe
   * Subscribe user to premium
   */
  static async subscribe(req, res) {
    const transactionId = `TXN-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    try {
      // Record metrics
      SubscriptionMetrics.recordSubscriptionAttempt();

      const userId = req.user.userId || req.user.$id;
      const { paymentMethod, amount, currency, phoneNumber } = req.body;

      logger.info(
        `Subscription attempt - User: ${userId}, Method: ${paymentMethod}, TxnID: ${transactionId}`
      );

      // Validate request using validation service
      const validation =
        SubscriptionValidationService.validateSubscriptionRequest(req);
      if (!validation.valid) {
        logger.warn(`Validation failed for user ${userId}:`, validation.errors);
        SubscriptionMetrics.recordSubscriptionFailure();
        return res.status(400).json({
          error: "Validation failed",
          details: validation.errors,
        });
      }

      // Fetch user from Appwrite
      const user = await users.get(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user can subscribe
      const canSubscribeCheck =
        await SubscriptionValidationService.canSubscribe(user);
      if (!canSubscribeCheck.canSubscribe) {
        logger.info(
          `User ${userId} cannot subscribe: ${canSubscribeCheck.reason}`
        );
        SubscriptionMetrics.recordSubscriptionFailure();
        return res.status(400).json({
          error: canSubscribeCheck.reason,
          expiresAt: canSubscribeCheck.expiresAt,
        });
      }

      // Check for pending subscriptions to prevent duplicates
      const hasPending =
        await SubscriptionValidationService.hasPendingSubscription(userId);
      if (hasPending) {
        logger.warn(`User ${userId} already has a pending subscription`);
        SubscriptionMetrics.recordSubscriptionFailure();
        return res.status(400).json({
          error:
            "You already have a pending subscription. Please complete or cancel it first.",
        });
      }

      // Process payment
      let paymentResult;
      if (paymentMethod === "mpesa") {
        paymentResult = await PaymentService.processMpesaPayment({
          userId,
          phoneNumber,
          amount,
          description: "Nile Premium Subscription - 1 Month",
        });
      } else if (paymentMethod === "stripe") {
        // Check if this is a mobile client by checking user agent or a specific header
        const isMobile =
          req.headers["x-client-type"] === "mobile" ||
          req.headers["user-agent"]?.includes("Mobile");

        if (isMobile) {
          paymentResult = await PaymentService.processStripeMobilePayment({
            userId,
            amount,
            currency,
            description: "Nile Premium Subscription - 1 Month",
          });
        } else {
          paymentResult = await PaymentService.processStripePayment({
            userId,
            amount,
            currency,
            description: "Nile Premium Subscription - 1 Month",
          });
        }
      } /* else if (paymentMethod === "stripe") {
        paymentResult = await PaymentService.processStripePayment({
          userId,
          amount,
          currency,
          description: "Nile Premium Subscription - 1 Month",
        });
      } */

      if (!paymentResult.success) {
        return res.status(400).json({
          error: "Payment failed",
          message: paymentResult.message,
        });
      }

      // Calculate expiry date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Create PENDING subscription record - premium granted only after payment confirmation
      if (env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        try {
          await db.createDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
            ID.unique(),
            {
              userId,
              status: "pending",
              amount,
              currency,
              paymentMethod,
              expiresAt: expiresAt.toISOString(),
              startedAt: new Date().toISOString(),
              transactionId: paymentResult.transactionId,
              subscriptionId: paymentResult.subscriptionId,
              checkoutRequestId:
                paymentResult.paymentDetails?.checkoutRequestId,
            }
          );
          logger.info(
            `Pending subscription created for user ${userId}, waiting for payment confirmation`
          );
        } catch (dbError) {
          logger.error("Error creating subscription:", dbError);
          return res.status(500).json({
            error: "Failed to create subscription request",
          });
        }
      }

      // Return appropriate response based on payment method and activation status
      const responseMessage =
        paymentMethod === "mpesa"
          ? "Payment request sent to your phone. Please enter your M-Pesa PIN to confirm."
          : "Complete payment to activate premium.";

      const responseData = {
        success: true,
        status: "pending",
        checkoutRequestId: paymentResult.paymentDetails?.checkoutRequestId,
        message: responseMessage,
        paymentDetails: paymentResult.paymentDetails,
        transactionId: paymentResult.transactionId,
        subscriptionId: paymentResult.subscriptionId,
      };

      // Add checkout URL for Stripe
      if (
        paymentMethod === "stripe" &&
        paymentResult.paymentDetails?.checkoutUrl
      ) {
        responseData.checkoutUrl = paymentResult.paymentDetails.checkoutUrl;
      }

      return res.json(responseData);
    } catch (error) {
      logger.error("Error subscribing to premium:", error);
      return res.status(500).json({ error: "Failed to subscribe" });
    }
  }

  /**
   * POST /api/subscription/cancel
   * Cancel premium subscription (benefits remain until period end)
   */
  static async cancel(req, res) {
    try {
      const userId = req.user.userId || req.user.$id;

      const user = await users.get(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isPremium = user.prefs?.isPremium || false;

      if (!isPremium) {
        return res
          .status(400)
          .json({ error: "No active subscription to cancel" });
      }

      const subscriptionExpiresAt = user.prefs?.subscriptionExpiresAt;
      const cancelledAt = new Date().toISOString();

      // Mark as cancelled in user prefs (but keep benefits until expiry)
      await users.updatePrefs(userId, {
        ...user.prefs,
        subscriptionCancelledAt: cancelledAt,
      });

      // Also update user collection document
      if (env.APPWRITE_USER_COLLECTION_ID) {
        try {
          const userDocs = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_USER_COLLECTION_ID,
            [Query.equal("email", user.email)]
          );
          if (userDocs.documents.length > 0) {
            await db.updateDocument(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_USER_COLLECTION_ID,
              userDocs.documents[0].$id,
              { cancelledAt }
            );
          }
        } catch (dbError) {
          logger.error("Error updating user document on cancel:", dbError);
        }
      }

      // Update subscription record in database
      if (env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        try {
          const subscriptions = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
            [Query.equal("userId", userId), Query.equal("status", "active")]
          );

          if (subscriptions.documents.length > 0) {
            await db.updateDocument(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
              subscriptions.documents[0].$id,
              {
                status: "cancelled",
                cancelledAt: new Date().toISOString(),
              }
            );
          }
        } catch (dbError) {
          logger.error("Error updating subscription document:", dbError);
        }
      }

      logger.info(`User ${userId} cancelled subscription`);

      // TODO: Cancel auto-renewal with payment provider
      // await PaymentService.cancelRecurring(user.prefs.subscriptionId);

      return res.json({
        success: true,
        message: `Subscription cancelled. Benefits will remain active until ${new Date(
          subscriptionExpiresAt
        ).toLocaleDateString()}`,
        expiresAt: subscriptionExpiresAt,
      });
    } catch (error) {
      logger.error("Error cancelling subscription:", error);
      return res.status(500).json({ error: "Failed to cancel subscription" });
    }
  }

  /**
   * POST /api/subscription/renew
   * Renew expired or cancelled subscription
   */
  static async renew(req, res) {
    try {
      const userId = req.user.userId || req.user.$id;
      const { paymentMethod, amount, currency, phoneNumber } = req.body;

      // Validate amount
      if (amount !== 200 || currency !== "KSH") {
        return res.status(400).json({ error: "Invalid subscription amount" });
      }

      // Validate payment method
      if (!["mpesa", "stripe"].includes(paymentMethod)) {
        return res.status(400).json({ error: "Invalid payment method" });
      }

      // M-Pesa requires phone number
      if (paymentMethod === "mpesa" && !phoneNumber) {
        return res
          .status(400)
          .json({ error: "Phone number required for M-Pesa payment" });
      }

      const user = await users.get(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Process payment
      let paymentResult;
      if (paymentMethod === "mpesa") {
        paymentResult = await PaymentService.processMpesaPayment({
          userId,
          phoneNumber,
          amount,
          description: "Nile Premium Renewal - 1 Month",
        });
      } else if (paymentMethod === "stripe") {
        paymentResult = await PaymentService.processStripePayment({
          userId,
          amount,
          currency,
          description: "Nile Premium Renewal - 1 Month",
        });
      }

      if (!paymentResult.success) {
        return res.status(400).json({
          error: "Payment failed",
          message: paymentResult.message,
        });
      }

      // Calculate new expiry (30 days from now or from current expiry if still active)
      const now = new Date();
      const currentExpiry = user.prefs?.subscriptionExpiresAt
        ? new Date(user.prefs.subscriptionExpiresAt)
        : now;
      const baseDate = currentExpiry > now ? currentExpiry : now;

      const newExpiresAt = new Date(baseDate);
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);

      // Update user preferences
      await users.updatePrefs(userId, {
        ...user.prefs,
        isPremium: true,
        subscriptionExpiresAt: newExpiresAt.toISOString(),
        subscriptionCancelledAt: null,
        subscriptionId:
          paymentResult.subscriptionId ||
          user.prefs?.subscriptionId ||
          `sub_${Date.now()}`,
      });

      // Update or create subscription record
      if (env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        try {
          const subscriptions = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
            [Query.equal("userId", userId)]
          );

          if (subscriptions.documents.length > 0) {
            // Update existing
            await db.updateDocument(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
              subscriptions.documents[0].$id,
              {
                status: "active",
                expiresAt: newExpiresAt.toISOString(),
                cancelledAt: null,
                renewedAt: new Date().toISOString(),
              }
            );
          } else {
            // Create new
            await db.createDocument(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
              ID.unique(),
              {
                userId,
                status: "active",
                amount,
                currency,
                paymentMethod,
                expiresAt: newExpiresAt.toISOString(),
                startedAt: new Date().toISOString(),
                transactionId: paymentResult.transactionId,
              }
            );
          }
        } catch (dbError) {
          logger.error("Error updating subscription document:", dbError);
        }
      }

      logger.info(`User ${userId} renewed subscription until ${newExpiresAt}`);

      return res.json({
        success: true,
        subscriptionId: paymentResult.subscriptionId,
        expiresAt: newExpiresAt.toISOString(),
        message: "Subscription renewed successfully",
      });
    } catch (error) {
      logger.error("Error renewing subscription:", error);
      return res.status(500).json({ error: "Failed to renew subscription" });
    }
  }

  /**
   * GET /api/subscription/monthly-summary
   * Get monthly savings breakdown for premium users
   */
  static async getMonthlySummary(req, res) {
    try {
      const userId = req.user.userId || req.user.$id;
      const {
        getMonthlySavingsSummary,
        checkUserPremiumStatus,
      } = require("../services/premiumOrderTrackingService");

      // First check if user is premium
      const premiumStatus = await checkUserPremiumStatus(userId);

      if (!premiumStatus.isPremium) {
        return res.status(403).json({
          error: "Premium subscription required",
          isPremium: false,
          totalSavings: 0,
          deliverySavings: 0,
          discountSavings: 0,
          milesBonus: 0,
          milesBonusValue: 0,
          exclusiveDeals: 0,
          ordersCount: 0,
          subscriptionCost: 200,
          netSavings: -200,
        });
      }

      // Get monthly savings using the premium order tracking service
      const summary = await getMonthlySavingsSummary(userId);

      if (summary.error) {
        logger.error("Error in monthly summary:", summary.error);
        return res.status(500).json({
          error: "Failed to calculate monthly summary",
          isPremium: true,
          totalSavings: 0,
          deliverySavings: 0,
          discountSavings: 0,
          milesBonus: 0,
          milesBonusValue: 0,
          exclusiveDeals: 0,
          ordersCount: 0,
          subscriptionCost: 200,
          netSavings: -200,
        });
      }

      return res.json(summary);
    } catch (error) {
      logger.error("Error getting monthly summary:", error);
      return res.status(500).json({ error: "Failed to get monthly summary" });
    }
  }

  /**
   * GET /api/subscription/premium-deals
   * Get products with premium-only discounts
   */
  static async getPremiumDeals(req, res) {
    try {
      const userId = req.user.userId || req.user.$id;
      const user = await users.get(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isPremium = user.prefs?.isPremium || false;

      if (!isPremium) {
        return res.status(403).json({ error: "Premium subscription required" });
      }

      // Get products marked as premium deals
      let premiumDeals = [];
      if (env.APPWRITE_PRODUCT_COLLECTION_ID) {
        try {
          // Try boolean true first
          const dealsResponse = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_PRODUCT_COLLECTION_ID,
            [
              Query.equal("premiumDeal", true),
              Query.equal("isActive", true),
              Query.greaterThan("stock", 0),
              Query.limit(50),
              Query.orderDesc("$createdAt"),
            ]
          );

          premiumDeals = dealsResponse.documents;

          // If no results with boolean, try string "true"
          if (premiumDeals.length === 0) {
            const stringDealsResponse = await db.listDocuments(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_PRODUCT_COLLECTION_ID,
              [
                Query.equal("premiumDeal", "true"),
                Query.equal("isActive", true),
                Query.greaterThan("stock", 0),
                Query.limit(50),
                Query.orderDesc("$createdAt"),
              ]
            );
            premiumDeals = stringDealsResponse.documents;
          }
        } catch (dbError) {
          logger.error("Error fetching premium deals:", dbError);
          return res
            .status(500)
            .json({ error: "Failed to fetch premium deals" });
        }
      } else {
        logger.error("APPWRITE_PRODUCT_COLLECTION_ID not configured");
        return res
          .status(500)
          .json({ error: "Products collection not configured" });
      }

      return res.json(premiumDeals);
    } catch (error) {
      logger.error("Error fetching premium deals:", error);
      return res.status(500).json({ error: "Failed to fetch premium deals" });
    }
  }
}

module.exports = SubscriptionController;
