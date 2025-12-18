// middleware/rate-limiter.js
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    error: "Too many authentication attempts",
    code: "RATE_LIMITED",
    retryAfter: 900, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: "Too many requests",
    code: "RATE_LIMITED",
  },
});

module.exports = { authLimiter, apiLimiter };
// middleware/auth.middleware.js
