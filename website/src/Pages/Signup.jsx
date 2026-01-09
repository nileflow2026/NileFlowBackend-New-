import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  ArrowRight,
  Award,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Gem,
  Globe,
  Mail,
  Phone,
  Shield,
  Sparkles,
  User,
  UserPlus,
  Users,
  Check,
  ArrowLeft,
} from "lucide-react";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";
import {
  resendCode,
  verifyAccount,
} from "../../authServices";

const SignUp = () => {
  const { signUp } = useCustomerAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState("signup"); // 'signup' or 'verify'
  const [verificationCode, setVerificationCode] = useState(
    new Array(6).fill("")
  );
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const navigate = useNavigate();

  // Initialize state from localStorage and auto-clear old attempts
  useEffect(() => {
    const signupStep = localStorage.getItem("signupStep");
    const signupEmail = localStorage.getItem("signupEmail");
    const signupTimestamp = localStorage.getItem("signupTimestamp");

    if (signupTimestamp) {
      const timestamp = parseInt(signupTimestamp);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

      // Auto-clear attempts older than 1 hour
      if (now - timestamp > oneHour) {
        localStorage.removeItem("signupStep");
        localStorage.removeItem("signupEmail");
        localStorage.removeItem("signupTimestamp");
        setStep("signup");
        setEmail("");
      } else if (signupStep === "verify" && signupEmail) {
        // Restore verification state
        setStep("verify");
        setEmail(signupEmail);
        setTimeLeft(60);
        setCanResend(false);
      }
    }
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await signUp(email, password, username, phone);

      if (result.success) {
        if (result.verificationNeeded) {
          // Save signup state to localStorage
          localStorage.setItem("signupStep", "verify");
          localStorage.setItem("signupEmail", email);
          localStorage.setItem("signupTimestamp", Date.now().toString());

          // Switch to verification step
          setStep("verify");
          setTimeLeft(60); // Reset timer
          setCanResend(false);
          showVerificationToast();
        } else {
          showSuccessToast();
          setTimeout(() => navigate("/signin"), 1500);
        }
      } else {
        showErrorToast(result.error || "Signup failed. Please try again.");
      }
    } catch (err) {
      showErrorToast(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fullCode = verificationCode.join("");

    // Validate code length
    if (fullCode.length !== 6) {
      showErrorToast("Please enter the complete 6-digit code");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await verifyAccount(email, fullCode);

      if (result.success) {
        // User is now verified AND authenticated via httpOnly cookies
        showSuccessToast(
          "Account verified successfully! Complete your profile..."
        );

        // Clear guest status if exists
        localStorage.removeItem("isGuest");

        // Clear ALL signup localStorage items on successful verification
        localStorage.removeItem("signupStep");
        localStorage.removeItem("signupEmail");
        localStorage.removeItem("signupTimestamp");

        // Redirect to home page after successful verification
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        showErrorToast(
          result.error || "Verification failed. Please try again."
        );
      }
    } catch (err) {
      console.error("Verification error:", err);
      showErrorToast(
        err.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToSignup = () => {
    // Clear localStorage and reset to signup step
    localStorage.removeItem("signupStep");
    localStorage.removeItem("signupEmail");
    localStorage.removeItem("signupTimestamp");

    // Reset form state
    setStep("signup");
    setVerificationCode(new Array(6).fill(""));
    setTimeLeft(60);
    setCanResend(false);
  };

  const handleResendCode = async (e) => {
    e.preventDefault();
    try {
      await resendCode(email);
      setTimeLeft(60);
      setCanResend(false);
      showVerificationToast("New code sent to your email!");
    } catch (err) {
      showErrorToast("Failed to resend code: " + err.message);
    }
  };

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newCode = [...verificationCode];
    newCode[index] = element.value;
    setVerificationCode(newCode);

    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, 6);
    if (pasteData.length === 6 && !isNaN(pasteData)) {
      const newCode = pasteData.split("");
      setVerificationCode(newCode);
    }
  };

  const showSuccessToast = () => {
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
            <p class="font-bold text-white">Account Created!</p>
            <p class="text-emerald-100 text-sm">Welcome to Nile Flow Premium</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const showErrorToast = (message) => {
    const toast = document.createElement("div");
    toast.className = "fixed top-4 right-4 z-50 animate-fadeIn";
    toast.innerHTML = `
      <div class="bg-gradient-to-r from-red-900/80 to-amber-900/80 backdrop-blur-sm border border-red-700/50 rounded-2xl p-4 shadow-2xl">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <div>
            <p class="font-bold text-white">Registration Failed</p>
            <p class="text-red-100 text-sm">${message}</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const showVerificationToast = (
    message = "Verification code sent to your email!"
  ) => {
    const toast = document.createElement("div");
    toast.className = "fixed top-4 right-4 z-50 animate-fadeIn";
    toast.innerHTML = `
    <div class="bg-gradient-to-r from-blue-900/80 to-cyan-900/80 backdrop-blur-sm border border-blue-700/50 rounded-2xl p-4 shadow-2xl">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
        </div>
        <div>
          <p class="font-bold text-white">Check Your Email</p>
          <p class="text-blue-100 text-sm">${message}</p>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium Membership
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Join Nile Flow
            </span>
            <br />
            <span className="text-white">Premium African Marketplace</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Create your premium account to access exclusive African products,
            members-only deals, and cultural experiences.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-300">500+</div>
              <div className="text-amber-100/80 text-sm">Premium Products</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-300">100%</div>
              <div className="text-emerald-100/80 text-sm">
                Authentic Quality
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-300">54</div>
              <div className="text-blue-100/80 text-sm">African Countries</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-300">24/7</div>
              <div className="text-red-100/80 text-sm">Premium Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Registration Form */}
            <div>
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-amber-800/30">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-amber-200">
                        Create Account
                      </h2>
                      <p className="text-amber-100/70">
                        Join our premium African marketplace
                      </p>
                    </div>
                  </div>
                </div>

                {step === "signup" ? (
                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-amber-100 font-medium mb-2">
                        <span className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Full Name</span>
                        </span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="relative w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-amber-100 font-medium mb-2">
                        <span className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Phone Number</span>
                        </span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="relative w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors"
                          placeholder="+254 700 000 000"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
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
                          className="relative w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors"
                          placeholder="Enter your email address"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
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
                          className="relative w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors pr-12"
                          placeholder="Create a strong password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-amber-100/50 text-xs mt-2">
                        Use at least 8 characters with letters, numbers, and
                        symbols
                      </p>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="terms"
                        className="mt-1 w-4 h-4 bg-gray-900 border-amber-700 rounded focus:ring-amber-500 focus:ring-2"
                        required
                      />
                      <label
                        htmlFor="terms"
                        className="text-amber-100/70 text-sm"
                      >
                        I agree to Nile Flow's{" "}
                        <Link
                          to="/terms"
                          className="text-amber-300 hover:text-amber-200 underline"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/privacy"
                          className="text-amber-300 hover:text-amber-200 underline"
                        >
                          Privacy Policy
                        </Link>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group w-full px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Premium Account</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>

                    {/* Sign In Link */}
                    <p className="text-center text-amber-100/70">
                      Already have an account?{" "}
                      <Link
                        to="/signin"
                        className="text-amber-300 hover:text-amber-200 font-semibold inline-flex items-center space-x-1"
                      >
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </p>
                  </form>
                ) : (
                  /* --- New verification form --- */
                  <div className="p-8 space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-amber-200">
                        Verify Your Email
                      </h2>
                      <p className="text-amber-100/70 mt-2">
                        Enter the 6-digit code sent to {email}
                      </p>
                    </div>

                    {/* Back to Signup Button */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleBackToSignup}
                        className="inline-flex items-center space-x-2 text-amber-300 hover:text-amber-200 font-medium transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Signup</span>
                      </button>
                    </div>

                    <form onSubmit={handleVerification} className="space-y-6">
                      <div className="flex justify-center space-x-2">
                        {verificationCode.map((data, index) => (
                          <input
                            key={index}
                            type="text"
                            maxLength="1"
                            value={data}
                            onChange={(e) => handleChange(e.target, index)}
                            onFocus={(e) => e.target.select()}
                            onPaste={handlePaste}
                            onKeyUp={(e) => {
                              if (
                                e.key === "Backspace" &&
                                e.target.value === ""
                              ) {
                                if (e.target.previousSibling) {
                                  e.target.previousSibling.focus();
                                }
                              }
                            }}
                            className="w-14 h-14 text-center text-2xl font-bold bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 focus:border-amber-500 focus:outline-none"
                            required
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify Account</span>
                            <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </>
                        )}
                      </button>

                      <div className="text-center">
                        <p className="text-amber-100/70 text-sm">
                          Didn't receive the code?{" "}
                          {canResend ? (
                            <button
                              type="button"
                              onClick={handleResendCode}
                              className="text-amber-300 hover:text-amber-200 font-semibold"
                              disabled={isSubmitting}
                            >
                              Resend Code
                            </button>
                          ) : (
                            <span className="text-amber-100/50">
                              Resend in {timeLeft}s
                            </span>
                          )}
                        </p>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Benefits & Features */}
            <div>
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 h-full">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-amber-200 mb-2">
                    Premium Benefits
                  </h2>
                  <p className="text-amber-100/70">
                    Unlock exclusive features with your Nile Flow account
                  </p>
                </div>

                {/* Benefits List */}
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl hover:border-amber-500/50 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center flex-shrink-0">
                      <Gem className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-amber-100 mb-1">
                        Exclusive Products
                      </h3>
                      <p className="text-amber-100/70">
                        Access premium African products not available to regular
                        users
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl hover:border-amber-500/50 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-emerald-100 mb-1">
                        Priority Support
                      </h3>
                      <p className="text-emerald-100/70">
                        24/7 premium customer service with faster response times
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl hover:border-amber-500/50 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-100 mb-1">
                        Cultural Access
                      </h3>
                      <p className="text-blue-100/70">
                        Connect with authentic African artisans and producers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl hover:border-amber-500/50 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-100 mb-1">
                        Secure Transactions
                      </h3>
                      <p className="text-red-100/70">
                        Bank-level security for all your purchases and data
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-8 pt-8 border-t border-amber-800/30">
                  <h3 className="text-lg font-bold text-amber-200 mb-4">
                    Why Nile Flow?
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                      <Users className="w-6 h-6 text-amber-400 mb-2" />
                      <h4 className="text-amber-100 font-bold text-sm">
                        African Community
                      </h4>
                      <p className="text-amber-100/70 text-xs">
                        Supporting 1000+ artisans
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                      <CheckCircle className="w-6 h-6 text-emerald-400 mb-2" />
                      <h4 className="text-emerald-100 font-bold text-sm">
                        Quality Guarantee
                      </h4>
                      <p className="text-emerald-100/70 text-xs">
                        100% authentic products
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8">
                  <div className="bg-gradient-to-r from-amber-900/20 to-emerald-900/20 backdrop-blur-sm border border-amber-700/30 rounded-2xl p-6 text-center">
                    <h3 className="text-lg font-bold text-amber-200 mb-2">
                      Ready to Join?
                    </h3>
                    <p className="text-amber-100/70 text-sm mb-4">
                      Create your account in less than 2 minutes
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-amber-300 text-sm">
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                      <span>Fast & secure registration</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center">
              <div className="text-2xl font-bold text-amber-300 mb-2">100%</div>
              <div className="text-amber-100/80">Secure Registration</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6 text-center">
              <div className="text-2xl font-bold text-emerald-300 mb-2">
                24/7
              </div>
              <div className="text-emerald-100/80">Account Support</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6 text-center">
              <div className="text-2xl font-bold text-blue-300 mb-2">Free</div>
              <div className="text-blue-100/80">Premium Membership</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-6 text-center">
              <div className="text-2xl font-bold text-red-300 mb-2">
                Instant
              </div>
              <div className="text-red-100/80">Account Access</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SignUp;
