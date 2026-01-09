/* eslint-disable no-unused-vars */
import { Link } from "react-router-dom";
import AddToCartButton from "./AddToCartButton";
import { useCurrency } from "../Context/CurrencyProvider";

import {
  Clock,
  Flame,
  Zap,
  TrendingDown,
  Timer,
  Shield,
  Truck,
  Sparkles,
  ShoppingBag,
  Eye,
  Heart,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

const DealsProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { convertPrice } = useCurrency();

  // Calculate discount percentage
  const discount =
    product.discount ||
    (product.price && product.dealPrice
      ? Math.round(((product.price - product.dealPrice) / product.price) * 100)
      : 0);

  // Time left for deal (simulated)
  const timeLeft = {
    hours: Math.floor(Math.random() * 24),
    minutes: Math.floor(Math.random() * 60),
    seconds: Math.floor(Math.random() * 60),
  };

  const getDealIntensity = (discount) => {
    if (discount > 60) return "bg-gradient-to-r from-red-600 to-orange-600";
    if (discount > 40) return "bg-gradient-to-r from-orange-600 to-amber-600";
    return "bg-gradient-to-r from-amber-600 to-yellow-600";
  };

  const dealIntensityClass = getDealIntensity(discount);

  // Calculate stock percentage and color
  const stockQuantity = product.stock || product.stockQuantity || 0;
  const initialStock = product.initialStock || 100; // Fallback if not provided
  const stockPercentage = (stockQuantity / initialStock) * 100;

  const getStockColor = (percentage) => {
    if (percentage <= 20) return "from-red-500 to-orange-500";
    if (percentage <= 50) return "from-orange-500 to-amber-500";
    return "from-emerald-500 to-green-500";
  };

  const stockColorClass = getStockColor(stockPercentage);

  return (
    <div
      className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Glow Effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${dealIntensityClass.replace(
          "600",
          "500"
        )}/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      ></div>

      {/* Main Card */}
      <div className="relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden transition-all duration-500 group-hover:border-amber-500/50 group-hover:shadow-2xl group-hover:shadow-amber-900/30 h-full">
        {/* Discount Badge */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center space-x-1">
            <TrendingDown className="w-4 h-4" />
            <span>{discount}% OFF</span>
          </div>
        </div>

        {/* Image Container */}
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-900 to-black">
          <Link
            to={`/products/${product.productId || product.$id}`}
            className="block h-full"
          >
            <img
              src={product.image || "/placeholder.png"}
              alt={product.name || product.productName}
              className={`w-full h-full object-contain transform transition-transform duration-700 ${
                isHovered ? "scale-110" : "scale-100"
              }`}
              loading="lazy"
            />
          </Link>

          {/* Image Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          {/* Quick View */}
          <div
            className={`absolute bottom-4 right-4 transform transition-all duration-300 ${
              isHovered
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0"
            }`}
          >
            <Link
              to={`/products/${product.productId || product.$id}`}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-700/30 flex items-center justify-center text-amber-400 hover:text-amber-300 hover:scale-110 transition-all"
            >
              <Eye className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-6">
          <div className="mb-4">
            <Link to={`/products/${product.productId || product.$id}`}>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors duration-300 line-clamp-2 min-h-[3.5rem]">
                {product.productName || product.name}
              </h3>
            </Link>

            {/* Deal Features */}
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex items-center space-x-1">
                <Truck className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-100">Free Shipping</span>
              </div>
            </div>
          </div>

          {/* Price Section */}
          <div className="mb-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-bold text-amber-300">
                {convertPrice(
                  product.dealPrice?.toFixed(2) || product.price?.toFixed(2)
                )}
              </span>
              {product.price && product.dealPrice && (
                <span className="text-gray-500 line-through text-lg">
                  {convertPrice(product.price.toFixed(2))}
                </span>
              )}
            </div>

            {/* Savings Amount */}
            {product.price && product.dealPrice && (
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-900/30 to-green-900/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-emerald-700/30">
                <span className="text-xs text-emerald-100">You save</span>
                <span className="text-emerald-300 font-bold">
                  {convertPrice((product.price - product.dealPrice).toFixed(2))}
                </span>
              </div>
            )}

            {/* Progress Bar (Limited Stock Indicator) */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-amber-100/70 mb-1">
                <span>
                  {stockPercentage <= 20 ? "Almost gone!" : "Limited stock"}
                </span>
                <span className="font-bold text-amber-200">
                  {stockQuantity} left
                </span>
              </div>
              <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${stockColorClass} rounded-full transition-all duration-1000`}
                  style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <AddToCartButton
                product={product}
                className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Add to Cart</span>
              </AddToCartButton>
            </div>

            <Link
              to={`/products/${product.productId || product.$id}`}
              className="p-3 border-2 border-amber-500/50 text-amber-400 rounded-xl hover:bg-amber-500/10 transition-all duration-300"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Countdown Timer */}
          <div className="mt-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="text-xs text-amber-100">Deal ends in</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-center">
                  <div className="text-sm font-bold text-white">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-amber-100/70">HRS</div>
                </div>
                <div className="text-amber-400">:</div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-amber-100/70">MIN</div>
                </div>
                <div className="text-amber-400">:</div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-amber-100/70">SEC</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Effect Line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-emerald-500 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>
      </div>

      {/* Flash Icon for Hot Deals */}
      {discount > 50 && (
        <div
          className={`absolute -top-2 -right-2 transform transition-all duration-300 ${
            isHovered ? "scale-110 rotate-12" : "scale-100"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsProductCard;
