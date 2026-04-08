/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { Config, databases, Query } from "../appwrite";

const CurrencyContext = createContext();
export const useCurrency = () => useContext(CurrencyContext);

const currencySymbols = {
  USD: "$",
  KES: "KSh",
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState("KES"); // Default KES
  const [exchangeRate, setExchangeRate] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchExchangeRate = async (selectedCurrency) => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        Config.databaseId,
        Config.currenciesCollection,
        [Query.equal("currency_code", selectedCurrency)]
      );

      if (response.documents.length > 0) {
        const rate = response.documents[0].rate;
        setExchangeRate(rate);
      } else {
        setExchangeRate(1);
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      setExchangeRate(1);
    } finally {
      setLoading(false);
    }
  };

  const changeCurrency = (newCurrency) => {
    // Restrict to USD and KES only
    if (newCurrency !== "USD" && newCurrency !== "KES") {
      console.warn(`Unsupported currency: ${newCurrency}`);
      return;
    }

    setCurrency(newCurrency);
    localStorage.setItem("userCurrency", newCurrency);
    fetchExchangeRate(newCurrency);
  };

  const convertPrice = (priceInUSD) => {
    const convertedPrice = priceInUSD * exchangeRate;
    const symbol = currencySymbols[currency] || "$";

    return `${symbol} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedPrice)}`;
  };

  useEffect(() => {
    const loadCurrency = async () => {
      const savedCurrency = localStorage.getItem("userCurrency") || "KES"; // Default KES
      if (savedCurrency === "USD" || savedCurrency === "KES") {
        setCurrency(savedCurrency);
        fetchExchangeRate(savedCurrency);
      } else {
        setCurrency("KES"); // Fallback
        fetchExchangeRate("KES");
      }
    };
    loadCurrency();
  }, []);

  return (
    <CurrencyContext.Provider
      value={{ currency, changeCurrency, convertPrice, loading }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};
