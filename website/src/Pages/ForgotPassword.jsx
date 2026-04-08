/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  Lock,
  Mail,
  ArrowLeft,
  CheckCircle,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";

const ForgotPassword = () => {
  const { forgotPassword } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setEmailSent(true);
      } else {
        setError(
          result.error || "Failed to send reset email. Please try again.",
        );
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
                Check Your Email
              </span>
            </h1>

            <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
              We've sent a password reset link to{" "}
              <span className="font-semibold text-amber-300">{email}</span>
            </p>

            {/* Email Card */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 mb-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-emerald-900/20 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-emerald-100 mb-1">
                      Reset Link Sent
                    </h3>
                    <p className="text-emerald-100/70 text-sm">
                      Check your inbox and click the reset link to create a new
                      password
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-amber-900/20 to-yellow-900/20 backdrop-blur-sm border border-amber-800/30 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-amber-100 mb-1">
                      Link Expires Soon
                    </h3>
                    <p className="text-amber-100/70 text-sm">
                      Use the reset link within 1 hour for security
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 backdrop-blur-sm border border-blue-800/30 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-blue-100 mb-1">
                      Check Spam Folder
                    </h3>
                    <p className="text-blue-100/70 text-sm">
                      If you don't see the email, check your spam or junk folder
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => setEmailSent(false)}
                className="group w-full max-w-md mx-auto px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              >
                <Mail className="w-5 h-5" />
                <span>Send Another Email</span>
              </button>

              <Link
                to="/signin"
                className="group inline-flex items-center space-x-2 text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Sign In</span>
              </Link>
            </div>
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
            <Lock className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Password Recovery
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Forgot Your Password?
            </span>
            <br />
            <span className="text-white">No Worries, We've Got You</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Enter your email address and we'll send you a secure link to reset
            your password.
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
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-amber-200">
                    Reset Password
                  </h2>
                  <p className="text-amber-100/70">
                    We'll email you reset instructions
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
                <p className="text-amber-100/60 text-sm mt-2">
                  Enter the email associated with your Nile Flow account
                </p>
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
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>

              {/* Back to Sign In */}
              <div className="text-center pt-4">
                <Link
                  to="/signin"
                  className="group inline-flex items-center space-x-2 text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>

            {/* Security Notice */}
            <div className="p-8 border-t border-amber-800/30">
              <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 backdrop-blur-sm border border-blue-800/30 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-blue-400 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="text-blue-100 font-semibold mb-1">
                      Secure Password Reset
                    </h4>
                    <p className="text-blue-100/70 text-sm">
                      We'll send you a secure link that expires in 1 hour. For
                      your security, never share this link with anyone.
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

export default ForgotPassword;
