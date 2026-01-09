import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext";
import {
  FiBell,
  FiChevronDown,
  FiSearch,
  FiShoppingCart,
  FiMenu,
  FiX,
  FiUser,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import { useNotification } from "../Context/NotificationContext";
import i18n from "../i18n";
import { logoutCustomer } from "../authServices";
import { useState, useEffect } from "react";
import { useCustomerAuth } from "../Context/CustomerAuthContext";

const africanGradients = [
  "linear-gradient(135deg, #d4af37 0%, #c53030 50%, #2d5a27 100%)", // Gold, Red, Green
  "linear-gradient(135deg, #e25822 0%, #f6b026 50%, #0d5c0d 100%)", // Terracotta, Sun, Forest
  "linear-gradient(135deg, #1a237e 0%, #d4af37 50%, #b71c1c 100%)", // Indigo, Gold, Crimson
  "linear-gradient(135deg, #5d4037 0%, #d4af37 50%, #1b5e20 100%)", // Earth, Gold, Emerald
  "linear-gradient(135deg, #8b4513 0%, #ffd700 50%, #006400 100%)", // Sienna, Gold, Dark Green
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [headerGradient, setHeaderGradient] = useState("");
  const [scrollEffect, setScrollEffect] = useState(false);

  // ✅ Use the auth context instead of local state
  const { user, isLoading: userLoading } = useCustomerAuth();
  const { cart } = useCart();
  const { notificationCount } = useNotification();

  useEffect(() => {
    const randomGradient =
      africanGradients[Math.floor(Math.random() * africanGradients.length)];
    setHeaderGradient(randomGradient);

    const handleScroll = () => {
      setScrollEffect(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerStyle = {
    backgroundImage: headerGradient,
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    backdropFilter: scrollEffect ? "blur(10px)" : "none",
    backgroundColor: scrollEffect
      ? "rgba(0, 0, 0, 0.85)"
      : "rgba(0, 0, 0, 0.1)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  return (
    <header className="sticky top-0 z-50 shadow-2xl" style={headerStyle}>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Announcement Bar */}
        <div className="hidden md:flex justify-center py-2 bg-black/20">
          <div className="flex items-center space-x-2 text-amber-100 text-sm">
            <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
            <span>
              🌟 Premium African Marketplace • Express Delivery • 100% Authentic
            </span>
          </div>
        </div>

        {/* Main Header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
              <img
                src="/images/logo.png"
                alt="Nile Flow"
                className="relative h-16 w-16 md:h-20 md:w-20 object-contain drop-shadow-lg"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-300 to-emerald-200 bg-clip-text text-transparent font-serif tracking-wider">
                NILE FLOW
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {[
              { to: "/home", label: i18n.t("Home") },
              { to: "/shop", label: "Shop" },
              { to: "/deals", label: "Deals" },
              { to: "/contact", label: "Contact Us" },
              { to: "/language", label: "Language" },
              /*  { to: "/discover", label: "Discover Africa" },
              { to: "/african-chronicles", label: "African Chronicles" }, */
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="relative px-5 py-3 text-amber-50 font-medium text-sm tracking-wide hover:text-white transition-colors duration-300 group whitespace-nowrap"
              >
                {item.label}
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-emerald-400 group-hover:w-4/5 group-hover:left-1/10 transition-all duration-400"></span>
              </Link>
            ))}
          </nav>

          {/* Action Icons & Profile */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Search */}
            <Link
              to="/search"
              className="p-2.5 rounded-full bg-black/20 hover:bg-black/30 text-amber-100 hover:text-white transition-all duration-300 transform hover:scale-110"
            >
              <FiSearch size={20} />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-full bg-black/20 hover:bg-black/30 text-amber-100 hover:text-white transition-all duration-300 transform hover:scale-110"
            >
              <FiShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-amber-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-bounce">
                  {cart.length}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <Link
              to="/notification"
              className="relative p-2.5 rounded-full bg-black/20 hover:bg-black/30 text-amber-100 hover:text-white transition-all duration-300 transform hover:scale-110"
            >
              <FiBell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-amber-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Link>

            {/* Profile/Login Desktop */}
            {!userLoading && (
              <div className="hidden lg:block">
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center space-x-2 group"
                    >
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full blur opacity-0 group-hover:opacity-70 transition duration-300"></div>
                        <img
                          src={user.avatarUrl || "/images/logo.png"}
                          alt="Profile"
                          className="relative w-14 h-14 rounded-full border-2 border-amber-300/30 object-cover"
                        />
                      </div>
                      <FiChevronDown
                        className={`text-amber-100 transition-transform duration-300 ${
                          dropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {dropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-3 w-56 z-50 animate-fadeIn">
                          <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl shadow-2xl border border-amber-900/50 overflow-hidden">
                            <div className="p-4 border-b border-amber-900/30">
                              <p className="font-bold text-amber-100 truncate">
                                {user.username}
                              </p>
                              <p className="text-xs text-amber-100/60">
                                {user.email || "Member"}
                              </p>
                            </div>
                            <div className="p-2">
                              <Link
                                to="/profile"
                                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-amber-900/20 text-amber-100 transition-all duration-200"
                                onClick={() => setDropdownOpen(false)}
                              >
                                <FiUser className="text-amber-400" />
                                <span>Profile</span>
                              </Link>
                              <Link
                                to="/settings"
                                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-amber-900/20 text-amber-100 transition-all duration-200"
                                onClick={() => setDropdownOpen(false)}
                              >
                                <FiSettings className="text-amber-400" />
                                <span>Settings</span>
                              </Link>
                              <button
                                className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg hover:bg-red-900/20 text-red-300 transition-all duration-200"
                                onClick={async () => {
                                  await logoutCustomer();
                                  setDropdownOpen(false);
                                }}
                              >
                                <FiLogOut />
                                <span>Logout</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/signin"
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold rounded-full hover:from-amber-600 hover:to-amber-800 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Login
                  </Link>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2.5 rounded-full bg-black/30 text-amber-100 hover:text-white transition-all duration-300"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-500 ease-in-out ${
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-80 bg-gradient-to-b from-gray-900 to-black transform transition-transform duration-500 ease-out shadow-2xl ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Menu Header */}
          <div className="p-6 border-b border-amber-900/30">
            {user ? (
              <div className="flex items-center space-x-3">
                <img
                  src={user.avatarUrl || "/images/logo.png"}
                  alt="Profile"
                  className="w-12 h-12 rounded-full border-2 border-amber-400/30"
                />
                <div>
                  <p className="font-bold text-amber-100">{user.username}</p>
                  <p className="text-sm text-amber-100/60">Welcome back!</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-emerald-500 flex items-center justify-center mb-3">
                  <FiUser size={28} className="text-white" />
                </div>
                <p className="text-amber-100 font-bold">Welcome to Nile Flow</p>
              </div>
            )}
          </div>

          {/* Menu Links */}
          <div className="p-4 space-y-1">
            {[
              { to: "/home", label: i18n.t("Home"), icon: "🏠" },
              { to: "/shop", label: "Shop", icon: "🛒" },
              { to: "/deals", label: "Deals", icon: "🔥" },
              { to: "/contact", label: "Contact Us", icon: "📞" },
              { to: "/language", label: "Language", icon: "🌍" },
              { to: "/profile", label: "Profile", icon: "👤" },
              { to: "/settings", label: "Settings", icon: "⚙️" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center space-x-3 px-4 py-4 rounded-xl hover:bg-amber-900/20 text-amber-100 transition-all duration-200"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}

            {/* Auth Buttons */}
            <div className="pt-6 border-t border-amber-900/30">
              {user ? (
                <button
                  onClick={async () => {
                    await logoutCustomer();
                    setMenuOpen(false);
                  }}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl hover:opacity-90 transition-all duration-300"
                >
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  to="/signin"
                  className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-700 text-white rounded-xl hover:opacity-90 transition-all duration-300"
                  onClick={() => setMenuOpen(false)}
                >
                  <FiUser />
                  <span>Sign In / Register</span>
                </Link>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
            <p className="text-xs text-amber-100/50">
              © 2025 Nile Flow. Premium African E-commerce
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
