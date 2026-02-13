import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { getCustomerOrders } from "../../CustomerServices";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  RefreshCw,
  Shield,
  Star,
  MapPin,
  CreditCard,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Award,
  Loader2,
  AlertCircle,
  XCircle,
  Gift,
} from "lucide-react";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";
import { formatPrice } from "../../utils/priceFormatter";
import Footer from "../../components/Footer";

const OrdersPage = () => {
  const { user, isAuthenticated, isLoading: userLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");

  const fetchOrders = useCallback(async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const ordersData = await getCustomerOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error("❌ Error fetching orders:", error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchOrders();
    }
  }, [userLoading, user, isAuthenticated, fetchOrders]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "from-emerald-600 to-green-600";
      case "shipped":
        return "from-blue-600 to-indigo-600";
      case "processing":
        return "from-amber-600 to-orange-600";
      case "pending":
        return "from-yellow-600 to-amber-600";
      case "cancelled":
        return "from-red-600 to-pink-600";
      default:
        return "from-gray-600 to-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-blue-400" />;
      case "processing":
        return <RefreshCw className="w-5 h-5 text-amber-400" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  const filteredOrders =
    selectedStatus === "all"
      ? orders
      : orders.filter(
          (order) =>
            order.status?.toLowerCase() === selectedStatus.toLowerCase()
        );

  const statusCounts = {
    all: orders.length,
    delivered: orders.filter((o) => o.status?.toLowerCase() === "delivered")
      .length,
    shipped: orders.filter((o) => o.status?.toLowerCase() === "shipped").length,
    processing: orders.filter((o) => o.status?.toLowerCase() === "processing")
      .length,
    pending: orders.filter((o) => o.status?.toLowerCase() === "pending").length,
    cancelled: orders.filter((o) => o.status?.toLowerCase() === "cancelled")
      .length,
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-10 h-10 text-amber-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <Header />
        <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-gray-900/20 to-amber-900/20"></div>
          <div className="relative max-w-8xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-red-900/30 to-amber-900/30 border border-red-700/30 mb-6">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">
              Access Required
            </h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              Please log in to view your premium order history and track your
              purchases.
            </p>
            <Link
              to="/signin"
              className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
            >
              <span>Login to Continue</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
              <Package className="w-5 h-5 text-amber-400" />
              <span className="text-amber-200 font-medium tracking-wide">
                Premium Orders
              </span>
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
                Your Orders
              </span>
              <br />
              <span className="text-white">Premium Purchase History</span>
            </h1>

            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Track and manage your premium African product purchases with our
              exclusive order tracking system.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-300">
                {orders.length}
              </div>
              <div className="text-amber-100/80 text-sm">Total Orders</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-300">
                {
                  orders.filter((o) => o.status?.toLowerCase() === "delivered")
                    .length
                }
              </div>
              <div className="text-emerald-100/80 text-sm">Delivered</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-300">
                {
                  orders.filter((o) => o.status?.toLowerCase() === "shipped")
                    .length
                }
              </div>
              <div className="text-blue-100/80 text-sm">In Transit</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-red-300">
                {
                  orders.filter((o) => o.status?.toLowerCase() === "pending")
                    .length
                }
              </div>
              <div className="text-red-100/80 text-sm">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Status Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`group relative px-5 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 flex items-center space-x-2 ${
                    selectedStatus === status
                      ? `bg-gradient-to-r ${getStatusColor(
                          status
                        )} text-white border-transparent shadow-lg`
                      : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                  }`}
                >
                  {selectedStatus === status && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-30"></div>
                  )}
                  {getStatusIcon(status)}
                  <span className="relative font-medium capitalize">
                    {status}
                  </span>
                  <span className="relative text-xs opacity-75">({count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>
              </div>
              <h3 className="mt-8 text-2xl font-bold text-amber-200">
                Loading Your Orders
              </h3>
              <p className="text-gray-400 mt-2">
                Retrieving your premium purchase history...
              </p>
            </div>
          ) : (
            <>
              {/* Orders Grid */}
              {filteredOrders.length === 0 ? (
                <div className="text-center py-32">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-6">
                    <Package className="w-12 h-12 text-amber-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    {selectedStatus === "all"
                      ? "No Orders Found"
                      : `No ${selectedStatus} Orders`}
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-8">
                    {selectedStatus === "all"
                      ? "Your premium orders will appear here. Start your African shopping journey with our exclusive collection."
                      : `You don't have any ${selectedStatus} orders at the moment.`}
                  </p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Explore Premium Products</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.$id}
                      className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2"
                    >
                      {/* Background Glow */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${getStatusColor(
                          order.status
                        )}/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      ></div>

                      {/* Order Card */}
                      <div className="relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden transition-all duration-500 group-hover:border-amber-500/50 group-hover:shadow-2xl group-hover:shadow-amber-900/30">
                        {/* Header */}
                        <div className="p-6 border-b border-amber-800/30">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getStatusColor(
                                  order.status
                                )} flex items-center justify-center`}
                              >
                                {getStatusIcon(order.status)}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-white">
                                  Order #{order.$id?.slice(-8)}
                                </h3>
                                <p className="text-amber-100/70 text-sm">
                                  {new Date(order.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                            <div
                              className={`px-3 py-1.5 rounded-full border backdrop-blur-sm ${getStatusColor(
                                order.status
                              ).replace("600", "700")}/30 border-amber-700/30`}
                            >
                              <span className="text-xs font-bold text-white capitalize">
                                {order.status}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-amber-100/70 mb-1">
                              <span>Order Progress</span>
                              <span>
                                {order.status === "delivered"
                                  ? "100%"
                                  : order.status === "shipped"
                                  ? "75%"
                                  : order.status === "processing"
                                  ? "50%"
                                  : "25%"}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${getStatusColor(
                                  order.status
                                )} rounded-full transition-all duration-1000`}
                                style={{
                                  width:
                                    order.status === "delivered"
                                      ? "100%"
                                      : order.status === "shipped"
                                      ? "75%"
                                      : order.status === "processing"
                                      ? "50%"
                                      : "25%",
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="p-6">
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center space-x-2">
                              <CreditCard className="w-4 h-4 text-amber-400" />
                              <div>
                                <p className="text-xs text-amber-100/70">
                                  Amount
                                </p>
                                <p className="text-lg font-bold text-amber-300">
                                  {formatPrice(order.amount || 0)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-emerald-400" />
                              <div>
                                <p className="text-xs text-emerald-100/70">
                                  Delivery
                                </p>
                                <p className="text-sm font-medium text-emerald-300">
                                  {order.status === "delivered"
                                    ? "Delivered"
                                    : "In Progress"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Estimated Delivery */}
                          {order.status !== "delivered" &&
                            order.status !== "cancelled" && (
                              <div className="mb-6 p-4 bg-gradient-to-r from-amber-900/20 to-yellow-900/20 backdrop-blur-sm border border-amber-800/30 rounded-xl">
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4 text-amber-400" />
                                  <div>
                                    <p className="text-xs text-amber-100/70">
                                      Estimated Delivery
                                    </p>
                                    <p className="text-sm font-medium text-amber-300">
                                      {new Date(
                                        Date.now() + 5 * 24 * 60 * 60 * 1000
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-3">
                            <Link
                              to={`/track-order/${order.$id}`}
                              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center justify-center space-x-2"
                            >
                              <Truck className="w-5 h-5" />
                              <span>Track Order</span>
                            </Link>

                            {/* Cancel Order Button - only show for eligible orders */}
                            {(order.status?.toLowerCase() === "pending" ||
                              order.status?.toLowerCase() === "processing" ||
                              order.orderStatus?.toLowerCase() === "pending" ||
                              order.orderStatus?.toLowerCase() ===
                                "ordered") && (
                              <button
                                onClick={() =>
                                  navigate("/cancel-order", {
                                    state: {
                                      order: { orderId: order.$id, ...order },
                                    },
                                  })
                                }
                                className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center space-x-2"
                              >
                                <XCircle className="w-5 h-5" />
                                <span>Cancel</span>
                              </button>
                            )}

                            <button className="p-3 border-2 border-amber-500/50 text-amber-400 rounded-xl hover:bg-amber-500/10 transition-all duration-300">
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Premium Badge */}
                        {order.amount > 100 && (
                          <div className="absolute top-4 right-4">
                            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1">
                              <Award className="w-3 h-3" />
                              <span>Premium Order</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Summary */}
              <div className="mt-12 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-amber-200 mb-6">
                  Order Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-gradient-to-br from-amber-900/20 to-transparent border border-amber-800/30 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-8 h-8 text-amber-400" />
                      <div>
                        <h4 className="text-amber-100 font-bold">
                          Premium Protection
                        </h4>
                        <p className="text-amber-100/70 text-sm">
                          All orders are protected
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-900/20 to-transparent border border-emerald-800/30 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <Gift className="w-8 h-8 text-emerald-400" />
                      <div>
                        <h4 className="text-emerald-100 font-bold">
                          Express Shipping
                        </h4>
                        <p className="text-emerald-100/70 text-sm">
                          Fast delivery across Africa
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-800/30 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <Star className="w-8 h-8 text-blue-400" />
                      <div>
                        <h4 className="text-blue-100 font-bold">
                          Premium Support
                        </h4>
                        <p className="text-blue-100/70 text-sm">
                          24/7 order assistance
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrdersPage;
