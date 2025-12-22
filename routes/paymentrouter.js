const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { sendOrderStatusUpdateEmail } = require("../services/send-confirmation");
const { env } = require("../src/env");
const { functions } = require("../src/appwrite");
const {
  assertToolCallsAreChatCompletionFunctionToolCalls,
} = require("openai/lib/parser.mjs");
const { default: Stripe } = require("stripe");
const {
  stripewebpayment,
  stripePaymentCancelled,
  PayPalCreateOrder,
  PayPalCaptureOrder,
  Emailconfirmation,
  verifyStripePayment,
  cashonDelivery,
  initiateMpesaPayment,
  mpesaCallback,
  mpesaPaymentStatus,
  mpesaCancelPayment,
  cancelCodOrder,
} = require("../controllers/AdminControllers/PaymentController");

router.post("/stripewebpayment", authenticateToken, stripewebpayment);
router.post("/stripe-cancelled", authenticateToken, stripePaymentCancelled);
router.post("/paypal-create-order", authenticateToken, PayPalCreateOrder);
router.post("/paypal-capture-order", authenticateToken, PayPalCaptureOrder);
router.post("/email-confirmation", authenticateToken, Emailconfirmation);
router.get("/payment-success", authenticateToken, verifyStripePayment);

// M-Pesa routes
router.post("/mpesa/initiate", authenticateToken, initiateMpesaPayment);
router.post("/mpesa/callback", mpesaCallback); // No auth middleware for M-Pesa callback
router.get("/mpesa/status/:orderId", authenticateToken, mpesaPaymentStatus);
router.post("/mpesa/cancel", authenticateToken, mpesaCancelPayment);

router.post(
  "/email-orderStatus",
  authenticateToken,
  sendOrderStatusUpdateEmail
);
router.post("/cash-on-delivery", authenticateToken, cashonDelivery);
router.post("/cash-on-delivery/cancel", authenticateToken, cancelCodOrder);
router.post(
  "/webhook",
  express.raw({ type: "application/json" }), // IMPORTANT: raw body for Stripe verification
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = Stripe.webhooks.constructEvent(
        req.body,
        sig,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // ✅ Handle checkout success
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        // Payment details
        const sessionId = session.id;
        const customerEmail = session.customer_email;
        const amountTotal = session.amount_total;
        const currency = session.currency;

        console.log("✅ Payment successful for session:", sessionId);

        // Update order in Appwrite (via your order function)
        await functions.createExecution(
          process.env.ORDER_FUNCTION_ID,
          JSON.stringify({
            sessionId,
            paymentStatus: "succeeded",
            customerEmail,
            amountTotal,
            currency,
            timestamp: new Date().toISOString(),
          })
        );
      }

      // ❌ Handle failed or expired payments
      if (event.type === "checkout.session.expired") {
        const session = event.data.object;
        console.warn("⚠️ Checkout session expired:", session.id);

        await functions.createExecution(
          env.ORDER_FUNCTION_WEB_ID,
          JSON.stringify({
            sessionId: session.id,
            paymentStatus: "expired",
          })
        );
      }

      res.sendStatus(200);
    } catch (error) {
      console.error("❌ Webhook processing error:", error);
      res.status(500).send("Internal webhook error");
    }
  }
);

module.exports = router;
