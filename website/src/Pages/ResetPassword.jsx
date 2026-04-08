/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Shield,
  Key,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";

const ResetPassword = () => {
  const { resetPassword } = useCustomerAuth();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      navigate("/forgot-password");
    }
  }, [token, email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword(email, token, password);
      if (result.success) {
        setResetSuccess(true);
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          navigate("/signin");
        }, 3000);
      } else {
        setError(result.error || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <Header />

        <div className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>

          <div className="relative max-w-2xl mx-auto text-center">
            {/* Success Icon */}
            <div className="mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-300 via-green-200 to-amber-200 bg-clip-text text-transparent">
                Password Reset Successfully!
              </span>
            </h1>

            <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
              Your password has been updated. You can now sign in with your new
              password.
            </p>

            {/* Success Card */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 mb-8">
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-emerald-900/20 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-emerald-100 mb-1">
                    Secure Password Set
                  </h3>
                  <p className="text-emerald-100/70 text-sm">
                    Your account is now protected with your new password
                  </p>
                </div>
              </div>

              <div className="mt-6 text-amber-100/60 text-sm">
                Redirecting you to sign in page in 3 seconds...
              </div>
            </div>

            {/* Action Button */}
            <Link
              to="/signin"
              className="group inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <span>Sign In Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <Key className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Secure Reset
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Create New Password
            </span>
            <br />
            <span className="text-white">Secure Your Account</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Choose a strong password to protect your Nile Flow account and
            access premium features.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-amber-800/30">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-amber-200">
                    Reset Password
                  </h2>
                  <p className="text-amber-100/70">
                    Enter your new password below
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* New Password Field */}
              <div>
                <label className="block text-amber-100 font-medium mb-2">
                  <span className="flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>New Password</span>
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="relative w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors pl-12 pr-12"
                    placeholder="Enter new password"
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
                <p className="text-amber-100/60 text-sm mt-2">
                  Must be at least 8 characters long
                </p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-amber-100 font-medium mb-2">
                  <span className="flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>Confirm New Password</span>
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="relative w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors pl-12 pr-12"
                    placeholder="Confirm new password"
                    required
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Key className="w-5 h-5 text-amber-500" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 backdrop-blur-sm border border-blue-800/30 rounded-xl p-4">
                <h4 className="text-blue-100 font-semibold mb-2 flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Password Requirements</span>
                </h4>
                <div className="space-y-1 text-sm">
                  <div
                    className={`flex items-center space-x-2 ${password.length >= 8 ? "text-emerald-300" : "text-blue-100/70"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${password.length >= 8 ? "bg-emerald-400" : "bg-blue-400/30"}`}
                    ></div>
                    <span>At least 8 characters</span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 ${password === confirmPassword && password.length > 0 ? "text-emerald-300" : "text-blue-100/70"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${password === confirmPassword && password.length > 0 ? "bg-emerald-400" : "bg-blue-400/30"}`}
                    ></div>
                    <span>Passwords match</span>
                  </div>
                </div>
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
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <Key className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="p-8 border-t border-amber-800/30">
              <div className="bg-gradient-to-r from-emerald-900/20 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="text-emerald-100 font-semibold mb-1">
                      Your Security Matters
                    </h4>
                    <p className="text-emerald-100/70 text-sm">
                      After resetting your password, you'll be automatically
                      signed out of all devices for your security. You can sign
                      back in immediately with your new password.
                    </p>
                  </div>
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

export default ResetPassword;
