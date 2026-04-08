import React from "react";
import { usePremiumStatus } from "../hooks/usePremiumStatus";

/**
 * PremiumBadge - Badge component for premium-eligible products
 * Shows on product cards to indicate priority delivery available
 */
const PremiumBadge = ({ product, size = "md" }) => {
  const { isPremium } = usePremiumStatus();

  // Only show badge if product is premium-eligible
  if (!product?.premiumEligible) {
    return null;
  }

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (isPremium) {
    // User is premium - show "Priority Delivery" badge
    return (
      <div
        className={`inline-flex items-center gap-1 bg-amber-500 text-white rounded-full font-semibold ${sizes[size]}`}
      >
        <svg
          className={iconSizes[size]}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        <span>Priority Delivery</span>
      </div>
    );
  }

  // User is not premium - show "Premium" badge
  return (
    <div
      className={`inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold ${sizes[size]}`}
    >
      <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span>Premium</span>
    </div>
  );
};

export default PremiumBadge;
