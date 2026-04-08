/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useCart } from "../../components/CartContext";
import { formatPrice } from "../../utils/priceFormatter";
import { usePremiumContext } from "../../Context/PremiumContext";
import premiumService from "../../utils/premiumService";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Shield,
  Truck,
  Award,
  Sparkles,
  ArrowRight,
  Package,
  CheckCircle,
  Heart,
  RefreshCw,
  Globe,
  Star,
  Crown,
  Zap,
} from "lucide-react";

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { isPremium } = usePremiumContext();
  const [isLoading, setIsLoading] = useState(false);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [milesInfo, setMilesInfo] = useState(null);

  const subtotal = cart.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0,
  );
  const shipping = isPremium ? 0 : 150;

  // Calculate premium discount if applicable
  useEffect(() => {
    const fetchPremiumBenefits = async () => {
      if (subtotal > 0) {
        try {
          // Only fetch discount for premium users
          if (isPremium) {
            const discount = await premiumService.calculateDiscount(subtotal);
            setDiscountInfo(discount);

            // Calculate miles on subtotal - only for premium users
            const miles = await premiumService.calculateMiles(subtotal);
            setMilesInfo(miles);
          } else {
            setDiscountInfo(null);
            setMilesInfo(null);
          }
        } catch (error) {
          console.error("Error fetching premium benefits:", error);
        }
      } else {
        setDiscountInfo(null);
        setMilesInfo(null);
      }
    };

    fetchPremiumBenefits();
  }, [isPremium, subtotal, shipping]);

  // Apply discount to subtotal, then add shipping (no tax)
  const discountedSubtotal =
    isPremium && discountInfo?.newTotal ? discountInfo.newTotal : subtotal;
  const total = discountedSubtotal + shipping;

  const formattedSubtotal = formatPrice(subtotal);
  const formattedShipping = formatPrice(shipping);
  const formattedTotal = formatPrice(total);

  const handleCheckout = () => {
    setIsLoading(true);
    // Simulate processing
    setTimeout(() => {
      window.location.href = "/checkout";
    }, 1000);
  };

  const handleSaveForLater = (item) => {
    // Implement save for later logic
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-10 md:pb-12 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-2xl sm:blur-3xl -translate-y-24 sm:-translate-y-36 md:-translate-y-48 translate-x-24 sm:translate-x-36 md:translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-2xl sm:blur-3xl translate-y-24 sm:translate-y-36 md:translate-y-48 -translate-x-24 sm:-translate-x-36 md:-translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl border border-amber-700/30 mb-4 sm:mb-5 md:mb-6">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide text-xs sm:text-sm">
              Premium Cart
            </span>
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-5 md:mb-6 leading-tight">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent block">
              Shopping Cart
            </span>
            <span className="text-white block mt-1 sm:mt-2">
              African Treasures
            </span>
          </h1>

          <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-xl md:max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10 px-2 sm:px-0">
            Review your premium African products before checkout
          </p>

          {/* Cart Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-sm sm:max-w-2xl md:max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-amber-300">
                {cart.length}
              </div>
              <div className="text-amber-100/80 text-xs sm:text-sm">
                Premium Items
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-300">
                {isPremium ? "FREE" : formatPrice(150)}
              </div>
              <div className="text-emerald-100/80 text-xs sm:text-sm">
                Shipping
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-300">
                100%
              </div>
              <div className="text-blue-100/80 text-xs sm:text-sm">
                Authentic
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-300">
                30D
              </div>
              <div className="text-red-100/80 text-xs sm:text-sm">Returns</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-16 sm:pb-20 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {cart.length === 0 ? (
            <div className="text-center py-16 sm:py-24 md:py-32">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-4 sm:mb-6">
                <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-amber-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                Your Cart is Empty
              </h3>
              <p className="text-gray-400 max-w-sm sm:max-w-md mx-auto mb-6 sm:mb-8 text-sm sm:text-base px-4 sm:px-0">
                Discover premium African products waiting to be added to your
                cart. Start exploring our curated collection.
              </p>
              <Link
                to="/shop"
                className="group inline-flex items-center space-x-2 sm:space-x-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 text-sm sm:text-base"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
                <span>Start Shopping</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Popular Categories */}
              <div className="mt-8 sm:mt-12">
                <h4 className="text-lg sm:text-xl font-bold text-amber-200 mb-4 sm:mb-6">
                  Popular Categories
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
                  {["Fashion", "Art", "Home", "Jewelry"].map((category) => (
                    <Link
                      key={category}
                      to={`/categories/${category.toLowerCase()}`}
                      className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-3 sm:p-4 text-center hover:border-amber-500/50 transition-all duration-300"
                    >
                      <div className="text-amber-300 font-bold text-sm sm:text-base">
                        {category}
                      </div>
                      <div className="text-amber-100/70 text-xs sm:text-sm mt-1">
                        Premium {category}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-amber-200">
                    Your Premium Items
                  </h2>
                  <div className="text-amber-100/70 text-sm sm:text-base">
                    {cart.length} {cart.length === 1 ? "item" : "items"}
                  </div>
                </div>

                {cart.map((item) => (
                  <div
                    key={
                      item.$id ||
                      `${item.productId}-${item.createdAt || Date.now()}`
                    }
                    className="group relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-900/30"
                  >
                    {/* Product Card */}
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:gap-6">
                        {/* Product Image */}
                        <Link
                          to={`/products/${item.id || item.productId}`}
                          className="relative w-full sm:w-40 md:w-48 h-40 sm:h-32 md:h-48 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0"
                        >
                          <img
                            src={
                              item.productImage ||
                              item.image ||
                              "/placeholder.png"
                            }
                            alt={item.productName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                          {/* Premium Badge */}
                          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg">
                            <div className="flex items-center space-x-1">
                              <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span className="hidden sm:inline">PREMIUM</span>
                              <span className="sm:hidden">PREM</span>
                            </div>
                          </div>
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col h-full">
                            <div className="mb-3 sm:mb-4">
                              <Link
                                to={`/products/${item.id || item.productId}`}
                              >
                                <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-300 transition-colors duration-300 line-clamp-2">
                                  {item.productName}
                                </h3>
                              </Link>

                              <div className="flex items-center space-x-2 mt-2">
                                <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-amber-700/30">
                                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                                  <span className="text-xs font-bold text-amber-200">
                                    4.8
                                  </span>
                                </div>
                                <div className="text-amber-100/70 text-xs sm:text-sm truncate">
                                  Authentic African Product
                                </div>
                              </div>
                            </div>

                            {/* Price & Quantity */}
                            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-end sm:justify-between mt-auto gap-2 sm:gap-4">
                              <div className="flex-shrink-0">
                                <div className="text-xl sm:text-2xl font-bold text-amber-300 mb-1 sm:mb-2">
                                  {formatPrice(item.price || 0)}
                                </div>
                                <div className="text-amber-100/70 text-xs sm:text-sm">
                                  {item.quantity} ×{" "}
                                  {formatPrice(item.price || 0)}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                                {/* Quantity Controls */}
                                <div className="flex items-center bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-lg sm:rounded-xl overflow-hidden">
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.id || item.productId,
                                        (item.quantity || 1) - 1,
                                      )
                                    }
                                    className="p-2 sm:p-3 text-amber-400 hover:text-amber-300 hover:bg-amber-900/30 transition-all duration-300 touch-manipulation"
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                  <span className="px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg font-bold text-amber-300 min-w-[2.5rem] sm:min-w-[3rem] text-center">
                                    {item.quantity || 1}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.id || item.productId,
                                        (item.quantity || 1) + 1,
                                      )
                                    }
                                    className="p-2 sm:p-3 text-amber-400 hover:text-amber-300 hover:bg-amber-900/30 transition-all duration-300 touch-manipulation"
                                  >
                                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleSaveForLater(item)}
                                    className="p-2 sm:p-3 border border-amber-800/30 text-amber-400 rounded-lg sm:rounded-xl hover:border-amber-500/50 hover:bg-amber-900/20 transition-all duration-300 touch-manipulation"
                                    title="Save for later"
                                  >
                                    <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      removeFromCart(item.id || item.productId)
                                    }
                                    className="p-2 sm:p-3 border border-red-800/30 text-red-400 rounded-lg sm:rounded-xl hover:border-red-500/50 hover:bg-red-900/20 transition-all duration-300 touch-manipulation"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-amber-800/30">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-emerald-100">
                            Authentic Origin
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-blue-100">
                            Free Shipping
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-amber-100">
                            30-Day Returns
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Total for Item */}
                    <div className="absolute top-3 sm:top-6 right-3 sm:right-6 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-amber-700/30">
                      <div className="text-sm sm:text-lg font-bold text-amber-300">
                        {formatPrice((item.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Continue Shopping */}
                <div className="mt-6 sm:mt-8">
                  <Link
                    to="/shop"
                    className="group inline-flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl hover:border-amber-500/50 transition-all duration-300 text-sm sm:text-base"
                  >
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:-translate-x-1 transition-transform rotate-180" />
                    <span className="text-amber-200 font-medium">
                      Continue Shopping
                    </span>
                  </Link>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-20 sm:top-24">
                  <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-2xl sm:rounded-3xl overflow-hidden">
                    <div className="p-4 sm:p-6 md:p-8 border-b border-amber-800/30">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-amber-200">
                              Order Summary
                            </h2>
                            <p className="text-amber-100/70 text-sm sm:text-base">
                              {cart.length} premium items
                            </p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-amber-700/30">
                          <span className="text-amber-200 font-bold text-sm sm:text-base">
                            Secure
                          </span>
                        </div>
                      </div>

                      {/* Cart Items */}
                      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 max-h-60 sm:max-h-96 overflow-y-auto pr-2 sm:pr-4">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl sm:rounded-2xl"
                          >
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                              <img
                                src={item.productImage || item.image}
                                alt={item.productName || item.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-amber-100 truncate text-sm sm:text-base">
                                {item.productName || item.name}
                              </h3>
                              <p className="text-amber-100/70 text-xs sm:text-sm">
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg sm:text-xl font-bold text-amber-300">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                              <p className="text-amber-100/50 text-xs sm:text-sm">
                                {formatPrice(item.price)} each
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Price Breakdown */}
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between py-2 sm:py-3 border-b border-amber-800/30">
                          <span className="text-amber-100 text-sm sm:text-base">
                            Subtotal
                          </span>
                          <span className="text-amber-300 font-bold text-base sm:text-lg">
                            {formattedSubtotal}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2 sm:py-3 border-b border-amber-800/30">
                          <div className="flex items-center space-x-2">
                            <span className="text-amber-100 text-sm sm:text-base">
                              Shipping
                            </span>
                            {isPremium && (
                              <div className="flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-md sm:rounded-lg border border-purple-500/30">
                                <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-300" />
                                <span className="text-xs text-purple-200">
                                  Premium
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-amber-300 font-bold text-base sm:text-lg">
                            {shipping === 0 ? "FREE" : formattedShipping}
                          </span>
                        </div>

                        {/* Premium Discount */}
                        {isPremium &&
                          discountInfo &&
                          discountInfo.discountAmount > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3 border-b border-amber-800/30 bg-gradient-to-r from-purple-900/10 to-blue-900/10 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 rounded-lg gap-2 sm:gap-0">
                              <div className="flex items-center space-x-2">
                                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                                <span className="text-purple-200 font-medium text-sm sm:text-base">
                                  Premium Discount (
                                  {discountInfo.discountPercentage}%)
                                </span>
                              </div>
                              <span className="text-emerald-400 font-bold text-base sm:text-lg">
                                -{formatPrice(discountInfo.discountAmount)}
                              </span>
                            </div>
                          )}

                        {/* Premium Discount Threshold Message */}
                        {isPremium && subtotal < 500 && (
                          <div className="py-2 sm:py-3 border-b border-amber-800/30">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-purple-200/70 text-xs sm:text-sm">
                              <Crown className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              <span>
                                Add {formatPrice(500 - subtotal)} more for 5%
                                premium discount
                              </span>
                            </div>
                          </div>
                        )}
                        {isPremium && subtotal >= 500 && subtotal < 1000 && (
                          <div className="py-2 sm:py-3 border-b border-amber-800/30">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-purple-200/70 text-xs sm:text-sm">
                              <Crown className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              <span>
                                Add {formatPrice(1000 - subtotal)} more for 10%
                                premium discount
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between py-3 sm:py-4 border-t border-amber-500/30">
                          <span className="text-amber-100 text-lg sm:text-xl">
                            Total
                          </span>
                          <span className="text-amber-300 font-bold text-2xl sm:text-3xl">
                            {formattedTotal}
                          </span>
                        </div>

                        {/* Nile Miles Preview */}
                        {isPremium &&
                          milesInfo &&
                          milesInfo.actualMiles > 0 && (
                            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-amber-900/20 to-orange-900/20 backdrop-blur-sm border border-amber-700/30 rounded-xl">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                                <div className="flex items-center space-x-2">
                                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                                  <span className="text-amber-200 font-medium text-sm sm:text-base">
                                    You'll earn
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xl sm:text-2xl font-bold text-amber-300">
                                    {Math.round(milesInfo.actualMiles)}
                                  </span>
                                  <span className="text-amber-200 text-sm sm:text-base">
                                    Nile Miles
                                  </span>
                                  {isPremium && milesInfo.multiplier > 1 && (
                                    <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                                      <Zap className="w-3 h-3 text-white" />
                                      <span className="text-xs text-white font-bold">
                                        2x
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isPremium && milesInfo.multiplier > 1 && (
                                <p className="text-amber-100/70 text-xs sm:text-sm mt-2">
                                  Base: {Math.round(milesInfo.baseMiles)} miles
                                  • Bonus: {Math.round(milesInfo.bonus)} miles
                                </p>
                              )}
                            </div>
                          )}
                      </div>

                      {/* Shipping Info - Only show free shipping progress for premium users */}
                      {!isPremium && (
                        <div className="mt-4 sm:mt-6 bg-gradient-to-r from-red-900/20 to-orange-900/20 backdrop-blur-sm border border-red-700/30 rounded-xl p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                            <Truck className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span className="text-red-200 font-medium text-sm sm:text-base">
                              Standard Shipping: {formatPrice(150)}
                            </span>
                          </div>
                          <p className="text-red-100/70 text-xs sm:text-sm">
                            Upgrade to Premium for free shipping on all orders
                          </p>
                        </div>
                      )}

                      {/* Premium Free Shipping Badge */}
                      {isPremium && (
                        <div className="mt-4 sm:mt-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-3 sm:p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-purple-200 font-bold text-base sm:text-lg">
                                Free Premium Delivery
                              </div>
                              <p className="text-purple-300/70 text-xs sm:text-sm">
                                All orders ship free with your Premium
                                membership
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Checkout Button */}
                      <button
                        onClick={handleCheckout}
                        disabled={isLoading}
                        className="group w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2 mt-4 sm:mt-6 text-sm sm:text-base touch-manipulation"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                            <span>Proceed to Checkout</span>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>

                      {/* Security Badge */}
                      <div className="text-center pt-3 sm:pt-4">
                        <div className="inline-flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 text-amber-100/70 text-xs sm:text-sm">
                          <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-center">
                            Secure checkout • 256-bit SSL encryption
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="p-4 sm:p-6 border-t border-amber-800/30">
                      <h3 className="text-base sm:text-lg font-bold text-amber-200 mb-3 sm:mb-4">
                        Order Benefits
                      </h3>
                      <div className="space-y-2.5 sm:space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-emerald-100 font-medium text-sm sm:text-base">
                              African Origin
                            </div>
                            <div className="text-emerald-100/70 text-xs sm:text-sm">
                              Authentic products from 54 nations
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                            <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-blue-100 font-medium text-sm sm:text-base">
                              Express Delivery
                            </div>
                            <div className="text-blue-100/70 text-xs sm:text-sm">
                              2-5 business days across Africa
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0">
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-red-100 font-medium text-sm sm:text-base">
                              Easy Returns
                            </div>
                            <div className="text-red-100/70 text-xs sm:text-sm">
                              30-day hassle-free returns
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
