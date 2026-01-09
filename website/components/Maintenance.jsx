/* import { useState, useEffect } from "react"; // Added useEffect
import {
  Sparkles,
  Crown,
  Globe,
  Zap,
  Shield,
  Users,
  Bell,
  Mail,
  Phone,
  ArrowRight,
  Star,
  Gem,
  Award,
  Target,
  Compass,
  Heart,
} from "lucide-react";
import newlogo from "../public/images/newlogo.png"; // Change this to your image path

const Maintenance = () => {
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const calculateTimeLeft = () => {
    const launchDate = new Date("January 20, 2026 00:00:00 GMT+0000").getTime();
    const now = new Date().getTime();
    const difference = launchDate - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    }

    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  useEffect(() => {
    // Calculate initial time
    setTimeLeft(calculateTimeLeft());

    // Update timer every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const value = contact.trim();
    let type = "";

    if (value.includes("@")) {
      type = "email";
    } else if (/^\+?[0-9]{7,15}$/.test(value)) {
      type = "whatsapp";
    } else {
      alert("Enter a valid email or WhatsApp number.");
      setSubmitting(false);
      return;
    }

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbxBSmQRloQlYnJpoo8OA0Sw7jgWCZ__wFD-BTgRFypM5JOpS4h__Y7TnxYqa__E5JhU/exec",
        {
          method: "POST",
          body: JSON.stringify({ value, type }),
          contentType: "application/json",
        }
      );

      setContact("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      alert("Connection failed. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-amber-900/30 flex flex-col items-center justify-center text-white relative overflow-hidden">

      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 0 L120 60 L60 120 L0 60 Z' fill='none' stroke='%23d4af37' stroke-width='1.5'/%3E%3C/svg%3E")`,
            backgroundSize: "140px",
            backgroundRepeat: "repeat",
          }}
        ></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "80px",
            backgroundRepeat: "repeat",
          }}
        ></div>
      </div>


      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-r from-emerald-500/5 to-blue-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="absolute top-1/4 left-1/4 animate-float">
        <Gem className="w-8 h-8 text-amber-400/30" />
      </div>
      <div
        className="absolute top-1/3 right-1/4 animate-float"
        style={{ animationDelay: "1s" }}
      >
        <Award className="w-8 h-8 text-emerald-400/30" />
      </div>
      <div
        className="absolute bottom-1/3 left-1/3 animate-float"
        style={{ animationDelay: "2s" }}
      >
        <Heart className="w-8 h-8 text-red-400/30" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto animate-fadeIn">

        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full blur opacity-30"></div>
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
              <img
                src={newlogo}
                alt="Nile Flow Logo"
                className="w-full h-full object-cover p-2"
                onError={(e) => {
                  // Fallback to a gradient if image fails to load
                  e.target.style.display = "none";
                  e.target.parentElement.classList.add(
                    "bg-gradient-to-br",
                    "from-amber-600",
                    "to-amber-700"
                  );
                }}
              />
            </div>
          </div>

          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium African Marketplace
            </span>
            <Star className="w-4 h-4 text-yellow-400" />
          </div>
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
          <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
            NILE FLOW
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-gray-300 font-light mb-10 max-w-2xl mx-auto">
          Premium African eCommerce Experience
        </p>


        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-8 py-4 rounded-2xl border border-amber-700/30 mb-6">
          <Target className="w-6 h-6 text-amber-400 animate-pulse" />
          <span className="text-3xl font-bold text-amber-300">COMING SOON</span>
          <Compass className="w-6 h-6 text-amber-400 animate-pulse" />
        </div>


        <div className="mb-12">
          <div className="bg-gradient-to-br from-amber-900/20 to-black/40 backdrop-blur-sm border border-amber-700/30 rounded-3xl p-8">
            <div className="flex flex-col items-center mb-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
                  <span className="text-xs">🚀</span>
                </div>
                <h3 className="text-2xl font-bold text-amber-200">
                  Launching In
                </h3>
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
                  <span className="text-xs">🔥</span>
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-amber-100/80 text-lg">January 20, 2026</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-amber-900/30 to-transparent backdrop-blur-sm border border-amber-700/20 rounded-2xl">
                  <div className="text-5xl md:text-6xl font-bold text-amber-300 mb-1">
                    {timeLeft.days.toString().padStart(2, "0")}
                  </div>
                  <div className="text-amber-100/70 text-sm">Days</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-amber-900/30 to-transparent backdrop-blur-sm border border-amber-700/20 rounded-2xl">
                  <div className="text-5xl md:text-6xl font-bold text-amber-300 mb-1">
                    {timeLeft.hours.toString().padStart(2, "0")}
                  </div>
                  <div className="text-amber-100/70 text-sm">Hours</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-amber-900/30 to-transparent backdrop-blur-sm border border-amber-700/20 rounded-2xl">
                  <div className="text-5xl md:text-6xl font-bold text-amber-300 mb-1">
                    {timeLeft.minutes.toString().padStart(2, "0")}
                  </div>
                  <div className="text-amber-100/70 text-sm">Minutes</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-amber-900/30 to-transparent backdrop-blur-sm border border-amber-700/20 rounded-2xl">
                  <div className="text-5xl md:text-6xl font-bold text-amber-300 mb-1">
                    {timeLeft.seconds.toString().padStart(2, "0")}
                  </div>
                  <div className="text-amber-100/70 text-sm">Seconds</div>
                </div>
              </div>
            </div>


            <div className="mt-6">
              <div className="flex justify-between text-sm text-amber-100/70 mb-2">
                <span>Launch Progress</span>
                <span>{Math.floor(((365 - timeLeft.days) / 365) * 100)}%</span>
              </div>
              <div className="h-2 bg-amber-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-1000"
                  style={{
                    width: `${Math.floor(
                      ((365 - timeLeft.days) / 365) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>


        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 mb-12">
          <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
            A premium marketplace born from African heritage, community, and
            innovation. Experience authentic products with value rooted in
            tradition, crafted exclusively for our people.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="flex flex-col items-center p-4">
              <Globe className="w-8 h-8 text-amber-400 mb-2" />
              <span className="text-amber-200 text-sm">African Heritage</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <Shield className="w-8 h-8 text-emerald-400 mb-2" />
              <span className="text-emerald-200 text-sm">Premium Quality</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <Users className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-blue-200 text-sm">Community Focus</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <Zap className="w-8 h-8 text-red-400 mb-2" />
              <span className="text-red-200 text-sm">Innovation</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Bell className="w-8 h-8 text-amber-400" />
            <h2 className="text-3xl font-bold text-amber-200">
              Join Our Waitlist
            </h2>
          </div>

          <p className="text-gray-300 mb-8 max-w-md mx-auto">
            Be the first to experience premium African eCommerce. We'll notify
            you as soon as we launch!
          </p>

          {submitted ? (
            <div className="bg-gradient-to-r from-emerald-900/30 to-green-900/20 border border-emerald-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-100">
                    You're on the waitlist!
                  </p>
                  <p className="text-emerald-100/70">
                    We'll notify you as soon as we launch.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 max-w-md mx-auto"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl blur opacity-30"></div>
                <div className="relative flex flex-col sm:flex-row gap-3 bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-2xl overflow-hidden">
                  <div className="flex-1">
                    <div className="flex items-center px-4">
                      {contact.includes("@") ? (
                        <Mail className="w-5 h-5 text-amber-400 mr-2" />
                      ) : (
                        <Phone className="w-5 h-5 text-amber-400 mr-2" />
                      )}
                      <input
                        type="text"
                        required
                        placeholder="Enter your email or WhatsApp number"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        className="w-full py-4 bg-transparent text-amber-100 placeholder-amber-100/50 focus:outline-none text-lg"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Join Waitlist</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  We respect your privacy. No spam, ever.
                </p>
              </div>
            </form>
          )}


          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-300">500+</div>
              <div className="text-amber-100/80 text-sm">Early Signups</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-300">54</div>
              <div className="text-emerald-100/80 text-sm">
                African Countries
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-300">100%</div>
              <div className="text-blue-100/80 text-sm">Premium Quality</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-red-300">24/7</div>
              <div className="text-red-100/80 text-sm">Support</div>
            </div>
          </div>
        </div>


        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Crafted with <Heart className="inline w-4 h-4 text-red-400" /> for
            Africa
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1.6s ease-in-out both;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Maintenance; */

