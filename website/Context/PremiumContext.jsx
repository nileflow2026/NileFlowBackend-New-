/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { premiumService } from "../utils/premiumService";

const PremiumContext = createContext();

export const usePremiumContext = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error("usePremiumContext must be used within PremiumProvider");
  }
  return context;
};

export const PremiumProvider = ({ children }) => {
  const [premiumStatus, setPremiumStatus] = useState({
    isPremium: false,
    expiresAt: null,
    loading: true,
    error: null,
  });

  // Fetch premium status on mount and when user changes
  const fetchPremiumStatus = async () => {
    try {
      setPremiumStatus((prev) => ({ ...prev, loading: true, error: null }));
      const status = await premiumService.getStatus();
      setPremiumStatus({
        isPremium: status.isPremium,
        expiresAt: status.expiresAt,
        loading: false,
        error: null,
      });
    } catch (error) {
      setPremiumStatus({
        isPremium: false,
        expiresAt: null,
        loading: false,
        error: error.message,
      });
    }
  };

  useEffect(() => {
    fetchPremiumStatus();
  }, []);

  const value = {
    ...premiumStatus,
    refreshStatus: fetchPremiumStatus,
  };

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
};
