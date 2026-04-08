// services/financialAuditLogger.js
const { db } = require("./appwriteService");
const { env } = require("../src/env");
const { ID } = require("node-appwrite");

/**
 * Financial Audit Logger
 *
 * Specialized audit logging for financial operations with:
 * 1. Commission rate changes
 * 2. Commission calculations
 * 3. GMV adjustments
 * 4. Platform settings modifications
 * 5. Batch operations
 *
 * Features:
 * - Immutable audit records
 * - Detailed context capture
 * - Compliance-ready formatting
 * - Automatic timestamping
 * - Error recovery logging
 */
class FinancialAuditLogger {
  constructor() {
    this.databaseId = env.APPWRITE_DATABASE_ID;
    this.auditCollectionId = env.APPWRITE_AUDIT_LOGS_COLLECTION_ID;

    // Event types for financial auditing
    this.eventTypes = {
      COMMISSION_RATE_CHANGE: "commission_rate_change",
      COMMISSION_CALCULATION: "commission_calculation",
      BATCH_COMMISSION_CALC: "batch_commission_calculation",
      GMV_ADJUSTMENT: "gmv_adjustment",
      PLATFORM_SETTING_CHANGE: "platform_setting_change",
      ORDER_FINANCIAL_UPDATE: "order_financial_update",
      ANALYTICS_ACCESS: "analytics_access",
      FINANCIAL_EXPORT: "financial_export",
    };

    // Severity levels
    this.severityLevels = {
      LOW: "low",
      MEDIUM: "medium",
      HIGH: "high",
      CRITICAL: "critical",
    };
  }

