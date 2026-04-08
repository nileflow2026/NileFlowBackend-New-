// services/totReportingService.js
const { db } = require("./appwriteService");
const { env } = require("../src/env");
const { Query, ID } = require("node-appwrite");
const crypto = require("crypto");

/**
 * Turnover Tax (TOT) Reporting Service
 *
 * KRA-compliant monthly TOT reporting for e-commerce marketplace.
 *
 * Key Requirements:
 * - Source of Truth: Orders collection with commission_earned field
 * - Tax Base: Platform commissions only (NOT vendor GMV)
 * - TOT Rate: 3% of total monthly commission earnings
 * - Deterministic: All calculations must be reproducible for audits
 * - Compliance: Immutable financial records for KRA
 *
 * Financial Principles:
 * - No modification of historical commission data
 * - Consistent rounding strategy (2 decimal places)
 * - Audit-ready calculation methodology
 * - Single source of truth for all calculations
 */
class TOTReportingService {
  constructor() {
    this.databaseId = env.APPWRITE_DATABASE_ID;
    this.ordersCollectionId = env.APPWRITE_ORDERS_COLLECTION;
    this.financialReportsCollectionId =
      env.APPWRITE_FINANCIAL_REPORTS_COLLECTION_ID;

    // KRA TOT rate (3% as of 2026)
    this.TOT_RATE = 0.03;

    // Precision for financial calculations
    this.PRECISION_DECIMAL_PLACES = 2;

    // Order statuses that qualify for commission calculation
    this.QUALIFYING_STATUSES = [
      "COMPLETED",
      "completed",
      "delivered",
      "succeeded",
    ];
  }

