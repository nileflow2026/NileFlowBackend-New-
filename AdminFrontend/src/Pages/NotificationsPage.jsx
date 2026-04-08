/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */

import { useState, useEffect, useMemo, useCallback } from "react";
import { client, Config, databases } from "../../appwrite";
import {
  clearAllNotifications,
  getNotifications,
  markNotificationsAsRead,
  fetchAdminNotifications,
  fetchAllNotificationTypes,
  forceRefreshNotifications,
} from "../../adminService";
import { getHasNew, setHasNew, subscribe } from "../notificationBuffer";
import {
  Bell,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  ShoppingBag,
  User,
  Package,
  Star,
  Eye,
  EyeOff,
  Users,
  Mail,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MoreVertical,
  ExternalLink,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [viewMode, setViewMode] = useState("grouped"); // 'grouped' or 'list'
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch notifications
  useEffect(() => {
    const fetchAllNotifications = async () => {
      setLoading(true);
      try {
        console.log("Starting comprehensive notification fetch...");

        // Try the comprehensive fetching function first
        let data = await fetchAllNotificationTypes();

        // If that fails or returns limited results, try the original admin endpoint
        if (!data || data.length === 0) {
          console.log(
            "Comprehensive fetch returned no data, trying admin endpoint..."
          );
          data = await fetchAdminNotifications();
        }

        console.log("Final data received:", data);
        console.log("Notification count:", data?.length || 0);

        // Log all unique types found
        let allTypes = [];
        if (data && data.length > 0) {
          allTypes = [...new Set(data.map((n) => n.type).filter(Boolean))];
          console.log("All notification types found:", allTypes);
        }

        let filteredData = data || [];
        if (filterType !== "all") {
          filteredData = filteredData.filter(
            (notification) => notification.type === filterType
          );
        }

        const sorted = filteredData.sort(
          (a, b) =>
            new Date(b.timestamp || b.$createdAt) -
            new Date(a.timestamp || a.$createdAt)
        );

        setNotifications(sorted);
        toast.success(`${sorted.length} notifications loaded`);

        if (allTypes.length > 0) {
          console.log(
            `Loaded notifications with types: ${allTypes.join(", ")}`
          );
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllNotifications();

    // Force refresh function for manual refresh
    const forceRefresh = async () => {
      setLoading(true);
      try {
        console.log("🔄 Manual force refresh triggered");
        const data = await forceRefreshNotifications();

        console.log("Force refresh data:", data);
        console.log("Force refresh count:", data?.length || 0);

        if (data && data.length > 0) {
          const allTypes = [
            ...new Set(data.map((n) => n.type).filter(Boolean)),
          ];
          console.log("Force refresh types:", allTypes);
        }

        let filteredData = data || [];
        if (filterType !== "all") {
          filteredData = filteredData.filter(
            (notification) => notification.type === filterType
          );
        }

        const sorted = filteredData.sort(
          (a, b) =>
            new Date(b.timestamp || b.$createdAt) -
            new Date(a.timestamp || a.$createdAt)
        );

        setNotifications(sorted);
        toast.success(
          `🔄 Force refreshed: ${sorted.length} notifications loaded`
        );
      } catch (error) {
        console.error("Force refresh failed:", error);
        toast.error("Force refresh failed: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    // Make forceRefresh available globally for testing
    window.forceRefreshNotifications = forceRefresh;

    // Real-time subscription
    const unsubscribe = client.subscribe(
      `databases.${Config.databaseId}.collections.${Config.NOTIFICATIONS_COLLECTION_ID}.documents`,
      (response) => {
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.create"
          )
        ) {
          const newNotification = response.payload;
          setNotifications((prev) => [newNotification, ...prev]);

          // Show toast for new notification
          const notificationType = newNotification.type || "info";
          const icon =
            notificationType === "order" ? (
              <ShoppingBag className="w-4 h-4" />
            ) : notificationType === "user" ? (
              <User className="w-4 h-4" />
            ) : notificationType === "system" ? (
              <AlertCircle className="w-4 h-4" />
            ) : notificationType === "delivery_update" ? (
              <Package className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            );

          toast(
            `${
              notificationType.charAt(0).toUpperCase() +
              notificationType.slice(1)
            } Alert`,
            {
              description: newNotification.message,
              icon,
              duration: 5000,
            }
          );
        }
      }
    );

    // Auto-refresh interval
    let refreshInterval;
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        fetchAllNotifications();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [filterType, autoRefresh]);

  // Filter and group notifications
  const { filteredNotifications, groupedByUser, unreadCount, types } =
    useMemo(() => {
      const filtered = notifications.filter(
        (n) =>
          (filterType === "all" || n.type === filterType) &&
          (n.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (n.username &&
              n.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (n.userEmail &&
              n.userEmail.toLowerCase().includes(searchTerm.toLowerCase())))
      );

      const grouped = filtered.reduce((acc, note) => {
        const key = note.username || note.userEmail || "Unknown User";
        if (!acc[key]) acc[key] = [];
        acc[key].push(note);
        return acc;
      }, {});

      const unread = filtered.filter((n) => !n.read).length;
      const uniqueTypes = Array.from(
        new Set(notifications.map((n) => n.type).filter(Boolean))
      );

      return {
        filteredNotifications: filtered,
        groupedByUser: grouped,
        unreadCount: unread,
        types: uniqueTypes,
      };
    }, [notifications, filterType, searchTerm]);

  // Toggle user group expansion
  const toggleUserGroup = useCallback((username) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(username)) {
        next.delete(username);
      } else {
        next.add(username);
      }
      return next;
    });
  }, []);

  // Toggle notification selection
  const toggleNotificationSelection = useCallback((notificationId) => {
    setSelectedNotifications((prev) => {
      const next = new Set(prev);
      if (next.has(notificationId)) {
        next.delete(notificationId);
      } else {
        next.add(notificationId);
      }
      return next;
    });
  }, []);

  // Select all notifications
  const toggleSelectAll = useCallback(() => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(
        new Set(filteredNotifications.map((n) => n.$id))
      );
    }
  }, [filteredNotifications]);

  // Mark as read
  const toggleReadStatus = async (note) => {
    try {
      const response = await markNotificationsAsRead([note.$id]);
      if (response?.updated > 0) {
        setNotifications((prev) =>
          prev.map((n) => (n.$id === note.$id ? { ...n, read: true } : n))
        );
        toast.success("Notification marked as read");
      }
    } catch (err) {
      console.error("Failed to update read status:", err);
      toast.error("Failed to update notification");
    }
  };

  // Mark multiple as read
  const markSelectedAsRead = async () => {
    if (selectedNotifications.size === 0) {
      toast.warning("No notifications selected");
      return;
    }

    try {
      const response = await markNotificationsAsRead(
        Array.from(selectedNotifications)
      );
      if (response?.updated > 0) {
        setNotifications((prev) =>
          prev.map((n) =>
            selectedNotifications.has(n.$id) ? { ...n, read: true } : n
          )
        );
        setSelectedNotifications(new Set());
        toast.success(`${response.updated} notifications marked as read`);
      }
    } catch (err) {
      console.error("Failed to update read status:", err);
      toast.error("Failed to update notifications");
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (notifications.length === 0) {
      toast.info("No notifications to clear");
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to clear all ${notifications.length} notifications?`
      )
    ) {
      try {
        await clearAllNotifications();
        setNotifications([]);
        toast.success("All notifications cleared");
      } catch (err) {
        console.error("Error clearing notifications:", err);
        toast.error("Failed to clear notifications");
      }
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "order":
        return <ShoppingBag className="w-5 h-5 text-[#D4A017]" />;
      case "user":
        return <User className="w-5 h-5 text-[#3498DB]" />;
      case "system":
        return <AlertCircle className="w-5 h-5 text-[#F39C12]" />;
      case "payment":
        return <CheckCircle className="w-5 h-5 text-[#27AE60]" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-[#E74C3C]" />;
      case "delivery_update":
        return <Package className="w-5 h-5 text-[#9B59B6]" />;
      default:
        return <Bell className="w-5 h-5 text-[#9B59B6]" />;
    }
  };

  // Get notification type badge
  const getTypeBadge = (type) => {
    const typeConfig = {
      order: {
        color: "bg-gradient-to-r from-[#D4A017] to-[#B8860B]",
        label: "Order",
      },
      user: {
        color: "bg-gradient-to-r from-[#3498DB] to-[#2980B9]",
        label: "User",
      },
      system: {
        color: "bg-gradient-to-r from-[#F39C12] to-[#D68910]",
        label: "System",
      },
      payment: {
        color: "bg-gradient-to-r from-[#27AE60] to-[#2ECC71]",
        label: "Payment",
      },
      warning: {
        color: "bg-gradient-to-r from-[#E74C3C] to-[#C0392B]",
        label: "Warning",
      },
      delivery_update: {
        color: "bg-gradient-to-r from-[#9B59B6] to-[#8E44AD]",
        label: "Delivery",
      },
    };

    const config = typeConfig[type?.toLowerCase()] || {
      color: "bg-gradient-to-r from-[#7F8C8D] to-[#616A6B]",
      label: type || "Notification",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-bold ${config.color} text-white`}
      >
        {config.label}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-[#E8D6B5]/30 dark:bg-[#3A3A3A] rounded-xl"></div>
            <div className="h-12 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-xl"></div>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
                Notifications Center
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                Stay updated with all marketplace activities and alerts
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  setViewMode(viewMode === "grouped" ? "list" : "grouped")
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium"
              >
                {viewMode === "grouped"
                  ? "Switch to List View"
                  : "Switch to Grouped View"}
              </button>
              <button
                onClick={() => window.forceRefreshNotifications?.()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              >
                <Package className="w-4 h-4" />
                Force Refresh
              </button>
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
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
                  Total Notifications
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {notifications.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#27AE60] flex items-center gap-1">
              Real-time updates
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Unread
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {unreadCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                <EyeOff className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#E74C3C] flex items-center gap-1">
              {unreadCount > 0 ? "Needs attention" : "All caught up"}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Types
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {types.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                <Filter className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#9B59B6] flex items-center gap-1">
              Different categories
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Today
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {
                    notifications.filter((n) => {
                      const today = new Date();
                      const noteDate = new Date(n.timestamp || n.$createdAt);

                      // Reset time to 00:00:00 for both dates to compare only the date part
                      const todayDateOnly = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate()
                      );
                      const noteDateOnly = new Date(
                        noteDate.getFullYear(),
                        noteDate.getMonth(),
                        noteDate.getDate()
                      );

                      return todayDateOnly.getTime() === noteDateOnly.getTime();
                    }).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#27AE60] flex items-center gap-1">
              New today
            </div>
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 mb-6 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search notifications by message, user, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              />
            </div>

            {/* Filter & Controls */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-[#E8D6B5] text-[#D4A017] focus:ring-[#D4A017]"
                />
                <span className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                  Auto-refresh
                </span>
              </label>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.size > 0 && (
            <div className="flex items-center justify-between p-4 mt-4 rounded-xl bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A]/50 dark:to-[#3A3A3A]/30 border border-[#E8D6B5] dark:border-[#3A3A3A]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {selectedNotifications.size}
                  </span>
                </div>
                <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                  {selectedNotifications.size} notification
                  {selectedNotifications.size === 1 ? "" : "s"} selected
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={markSelectedAsRead}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white text-sm font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Mark as Read
                </button>
                <button
                  onClick={() => setSelectedNotifications(new Set())}
                  className="px-4 py-2 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Display */}
        <div className="space-y-6">
          {filteredNotifications.length === 0 ? (
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-12 text-center shadow-xl">
              <Bell className="w-16 h-16 text-[#E8D6B5] dark:text-[#3A3A3A] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
                No notifications found
              </h3>
              <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "All caught up! No new notifications"}
              </p>
            </div>
          ) : viewMode === "grouped" ? (
            // Grouped View
            Object.keys(groupedByUser).map((username) => {
              const userNotifications = groupedByUser[username];
              const unreadCount = userNotifications.filter(
                (n) => !n.read
              ).length;
              const isExpanded = expandedUsers.has(username);

              return (
                <div
                  key={username}
                  className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden shadow-xl"
                >
                  {/* User Header */}
                  <button
                    onClick={() => toggleUserGroup(username)}
                    className="w-full p-6 flex items-center justify-between hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                          {username}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                            {userNotifications.length} notification
                            {userNotifications.length === 1 ? "" : "s"}
                          </span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white text-xs font-bold">
                              {unreadCount} unread
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#8B4513] dark:text-[#D4A017]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#8B4513] dark:text-[#D4A017]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Notifications */}
                  {isExpanded && (
                    <div className="px-6 pb-6">
                      <div className="space-y-3">
                        {userNotifications.map((note) => (
                          <div
                            key={note.$id}
                            className={`p-4 rounded-xl border ${
                              note.read
                                ? "border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50"
                                : "border-[#D4A017] dark:border-[#D4A017] bg-gradient-to-r from-[#FFF9E6] to-[#FFEBB2] dark:from-[#3A2C1A] dark:to-[#2A1C0A]"
                            } hover:shadow-md transition-all duration-200`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Checkbox */}
                              <label className="mt-1">
                                <input
                                  type="checkbox"
                                  checked={selectedNotifications.has(note.$id)}
                                  onChange={() =>
                                    toggleNotificationSelection(note.$id)
                                  }
                                  className="rounded border-[#E8D6B5] text-[#D4A017] focus:ring-[#D4A017]"
                                />
                              </label>

                              {/* Icon */}
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A] dark:to-[#2A2A2A] flex items-center justify-center">
                                {getNotificationIcon(note.type)}
                              </div>

                              {/* Content */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                                      {note.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {getTypeBadge(note.type)}
                                      {!note.read && (
                                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white text-xs font-bold">
                                          New
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleReadStatus(note)}
                                      className={`p-2 rounded-lg ${
                                        note.read
                                          ? "bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017]"
                                          : "bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white"
                                      } hover:shadow transition-colors`}
                                    >
                                      {note.read ? (
                                        <EyeOff className="w-4 h-4" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors">
                                      <MoreVertical className="w-4 h-4 text-gray-400" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-3">
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(
                                        note.timestamp || note.$createdAt
                                      ).toLocaleString()}
                                    </span>
                                    {note.userEmail && (
                                      <span className="flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {note.userEmail}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // List View
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#E8D6B5]/10 to-[#F5E6D3]/5 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A]/50">
                      <th className="px-6 py-4 text-left">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              selectedNotifications.size ===
                                filteredNotifications.length &&
                              filteredNotifications.length > 0
                            }
                            onChange={toggleSelectAll}
                            className="rounded border-[#E8D6B5] text-[#D4A017] focus:ring-[#D4A017]"
                          />
                        </label>
                      </th>
                      {[
                        "Type",
                        "User",
                        "Message",
                        "Status",
                        "Time",
                        "Actions",
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D6B5]/30 dark:divide-[#3A3A3A]">
                    {filteredNotifications.map((note) => (
                      <tr
                        key={note.$id}
                        className={`hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors ${
                          !note.read
                            ? "bg-gradient-to-r from-[#FFF9E6]/50 to-[#FFEBB2]/50 dark:from-[#3A2C1A]/50 dark:to-[#2A1C0A]/50"
                            : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-6 py-4">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedNotifications.has(note.$id)}
                              onChange={() =>
                                toggleNotificationSelection(note.$id)
                              }
                              className="rounded border-[#E8D6B5] text-[#D4A017] focus:ring-[#D4A017]"
                            />
                          </label>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">{getTypeBadge(note.type)}</td>

                        {/* User */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                                {note.username || "Unknown"}
                              </p>
                              {note.userEmail && (
                                <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                                  {note.userEmail}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Message */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                            {note.message}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                note.read
                                  ? "bg-[#27AE60]"
                                  : "bg-[#E74C3C] animate-pulse"
                              }`}
                            ></div>
                            <span
                              className={`text-xs font-semibold ${
                                note.read ? "text-[#27AE60]" : "text-[#E74C3C]"
                              }`}
                            >
                              {note.read ? "Read" : "Unread"}
                            </span>
                          </div>
                        </td>

                        {/* Time */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                            {new Date(
                              note.timestamp || note.$createdAt
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(
                              note.timestamp || note.$createdAt
                            ).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleReadStatus(note)}
                              className={`p-2 rounded-lg ${
                                note.read
                                  ? "bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017]"
                                  : "bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white"
                              } hover:shadow transition-colors`}
                              title={
                                note.read ? "Mark as unread" : "Mark as read"
                              }
                            >
                              {note.read ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Footer */}
          <div className="mt-8 p-6 rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-gradient-to-r from-[#E8D6B5]/10 to-[#D4A017]/5 dark:from-[#3A3A3A]/30 dark:to-[#2A2A2A]/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Notifications are updated in real-time
                </p>
                <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium">
                  <Download className="w-4 h-4" />
                  Export Logs
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium">
                  <Bell className="w-4 h-4" />
                  Notification Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
