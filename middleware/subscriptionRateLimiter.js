// middleware/subscriptionRateLimiter.js
const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

/**
 * Rate limiter for subscription endpoints
 * Prevents abuse and ensures fair usage
 */
const subscriptionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 subscription attempts per 15 minutes per IP
  message: {
    error: "Too many subscription attempts. Please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for subscription from IP: ${req.ip}`);
    res.status(429).json({
      error: "Too many subscription attempts",
      message: "Please wait 15 minutes before trying again",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
  skip: (req) => {
    // Skip rate limiting for admin users or testing
    return process.env.NODE_ENV === "test";
  },
});

/**
 * Rate limiter for payment callback webhooks
 * More lenient to allow legitimate webhook retries
 */
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Max 30 webhooks per minute per IP
  message: "Too many webhook requests",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Webhook rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded for webhooks",
    });
  },
});

/**
 * Rate limiter for payment status checks
 * Allows frequent polling during payment
 */
const statusCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Max 60 status checks per minute (1 per second)
  message: "Too many status check requests",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

module.exports = {
  subscriptionLimiter,
  webhookLimiter,
  statusCheckLimiter,
};
