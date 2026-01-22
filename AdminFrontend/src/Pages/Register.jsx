import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupAdmin } from "../../authService";
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  ArrowLeft,
  Store,
  Award,
} from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  // Password strength checker
  const checkPasswordStrength = (pass) => {
    const requirements = {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /\d/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    };

    const metCount = Object.values(requirements).filter(Boolean).length;
    return {
      score: metCount,
      requirements,
      strength: metCount >= 4 ? "strong" : metCount >= 2 ? "medium" : "weak",
    };
  };

  const passwordStrength = checkPasswordStrength(password);

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!username.trim()) {
      errors.username = "Full name is required";
    } else if (username.length < 2) {
      errors.username = "Name must be at least 2 characters";
    }

    if (!phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^[+]?[\d\s-]+$/.test(phone)) {
      errors.phone = "Enter a valid phone number";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (passwordStrength.score < 3) {
      errors.password = "Password is too weak";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!termsAccepted) {
      errors.terms = "You must accept the terms and conditions";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    try {
      await signupAdmin(email, password, username, phone);

      toast.success("Account created successfully!", {
        description: "Welcome to Nile Flow Africa Admin Panel",
        duration: 5000,
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      });

      // Navigate to login after successful registration
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);

      // Handle specific error messages
      let errorMessage = "Registration failed";
      if (err.message.includes("email")) {
        errorMessage = "Email already exists";
      } else if (err.message.includes("password")) {
        errorMessage = "Password requirements not met";
      } else if (err.message.includes("network")) {
        errorMessage = "Network error. Please check your connection";
      }

      toast.error(errorMessage, {
        description: err.message || "Please try again",
        duration: 5000,
        icon: <Shield className="w-5 h-5 text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F5F0E6] to-[#FAF7F2] dark:from-[#1A1A1A] dark:via-[#242424] dark:to-[#1A1A1A] p-4 md:p-6 flex items-center justify-center">
      {/* Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-[#D4A017]/5 to-[#B8860B]/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-[#27AE60]/5 to-[#2ECC71]/5 rounded-full translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Branding & Info */}
          <div className="hidden lg:flex flex-col justify-center p-8">
            <div className="max-w-md">
              <Link
                to="/"
                className="inline-flex items-center gap-3 mb-8 group"
              >
                <ArrowLeft className="w-5 h-5 text-[#8B4513] dark:text-[#D4A017] group-hover:translate-x-[-4px] transition-transform" />
                <span className="text-sm font-medium text-[#8B4513] dark:text-[#D4A017]">
                  Back to Home
                </span>
              </Link>

              <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#D4A017] to-[#8B6914] flex items-center justify-center shadow-xl">
                    <Store className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
                      Nile Flow Africa
                    </h1>
                    <p className="text-sm font-medium text-[#8B4513] dark:text-[#D4A017] uppercase tracking-wider">
                      Admin Portal
                    </p>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                  Join Africa's Premier
                  <br />
                  Commerce Platform
                </h2>
                <p className="text-lg text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Manage your marketplace with powerful tools designed for
                  African entrepreneurs.
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-1">
                      Enterprise Security
                    </h3>
                    <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Bank-level encryption and secure authentication
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-1">
                      Advanced Analytics
                    </h3>
                    <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Real-time insights and performance tracking
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="p-6 rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50 backdrop-blur-sm">
                <p className="text-sm italic text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                  "Nile Flow Africa transformed our business operations. The
                  admin tools are intuitive and powerful."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#9B59B6] to-[#8E44AD]"></div>
                  <div>
                    <p className="text-sm font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                      Sarah K.
                    </p>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Marketplace Owner, Lagos
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Registration Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="lg:hidden mb-8">
                <div className="flex items-center justify-between mb-6">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#8B4513] dark:text-[#D4A017]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                  </Link>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#8B6914] flex items-center justify-center">
                      <Store className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                      Nile Flow Africa
                    </span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
                  Create Admin Account
                </h2>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Join thousands of African businesses on our platform
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                {/* Form Container */}
                <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 md:p-8 shadow-xl">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                      Admin Registration
                    </h3>
                    <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                      Fill in your details to create an admin account
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setFormErrors((prev) => ({ ...prev, username: "" }));
                        }}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                          formErrors.username
                            ? "border-red-500"
                            : "border-[#E8D6B5] dark:border-[#3A3A3A]"
                        } bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent transition-all`}
                        required
                      />
                    </div>
                    {formErrors.username && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.username}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        placeholder="+234 800 000 0000"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setFormErrors((prev) => ({ ...prev, phone: "" }));
                        }}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                          formErrors.phone
                            ? "border-red-500"
                            : "border-[#E8D6B5] dark:border-[#3A3A3A]"
                        } bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent`}
                        required
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setFormErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                          formErrors.email
                            ? "border-red-500"
                            : "border-[#E8D6B5] dark:border-[#3A3A3A]"
                        } bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent`}
                        required
                      />
                    </div>
                    {formErrors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setFormErrors((prev) => ({ ...prev, password: "" }));
                        }}
                        className={`w-full pl-10 pr-12 py-3 rounded-xl border ${
                          formErrors.password
                            ? "border-red-500"
                            : "border-[#E8D6B5] dark:border-[#3A3A3A]"
                        } bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017] hover:text-[#B8860B] dark:hover:text-[#FFD700] transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                            Password Strength:
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              passwordStrength.strength === "strong"
                                ? "text-[#27AE60]"
                                : passwordStrength.strength === "medium"
                                ? "text-[#F39C12]"
                                : "text-[#E74C3C]"
                            }`}
                          >
                            {passwordStrength.strength.toUpperCase()}
                          </span>
                        </div>
                        <div className="h-2 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordStrength.strength === "strong"
                                ? "w-full bg-[#27AE60]"
                                : passwordStrength.strength === "medium"
                                ? "w-2/3 bg-[#F39C12]"
                                : "w-1/3 bg-[#E74C3C]"
                            }`}
                          ></div>
                        </div>

                        {/* Requirements */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {Object.entries(passwordStrength.requirements).map(
                            ([key, met]) => (
                              <div
                                key={key}
                                className="flex items-center gap-1"
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    met ? "bg-[#27AE60]" : "bg-[#E74C3C]"
                                  }`}
                                ></div>
                                <span
                                  className={`text-xs ${
                                    met ? "text-[#27AE60]" : "text-gray-500"
                                  }`}
                                >
                                  {key.charAt(0).toUpperCase() + key.slice(1)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {formErrors.password && (
                      <p className="mt-2 text-xs text-red-500">
                        {formErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setFormErrors((prev) => ({
                            ...prev,
                            confirmPassword: "",
                          }));
                        }}
                        className={`w-full pl-10 pr-12 py-3 rounded-xl border ${
                          formErrors.confirmPassword
                            ? "border-red-500"
                            : "border-[#E8D6B5] dark:border-[#3A3A3A]"
                        } bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017] hover:text-[#B8860B] dark:hover:text-[#FFD700] transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {formErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Terms and Conditions */}
                  <div className="mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => {
                          setTermsAccepted(e.target.checked);
                          setFormErrors((prev) => ({ ...prev, terms: "" }));
                        }}
                        className="mt-1 rounded border-[#E8D6B5] text-[#D4A017] focus:ring-[#D4A017]"
                      />
                      <span className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                        I agree to the{" "}
                        <Link
                          to="/terms"
                          className="text-[#D4A017] hover:text-[#B8860B] dark:hover:text-[#FFD700] underline"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/privacy"
                          className="text-[#D4A017] hover:text-[#B8860B] dark:hover:text-[#FFD700] underline"
                        >
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                    {formErrors.terms && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.terms}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Create Admin Account
                      </>
                    )}
                  </button>
                </div>

                {/* Already have account */}
                <div className="text-center">
                  <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    Already have an admin account?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-[#D4A017] hover:text-[#B8860B] dark:hover:text-[#FFD700] underline transition-colors"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>

                {/* Security Note */}
                <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-gradient-to-r from-[#E8D6B5]/10 to-[#D4A017]/5 dark:from-[#3A3A3A]/30 dark:to-[#2A2A2A]/50 text-center">
                  <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    🔒 Your data is protected with enterprise-grade encryption
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
