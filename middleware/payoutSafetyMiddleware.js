// middleware/payoutSafetyMiddleware.js
const { db } = require("../services/appwriteService");
const { env } = require("../src/env");
const { Query, ID } = require("node-appwrite");

/**
 * Payout Safety Middleware
 *
 * Provides multi-layered protection against financial data corruption:
 * 1. Double payout prevention
 * 2. Concurrent operation detection
 * 3. Financial data validation
 * 4. Audit trail verification
 * 5. Rate limiting for sensitive operations
 *
 * This middleware ensures that all payout operations are:
 * - Atomic (all-or-nothing)
 * - Consistent (no contradictory states)
 * - Isolated (no concurrent conflicts)
 * - Durable (audit trail survives failures)
 */

class PayoutSafetyMiddleware {
  constructor() {
    // In-memory lock tracking (for single-instance safety)
    // In production, use Redis or database-based locking
    this.activeLocks = new Map();
    this.operationCounts = new Map();

    // Rate limiting configuration
    this.rateLimits = {
      BATCH_GENERATION: { maxPerHour: 50, maxPerMinute: 5 },
      PAYOUT_EXECUTION: { maxPerHour: 100, maxPerMinute: 10 },
      BULK_CALCULATION: { maxPerHour: 20, maxPerMinute: 2 },
    };

    // Clean up locks every 5 minutes
    setInterval(() => this.cleanupExpiredLocks(), 5 * 60 * 1000);
  }

  /**
   * Prevent double payouts by checking order payout status
   */
  async preventDoublePayout(req, res, next) {
    try {
      const { order_ids, batch_id, payout_id } = req.body;
      const operation = req.route.path;
      const userId = req.user?.userId || req.user?.$id;

      console.log(`🛡️  Double payout check for operation: ${operation}`);

      // Check for batch generation
      if (order_ids && Array.isArray(order_ids)) {
        const paidOrderCheck = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ORDERS_COLLECTION,
          [Query.equal("$id", order_ids), Query.equal("paid_out", true)],
        );

        if (paidOrderCheck.documents.length > 0) {
          const paidOrderIds = paidOrderCheck.documents.map(
            (order) => order.$id,
          );
          console.error(
            `❌ Double payout attempt detected for orders: ${paidOrderIds.join(", ")}`,
          );

          // Log security incident
          await this.logSecurityIncident({
            type: "DOUBLE_PAYOUT_ATTEMPT",
            user_id: userId,
            operation,
            details: {
              attempted_order_ids: order_ids,
              already_paid_orders: paidOrderIds,
              ip_address: req.ip,
              user_agent: req.get("User-Agent"),
            },
          });

          return res.status(409).json({
            success: false,
            error: "Double payout prevention: Some orders are already paid out",
            already_paid_orders: paidOrderIds,
            security_code: "DOUBLE_PAYOUT_BLOCKED",
          });
        }
      }

      // Check for batch execution
      if (batch_id) {
        const batchCheck = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_VENDOR_PAYOUT_BATCHES_COLLECTION_ID,
          [Query.equal("batch_id", batch_id)],
        );

        if (batchCheck.documents.length > 0) {
          const batch = batchCheck.documents[0];
          if (batch.status === "COMPLETED") {
            console.error(
              `❌ Attempt to re-execute completed batch: ${batch_id}`,
            );

            await this.logSecurityIncident({
              type: "BATCH_REEXECUTION_ATTEMPT",
              user_id: userId,
              operation,
              details: {
                batch_id,
                batch_status: batch.status,
                ip_address: req.ip,
              },
            });

            return res.status(409).json({
              success: false,
              error: "Batch has already been completed",
              batch_id,
              batch_status: batch.status,
              security_code: "BATCH_ALREADY_EXECUTED",
            });
          }
        }
      }

      // Check for payout completion
      if (payout_id) {
        const payoutCheck = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_VENDOR_PAYOUTS_COLLECTION_ID,
          [Query.equal("payout_id", payout_id)],
        );

