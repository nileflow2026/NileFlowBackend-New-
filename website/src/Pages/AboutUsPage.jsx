/* eslint-disable no-unused-vars */
import React from "react";
import Header from "../../components/Header";
import {
  Target,
  Users,
  Heart,
  Shield,
  Mail,
  Phone,
  Globe,
  Award,
  Sparkles,
  Star,
  Gem,
  Crown,
  Clock,
  MapPin,
  Leaf,
  Zap,
  TrendingUp,
  Eye,
} from "lucide-react";
import Footer from "../../components/Footer";
import useStructuredData from "../hooks/useStructuredData";
import { FOUNDER_PERSON_SCHEMA } from "../constants/structuredData";

const AboutPage = () => {
  // Add Person structured data for founder to About page
  useStructuredData(FOUNDER_PERSON_SCHEMA, "founder-person-schema");

  const teamMembers = [
    {
      name: "Anthony Wai",
      role: "Founder & CEO",
      avatar: "👑",
      region: "Central Africa",
    },
    {
      name: "Japhet Mupe",
      role: "Head of Operations",
      avatar: "🛡️",
      region: "East Africa",
    },
    {
      name: "Damaris Mwende",
      role: "Product Curator",
      avatar: "💎",
      region: "East Africa",
    },
    {
      name: "Maria Adut",
      role: "Customer Experience",
      avatar: "🌟",
      region: "Central Africa",
    },
  ];

  const values = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Cultural Integrity",
      description: "Preserving and celebrating authentic African heritage",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Premium Quality",
      description: "Only the finest handpicked African products",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community First",
      description: "Empowering African artisans and communities",
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      title: "Sustainable Growth",
      description: "Ethical sourcing and eco-friendly practices",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Excellence",
      description: "African craftsmanship on the world stage",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Innovation",
      description: "Modern eCommerce with traditional values",
    },
  ];

  const milestones = [
    {
      year: "2023",
      title: "Nile Flow Founded",
      description: "Launched with 50+ African artisans",
    },
    {
      year: "2024",
      title: "Regional Expansion",
      description: "Expanded to 5 African countries",
    },
    {
      year: "2024",
      title: "Premium Collection",
      description: "Curated 1000+ premium products",
    },
    {
      year: "2025",
      title: "Global Launch",
      description: "Started international shipping",
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
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Our Story
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              About Nile Flow
            </span>
            <br />
            <span className="text-white">Premium African Marketplace</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-10">
            We are a premium eCommerce platform dedicated to showcasing
            authentic African products to the world. Our mission is to bridge
            the gap between African artisans and global consumers while
            preserving cultural heritage.
          </p>

          {/* Stats */}
          <div className="w-full max-w-3xl mx-auto overflow-hidden">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
              <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 flex-shrink-0 w-40 md:w-auto">
                <div className="text-2xl font-bold text-amber-300">500+</div>
                <div className="text-amber-100/80 text-sm">
                  African Artisans
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4 flex-shrink-0 w-40 md:w-auto">
                <div className="text-2xl font-bold text-emerald-300">54</div>
                <div className="text-emerald-100/80 text-sm">
                  African Countries
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4 flex-shrink-0 w-40 md:w-auto">
                <div className="text-2xl font-bold text-blue-300">5000+</div>
                <div className="text-blue-100/80 text-sm">Premium Products</div>
              </div>
              <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4 flex-shrink-0 w-40 md:w-auto">
                <div className="text-2xl font-bold text-red-300">99%</div>
                <div className="text-red-100/80 text-sm">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6 md:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-amber-200">
                    Our Mission
                  </h2>
                  <p className="text-amber-100/70 text-sm md:text-base">
                    Defining African excellence
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                To create the world's premier marketplace for authentic African
                products, connecting talented artisans with discerning global
                customers while preserving and celebrating Africa's rich
                cultural heritage through premium eCommerce.
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-3xl p-6 md:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-emerald-200">
                    Our Vision
                  </h2>
                  <p className="text-emerald-100/70 text-sm md:text-base">
                    The future of African commerce
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                To become the global standard for African eCommerce, where every
                purchase tells a story of craftsmanship, heritage, and quality.
                We envision a world where African products are celebrated as
                premium luxury goods worldwide.
              </p>
            </div>
          </div>

          {/* Our Values */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Our Core Values
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                The principles that guide everything we do at Nile Flow
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 transition-all duration-300 hover:border-amber-500/50 hover:scale-[1.02]"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-700/20 border border-amber-700/30 flex items-center justify-center mb-4">
                    <div className="text-amber-400">{value.icon}</div>
                  </div>
                  <h3 className="text-xl font-bold text-amber-200 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-300">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Our Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Our Leadership Team
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Passionate individuals from across Africa, united by a shared
                vision
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center transition-all duration-300 hover:border-amber-500/50 hover:scale-[1.02]"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-3xl mx-auto mb-4">
                    {member.avatar}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {member.name}
                  </h3>
                  <p className="text-amber-300 font-medium mb-2">
                    {member.role}
                  </p>
                  <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-amber-800/30">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span className="text-sm text-emerald-100">
                      {member.region}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-16">
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-amber-500 via-emerald-500 to-transparent"></div>

              {/*  <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className={`relative flex items-center ${
                      index % 2 === 0 ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`w-1/2 ${
                        index % 2 === 0 ? "pr-12 text-right" : "pl-12"
                      }`}
                    >
                      <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6">
                        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-700/30 mb-3">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span className="text-amber-200 font-bold">
                            {milestone.year}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          {milestone.title}
                        </h3>
                        <p className="text-gray-300">{milestone.description}</p>
                      </div>
                    </div>

                   
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 border-4 border-gray-900"></div>
                  </div>
                ))}
              </div> */}
            </div>
          </div>

          {/* Contact & Info */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-amber-200 mb-6">
                Contact Information
              </h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Email Address
                    </h3>
                    <a
                      href="mailto:support@nileflowafrica.com"
                      className="text-blue-300 hover:text-blue-200 transition-colors"
                    >
                      support@nileflowafrica.com
                    </a>
                    <p className="text-gray-400 text-sm mt-1">
                      For business inquiries and support
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Phone Number
                    </h3>
                    <a
                      href="tel:+254703115359"
                      className="text-emerald-300 hover:text-emerald-200 transition-colors"
                    >
                      +254 703 115 359
                    </a>
                    <p className="text-gray-400 text-sm mt-1">
                      Available 24/7 for premium support
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Our Headquarters
                    </h3>
                    <p className="text-gray-300">
                      Nile Flow Kilimani, Nairobi, Kenya
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Visit our premium showroom
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-amber-200 mb-6">
                App Information
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Gem className="w-6 h-6 text-amber-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        App Version
                      </h3>
                      <p className="text-gray-400 text-sm">Premium Edition</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-700/30">
                    <span className="text-amber-200 font-bold">v1.5.2</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-emerald-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Privacy & Security
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Your data is protected
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      window.open(
                        "https://nileflowafrica.com/privacy",
                        "_blank",
                      )
                    }
                    className="text-emerald-300 hover:text-emerald-200 transition-colors"
                  >
                    View Policy
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Latest Update
                      </h3>
                      <p className="text-gray-400 text-sm">Enhanced features</p>
                    </div>
                  </div>
                  <div className="text-blue-300 text-sm">Dec 2024</div>
                </div>
              </div>

              {/* App Features */}
              <div className="mt-8 pt-8 border-t border-amber-800/30">
                <h3 className="text-lg font-bold text-amber-200 mb-4">
                  App Features
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-300">
                      Premium Design
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-gray-300">
                      Secure Payments
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">
                      Multi-language
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-gray-300">Fast Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-amber-900/20 to-emerald-900/20 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Join Our African Journey
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto mb-6">
                Be part of a movement that celebrates African craftsmanship and
                brings premium products to the world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300">
                  Shop Premium Products
                </button>
                <button
                  onClick={() =>
                    window.open("https://nileflow.com/privacy-policy", "_blank")
                  }
                  className="px-8 py-3 border-2 border-amber-500/50 text-amber-400 font-bold rounded-xl hover:bg-amber-500/10 transition-all duration-300"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
