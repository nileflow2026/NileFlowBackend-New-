import React, { useState } from "react";
import { useGlobalContext } from "../../Context/GlobalProvider";
import { Config } from "../../appwrite";
import Header from "../../components/Header";
import {
  AlertTriangle,
  Send,
  Shield,
  Clock,
  CheckCircle,
  Headphones,
  Bug,
  Zap,
  Sparkles,
  FileText,
  User,
  Mail,
  Calendar,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Footer from "../../components/Footer";

// Mock Appwrite services for web environment
const mockDatabases = {
  createDocument: async (databaseId, collectionId, docId, data) => {
    console.log(`Mock: Creating document in ${collectionId} with data:`, data);
    return { ...data, $id: docId };
  },
};

const databases = mockDatabases;

const ReportProblemPage = () => {
  const [problemDetails, setProblemDetails] = useState("");
  const [problemType, setProblemType] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useGlobalContext();

  const problemTypes = [
    {
      id: "technical",
      label: "Technical Issue",
      icon: <Bug className="w-5 h-5" />,
    },
    {
      id: "payment",
      label: "Payment Problem",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      id: "delivery",
      label: "Delivery Issue",
      icon: <Clock className="w-5 h-5" />,
    },
    {
      id: "product",
      label: "Product Problem",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "account",
      label: "Account Issue",
      icon: <User className="w-5 h-5" />,
    },
    {
      id: "other",
      label: "Other Problem",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ];

  const handleReportProblem = async (e) => {
    e.preventDefault();

    if (!problemDetails.trim()) {
      showToast("Please enter the problem details.", "error");
      return;
    }

    if (!problemType) {
      showToast("Please select a problem type.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const userName = user?.name || "Anonymous";
      const email = user?.email || "unknown";
      const ID = { unique: () => `unique-${Date.now()}` };

      await databases.createDocument(
        Config.databaseId,
        Config.reportsCollectionId,
        ID.unique(),
        {
          problemDetails,
          problemType,
          priority,
          userName,
          email,
          createdAt: new Date().toISOString(),
        }
      );

      showToast(
        "Thank you for reporting the problem. Our premium support team will contact you within 1 hour.",
        "success"
      );
      setSubmitted(true);
      setProblemDetails("");
      setProblemType("");
      setPriority("medium");
    } catch (error) {
      console.error("❌ Failed to submit report:", error);
      showToast("Failed to submit report. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (message, type) => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 animate-fadeIn`;
    toast.innerHTML = `
      <div class="bg-gradient-to-r ${
        type === "error"
          ? "from-red-900/80 to-amber-900/80"
          : "from-emerald-900/80 to-green-900/80"
      } backdrop-blur-sm border ${
      type === "error" ? "border-red-700/50" : "border-emerald-700/50"
    } rounded-2xl p-4 shadow-2xl max-w-sm">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br ${
            type === "error"
              ? "from-red-600 to-red-700"
              : "from-emerald-600 to-emerald-700"
          } flex items-center justify-center">
            ${
              type === "error"
                ? '<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.986-.833-2.756 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>'
                : '<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
            }
          </div>
          <div>
            <p class="font-bold text-white">${
              type === "error" ? "Attention Needed" : "Success"
            }</p>
            <p class="${
              type === "error" ? "text-red-100" : "text-emerald-100"
            } text-sm">${message}</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 5000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <Header />
        <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-gray-900/20 to-green-900/20"></div>
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-900/30 to-green-900/30 border border-emerald-700/30 mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Report Submitted Successfully!
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
              Thank you for helping us improve Nile Flow. Our premium support
              team has received your report and will contact you within 1 hour.
            </p>

            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-amber-900/20 to-transparent border border-amber-800/30 rounded-2xl">
                  <Clock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-amber-200">
                    Response Time
                  </h3>
                  <p className="text-amber-100/70">Within 1 Hour</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-emerald-900/20 to-transparent border border-emerald-800/30 rounded-2xl">
                  <Shield className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-emerald-200">
                    Priority Support
                  </h3>
                  <p className="text-emerald-100/70">Premium Handling</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-800/30 rounded-2xl">
                  <Headphones className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-blue-200">Follow-up</h3>
                  <p className="text-blue-100/70">24/7 Available</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setSubmitted(false)}
                className="inline-flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
              >
                <span>Report Another Issue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => (window.location.href = "/contact")}
                className="inline-flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 text-amber-300 rounded-xl hover:border-amber-500/50 transition-all duration-300"
              >
                <Headphones className="w-5 h-5" />
                <span>Contact Support</span>
              </button>
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
      <div className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-red-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-500/10 to-amber-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-red-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium Support
            </span>
            <Shield className="w-4 h-4 text-red-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-red-200 bg-clip-text text-transparent">
              Report a Problem
            </span>
            <br />
            <span className="text-white">Premium Issue Resolution</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Encountering an issue? Our dedicated African support team is ready
            to help. Provide details below for swift resolution.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-300">1H</div>
              <div className="text-amber-100/80 text-sm">Response Time</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-300">24/7</div>
              <div className="text-red-100/80 text-sm">Support</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-300">100%</div>
              <div className="text-emerald-100/80 text-sm">Resolution</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-300">Premium</div>
              <div className="text-blue-100/80 text-sm">Handling</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden">
            {/* Form Header */}
            <div className="p-8 border-b border-amber-800/30">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-amber-200">
                    Describe Your Issue
                  </h2>
                  <p className="text-amber-100/70">
                    Provide detailed information for faster resolution
                  </p>
                </div>
              </div>
            </div>

            {/* User Info (if logged in) */}
            {user && (
              <div className="p-6 border-b border-amber-800/30">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-amber-100 text-sm">Reporting as</p>
                    <h3 className="text-lg font-bold text-amber-300">
                      {user.name}
                    </h3>
                    <p className="text-amber-100/70 text-sm flex items-center space-x-2">
                      <Mail className="w-3 h-3" />
                      <span>{user.email}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Problem Form */}
            <form onSubmit={handleReportProblem} className="p-8 space-y-8">
              {/* Problem Type */}
              <div>
                <label className="block text-amber-100 font-medium mb-4">
                  <span className="flex items-center space-x-2">
                    <Bug className="w-5 h-5" />
                    <span>Problem Type</span>
                  </span>
                  <span className="text-amber-100/70 text-sm mt-1 block">
                    Select the category that best describes your issue
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {problemTypes.map((type) => (
                    <button
                      type="button"
                      key={type.id}
                      onClick={() => setProblemType(type.id)}
                      className={`group p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 flex flex-col items-center justify-center space-y-2 ${
                        problemType === type.id
                          ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 border-amber-500/50 shadow-lg shadow-amber-900/30"
                          : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 hover:border-amber-500/50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          problemType === type.id
                            ? "bg-gradient-to-br from-amber-500 to-yellow-600 text-white"
                            : "bg-gradient-to-br from-gray-800 to-black border border-amber-800/30 text-amber-400"
                        }`}
                      >
                        {type.icon}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          problemType === type.id
                            ? "text-amber-300"
                            : "text-amber-100"
                        }`}
                      >
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Level */}
              <div>
                <label className="block text-amber-100 font-medium mb-4">
                  <span className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Priority Level</span>
                  </span>
                  <span className="text-amber-100/70 text-sm mt-1 block">
                    How urgent is this issue?
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["low", "medium", "high"].map((level) => (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setPriority(level)}
                      className={`group p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 text-center ${
                        priority === level
                          ? level === "high"
                            ? "bg-gradient-to-r from-red-600/30 to-red-700/20 border-red-500/50 shadow-lg shadow-red-900/30"
                            : level === "medium"
                            ? "bg-gradient-to-r from-amber-600/30 to-amber-700/20 border-amber-500/50 shadow-lg shadow-amber-900/30"
                            : "bg-gradient-to-r from-emerald-600/30 to-emerald-700/20 border-emerald-500/50 shadow-lg shadow-emerald-900/30"
                          : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 hover:border-amber-500/50"
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          priority === level
                            ? level === "high"
                              ? "text-red-300"
                              : level === "medium"
                              ? "text-amber-300"
                              : "text-emerald-300"
                            : "text-amber-100"
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Problem Details */}
              <div>
                <label className="block text-amber-100 font-medium mb-4">
                  <span className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Problem Details</span>
                  </span>
                  <span className="text-amber-100/70 text-sm mt-1 block">
                    Please describe the issue in detail for faster resolution
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
                  <textarea
                    className="relative w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors min-h-[200px] resize-none"
                    placeholder="Describe the issue you're experiencing. Include any error messages, steps to reproduce, and what you were trying to accomplish..."
                    value={problemDetails}
                    onChange={(e) => setProblemDetails(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-amber-100/50 text-sm">
                    Character count: {problemDetails.length}/2000
                  </p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-100/50 text-sm">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group w-full px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span>Submit Report</span>
                    <Sparkles className="w-4 h-4 text-yellow-300 group-hover:animate-pulse" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Support Information */}
          <div className="mt-8 bg-gradient-to-r from-emerald-900/20 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-3xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                  <Headphones className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Need Immediate Assistance?
                  </h3>
                  <p className="text-emerald-100/70">
                    Contact our premium African support team directly
                  </p>
                </div>
              </div>
              <button
                onClick={() => (window.location.href = "/contact")}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 whitespace-nowrap"
              >
                Contact Support Team
              </button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center">
              <div className="text-2xl font-bold text-amber-300 mb-2">1H</div>
              <div className="text-amber-100/80">Response Time</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6 text-center">
              <div className="text-2xl font-bold text-emerald-300 mb-2">
                100%
              </div>
              <div className="text-emerald-100/80">Resolution Rate</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6 text-center">
              <div className="text-2xl font-bold text-blue-300 mb-2">24/7</div>
              <div className="text-blue-100/80">Premium Support</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-6 text-center">
              <div className="text-2xl font-bold text-red-300 mb-2">Native</div>
              <div className="text-red-100/80">African Support Team</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportProblemPage;
