/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import axiosClient from "../../api";
import {
  Clock,
  Flame,
  Zap,
  Tag,
  AlertCircle,
  Sparkles,
  Crown,
  TrendingDown,
  Shield,
  Truck,
  Gem,
  Timer,
  ArrowRight,
  ShoppingBag,
  Star,
} from "lucide-react";
import DealsProductCard from "../../components/DealsProductCard";

const Deals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("All Deals");
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });
  const [analytics, setAnalytics] = useState({
    totalDeals: 0,
    maxDiscount: 70,
    endingSoon: 0,
    categories: {},
  });
  const [realTimeCountdown, setRealTimeCountdown] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch products and analytics in parallel
        const [productsResponse, analyticsResponse, countdownResponse] =
          await Promise.all([
            axiosClient("/api/customerprofile/deal-products"),
            axiosClient("/api/customerprofile/deal-analytics"),
            axiosClient("/api/customerprofile/deal-countdown"),
          ]);

        setProducts(productsResponse.data);
        setAnalytics(analyticsResponse.data);
        setRealTimeCountdown(countdownResponse.data);

        // Set initial countdown from backend
        if (countdownResponse.data && countdownResponse.data.hasActiveDeals) {
          setTimeLeft({
            hours: countdownResponse.data.hours || 0,
            minutes: countdownResponse.data.minutes || 0,
            seconds: countdownResponse.data.seconds || 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch deals data:", err);
        setError("Failed to load deals data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products based on selected category
  const getFilteredProducts = () => {
    if (selectedFilter === "All Deals") {
      return products;
    }

    switch (selectedFilter) {
      case "Most Popular":
        // Products with high view count or recent purchases
        return products.filter((p) => p.viewCount > 100 || p.salesCount > 10);

      case "Ending Soon":
        // Products ending within next 6 hours
        return products.filter(
          (p) => p.isExpiringSoon || (p.timeLeft && p.timeLeft.totalHours <= 6),
        );

      case "Best Value":
        // Products with highest discount (40% or more)
        return products.filter(
          (p) => p.isHighDiscount || (p.discount && p.discount >= 40),
        );

      case "Premium Offers":
        // Products marked as premium deals
        return products.filter((p) => p.isPremium || p.premiumDeal);

      case "New Arrivals":
        // Recently added products (created in last 7 days)
        return products.filter((p) => {
          const createdDate = new Date(p.$createdAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return createdDate >= weekAgo;
        });

      default:
        return products;
    }
  };

  const filteredProducts = getFilteredProducts();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Timer reached zero, refresh data
          window.location.reload();
          return { hours: 0, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <Header />
        <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-gray-900/20 to-amber-900/20"></div>
          <div className="relative max-w-8xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-red-900/30 to-amber-900/30 border border-red-700/30 mb-6">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">
              Unable to Load Deals
            </h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
            >
              <span>Try Again</span>
              <Zap className="w-5 h-5" />
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-amber-900/20 to-yellow-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-500/10 to-amber-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-yellow-500/10 to-orange-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          {/* Countdown Timer */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-900/30 to-amber-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-red-700/30 mb-6">
            <Timer className="w-5 h-5 text-red-400 animate-pulse" />
            <span className="text-red-200 font-medium tracking-wide">
              Limited Time Offer
            </span>
            <div className="flex items-center space-x-2 ml-4">
              <div className="bg-gradient-to-br from-gray-900 to-black border border-amber-800/30 rounded-xl px-3 py-1">
                <span className="text-white font-bold text-lg">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-amber-400 text-xs ml-1">H</span>
              </div>
              <span className="text-amber-400">:</span>
              <div className="bg-gradient-to-br from-gray-900 to-black border border-amber-800/30 rounded-xl px-3 py-1">
                <span className="text-white font-bold text-lg">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-amber-400 text-xs ml-1">M</span>
              </div>
              <span className="text-amber-400">:</span>
              <div className="bg-gradient-to-br from-gray-900 to-black border border-amber-800/30 rounded-xl px-3 py-1">
                <span className="text-white font-bold text-lg">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-amber-400 text-xs ml-1">S</span>
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Exclusive Deals
            </span>
            <br />
            <span className="text-white">Premium African Products</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Limited-time offers on authentic African treasures. Don't miss out
            on these exclusive savings!
          </p>

          {/* Stats */}
          <div className="max-w-3xl mx-auto">
            {/* Mobile: Horizontal Scroll, Desktop: Grid */}
            <div className="flex overflow-x-auto gap-4 pb-2 sm:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-red-900/20">
              <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4 flex-shrink-0 min-w-[200px] md:min-w-0">
                <div className="text-2xl font-bold text-red-300">
                  {analytics.totalDeals || products.length}
                </div>
                <div className="text-red-100/80 text-sm">Hot Deals</div>
              </div>
              <div className="bg-gradient-to-br from-orange-900/20 to-transparent backdrop-blur-sm border border-orange-800/30 rounded-2xl p-4 flex-shrink-0 min-w-[200px] md:min-w-0">
                <div className="text-2xl font-bold text-orange-300">
                  Up to {analytics.maxDiscount}%
                </div>
                <div className="text-orange-100/80 text-sm">Discount</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-900/20 to-transparent backdrop-blur-sm border border-yellow-800/30 rounded-2xl p-4 flex-shrink-0 min-w-[200px] md:min-w-0">
                <div className="text-2xl font-bold text-yellow-300">
                  {timeLeft.hours}H {timeLeft.minutes}M
                </div>
                <div className="text-yellow-100/80 text-sm">Time Left</div>
              </div>
              <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 flex-shrink-0 min-w-[200px] md:min-w-0">
                <div className="text-2xl font-bold text-amber-300">100%</div>
                <div className="text-amber-100/80 text-sm">Authentic</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Deals Banner */}
          <div className="mb-12">
            <div className="bg-gradient-to-r from-red-900/20 via-orange-900/20 to-yellow-900/20 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                    <Flame className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {analytics.isFlashSaleActive
                        ? "Flash Sale Active"
                        : "Deals Available"}
                    </h3>
                    <p className="text-gray-300">
                      {analytics.endingSoon > 0
                        ? `${analytics.endingSoon} deals ending soon!`
                        : "Limited stock available at discounted prices"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-300">
                      {analytics.maxDiscount}%
                    </div>
                    <div className="text-amber-100/80 text-sm">
                      Max Discount
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-300">
                      {timeLeft.hours}H {timeLeft.minutes}M
                    </div>
                    <div className="text-red-100/80 text-sm">Time Left</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-amber-900/30 border-t-red-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-red-500 animate-pulse" />
                </div>
              </div>
              <h3 className="mt-8 text-2xl font-bold text-amber-200">
                Loading Hot Deals
              </h3>
              <p className="text-gray-400 mt-2">
                Preparing exclusive African product discounts...
              </p>
            </div>
          )}

          {/* Products Grid */}
          {!loading && products.length > 0 && (
            <>
              {/* Category Filters */}
              <div className="mb-8">
                {/* Mobile: Horizontal Scroll, Desktop: Flex Wrap */}
                <div className="flex overflow-x-auto gap-3 pb-2 sm:pb-0 sm:flex-wrap sm:overflow-visible scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-red-900/20">
                  {[
                    "All Deals",
                    "Most Popular",
                    "Ending Soon",
                    "Best Value",
                    "Premium Offers",
                    "New Arrivals",
                  ].map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedFilter(category)}
                      className={`px-5 py-2.5 font-bold rounded-xl transition-all duration-300 flex-shrink-0 whitespace-nowrap ${
                        selectedFilter === category
                          ? "bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-500 shadow-lg shadow-red-900/30"
                          : "bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 text-gray-300 hover:border-amber-500/50 hover:text-white"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product, index) => {
                    // Use discount from backend or calculate if needed
                    const discount =
                      product.discount ||
                      (product.originalPrice && product.price
                        ? Math.round(
                            ((product.originalPrice - product.price) /
                              product.originalPrice) *
                              100,
                          )
                        : product.dealPrice && product.price
                          ? Math.round(
                              ((product.price - product.dealPrice) /
                                product.price) *
                                100,
                            )
                          : Math.floor(Math.random() * 30) + 10);

                    return (
                      <div key={product.$id} className="group relative">
                        {/* Discount Badge */}
                        <div className="absolute top-4 left-4 z-10">
                          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center space-x-1">
                            <TrendingDown className="w-4 h-4" />
                            <span>{discount}% OFF</span>
                          </div>
                        </div>

                        {/* Time Badge */}
                        <div className="absolute top-4 right-4 z-10">
                          <div className="bg-gradient-to-r from-amber-900/80 to-yellow-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-amber-700/30">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-amber-300" />
                              <span className="text-xs font-bold text-amber-200">
                                {product.timeLeft
                                  ? `${product.timeLeft.hours}H ${product.timeLeft.minutes}M`
                                  : `${timeLeft.hours}H ${timeLeft.minutes}M`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Product Card */}
                        <div className="transform transition-all duration-500 hover:-translate-y-2">
                          <DealsProductCard
                            product={product}
                            id={product.$id}
                            premium={true}
                          />
                        </div>

                        {/* Special Offer Tag */}
                        {index < 3 && (
                          <div className="absolute -top-2 -right-2 z-20">
                            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1">
                              <Crown className="w-3 h-3" />
                              <span>HOT DEAL</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-red-900/30 to-amber-900/30 border border-red-700/30 mb-6">
                    <Tag className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    No Products in {selectedFilter}
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-6">
                    There are currently no products available in this category.
                    Try selecting a different filter.
                  </p>
                  <button
                    onClick={() => setSelectedFilter("All Deals")}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
                  >
                    <span>View All Deals</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* No Products State */}
          {!loading && products.length === 0 && (
            <div className="text-center py-32">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-red-900/30 to-amber-900/30 border border-red-700/30 mb-6">
                <Tag className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                No Active Deals
              </h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                Our current deals have ended. Check back soon for new exclusive
                offers on premium African products.
              </p>
              <button className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300">
                <span>Browse All Products</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Trust Badges */}
          <div className="mt-16">
            {/* Mobile: Horizontal Scroll, Desktop: Grid */}
            <div className="flex overflow-x-auto gap-6 pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-red-900/20">
              <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-6 text-center flex-shrink-0 min-w-[280px] lg:min-w-0">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="text-xl font-bold text-red-300 mb-2">
                  Best Price
                </div>
                <div className="text-red-100/80 text-sm">
                  Guaranteed lowest price
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-900/20 to-transparent backdrop-blur-sm border border-orange-800/30 rounded-2xl p-6 text-center flex-shrink-0 min-w-[280px] lg:min-w-0">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 mb-4">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div className="text-xl font-bold text-orange-300 mb-2">
                  Fast Delivery
                </div>
                <div className="text-orange-100/80 text-sm">
                  Express shipping available
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-900/20 to-transparent backdrop-blur-sm border border-yellow-800/30 rounded-2xl p-6 text-center flex-shrink-0 min-w-[280px] lg:min-w-0">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 mb-4">
                  <Gem className="w-6 h-6 text-white" />
                </div>
                <div className="text-xl font-bold text-yellow-300 mb-2">
                  Premium Quality
                </div>
                <div className="text-yellow-100/80 text-sm">
                  Authentic African products
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center flex-shrink-0 min-w-[280px] lg:min-w-0">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 mb-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="text-xl font-bold text-amber-300 mb-2">
                  5-Star Support
                </div>
                <div className="text-amber-100/80 text-sm">
                  24/7 customer service
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

export default Deals;