  /**
   * Generate monthly TOT report for specified period
   *
   * @param {string} month - Format: YYYY-MM (e.g., "2026-01")
   * @param {string} generatedBy - User ID generating the report
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Generated TOT report
   */
  async generateMonthlyTOTReport(month, generatedBy, options = {}) {
    try {
      console.log(`🧮 Generating TOT report for ${month}...`);

      // Validate month format
      if (!this.validateMonthFormat(month)) {
        throw new Error(
          `Invalid month format. Expected YYYY-MM, got: ${month}`,
        );
      }

      // Parse month for date calculations
      const { year, monthNum, periodStart, periodEnd } = this.parseMonth(month);

      // Check for existing report (prevent duplicates)
      const existingReport = await this.checkExistingReport("TOT", month);
      if (existingReport && !options.forceRegenerate) {
        throw new Error(
          `TOT report for ${month} already exists. Use forceRegenerate option to override.`,
        );
      }

      // Query completed orders for the month
      console.log(
        `🔍 Querying completed orders from ${periodStart.toISOString()} to ${periodEnd.toISOString()}...`,
      );

      const ordersQuery = await this.getCompletedOrdersForMonth(
        periodStart,
        periodEnd,
      );

      // Calculate commission aggregates with precision
      const commissionData = this.calculateCommissionAggregates(
        ordersQuery.documents,
      );

      // Calculate TOT with deterministic rounding
      const totCalculation = this.calculateTOT(commissionData.totalCommission);

      // Generate audit checksum for data integrity
      const auditChecksum = this.generateAuditChecksum({
        month,
        orders: ordersQuery.documents,
        commission: commissionData,
        tot: totCalculation,
      });

      // Prepare report document
      const reportData = {
        report_id: `TOT-${year}-${monthNum.toString().padStart(2, "0")}`,
        report_type: "TOT",
        reporting_period: month,
        report_month: monthNum,
        report_year: year,
        total_orders: commissionData.totalOrders,
        total_commission: this.roundToPrecision(commissionData.totalCommission),
        tax_rate: this.TOT_RATE,
        tax_amount: this.roundToPrecision(totCalculation.taxAmount),
        currency: "KES",
        calculation_method: `SUM(commission_earned) WHERE status IN [${this.QUALIFYING_STATUSES.join(", ")}] AND created_at BETWEEN '${periodStart.toISOString()}' AND '${periodEnd.toISOString()}'`,
        data_sources: JSON.stringify({
          orders_collection: this.ordersCollectionId,
          query_filters: [
            `status IN [${this.QUALIFYING_STATUSES.join(", ")}]`,
            `created_at >= '${periodStart.toISOString()}'`,
            `created_at < '${periodEnd.toISOString()}'`,
          ],
          commission_field: "commission_earned",
          qualifying_statuses: this.QUALIFYING_STATUSES,
          total_documents_processed: ordersQuery.total,
        }),
        generated_by: generatedBy,
        generated_at: new Date().toISOString(),
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        report_status: "generated",
        audit_checksum: auditChecksum,
        export_data: JSON.stringify({
          summary: {
            period: month,
            orders_count: commissionData.totalOrders,
            total_commission_kes: commissionData.totalCommission,
            tot_rate_percent: this.TOT_RATE * 100,
            tot_payable_kes: totCalculation.taxAmount,
            calculation_timestamp: new Date().toISOString(),
          },
          breakdown: commissionData.orderBreakdown,
          methodology: {
            commission_aggregation:
              "SUM of commission_earned field from completed orders",
            tax_calculation:
              "total_commission * 0.03 (rounded to 2 decimal places)",
            rounding_strategy: `All amounts rounded to ${this.PRECISION_DECIMAL_PLACES} decimal places using Math.round`,
            data_integrity_check: auditChecksum,
          },
        }),
        notes:
          options.notes ||
          `Automated TOT report generated for ${month}. Source: ${ordersQuery.total} total orders, ${commissionData.totalOrders} qualifying orders.`,
      };

      // Store report in database
      console.log(`💾 Storing TOT report in database...`);
      const savedReport = await db.createDocument(
        this.databaseId,
        this.financialReportsCollectionId,
        ID.unique(),
        reportData,
      );

      console.log(`✅ TOT report generated successfully for ${month}`);
      console.log(
        `📊 Summary: ${commissionData.totalOrders} orders, KES ${commissionData.totalCommission.toFixed(2)} commission, KES ${totCalculation.taxAmount.toFixed(2)} TOT`,
      );

      return {
        success: true,
        reportId: savedReport.$id,
        report: savedReport,
        summary: {
          period: month,
          totalOrders: commissionData.totalOrders,
          totalCommission: commissionData.totalCommission,
          totRate: this.TOT_RATE,
          totAmount: totCalculation.taxAmount,
          currency: "KES",
          generatedAt: new Date().toISOString(),
          auditChecksum: auditChecksum,
        },
      };
    } catch (error) {
      console.error(`❌ Error generating TOT report for ${month}:`, error);
      throw error;
    }
  }

  /**
   * Get existing TOT reports with filtering and pagination
   *
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Reports and metadata
   */
  async getTOTReports(filters = {}) {
    try {
      let queries = [Query.equal("report_type", "TOT")];

      // Apply filters
      if (filters.year) {
        queries.push(Query.equal("report_year", parseInt(filters.year)));
      }

      if (filters.month) {
        queries.push(Query.equal("report_month", parseInt(filters.month)));
      }

      if (filters.status) {
        queries.push(Query.equal("report_status", filters.status));
      }

      // Order by most recent first
      queries.push(Query.orderDesc("generated_at"));

      // Limit results
      if (filters.limit) {
        queries.push(Query.limit(parseInt(filters.limit)));
      }

      const reports = await db.listDocuments(
        this.databaseId,
        this.financialReportsCollectionId,
        queries,
      );

      return {
        success: true,
        reports: reports.documents,
        total: reports.total,
        filters: filters,
      };
    } catch (error) {
      console.error("❌ Error retrieving TOT reports:", error);
      throw error;
    }
  }

  /**
   * Get specific TOT report by period
   *
   * @param {string} month - Format: YYYY-MM
   * @returns {Promise<Object>} TOT report or null
   */
  async getTOTReportByMonth(month) {
    try {
      if (!this.validateMonthFormat(month)) {
        throw new Error(
          `Invalid month format. Expected YYYY-MM, got: ${month}`,
        );
      }

      const reports = await db.listDocuments(
        this.databaseId,
        this.financialReportsCollectionId,
        [
          Query.equal("report_type", "TOT"),
          Query.equal("reporting_period", month),
          Query.limit(1),
        ],
      );

      if (reports.documents.length === 0) {
        return null;
      }

      return reports.documents[0];
    } catch (error) {
      console.error(`❌ Error retrieving TOT report for ${month}:`, error);
      throw error;
    }
  }

