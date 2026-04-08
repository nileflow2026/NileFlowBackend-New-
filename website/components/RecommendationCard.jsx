/* eslint-disable no-unused-vars */
// components/RecommendationCard.jsx
import React from "react";
import { Star, Heart, ShoppingBag, Globe, Award } from "lucide-react";
import { formatPrice } from "../utils/priceFormatter";

export const RecommendationCard = ({
  item,
  position,
  onClick,
  culturalRelevance,
  trustScore,
}) => {
  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating)
            ? "text-amber-400 fill-current"
            : i < rating
            ? "text-amber-400 fill-current opacity-50"
            : "text-gray-500"
        }`}
      />
    ));
  };

  return (
    <div
      className="group relative bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Cultural Relevance Badge */}
      {culturalRelevance > 0.7 && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-green-600 to-green-700 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Globe className="w-3 h-3" />
          <span>Local Favorite</span>
        </div>
      )}

      {/* Trust Score Badge */}
      {trustScore > 0.8 && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-blue-600 to-blue-700 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Award className="w-3 h-3" />
          <span>Trusted</span>
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={
            item.imageUrl ||
            item.image ||
            item.images?.[0] ||
            "/placeholder-product.jpg"
          }
          alt={item.name || item.title || "Product"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = "/placeholder-product.jpg";
          }}
        />

        {/* Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quick Action Buttons */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition-colors">
            <Heart className="w-4 h-4" />
          </button>
          <button className="bg-gradient-to-r from-amber-600 to-amber-700 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium hover:from-amber-700 hover:to-amber-800 transition-colors flex items-center gap-2">
            <ShoppingBag className="w-3 h-3" />
            Let it Flow{" "}
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 relative z-10">
        {/* Product Name */}
        <h3 className="text-white font-medium text-sm mb-2 line-clamp-2 group-hover:text-amber-200 transition-colors">
          {item.name || item.title || "Product Name"}
        </h3>

        {/* Price Section */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-lg">
              {formatPrice(item.price || 0)}
            </span>
            {item.originalPrice && item.originalPrice > (item.price || 0) && (
              <span className="text-gray-500 line-through text-sm">
                {formatPrice(item.originalPrice)}
              </span>
            )}
          </div>
          {item.originalPrice && item.originalPrice > (item.price || 0) && (
            <span className="bg-red-600/20 text-red-300 text-xs px-2 py-1 rounded border border-red-600/30">
              {Math.round((1 - (item.price || 0) / item.originalPrice) * 100)}%
              OFF
            </span>
          )}
        </div>

        {/* Rating */}
        {(item.rating || 0) > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              {renderStars(item.rating || 0)}
            </div>
            <span className="text-gray-400 text-xs">
              ({item.reviewCount || item.rating || 0} reviews)
            </span>
          </div>
        )}

        {/* Category/Brand */}
        {(item.brand || item.category) && (
          <div className="text-gray-500 text-xs mb-2">
            {item.brand && `${item.brand}`}
            {item.brand && item.category && " • "}
            {item.category && `${item.category}`}
          </div>
        )}

        {/* High Trust Score Indicator */}
        {trustScore > 0.8 && (
          <div className="flex items-center text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded border border-blue-800/30">
            <Award className="w-3 h-3 mr-1" />
            Trusted Seller
          </div>
        )}

        {/* Cultural Context */}
        {culturalRelevance > 0.5 && (
          <div className="text-green-400 text-xs flex items-center gap-1 mt-1">
            <Globe className="w-3 h-3" />
            <span>Popular in your region</span>
          </div>
        )}
      </div>

      {/* Card Border Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/20 group-hover:to-purple-500/20 blur-xl transition-all duration-500 -z-10" />
    </div>
  );
};
