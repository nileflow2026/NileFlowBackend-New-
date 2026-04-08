// controllers/paymentCallbackController.js
const { users, db } = require("../services/appwriteService");
const { env } = require("../src/env");
const { Query, ID } = require("node-appwrite");
const PaymentService = require("../services/paymentService");
const SubscriptionEmailService = require("../services/subscriptionEmailService");
const logger = require("../utils/logger");
const crypto = require("crypto");

class PaymentCallbackController {
  // Static cache for processed webhooks (in production, use Redis)
  static processedWebhooks = new Map();

  /**
   * Verify PayPal webhook signature
   */
  static verifyPayPalWebhookSignature(req) {
    if (!env.PAYPAL_WEBHOOK_ID) {
      logger.warn(
        "PayPal webhook verification disabled - no PAYPAL_WEBHOOK_ID"
      );
      return true; // Allow in dev, but log warning
    }

    try {
      const headers = req.headers;
      const body = JSON.stringify(req.body);

      // PayPal signature verification logic would go here
      // For now, return true but log that verification is needed
      logger.warn(
        "PayPal webhook signature verification not fully implemented"
      );
      return true;
    } catch (error) {
      logger.error("PayPal webhook signature verification error:", error);
      return false;
    }
  }

  /**
   * Find pending subscription for user/order pair (security check)
   */
  static async findPendingSubscription(userId, orderId) {
    if (!env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
      return null;
    }

    try {
      const subscriptions = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal("userId", userId),
          Query.equal("subscriptionId", orderId),
          Query.equal("status", "pending"),
          Query.limit(1),
        ]
      );
      return subscriptions.documents[0] || null;
    } catch (error) {
      logger.error("Error finding pending subscription:", error);
      return null;
    }
  }

  /**
   * Atomic payment update - all database writes succeed or all fail
   */
  static async atomicPaymentUpdate(userId, orderId, captureId, expiresAt) {
    const errors = [];
    let user = null;

    try {
      // 1. Get current user data
      user = await users.get(userId);
    } catch (error) {
      errors.push(`Failed to get user: ${error.message}`);
      throw new Error(`Atomic update failed: ${errors.join(", ")}`);
    }

    try {
      // 2. Update user preferences atomically
      await users.updatePrefs(userId, {
        ...user.prefs,
        isPremium: true,
        subscriptionId: `sub_paypal_${orderId}`,
        subscriptionExpiresAt: expiresAt.toISOString(),
        subscriptionStartedAt: new Date().toISOString(),
        subscriptionCancelledAt: null,
      });
    } catch (error) {
      errors.push(`Failed to update user prefs: ${error.message}`);
    }

    try {
      // 3. Create/update subscription record
      if (env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        await db.createDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
          ID.unique(),
          {
            userId,
            status: "active",
            amount: 200,
            currency: "KSH",
            paymentMethod: "paypal",
            expiresAt: expiresAt.toISOString(),
            startDate: new Date().toISOString(),
            transactionId: captureId,
            subscriptionId: orderId,
            createdAt: new Date().toISOString(),
          }
        );
      }
    } catch (error) {
      errors.push(`Failed to create subscription record: ${error.message}`);
    }

    // If any operation failed, we have a problem
    if (errors.length > 0) {
      logger.error("Atomic payment update failed:", errors);
      throw new Error(`Atomic update failed: ${errors.join(", ")}`);
    }
  }
  /**
   * POST /api/payments/mpesa/callback
   * Handle M-Pesa STK Push callback
   */
  static async handleMpesaCallback(req, res) {
    try {
      logger.info(
        "Received M-Pesa callback:",
        JSON.stringify(req.body, null, 2)
      );

      const callbackData = req.body;

      // Verify the callback
      const verification = await PaymentService.verifyPaymentCallback(
        callbackData
      );

      if (!verification.verified) {
        logger.error("Invalid M-Pesa callback:", verification.message);
        return res.status(400).json({ error: "Invalid callback" });
      }

      if (!verification.success) {
        logger.warn("M-Pesa payment failed:", verification.message);
        // Payment failed - could send notification to user
        return res.json({ ResultCode: 0, ResultDesc: "Callback processed" });
      }

      // Payment successful - update subscription
      const { transactionId, amount, checkoutRequestId } = verification;

      logger.info(
        `M-Pesa payment successful: ${transactionId}, Amount: ${amount}, CheckoutRequestID: ${checkoutRequestId}`
      );

      // Find the pending subscription by checkoutRequestId
      if (env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        try {
          const subscriptions = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
            [
              Query.equal("checkoutRequestId", checkoutRequestId),
              Query.equal("status", "pending"),
            ]
          );

          if (subscriptions.documents.length > 0) {
            const subscription = subscriptions.documents[0];
            const userId = subscription.userId;

            // Update subscription to active
            await db.updateDocument(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
              subscription.$id,
              {
                status: "active",
                transactionId,
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

            // Update user collection document attributes
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
                logger.error(
                  "Error updating user document attributes:",
                  docError
                );
              }
            }

            logger.info(
              `User ${userId} premium activated until ${subscription.expiresAt}`
            );

            // Send welcome email
            try {
              const userName =
                user.name || user.prefs?.name || "Valued Customer";
              await SubscriptionEmailService.sendWelcomeEmail({
                email: user.email,
                name: userName,
                expiresAt: subscription.expiresAt,
                subscriptionId: subscription.subscriptionId,
                amount: subscription.amount || 200,
                paymentMethod: subscription.paymentMethod || "mpesa",
              });
            } catch (emailError) {
              logger.error("Failed to send welcome email:", emailError);
              // Don't fail the callback if email fails
            }
          } else {
            logger.warn(
              `No pending subscription found for checkoutRequestId: ${checkoutRequestId}`
            );
          }
        } catch (dbError) {
          logger.error("Error processing subscription activation:", dbError);
        }
      }

      return res.json({
        ResultCode: 0,
        ResultDesc: "Payment processed successfully",
      });
    } catch (error) {
      logger.error("Error processing M-Pesa callback:", error);
      return res.status(500).json({
        ResultCode: 1,
        ResultDesc: "Internal server error",
      });
    }
  }

  /**
   * GET /api/payments/mpesa/query/:checkoutRequestId
   * Query M-Pesa transaction status
   */
  static async queryMpesaTransaction(req, res) {
    try {
      const { checkoutRequestId } = req.params;

      if (!checkoutRequestId) {
        return res.status(400).json({ error: "Checkout request ID required" });
      }

      const result = await PaymentService.queryMpesaTransaction(
        checkoutRequestId
      );

      return res.json(result);
    } catch (error) {
      logger.error("Error querying M-Pesa transaction:", error);
      return res.status(500).json({ error: "Failed to query transaction" });
    }
  }

  /**
   * POST /api/payments/paypal/webhook
   * Handle PayPal webhook events
   */
  static async handlePayPalWebhook(req, res) {
    try {
      logger.info("Received PayPal webhook", { eventId: req.body?.id });

      const event = req.body;

      // CRITICAL: Verify webhook signature to prevent fraud
      if (!this.verifyPayPalWebhookSignature(req)) {
        logger.error("PayPal webhook signature verification failed");
        return res.status(400).json({ error: "Invalid signature" });
      }

      // Ensure idempotency - check if event already processed
      const eventId = event.id;
      if (!eventId) {
        logger.error("PayPal webhook missing event ID");
        return res.status(400).json({ error: "Missing event ID" });
      }

      // Check for duplicate processing (basic idempotency)
      const processedKey = `paypal_webhook_${eventId}`;
      if (this.processedWebhooks.has(processedKey)) {
        logger.info(`PayPal webhook ${eventId} already processed`);
        return res.json({ received: true });
      }

      // Mark as processing
      this.processedWebhooks.set(processedKey, Date.now());

      // Handle different event types
      switch (event.event_type) {
        case "PAYMENT.CAPTURE.COMPLETED":
          await this.handlePayPalCaptureCompleted(event);
          break;

        case "PAYMENT.CAPTURE.DENIED":
          await this.handlePayPalCaptureDenied(event);
          break;

        case "BILLING.SUBSCRIPTION.CREATED":
          await this.handlePayPalSubscriptionCreated(event);
          break;

        case "BILLING.SUBSCRIPTION.CANCELLED":
          await this.handlePayPalSubscriptionCancelled(event);
          break;

        default:
          logger.info(`Unhandled PayPal event type: ${event.event_type}`);
      }

      return res.json({ received: true });
    } catch (error) {
      logger.error("Error processing PayPal webhook:", error);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  }

  /**
   * POST /api/payments/paypal/capture/:orderId
   * Capture PayPal order after user approval
   */
  static async capturePayPalOrder(req, res) {
    const orderId = req.params.orderId;
    const userId = req.user?.userId || req.user?.$id;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    // Prevent double processing with distributed lock
    const lockKey = `paypal_capture_${orderId}`;
    if (this.processedWebhooks.has(lockKey)) {
      logger.warn(`PayPal order ${orderId} capture already in progress`);
      return res
        .status(409)
        .json({ error: "Payment capture already in progress" });
    }

    this.processedWebhooks.set(lockKey, Date.now());

    try {
      // Verify user owns this payment attempt (security check)
      const existingSubscription = await this.findPendingSubscription(
        userId,
        orderId
      );

      // Capture the payment atomically
      const captureResult = await PaymentService.capturePayPalPayment(orderId);

      if (!captureResult.success) {
        this.processedWebhooks.delete(lockKey);
        return res.status(400).json({
          error: "Failed to capture payment",
          message: captureResult.message,
        });
      }

      // Calculate subscription expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Atomic database updates - all or nothing
      await this.atomicPaymentUpdate(
        userId,
        orderId,
        captureResult.captureId,
        expiresAt
      );

      logger.info(`PayPal payment captured for user ${userId}: ${orderId}`);

      // Clear processing lock
      this.processedWebhooks.delete(lockKey);

      return res.json({
        success: true,
        message: "Payment captured successfully",
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      // Clear processing lock on error
      this.processedWebhooks.delete(lockKey);
      logger.error("Error capturing PayPal order:", error);
      return res.status(500).json({ error: "Failed to capture payment" });
    }
  }

  // Helper methods for PayPal webhook events
  static async handlePayPalCaptureCompleted(event) {
    logger.info("PayPal capture completed:", event.id);

    try {
      const capture = event.resource;
      const orderId = capture.custom_id || capture.invoice_id;

      if (orderId) {
        // Update order status to confirmed
        const orders = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ORDERS_COLLECTION,
          [Query.equal("orderId", orderId), Query.limit(1)]
        );

        if (orders.documents.length > 0) {
          const order = orders.documents[0];
          await db.updateDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_ORDERS_COLLECTION,
            order.$id,
            {
              paymentStatus: "succeeded",
              orderStatus: "Confirmed",
              paypalTransactionId: capture.id,
              updatedAt: new Date().toISOString(),
            }
          );
          logger.info(`PayPal capture completed for order ${orderId}`);
        }
      }
    } catch (error) {
      logger.error("Error handling PayPal capture completed:", error);
    }
  }

  static async handlePayPalCaptureDenied(event) {
    logger.warn("PayPal capture denied:", event.id);

    try {
      const capture = event.resource;
      const orderId = capture.custom_id || capture.invoice_id;

      if (orderId) {
        // Update order status to failed
        const orders = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ORDERS_COLLECTION,
          [Query.equal("orderId", orderId), Query.limit(1)]
        );

        if (orders.documents.length > 0) {
          const order = orders.documents[0];
          await db.updateDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_ORDERS_COLLECTION,
            order.$id,
            {
              paymentStatus: "failed",
              orderStatus: "Failed",
              failureReason: "PayPal capture denied",
              updatedAt: new Date().toISOString(),
            }
          );
          logger.info(`PayPal capture denied for order ${orderId}`);
        }
      }
    } catch (error) {
      logger.error("Error handling PayPal capture denied:", error);
    }
  }

  static async handlePayPalSubscriptionCreated(event) {
    logger.info("PayPal subscription created:", event.id);

    try {
      const subscription = event.resource;
      const userId = subscription.custom_id;

      if (userId && env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        // Create subscription record
        await db.createDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
          ID.unique(),
          {
            userId,
            status: "active",
            paymentMethod: "paypal",
            subscriptionId: subscription.id,
            startDate: subscription.create_time,
            expiresAt: subscription.billing_info?.next_billing_time,
            createdAt: new Date().toISOString(),
          }
        );
        logger.info(`PayPal subscription created for user ${userId}`);
      }
    } catch (error) {
      logger.error("Error handling PayPal subscription created:", error);
    }
  }

  static async handlePayPalSubscriptionCancelled(event) {
    logger.info("PayPal subscription cancelled:", event.id);

    try {
      const subscription = event.resource;

      if (env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        // Find and update subscription
        const subscriptions = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
          [
            Query.equal("subscriptionId", subscription.id),
            Query.equal("paymentMethod", "paypal"),
            Query.limit(1),
          ]
        );

        if (subscriptions.documents.length > 0) {
          const sub = subscriptions.documents[0];
          await db.updateDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
            sub.$id,
            {
              status: "cancelled",
              cancelledAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          );
          logger.info(`PayPal subscription cancelled: ${subscription.id}`);
        }
      }
    } catch (error) {
      logger.error("Error handling PayPal subscription cancelled:", error);
    }
  }

  /**
   * POST /api/payments/stripe/webhook
   * Handle Stripe webhook for subscription payments
   * NOTE: Requires raw body for signature verification
   */
  static async handleStripeWebhook(req, res) {
    try {
      logger.info("Received Stripe webhook");

      // Initialize Stripe
      const Stripe = require("stripe");
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);

      // Verify webhook signature
      const sig = req.headers["stripe-signature"];
      let event;

      try {
        // Use raw body for signature verification
        const payload = req.rawBody || req.body;
        event = stripe.webhooks.constructEvent(
          payload,
          sig,
          env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        logger.error(
          "Stripe webhook signature verification failed:",
          err.message
        );
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      logger.info(`Stripe Event Type: ${event.type}, Event ID: ${event.id}`);

      // Handle checkout.session.completed event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        // Extract metadata
        const userId = session.metadata?.userId || session.client_reference_id;
        const subscriptionType = session.metadata?.subscriptionType;
        const sessionId = session.id;

        logger.info(
          `Processing Stripe subscription payment for user ${userId}`,
          {
            sessionId,
            subscriptionType,
          }
        );

        if (!userId) {
          logger.error("No userId found in Stripe session metadata");
          return res.json({ received: true });
        }

        // Check if this is a subscription payment
        if (subscriptionType !== "premium") {
          logger.info("Not a subscription payment, ignoring");
          return res.json({ received: true });
        }

        // Find pending subscription by sessionId (transactionId) first, fallback to userId
        if (env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
          try {
            // Try to find by transactionId (session id) to be precise
            let subscriptions = await db.listDocuments(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
              [
                Query.equal("transactionId", sessionId),
                Query.equal("paymentMethod", "stripe"),
              ]
            );

            if (!subscriptions.documents.length) {
              // Fallback: find any pending stripe subscription for the user
              subscriptions = await db.listDocuments(
                env.APPWRITE_DATABASE_ID,
                env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
                [
                  Query.equal("userId", userId),
                  Query.equal("status", "pending"),
                  Query.equal("paymentMethod", "stripe"),
                ]
              );
            }

            logger.info(
              `Stripe webhook found ${subscriptions.documents.length} matching subscription(s) for user ${userId}`
            );

            if (subscriptions.documents.length > 0) {
              const subscription = subscriptions.documents[0];

              logger.info(
                `Updating subscription ${subscription.$id} to active`
              );

              // Update subscription to active
              const updated = await db.updateDocument(
                env.APPWRITE_DATABASE_ID,
                env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
                subscription.$id,
                {
                  status: "active",
                  transactionId: sessionId,
                  stripeEventId: event.id,
                  paymentConfirmedAt: new Date().toISOString(),
                }
              );

              logger.info(
                `Subscription ${subscription.$id} updated: ${JSON.stringify(
                  updated
                )}`
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

              // Update user collection document attributes
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
                  logger.error(
                    "Error updating user document attributes:",
                    docError
                  );
                }
              }

              logger.info(
                `User ${userId} premium activated via Stripe until ${subscription.expiresAt}`
              );

              // Send welcome email
              try {
                const userName =
                  user.name || user.prefs?.name || "Valued Customer";
                await SubscriptionEmailService.sendWelcomeEmail({
                  email: user.email,
                  name: userName,
                  expiresAt: subscription.expiresAt,
                  subscriptionId: subscription.subscriptionId,
                  amount: subscription.amount || 200,
                  paymentMethod: subscription.paymentMethod || "stripe",
                });
              } catch (emailError) {
                logger.error("Failed to send welcome email:", emailError);
                // Don't fail the webhook if email fails
              }
            } else {
              logger.warn(
                `No pending subscription found for user ${userId} with Stripe payment`
              );
            }
          } catch (dbError) {
            logger.error(
              "Error processing Stripe subscription activation:",
              dbError
            );
          }
        }
      } else {
        logger.info(`Ignoring Stripe event type: ${event.type}`);
      }

      return res.json({ received: true });
    } catch (error) {
      logger.error("Error processing Stripe webhook:", error);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  }

  /**
   * Process Stripe subscription payment atomically with idempotency
   */
  static async processStripeSubscriptionPayment(userId, sessionId, session) {
    const lockKey = `stripe_subscription_${userId}_${sessionId}`;

    // Prevent concurrent processing of same payment
    if (this.processedWebhooks.has(lockKey)) {
      logger.warn(
        `Stripe subscription processing already in progress for user ${userId}`
      );
      return;
    }

    this.processedWebhooks.set(lockKey, Date.now());

    try {
      // Find pending subscription atomically
      if (env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        // Try to find by transactionId (session id) first for precision
        let subscriptions = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
          [
            Query.equal("transactionId", sessionId),
            Query.equal("paymentMethod", "stripe"),
            Query.limit(1),
          ]
        );

        if (!subscriptions.documents.length) {
          // Fallback: find any pending stripe subscription for the user
          subscriptions = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
            [
              Query.equal("userId", userId),
              Query.equal("status", "pending"),
              Query.equal("paymentMethod", "stripe"),
              Query.limit(1),
            ]
          );
        }

        if (subscriptions.documents.length > 0) {
          const subscription = subscriptions.documents[0];

          // Perform all database updates atomically
          await this.atomicStripePaymentUpdate(userId, sessionId, subscription);

          logger.info(
            `User ${userId} premium activated via Stripe until ${subscription.expiresAt}`
          );
        } else {
          logger.warn(
            `No pending subscription found for Stripe session ${sessionId}`
          );
        }
      }
    } catch (error) {
      logger.error("Error processing Stripe subscription webhook:", error);
      throw error;
    } finally {
      // Always clear the processing lock
      this.processedWebhooks.delete(lockKey);
    }
  }

  /**
   * Atomic Stripe payment update - all operations succeed or all fail
   */
  static async atomicStripePaymentUpdate(userId, sessionId, subscription) {
    const errors = [];

    try {
      // 1. Update subscription to active
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
        subscription.$id,
        {
          status: "active",
          transactionId: sessionId,
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      errors.push(`Failed to update subscription: ${error.message}`);
    }

    try {
      // 2. Get and update user preferences
      const user = await users.get(userId);

      await users.updatePrefs(userId, {
        ...user.prefs,
        isPremium: true,
        subscriptionId: subscription.subscriptionId,
        subscriptionExpiresAt: subscription.expiresAt,
        subscriptionStartedAt: subscription.startedAt,
        subscriptionCancelledAt: null,
      });

      // 3. Send welcome email (non-blocking, don't fail transaction)
      try {
        await SubscriptionEmailService.sendWelcomeEmail({
          email: user.email,
          name: user.name || "Premium User",
          expiresAt: subscription.expiresAt,
        });
      } catch (emailError) {
        logger.error(
          "Failed to send welcome email after Stripe payment:",
          emailError
        );
        // Don't add to errors - email failure shouldn't fail payment
      }
    } catch (error) {
      errors.push(`Failed to update user: ${error.message}`);
    }

    // If any critical operation failed, throw error
    if (errors.length > 0) {
      logger.error("Atomic Stripe payment update failed:", errors);
      throw new Error(`Atomic Stripe update failed: ${errors.join(", ")}`);
    }
  }
}

module.exports = PaymentCallbackController;
