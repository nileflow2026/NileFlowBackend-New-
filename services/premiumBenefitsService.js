// services/premiumBenefitsService.js
const { db, users } = require("./appwriteService");
const { env } = require("../src/env");
const { Query, ID } = require("node-appwrite");
const logger = require("../utils/logger");

class PremiumBenefitsService {
  /**
   * Award Nile Miles with premium multiplier
   * @param {string} userId
   * @param {number} orderTotal - Order total in KSH
   * @param {string} orderId - Order ID for tracking
   * @returns {Promise<Object>}
   */
  static async awardNileMiles(userId, orderTotal, orderId) {
    try {
      // Check if user is premium
      const user = await users.get(userId);
      const isPremium = user.prefs?.isPremium || false;

      // Calculate base miles (1 mile per 10 KSH)
      const baseMiles = Math.floor(orderTotal / 10);

      // Premium users get 2x multiplier
      const finalMiles = isPremium ? baseMiles * 2 : baseMiles;
      const bonusMiles = isPremium ? baseMiles : 0;

      logger.info(
        `Awarding ${finalMiles} miles to user ${userId} (Premium: ${isPremium})`
      );

      // Get or create user's Nile Miles record
      let userMilesDoc = null;
      try {
        const milesResponse = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_NILE_MILES_COLLECTION,
          [Query.equal("userId", userId), Query.limit(1)]
        );

        if (milesResponse.documents.length > 0) {
          userMilesDoc = milesResponse.documents[0];
        }
      } catch (error) {
        logger.warn("Error fetching miles record:", error);
      }

      const currentTime = new Date().toISOString();
      const earnedEntry = {
        date: currentTime,
        miles: finalMiles,
        source: `Order #${orderId}`,
        isPremiumBonus: isPremium,
        bonusMiles: bonusMiles,
      };

      if (userMilesDoc) {
        // Update existing record
        const currentMiles = userMilesDoc.currentMiles || 0;
        const earnedHistory = JSON.parse(userMilesDoc.earnedHistory || "[]");

        earnedHistory.push(earnedEntry);

        await db.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_NILE_MILES_COLLECTION,
          userMilesDoc.$id,
          {
            currentMiles: currentMiles + finalMiles,
            earnedHistory: JSON.stringify(earnedHistory),
            lastEarned: currentTime,
          }
        );
      } else {
        // Create new record
        await db.createDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_NILE_MILES_COLLECTION,
          ID.unique(),
          {
            userId,
            currentMiles: finalMiles,
            earnedHistory: JSON.stringify([earnedEntry]),
            redeemed: JSON.stringify([]),
            lastEarned: currentTime,
            $createdAt: currentTime,
          }
        );
      }

      return {
        success: true,
        milesAwarded: finalMiles,
        bonusMiles: bonusMiles,
        isPremium: isPremium,
      };
    } catch (error) {
      logger.error("Error awarding Nile Miles:", error);
      return {
        success: false,
        error: error.message,
        milesAwarded: 0,
        bonusMiles: 0,
      };
    }
  }

  /**
   * Apply premium discount to order
   * @param {string} userId
   * @param {Array} cartItems
   * @param {number} orderTotal
   * @returns {Promise<Object>}
   */
  static async applyPremiumDiscount(userId, cartItems, orderTotal) {
    try {
      const user = await users.get(userId);
      const isPremium = user.prefs?.isPremium || false;

      if (!isPremium) {
        return {
          discount: 0,
          discountPercentage: 0,
          isPremium: false,
          message: "No premium discount available",
        };
      }

      // Premium users get 10% discount on orders over 1000 KSH
      let discountPercentage = 0;
      if (orderTotal >= 1000) {
        discountPercentage = 10; // 10% discount
      } else if (orderTotal >= 500) {
        discountPercentage = 5; // 5% discount for orders over 500 KSH
      }

      const discount = Math.floor((orderTotal * discountPercentage) / 100);

      return {
        discount,
        discountPercentage,
        isPremium: true,
        message: `Premium ${discountPercentage}% discount applied`,
        originalTotal: orderTotal,
        newTotal: orderTotal - discount,
      };
    } catch (error) {
      logger.error("Error applying premium discount:", error);
      return {
        discount: 0,
        discountPercentage: 0,
        isPremium: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if user qualifies for free delivery (premium users)
   * @param {string} userId
   * @param {number} orderTotal
   * @returns {Promise<Object>}
   */
  static async checkFreeDelivery(userId, orderTotal) {
    try {
      const user = await users.get(userId);
      const isPremium = user.prefs?.isPremium || false;

      // Premium users get free delivery on all orders
      // Regular users get free delivery on orders over 2000 KSH
      const qualifiesForFree = isPremium || orderTotal >= 2000;
      const deliveryFee = qualifiesForFree ? 0 : 150;

      return {
        qualifiesForFree,
        deliveryFee,
        isPremium,
        reason: isPremium
          ? "Premium member - free delivery on all orders"
          : orderTotal >= 2000
          ? "Free delivery on orders over 2000 KSH"
          : "Standard delivery fee applies",
        savings: isPremium && orderTotal < 2000 ? 150 : 0,
      };
    } catch (error) {
      logger.error("Error checking delivery eligibility:", error);
      return {
        qualifiesForFree: false,
        deliveryFee: 150,
        isPremium: false,
        error: error.message,
      };
    }
  }

  /**
   * Get premium products/deals available to user
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  static async getPremiumDeals(userId) {
    try {
      const user = await users.get(userId);
      const isPremium = user.prefs?.isPremium || false;

      if (!isPremium) {
        return {
          deals: [],
          isPremium: false,
          message: "Premium subscription required for exclusive deals",
        };
      }

      // Get products with premium discounts
      let premiumProducts = [];
      try {
        const productsResponse = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_PRODUCTS_COLLECTION_ID,
          [Query.equal("premiumOnly", true), Query.limit(20)]
        );

        premiumProducts = productsResponse.documents.map((product) => ({
          ...product,
          premiumDiscount: product.premiumDiscount || 15, // Default 15% premium discount
          originalPrice: product.price,
          premiumPrice: Math.floor(
            product.price * (1 - (product.premiumDiscount || 15) / 100)
          ),
        }));
      } catch (error) {
        logger.warn("Error fetching premium products:", error);

        // Fallback: return sample premium deals
        premiumProducts = [
          {
            $id: "premium-deal-1",
            name: "Premium Electronics Bundle",
            description: "Exclusive electronics bundle for premium members",
            originalPrice: 5000,
            premiumPrice: 4250,
            premiumDiscount: 15,
            image: "/images/premium-electronics.jpg",
            category: "Electronics",
          },
          {
            $id: "premium-deal-2",
            name: "Premium Home Essentials",
            description: "Curated home essentials at premium prices",
            originalPrice: 3000,
            premiumPrice: 2700,
            premiumDiscount: 10,
            image: "/images/premium-home.jpg",
            category: "Home & Garden",
          },
        ];
      }

      return {
        deals: premiumProducts,
        isPremium: true,
        message: `${premiumProducts.length} exclusive deals available`,
      };
    } catch (error) {
      logger.error("Error fetching premium deals:", error);
      return {
        deals: [],
        isPremium: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate monthly savings summary for premium user
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  static async getMonthlySavings(userId) {
    try {
      const user = await users.get(userId);
      const isPremium = user.prefs?.isPremium || false;

      if (!isPremium) {
        return {
          totalSavings: 0,
          deliverySavings: 0,
          milesBonus: 0,
          exclusiveDeals: 0,
          isPremium: false,
        };
      }

      // Get current month's orders
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      let orders = [];
      try {
        const ordersResponse = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ORDERS_COLLECTION,
          [
            Query.equal("users", userId),
            Query.greaterThanEqual("createdAt", startOfMonth.toISOString()),
            Query.equal("status", ["completed", "shipped", "delivered"]),
          ]
        );
        orders = ordersResponse.documents;
      } catch (error) {
        logger.warn("Error fetching orders for savings calculation:", error);
      }

      let deliverySavings = 0;
      let milesBonus = 0;
      let exclusiveDeals = 0;

      for (const order of orders) {
        const orderTotal = order.total || 0;

        // Delivery savings (premium gets free delivery on all orders)
        if (orderTotal < 2000) {
          // Orders under 2000 KSH would normally pay delivery
          deliverySavings += 150;
        }

        // Miles bonus (premium gets 2x, so bonus is the base miles)
        const baseMiles = Math.floor(orderTotal / 10);
        milesBonus += baseMiles;

        // Premium discounts applied
        if (order.premiumDiscount) {
          exclusiveDeals += order.premiumDiscount;
        } else {
          // Estimate savings based on order total
          if (orderTotal >= 1000) {
            exclusiveDeals += Math.floor(orderTotal * 0.1); // 10% discount
          } else if (orderTotal >= 500) {
            exclusiveDeals += Math.floor(orderTotal * 0.05); // 5% discount
          }
        }
      }

      // Convert miles bonus to KSH value (1 mile = 0.1 KSH)
      const milesBonusValue = Math.floor(milesBonus * 0.1);
      const totalSavings = deliverySavings + milesBonusValue + exclusiveDeals;

      return {
        totalSavings,
        deliverySavings,
        milesBonus,
        milesBonusValue,
        exclusiveDeals,
        ordersCount: orders.length,
        isPremium: true,
        subscriptionCost: 200,
        netSavings: totalSavings - 200,
      };
    } catch (error) {
      logger.error("Error calculating monthly savings:", error);
      return {
        totalSavings: 0,
        deliverySavings: 0,
        milesBonus: 0,
        exclusiveDeals: 0,
        isPremium: false,
        error: error.message,
      };
    }
  }
}

module.exports = PremiumBenefitsService;