  /**
   * Get completed orders for specific month with commission data
   *
   * @param {Date} startDate - Start of month (inclusive)
   * @param {Date} endDate - End of month (exclusive)
   * @returns {Promise<Object>} Orders query result
   */
  async getCompletedOrdersForMonth(startDate, endDate) {
    try {
      // Build query for completed orders with commission data
      const queries = [
        // Order status filter (completed orders only)
        Query.equal("orderStatus", "Completed"),

        // Date range filter (created_at field)
        Query.greaterThanEqual("$createdAt", startDate.toISOString()),
        Query.lessThan("$createdAt", endDate.toISOString()),

        // Must have valid commission data (greater than or equal to 0)
        Query.greaterThanEqual("commission_earned", 0),

        // Order by creation date for consistent processing
        Query.orderAsc("$createdAt"),

        // Limit to prevent memory issues (process in batches if needed)
        Query.limit(5000),
      ];

      console.log(`🔎 Querying orders with filters:`, {
        status: "Completed",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        hasCommission: true,
      });

      const ordersResult = await db.listDocuments(
        this.databaseId,
        this.ordersCollectionId,
        queries,
      );

      console.log(
        `📊 Found ${ordersResult.documents.length} completed orders with commission data`,
      );

      return ordersResult;
    } catch (error) {
      console.error("❌ Error querying completed orders:", error);
      throw error;
    }
  }

  /**
   * Calculate commission aggregates from orders with precision
   *
   * @param {Array} orders - Array of order documents
   * @returns {Object} Commission calculation results
   */
  calculateCommissionAggregates(orders) {
    console.log(
      `🧮 Calculating commission aggregates from ${orders.length} orders...`,
    );

    let totalCommission = 0;
    let totalOrders = 0;
    let validOrders = 0;
    let invalidOrders = 0;
    const orderBreakdown = [];

    for (const order of orders) {
      try {
        const commissionEarned = parseFloat(order.commission_earned || 0);

        // Validate commission value
        if (isNaN(commissionEarned) || commissionEarned < 0) {
          console.warn(
            `⚠️  Invalid commission for order ${order.$id}: ${order.commission_earned}`,
          );
          invalidOrders++;
          continue;
        }

        // Add to totals
        totalCommission += commissionEarned;
        totalOrders++;
        validOrders++;

        // Store breakdown for audit purposes
        orderBreakdown.push({
          orderId: order.$id,
          orderAmount: parseFloat(order.amount || 0),
          commissionEarned: commissionEarned,
          createdAt: order.$createdAt,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus || null,
        });
      } catch (error) {
        console.error(`❌ Error processing order ${order.$id}:`, error);
        invalidOrders++;
      }
    }

    console.log(`✅ Commission calculation complete:`, {
      totalOrders: totalOrders,
      validOrders: validOrders,
      invalidOrders: invalidOrders,
      totalCommission: totalCommission.toFixed(2),
    });

    return {
      totalOrders,
      validOrders,
      invalidOrders,
      totalCommission: this.roundToPrecision(totalCommission),
      orderBreakdown: orderBreakdown.slice(0, 100), // Limit breakdown size for storage
    };
  }

  /**
   * Calculate TOT (3% of commission) with deterministic rounding
   *
   * @param {number} totalCommission - Total commission amount
   * @returns {Object} TOT calculation result
   */
  calculateTOT(totalCommission) {
    const taxAmount = totalCommission * this.TOT_RATE;
    const roundedTaxAmount = this.roundToPrecision(taxAmount);

    console.log(`💰 TOT Calculation:`, {
      totalCommission: totalCommission.toFixed(2),
      totRate: `${this.TOT_RATE * 100}%`,
      taxAmount: roundedTaxAmount.toFixed(2),
      currency: "KES",
    });

    return {
      totalCommission: this.roundToPrecision(totalCommission),
      taxRate: this.TOT_RATE,
      taxAmount: roundedTaxAmount,
      calculationMethod: `${totalCommission.toFixed(6)} * ${this.TOT_RATE} = ${taxAmount.toFixed(6)} → ${roundedTaxAmount.toFixed(2)}`,
    };
  }

