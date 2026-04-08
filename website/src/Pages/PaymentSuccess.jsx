// src/pages/PaymentSuccess.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api";
import {
  CheckCircle,
  Sparkles,
  Shield,
  Truck,
  Package,
  Award,
  ShoppingBag,
  Clock,
  Star,
  ChevronRight,
  Home,
  CreditCard,
  BadgeCheck,
} from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("Verifying payment...");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const { data } = await axiosClient.get(
          `/api/payments/payment-success?session_id=${sessionId}`
        );

        // Ensure totalAmount is a number
        if (data.order) {
          data.order.totalAmount = parseFloat(data.order.totalAmount) || 0;
        }

        setOrder(data.order);
        setStatus("Payment successful! Your order is confirmed.");

        // Mark reward as used if one was stored
        const pendingReward = localStorage.getItem("pendingRewardToMark");
        if (pendingReward) {
          try {
            const { userId, rewardName } = JSON.parse(pendingReward);
            console.log("Marking reward as used after payment:", rewardName);
            const markResponse = await axiosClient.post(
              "/api/nilemiles/mark-reward-used",
              {
                userId,
                redeemedRewardName: rewardName,
              }
            );
            console.log("✅ Reward marked as used:", markResponse.data);
            localStorage.removeItem("pendingRewardToMark");
          } catch (error) {
            console.error("Failed to mark reward as used:", error);
            console.error("Error details:", error.response?.data);
          }
        }

        // Start countdown for redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate("/orders"); // Redirect to orders page
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("Payment verification failed. Please contact support.");
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      verifyPayment();
    } else {
      setStatus("No payment session found. Redirecting...");
      setTimeout(() => navigate("/"), 3000);
    }
  }, [sessionId, navigate]);

  // Helper function to safely format amount
  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return numAmount.toFixed(2);
  };

  const getOrderStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "from-emerald-600 to-green-600";
      case "processing":
        return "from-amber-600 to-yellow-600";
      case "shipped":
        return "from-blue-600 to-cyan-600";
      default:
        return "from-amber-600 to-yellow-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-gray-900/20 to-amber-900/20"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl w-full">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-emerald-900/30 to-green-900/30 border border-emerald-700/30 mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <CheckCircle className="w-20 h-20 text-emerald-400 relative z-10" />
              <div className="absolute -top-2 -right-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center animate-bounce">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-amber-400 bg-clip-text text-transparent">
                Payment Successful!
              </span>
            </h1>

            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
              {loading
                ? status
                : "Thank you for your purchase! Your order is being processed."}
            </p>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Order Details Card */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-amber-800/30">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-amber-200">
                        Order Confirmation
                      </h2>
                      <p className="text-amber-100/70">
                        Your purchase has been confirmed
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {order ? (
                    <div className="space-y-6">
                      {/* Order ID */}
                      <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-amber-100/70 text-sm">
                              Order Number
                            </p>
                            <p className="text-2xl font-bold text-white">
                              #{order.orderId || "N/A"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-amber-100/70 text-sm">
                              Total Amount
                            </p>
                            <p className="text-3xl font-bold text-emerald-400">
                              ${formatAmount(order.totalAmount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div
                        className={`bg-gradient-to-r ${getOrderStatusColor(
                          order.status
                        )}/20 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <BadgeCheck className="w-8 h-8 text-emerald-400" />
                            <div>
                              <p className="text-emerald-100 text-sm">
                                Order Status
                              </p>
                              <p className="text-xl font-bold text-emerald-300 capitalize">
                                {order.status || "Processing"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-amber-100/70 text-sm">
                              Payment Method
                            </p>
                            <p className="text-amber-300 font-bold">
                              {order.paymentMethod || "Secure Card Payment"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="w-6 h-6 text-amber-400" />
                            <div>
                              <p className="text-amber-100/70 text-xs">
                                Payment ID
                              </p>
                              <p className="text-amber-200 font-medium truncate">
                                {sessionId || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                          <div className="flex items-center space-x-3">
                            <Clock className="w-6 h-6 text-blue-400" />
                            <div>
                              <p className="text-blue-100/70 text-xs">
                                Order Date
                              </p>
                              <p className="text-blue-200 font-medium">
                                {order.createdAt
                                  ? new Date(
                                      order.createdAt
                                    ).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : new Date().toLocaleDateString("en-US", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-amber-200">Loading order details...</p>
                    </div>
                  )}
                </div>

                {/* Order Processing Steps */}
                <div className="p-8">
                  <h3 className="text-lg font-bold text-amber-200 mb-6">
                    Order Processing Timeline
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-emerald-300 font-bold">
                          Payment Confirmed
                        </p>
                        <p className="text-amber-100/70 text-sm">
                          Your payment has been verified
                        </p>
                      </div>
                      <div className="text-emerald-400">
                        <p className="text-sm font-bold">Completed</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-amber-300 font-bold">
                          Processing Order
                        </p>
                        <p className="text-amber-100/70 text-sm">
                          Preparing your items for shipping
                        </p>
                      </div>
                      <div className="text-amber-400">
                        <p className="text-sm font-bold">In Progress</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-800 to-black border border-amber-800/30 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-300 font-bold">Shipping</p>
                        <p className="text-gray-400 text-sm">
                          Will be dispatched within 24 hours
                        </p>
                      </div>
                      <div className="text-gray-400">
                        <p className="text-sm font-bold">Pending</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-8">
              {/* What's Next Card */}
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Shield className="w-8 h-8 text-emerald-400" />
                  <div>
                    <h3 className="text-xl font-bold text-emerald-200">
                      What's Next
                    </h3>
                    <p className="text-emerald-100/70 text-sm">
                      Your order journey
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <p className="text-amber-100">Order confirmation email</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <p className="text-amber-100">Processing & packaging</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <p className="text-amber-100">Shipping notification</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">4</span>
                    </div>
                    <p className="text-amber-100">Delivery & tracking</p>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Award className="w-8 h-8 text-amber-400" />
                  <div>
                    <h3 className="text-xl font-bold text-amber-200">
                      Order Protected
                    </h3>
                    <p className="text-amber-100/70 text-sm">
                      Premium guarantees
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600/20 to-green-600/20 border border-emerald-700/30 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-emerald-100 text-sm">
                      100% Secure Payment
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-700/30 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-blue-100 text-sm">
                      Fast & Reliable Delivery
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600/20 to-yellow-600/20 border border-amber-700/30 flex items-center justify-center">
                      <Star className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-amber-100 text-sm">
                      Premium Quality Guaranteed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/orders"
              className="group flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-2xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
            >
              <ShoppingBag className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>View My Orders</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/home"
              className="group flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 text-amber-300 font-bold rounded-2xl hover:border-amber-500/50 hover:bg-gradient-to-r hover:from-amber-900/30 hover:to-amber-800/30 transition-all duration-300"
            >
              <Home className="w-6 h-6" />
              <span>Continue Shopping</span>
              <Sparkles className="w-5 h-5 text-amber-400 group-hover:animate-pulse" />
            </Link>
          </div>

          {/* Redirect Timer */}
          {order && (
            <div className="text-center mt-8">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 px-4 py-2 rounded-full">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-amber-100 text-sm">
                  Redirecting to orders in{" "}
                  <span className="text-amber-300 font-bold">{countdown}</span>{" "}
                  seconds
                </span>
              </div>
            </div>
          )}

          {/* Thank You Message */}
          <div className="text-center mt-12">
            <p className="text-gray-400">
              Thank you for shopping with{" "}
              <span className="bg-gradient-to-r from-amber-300 to-emerald-300 bg-clip-text text-transparent font-bold">
                Nile Flow
              </span>
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Premium African E-commerce Experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
