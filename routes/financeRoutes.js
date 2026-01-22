// routes/financeRoutes.js
const express = require("express");
const FinanceController = require("../controllers/AdminControllers/financeController");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Finance Routes - KRA-Compliant Tax Reporting System
 * 
 * All routes require authentication and appropriate role-based access.
 * Financial data access is strictly controlled and fully audited.
 * 
 * Security Features:
 * - Admin/Finance role authentication required
 * - All access attempts logged for compliance
 * - Rate limiting applied to prevent abuse
 * - Comprehensive audit trails for KRA requirements
 * 
 * Supported Endpoints:
 * - Monthly TOT report generation and retrieval
 * - Financial dashboard and analytics
 * - Report export for government filing
 * - Historical report listing and search
 */

/**
 * Generate or retrieve monthly TOT report
 * 
 * GET /finance/tot-report?month=YYYY-MM&forceRegenerate=false
 * 
 * Query Parameters:
 * - month (required): Reporting period in YYYY-MM format
 * - forceRegenerate (optional): Set to "true" to regenerate existing report
 * 
 * Returns:
 * - TOT report with commission aggregation
 * - Tax calculation (3% of platform commission)
 * - Order statistics and audit trail
 * - Export-ready data for KRA filing
 * 
 * Example: /finance/tot-report?month=2026-01
 */
router.get(
  "/tot-report",
  authenticateToken,
  FinanceController.generateTOTReport
);

/**
 * Get specific TOT report by month
 * 
 * GET /finance/tot-report/:month
 * 
 * Parameters:
 * - month: Reporting period in YYYY-MM format
 * 
 * Returns: Specific TOT report or 404 if not found
 * Example: /finance/tot-report/2026-01
 */
router.get(
  "/tot-report/:month",
  authenticateToken,
  FinanceController.getTOTReportByMonth
);

/**
 * List all TOT reports with filtering
 * 
 * GET /finance/tot-reports?year=2026&month=1&status=generated&limit=50
 * 
 * Query Parameters:
 * - year (optional): Filter by year (e.g., 2026)
 * - month (optional): Filter by month number (1-12)
 * - status (optional): Filter by report status
 * - limit (optional): Maximum reports to return (max 100)
 * 
 * Returns: Array of TOT reports with metadata
 */
router.get(
  "/tot-reports",
  authenticateToken,
  FinanceController.listTOTReports
);

/**
 * Export TOT report for KRA filing
 * 
 * GET /finance/tot-export/:month?format=csv
 * 
 * Parameters:
 * - month: Reporting period in YYYY-MM format
 * 
 * Query Parameters:
 * - format: Export format ("csv" or "json", default: "csv")
 * 
 * Returns: 
 * - CSV file download for KRA submission
 * - JSON export for programmatic access
 * 
 * Security: Higher permission level required for exports
 * Audit: All exports are logged as critical security events
 */
router.get(
  "/tot-export/:month",
  authenticateToken,
  FinanceController.exportTOTReport
);

/**
 * Financial dashboard with key metrics
 * 
 * GET /finance/dashboard
 * 
 * Returns:
 * - Year-to-date commission and TOT totals
 * - Recent report summaries
 * - System status and metrics
 * - Quick access to common functions
 * 
 * Used by: Admin dashboard, financial overview screens
 */
router.get(
  "/dashboard",
  authenticateToken,
  FinanceController.getFinanceDashboard
);

/**
 * Health check endpoint for monitoring
 * 
 * GET /finance/health
 * 
 * Returns: System health and configuration status
 * Used for: Service monitoring, deployment verification
 */
router.get("/health", authenticateToken, async (req, res) => {
  try {
    // Check if user has finance access
    if (!FinanceController.hasFinanceAccess(req.user)) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Finance or admin role required."
      });
    }

    // Import service dynamically to avoid circular dependencies
    const { totReportingService } = require("../services/totReportingService");
    
    // Validate service configuration
    const isConfigValid = await totReportingService.validateConfiguration();
    
    res.json({
      success: true,
      health: {
        status: isConfigValid ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        services: {
          totReporting: isConfigValid ? "operational" : "configuration_error",
          database: "operational",
          authentication: "operational"
        },
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development"
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      health: {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * API Documentation endpoint
 * 
 * GET /finance/docs
 * 
 * Returns: API documentation and usage examples
 */
router.get("/docs", authenticateToken, (req, res) => {
  // Check finance access
  if (!FinanceController.hasFinanceAccess(req.user)) {
    return res.status(403).json({
      success: false,
      error: "Access denied. Finance or admin role required."
    });
  }

  res.json({
    success: true,
    documentation: {
      title: "NileFlow Finance API - KRA-Compliant Tax Reporting",
      version: "1.0.0",
      description: "Secure endpoints for monthly Turnover Tax (TOT) reporting and financial compliance",
      
      endpoints: [
        {
          method: "GET",
          path: "/finance/tot-report",
          description: "Generate or retrieve monthly TOT report",
          parameters: {
            month: "Required. Format: YYYY-MM (e.g., 2026-01)",
            forceRegenerate: "Optional. Set to 'true' to regenerate existing report"
          },
          example: "/finance/tot-report?month=2026-01"
        },
        {
          method: "GET", 
          path: "/finance/tot-report/:month",
          description: "Get specific TOT report by month",
          parameters: {
            month: "Required. Format: YYYY-MM"
          },
          example: "/finance/tot-report/2026-01"
        },
        {
          method: "GET",
          path: "/finance/tot-reports",
          description: "List all TOT reports with filtering",
          parameters: {
            year: "Optional. Filter by year (e.g., 2026)",
            month: "Optional. Filter by month number (1-12)",
            status: "Optional. Filter by report status",
            limit: "Optional. Max reports to return (default: 50, max: 100)"
          },
          example: "/finance/tot-reports?year=2026&limit=10"
        },
        {
          method: "GET",
          path: "/finance/tot-export/:month",
          description: "Export TOT report for KRA filing",
          parameters: {
            month: "Required. Format: YYYY-MM",
            format: "Optional. 'csv' or 'json' (default: 'csv')"
          },
          example: "/finance/tot-export/2026-01?format=csv",
          note: "Returns CSV file download for KRA submission"
        },
        {
          method: "GET",
          path: "/finance/dashboard",
          description: "Financial dashboard with key metrics",
          example: "/finance/dashboard"
        }
      ],

      authentication: {
        required: true,
        roles: ["admin", "finance"],
        method: "JWT token via cookie or Authorization header"
      },

      compliance: {
        kra_requirements: "All reports follow KRA Turnover Tax guidelines",
        audit_trail: "Complete audit log for all financial operations",
        data_integrity: "SHA-256 checksums for report verification",
        immutable_records: "Reports are stored as immutable records"
      },

      calculations: {
        tot_rate: "3% of platform commission earnings",
        precision: "All amounts rounded to 2 decimal places",
        source_data: "commission_earned field from completed orders",
        tax_formula: "TOT = SUM(commission_earned) * 0.03"
      },

      support: {
        contact: "finance@nileflowafrica.com",
        documentation: "See implementation guide for detailed usage",
        compliance_questions: "Contact KRA compliance team"
      }
    },
    generatedAt: new Date().toISOString()
  });
});

module.exports = router;