import { useState, useEffect } from "react";
import {
  Sparkles,
  Crown,
  Globe,
  Zap,
  Shield,
  Users,
  Bell,
  Mail,
  Phone,
  ArrowRight,
  Star,
  Gem,
  Award,
  Target,
  Compass,
  Heart,
} from "lucide-react";
import newlogo from "../public/images/newlogo.png"; // Change this to your image path

const Maintenance = () => {
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Countdown timer state - initialize with proper structure
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const calculateTimeLeft = () => {
    // Create launch date for January 20, 2026, 00:00:00 UTC
    const launchDate = new Date("2026-01-20T00:00:00Z").getTime();
    const now = new Date().getTime();
    const difference = launchDate - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    }

    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  useEffect(() => {
    // Calculate and set initial time immediately
    setTimeLeft(calculateTimeLeft());

    // Update timer every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const value = contact.trim();
    let type = "";

    if (value.includes("@")) {
      type = "email";
    } else if (/^\+?[0-9]{7,15}$/.test(value)) {
      type = "whatsapp";
    } else {
      alert("Enter a valid email or WhatsApp number.");
      setSubmitting(false);
      return;
    }

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbxBSmQRloQlYnJpoo8OA0Sw7jgWCZ__wFD-BTgRFypM5JOpS4h__Y7TnxYqa__E5JhU/exec",
        {
          method: "POST",
          body: JSON.stringify({ value, type }),
          contentType: "application/json",
        }
      );

      setContact("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      alert("Connection failed. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-amber-900/30 flex flex-col items-center justify-center text-white relative overflow-hidden">
      {/* Cultural Pattern Layer */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 0 L120 60 L60 120 L0 60 Z' fill='none' stroke='%23d4af37' stroke-width='1.5'/%3E%3C/svg%3E")`,
            backgroundSize: "140px",
            backgroundRepeat: "repeat",
          }}
        ></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "80px",
            backgroundRepeat: "repeat",
          }}
        ></div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-r from-emerald-500/5 to-blue-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* Floating Icons */}
      <div className="absolute top-1/4 left-1/4 animate-float">
        <Gem className="w-8 h-8 text-amber-400/30" />
      </div>
      <div
        className="absolute top-1/3 right-1/4 animate-float"
        style={{ animationDelay: "1s" }}
      >
        <Award className="w-8 h-8 text-emerald-400/30" />
      </div>
      <div
        className="absolute bottom-1/3 left-1/3 animate-float"
        style={{ animationDelay: "2s" }}
      >
        <Heart className="w-8 h-8 text-red-400/30" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto animate-fadeIn">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full blur opacity-30"></div>
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
              <img
                src={newlogo}
                alt="Nile Flow Logo"
                className="w-full h-full object-cover p-2"
                onError={(e) => {
                  // Fallback to a gradient if image fails to load
                  e.target.style.display = "none";
                  e.target.parentElement.classList.add(
                    "bg-gradient-to-br",
                    "from-amber-600",
                    "to-amber-700"
                  );
                }}
              />
            </div>
          </div>

          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium African Marketplace
            </span>
            <Star className="w-4 h-4 text-yellow-400" />
          </div>
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
          <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
            NILE FLOW
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-gray-300 font-light mb-10 max-w-2xl mx-auto">
          Premium African eCommerce Experience
        </p>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-8 py-4 rounded-2xl border border-amber-700/30 mb-6">
          <Target className="w-6 h-6 text-amber-400 animate-pulse" />
          <span className="text-3xl font-bold text-amber-300">COMING SOON</span>
          <Compass className="w-6 h-6 text-amber-400 animate-pulse" />
        </div>

        {/* Countdown Timer - DEBUGGED VERSION */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-amber-900/20 to-black/40 backdrop-blur-sm border border-amber-700/30 rounded-3xl p-8">
            <div className="flex flex-col items-center mb-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
                  <span className="text-xs">🚀</span>
                </div>
                <h3 className="text-2xl font-bold text-amber-200">
                  Launching In
                </h3>
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
                  <span className="text-xs">🔥</span>
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-amber-100/80 text-lg">January 20, 2026</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-amber-900/30 to-transparent backdrop-blur-sm border border-amber-700/20 rounded-2xl">
                  <div
                    className="text-5xl md:text-6xl font-bold text-amber-300 mb-1"
                    style={{ fontFamily: "monospace" }}
                  >
                    {String(timeLeft.days).padStart(2, "0")}
                  </div>
                  <div className="text-amber-100/70 text-sm">Days</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-amber-900/30 to-transparent backdrop-blur-sm border border-amber-700/20 rounded-2xl">
                  <div
                    className="text-5xl md:text-6xl font-bold text-amber-300 mb-1"
                    style={{ fontFamily: "monospace" }}
                  >
                    {String(timeLeft.hours).padStart(2, "0")}
                  </div>
                  <div className="text-amber-100/70 text-sm">Hours</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-amber-900/30 to-transparent backdrop-blur-sm border border-amber-700/20 rounded-2xl">
                  <div
                    className="text-5xl md:text-6xl font-bold text-amber-300 mb-1"
                    style={{ fontFamily: "monospace" }}
                  >
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </div>
                  <div className="text-amber-100/70 text-sm">Minutes</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-amber-900/30 to-transparent backdrop-blur-sm border border-amber-700/20 rounded-2xl">
                  <div
                    className="text-5xl md:text-6xl font-bold text-amber-300 mb-1"
                    style={{ fontFamily: "monospace" }}
                  >
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </div>
                  <div className="text-amber-100/70 text-sm">Seconds</div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-amber-100/70 mb-2">
                <span>Launch Progress</span>
                <span>
                  {timeLeft.days > 0
                    ? Math.floor(((365 - timeLeft.days) / 365) * 100)
                    : 100}
                  %
                </span>
              </div>
              <div className="h-2 bg-amber-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-1000"
                  style={{
                    width: `${
                      timeLeft.days > 0
                        ? Math.floor(((365 - timeLeft.days) / 365) * 100)
                        : 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 mb-12">
          <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
            A premium marketplace born from African heritage, community, and
            innovation. Experience authentic products with value rooted in
            tradition, crafted exclusively for our people.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="flex flex-col items-center p-4">
              <Globe className="w-8 h-8 text-amber-400 mb-2" />
              <span className="text-amber-200 text-sm">African Heritage</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <Shield className="w-8 h-8 text-emerald-400 mb-2" />
              <span className="text-emerald-200 text-sm">Premium Quality</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <Users className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-blue-200 text-sm">Community Focus</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <Zap className="w-8 h-8 text-red-400 mb-2" />
              <span className="text-red-200 text-sm">Innovation</span>
            </div>
          </div>
        </div>

        {/* Waitlist Form */}
        <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Bell className="w-8 h-8 text-amber-400" />
            <h2 className="text-3xl font-bold text-amber-200">
              Join Our Waitlist
            </h2>
          </div>

          <p className="text-gray-300 mb-8 max-w-md mx-auto">
            Be the first to experience premium African eCommerce. We'll notify
            you as soon as we launch!
          </p>

          {submitted ? (
            <div className="bg-gradient-to-r from-emerald-900/30 to-green-900/20 border border-emerald-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-100">
                    You're on the waitlist!
                  </p>
                  <p className="text-emerald-100/70">
                    We'll notify you as soon as we launch.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 max-w-md mx-auto"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl blur opacity-30"></div>
                <div className="relative flex flex-col sm:flex-row gap-3 bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-2xl overflow-hidden">
                  <div className="flex-1">
                    <div className="flex items-center px-4">
                      {contact.includes("@") ? (
                        <Mail className="w-5 h-5 text-amber-400 mr-2" />
                      ) : (
                        <Phone className="w-5 h-5 text-amber-400 mr-2" />
                      )}
                      <input
                        type="text"
                        required
                        placeholder="Enter your email or WhatsApp number"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        className="w-full py-4 bg-transparent text-amber-100 placeholder-amber-100/50 focus:outline-none text-lg"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Join Waitlist</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  We respect your privacy. No spam, ever.
                </p>
              </div>
            </form>
          )}

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-300">500+</div>
              <div className="text-amber-100/80 text-sm">Early Signups</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-300">54</div>
              <div className="text-emerald-100/80 text-sm">
                African Countries
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-300">100%</div>
              <div className="text-blue-100/80 text-sm">Premium Quality</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-red-300">24/7</div>
              <div className="text-red-100/80 text-sm">Support</div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Crafted with <Heart className="inline w-4 h-4 text-red-400" /> for
            Africa
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1.6s ease-in-out both;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Maintenance;
