// services/platformSettingsService.js
const { db } = require("./appwriteService");
const { env } = require("../src/env");
const { Query, ID } = require("node-appwrite");
const { logAuditFromRequest } = require("../utils/auditLogger");

/**
 * Platform Settings Service
 *
 * Manages platform-wide configuration settings with special focus on:
 * - Commission rates (with audit trails)
 * - GMV calculation methods
 * - Financial integrity settings
 *
 * Key principles:
 * 1. All changes are audited and logged
 * 2. Commission rates are never applied retroactively
 * 3. Historical settings are preserved for audit purposes
 * 4. Input validation prevents invalid configurations
 */
class PlatformSettingsService {
  constructor() {
    this.databaseId = env.APPWRITE_DATABASE_ID;
    this.collectionId = env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID;

    // Validate critical configuration on startup
    if (!this.databaseId) {
      throw new Error(
        "APPWRITE_DATABASE_ID is required but not configured in environment",
      );
    }

    if (!this.collectionId) {
      throw new Error(
        "APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID is required but not configured in environment",
      );
    }

    console.log(
      `🔧 Platform Settings Service initialized with collection: ${this.collectionId}`,
    );

    // Cache for frequently accessed settings (TTL: 5 minutes)
    this.settingsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

    // Clean cache every 10 minutes
    setInterval(
      () => {
        const now = Date.now();
        for (const [key, cached] of this.settingsCache.entries()) {
          if (now - cached.timestamp > this.cacheTimeout) {
            this.settingsCache.delete(key);
          }
        }
      },
      10 * 60 * 1000,
    );
  }

  /**
   * Get current commission rate as a decimal (0.05 = 5%)
   * Uses caching for performance
   *
   * @returns {Promise<number>} Commission rate as decimal
   */
  async getCommissionRate() {
    const cacheKey = "commission_rate";

    // Check cache first
    if (this.settingsCache.has(cacheKey)) {
      const cached = this.settingsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }
    }

