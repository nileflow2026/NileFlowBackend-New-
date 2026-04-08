// services/paymentService.js
const axios = require("axios");
const { env } = require("../src/env");
const logger = require("../utils/logger");
const { client: paypalClient } = require("./paypal");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");

class PaymentService {
  /**
   * Process payment via M-Pesa STK Push
   * @param {Object} params - Payment parameters
   * @param {string} params.userId - User ID
   * @param {string} params.phoneNumber - Phone number in format 254XXXXXXXXX
   * @param {number} params.amount - Amount in KSH
   * @param {string} params.description - Payment description
   * @returns {Promise<Object>} Payment result
   */
  static async processMpesaPayment({
    userId,
    phoneNumber,
    amount,
    description,
  }) {
    try {
      // Validate phone number format
      const cleanPhone = phoneNumber.replace(/\s+/g, "");
      let formattedPhone = cleanPhone;

      // Convert to 254 format
      if (cleanPhone.startsWith("0")) {
        formattedPhone = "254" + cleanPhone.substring(1);
      } else if (cleanPhone.startsWith("+254")) {
        formattedPhone = cleanPhone.substring(1);
      } else if (!cleanPhone.startsWith("254")) {
        formattedPhone = "254" + cleanPhone;
      }

      // Validate phone number
      if (!/^254[17]\d{8}$/.test(formattedPhone)) {
        return {
          success: false,
          message: "Invalid phone number format. Use 254XXXXXXXXX",
        };
      }

      logger.info(
        `Processing M-Pesa payment for user ${userId}: ${amount} KSH`
      );

      // Get M-Pesa access token
      const accessToken = await this.getMpesaAccessToken();

      if (!accessToken) {
        return {
          success: false,
          message: "Failed to authenticate with M-Pesa",
        };
      }

      // Generate timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, "")
        .slice(0, -3);

      // Generate password
      const password = Buffer.from(
        env.MPESA_SHORTCODE + env.MPESA_PASSKEY + timestamp
      ).toString("base64");

      // STK Push request
      const stkPushUrl =
        env.MPESA_ENVIRONMENT === "production"
          ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
          : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

      const response = await axios.post(
        stkPushUrl,
        {
          BusinessShortCode: env.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.round(amount),
          PartyA: formattedPhone,
          PartyB: env.MPESA_SHORTCODE,
          PhoneNumber: formattedPhone,
          CallBackURL:
            env.MPESA_CALLBACK_URL ||
            `${env.BACKEND_URL}/api/payments/mpesa/callback`,
          AccountReference: `SUB_${userId}`,
          TransactionDesc: description || "Nile Premium Subscription",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info("M-Pesa STK Push response:", response.data);

      if (response.data.ResponseCode === "0") {
        return {
          success: true,
          subscriptionId: `sub_mpesa_${Date.now()}`,
          transactionId: response.data.CheckoutRequestID,
          message:
            "Payment request sent. Please check your phone to complete payment.",
          paymentDetails: {
            checkoutRequestId: response.data.CheckoutRequestID,
            merchantRequestId: response.data.MerchantRequestID,
          },
        };
      } else {
        return {
          success: false,
          message: response.data.ResponseDescription || "M-Pesa payment failed",
        };
      }
    } catch (error) {
      logger.error(
        "M-Pesa payment error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message:
          error.response?.data?.errorMessage ||
          "M-Pesa payment processing failed",
      };
    }
  }

  /**
   * Get M-Pesa access token
   * @returns {Promise<string|null>} Access token
   */
  static async getMpesaAccessToken() {
    try {
      const auth = Buffer.from(
        `${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`
      ).toString("base64");

      const tokenUrl =
        env.MPESA_ENVIRONMENT === "production"
          ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
          : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

      const response = await axios.get(tokenUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      return response.data.access_token;
    } catch (error) {
      logger.error("Error getting M-Pesa access token:", error.message);
      return null;
    }
  }

  /**
   * Query M-Pesa transaction status
   * @param {string} checkoutRequestId - Checkout request ID from STK push
   * @returns {Promise<Object>} Transaction status
   */
  static async queryMpesaTransaction(checkoutRequestId) {
    try {
      const accessToken = await this.getMpesaAccessToken();

      if (!accessToken) {
        return {
          success: false,
          message: "Failed to authenticate with M-Pesa",
        };
      }

      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, "")
        .slice(0, -3);

      const password = Buffer.from(
        env.MPESA_SHORTCODE + env.MPESA_PASSKEY + timestamp
      ).toString("base64");

      const queryUrl =
        env.MPESA_ENVIRONMENT === "production"
          ? "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query"
          : "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";

      const response = await axios.post(
        queryUrl,
        {
          BusinessShortCode: env.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info("M-Pesa query response:", response.data);

      return {
        success: response.data.ResultCode === "0",
        status: response.data.ResultCode,
        message: response.data.ResultDesc,
        data: response.data,
      };
    } catch (error) {
      logger.error(
        "M-Pesa query error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message: "Failed to query transaction status",
      };
    }
  }

  /**
   * Process payment via PayPal
   * @param {Object} params - Payment parameters
   * @param {string} params.userId - User ID
   * @param {number} params.amount - Amount
   * @param {string} params.currency - Currency code (KSH, USD, etc.)
   * @param {string} params.description - Payment description
   * @returns {Promise<Object>} Payment result
   */
  static async processPayPalPayment({ userId, amount, currency, description }) {
    try {
      logger.info(
        `Processing PayPal payment for user ${userId}: ${amount} ${currency}`
      );

      // Convert KSH to USD for PayPal (approximate conversion: 1 USD = 130 KSH)
      let paypalAmount = amount;
      let paypalCurrency = currency;

      if (currency === "KSH") {
        paypalAmount = (amount / 130).toFixed(2);
        paypalCurrency = "USD";
      }

      // Create PayPal order
      const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `SUB_${userId}`,
            description: description || "Nile Premium Subscription",
            amount: {
              currency_code: paypalCurrency,
              value: paypalAmount,
            },
          },
        ],
        application_context: {
          brand_name: "Nile Premium",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
          return_url: `${env.FRONTEND_URL}/subscription/success`,
          cancel_url: `${env.FRONTEND_URL}/subscription/cancel`,
        },
      });

      const order = await paypalClient().execute(request);

      logger.info("PayPal order created:", order.result.id);

      // Get approval URL
      const approvalUrl = order.result.links.find(
        (link) => link.rel === "approve"
      )?.href;

      return {
        success: true,
        subscriptionId: `sub_paypal_${Date.now()}`,
        transactionId: order.result.id,
        message: "PayPal payment initiated. Please complete payment.",
        paymentDetails: {
          orderId: order.result.id,
          approvalUrl,
          status: order.result.status,
        },
      };
    } catch (error) {
      logger.error("PayPal payment error:", error);
      return {
        success: false,
        message: error.message || "PayPal payment processing failed",
      };
    }
  }

