/* eslint-disable no-unused-vars */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faTwitter,
  faTiktok,
  faInstagram,
  faLinkedinIn,
} from "@fortawesome/free-brands-svg-icons";
import {
  faEnvelope,
  faCheckCircle,
  faArrowRight,
  faGift,
  faShieldAlt,
  faTruckFast,
  faHeadset,
} from "@fortawesome/free-solid-svg-icons";
import i18n from "../i18n";
import { useState } from "react";
import axiosClient from "../api";
import { Link } from "react-router-dom";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [username, setName] = useState("");
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axiosClient.post(
        "/api/admin/newsletter/user-check",
        {
          email,
        },
      );
      if (response.data.userExists) {
        setName(response.data.username);
        setStep("username");
        handleSubscribe(email, response.data.username);
      } else {
        setStep("name");
      }
    } catch (err) {
      setError("Failed to check email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (!username) {
      setError("Name is required.");
      return;
    }
    handleSubscribe(email, username);
  };

  const handleSubscribe = async (finalEmail, finalName) => {
    setLoading(true);
    setError("");
    try {
      await axiosClient.post("/api/admin/newsletter/subscribe", {
        email: finalEmail,
        username: finalName,
      });
      setStep("subscribed");
    } catch (err) {
      setError(err.response?.data?.error || "Subscription failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="relative overflow-hidden pt-16 pb-8 mt-20">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/90 via-gray-900 to-emerald-900/80"></div>

      {/* Trust Badges */}
      <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        {/* Mobile: Horizontal Scroll, Desktop: Grid */}
        <div className="flex overflow-x-auto gap-4 pb-2 sm:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible scrollbar-thin scrollbar-thumb-amber-600 scrollbar-track-amber-900/20">
          <div className="bg-gradient-to-br from-amber-900/40 to-transparent backdrop-blur-sm rounded-2xl p-4 border border-amber-700/30 flex items-center space-x-3 flex-shrink-0 min-w-[280px] md:min-w-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-800 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon
                icon={faTruckFast}
                className="text-white text-lg"
              />
            </div>
            <div>
              <p className="font-bold text-amber-100 text-sm">Fast Delivery</p>
              <p className="text-amber-100/70 text-xs">Across Africa</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-transparent backdrop-blur-sm rounded-2xl p-4 border border-emerald-700/30 flex items-center space-x-3 flex-shrink-0 min-w-[280px] md:min-w-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-800 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon
                icon={faShieldAlt}
                className="text-white text-lg"
              />
            </div>
            <div>
              <p className="font-bold text-emerald-100 text-sm">
                Secure Payment
              </p>
              <p className="text-emerald-100/70 text-xs">100% Protected</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-900/40 to-transparent backdrop-blur-sm rounded-2xl p-4 border border-red-700/30 flex items-center space-x-3 flex-shrink-0 min-w-[280px] md:min-w-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-800 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon
                icon={faHeadset}
                className="text-white text-lg"
              />
            </div>
            <div>
              <p className="font-bold text-red-100 text-sm">24/7 Support</p>
              <p className="text-red-100/70 text-xs">Local Agents</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-transparent backdrop-blur-sm rounded-2xl p-4 border border-blue-700/30 flex items-center space-x-3 flex-shrink-0 min-w-[280px] md:min-w-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faGift} className="text-white text-lg" />
            </div>
            <div>
              <p className="font-bold text-blue-100 text-sm">Premium Quality</p>
              <p className="text-blue-100/70 text-xs">Authentic Products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 lg:gap-10 pb-8 sm:pb-12 border-b border-amber-800/40">
          {/* Brand & Newsletter */}
          <div className="md:col-span-2 lg:col-span-2">
            <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-3 mb-6 text-center sm:text-left">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/logo.png"
                  alt="Nile Flow"
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 object-contain"
                />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-300 to-emerald-200 bg-clip-text text-transparent font-serif">
                  NILE FLOW
                </h2>
                <p className="text-amber-100/80 text-xs sm:text-sm md:text-base tracking-wide">
                  Premium African Marketplace
                </p>
              </div>
            </div>

            <p className="text-amber-100/90 mb-6 md:mb-8 text-base md:text-lg leading-relaxed text-center sm:text-left">
              Your gateway to authentic African products. Experience premium
              quality, fair prices, and seamless delivery across the continent.
            </p>

            {/* Newsletter Subscription */}
            <div className="bg-gradient-to-br from-gray-900/50 to-black/40 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-amber-800/30">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4 text-center sm:text-left">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="text-amber-400 text-lg sm:text-xl"
                />
                <h3 className="text-lg sm:text-xl font-bold text-amber-100">
                  Join Our Community
                </h3>
              </div>

              <p className="text-amber-100/80 mb-4 sm:mb-6 text-sm sm:text-base text-center sm:text-left">
                Get exclusive African product drops, cultural insights, and
                members-only deals.
              </p>

              {step === "subscribed" ? (
                <div className="bg-gradient-to-r from-emerald-900/40 to-green-900/20 border border-emerald-700/50 rounded-xl p-4 text-center animate-fadeIn">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-emerald-400 text-2xl sm:text-3xl mb-2"
                  />
                  <p className="font-bold text-emerald-100 text-base sm:text-lg">
                    Welcome to the Tribe!
                  </p>
                  <p className="text-emerald-100/80 text-xs sm:text-sm mt-1">
                    Check your email for your welcome gift 🎁
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={
                    step === "email" ? handleEmailSubmit : handleNameSubmit
                  }
                >
                  {error && (
                    <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4">
                      <p className="text-red-200 text-xs sm:text-sm">{error}</p>
                    </div>
                  )}

                  {step === "email" ? (
                    <div className="relative">
                      <div
                        className={`absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur ${
                          focused ? "opacity-75" : "opacity-25"
                        } transition-opacity duration-300`}
                      ></div>
                      <div className="relative flex flex-col sm:flex-row bg-gray-900 rounded-xl overflow-hidden">
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocused(true)}
                          onBlur={() => setFocused(false)}
                          className="flex-1 px-4 sm:px-5 py-3 sm:py-4 bg-transparent text-amber-100 placeholder-amber-100/50 focus:outline-none text-sm sm:text-base"
                          required
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base"
                        >
                          <span>{loading ? "Checking..." : "Subscribe"}</span>
                          <FontAwesomeIcon icon={faArrowRight} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center p-3 bg-amber-900/30 rounded-lg">
                        <p className="text-amber-100 text-sm sm:text-base">
                          Welcome{" "}
                          <span className="font-bold text-amber-300 break-all">
                            {email}
                          </span>
                        </p>
                        <p className="text-amber-100/80 text-xs sm:text-sm mt-1">
                          Complete your subscription
                        </p>
                      </div>

                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors text-sm sm:text-base"
                        required
                      />

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-[1.02] text-sm sm:text-base"
                      >
                        {loading ? "Subscribing..." : "Complete Subscription"}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Links Sections - Mobile: 2-column grid, Desktop: individual columns */}
          <div className="md:col-span-2 lg:col-span-3 grid grid-cols-2 md:grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-amber-100 mb-3 md:mb-4 lg:mb-6 pb-2 border-b border-amber-800/50 inline-block">
                Shop
              </h3>
              <ul className="space-y-2 md:space-y-3 lg:space-y-4">
                {["Deals", "Cart", "Checkout"].map((item) => (
                  <li key={item}>
                    <Link
                      to={`/${item.toLowerCase().replace(" ", "-")}`}
                      onClick={scrollToTop}
                      className="flex items-center group text-amber-100/80 hover:text-amber-300 transition-all duration-300 text-sm md:text-base"
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-amber-400 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                      {item === "Cart" ? i18n.t("Cart") : item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 md:space-y-4">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-amber-100 mb-3 md:mb-4 lg:mb-6 pb-2 border-b border-amber-800/50 inline-block">
                Support
              </h3>
              <ul className="space-y-2 md:space-y-3 lg:space-y-4">
                {[
                  { label: "Help Center", key: "Help Center" },
                  { label: "Track Order", key: "Track Order" },
                  { label: "Return Policy", key: "Return Policy" },
                  { label: "Report Issue", key: "Report Issue" },
                ].map((item) => (
                  <li key={item.key}>
                    <Link
                      to={`/${item.key.toLowerCase().replace(" ", "-")}`}
                      onClick={scrollToTop}
                      className="flex items-center group text-amber-100/80 hover:text-amber-300 transition-all duration-300 text-sm md:text-base"
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-amber-400 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                      {item.key === "Help Center"
                        ? i18n.t("Help Center")
                        : item.key === "Track Order"
                          ? "Track Order"
                          : item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1 space-y-3 md:space-y-4">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-amber-100 mb-3 md:mb-4 lg:mb-6 pb-2 border-b border-amber-800/50 inline-block">
                Company
              </h3>
              <ul className="space-y-2 md:space-y-3 lg:space-y-4 grid grid-cols-2 md:grid-cols-1 gap-x-4 md:gap-x-0">
                {["About Us", "Contact", "Careers", "Settings"].map((item) => (
                  <li key={item}>
                    <Link
                      to={`/${item.toLowerCase().replace(" ", "-")}`}
                      onClick={scrollToTop}
                      className="flex items-center group text-amber-100/80 hover:text-amber-300 transition-all duration-300 text-sm md:text-base"
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-amber-400 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col md:flex-row-reverse justify-between items-center">
          {/* Social Links */}
          <div className="flex items-center space-x-4 mb-6 md:mb-0">
            <p className="text-amber-100/70 text-sm mr-4 hidden md:block">
              Join Our Community:
            </p>
            <div className="flex space-x-3">
              <a
                className="group relative w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center transition-all duration-300 hover:scale-110"
                href="https://www.facebook.com/profile.php?id=61580711948973"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <FontAwesomeIcon
                  icon={faFacebookF}
                  className="text-amber-100 group-hover:text-white relative z-10 transition-colors duration-300"
                />
              </a>

              <a
                className="group relative w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center transition-all duration-300 hover:scale-110"
                href="https://www.tiktok.com/@nile_flow?_r=1&_t=ZS-92eYXT0eqrF"
                aria-label="TikTok"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-600 to-purple-800 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <FontAwesomeIcon
                  icon={faTiktok}
                  className="text-amber-100 group-hover:text-white relative z-10 transition-colors duration-300"
                />
              </a>

              <a
                className="group relative w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center transition-all duration-300 hover:scale-110"
                href="https://www.instagram.com/nileflowafrica?igsh=NTVoYWR1YW94Y3Bp"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-600 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <FontAwesomeIcon
                  icon={faInstagram}
                  className="text-amber-100 group-hover:text-white relative z-10 transition-colors duration-300"
                />
              </a>

              <a
                className="group relative w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center transition-all duration-300 hover:scale-110"
                href="https://www.linkedin.com/in/nile-flow-683806395?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <FontAwesomeIcon
                  icon={faLinkedinIn}
                  className="text-amber-100 group-hover:text-white relative z-10 transition-colors duration-300"
                />
              </a>
            </div>
          </div>

          <div className="text-center md:text-left">
            <p className="text-amber-100/60 text-sm">
              &copy; {new Date().getFullYear()} Nile Flow. All rights reserved.
            </p>
            <p className="text-amber-100/40 text-xs mt-1">
              Proudly serving Africa with premium e-commerce solutions.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
