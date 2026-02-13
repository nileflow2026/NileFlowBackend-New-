/* eslint-disable react-refresh/only-export-components */
// src/contexts/CustomerAuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getCurrentUser,
  logoutCustomer,
  signInCustomer,
  signUpCustomer,
  signInWithGoogle,
  signInWithFacebook,
  sendForgotPasswordEmail,
  resetPasswordWithToken,
} from "../authServices";

const CustomerAuthContext = createContext(null);

// Generate device ID in memory (persisted in sessionStorage for tab consistency)
const getDeviceId = () => {
  let deviceId = sessionStorage.getItem("customerDeviceId");
  if (!deviceId) {
    deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("customerDeviceId", deviceId);
  }
  return deviceId;
};

export const CustomerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPickupModal, setShowPickupModal] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await getCurrentUser();
        if (result.success) {
          setUser(result.data.user);
          setIsAuthenticated(true);
          // Removed pickup address check - will only be checked at checkout
        }
      } catch (error) {
        console.error("Customer auth initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for logout events from axios interceptor
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      // Only redirect if on a protected route
      const protectedRoutes = [
        "/profile",
        "/orders",
        "/addresses",
        "/settings",
        "/redeem",
        "/checkout",
      ];
      const currentPath = window.location.pathname;
      const isProtectedRoute = protectedRoutes.some((route) =>
        currentPath.startsWith(route),
      );

      if (isProtectedRoute) {
        window.location.href = "/signin";
      }
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const signUp = useCallback(async (email, password, username, phone) => {
    const deviceId = getDeviceId();
    const result = await signUpCustomer(
      email,
      password,
      username,
      phone,
      deviceId,
    );

    if (result.success && result.data?.user) {
      setUser(result.data.user);
      setIsAuthenticated(true);
    }

    return result;
  }, []);

  const signIn = useCallback(async (email, password, rememberMe = false) => {
    const deviceId = getDeviceId();
    const result = await signInCustomer(email, password, deviceId, rememberMe);

    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);

      // Clear guest status
      localStorage.removeItem("isGuest");

      // Removed pickup address check - will only be checked at checkout
    }

    return result;
  }, []);

  const logout = useCallback(async () => {
    const result = await logoutCustomer();
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem("customerDeviceId");
    localStorage.removeItem("isGuest");
    localStorage.removeItem("isGuest");
    localStorage.removeItem("userData");
    localStorage.removeItem("userAvatarUrl");
    localStorage.removeItem("userAvatarFileId");
    // Clear tokens from both storages
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("customerDeviceId");
    return result;
  }, []);

  const updateUser = useCallback((userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  }, []);

  const setPickupModalVisible = useCallback((visible) => {
    setShowPickupModal(visible);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithGoogle();

      if (result?.success) {
        setUser(result.data.user);
        setIsAuthenticated(true);
        localStorage.removeItem("isGuest");

        // Check if user needs pickup address
        const needsPickupAddress =
          !result.data.user.pickupAddress && !result.data.user.hasPickupAddress;
        if (needsPickupAddress) {
          result.needsPickupAddress = true;
        }
      }

      return result;
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  }, []);

  const loginWithFacebook = useCallback(async () => {
    try {
      const result = await signInWithFacebook();

      if (result?.success) {
        setUser(result.data.user);
        setIsAuthenticated(true);
        localStorage.removeItem("isGuest");

        // Check if user needs pickup address
        const needsPickupAddress =
          !result.data.user.pickupAddress && !result.data.user.hasPickupAddress;
        if (needsPickupAddress) {
          result.needsPickupAddress = true;
        }
      }

      return result;
    } catch (error) {
      console.error("Facebook sign in error:", error);
      throw error;
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const result = await sendForgotPasswordEmail(email);
      return result;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email, token, newPassword) => {
    try {
      const result = await resetPasswordWithToken(email, token, newPassword);
      return result;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    showPickupModal,
    signUp,
    signIn,
    logout,
    updateUser,
    setPickupModalVisible,
    loginWithGoogle,
    loginWithFacebook,
    forgotPassword,
    resetPassword,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }
  return context;
};
export default CustomerAuthProvider;
