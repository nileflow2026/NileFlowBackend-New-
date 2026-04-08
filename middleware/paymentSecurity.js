// middleware/paymentSecurity.js
const logger = require("../utils/logger");
const { env } = require("../src/env");

/**
 * Payment security middleware - validates payment requests and prevents fraud
 */
const paymentSecurity = {
  /**
   * Validate payment amount and prevent manipulation
   */
  validatePaymentAmount: (req, res, next) => {
    try {
      const { amount, totalAmount, cart } = req.body;
      const paymentAmount = amount || totalAmount;

      if (!paymentAmount || paymentAmount <= 0) {
        return res.status(400).json({
          error: "Invalid payment amount",
          code: "INVALID_AMOUNT",
        });
      }

      // Prevent excessive amounts (basic fraud protection)
      const maxAmount = 1000000; // 1M KES
      if (paymentAmount > maxAmount) {
        logger.warn(
          `Suspicious large payment attempt: ${paymentAmount} from user ${req.user?.userId}`
        );
        return res.status(400).json({
          error: "Payment amount exceeds maximum limit",
          code: "AMOUNT_TOO_LARGE",
        });
      }

      // Server-side cart validation if cart provided
      if (cart && Array.isArray(cart)) {
        const {
          shipping = 0,
          deliveryFee = 0,
          tax = 0,
          discount = 0,
          serviceFee = 0,
          premiumDiscount = 0,
          // Alternative field names
          shippingFee = 0,
          totalShipping = 0,
          validDiscountAmount = 0,
        } = req.body;

        // Calculate subtotal from cart items
        const calculatedSubtotal = cart.reduce((sum, item) => {
          const price = parseFloat(item.price || 0);
          const quantity = parseInt(item.quantity || 1);

          if (price < 0 || quantity < 1 || quantity > 100) {
            throw new Error(
              `Invalid item: price=${price}, quantity=${quantity}`
            );
          }

          return sum + price * quantity;
        }, 0);

        // Use the highest shipping value provided (in case multiple fields are used)
        const totalShippingCost = Math.max(
          parseFloat(shipping),
          parseFloat(deliveryFee),
          parseFloat(shippingFee),
          parseFloat(totalShipping)
        );

        // Use the highest discount value provided
        const totalDiscountAmount = Math.max(
          parseFloat(discount),
          parseFloat(validDiscountAmount),
          parseFloat(premiumDiscount)
        );

        // Calculate total with all fees and discounts
        const calculatedTotal =
          calculatedSubtotal +
          totalShippingCost +
          parseFloat(tax) +
          parseFloat(serviceFee) -
          totalDiscountAmount;

        // Allow small discrepancy for floating point precision
        const tolerance = 0.01;
        if (Math.abs(calculatedTotal - paymentAmount) > tolerance) {
          logger.warn(
            `Payment amount mismatch: calculated=${calculatedTotal}, provided=${paymentAmount}`,
            {
              calculatedSubtotal,
              totalShippingCost,
              tax: parseFloat(tax),
              totalDiscountAmount,
              serviceFee: parseFloat(serviceFee),
              calculatedTotal,
              providedAmount: paymentAmount,
              requestBody: req.body, // Log full request for debugging
            }
          );
          return res.status(400).json({
            error: "Payment amount does not match cart total",
            code: "AMOUNT_MISMATCH",
            calculated: calculatedTotal,
            provided: paymentAmount,
          });
        }
      }

      next();
    } catch (error) {
      logger.error("Payment amount validation error:", error);
      return res.status(400).json({
        error: "Invalid payment data",
        code: "VALIDATION_ERROR",
      });
    }
  },

  /**
   * Rate limiting for payment attempts per user
   */
  paymentRateLimit: (() => {
    const attempts = new Map();
    const maxAttempts = 10;
    const windowMs = 60 * 1000; // 1 minute

    return (req, res, next) => {
      const userId = req.user?.userId;
      if (!userId) return next();

      const now = Date.now();
      const userAttempts = attempts.get(userId) || [];

      // Clean old attempts
      const recentAttempts = userAttempts.filter(
        (time) => now - time < windowMs
      );

      if (recentAttempts.length >= maxAttempts) {
        logger.warn(`Payment rate limit exceeded for user ${userId}`);
        return res.status(429).json({
          error: "Too many payment attempts. Please wait before trying again.",
          code: "RATE_LIMIT_EXCEEDED",
        });
      }

      recentAttempts.push(now);
      attempts.set(userId, recentAttempts);

      next();
    };
  })(),

  /**
   * Validate user authorization for payment
   */
  validateUserAuthorization: (req, res, next) => {
    const { userId } = req.body;
    const authenticatedUserId = req.user?.userId;

    if (!authenticatedUserId) {
      return res.status(401).json({
        error: "User authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    // Ensure user can only make payments for themselves
    if (userId && userId !== authenticatedUserId) {
      logger.warn(
        `User ${authenticatedUserId} attempted to make payment for user ${userId}`
      );
      return res.status(403).json({
        error: "Cannot make payments for other users",
        code: "UNAUTHORIZED_PAYMENT",
      });
    }

    next();
  },

  /**
   * Sanitize payment input data
   */
  sanitizePaymentData: (req, res, next) => {
    try {
      const { amount, totalAmount, phoneNumber, customerEmail } = req.body;

      // Sanitize amount
      if (amount) {
        req.body.amount = Math.round(parseFloat(amount) * 100) / 100; // Round to 2 decimals
      }
      if (totalAmount) {
        req.body.totalAmount = Math.round(parseFloat(totalAmount) * 100) / 100;
      }

      // Sanitize phone number
      if (phoneNumber) {
        req.body.phoneNumber = phoneNumber.replace(/[^\d+]/g, ""); // Only digits and +
      }

      // Sanitize email
      if (customerEmail) {
        req.body.customerEmail = customerEmail.toLowerCase().trim();
      }

      next();
    } catch (error) {
      logger.error("Payment data sanitization error:", error);
      return res.status(400).json({
        error: "Invalid payment data format",
        code: "SANITIZATION_ERROR",
      });
    }
  },
};

module.exports = paymentSecurity;
