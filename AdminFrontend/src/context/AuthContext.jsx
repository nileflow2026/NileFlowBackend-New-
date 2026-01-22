/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import authService, {
  getCurrentUser,
  signinAdmin,
  signoutAdmin,
} from "../../authService";

const AuthContext = createContext(null);

// Generate device ID in memory (persisted in sessionStorage for tab consistency)
const getDeviceId = () => {
  let deviceId = sessionStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("deviceId", deviceId);
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
        console.error("Auth initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for logout events from axios interceptor
  useEffect(() => {
    const handleLogout = () => {
      // Clear auth state; do NOT force a full-page reload or hard navigation here.
      // Let the app's router/components handle route changes to avoid reload loops.
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const signup = useCallback(async (email, password, username) => {
    const deviceId = getDeviceId();
    const result = await authService.signup(
      email,
      password,
      username,
      deviceId
    );

    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
    }

    return result;
  }, []);

  const signin = useCallback(async (email, password) => {
    const deviceId = getDeviceId();
    const result = await signinAdmin(email, password, deviceId);

    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
    }

    return result;
  }, []);

  const logout = useCallback(async () => {
    const result = await signoutAdmin();
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem("deviceId");
    return result;
  }, []);

  const updateUser = useCallback((userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    signup,
    signin,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
