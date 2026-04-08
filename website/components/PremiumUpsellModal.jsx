/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { usePremiumSubscription } from "../hooks/usePremiumSubscription";
import { useNileMilesCalculator } from "../hooks/useNileMilesCalculator";

/**
 * PremiumUpsellModal - Checkout upsell modal for non-premium users
 * Shows benefits comparison and subscription CTA
 */
const PremiumUpsellModal = ({ isOpen, onClose, orderTotal = 0 }) => {
  const {
    subscribe,
    pollPaymentStatus,
    stopPolling,
    loading,
    error,
    paymentStatus,
  } = usePremiumSubscription();
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPaymentPending, setShowPaymentPending] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  // Calculate potential miles with premium
  const baseMiles = Math.floor(orderTotal / 10);
  const { calculatedMiles: premiumMiles } = useNileMilesCalculator(baseMiles);

  // Cleanup polling on unmount or modal close
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const handleSubscribe = async () => {
    const result = await subscribe(paymentMethod, phoneNumber || null);

    if (result.success) {
      if (result.requiresPolling && result.checkoutRequestId) {
        // M-Pesa payment - show pending message and start polling
        setShowPaymentPending(true);
        setPaymentMessage(
          "Payment request sent to your phone. Please enter your M-Pesa PIN to confirm."
        );

        // Start polling
        pollPaymentStatus(
          result.checkoutRequestId,
          (statusData) => {
            // Success callback
            setShowPaymentPending(false);
            setPaymentMessage("✅ Payment successful! Premium activated!");
            setTimeout(() => {
              setPaymentMessage("");
              onClose(true);
            }, 2000);
          },
          () => {
            // Timeout callback
            setShowPaymentPending(false);
            setPaymentMessage(
              "⏱️ Payment confirmation timed out. If you completed the payment, your premium will activate shortly."
            );
          }
        );
      } else {
        // PayPal or immediate success
        setPaymentMessage("✅ Successfully subscribed to Nile Premium!");
        setTimeout(() => {
          setPaymentMessage("");
          onClose(true);
        }, 2000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Upgrade to Nile Premium
              </h2>
              <p className="text-white/90">
                Save more on this order and every future purchase
              </p>
            </div>
            <button
              onClick={() => onClose(false)}
              className="text-white/80 hover:text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Comparison Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">See the difference</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Standard */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-600 mb-3">Standard</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">📦</span>
                    <span>5-7 days delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">⭐</span>
                    <span>{baseMiles} Nile Miles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">🏷️</span>
                    <span>Regular deals only</span>
                  </li>
                </ul>
              </div>

              {/* Premium */}
              <div className="border-2 border-purple-600 rounded-lg p-4 bg-purple-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-purple-600">Premium</h4>
                  <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                    200 Ksh/mo
                  </span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span>🚀</span>
                    <span className="font-semibold">
                      1-2 days priority delivery
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>⭐</span>
                    <span className="font-semibold">
                      {premiumMiles} Nile Miles (2x)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🏷️</span>
                    <span className="font-semibold">Premium-only deals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>💰</span>
                    <span className="font-semibold">
                      Monthly savings summary
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-green-500 text-white rounded-full p-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-green-900 mb-1">
                  Pay once, save all month
                </h4>
                <p className="text-sm text-green-800">
                  Members typically save {">"}500 Ksh monthly through faster
                  delivery, bonus miles, and exclusive deals
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Payment Method
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMethod("mpesa")}
                className={`flex-1 border-2 rounded-lg p-3 text-sm font-medium transition-colors ${
                  paymentMethod === "mpesa"
                    ? "border-purple-600 bg-purple-50 text-purple-600"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                M-Pesa
              </button>
              <button
                onClick={() => setPaymentMethod("paypal")}
                className={`flex-1 border-2 rounded-lg p-3 text-sm font-medium transition-colors ${
                  paymentMethod === "paypal"
                    ? "border-purple-600 bg-purple-50 text-purple-600"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                PayPal
              </button>
            </div>
          </div>

          {/* Phone Number Input (M-Pesa only) */}
          {paymentMethod === "mpesa" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="254712345678"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your Safaricom number (e.g., 254712345678)
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Payment Pending Message */}
          {showPaymentPending && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mt-0.5"></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">
                    Waiting for Payment Confirmation
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">{paymentMessage}</p>
                  <p className="text-xs text-blue-700 mb-3">
                    This may take up to 2 minutes. Please don't close this
                    modal.
                  </p>
                  <button
                    onClick={() => {
                      stopPolling();
                      setShowPaymentPending(false);
                      onClose(true);
                    }}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                  >
                    I've Confirmed - Close Modal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success/Info Message */}
          {paymentMessage && !showPaymentPending && (
            <div
              className={`border rounded-lg p-3 mb-4 text-sm ${
                paymentMessage.includes("✅")
                  ? "bg-green-50 border-green-200 text-green-800"
                  : paymentMessage.includes("⏱️")
                  ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              {paymentMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onClose(false)}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              disabled={loading || showPaymentPending}
            >
              Maybe Later
            </button>
            <button
              onClick={handleSubscribe}
              disabled={
                loading ||
                showPaymentPending ||
                (paymentMethod === "mpesa" && !phoneNumber.trim())
              }
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Processing..."
                : showPaymentPending
                ? "Waiting for confirmation..."
                : "Subscribe Now - 200 Ksh/month"}
            </button>
          </div>

          {/* Fine Print */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Cancel anytime. Benefits expire at period end. No refunds for
            partial months.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpsellModal;
