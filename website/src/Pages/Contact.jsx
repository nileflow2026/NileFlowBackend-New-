import React, { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import axiosClient from "../../api";
import {
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  Users,
  Shield,
  Globe,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Loader2,
} from "lucide-react";

const Contact = () => {
  const [username, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    if (!username || !email || !message) {
      setStatus("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await axiosClient.post(
        "/api/contact-nile-flow/contact",
        {
          username,
          email,
          message,
        },
      );

      setStatus(response.data.message);
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Contact form submission failed:", error);
      setStatus(
        `Failed to send message: ${
          error.response?.data?.error || error.message
        }`,
      );
    } finally {
      setLoading(false);
    }
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
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Get in Touch
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Contact Us
            </span>
            <br />
            <span className="text-white">Premium Support</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Have questions about premium African products? Our dedicated team is
            here to help you with personalized support.
          </p>

          {/* Stats */}
          <div className="max-w-3xl mx-auto">
            {/* Mobile: Horizontal Scroll, Desktop: Grid */}
            <div className="flex overflow-x-auto gap-4 pb-2 sm:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible scrollbar-thin scrollbar-thumb-amber-600 scrollbar-track-amber-900/20">
              <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 flex-shrink-0 min-w-[200px] md:min-w-0">
                <div className="text-2xl font-bold text-amber-300">24/7</div>
                <div className="text-amber-100/80 text-sm">Support</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4 flex-shrink-0 min-w-[200px] md:min-w-0">
                <div className="text-2xl font-bold text-emerald-300">1H</div>
                <div className="text-emerald-100/80 text-sm">Response Time</div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4 flex-shrink-0 min-w-[200px] md:min-w-0">
                <div className="text-2xl font-bold text-blue-300">100%</div>
                <div className="text-blue-100/80 text-sm">Satisfaction</div>
              </div>
              <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4 flex-shrink-0 min-w-[200px] md:min-w-0">
                <div className="text-2xl font-bold text-red-300">5★</div>
                <div className="text-red-100/80 text-sm">Premium Service</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className={`${submitted ? "order-last" : ""}`}>
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-amber-800/30">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                      <Send className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-amber-200">
                        Send us a message
                      </h2>
                      <p className="text-amber-100/70">
                        We'll respond within 1 hour
                      </p>
                    </div>
                  </div>
                </div>

                {submitted ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-900/30 to-green-900/30 border border-emerald-700/30 mb-6">
                      <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-gray-300 mb-6">
                      Thank you for contacting Nile Flow. Our premium support
                      team will respond to you within 1 hour.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
                    >
                      <span>Send Another Message</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                      <label className="block text-amber-100 font-medium mb-2">
                        <span className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>Full Name</span>
                        </span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setName(e.target.value)}
                          className="relative w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>

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

                    <div>
                      <label className="block text-amber-100 font-medium mb-2">
                        <span className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Your Message</span>
                        </span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="relative w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors min-h-[150px] resize-none"
                          placeholder="Tell us about your inquiry or feedback..."
                          rows="5"
                          required
                        ></textarea>
                      </div>
                    </div>

                    {status && (
                      <div
                        className={`p-4 rounded-xl border backdrop-blur-sm ${
                          status.includes("Failed")
                            ? "bg-gradient-to-r from-red-900/30 to-amber-900/30 border-red-700/30"
                            : "bg-gradient-to-r from-emerald-900/30 to-green-900/30 border-emerald-700/30"
                        }`}
                      >
                        <p
                          className={`text-center ${
                            status.includes("Failed")
                              ? "text-red-200"
                              : "text-emerald-200"
                          }`}
                        >
                          {status}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="group w-full px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 h-full">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-amber-200 mb-2">
                    Our Contact Details
                  </h2>
                  <p className="text-amber-100/70">
                    Premium African eCommerce support
                  </p>
                </div>

                {/* Contact Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl hover:border-amber-500/50 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-amber-100 mb-1">
                        Our Location
                      </h3>
                      <p className="text-amber-100/70">
                        Nile Flow Kilimani, Nairobi, Kenya
                      </p>
                      <p className="text-amber-100/50 text-sm mt-1">
                        Visit our premium showroom
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl hover:border-amber-500/50 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-emerald-100 mb-1">
                        Phone Number
                      </h3>
                      <p className="text-emerald-100/70">+254 703 115 359</p>
                      <p className="text-emerald-100/50 text-sm mt-1">
                        Available 24/7 for premium support
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl hover:border-amber-500/50 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-100 mb-1">
                        Email Address
                      </h3>
                      <p className="text-blue-100/70">
                        support@nileflowafrica.com
                      </p>
                      <p className="text-blue-100/50 text-sm mt-1">
                        For business inquiries and support
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl hover:border-amber-500/50 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-100 mb-1">
                        Business Hours
                      </h3>
                      <p className="text-red-100/70">
                        Monday - Sunday: 6:00 AM - 11:00 PM
                      </p>
                      <p className="text-red-100/50 text-sm mt-1">
                        24/7 premium customer support
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8">
                  <div className="bg-gradient-to-r from-amber-900/20 to-emerald-900/20 backdrop-blur-sm border border-amber-700/30 rounded-2xl p-6 text-center">
                    <h3 className="text-lg font-bold text-amber-200 mb-2">
                      Need Immediate Help?
                    </h3>
                    <p className="text-amber-100/70 text-sm mb-4">
                      Our premium support team is always ready to assist you.
                    </p>
                    <a
                      href="tel:+254703115359"
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
                    >
                      <Phone className="w-5 h-5" />
                      <span>Call Now</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-16">
            {/* Mobile: Horizontal Scroll, Desktop: Grid */}
            <div className="flex overflow-x-auto gap-6 pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible scrollbar-thin scrollbar-thumb-amber-600 scrollbar-track-amber-900/20">
              <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center flex-shrink-0 min-w-[280px] lg:min-w-0">
                <div className="text-2xl font-bold text-amber-300 mb-2">
                  24/7
                </div>
                <div className="text-amber-100/80">Premium Support</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6 text-center flex-shrink-0 min-w-[280px] lg:min-w-0">
                <div className="text-2xl font-bold text-emerald-300 mb-2">
                  1H
                </div>
                <div className="text-emerald-100/80">Response Time</div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6 text-center flex-shrink-0 min-w-[280px] lg:min-w-0">
                <div className="text-2xl font-bold text-blue-300 mb-2">
                  100%
                </div>
                <div className="text-blue-100/80">Satisfaction</div>
              </div>
              <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-6 text-center flex-shrink-0 min-w-[280px] lg:min-w-0">
                <div className="text-2xl font-bold text-red-300 mb-2">54</div>
                <div className="text-red-100/80">African Countries</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
