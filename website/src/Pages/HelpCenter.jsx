import React from "react";
import Header from "../../components/Header";
import {
  HelpCircle,
  Phone,
  Mail,
  MessageSquare,
  Truck,
  Shield,
  CreditCard,
  User,
  Package,
  Clock,
  ChevronRight,
  Sparkles,
  Award,
  Headphones,
  Globe,
  Star,
  Zap,
  Lock,
} from "lucide-react";
import Footer from "../../components/Footer";

const HelpCenterPage = () => {
  const faqCategories = [
    {
      title: "Account & Security",
      icon: <Shield className="w-6 h-6" />,
      questions: [
        {
          q: "How do I reset my password?",
          a: "Visit the 'Forgot Password' page and enter your email. We'll send you a secure link to reset your password within minutes.",
        },
        {
          q: "How do I enable two-factor authentication?",
          a: "Go to Account Settings → Security → Two-Factor Authentication. We recommend using an authenticator app for enhanced security.",
        },
        {
          q: "How do I update my profile information?",
          a: "Navigate to 'My Account' → 'Profile Settings' where you can update your personal information, shipping addresses, and preferences.",
        },
      ],
      color: "from-amber-600 to-orange-600",
    },
    {
      title: "Orders & Payments",
      icon: <CreditCard className="w-6 h-6" />,
      questions: [
        {
          q: "How do I track my order?",
          a: "Go to 'My Orders' section in your account or use the tracking link in your confirmation email for real-time updates.",
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept Visa, Mastercard, M-Pesa, Airtel Money, PayPal, and bank transfers for premium African products.",
        },
        {
          q: "Can I cancel or modify my order?",
          a: "Orders can be modified within 1 hour of placement. Contact our premium support team immediately for assistance.",
        },
      ],
      color: "from-emerald-600 to-green-600",
    },
    {
      title: "Shipping & Delivery",
      icon: <Truck className="w-6 h-6" />,
      questions: [
        {
          q: "What are your delivery times?",
          a: "Express delivery: 1-3 days within major cities. Standard delivery: 3-7 days across Africa. International: 7-14 days.",
        },
        {
          q: "Do you offer free shipping?",
          a: "Yes! Free express shipping on all orders over 100. Premium members enjoy free shipping on all orders.",
        },
        {
          q: "How do I change my delivery address?",
          a: "Update your address in 'Account Settings' → 'Shipping Addresses' or contact support within 1 hour of ordering.",
        },
      ],
      color: "from-blue-600 to-indigo-600",
    },
    {
      title: "Returns & Warranty",
      icon: <Package className="w-6 h-6" />,
      questions: [
        {
          q: "What is your return policy?",
          a: "30-day return window for all premium products. Items must be in original condition with all packaging intact.",
        },
        {
          q: "How do I initiate a return?",
          a: "Go to 'My Orders' → select the item → 'Request Return'. Our premium support team will guide you through the process.",
        },
        {
          q: "Do you offer product warranties?",
          a: "Yes! All premium African products come with a 1-year warranty and lifetime customer support for quality issues.",
        },
      ],
      color: "from-purple-600 to-violet-600",
    },
  ];

  const contactMethods = [
    {
      title: "24/7 Premium Support",
      description: "Instant assistance via live chat",
      icon: <Headphones className="w-8 h-8" />,
      details: "Available 24/7",
      color: "from-amber-600 to-amber-700",
      action: "Start Live Chat",
    },
    {
      title: "Email Support",
      description: "Response within 1 hour",
      icon: <Mail className="w-8 h-8" />,
      details: "support@nileflowafrica.com",
      color: "from-emerald-600 to-emerald-700",
      action: "Send Email",
    },
    {
      title: "Phone Support",
      description: "Direct premium assistance",
      icon: <Phone className="w-8 h-8" />,
      details: "+254 703 115 359",
      color: "from-blue-600 to-blue-700",
      action: "Call Now",
    },
  ];

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
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium Support Center
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Help Center
            </span>
            <br />
            <span className="text-white">Premium Assistance</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Get instant help with premium African products, orders, shipping,
            and more. Our dedicated team is here 24/7.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl blur opacity-30"></div>
              <div className="relative flex bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-2xl overflow-hidden">
                <div className="pl-5 pr-3 flex items-center">
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for help articles, guides, and solutions..."
                  className="flex-1 px-4 py-4 bg-transparent text-amber-100 placeholder-amber-100/50 focus:outline-none text-lg"
                />
                <button className="px-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold hover:from-amber-700 hover:to-amber-800 transition-all duration-300">
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-300">24/7</div>
              <div className="text-amber-100/80 text-sm">Premium Support</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-300">1H</div>
              <div className="text-emerald-100/80 text-sm">Response Time</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-300">100%</div>
              <div className="text-blue-100/80 text-sm">Satisfaction</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-300">5★</div>
              <div className="text-red-100/80 text-sm">Premium Service</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* FAQ Categories */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-amber-200">
                  Frequently Asked Questions
                </h2>
                <p className="text-amber-100/70">
                  Quick answers to common questions
                </p>
              </div>
              <div className="flex items-center space-x-2 text-amber-400">
                <Zap className="w-5 h-5" />
                <span className="text-sm">Premium Support</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqCategories.map((category, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden group hover:border-amber-500/50 transition-all duration-300"
                >
                  <div className={`bg-gradient-to-r ${category.color} p-6`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {category.title}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {category.questions.length} questions
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      {category.questions.map((item, idx) => (
                        <div
                          key={idx}
                          className="border-b border-amber-800/30 pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-start space-x-3 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-amber-700/30 flex items-center justify-center flex-shrink-0 mt-1">
                              <span className="text-xs text-amber-400 font-bold">
                                Q
                              </span>
                            </div>
                            <h4 className="text-amber-100 font-semibold flex-1">
                              {item.q}
                            </h4>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-900/30 to-green-900/30 border border-emerald-700/30 flex items-center justify-center flex-shrink-0 mt-1">
                              <span className="text-xs text-emerald-400 font-bold">
                                A
                              </span>
                            </div>
                            <p className="text-amber-100/70 flex-1">{item.a}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 rounded-xl text-amber-300 hover:text-amber-200 hover:border-amber-500/50 transition-all duration-300 flex items-center justify-center space-x-2">
                      <span>View All Questions</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Methods */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-amber-200 mb-3">
                Premium Contact Methods
              </h2>
              <p className="text-amber-100/70 max-w-2xl mx-auto">
                Choose your preferred way to contact our premium support team
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${method.color.replace(
                      "600",
                      "500"
                    )}/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  <div className="relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 text-center transition-all duration-500 group-hover:border-amber-500/50 group-hover:shadow-2xl group-hover:shadow-amber-900/30">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${method.color} mb-6`}
                    >
                      {method.icon}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                      {method.title}
                    </h3>
                    <p className="text-amber-100/70 text-sm mb-4">
                      {method.description}
                    </p>

                    <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4 mb-6">
                      <p className="text-amber-200 font-medium">
                        {method.details}
                      </p>
                    </div>

                    <button
                      className={`w-full px-6 py-3 bg-gradient-to-r ${method.color} text-white font-bold rounded-xl hover:opacity-90 transition-all duration-300 transform hover:scale-105`}
                    >
                      {method.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Features */}
          <div className="mb-16">
            <div className="bg-gradient-to-r from-amber-900/20 to-emerald-900/20 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Premium Support Features
                  </h3>
                  <p className="text-amber-100/70 mb-6">
                    Experience exceptional customer service designed
                    specifically for premium African product shoppers.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-100 text-sm">
                        Secure Communications
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <span className="text-blue-100 text-sm">
                        24/7 Availability
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-amber-400" />
                      <span className="text-amber-100 text-sm">
                        African Languages
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Star className="w-5 h-5 text-red-400" />
                      <span className="text-red-100 text-sm">
                        Priority Handling
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                      <Award className="w-16 h-16 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold">5★</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-amber-100">
                    Live Community
                  </h4>
                  <p className="text-amber-100/70 text-sm">Join discussions</p>
                </div>
              </div>
              <p className="text-amber-100/70 mb-4">
                Connect with other premium African product enthusiasts
              </p>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-amber-700/30 rounded-xl text-amber-300 hover:text-amber-200 hover:border-amber-500/50 transition-all duration-300">
                Join Community
              </button>
            </div>

            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-emerald-100">
                    Premium Tutorials
                  </h4>
                  <p className="text-emerald-100/70 text-sm">
                    Step-by-step guides
                  </p>
                </div>
              </div>
              <p className="text-emerald-100/70 mb-4">
                Learn how to maximize your African shopping experience
              </p>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-emerald-900/30 to-green-900/30 border border-emerald-700/30 rounded-xl text-emerald-300 hover:text-emerald-200 hover:border-emerald-500/50 transition-all duration-300">
                View Tutorials
              </button>
            </div>

            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-blue-100">
                    Order Status
                  </h4>
                  <p className="text-blue-100/70 text-sm">Track your package</p>
                </div>
              </div>
              <p className="text-blue-100/70 mb-4">
                Real-time tracking for all your premium African product orders
              </p>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700/30 rounded-xl text-blue-300 hover:text-blue-200 hover:border-blue-500/50 transition-all duration-300">
                Track Order
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HelpCenterPage;
