import React, { useEffect, useState } from "react";
import Header from "../../components/Header"; // Adjust path if needed
import Footer from "../../components/Footer"; // Adjust path if needed
import { Link } from "react-router-dom";
import { changeLanguage, initializeLanguage } from "../../i18n";
import {
  Globe,
  Check,
  Sparkles,
  Volume2,
  Users,
  Shield,
  Award,
  ChevronRight,
  Languages,
  Earth,
  Star,
} from "lucide-react";

const languages = [
  {
    lang: "en",
    label: "English",
    description: "International business language",
    region: "Global",
    flag: "🌍",
    speakers: "1.5B+ speakers",
  },
  {
    lang: "kis",
    label: "Kiswahili",
    description: "East African cultural language",
    region: "East Africa",
    flag: "🦁",
    speakers: "100M+ speakers",
  },
  {
    lang: "fr",
    label: "Français",
    description: "West and Central African language",
    region: "Francophone Africa",
    flag: "🗼",
    speakers: "300M+ speakers",
  },
  {
    lang: "pt",
    label: "Português",
    description: "Lusophone African countries",
    region: "Lusophone Africa",
    flag: "⚓",
    speakers: "260M+ speakers",
  },
  {
    lang: "ar",
    label: "العربية",
    description: "North African cultural language",
    region: "North Africa",
    flag: "☪️",
    speakers: "400M+ speakers",
  },
  {
    lang: "yo",
    label: "Yorùbá",
    description: "West African cultural language",
    region: "West Africa",
    flag: "👑",
    speakers: "50M+ speakers",
  },
  {
    lang: "ha",
    label: "Hausa",
    description: "West African trade language",
    region: "West Africa",
    flag: "🐪",
    speakers: "80M+ speakers",
  },
  {
    lang: "zu",
    label: "isiZulu",
    description: "Southern African cultural language",
    region: "Southern Africa",
    flag: "🏔️",
    speakers: "28M+ speakers",
  },
];

