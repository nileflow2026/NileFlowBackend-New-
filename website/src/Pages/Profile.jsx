/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  User,
  Camera,
  Award,
  TrendingUp,
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  Mail,
  Shield,
  Sparkles,
  Edit2,
  CheckCircle,
  Package,
  Truck,
  Star,
  Zap,
  Gift,
  Globe,
  Settings,
  CreditCard,
  Heart,
  History,
  ChevronRight,
  Crown,
} from "lucide-react";
import Header from "../../components/Header";
import axiosClient from "../../api";
import {
  getCustomerOrders,
  getOrders,
  updateCurrencyRates,
} from "../../CustomerServices";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "../../components/Footer";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";
import { toast } from "react-toastify";
import SubscriptionSettings from "../../components/SubscriptionSettings";
import PremiumMonthlySummary from "../../components/PremiumMonthlySummary";
import PremiumBanner from "../../components/PremiumBanner";
import { useFavorites } from "../../Context/FavoritesContext.jsx";
import ProductCard from "../../components/ProductCard";

const ProfilePage = () => {
  const {
    user,
    setUser,
    updateUser,
    isLoading: userLoading,
  } = useCustomerAuth();
  const [searchParams] = useSearchParams();
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [nileMilesData, setNileMilesData] = useState({
    currentMiles: 0,
    earnedHistory: [],
    redeemed: [],
    tier: "Bronze",
  });
  const [nileMilesLoading, setNileMilesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "overview"
  );
  const { favorites } = useFavorites();

  // Update active tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      [
        "overview",
        "orders",
        "miles",
        "premium",
        "settings",
        "wishlist",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Debug: Add this useEffect
  useEffect(() => {
    console.log("User from context:", user);
    console.log("User ID from context:", user?.userId);
    console.log("Is loading:", userLoading);
  }, [user, userLoading]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userLoading && user && user.id) {
        console.log("Fetching data for user ID:", user.id);
        setOrdersLoading(true);
        setNileMilesLoading(true);

        try {
          const fetchedOrders = await getCustomerOrders();
          setOrders(fetchedOrders);
        } catch (error) {
          console.error("Failed to fetch orders:", error);
          setOrders([]);
        } finally {
          setOrdersLoading(false);
        }

        try {
          const res = await axiosClient.get(
            `/api/nilemiles/nilemiles/status?userId=${user.id}`
          );
          setNileMilesData(res.data);
        } catch (error) {
          console.error("❌ Failed to load Nile Miles:", error);
        } finally {
          setNileMilesLoading(false);
        }
      } else if (!user) {
        setOrdersLoading(false);
        setNileMilesLoading(false);
      }
    };

    fetchUserData();
  }, [userLoading, user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!profileImage) {
      // Show toast instead of alert
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", profileImage);
      formData.append("userId", user.id);

      // Remove the localStorage token check - cookies are handled automatically
      const response = await axiosClient.post(
        "/api/customerprofile/updatedAvatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          // Ensure credentials (cookies) are sent with the request
          withCredentials: true,
        }
      );

      const { avatarUrl, avatarFileId } = response.data;
      // ✅ Use updateUser to update the global user state
      updateUser({
        avatarUrl,
        avatarFileId,
      });

      // ✅ Also update localStorage if you're storing user data there
      const updatedUser = { ...user, avatarUrl, avatarFileId };
      localStorage.setItem("userData", JSON.stringify(updatedUser));

      // ✅ Clear the preview and selected image after successful upload
      setProfileImage(null);
      setPreviewImage(null);

      toast.success("Profile image updated successfully!");

      // Show success toast
    } catch (error) {
      console.error("Failed to upload image:", error);
      // Handle 401 errors specifically
      if (error.response?.status === 401) {
        // Dispatch logout event
        window.dispatchEvent(new Event("auth:logout"));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "Gold":
        return "from-yellow-600 to-amber-700";
      case "Silver":
        return "from-gray-400 to-gray-600";
      case "Bronze":
        return "from-amber-800 to-yellow-800";
      default:
        return "from-amber-600 to-yellow-700";
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case "Gold":
        return <Award className="w-6 h-6 text-yellow-300" />;
      case "Silver":
        return <Award className="w-6 h-6 text-gray-300" />;
      case "Bronze":
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Award className="w-6 h-6 text-amber-400" />;
    }
  };

  if (userLoading || ordersLoading || nileMilesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-10 h-10 text-amber-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-gradient-to-br from-red-900/30 to-amber-900/30 backdrop-blur-sm border border-red-700/30 rounded-3xl p-8 max-w-md text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Access Required
            </h2>
            <p className="text-gray-300 mb-6">
              Please log in to access your premium profile dashboard
            </p>
            <Link
              to="/signin"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
            >
              <User className="w-5 h-5" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const demoUser = {
    name: user.username || "Premium Member",
    email: user.email || "premium@nileflow.com",
    profileImage:
      previewImage || user.avatarUrl || user.profileImage || "/images/logo.png",
    phone: user.phone || "+254 700 000 000",
    address: "Nile Flow Premium Hub, Nairobi, Kenya",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />
      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Profile Header */}
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative">
                  <img
                    className="h-32 w-32 rounded-full border-4 border-gray-900 object-cover"
                    src={demoUser.profileImage}
                    alt="Profile"
                  />
                  <label
                    htmlFor="profile-upload"
                    className="absolute bottom-2 right-2 w-10 h-10 bg-gradient-to-r from-amber-600 to-amber-700 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl md:text-5xl font-bold text-white">
                    {demoUser.name}
                  </h1>
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                    PREMIUM
                  </div>
                </div>
                <p className="text-gray-300 text-lg">{demoUser.email}</p>
                <p className="text-amber-100/70 text-sm mt-1">
                  Member since 2023
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-300">
                  {orders.length}
                </div>
                <div className="text-amber-100/80 text-sm">Orders</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-300">
                  {nileMilesLoading ? "..." : nileMilesData.currentMiles}
                </div>
                <div className="text-emerald-100/80 text-sm">Miles</div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-300">100%</div>
                <div className="text-blue-100/80 text-sm">Verified</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              "overview",
              "orders",
              "miles",
              "premium",
              "settings",
              "wishlist",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 capitalize flex items-center gap-2 ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 shadow-lg shadow-amber-900/30"
                    : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                }`}
              >
                {tab === "premium" && <Crown className="w-4 h-4" />}
                {tab}
              </button>
            ))}
          </div>

          {/* Premium Tab Content */}
          {activeTab === "premium" && (
            <div className="space-y-8">
              <SubscriptionSettings />
              <PremiumMonthlySummary />
            </div>
          )}

          {/* Wishlist Tab Content */}
          {activeTab === "wishlist" && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center shadow-xl">
                      <Heart className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">
                        My Wishlist
                      </h2>
                      <p className="text-gray-400">
                        {favorites.length}{" "}
                        {favorites.length === 1 ? "item" : "items"} saved
                      </p>
                    </div>
                  </div>
                </div>

                {favorites.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favorites.map((product) => (
                      <ProductCard
                        key={product.$id || product.id}
                        product={product}
                        id={product.$id || product.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-600/20 to-pink-600/20 backdrop-blur-sm border border-red-500/30 flex items-center justify-center mx-auto mb-6">
                      <Heart className="w-12 h-12 text-red-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Your Wishlist is Empty
                    </h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                      Save your favorite items by clicking the heart icon on any
                      product
                    </p>
                    <Link
                      to="/"
                      className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-xl"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>Start Shopping</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other Tabs Content - Show when not on Premium or Wishlist tab */}
          {activeTab !== "premium" && activeTab !== "wishlist" && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Nile Miles Card */}
                <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-amber-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-amber-200">
                            Nile Miles
                          </h2>
                          <p className="text-amber-100/70">
                            Premium Loyalty Program
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-flex items-center space-x-2 bg-gradient-to-r ${getTierColor(
                            nileMilesData.tier
                          )} px-4 py-2 rounded-full`}
                        >
                          {getTierIcon(nileMilesData.tier)}
                          <span className="text-white font-bold">
                            {nileMilesData.tier} Tier
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-amber-900/30 to-yellow-900/20 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-amber-300">
                          {nileMilesLoading
                            ? "..."
                            : nileMilesData.currentMiles}
                        </div>
                        <div className="text-amber-100/80 text-sm">
                          Current Miles
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-emerald-300">
                          {nileMilesLoading
                            ? "..."
                            : nileMilesData.earnedHistory?.length || 0}
                        </div>
                        <div className="text-emerald-100/80 text-sm">
                          Earned
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/20 backdrop-blur-sm border border-blue-800/30 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-blue-300">
                          {nileMilesLoading
                            ? "..."
                            : nileMilesData.redeemed?.length || 0}
                        </div>
                        <div className="text-blue-100/80 text-sm">Redeemed</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center justify-between text-amber-100 mb-2">
                        <span>Progress to Gold Tier</span>
                        <span>
                          {((nileMilesData.currentMiles / 1000) * 100).toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-800/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min(
                              (nileMilesData.currentMiles / 1000) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <Link
                      to="/redeem"
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
                    >
                      <Gift className="w-5 h-5" />
                      <span>Redeem Miles</span>
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>

                {/* Profile Image Update */}
                <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                      <Edit2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-amber-200">
                        Update Profile
                      </h2>
                      <p className="text-amber-100/70">
                        Upload new profile image
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="relative">
                        <img
                          src={previewImage || demoUser.profileImage}
                          alt="Preview"
                          className="w-24 h-24 rounded-2xl border-2 border-dashed border-amber-500/30 object-cover"
                        />
                        {previewImage && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <input
                          type="file"
                          id="file-input"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="block w-full text-sm text-gray-300
                        file:mr-4 file:py-3 file:px-6
                        file:rounded-xl file:border-0
                        file:text-sm file:font-bold
                        file:bg-gradient-to-r file:from-amber-600 file:to-amber-700
                        file:text-white hover:file:from-amber-700 hover:file:to-amber-800
                        hover:file:cursor-pointer"
                        />
                        <p className="text-amber-100/70 text-sm mt-2">
                          Upload a new profile picture (JPG, PNG, max 5MB)
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleImageUpload}
                      disabled={isUploading || !profileImage}
                      className={`w-full px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 ${
                        profileImage && !isUploading
                          ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 hover:scale-[1.02]"
                          : "bg-gradient-to-r from-gray-800/50 to-black/50 text-gray-400 border border-amber-800/30 cursor-not-allowed"
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5" />
                          <span>Update Profile Picture</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Order History */}
                <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-amber-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                          <History className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-amber-200">
                            Order History
                          </h2>
                          <p className="text-amber-100/70">
                            Recent premium orders
                          </p>
                        </div>
                      </div>
                      <div className="text-amber-100/70">
                        {orders.length} orders
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-amber-800/30">
                    {orders.length > 0 ? (
                      orders.slice(0, 5).map((order) => (
                        <div
                          key={order.$id}
                          className="p-6 hover:bg-amber-900/10 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="flex items-center space-x-2">
                                  <Package className="w-4 h-4 text-amber-400" />
                                  <span className="text-amber-100 font-mono text-sm">
                                    #{order.$id.slice(-8)}
                                  </span>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    order.status === "Delivered"
                                      ? "bg-emerald-900/30 text-emerald-300 border border-emerald-700/30"
                                      : order.status === "Shipped"
                                      ? "bg-blue-900/30 text-blue-300 border border-blue-700/30"
                                      : "bg-amber-900/30 text-amber-300 border border-amber-700/30"
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm">
                                {new Date(order.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </p>
                            </div>

                            <div className="text-right">
                              <div className="text-2xl font-bold text-amber-300 mb-1">
                                {order.amount?.toFixed(2)} {order.currency}
                              </div>
                              <div className="flex items-center justify-end space-x-2">
                                <Truck className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-100/70 text-sm">
                                  {order.orderStatus || "Processing"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center">
                        <ShoppingBag className="w-16 h-16 text-amber-400/30 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">
                          No Orders Yet
                        </h3>
                        <p className="text-gray-400 mb-6">
                          Start your premium African shopping journey
                        </p>
                        <Link
                          to="/shop"
                          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
                        >
                          <Sparkles className="w-5 h-5" />
                          <span>Start Shopping</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Profile Info Card */}
                <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6">
                  <h2 className="text-2xl font-bold text-amber-200 mb-6">
                    Profile Information
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-amber-100 font-bold mb-1">
                          Full Name
                        </h3>
                        <p className="text-amber-100/70">{demoUser.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-emerald-100 font-bold mb-1">
                          Email Address
                        </h3>
                        <p className="text-emerald-100/70">{demoUser.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-blue-100 font-bold mb-1">
                          Phone Number
                        </h3>
                        <p className="text-blue-100/70">{demoUser.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-red-100 font-bold mb-1">
                          Location
                        </h3>
                        <p className="text-red-100/70">{demoUser.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-amber-800/30">
                    <button className="w-full px-4 py-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl text-amber-300 hover:border-amber-500/50 hover:bg-amber-900/20 transition-all duration-300 flex items-center justify-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>Edit Profile Information</span>
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6">
                  <h2 className="text-2xl font-bold text-amber-200 mb-6">
                    Quick Actions
                  </h2>

                  <div className="space-y-4">
                    <Link
                      to="/profile?tab=wishlist"
                      className="w-full p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl hover:border-amber-500/50 hover:bg-amber-900/20 transition-all duration-300 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-amber-100 font-medium">
                          Wishlist
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-amber-400" />
                    </Link>

                    <Link
                      to="/addresses"
                      className="w-full p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl hover:border-amber-500/50 hover:bg-amber-900/20 transition-all duration-300 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-blue-100 font-medium">
                          Payment Methods
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-blue-400" />
                    </Link>

                    <Link
                      to="/help-center"
                      className="w-full p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl hover:border-amber-500/50 hover:bg-amber-900/20 transition-all duration-300 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-emerald-100 font-medium">
                          Security
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-emerald-400" />
                    </Link>

                    <Link
                      to="/profile?tab=settings"
                      className="w-full p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl hover:border-amber-500/50 hover:bg-amber-900/20 transition-all duration-300 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                          <Settings className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-purple-100 font-medium">
                          Account Settings
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-purple-400" />
                    </Link>
                  </div>
                </div>

                {/* Premium Banner */}
                <div className="col-span-full">
                  <PremiumBanner />
                </div>
              </div>
            </div>
          )}
          {/* End of conditional content */}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
