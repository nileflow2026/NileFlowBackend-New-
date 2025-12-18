// utils/sanitizer.js
const xss = require("xss");
const validator = require("validator");
const DOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const logger = require("./logger");

const window = new JSDOM("").window;
const dompurify = DOMPurify(window);

class Sanitizer {
  constructor() {
    // XSS filter configuration
    this.xssOptions = {
      whiteList: {}, // Empty, means filter out all tags
      stripIgnoreTag: true, // Filter out all HTML not in the whitelist
      stripIgnoreTagBody: ["script"], // Strip script tags and their content
      allowCommentTag: false,
    };

    // Input validation patterns
    this.patterns = {
      username: /^[a-zA-Z0-9_]{3,30}$/,
      password:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/,
      idempotencyKey:
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    };
  }

  /**
   * Sanitize input data recursively
   */
  sanitize(data, options = {}) {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === "string") {
      return this.sanitizeString(data, options);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item, options));
    }

    if (typeof data === "object" && !(data instanceof Date)) {
      const sanitized = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          sanitized[key] = this.sanitize(data[key], options);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Sanitize a string with multiple layers of protection
   */
  sanitizeString(str, options = {}) {
    let sanitized = str;

    // Trim whitespace
    sanitized = sanitized.trim();

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

    // Apply XSS filtering
    sanitized = xss(sanitized, this.xssOptions);

    // Additional DOM purification if needed
    if (options.allowBasicHtml) {
      sanitized = dompurify.sanitize(sanitized, {
        ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
        ALLOWED_ATTR: [],
      });
    }

    // Escape SQL special characters
    sanitized = this.escapeSql(sanitized);

    return sanitized;
  }

  /**
   * Escape SQL special characters
   */
  escapeSql(str) {
    if (typeof str !== "string") return str;

    return str.replace(/['"\\\x00\n\r\u2028\u2029]/g, (char) => {
      switch (char) {
        case "'":
          return "''";
        case '"':
          return '""';
        case "\\":
          return "\\\\";
        case "\x00":
          return "\\0";
        case "\n":
          return "\\n";
        case "\r":
          return "\\r";
        case "\u2028":
          return "\\u2028";
        case "\u2029":
          return "\\u2029";
        default:
          return char;
      }
    });
  }

  /**
   * Validate and sanitize email
   */
  validateEmail(email) {
    if (!email) {
      throw new Error("Email is required");
    }

    const sanitized = this.sanitize(email);

    if (!validator.isEmail(sanitized)) {
      throw new Error("Invalid email format");
    }

    // Normalize email (lowercase, remove dots in gmail, etc.)
    const normalized = validator.normalizeEmail(sanitized, {
      all_lowercase: true,
      gmail_lowercase: true,
      gmail_remove_dots: true,
      gmail_remove_subaddress: true,
      outlookdotcom_lowercase: true,
      yahoo_lowercase: true,
      icloud_lowercase: true,
    });

    return normalized || sanitized.toLowerCase();
  }

  /**
   * Validate and sanitize password
   */
  validatePassword(password) {
    if (!password) {
      throw new Error("Password is required");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    if (password.length > 128) {
      throw new Error("Password must be less than 128 characters");
    }

    if (!this.patterns.password.test(password)) {
      throw new Error(
        "Password must contain at least one uppercase letter, " +
          "one lowercase letter, one number, and one special character"
      );
    }

    // Check for common passwords (you'd expand this list)
    const commonPasswords = [
      "password",
      "123456",
      "qwerty",
      "admin",
      "welcome",
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      throw new Error("Password is too common");
    }

    // Check for repeated characters
    if (/(.)\1{3,}/.test(password)) {
      throw new Error("Password contains too many repeated characters");
    }

    return this.sanitize(password);
  }

  /**
   * Validate and sanitize username
   */
  validateUsername(username) {
    if (!username) {
      throw new Error("Username is required");
    }

    const sanitized = this.sanitize(username);

    if (!this.patterns.username.test(sanitized)) {
      throw new Error(
        "Username must be 3-30 characters and contain only letters, numbers, and underscores"
      );
    }

    // Check for reserved usernames
    const reserved = [
      "admin",
      "administrator",
      "root",
      "system",
      "support",
      "help",
      "info",
      "contact",
      "service",
      "api",
    ];

    if (reserved.includes(sanitized.toLowerCase())) {
      throw new Error("This username is reserved");
    }

    return sanitized;
  }

  /**
   * Validate and sanitize phone number
   */
  validatePhone(phone) {
    if (!phone) return null;

    const sanitized = this.sanitize(phone);
    const digits = sanitized.replace(/\D/g, "");

    if (digits.length < 10 || digits.length > 15) {
      throw new Error("Invalid phone number length");
    }

    // E.164 format validation
    if (!validator.isMobilePhone(sanitized, "any", { strictMode: true })) {
      throw new Error("Invalid phone number format");
    }

    return digits;
  }

  /**
   * Validate HTTP headers
   */
  sanitizeHeaders(headers) {
    const sanitized = {};

    const allowedHeaders = [
      "user-agent",
      "accept",
      "accept-language",
      "accept-encoding",
      "content-type",
      "authorization",
      "x-forwarded-for",
      "x-real-ip",
      "x-csrf-token",
      "x-transaction-id",
      "x-api-key",
      "x-request-id",
    ];

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();

      if (allowedHeaders.includes(lowerKey) && typeof value === "string") {
        sanitized[key] = this.sanitizeString(value);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize URL parameters
   */
  sanitizeQuery(query) {
    const sanitized = {};

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string") {
        sanitized[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === "string" ? this.sanitizeString(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Log sanitization attempts (for security monitoring)
   */
  logSanitization(operation, original, sanitized, context = {}) {
    if (original !== sanitized) {
      logger.audit("INPUT_SANITIZED", context.userId || "anonymous", {
        operation,
        original: original?.substring?.(0, 100) || original,
        sanitized: sanitized?.substring?.(0, 100) || sanitized,
        ...context,
      });
    }
  }
}

// Singleton instance
module.exports = new Sanitizer();
