import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import axiosClient from "../../api";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";
import {
  Package,
  AlertCircle,
  CheckCircle,
  X,
  ArrowLeft,
  FileText,
  Clock,
  DollarSign,
  ShieldCheck,
} from "lucide-react";

const CancelOrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useCustomerAuth();

  // Get order details from navigation state
  const orderFromState = location.state?.order;

  const [orderId, setOrderId] = useState(
    orderFromState?.orderId || orderFromState?.$id || ""
  );
  const [reason, setReason] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const cancellationReasons = [
    "Changed my mind",
    "Found a better price elsewhere",
    "Ordered by mistake",
    "Delivery time too long",
    "Need to change delivery address",
    "Financial constraints",
    "Product not needed anymore",
    "Other",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!orderId.trim()) {
      setError("Please enter your Order ID");
      return;
    }

    if (!reason) {
      setError("Please select a cancellation reason");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axiosClient.post(
        "/api/customerprofile/orders/cancel-request",
        {
          orderId: orderId.trim(),
          reason,
          additionalDetails,
          userId: user?.id || user?.userId,
          customerEmail: user?.email,
          customerName: user?.username || user?.name,
        }
      );

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(
          response.data.message || "Failed to submit cancellation request"
        );
      }
    } catch (err) {
      console.error("Cancellation request error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to submit cancellation request. Please contact support."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <Header />

        <div className="min-h-screen flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full">
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-emerald-800/30 rounded-3xl p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-emerald-200 mb-4">
                Request Submitted
              </h2>

              <p className="text-gray-300 mb-6">
                Your cancellation request has been submitted successfully. Our
                team will review your request and contact you within 24 hours.
              </p>

              <div className="bg-gradient-to-r from-emerald-900/30 to-green-900/20 border border-emerald-800/30 rounded-xl p-4 mb-6">
                <p className="text-emerald-100 text-sm">
                  <strong>Order ID:</strong> {orderId}
                </p>
                <p className="text-emerald-100 text-sm mt-2">
                  <strong>Reason:</strong> {reason}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/orders")}
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300"
                >
                  View My Orders
                </button>

                <button
                  onClick={() => navigate("/")}
                  className="w-full px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all duration-300"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-gray-900/20 to-amber-900/20"></div>

        <div className="relative max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-900/30 to-amber-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-red-700/30 mb-6">
              <Package className="w-5 h-5 text-red-400" />
              <span className="text-red-200 font-medium tracking-wide">
                Order Cancellation
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-red-300 via-amber-200 to-amber-300 bg-clip-text text-transparent">
                Cancel Your Order
              </span>
            </h1>

            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Submit a cancellation request for your order. Our team will review
              and process it according to our cancellation policy.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Cancellation Form */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-amber-200">
                  Cancellation Request
                </h2>
              </div>

              {error && (
                <div className="bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-700/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-200">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Order ID */}
                <div>
                  <label className="block text-amber-200 font-semibold mb-2">
                    Order ID *
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Enter your order ID"
                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-900/80 to-black/80 border border-amber-700/50 rounded-xl text-amber-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    Find this in your order confirmation email or orders page
                  </p>
                </div>

                {/* Cancellation Reason */}
                <div>
                  <label className="block text-amber-200 font-semibold mb-2">
                    Reason for Cancellation *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-900/80 to-black/80 border border-amber-700/50 rounded-xl text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a reason</option>
                    {cancellationReasons.map((r) => (
                      <option key={r} value={r} className="bg-gray-900">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Additional Details */}
                <div>
                  <label className="block text-amber-200 font-semibold mb-2">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder="Please provide any additional information..."
                    rows="4"
                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-900/80 to-black/80 border border-amber-700/50 rounded-xl text-amber-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? "Submitting..." : "Submit Cancellation Request"}
                </button>
              </form>
            </div>

            {/* Cancellation Policy */}
            <div className="space-y-6">
              {/* Policy Card */}
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-amber-200">
                    Cancellation Policy
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Eligible for Cancellation */}
                  <div>
                    <div className="flex items-start space-x-3 mb-3">
                      <Clock className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-bold text-emerald-200 mb-2">
                          Eligible for Cancellation
                        </h3>
                        <ul className="space-y-2 text-gray-300 text-sm">
                          <li className="flex items-start space-x-2">
                            <span className="text-emerald-400 mt-1">•</span>
                            <span>
                              Orders in "Pending" or "Processing" status
                            </span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-emerald-400 mt-1">•</span>
                            <span>Orders placed within the last 24 hours</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-emerald-400 mt-1">•</span>
                            <span>Orders not yet shipped</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Cannot Be Cancelled */}
                  <div>
                    <div className="flex items-start space-x-3 mb-3">
                      <X className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-bold text-red-200 mb-2">
                          Cannot Be Cancelled
                        </h3>
                        <ul className="space-y-2 text-gray-300 text-sm">
                          <li className="flex items-start space-x-2">
                            <span className="text-red-400 mt-1">•</span>
                            <span>Orders already shipped or in transit</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-red-400 mt-1">•</span>
                            <span>Orders marked as "Out for Delivery"</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-red-400 mt-1">•</span>
                            <span>
                              Delivered orders (use return policy instead)
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Refund Information */}
                  <div>
                    <div className="flex items-start space-x-3 mb-3">
                      <DollarSign className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-bold text-amber-200 mb-2">
                          Refund Information
                        </h3>
                        <ul className="space-y-2 text-gray-300 text-sm">
                          <li className="flex items-start space-x-2">
                            <span className="text-amber-400 mt-1">•</span>
                            <span>
                              Approved cancellations receive full refund
                            </span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-amber-400 mt-1">•</span>
                            <span>Cash on Delivery: No payment required</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-amber-400 mt-1">•</span>
                            <span>
                              Card/M-Pesa payments: Refund in 5-7 business days
                            </span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-amber-400 mt-1">•</span>
                            <span>
                              Original payment method will be credited
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Processing Time */}
              <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-800/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-200 mb-3">
                  ⏱️ Processing Time
                </h3>
                <p className="text-gray-300 text-sm">
                  Cancellation requests are typically reviewed within{" "}
                  <strong className="text-blue-200">24 hours</strong>. You'll
                  receive an email confirmation once your request is processed.
                </p>
              </div>

              {/* Contact Support */}
              <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-800/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-amber-200 mb-3">
                  Need Help?
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  For urgent cancellation requests or questions, contact our
                  support team:
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-amber-100">
                    📧 Email: support@nileflow.com
                  </p>
                  <p className="text-amber-100">📞 Phone: +254 700 000 000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CancelOrderPage;
