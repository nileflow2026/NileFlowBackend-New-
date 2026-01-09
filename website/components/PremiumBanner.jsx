/* eslint-disable no-unused-vars */
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Star,
  Zap,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Gift,
  ArrowRight,
} from "lucide-react";
import { usePremiumContext } from "../Context/PremiumContext";

/**
 * PremiumBanner - Homepage CTA for Nile Premium
 * Shows different content for premium vs non-premium users
 */
const PremiumBanner = () => {
  const navigate = useNavigate();
  const { isPremium, expiresAt } = usePremiumContext();

  if (isPremium) {
    return (
      <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-emerald-800/30 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-900/20 my-8">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 rounded-full blur-3xl translate-y-32 -translate-x-32"></div>

        <div className="relative p-8">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-900/50">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-300 bg-clip-text text-transparent">
                    You're a Premium Member!
                  </h3>
                  <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
                </div>
                <p className="text-emerald-100/80 text-sm md:text-base">
                  Enjoying 2x Nile Miles, priority delivery & exclusive deals
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/premium-deals")}
              className="group px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-green-700 hover:scale-105 transition-all duration-300 shadow-xl shadow-emerald-900/50 flex items-center gap-2"
            >
              <Gift className="w-5 h-5" />
              <span>View Premium Deals</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Premium Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-xl p-4 text-center">
              <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-emerald-300 font-bold text-lg">2x Miles</div>
              <div className="text-emerald-100/60 text-xs">Per Purchase</div>
            </div>
            <div className="bg-gradient-to-br from-amber-900/30 to-yellow-900/20 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4 text-center">
              <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <div className="text-amber-300 font-bold text-lg">1-2 Days</div>
              <div className="text-amber-100/60 text-xs">Fast Delivery</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 backdrop-blur-sm border border-purple-800/30 rounded-xl p-4 text-center">
              <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-purple-300 font-bold text-lg">VIP</div>
              <div className="text-purple-100/60 text-xs">Access</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-purple-800/30 rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/20 my-8">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

      <div className="relative p-8">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                Unlock Nile Premium
              </h3>
            </div>

            <p className="text-amber-100/80 text-base md:text-lg mb-6">
              Get priority delivery, 2x Nile Miles, and exclusive deals for just{" "}
              <span className="text-amber-300 font-bold">200 Ksh/month</span>
            </p>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-3 hover:border-amber-500/50 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-blue-300 font-semibold text-sm">
                    Priority Delivery
                  </div>
                  <div className="text-blue-100/60 text-xs">1-2 days</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-3 hover:border-amber-500/50 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-emerald-300 font-semibold text-sm">
                    2x Nile Miles
                  </div>
                  <div className="text-emerald-100/60 text-xs">
                    Every purchase
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-3 hover:border-amber-500/50 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-purple-300 font-semibold text-sm">
                    Premium Deals
                  </div>
                  <div className="text-purple-100/60 text-xs">VIP access</div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/profile?tab=premium")}
            className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 shadow-xl shadow-purple-900/50 flex items-center gap-2 whitespace-nowrap"
          >
            <Crown className="w-5 h-5" />
            <span>Upgrade Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumBanner;
