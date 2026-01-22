/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getTOTReport,
  getTOTReportByMonth,
  listTOTReports,
  getFinanceDashboard,
  getFinanceHealth,
  downloadTOTReport,
  formatCurrency,
  formatDate,
  getCurrentMonth,
  getPreviousMonth,
  isValidMonth,
} from "../services/financeService";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const Finance = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [totReports, setTotReports] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [currentReport, setCurrentReport] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: "",
    status: "",
    limit: 10,
  });

  // Load initial data
  useEffect(() => {
    loadFinanceData();
    loadSystemHealth();
  }, []);

  // Load TOT reports when filters change
  useEffect(() => {
    loadTOTReports();
  }, [filters]);

  // Load current month report when selected month changes
  useEffect(() => {
    if (selectedMonth && isValidMonth(selectedMonth)) {
      loadCurrentReport(selectedMonth);
    }
  }, [selectedMonth]);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const data = await getFinanceDashboard();
      setDashboardData(data);
    } catch (err) {
      setError("Failed to load finance dashboard: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTOTReports = async () => {
    try {
      const reports = await listTOTReports(filters);
      setTotReports(reports.reports || []);
    } catch (err) {
      console.error("Failed to load TOT reports:", err);
    }
  };

  const loadCurrentReport = async (month) => {
    try {
      const report = await getTOTReportByMonth(month);
      setCurrentReport(report);
    } catch (err) {
      console.error("Failed to load current report:", err);
      setCurrentReport(null);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const health = await getFinanceHealth();
      setSystemHealth(health);
    } catch (err) {
      console.error("Failed to load system health:", err);
    }
  };

  const handleGenerateReport = async (forceRegenerate = false) => {
    if (!selectedMonth || !isValidMonth(selectedMonth)) {
      setError("Please select a valid month (YYYY-MM format)");
      return;
    }

    try {
      setLoading(true);
      const report = await getTOTReport(selectedMonth, forceRegenerate);
      setCurrentReport(report);
      setError("");
      // Refresh the reports list
      loadTOTReports();
    } catch (err) {
      setError("Failed to generate report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (format = "csv") => {
    if (!selectedMonth || !isValidMonth(selectedMonth)) {
      setError("Please select a valid month");
      return;
    }

    try {
      await downloadTOTReport(selectedMonth, format);
    } catch (err) {
      setError("Failed to download report: " + err.message);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading finance dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
              <p className="text-gray-600 mt-2">
                KRA-Compliant Turnover Tax (TOT) Reporting System
              </p>
            </div>
            {systemHealth && (
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    systemHealth.health?.status === "healthy"
                      ? "bg-green-500"
                      : systemHealth.health?.status === "degraded"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-600">
                  System {systemHealth.health?.status || "unknown"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Overview */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">YTD Commission</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(dashboardData.dashboard?.ytdCommission)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">YTD TOT</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(dashboardData.dashboard?.ytdTot)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Reports</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData.dashboard?.totalReports || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Last Report</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData.dashboard?.lastReportMonth || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Generation Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Generate Report */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate TOT Report</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Month (YYYY-MM)
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleGenerateReport(false)}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate Report"}
                </button>
                <button
                  onClick={() => handleGenerateReport(true)}
                  disabled={loading}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Report</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Download the selected month's report for KRA filing
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleDownloadReport("csv")}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Download CSV
                </button>
                <button
                  onClick={() => handleDownloadReport("json")}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Download JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Report Display */}
        {currentReport && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Current Report - {currentReport.report?.month}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Commission</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(currentReport.report?.summary?.totalCommission)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">TOT Amount (3%)</p>
                <p className="text-xl font-semibold text-green-600">
                  {formatCurrency(currentReport.report?.summary?.totAmount)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-xl font-semibold text-blue-600">
                  {currentReport.report?.summary?.totalOrders || 0}
                </p>
              </div>
            </div>
            
            {currentReport.report?.summary && (
              <div className="text-xs text-gray-500">
                <p>Generated: {formatDate(currentReport.report.generatedAt)}</p>
                <p>Report ID: {currentReport.report.reportId}</p>
                {currentReport.report.checksum && (
                  <p>Checksum: {currentReport.report.checksum}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reports List with Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
            <button
              onClick={loadTOTReports}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={filters.year}
                onChange={(e) => handleFilterChange("year", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange("month", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("en", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Status</option>
                <option value="generated">Generated</option>
                <option value="pending">Pending</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange("limit", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value={10}>10 reports</option>
                <option value={25}>25 reports</option>
                <option value={50}>50 reports</option>
                <option value={100}>100 reports</option>
              </select>
            </div>
          </div>

          {/* Reports Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TOT Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {totReports.length > 0 ? (
                  totReports.map((report) => (
                    <tr key={report.reportId || report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(report.summary?.totalCommission)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(report.summary?.totAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.summary?.totalOrders || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            report.status === "generated"
                              ? "bg-green-100 text-green-800"
                              : report.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {report.status || "unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(report.generatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedMonth(report.month)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          View
                        </button>
                        <button
                          onClick={() => downloadTOTReport(report.month, "csv")}
                          className="text-green-600 hover:text-green-900"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No reports found. Generate your first report to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;