  /**
   * Capture PayPal payment after user approval
   * @param {string} orderId - PayPal order ID
   * @returns {Promise<Object>} Capture result
   */
  static async capturePayPalPayment(orderId) {
    try {
      const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(
        orderId
      );
      request.requestBody({});

      const capture = await paypalClient().execute(request);

      logger.info("PayPal payment captured:", capture.result.id);

      return {
        success: capture.result.status === "COMPLETED",
        captureId: capture.result.id,
        status: capture.result.status,
        data: capture.result,
      };
    } catch (error) {
      logger.error("PayPal capture error:", error);
      return {
        success: false,
        message: "Failed to capture PayPal payment",
      };
    }
  }

  /**
   * Cancel recurring payment (placeholder for future implementation)
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Cancellation result
   */
  static async cancelRecurring(subscriptionId) {
    try {
      logger.info("Cancelling recurring payment for:", subscriptionId);

      // TODO: Implement recurring payment cancellation based on payment provider
      // For M-Pesa: No recurring payments, so nothing to cancel
      // For PayPal: Would need to implement subscription API

      return { success: true, message: "Recurring payment cancelled" };
    } catch (error) {
      logger.error("Error cancelling recurring payment:", error);
      return { success: false, message: "Failed to cancel recurring payment" };
    }
  }

  /**
   * Verify payment callback (for M-Pesa callbacks)
   * @param {Object} callbackData - Callback data from payment provider
   * @returns {Promise<Object>} Verification result
   */
  static async verifyPaymentCallback(callbackData) {
    try {
      logger.info("Verifying payment callback:", callbackData);

      // M-Pesa callback structure
      if (callbackData.Body?.stkCallback) {
        const callback = callbackData.Body.stkCallback;
        const resultCode = callback.ResultCode;

        if (resultCode === 0) {
          // Payment successful
          const metadata = callback.CallbackMetadata?.Item || [];
          const amount = metadata.find((item) => item.Name === "Amount")?.Value;
          const mpesaReceiptNumber = metadata.find(
            (item) => item.Name === "MpesaReceiptNumber"
          )?.Value;
          const transactionDate = metadata.find(
            (item) => item.Name === "TransactionDate"
          )?.Value;
          const phoneNumber = metadata.find(
            (item) => item.Name === "PhoneNumber"
          )?.Value;

          return {
            success: true,
            verified: true,
            transactionId: mpesaReceiptNumber,
            amount,
            phoneNumber,
            transactionDate,
            checkoutRequestId: callback.CheckoutRequestID,
          };
        } else {
          return {
            success: false,
            verified: true,
            message: callback.ResultDesc,
          };
        }
      }

      // PayPal webhook structure would be different
      // TODO: Implement PayPal webhook verification

      return {
        success: false,
        verified: false,
        message: "Unknown callback format",
      };
    } catch (error) {
      logger.error("Error verifying payment callback:", error);
      return {
        success: false,
        verified: false,
        message: "Failed to verify payment callback",
      };
    }
  }

