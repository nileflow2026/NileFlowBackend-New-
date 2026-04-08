import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PremiumBadge from "../../components/PremiumBadge";
import { premiumService } from "../../utils/premiumService";
import { usePremiumStatus } from "../../hooks/usePremiumStatus";
import ProductCard from "../../components/ProductCard";

/**
 * PremiumDealsPage - Exclusive deals page for premium members
 * Protected route - shows upgrade CTA if not premium
 */
const PremiumDealsPage = () => {
  const navigate = useNavigate();
  const { isPremium, loading: statusLoading } = usePremiumStatus();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeals = async () => {
      if (!isPremium) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await premiumService.getPremiumDeals();
        setDeals(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!statusLoading) {
      fetchDeals();
    }
  }, [isPremium, statusLoading]);

  // Loading state
  if (statusLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-white/10 rounded-2xl w-1/3 mb-8"></div>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-80 bg-white/10 rounded-3xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-premium user - show upgrade CTA
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-indigo-700/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-12 shadow-2xl overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

              <div className="relative text-center">
                {/* Lock Icon */}
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-900/50">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {/* Heading */}
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent mb-6">
                  Premium Deals Are Members-Only
                </h1>
                <p className="text-purple-100/80 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
                  Unlock exclusive discounts, priority delivery, and 2x Nile
                  Miles with Nile Premium for just{" "}
                  <span className="text-amber-300 font-bold">
                    200 Ksh/month
                  </span>
                </p>

                {/* Benefits Preview */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  <div className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 hover:scale-105 transition-all duration-300 shadow-xl">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-3xl">🏷️</span>
                    </div>
                    <h3 className="font-bold text-white text-lg mb-2">
                      Up to 40% Off
                    </h3>
                    <p className="text-purple-100/70 text-sm">
                      Premium-only deals on top products
                    </p>
                  </div>
                  <div className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 hover:scale-105 transition-all duration-300 shadow-xl">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-3xl">🚀</span>
                    </div>
                    <h3 className="font-bold text-white text-lg mb-2">
                      Priority Delivery
                    </h3>
                    <p className="text-purple-100/70 text-sm">
                      Get it in 1-2 days, not 5-7
                    </p>
                  </div>
                  <div className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 hover:scale-105 transition-all duration-300 shadow-xl">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-3xl">⭐</span>
                    </div>
                    <h3 className="font-bold text-white text-lg mb-2">
                      2x Miles
                    </h3>
                    <p className="text-purple-100/70 text-sm">
                      Double rewards on all purchases
                    </p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate("/profile?tab=premium")}
                    className="group px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg rounded-xl hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 shadow-2xl shadow-purple-900/50 flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Upgrade to Premium
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="px-10 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold text-lg rounded-xl hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-xl"
                  >
                    Back to Home
                  </button>
                </div>

                {/* Fine Print */}
                <p className="text-purple-200/70 text-sm mt-8">
                  Try it risk-free. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-red-600/20 via-red-500/20 to-red-700/20 backdrop-blur-xl border border-red-500/30 rounded-3xl p-12 text-center shadow-2xl">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center mx-auto mb-6 shadow-xl">
                <svg
                  className="w-10 h-10 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Failed to Load Premium Deals
              </h2>
              <p className="text-red-200 mb-8 text-lg">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-lg rounded-xl hover:from-red-700 hover:to-red-800 hover:scale-105 transition-all duration-300 shadow-xl"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Premium user - show deals
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl">
              <svg
                className="w-7 h-7 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                Premium Deals
              </h1>
              <p className="text-purple-200/70 text-sm">
                Exclusive discounts only for Nile Premium members
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-amber-600/20 to-yellow-600/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-5 mb-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg flex-shrink-0">
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
            <div className="flex-1">
              <p className="text-amber-100 font-medium">
                <strong className="text-amber-300">Premium Perk:</strong> All
                items here qualify for priority delivery (1-2 days) and earn 2x
                Nile Miles
              </p>
            </div>
          </div>
        </div>

        {/* No Deals */}
        {deals.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
              <div className="text-6xl">🎁</div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              New Deals Coming Soon
            </h2>
            <p className="text-purple-200/70 text-lg">
              Check back later for exclusive premium discounts
            </p>
          </div>
        ) : (
          <>
            {/* Deals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {deals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load More (if applicable) */}
            {deals.length >= 20 && (
              <div className="text-center mt-12">
                <button className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg rounded-xl hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 shadow-2xl shadow-purple-900/50">
                  Load More Deals
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PremiumDealsPage;
