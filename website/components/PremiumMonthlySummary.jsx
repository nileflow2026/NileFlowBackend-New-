/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { premiumService } from "../utils/premiumService";
import { usePremiumStatus } from "../hooks/usePremiumStatus";
import { useCountUp } from "../hooks/useCountUp";
import { trackPremiumEvent } from "../utils/analytics";
import { Share2, Twitter, Facebook, MessageCircle } from "lucide-react";

/**
 * PremiumMonthlySummary - Shows monthly savings for premium users
 * Displays how much value they've received from their subscription
 */
const PremiumMonthlySummary = () => {
  const { isPremium, loading: statusLoading, expiresAt } = usePremiumStatus();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Extract values with defaults
  const {
    totalSavings = 0,
    deliverySavings = 0,
    discountSavings = 0,
    milesBonus = 0,
    subscriptionCost = 200,
  } = summary || {};
  const netSavings = totalSavings - subscriptionCost;

  // Count-up animations for numbers - must be called unconditionally
  const animatedDeliverySavings = useCountUp(deliverySavings, 2000);
  const animatedDiscountSavings = useCountUp(discountSavings, 2000);
  const animatedMilesBonus = useCountUp(milesBonus, 2000);
  const animatedTotalSavings = useCountUp(totalSavings, 2000);
  const animatedNetSavings = useCountUp(netSavings, 2000);

  const fetchSummary = async (isManualRefresh = false) => {
    if (!isPremium) {
      setLoading(false);
      return;
    }

    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await premiumService.getMonthlySummary();
      setSummary(data);
      setError(null);

      // Track analytics
      if (isManualRefresh) {
        trackPremiumEvent.refreshSummary();
      } else {
        trackPremiumEvent.viewMonthlySummary(
          data.totalSavings || 0,
          (data.totalSavings || 0) - 200
        );
      }
    } catch (err) {
      console.error("❌ Error fetching monthly summary:", err);
      setError(err.message);
    } finally {
      if (isManualRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSummary();

    // Auto-refresh every 30 seconds to catch new orders
    const intervalId = setInterval(() => {
      if (isPremium) {
        fetchSummary();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [isPremium]);

  if (statusLoading || loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return null;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">Failed to load monthly summary</p>
      </div>
    );
  }

  const isNewUser =
    totalSavings === 0 && deliverySavings === 0 && milesBonus === 0;

  // Calculate subscription progress (days used / 30 days)
  const calculateProgress = () => {
    if (!expiresAt) return 0;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const totalDays = 30;
    const daysLeft = Math.max(
      0,
      Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
    );
    const daysUsed = totalDays - daysLeft;
    const progressPercent = (daysUsed / totalDays) * 100;
    // Ensure minimum 3% width for visibility, even on day 1
    return Math.min(100, Math.max(3, progressPercent));
  };

  const progress = calculateProgress();
  const daysLeft = expiresAt
    ? Math.max(
        0,
        Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  // Share functions
  const handleShare = (platform) => {
    const savingsText = `I've saved ${Math.round(
      totalSavings
    )} KSH this month with Nile Premium! 🎉 Get exclusive discounts, free delivery, and 2x miles. Join me!`;
    const url = "https://nileflowafrica.com";

    trackPremiumEvent.shareSavings(platform, totalSavings);

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            savingsText
          )}&url=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}&quote=${encodeURIComponent(savingsText)}`,
          "_blank"
        );
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(savingsText + " " + url)}`,
          "_blank"
        );
        break;
      default:
        break;
    }
    setShowShareModal(false);
  };

  const copyLink = () => {
    const text = `I've saved ${Math.round(
      totalSavings
    )} KSH this month with Nile Premium! Check it out: https://nileflowafrica.com`;
    navigator.clipboard.writeText(text);
    alert("Savings message copied to clipboard!");
    setShowShareModal(false);
  };

  return (
    <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-3xl shadow-2xl p-8 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl -ml-24 -mb-24"></div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <svg
              className="w-7 h-7 text-amber-300"
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
            This Month's Savings
          </h2>
          <p className="text-purple-100 text-sm">
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isNewUser && totalSavings > 0 && (
            <button
              onClick={() => setShowShareModal(true)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl p-3 shadow-lg border border-white/30 transition-all duration-200"
              title="Share your savings"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
          )}
          <button
            onClick={() => fetchSummary(true)}
            disabled={refreshing}
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl p-3 shadow-lg border border-white/30 transition-all duration-200 disabled:opacity-50"
            title="Refresh summary"
          >
            <svg
              className={`w-5 h-5 text-white ${
                refreshing ? "animate-spin" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/30">
            <svg
              className="w-8 h-8 text-amber-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Subscription Progress Bar */}
      {expiresAt && (
        <div className="relative mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/90 text-sm font-medium">
              Subscription Period
            </span>
            <span className="text-white/70 text-xs">{daysLeft} days left</span>
          </div>
          <div className="relative w-full h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/30">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-white/60 text-xs">Day 1</span>
            <span className="text-white/60 text-xs">Day 30</span>
          </div>
        </div>
      )}

      {/* New User Message */}
      {isNewUser && (
        <div className="relative bg-white/20 backdrop-blur-sm border border-white/40 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-amber-300 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-white font-semibold text-sm">
                Welcome to Nile Premium!
              </p>
              <p className="text-white/80 text-xs mt-1">
                Your savings will appear here as you shop. Enjoy free shipping,
                2x miles, and 5-10% discounts!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Savings Breakdown */}
      <div className="relative grid md:grid-cols-3 gap-6 mb-8">
        <div className="group bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Fast Delivery
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {animatedDeliverySavings}{" "}
            <span className="text-lg text-gray-600">Ksh</span>
          </p>
          <p className="text-xs text-gray-500">Saved on shipping costs</p>
        </div>

        <div className="group bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Bonus Miles
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {animatedMilesBonus}{" "}
            <span className="text-lg text-gray-600">miles</span>
          </p>
          <p className="text-xs text-gray-500">Extra from 2x multiplier</p>
        </div>

        <div className="group bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-3 shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Discount Savings
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {animatedDiscountSavings}{" "}
            <span className="text-lg text-gray-600">Ksh</span>
          </p>
          <p className="text-xs text-gray-500">5-10% off orders</p>
        </div>
      </div>

      {/* Total Summary */}
      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-700 font-medium">
            Total Value Received
          </span>
          <span className="text-3xl font-bold text-emerald-600">
            {animatedTotalSavings} Ksh
          </span>
        </div>
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-gray-600">Subscription Cost</span>
          <span className="text-gray-900 font-semibold text-lg">
            - {subscriptionCost} Ksh
          </span>
        </div>
        <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
          <span className="font-bold text-gray-900 text-lg">Net Savings</span>
          <span
            className={`text-3xl font-bold ${
              netSavings >= 0 ? "text-emerald-600" : "text-orange-600"
            }`}
          >
            {animatedNetSavings >= 0 ? "+" : ""}
            {animatedNetSavings} Ksh
          </span>
        </div>
      </div>

      {/* Insight */}
      {netSavings > 0 && (
        <div className="relative mt-6 bg-white/95 backdrop-blur-sm border-2 border-emerald-400 rounded-2xl p-5 flex items-start gap-3 shadow-lg">
          <div className="flex-shrink-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-2 shadow-md">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-900 mb-1">
              Excellent Value! 🎉
            </p>
            <p className="text-sm text-emerald-800">
              Your premium membership has already paid for itself this month!
              Keep shopping to maximize your savings.
            </p>
          </div>
        </div>
      )}

      {netSavings < 0 && (
        <div className="relative mt-6 bg-white/95 backdrop-blur-sm border-2 border-blue-400 rounded-2xl p-5 flex items-start gap-3 shadow-lg">
          <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-2 shadow-md">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-blue-900 mb-1">
              Keep Shopping! 💡
            </p>
            <p className="text-sm text-blue-800">
              Make a few more purchases this month to maximize your premium
              value!
            </p>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="relative bg-gradient-to-br from-gray-900 to-black border-2 border-amber-500/50 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Share Your Savings!
              </h3>
              <p className="text-gray-400">
                You've saved {Math.round(totalSavings)} KSH this month
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleShare("twitter")}
                className="w-full flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Twitter className="w-5 h-5" />
                <span>Share on Twitter</span>
              </button>

              <button
                onClick={() => handleShare("facebook")}
                className="w-full flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Facebook className="w-5 h-5" />
                <span>Share on Facebook</span>
              </button>

              <button
                onClick={() => handleShare("whatsapp")}
                className="w-full flex items-center gap-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Share on WhatsApp</span>
              </button>

              <button
                onClick={copyLink}
                className="w-full flex items-center gap-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg border border-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumMonthlySummary;
