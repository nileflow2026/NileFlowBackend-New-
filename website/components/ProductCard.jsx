/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AddToCartButton from "./AddToCartButton";
import { fetchReviews } from "../CustomerServices";
import {
  faStar,
  faStarHalfStroke,
  faStar as faStarRegular,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCurrency } from "../Context/CurrencyProvider";
import { useFavorites } from "../Context/FavoritesContext.jsx";
import {
  Star,
  Heart,
  Eye,
  Zap,
  Shield,
  Truck,
  Award,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

const ProductCard = ({
  product,
  id,
  totalRatings = 0,
  averageRating = 0,
  premium = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [stockStatus, setStockStatus] = useState("");
  const { convertPrice } = useCurrency();
  const { toggleFavorite, isFavorite } = useFavorites();

  const productId = id || product.$id || product.id;
  const isWishlisted = isFavorite(productId);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ ...product, $id: productId, id: productId });
  };

  useEffect(() => {
    if (product.stock <= 0) {
      setStockStatus("Out of Stock");
    } else if (product.stock <= 5) {
      setStockStatus(`Only ${product.stock} left`);
    } else {
      setStockStatus("In Stock");
    }
  }, [product.stock]);

  const StarRating = ({ rating }) => {
    const stars = [];
    const roundedRating = Math.round(rating * 2) / 2;

    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(
          <FontAwesomeIcon
            key={i}
            icon={faStar}
            className="text-yellow-400 fill-current"
          />
        );
      } else if (i - 0.5 === roundedRating) {
        stars.push(
          <FontAwesomeIcon
            key={i}
            icon={faStarHalfStroke}
            className="text-yellow-400"
          />
        );
      } else {
        stars.push(
          <FontAwesomeIcon
            key={i}
            icon={faStarRegular}
            className="text-gray-600"
          />
        );
      }
    }

    return <div className="flex gap-0.5">{stars}</div>;
  };

  const getProductGradient = (productId) => {
    const gradients = [
      "from-amber-500/20 via-orange-500/20 to-yellow-500/20",
      "from-emerald-500/20 via-green-500/20 to-teal-500/20",
      "from-red-500/20 via-rose-500/20 to-pink-500/20",
      "from-blue-500/20 via-indigo-500/20 to-purple-500/20",
      "from-violet-500/20 via-purple-500/20 to-fuchsia-500/20",
      "from-cyan-500/20 via-blue-500/20 to-sky-500/20",
    ];
    // Create a simple hash from product ID for consistent gradient
    const hash = productId
      ? productId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      : 0;
    return gradients[hash % gradients.length];
  };

  const gradientClass = getProductGradient(id);

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2 ${
        premium ? "w-full" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Glow Effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      ></div>

      {/* Main Card */}
      <div className="relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden transition-all duration-500 group-hover:border-amber-500/50 group-hover:shadow-2xl group-hover:shadow-amber-900/30 h-full">
        {/* Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {product.isOnSale && (
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>SALE</span>
            </div>
          )}

          {(product.premiumDeal || product.isPremiumDeal) && (
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1">
              <Award className="w-3 h-3" />
              <span>PREMIUM</span>
            </div>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all duration-300 ${
            isWishlisted
              ? "bg-gradient-to-r from-red-600 to-pink-600 border-red-500/50 text-white"
              : "bg-gradient-to-r from-gray-900/80 to-black/80 border-amber-700/30 text-amber-400 hover:text-amber-300 hover:border-amber-500/50"
          } hover:scale-110`}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Image Container */}
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-900 to-black">
          <Link to={`/products/${id}`} className="block h-full">
            <img
              src={product.image || "/placeholder.png"}
              alt={product.productName}
              className={`w-full h-full object-cover transition-transform duration-700 ${
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
              to={`/products/${id}`}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-700/30 flex items-center justify-center text-amber-400 hover:text-amber-300 hover:scale-110 transition-all"
            >
              <Eye className="w-5 h-5" />
            </Link>
          </div>

          {/* Stock Status Badge */}
          <div
            className={`absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-full text-xs font-bold ${
              product.stock <= 0
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                : product.stock <= 5
                ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white"
                : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
            }`}
          >
            {stockStatus}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-6">
          <div className="mb-4">
            <Link to={`/products/${id}`}>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors duration-300 line-clamp-2 min-h-[3.5rem]">
                {product.productName}
              </h3>
            </Link>

            {(product.premiumDeal || product.isPremiumDeal) && (
              <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                {product.description ||
                  "Premium quality African product with authentic craftsmanship."}
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <StarRating rating={averageRating} />
              <span className="text-gray-400 text-sm">({totalRatings})</span>
            </div>

            <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-amber-700/30">
              <Star className="w-3 h-3 text-amber-400 fill-current" />
              <span className="text-xs font-bold text-amber-200">
                {averageRating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-300">
                {convertPrice(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-gray-500 line-through text-sm">
                    {convertPrice(product.originalPrice)}
                  </span>
                  <span className="text-red-400 text-sm font-bold">
                    {Math.round(
                      (1 - product.price / product.originalPrice) * 100
                    )}
                    % OFF
                  </span>
                </>
              )}
            </div>
            {product.shipping && (
              <p className="text-emerald-400 text-sm mt-1 flex items-center gap-1">
                <Truck className="w-3 h-3" />
                Free shipping
              </p>
            )}
          </div>

          {/* Features */}
          {(product.premiumDeal || product.isPremiumDeal) && (
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="flex items-center space-x-1 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-amber-800/30">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-100">Authentic</span>
              </div>
              <div className="flex items-center space-x-1 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-amber-800/30">
                <Truck className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-blue-100">Fast Ship</span>
              </div>
              <div className="flex items-center space-x-1 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-amber-800/30">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-100">Premium</span>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <div className="mt-auto">
            <AddToCartButton
              product={product}
              className={`w-full px-4 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 group/cart ${
                product.premiumDeal || product.isPremiumDeal
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 hover:scale-105"
                  : "bg-gradient-to-r from-gray-800 to-black text-amber-300 border border-amber-700/30 hover:border-amber-500/50 hover:bg-gradient-to-r hover:from-amber-900/30 hover:to-amber-800/30"
              }`}
            >
              <ShoppingBag
                className={`w-5 h-5 ${
                  product.premiumDeal || product.isPremiumDeal
                    ? "group-hover/cart:scale-110 transition-transform"
                    : ""
                }`}
              />
              <span>Let It Flow</span>
            </AddToCartButton>
          </div>
        </div>

        {/* Hover Effect Line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-emerald-500 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>
      </div>

      {/* Quick Actions on Hover */}
      <div
        className={`absolute -top-2 -right-2 transform transition-all duration-300 ${
          isHovered ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-2">
          <button className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
