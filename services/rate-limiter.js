// rate-limiter.js
const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");

const authLimiter = rateLimit({
  store: new RedisStore({
    prefix: "rl:auth:",
    client: redisClient,
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    error: "Too many authentication attempts",
    code: "RATE_LIMITED",
    retryAfter: 900, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.body.email || "unknown"}`,
});

const sessionLimiter = rateLimit({
  store: new RedisStore({
    prefix: "rl:session:",
    client: redisClient,
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per session
  skip: (req) => !req.cookies.session_id,
  keyGenerator: (req) => req.cookies.session_id || req.ip,
});

module.exports = {
  authLimiter,
  sessionLimiter,
};
