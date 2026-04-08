/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Award,
  Zap,
  ArrowRight,
  Globe,
  Users,
  Key,
  Crown,
} from "lucide-react";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";

const SignIn = () => {
  const { signIn, loginWithGoogle, loginWithFacebook } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn(email, password, rememberMe);
      navigate("/home");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await loginWithGoogle();
      navigate("/home");
    } catch (err) {
      setError(err.message || "Failed to sign in with Google");
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const result = await loginWithFacebook();
      navigate("/home");
    } catch (err) {
      setError(err.message || "Failed to sign in with Facebook");
    }
  };

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
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Secure Access
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Welcome Back
            </span>
            <br />
            <span className="text-white">Premium African Marketplace</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Access your exclusive collection of authentic African products and
            personalized recommendations.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-amber-800/30">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-amber-200">
                        Premium Sign In
                      </h2>
                      <p className="text-amber-100/70">
                        Access your Nile Flow account
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  {/* Email Field */}
                  <div>
                    <label className="block text-amber-100 font-medium mb-2">
                      <span className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Email Address</span>
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="relative w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors pl-12"
                        placeholder="Enter your email address"
                        required
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <Mail className="w-5 h-5 text-amber-500" />
                      </div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-amber-100 font-medium mb-2">
                      <span className="flex items-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span>Password</span>
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="relative w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors pl-12 pr-12"
                        placeholder="Enter your password"
                        required
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <Key className="w-5 h-5 text-amber-500" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            rememberMe
                              ? "bg-gradient-to-r from-amber-600 to-amber-700 border-amber-500"
                              : "border-amber-800/50"
                          }`}
                        >
                          {rememberMe && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                      </div>
                      <span className="text-amber-100/80 text-sm">
                        Remember me
                      </span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-gradient-to-r from-red-900/30 to-amber-900/30 backdrop-blur-sm border border-red-700/30 rounded-xl p-4">
                      <div className="flex items-center space-x-2 text-red-200">
                        <Shield className="w-5 h-5" />
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group w-full px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-amber-800/30"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-gradient-to-br from-gray-900/80 to-black/80 text-amber-100/50">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Social Login */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 rounded-xl hover:border-amber-500/50 transition-all duration-300"
                    >
                      <Globe className="w-5 h-5 text-blue-400" />
                      <span className="text-amber-100">Google</span>
                    </button>
                  </div>
                </form>

                {/* Sign Up Link */}
                <div className="p-8 border-t border-amber-800/30 text-center">
                  <p className="text-amber-100/70">
                    Don't have an account?{" "}
                    <Link
                      to="/signup"
                      className="text-amber-400 hover:text-amber-300 font-bold transition-colors group inline-flex items-center space-x-1"
                    >
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Benefits */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 h-full sticky top-8">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-amber-200 mb-2">
                    Premium Benefits
                  </h3>
                  <p className="text-amber-100/70">
                    Unlock exclusive features with your Nile Flow account
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-amber-900/20 to-yellow-900/20 backdrop-blur-sm border border-amber-800/30 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-amber-100 mb-1">
                        Exclusive Access
                      </h4>
                      <p className="text-amber-100/70 text-sm">
                        Premium African products only available to members
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-emerald-900/20 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-emerald-100 mb-1">
                        Fast Checkout
                      </h4>
                      <p className="text-emerald-100/70 text-sm">
                        Save your details for quicker purchases
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 backdrop-blur-sm border border-blue-800/30 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-blue-100 mb-1">
                        Personalized Recommendations
                      </h4>
                      <p className="text-blue-100/70 text-sm">
                        Get tailored product suggestions based on your
                        preferences
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-red-900/20 to-pink-900/20 backdrop-blur-sm border border-red-800/30 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-red-100 mb-1">
                        Secure Account
                      </h4>
                      <p className="text-red-100/70 text-sm">
                        Bank-level security for your personal information
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-8 pt-8 border-t border-amber-800/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-300">
                        100%
                      </div>
                      <div className="text-amber-100/80 text-xs">
                        Secure Login
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-300">
                        24/7
                      </div>
                      <div className="text-emerald-100/80 text-xs">Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Section */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-amber-100/60 text-sm">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>
                Your security is our priority. All data is encrypted and
                protected.
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SignIn;