  /**
   * Log commission rate change with full context
   *
   * @param {Object} changeData - Commission rate change data
   */
  async logCommissionRateChange(changeData) {
    try {
      const auditEvent = {
        eventType: this.eventTypes.COMMISSION_RATE_CHANGE,
        severity: this.severityLevels.HIGH,
        userId: changeData.adminUserId,
        userRole: "admin",
        entityType: "PlatformSettings",
        entityId: changeData.settingId || "commission_rate",
        action: "UPDATE",
        timestamp: new Date().toISOString(),

        // Financial-specific data
        financialData: {
          previousCommissionRate: changeData.previousRate,
          newCommissionRate: changeData.newRate,
          percentageChange: (
            ((changeData.newRate - changeData.previousRate) /
              changeData.previousRate) *
            100
          ).toFixed(2),
          effectiveDate: changeData.effectiveFrom,
          businessJustification: changeData.reason,
          basisPointsChange: Math.round(
            (changeData.newRate - changeData.previousRate) * 10000,
          ),
        },

        // Compliance data
        complianceData: {
          approvedBy: changeData.adminUserId,
          requiresNotification: true,
          retroactiveImpact: false,
          documentationRequired: true,
          reviewRequired: changeData.newRate > 0.1, // Flag rates above 10%
        },

        // Context
        context: {
          changeId: changeData.changeId,
          ipAddress: changeData.ipAddress,
          userAgent: changeData.userAgent,
          requestId: changeData.requestId,
          sessionId: changeData.sessionId,
        },

        // Metadata
        metadata: {
          systemVersion: process.env.npm_package_version || "1.0.0",
          environment: process.env.NODE_ENV || "production",
          source: "commission_management_api",
          correlationId: changeData.changeId,
        },
      };

      await this.writeAuditLog(auditEvent);

      console.log(
        `🔍 FINANCIAL AUDIT: Commission rate changed from ${(changeData.previousRate * 100).toFixed(2)}% to ${(changeData.newRate * 100).toFixed(2)}% by ${changeData.adminUserId}`,
      );
    } catch (error) {
      console.error(
        "❌ Financial audit logging failed for commission rate change:",
        error,
      );
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }

  /**
   * Log commission calculation for order
   *
   * @param {Object} calculationData - Commission calculation data
   */
  async logCommissionCalculation(calculationData) {
    try {
      const auditEvent = {
        eventType: this.eventTypes.COMMISSION_CALCULATION,
        severity: this.severityLevels.MEDIUM,
        userId: "system",
        userRole: "system",
        entityType: "Order",
        entityId: calculationData.orderId,
        action: "CALCULATE_COMMISSION",
        timestamp: new Date().toISOString(),

        // Financial calculation data
        financialData: {
          orderAmount: calculationData.orderAmount,
          commissionRate: calculationData.commissionRate,
          commissionAmount: calculationData.commissionAmount,
          calculationMethod: "order_total_multiply",
          rateSource: "platform_settings",
          gmvImpact: calculationData.orderAmount,
          vendorId: calculationData.vendorId,
        },

        // Order context
        orderContext: {
          paymentMethod: calculationData.paymentMethod,
          orderStatus: calculationData.orderStatus,
          currency: calculationData.currency || "KES",
          eligibilityCheck: calculationData.eligibilityCheck || "passed",
        },

        // Calculation metadata
        metadata: {
          calculatedAt: calculationData.calculatedAt,
          precision: "2_decimal_places",
          algorithm: "standard_percentage",
          source: "automated_order_completion",
        },
      };

      await this.writeAuditLog(auditEvent);
    } catch (error) {
      console.error(
        "❌ Financial audit logging failed for commission calculation:",
        error,
      );
    }
  }

  /**
   * Log TOT report generation for KRA compliance
   *
   * @param {Object} reportData - TOT report generation data
   */
  async logTOTReportGeneration(reportData) {
    try {
      const auditEvent = {
        eventType: "tot_report_generation",
        severity: this.severityLevels.HIGH,
        userId: reportData.generatedBy,
        userRole: "admin",
        entityType: "FinancialReport",
        entityId: reportData.reportId,
        action: "GENERATE_TOT_REPORT",
        timestamp: new Date().toISOString(),

        // TOT report specific data
        totReportData: {
          reportingPeriod: reportData.reportingPeriod,
          totalOrders: reportData.totalOrders,
          totalCommission: reportData.totalCommission,
          totRate: 0.03, // 3% TOT rate
          totAmount: reportData.totAmount,
          currency: "KES",
          auditChecksum: reportData.auditChecksum,
        },

        // KRA compliance data
        complianceData: {
          reportType: "Turnover Tax (TOT)",
          kraCompliance: true,
          calculationMethod: "SUM(commission_earned) * 0.03",
          dataSource: "orders collection",
          immutableRecord: true,
          auditTrailRequired: true,
        },

        // Context
        context: {
          ipAddress: reportData.ipAddress,
          userAgent: reportData.userAgent,
          generationTrigger: "admin_request",
          systemTimestamp: new Date().toISOString(),
        },

        // Metadata for audit trail
        metadata: {
          precision: "2_decimal_places",
          roundingMethod: "Math.round",
          reportFormat: "database_document",
          exportReady: true,
        },
      };

      await this.writeAuditLog(auditEvent);
      console.log(`✅ TOT report generation logged for period ${reportData.reportingPeriod}`);
    } catch (error) {
      console.error(
        "❌ Financial audit logging failed for TOT report generation:",
        error,
      );
    }
  }

  /**
   * Log financial export operations (CSV, PDF for KRA)
   *
   * @param {Object} exportData - Export operation data
   */
  async logFinancialExport(exportData) {
    try {
      const auditEvent = {
        eventType: "financial_export",
        severity: exportData.severity || this.severityLevels.HIGH,
        userId: exportData.exportedBy,
        userRole: "admin",
        entityType: "FinancialReport",
        entityId: exportData.reportingPeriod,
        action: "EXPORT_FINANCIAL_DATA",
        timestamp: new Date().toISOString(),

        // Export specific data
        exportData: {
          exportType: exportData.exportType,
          reportingPeriod: exportData.reportingPeriod,
          format: exportData.format,
          fileSize: exportData.fileSize || null,
          downloadInitiated: true,
        },

        // Security and compliance
        securityData: {
          sensitiveDataExport: true,
          kraComplianceExport: exportData.exportType === "TOT_REPORT",
          accessLevel: "finance_admin",
          auditRequired: true,
          retentionRequired: true,
        },

        // Context
        context: {
          ipAddress: exportData.ipAddress,
          userAgent: exportData.userAgent,
          exportTrigger: "manual_download",
          browserDownload: exportData.format === "csv",
        },

        // Metadata
        metadata: {
          exportMethod: "direct_download",
          governmentFiling: exportData.exportType === "TOT_REPORT",
          complianceLevel: "kra_ready",
        },
      };

      await this.writeAuditLog(auditEvent);
      console.log(`✅ Financial export logged: ${exportData.exportType} for ${exportData.reportingPeriod}`);
    } catch (error) {
      console.error(
        "❌ Financial audit logging failed for export operation:",
        error,
      );
    }
  }

  /**
   * Log unauthorized financial access attempts
   *
   * @param {Object} accessData - Access attempt data
   */
  async logUnauthorizedFinancialAccess(accessData) {
    try {
      const auditEvent = {
        eventType: "unauthorized_financial_access",
        severity: this.severityLevels.CRITICAL,
        userId: accessData.userId || "unknown",
        userRole: accessData.userRole || "unknown",
        entityType: "FinancialSystem",
        entityId: "access_control",
        action: "UNAUTHORIZED_ACCESS_ATTEMPT",
        timestamp: new Date().toISOString(),

        // Security incident data
        securityIncident: {
          attemptedEndpoint: accessData.attemptedEndpoint,
          requiredRole: "admin_or_finance",
          actualRole: accessData.userRole,
          accessDenied: true,
          threatLevel: "medium",
        },

        // Context
        context: {
          ipAddress: accessData.ipAddress,
          userAgent: accessData.userAgent,
          sessionId: accessData.sessionId || null,
          referrer: accessData.referrer || null,
        },

        // Response taken
        responseData: {
          httpStatus: 403,
          messageShown: "Access denied. Finance role required.",
          loggedToSecurity: true,
          userNotified: false,
        },

        // Metadata
        metadata: {
          securityEvent: true,
          requiresReview: true,
          alertGenerated: false, // Could trigger alerts in production
        },
      };

      await this.writeAuditLog(auditEvent);
      console.log(`🚨 Unauthorized financial access attempt logged from ${accessData.ipAddress}`);
    } catch (error) {
      console.error(
        "❌ Failed to log unauthorized financial access attempt:",
        error,
      );
    }
  }

  /**
   * Log batch commission calculation operation
   *
   * @param {Object} batchData - Batch operation data
   */
  async logBatchCommissionCalculation(batchData) {
    try {
      const auditEvent = {
        eventType: this.eventTypes.BATCH_COMMISSION_CALC,
        severity: this.severityLevels.HIGH,
        userId: batchData.adminUserId,
        userRole: "admin",
        entityType: "Orders",
        entityId: "batch_operation",
        action: "BATCH_CALCULATE_COMMISSION",
        timestamp: new Date().toISOString(),

        // Batch operation data
        batchData: {
          orderCount: batchData.orderIds.length,
          successfulCalculations: batchData.successful,
          failedCalculations: batchData.failed,
          skippedOrders: batchData.skipped,
          totalCommissionCalculated: batchData.totalCommissionAmount || 0,
          executionTimeMs: batchData.executionTime,
          options: batchData.options,
        },

        // Risk assessment
        riskAssessment: {
          isLargeOperation: batchData.orderIds.length > 50,
          requiresManagerApproval: batchData.orderIds.length > 100,
          potentialImpact:
            batchData.totalCommissionAmount > 10000 ? "high" : "medium",
        },

        // Compliance
        complianceData: {
          executedBy: batchData.adminUserId,
          businessJustification:
            batchData.reason || "Batch commission recalculation",
          approvalRequired: false,
          documentationComplete: true,
        },

        metadata: {
          operationId: batchData.operationId,
          correlationId: ID.unique(),
          source: "batch_commission_api",
        },
      };

      await this.writeAuditLog(auditEvent);

      console.log(
        `🔍 FINANCIAL AUDIT: Batch commission calculation completed - ${batchData.successful} successful, ${batchData.failed} failed by ${batchData.adminUserId}`,
      );
    } catch (error) {
      console.error(
        "❌ Financial audit logging failed for batch operation:",
        error,
      );
    }
  }

  /**
   * Log analytics access for compliance
   *
   * @param {Object} accessData - Analytics access data
   */
  async logAnalyticsAccess(accessData) {
    try {
      const auditEvent = {
        eventType: this.eventTypes.ANALYTICS_ACCESS,
        severity: this.severityLevels.LOW,
        userId: accessData.userId,
        userRole: accessData.userRole || "admin",
        entityType: "Analytics",
        entityId: "financial_dashboard",
        action: "VIEW",
        timestamp: new Date().toISOString(),

        // Access details
        accessDetails: {
          reportType: accessData.reportType || "commission_analytics",
          dateRange: accessData.dateRange,
          vendorFilter: accessData.vendorId || "all",
          dataPointsAccessed: accessData.dataPoints || 0,
          sensitiveDataAccessed: true,
        },

        // Context
        context: {
          ipAddress: accessData.ipAddress,
          userAgent: accessData.userAgent,
          sessionId: accessData.sessionId,
          requestId: accessData.requestId,
        },

        metadata: {
          accessTime: accessData.accessTime,
          cacheHit: accessData.fromCache || false,
          source: "commission_analytics_api",
        },
      };

      await this.writeAuditLog(auditEvent);
    } catch (error) {
      console.error(
        "❌ Financial audit logging failed for analytics access:",
        error,
      );
    }
  }

  /**
   * Write audit log to database
   *
   * @param {Object} auditEvent - Audit event data
   */
  async writeAuditLog(auditEvent) {
    try {
      // Add standard audit fields
      const auditRecord = {
        ...auditEvent,
        id: ID.unique(),
        recordedAt: new Date().toISOString(),
        recordVersion: "1.0",
        immutable: true,

        // Add checksums for integrity (simplified)
        checksum: this.calculateChecksum(auditEvent),

        // Retention and compliance
        retentionPeriod: "7_years", // Adjust based on your compliance requirements
        confidentialityLevel: this.getConfidentialityLevel(
          auditEvent.eventType,
        ),

        // System metadata
        systemMetadata: {
          nodeVersion: process.version,
          platformVersion: process.platform,
          hostname: require("os").hostname(),
          processId: process.pid,
        },
      };

      // Write to audit collection if configured
      if (this.auditCollectionId) {
        await db.createDocument(
          this.databaseId,
          this.auditCollectionId,
          auditRecord.id,
          auditRecord,
        );
      } else {
        // Fallback to console logging with structured format
        console.log("🔍 AUDIT LOG:", JSON.stringify(auditRecord, null, 2));
      }
    } catch (error) {
      // Critical: If audit logging fails, we need to know
      console.error("❌ CRITICAL: Audit log write failed:", error);

      // Emergency fallback - write to file or external service
      try {
        const fs = require("fs");
        const auditLogFile = "./emergency_audit.log";
        fs.appendFileSync(auditLogFile, JSON.stringify(auditEvent) + "\n");
        console.log("📝 Emergency audit log written to file");
      } catch (fileError) {
        console.error(
          "❌ CRITICAL: Emergency audit logging also failed:",
          fileError,
        );
      }
    }
  }

  /**
   * Calculate simple checksum for audit integrity
   */
  calculateChecksum(data) {
    const crypto = require("crypto");
    const dataString = JSON.stringify(data);
    return crypto.createHash("md5").update(dataString).digest("hex");
  }

  /**
   * Determine confidentiality level based on event type
   */
  getConfidentialityLevel(eventType) {
    const highConfidentiality = [
      this.eventTypes.COMMISSION_RATE_CHANGE,
      this.eventTypes.BATCH_COMMISSION_CALC,
      this.eventTypes.GMV_ADJUSTMENT,
    ];

    return highConfidentiality.includes(eventType) ? "high" : "medium";
  }

  /**
   * Query audit logs for compliance reporting
   *
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Audit log entries
   */
  async queryAuditLogs(filters = {}) {
    try {
      if (!this.auditCollectionId) {
        throw new Error("Audit collection not configured");
      }

      const queries = [];

      if (filters.eventType) {
        queries.push(Query.equal("eventType", filters.eventType));
      }

      if (filters.userId) {
        queries.push(Query.equal("userId", filters.userId));
      }

      if (filters.startDate) {
        queries.push(Query.greaterThanEqual("timestamp", filters.startDate));
      }

      if (filters.endDate) {
        queries.push(Query.lessThanEqual("timestamp", filters.endDate));
      }

      const response = await db.listDocuments(
        this.databaseId,
        this.auditCollectionId,
        queries,
      );

      return response.documents;
    } catch (error) {
      console.error("Error querying audit logs:", error);
      throw error;
    }
  }

  /**
   * Generate audit summary report
   *
   * @param {Object} params - Report parameters
   * @returns {Promise<Object>} Audit summary
   */
  async generateAuditSummary(params = {}) {
    try {
      const { startDate, endDate, eventTypes } = params;

      const auditLogs = await this.queryAuditLogs({
        startDate,
        endDate,
      });

      // Filter by event types if specified
      const filteredLogs = eventTypes
        ? auditLogs.filter((log) => eventTypes.includes(log.eventType))
        : auditLogs;

      // Generate summary statistics
      const eventTypeCounts = {};
      const userActivity = {};
      const severityCounts = {};

      filteredLogs.forEach((log) => {
        // Count by event type
        eventTypeCounts[log.eventType] =
          (eventTypeCounts[log.eventType] || 0) + 1;

        // Count by user
        userActivity[log.userId] = (userActivity[log.userId] || 0) + 1;

        // Count by severity
        severityCounts[log.severity] = (severityCounts[log.severity] || 0) + 1;
      });

      return {
        period: {
          startDate: startDate || "All time",
          endDate: endDate || "All time",
        },
        summary: {
          totalEvents: filteredLogs.length,
          eventTypeCounts,
          userActivity,
          severityCounts,
          highSeverityEvents:
            (severityCounts.high || 0) + (severityCounts.critical || 0),
        },
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error generating audit summary:", error);
      throw error;
    }
  }
}

// Export singleton instance
const financialAuditLogger = new FinancialAuditLogger();

module.exports = {
  FinancialAuditLogger,
  financialAuditLogger,
};
