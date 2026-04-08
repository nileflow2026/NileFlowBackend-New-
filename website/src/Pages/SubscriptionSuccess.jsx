import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Crown, Loader, XCircle } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { usePremiumContext } from "../../Context/PremiumContext";

/**
 * SubscriptionSuccess - Handles return from Stripe checkout
 * Polls subscription status until confirmed
 */
const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPremium, refreshStatus } = usePremiumContext();
  const [status, setStatus] = useState("checking"); // checking, success, failed
  const [countdown, setCountdown] = useState(30);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setStatus("failed");
      return;
    }

    // Poll subscription status
    let pollCount = 0;
    const maxPolls = 30; // 60 seconds total (2 second intervals) - increased for webhook delay

    const checkStatus = setInterval(async () => {
      console.log(
        `[Stripe Success] Polling subscription status... (${
          pollCount + 1
        }/${maxPolls})`
      );

      try {
        await refreshStatus();
        console.log(`[Stripe Success] Current isPremium status:`, isPremium);
      } catch (error) {
        console.error(`[Stripe Success] Error refreshing status:`, error);
      }

      pollCount++;

      // Update countdown
      setCountdown(60 - pollCount * 2);

      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        console.log('[Stripe Success] Max polls reached, stopping...');
        clearInterval(checkStatus);
        if (!isPremium) {
          console.log('[Stripe Success] Still not premium, showing failed state');
          setStatus("failed");
        }
      }
    }, 2000);

    return () => clearInterval(checkStatus);
  }, [sessionId, refreshStatus, isPremium]);

  // Check if premium status changed
  useEffect(() => {
    console.log('[Stripe Success] isPremium changed:', isPremium, 'status:', status);
    if (isPremium && status === "checking") {
      console.log('[Stripe Success] Premium activated! Showing success message');
      setStatus("success");
      
      // Redirect to profile after 3 seconds
      setTimeout(() => {
        console.log('[Stripe Success] Redirecting to profile...');
        navigate("/profile?tab=premium");
      }, 3000);
    }
  }, [isPremium, status, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          {/* Checking Status */}
          {status === "checking" && (
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-purple-800/30 rounded-3xl p-12 text-center shadow-2xl">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-900/50">
                <Loader className="w-12 h-12 text-white animate-spin" />
              </div>

              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent mb-4">
                Processing Your Payment
              </h1>

              <p className="text-amber-100/80 text-lg mb-6">
                Please wait while we confirm your premium subscription...
              </p>

              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/10 backdrop-blur-sm border border-purple-800/30 rounded-xl p-6 mb-6">
                <p className="text-purple-300 text-sm font-semibold mb-2">
                  ⏱️ Verifying Payment
                </p>
                <p className="text-purple-100/70 text-sm">
                  Stripe is confirming your payment. This can take up to 60 seconds.
                </p>
                <div className="mt-4 text-purple-200/60 text-xs">
                  Time remaining: {countdown} seconds
                </div>
                <div className="mt-2 text-purple-200/40 text-xs">
                  Session ID: {sessionId?.slice(-20)}
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2 text-amber-100/60 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          )}

          {/* Success Status */}
          {status === "success" && (
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-emerald-800/30 rounded-3xl p-12 text-center shadow-2xl animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-900/50">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-300 bg-clip-text text-transparent mb-4">
                Welcome to Premium! 🎉
              </h1>

              <p className="text-amber-100/80 text-lg mb-6">
                Your payment was successful and your premium subscription is now
                active.
              </p>

              <div className="bg-gradient-to-r from-emerald-900/30 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Crown className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-xl font-bold text-emerald-300">
                    Premium Benefits Unlocked
                  </h3>
                </div>
                <ul className="space-y-3 text-left max-w-md mx-auto">
                  {[
                    "2x Nile Miles on every purchase",
                    "Priority delivery (1-2 days)",
                    "Exclusive premium deals",
                    "24/7 priority customer support",
                  ].map((benefit, index) => (
                    <li
                      key={index}
                      className="flex items-center space-x-2 text-emerald-100/80"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => navigate("/profile?tab=premium")}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-green-700 hover:scale-105 transition-all duration-300 shadow-xl shadow-emerald-900/50"
              >
                Go to Your Dashboard
              </button>

              <p className="text-amber-100/60 text-sm mt-4">
                Redirecting automatically in 3 seconds...
              </p>
            </div>
          )}

          {/* Failed Status */}
          {status === "failed" && (
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-red-800/30 rounded-3xl p-12 text-center shadow-2xl">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-900/50">
                <XCircle className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-300 via-red-300 to-red-300 bg-clip-text text-transparent mb-4">
                Payment Verification Failed
              </h1>

              <p className="text-amber-100/80 text-lg mb-6">
                We couldn't verify your payment. This might be due to:
              </p>

              <div className="bg-gradient-to-r from-red-900/30 to-red-900/20 backdrop-blur-sm border border-red-800/30 rounded-xl p-6 mb-8">
                <ul className="text-left max-w-md mx-auto space-y-2 text-red-100/80 mb-4">
                  <li>• Stripe webhook hasn't arrived yet (can take 30-60 seconds)</li>
                  <li>• Payment was cancelled or declined</li>
                  <li>• Network connection issues</li>
                  <li>• Payment is still being processed</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-red-700/30">
                  <p className="text-red-200/70 text-sm">
                    <strong>Session ID:</strong> {sessionId?.slice(-20)}
                  </p>
                  <p className="text-red-200/60 text-xs mt-2">
                    Check your profile in a few minutes - the subscription may activate soon.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/profile?tab=premium")}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 shadow-xl shadow-purple-900/50"
                >
                  Try Again
                </button>

                <button
                  onClick={() => navigate("/help-center")}
                  className="px-8 py-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 border border-amber-800/30"
                >
                  Contact Support
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SubscriptionSuccess;
