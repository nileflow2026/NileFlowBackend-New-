import React, { useEffect, useState } from "react";
import {
  CreditCard,
  DollarSign,
  Shield,
  Lock,
  Check,
  ArrowLeft,
  Sparkles,
  Zap,
  Truck,
  Smartphone,
  Banknote,
  Wallet,
  Star,
  Award,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { account } from "../../appwrite";
import { getCurrentUser } from "../../authServices";

const PaymentPage = () => {
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserPreference = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          const userPrefs = await account.getPrefs();
          if (userPrefs.preferredPaymentMethod) {
            setSelectedPayment(userPrefs.preferredPaymentMethod);
            setConfirmationMessage(
              `You have selected this as your preferred payment method.`
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch user preferences:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserPreference();
  }, []);

  const handleSelectPayment = async (method) => {
    setSelectedPayment(method);
    setSaving(true);

    try {
      await account.updatePrefs({ preferredPaymentMethod: method });
      setConfirmationMessage(`Payment method updated successfully!`);

      // Show success animation
      setTimeout(() => {
        setConfirmationMessage(`This is what you will use for your payment.`);
      }, 2000);
    } catch (error) {
      console.error("Failed to save payment preference:", error);
      setConfirmationMessage(`Failed to save preference. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const paymentOptions = [
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: <CreditCard className="w-8 h-8" />,
      description: "Secure payment via Stripe with 256-bit encryption",
      features: [
        "Instant Processing",
        "Secure Encryption",
        "International Cards",
        "Save for Future",
      ],
      color: "from-blue-600 to-indigo-700",
      badge: "Most Popular",
    },
    {
      id: "cashOnDelivery",
      name: "Cash on Delivery",
      icon: <DollarSign className="w-8 h-8" />,
      description: "Pay with cash when your order is delivered",
      features: [
        "No Online Payment",
        "Pay Upon Delivery",
        "Flexible Amount",
        "Cashback Available",
      ],
      color: "from-emerald-600 to-green-700",
      badge: "Traditional",
    },
    {
      id: "mobileMoney",
      name: "Mobile Money",
      icon: <Smartphone className="w-8 h-8" />,
      description: "M-Pesa, Airtel Money, and other mobile wallets",
      features: [
        "Instant Transfer",
        "No Bank Needed",
        "24/7 Service",
        "Transaction Alerts",
      ],
      color: "from-purple-600 to-violet-700",
      badge: "African Special",
    },
    {
      id: "bankTransfer",
      name: "Bank Transfer",
      icon: <Banknote className="w-8 h-8" />,
      description: "Direct bank transfer for secure payments",
      features: [
        "Secure Banking",
        "Direct Transfer",
        "Detailed Receipts",
        "Business Friendly",
      ],
      color: "from-amber-600 to-yellow-700",
      badge: "Business",
    },
    {
      id: "digitalWallet",
      name: "Digital Wallet",
      icon: <Wallet className="w-8 h-8" />,
      description: "PayPal, Apple Pay, Google Pay and other e-wallets",
      features: [
        "Quick Checkout",
        "Multiple Methods",
        "International",
        "One-Click Payment",
      ],
      color: "from-red-600 to-pink-700",
      badge: "Global",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-10 h-10 text-amber-500 animate-pulse" />
            </div>
          </div>
          <h3 className="mt-8 text-2xl font-bold text-amber-200">
            Loading Payment Options
          </h3>
          <p className="text-gray-400 mt-2">
            Securing your payment preferences...
          </p>
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

        <div className="relative max-w-8xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center space-x-2 text-amber-300 hover:text-amber-200 transition-colors mb-8"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-700/30 flex items-center justify-center group-hover:border-amber-500/50 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-medium">Back to Checkout</span>
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
              <Lock className="w-5 h-5 text-amber-400" />
              <span className="text-amber-200 font-medium tracking-wide">
                Secure Payment
              </span>
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
                Payment Method
              </span>
              <br />
              <span className="text-white">Premium Security</span>
            </h1>

            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
              Choose your preferred payment method. All transactions are
              encrypted with 256-bit security.
            </p>

            {/* User Info */}
            {user && (
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-800/30 mb-8">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                  <span className="text-white font-bold">
                    {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-amber-100 text-sm">
                    Payment preference for
                  </p>
                  <p className="text-amber-300 font-bold">
                    {user.username || user.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-6xl mx-auto">
          {/* Confirmation Message */}
          {confirmationMessage && (
            <div
              className={`mb-8 transform transition-all duration-500 ${
                confirmationMessage.includes("successfully") ? "scale-105" : ""
              }`}
            >
              <div
                className={`bg-gradient-to-r ${
                  confirmationMessage.includes("Failed")
                    ? "from-red-900/30 to-amber-900/30 border-red-700/30"
                    : "from-emerald-900/30 to-green-900/30 border-emerald-700/30"
                } backdrop-blur-sm border rounded-2xl p-6 text-center`}
              >
                <div className="flex items-center justify-center space-x-3">
                  {confirmationMessage.includes("successfully") ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg">
                          Payment Method Saved
                        </p>
                        <p className="text-emerald-100">
                          Your preference has been updated successfully
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg">
                          {confirmationMessage}
                        </p>
                        {saving && (
                          <p className="text-amber-100 text-sm flex items-center justify-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving your preference...</span>
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security Badges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 text-center">
              <Shield className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="text-sm text-amber-100">256-bit Encryption</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4 text-center">
              <Lock className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm text-emerald-100">PCI DSS Compliant</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4 text-center">
              <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-sm text-blue-100">Instant Processing</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4 text-center">
              <Award className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-sm text-red-100">Money-Back Guarantee</div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentOptions.map((option) => {
              const isSelected = selectedPayment === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => !saving && handleSelectPayment(option.id)}
                  className={`group relative cursor-pointer transition-all duration-500 ${
                    isSelected ? "transform -translate-y-2" : ""
                  } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {/* Background Glow */}
                  <div
                    className={`absolute -inset-1 bg-gradient-to-r ${
                      option.color
                    } rounded-3xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500 ${
                      isSelected ? "opacity-30" : ""
                    }`}
                  ></div>

                  {/* Card */}
                  <div
                    className={`relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border rounded-3xl overflow-hidden transition-all duration-500 ${
                      isSelected
                        ? `border-transparent shadow-2xl shadow-${
                            option.color.split("-")[1]
                          }-900/30`
                        : "border-amber-800/30 hover:border-amber-500/50"
                    }`}
                  >
                    {/* Badge */}
                    {option.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <div
                          className={`bg-gradient-to-r ${option.color} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}
                        >
                          {option.badge}
                        </div>
                      </div>
                    )}

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-4 left-4 z-10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Card Header */}
                    <div className="p-6 border-b border-amber-800/30">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center`}
                        >
                          <div className="text-white">{option.icon}</div>
                        </div>
                        <div className="flex-1">
                          <h3
                            className={`text-xl font-bold ${
                              isSelected ? "text-amber-300" : "text-white"
                            }`}
                          >
                            {option.name}
                          </h3>
                          <p className="text-gray-400 text-sm mt-1">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="p-6">
                      <h4 className="text-amber-100 font-medium mb-3">
                        Features
                      </h4>
                      <ul className="space-y-2">
                        {option.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center space-x-2 text-sm"
                          >
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500"></div>
                            <span className="text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer */}
                    <div className="p-6 pt-0">
                      <div
                        className={`p-3 rounded-xl text-center ${
                          isSelected
                            ? `bg-gradient-to-r ${option.color} text-white`
                            : "bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 text-amber-300"
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {isSelected ? (
                            <>
                              <span className="font-bold">Selected</span>
                              <Check className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              <span>Select Method</span>
                              <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Assurance */}
          <div className="mt-12 bg-gradient-to-r from-amber-900/20 to-emerald-900/20 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    100% Payment Protection
                  </h3>
                  <p className="text-amber-100/70">
                    Your transaction is secured with bank-level encryption
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <Clock className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <div className="text-sm text-emerald-100">24/7 Support</div>
                </div>
                <div className="text-center">
                  <Truck className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-sm text-blue-100">Secure Delivery</div>
                </div>
                <div className="text-center">
                  <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <div className="text-sm text-amber-100">5-Star Service</div>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/checkout")}
              className="group inline-flex items-center space-x-4 px-10 py-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-2xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-105"
            >
              <span>Continue to Checkout</span>
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-gray-400 mt-4 text-sm">
              By continuing, you agree to our secure payment terms
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentPage;
