import React, { useState } from "react";
import {
  Crown,
  Star,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  Sparkles,
  X,
} from "lucide-react";
import { usePremiumContext } from "../Context/PremiumContext";
import { usePremiumSubscription } from "../hooks/usePremiumSubscription";

const SubscriptionSettings = () => {
  const { isPremium, loading } = usePremiumContext();
  const { subscribe, cancelSubscription, paymentStatus, stopPolling } =
    usePremiumSubscription();

  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPaymentPending, setShowPaymentPending] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  const handleSubscribe = async () => {
    if (paymentMethod === "mpesa" && !phoneNumber) {
      alert("Please enter your M-Pesa phone number");
      return;
    }

    const result = await subscribe(paymentMethod, phoneNumber);

    if (result.success) {
      // Stripe payment - redirect to checkout URL
      if (paymentMethod === "stripe" && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      // M-Pesa payment - show pending modal and poll
      if (paymentMethod === "mpesa") {
        setShowPaymentPending(true);
        setPaymentMessage("Processing your payment...");
      }
    } else {
      alert(result.message || "Failed to initiate subscription");
    }
  };

  const handleCancel = async () => {
    if (
      window.confirm(
        "Are you sure you want to cancel your premium subscription?"
      )
    ) {
      const result = await cancelSubscription();
      if (result.success) {
        alert("Subscription cancelled successfully");
      } else {
        alert(result.message || "Failed to cancel subscription");
      }
    }
  };

  // Handle payment status updates
  React.useEffect(() => {
    if (paymentStatus === "completed") {
      setShowPaymentPending(false);
      setPaymentMessage("");
      setPhoneNumber("");
      alert("Payment successful! Your premium subscription is now active.");
      stopPolling();
    } else if (paymentStatus === "failed") {
      setShowPaymentPending(false);
      setPaymentMessage("");
      alert("Payment failed. Please try again.");
      stopPolling();
    } else if (paymentStatus === "timeout") {
      setShowPaymentPending(false);
      setPaymentMessage("");
      alert(
        "Payment verification timed out. Please check your subscription status."
      );
      stopPolling();
    }
  }, [paymentStatus, stopPolling]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-900/30 to-blue-900/20 rounded-2xl"></div>
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gradient-to-r from-purple-900/30 to-blue-900/20 rounded-lg w-48"></div>
              <div className="h-4 bg-gradient-to-r from-purple-900/20 to-blue-900/10 rounded-lg w-32"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-gradient-to-br from-purple-900/20 to-blue-900/10 rounded-xl"></div>
            <div className="h-32 bg-gradient-to-br from-purple-900/20 to-blue-900/10 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-amber-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                Premium Subscription
              </h2>
              <p className="text-amber-100/70 mt-1">
                {isPremium
                  ? "Manage your premium membership"
                  : "Unlock exclusive benefits"}
              </p>
            </div>
          </div>

          {isPremium && (
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2 rounded-full font-bold shadow-lg shadow-emerald-900/50 flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>ACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {isPremium ? (
          <div className="space-y-8">
            {/* Premium Status */}
            <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-emerald-300 mb-2">
                    Current Plan
                  </h3>
                  <p className="text-emerald-100/80 text-lg font-semibold mb-1">
                    Premium Monthly
                  </p>
                  <p className="text-emerald-100/60 text-sm">200 Ksh/month</p>
                </div>

                <div className="text-right">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gradient-to-r from-red-600/20 to-red-700/20 text-red-300 font-bold rounded-xl border border-red-700/30 hover:bg-red-900/30 hover:scale-105 transition-all duration-300"
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </div>

            {/* Premium Benefits */}
            <div>
              <h3 className="text-xl font-bold text-amber-200 mb-4">
                Your Premium Benefits
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    icon: Zap,
                    title: "Priority Support",
                    desc: "24/7 premium customer service",
                  },
                  {
                    icon: Star,
                    title: "Exclusive Deals",
                    desc: "Access to special offers",
                  },
                  {
                    icon: Shield,
                    title: "Extended Warranty",
                    desc: "Extra protection on all orders",
                  },
                  {
                    icon: Sparkles,
                    title: "Early Access",
                    desc: "First to see new products",
                  },
                ].map((benefit, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-5 hover:border-amber-500/50 hover:scale-105 hover:shadow-xl hover:shadow-amber-900/20 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                        <benefit.icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-bold text-amber-200">
                        {benefit.title}
                      </h4>
                    </div>
                    <p className="text-amber-100/70 text-sm">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Non-Premium Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-900/50">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent mb-2">
                Upgrade to Premium
              </h3>
              <p className="text-amber-100/70">
                Unlock exclusive benefits for just{" "}
                <span className="text-amber-300 font-bold">200 Ksh/month</span>
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {[
                {
                  icon: Zap,
                  title: "Priority Support",
                  desc: "24/7 dedicated customer service with instant responses",
                  gradient: "from-yellow-600 to-amber-600",
                },
                {
                  icon: Star,
                  title: "Exclusive Deals",
                  desc: "Access special discounts and members-only offers",
                  gradient: "from-purple-600 to-pink-600",
                },
                {
                  icon: Shield,
                  title: "Extended Warranty",
                  desc: "Extra protection and warranty on all your purchases",
                  gradient: "from-blue-600 to-cyan-600",
                },
                {
                  icon: Sparkles,
                  title: "Early Access",
                  desc: "Be the first to discover new products and collections",
                  gradient: "from-emerald-600 to-green-600",
                },
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="group bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 hover:border-amber-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-purple-900/30 transition-all duration-300"
                >
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <benefit.icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-amber-200 mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-amber-100/70">{benefit.desc}</p>
                </div>
              ))}
            </div>

            {/* Payment Section */}
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/10 backdrop-blur-sm border border-purple-800/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-purple-300 mb-4">
                Choose Payment Method
              </h3>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setPaymentMethod("mpesa")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-center space-x-3 font-bold ${
                    paymentMethod === "mpesa"
                      ? "border-emerald-500 bg-gradient-to-r from-emerald-600/20 to-green-600/10 text-emerald-300 shadow-lg shadow-emerald-900/30"
                      : "border-amber-800/30 bg-gradient-to-r from-gray-900/50 to-black/50 text-gray-400 hover:border-amber-500/50"
                  }`}
                >
                  <span className="text-2xl">📱</span>
                  <span>M-Pesa</span>
                  {paymentMethod === "mpesa" && (
                    <CheckCircle className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => setPaymentMethod("stripe")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-center space-x-3 font-bold ${
                    paymentMethod === "stripe"
                      ? "border-purple-500 bg-gradient-to-r from-purple-600/20 to-indigo-600/10 text-purple-300 shadow-lg shadow-purple-900/30"
                      : "border-amber-800/30 bg-gradient-to-r from-gray-900/50 to-black/50 text-gray-400 hover:border-amber-500/50"
                  }`}
                >
                  <span className="text-2xl">💳</span>
                  <span>Stripe</span>
                  {paymentMethod === "stripe" && (
                    <CheckCircle className="w-5 h-5" />
                  )}
                </button>
              </div>

              {paymentMethod === "mpesa" && (
                <div className="mb-6">
                  <label className="block text-amber-200 font-semibold mb-2">
                    M-Pesa Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-amber-100/70 text-lg">📱</span>
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="254XXXXXXXXX"
                      className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-gray-900/80 to-black/80 border border-amber-800/30 rounded-xl text-white placeholder-amber-100/40 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300"
                    />
                  </div>
                  <p className="text-amber-100/60 text-sm mt-2">
                    Enter your number in format: 254712345678
                  </p>
                </div>
              )}

              <button
                onClick={handleSubscribe}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 shadow-xl shadow-purple-900/50 flex items-center justify-center space-x-2"
              >
                <Crown className="w-5 h-5" />
                <span>
                  {paymentMethod === "stripe"
                    ? "Continue to Stripe Checkout"
                    : "Subscribe Now - 200 Ksh/month"}
                </span>
              </button>

              {paymentMethod === "stripe" && (
                <p className="text-purple-100/60 text-sm text-center mt-3">
                  You will be redirected to Stripe's secure checkout page
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Pending Modal */}
      {showPaymentPending && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-amber-800/30 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-900/50">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>

              <h3 className="text-2xl font-bold text-amber-200 mb-3">
                Processing Payment
              </h3>
              <p className="text-amber-100/70 mb-6">
                {paymentMessage ||
                  "Please complete the payment on your phone..."}
              </p>

              {paymentMethod === "mpesa" && (
                <div className="bg-gradient-to-r from-emerald-900/30 to-green-900/20 border border-emerald-800/30 rounded-xl p-4 mb-6">
                  <p className="text-emerald-300 text-sm font-semibold mb-2">
                    📱 Check your phone
                  </p>
                  <p className="text-emerald-100/70 text-sm">
                    Enter your M-Pesa PIN to complete the payment
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setShowPaymentPending(false);
                  stopPolling();
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 border border-amber-800/30 flex items-center justify-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionSettings;
