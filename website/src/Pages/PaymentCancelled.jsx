import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AlertCircle, Home, ShoppingBag, RefreshCw } from "lucide-react";
import axiosClient from "../../api";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const PaymentCancelled = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Processing cancellation...");
  const [orderId, setOrderId] = useState(null);
  const [stockRestored, setStockRestored] = useState(false);

  useEffect(() => {
    const processCancellation = async () => {
      try {
        // Extract orderId from URL parameters
        const searchParams = new URLSearchParams(location.search);
        const orderIdFromUrl = searchParams.get("orderId");
        const sessionId = searchParams.get("session_id");

        if (!orderIdFromUrl) {
          setMessage("No order found. Redirecting to homepage...");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        setOrderId(orderIdFromUrl);

        // 1. Notify backend to restore stock
        console.log("🔄 Restoring stock for order:", orderIdFromUrl);

        const response = await axiosClient.post(
          "/api/payments/stripe-cancelled",
          {
            orderId: orderIdFromUrl,
            sessionId: sessionId,
          }
        );

        if (response.data.success) {
          setStockRestored(true);
          setMessage(
            "Payment cancelled successfully. Stock has been restored."
          );

          // Clear cart from localStorage
          const userId = localStorage.getItem("userId");
          if (userId) {
            localStorage.removeItem(`@cart_items_${userId}`);
          }

          console.log("✅ Stock restored:", response.data);
        } else {
          setMessage(
            "Payment cancelled, but there was an issue restoring stock."
          );
        }
      } catch (error) {
        console.error("❌ Cancellation error:", error);
        setMessage(
          "An error occurred during cancellation. Please contact support."
        );
      } finally {
        setLoading(false);
      }
    };

    processCancellation();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-gray-900/20 to-amber-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-500/10 to-amber-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-yellow-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-900/30 to-amber-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-red-700/30 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-200 font-medium tracking-wide">
              Payment Cancelled
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-red-300 via-orange-200 to-yellow-200 bg-clip-text text-transparent">
              Payment Cancelled
            </span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Your payment was not completed. Don't worry, your items are still
            available.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-red-800/30 rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-red-800/30">
              <div className="flex flex-col items-center justify-center text-center py-12">
                {loading ? (
                  <>
                    <div className="relative mb-8">
                      <div className="w-24 h-24 border-4 border-red-900/30 border-t-red-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <RefreshCw className="w-12 h-12 text-red-500 animate-pulse" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-amber-200 mb-4">
                      Processing Cancellation...
                    </h2>
                    <p className="text-gray-400">
                      Restoring your items to stock...
                    </p>
                  </>
                ) : (
                  <>
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 ${
                        stockRestored
                          ? "bg-gradient-to-br from-emerald-900/30 to-green-900/30"
                          : "bg-gradient-to-br from-red-900/30 to-amber-900/30"
                      }`}
                    >
                      {stockRestored ? (
                        <ShoppingBag className="w-12 h-12 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-12 h-12 text-red-400" />
                      )}
                    </div>

                    <h2 className="text-3xl font-bold text-amber-200 mb-4">
                      {stockRestored
                        ? "Stock Restored!"
                        : "Cancellation Complete"}
                    </h2>

                    <p className="text-gray-300 mb-6 max-w-md">{message}</p>

                    {orderId && (
                      <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4 mb-6">
                        <p className="text-sm text-amber-100/70 mb-1">
                          Order Reference
                        </p>
                        <p className="text-lg font-mono font-bold text-amber-300">
                          {orderId}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                      <Link
                        to="/cart"
                        className="group px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        <span>Return to Cart</span>
                      </Link>

                      <Link
                        to="/"
                        className="group px-8 py-4 bg-gradient-to-r from-gray-800 to-black text-white font-bold rounded-xl hover:from-gray-900 hover:to-black transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2 border border-amber-800/30"
                      >
                        <Home className="w-5 h-5" />
                        <span>Continue Shopping</span>
                      </Link>
                    </div>

                    {stockRestored && (
                      <div className="mt-8 bg-gradient-to-r from-emerald-900/20 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-xl p-4">
                        <p className="text-emerald-200 text-sm">
                          ✅ Your items have been restored to stock. They'll be
                          available for other customers to purchase.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Help Section */}
            <div className="p-8 border-t border-red-800/30">
              <h3 className="text-xl font-bold text-amber-200 mb-4">
                Need Help?
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-6">
                  <h4 className="font-bold text-amber-100 mb-2">
                    Why was my payment cancelled?
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Payments can be cancelled for various reasons: insufficient
                    funds, browser issues, or if you manually cancelled the
                    payment.
                  </p>
                </div>
                <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-6">
                  <h4 className="font-bold text-amber-100 mb-2">
                    Want to try again?
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Your cart items are still saved. You can return to your cart
                    and try the payment again with a different method if needed.
                  </p>
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

export default PaymentCancelled;