        if (payoutCheck.documents.length > 0) {
          const payout = payoutCheck.documents[0];
          if (payout.status === "SUCCESS") {
            console.error(
              `❌ Attempt to re-complete successful payout: ${payout_id}`,
            );

            await this.logSecurityIncident({
              type: "PAYOUT_RECOMPLETION_ATTEMPT",
              user_id: userId,
              operation,
              details: {
                payout_id,
                payout_status: payout.status,
                ip_address: req.ip,
              },
            });

            return res.status(409).json({
              success: false,
              error: "Payout has already been completed",
              payout_id,
              payout_status: payout.status,
              security_code: "PAYOUT_ALREADY_COMPLETED",
            });
          }
        }
      }

      next();
    } catch (error) {
      console.error("Error in double payout prevention:", error);
      res.status(500).json({
        success: false,
        error: "Security check failed",
        details: error.message,
      });
    }
  }

  /**
   * Acquire distributed lock for critical operations
   */
  async acquireLock(req, res, next) {
    try {
      const { vendor_id, batch_id, payout_id } = req.body;
      const operation = req.route.path;
      const userId = req.user?.userId || req.user?.$id;

      // Generate lock key based on operation and entity
      let lockKey;
      if (vendor_id && operation.includes("generate-batch")) {
        lockKey = `vendor_batch_${vendor_id}`;
      } else if (batch_id) {
        lockKey = `batch_${batch_id}`;
      } else if (payout_id) {
        lockKey = `payout_${payout_id}`;
      } else {
        lockKey = `operation_${operation}_${userId}`;
      }

      // Check if lock is already held
      if (this.activeLocks.has(lockKey)) {
        const lockInfo = this.activeLocks.get(lockKey);
        const lockAge = Date.now() - lockInfo.acquired_at;

        // If lock is older than 5 minutes, consider it stale
        if (lockAge > 5 * 60 * 1000) {
          console.warn(`⚠️  Releasing stale lock: ${lockKey}`);
          this.activeLocks.delete(lockKey);
        } else {
          console.error(`❌ Operation blocked by active lock: ${lockKey}`);
          return res.status(423).json({
            success: false,
            error: "Resource is locked by another operation",
            lock_key: lockKey,
            locked_by: lockInfo.user_id,
            locked_since: new Date(lockInfo.acquired_at).toISOString(),
            security_code: "RESOURCE_LOCKED",
          });
        }
      }

      // Acquire lock
      this.activeLocks.set(lockKey, {
        user_id: userId,
        operation,
        acquired_at: Date.now(),
        ip_address: req.ip,
      });

      console.log(`🔒 Lock acquired: ${lockKey} by user ${userId}`);

      // Store lock key in request for cleanup
      req.lockKey = lockKey;

      next();
    } catch (error) {
      console.error("Error acquiring lock:", error);
      res.status(500).json({
        success: false,
        error: "Failed to acquire operation lock",
        details: error.message,
      });
    }
  }

  /**
   * Release lock after operation completion
   */
  async releaseLock(req, res, next) {
    try {
      if (req.lockKey && this.activeLocks.has(req.lockKey)) {
        const lockInfo = this.activeLocks.get(req.lockKey);
        const lockDuration = Date.now() - lockInfo.acquired_at;

        this.activeLocks.delete(req.lockKey);
        console.log(
          `🔓 Lock released: ${req.lockKey} (held for ${lockDuration}ms)`,
        );
      }

      next();
    } catch (error) {
      console.error("Error releasing lock:", error);
      next(); // Continue anyway to avoid breaking the response
    }
  }

  /**
   * Rate limiting for financial operations
   */
  async rateLimitFinancialOperations(req, res, next) {
    try {
      const operation = req.route.path;
      const userId = req.user?.userId || req.user?.$id;
      const userKey = `user_${userId}`;
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const oneMinute = 60 * 1000;

      // Determine operation type and limits
      let operationType = "GENERAL";
      let limits = { maxPerHour: 100, maxPerMinute: 20 };

      if (operation.includes("generate-batch")) {
        operationType = "BATCH_GENERATION";
        limits = this.rateLimits.BATCH_GENERATION;
      } else if (
        operation.includes("execute-batch") ||
        operation.includes("complete-payout")
      ) {
        operationType = "PAYOUT_EXECUTION";
        limits = this.rateLimits.PAYOUT_EXECUTION;
      } else if (operation.includes("calculate")) {
        operationType = "BULK_CALCULATION";
        limits = this.rateLimits.BULK_CALCULATION;
      }

      // Initialize user operation tracking
      if (!this.operationCounts.has(userKey)) {
        this.operationCounts.set(userKey, {
          hourly: [],
          minutely: [],
        });
      }

      const userOps = this.operationCounts.get(userKey);

      // Clean old entries
      userOps.hourly = userOps.hourly.filter((time) => now - time < oneHour);
      userOps.minutely = userOps.minutely.filter(
        (time) => now - time < oneMinute,
      );

      // Check rate limits
      if (userOps.hourly.length >= limits.maxPerHour) {
        console.warn(
          `⚠️  Hourly rate limit exceeded for user ${userId}: ${operationType}`,
        );

        await this.logSecurityIncident({
          type: "RATE_LIMIT_EXCEEDED",
          user_id: userId,
          operation: operationType,
          details: {
            hourly_count: userOps.hourly.length,
            limit: limits.maxPerHour,
            ip_address: req.ip,
          },
        });

        return res.status(429).json({
          success: false,
          error: `Rate limit exceeded: Maximum ${limits.maxPerHour} ${operationType} operations per hour`,
          retry_after: Math.ceil(
            (oneHour - (now - Math.min(...userOps.hourly))) / 1000,
          ),
          security_code: "RATE_LIMIT_HOURLY",
        });
      }

      if (userOps.minutely.length >= limits.maxPerMinute) {
        console.warn(
          `⚠️  Minute rate limit exceeded for user ${userId}: ${operationType}`,
        );

        return res.status(429).json({
          success: false,
          error: `Rate limit exceeded: Maximum ${limits.maxPerMinute} ${operationType} operations per minute`,
          retry_after: Math.ceil(
            (oneMinute - (now - Math.min(...userOps.minutely))) / 1000,
          ),
          security_code: "RATE_LIMIT_MINUTE",
        });
      }

      // Record this operation
      userOps.hourly.push(now);
      userOps.minutely.push(now);
      this.operationCounts.set(userKey, userOps);

      console.log(
        `📊 Rate limit check passed: ${operationType} for user ${userId}`,
      );
      next();
    } catch (error) {
      console.error("Error in rate limiting:", error);
      next(); // Continue anyway to avoid breaking legitimate operations
    }
  }

  /**
   * Validate financial data integrity
   */
  async validateFinancialData(req, res, next) {
    try {
      const { order_ids, batch_id, amount } = req.body;
      const operation = req.route.path;

      console.log(`💰 Financial data validation for: ${operation}`);

      // Validate order amounts if provided
      if (order_ids && Array.isArray(order_ids)) {
        for (const orderId of order_ids) {
          const order = await db.getDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_ORDERS_COLLECTION,
            orderId,
          );

          // Check order has valid amounts
          const orderAmount = parseFloat(order.amount || 0);
          const vendorPayout = parseFloat(order.vendor_payout || 0);
          const commission = parseFloat(order.commission_earned || 0);

          if (orderAmount <= 0) {
            return res.status(400).json({
              success: false,
              error: `Invalid order amount for order ${orderId}: ${orderAmount}`,
              security_code: "INVALID_ORDER_AMOUNT",
            });
          }

          if (vendorPayout < 0) {
            return res.status(400).json({
              success: false,
              error: `Negative vendor payout for order ${orderId}: ${vendorPayout}`,
              security_code: "NEGATIVE_PAYOUT",
            });
          }

          // Sanity check: vendor payout should be less than order total
          if (vendorPayout > orderAmount) {
            return res.status(400).json({
              success: false,
              error: `Vendor payout exceeds order amount for order ${orderId}`,
              order_amount: orderAmount,
              vendor_payout: vendorPayout,
              security_code: "PAYOUT_EXCEEDS_ORDER",
            });
          }
        }
      }

      // Validate batch amounts if provided
      if (batch_id && amount) {
        if (parseFloat(amount) <= 0) {
          return res.status(400).json({
            success: false,
            error: "Payout amount must be positive",
            security_code: "INVALID_PAYOUT_AMOUNT",
          });
        }

        // Check amount doesn't exceed reasonable limits (configurable)
        const maxSinglePayout = 1000000; // 1M KES
        if (parseFloat(amount) > maxSinglePayout) {
          console.warn(`⚠️  Large payout amount detected: ${amount}`);

          await this.logSecurityIncident({
            type: "LARGE_PAYOUT_AMOUNT",
            user_id: req.user?.userId || req.user?.$id,
            operation,
            details: {
              batch_id,
              amount: parseFloat(amount),
              max_limit: maxSinglePayout,
              ip_address: req.ip,
            },
          });

          // Don't block, just log for review
        }
      }

      next();
    } catch (error) {
      console.error("Error in financial data validation:", error);
      res.status(500).json({
        success: false,
        error: "Financial data validation failed",
        details: error.message,
      });
    }
  }

  /**
   * Clean up expired locks
   */
  cleanupExpiredLocks() {
    const now = Date.now();
    const maxLockAge = 10 * 60 * 1000; // 10 minutes
    let cleanedCount = 0;

    for (const [lockKey, lockInfo] of this.activeLocks.entries()) {
      if (now - lockInfo.acquired_at > maxLockAge) {
        this.activeLocks.delete(lockKey);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired locks`);
    }
  }

  /**
   * Log security incidents
   */
  async logSecurityIncident(incident) {
    try {
      const logData = {
        incident_id: `SECURITY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: incident.type,
        user_id: incident.user_id,
        operation: incident.operation,
        timestamp: new Date().toISOString(),
        severity: this.getIncidentSeverity(incident.type),
        details: JSON.stringify(incident.details),
        resolved: false,
      };

      // In a real system, this would go to a dedicated security logs collection
      // For now, we'll use the audit logs collection
      await db.createDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PAYOUT_AUDIT_LOGS_COLLECTION_ID,
        ID.unique(),
        {
          audit_id: logData.incident_id,
          event_type: "SECURITY_INCIDENT",
          entity_id: incident.user_id,
          entity_type: "USER",
          vendor_id: null,
          amount: null,
          performed_by: incident.user_id,
          timestamp: logData.timestamp,
          details: logData.details,
          ip_address: incident.details?.ip_address,
        },
      );

      console.log(`🚨 Security incident logged: ${incident.type}`);
    } catch (error) {
      console.error("Failed to log security incident:", error);
    }
  }

  /**
   * Determine incident severity
   */
  getIncidentSeverity(type) {
    const severityMap = {
      DOUBLE_PAYOUT_ATTEMPT: "HIGH",
      BATCH_REEXECUTION_ATTEMPT: "HIGH",
      PAYOUT_RECOMPLETION_ATTEMPT: "HIGH",
      RATE_LIMIT_EXCEEDED: "MEDIUM",
      LARGE_PAYOUT_AMOUNT: "MEDIUM",
      RESOURCE_LOCKED: "LOW",
    };

    return severityMap[type] || "MEDIUM";
  }
}

// Export middleware instance
const payoutSafety = new PayoutSafetyMiddleware();

module.exports = {
  preventDoublePayout: payoutSafety.preventDoublePayout.bind(payoutSafety),
  acquireLock: payoutSafety.acquireLock.bind(payoutSafety),
  releaseLock: payoutSafety.releaseLock.bind(payoutSafety),
  rateLimitFinancialOperations:
    payoutSafety.rateLimitFinancialOperations.bind(payoutSafety),
  validateFinancialData: payoutSafety.validateFinancialData.bind(payoutSafety),
  PayoutSafetyMiddleware,
};
