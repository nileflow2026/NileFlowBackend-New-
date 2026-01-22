import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getCommissionSettings,
  updateCommissionRate,
  getCommissionAnalytics,
  getGMVData,
  batchRecalculateCommissions,
} from "../../adminService";

const COLORS = ["#D4A017", "#8B6914", "#F4A460", "#DAA520"];

export default function Commission() {
  const [commissionRate, setCommissionRate] = useState(0);
  const [newRate, setNewRate] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [gmvData, setGmvData] = useState(null);
  const [timeframe, setTimeframe] = useState("last30");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchCommissionData();
  }, [timeframe]);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      
      // Fetch commission settings
      const settingsData = await getCommissionSettings();
      setCommissionRate(settingsData.commission_rate);
      setNewRate(settingsData.commission_rate.toString());

      // Fetch analytics data
      const analyticsData = await getCommissionAnalytics(timeframe);
      setAnalytics(analyticsData);

      // Fetch GMV data
      const gmvData = await getGMVData(timeframe);
      setGmvData(gmvData);

    } catch (error) {
      console.error("Error fetching commission data:", error);
      showMessage("Failed to fetch commission data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRate = async () => {
    if (newRate === "" || isNaN(newRate) || newRate < 0 || newRate > 100) {
      showMessage("Please enter a valid commission rate (0-100%)", "error");
      return;
    }

    try {
      setUpdating(true);
      await updateCommissionRate(parseFloat(newRate));
      setCommissionRate(parseFloat(newRate));
      showMessage("Commission rate updated successfully", "success");
      
      // Refresh analytics after rate update
      setTimeout(() => fetchCommissionData(), 1000);
    } catch (error) {
      console.error("Error updating commission rate:", error);
      showMessage("Failed to update commission rate", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleBatchRecalculate = async () => {
    if (!confirm("This will recalculate commissions for all eligible orders. This may take some time. Continue?")) {
      return;
    }

    try {
      setRecalculating(true);
      const result = await batchRecalculateCommissions({
        timeframe: timeframe
      });
      showMessage(`Successfully recalculated commissions for ${result.processed_orders} orders`, "success");
      
      // Refresh data after recalculation
      setTimeout(() => fetchCommissionData(), 2000);
    } catch (error) {
      console.error("Error batch recalculating commissions:", error);
      showMessage("Failed to recalculate commissions", "error");
    } finally {
      setRecalculating(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#D4A017]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
            💰 Commission Management
          </h1>
          <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
            Manage commission rates and track GMV performance
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-[#FAF7F2] dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
          >
            <option value="last7">📅 Last 7 Days</option>
            <option value="last30">📅 Last 30 Days</option>
            <option value="last90">📅 Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Success/Error Message */}
      {message.text && (
        <div className={`p-4 rounded-xl border ${
          message.type === "success" 
            ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300"
        }`}>
          {message.text}
        </div>
      )}

      {/* Commission Rate Settings */}
      <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
              ⚙️ Commission Rate Settings
            </h2>
            <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
              Current rate: <span className="font-semibold text-[#D4A017]">{commissionRate}%</span>
            </p>
          </div>
          <div className="text-3xl font-bold text-[#D4A017]">
            {commissionRate}%
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3] mb-2">
              New Commission Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-[#FAF7F2] dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
              placeholder="Enter rate (e.g., 5.5)"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpdateRate}
              disabled={updating}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? "Updating..." : "Update Rate"}
            </button>
            <button
              onClick={handleBatchRecalculate}
              disabled={recalculating}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recalculating ? "Recalculating..." : "Recalculate All"}
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 font-medium">Total GMV</p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  KSh {analytics.total_gmv?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 font-medium">Total Commission</p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  KSh {analytics.total_commission_earned?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 font-medium">Commission Orders</p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {analytics.orders_with_commission || 0}
                </p>
              </div>
              <div className="text-3xl">🛒</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 font-medium">Avg Commission</p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  KSh {analytics.average_commission_per_order?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {gmvData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GMV Trend */}
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-6">
              📊 GMV Trend Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={gmvData.daily_gmv || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D6B5" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#8B4513" 
                  strokeOpacity={0.7} 
                  fontSize={12}
                  tickFormatter={(value) => format(new Date(value), "MMM dd")}
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
                  formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, "GMV"]}
                  labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
                />
                <Line
                  type="monotone"
                  dataKey="gmv"
                  stroke="#D4A017"
                  strokeWidth={3}
                  dot={{ stroke: "#B8860B", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#D4A017" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Commission Earnings */}
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-6">
              💰 Commission Earnings
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gmvData.daily_gmv || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D6B5" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#8B4513" 
                  strokeOpacity={0.7} 
                  fontSize={12}
                  tickFormatter={(value) => format(new Date(value), "MMM dd")}
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
                  formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, "Commission"]}
                  labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
                />
                <Bar
                  dataKey="commission"
                  fill="url(#goldGradient)"
                  radius={[4, 4, 0, 0]}
                >
                  {(gmvData.daily_gmv || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`rgba(212, 160, 23, ${0.7 + index * 0.05})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Vendors by Commission */}
      {analytics?.top_vendors && (
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-6">
            🏆 Top Vendors by Commission
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8D6B5]/30">
                  <th className="text-left py-3 px-4 text-[#2C1810] dark:text-[#F5E6D3] font-semibold">Vendor</th>
                  <th className="text-left py-3 px-4 text-[#2C1810] dark:text-[#F5E6D3] font-semibold">Orders</th>
                  <th className="text-left py-3 px-4 text-[#2C1810] dark:text-[#F5E6D3] font-semibold">Total GMV</th>
                  <th className="text-left py-3 px-4 text-[#2C1810] dark:text-[#F5E6D3] font-semibold">Commission Earned</th>
                </tr>
              </thead>
              <tbody>
                {analytics.top_vendors.map((vendor, index) => (
                  <tr key={index} className="border-b border-[#E8D6B5]/20 hover:bg-[#E8D6B5]/10">
                    <td className="py-3 px-4 text-[#2C1810] dark:text-[#F5E6D3]">{vendor.vendor_id || 'N/A'}</td>
                    <td className="py-3 px-4 text-[#2C1810] dark:text-[#F5E6D3]">{vendor.order_count}</td>
                    <td className="py-3 px-4 text-[#2C1810] dark:text-[#F5E6D3]">KSh {vendor.total_gmv?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-[#D4A017] font-semibold">KSh {vendor.total_commission?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}