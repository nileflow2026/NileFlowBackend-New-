/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  validateUserId,
  debugListUsers,
  debugAppwriteConfig,
} from "../utils/userValidation";
import {
  getUserOrders,
  getUserAddresses,
  getUserPreferences,
  updateUserPreferences,
} from "../../adminService";
import UserDebugPanel from "../components/UserDebugPanel";
import {
  User,
  Mail,
  MapPin,
  Package,
  CreditCard,
  Phone,
  Calendar,
  Shield,
  Globe,
  Edit2,
  ArrowLeft,
  ShoppingBag,
  Star,
  Truck,
  Home,
  Building,
  Navigation,
  Map,
} from "lucide-react";
import { toast } from "sonner";

export default function UserPage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Debug: Check Appwrite configuration
        console.log("=== DEBUGGING USER FETCH ===");
        await debugAppwriteConfig();

        // Validate userId parameter first
        console.log("Validating user ID:", userId);
        const validation = await validateUserId(userId);

        if (!validation.exists) {
          console.error("User validation failed:", validation.error);

          // Debug: List available users to help identify the issue
          console.log("Fetching available users for debugging...");
          await debugListUsers();

          throw new Error(validation.error || "User not found");
        }

        console.log(
          "User validation successful, proceeding with full data fetch..."
        );
        const userDoc = validation.user;

        // Fetch orders for the user using API endpoint
        console.log("Fetching orders via API for user ID:", userId);
        try {
          const ordersData = await getUserOrders(userId);
          console.log("Orders fetched via API:", ordersData.length || 0);
          setOrders(ordersData || []);
        } catch (orderError) {
          console.warn("Failed to fetch orders:", orderError.message);
          setOrders([]);
        }

        // Fetch addresses for the user using API endpoint
        console.log("Fetching addresses via API for user ID:", userId);
        try {
          const addressData = await getUserAddresses(userId);
          console.log("Addresses fetched via API:", addressData.length || 0);
          setAddresses(addressData || []);
        } catch (addressError) {
          console.warn("Failed to fetch addresses:", addressError.message);
          setAddresses([]);
        }

        // Try to fetch user preferences using API endpoint
        try {
          const userPrefs = await getUserPreferences(userId);
          console.log("Fetched user preferences:", userPrefs);
          if (userPrefs) {
            setUser({
              ...userDoc,
              preferredPaymentMethod: userPrefs.preferredPaymentMethod,
              preferredShippingMethod: userPrefs.preferredShippingMethod,
              prefs: userPrefs,
            });
          } else {
            setUser(userDoc);
          }
        } catch (prefsErr) {
          console.warn("User preferences not accessible:", prefsErr);
          setUser(userDoc);
        }

        setError(null);
        console.log("=== USER FETCH SUCCESSFUL ===");
      } catch (err) {
        console.error("Error fetching user data:", err);
        console.error("Error details:", {
          name: err.constructor.name,
          code: err.code,
          type: err.type,
          message: err.message,
        });

        // Set a more descriptive error message based on error type
        if (
          err.code === 404 ||
          err.message?.includes("could not be found") ||
          err.message?.includes("not found")
        ) {
          const errorMsg = `User not found: The user with ID '${userId}' does not exist in the database.`;
          setError(new Error(errorMsg));
          toast.error(
            `User not found: ID '${userId?.substring(0, 8)}...' does not exist`
          );
        } else if (err.code === 401) {
          setError(
            new Error(
              "Access denied: You do not have permission to view this user."
            )
          );
          toast.error("Access denied: Insufficient permissions");
        } else if (!userId || userId.trim() === "") {
          setError(
            new Error("Invalid user ID: No user ID provided in the URL.")
          );
          toast.error("Invalid user ID provided");
        } else {
          setError(err);
          toast.error(
            `Failed to load user data: ${err.message || "Unknown error"}`
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    } else {
      setError(new Error("No user ID provided in URL"));
      setIsLoading(false);
    }
  }, [userId]);

  // Calculate user stats
  const userStats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => {
      const total = parseFloat(order.total || order.amount || order.price || 0);
      return sum + (isNaN(total) ? 0 : total);
    }, 0),
    averageOrder:
      orders.length > 0
        ? orders.reduce((sum, order) => {
            const total = parseFloat(
              order.total || order.amount || order.price || 0
            );
            return sum + (isNaN(total) ? 0 : total);
          }, 0) / orders.length
        : 0,
    lastOrder:
      orders.length > 0
        ? new Date(Math.max(...orders.map((o) => new Date(o.$createdAt))))
        : null,
    favoriteCategory:
      orders.length > 0
        ? orders.reduce((acc, order) => {
            const category = order.category || "General";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {})
        : {},
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-[#E8D6B5]/30 dark:bg-[#3A3A3A] rounded-xl mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-2xl"></div>
                <div className="h-48 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-2xl"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-2xl"></div>
                <div className="h-48 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#E74C3C] to-[#C0392B] flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
            {error.message.includes("not found")
              ? "User Not Found"
              : "Error Loading User"}
          </h3>
          <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
            {error.message}
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-6 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <strong>User ID:</strong> {userId}
            <br />
            <strong>Error Type:</strong> {error.code || error.name || "Unknown"}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-lg transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#8B4513] dark:text-[#D4A017] hover:text-[#B8860B] dark:hover:text-[#FFD700] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </button>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
                User Profile
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                Complete user overview and management
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? "Cancel Editing" : "Edit Profile"}
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <Mail className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Profile Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
                {/* Avatar & Status */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <img
                      src={
                        user.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.username
                        )}&background=D4A017&color=fff&bold=true&size=200`
                      }
                      alt={user.username}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-[#2A2A2A] shadow-xl"
                    />
                    <div className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-gradient-to-r from-[#27AE60] to-[#2ECC71] border-2 border-white dark:border-[#2A2A2A]"></div>
                  </div>

                  <h2 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mt-4">
                    {user.username}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-sm text-[#8B4513] dark:text-[#D4A017] font-medium">
                      {user.role || "Customer"}
                    </span>
                    {user.prefs?.isPremium && (
                      <>
                        <div className="w-1 h-1 rounded-full bg-[#D4A017]"></div>
                        <span className="text-xs bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white px-2 py-0.5 rounded-full font-semibold">
                          PREMIUM
                        </span>
                      </>
                    )}
                    {user.prefs?.isVerified && (
                      <>
                        <div className="w-1 h-1 rounded-full bg-[#D4A017]"></div>
                        <span className="text-xs bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          VERIFIED
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Member since{" "}
                    {new Date(user.$createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#E8D6B5]/10 dark:bg-[#3A3A3A]/30">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                        Email
                      </p>
                      <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3] truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {user.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#E8D6B5]/10 dark:bg-[#3A3A3A]/30">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                          Phone
                        </p>
                        <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          {user.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {user.location && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#E8D6B5]/10 dark:bg-[#3A3A3A]/30">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                          Location
                        </p>
                        <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          {user.location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#FFF9E6] to-[#FFEBB2] dark:from-[#3A2C1A] dark:to-[#2A1C0A] text-center">
                    <div className="text-2xl font-bold text-[#B8860B] dark:text-[#FFD700]">
                      {userStats.totalOrders}
                    </div>
                    <div className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 font-medium">
                      Orders
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] dark:from-[#1A2C1A] dark:to-[#0A1C0A] text-center">
                    <div className="text-2xl font-bold text-[#27AE60] dark:text-[#2ECC71]">
                      KSh {userStats.totalSpent.toFixed(2)}
                    </div>
                    <div className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 font-medium">
                      Total Spent
                    </div>
                  </div>
                </div>

                {/* Nile Miles */}
                {user.prefs?.nileMiles !== undefined && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A]/50 dark:to-[#3A3A3A]/30 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-[#2C1810] dark:text-[#F5E6D3] flex items-center gap-2">
                        <Star className="w-4 h-4 text-[#D4A017]" />
                        Nile Miles
                      </span>
                      <span className="text-lg font-bold text-[#D4A017]">
                        {user.prefs.nileMiles.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Total Earned:{" "}
                      {user.prefs?.totalMilesEarned?.toLocaleString() || "0"}
                    </div>
                    {user.prefs?.lastMilesUpdate && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Last updated:{" "}
                        {new Date(
                          user.prefs.lastMilesUpdate
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Verification Status */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A]/50 dark:to-[#3A3A3A]/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                      Account Status
                    </span>
                    <Shield className="w-4 h-4 text-[#27AE60]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#27AE60] animate-pulse"></div>
                    <span className="text-xs font-medium text-[#27AE60]">
                      Verified Account
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="flex overflow-x-auto scrollbar-hide border-b border-[#E8D6B5]/30 dark:border-[#3A3A3A]">
              {[
                "overview",
                "orders",
                "addresses",
                "activity",
                "preferences",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                    activeTab === tab
                      ? "border-[#D4A017] text-[#D4A017] dark:text-[#FFD700]"
                      : "border-transparent text-[#8B4513]/70 dark:text-[#D4A017]/70 hover:text-[#B8860B] dark:hover:text-[#FFD700]"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                            Avg Order Value
                          </p>
                          <p className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                            KSh {userStats.averageOrder.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                            Last Order
                          </p>
                          <p className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                            {userStats.lastOrder
                              ? userStats.lastOrder.toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )
                              : "Never"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                          <Star className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                            User Tier
                          </p>
                          <p className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                            {userStats.totalOrders > 10
                              ? "Gold"
                              : userStats.totalOrders > 5
                              ? "Silver"
                              : "Bronze"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders Preview */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                      Recent Orders
                    </h3>
                    {orders.length > 0 ? (
                      <div className="space-y-3">
                        {orders.slice(0, 3).map((order) => (
                          <div
                            key={order.$id}
                            className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-white/50 dark:hover:bg-[#2A2A2A]/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                                    Order #{order.$id.substring(0, 8)}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      order.status === "Shipped"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : order.status === "Pending"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                    }`}
                                  >
                                    {order.status}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(
                                    order.$createdAt
                                  ).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                              </div>
                              <div className="text-lg font-bold text-[#D4A017]">
                                KSh{" "}
                                {(() => {
                                  const total = parseFloat(
                                    order.total ||
                                      order.amount ||
                                      order.price ||
                                      0
                                  );
                                  return isNaN(total)
                                    ? "0.00"
                                    : total.toFixed(2);
                                })()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-[#E8D6B5] dark:text-[#3A3A3A] mx-auto mb-4" />
                        <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70">
                          No orders found for this user
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                      Order History ({orders.length})
                    </h3>
                    <button className="text-sm font-medium text-[#8B4513] dark:text-[#D4A017] hover:underline">
                      Export Orders
                    </button>
                  </div>

                  {orders.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A]">
                      <table className="w-full min-w-[600px]">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#E8D6B5]/10 to-[#F5E6D3]/5 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A]/50">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                              Order ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8D6B5]/30 dark:divide-[#3A3A3A]">
                          {orders.map((order) => (
                            <tr
                              key={order.$id}
                              className="hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3] font-mono">
                                  #{order.$id.substring(0, 8)}...
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {new Date(
                                  order.$createdAt
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    order.status === "Shipped"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      : order.status === "Pending"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                                KSh{" "}
                                {(() => {
                                  const total = parseFloat(
                                    order.total ||
                                      order.amount ||
                                      order.price ||
                                      0
                                  );
                                  return isNaN(total)
                                    ? "0.00"
                                    : total.toFixed(2);
                                })()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-16 h-16 text-[#E8D6B5] dark:text-[#3A3A3A] mx-auto mb-4" />
                      <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                        No orders found for this user
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This user hasn't placed any orders yet
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === "addresses" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                      Saved Addresses ({addresses.length})
                    </h3>
                    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white text-sm font-semibold hover:shadow-lg transition-all duration-200">
                      <MapPin className="w-4 h-4" />
                      Add New Address
                    </button>
                  </div>

                  {addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <div
                          key={address.$id}
                          className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50 hover:bg-white dark:hover:bg-[#2A2A2A] transition-colors"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                              <Home className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                                {address.addressType || "Primary Address"}
                              </h4>
                              {address.isDefault && (
                                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-[#E8D6B5]/20 text-[#8B4513] dark:text-[#D4A017] rounded-full mt-1">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1 text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                            <p className="font-medium">{address.address}</p>
                            <p>
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                            <p>{address.country}</p>
                            {address.phone && (
                              <p className="text-gray-600 dark:text-gray-400 mt-2">
                                📞 {address.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Map className="w-16 h-16 text-[#E8D6B5] dark:text-[#3A3A3A] mx-auto mb-4" />
                      <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                        No addresses saved
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This user hasn't saved any addresses yet
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                      User Preferences
                    </h3>
                    <button
                      onClick={async () => {
                        try {
                          toast.success("Preferences refreshed successfully");
                        } catch (error) {
                          toast.error("Failed to refresh preferences");
                        }
                      }}
                      className="text-sm font-medium text-[#8B4513] dark:text-[#D4A017] hover:underline"
                    >
                      Refresh Preferences
                    </button>
                  </div>

                  {/* Payment & Shipping Preferences */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                            Payment Method
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Preferred payment method
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                        {(() => {
                          const method =
                            user.prefs?.preferredPaymentMethod ||
                            user.preferredPaymentMethod ||
                            "Credit Card";
                          const methodMap = {
                            cashOnDelivery: "Cash on Delivery",
                            creditCard: "Credit Card",
                            debitCard: "Debit Card",
                            mpesa: "M-Pesa",
                            paypal: "PayPal",
                            bankTransfer: "Bank Transfer",
                          };
                          return methodMap[method] || method;
                        })()}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                          <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                            Shipping Preference
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Default shipping option
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                        {user.prefs?.preferredShippingMethod ||
                          user.preferredShippingMethod ||
                          "Standard Shipping"}
                      </p>
                    </div>
                  </div>

                  {/* Premium Subscription Status */}
                  {user.prefs?.subscriptionId && (
                    <div className="mb-6 p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-gradient-to-r from-[#D4A017]/10 to-[#B8860B]/5 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A]/50">
                      <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-[#D4A017]" />
                        Premium Subscription
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 rounded-lg bg-white/50 dark:bg-[#2A2A2A]/50">
                          <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-1">
                            Status
                          </p>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                user.prefs?.isPremium
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            ></div>
                            <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                              {user.prefs?.isPremium ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/50 dark:bg-[#2A2A2A]/50">
                          <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-1">
                            Started
                          </p>
                          <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                            {user.prefs?.subscriptionStartedAt
                              ? new Date(
                                  user.prefs.subscriptionStartedAt
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "N/A"}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/50 dark:bg-[#2A2A2A]/50">
                          <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-1">
                            Expires
                          </p>
                          <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                            {user.prefs?.subscriptionExpiresAt
                              ? new Date(
                                  user.prefs.subscriptionExpiresAt
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      {user.prefs?.subscriptionId && (
                        <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                          <span className="text-gray-500">
                            Subscription ID:{" "}
                          </span>
                          <span className="font-mono text-gray-700 dark:text-gray-300">
                            {user.prefs.subscriptionId}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* System Preferences */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                          <Globe className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                            Currency
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-medium text-[#D4A017]">
                        {user.prefs?.currency || "KSh"}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                          <Globe className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                            Language
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                        {user.prefs?.language === "en"
                          ? "English"
                          : user.prefs?.language || "English"}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#E67E22] to-[#D35400] flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                            Timezone
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                        {user.prefs?.timezone || "Africa/Nairobi"}
                      </p>
                    </div>
                  </div>

                  {/* Communication Preferences */}
                  <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                    <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-[#D4A017]" />
                      Communication Preferences
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#E8D6B5]/10 dark:bg-[#3A3A3A]/30">
                        <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          Email Notifications
                        </span>
                        <div
                          className={`w-12 h-6 rounded-full transition-colors ${
                            user.prefs?.emailNotifications !== false
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          } relative`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                              user.prefs?.emailNotifications !== false
                                ? "translate-x-6"
                                : "translate-x-0.5"
                            } absolute top-0.5`}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#E8D6B5]/10 dark:bg-[#3A3A3A]/30">
                        <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          SMS Notifications
                        </span>
                        <div
                          className={`w-12 h-6 rounded-full transition-colors ${
                            user.prefs?.smsNotifications !== false
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          } relative`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                              user.prefs?.smsNotifications !== false
                                ? "translate-x-6"
                                : "translate-x-0.5"
                            } absolute top-0.5`}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#E8D6B5]/10 dark:bg-[#3A3A3A]/30">
                        <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          Marketing Emails
                        </span>
                        <div
                          className={`w-12 h-6 rounded-full transition-colors ${
                            user.prefs?.marketingEmails === true
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          } relative`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                              user.prefs?.marketingEmails === true
                                ? "translate-x-6"
                                : "translate-x-0.5"
                            } absolute top-0.5`}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#E8D6B5]/10 dark:bg-[#3A3A3A]/30">
                        <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          Order Updates
                        </span>
                        <div
                          className={`w-12 h-6 rounded-full transition-colors ${
                            user.prefs?.orderNotifications !== false
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          } relative`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                              user.prefs?.orderNotifications !== false
                                ? "translate-x-6"
                                : "translate-x-0.5"
                            } absolute top-0.5`}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#E8D6B5]/10 dark:bg-[#3A3A3A]/30">
                        <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          Promotions
                        </span>
                        <div
                          className={`w-12 h-6 rounded-full transition-colors ${
                            user.prefs?.promotionalNotifications === true
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          } relative`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                              user.prefs?.promotionalNotifications === true
                                ? "translate-x-6"
                                : "translate-x-0.5"
                            } absolute top-0.5`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Last Updated Info */}
                  {user.prefs?.lastUpdated && (
                    <div className="mt-4 p-3 rounded-lg bg-[#E8D6B5]/10 dark:bg-[#3A3A3A]/30 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Preferences last updated:{" "}
                        {new Date(user.prefs.lastUpdated).toLocaleString(
                          "en-US",
                          {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel - Remove this after debugging */}
      <UserDebugPanel userId={userId} />
    </div>
  );
}
