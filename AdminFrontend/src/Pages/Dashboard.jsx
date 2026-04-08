/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { account } from "../../appwrite";
import { format, subDays } from "date-fns";
import html2pdf from "html2pdf.js";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

import {
  getOrders,
  getProducts,
  updateOrderStatus,
  getProfile,
  fetchUsers,
  getCommissionAnalytics,
} from "../../adminService";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import DashboardCard from "../components/DashboardCard";

import Users from "../Pages/Users";
import Orders from "../Pages/Orders";
import Products from "../Pages/Products";
import Staff from "./Staff";
import Settings from "./Settings";
import AuditLogs from "./AuditLogs";
import SendNewsletter from "../Pages/SendNewsletter";
import AdminMessages from "./AdminMessages";
import ApplicantsDashboard from "./ApplicantsDashboard";
import { useAuth } from "../context/AuthContext";
import { getCurrentUser } from "../../authService";
import ProductApprovals from "./ProductApprovals";
import Commission from "./Commission";
import Finance from "./Finance";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

export default function Dashboard() {
  const [section, setSection] = useState("Dashboard");
  const [users, setUser] = useState(null);
  const [userCount, setUserCount] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [revenue, setRevenue] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [dateRange, setDateRange] = useState("last7");
  const [drillData, setDrillData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [commissionData, setCommissionData] = useState(null);
  const { user } = useAuth();
  console.log("useAuth()", useAuth());

  const getDateFilter = () => {
    const today = new Date();
    switch (dateRange) {
      case "last30":
        return subDays(today, 30);
      case "last90":
        return subDays(today, 90);
      default:
        return subDays(today, 7);
    }
  };

  /* console.log("Orders before filter:", orders); */
  const filteredOrders = orders.filter((order) => {
    const createdAt = new Date(order.$createdAt);
    return createdAt >= getDateFilter();
  });

  const revenueData = filteredOrders.map((order) => ({
    name: format(new Date(order.$createdAt), "MMM dd"),
    amount: Number(order.amount || 0),
  }));

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    const fetchData = async () => {
      try {
        const fetchedOrders = await getOrders();
        const fetchedProducts = await getProducts();
        const fetchedUsers = await fetchUsers();

        setOrders(fetchedOrders);
        setProducts(fetchedProducts);
        setUserCount(fetchedUsers);

        // Fetch commission data
        try {
          const commissionAnalytics = await getCommissionAnalytics(dateRange);
          setCommissionData(commissionAnalytics);
        } catch (commissionError) {
          console.warn("Commission data not available:", commissionError);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    /* fetchUser(); */
    fetchData();
  }, [dateRange]);

  useEffect(() => {
    // Calculate revenue & chartData
    const total = orders.reduce(
      (sum, order) => sum + Number(order.amount || 0),
      0,
    );
    setRevenue(total);

    const dailyStats = {};

    orders.forEach((order) => {
      const date = new Date(order.$createdAt);
      const day = date.toLocaleDateString("en-US", { weekday: "short" });

      if (!dailyStats[day]) {
        dailyStats[day] = { orders: 0, revenue: 0 };
      }

      dailyStats[day].orders += 1;
      dailyStats[day].revenue += Number(order.amount || 0);
    });

    const chartArray = Object.entries(dailyStats).map(([name, data]) => ({
      name,
      ...data,
    }));

    setChartData(chartArray);
  }, [orders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) =>
          o.$id === orderId ? { ...o, orderStatus: newStatus } : o,
        ),
      );
    } catch (error) {
      console.error("Status update failed:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDrillDown = (e) => {
    if (!e || !e.activeLabel) return;
    const label = e.activeLabel;
    const selectedOrders = filteredOrders.filter(
      (o) => format(new Date(o.$createdAt), "MMM dd") === label,
    );
    setDrillData(selectedOrders);
  };

  const exportToCSV = (data, filename) => {
    if (!data.length) return;
    const csvRows = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    const element = document.getElementById("dashboard-content");
    html2pdf().from(element).save("dashboard-report.pdf");
  };

  const renderContent = () => {
    switch (section) {
      case "Users":
        return <Users />;
      case "Orders":
        return <Orders />;
      case "Products":
        return <Products />;
      case "Staff":
        return <Staff />;
      case "Approved Products":
        return <ProductApprovals />;
      case "Admin Actions":
        return <AuditLogs />;
      case "NewsLetter":
        return <SendNewsletter />;
      case "Applications":
        return <ApplicantsDashboard />;
      case "Customer Messages":
        return <AdminMessages />;
      case "Settings":
        return <Settings />;
      case "Commission":
        return <Commission />;
      case "Finance":
        return <Finance />;

      default:
        return (
          <div
            id="dashboard-content"
            className="flex flex-col gap-6 md:gap-8 p-4 md:p-6"
          >
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
                  Dashboard Overview
                </h1>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                  Real-time insights into your marketplace performance
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                {/* Date Range Selector */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-4 py-2.5 pl-10 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-[#FAF7F2] dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent appearance-none"
                  >
                    <option value="last7">📅 Last 7 Days</option>
                    <option value="last30">📅 Last 30 Days</option>
                    <option value="last90">📅 Last 90 Days</option>
                  </select>
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                    📆
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => exportToCSV(filteredOrders, "orders")}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/50 flex items-center justify-center gap-2"
                  >
                    📥 Export CSV
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 flex items-center justify-center gap-2"
                  >
                    📄 Export PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              <DashboardCard
                title="Total Users"
                value={userCount.length.toString()}
                icon="👥"
                color="blue"
                trend={12.5}
                description="Active marketplace users"
              />
              <DashboardCard
                title="Total Orders"
                value={orders.length.toString()}
                icon="🛒"
                color="green"
                trend={8.3}
                description="Completed transactions"
              />
              <DashboardCard
                title="Products"
                value={products.length.toString()}
                icon="📦"
                color="purple"
                trend={15.2}
                description="Active listings"
              />
              <DashboardCard
                title="Revenue"
                value={`KSh ${revenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                icon="💰"
                color="gold"
                trend={23.1}
                description="This month's revenue"
              />
              <DashboardCard
                title="Commission Earned"
                value={`KSh ${commissionData?.total_commission_earned?.toLocaleString() || "0"}`}
                icon="💎"
                color="amber"
                trend={commissionData?.commission_growth || 0}
                description="Platform commission"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Revenue Over Time */}
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-5 md:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    📈 Revenue Trend
                  </h2>
                  <div className="text-xs font-medium px-3 py-1 rounded-full bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017]">
                    Last 30 days
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={revenueData} onClick={handleDrillDown}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E8D6B5"
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#8B4513"
                      strokeOpacity={0.7}
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#8B4513"
                      strokeOpacity={0.7}
                      fontSize={12}
                      tickFormatter={(value) => `KSh ${value.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FAF7F2",
                        border: "1px solid #E8D6B5",
                        borderRadius: "8px",
                        color: "#2C1810",
                      }}
                      formatter={(value) => [
                        `KSh ${Number(value).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#D4A017"
                      strokeWidth={3}
                      dot={{ stroke: "#B8860B", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: "#D4A017" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Order Volume */}
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-5 md:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    📊 Order Volume
                  </h2>
                  <div className="text-xs font-medium px-3 py-1 rounded-full bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017]">
                    Weekly average
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E8D6B5"
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#8B4513"
                      strokeOpacity={0.7}
                      fontSize={12}
                    />
                    <YAxis stroke="#8B4513" strokeOpacity={0.7} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FAF7F2",
                        border: "1px solid #E8D6B5",
                        borderRadius: "8px",
                        color: "#2C1810",
                      }}
                    />
                    <Bar
                      dataKey="orders"
                      radius={[4, 4, 0, 0]}
                      fill="url(#goldGradient)"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`rgba(212, 160, 23, ${0.7 + index * 0.1})`}
                        />
                      ))}
                    </Bar>
                    <defs>
                      <linearGradient
                        id="goldGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#D4A017"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#B8860B"
                          stopOpacity={0.9}
                        />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue Share */}
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-5 md:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    🍕 Revenue Distribution
                  </h2>
                  <div className="text-xs font-medium px-3 py-1 rounded-full bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017]">
                    Category share
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="#FAF7F2"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-[#2C1810] dark:text-[#F5E6D3]">
                          {value}
                        </span>
                      )}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `KSh ${Number(value).toLocaleString()}`,
                        "Revenue",
                      ]}
                      contentStyle={{
                        backgroundColor: "#FAF7F2",
                        border: "1px solid #E8D6B5",
                        borderRadius: "8px",
                        color: "#2C1810",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Products */}
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-5 md:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    🏆 Top Performing Products
                  </h2>
                  <div className="text-xs font-medium px-3 py-1 rounded-full bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017]">
                    By sales volume
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={products.slice(0, 5).map((product) => ({
                      name:
                        product.productName.length > 15
                          ? product.productName.substring(0, 15) + "..."
                          : product.productName,
                      sales: product.salesCount || 0,
                      fullName: product.productName,
                    }))}
                    layout="vertical"
                  >
                    <XAxis
                      type="number"
                      stroke="#8B4513"
                      strokeOpacity={0.7}
                      fontSize={12}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#8B4513"
                      strokeOpacity={0.7}
                      fontSize={12}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value} units`,
                        props.payload.fullName,
                      ]}
                      contentStyle={{
                        backgroundColor: "#FAF7F2",
                        border: "1px solid #E8D6B5",
                        borderRadius: "8px",
                        color: "#2C1810",
                      }}
                    />
                    <Bar
                      dataKey="sales"
                      radius={[0, 4, 4, 0]}
                      fill="url(#greenGradient)"
                    />
                    <defs>
                      <linearGradient
                        id="greenGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="5%"
                          stopColor="#27AE60"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2ECC71"
                          stopOpacity={0.9}
                        />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Drill Down Section */}
            {drillData && (
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-5 md:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    📋 Detailed Orders Breakdown
                  </h3>
                  <button
                    onClick={() => setDrillData(null)}
                    className="text-sm text-[#8B4513] dark:text-[#D4A017] hover:underline"
                  >
                    Close details
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {drillData.slice(0, 6).map((order) => (
                    <div
                      key={order.$id}
                      className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50 hover:bg-white dark:hover:bg-[#2A2A2A] transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-[#8B4513] dark:text-[#D4A017]">
                          #{order.$id.substring(0, 8)}...
                        </span>
                        <span className="text-sm font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                          KSh {Number(order.total).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(order.updatedAt).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders Table */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-5 md:p-6 shadow-lg overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    📋 Recent Orders
                  </h2>
                  <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                    Latest transactions in your marketplace
                  </p>
                </div>
                <div className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] mt-2 sm:mt-0">
                  Last 30 orders
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A]">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#E8D6B5]/10 to-[#F5E6D3]/5 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A]/50">
                      {[
                        "Order ID",
                        "Customer",
                        "Status",
                        "Order Status",
                        "Update",
                        "Amount",
                        "Created",
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D6B5]/30 dark:divide-[#3A3A3A]">
                    {orders.slice(0, 5).map((order) => (
                      <tr
                        key={order.$id}
                        className="hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          <span className="font-mono">
                            #{order.$id.substring(0, 8)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                          {order.customerEmail}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              order.status === "Shipped"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : order.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            }`}
                          >
                            {order.status === "Shipped"
                              ? "🚚 "
                              : order.status === "Pending"
                                ? "⏳ "
                                : "✅ "}
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              order.orderStatus === "Shipped"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            }`}
                          >
                            {order.orderStatus === "Shipped" ? "📦 " : "✅ "}
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {renderStatusDropdown(order)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                          KSh {Number(order.amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(order.updatedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {orders.length > 5 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setSection("Orders")}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#8B4513] dark:text-[#D4A017] hover:text-[#B8860B] dark:hover:text-[#FFD700] transition-colors"
                  >
                    View all orders
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  /* const renderContent = () => {
    switch (section) {
      case "Users":
        return <Users />;
      case "Orders":
        return <Orders />;
      case "Products":
        return <Products />;
      case "Staff":
        return <Staff />;
      case "Admin Actions":
        return <AuditLogs />;

      case "NewsLetter":
        return <SendNewsletter />;

      case "Applications":
        return <ApplicantsDashboard />;

      case "Customer Messages":
        return <AdminMessages />;
      case "Settings":
        return <Settings />;

      default:
        return (
          <div id="dashboard-content" className="flex flex-col gap-8">
            
            <div className="flex items-center justify-between mb-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border p-2 rounded dark:bg-gray-800 dark:text-white"
              >
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="last90">Last 90 Days</option>
              </select>
              <div className="space-x-2">
                <button
                  onClick={() => exportToCSV(filteredOrders, "orders")}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Export CSV
                </button>
                <button
                  onClick={exportToPDF}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Export PDF
                </button>
              </div>
            </div>

            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <DashboardCard
                title="Users"
                value={userCount.length.toString()}
                icon="👤"
                color="bg-blue-500"
              />
              <DashboardCard
                title="Orders"
                value={orders.length.toString()}
                icon="🛒"
              />
              <DashboardCard
                title="Products"
                value={products.length.toString()}
                icon="📦"
              />
              <DashboardCard title="Revenue" value={`$${revenue.toFixed(2)}`} />
            </div>

       
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
                <h2 className="text-lg font-semibold mb-4">
                  Revenue Over Time
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData} onClick={handleDrillDown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
                <h2 className="text-lg font-semibold mb-4">Order Volume</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md">
                <h2 className="text-lg font-semibold mb-4">Revenue Share</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                <h2 className="text-lg font-bold mb-4">Top Products</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={products.map((product) => ({
                      name: product.productName,
                      sales: product.salesCount || 0, // default to 0 if missing
                    }))}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {drillData && (
                <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded shadow">
                  <h3 className="font-semibold mb-2">Detailed Orders</h3>
                  <ul className="space-y-2">
                    {drillData.map((order) => (
                      <li key={order.$id} className="border-b pb-2">
                        <span className="font-medium">Order ID:</span>{" "}
                        {order.$id} |{" "}
                        <span className="font-medium">Amount:</span> $
                        {order.total}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow overflow-x-auto">
              <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left text-sm text-gray-500 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">OrderStatus</th>
                    <th className="px-6 py-4">OrderUpdate</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">CreatedAt</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.$id}
                      className="text-sm border-b border-gray-100 dark:border-gray-700"
                    >
                      <td className="py-2">{order.$id}</td>
                      <td>{order.customerEmail}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            order.status === "Shipped"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "Pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            order.orderStatus === "Shipped"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="p-4">{renderStatusDropdown(order)}</td>
                      <td>{order.amount}</td>
                      <td>{new Date(order.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
    }
  }; */

  const renderStatusDropdown = (order) => (
    <select
      value={order.orderStatus}
      onChange={(e) => handleStatusChange(order.$id, e.target.value)}
      disabled={updatingId === order.$id}
      className="px-2 py-1 rounded text-xs  bg-gray-100 border border-gray-300 dark:text-black"
    >
      <option value="Ordered">Ordered</option>
      <option value="Processed">Processed</option>
      <option value="Shipped">Shipped</option>
      <option value="Out for Delivery">Out for Delivery</option>
      <option value="Delivered">Delivered</option>
    </select>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-black dark:text-white">
      <Sidebar
        setSection={setSection}
        current={section}
        setIsOpen={setIsSidebarOpen}
        isOpen={isSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
      </div>
    </div>
  );
}