const Language = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [displayedLanguages, setDisplayedLanguages] = useState(
    languages.slice(0, 2),
  );
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  useEffect(() => {
    initializeLanguage();
    const savedLang =
      localStorage.getItem("app_language") ||
      navigator.language.split("-")[0] ||
      "en";
    setSelectedLanguage(savedLang);

    // Check if user's browser language is not in basic list
    if (!["en", "kis"].includes(savedLang)) {
      setDisplayedLanguages(languages);
      setShowAllLanguages(true);
    }
  }, []);

  // Define which languages are actually available
  const availableLanguages = ["en"]; // Only English is available for now

  const handleLanguageChange = (lang) => {
    // Check if language is available
    if (availableLanguages.includes(lang)) {
      changeLanguage(lang);
      setSelectedLanguage(lang);
      showLanguageChangeToast(lang);
    } else {
      // Show coming soon message for unavailable languages
      showComingSoonToast(lang);
    }
  };

  const showLanguageChangeToast = (lang) => {
    const langInfo = languages.find((l) => l.lang === lang);
    const toast = document.createElement("div");
    toast.className = "fixed top-4 right-4 z-50 animate-fadeIn";
    toast.innerHTML = `
      <div class="bg-gradient-to-r from-emerald-900/80 to-green-900/80 backdrop-blur-sm border border-emerald-700/50 rounded-2xl p-4 shadow-2xl">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div>
            <p class="font-bold text-white">Language Updated</p>
            <p class="text-emerald-100 text-sm">Now browsing in ${
              langInfo?.label || lang
            }</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const showComingSoonToast = (lang) => {
    const langInfo = languages.find((l) => l.lang === lang);
    const toast = document.createElement("div");
    toast.className = "fixed top-4 right-4 z-50 animate-fadeIn";
    toast.innerHTML = `
      <div class="bg-gradient-to-r from-amber-900/80 to-yellow-900/80 backdrop-blur-sm border border-amber-700/50 rounded-2xl p-4 shadow-2xl">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <div>
            <p class="font-bold text-white">Coming Soon!</p>
            <p class="text-amber-100 text-sm">${langInfo?.label || lang} translation is being developed</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
  };

  const toggleAllLanguages = () => {
    setShowAllLanguages(!showAllLanguages);
    setDisplayedLanguages(showAllLanguages ? languages.slice(0, 2) : languages);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <Languages className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Cultural Experience
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Language Settings
            </span>
            <br />
            <span className="text-white">African Cultural Interface</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Experience Nile Flow in your preferred language. Choose from our
            supported African and international languages for a personalized
            shopping experience.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-300">8+</div>
              <div className="text-amber-100/80 text-sm">Languages</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-300">54</div>
              <div className="text-emerald-100/80 text-sm">African Nations</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-300">100%</div>
              <div className="text-blue-100/80 text-sm">
                Translation Accuracy
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-300">24/7</div>
              <div className="text-red-100/80 text-sm">Language Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-4xl mx-auto">
          {/* Current Language Indicator */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-amber-100 text-sm">
                      Currently Browsing In
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-white">
                        {
                          languages.find((l) => l.lang === selectedLanguage)
                            ?.flag
                        }
                      </span>
                      <h2 className="text-2xl font-bold text-amber-300">
                        {
                          languages.find((l) => l.lang === selectedLanguage)
                            ?.label
                        }
                      </h2>
                    </div>
                    <p className="text-amber-100/70 text-sm mt-1">
                      {
                        languages.find((l) => l.lang === selectedLanguage)
                          ?.description
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-emerald-900/40 to-green-900/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-700/30">
                    <Volume2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-200">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Language Selection */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-amber-200">
                  Available Languages
                </h2>
                <p className="text-amber-100/70">
                  Select your preferred browsing language
                </p>
              </div>
              <div className="text-amber-400">
                <Earth className="w-8 h-8" />
              </div>
            </div>

            {/* Languages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedLanguages.map(
                ({ lang, label, description, region, flag, speakers }) => {
                  const isSelected = selectedLanguage === lang;
                  const isAvailable = availableLanguages.includes(lang);

                  return (
                    <div
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`group relative p-6 rounded-2xl border backdrop-blur-sm cursor-pointer transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 border-amber-500/50 shadow-lg shadow-amber-900/30"
                          : isAvailable
                            ? "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 hover:border-amber-500/50"
                            : "bg-gradient-to-r from-gray-900/30 to-black/30 border-gray-700/30 hover:border-gray-500/50 opacity-75"
                      }`}
                    >
                      {/* Selection Indicator or Coming Soon Badge */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center shadow-lg">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                      {!isAvailable && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs font-bold px-2 py-1 rounded-full border border-gray-500">
                          Coming Soon
                        </div>
                      )}

                      {/* Language Flag */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                            isSelected
                              ? "bg-gradient-to-br from-amber-500 to-yellow-600"
                              : isAvailable
                                ? "bg-gradient-to-br from-gray-800 to-black border border-amber-800/30"
                                : "bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600/30 grayscale"
                          }`}
                        >
                          {flag}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3
                              className={`text-xl font-bold ${
                                isSelected
                                  ? "text-amber-300"
                                  : isAvailable
                                    ? "text-white"
                                    : "text-gray-300"
                              }`}
                            >
                              {label}
                            </h3>
                            {lang === "en" && (
                              <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-2 py-1 rounded border border-amber-700/30">
                                <Star className="w-3 h-3 text-amber-400" />
                                <span className="text-xs text-amber-200">
                                  Available
                                </span>
                              </div>
                            )}
                          </div>
                          <p
                            className={`text-sm mt-1 ${
                              isAvailable
                                ? "text-amber-100/70"
                                : "text-gray-400/70"
                            }`}
                          >
                            {description}
                          </p>
                        </div>
                      </div>

                      {/* Language Details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Users
                            className={`w-4 h-4 ${
                              isAvailable ? "text-amber-400" : "text-gray-500"
                            }`}
                          />
                          <span
                            className={`text-xs ${
                              isAvailable
                                ? "text-amber-100/80"
                                : "text-gray-400/80"
                            }`}
                          >
                            {speakers}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield
                            className={`w-4 h-4 ${
                              isAvailable ? "text-emerald-400" : "text-gray-500"
                            }`}
                          />
                          <span
                            className={`text-xs ${
                              isAvailable
                                ? "text-emerald-100/80"
                                : "text-gray-400/80"
                            }`}
                          >
                            {region}
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
                        <ChevronRight
                          className={`w-5 h-5 ${
                            isSelected ? "text-amber-300" : "text-amber-400"
                          }`}
                        />
                      </div>

                      {/* Selection Glow */}
                      {isSelected && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl blur opacity-20"></div>
                      )}
                    </div>
                  );
                },
              )}
            </div>

            {/* View More Button */}
            {languages.length > 2 && (
              <div className="mt-8 text-center">
                <button
                  onClick={toggleAllLanguages}
                  className="group inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm border border-amber-700/40 rounded-xl hover:border-amber-500/60 transition-all duration-300"
                >
                  <span className="text-amber-200 font-medium">
                    {showAllLanguages
                      ? "Show Less Languages"
                      : "Show All African Languages"}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-amber-400 transition-transform duration-300 ${
                      showAllLanguages
                        ? "rotate-90"
                        : "group-hover:translate-x-1"
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Language Benefits */}
            <div className="mt-8 pt-8 border-t border-amber-800/30">
              <h3 className="text-lg font-bold text-amber-200 mb-4">
                Language Benefits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                  <Award className="w-8 h-8 text-amber-400 mb-2" />
                  <h4 className="text-amber-100 font-bold">
                    Cultural Accuracy
                  </h4>
                  <p className="text-amber-100/70 text-sm mt-1">
                    Authentic translations for African products
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                  <Shield className="w-8 h-8 text-emerald-400 mb-2" />
                  <h4 className="text-emerald-100 font-bold">Local Support</h4>
                  <p className="text-emerald-100/70 text-sm mt-1">
                    Native speakers for customer service
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                  <Globe className="w-8 h-8 text-blue-400 mb-2" />
                  <h4 className="text-blue-100 font-bold">Global Reach</h4>
                  <p className="text-blue-100/70 text-sm mt-1">
                    Accessible across all African regions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Language;
