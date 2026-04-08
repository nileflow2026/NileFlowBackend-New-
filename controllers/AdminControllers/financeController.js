// controllers/AdminControllers/financeController.js
const { totReportingService } = require("../../services/totReportingService");
const { financialAuditLogger } = require("../../services/financialAuditLogger");
const { logAuditFromRequest } = require("../../utils/auditLogger");

/**
 * Finance Controller - KRA-Compliant Tax Reporting
 * 
 * Secure endpoints for financial reporting and tax compliance.
 * 
 * Security Requirements:
 * - All endpoints require admin or finance role authentication
 * - All report generation is logged with user ID and timestamp
 * - All access attempts are audited for compliance
 * - Financial data access is restricted and monitored
 * 
 * Compliance Features:
 * - Deterministic calculations for audit reproducibility
 * - Immutable report storage for KRA requirements
 * - Comprehensive audit trails for all financial operations
 * - Export-ready data for government filing
 * 
 * Supported Reports:
 * - Monthly Turnover Tax (TOT) reports
 * - Commission aggregation reports
 * - Financial analytics and summaries
 */
class FinanceController {
  
  /**
   * GET /finance/tot-report?month=YYYY-MM
   * Generate or retrieve monthly TOT report for KRA compliance
   */
  static async generateTOTReport(req, res) {
    try {
      // Strict access control - finance/admin roles only
      if (!FinanceController.hasFinanceAccess(req.user)) {
        await logAuditFromRequest(req, "UNAUTHORIZED_FINANCE_ACCESS", "TOT_REPORT", "access_denied", {
          attemptedEndpoint: "/finance/tot-report",
          userRole: req.user?.role || "unknown",
          reason: "Insufficient permissions for financial reporting"
        });
        
        return res.status(403).json({
          success: false,
          error: "Access denied. Finance or admin role required for tax reporting.",
          code: "INSUFFICIENT_PERMISSIONS"
        });
      }

      const { month, forceRegenerate } = req.query;
      const userId = req.user.userId || req.user.$id;

      // Validate required parameters
      if (!month) {
        return res.status(400).json({
          success: false,
          error: "Month parameter is required. Format: YYYY-MM (e.g., 2026-01)",
          example: "/finance/tot-report?month=2026-01"
        });
      }

      // Log financial report access
      await logAuditFromRequest(req, "TOT_REPORT_REQUESTED", "FINANCIAL_REPORT", `tot_${month}`, {
        reportingPeriod: month,
        forceRegenerate: forceRegenerate === "true",
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });

      console.log(`📊 TOT report requested for ${month} by user ${userId}`);

      // Check if report already exists
      const existingReport = await totReportingService.getTOTReportByMonth(month);
      
      if (existingReport && forceRegenerate !== "true") {
        console.log(`📄 Returning existing TOT report for ${month}`);
        
        // Log report retrieval
        await logAuditFromRequest(req, "TOT_REPORT_RETRIEVED", "FINANCIAL_REPORT", existingReport.$id, {
          reportingPeriod: month,
          reportId: existingReport.report_id,
          generatedAt: existingReport.generated_at
        });

        return res.json({
          success: true,
          report: FinanceController.sanitizeReportForResponse(existingReport),
          message: `TOT report for ${month} retrieved successfully`,
          generated: false, // Indicates this was retrieved, not freshly generated
          retrievedAt: new Date().toISOString()
        });
      }

      // Generate new report
      console.log(`🔄 Generating new TOT report for ${month}...`);
      
      const reportResult = await totReportingService.generateMonthlyTOTReport(
        month, 
        userId,
        { 
          forceRegenerate: forceRegenerate === "true",
          notes: `Generated via /finance/tot-report endpoint by ${userId}`
        }
      );

      // Log successful report generation
      await financialAuditLogger.logTOTReportGeneration({
        reportId: reportResult.reportId,
        reportingPeriod: month,
        generatedBy: userId,
        totalCommission: reportResult.summary.totalCommission,
        totAmount: reportResult.summary.totAmount,
        totalOrders: reportResult.summary.totalOrders,
        auditChecksum: reportResult.summary.auditChecksum,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      console.log(`✅ TOT report generated successfully for ${month}`);

      res.json({
        success: true,
        report: FinanceController.sanitizeReportForResponse(reportResult.report),
        summary: reportResult.summary,
        message: `TOT report for ${month} generated successfully`,
        generated: true,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Error generating TOT report:`, error);
      
      // Log error for audit trail
      await logAuditFromRequest(req, "TOT_REPORT_ERROR", "FINANCIAL_REPORT", "error", {
        error: error.message,
        month: req.query.month,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: "Failed to generate TOT report",
        details: error.message,
        code: "REPORT_GENERATION_ERROR"
      });
    }
  }

  /**
   * GET /finance/tot-reports
   * List all TOT reports with filtering and pagination
   */
  static async listTOTReports(req, res) {
    try {
      // Strict access control
      if (!FinanceController.hasFinanceAccess(req.user)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Finance or admin role required."
        });
      }

      const { year, month, status, limit = 50 } = req.query;
      const userId = req.user.userId || req.user.$id;

      // Build filters
      const filters = {};
      if (year) filters.year = year;
      if (month) filters.month = month;
      if (status) filters.status = status;
      if (limit) filters.limit = Math.min(parseInt(limit), 100); // Max 100 reports

      console.log(`📋 Listing TOT reports with filters:`, filters);

      // Log access to financial data
      await logAuditFromRequest(req, "TOT_REPORTS_ACCESSED", "FINANCIAL_REPORT_LIST", "list", {
        filters: filters,
        requestedBy: userId
      });

      // Get reports
      const reportsResult = await totReportingService.getTOTReports(filters);

      // Sanitize reports for response
      const sanitizedReports = reportsResult.reports.map(report => 
        FinanceController.sanitizeReportForResponse(report)
      );

      res.json({
        success: true,
        reports: sanitizedReports,
        total: reportsResult.total,
        filters: filters,
        retrievedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error("❌ Error listing TOT reports:", error);
      
      await logAuditFromRequest(req, "TOT_REPORTS_LIST_ERROR", "FINANCIAL_REPORT_LIST", "error", {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: "Failed to retrieve TOT reports",
        details: error.message
      });
    }
  }

  /**
   * GET /finance/tot-report/:month
   * Get specific TOT report by month
   */
  static async getTOTReportByMonth(req, res) {
    try {
      // Strict access control
      if (!FinanceController.hasFinanceAccess(req.user)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Finance or admin role required."
        });
      }

      const { month } = req.params;
      const userId = req.user.userId || req.user.$id;

      console.log(`📄 Retrieving TOT report for ${month}...`);

      // Log access attempt
      await logAuditFromRequest(req, "TOT_REPORT_ACCESSED", "FINANCIAL_REPORT", `tot_${month}`, {
        reportingPeriod: month,
        accessedBy: userId
      });

      // Get report
      const report = await totReportingService.getTOTReportByMonth(month);

      if (!report) {
        return res.status(404).json({
          success: false,
          error: `TOT report for ${month} not found`,
          suggestion: `Generate report first using: /finance/tot-report?month=${month}`
        });
      }

      res.json({
        success: true,
        report: FinanceController.sanitizeReportForResponse(report),
        retrievedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Error retrieving TOT report for ${req.params.month}:`, error);
      
      await logAuditFromRequest(req, "TOT_REPORT_ACCESS_ERROR", "FINANCIAL_REPORT", req.params.month, {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: "Failed to retrieve TOT report",
        details: error.message
      });
    }
  }

  /**
   * GET /finance/tot-export/:month
   * Export TOT report data for KRA filing (CSV format)
   */
  static async exportTOTReport(req, res) {
    try {
      // Strict access control - higher permission level for exports
      if (!FinanceController.hasFinanceAccess(req.user, "export")) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Export permissions required."
        });
      }

      const { month } = req.params;
      const { format = "csv" } = req.query;
      const userId = req.user.userId || req.user.$id;

      // Log export attempt (critical security event)
      await financialAuditLogger.logFinancialExport({
        exportType: "TOT_REPORT",
        reportingPeriod: month,
        format: format,
        exportedBy: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        severity: "HIGH"
      });

      console.log(`📤 Exporting TOT report for ${month} in ${format} format...`);

      // Get report
      const report = await totReportingService.getTOTReportByMonth(month);

      if (!report) {
        return res.status(404).json({
          success: false,
          error: `TOT report for ${month} not found`
        });
      }

      // Parse export data
      const exportData = JSON.parse(report.export_data || '{}');

      if (format === "csv") {
        // Generate CSV content for KRA filing
        const csvContent = FinanceController.generateTOTCSV(report, exportData);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="TOT_Report_${month}.csv"`);
        res.send(csvContent);
      } else {
        // JSON export
        res.json({
          success: true,
          report: FinanceController.sanitizeReportForResponse(report),
          exportData: exportData,
          exportedAt: new Date().toISOString(),
          format: format
        });
      }

    } catch (error) {
      console.error(`❌ Error exporting TOT report for ${req.params.month}:`, error);
      
      await logAuditFromRequest(req, "TOT_EXPORT_ERROR", "FINANCIAL_EXPORT", req.params.month, {
        error: error.message,
        format: req.query.format
      });

      res.status(500).json({
        success: false,
        error: "Failed to export TOT report",
        details: error.message
      });
    }
  }

  /**
   * GET /finance/dashboard
   * Financial dashboard with key metrics (admin overview)
   */
  static async getFinanceDashboard(req, res) {
    try {
      // Strict access control
      if (!FinanceController.hasFinanceAccess(req.user)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Finance or admin role required."
        });
      }

      const userId = req.user.userId || req.user.$id;

      // Log dashboard access
      await logAuditFromRequest(req, "FINANCE_DASHBOARD_ACCESSED", "DASHBOARD", "financial_overview", {
        accessedBy: userId
      });

      // Get recent TOT reports for dashboard
      const recentReports = await totReportingService.getTOTReports({
        limit: 12 // Last 12 months
      });

      // Calculate dashboard metrics
      const dashboardMetrics = FinanceController.calculateDashboardMetrics(recentReports.reports);

      res.json({
        success: true,
        dashboard: {
          overview: dashboardMetrics,
          recentReports: recentReports.reports.slice(0, 6).map(report => ({
            period: report.reporting_period,
            totalCommission: report.total_commission,
            totAmount: report.tax_amount,
            totalOrders: report.total_orders,
            generatedAt: report.generated_at,
            status: report.report_status
          })),
          metrics: {
            totalReportsGenerated: recentReports.total,
            lastReportGenerated: recentReports.reports[0]?.generated_at || null,
            systemStatus: "operational"
          }
        },
        retrievedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error("❌ Error loading finance dashboard:", error);
      
      await logAuditFromRequest(req, "FINANCE_DASHBOARD_ERROR", "DASHBOARD", "error", {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: "Failed to load finance dashboard",
        details: error.message
      });
    }
  }

  /**
   * Check if user has finance access permissions
   * 
   * @param {Object} user - User object from auth middleware
   * @param {string} level - Access level: "read" | "export" | "admin"
   * @returns {boolean} True if user has required permissions
   */
  static hasFinanceAccess(user, level = "read") {
    if (!user) {
      return false;
    }

    const userRole = user.role?.toLowerCase();
    
    // Admin has all permissions
    if (userRole === "admin") {
      return true;
    }

    // Finance role has read/export permissions
    if (userRole === "finance") {
      return level !== "admin"; // Finance can't perform admin actions
    }

    // No other roles have finance access
    return false;
  }

  /**
   * Sanitize report data for API response (remove sensitive internal data)
   * 
   * @param {Object} report - Raw report document
   * @returns {Object} Sanitized report for API response
   */
  static sanitizeReportForResponse(report) {
    // Remove internal audit fields and raw export data
    const sanitized = { ...report };
    
    // Keep audit checksum but remove detailed export data to reduce response size
    if (sanitized.export_data) {
      try {
        const exportData = JSON.parse(sanitized.export_data);
        sanitized.export_summary = exportData.summary;
        delete sanitized.export_data; // Remove full breakdown from API response
      } catch (error) {
        // Keep as is if parsing fails
      }
    }

    return sanitized;
  }

  /**
   * Generate CSV content for KRA filing
   * 
   * @param {Object} report - TOT report document
   * @param {Object} exportData - Parsed export data
   * @returns {string} CSV content
   */
  static generateTOTCSV(report, exportData) {
    const csvRows = [
      // Header row
      "Period,Total Orders,Total Commission (KES),TOT Rate,TOT Amount (KES),Generated Date,Report Status",
      
      // Data row
      [
        report.reporting_period,
        report.total_orders,
        report.total_commission.toFixed(2),
        `${(report.tax_rate * 100)}%`,
        report.tax_amount.toFixed(2),
        new Date(report.generated_at).toLocaleDateString(),
        report.report_status
      ].join(",")
    ];

    return csvRows.join("\n");
  }

  /**
   * Calculate dashboard metrics from recent reports
   * 
   * @param {Array} reports - Array of recent reports
   * @returns {Object} Dashboard metrics
   */
  static calculateDashboardMetrics(reports) {
    if (!reports || reports.length === 0) {
      return {
        totalCommissionYTD: 0,
        totalTOTYTD: 0,
        averageMonthlyCommission: 0,
        averageMonthlyTOT: 0,
        reportCount: 0
      };
    }

    const currentYear = new Date().getFullYear();
    const currentYearReports = reports.filter(r => r.report_year === currentYear);

    const totalCommission = currentYearReports.reduce((sum, r) => sum + (r.total_commission || 0), 0);
    const totalTOT = currentYearReports.reduce((sum, r) => sum + (r.tax_amount || 0), 0);

    return {
      totalCommissionYTD: totalCommission,
      totalTOTYTD: totalTOT,
      averageMonthlyCommission: currentYearReports.length > 0 ? totalCommission / currentYearReports.length : 0,
      averageMonthlyTOT: currentYearReports.length > 0 ? totalTOT / currentYearReports.length : 0,
      reportCount: currentYearReports.length,
      currency: "KES"
    };
  }
}

module.exports = FinanceController;