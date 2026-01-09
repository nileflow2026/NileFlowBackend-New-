/* eslint-disable no-unused-vars */

import axiosClient from "./api";

/**
 * Generate or retrieve device ID for token scoping
 */
const getDeviceId = () => {
  let deviceId = sessionStorage.getItem("customerDeviceId");
  if (!deviceId) {
    deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("customerDeviceId", deviceId);
  }
  return deviceId;
};

/**
 * Get device name (browser + OS info)
 */
const getDeviceName = () => {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";

  // Browser detection
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  // OS detection
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS")) os = "iOS";

  return `${browser} on ${os}`;
};

/**
 * Signup - Create new customer account
 * Tokens are set as httpOnly cookies by backend
 */
export const signUpCustomer = async (
  email,
  password,
  username,
  phone,
  deviceId
) => {
  try {
    const generatedDeviceId = deviceId || getDeviceId();

    const response = await axiosClient.post(
      "/api/customerauth/signup/customer",
      {
        email,
        password,
        username,
        phone,
        deviceId: generatedDeviceId,
      }
    );

    console.log("✅ Signup successful for:", email);
    return { success: true, data: response.data, verificationNeeded: true };
  } catch (error) {
    console.error(
      "Signup error:",
      error.response?.data?.error || error.message
    );
    return {
      success: false,
      error: error.response?.data?.error || "Signup failed. Please try again.",
    };
  }
};

/**
 * Signin - Authenticate customer
 * Tokens are set as httpOnly cookies by backend
 */
export const signInCustomer = async (email, password, rememberMe = false) => {
  try {
    const deviceId = getDeviceId();

    console.log("Attempting to sign in user:", email);
    const response = await axiosClient.post(
      "/api/customerauth/signin/customer",
      {
        email,
        password,
        deviceId,
      }
    );

    // Store tokens based on remember me preference
    const storage = rememberMe ? localStorage : sessionStorage;
    if (response.data.accessToken) {
      storage.setItem("accessToken", response.data.accessToken);
    }
    if (response.data.refreshToken) {
      storage.setItem("refreshToken", response.data.refreshToken);
    }

    // Clear guest status upon successful login
    localStorage.removeItem("isGuest");

    console.log("✅ Signin successful for user:", email);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(
      "Signin error:",
      error.response?.data?.error || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.error ||
        "Signin failed. Please check your credentials.",
    };
  }
};

/**
 * Refresh tokens - Get new access token using refresh token
 * Tokens are automatically sent via httpOnly cookies
 */
export const refreshSession = async () => {
  try {
    const deviceId = getDeviceId();

    const response = await axiosClient.post("/api/customerauth/refresh", {
      deviceId,
    });

    console.log("[Auth] Token refreshed successfully");
    return { success: true, data: response.data };
  } catch (error) {
    console.error(
      "[Auth] Failed to refresh token:",
      error.response?.data?.error || error.message
    );
    return {
      success: false,
      error: error.response?.data?.error || "Token refresh failed.",
    };
  }
};

/**
 * Verify Account - Verify customer email with verification code
 * Tokens are set as httpOnly cookies by backend
 */
export const verifyAccount = async (email, verificationCode) => {
  try {
    const deviceId = getDeviceId();

    console.log("Attempting to verify account for:", email);
    const response = await axiosClient.post("/api/customerauth/verify", {
      email,
      verificationCode,
      deviceId, // Include deviceId for consistency with your other endpoints
    });

    // Backend sets tokens as httpOnly cookies automatically
    // No need to store tokens in localStorage anymore

    console.log("✅ Account verified successfully for:", email);
    return {
      success: true,
      data: response.data,
      message: "Account verified successfully!",
    };
  } catch (error) {
    console.error(
      "Verification error:",
      error.response?.data?.error || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.error ||
        "Verification failed. Please check the code.",
    };
  }
};

