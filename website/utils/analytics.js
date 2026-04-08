/**
 * Analytics Utility for tracking user events
 * Supports Google Analytics, custom analytics, and console logging for development
 */

// Check if Google Analytics is loaded
const isGALoaded = () => {
  return typeof window !== "undefined" && typeof window.gtag === "function";
};

/**
 * Track a custom event
 * @param {string} eventName - Name of the event
 * @param {object} eventData - Additional data for the event
 */
export const trackEvent = (eventName, eventData = {}) => {
  try {
    // Development: Log to console
    if (import.meta.env.DEV) {
      console.log(`📊 Analytics Event: ${eventName}`, eventData);
    }

    // Google Analytics 4
    if (isGALoaded()) {
      window.gtag("event", eventName, eventData);
    }

    // Custom analytics endpoint (optional - send to your backend)
    if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: eventName,
          timestamp: new Date().toISOString(),
          ...eventData,
        }),
      }).catch(() => {
        // Silently fail - don't break user experience
      });
    }
  } catch (error) {
    // Silently fail - analytics should never break the app
  }
};

/**
 * Track premium-specific events
 */
export const trackPremiumEvent = {
  // User views premium subscription page
  viewPremiumPage: () => {
    trackEvent("premium_page_view", {
      event_category: "premium",
      event_label: "subscription_page",
    });
  },

  // User clicks "Upgrade to Premium" button
  clickUpgrade: (source) => {
    trackEvent("premium_upgrade_click", {
      event_category: "premium",
      event_label: "upgrade_button",
      source: source, // e.g., 'profile', 'cart', 'deals_page'
    });
  },

  // User initiates premium subscription payment
  initiateSubscription: (paymentMethod) => {
    trackEvent("premium_subscription_initiated", {
      event_category: "premium",
      event_label: "payment_started",
      payment_method: paymentMethod, // 'mpesa' or 'stripe'
    });
  },

  // User successfully subscribes to premium
  subscriptionSuccess: (paymentMethod, amount) => {
    trackEvent("premium_subscription_success", {
      event_category: "premium",
      event_label: "subscription_completed",
      payment_method: paymentMethod,
      value: amount,
      currency: "KES",
    });
  },

  // User's subscription payment fails
  subscriptionFailed: (paymentMethod, errorMessage) => {
    trackEvent("premium_subscription_failed", {
      event_category: "premium",
      event_label: "payment_failed",
      payment_method: paymentMethod,
      error_message: errorMessage,
    });
  },

  // User views monthly savings summary
  viewMonthlySummary: (totalSavings, netSavings) => {
    trackEvent("premium_summary_view", {
      event_category: "premium",
      event_label: "monthly_summary",
      total_savings: totalSavings,
      net_savings: netSavings,
    });
  },

  // User refreshes monthly summary
  refreshSummary: () => {
    trackEvent("premium_summary_refresh", {
      event_category: "premium",
      event_label: "manual_refresh",
    });
  },

  // User shares their savings on social media
  shareSavings: (platform, totalSavings) => {
    trackEvent("premium_share_savings", {
      event_category: "premium",
      event_label: "social_share",
      platform: platform, // 'twitter', 'facebook', 'whatsapp'
      total_savings: totalSavings,
    });
  },

  // User places order with premium discount
  orderWithDiscount: (orderTotal, discountAmount, discountPercentage) => {
    trackEvent("premium_order_placed", {
      event_category: "premium",
      event_label: "order_with_discount",
      order_value: orderTotal,
      discount_amount: discountAmount,
      discount_percentage: discountPercentage,
    });
  },

  // User earns bonus miles
  earnBonusMiles: (baseMiles, bonusMiles, totalMiles) => {
    trackEvent("premium_miles_earned", {
      event_category: "premium",
      event_label: "miles_bonus",
      base_miles: baseMiles,
      bonus_miles: bonusMiles,
      total_miles: totalMiles,
    });
  },

  // User gets free delivery
  freeDelivery: (orderTotal, deliverySavings) => {
    trackEvent("premium_free_delivery", {
      event_category: "premium",
      event_label: "shipping_waived",
      order_value: orderTotal,
      delivery_savings: deliverySavings,
    });
  },

  // User views premium deals
  viewPremiumDeals: () => {
    trackEvent("premium_deals_view", {
      event_category: "premium",
      event_label: "exclusive_deals",
    });
  },

  // User cancels premium subscription
  cancelSubscription: (reason) => {
    trackEvent("premium_subscription_cancelled", {
      event_category: "premium",
      event_label: "churn",
      cancellation_reason: reason,
    });
  },

  // User renews premium subscription
  renewSubscription: (paymentMethod) => {
    trackEvent("premium_subscription_renewed", {
      event_category: "premium",
      event_label: "renewal",
      payment_method: paymentMethod,
    });
  },
};

/**
 * Track page views
 * @param {string} pageName - Name of the page
 * @param {string} pageUrl - URL of the page
 */
export const trackPageView = (pageName, pageUrl) => {
  trackEvent("page_view", {
    page_title: pageName,
    page_location: pageUrl,
  });
};

/**
 * Track conversions (purchases, signups, etc.)
 * @param {string} conversionType - Type of conversion
 * @param {number} value - Monetary value
 * @param {string} currency - Currency code
 */
export const trackConversion = (conversionType, value, currency = "KES") => {
  trackEvent("conversion", {
    conversion_type: conversionType,
    value: value,
    currency: currency,
  });
};

export default {
  trackEvent,
  trackPremiumEvent,
  trackPageView,
  trackConversion,
};
