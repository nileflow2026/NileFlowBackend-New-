/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable no-undef */
import React from "react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { getAuditLogs } from "../../adminService";
import {
  Search,
  Clock,
  User,
  Shield,
  FileText,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Hash,
  Database,
  ExternalLink,
  Copy,
  MoreVertical,
  Activity,
  History,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export default function AuditLogs() {
  // State Management
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedEntity, setSelectedEntity] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [expandedLog, setExpandedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "timestamp",
    direction: "desc",
  });
  const [severityFilter, setSeverityFilter] = useState("all");
  const itemsPerPage = 15;

  // Fetch logs
  useEffect(() => {
    const fetchLogsData = async () => {
      setLoading(true);
      try {
        const data = await getAuditLogs();
        setLogs(data || []);
        setError(null);
        toast.success(`${data?.length || 0} audit logs loaded`);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
        setError(err.message || "Failed to load audit logs");
        toast.error("Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogsData();
  }, []);

  // Calculate statistics
  const logStats = useMemo(() => {
    const totalLogs = logs.length;

    const actionCounts = logs.reduce((acc, log) => {
      const action = log.action || "unknown";
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {});

    const userCounts = logs.reduce((acc, log) => {
      const user = log.performedBy || "unknown";
      acc[user] = (acc[user] || 0) + 1;
      return acc;
    }, {});

    const entityCounts = logs.reduce((acc, log) => {
      const entity = log.entityType || "unknown";
      acc[entity] = (acc[entity] || 0) + 1;
      return acc;
    }, {});

    const today = new Date();
    const todayLogs = logs.filter((log) => {
      const logDate = new Date(log.timestamp || log.$createdAt);
      return logDate.toDateString() === today.toDateString();
    });

    // Determine severity based on action
    const criticalLogs = logs.filter((log) =>
      ["DELETE", "SUSPEND", "BLOCK", "REVOKE"].includes(
        log.action?.toUpperCase()
      )
    ).length;

    return {
      totalLogs,
      todayLogs: todayLogs.length,
      criticalLogs,
      warningLogs: logs.filter((log) =>
        ["UPDATE", "MODIFY", "EDIT"].includes(log.action?.toUpperCase())
      ).length,
      topAction: Object.entries(actionCounts).sort(
        (a, b) => b[1] - a[1]
      )[0] || ["N/A", 0],
      topUser: Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0] || [
        "N/A",
        0,
      ],
      topEntity: Object.entries(entityCounts).sort(
        (a, b) => b[1] - a[1]
      )[0] || ["N/A", 0],
    };
  }, [logs]);

  // Get unique values for filters
  const uniqueActions = useMemo(
    () => [...new Set(logs.map((log) => log.action).filter(Boolean))],
    [logs]
  );

  const uniqueEntities = useMemo(
    () => [...new Set(logs.map((log) => log.entityType).filter(Boolean))],
    [logs]
  );

  const uniqueUsers = useMemo(
    () => [...new Set(logs.map((log) => log.performedBy).filter(Boolean))],
    [logs]
  );

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = logs.filter((log) => {
      const matchesSearch =
        log.performedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction =
        selectedAction === "all" || log.action === selectedAction;
      const matchesEntity =
        selectedEntity === "all" || log.entityType === selectedEntity;
      const matchesUser =
        selectedUser === "all" || log.performedBy === selectedUser;

      const matchesSeverity =
        severityFilter === "all" ||
        (() => {
          const action = log.action?.toUpperCase();
          if (severityFilter === "critical") {
            return ["DELETE", "SUSPEND", "BLOCK", "REVOKE"].includes(action);
          }
          if (severityFilter === "warning") {
            return ["UPDATE", "MODIFY", "EDIT"].includes(action);
          }
          if (severityFilter === "info") {
            return ["CREATE", "READ", "VIEW"].includes(action);
          }
          return true;
        })();

      const matchesDate =
        dateRange === "all" ||
        (() => {
          if (!log.timestamp) return true;
          const logDate = new Date(log.timestamp);
          const today = new Date();
          switch (dateRange) {
            case "today":
              return logDate.toDateString() === today.toDateString();
            case "week":
              const weekAgo = new Date(today.setDate(today.getDate() - 7));
              return logDate >= weekAgo;
            case "month":
              const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
              return logDate >= monthAgo;
            default:
              return true;
          }
        })();

      return (
        matchesSearch &&
        matchesAction &&
        matchesEntity &&
        matchesUser &&
        matchesSeverity &&
        matchesDate
      );
    });

    // Sort logs
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "timestamp") {
        aValue = new Date(a.timestamp || a.$createdAt || 0);
        bValue = new Date(b.timestamp || b.$createdAt || 0);
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    logs,
    searchTerm,
    selectedAction,
    selectedEntity,
    selectedUser,
    severityFilter,
    dateRange,
    sortConfig,
  ]);

  // Pagination
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedLogs, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage);

  // Handle sorting
  const handleSort = useCallback((key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Action badge component
  const getActionBadge = useCallback((action) => {
    const actionConfig = {
      create: {
        bg: "bg-gradient-to-r from-[#27AE60] to-[#2ECC71]",
        icon: <FileText className="w-3 h-3" />,
        label: "Create",
        severity: "info",
      },
      update: {
        bg: "bg-gradient-to-r from-[#F39C12] to-[#D68910]",
        icon: <Edit className="w-3 h-3" />,
        label: "Update",
        severity: "warning",
      },
      delete: {
        bg: "bg-gradient-to-r from-[#E74C3C] to-[#C0392B]",
        icon: <Trash2 className="w-3 h-3" />,
        label: "Delete",
        severity: "critical",
      },
      read: {
        bg: "bg-gradient-to-r from-[#3498DB] to-[#2980B9]",
        icon: <Eye className="w-3 h-3" />,
        label: "Read",
        severity: "info",
      },
      login: {
        bg: "bg-gradient-to-r from-[#9B59B6] to-[#8E44AD]",
        icon: <Lock className="w-3 h-3" />,
        label: "Login",
        severity: "info",
      },
      logout: {
        bg: "bg-gradient-to-r from-[#7F8C8D] to-[#616A6B]",
        icon: <Lock className="w-3 h-3" />,
        label: "Logout",
        severity: "info",
      },
      suspend: {
        bg: "bg-gradient-to-r from-[#E74C3C] to-[#C0392B]",
        icon: <AlertCircle className="w-3 h-3" />,
        label: "Suspend",
        severity: "critical",
      },
    };

    const config = actionConfig[action?.toLowerCase()] || {
      bg: "bg-gradient-to-r from-[#95A5A6] to-[#7F8C8D]",
      icon: <Activity className="w-3 h-3" />,
      label: action || "Action",
      severity: "info",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} text-white`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  }, []);

  // Severity indicator
  const getSeverityIndicator = useCallback((action) => {
    const actionUpper = action?.toUpperCase();
    if (["DELETE", "SUSPEND", "BLOCK", "REVOKE"].includes(actionUpper)) {
      return {
        color: "text-[#E74C3C]",
        bg: "bg-[#E74C3C]/10",
        icon: <AlertCircle className="w-4 h-4" />,
        label: "Critical",
      };
    } else if (["UPDATE", "MODIFY", "EDIT"].includes(actionUpper)) {
      return {
        color: "text-[#F39C12]",
        bg: "bg-[#F39C12]/10",
        icon: <AlertCircle className="w-4 h-4" />,
        label: "Warning",
      };
    } else {
      return {
        color: "text-[#27AE60]",
        bg: "bg-[#27AE60]/10",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Info",
      };
    }
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-[#E8D6B5]/30 dark:bg-[#3A3A3A] rounded-xl"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-2xl"
                ></div>
              ))}
            </div>
            <div className="h-16 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-xl"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-xl"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#E74C3C] to-[#C0392B] flex items-center justify-center">
            <History className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
            Failed to Load Audit Logs
          </h3>
          <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-6">
            {error || "An error occurred while loading audit logs"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-lg transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
                Audit Trail & Security Logs
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                Monitor all system activities, security events, and
                administrative actions
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium">
                <Download className="w-4 h-4" />
                Export Logs
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <Shield className="w-4 h-4" />
                Security Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Total Logs
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {logStats.totalLogs}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <History className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#27AE60] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {logStats.todayLogs} today
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Critical Actions
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {logStats.criticalLogs}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#E74C3C] to-[#C0392B] flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#E74C3C] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Requires attention
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Most Active User
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] truncate">
                  {logStats.topUser[0]}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#8B4513] dark:text-[#D4A017]">
              {logStats.topUser[1]} actions
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Most Affected Entity
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] truncate">
                  {logStats.topEntity[0]}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#8B4513] dark:text-[#D4A017]">
              {logStats.topEntity[1]} events
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 mb-6 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search logs by user, action, entity, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedAction("all");
                setSelectedEntity("all");
                setSelectedUser("all");
                setSeverityFilter("all");
                setDateRange("all");
                setCurrentPage(1);
              }}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white/80 dark:hover:bg-[#2A2A2A]/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map((action, idx) => (
                <option key={idx} value={action}>
                  {action}
                </option>
              ))}
            </select>

            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="all">All Entities</option>
              {uniqueEntities.map((entity, idx) => (
                <option key={idx} value={entity}>
                  {entity}
                </option>
              ))}
            </select>

            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map((user, idx) => (
                <option key={idx} value={user}>
                  {user}
                </option>
              ))}
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#E8D6B5]/10 to-[#F5E6D3]/5 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A]/50">
                  {[
                    { key: "timestamp", label: "Time" },
                    { key: null, label: "User" },
                    { key: null, label: "Action" },
                    { key: null, label: "Entity" },
                    { key: null, label: "Severity" },
                    { key: null, label: "Details" },
                    { key: null, label: "Actions" },
                  ].map(({ key, label }) => (
                    <th key={label} className="px-6 py-4 text-left">
                      <button
                        onClick={() => key && handleSort(key)}
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017] hover:text-[#B8860B] dark:hover:text-[#FFD700] transition-colors"
                      >
                        {label}
                        {key && sortConfig.key === key && (
                          <span className="text-[#D4A017]">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8D6B5]/30 dark:divide-[#3A3A3A]">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <React.Fragment key={log.$id}>
                      <tr className="hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group">
                        {/* Time */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {new Date(
                                log.timestamp || log.$createdAt
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(
                                log.timestamp || log.$createdAt
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </div>
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                                {log.performedBy || "System"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {log.userRole || "User"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4">
                          {getActionBadge(log.action)}
                        </td>

                        {/* Entity */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                                {log.entityType || "Unknown"}
                              </span>
                            </div>
                            {log.entityId && (
                              <div className="flex items-center gap-1">
                                <Hash className="w-3 h-3 text-gray-400" />
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                                  {log.entityId}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(log.entityId)}
                                  className="p-1 hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] rounded"
                                  title="Copy ID"
                                >
                                  <Copy className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Severity */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-2 rounded-lg ${
                                getSeverityIndicator(log.action).bg
                              }`}
                            >
                              <div
                                className={
                                  getSeverityIndicator(log.action).color
                                }
                              >
                                {getSeverityIndicator(log.action).icon}
                              </div>
                            </div>
                            <span
                              className={`text-sm font-semibold ${
                                getSeverityIndicator(log.action).color
                              }`}
                            >
                              {getSeverityIndicator(log.action).label}
                            </span>
                          </div>
                        </td>

                        {/* Details */}
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="text-sm text-[#2C1810] dark:text-[#F5E6D3] line-clamp-2">
                              {log.details || "No details provided"}
                            </p>
                            {log.details && log.details.length > 100 && (
                              <button
                                onClick={() => toggleLogDetails(log.$id)}
                                className="text-xs text-[#8B4513] dark:text-[#D4A017] hover:underline mt-1"
                              >
                                {expandedLog === log.$id
                                  ? "Show less"
                                  : "Show more"}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleLogDetails(log.$id)}
                              className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-[#3498DB]" />
                            </button>
                            <button
                              onClick={() =>
                                copyToClipboard(JSON.stringify(log, null, 2))
                              }
                              className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                              title="Copy Log"
                            >
                              <Copy className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017]" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Log Details */}
                      {expandedLog === log.$id && (
                        <tr className="bg-[#E8D6B5]/5 dark:bg-[#3A3A3A]/20">
                          <td colSpan="7" className="px-6 py-4">
                            <div className="p-4 rounded-xl bg-white/50 dark:bg-[#2A2A2A]/50 border border-[#E8D6B5] dark:border-[#3A3A3A]">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Log Metadata */}
                                <div>
                                  <h4 className="text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                                    Log Metadata
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">
                                        Log ID:
                                      </span>
                                      <span className="font-mono text-[#2C1810] dark:text-[#F5E6D3]">
                                        {log.$id}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">
                                        IP Address:
                                      </span>
                                      <span>{log.ipAddress || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">
                                        User Agent:
                                      </span>
                                      <span className="text-right max-w-[200px] truncate">
                                        {log.userAgent || "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">
                                        Session ID:
                                      </span>
                                      <span className="font-mono text-xs">
                                        {log.sessionId || "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Full Details */}
                                <div>
                                  <h4 className="text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                                    Full Details
                                  </h4>
                                  <div className="p-3 rounded-lg bg-[#E8D6B5]/10 dark:bg-[#3A3A3A]">
                                    <pre className="text-xs font-mono text-[#2C1810] dark:text-[#F5E6D3] whitespace-pre-wrap">
                                      {JSON.stringify(log, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <History className="w-16 h-16 text-[#E8D6B5] dark:text-[#3A3A3A] mx-auto mb-4" />
                      <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                        No audit logs found
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searchTerm ||
                        selectedAction !== "all" ||
                        selectedEntity !== "all" ||
                        selectedUser !== "all"
                          ? "Try adjusting your filters"
                          : "No audit logs have been recorded yet"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#E8D6B5]/30 dark:border-[#3A3A3A]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Showing{" "}
                  <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredAndSortedLogs.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    {filteredAndSortedLogs.length}
                  </span>{" "}
                  logs
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            currentPage === pageNumber
                              ? "bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white"
                              : "text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"
                          } transition-colors text-sm`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="px-2 text-gray-400">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-9 h-9 rounded-lg text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors text-sm"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Summary */}
        <div className="mt-8 p-6 rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-gradient-to-r from-[#E8D6B5]/10 to-[#D4A017]/5 dark:from-[#3A3A3A]/30 dark:to-[#2A2A2A]/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                Security Monitoring Active
              </p>
              <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                All system activities are being logged and monitored in
                real-time
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#27AE60] animate-pulse"></div>
              <span className="text-sm font-semibold text-[#27AE60]">
                System Secure
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
