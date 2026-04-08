import axiosClient from "../api";

/**
 * Premium Subscription API Service
 * Handles all API calls related to Nile Premium subscription
 */

const PREMIUM_BASE_URL = "/api/subscription";

export const premiumService = {
  /**
   * Get current user's premium subscription status
   * @returns {Promise<{isPremium: boolean, expiresAt: string | null, subscriptionId: string | null}>}
   */
  async getStatus() {
    try {
      const response = await axiosClient.get(`${PREMIUM_BASE_URL}/status`);
      return response.data;
    } catch (error) {
      console.error("Error fetching premium status:", error);
      // Return default non-premium status on error
      return {
        isPremium: false,
        expiresAt: null,
        subscriptionId: null,
      };
    }
  },

  /**
   * Subscribe to Nile Premium (200 Ksh/month)
   * @param {string} paymentMethod - 'mpesa' or 'paypal' (or 'nile-pay' which maps to 'mpesa')
   * @param {string} phoneNumber - Phone number for M-Pesa (required if paymentMethod is mpesa)
   * @returns {Promise<{success: boolean, subscriptionId: string, expiresAt: string, paymentUrl?: string}>}
   */
  async subscribe(paymentMethod = "mpesa", phoneNumber = null) {
    try {
      // Map 'nile-pay' to 'mpesa' for backward compatibility
      const backendPaymentMethod =
        paymentMethod === "nile-pay" ? "mpesa" : paymentMethod;

      const payload = {
        paymentMethod: backendPaymentMethod,
        amount: 200, // 200 Ksh/month
        currency: "KSH",
      };

      // Add phoneNumber if provided (required for M-Pesa)
      if (phoneNumber) {
        payload.phoneNumber = phoneNumber;
      }

      const response = await axiosClient.post(
        `${PREMIUM_BASE_URL}/subscribe`,
        payload
      );

      return response.data;
    } catch (error) {
      console.error("Error subscribing to premium:", error);
      throw new Error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to subscribe to Nile Premium"
      );
    }
  },

  /**
   * Cancel premium subscription (expires at period end)
   * @returns {Promise<{success: boolean, message: string, expiresAt: string}>}
   */
  async cancel() {
    try {
      const response = await axiosClient.post(`${PREMIUM_BASE_URL}/cancel`);
      return response.data;
    } catch (error) {
      console.error("Error canceling premium subscription:", error);
      throw new Error(
        error.response?.data?.message || "Failed to cancel subscription"
      );
    }
  },

  /**
   * Renew premium subscription
   * @param {string} paymentMethod - 'mpesa' or 'paypal' (or 'nile-pay' which maps to 'mpesa')
   * @param {string} phoneNumber - Phone number for M-Pesa (required if paymentMethod is mpesa)
   * @returns {Promise<{success: boolean, subscriptionId: string, expiresAt: string}>}
   */
  async renew(paymentMethod = "mpesa", phoneNumber = null) {
    try {
      // Map 'nile-pay' to 'mpesa' for backward compatibility
      const backendPaymentMethod =
        paymentMethod === "nile-pay" ? "mpesa" : paymentMethod;

      const payload = {
        paymentMethod: backendPaymentMethod,
        amount: 200,
        currency: "KSH",
      };

      // Add phoneNumber if provided (required for M-Pesa)
      if (phoneNumber) {
        payload.phoneNumber = phoneNumber;
      }

      const response = await axiosClient.post(
        `${PREMIUM_BASE_URL}/renew`,
        payload
      );

      return response.data;
    } catch (error) {
      console.error("Error renewing premium subscription:", error);
      throw new Error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to renew subscription"
      );
    }
  },

  /**
   * Get monthly savings summary for premium users
   * @returns {Promise<{totalSavings: number, deliverySavings: number, milesBonus: number, exclusiveDeals: number}>}
   */
  async getMonthlySummary() {
    try {
      const response = await axiosClient.get(
        `${PREMIUM_BASE_URL}/monthly-summary`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching monthly summary:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch monthly summary"
      );
    }
  },

  /**
   * Get premium-only deals
   * @returns {Promise<Array>}
   */
  async getPremiumDeals() {
    try {
      const response = await axiosClient.get(
        `${PREMIUM_BASE_URL}/premium-deals`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching premium deals:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch premium deals"
      );
    }
  },

  /**
   * Check payment status by checkoutRequestId
   * Used for polling M-Pesa payment status after subscription initiation
   * @param {string} checkoutRequestId - The checkout request ID from subscribe response
   * @returns {Promise<{status: string, isPremium: boolean, expiresAt?: string, subscriptionId?: string}>}
   */
  async checkPaymentStatus(checkoutRequestId) {
    try {
      console.log(
        `[Service] Fetching payment status for: ${checkoutRequestId}`
      );
      const response = await axiosClient.get(
        `${PREMIUM_BASE_URL}/payment-status/${checkoutRequestId}`
      );
      console.log(`[Service] Payment status response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(
        "[Service] Error checking payment status:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to check payment status"
      );
    }
  },

  /**
   * Get premium benefits information
   * @returns {Promise<{isPremium: boolean, freeDeliveryMinimum: number, benefits: object}>}
   */
  async getBenefitsInfo() {
    try {
      const response = await axiosClient.get("/api/premium/benefits-info");
      return response.data;
    } catch (error) {
      console.error("Error fetching benefits info:", error);
      return {
        isPremium: false,
        freeDeliveryMinimum: 2000,
        standardDeliveryMinimum: 2000,
        benefits: {},
      };
    }
  },

  /**
   * Calculate premium discount for an order
   * @param {number} orderTotal - The order total amount
   * @returns {Promise<{originalTotal: number, discountAmount: number, discountPercentage: number, newTotal: number, savings: number}>}
   */
  async calculateDiscount(orderTotal) {
    try {
      const response = await axiosClient.post(
        "/api/premium/calculate-discount",
        {
          orderTotal,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error calculating discount:", error);
      return {
        originalTotal: orderTotal,
        discountAmount: 0,
        discountPercentage: 0,
        newTotal: orderTotal,
        savings: 0,
      };
    }
  },

  /**
   * Calculate Nile Miles with premium multiplier
   * @param {number} orderTotal - The order total amount
   * @returns {Promise<{orderTotal: number, baseMiles: number, actualMiles: number, multiplier: string, bonus: number}>}
   */
  async calculateMiles(orderTotal) {
    try {
      const response = await axiosClient.post("/api/premium/calculate-miles", {
        orderTotal,
      });
      return response.data;
    } catch (error) {
      console.error("Error calculating miles:", error);
      const baseMiles = Math.floor(orderTotal / 10);
      return {
        orderTotal,
        baseMiles,
        actualMiles: baseMiles,
        multiplier: "1x",
        bonus: 0,
      };
    }
  },
};

export default premiumService;