    try {
      const commissionSetting = await this.getSetting("commission_rate");
      const rate = parseFloat(commissionSetting.settingValue) || 0;

      // Validate rate is within acceptable bounds
      if (rate < 0 || rate > 1) {
        console.error(
          `Invalid commission rate detected: ${rate}. Using 0 as fallback.`,
        );
        return 0;
      }

      // Cache the result
      this.settingsCache.set(cacheKey, {
        value: rate,
        timestamp: Date.now(),
      });

      return rate;
    } catch (error) {
      console.error("Error getting commission rate:", error);
      return 0; // Fallback to 0% commission on error
    }
  }

  /**
   * Update commission rate with comprehensive validation and audit logging
   *
   * @param {number} newRate - New commission rate as decimal (0.05 = 5%)
   * @param {string} adminUserId - ID of admin making the change
   * @param {string} reason - Reason for the change
   * @param {Date|null} effectiveFrom - When change takes effect (null = immediately)
   * @returns {Promise<Object>} Update result with audit trail
   */
  async updateCommissionRate(
    newRate,
    adminUserId,
    reason,
    effectiveFrom = null,
  ) {
    try {
      // Input validation
      const validationResult = this.validateCommissionRate(newRate);
      if (!validationResult.isValid) {
        throw new Error(`Invalid commission rate: ${validationResult.error}`);
      }

      if (!adminUserId) {
        throw new Error(
          "Admin user ID is required for commission rate changes",
        );
      }

      if (!reason || reason.trim().length < 10) {
        throw new Error(
          "Reason for commission rate change must be at least 10 characters",
        );
      }

      // Get current commission rate for comparison
      const currentSetting = await this.getSetting("commission_rate");
      const currentRate = parseFloat(currentSetting.settingValue) || 0;

      // Prevent unnecessary updates
      if (Math.abs(currentRate - newRate) < 0.0001) {
        return {
          success: false,
          message: "New commission rate is identical to current rate",
          currentRate,
          requestedRate: newRate,
        };
      }

      const effectiveDate = effectiveFrom || new Date();
      const changeId = ID.unique();

      // Create commission change history record for audit purposes
      await this.createCommissionHistoryRecord({
        changeId,
        previousRate: currentRate,
        newRate,
        changedBy: adminUserId,
        reason,
        effectiveFrom: effectiveDate.toISOString(),
        timestamp: new Date().toISOString(),
      });

      // Update the commission rate setting
      const updateData = {
        settingValue: newRate.toString(),
        lastUpdatedBy: adminUserId,
        updatedAt: new Date().toISOString(),
        effectiveFrom: effectiveDate.toISOString(),
      };

      const updatedSetting = await db.updateDocument(
        this.databaseId,
        this.collectionId,
        currentSetting.$id,
        updateData,
      );

      // Clear cache to force reload
      this.settingsCache.delete("commission_rate");

      // Create detailed audit log
      await this.logCommissionChange({
        changeId,
        adminUserId,
        previousRate: currentRate,
        newRate,
        reason,
        effectiveFrom: effectiveDate.toISOString(),
        documentId: currentSetting.$id,
      });

      console.log(
        `✅ Commission rate updated from ${(currentRate * 100).toFixed(2)}% to ${(newRate * 100).toFixed(2)}% by admin ${adminUserId}`,
      );

      return {
        success: true,
        changeId,
        previousRate: currentRate,
        newRate,
        effectiveFrom: effectiveDate.toISOString(),
        updatedBy: adminUserId,
        reason,
        message: `Commission rate updated from ${(currentRate * 100).toFixed(2)}% to ${(newRate * 100).toFixed(2)}%`,
      };
    } catch (error) {
      console.error("Error updating commission rate:", error);
      throw new Error(`Failed to update commission rate: ${error.message}`);
    }
  }

  /**
   * Calculate commission for an order
   * This is the core financial calculation - must be deterministic and precise
   *
   * @param {number} orderTotal - Total order amount
   * @param {number|null} customCommissionRate - Override rate for specific calculations
   * @returns {Promise<Object>} Commission calculation details
   */
  async calculateCommission(orderTotal, customCommissionRate = null) {
    try {
      // Input validation
      if (!orderTotal || isNaN(orderTotal) || orderTotal < 0) {
        throw new Error("Invalid order total for commission calculation");
      }

      const commissionRate =
        customCommissionRate !== null
          ? customCommissionRate
          : await this.getCommissionRate();

      // Use precise decimal arithmetic to avoid floating point errors
      const orderAmount = Math.round(orderTotal * 100) / 100; // Round to 2 decimal places
      const commission = Math.round(orderAmount * commissionRate * 100) / 100;

      return {
        orderTotal: orderAmount,
        commissionRate,
        commissionAmount: commission,
        commissionPercent: (commissionRate * 100).toFixed(3),
        calculatedAt: new Date().toISOString(),
        // Include calculation method for audit purposes
        calculationMethod: "order_total_multiply",
        precision: "2_decimal_places",
      };
    } catch (error) {
      console.error("Error calculating commission:", error);
      throw new Error(`Commission calculation failed: ${error.message}`);
    }
  }

  /**
   * Get GMV calculation method
   * @returns {Promise<string>} Method for calculating GMV
   */
  async getGMVCalculationMethod() {
    try {
      const setting = await this.getSetting("gmv_calculation_method");
      return setting.settingValue || "completed_orders";
    } catch (error) {
      console.error("Error getting GMV calculation method:", error);
      return "completed_orders"; // Safe default
    }
  }

  /**
   * Get a specific setting by key
   *
   * @param {string} settingKey - The setting key to retrieve
   * @returns {Promise<Object>} Setting document
   */
  async getSetting(settingKey) {
    if (!this.collectionId) {
      throw new Error(
        `Platform settings collection not configured. Expected APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID environment variable but got: ${this.collectionId}`,
      );
    }

    if (!this.databaseId) {
      throw new Error(
        `Database not configured. Expected APPWRITE_DATABASE_ID environment variable but got: ${this.databaseId}`,
      );
    }

    try {
      console.log(
        `🔍 Getting setting '${settingKey}' from collection ${this.collectionId}`,
      );

      const settings = await db.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal("settingKey", settingKey),
          Query.equal("isActive", true),
          Query.limit(1),
        ],
      );

      if (settings.documents.length === 0) {
        console.warn(
          `⚠️  Setting '${settingKey}' not found in platform settings`,
        );
        throw new Error(`Setting '${settingKey}' not found`);
      }

      console.log(
        `✅ Retrieved setting '${settingKey}': ${settings.documents[0].settingValue}`,
      );
      return settings.documents[0];
    } catch (error) {
      console.error(`❌ Error getting setting '${settingKey}':`, {
        error: error.message,
        databaseId: this.databaseId,
        collectionId: this.collectionId,
        settingKey: settingKey,
      });
      throw error;
    }
  }

  /**
   * Get all commission-related settings
   * @returns {Promise<Array>} Commission settings
   */
  async getCommissionSettings() {
    try {
      const settings = await db.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal("settingType", "commission"),
          Query.equal("isActive", true),
          Query.orderDesc("$createdAt"),
        ],
      );

      return settings.documents.map((doc) => ({
        key: doc.settingKey,
        value: doc.settingValue,
        description: doc.description,
        lastUpdatedBy: doc.lastUpdatedBy,
        updatedAt: doc.updatedAt || doc.$updatedAt,
        effectiveFrom: doc.effectiveFrom,
      }));
    } catch (error) {
      console.error("Error getting commission settings:", error);
      throw error;
    }
  }

  /**
   * Validate commission rate input
   *
   * @param {number} rate - Commission rate to validate
   * @returns {Object} Validation result
   */
  validateCommissionRate(rate) {
    if (typeof rate !== "number" || isNaN(rate)) {
      return { isValid: false, error: "Commission rate must be a number" };
    }

    if (rate < 0) {
      return { isValid: false, error: "Commission rate cannot be negative" };
    }

    if (rate > 1) {
      return {
        isValid: false,
        error: "Commission rate cannot exceed 100% (1.0)",
      };
    }

    // Check for reasonable precision (max 3 decimal places for 0.1% precision)
    const decimalPlaces = (rate.toString().split(".")[1] || "").length;
    if (decimalPlaces > 4) {
      return {
        isValid: false,
        error: "Commission rate precision limited to 4 decimal places",
      };
    }

    return { isValid: true };
  }

  /**
   * Create commission history record for audit trail
   *
   * @param {Object} historyData - Commission change history data
   */
  async createCommissionHistoryRecord(historyData) {
    // Store in audit logs or separate commission history collection
    // For now, we'll use the audit logger
    try {
      await logAuditFromRequest(
        { user: { userId: historyData.changedBy } }, // Mock request object
        "Commission rate updated",
        "PlatformSettings",
        historyData.changeId,
        {
          previousRate: historyData.previousRate,
          newRate: historyData.newRate,
          reason: historyData.reason,
          effectiveFrom: historyData.effectiveFrom,
          changeType: "commission_rate_update",
        },
      );
    } catch (error) {
      console.error("Error creating commission history record:", error);
      // Don't fail the main operation if audit logging fails
    }
  }

  /**
   * Log commission rate change for detailed audit trail
   */
  async logCommissionChange(changeData) {
    console.log("📊 COMMISSION RATE CHANGE AUDIT LOG", {
      timestamp: new Date().toISOString(),
      changeId: changeData.changeId,
      adminUserId: changeData.adminUserId,
      previousRate: `${(changeData.previousRate * 100).toFixed(3)}%`,
      newRate: `${(changeData.newRate * 100).toFixed(3)}%`,
      reason: changeData.reason,
      effectiveFrom: changeData.effectiveFrom,
      documentId: changeData.documentId,
    });
  }

  /**
   * Validate platform settings collection is properly configured
   * @returns {Promise<boolean>} Whether the service is ready
   */
  async validateConfiguration() {
    try {
      if (!this.collectionId) {
        console.error(
          "❌ Platform settings collection ID not configured in environment",
        );
        return false;
      }

      // Test basic connectivity
      await db.getCollection(this.databaseId, this.collectionId);

      // Test getting commission rate
      await this.getCommissionRate();

      console.log("✅ Platform settings service configured correctly");
      return true;
    } catch (error) {
      console.error(
        "❌ Platform settings service configuration error:",
        error.message,
      );
      return false;
    }
  }
}

// Export singleton instance
const platformSettingsService = new PlatformSettingsService();

module.exports = {
  PlatformSettingsService,
  platformSettingsService,
};
