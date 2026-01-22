// services/financeService.js

import axiosClient from "../../api";

/**
 * Finance Service for KRA-Compliant Tax Reporting
 * Handles all finance-related API calls
 */

/**
 * Generate or retrieve monthly TOT report
 * @param {string} month - Format: YYYY-MM
 * @param {boolean} forceRegenerate - Whether to force regeneration
 * @returns {Promise} TOT report data
 */
export const getTOTReport = async (month, forceRegenerate = false) => {
  try {
    const params = new URLSearchParams({
      month,
      ...(forceRegenerate && { forceRegenerate: "true" })
    });
    
    const response = await axiosClient.get(`/api/finance/tot-report?${params}`);
    return response.data;
  } catch (error) {
    console.error("[Finance] getTOTReport error:", error);
    throw error;
  }
};

/**
 * Get specific TOT report by month
 * @param {string} month - Format: YYYY-MM
 * @returns {Promise} TOT report data
 */
export const getTOTReportByMonth = async (month) => {
  try {
    const response = await axiosClient.get(`/api/finance/tot-report/${month}`);
    return response.data;
  } catch (error) {
    console.error("[Finance] getTOTReportByMonth error:", error);
    throw error;
  }
};

/**
 * List all TOT reports with filtering
 * @param {Object} filters - Filter options
 * @param {number} filters.year - Filter by year
 * @param {number} filters.month - Filter by month (1-12)
 * @param {string} filters.status - Filter by status
 * @param {number} filters.limit - Maximum reports to return
 * @returns {Promise} Array of TOT reports
 */
export const listTOTReports = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.year) params.append("year", filters.year);
    if (filters.month) params.append("month", filters.month);
    if (filters.status) params.append("status", filters.status);
    if (filters.limit) params.append("limit", filters.limit);
    
    const response = await axiosClient.get(`/api/finance/tot-reports?${params}`);
    return response.data;
  } catch (error) {
    console.error("[Finance] listTOTReports error:", error);
    throw error;
  }
};

/**
 * Export TOT report for KRA filing
 * @param {string} month - Format: YYYY-MM
 * @param {string} format - Export format ("csv" or "json")
 * @returns {Promise} File download response
 */
export const exportTOTReport = async (month, format = "csv") => {
  try {
    const response = await axiosClient.get(
      `/api/finance/tot-export/${month}?format=${format}`,
      {
        responseType: format === "csv" ? "blob" : "json"
      }
    );
    return response;
  } catch (error) {
    console.error("[Finance] exportTOTReport error:", error);
    throw error;
  }
};

/**
 * Get financial dashboard data
 * @returns {Promise} Dashboard metrics and data
 */
export const getFinanceDashboard = async () => {
  try {
    const response = await axiosClient.get("/api/finance/dashboard");
    return response.data;
  } catch (error) {
    console.error("[Finance] getFinanceDashboard error:", error);
    throw error;
  }
};

/**
 * Get finance system health
 * @returns {Promise} System health data
 */
export const getFinanceHealth = async () => {
  try {
    const response = await axiosClient.get("/api/finance/health");
    return response.data;
  } catch (error) {
    console.error("[Finance] getFinanceHealth error:", error);
    throw error;
  }
};

/**
 * Get API documentation
 * @returns {Promise} API documentation
 */
export const getFinanceDocs = async () => {
  try {
    const response = await axiosClient.get("/api/finance/docs");
    return response.data;
  } catch (error) {
    console.error("[Finance] getFinanceDocs error:", error);
    throw error;
  }
};

/**
 * Helper function to download exported file
 * @param {string} month - Format: YYYY-MM
 * @param {string} format - Export format
 */
export const downloadTOTReport = async (month, format = "csv") => {
  try {
    const response = await exportTOTReport(month, format);
    
    if (format === "csv") {
      // Create download link for CSV
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `tot-report-${month}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } else {
      // For JSON, create download link
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("download", `tot-report-${month}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } catch (error) {
    console.error("[Finance] downloadTOTReport error:", error);
    throw error;
  }
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KSH",
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Get current month in YYYY-MM format
 * @returns {string} Current month
 */
export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Get previous month in YYYY-MM format
 * @returns {string} Previous month
 */
export const getPreviousMonth = () => {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Validate month format
 * @param {string} month - Month string to validate
 * @returns {boolean} Whether month is valid
 */
export const isValidMonth = (month) => {
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return monthRegex.test(month);
};