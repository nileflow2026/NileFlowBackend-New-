/* eslint-disable no-unused-vars */
import React from "react";
import { useGlobalContext } from "../../Context/GlobalProvider";
import Header from "../../components/Header";
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

const CURRENT_CURRENCY = {
  code: "KES",
  name: "Kenyan Shilling",
  symbol: "KSh",
  flag: "🇰🇪",
};

const CurrencyPage = () => {
  const { user, loading: userLoading } = useGlobalContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Header />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-amber-900/20 to-yellow-900/20 backdrop-blur-sm border border-amber-700/30 rounded-2xl px-6 py-3 mb-6">
              <Currency className="w-6 h-6 text-amber-400" />
              <span className="text-amber-100 font-medium">
                Currency Information
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 mb-4">
              Our Currency
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              All prices are displayed in Kenyan Shillings (KES) for consistent
              and transparent pricing
            </p>
          </div>

          {/* Current Currency Display */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-amber-700/30 rounded-3xl p-8 mb-8">
            <div className="text-center">
              <div className="text-6xl mb-4">{CURRENT_CURRENCY.flag}</div>
              <h2 className="text-3xl font-bold text-amber-300 mb-2">
                {CURRENT_CURRENCY.name}
              </h2>
              <p className="text-xl text-gray-300 mb-4">
                Symbol:{" "}
                <span className="text-amber-400 font-bold">
                  {CURRENT_CURRENCY.symbol}
                </span>
              </p>
              <p className="text-gray-400">
                All product prices, shipping costs, and transactions are
                processed in KES
              </p>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Why KES Card */}
            <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 backdrop-blur-sm border border-emerald-700/30 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-bold text-emerald-300">
                  Why Kenyan Shilling?
                </h3>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Local currency for East African market</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>No currency conversion fees</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Transparent pricing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Easier local payments</span>
                </li>
              </ul>
            </div>

            {/* Payment Methods Card */}
            <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 backdrop-blur-sm border border-blue-700/30 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-blue-300">
                  Supported Payments
                </h3>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>M-Pesa (KES)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Bank transfers (KES)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Visa/Mastercard</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Cash on Delivery</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Note Section */}
          <div className="bg-gradient-to-br from-amber-900/10 to-yellow-900/10 backdrop-blur-sm border border-amber-700/20 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h4 className="text-lg font-semibold text-amber-300">
                Important Note
              </h4>
            </div>
            <p className="text-gray-300">
              All prices displayed throughout our website are in Kenyan
              Shillings (KES). There are no hidden currency conversion charges -
              the price you see is the price you pay.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CurrencyPage;
