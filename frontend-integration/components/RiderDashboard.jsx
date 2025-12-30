import React, { useEffect, useState } from 'react';
import {
  Truck,
  Package,
  DollarSign,
  Star,
  CheckCircle,
  TrendingUp,
  Activity,
  MapPin,
  LogOut,
  XCircle,
  Navigation,
  Clock,
} from 'lucide-react';
import { useRiderAuth } from '../hooks/useRiderAuth'; // Your existing auth hook
import riderAuthAPI from '../api/riderAuthAPI'; // Your existing API
import RiderDeliveryMap from './RiderDeliveryMap';

const RiderDashboard = () => {
  const { rider, logout, updateStatus, loading: authLoading } = useRiderAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
  });
  const [activeTab, setActiveTab] = useState("active"); // active, completed, earnings, map
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    if (rider) {
      fetchDashboardData();
    }
  }, [rider]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch active deliveries using original approach
      const deliveriesResult = await riderAuthAPI.getRiderDeliveries({
        status: "assigned,picked_up,in_transit",
        limit: 10,
      });

      if (deliveriesResult.success) {
        // Use original simple data access pattern
        setDeliveries(deliveriesResult.data.deliveries || []);
        
        // Auto-select first active delivery for map view
        if (deliveriesResult.data.deliveries?.length > 0 && !selectedDelivery) {
          setSelectedDelivery(deliveriesResult.data.deliveries[0]);
        }
      }

      // Fetch completed deliveries
      const completedResult = await riderAuthAPI.getRiderDeliveries({
        status: "delivered",
        limit: 20,
      });

      if (completedResult.success) {
        setCompletedDeliveries(completedResult.data.deliveries || []);
      }

      // Fetch earnings
      const today = new Date().toISOString().split("T")[0];
      const earningsResult = await riderAuthAPI.getRiderEarnings(today, today);

      if (earningsResult.success) {
        setEarnings(earningsResult.data);

        // Calculate today's deliveries from actual delivery data
        const today = new Date().toISOString().split("T")[0];
        const allDeliveries = [
          ...(deliveriesResult.success
            ? deliveriesResult.data.deliveries || []
            : []),
          ...(completedResult.success
            ? completedResult.data.deliveries || []
            : []),
        ];

        const todayDeliveries = allDeliveries.filter((delivery) => {
          const deliveryDate = new Date(
            delivery.createdAt || delivery.assignedAt
          )
            .toISOString()
            .split("T")[0];
          return deliveryDate === today;
        });

        // Calculate stats
        setStats({
          todayDeliveries: todayDeliveries.length,
          todayEarnings: earningsResult.data.totalEarnings || 0,
          weekEarnings: 0, // You can fetch weekly data separately
          monthEarnings: 0, // You can fetch monthly data separately
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusLoading(true);
      const result = await updateStatus(newStatus);

      if (result.success) {
        // Status updated successfully
        console.log("Status updated to:", newStatus);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeliveryAction = async (deliveryId, action, status) => {
    try {
      const result = await riderAuthAPI.updateDeliveryStatus(
        deliveryId,
        status
      );

      if (result.success) {
        // Refresh deliveries
        fetchDashboardData();
        alert(`Delivery ${action} successfully!`);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Failed to update delivery:", error);
      alert("Failed to update delivery");
    }
  };

  // Handle delivery status updates from map component
  const handleMapStatusUpdate = (deliveryId, newStatus) => {
    // Update local state immediately for better UX
    setDeliveries(prevDeliveries => 
      prevDeliveries.map(delivery => 
        delivery.$id === deliveryId 
          ? { ...delivery, status: newStatus }
          : delivery
      )
    );

    // Refresh dashboard data to get latest from server
    setTimeout(() => {
      fetchDashboardData();
    }, 1000);
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getDeliveryStatusColor = (status) => {
    switch (status) {
      case "assigned":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "picked_up":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "in_transit":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "delivered":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "failed":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-900/30 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Truck className="w-10 h-10 text-blue-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-blue-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Rider Dashboard
                </h1>
                <p className="text-sm text-gray-400">
                  Welcome back, {rider?.name}
                </p>
              </div>
            </div>

            {/* Status Toggle & Actions */}
            <div className="flex items-center space-x-4">
              {/* Status Indicator */}
              <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(
                    rider?.status
                  )} animate-pulse`}
                ></div>
                <select
                  value={rider?.status || "offline"}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={statusLoading}
                  className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer"
                >
                  <option value="online">Online</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {/* Profile Menu */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg transition-colors border border-red-500/30"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Deliveries */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Today's Deliveries</h3>
            <p className="text-3xl font-bold text-white">
              {stats.todayDeliveries}
            </p>
          </div>

          {/* Today's Earnings */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Today's Earnings</h3>
            <p className="text-3xl font-bold text-white">
              KES {stats.todayEarnings.toFixed(2)}
            </p>
          </div>

          {/* Rating */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <Activity className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Your Rating</h3>
            <p className="text-3xl font-bold text-white">
              {rider?.rating?.toFixed(1) || "0.0"}
            </p>
          </div>

          {/* Total Deliveries */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Total Deliveries</h3>
            <p className="text-3xl font-bold text-white">
              {deliveries.length + completedDeliveries.length}
            </p>
          </div>
        </div>

        {/* Enhanced Tabs - Added Map Tab */}
        <div className="mb-6">
          <div className="flex space-x-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 border border-blue-500/20 inline-flex">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === "active"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Active Deliveries
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                activeTab === "map"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>Live Map</span>
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === "completed"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab("earnings")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === "earnings"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Earnings
            </button>
          </div>
        </div>

        {/* Live Map Tab - NEW */}
        {activeTab === "map" && (
          <div className="space-y-6">
            {/* Delivery Selector */}
            {deliveries.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-blue-500/20">
                <h3 className="text-lg font-semibold text-white mb-4">Select Active Delivery</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deliveries.map((delivery) => (
                    <button
                      key={delivery.$id}
                      onClick={() => setSelectedDelivery(delivery)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedDelivery?.$id === delivery.$id
                          ? 'border-blue-500 bg-blue-600/20'
                          : 'border-gray-600 bg-gray-700/30 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">
                          #{delivery.orderId?.slice(-8)}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getDeliveryStatusColor(
                            delivery.status
                          )}`}
                        >
                          {delivery.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        📍 {delivery.deliveryAddress}
                      </p>
                      <p className="text-green-400 text-sm font-medium mt-1">
                        KES {delivery.riderEarning?.toFixed(2) || '0.00'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Map Component */}
            {selectedDelivery ? (
              <RiderDeliveryMap
                delivery={selectedDelivery}
                riderId={rider?.userId || rider?.id}
                authToken={localStorage.getItem('riderToken')} // Adjust based on your token storage
                onStatusUpdate={handleMapStatusUpdate}
              />
            ) : deliveries.length === 0 ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 border border-blue-500/20 text-center">
                <Navigation className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  No Active Deliveries for Map
                </h3>
                <p className="text-gray-500">
                  Accept a delivery to use live navigation and tracking.
                </p>
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 border border-blue-500/20 text-center">
                <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  Select a Delivery
                </h3>
                <p className="text-gray-500">
                  Choose a delivery above to start live tracking and navigation.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Active Deliveries Tab - Enhanced */}
        {activeTab === "active" && (
          <div className="space-y-4">
            {deliveries.length === 0 ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 border border-blue-500/20 text-center">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  No Active Deliveries
                </h3>
                <p className="text-gray-500">
                  You're all caught up! New deliveries will appear here.
                </p>
              </div>
            ) : (
              deliveries.map((delivery) => (
                <div
                  key={delivery.$id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          Order #{delivery.orderId?.slice(-8)}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getDeliveryStatusColor(
                            delivery.status
                          )}`}
                        >
                          {delivery.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Customer: {delivery.customerName || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">
                        KES {delivery.riderEarning?.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-xs text-gray-500">Earning</p>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-400">Pickup</p>
                        <p className="text-white">{delivery.pickupAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-400">Delivery</p>
                        <p className="text-white">{delivery.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    {/* Quick Map View Button */}
                    <button
                      onClick={() => {
                        setSelectedDelivery(delivery);
                        setActiveTab("map");
                      }}
                      className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-medium rounded-lg transition-colors flex items-center space-x-2 border border-blue-500/30"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Live Map</span>
                    </button>

                    {delivery.status === "assigned" && (
                      <button
                        onClick={() =>
                          handleDeliveryAction(
                            delivery.$id,
                            "picked up",
                            "picked_up"
                          )
                        }
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark as Picked Up</span>
                      </button>
                    )}
                    {delivery.status === "picked_up" && (
                      <button
                        onClick={() =>
                          handleDeliveryAction(
                            delivery.$id,
                            "in transit",
                            "in_transit"
                          )
                        }
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Start Delivery</span>
                      </button>
                    )}
                    {delivery.status === "in_transit" && (
                      <>
                        <button
                          onClick={() =>
                            handleDeliveryAction(
                              delivery.$id,
                              "delivered",
                              "delivered"
                            )
                          }
                          className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark as Delivered</span>
                        </button>
                        <button
                          onClick={() =>
                            handleDeliveryAction(
                              delivery.$id,
                              "failed",
                              "failed"
                            )
                          }
                          className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 border border-red-500/30"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Mark as Failed</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Completed Tab - Same as before */}
        {activeTab === "completed" && (
          <div className="space-y-4">
            {completedDeliveries.length === 0 ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 border border-blue-500/20 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  No Completed Deliveries
                </h3>
                <p className="text-gray-500">
                  Your completed deliveries will appear here.
                </p>
              </div>
            ) : (
              completedDeliveries.map((delivery) => (
                <div
                  key={delivery.$id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          Order #{delivery.orderId?.slice(-8)}
                        </h3>
                        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-500/20 text-green-300 border-green-500/30">
                          DELIVERED
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Customer: {delivery.customerName || "N/A"}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Completed:{" "}
                        {new Date(
                          delivery.deliveredAt || delivery.updatedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">
                        KES {delivery.riderEarning?.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-xs text-gray-500">Earned</p>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-400">Pickup</p>
                        <p className="text-white text-sm">
                          {delivery.pickupAddress}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-400">Delivery</p>
                        <p className="text-white text-sm">
                          {delivery.deliveryAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Completion Status */}
                  <div className="flex items-center justify-center space-x-2 text-green-400 bg-green-500/10 rounded-lg py-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Successfully Delivered
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Earnings Tab - Same as before */}
        {activeTab === "earnings" && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 border border-blue-500/20 text-center">
            <DollarSign className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Your Earnings
            </h3>
            <p className="text-gray-500">
              Track your daily, weekly, and monthly earnings.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default RiderDashboard;