  /**
   * Process payment via Stripe
   * @param {Object} params - Payment parameters
   * @param {string} params.userId - User ID
   * @param {number} params.amount - Amount in KSH
   * @param {string} params.currency - Currency code (KSH, USD, etc.)
   * @param {string} params.description - Payment description
   * @returns {Promise<Object>} Payment result
   */
  static async processStripePayment({ userId, amount, currency, description }) {
    try {
      logger.info(
        `Processing Stripe payment for user ${userId}: ${amount} ${currency}`
      );

      // Initialize Stripe
      const Stripe = require("stripe");
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);

      // Convert KSH to USD (approximate: 1 USD = 130 KSH)
      const amountInUSD = currency === "KSH" ? amount / 130 : amount;
      const stripeCurrency =
        currency === "KSH" ? "usd" : currency.toLowerCase();

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: stripeCurrency,
              product_data: {
                name: "Nile Premium Subscription",
                description: description || "1 Month Premium Access",
              },
              unit_amount: Math.round(amountInUSD * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          userId: userId,
          subscriptionType: "premium",
          originalAmount: amount,
          originalCurrency: currency,
        },
        success_url: `${env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.FRONTEND_URL}/subscription/cancel`,
        client_reference_id: userId,
      });

      logger.info(`Stripe checkout session created: ${session.id}`);

      return {
        success: true,
        subscriptionId: `sub_stripe_${Date.now()}`,
        transactionId: session.id,
        message: "Stripe checkout session created successfully",
        paymentDetails: {
          checkoutSessionId: session.id,
          checkoutUrl: session.url,
        },
      };
    } catch (error) {
      logger.error("Stripe payment error:", error.message);
      return {
        success: false,
        message: error.message || "Stripe payment processing failed",
      };
    }
  }

  static async processStripeMobilePayment({
    userId,
    amount,
    currency,
    description,
  }) {
    try {
      logger.info(
        `Processing Stripe mobile payment for user ${userId}: ${amount} ${currency}`
      );

      // Initialize Stripe
      const Stripe = require("stripe");
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);

      // Convert KSH to USD (approximate: 1 USD = 130 KSH)
      const amountInUSD = currency === "KSH" ? amount / 130 : amount;
      const stripeCurrency =
        currency === "KSH" ? "usd" : currency.toLowerCase();
      const amountInCents = Math.round(amountInUSD * 100);

      // Create or retrieve customer
      let customer;
      try {
        // Try to find existing customer by user ID
        const customers = await stripe.customers.search({
          query: `metadata['userId']:'${userId}'`,
          limit: 1,
        });

        if (customers.data.length > 0) {
          customer = customers.data[0];
        } else {
          // Create new customer
          customer = await stripe.customers.create({
            metadata: {
              userId: userId,
            },
          });
        }
      } catch (customerError) {
        logger.error("Error managing Stripe customer:", customerError);
        throw new Error("Failed to create customer");
      }

      // Create PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: stripeCurrency,
        customer: customer.id,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: userId,
          subscriptionType: "premium",
          originalAmount: amount,
          originalCurrency: currency,
        },
        description: description || "Nile Premium Subscription - 1 Month",
      });

      // Create ephemeral key for customer
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: "2024-06-20" }
      );

      logger.info(`Stripe PaymentIntent created: ${paymentIntent.id}`);

      return {
        success: true,
        subscriptionId: `sub_stripe_mobile_${Date.now()}`,
        transactionId: paymentIntent.id,
        message: "Stripe PaymentIntent created successfully",
        paymentDetails: {
          paymentIntent: paymentIntent.client_secret,
          ephemeralKey: ephemeralKey.secret,
          customer: customer.id,
          publishableKey: env.STRIPE_PUBLISHABLE_KEY,
        },
      };
    } catch (error) {
      logger.error("Stripe mobile payment error:", error.message);
      return {
        success: false,
        message: error.message || "Stripe mobile payment processing failed",
      };
    }
  }
}

module.exports = PaymentService;
