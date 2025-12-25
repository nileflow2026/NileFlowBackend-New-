// middleware/subscriptionMiddleware.js
const SubscriptionValidationService = require("../services/subscriptionValidation");
const SubscriptionMetrics = require("../services/subscriptionMetrics");
const logger = require("../utils/logger");

/**
 * Middleware to track subscription metrics
 */
function trackSubscriptionMetrics(req, res, next) {
  SubscriptionMetrics.recordSubscriptionAttempt();

  // Track response
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      SubscriptionMetrics.recordSubscriptionSuccess();
    } else {
      SubscriptionMetrics.recordSubscriptionFailure();
    }
    return originalJson(data);
  };

  next();
}

/**
 * Middleware to validate subscription requests
 */
function validateSubscriptionRequest(req, res, next) {
  const validation =
    SubscriptionValidationService.validateSubscriptionRequest(req);

  if (!validation.valid) {
    logger.warn(`Subscription validation failed:`, validation.errors);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.errors,
    });
  }

  next();
}

/**
 * Middleware to check for pending subscriptions
 */
async function checkPendingSubscription(req, res, next) {
  try {
    const userId = req.user?.userId || req.user?.$id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hasPending =
      await SubscriptionValidationService.hasPendingSubscription(userId);

    if (hasPending) {
      logger.warn(`User ${userId} already has a pending subscription`);
      return res.status(400).json({
        error:
          "You already have a pending subscription. Please complete or cancel it first.",
      });
    }

    next();
  } catch (error) {
    logger.error("Error checking pending subscription:", error);
    // Fail open - allow request to proceed
    next();
  }
}

/**
 * Middleware to sanitize payment data
 */
function sanitizePaymentData(req, res, next) {
  if (req.body) {
    req.body = SubscriptionValidationService.sanitizePaymentMetadata(req.body);
  }
  next();
}

module.exports = {
  trackSubscriptionMetrics,
  validateSubscriptionRequest,
  checkPendingSubscription,
  sanitizePaymentData,
};
