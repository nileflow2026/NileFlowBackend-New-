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
import { useFavorites } from "../Context/FavoritesContext.jsx";
import { formatPrice } from "../utils/priceFormatter";
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
            className="text-yellow-400 fill-current w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 xl:w-4.5 xl:h-4.5 2xl:w-5 2xl:h-5"
          />,
        );
      } else if (i - 0.5 === roundedRating) {
        stars.push(
          <FontAwesomeIcon
            key={i}
            icon={faStarHalfStroke}
            className="text-yellow-400 w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 xl:w-4.5 xl:h-4.5 2xl:w-5 2xl:h-5"
          />,
        );
      } else {
        stars.push(
          <FontAwesomeIcon
            key={i}
            icon={faStarRegular}
            className="text-gray-600 w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 xl:w-4.5 xl:h-4.5 2xl:w-5 2xl:h-5"
          />,
        );
      }
    }

    return (
      <div className="flex gap-0.5 xs:gap-1 sm:gap-1 md:gap-1.5 lg:gap-1.5 xl:gap-2">
        {stars}
      </div>
    );
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
      className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-500 hover:-translate-y-2 ${
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
      <div className="relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 group-hover:border-amber-500/50 group-hover:shadow-2xl group-hover:shadow-amber-900/30 h-full">
        {/* Badges */}
        <div className="absolute top-1 xs:top-2 sm:top-3 md:top-4 left-1 xs:left-2 sm:left-3 md:left-4 z-10 flex flex-col gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2">
          {product.isOnSale && (
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white text-[10px] xs:text-xs sm:text-xs md:text-sm font-bold px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-1 sm:py-1 md:py-1.5 rounded-full shadow-lg flex items-center space-x-0.5 xs:space-x-1 sm:space-x-1 md:space-x-1.5">
              <Zap className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
              <span className="hidden xs:inline">SALE</span>
              <span className="xs:hidden">S</span>
            </div>
          )}

          {(product.premiumDeal || product.isPremiumDeal) && (
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[10px] xs:text-xs sm:text-xs md:text-sm font-bold px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-1 sm:py-1 md:py-1.5 rounded-full shadow-lg flex items-center space-x-0.5 xs:space-x-1 sm:space-x-1 md:space-x-1.5">
              <Award className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
              <span className="hidden xs:inline">PREMIUM</span>
              <span className="xs:hidden">P</span>
            </div>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-1 xs:top-2 sm:top-3 md:top-4 right-1 xs:right-2 sm:right-3 md:right-4 z-10 w-6 h-6 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all duration-300 ${
            isWishlisted
              ? "bg-gradient-to-r from-red-600 to-pink-600 border-red-500/50 text-white"
              : "bg-gradient-to-r from-gray-900/80 to-black/80 border-amber-700/30 text-amber-400 hover:text-amber-300 hover:border-amber-500/50"
          } hover:scale-110`}
        >
          <Heart
            className={`w-3 h-3 xs:w-4 xs:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 ${isWishlisted ? "fill-current" : ""}`}
          />
        </button>

        {/* Image Container */}
        <div className="relative h-40 xs:h-44 sm:h-48 md:h-56 lg:h-64 xl:h-72 overflow-hidden bg-gradient-to-br from-gray-900 to-black">
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
            className={`absolute bottom-1 xs:bottom-2 sm:bottom-3 md:bottom-4 right-1 xs:right-2 sm:right-3 md:right-4 transform transition-all duration-300 ${
              isHovered
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0"
            }`}
          >
            <Link
              to={`/products/${id}`}
              className="w-6 h-6 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-full bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-700/30 flex items-center justify-center text-amber-400 hover:text-amber-300 hover:scale-110 transition-all"
            >
              <Eye className="w-3 h-3 xs:w-4 xs:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
            </Link>
          </div>

          {/* Stock Status Badge */}
          <div
            className={`absolute bottom-1 xs:bottom-2 sm:bottom-3 md:bottom-4 left-1 xs:left-2 sm:left-3 md:left-4 z-10 px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-1 sm:py-1 md:py-1.5 rounded-full text-[10px] xs:text-xs sm:text-xs md:text-sm font-bold ${
              product.stock <= 0
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                : product.stock <= 5
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
            }`}
          >
            <span className="hidden xs:inline">{stockStatus}</span>
            <span className="xs:hidden">
              {product.stock <= 0 ? "OUT" : product.stock <= 5 ? "LOW" : "OK"}
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6">
          <div className="mb-2 xs:mb-3 sm:mb-4">
            <Link to={`/products/${id}`}>
              <h3 className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white group-hover:text-amber-300 transition-colors duration-300 line-clamp-2 min-h-[2rem] xs:min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[3.5rem]">
                {product.productName}
              </h3>
            </Link>

            {(product.premiumDeal || product.isPremiumDeal) && (
              <p className="text-gray-400 text-[10px] xs:text-xs sm:text-sm md:text-base mt-0.5 xs:mt-1 sm:mt-2 line-clamp-2">
                {product.description ||
                  "Premium quality African product with authentic craftsmanship."}
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4">
            <div className="flex items-center space-x-0.5 xs:space-x-1 sm:space-x-2">
              <StarRating rating={averageRating} />
              <span className="text-gray-400 text-[10px] xs:text-xs sm:text-sm">
                ({totalRatings})
              </span>
            </div>

            <div className="flex items-center space-x-0.5 xs:space-x-1 sm:space-x-1.5 md:space-x-2 lg:space-x-2 xl:space-x-2.5 bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-1.5 xs:px-2 sm:px-2.5 md:px-3 lg:px-3.5 xl:px-4 2xl:px-5 py-0.5 xs:py-1 sm:py-1.5 md:py-2 lg:py-2 xl:py-2.5 rounded-full border border-amber-700/30">
              <Star className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-4.5 2xl:h-4.5 text-amber-400 fill-current" />
              <span className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl font-bold text-amber-200">
                {averageRating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="mb-3 xs:mb-4 sm:mb-6">
            <div className="flex items-baseline gap-1 xs:gap-2">
              <span className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-amber-300">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-gray-500 line-through text-[10px] xs:text-xs sm:text-sm md:text-base">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="text-red-400 text-[10px] xs:text-xs sm:text-sm md:text-base font-bold">
                    {Math.round(
                      (1 - product.price / product.originalPrice) * 100,
                    )}
                    % OFF
                  </span>
                </>
              )}
            </div>
            {product.shipping && (
              <p className="text-emerald-400 text-[10px] xs:text-xs sm:text-sm md:text-base mt-0.5 xs:mt-1 flex items-center gap-0.5 xs:gap-1">
                <Truck className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
                <span className="hidden xs:inline">Free shipping</span>
                <span className="xs:hidden">Free</span>
              </p>
            )}
          </div>

          {/* Features */}
          {(product.premiumDeal || product.isPremiumDeal) && (
            <div className="flex flex-wrap gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 mb-3 xs:mb-4 sm:mb-6">
              <div className="flex items-center space-x-0.5 xs:space-x-1 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-1 sm:py-1.5 rounded-lg border border-amber-800/30">
                <Shield className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-emerald-400" />
                <span className="text-[10px] xs:text-xs sm:text-sm text-emerald-100">
                  <span className="hidden sm:inline">Authentic</span>
                  <span className="sm:hidden">Auth</span>
                </span>
              </div>
              <div className="flex items-center space-x-0.5 xs:space-x-1 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-1 sm:py-1.5 rounded-lg border border-amber-800/30">
                <Truck className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-blue-400" />
                <span className="text-[10px] xs:text-xs sm:text-sm text-blue-100">
                  <span className="hidden sm:inline">Fast Ship</span>
                  <span className="sm:hidden">Ship</span>
                </span>
              </div>
              <div className="flex items-center space-x-0.5 xs:space-x-1 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-1 sm:py-1.5 rounded-lg border border-amber-800/30">
                <Sparkles className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-amber-400" />
                <span className="text-[10px] xs:text-xs sm:text-sm text-amber-100">
                  <span className="hidden sm:inline">Premium</span>
                  <span className="sm:hidden">Prem</span>
                </span>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <div className="mt-auto">
            <AddToCartButton
              product={product}
              className={`w-full px-1.5 xs:px-2 sm:px-3 md:px-4 lg:px-5 py-1.5 xs:py-2 sm:py-2.5 md:py-3 rounded-lg xs:rounded-xl text-[11px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-bold transition-all duration-300 flex items-center justify-center space-x-1 xs:space-x-2 group/cart ${
                product.premiumDeal || product.isPremiumDeal
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 hover:scale-105"
                  : "bg-gradient-to-r from-gray-800 to-black text-amber-300 border border-amber-700/30 hover:border-amber-500/50 hover:bg-gradient-to-r hover:from-amber-900/30 hover:to-amber-800/30"
              }`}
            >
              <ShoppingBag
                className={`w-3 h-3 xs:w-4 xs:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 ${
                  product.premiumDeal || product.isPremiumDeal
                    ? "group-hover/cart:scale-110 transition-transform"
                    : ""
                }`}
              />
              <span className="hidden xs:inline">Let It Flow</span>
              <span className="xs:hidden">Add</span>
            </AddToCartButton>
          </div>
        </div>

        {/* Hover Effect Line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-emerald-500 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>
      </div>

      {/* Quick Actions on Hover */}
      <div
        className={`absolute -top-1 xs:-top-2 -right-1 xs:-right-2 transform transition-all duration-300 ${
          isHovered ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1 xs:gap-2">
          <button className="w-6 h-6 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
            <Sparkles className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