/**
 * Resend Verification Code - Request a new verification code
 */
export const resendCode = async (email) => {
  try {
    console.log("Requesting new verification code for:", email);
    const response = await axiosClient.post("/api/customerauth/resend-code", {
      email,
    });

    console.log("✅ Verification code resent to:", email);
    return {
      success: true,
      data: response.data,
      message: response.data.message || "Verification code sent successfully!",
    };
  } catch (error) {
    console.error(
      "Resend code error:",
      error.response?.data?.error || error.message
    );
    return {
      success: false,
      error: error.response?.data?.error || "Failed to resend code.",
    };
  }
};

/**
 * Logout - Revoke refresh token and clear session
 * Backend will clear httpOnly cookies
 */
// authServices.js or wherever logoutCustomer is defined
export const logoutCustomer = async () => {
  try {
    // Make sure withCredentials is true to send cookies
    await axiosClient.post(
      "/api/customerauth/logoutCustomer",
      {},
      {
        withCredentials: true,
      }
    );

    // Clear any frontend storage (these don't include tokens anymore)
    localStorage.removeItem("isGuest");
    localStorage.removeItem("userData"); // If you're storing user data
    localStorage.removeItem("userAvatarUrl"); // If you added this
    sessionStorage.removeItem("customerDeviceId");

    console.log("User logged out successfully");

    return { success: true };
  } catch (error) {
    console.error(
      "Logout error:",
      error.response?.data?.error || error.message
    );

    // Clear frontend data even if API call fails
    localStorage.removeItem("isGuest");
    localStorage.removeItem("userData");
    localStorage.removeItem("userAvatarUrl");
    sessionStorage.removeItem("customerDeviceId");

    // Still return success if it's a network error but we cleared local data
    if (!error.response) {
      return { success: true, message: "Local data cleared (offline)" };
    }

    return {
      success: false,
      error: error.response?.data?.error || "Logout failed.",
    };
  }
};

/**
 * Get current customer user from backend
 * Validates session via cookies
 */
export const getCurrentUser = async () => {
  try {
    const response = await axiosClient.get(
      "/api/customerauth/getCustomerProfile"
    );
    console.log("📊 Backend response:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Failed to get user data.",
    };
  }
};

/**
 * Check if customer is logged in
 * Makes API call to validate session
 */
export const isLoggedIn = async () => {
  try {
    const result = await getCurrentUser();
    return result.success;
  } catch (error) {
    return false;
  }
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async () => {
  try {
    const response = await axiosClient.get("/api/customerauth/oauth/google");
    if (response.data.authUrl) {
      window.location.href = response.data.authUrl;
    }
  } catch (error) {
    console.error("Google OAuth error:", error);
    throw new Error("Failed to initiate Google sign in");
  }
};

/**
 * Sign in with Facebook OAuth
 */
export const signInWithFacebook = async () => {
  try {
    const response = await axiosClient.get("/api/customerauth/oauth/facebook");
    if (response.data.authUrl) {
      window.location.href = response.data.authUrl;
    }
  } catch (error) {
    console.error("Facebook OAuth error:", error);
    throw new Error("Failed to initiate Facebook sign in");
  }
};

/**
 * Save pickup address and phone for delivery tracking
 */
export const savePickupAddress = async (addressData) => {
  try {
    console.log("🔄 Saving pickup address:", addressData);

    const response = await axiosClient.post(
      "/api/customerauth/pickup-address",
      {
        address: addressData.address,
        phone: addressData.phone,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
      }
    );

    console.log("✅ Pickup address saved successfully:", response.data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "❌ Pickup address save error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.error ||
        "Failed to save pickup address. Please try again.",
    };
  }
};

export default {
  signUpCustomer,
  signInCustomer,
  refreshSession,
  logoutCustomer,
  getCurrentUser,
  isLoggedIn,
  signInWithGoogle,
  signInWithFacebook,
  savePickupAddress,
};
