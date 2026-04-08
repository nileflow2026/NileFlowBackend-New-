/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  getOrders,
  getCancelledOrders,
  getRiders,
  assignRiderToOrder,
  updateOrderStatus,
  getCustomerAddress,
} from "../../adminService";
import {
  Package,
  Calendar,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  ChevronRight,
  MoreVertical,
  ExternalLink,
  Printer,
  FileText,
  ChevronDown,
  UserCheck,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [premiumFilter, setPremiumFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [riders, setRiders] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrderForAssignment, setSelectedOrderForAssignment] =
    useState(null);
  const [assigningRider, setAssigningRider] = useState(false);
  const [pickupAddress, setPickupAddress] = useState(
    "NileFlow Warehouse, Industrial Area, Nairobi"
  );
  const [addresses, setAddresses] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [showCancelledOnly, setShowCancelledOnly] = useState(false);

  const itemsPerPage = 10;

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = showCancelledOnly
          ? await getCancelledOrders()
          : await getOrders();
        setOrders(data);
        setError(null);
        const orderType = showCancelledOnly ? "cancelled orders" : "orders";
        toast.success(`${data.length} ${orderType} loaded successfully`);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.message || "Failed to load orders");
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [showCancelledOnly]);

  // Fetch riders
  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const ridersData = await getRiders();
        setRiders(ridersData);
      } catch (err) {
        console.error("Error fetching riders:", err);
        toast.error("Failed to load riders");
      }
    };

    fetchRiders();
  }, []);

  // Fetch customer address when order is expanded
  useEffect(() => {
    if (expandedOrder) {
      const order = orders.find((o) => o.$id === expandedOrder);
      if (order) {
        const customerId = order.userId || order.customerId;
        if (customerId && !addresses[customerId]) {
          fetchCustomerAddress(customerId, order.$id);
        }
      }
    }
  }, [expandedOrder, orders]); // Removed addresses from dependencies to avoid infinite loop

  // Handle rider assignment
  const handleAssignRider = async (riderId) => {
    if (!selectedOrderForAssignment || !riderId || !pickupAddress.trim()) {
      toast.error("Please provide all required information");
      return;
    }

    try {
      setAssigningRider(true);

      // Use the new API format with deliveryId, riderId, and pickupAddress
      await assignRiderToOrder({
        deliveryId: selectedOrderForAssignment.$id,
        riderId: riderId,
        pickupAddress: pickupAddress.trim(),
      });

      // Update the order in local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.$id === selectedOrderForAssignment.$id
            ? {
                ...order,
                assignedRider: riderId,
                riderInfo: riders.find((r) => r.$id === riderId),
                pickupAddress: pickupAddress.trim(),
              }
            : order
        )
      );

      toast.success("Delivery assigned successfully!");
      setShowAssignModal(false);
      setSelectedOrderForAssignment(null);
      setPickupAddress("NileFlow Warehouse, Industrial Area, Nairobi"); // Reset to default
    } catch (err) {
      console.error("Error assigning rider:", err);
      toast.error("Failed to assign delivery");
    } finally {
      setAssigningRider(false);
    }
  };

  // Open assignment modal
  const openAssignModal = (order) => {
    setSelectedOrderForAssignment(order);
    setPickupAddress("NileFlow Warehouse, Industrial Area, Nairobi"); // Reset to default
    setShowAssignModal(true);
  };

  // Function to fetch and cache customer delivery address
  const fetchCustomerAddress = async (customerId, orderId) => {
    if (!customerId || addresses[customerId]) {
      return addresses[customerId] || null;
    }

    try {
      const customerAddresses = await getCustomerAddress(customerId, "pickup");
      const deliveryAddress =
        customerAddresses.length > 0 ? customerAddresses[0] : null;

      setAddresses((prev) => ({
        ...prev,
        [customerId]: deliveryAddress,
      }));

      return deliveryAddress;
    } catch (error) {
      console.error("Error fetching customer address:", error);
      return null;
    }
  };

  // Get display address for order
  const getOrderShippingAddress = (order) => {
    const customerId = order.userId || order.customerId;
    const cachedAddress = addresses[customerId];

    if (cachedAddress) {
      // Format the complete address from the address collection
      const addressParts = [
        cachedAddress.address,
        cachedAddress.city,
        cachedAddress.state,
        cachedAddress.zipCode || cachedAddress.postalCode,
      ].filter(Boolean);

      return addressParts.join(", ");
    }

    // Fallback to order's shipping address or show loading
    return (
      order.deliveryAddress || order.deliveryAddress || "Address not available"
    );
  };

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter((order) => {
      const matchesSearch =
        order.$id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());

      // When viewing cancelled orders only, we don't need to filter by status again
      // since getCancelledOrders() already returns only cancelled orders
      const matchesStatus = showCancelledOnly
        ? true
        : statusFilter === "all" ||
          order.status?.toLowerCase() === statusFilter;

      const matchesDate =
        dateFilter === "all" ||
        (() => {
          const orderDate = new Date(order.createdAt || order.$createdAt);
          const today = new Date();
          switch (dateFilter) {
            case "today":
              return orderDate.toDateString() === today.toDateString();
            case "week":
              const weekAgo = new Date(today.setDate(today.getDate() - 7));
              return orderDate >= weekAgo;
            case "month":
              const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
              return orderDate >= monthAgo;
            default:
              return true;
          }
        })();

      const matchesPremium =
        premiumFilter === "all" ||
        (premiumFilter === "premium" && order.isPremiumOrder === true) ||
        (premiumFilter === "standard" && order.isPremiumOrder !== true);

      return matchesSearch && matchesStatus && matchesDate && matchesPremium;
    });

    // Sort orders
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "createdAt" || sortConfig.key === "updatedAt") {
        aValue = new Date(a[sortConfig.key] || a.$createdAt || 0);
        bValue = new Date(b[sortConfig.key] || b.$createdAt || 0);
      }

      if (sortConfig.key === "amount") {
        aValue = parseFloat(a.amount || 0);
        bValue = parseFloat(b.amount || 0);
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, dateFilter, sortConfig]);

  // Pagination
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedOrders, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);

  // Calculate statistics with month-over-month trends
  const orderStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Current month orders
    const currentMonthOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt || order.$createdAt);
      return (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    });

    // Previous month orders
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt || order.$createdAt);
      return (
        orderDate.getMonth() === prevMonth &&
        orderDate.getFullYear() === prevYear
      );
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (parseFloat(order.amount) || 0),
      0
    );
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate current month stats
    const currentMonthRevenue = currentMonthOrders.reduce(
      (sum, order) => sum + (parseFloat(order.amount) || 0),
      0
    );
    const currentMonthAvgOrder =
      currentMonthOrders.length > 0
        ? currentMonthRevenue / currentMonthOrders.length
        : 0;

    // Calculate previous month stats
    const prevMonthRevenue = prevMonthOrders.reduce(
      (sum, order) => sum + (parseFloat(order.amount) || 0),
      0
    );
    const prevMonthAvgOrder =
      prevMonthOrders.length > 0
        ? prevMonthRevenue / prevMonthOrders.length
        : 0;

    // Calculate percentage changes
    const ordersChange =
      prevMonthOrders.length > 0
        ? ((currentMonthOrders.length - prevMonthOrders.length) /
            prevMonthOrders.length) *
          100
        : 0;
    const revenueChange =
      prevMonthRevenue > 0
        ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
        : 0;
    const avgOrderChange =
      prevMonthAvgOrder > 0
        ? ((currentMonthAvgOrder - prevMonthAvgOrder) / prevMonthAvgOrder) * 100
        : 0;

    const statusCounts = orders.reduce((acc, order) => {
      const status = order.status?.toLowerCase() || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const premiumOrders = orders.filter(
      (order) => order.isPremiumOrder === true
    );
    const premiumRevenue = premiumOrders.reduce(
      (sum, order) => sum + (parseFloat(order.amount) || 0),
      0
    );
    const avgPremiumOrderValue =
      premiumOrders.length > 0 ? premiumRevenue / premiumOrders.length : 0;

    const today = new Date();
    const todayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt || order.$createdAt);
      return orderDate.toDateString() === today.toDateString();
    });
    const todayPremiumOrders = todayOrders.filter(
      (order) => order.isPremiumOrder === true
    );

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      statusCounts,
      todayOrders: todayOrders.length,
      pendingOrders: statusCounts.pending || 0,
      completedOrders: statusCounts.completed || statusCounts.delivered || 0,
      premiumOrders: premiumOrders.length,
      premiumRevenue,
      avgPremiumOrderValue,
      todayPremiumOrders: todayPremiumOrders.length,
      premiumPercentage:
        totalOrders > 0 ? (premiumOrders.length / totalOrders) * 100 : 0,
      trends: {
        ordersChange: ordersChange,
        revenueChange: revenueChange,
        avgOrderChange: avgOrderChange,
        pendingChange: 0, // Can be calculated if needed
      },
    };
  }, [orders]);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Handle toggling between all orders and cancelled orders
  const handleToggleCancelledOrders = (showCancelled) => {
    setShowCancelledOnly(showCancelled);
    setCurrentPage(1); // Reset to first page
    // Reset filters when switching views - when showing cancelled only, show all statuses within that subset
    setStatusFilter("all");
    setSearchTerm(""); // Also reset search to ensure all cancelled orders are visible
  };

  // Status badge component
  const getStatusBadge = useCallback((status) => {
    const statusConfig = {
      pending: {
        bg: "bg-gradient-to-r from-[#F39C12] to-[#D68910]",
        icon: <Clock className="w-3 h-3" />,
        label: "Pending",
      },
      processing: {
        bg: "bg-gradient-to-r from-[#3498DB] to-[#2980B9]",
        icon: <Package className="w-3 h-3" />,
        label: "Processing",
      },
      shipped: {
        bg: "bg-gradient-to-r from-[#9B59B6] to-[#8E44AD]",
        icon: <Truck className="w-3 h-3" />,
        label: "Shipped",
      },
      delivered: {
        bg: "bg-gradient-to-r from-[#27AE60] to-[#2ECC71]",
        icon: <CheckCircle className="w-3 h-3" />,
        label: "Delivered",
      },
      completed: {
        bg: "bg-gradient-to-r from-[#27AE60] to-[#2ECC71]",
        icon: <CheckCircle className="w-3 h-3" />,
        label: "Completed",
      },
      cancelled: {
        bg: "bg-gradient-to-r from-[#E74C3C] to-[#C0392B]",
        icon: <XCircle className="w-3 h-3" />,
        label: "Cancelled",
      },
      refunded: {
        bg: "bg-gradient-to-r from-[#7F8C8D] to-[#616A6B]",
        icon: <AlertCircle className="w-3 h-3" />,
        label: "Refunded",
      },
    };

    const config = statusConfig[status?.toLowerCase()] || {
      bg: "bg-gradient-to-r from-[#95A5A6] to-[#7F8C8D]",
      icon: <AlertCircle className="w-3 h-3" />,
      label: status || "Unknown",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} text-white shadow-sm`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  }, []);

  // Toggle order details
  const toggleOrderDetails = useCallback((orderId) => {
    setExpandedOrder((current) => (current === orderId ? null : orderId));
  }, []);

  // Loading skeleton
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#E74C3C] to-[#C0392B] flex items-center justify-center">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
            Failed to Load Orders
          </h3>
          <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-6">
            {error || "An error occurred while loading orders"}
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
                {showCancelledOnly ? "Cancelled Orders" : "Order Management"}
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                {showCancelledOnly
                  ? "View and manage cancelled customer orders"
                  : "Track, manage, and fulfill customer orders"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex gap-2 p-1 bg-white/50 dark:bg-[#2A2A2A] rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A]">
                <button
                  onClick={() => handleToggleCancelledOrders(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    !showCancelledOnly
                      ? "bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white shadow-sm"
                      : "text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]/50"
                  }`}
                >
                  All Orders
                </button>
                <button
                  onClick={() => handleToggleCancelledOrders(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    showCancelledOnly
                      ? "bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white shadow-sm"
                      : "text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]/50"
                  }`}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Cancelled Orders
                </button>
              </div>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium">
                <Printer className="w-4 h-4" />
                Print Report
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium">
                <Download className="w-4 h-4" />
                Export Orders
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <FileText className="w-4 h-4" />
                New Order
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {orderStats.totalOrders}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
            </div>
            <div
              className={`text-xs font-medium ${
                orderStats.trends.ordersChange >= 0
                  ? "text-[#27AE60]"
                  : "text-[#E74C3C]"
              } flex items-center gap-1`}
            >
              <TrendingUp
                className={`w-3 h-3 ${
                  orderStats.trends.ordersChange < 0 ? "rotate-180" : ""
                }`}
              />
              {orderStats.trends.ordersChange >= 0 ? "+" : ""}
              {orderStats.trends.ordersChange.toFixed(1)}% from last month
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Premium Orders
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {orderStats.premiumOrders}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                <span className="text-lg font-bold text-[#2C1810]">✨</span>
              </div>
            </div>
            <div className="text-xs font-medium text-[#D4A017] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {orderStats.premiumPercentage.toFixed(1)}% of total orders
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  KSh{" "}
                  {orderStats.totalRevenue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div
              className={`text-xs font-medium ${
                orderStats.trends.revenueChange >= 0
                  ? "text-[#27AE60]"
                  : "text-[#E74C3C]"
              } flex items-center gap-1`}
            >
              <TrendingUp
                className={`w-3 h-3 ${
                  orderStats.trends.revenueChange < 0 ? "rotate-180" : ""
                }`}
              />
              {orderStats.trends.revenueChange >= 0 ? "+" : ""}
              {orderStats.trends.revenueChange.toFixed(1)}% from last month
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Avg Order Value
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  KSh {orderStats.avgOrderValue.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <div
              className={`text-xs font-medium ${
                orderStats.trends.avgOrderChange >= 0
                  ? "text-[#27AE60]"
                  : "text-[#E74C3C]"
              } flex items-center gap-1`}
            >
              <TrendingUp
                className={`w-3 h-3 ${
                  orderStats.trends.avgOrderChange < 0 ? "rotate-180" : ""
                }`}
              />
              {orderStats.trends.avgOrderChange >= 0 ? "+" : ""}
              {orderStats.trends.avgOrderChange.toFixed(1)}% from last month
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Pending Orders
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {orderStats.pendingOrders}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#F39C12] to-[#D68910] flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div
              className={`text-xs font-medium ${
                orderStats.pendingOrders > 5
                  ? "text-[#F39C12]"
                  : "text-[#27AE60]"
              } flex items-center gap-1`}
            >
              <TrendingUp className="w-3 h-3" />
              {orderStats.pendingOrders > 5
                ? "Needs attention"
                : "Under control"}
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 mb-6 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search orders by ID, customer, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>

              <select
                value={premiumFilter}
                onChange={(e) => setPremiumFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              >
                <option value="all">All Orders</option>
                <option value="premium">Premium Only</option>
                <option value="standard">Standard Only</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setDateFilter("all");
                  setPremiumFilter("all");
                  setCurrentPage(1);
                }}
                className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white/80 dark:hover:bg-[#2A2A2A]/80 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#E8D6B5]/10 to-[#F5E6D3]/5 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A]/50">
                  {[
                    { key: null, label: "Order" },
                    { key: "customerEmail", label: "Customer" },
                    { key: "createdAt", label: "Date" },
                    { key: "status", label: "Status" },
                    { key: "amount", label: "Total" },
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
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <React.Fragment key={order.$id}>
                      <tr className="hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group">
                        {/* Order Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                                  Order #{order.$id.substring(0, 8)}...
                                </p>
                                {order.isPremiumOrder && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#2C1810] shadow-sm">
                                    ✨ PREMIUM
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {order.orderNumber || order.$id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                              {order.customerName || order.customerEmail}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {order.customerEmail}
                            </p>
                            {order.phone && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                📞 {order.phone}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(
                                order.createdAt || order.$createdAt
                              ).toLocaleDateString()}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(
                                order.createdAt || order.$createdAt
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {getStatusBadge(order.status)}
                        </td>

                        {/* Total */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                              KSh {parseFloat(order.amount || 0).toFixed(2)}
                            </p>
                            {order.paymentMethod && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                via {order.paymentMethod}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleOrderDetails(order.$id)}
                              className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                              title="View Details"
                            >
                              <ChevronDown
                                className={`w-4 h-4 text-[#8B4513] dark:text-[#D4A017] transition-transform ${
                                  expandedOrder === order.$id
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </button>
                            <button
                              className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                              title="View Order"
                            >
                              <Eye className="w-4 h-4 text-[#3498DB]" />
                            </button>
                            <button
                              className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                              title="Edit Order"
                            >
                              <Edit className="w-4 h-4 text-[#D4A017]" />
                            </button>
                            <button
                              onClick={() => openAssignModal(order)}
                              className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                              title="Assign Rider"
                            >
                              <UserCheck className="w-4 h-4 text-[#9B59B6]" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Order Details */}
                      {expandedOrder === order.$id && (
                        <tr className="bg-[#E8D6B5]/5 dark:bg-[#3A3A3A]/20">
                          <td colSpan="6" className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 rounded-xl bg-white/50 dark:bg-[#2A2A2A]/50 border border-[#E8D6B5] dark:border-[#3A3A3A]">
                              {/* Order Details */}
                              <div>
                                <h4 className="text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                                  Order Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Order ID:
                                    </span>
                                    <span className="font-medium font-mono">
                                      {order.$id}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Type:
                                    </span>
                                    <span>
                                      {order.isPremiumOrder ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#2C1810] shadow-sm">
                                          ✨ PREMIUM ORDER
                                        </span>
                                      ) : (
                                        <span className="text-gray-500 dark:text-gray-400">
                                          Standard Order
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Created:
                                    </span>
                                    <span>
                                      {new Date(
                                        order.$createdAt
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Updated:
                                    </span>
                                    <span>
                                      {new Date(
                                        order.updatedAt || order.$updatedAt
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Shipping Info */}
                              <div>
                                <h4 className="text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                                  Shipping Info
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Method:
                                    </span>
                                    <span>
                                      {order.shippingMethod || "Standard"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Tracking:
                                    </span>
                                    <span className="text-[#3498DB] hover:underline cursor-pointer">
                                      {order.$id || "Not available"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Address:
                                    </span>
                                    <span className="text-right">
                                      {getOrderShippingAddress(order)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Rider Info */}
                              <div>
                                <h4 className="text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                                  Delivery Rider
                                </h4>
                                <div className="space-y-2 text-sm">
                                  {order.assignedRider || order.riderInfo ? (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                          Rider:
                                        </span>
                                        <span className="font-medium">
                                          {order.riderInfo?.name ||
                                            order.riderInfo?.fullName ||
                                            "Assigned Rider"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                          Phone:
                                        </span>
                                        <span className="text-[#3498DB]">
                                          {order.riderInfo?.phone ||
                                            "Not available"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                          Vehicle:
                                        </span>
                                        <span>
                                          {order.riderInfo?.vehicleType ||
                                            "Not specified"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                          Status:
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#27AE60]/10 text-[#27AE60]">
                                          <Truck className="w-3 h-3 mr-1" />
                                          Assigned
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-center py-4">
                                      <UserCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        No rider assigned
                                      </p>
                                      <button
                                        onClick={() => openAssignModal(order)}
                                        className="mt-2 px-3 py-1 text-xs bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white rounded-lg hover:shadow-md transition-all"
                                      >
                                        Assign Rider
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Items */}
                              <div>
                                <h4 className="text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                                  Items
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Items:
                                    </span>
                                    <span>
                                      {(() => {
                                        if (!order.items) return "1 item(s)";
                                        if (Array.isArray(order.items))
                                          return `${order.items.length} item(s)`;
                                        if (typeof order.items === "string") {
                                          try {
                                            const parsed = JSON.parse(
                                              order.items
                                            );
                                            return Array.isArray(parsed)
                                              ? `${parsed.length} item(s)`
                                              : "1 item(s)";
                                          } catch {
                                            return "1 item(s)";
                                          }
                                        }
                                        if (typeof order.items === "number")
                                          return `${order.items} item(s)`;
                                        return "1 item(s)";
                                      })()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Subtotal:
                                    </span>
                                    <span>
                                      KSh{" "}
                                      {parseFloat(
                                        order.subtotal || order.amount
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    {/*  <span className="text-gray-600 dark:text-gray-400">
                                      Shipping:
                                    </span>
                                    <span>
                                      KSh{" "}
                                      {parseFloat(
                                        order.shippingFee || 0
                                      ).toFixed(2)}
                                    </span> */}
                                  </div>
                                  <div className="flex justify-between font-bold border-t border-[#E8D6B5] dark:border-[#3A3A3A] pt-2">
                                    <span>Total:</span>
                                    <span className="text-[#D4A017]">
                                      KSh {parseFloat(order.amount).toFixed(2)}
                                    </span>
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
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <Package className="w-16 h-16 text-[#E8D6B5] dark:text-[#3A3A3A] mx-auto mb-4" />
                      <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                        No orders found
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searchTerm ||
                        statusFilter !== "all" ||
                        dateFilter !== "all"
                          ? "Try adjusting your filters"
                          : "No orders have been placed yet"}
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
                      filteredAndSortedOrders.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    {filteredAndSortedOrders.length}
                  </span>{" "}
                  orders
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

        {/* Summary Footer */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                Conversion Rate
              </span>
              <span className="text-lg font-bold text-[#27AE60]">4.7%</span>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                Avg Processing Time
              </span>
              <span className="text-lg font-bold text-[#3498DB]">2.4 days</span>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                Customer Satisfaction
              </span>
              <span className="text-lg font-bold text-[#9B59B6]">94.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rider Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                Assign Delivery
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {selectedOrderForAssignment && (
              <div className="mb-6 p-4 bg-[#E8D6B5]/10 dark:bg-[#3A3A3A]/20 rounded-xl">
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-1">
                  Order Details:
                </p>
                <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                  #{selectedOrderForAssignment.$id.substring(0, 8)}...
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedOrderForAssignment.customerEmail}
                </p>
                <p className="text-sm text-[#D4A017] font-medium">
                  KSh{" "}
                  {parseFloat(selectedOrderForAssignment.amount || 0).toFixed(
                    2
                  )}
                </p>
              </div>
            )}

            {/* Pickup Address Field */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Pickup Address *
              </label>
              <textarea
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Enter the pickup address for this delivery..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent resize-none"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This address will be provided to the rider for pickup
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-semibold text-[#8B4513] dark:text-[#D4A017]">
                Select Rider:
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {riders.length > 0 ? (
                  riders.map((rider) => (
                    <button
                      key={rider.$id}
                      onClick={() => handleAssignRider(rider.$id)}
                      disabled={assigningRider || !pickupAddress.trim()}
                      className="w-full p-3 text-left rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3] truncate">
                            {rider.name ||
                              rider.fullName ||
                              `Rider ${rider.$id.substring(0, 6)}`}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            {rider.phone && (
                              <>
                                <Phone className="w-3 h-3" />
                                <span>{rider.phone}</span>
                              </>
                            )}
                            {rider.vehicleType && (
                              <>
                                <span>•</span>
                                <span>{rider.vehicleType}</span>
                              </>
                            )}
                          </div>
                          {rider.isActive === false && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No riders available
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Add riders to the system to assign deliveries
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 text-[#8B4513] dark:text-[#D4A017] border border-[#E8D6B5] dark:border-[#3A3A3A] rounded-xl hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/20 transition-colors"
              >
                Cancel
              </button>
            </div>

            {assigningRider && (
              <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#8B4513] dark:text-[#D4A017] font-medium">
                    Assigning delivery...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
