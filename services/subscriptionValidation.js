// services/subscriptionValidation.js
const { db } = require("./appwriteService");
const { env } = require("../src/env");
const { Query } = require("node-appwrite");
const logger = require("../utils/logger");

class SubscriptionValidationService {
  /**
   * Check if user has any pending subscriptions
   * Prevents duplicate subscription attempts
   */
  static async hasPendingSubscription(userId) {
    try {
      if (!env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID) {
        return false;
      }

      const subscriptions = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal("userId", userId),
          Query.equal("status", "pending"),
          Query.limit(1),
        ]
      );

      return subscriptions.documents.length > 0;
    } catch (error) {
      logger.error("Error checking pending subscriptions:", error);
      // Fail open - allow subscription attempt if check fails
      return false;
    }
  }

  /**
   * Validate subscription request
   */
  static validateSubscriptionRequest(req) {
    const { amount, currency, paymentMethod, phoneNumber } = req.body;
    const errors = [];

    // Validate amount
    if (!amount || typeof amount !== "number" || amount <= 0) {
      errors.push("Invalid amount");
    }

    if (amount !== 200) {
      errors.push("Subscription amount must be 200 KSH");
    }

    // Validate currency
    if (!currency || currency !== "KSH") {
      errors.push("Currency must be KSH");
    }

    // Validate payment method
    if (!paymentMethod || !["mpesa", "stripe"].includes(paymentMethod)) {
      errors.push("Payment method must be either 'mpesa' or 'stripe'");
    }

    // Validate phone number for M-Pesa
    if (paymentMethod === "mpesa") {
      if (!phoneNumber) {
        errors.push("Phone number is required for M-Pesa payments");
      } else {
        const cleanPhone = phoneNumber.replace(/\s+/g, "");
        const phoneRegex = /^(254|0|\+254)[17]\d{8}$/;
        if (!phoneRegex.test(cleanPhone)) {
          errors.push(
            "Invalid phone number format. Use 254XXXXXXXXX or 07XXXXXXXX"
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if user can subscribe (not already premium and active)
   */
  static async canSubscribe(user) {
    const isPremium = user.prefs?.isPremium || false;
    const expiresAt = user.prefs?.subscriptionExpiresAt;

    if (!isPremium) {
      return { canSubscribe: true };
    }

    if (!expiresAt) {
      // Premium but no expiry - inconsistent state
      logger.warn(`User ${user.$id} has isPremium but no expiresAt`);
      return { canSubscribe: true };
    }

    const expiryDate = new Date(expiresAt);
    const now = new Date();

    if (expiryDate > now) {
      return {
        canSubscribe: false,
        reason: "Already have an active subscription",
        expiresAt: expiresAt,
      };
    }

    return { canSubscribe: true };
  }

  /**
   * Sanitize payment metadata
   */
  static sanitizePaymentMetadata(data) {
    return {
      userId: String(data.userId || "").slice(0, 255),
      amount: Number(data.amount) || 0,
      currency: String(data.currency || "")
        .toUpperCase()
        .slice(0, 10),
      paymentMethod: String(data.paymentMethod || "")
        .toLowerCase()
        .slice(0, 50),
      phoneNumber: String(data.phoneNumber || "")
        .replace(/[^\d+]/g, "")
        .slice(0, 20),
      description: String(data.description || "")
        .slice(0, 500)
        .replace(/[<>]/g, ""),
    };
  }

  /**
   * Generate idempotency key for payment operations
   */
  static generateIdempotencyKey(userId, amount, timestamp) {
    const crypto = require("crypto");
    const data = `${userId}-${amount}-${timestamp}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}

module.exports = SubscriptionValidationService;
