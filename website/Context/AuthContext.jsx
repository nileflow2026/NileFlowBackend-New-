/* eslint-disable react-refresh/only-export-components */
/* import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";

import { jwtDecode } from "jwt-decode";
import { getProfile } from "../CustomerServices";
import { refreshSession } from "../authServices";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const warningTimer = useRef(null);
  const logoutTimer = useRef(null);

  const resetInactivityTimer = () => {
    // Clear both timers
    clearTimeout(warningTimer.current);
    clearTimeout(logoutTimer.current);
    setShowWarning(false);

    // Set warning at 14 mins
    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
    }, 14 * 60 * 1000); // 14 minutes

    // Set logout at 15 mins
    logoutTimer.current = setTimeout(() => {
      console.log("[Auth] Auto-logout: Inactivity detected");
 
    }, 15 * 60 * 1000);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click"];
    events.forEach((event) =>
      window.addEventListener(event, resetInactivityTimer)
    );
    resetInactivityTimer(); // Start on mount

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer)
      );
      clearTimeout(warningTimer.current);
      clearTimeout(logoutTimer.current);
    };
  }, []);

  {
    showWarning && (
      <InactivityWarningModal onStayLoggedIn={resetInactivityTimer} />
    );
  }

  useEffect(() => {
    if (user) {
      localStorage.setItem("userData", JSON.stringify(user)); // keep in sync
    }
  }, [user]);

  // Auto-refresh token periodically (e.g., every 5 mins)
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      console.log("[Auth] Checking token every minute...");
      if (token) {
        const { exp } = jwtDecode(token);
        const now = Date.now() / 1000;
        if (exp - now < 60 * 5) {
          console.log("[Auth] Token near expiry, refreshing...");
          refreshToken();
          console.log(
            "[Auth] Token exp:",
            exp,
            "| Now:",
            now,
            "| Time left:",
            exp - now
          );
        }
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Load user from local storage (if token exists)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        console.error("Failed to decode token:", err);
        setUser(null); // Reset user if token is invalid
      }
    }
  }, []);

  // Load user profile from backend
  const loadUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("[Auth] No token found, skipping profile load.");
      setLoading(false);
      return;
    }

    try {
      const userData = await getProfile();
      setUser(userData);
    } catch (error) {
      console.error("Failed to load user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const newToken = await refreshSession(); // Get new JWT token
      setToken(newToken); // <-- update state

      localStorage.setItem("token", newToken); // Save new token in localStorage
      setUser(jwtDecode(newToken));

      console.log("[Auth] Token refreshed successfully");
    } catch (error) {
      console.error("[Auth] Failed to refresh token:", error);
      setUser(null); // Reset user state if token refresh fails
      localStorage.removeItem("token"); // Remove invalid token from localStorage
    }
  };



  useEffect(() => {
    loadUser(); // Load user on initial render
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshToken, token }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;
 */

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
} from "../authServices";

const AuthContext = createContext(null);

// Generate device ID in memory (persisted in sessionStorage for tab consistency)
const getDeviceId = () => {
  let deviceId = sessionStorage.getItem("customerDeviceId");
  if (!deviceId) {
    deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("customerDeviceId", deviceId);
  }
  return deviceId;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await getCurrentUser();
        if (result.success) {
          setUser(result.data.user);
          setIsAuthenticated(true);
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
      window.location.href = "/signin";
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
      deviceId
    );

    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
    }

    return result;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const deviceId = getDeviceId();
    const result = await signInCustomer(email, password, deviceId);

    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);

      // Clear guest status
      localStorage.removeItem("isGuest");
    }

    return result;
  }, []);

  const logout = useCallback(async () => {
    const result = await logoutCustomer();
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem("customerDeviceId");
    localStorage.removeItem("isGuest");
    return result;
  }, []);

  const updateUser = useCallback((userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    signUp,
    signIn,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within CustomerAuthProvider");
  }
  return context;
};
