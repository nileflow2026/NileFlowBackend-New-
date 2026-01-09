/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalContext } from "../../Context/GlobalProvider";
import { Config, databases, Query } from "../../appwrite";
import Header from "../../components/Header";
import { useCurrency } from "../../Context/CurrencyProvider";
import {
  Currency,
  Globe,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle,
  Sparkles,
  Award,
  ArrowRight,
  Lock,
  RefreshCw,
  BarChart3,
  Coins,
  Earth,
} from "lucide-react";
import Footer from "../../components/Footer";

/* const currencyFlags = {
  USD: "🇺🇸",
  KES: "🇰🇪",
}; */

const currencyFlags = {
  USD: "🇺🇸",
  KES: "🇰🇪",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  ZAR: "🇿🇦",
  NGN: "🇳🇬",
  GHS: "🇬🇭",
  XOF: "🇨🇮",
  XAF: "🇨🇲",
  EGP: "🇪🇬",
  MUR: "🇲🇺",
  TZS: "🇹🇿",
  UGX: "🇺🇬",
  RWF: "🇷🇼",
};
const CurrencyPage = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedCurrencyData, setSelectedCurrencyData] = useState(null);

  const {
    currency: selectedCurrency,
    changeCurrency,
    convertPrice,
  } = useCurrency();
  const { user, loading: userLoading } = useGlobalContext();

  const fetchCurrencies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        Config.databaseId,
        Config.currenciesCollection,
        [
          Query.equal("currency_code", [
            "USD",
            "KES",
            "EUR",
            "GBP",
            "ZAR",
            "NGN",
            "GHS",
          ]),
        ]
      );
      setCurrencies(response.documents);
    } catch (error) {
      console.error("❌ Error fetching currencies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  const handleCurrencySelect = async (currency) => {
    setUpdating(true);
    const selectedCurr = currencies.find((c) => c.currency_code === currency);
    setSelectedCurrencyData(selectedCurr);

    // Call the provider's function to change the currency
    changeCurrency(currency);

    if (user?.userId) {
      try {
        await databases.updateDocument(
          Config.databaseId,
          Config.userCollectionId,
          user.userId,
          { currency }
        );
        console.log("✅ Currency updated successfully in user profile.");
      } catch (error) {
        console.error("❌ Error updating user currency:", error);
      }
    } else {
      console.warn("⚠️ No user ID found, skipping user data update.");
    }

    setTimeout(() => {
      setUpdating(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    }, 1000);
  };

  // Calculate conversion example
  const getConversionExample = (currencyCode) => {
    const examples = {
      USD: "≈ 150 KES",
      KES: "≈ 0.0067 USD",
      EUR: "≈ 180 KES",
      GBP: "≈ 210 KES",
      ZAR: "≈ 8.5 KES",
      NGN: "≈ 0.2 KES",
      GHS: "≈ 12 KES",
    };
    return examples[currencyCode] || "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Confirmation Toast */}
      {showConfirmation && selectedCurrencyData && (
        <div className="fixed top-24 right-8 z-50 animate-fadeIn">
          <div className="bg-gradient-to-r from-emerald-900/80 to-green-900/80 backdrop-blur-sm border border-emerald-700/50 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">Currency Updated</p>
                <p className="text-emerald-100 text-sm">
                  Now shopping in {selectedCurrencyData.name} (
                  {selectedCurrencyData.currency_code})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <Currency className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium Exchange
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Currency Settings
            </span>
            <br />
            <span className="text-white">Global Shopping Experience</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Shop in your preferred currency with real-time exchange rates.
            Experience seamless pricing across all African and international
            markets.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-300">7+</div>
              <div className="text-amber-100/80 text-sm">Currencies</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-300">Live</div>
              <div className="text-emerald-100/80 text-sm">Exchange Rates</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-300">0%</div>
              <div className="text-blue-100/80 text-sm">Conversion Fees</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-300">Secure</div>
              <div className="text-red-100/80 text-sm">Transactions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-4xl mx-auto">
          {/* Current Currency Indicator */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                    <Coins className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-amber-100 text-sm">
                      Currently Shopping In
                    </p>
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl">
                        {currencyFlags[selectedCurrency] || "🏳️"}
                      </span>
                      <h2 className="text-3xl font-bold text-amber-300">
                        {selectedCurrency}
                      </h2>
                      <div className="flex items-center space-x-1 bg-gradient-to-r from-emerald-900/40 to-green-900/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-700/30">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-200">
                          Active
                        </span>
                      </div>
                    </div>
                    <p className="text-amber-100/70 text-sm mt-1">
                      All prices are displayed in {selectedCurrency} with live
                      exchange rates
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Currency Selection */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-amber-200">
                  Available Currencies
                </h2>
                <p className="text-amber-100/70">
                  Select your preferred shopping currency
                </p>
              </div>
              <div className="text-amber-400">
                <Globe className="w-8 h-8" />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Currency className="w-8 h-8 text-amber-500 animate-pulse" />
                  </div>
                </div>
                <p className="text-amber-200 mt-4">
                  Loading currency options...
                </p>
              </div>
            ) : (
              <>
                {/* Currency Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currencies.map((currency) => {
                    const isSelected =
                      selectedCurrency === currency.currency_code;
                    const flag = currencyFlags[currency.currency_code] || "🏳️";

                    return (
                      <div
                        key={currency.$id}
                        onClick={() =>
                          !updating &&
                          handleCurrencySelect(currency.currency_code)
                        }
                        className={`group relative p-6 rounded-2xl border backdrop-blur-sm cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 border-amber-500/50 shadow-lg shadow-amber-900/30"
                            : updating
                            ? "opacity-50 cursor-not-allowed bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30"
                            : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 hover:border-amber-500/50"
                        }`}
                      >
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        )}

                        {/* Currency Flag and Code */}
                        <div className="flex items-center space-x-4 mb-4">
                          <div
                            className={`text-4xl ${
                              isSelected ? "transform scale-110" : ""
                            } transition-transform duration-300`}
                          >
                            {flag}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3
                                className={`text-2xl font-bold ${
                                  isSelected ? "text-amber-300" : "text-white"
                                }`}
                              >
                                {currency.currency_code}
                              </h3>
                              {currency.currency_code === "USD" && (
                                <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-2 py-1 rounded border border-amber-700/30">
                                  <Award className="w-3 h-3 text-amber-400" />
                                  <span className="text-xs text-amber-200">
                                    Default
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm mt-1 text-amber-100/70">
                              {currency.name}
                            </p>
                          </div>
                        </div>

                        {/* Currency Details */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-emerald-100/80">
                              {getConversionExample(currency.currency_code)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-blue-100/80">
                              Live Rates
                            </span>
                          </div>
                        </div>

                        {/* Hover Arrow */}
                        <div
                          className={`absolute bottom-4 right-4 transform transition-all duration-300 ${
                            isSelected
                              ? "translate-x-0 opacity-100"
                              : "translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                          }`}
                        >
                          <ArrowRight
                            className={`w-5 h-5 ${
                              isSelected ? "text-amber-300" : "text-amber-400"
                            }`}
                          />
                        </div>

                        {/* Selection Glow */}
                        {isSelected && (
                          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl blur opacity-20"></div>
                        )}

                        {/* Updating Overlay */}
                        {updating && isSelected && (
                          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                            <div className="flex items-center space-x-2">
                              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                              <span className="text-amber-200 text-sm">
                                Updating...
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Currency Benefits */}
                <div className="mt-8 pt-8 border-t border-amber-800/30">
                  <h3 className="text-lg font-bold text-amber-200 mb-4">
                    Currency Benefits
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                      <BarChart3 className="w-8 h-8 text-amber-400 mb-2" />
                      <h4 className="text-amber-100 font-bold">
                        Live Exchange Rates
                      </h4>
                      <p className="text-amber-100/70 text-sm mt-1">
                        Real-time pricing with market rates
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                      <Lock className="w-8 h-8 text-emerald-400 mb-2" />
                      <h4 className="text-emerald-100 font-bold">
                        No Hidden Fees
                      </h4>
                      <p className="text-emerald-100/70 text-sm mt-1">
                        Transparent currency conversion
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                      <Zap className="w-8 h-8 text-blue-400 mb-2" />
                      <h4 className="text-blue-100 font-bold">
                        Instant Updates
                      </h4>
                      <p className="text-blue-100/70 text-sm mt-1">
                        Changes apply immediately
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Currency Information */}
            <div className="mt-8 bg-gradient-to-r from-emerald-900/20 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                    <Earth className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Multi-Currency Support
                    </h3>
                    <p className="text-emerald-100/70">
                      Perfect for shopping across African markets
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-emerald-100/70 mb-2">
                    Example Conversion
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {selectedCurrency === "KES"
                      ? "100 KES ≈ 0.67 USD"
                      : "100 USD ≈ 15,000 KES"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-amber-300">Live</div>
              <div className="text-amber-100/80 text-sm">Exchange Rates</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-emerald-300">0%</div>
              <div className="text-emerald-100/80 text-sm">Conversion Fees</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-blue-300">Secure</div>
              <div className="text-blue-100/80 text-sm">Transactions</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-red-300">7+</div>
              <div className="text-red-100/80 text-sm">Currencies</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CurrencyPage;
