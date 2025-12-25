// services/subscriptionMetrics.js
const logger = require("../utils/logger");
const { db } = require("./appwriteService");
const { env } = require("../src/env");
const { Query } = require("node-appwrite");

class SubscriptionMetrics {
  constructor() {
    this.metrics = {
      subscriptionAttempts: 0,
      subscriptionSuccesses: 0,
      subscriptionFailures: 0,
      renewalAttempts: 0,
      renewalSuccesses: 0,
      renewalFailures: 0,
      paymentProviderErrors: {
        mpesa: 0,
        stripe: 0,
      },
      emailFailures: 0,
      lastReset: new Date(),
    };
  }

  /**
   * Record subscription attempt
   */
  recordSubscriptionAttempt() {
    this.metrics.subscriptionAttempts++;
  }

  /**
   * Record subscription success
   */
  recordSubscriptionSuccess() {
    this.metrics.subscriptionSuccesses++;
  }

  /**
   * Record subscription failure
   */
  recordSubscriptionFailure() {
    this.metrics.subscriptionFailures++;
  }

  /**
   * Record renewal attempt
   */
  recordRenewalAttempt() {
    this.metrics.renewalAttempts++;
  }

  /**
   * Record renewal success
   */
  recordRenewalSuccess() {
    this.metrics.renewalSuccesses++;
  }

  /**
   * Record renewal failure
   */
  recordRenewalFailure() {
    this.metrics.renewalFailures++;
  }

  /**
   * Record payment provider error
   */
  recordPaymentProviderError(provider) {
    if (this.metrics.paymentProviderErrors[provider] !== undefined) {
      this.metrics.paymentProviderErrors[provider]++;
    }
  }

  /**
   * Record email failure
   */
  recordEmailFailure() {
    this.metrics.emailFailures++;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const subscriptionSuccessRate =
      this.metrics.subscriptionAttempts > 0
        ? (
            (this.metrics.subscriptionSuccesses /
              this.metrics.subscriptionAttempts) *
            100
          ).toFixed(2)
        : 0;

    const renewalSuccessRate =
      this.metrics.renewalAttempts > 0
        ? (
            (this.metrics.renewalSuccesses / this.metrics.renewalAttempts) *
            100
          ).toFixed(2)
        : 0;

    return {
      ...this.metrics,
      subscriptionSuccessRate: `${subscriptionSuccessRate}%`,
      renewalSuccessRate: `${renewalSuccessRate}%`,
      uptime: Math.floor((Date.now() - this.metrics.lastReset) / 1000),
    };
  }

  /**
   * Reset metrics (typically called daily)
   */
  reset() {
    const oldMetrics = { ...this.metrics };
    this.metrics = {
      subscriptionAttempts: 0,
      subscriptionSuccesses: 0,
      subscriptionFailures: 0,
      renewalAttempts: 0,
      renewalSuccesses: 0,
      renewalFailures: 0,
      paymentProviderErrors: {
        mpesa: 0,
        stripe: 0,
      },
      emailFailures: 0,
      lastReset: new Date(),
    };

    logger.info("Metrics reset. Previous period:", oldMetrics);
    return oldMetrics;
  }

  /**
   * Check if metrics are healthy
   */
  isHealthy() {
    const metrics = this.getMetrics();
    const successRate = parseFloat(metrics.subscriptionSuccessRate);

    // Alert if success rate drops below 95%
    if (this.metrics.subscriptionAttempts > 10 && successRate < 95) {
      logger.error(
        `ALERT: Subscription success rate is ${successRate}% (below 95% threshold)`
      );
      return false;
    }

    // Alert if too many payment provider errors
    const totalProviderErrors =
      this.metrics.paymentProviderErrors.mpesa +
      this.metrics.paymentProviderErrors.stripe;
    if (totalProviderErrors > 50) {
      logger.error(
        `ALERT: High payment provider error count: ${totalProviderErrors}`
      );
      return false;
    }

    return true;
  }

  /**
   * Get subscription statistics from database
   */
  async getDatabaseStats() {
    try {
      if (!env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        return null;
      }

      // Get total subscriptions by status
      const [active, pending, cancelled, expired] = await Promise.all([
        db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
          [Query.equal("status", "active"), Query.limit(1)]
        ),
        db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
          [Query.equal("status", "pending"), Query.limit(1)]
        ),
        db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
          [Query.equal("status", "cancelled"), Query.limit(1)]
        ),
        db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
          [Query.equal("status", "expired"), Query.limit(1)]
        ),
      ]);

      return {
        activeSubscriptions: active.total,
        pendingSubscriptions: pending.total,
        cancelledSubscriptions: cancelled.total,
        expiredSubscriptions: expired.total,
        totalSubscriptions:
          active.total + pending.total + cancelled.total + expired.total,
      };
    } catch (error) {
      logger.error("Error fetching database stats:", error);
      return null;
    }
  }
}

// Singleton instance
const metrics = new SubscriptionMetrics();

// Export methods
module.exports = {
  recordSubscriptionAttempt: () => metrics.recordSubscriptionAttempt(),
  recordSubscriptionSuccess: () => metrics.recordSubscriptionSuccess(),
  recordSubscriptionFailure: () => metrics.recordSubscriptionFailure(),
  recordRenewalAttempt: () => metrics.recordRenewalAttempt(),
  recordRenewalSuccess: () => metrics.recordRenewalSuccess(),
  recordRenewalFailure: () => metrics.recordRenewalFailure(),
  recordPaymentProviderError: (provider) =>
    metrics.recordPaymentProviderError(provider),
  recordEmailFailure: () => metrics.recordEmailFailure(),
  getMetrics: () => metrics.getMetrics(),
  reset: () => metrics.reset(),
  isHealthy: () => metrics.isHealthy(),
  getDatabaseStats: () => metrics.getDatabaseStats(),
};
