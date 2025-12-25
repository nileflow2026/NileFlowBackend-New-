// services/subscriptionCronService.js
const cron = require("node-cron");
const { db, users } = require("./appwriteService");
const { env } = require("../src/env");
const { Query } = require("node-appwrite");
const PaymentService = require("./paymentService");
const SubscriptionEmailService = require("./subscriptionEmailService");
const logger = require("../utils/logger");

class SubscriptionCronService {
  /**
   * Initialize all subscription cron jobs
   */
  static initialize() {
    // Run every day at 6:00 AM
    cron.schedule("0 6 * * *", () => {
      this.checkExpiringSubscriptions();
    });

    // Run every day at 2:00 AM for auto-renewals
    cron.schedule("0 2 * * *", () => {
      this.processAutoRenewals();
    });

    // Run every hour to check for expired subscriptions
    cron.schedule("0 * * * *", () => {
      this.expireOverdueSubscriptions();
    });

    logger.info("Subscription cron jobs initialized successfully");
  }

  /**
   * Check for subscriptions expiring in 7 days or 3 days and send reminders
   */
  static async checkExpiringSubscriptions() {
    try {
      logger.info("Running subscription expiry check...");

      if (!env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        logger.warn("Subscriptions collection not configured");
        return;
      }

      const now = new Date();
      const sevenDaysFromNow = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      );
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000
      );

