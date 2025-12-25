// controllers/paymentCallbackController.js
const { users, db } = require("../services/appwriteService");
const { env } = require("../src/env");
const { Query, ID } = require("node-appwrite");
const PaymentService = require("../services/paymentService");
const SubscriptionEmailService = require("../services/subscriptionEmailService");
const logger = require("../utils/logger");

class PaymentCallbackController {
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
      logger.info(
        "Received PayPal webhook:",
        JSON.stringify(req.body, null, 2)
      );

      const event = req.body;

      // TODO: Verify webhook signature
      // https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/#verify-signature

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
    try {
      const { orderId } = req.params;
      const userId = req.user?.userId || req.user?.$id;

      if (!orderId) {
        return res.status(400).json({ error: "Order ID required" });
      }

      // Capture the payment
      const captureResult = await PaymentService.capturePayPalPayment(orderId);

      if (!captureResult.success) {
        return res.status(400).json({
          error: "Failed to capture payment",
          message: captureResult.message,
        });
      }

      // Update user's premium status
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const user = await users.get(userId);

      await users.updatePrefs(userId, {
        ...user.prefs,
        isPremium: true,
        subscriptionId: `sub_paypal_${orderId}`,
        subscriptionExpiresAt: expiresAt.toISOString(),
        subscriptionStartedAt: new Date().toISOString(),
        subscriptionCancelledAt: null,
      });

      // Create subscription record
      if (env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        try {
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
              transactionId: captureResult.captureId,
              subscriptionId: orderId,
            }
          );
        } catch (dbError) {
          logger.error("Error creating subscription document:", dbError);
        }
      }

      logger.info(`PayPal payment captured for user ${userId}: ${orderId}`);

      return res.json({
        success: true,
        message: "Payment captured successfully",
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      logger.error("Error capturing PayPal order:", error);
      return res.status(500).json({ error: "Failed to capture payment" });
    }
  }

  // Helper methods for PayPal webhook events
  static async handlePayPalCaptureCompleted(event) {
    logger.info("PayPal capture completed:", event.id);
    // TODO: Update subscription status
  }

  static async handlePayPalCaptureDenied(event) {
    logger.warn("PayPal capture denied:", event.id);
    // TODO: Handle failed payment
  }

  static async handlePayPalSubscriptionCreated(event) {
    logger.info("PayPal subscription created:", event.id);
    // TODO: Create subscription record
  }

  static async handlePayPalSubscriptionCancelled(event) {
    logger.info("PayPal subscription cancelled:", event.id);
    // TODO: Cancel subscription
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
}

module.exports = PaymentCallbackController;