  /**
   * Round number to specified precision using consistent strategy
   *
   * @param {number} value - Value to round
   * @returns {number} Rounded value
   */
  roundToPrecision(value) {
    const multiplier = Math.pow(10, this.PRECISION_DECIMAL_PLACES);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * Validate month format (YYYY-MM)
   *
   * @param {string} month - Month string to validate
   * @returns {boolean} True if valid
   */
  validateMonthFormat(month) {
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return false;
    }

    const [year, monthNum] = month.split("-").map(Number);
    return year >= 2020 && year <= 2050 && monthNum >= 1 && monthNum <= 12;
  }

  /**
   * Parse month string into date components
   *
   * @param {string} month - Month in YYYY-MM format
   * @returns {Object} Parsed month data
   */
  parseMonth(month) {
    const [year, monthNum] = month.split("-").map(Number);

    // Create period boundaries (start of month to start of next month)
    const periodStart = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
    const periodEnd = new Date(year, monthNum, 1, 0, 0, 0, 0);

    return {
      year,
      monthNum,
      periodStart,
      periodEnd,
    };
  }

  /**
   * Check if report already exists for period
   *
   * @param {string} reportType - Type of report
   * @param {string} period - Reporting period
   * @returns {Promise<Object|null>} Existing report or null
   */
  async checkExistingReport(reportType, period) {
    try {
      const existing = await db.listDocuments(
        this.databaseId,
        this.financialReportsCollectionId,
        [
          Query.equal("report_type", reportType),
          Query.equal("reporting_period", period),
          Query.limit(1),
        ],
      );

      return existing.documents.length > 0 ? existing.documents[0] : null;
    } catch (error) {
      console.error("❌ Error checking existing report:", error);
      return null;
    }
  }

  /**
   * Generate audit checksum for data integrity
   *
   * @param {Object} data - Data to checksum
   * @returns {string} SHA-256 checksum
   */
  generateAuditChecksum(data) {
    const checksumData = {
      month: data.month,
      totalOrders: data.commission.totalOrders,
      totalCommission: data.commission.totalCommission,
      totAmount: data.tot.taxAmount,
      ordersHash: crypto
        .createHash("md5")
        .update(JSON.stringify(data.orders.map((o) => o.$id)))
        .digest("hex"),
    };

    return crypto
      .createHash("sha256")
      .update(JSON.stringify(checksumData))
      .digest("hex");
  }

  /**
   * Validate service configuration
   *
   * @returns {Promise<boolean>} True if configured correctly
   */
  async validateConfiguration() {
    try {
      console.log("🔧 Validating TOT Reporting Service configuration...");

      // Check database configuration
      if (!this.databaseId) {
        console.error("❌ Database ID not configured");
        return false;
      }

      if (!this.ordersCollectionId) {
        console.error("❌ Orders collection ID not configured");
        return false;
      }

      // Test database connections
      try {
        await db.getCollection(this.databaseId, this.ordersCollectionId);
        console.log("✅ Orders collection accessible");
      } catch (error) {
        console.error("❌ Orders collection not accessible:", error.message);
        return false;
      }

      try {
        await db.getCollection(
          this.databaseId,
          this.financialReportsCollectionId,
        );
        console.log("✅ Financial reports collection accessible");
      } catch (error) {
        console.error(
          "❌ Financial reports collection not accessible:",
          error.message,
        );
        return false;
      }

      console.log("✅ TOT Reporting Service configured correctly");
      return true;
    } catch (error) {
      console.error(
        "❌ TOT Reporting Service configuration error:",
        error.message,
      );
      return false;
    }
  }
}

// Export singleton instance
const totReportingService = new TOTReportingService();

module.exports = {
  TOTReportingService,
  totReportingService,
};
