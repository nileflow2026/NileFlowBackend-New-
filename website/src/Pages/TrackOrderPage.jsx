/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";
import axiosClient from "../../api";
import { formatPrice } from "../../utils/priceFormatter";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  Package,
  Search,
  Clock,
  CheckCircle,
  User,
  Sparkles,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

const TrackOrderPage = () => {
  const { user, isAuthenticated } = useCustomerAuth();
  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Load user's recent orders if authenticated
  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(
          `/api/customerprofile/orders?userId=${user.id || user.$id}`
        );
        if (response.data && Array.isArray(response.data)) {
          // Get the most recent orders (last 5)
          const recentOrders = response.data.slice(-5);
          setOrders(recentOrders);
        }
      } catch (error) {
        console.error("Error fetching user orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.id) {
      fetchUserOrders();
    }
  }, [isAuthenticated, user]);

  const handleSearchOrder = (e) => {
    e.preventDefault();
    setSearchAttempted(true);
    setError("");

    if (!orderId.trim()) {
      setError("Please enter an order ID to track");
      return;
    }

    // Navigate to the specific order tracking page
    window.location.href = `/track-order/${orderId.trim()}`;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 p-4 sm:p-6">
        <div className="relative max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
              <Package className="w-5 h-5 text-amber-400" />
              <span className="text-amber-200 font-medium tracking-wide">
                Order Tracking
              </span>
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
                Track Your Order
              </span>
            </h1>

            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Enter your order ID or select from your recent orders to track
              your delivery
            </p>
          </div>

          {/* Order ID Search */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Search className="w-6 h-6 text-amber-400 mr-3" />
              Track by Order ID
            </h2>

            <form onSubmit={handleSearchOrder} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter your order ID (e.g., ORD123456)"
                  className="w-full px-6 py-4 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors text-lg"
                />
                <Package className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              >
                <span>Track Order</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Authentication Prompt for Non-Authenticated Users */}
          {!isAuthenticated && (
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-sm border border-blue-700/30 rounded-3xl p-6 mb-8">
              <div className="flex items-center mb-4">
                <User className="w-8 h-8 text-blue-400 mr-3" />
                <h3 className="text-xl font-bold text-white">
                  Sign In for More Features
                </h3>
              </div>
              <p className="text-gray-300 mb-4">
                Sign in to view your order history, save tracking preferences,
                and get real-time updates.
              </p>
              <div className="flex space-x-3">
                <Link
                  to="/signin"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border border-gray-600 text-center"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}

          {/* Recent Orders for Authenticated Users */}
          {isAuthenticated && (
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Clock className="w-6 h-6 text-amber-400 mr-3" />
                Your Recent Orders
              </h3>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
                  <span className="ml-3 text-gray-400">Loading orders...</span>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Link
                      key={order.$id}
                      to={`/track-order/${order.$id}`}
                      className="block p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/20 rounded-xl hover:border-amber-500/50 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              Order #{order.$id.slice(-8)}
                            </p>
                            <p className="text-sm text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString()} •
                              {formatPrice(order.amount || 0)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              order.status === "Delivered"
                                ? "bg-green-100 text-green-800"
                                : order.status === "Shipped"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {order.status || "Pending"}
                          </span>
                          <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No orders found</p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
                  >
                    Start Shopping
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TrackOrderPage;
