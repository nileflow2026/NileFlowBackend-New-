/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../components/CartContext";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PickupAddressModal from "../../components/PickupAddressModal";
import axiosClient from "../../api";
import { loadStripe } from "@stripe/stripe-js";
import { createNotification } from "../../CustomerServices";
import { formatPrice } from "../../utils/priceFormatter";
import { usePremiumContext } from "../../Context/PremiumContext";
import premiumService from "../../utils/premiumService";
import {
  CreditCard,
  Wallet,
  Gift,
  Shield,
  Truck,
  CheckCircle,
  Lock,
  Sparkles,
  Crown,
  ShoppingBag,
  AlertCircle,
  Loader2,
  ChevronRight,
  Star,
  Package,
  Globe,
  Zap,
  ShieldCheck,
  Award,
  Smartphone,
  X,
  RefreshCcw,
} from "lucide-react";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";
import { useCurrency } from "../../Context/CurrencyProvider";

const stripePromise = loadStripe(
  "pk_test_51SYB9CJABwlNBb9PMEfcXqFA1OlYwpdVmKl3R1pcaRCvziYrTXsVjrjae3IZvDs7wMJzLZcTJqUURvoBZTt8Izbc00J9QDoAwq",
); // ⬅️ Replace with your key

const CheckoutPage = () => {
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const { isPremium } = usePremiumContext();
  const { currency } = useCurrency();
  const [selectedPayment, setSelectedPayment] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false); // Track if payment is being processed
  const [currentOrderId, setCurrentOrderId] = useState(null); // Store order ID for cancellation
  const [nileMilesData, setNileMilesData] = useState(null);
  const [redeemedReward, setRedeemedReward] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [premiumDiscountInfo, setPremiumDiscountInfo] = useState(null);
  const [milesInfo, setMilesInfo] = useState(null);
  const [appliedCode, setAppliedCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formFocused, setFormFocused] = useState(false);
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState("");
  const [mpesaProcessing, setMpesaProcessing] = useState(false);
  const [mpesaCheckoutRequestId, setMpesaCheckoutRequestId] = useState(null);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [showCodConfirmation, setShowCodConfirmation] = useState(false);
  const [codCountdown, setCodCountdown] = useState(10);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [hasRecentPickupAddress, setHasRecentPickupAddress] = useState(false);
  const navigate = useNavigate();

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  // Use same shipping logic as Cart page: 15 KES with free shipping over 100 KES
  const shipping = isPremium ? 0 : subtotal > 100 ? 0 : 15;

  // Timer for auto-redirect if payment takes too long
  const [paymentTimeout, setPaymentTimeout] = useState(30);
  const timeoutRef = useRef(null);

  // Check if user has pickup address when checkout loads
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const checkPickupAddress = async () => {
      try {
        // Always check the database first as the primary source of truth
        const { getPickupAddress } = await import("../../authServices");
        const pickupAddressResult = await getPickupAddress();

        if (pickupAddressResult.success && pickupAddressResult.hasAddress) {
          // User has a pickup address saved in database - this is the primary check
          console.log(
            "✅ User has pickup address in database (primary source)",
          );
          setHasRecentPickupAddress(true);
          setShowPickupModal(false);

          // Sync localStorage cache to match database state
          localStorage.setItem("recentPickupAddress", "true");
          localStorage.setItem("pickupAddressTimestamp", Date.now().toString());
        } else if (
          pickupAddressResult.success &&
          !pickupAddressResult.hasAddress
        ) {
          // Database confirms no pickup address exists
          console.log(
            "❌ No pickup address found in database (primary source)",
          );

          // Clear any stale localStorage data since database is authoritative
          localStorage.removeItem("recentPickupAddress");
          localStorage.removeItem("pickupAddressTimestamp");

          setHasRecentPickupAddress(false);
          setShowPickupModal(true);
        } else {
          // Database query failed - fallback to localStorage temporarily
          console.warn("⚠️ Database query failed, using localStorage fallback");
          const recentPickupAddress = localStorage.getItem(
            "recentPickupAddress",
          );
          const timestamp = localStorage.getItem("pickupAddressTimestamp");

          if (recentPickupAddress && timestamp) {
            const timeDiff = Date.now() - parseInt(timestamp);
            const isRecent = timeDiff < 24 * 60 * 60 * 1000; // 24 hours

            if (isRecent) {
              setHasRecentPickupAddress(true);
              setShowPickupModal(false);
            } else {
              localStorage.removeItem("recentPickupAddress");
              localStorage.removeItem("pickupAddressTimestamp");
              setHasRecentPickupAddress(false);
              setShowPickupModal(true);
            }
          } else {
            setHasRecentPickupAddress(false);
            setShowPickupModal(true);
          }
        }
      } catch (error) {
        console.error("Failed to check pickup address from database:", error);
        // On error, show modal to be safe
        setShowPickupModal(true);
      }
    };

    checkPickupAddress();
  }, [isAuthenticated, user]);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (authLoading) return;
      if (!isAuthenticated || !user) return;

      setLoading(true);

      try {
        const response = await axiosClient.get("/api/customerauth/preferences");
        console.log("User preferences loaded:", response.data);

        if (response.data?.preferredPaymentMethod) {
          setSelectedPayment(response.data.preferredPaymentMethod);
          setShowPaymentForm(false);
        }
      } catch (error) {
        console.error("Failed to fetch user preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPreferences();
  }, [user, isAuthenticated, authLoading]);

  // Fetch premium benefits
  useEffect(() => {
    const fetchPremiumBenefits = async () => {
      if (subtotal > 0) {
        try {
          // Only fetch discount and miles for premium users
          if (isPremium) {
            const discount = await premiumService.calculateDiscount(subtotal);
            setPremiumDiscountInfo(discount);

            // Calculate miles on subtotal - only for premium users
            const miles = await premiumService.calculateMiles(subtotal);
            setMilesInfo(miles);
          } else {
            setPremiumDiscountInfo(null);
            setMilesInfo(null);
          }
        } catch (error) {
          console.error("Error fetching premium benefits:", error);
        }
      } else {
        setPremiumDiscountInfo(null);
        setMilesInfo(null);
      }
    };

    fetchPremiumBenefits();
  }, [isPremium, subtotal]);

  // Apply discounts and calculate total with safeguards
  const premiumDiscountedSubtotal =
    isPremium && premiumDiscountInfo?.newTotal
      ? premiumDiscountInfo.newTotal
      : subtotal;

  // Only apply Nile Miles discount if there's actually a redeemed reward
  const validDiscountAmount =
    redeemedReward && discountAmount > 0 ? discountAmount : 0;

  // Apply Nile Miles discount to the already premium-discounted subtotal
  const finalSubtotal = Math.max(
    0,
    premiumDiscountedSubtotal - validDiscountAmount,
  );
  const total = Math.round((finalSubtotal + shipping) * 100) / 100; // Ensure 2 decimal precision

  // For display purposes, show original subtotal
  const formattedSubtotal = formatPrice(subtotal);
  const formattedShipping = formatPrice(shipping);
  const formattedTotal = formatPrice(total);

  useEffect(() => {
    console.log("useEffect triggered, user:", user);
    const fetchNileMiles = async () => {
      const uid = user?.id ?? user?.userId;
      console.log("User ID:", uid);
      if (!uid) {
        console.log("No user ID, skipping fetch");
        return;
      }
      try {
        console.log("Fetching Nile Miles for user:", uid);
        const res = await axiosClient.get(
          `/api/nilemiles/nilemiles/status?userId=${uid}`,
        );
        const data = res.data || {};
        let redeemedParsed = [];
        if (Array.isArray(data.redeemed)) {
          redeemedParsed = data.redeemed;
        } else if (typeof data.redeemed === "string") {
          try {
            const parsed = JSON.parse(data.redeemed);
            redeemedParsed = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            redeemedParsed = [];
          }
        }
        console.log("Raw API response data:", data);
        console.log("Raw redeemed field:", data.redeemed);
        console.log("Parsed redeemed rewards:", redeemedParsed);
        setNileMilesData({ ...data, redeemed: redeemedParsed });
      } catch (error) {
        console.error("Failed to load Nile Miles data:", error);
      }
    };
    fetchNileMiles();
  }, [user]);

  // Start payment timeout countdown
  useEffect(() => {
    if (processingPayment && paymentTimeout > 0) {
      timeoutRef.current = setInterval(() => {
        setPaymentTimeout((prev) => {
          if (prev <= 1) {
            clearInterval(timeoutRef.current);
            // Auto-cancel if payment takes too long
            handleAutoCancelPayment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [processingPayment]);

  const handleAutoCancelPayment = async () => {
    if (currentOrderId) {
      await cancelStripePayment(currentOrderId);
    }
    setProcessingPayment(false);
    setPaymentTimeout(30);
    alert("Payment timed out. Please try again.");
  };

  const handlePickupAddressSubmit = async (addressData) => {
    try {
      const { savePickupAddress } = await import("../../authServices");
      const result = await savePickupAddress(addressData);

      if (result.success) {
        console.log("✅ Pickup address saved successfully to database");

        // Store pickup address info in localStorage for faster subsequent checks
        localStorage.setItem("recentPickupAddress", "true");
        localStorage.setItem("pickupAddressTimestamp", Date.now().toString());

        // Update state
        setHasRecentPickupAddress(true);
        setShowPickupModal(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to save pickup address:", error);
      throw error;
    }
  };

  const handlePickupModalClose = () => {
    // Redirect to home if user tries to close without providing address
    navigate("/checkout");
  };

  const applyReward = () => {
    if (!nileMilesData || !nileMilesData.redeemed) {
      setErrorMessage("No redeemed rewards available.");
      return;
    }
    const availableRewards = nileMilesData.redeemed || [];
    const rewardToApply = availableRewards.find(
      (r) => r.rewardName === appliedCode,
    );

    if (!rewardToApply) {
      setErrorMessage("Invalid or already used reward code.");
      return;
    }

    let discount = 0;
    if (rewardToApply.rewardName === "Free Delivery") {
      discount = shipping;
    } else if (rewardToApply.rewardName === "5% Off") {
      discount = subtotal * 0.05;
    }
    setRedeemedReward(rewardToApply);
    setDiscountAmount(discount);
    setErrorMessage("");
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    if (!imagePath.startsWith("http")) {
      return `https://media.croma.com/image/upload/${imagePath.split("?")[0]}`;
    }
    return imagePath;
  };

  const handlePaymentChange = (paymentMethod) => {
    setSelectedPayment(paymentMethod);
  };

  const confirmPaymentSelection = async () => {
    if (!selectedPayment) {
      alert("Please select a payment method");
      return;
    }

    try {
      await axiosClient.put("/api/customerauth/preferences", {
        preferredPaymentMethod: selectedPayment,
      });
      console.log("Payment preference saved");
    } catch (error) {
      console.error("Failed to save payment preference:", error);
    }

    setShowPaymentForm(false);
  };

  // Function to mark reward as used
  const markRewardAsUsed = async (rewardName) => {
    const uid = user?.id ?? user?.userId;
    if (!uid || !rewardName) return;

    try {
      console.log("Marking reward as used:", rewardName);
      const response = await axiosClient.post(
        "/api/nilemiles/mark-reward-used",
        {
          userId: uid,
          redeemedRewardName: rewardName,
        },
      );
      console.log("✅ Reward marked as used:", response.data);
    } catch (error) {
      console.error("Failed to mark reward as used:", error);
      console.error("Error details:", error.response?.data);
    }
  };

  // Function to cancel Stripe payment and restore stock
  const cancelStripePayment = async (orderId) => {
    try {
      console.log("🔄 Cancelling payment for order:", orderId);

      const response = await axiosClient.post(
        "/api/payments/stripe-cancelled",
        {
          orderId,
          reason: "user_cancelled",
        },
      );

      if (response.data.success) {
        console.log("✅ Payment cancelled and stock restored");
        return true;
      } else {
        console.error("❌ Failed to cancel payment:", response.data.message);
        return false;
      }
    } catch (error) {
      console.error("❌ Error cancelling payment:", error);
      return false;
    }
  };

  // Function to cancel Cash on Delivery order
  const cancelCodOrder = async (orderId) => {
    try {
      console.log("🔄 Cancelling COD order:", orderId);

      const response = await axiosClient.post(
        "/api/payments/cash-on-delivery/cancel",
        {
          orderId,
        },
      );

      if (response.data.success) {
        console.log("✅ COD order cancelled successfully");
        return true;
      } else {
        console.error("❌ Failed to cancel COD order:", response.data.message);
        alert(response.data.message || "Failed to cancel order");
        return false;
      }
    } catch (error) {
      console.error("❌ Error cancelling COD order:", error);

      // Handle specific error messages
      if (error.response?.status === 404) {
        alert("Order not found. It may have already been processed.");
      } else if (error.response?.status === 400) {
        alert(error.response?.data?.message || "Cannot cancel this order.");
      } else {
        alert("Failed to cancel order. Please try again or contact support.");
      }

      return false;
    }
  };

  const handleCancelPayment = async () => {
    // If COD order hasn't been placed yet (still in confirmation), just close modal
    if (showCodConfirmation && !currentOrderId) {
      // Clear countdown interval
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
      setShowCodConfirmation(false);
      setCodCountdown(10);
      alert("Order cancelled. You can checkout again when ready.");
      return;
    }

    if (!currentOrderId) {
      alert("No active payment to cancel.");
      return;
    }

    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmCancel) return;

    setLoading(true);

    try {
      let cancelled = false;

      // Check which payment method to cancel
      if (selectedPayment === "card") {
        cancelled = await cancelStripePayment(currentOrderId);
      } else if (selectedPayment === "cashOnDelivery") {
        cancelled = await cancelCodOrder(currentOrderId);
      } else {
        alert("Cancellation not supported for this payment method yet.");
        setLoading(false);
        return;
      }

      if (cancelled) {
        alert(
          "Order cancelled successfully. Your items have been restored to stock.",
        );
        setProcessingPayment(false);
        setShowCodConfirmation(false);
        setCurrentOrderId(null);
        setPaymentTimeout(30);
        setCodCountdown(10);

        // Clear timeout interval
        if (timeoutRef.current) {
          clearInterval(timeoutRef.current);
        }
      } else {
        alert("Failed to cancel order. Please contact support.");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("An error occurred while cancelling the order.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodConfirmation = async () => {
    // Clear countdown interval
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current);
    }

    setLoading(true);

    try {
      // Use the already-calculated total (discounts already applied)
      console.log("💰 Placing Cash on Delivery order after confirmation");

      const response = await axiosClient.post(
        "/api/payments/cash-on-delivery",
        {
          cart,
          userId: user.id,
          customerEmail: user.email,
          username: user.username || user.email,
          paymentMethod: "Cash on Delivery",
          totalAmount: total.toFixed(2),
          subtotal: subtotal.toFixed(2),
          shipping: shipping.toFixed(2),
          deliveryFee: shipping.toFixed(2),
          shippingFee: shipping.toFixed(2),
          discountAmount: validDiscountAmount.toFixed(2),
          isPremium: isPremium,
          premiumDiscount: premiumDiscountInfo?.discountAmount || 0,
          currency: currency || "KES",
          status: "pending",
        },
      );

      console.log("✅ Order Response:", response.data);

      if (response.data.success) {
        const orderId = response.data.orderId;

        // Store order ID for reference
        if (orderId) {
          setCurrentOrderId(orderId);
        }

        // Mark reward as used if one was applied
        if (redeemedReward && redeemedReward.rewardName) {
          await markRewardAsUsed(redeemedReward.rewardName);
        }

        setShowCodConfirmation(false);

        // Clear cart (wrap in try-catch in case backend already cleared it)
        try {
          await clearCart();
        } catch (error) {
          console.warn("Cart may have already been cleared:", error);
          // Continue anyway - this is not critical
        }

        navigate("/orders");
      } else {
        alert("Failed to create order. Please try again.");
        setShowCodConfirmation(false);
      }
    } catch (error) {
      console.error("Error placing COD order:", error);
      alert(
        error.response?.data?.error ||
          "An error occurred during checkout. Please try again.",
      );
      setShowCodConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleMpesaPayment = async () => {
    if (!mpesaPhoneNumber) {
      alert("Please enter your M-Pesa phone number");
      return;
    }

    // Validate phone number format
    const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
    if (!phoneRegex.test(mpesaPhoneNumber)) {
      alert(
        "Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)",
      );
      return;
    }

    setMpesaProcessing(true);
    setLoading(true);

    try {
      // Use the already-calculated total (discounts already applied)
      console.log("💰 Processing M-Pesa payment");

      // Store reward info for use after payment success
      if (redeemedReward && redeemedReward.rewardName) {
        localStorage.setItem(
          "pendingRewardToMark",
          JSON.stringify({
            userId: user.id ?? user.userId,
            rewardName: redeemedReward.rewardName,
          }),
        );
      }

      const response = await axiosClient.post("/api/payments/mpesa/initiate", {
        phoneNumber: mpesaPhoneNumber,
        amount: total.toFixed(2),
        accountReference: `ORDER-${Date.now()}`,
        transactionDesc: `Payment for ${cart.length} items`,
        userId: user.id || user.userId,
        cart,
        customerEmail: user.email,
        username: user.username || user.email,
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
        deliveryFee: shipping.toFixed(2),
        shippingFee: shipping.toFixed(2),
        discountAmount: validDiscountAmount.toFixed(2),
        isPremium: isPremium,
        premiumDiscount: premiumDiscountInfo?.discountAmount || 0,
        currency: currency || "KES",
      });

      if (response.data.success) {
        const { orderId, checkoutRequestId } = response.data;
        setCurrentOrderId(orderId);
        setMpesaCheckoutRequestId(checkoutRequestId);
        setShowMpesaModal(true);

        // Start polling for payment status
        pollMpesaPaymentStatus(orderId, checkoutRequestId);
      } else {
        alert(response.data.message || "Failed to initiate M-Pesa payment");
        setMpesaProcessing(false);
      }
    } catch (error) {
      console.error("M-Pesa payment error:", error);

      let errorMessage = "Failed to initiate M-Pesa payment. Please try again.";

      // Provide specific error messages based on the error
      if (error.response?.status === 500) {
        errorMessage =
          "M-Pesa service is temporarily unavailable. Please try again later or use a different payment method.";
      } else if (error.response?.status === 400) {
        const responseMessage = error.response?.data?.message || "";

        // Check for specific M-Pesa error messages
        if (
          responseMessage.includes("Invalid CallBackURL") ||
          responseMessage.includes("callback")
        ) {
          errorMessage =
            "Payment system configuration error. Please contact support or try a different payment method.";
        } else {
          errorMessage =
            responseMessage ||
            "Invalid payment details. Please check your phone number and try again.";
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      alert(errorMessage);
      setMpesaProcessing(false);
    } finally {
      setLoading(false);
    }
  };

  const pollMpesaPaymentStatus = async (orderId, checkoutRequestId) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for 2 minutes (60 * 2 seconds)

    const pollInterval = setInterval(async () => {
      attempts++;

      try {
        const response = await axiosClient.get(
          `/api/payments/mpesa/status/${orderId}`,
        );
        const { paymentStatus, orderStatus } = response.data;

        if (paymentStatus === "succeeded" && orderStatus === "Ordered") {
          clearInterval(pollInterval);
          setMpesaProcessing(false);
          setShowMpesaModal(false);

          // Mark reward as used if one was applied
          const pendingReward = localStorage.getItem("pendingRewardToMark");
          if (pendingReward) {
            const { rewardName } = JSON.parse(pendingReward);
            await markRewardAsUsed(rewardName);
            localStorage.removeItem("pendingRewardToMark");
          }

          alert("Payment successful! Your order has been confirmed.");

          // Clear cart (wrap in try-catch in case backend already cleared it)
          try {
            await clearCart();
          } catch (error) {
            console.warn("Cart may have already been cleared:", error);
            // Continue anyway - this is not critical
          }

          navigate("/orders");
        } else if (paymentStatus === "failed") {
          clearInterval(pollInterval);
          setMpesaProcessing(false);
          setShowMpesaModal(false);

          // Get failure reason if available
          const failureReason =
            response.data.failureReason || "Payment was not completed";
          alert(`M-Pesa payment failed: ${failureReason}`);

          // Clear pending reward if payment failed
          localStorage.removeItem("pendingRewardToMark");
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setMpesaProcessing(false);
          setShowMpesaModal(false);
          alert(
            "Payment verification timeout. Please check your orders page or contact support.",
          );
        }
      } catch (error) {
        console.error("Error checking M-Pesa status:", error);

        // If it's a specific error about order status, handle gracefully
        if (error.response?.status === 404) {
          console.warn("Order not found, continuing to poll...");
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setMpesaProcessing(false);
          setShowMpesaModal(false);
        }
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleCheckout = async (e) => {
    if (e) e.preventDefault();

    if (!selectedPayment) {
      alert("Please select a payment method before continuing.");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (!isAuthenticated || !user) {
      alert(
        "Please create an account or sign in to complete your order. Your cart items will be saved!",
      );
      navigate("/signup");
      return;
    }

    if (!user.email) {
      alert("Invalid user data. Please log in again.");
      return;
    }

    // Handle M-Pesa payment separately
    if (selectedPayment === "mpesa") {
      handleMpesaPayment();
      return;
    }

    setLoading(true);

    console.log("🔥 handleCheckout - selectedPayment:", selectedPayment);

    try {
      // Use the already-calculated total (discounts already applied)
      console.log("💰 Processing checkout with total:", total.toFixed(2));

      if (selectedPayment === "cashOnDelivery") {
        console.log("💰 Showing COD confirmation");

        // Show confirmation modal FIRST (don't place order yet)
        setShowCodConfirmation(true);
        setCodCountdown(10);
        setLoading(false);

        // Start countdown timer
        const countdownInterval = setInterval(() => {
          setCodCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              // Auto-place order after countdown
              handleCodConfirmation();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Store interval ref for cleanup
        timeoutRef.current = countdownInterval;
      } else if (selectedPayment === "other") {
        alert("Digital Wallet payment coming soon!");
      } else if (selectedPayment === "card") {
        console.log("💳 Processing Stripe payment");

        // Store reward info in localStorage for use after payment success
        if (redeemedReward && redeemedReward.rewardName) {
          localStorage.setItem(
            "pendingRewardToMark",
            JSON.stringify({
              userId: user.id ?? user.userId,
              rewardName: redeemedReward.rewardName,
            }),
          );
        }

        // Set processing state BEFORE calling API
        setProcessingPayment(true);
        setLoading(false); // Don't show loading spinner, show cancel button instead

        console.log("💳 Processing Stripe payment");

        const apiResponse = await axiosClient.post(
          "/api/payments/stripewebpayment",
          {
            cart,
            userId: user.id,
            customerEmail: user.email,
            username: user.username || user.email,
            paymentMethod: selectedPayment,
            totalAmount: total.toFixed(2),
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            deliveryFee: shipping.toFixed(2),
            shippingFee: shipping.toFixed(2),
            discountAmount: validDiscountAmount.toFixed(2),
            isPremium: isPremium,
            premiumDiscount: premiumDiscountInfo?.discountAmount || 0,
          },
        );

        const { sessionId, orderId } = apiResponse.data;

        if (!sessionId || !orderId) {
          throw new Error(
            "Invalid response from server. Missing sessionId or orderId.",
          );
        }

        // Store order ID for potential cancellation
        setCurrentOrderId(orderId);

        // Start payment timeout countdown
        setPaymentTimeout(30);

        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({ sessionId });

        if (error) {
          console.error("Stripe Redirect Error:", error);
          alert(`Payment failed: ${error.message}`);
          setProcessingPayment(false);
          setCurrentOrderId(null);
        }
      } else {
        alert(`Payment method "${selectedPayment}" is not yet supported.`);
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      setProcessingPayment(false);
      setCurrentOrderId(null);

      if (error.response?.status === 401) {
        alert("Your session has expired. Please log in again.");
      } else {
        alert(
          error.response?.data?.error ||
            "An error occurred during checkout. Please try again.",
        );
      }
    } finally {
      if (selectedPayment !== "card") {
        setLoading(false);
      }
    }
  };

  if (loading && !cart.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-10 h-10 text-amber-500 animate-pulse" />
          </div>
        </div>
        <h3 className="mt-6 text-2xl font-bold text-amber-200">
          Loading Checkout
        </h3>
        <p className="text-gray-400 mt-2">
          Preparing your premium African treasures...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #d97706 0%, #b45309 100%);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
        }
      `}</style>
      <Header />

      {/* Payment Processing Overlay */}
      {processingPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-amber-800/50 rounded-3xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CreditCard className="w-12 h-12 text-amber-500 animate-pulse" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-amber-200 mb-2">
                Processing Payment
              </h2>
              <p className="text-gray-300 mb-4">
                Please complete your payment in the Stripe window
              </p>

              <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-800/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-100">Time remaining:</span>
                  <span className="text-amber-300 font-bold">
                    {paymentTimeout}s
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(paymentTimeout / 30) * 100}%` }}
                  ></div>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-6">
                If the payment window doesn't appear, check your pop-up blocker.
              </p>

              <button
                onClick={handleCancelPayment}
                disabled={loading}
                className="group w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Cancel Payment</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-amber-400 hover:text-amber-300 text-sm flex items-center justify-center space-x-1 w-full"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Refresh Page</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <Lock className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Secure Checkout
            </span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Finalize Order
            </span>
            <br />
            <span className="text-white">Premium African Treasures</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Complete your purchase securely. Your authentic African products are
            just a step away.
          </p>
        </div>
      </div>

      {/* Main Checkout Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Order Summary & Nile Miles */}
            <div className="lg:col-span-2 space-y-8">
              {/* Order Summary */}
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-amber-800/30">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-amber-200">
                          Order Summary
                        </h2>
                        <p className="text-amber-100/70">
                          {cart.length} premium items
                        </p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-amber-700/30">
                      <span className="text-amber-200 font-bold">Secure</span>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl"
                      >
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={getImageUrl(item.productImage || item.image)}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-amber-100 truncate">
                            {item.productName}
                          </h3>
                          <p className="text-amber-100/70 text-sm">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-amber-300">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          <p className="text-amber-100/50 text-sm">
                            {formatPrice(item.price)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-amber-800/30">
                      <span className="text-amber-100">Subtotal</span>
                      <span className="text-amber-300 font-bold text-lg">
                        {formattedSubtotal}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-amber-800/30">
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-100">Shipping</span>
                        {isPremium && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-lg border border-purple-500/30">
                            <Crown className="w-3 h-3 text-purple-300" />
                            <span className="text-xs text-purple-200">
                              Premium
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-amber-300 font-bold text-lg">
                        {shipping === 0 ? "FREE" : formattedShipping}
                      </span>
                    </div>

                    {/* Premium Discount */}
                    {isPremium &&
                      premiumDiscountInfo &&
                      premiumDiscountInfo.discountAmount > 0 && (
                        <div className="flex items-center justify-between py-3 border-b border-amber-800/30 bg-gradient-to-r from-purple-900/10 to-blue-900/10 -mx-4 px-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                            <span className="text-purple-200 font-medium">
                              Premium Discount (
                              {premiumDiscountInfo.discountPercentage}%)
                            </span>
                          </div>
                          <span className="text-emerald-400 font-bold text-lg">
                            -{formatPrice(premiumDiscountInfo.discountAmount)}
                          </span>
                        </div>
                      )}

                    {/* Premium Discount Threshold Message */}
                    {isPremium && subtotal < 500 && (
                      <div className="py-3 border-b border-amber-800/30">
                        <div className="flex items-center space-x-2 text-purple-200/70 text-sm">
                          <Crown className="w-4 h-4 text-purple-400" />
                          <span>
                            Add {formatPrice(500 - subtotal)} more for 5%
                            premium discount
                          </span>
                        </div>
                      </div>
                    )}
                    {isPremium && subtotal >= 500 && subtotal < 1000 && (
                      <div className="py-3 border-b border-amber-800/30">
                        <div className="flex items-center space-x-2 text-purple-200/70 text-sm">
                          <Crown className="w-4 h-4 text-purple-400" />
                          <span>
                            Add {formatPrice(1000 - subtotal)} more for 10%
                            premium discount
                          </span>
                        </div>
                      </div>
                    )}

                    {redeemedReward && (
                      <div className="flex items-center justify-between py-3 border-b border-amber-800/30">
                        <span className="text-emerald-100 flex items-center space-x-2">
                          <Gift className="w-4 h-4" />
                          <span>Reward: {redeemedReward.rewardName}</span>
                        </span>
                        <span className="text-emerald-300 font-bold text-lg">
                          -{formatPrice(discountAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-4 border-t border-amber-500/30">
                      <span className="text-amber-100 text-xl">Total</span>
                      <span className="text-amber-300 font-bold text-3xl">
                        {formatPrice(total)}
                      </span>
                    </div>

                    {/* Nile Miles Preview */}
                    {isPremium && milesInfo && milesInfo.actualMiles > 0 && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-amber-900/20 to-orange-900/20 backdrop-blur-sm border border-amber-700/30 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Award className="w-5 h-5 text-amber-400" />
                            <span className="text-amber-200 font-medium">
                              You'll earn
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-amber-300">
                              {Math.round(milesInfo.actualMiles)}
                            </span>
                            <span className="text-amber-200">Nile Miles</span>
                            {isPremium && milesInfo.multiplier > 1 && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                                <Zap className="w-3 h-3 text-white" />
                                <span className="text-xs text-white font-bold">
                                  2x
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {isPremium && milesInfo.multiplier > 1 && (
                          <p className="text-amber-100/70 text-sm mt-2">
                            Base: {Math.round(milesInfo.baseMiles)} miles •
                            Bonus: {Math.round(milesInfo.bonus)} miles
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-emerald-200">
                        Redeem Nile Miles
                      </h2>
                      <p className="text-emerald-100/70">
                        Apply your rewards for exclusive discounts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 bg-gradient-to-r from-emerald-900/40 to-green-900/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-700/30">
                    <Crown className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-200">
                      Premium
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative mb-4">
                <div
                  className={`absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl blur ${
                    formFocused ? "opacity-75" : "opacity-25"
                  } transition-opacity duration-300`}
                ></div>
                <div className="relative flex bg-gray-900/50 rounded-2xl overflow-hidden border border-amber-800/30">
                  <div className="pl-5 pr-3 flex items-center">
                    <Award className="w-5 h-5 text-emerald-400" />
                  </div>
                  <select
                    value={appliedCode}
                    onChange={(e) => setAppliedCode(e.target.value)}
                    onFocus={() => setFormFocused(true)}
                    onBlur={() => setFormFocused(false)}
                    className="flex-1 px-4 py-4 bg-transparent text-amber-100 focus:outline-none"
                  >
                    <option
                      value=""
                      className="bg-gray-900 text-amber-100"
                      disabled
                    >
                      Select a reward
                    </option>
                    {(nileMilesData?.redeemed || [])
                      .filter((r) => !r.used)
                      .map((r) => (
                        <option
                          key={r.rewardName}
                          value={r.rewardName}
                          className="bg-gray-900 text-amber-100"
                        >
                          {r.rewardName}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={applyReward}
                    className="px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300"
                  >
                    Apply Reward
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-gradient-to-r from-red-900/30 to-amber-900/30 backdrop-blur-sm border border-red-700/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-200">{errorMessage}</p>
                  </div>
                </div>
              )}

              {redeemedReward && (
                <div className="bg-gradient-to-r from-emerald-900/30 to-green-900/20 backdrop-blur-sm border border-emerald-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                      <div>
                        <p className="font-bold text-emerald-100">
                          {redeemedReward.rewardName} Applied!
                        </p>
                        <p className="text-emerald-100/70 text-sm">
                          You saved {formatPrice(discountAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-900/40 to-green-900/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-700/30">
                      <span className="text-xs font-bold text-emerald-200">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Nile Miles Redemption */}

              {nileMilesData?.redeemed && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-amber-200 mb-3">
                    🎁 Your Available Rewards
                  </h3>
                  <div className="space-y-2">
                    {nileMilesData.redeemed
                      .filter((r) => !r.used)
                      .map((reward, index) => {
                        const isApplied =
                          redeemedReward?.rewardName === reward.rewardName;
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              setAppliedCode(reward.rewardName);

                              // Apply the reward
                              const availableRewards =
                                nileMilesData.redeemed || [];
                              const rewardToApply = availableRewards.find(
                                (r) => r.rewardName === reward.rewardName,
                              );

                              if (rewardToApply) {
                                let discount = 0;
                                if (
                                  rewardToApply.rewardName === "Free Delivery"
                                ) {
                                  discount = shipping;
                                } else if (
                                  rewardToApply.rewardName === "5% Discount"
                                ) {
                                  discount = subtotal * 0.05;
                                } else if (
                                  rewardToApply.rewardName === "Premium Access"
                                ) {
                                  discount = subtotal * 0.1; // 10% for premium access
                                }
                                setRedeemedReward(rewardToApply);
                                setDiscountAmount(discount);
                                setErrorMessage("");
                              }
                            }}
                            className={`w-full transition-all duration-300 text-left ${
                              isApplied
                                ? "bg-gradient-to-r from-emerald-900/60 to-green-900/50 border-2 border-emerald-500 shadow-lg shadow-emerald-500/30"
                                : "bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 hover:border-emerald-600/50 hover:shadow-lg hover:shadow-emerald-600/20"
                            } rounded-xl p-3`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Gift
                                  className={`w-5 h-5 ${
                                    isApplied
                                      ? "text-emerald-300"
                                      : "text-amber-400"
                                  }`}
                                />
                                <div className="min-w-0">
                                  <p
                                    className={`text-sm font-semibold ${
                                      isApplied
                                        ? "text-emerald-200"
                                        : "text-amber-100"
                                    } truncate`}
                                  >
                                    {reward.rewardName}
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      isApplied
                                        ? "text-emerald-300"
                                        : "text-amber-100/60"
                                    }`}
                                  >
                                    Redeemed{" "}
                                    {new Date(reward.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              {isApplied && (
                                <CheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                  {nileMilesData.redeemed.filter((r) => !r.used).length ===
                    0 && (
                    <p className="text-center text-amber-100/60 text-sm py-4">
                      No rewards available. Redeem miles to unlock rewards!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Payment Information */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden sticky top-8">
                <div className="p-8 border-b border-amber-800/30">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-blue-200">
                          Payment
                        </h2>
                        <p className="text-blue-100/70">
                          Select your payment method
                        </p>
                      </div>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-amber-400" />
                  </div>

                  {showPaymentForm ? (
                    <div>
                      <div className="space-y-3">
                        {[
                          {
                            value: "card",
                            label: "Credit/Debit Card",
                            icon: CreditCard,
                            color: "from-blue-600 to-blue-700",
                            comingSoon: true,
                          },
                          {
                            value: "mpesa",
                            label: "M-Pesa",
                            icon: Smartphone,
                            color: "from-green-600 to-emerald-700",
                            comingSoon: true,
                          },
                          {
                            value: "cashOnDelivery",
                            label: "Cash on Delivery",
                            icon: Wallet,
                            color: "from-amber-600 to-amber-700",
                            comingSoon: false,
                          },
                          {
                            value: "other",
                            label: "Digital Wallet",
                            icon: Smartphone,
                            color: "from-purple-600 to-purple-700",
                            comingSoon: true,
                          },
                        ].map((method) => (
                          <div key={method.value}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.value}
                              id={method.value}
                              checked={selectedPayment === method.value}
                              onChange={() => handlePaymentChange(method.value)}
                              disabled={method.comingSoon}
                              className="hidden"
                            />
                            <label
                              htmlFor={method.value}
                              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                                method.comingSoon
                                  ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-gray-700/30 text-gray-500 opacity-60 cursor-not-allowed"
                                  : selectedPayment === method.value
                                    ? `bg-gradient-to-r ${method.color} border-transparent text-white shadow-lg`
                                    : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-amber-100 hover:border-amber-500/50"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    method.comingSoon
                                      ? "bg-gray-700/50"
                                      : selectedPayment === method.value
                                        ? "bg-white/20"
                                        : "bg-gradient-to-br from-gray-800 to-black"
                                  }`}
                                >
                                  <method.icon className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold">
                                    {method.label}
                                  </span>
                                  {method.comingSoon && (
                                    <span className="text-xs text-gray-400 font-normal">
                                      Coming Soon
                                    </span>
                                  )}
                                </div>
                              </div>
                              {selectedPayment === method.value && !method.comingSoon && (
                                <CheckCircle className="w-5 h-5" />
                              )}
                              {method.comingSoon && (
                                <div className="bg-gray-600/50 text-gray-400 text-xs px-2 py-1 rounded-full">
                                  Soon
                                </div>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={confirmPaymentSelection}
                        disabled={!selectedPayment}
                        className="group w-full mt-8 px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Lock className="w-5 h-5" />
                        <span>Confirm Payment Method</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-6">
                        <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 backdrop-blur-sm border border-amber-700/30 rounded-xl p-4">
                          <p className="text-amber-100 mb-2">
                            Your selected payment method:
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                                {selectedPayment === "cashOnDelivery" ? (
                                  <Wallet className="w-5 h-5 text-white" />
                                ) : selectedPayment === "card" ? (
                                  <CreditCard className="w-5 h-5 text-white" />
                                ) : selectedPayment === "mpesa" ? (
                                  <Smartphone className="w-5 h-5 text-white" />
                                ) : selectedPayment === "paypal" ? (
                                  <Wallet className="w-5 h-5 text-white" />
                                ) : (
                                  <Smartphone className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <span className="font-bold text-amber-300 capitalize">
                                {selectedPayment === "cashOnDelivery"
                                  ? "Cash on Delivery"
                                  : selectedPayment === "card"
                                    ? "Credit/Debit Card"
                                    : selectedPayment === "mpesa"
                                      ? "M-Pesa"
                                      : selectedPayment === "paypal"
                                        ? "PayPal"
                                        : "Digital Wallet"}
                              </span>
                            </div>
                            <button
                              onClick={() => setShowPaymentForm(true)}
                              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* M-Pesa Phone Number Input */}
                      {selectedPayment === "mpesa" && (
                        <div className="mb-6">
                          <label className="block text-amber-200 font-semibold mb-3">
                            M-Pesa Phone Number
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Smartphone className="w-5 h-5 text-emerald-400" />
                            </div>
                            <input
                              type="tel"
                              value={mpesaPhoneNumber}
                              onChange={(e) =>
                                setMpesaPhoneNumber(e.target.value)
                              }
                              placeholder="e.g., 0712345678 or 254712345678"
                              className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-gray-900/80 to-black/80 border border-emerald-700/50 rounded-xl text-amber-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </div>
                          <p className="mt-2 text-xs text-gray-400">
                            Enter your M-Pesa registered phone number. You'll
                            receive an STK push prompt to complete the payment.
                          </p>
                        </div>
                      )}

                      <button
                        onClick={handleCheckout}
                        disabled={loading || processingPayment}
                        className="group w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : processingPayment ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Payment in Progress...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>Confirm & Place Order</span>
                            <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </>
                        )}
                      </button>

                      {/* Cancel button that appears when processing payment */}
                      {processingPayment && (
                        <button
                          onClick={handleCancelPayment}
                          className="group w-full mt-4 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center justify-center space-x-2"
                        >
                          <X className="w-5 h-5" />
                          <span>Cancel Payment</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="p-6 bg-gradient-to-r from-gray-900/50 to-black/50 border-t border-amber-800/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <Lock className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs text-emerald-100">
                        256-bit SSL Secure
                      </p>
                    </div>
                    <div className="text-center">
                      <Shield className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-xs text-blue-100">Payment Protected</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Protection */}
              <div className="mt-6 bg-gradient-to-br from-emerald-900/20 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-3xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-lg font-bold text-emerald-200">
                    Order Protection
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-100">
                      Authenticity Guarantee
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-100">
                      30-Day Returns
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-100">
                      Premium Support
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* M-Pesa Processing Modal */}
      {showMpesaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-emerald-800/50 rounded-3xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 border-4 border-emerald-900/30 border-t-emerald-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Smartphone className="w-12 h-12 text-emerald-500 animate-pulse" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-emerald-200 mb-2">
                Complete M-Pesa Payment
              </h2>
              <p className="text-gray-300 mb-4">
                Check your phone for the M-Pesa payment prompt
              </p>

              <div className="bg-gradient-to-r from-emerald-900/30 to-green-900/20 border border-emerald-800/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-100 font-semibold">
                    {mpesaPhoneNumber}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">
                  Enter your M-Pesa PIN on your phone to confirm payment
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center space-x-2 text-left">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Check your phone for M-Pesa prompt
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-left">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <p className="text-gray-300 text-sm">Enter your M-Pesa PIN</p>
                </div>
                <div className="flex items-center space-x-2 text-left">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <p className="text-gray-300 text-sm">Wait for confirmation</p>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-6">
                {mpesaProcessing
                  ? "Processing your payment..."
                  : "Waiting for payment confirmation..."}
              </p>

              <button
                onClick={() => {
                  setShowMpesaModal(false);
                  setMpesaProcessing(false);
                }}
                disabled={loading}
                className="group w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Cancel & Go Back</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash on Delivery Confirmation Modal */}
      {showCodConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-amber-800/50 rounded-3xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center">
                  <CheckCircle className="w-16 h-16 text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-amber-200 mb-2">
                Confirm Your Order
              </h2>
              <p className="text-gray-300 mb-4">
                Review your Cash on Delivery order before placing it
              </p>

              <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-800/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-100 font-semibold">
                    Total: {formatPrice(total)}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">
                  Pay when your order is delivered
                </p>
              </div>

              <div className="bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-100">Placing order in:</span>
                  <span className="text-amber-300 font-bold text-2xl">
                    {codCountdown}s
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(codCountdown / 10) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={handleCodConfirmation}
                  disabled={loading}
                  className="group w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Confirm & Place Order</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  onClick={handleCancelPayment}
                  disabled={loading}
                  className="group w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                  <span>Cancel</span>
                </button>
              </div>

              <p className="text-gray-400 text-xs">
                Order will be placed automatically in {codCountdown} seconds
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Address Modal */}
      <PickupAddressModal
        isOpen={showPickupModal}
        onClose={handlePickupModalClose}
        onSubmit={handlePickupAddressSubmit}
      />

      <Footer />
    </div>
  );
};

export default CheckoutPage;
