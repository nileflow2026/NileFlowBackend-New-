// utils/performanceMonitor.js
/**
 * Performance monitoring utilities for payment systems
 */

class PerformanceMonitor {
  static timers = new Map();

  /**
   * Start timing an operation
   */
  static startTimer(operationId) {
    this.timers.set(operationId, {
      start: process.hrtime.bigint(),
      operation: operationId,
    });
  }

  /**
   * End timing and get duration
   */
  static endTimer(operationId) {
    const timer = this.timers.get(operationId);
    if (!timer) {
      return null;
    }

    const end = process.hrtime.bigint();
    const duration = Number(end - timer.start) / 1_000_000; // Convert to milliseconds

    this.timers.delete(operationId);

    return {
      operation: timer.operation,
      duration,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Monitor database operation performance
   */
  static async monitorDbOperation(operation, operationName) {
    const timerId = `db_${operationName}_${Date.now()}`;
    this.startTimer(timerId);

    try {
      const result = await operation();
      const timing = this.endTimer(timerId);

      if (timing.duration > 1000) {
        // Log slow operations (>1s)
        console.warn(
          `Slow database operation detected: ${operationName} took ${timing.duration}ms`
        );
      }

      return result;
    } catch (error) {
      this.endTimer(timerId);
      throw error;
    }
  }

  /**
   * Monitor payment processing performance
   */
  static async monitorPaymentOperation(operation, paymentMethod, userId) {
    const timerId = `payment_${paymentMethod}_${userId}_${Date.now()}`;
    this.startTimer(timerId);

    try {
      const result = await operation();
      const timing = this.endTimer(timerId);

      // Log payment processing times
      console.log(
        `Payment processing: ${paymentMethod} for user ${userId} completed in ${timing.duration}ms`
      );

      if (timing.duration > 5000) {
        // Alert on slow payments (>5s)
        console.warn(
          `Slow payment processing: ${paymentMethod} took ${timing.duration}ms`
        );
      }

      return result;
    } catch (error) {
      const timing = this.endTimer(timerId);
      console.error(
        `Payment processing failed: ${paymentMethod} for user ${userId} after ${
          timing?.duration || "unknown"
        }ms`
      );
      throw error;
    }
  }

  /**
   * Clean up old timers (memory management)
   */
  static cleanup() {
    const now = Date.now();
    for (const [id, timer] of this.timers.entries()) {
      // Remove timers older than 5 minutes (probably stuck)
      if (now - Number(timer.start / BigInt(1_000_000)) > 300000) {
        console.warn(`Removing stuck timer: ${id}`);
        this.timers.delete(id);
      }
    }
  }
}

// Cleanup stuck timers every 5 minutes
setInterval(() => {
  PerformanceMonitor.cleanup();
}, 5 * 60 * 1000);

module.exports = PerformanceMonitor;
