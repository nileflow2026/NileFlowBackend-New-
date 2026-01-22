/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Building,
  Users,
  ShoppingBag,
  Sun,
  Moon,
  ChevronRight,
  Key,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Globe,
  Store,
} from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [step, setStep] = useState(1); // For multi-step login if needed
  const navigate = useNavigate();
  const { user, signin } = useAuth();

  // Theme state (you can integrate with your theme context)
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    console.log("[Login] Active user:", user);
  }, [user]);

  // Load saved credentials when component mounts
  useEffect(() => {
    const savedCredentials = localStorage.getItem("nileflow_remember_me");
    if (savedCredentials) {
      try {
        const { email: savedEmail, rememberMe: savedRememberMe } =
          JSON.parse(savedCredentials);
        setEmail(savedEmail || "");
        setRememberMe(savedRememberMe || false);
      } catch (error) {
        console.error("Error loading saved credentials:", error);
        // Clear corrupted data
        localStorage.removeItem("nileflow_remember_me");
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await signin(email, password);

      // Handle remember me functionality
      if (rememberMe) {
        // Save email and remember me preference (never save password for security)
        localStorage.setItem(
          "nileflow_remember_me",
          JSON.stringify({
            email: email,
            rememberMe: true,
          })
        );
      } else {
        // Remove saved credentials if remember me is unchecked
        localStorage.removeItem("nileflow_remember_me");
      }

      toast.success("Welcome back! Access granted.", {
        description: "You have successfully logged into Nile Flow Africa Admin",
      });
      navigate("/dashboard");
    } catch (err) {
      const errorMessage =
        err.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
      toast.error("Login Failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info("Password reset feature coming soon!");
    // Implement password reset logic here
  };

  const handleRememberMeChange = (checked) => {
    setRememberMe(checked);

    if (!checked) {
      // If unchecking remember me, remove saved credentials immediately
      localStorage.removeItem("nileflow_remember_me");
    } else if (email) {
      // If checking remember me and email exists, save it
      localStorage.setItem(
        "nileflow_remember_me",
        JSON.stringify({
          email: email,
          rememberMe: true,
        })
      );
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
    // Integrate with your theme context if available
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF7F2] via-[#F5E6D3] to-[#E8D6B5] dark:from-[#1A1A1A] dark:via-[#242424] dark:to-[#2A2A2A] p-4 md:p-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-10 dark:opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-[#D4A017] to-[#8B6914] blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-[#27AE60] to-[#2ECC71] blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-gradient-to-r from-[#3498DB] to-[#2980B9] blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl">
          {/* Left Panel - Brand Showcase */}
          <div className="hidden lg:flex flex-col p-12 bg-gradient-to-br from-[#D4A017] via-[#B8860B] to-[#8B6914] text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col justify-between h-full">
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Building className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Nile Flow Africa</h1>
                    <p className="text-sm opacity-90">Admin Portal</p>
                  </div>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  Powering African
                  <br />
                  Commerce Excellence
                </h2>
                <p className="text-lg opacity-90 mb-8">
                  Access your centralized dashboard to manage marketplace
                  operations, track performance, and drive growth across Africa.
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Real-time Analytics</p>
                    <p className="text-sm opacity-80">
                      Monitor sales, inventory, and customer insights
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">User Management</p>
                    <p className="text-sm opacity-80">
                      Manage customers, vendors, and admin roles
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Multi-region Support</p>
                    <p className="text-sm opacity-80">
                      Optimized for African markets and currencies
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-8 border-t border-white/20">
                <p className="text-sm opacity-80">
                  <span className="font-semibold">Need help?</span> Contact our
                  support team
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="bg-white dark:bg-[#1A1A1A] p-8 md:p-12">
            {/* Theme Toggle - Top Right */}
            <div className="flex justify-end mb-6">
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A] dark:to-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:shadow-lg transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Form Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
                Admin Portal
              </h1>
              <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-2">
                Secure access to your marketplace dashboard
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="admin@nilemart.africa"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-[#FAF7F2] dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent transition-all duration-200"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                    <Mail className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-[#8B4513] dark:text-[#D4A017] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-[#FAF7F2] dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent transition-all duration-200"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                    <Key className="w-5 h-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017] hover:text-[#B8860B] dark:hover:text-[#FFD700]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Error */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => handleRememberMeChange(e.target.checked)}
                    className="w-4 h-4 rounded border-[#E8D6B5] text-[#D4A017] focus:ring-[#D4A017]"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                    Remember me
                  </span>
                </label>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-[#E74C3C]">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#D4A017] via-[#B8860B] to-[#8B6914] text-white font-semibold hover:shadow-xl hover:scale-[1.02] transform transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Security Info */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#E8D6B5]/10 to-[#D4A017]/5 dark:from-[#3A3A3A]/30 dark:to-[#2A2A2A]/50 border border-[#E8D6B5] dark:border-[#3A3A3A]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                      Secure Connection
                    </p>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Your credentials are encrypted and protected
                    </p>
                  </div>
                </div>
              </div>
            </form>

            {/* Register Link */}
            <div className="text-center pt-6 border-t border-[#E8D6B5] dark:border-[#3A3A3A]">
              <p className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                Don't have an admin account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[#D4A017] dark:text-[#FFD700] hover:underline inline-flex items-center gap-1"
                >
                  Request Access
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-[#8B4513]/50 dark:text-[#D4A017]/50">
                © {new Date().getFullYear()} Nile Flow Africa. All rights
                reserved.
              </p>
              <p className="text-xs text-[#8B4513]/50 dark:text-[#D4A017]/50 mt-1">
                African Commerce Platform v2.1
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Features */}
        <div className="lg:hidden mt-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/50 dark:bg-[#2A2A2A]/50 backdrop-blur-sm border border-white/30 dark:border-[#3A3A3A]">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                Real-time Dashboard
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/50 dark:bg-[#2A2A2A]/50 backdrop-blur-sm border border-white/30 dark:border-[#3A3A3A]">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                Enterprise Security
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="fixed bottom-4 right-4 z-20">
        <div className="flex items-center gap-2 text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#27AE60] to-[#2ECC71] animate-pulse"></span>
          System Status: Operational
        </div>
      </div>

      {/* Custom Styles for Animations */}
      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .floating-element {
          animation: float 6s ease-in-out infinite;
        }

        input:focus {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(212, 160, 23, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(212, 160, 23, 0);
          }
        }
      `}</style>
    </div>
  );
}
