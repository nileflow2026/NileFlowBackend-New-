// utils/logger.js
const winston = require("winston");
const { format } = winston;
const path = require("path");
const { env } = require("../src/env");

class Logger {
  constructor() {
    this.env = env.NODE_ENV || "development";

    // Custom format for structured logging
    const customFormat = format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.errors({ stack: true }),
      format.splat(),
      format.json(),
      format.printf(({ timestamp, level, message, ...meta }) => {
        const metaString = Object.keys(meta).length
          ? ` ${JSON.stringify(meta)}`
          : "";
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
      })
    );

    // Create logger instance
    this.logger = winston.createLogger({
      level: env.LOG_LEVEL || "info",
      format: customFormat,
      defaultMeta: { service: "nile-mart-api", env: this.env },
      transports: [
        // Console transport for all environments
        new winston.transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        }),
        // File transport for errors
        new winston.transports.File({
          filename: path.join(__dirname, "../logs/error.log"),
          level: "error",
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: path.join(__dirname, "../logs/combined.log"),
          maxsize: 5242880, // 5MB
          maxFiles: 10,
        }),
      ],
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(__dirname, "../logs/exceptions.log"),
        }),
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(__dirname, "../logs/rejections.log"),
        }),
      ],
    });

    // Development-specific overrides
    if (this.env === "development") {
      this.logger.add(
        new winston.transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        })
      );
    }
  }

  // Helper methods for different log levels
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  // HTTP request logging
  http(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id || "anonymous",
    };

    // Log 4xx and 5xx as warnings/errors
    if (res.statusCode >= 500) {
      this.error(`${req.method} ${req.originalUrl}`, meta);
    } else if (res.statusCode >= 400) {
      this.warn(`${req.method} ${req.originalUrl}`, meta);
    } else {
      this.info(`${req.method} ${req.originalUrl}`, meta);
    }
  }

  // Audit logging for security events
  audit(event, userId, details = {}) {
    this.info(`AUDIT: ${event}`, {
      userId,
      ...details,
      audit: true,
      timestamp: new Date().toISOString(),
    });
  }

  // Performance logging
  perf(operation, duration, meta = {}) {
    this.info(`PERF: ${operation} completed in ${duration}ms`, {
      operation,
      duration,
      ...meta,
    });
  }

  // Database query logging
  query(operation, duration, query = {}, meta = {}) {
    this.debug(`DB: ${operation}`, {
      operation,
      duration,
      query,
      ...meta,
    });
  }

  // Async context for request tracing
  withContext(context) {
    return {
      info: (message, meta = {}) => this.info(message, { ...context, ...meta }),
      error: (message, meta = {}) =>
        this.error(message, { ...context, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...context, ...meta }),
      debug: (message, meta = {}) =>
        this.debug(message, { ...context, ...meta }),
    };
  }
}

// Singleton instance
module.exports = new Logger();
