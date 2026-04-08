// utils/paymentLogger.js
const logger = require("./logger");

/**
 * Specialized payment logger with structured logging and security
 */
class PaymentLogger {
  /**
   * Log payment attempt with sanitized data
   */
  static logPaymentAttempt(method, userId, amount, metadata = {}) {
    logger.info("Payment attempt initiated", {
      method,
      userId,
      amount: parseFloat(amount),
      currency: metadata.currency || "KES",
      orderId: metadata.orderId,
      timestamp: new Date().toISOString(),
      userAgent: metadata.userAgent,
      ip: metadata.ip,
    });
  }

  /**
   * Log payment success with transaction details
   */
  static logPaymentSuccess(
    method,
    userId,
    amount,
    transactionId,
    metadata = {}
  ) {
    logger.info("Payment completed successfully", {
      method,
      userId,
      amount: parseFloat(amount),
      transactionId,
      orderId: metadata.orderId,
      currency: metadata.currency || "KES",
      processingTime: metadata.processingTime,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log payment failure with error details
   */
  static logPaymentFailure(method, userId, amount, error, metadata = {}) {
    logger.error("Payment failed", {
      method,
      userId,
      amount: parseFloat(amount),
      errorCode: error.code,
      errorMessage: error.message,
      orderId: metadata.orderId,
      currency: metadata.currency || "KES",
      timestamp: new Date().toISOString(),
      // Don't log sensitive payment details
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }

  /**
   * Log webhook processing with security details
   */
  static logWebhookReceived(provider, eventType, eventId, verified = false) {
    logger.info("Webhook received", {
      provider,
      eventType,
      eventId,
      verified,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log webhook processing result
   */
  static logWebhookProcessed(
    provider,
    eventType,
    eventId,
    success,
    error = null
  ) {
    const logData = {
      provider,
      eventType,
      eventId,
      success,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      logData.error = {
        message: error.message,
        code: error.code,
      };
    }

    if (success) {
      logger.info("Webhook processed successfully", logData);
    } else {
      logger.error("Webhook processing failed", logData);
    }
  }

  /**
   * Log suspicious payment activity
   */
  static logSuspiciousActivity(type, userId, details, metadata = {}) {
    logger.warn("Suspicious payment activity detected", {
      type,
      userId,
      details,
      ip: metadata.ip,
      userAgent: metadata.userAgent,
      timestamp: new Date().toISOString(),
      severity: "HIGH",
    });
  }

  /**
   * Log rate limiting events
   */
  static logRateLimit(userId, endpoint, attempts, windowMs) {
    logger.warn("Payment rate limit exceeded", {
      userId,
      endpoint,
      attempts,
      windowMs,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log database transaction events
   */
  static logDatabaseTransaction(
    operation,
    collection,
    documentId,
    success,
    error = null
  ) {
    const logData = {
      operation,
      collection,
      documentId,
      success,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      logData.error = error.message;
    }

    if (success) {
      logger.debug("Database transaction completed", logData);
    } else {
      logger.error("Database transaction failed", logData);
    }
  }

  /**
   * Sanitize payment data for logging (remove sensitive information)
   */
  static sanitizeForLogging(data) {
    const sanitized = { ...data };

    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.cardNumber;
    delete sanitized.cvv;
    delete sanitized.expiryMonth;
    delete sanitized.expiryYear;
    delete sanitized.apiKey;
    delete sanitized.secretKey;
    delete sanitized.webhook_secret;

    // Mask partial phone numbers and emails
    if (sanitized.phoneNumber) {
      sanitized.phoneNumber = sanitized.phoneNumber.replace(
        /(\d{3})\d{6}(\d{2})/,
        "$1****$2"
      );
    }

    if (sanitized.email) {
      sanitized.email = sanitized.email.replace(/(.{2}).*@/, "$1***@");
    }

    return sanitized;
  }
}

module.exports = PaymentLogger;
