import { useEffect, useState } from "react";
import axiosClient from "../../api";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import {
  Award,
  Gem,
  Sparkles,
  Crown,
  Gift,
  TrendingUp,
  Zap,
  Clock,
  Star,
  Shield,
  Truck,
  ChevronLeft,
  Wallet,
  Coins,
  History,
  CheckCircle,
  Trophy,
  Target,
  ShoppingBag,
  Users,
} from "lucide-react";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";

const RedeemPage = () => {
  const { user, isLoading: userLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const [nileMilesData, setNileMilesData] = useState({
    currentMiles: 0,
    earnedHistory: [],
    redeemed: [],
  });
  const [nileMilesLoading, setNileMilesLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeeming, setRedeeming] = useState(false);

  const REWARDS = [
    {
      key: "a_pen",
      name: "Premium Pen",
      miles: 50,
      icon: "🖋️",
      color: "from-blue-600 to-blue-800",
      description: "Limited edition African design pen",
    },
    {
      key: "free_delivery",
      name: "Free Delivery",
      miles: 250,
      icon: "🚚",
      color: "from-emerald-600 to-emerald-800",
      description: "Express delivery on any order",
    },
    {
      key: "5_percent_off",
      name: "5% Discount",
      miles: 500,
      icon: "💸",
      color: "from-purple-600 to-purple-800",
      description: "5% off your next purchase",
    },
    {
      key: "premium_sale",
      name: "Premium Access",
      miles: 1000,
      icon: "👑",
      color: "from-amber-600 to-amber-800",
      description: "Early access to premium sales",
    },
    {
      key: "hoodie",
      name: "Premium Hoodie",
      miles: 2000,
      icon: "🧥",
      color: "from-red-600 to-red-800",
      description: "Exclusive African design hoodie",
    },
    {
      key: "gold_member",
      name: "Gold Membership",
      miles: 5000,
      icon: "⭐",
      color: "from-yellow-600 to-yellow-800",
      description: "One year gold membership",
    },
  ];

  useEffect(() => {
    const fetchNileMiles = async () => {
      setNileMilesLoading(true);
      try {
        const uid = user?.id ?? user?.userId;
        const res = await axiosClient.get(
          `/api/nilemiles/nilemiles/status?userId=${uid}`
        );
        setNileMilesData(res.data);
      } catch (error) {
        console.error("❌ Failed to load Nile Miles:", error);
      } finally {
        setNileMilesLoading(false);
      }
    };

    // Wait until auth loading completes before deciding
    if (userLoading) return;

    // If no user after auth check, stop miles loading to show the access UI
    if (!user || !(user.id || user.userId)) {
      setNileMilesLoading(false);
      return;
    }

    fetchNileMiles();
  }, [user, userLoading]);

  const handleRedeem = async (rewardKey) => {
    const uid = user?.id ?? user?.userId;
    if (!uid) {
      showToast("Please log in to redeem rewards", "warning");
      return;
    }

    const reward = REWARDS.find((r) => r.key === rewardKey);
    if (!reward) {
      showToast("Invalid reward selected", "error");
      return;
    }

    setRedeeming(true);
    try {
      const payload = {
        userId: uid,
        rewardKey,
      };
      console.log("📤 Redeem payload:", payload);
      console.log("Current miles:", nileMilesData.currentMiles);
      console.log("Reward miles required:", reward.miles);

      const res = await axiosClient.post("/api/nilemiles/redeem", payload);
      console.log("✅ Redeem response:", res.data);

      if (res.data.success) {
        showToast(`Success! You redeemed: ${res.data.reward}`, "success");
        setNileMilesData((prev) => ({
          ...prev,
          currentMiles: prev.currentMiles - reward.miles,
          redeemed: [
            ...(prev.redeemed || []),
            {
              rewardName: res.data.reward,
              milesUsed: reward.miles,
              date: new Date().toISOString(),
            },
          ],
        }));
        setSelectedReward(null);
      }
    } catch (error) {
      console.error("❌ Redeem failed:", {
        status: error.response?.status,
        error: error.response?.data,
        message: error.message,
      });
      const errorMsg =
        error.response?.data?.error || "Could not redeem reward.";
      showToast(`Failed: ${errorMsg}`, "error");
    } finally {
      setRedeeming(false);
    }
  };

  const showToast = (message, type = "info") => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 animate-fadeIn`;
    toast.innerHTML = `
      <div class="bg-gradient-to-r ${
        type === "success"
          ? "from-emerald-900/80 to-green-900/80 border-emerald-700/50"
          : type === "error"
          ? "from-red-900/80 to-amber-900/80 border-red-700/50"
          : "from-amber-900/80 to-yellow-900/80 border-amber-700/50"
      } backdrop-blur-sm border rounded-2xl p-4 shadow-2xl">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br ${
            type === "success"
              ? "from-emerald-600 to-emerald-700"
              : type === "error"
              ? "from-red-600 to-amber-700"
              : "from-amber-600 to-yellow-700"
          } flex items-center justify-center">
            ${type === "success" ? "✓" : type === "error" ? "✕" : "⚡"}
          </div>
          <div>
            <p class="font-bold text-white">${
              type === "success"
                ? "Success!"
                : type === "error"
                ? "Error!"
                : "Info"
            }</p>
            <p class="${
              type === "success"
                ? "text-emerald-100"
                : type === "error"
                ? "text-red-100"
                : "text-amber-100"
            } text-sm">${message}</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const getNextReward = (miles) => {
    const sorted = [...REWARDS].sort((a, b) => a.miles - b.miles);
    for (const r of sorted) {
      if (miles < r.miles) return r;
    }
    return null;
  };

  const getProgressToNext = (miles) => {
    const next = getNextReward(miles);
    if (!next) {
      return { percent: 100, nextReward: null, milesLeft: 0 };
    }
    const target = next.miles;
    const percent = Math.min((miles / target) * 100, 100);
    const milesLeft = Math.max(target - miles, 0);
    return { percent: Math.round(percent), nextReward: next, milesLeft };
  };

  if (userLoading || nileMilesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Gem className="w-10 h-10 text-amber-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-red-900/30 to-amber-900/30 border border-red-700/30 mb-6">
          <Shield className="w-12 h-12 text-red-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Access Required</h2>
        <p className="text-gray-400 text-center max-w-md mb-8">
          Please log in to access premium rewards and redeem your Nile Miles.
        </p>
        <button
          onClick={() => navigate("/signin")}
          className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
        >
          Sign In to Continue
        </button>
      </div>
    );
  }

  return (
    <>
      <Header />

      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-gray-900/10 to-emerald-900/10"></div>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 pt-4 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="relative max-w-8xl mx-auto">
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate(-1)}
              className="group w-12 h-12 rounded-2xl bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 flex items-center justify-center text-amber-400 hover:text-amber-300 hover:scale-110 transition-all duration-300"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="ml-4">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-700/30 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-amber-200 text-sm font-medium">
                  Premium Rewards
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Nile{" "}
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
                  Miles
                </span>
              </h1>
            </div>
          </div>

          {/* Current Miles Display */}
          <div className="mb-12">
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
              <div className="text-center mb-8">
                <p className="text-amber-100/70 text-sm mb-2">
                  Your Current Balance
                </p>
                <div className="flex items-baseline justify-center space-x-2 mb-4">
                  <Coins className="w-8 h-8 text-amber-400" />
                  <span className="text-6xl font-bold text-amber-300">
                    {nileMilesData.currentMiles}
                  </span>
                  <span className="text-2xl text-amber-100/70">Miles</span>
                </div>
                <p className="text-amber-100/50 text-sm">
                  Available to redeem for premium rewards
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                {(() => {
                  const { percent, nextReward, milesLeft } = getProgressToNext(
                    nileMilesData.currentMiles
                  );
                  return (
                    <>
                      <div className="flex items-center justify-between text-amber-100/70 text-sm mb-2">
                        <span>
                          {nextReward
                            ? `Next: ${nextReward.name} • ${milesLeft} miles needed`
                            : "All rewards unlocked"}
                        </span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-800/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-amber-100/50 mt-2">
                        <span>0</span>
                        <span>
                          {nextReward
                            ? nextReward.miles
                            : REWARDS[REWARDS.length - 1].miles}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 text-center">
                  <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-xl font-bold text-blue-300">8</div>
                  <div className="text-blue-100/80 text-sm">
                    Available Rewards
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <div className="text-xl font-bold text-emerald-300">
                    {nileMilesData.redeemed?.length || 0}
                  </div>
                  <div className="text-emerald-100/80 text-sm">Redeemed</div>
                </div>
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 text-center">
                  <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <div className="text-xl font-bold text-amber-300">
                    {REWARDS.length}
                  </div>
                  <div className="text-amber-100/80 text-sm">Total Rewards</div>
                </div>
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 text-center">
                  <Wallet className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-xl font-bold text-purple-300">∞</div>
                  <div className="text-purple-100/80 text-sm">
                    Miles Never Expire
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rewards Grid */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Premium Rewards
                </h2>
                <p className="text-amber-100/70">
                  Redeem your miles for exclusive benefits
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-6 h-6 text-amber-400" />
                <span className="text-amber-200 font-medium">Exclusive</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {REWARDS.map((reward) => {
                const canRedeem = nileMilesData.currentMiles >= reward.miles;
                return (
                  <div
                    key={reward.key}
                    className={`group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2 ${
                      canRedeem ? "cursor-pointer" : "cursor-not-allowed"
                    }`}
                    onClick={() => canRedeem && setSelectedReward(reward)}
                  >
                    {/* Background Glow */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${reward.color.replace(
                        "600",
                        "500"
                      )}/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    ></div>

                    {/* Card */}
                    <div
                      className={`relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border rounded-3xl overflow-hidden transition-all duration-500 h-full ${
                        canRedeem
                          ? "border-amber-800/30 group-hover:border-amber-500/50"
                          : "border-gray-800/50"
                      }`}
                    >
                      {/* Ribbon for Affordable */}
                      {reward.miles <= 100 && (
                        <div className="absolute top-0 left-0 z-10">
                          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-bold px-4 py-1 rounded-br-xl">
                            Quick Win
                          </div>
                        </div>
                      )}

                      {/* Reward Icon */}
                      <div className="p-6">
                        <div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${reward.color} flex items-center justify-center text-3xl mb-4`}
                        >
                          {reward.icon}
                        </div>

                        <div className="mb-4">
                          <h3
                            className={`text-xl font-bold mb-2 ${
                              canRedeem
                                ? "text-white group-hover:text-amber-300"
                                : "text-gray-500"
                            } transition-colors duration-300`}
                          >
                            {reward.name}
                          </h3>
                          <p className="text-amber-100/70 text-sm">
                            {reward.description}
                          </p>
                        </div>

                        {/* Miles Required */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-2">
                            <Coins className="w-5 h-5 text-amber-400" />
                            <span
                              className={`text-2xl font-bold ${
                                canRedeem ? "text-amber-300" : "text-gray-500"
                              }`}
                            >
                              {reward.miles}
                            </span>
                            <span className="text-amber-100/50">Miles</span>
                          </div>

                          {canRedeem ? (
                            <div className="flex items-center space-x-1 bg-gradient-to-r from-emerald-900/40 to-green-900/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-700/30">
                              <Zap className="w-3 h-3 text-emerald-400" />
                              <span className="text-xs font-bold text-emerald-200">
                                Available
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 bg-gradient-to-r from-gray-900/40 to-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-700/30">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs font-bold text-gray-400">
                                Need more
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            canRedeem && setSelectedReward(reward);
                          }}
                          disabled={!canRedeem || redeeming}
                          className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 ${
                            canRedeem
                              ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 hover:scale-105"
                              : "bg-gradient-to-r from-gray-800 to-black text-gray-400 border border-gray-800/50"
                          }`}
                        >
                          <Gift className="w-5 h-5" />
                          <span>
                            {canRedeem ? "Redeem Now" : "Insufficient Miles"}
                          </span>
                        </button>
                      </div>

                      {/* Hover Effect */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-emerald-500 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Redeemed History */}
          {nileMilesData.redeemed?.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Redemption History
                  </h2>
                  <p className="text-amber-100/70">
                    Your recent reward redemptions
                  </p>
                </div>
                <History className="w-6 h-6 text-amber-400" />
              </div>

              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-amber-800/30">
                        <th className="text-left p-4 text-amber-200 font-medium">
                          Reward
                        </th>
                        <th className="text-left p-4 text-amber-200 font-medium">
                          Miles Used
                        </th>
                        <th className="text-left p-4 text-amber-200 font-medium">
                          Date
                        </th>
                        <th className="text-left p-4 text-amber-200 font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {nileMilesData.redeemed
                        .filter(
                          (item) => item?.date && !isNaN(new Date(item.date))
                        )
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-amber-800/20 hover:bg-amber-900/10 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-700/20 flex items-center justify-center">
                                  <Gift className="w-5 h-5 text-amber-400" />
                                </div>
                                <span className="text-white font-medium">
                                  {item.rewardName}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <Coins className="w-4 h-4 text-amber-400" />
                                <span className="text-amber-300 font-bold">
                                  {item.milesUsed}
                                </span>
                                <span className="text-amber-100/70">miles</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-100">
                                  {new Date(item.date).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-emerald-900/40 to-green-900/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-700/30">
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-200">
                                  Redeemed
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* No History Message */}
          {(!nileMilesData.redeemed || nileMilesData.redeemed.length === 0) && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border border-amber-700/30 mb-6">
                <History className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No Redemption History
              </h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                You haven't redeemed any rewards yet. Start by earning miles
                through purchases and activities!
              </p>
            </div>
          )}

          {/* How to Earn Section */}
          <div className="mt-12">
            <div className="bg-gradient-to-r from-amber-900/20 to-emerald-900/20 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                How to Earn More Miles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-amber-200 mb-2">
                    Make Purchases
                  </h4>
                  <p className="text-amber-100/70 text-sm">
                    Earn 10 miles for every 1 spent
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-200 mb-2">
                    Write Reviews
                  </h4>
                  <p className="text-emerald-100/70 text-sm">
                    Get 100 miles per review
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-blue-200 mb-2">
                    Refer Friends
                  </h4>
                  <p className="text-blue-100/70 text-sm">
                    500 miles per successful referral
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Redeem Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-amber-800/50 rounded-3xl max-w-md w-full overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-6">
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${selectedReward.color} flex items-center justify-center text-4xl mx-auto mb-4`}
                >
                  {selectedReward.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Confirm Redemption
                </h3>
                <p className="text-amber-100/70">
                  Redeem {selectedReward.miles} miles for
                </p>
              </div>

              <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-300 mb-2">
                    {selectedReward.name}
                  </div>
                  <p className="text-amber-100/70">
                    {selectedReward.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-amber-100/70">
                  <span>Current miles:</span>
                  <span className="text-amber-300 font-bold">
                    {nileMilesData.currentMiles}
                  </span>
                </div>
                <div className="flex items-center justify-between text-amber-100/70">
                  <span>Cost:</span>
                  <span className="text-red-300 font-bold">
                    -{selectedReward.miles}
                  </span>
                </div>
                <div className="border-t border-amber-800/30 pt-4">
                  <div className="flex items-center justify-between text-white">
                    <span>Remaining miles:</span>
                    <span className="text-emerald-300 font-bold">
                      {nileMilesData.currentMiles - selectedReward.miles}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setSelectedReward(null)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 text-amber-400 rounded-xl hover:border-amber-500/50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRedeem(selectedReward.key)}
                  disabled={redeeming}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  {redeeming ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Confirm Redeem</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RedeemPage;
