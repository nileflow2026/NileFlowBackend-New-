const { users, db } = require("../src/appwrite");
const { Query } = require("node-appwrite");
const { env } = require("../src/env");
const logger = require("../utils/logger");

/**
 * Check if user has active premium subscription
 * @param {string} userId - User ID from JWT token
 * @returns {Promise<{isPremium: boolean, expiresAt: Date|null}>}
 */
async function checkUserPremiumStatus(userId) {
  try {
    // Ensure userId is a string, not an array
    const cleanUserId = Array.isArray(userId) ? userId[0] : userId;

    const user = await users.get(cleanUserId);

    logger.info(`Checking premium status for user ${cleanUserId}`);

    if (!user) {
      logger.warn(`User ${cleanUserId} not found`);
      return { isPremium: false, expiresAt: null };
    }

    // Log user prefs for debugging
    logger.info(`User prefs: ${JSON.stringify(user.prefs || {})}`);

    const isPremium = user.prefs?.isPremium || false;
    const subscriptionExpiry = user.prefs?.subscriptionExpiry
      ? new Date(user.prefs.subscriptionExpiry)
      : user.prefs?.subscriptionExpiresAt
      ? new Date(user.prefs.subscriptionExpiresAt) // Alternative field name
      : null;

    logger.info(
      `Premium check - isPremium: ${isPremium}, subscriptionExpiry: ${subscriptionExpiry}`
    );

    // If user has isPremium flag, check expiry (but don't fail if expiry is missing)
    if (isPremium) {
      if (subscriptionExpiry) {
        const isActive = subscriptionExpiry > new Date();
        logger.info(
          `Subscription active: ${isActive} (expires: ${subscriptionExpiry})`
        );

        if (isActive) {
          return { isPremium: true, expiresAt: subscriptionExpiry };
        } else {
          logger.warn(`Subscription expired for user ${cleanUserId}`);
          return { isPremium: false, expiresAt: subscriptionExpiry };
        }
      } else {
        // User has isPremium but no expiry date - treat as active (for backward compatibility)
        logger.warn(
          `User ${cleanUserId} has isPremium but no expiry date - treating as active`
        );
        return { isPremium: true, expiresAt: null };
      }
    }

    return { isPremium: false, expiresAt: subscriptionExpiry };
  } catch (error) {
    logger.error("Error checking premium status:", error);
    return { isPremium: false, expiresAt: null };
  }
}

/**
 * Calculate premium savings for an order
 * @param {number} subtotal - Order subtotal (before tax and shipping)
 * @param {number} shippingFee - Applied shipping fee
 * @param {boolean} isPremium - Whether user is premium
 * @returns {Object} Premium savings data
 */
function calculatePremiumSavings(subtotal, shippingFee, isPremium) {
  const savings = {
    isPremiumOrder: isPremium,
    discountAmount: 0,
    deliverySavings: 0,
    milesBonus: 0,
    milesTotal: 0,
  };

  if (!isPremium) {
    // Regular user gets 1x miles
    savings.milesTotal = Math.floor(subtotal / 10);
    return savings;
  }

  // Premium user calculations

  // 1. Calculate discount (10% for >1000 KSH, 5% for >500 KSH)
  if (subtotal >= 1000) {
    savings.discountAmount = Math.round(subtotal * 0.1 * 100) / 100;
  } else if (subtotal >= 500) {
    savings.discountAmount = Math.round(subtotal * 0.05 * 100) / 100;
  }

  // 2. Calculate delivery savings (standard shipping is 200 KSH)
  const standardShippingFee = 200;
  if (shippingFee === 0 && subtotal >= 500) {
    savings.deliverySavings = standardShippingFee;
  }

  // 3. Calculate miles (2x multiplier for premium)
  const baseMiles = Math.floor(subtotal / 10);
  savings.milesTotal = baseMiles * 2; // Premium gets 2x
  savings.milesBonus = baseMiles; // The extra miles from premium

  return savings;
}

/**
 * Award Nile Miles to user and create transaction record
 * @param {string} userId - User ID
 * @param {number} miles - Miles to award
 * @param {string} orderId - Order ID for reference
 * @returns {Promise<boolean>} Success status
 */