      // Fetch active subscriptions
      const subscriptions = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal("status", "active"),
          Query.lessThan("expiresAt", sevenDaysFromNow.toISOString()),
          Query.greaterThan("expiresAt", now.toISOString()),
        ]
      );

      logger.info(
        `Found ${subscriptions.documents.length} subscriptions expiring within 7 days`
      );

      for (const subscription of subscriptions.documents) {
        try {
          const expiresAt = new Date(subscription.expiresAt);
          const daysUntilExpiry = Math.ceil(
            (expiresAt - now) / (1000 * 60 * 60 * 24)
          );

          // Check if this is a cancelled subscription (no auto-renewal)
          const isCancelled =
            subscription.cancelledAt !== null &&
            subscription.cancelledAt !== undefined;

          // Send 7-day reminder
          if (daysUntilExpiry === 7 && !subscription.sevenDayReminderSent) {
            await this.sendReminderNotification(subscription, 7, isCancelled);

            // Mark reminder as sent
            await db.updateDocument(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
              subscription.$id,
              { sevenDayReminderSent: true }
            );
          }

          // Send 3-day reminder
          if (daysUntilExpiry === 3 && !subscription.threeDayReminderSent) {
            await this.sendReminderNotification(subscription, 3, isCancelled);

            // Mark reminder as sent
            await db.updateDocument(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
              subscription.$id,
              { threeDayReminderSent: true }
            );
          }
        } catch (error) {
          logger.error(
            `Error processing subscription ${subscription.$id}:`,
            error
          );
        }
      }

      logger.info("Subscription expiry check completed");
    } catch (error) {
      logger.error("Error in checkExpiringSubscriptions:", error);
    }
  }

  /**
   * Send reminder notification
   */
  static async sendReminderNotification(
    subscription,
    daysRemaining,
    isCancelled
  ) {
    try {
      const user = await users.get(subscription.userId);

      if (!user || !user.email) {
        logger.warn(`User not found for subscription ${subscription.$id}`);
        return;
      }

      const userName = user.name || user.prefs?.name || "Valued Customer";

      // Only send reminder for auto-renewing subscriptions
      if (!isCancelled) {
        await SubscriptionEmailService.sendReminderEmail({
          email: user.email,
          name: userName,
          expiresAt: subscription.expiresAt,
          daysRemaining,
          subscriptionId: subscription.subscriptionId,
        });

        logger.info(
          `Sent ${daysRemaining}-day reminder to ${user.email} for subscription ${subscription.subscriptionId}`
        );
      } else {
        logger.info(
          `Skipping reminder for cancelled subscription ${subscription.subscriptionId}`
        );
      }
    } catch (error) {
      logger.error(
        `Failed to send reminder for subscription ${subscription.$id}:`,
        error
      );
    }
  }

  /**
   * Process auto-renewals for subscriptions expiring today
   */
  static async processAutoRenewals() {
    try {
      logger.info("Processing auto-renewals...");

      if (!env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        logger.warn("Subscriptions collection not configured");
        return;
      }

      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find subscriptions expiring today or tomorrow that haven't been cancelled
      const subscriptions = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal("status", "active"),
          Query.lessThan("expiresAt", tomorrow.toISOString()),
          Query.greaterThan("expiresAt", now.toISOString()),
        ]
      );

      logger.info(
        `Found ${subscriptions.documents.length} subscriptions ready for renewal`
      );

      for (const subscription of subscriptions.documents) {
        try {
          // Skip if subscription was cancelled (user doesn't want auto-renewal)
          const isCancelled =
            subscription.cancelledAt !== null &&
            subscription.cancelledAt !== undefined;

          if (isCancelled) {
            logger.info(
              `Skipping auto-renewal for cancelled subscription ${subscription.subscriptionId}`
            );
            continue;
          }

          // Skip if already renewed
          if (subscription.autoRenewed) {
            logger.info(
              `Subscription ${subscription.subscriptionId} already renewed`
            );
            continue;
          }

          await this.renewSubscription(subscription);
        } catch (error) {
          logger.error(
            `Error renewing subscription ${subscription.$id}:`,
            error
          );
        }
      }

      logger.info("Auto-renewal processing completed");
    } catch (error) {
      logger.error("Error in processAutoRenewals:", error);
    }
  }

  /**
   * Renew a subscription
   */
  static async renewSubscription(subscription) {
    try {
      const user = await users.get(subscription.userId);

      if (!user) {
        logger.error(`User not found for subscription ${subscription.$id}`);
        return;
      }

      const userName = user.name || user.prefs?.name || "Valued Customer";
      const amount = subscription.amount || 200;
      const paymentMethod = subscription.paymentMethod;

      logger.info(
        `Attempting to renew subscription ${subscription.subscriptionId} for user ${subscription.userId}`
      );

      // Process renewal payment based on payment method
      let paymentResult;

      if (paymentMethod === "mpesa") {
        // For M-Pesa, we need a phone number - get from user prefs or fail gracefully
        const phoneNumber = user.prefs?.phoneNumber || user.phone;

        if (!phoneNumber) {
          logger.error(
            `No phone number found for M-Pesa renewal: ${subscription.userId}`
          );
          await this.handleRenewalFailure(
            subscription,
            user,
            "No phone number on file"
          );
          return;
        }

        paymentResult = await PaymentService.processMpesaPayment({
          userId: subscription.userId,
          phoneNumber,
          amount,
          description: "Nile Premium Auto-Renewal - 1 Month",
        });
      } else if (paymentMethod === "stripe") {
        // For Stripe, we would need to store customer ID and payment method ID
        // This is a simplified version - production should use Stripe Subscriptions API
        logger.warn(
          `Stripe auto-renewal requires manual intervention or Stripe Subscriptions API - subscription ${subscription.subscriptionId}`
        );

        // Send email to manually renew
        await this.handleRenewalFailure(
          subscription,
          user,
          "Please update your subscription manually"
        );
        return;
      } else {
        logger.error(
          `Unsupported payment method for renewal: ${paymentMethod}`
        );
        return;
      }

      if (paymentResult.success) {
        // Calculate new expiry date
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 30);

        // Update subscription document
        await db.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
          subscription.$id,
          {
            expiresAt: newExpiresAt.toISOString(),
            renewedAt: new Date().toISOString(),
            autoRenewed: true,
            sevenDayReminderSent: false,
            threeDayReminderSent: false,
            lastRenewalTransactionId: paymentResult.transactionId,
          }
        );

        // Update user prefs
        await users.updatePrefs(subscription.userId, {
          ...user.prefs,
          subscriptionExpiresAt: newExpiresAt.toISOString(),
        });

        // Update user collection document
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
                  subscriptionExpiresAt: newExpiresAt.toISOString(),
                }
              );
            }
          } catch (docError) {
            logger.error("Error updating user document on renewal:", docError);
          }
        }

        // Send renewal confirmation email
        await SubscriptionEmailService.sendRenewalEmail({
          email: user.email,
          name: userName,
          newExpiresAt: newExpiresAt.toISOString(),
          subscriptionId: subscription.subscriptionId,
          amount,
          paymentMethod,
        });

        logger.info(
          `Successfully renewed subscription ${subscription.subscriptionId} for user ${subscription.userId}`
        );
      } else {
        // Payment failed
        await this.handleRenewalFailure(
          subscription,
          user,
          paymentResult.message || "Payment processing failed"
        );
      }
    } catch (error) {
      logger.error(
        `Error in renewSubscription for ${subscription.$id}:`,
        error
      );

      try {
        const user = await users.get(subscription.userId);
        await this.handleRenewalFailure(subscription, user, error.message);
      } catch (emailError) {
        logger.error("Failed to send renewal failure email:", emailError);
      }
    }
  }

  /**
   * Handle renewal failure
   */
  static async handleRenewalFailure(subscription, user, reason) {
    try {
      const userName = user.name || user.prefs?.name || "Valued Customer";

      // Mark subscription as renewal failed
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
        subscription.$id,
        {
          renewalFailed: true,
          renewalFailureReason: reason,
          renewalFailedAt: new Date().toISOString(),
        }
      );

      // Send failure notification
      await SubscriptionEmailService.sendPaymentFailureEmail({
        email: user.email,
        name: userName,
        subscriptionId: subscription.subscriptionId,
        reason,
      });

      logger.warn(
        `Renewal failed for subscription ${subscription.subscriptionId}: ${reason}`
      );
    } catch (error) {
      logger.error("Error handling renewal failure:", error);
    }
  }

  /**
   * Expire subscriptions that are overdue
   */
  static async expireOverdueSubscriptions() {
    try {
      logger.info("Checking for overdue subscriptions...");

      if (!env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        return;
      }

      const now = new Date();

      // Find active subscriptions that have expired
      const subscriptions = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal("status", "active"),
          Query.lessThan("expiresAt", now.toISOString()),
        ]
      );

      logger.info(
        `Found ${subscriptions.documents.length} overdue subscriptions`
      );

      for (const subscription of subscriptions.documents) {
        try {
          // Update subscription to expired
          await db.updateDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
            subscription.$id,
            {
              status: "expired",
              expiredAt: new Date().toISOString(),
            }
          );

          // Update user prefs
          const user = await users.get(subscription.userId);
          await users.updatePrefs(subscription.userId, {
            ...user.prefs,
            isPremium: false,
          });

          // Update user collection document
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
                    isPremium: false,
                  }
                );
              }
            } catch (docError) {
              logger.error("Error updating user document on expiry:", docError);
            }
          }

          logger.info(
            `Expired subscription ${subscription.subscriptionId} for user ${subscription.userId}`
          );
        } catch (error) {
          logger.error(
            `Error expiring subscription ${subscription.$id}:`,
            error
          );
        }
      }

      logger.info("Overdue subscription check completed");
    } catch (error) {
      logger.error("Error in expireOverdueSubscriptions:", error);
    }
  }
}

module.exports = SubscriptionCronService;
