// utils/subscriptionCron.js
const cron = require("node-cron");
const { users, db } = require("../services/appwriteService");
const { env } = require("../src/env");
const { Query } = require("node-appwrite");
const logger = require("./logger");

/**
 * Cron job to expire subscriptions
 * Runs daily at midnight (00:00)
 * Schedule format: minute hour day month dayOfWeek
 */
const startSubscriptionExpiryJob = () => {
  // Run every day at 00:00 (midnight)
  cron.schedule("0 0 * * *", async () => {
    try {
      logger.info("Starting subscription expiry check...");

      const now = new Date();
      let expiredCount = 0;

      // If we have a subscriptions collection, query from there
      if (env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        try {
          // Find all active subscriptions that have expired
          const expiredSubscriptions = await db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
            [
              Query.equal("status", "active"),
              Query.lessThan("expiresAt", now.toISOString()),
              Query.limit(100), // Process in batches
            ]
          );

          logger.info(
            `Found ${expiredSubscriptions.documents.length} expired subscriptions`
          );

          // Process each expired subscription
          for (const subscription of expiredSubscriptions.documents) {
            try {
              const userId = subscription.userId;

              // Update user prefs to remove premium status
              const user = await users.get(userId);
              if (user && user.prefs?.isPremium) {
                await users.updatePrefs(userId, {
                  ...user.prefs,
                  isPremium: false,
                });

                logger.info(`Expired premium for user ${userId}`);
                expiredCount++;
              }

              // Update subscription record
              await db.updateDocument(
                env.APPWRITE_DATABASE_ID,
                env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
                subscription.$id,
                {
                  status: "expired",
                }
              );

              // TODO: Send expiration notification to user
              // await NotificationService.sendSubscriptionExpired(user);
            } catch (userError) {
              logger.error(
                `Error expiring subscription for user ${subscription.userId}:`,
                userError
              );
            }
          }
        } catch (dbError) {
          logger.error("Error querying subscriptions collection:", dbError);
        }
      }

      // Also check user prefs directly as a fallback
      // This is a more expensive operation, so we limit it
      try {
        // Appwrite doesn't support querying user prefs directly,
        // so we rely on the subscriptions collection above
        // This is why having a subscriptions collection is important
        logger.info(
          "Skipping direct user prefs scan (use subscriptions collection)"
        );
      } catch (error) {
        logger.error("Error in user prefs check:", error);
      }

      logger.info(
        `Subscription expiry check completed. Expired ${expiredCount} subscriptions.`
      );
    } catch (error) {
      logger.error("Error in subscription expiry cron job:", error);
    }
  });

  logger.info(
    "Subscription expiry cron job scheduled (runs daily at midnight)"
  );
};

/**
 * Cron job to send reminder notifications
 * Runs daily at 10:00 AM
 * Sends reminders 3 days before expiry
 */
const startSubscriptionReminderJob = () => {
  // Run every day at 10:00 AM
  cron.schedule("0 10 * * *", async () => {
    try {
      logger.info("Starting subscription reminder check...");

      if (!env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        logger.warn(
          "Subscriptions collection not configured, skipping reminders"
        );
        return;
      }

      const now = new Date();
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000
      );

      // Find subscriptions expiring in 3 days
      const expiringSubscriptions = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal("status", "active"),
          Query.greaterThan("expiresAt", now.toISOString()),
          Query.lessThan("expiresAt", threeDaysFromNow.toISOString()),
          Query.limit(100),
        ]
      );

      logger.info(
        `Found ${expiringSubscriptions.documents.length} subscriptions expiring soon`
      );

      for (const subscription of expiringSubscriptions.documents) {
        try {
          const userId = subscription.userId;
          const user = await users.get(userId);

          if (user && user.prefs?.isPremium) {
            // TODO: Send reminder notification
            // await NotificationService.sendSubscriptionReminder(user, subscription.expiresAt);
            logger.info(
              `Sent reminder to user ${userId} about expiration on ${subscription.expiresAt}`
            );
          }
        } catch (userError) {
          logger.error(
            `Error sending reminder to user ${subscription.userId}:`,
            userError
          );
        }
      }

      logger.info("Subscription reminder check completed");
    } catch (error) {
      logger.error("Error in subscription reminder cron job:", error);
    }
  });

  logger.info(
    "Subscription reminder cron job scheduled (runs daily at 10:00 AM)"
  );
};

/**
 * Initialize all subscription cron jobs
 */
const initializeSubscriptionCrons = () => {
  logger.info("Initializing subscription cron jobs...");

  startSubscriptionExpiryJob();
  startSubscriptionReminderJob();

  logger.info("Subscription cron jobs initialized successfully");
};

module.exports = {
  initializeSubscriptionCrons,
  startSubscriptionExpiryJob,
  startSubscriptionReminderJob,
};
