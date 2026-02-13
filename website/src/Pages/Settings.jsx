/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Settings as SettingsIcon,
  User,
  CreditCard,
  MapPin,
  Package,
  Globe,
  Bell,
  Shield,
  HelpCircle,
  AlertCircle,
  Info,
  LogOut,
  Moon,
  Sun,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Award,
  Sparkles,
  ChevronRight,
  CheckCircle,
  Truck,
  Headphones,
  Star,
  Zap,
  Gift,
  ShieldCheck,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Users,
  Settings2,
  Palette,
  Volume2,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Mock i18n function for demonstration
const i18n = {
  t: (key) => key,
};

const SettingsPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("USD");

  const accountItems = [
    {
      title: i18n.t("Orders"),
      route: "/orders",
      icon: <Package className="w-5 h-5" />,
      description: "Track & manage your orders",
      badge: "5 Active",
      color: "from-amber-600 to-yellow-600",
    },
    {
      title: i18n.t("Payment Methods"),
      route: "/payment",
      icon: <CreditCard className="w-5 h-5" />,
      description: "Manage cards & payment options",
      badge: "3 Saved",
      color: "from-emerald-600 to-green-600",
    },
    {
      title: i18n.t("Addresses"),
      route: "/addresses",
      icon: <MapPin className="w-5 h-5" />,
      description: "Update shipping addresses",
      badge: "2 Addresses",
      color: "from-blue-600 to-indigo-600",
    },
    {
      title: "Profile Settings",
      route: "/profile",
      icon: <User className="w-5 h-5" />,
      description: "Personal information & preferences",
      badge: "Complete",
      color: "from-purple-600 to-violet-600",
    },
  ];

  const preferencesItems = [
    {
      title: i18n.t("Return Policy"),
      route: "/return-policy",
      icon: <RefreshCw className="w-5 h-5" />,
      description: "30-day hassle-free returns",
      color: "from-green-600 to-emerald-600",
    },
    {
      title: i18n.t("Language"),
      route: "/language",
      icon: <Globe className="w-5 h-5" />,
      description: "English, Kiswahili, Français",
      badge: language.toUpperCase(),
      color: "from-cyan-600 to-blue-600",
    },
    {
      title: i18n.t("Currency"),
      route: "/currency",
      icon: <CreditCard className="w-5 h-5" />,
      description: "USD, EUR, XAF, NGN, KES",
      badge: currency,
      color: "from-yellow-600 to-orange-600",
    },
    {
      title: "Appearance",
      route: "/appearance",
      icon: <Palette className="w-5 h-5" />,
      description: "Dark mode & theme settings",
      badge: darkMode ? "Dark" : "Light",
      color: "from-violet-600 to-purple-600",
    },
  ];

  const supportItems = [
    {
      title: i18n.t("Help Center"),
      route: "/help-center",
      icon: <HelpCircle className="w-5 h-5" />,
      description: "24/7 premium support",
      color: "from-amber-600 to-orange-600",
    },
    {
      title: "Cancel Order",
      route: "/cancel-order",
      icon: <X className="w-5 h-5" />,
      description: "Request order cancellation",
      color: "from-red-600 to-red-700",
    },
    {
      title: i18n.t("Report a Problem"),
      route: "/report-issue",
      icon: <AlertCircle className="w-5 h-5" />,
      description: "Quick issue resolution",
      color: "from-red-600 to-pink-600",
    },
    {
      title: i18n.t("About"),
      route: "/about-us",
      icon: <Info className="w-5 h-5" />,
      description: "About Nile Flow & team",
      color: "from-blue-600 to-cyan-600",
    },
    {
      title: "Contact Support",
      route: "/contact",
      icon: <Headphones className="w-5 h-5" />,
      description: "Direct premium support line",
      badge: "24/7",
      color: "from-emerald-600 to-teal-600",
    },
  ];

  const securityItems = [
    {
      title: "Two-Factor Authentication",
      enabled: twoFactorEnabled,
      toggle: () => setTwoFactorEnabled(!twoFactorEnabled),
      icon: <ShieldCheck className="w-5 h-5" />,
      color: "from-emerald-600 to-green-600",
    },
    {
      title: "Notifications",
      enabled: notificationsEnabled,
      toggle: () => setNotificationsEnabled(!notificationsEnabled),
      icon: <Bell className="w-5 h-5" />,
      color: "from-amber-600 to-yellow-600",
    },
    {
      title: "Dark Mode",
      enabled: darkMode,
      toggle: () => setDarkMode(!darkMode),
      icon: darkMode ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      ),
      color: "from-purple-600 to-violet-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <SettingsIcon className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium Settings
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Account Settings
            </span>
            <br />
            <span className="text-white">Premium Control Panel</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Manage your Nile Flow experience with premium African marketplace
            settings
          </p>

          {/* User Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-300">Premium</div>
              <div className="text-amber-100/80 text-sm">Account Tier</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-300">5</div>
              <div className="text-emerald-100/80 text-sm">Active Orders</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-300">100%</div>
              <div className="text-blue-100/80 text-sm">Secure</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-300">24/7</div>
              <div className="text-red-100/80 text-sm">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Security Settings */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-amber-200">
                  Security & Preferences
                </h2>
                <p className="text-amber-100/70">Premium account protection</p>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-6 h-6 text-amber-400" />
                <span className="text-amber-300 font-bold">Premium</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {securityItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6 transition-all duration-300 hover:border-amber-500/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {item.title}
                        </h3>
                        <p className="text-amber-100/70 text-sm">
                          {item.enabled ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={item.toggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        item.enabled
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-700"
                          : "bg-gradient-to-r from-gray-800 to-black border border-amber-800/30"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          item.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Settings */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-200">
                {i18n.t("Account")}
              </h2>
              <div className="text-amber-100/70 text-sm">
                {accountItems.length} settings
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accountItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.route}
                  className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6 transition-all duration-500 group-hover:border-amber-500/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}
                        >
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors duration-300">
                            {item.title}
                          </h3>
                          <p className="text-amber-100/70 text-sm mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {item.badge && (
                          <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-amber-800/30">
                            <span className="text-xs text-amber-200 font-bold">
                              {item.badge}
                            </span>
                          </div>
                        )}
                        <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Preferences & Support Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Preferences */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-amber-200">
                  {i18n.t("Preferences")}
                </h2>
                <Settings2 className="w-6 h-6 text-amber-400" />
              </div>

              <div className="space-y-4">
                {preferencesItems.map((item, index) => (
                  <Link key={index} to={item.route} className="group block">
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 transition-all duration-300 hover:border-amber-500/50 hover:bg-gradient-to-br hover:from-gray-900/80 hover:to-black/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}
                          >
                            {item.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors duration-300">
                              {item.title}
                            </h3>
                            <p className="text-amber-100/70 text-sm">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {item.badge && (
                            <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-amber-800/30">
                              <span className="text-xs text-amber-200 font-bold">
                                {item.badge}
                              </span>
                            </div>
                          )}
                          <ChevronRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-amber-200">
                  {i18n.t("Support")}
                </h2>
                <Headphones className="w-6 h-6 text-amber-400" />
              </div>

              <div className="space-y-4">
                {supportItems.map((item, index) => (
                  <Link key={index} to={item.route} className="group block">
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 transition-all duration-300 hover:border-amber-500/50 hover:bg-gradient-to-br hover:from-gray-900/80 hover:to-black/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}
                          >
                            {item.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors duration-300">
                              {item.title}
                            </h3>
                            <p className="text-amber-100/70 text-sm">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {item.badge && (
                            <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-amber-800/30">
                              <span className="text-xs text-amber-200 font-bold">
                                {item.badge}
                              </span>
                            </div>
                          )}
                          <ChevronRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-xl font-bold text-amber-300 mb-2">
                100% Secure
              </div>
              <div className="text-amber-100/80 text-sm">
                Bank-level encryption
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-xl font-bold text-emerald-300 mb-2">
                24/7 Support
              </div>
              <div className="text-emerald-100/80 text-sm">
                Instant response
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-xl font-bold text-blue-300 mb-2">
                Premium
              </div>
              <div className="text-blue-100/80 text-sm">
                African Marketplace
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="text-xl font-bold text-red-300 mb-2">5-Star</div>
              <div className="text-red-100/80 text-sm">
                Customer Satisfaction
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SettingsPage;
