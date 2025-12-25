// routes/paymentCallbackRoutes.js
const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const authMiddleware = require("../middleware/authMiddleware");
const { webhookLimiter } = require("../middleware/subscriptionRateLimiter");
const PaymentCallbackController = require("../controllers/paymentCallbackController");

/**
 * POST /api/payments/mpesa/callback
 * M-Pesa STK Push callback (no auth required - called by Safaricom)
 */
router.post(
  "/mpesa/callback",
  webhookLimiter,
  PaymentCallbackController.handleMpesaCallback
);

/**
 * GET /api/payments/mpesa/query/:checkoutRequestId
 * Query M-Pesa transaction status (requires auth)
 */
router.get(
  "/mpesa/query/:checkoutRequestId",
  authMiddleware,
  PaymentCallbackController.queryMpesaTransaction
);

/**
 * POST /api/payments/paypal/webhook
 * PayPal webhook handler (no auth required - called by PayPal)
 */
router.post("/paypal/webhook", PaymentCallbackController.handlePayPalWebhook);

/**
 * POST /api/payments/stripe/webhook
 * Stripe webhook handler for subscriptions (no auth required - called by Stripe)
 */
// Use raw body parser for Stripe webhook route so signature verification works
router.post(
  "/stripe/webhook",
  webhookLimiter,
  bodyParser.raw({ type: "application/json" }),
  PaymentCallbackController.handleStripeWebhook
);

/**
 * POST /api/payments/paypal/capture/:orderId
 * Capture PayPal order after user approval (requires auth)
 */
router.post(
  "/paypal/capture/:orderId",
  authMiddleware,
  PaymentCallbackController.capturePayPalOrder
);

module.exports = router;