async function awardMilesToUser(userId, miles, orderId) {
  try {
    // Ensure userId is a string, not an array
    const cleanUserId = Array.isArray(userId) ? userId[0] : userId;

    // Get current user data
    const user = await users.get(cleanUserId);
    const currentMiles = user.prefs?.nileMiles || 0;
    const currentTotalMiles = user.prefs?.totalMilesEarned || 0;

    // Update user miles
    await users.updatePrefs(cleanUserId, {
      ...user.prefs,
      nileMiles: currentMiles + miles,
      totalMilesEarned: currentTotalMiles + miles,
      lastMilesUpdate: new Date().toISOString(),
    });

    // Create transaction record in database if available
    if (
      env.APPWRITE_DATABASE_ID &&
      env.APPWRITE_MILES_TRANSACTIONS_COLLECTION
    ) {
      try {
        await db.createDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_MILES_TRANSACTIONS_COLLECTION,
          "unique()",
          {
            userId: cleanUserId,
            amount: miles,
            type: "earned",
            description: `Order purchase - Order #${orderId}`,
            orderId,
            createdAt: new Date().toISOString(),
          }
        );
      } catch (dbError) {
        logger.error("Failed to create miles transaction record:", dbError);
        // Don't fail the whole operation if transaction logging fails
      }
    }

    logger.info(
      `Awarded ${miles} miles to user ${userId} for order ${orderId}`
    );
    return true;
  } catch (error) {
    logger.error("Error awarding miles to user:", error);
    return false;
  }
}

/**
 * Update order with premium tracking data
 * @param {string} orderId - Order ID
 * @param {Object} premiumData - Premium savings data
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function updateOrderWithPremiumData(orderId, premiumData, userId) {
  try {
    // Ensure userId is a string, not an array
    const cleanUserId = Array.isArray(userId) ? userId[0] : userId;

    if (!env.APPWRITE_DATABASE_ID || !env.APPWRITE_ORDERS_COLLECTION) {
      logger.error("Order collection not configured");
      return false;
    }

    // Get current month in format '2025-12'
    const orderMonth = new Date().toISOString().slice(0, 7);

    // Update order document with premium tracking
    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      orderId,
      {
        userId: cleanUserId,
        isPremiumOrder: premiumData.isPremiumOrder,
        premiumDiscountAmount: premiumData.discountAmount,
        premiumDeliverySavings: premiumData.deliverySavings,
        premiumMilesBonus: premiumData.milesBonus,
        premiumMilesTotal: premiumData.milesTotal,
        orderMonth,
        premiumTrackingUpdated: new Date().toISOString(),
      }
    );

    logger.info(`Updated order ${orderId} with premium tracking data`);
    return true;
  } catch (error) {
    logger.error("Error updating order with premium data:", error);
    return false;
  }
}

/**
 * Get monthly premium savings summary
 * @param {string} userId - User ID
 * @param {string} month - Month in format '2025-12' (optional, defaults to current month)
 * @returns {Promise<Object>} Monthly savings summary
 */
async function getMonthlySavingsSummary(userId, month = null) {
  try {
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    if (!env.APPWRITE_DATABASE_ID || !env.APPWRITE_ORDERS_COLLECTION) {
      logger.error("Orders collection not configured");
      return {
        error: "Database not configured",
        isPremium: false,
        ordersCount: 0,
        totalSavings: 0,
        deliverySavings: 0,
        discountSavings: 0,
        milesBonus: 0,
        milesBonusValue: 0,
      };
    }

    // Get all premium orders for user in the target month
    const ordersResponse = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      [
        Query.equal("userId", userId),
        Query.equal("isPremiumOrder", true),
        Query.equal("orderMonth", targetMonth),
        Query.notEqual("status", "cancelled"),
      ]
    );

    const orders = ordersResponse.documents;

    // Calculate totals
    let totalDiscountSavings = 0;
    let totalDeliverySavings = 0;
    let totalMilesBonus = 0;

    for (const order of orders) {
      totalDiscountSavings += parseFloat(order.premiumDiscountAmount || 0);
      totalDeliverySavings += parseFloat(order.premiumDeliverySavings || 0);
      totalMilesBonus += parseInt(order.premiumMilesBonus || 0);
    }

    // Miles bonus value: 100 miles = 10 KSH, so 1 mile = 0.1 KSH
    const milesBonusValue = totalMilesBonus * 0.1;
    const totalSavings =
      totalDiscountSavings + totalDeliverySavings + milesBonusValue;

    return {
      isPremium: true,
      ordersCount: orders.length,
      totalSavings: Math.round(totalSavings * 100) / 100,
      deliverySavings: Math.round(totalDeliverySavings * 100) / 100,
      discountSavings: Math.round(totalDiscountSavings * 100) / 100,
      milesBonus: totalMilesBonus,
      milesBonusValue: Math.round(milesBonusValue * 100) / 100,
      exclusiveDeals: 0, // Placeholder for future feature
      subscriptionCost: 200,
      netSavings: Math.round((totalSavings - 200) * 100) / 100,
      currentMonth: targetMonth,
    };
  } catch (error) {
    logger.error("Error getting monthly savings summary:", error);
    return {
      error: error.message,
      isPremium: false,
      ordersCount: 0,
      totalSavings: 0,
      deliverySavings: 0,
      discountSavings: 0,
      milesBonus: 0,
      milesBonusValue: 0,
    };
  }
}

module.exports = {
  checkUserPremiumStatus,
  calculatePremiumSavings,
  awardMilesToUser,
  updateOrderWithPremiumData,
  getMonthlySavingsSummary,
};
