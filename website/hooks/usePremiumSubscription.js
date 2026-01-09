import { useState, useRef } from "react";
import { premiumService } from "../utils/premiumService";
import { usePremiumContext } from "../Context/PremiumContext";
import { trackPremiumEvent } from "../utils/analytics";

/**
 * Hook for managing premium subscription actions
 * @returns {{ subscribe: Function, cancel: Function, renew: Function, pollPaymentStatus: Function, loading: boolean, error: string | null, paymentStatus: string | null }}
 */
export const usePremiumSubscription = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const { refreshStatus } = usePremiumContext();
  const pollingIntervalRef = useRef(null);

  /**
   * Poll payment status for M-Pesa transactions
   * @param {string} checkoutRequestId - The checkout request ID from subscribe response
   * @param {Function} onSuccess - Callback when payment is successful
   * @param {Function} onTimeout - Callback when polling times out
   * @param {number} maxDuration - Maximum polling duration in ms (default: 120000 = 2 minutes)
   * @param {number} interval - Polling interval in ms (default: 3000 = 3 seconds)
   */
  const pollPaymentStatus = (
    checkoutRequestId,
    onSuccess,
    onTimeout,
    maxDuration = 120000,
    interval = 3000
  ) => {
    setPaymentStatus("pending");
    const startTime = Date.now();

    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Start polling
    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log(
          `[Polling] Checking payment status for ${checkoutRequestId}...`
        );
        const statusData = await premiumService.checkPaymentStatus(
          checkoutRequestId
        );
        console.log(`[Polling] Status received:`, statusData);

        if (statusData.status === "active") {
          // Payment successful!
          console.log("[Polling] Payment confirmed! Activating premium...");
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setPaymentStatus("active");
          await refreshStatus(); // Refresh premium status
          if (onSuccess) onSuccess(statusData);
        } else if (statusData.status === "cancelled") {
          // Payment cancelled
          console.log("[Polling] Payment was cancelled");
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setPaymentStatus("cancelled");
          setError("Payment was cancelled");
        } else {
          console.log(
            `[Polling] Status still pending (${statusData.status}), will check again in ${interval}ms`
          );
        }

        // Check timeout
        if (Date.now() - startTime > maxDuration) {
          console.log("[Polling] Timeout reached, stopping polling");
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setPaymentStatus("timeout");
          if (onTimeout) onTimeout();
        }
      } catch (err) {
        console.error("Error polling payment status:", err);
        // Continue polling on error (might be network issue)
      }
    }, interval);

    // Auto-cleanup after max duration
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        setPaymentStatus("timeout");
        if (onTimeout) onTimeout();
      }
    }, maxDuration);
  };

  /**
   * Stop polling payment status
   */
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const subscribe = async (paymentMethod = "mpesa", phoneNumber = null) => {
    setLoading(true);
    setError(null);
    setPaymentStatus(null);

    // Track analytics
    trackPremiumEvent.initiateSubscription(paymentMethod);

    try {
      const result = await premiumService.subscribe(paymentMethod, phoneNumber);

      // If Stripe and has checkoutUrl, return for redirect
      if (paymentMethod === "stripe" && result.checkoutUrl) {
        setLoading(false);
        return {
          success: true,
          data: result,
          checkoutUrl: result.checkoutUrl,
        };
      }

      // If M-Pesa and has checkoutRequestId, return for polling
      if (paymentMethod === "mpesa" && result.checkoutRequestId) {
        setLoading(false);
        return {
          success: true,
          data: result,
          requiresPolling: true,
          checkoutRequestId: result.checkoutRequestId,
        };
      }

      // For other payment methods or immediate success
      await refreshStatus();
      setLoading(false);

      // Track successful subscription
      trackPremiumEvent.subscriptionSuccess(paymentMethod, 200);

      return { success: true, data: result, requiresPolling: false };
    } catch (err) {
      const errorMessage = err.message || "Failed to subscribe to Nile Premium";
      setError(errorMessage);
      setLoading(false);

      // Track failure
      trackPremiumEvent.subscriptionFailed(paymentMethod, errorMessage);

      return { success: false, error: errorMessage };
    }
  };

  const cancel = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await premiumService.cancel();

      // Refresh premium status after cancellation
      await refreshStatus();

      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || "Failed to cancel subscription";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const renew = async (paymentMethod = "mpesa", phoneNumber = null) => {
    setLoading(true);
    setError(null);
    setPaymentStatus(null);

    try {
      const result = await premiumService.renew(paymentMethod, phoneNumber);

      // If M-Pesa and has checkoutRequestId, return for polling
      if (paymentMethod === "mpesa" && result.checkoutRequestId) {
        setLoading(false);
        return {
          success: true,
          data: result,
          requiresPolling: true,
          checkoutRequestId: result.checkoutRequestId,
        };
      }

      // For other payment methods or immediate success
      await refreshStatus();
      setLoading(false);

      return { success: true, data: result, requiresPolling: false };
    } catch (err) {
      const errorMessage = err.message || "Failed to renew subscription";
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  return {
    subscribe,
    cancel,
    renew,
    pollPaymentStatus,
    stopPolling,
    loading,
    error,
    paymentStatus,
  };
};
