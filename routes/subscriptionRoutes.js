// routes/subscriptionRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requirePremium } = require("../middleware/requirePremium");
const SubscriptionController = require("../controllers/subscriptionController");
const { body, validationResult } = require("express-validator");
const {
  subscriptionLimiter,
  statusCheckLimiter,
} = require("../middleware/subscriptionRateLimiter");
const {
  trackSubscriptionMetrics,
  checkPendingSubscription,
  sanitizePaymentData,
} = require("../middleware/subscriptionMiddleware");
const SubscriptionMetrics = require("../services/subscriptionMetrics");

// Validation middleware for subscription requests
const validateSubscription = [
  body("paymentMethod")
    .isIn(["mpesa", "stripe"])
    .withMessage("Payment method must be either 'mpesa' or 'stripe'"),
  body("amount")
    .isNumeric()
    .custom((value) => value === 200)
    .withMessage("Subscription amount must be 200 KSH"),
  body("currency").equals("KSH").withMessage("Currency must be KSH"),
  body("phoneNumber")
    .if(body("paymentMethod").equals("mpesa"))
    .notEmpty()
    .withMessage("Phone number is required for M-Pesa payments")
    .matches(/^(\+?254|0)?[17]\d{8}$/)
    .withMessage("Invalid phone number format. Use 254XXXXXXXXX or 07XXXXXXXX"),
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

/**
 * POST /api/subscription/confirm-payment
 * Confirm Stripe payment and activate subscription after Payment Sheet success
 * Body: { paymentIntentId: 'pi_xxx', subscriptionId?: 'sub_xxx' }
 */

/**
 * DEBUG ENDPOINT - Remove after fixing 401 issue
 * GET /api/subscription/debug
 * Check if cookies are being received
 */
router.get("/debug", (req, res) => {
  res.json({
    cookies: req.cookies,
    hasAccessToken: !!req.cookies?.accessToken,
    headers: {
      cookie: req.headers.cookie,
      origin: req.headers.origin,
      authorization: req.headers.authorization,
    },
    message: req.cookies?.accessToken
      ? "✅ AccessToken found - Auth should work"
      : "❌ No accessToken cookie - Check frontend credentials config",
  });
});

// All routes require authentication
router.use(authMiddleware);

router.post(
  "/confirm-payment",
  [
    body("paymentIntentId")
      .isString()
      .isLength({ min: 1 })
      .withMessage("Payment Intent ID is required"),
  ],
  handleValidationErrors,
  SubscriptionController.confirmStripePayment
);

/**
 * GET /api/subscription/status
 * Get current user's premium subscription status
 */
router.get("/status", SubscriptionController.getStatus);

/**
 * GET /api/subscription/payment-status/:checkoutRequestId
 * Check payment status for pending subscription (for polling)
 */
router.get(
  "/payment-status/:checkoutRequestId",
  statusCheckLimiter,
  SubscriptionController.checkPaymentStatus
);

/**
 * POST /api/subscription/subscribe
 * Subscribe to premium (requires payment)
 * Body: { paymentMethod: 'mpesa'|'stripe', amount: 200, currency: 'KSH', phoneNumber: '254...' }
 */
router.post(
  "/subscribe",
  subscriptionLimiter,
  trackSubscriptionMetrics,
  sanitizePaymentData,
  validateSubscription,
  handleValidationErrors,
  checkPendingSubscription,
  SubscriptionController.subscribe
);

/**
 * POST /api/subscription/cancel
 * Cancel premium subscription (benefits remain until period end)
 */
router.post("/cancel", SubscriptionController.cancel);

/**
 * POST /api/subscription/renew
 * Renew expired or cancelled subscription
 * Body: { paymentMethod: 'mpesa'|'stripe', amount: 200, currency: 'KSH', phoneNumber: '254...' }
 */
router.post(
  "/renew",
  validateSubscription,
  handleValidationErrors,
  SubscriptionController.renew
);

/**
 * GET /api/subscription/monthly-summary
 * Get monthly savings breakdown (premium users only)
 */
router.get(
  "/monthly-summary",
  requirePremium,
  SubscriptionController.getMonthlySummary
);

/**
 * GET /api/subscription/premium-deals
 * Get products with premium-only discounts (premium users only)
 */
router.get(
  "/premium-deals",
  requirePremium,
  SubscriptionController.getPremiumDeals
);

/**
 * GET /api/subscription/metrics
 * Get subscription system metrics (admin/monitoring only)
 */
router.get("/metrics", async (req, res) => {
  try {
    const [realtimeMetrics, dbStats] = await Promise.all([
      SubscriptionMetrics.getMetrics(),
      SubscriptionMetrics.getDatabaseStats(),
    ]);

    res.json({
      realtime: realtimeMetrics,
      database: dbStats,
      healthy: SubscriptionMetrics.isHealthy(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

module.exports = router;
