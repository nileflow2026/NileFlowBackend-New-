/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useCart } from "../../components/CartContext";
import { useCurrency } from "../../Context/CurrencyProvider";
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
  const { convertPrice } = useCurrency();
  const { isPremium } = usePremiumContext();
  const [isLoading, setIsLoading] = useState(false);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [milesInfo, setMilesInfo] = useState(null);

  const subtotal = cart.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );
  const shipping = isPremium ? 0 : subtotal > 100 ? 0 : 15;

  // Calculate premium discount if applicable
  useEffect(() => {
    const fetchPremiumBenefits = async () => {
      if (subtotal > 0) {
        try {
          // Only fetch discount for premium users
          if (isPremium) {
            const discount = await premiumService.calculateDiscount(subtotal);
            setDiscountInfo(discount);
          } else {
            setDiscountInfo(null);
          }

          // Calculate miles on subtotal
          const miles = await premiumService.calculateMiles(subtotal);
          setMilesInfo(miles);
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

  const formattedSubtotal = convertPrice(subtotal);
  const formattedShipping = convertPrice(shipping);
  const formattedTotal = convertPrice(total);

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
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium Cart
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Shopping Cart
            </span>
            <br />
            <span className="text-white">African Treasures</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Review your premium African products before checkout
          </p>

          {/* Cart Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-300">
                {cart.length}
              </div>
              <div className="text-amber-100/80 text-sm">Premium Items</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-300">
                {subtotal > 100 ? "FREE" : convertPrice(shipping)}
              </div>
              <div className="text-emerald-100/80 text-sm">Shipping</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-300">100%</div>
              <div className="text-blue-100/80 text-sm">Authentic</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-300">30D</div>
              <div className="text-red-100/80 text-sm">Returns</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {cart.length === 0 ? (
            <div className="text-center py-32">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-6">
                <ShoppingCart className="w-12 h-12 text-amber-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Your Cart is Empty
              </h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                Discover premium African products waiting to be added to your
                cart. Start exploring our curated collection.
              </p>
              <Link
                to="/shop"
                className="group inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
              >
                <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span>Start Shopping</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Popular Categories */}
              <div className="mt-12">
                <h4 className="text-xl font-bold text-amber-200 mb-6">
                  Popular Categories
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["Fashion", "Art", "Home", "Jewelry"].map((category) => (
                    <Link
                      key={category}
                      to={`/categories/${category.toLowerCase()}`}
                      className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4 text-center hover:border-amber-500/50 transition-all duration-300"
                    >
                      <div className="text-amber-300 font-bold">{category}</div>
                      <div className="text-amber-100/70 text-sm mt-1">
                        Premium {category}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-amber-200">
                    Your Premium Items
                  </h2>
                  <div className="text-amber-100/70">
                    {cart.length} {cart.length === 1 ? "item" : "items"}
                  </div>
                </div>

                {cart.map((item) => (
                  <div
                    key={
                      item.$id ||
                      `${item.productId}-${item.createdAt || Date.now()}`
                    }
                    className="group relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden transition-all duration-500 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-900/30"
                  >
                    {/* Product Card */}
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Product Image */}
                        <Link
                          to={`/products/${item.id || item.productId}`}
                          className="relative w-full sm:w-48 h-48 rounded-2xl overflow-hidden flex-shrink-0"
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
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                            <div className="flex items-center space-x-1">
                              <Award className="w-3 h-3" />
                              <span>PREMIUM</span>
                            </div>
                          </div>
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex flex-col h-full">
                            <div className="mb-4">
                              <Link
                                to={`/products/${item.id || item.productId}`}
                              >
                                <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors duration-300">
                                  {item.productName}
                                </h3>
                              </Link>

                              <div className="flex items-center space-x-2 mt-2">
                                <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-amber-700/30">
                                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                                  <span className="text-xs font-bold text-amber-200">
                                    4.8
                                  </span>
                                </div>
                                <div className="text-amber-100/70 text-sm">
                                  Authentic African Product
                                </div>
                              </div>
                            </div>

                            {/* Price & Quantity */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-auto gap-4">
                              <div>
                                <div className="text-2xl font-bold text-amber-300 mb-2">
                                  {convertPrice(item.price || 0)}
                                </div>
                                <div className="text-amber-100/70 text-sm">
                                  {item.quantity} ×{" "}
                                  {convertPrice(item.price || 0)}
                                </div>
                              </div>

                              <div className="flex items-center space-x-4">
                                {/* Quantity Controls */}
                                <div className="flex items-center bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden">
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.id || item.productId,
                                        (item.quantity || 1) - 1
                                      )
                                    }
                                    className="p-3 text-amber-400 hover:text-amber-300 hover:bg-amber-900/30 transition-all duration-300"
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="px-4 py-3 text-lg font-bold text-amber-300 min-w-[3rem] text-center">
                                    {item.quantity || 1}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.id || item.productId,
                                        (item.quantity || 1) + 1
                                      )
                                    }
                                    className="p-3 text-amber-400 hover:text-amber-300 hover:bg-amber-900/30 transition-all duration-300"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleSaveForLater(item)}
                                    className="p-3 border border-amber-800/30 text-amber-400 rounded-xl hover:border-amber-500/50 hover:bg-amber-900/20 transition-all duration-300"
                                    title="Save for later"
                                  >
                                    <Heart className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      removeFromCart(item.id || item.productId)
                                    }
                                    className="p-3 border border-red-800/30 text-red-400 rounded-xl hover:border-red-500/50 hover:bg-red-900/20 transition-all duration-300"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-amber-800/30">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-emerald-100">
                            Authentic Origin
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-blue-100">
                            Free Shipping
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-amber-100">
                            30-Day Returns
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Total for Item */}
                    <div className="absolute top-6 right-6 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-amber-700/30">
                      <div className="text-lg font-bold text-amber-300">
                        {convertPrice((item.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Continue Shopping */}
                <div className="mt-8">
                  <Link
                    to="/shop"
                    className="group inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl hover:border-amber-500/50 transition-all duration-300"
                  >
                    <ArrowRight className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform rotate-180" />
                    <span className="text-amber-200 font-medium">
                      Continue Shopping
                    </span>
                  </Link>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden">
                    <div className="p-8 border-b border-amber-800/30">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-amber-200">
                              Order Summary
                            </h2>
                            <p className="text-amber-100/70">
                              {cart.length} premium items
                            </p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-amber-700/30">
                          <span className="text-amber-200 font-bold">
                            Secure
                          </span>
                        </div>
                      </div>

                      {/* Cart Items */}
                      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-4">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl"
                          >
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                              <img
                                src={item.productImage || item.image}
                                alt={item.productName || item.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-amber-100 truncate">
                                {item.productName || item.name}
                              </h3>
                              <p className="text-amber-100/70 text-sm">
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-amber-300">
                                {convertPrice(item.price * item.quantity)}
                              </p>
                              <p className="text-amber-100/50 text-sm">
                                {convertPrice(item.price)} each
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Price Breakdown */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-amber-800/30">
                          <span className="text-amber-100">Subtotal</span>
                          <span className="text-amber-300 font-bold text-lg">
                            {formattedSubtotal}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-amber-800/30">
                          <div className="flex items-center space-x-2">
                            <span className="text-amber-100">Shipping</span>
                            {isPremium && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-lg border border-purple-500/30">
                                <Crown className="w-3 h-3 text-purple-300" />
                                <span className="text-xs text-purple-200">
                                  Premium
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-amber-300 font-bold text-lg">
                            {shipping === 0 ? "FREE" : formattedShipping}
                          </span>
                        </div>

                        {/* Premium Discount */}
                        {isPremium &&
                          discountInfo &&
                          discountInfo.discountAmount > 0 && (
                            <div className="flex items-center justify-between py-3 border-b border-amber-800/30 bg-gradient-to-r from-purple-900/10 to-blue-900/10 -mx-4 px-4 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                                <span className="text-purple-200 font-medium">
                                  Premium Discount (
                                  {discountInfo.discountPercentage}%)
                                </span>
                              </div>
                              <span className="text-emerald-400 font-bold text-lg">
                                -{convertPrice(discountInfo.discountAmount)}
                              </span>
                            </div>
                          )}

                        {/* Premium Discount Threshold Message */}
                        {isPremium && subtotal < 500 && (
                          <div className="py-3 border-b border-amber-800/30">
                            <div className="flex items-center space-x-2 text-purple-200/70 text-sm">
                              <Crown className="w-4 h-4 text-purple-400" />
                              <span>
                                Add {convertPrice(500 - subtotal)} more for 5%
                                premium discount
                              </span>
                            </div>
                          </div>
                        )}
                        {isPremium && subtotal >= 500 && subtotal < 1000 && (
                          <div className="py-3 border-b border-amber-800/30">
                            <div className="flex items-center space-x-2 text-purple-200/70 text-sm">
                              <Crown className="w-4 h-4 text-purple-400" />
                              <span>
                                Add {convertPrice(1000 - subtotal)} more for 10%
                                premium discount
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between py-4 border-t border-amber-500/30">
                          <span className="text-amber-100 text-xl">Total</span>
                          <span className="text-amber-300 font-bold text-3xl">
                            {formattedTotal}
                          </span>
                        </div>

                        {/* Nile Miles Preview */}
                        {isPremium &&
                          milesInfo &&
                          milesInfo.actualMiles > 0 && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-amber-900/20 to-orange-900/20 backdrop-blur-sm border border-amber-700/30 rounded-xl">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Award className="w-5 h-5 text-amber-400" />
                                  <span className="text-amber-200 font-medium">
                                    You'll earn
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl font-bold text-amber-300">
                                    {Math.round(milesInfo.actualMiles)}
                                  </span>
                                  <span className="text-amber-200">
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
                                <p className="text-amber-100/70 text-sm mt-2">
                                  Base: {Math.round(milesInfo.baseMiles)} miles
                                  • Bonus: {Math.round(milesInfo.bonus)} miles
                                </p>
                              )}
                            </div>
                          )}
                      </div>

                      {/* Shipping Info */}
                      {!isPremium && subtotal < 100 && (
                        <div className="mt-6 bg-gradient-to-r from-emerald-900/20 to-green-900/20 backdrop-blur-sm border border-emerald-700/30 rounded-xl p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Truck className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-200 font-medium">
                              Add {convertPrice(100 - subtotal)} more for free
                              shipping!
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-1000"
                              style={{
                                width: `${Math.min(
                                  (subtotal / 100) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Premium Free Shipping Badge */}
                      {isPremium && (
                        <div className="mt-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                              <Crown className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-purple-200 font-bold text-lg">
                                Free Premium Delivery
                              </div>
                              <p className="text-purple-300/70 text-sm">
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
                        className="group w-full px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2 mt-6"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Proceed to Checkout</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>

                      {/* Security Badge */}
                      <div className="text-center pt-4">
                        <div className="inline-flex items-center space-x-2 text-amber-100/70 text-sm">
                          <Shield className="w-4 h-4" />
                          <span>Secure checkout • 256-bit SSL encryption</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="p-6 border-t border-amber-800/30">
                      <h3 className="text-lg font-bold text-amber-200 mb-4">
                        Order Benefits
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                            <Globe className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-emerald-100 font-medium">
                              African Origin
                            </div>
                            <div className="text-emerald-100/70 text-sm">
                              Authentic products from 54 nations
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                            <Truck className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-blue-100 font-medium">
                              Express Delivery
                            </div>
                            <div className="text-blue-100/70 text-sm">
                              2-5 business days across Africa
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-red-100 font-medium">
                              Easy Returns
                            </div>
                            <div className="text-red-100/70 text-sm">
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
