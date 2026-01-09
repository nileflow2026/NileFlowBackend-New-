import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  TrendingUp,
  Users,
  CheckCircle,
  Megaphone,
  BarChart,
  Heart,
  ShoppingBag,
  Filter,
  Search,
  Sparkles,
  Award,
  Shield,
  Zap,
  Clock,
  MapPin,
  Eye,
  Share2,
  PlayCircle,
  Calendar,
  TrendingDown,
  Crown,
  Gem,
  Target,
  Rocket,
  Camera,
  BadgeCheck,
  DollarSign,
  Percent,
} from "lucide-react";

const MarketplaceHub = () => {
  const [activeTab, setActiveTab] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("trending");
  const [loading, setLoading] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);

  const categories = [
    {
      id: "all",
      name: "All Ads",
      icon: <Megaphone className="w-5 h-5" />,
      count: 24,
    },
    {
      id: "influencers",
      name: "Influencers",
      icon: <Users className="w-5 h-5" />,
      count: 8,
    },
    {
      id: "fashion",
      name: "Fashion",
      icon: <ShoppingBag className="w-5 h-5" />,
      count: 6,
    },
    {
      id: "beauty",
      name: "Beauty",
      icon: <Sparkles className="w-5 h-5" />,
      count: 5,
    },
    { id: "tech", name: "Tech", icon: <Zap className="w-5 h-5" />, count: 4 },
    {
      id: "home",
      name: "Home & Living",
      icon: <Gem className="w-5 h-5" />,
      count: 3,
    },
    {
      id: "food",
      name: "Food & Drinks",
      icon: <Award className="w-5 h-5" />,
      count: 4,
    },
  ];

  const ads = [
    {
      id: 1,
      type: "vendor",
      title: "Premium Maasai Beaded Collection",
      vendor: "Heritage Crafts Co.",
      category: "fashion",
      description:
        "Handcrafted Maasai beadwork jewelry and accessories. Each piece tells a story of tradition and craftsmanship.",
      image:
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      rating: 4.9,
      reviews: 128,
      price: "$249",
      originalPrice: "$349",
      discount: 29,
      verified: true,
      featured: true,
      engagementRate: "12.5%",
      reach: "50K+",
      gradient: "from-amber-500 to-orange-600",
      tags: ["Handmade", "Cultural", "Premium", "Limited"],
      stats: {
        views: "24.5K",
        clicks: "3.2K",
        conversion: "8.2%",
      },
    },
    {
      id: 2,
      type: "influencer",
      title: "African Fashion Week Coverage",
      influencer: "Zahara Styles",
      category: "fashion",
      description:
        "Top fashion influencer offering sponsored posts and event coverage during African Fashion Week.",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      rating: 4.8,
      followers: "150K",
      price: "$1,250",
      platform: "Instagram",
      verified: true,
      featured: true,
      engagementRate: "7.8%",
      reach: "200K+",
      gradient: "from-purple-500 to-pink-600",
      tags: ["Fashion", "Lifestyle", "Events", "Premium"],
      stats: {
        engagement: "15K+",
        audience: "18-35",
        location: "Pan-African",
      },
    },
    {
      id: 3,
      type: "vendor",
      title: "Organic Shea Butter Collection",
      vendor: "Pure African Botanicals",
      category: "beauty",
      description:
        "100% organic shea butter and skincare products sourced directly from Ghanaian women cooperatives.",
      image:
        "https://images.unsplash.com/photo-1556228578-9c360e1d8d34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      rating: 4.7,
      reviews: 89,
      price: "$89",
      originalPrice: "$120",
      discount: 26,
      verified: true,
      featured: false,
      engagementRate: "9.3%",
      reach: "35K+",
      gradient: "from-emerald-500 to-green-600",
      tags: ["Organic", "Skincare", "Women-led", "Sustainable"],
      stats: {
        views: "18.7K",
        clicks: "2.1K",
        conversion: "6.5%",
      },
    },
    {
      id: 4,
      type: "influencer",
      title: "Tech Gadgets & Reviews",
      influencer: "Tech Brother Africa",
      category: "tech",
      description:
        "Leading tech influencer specializing in African market gadgets and startup product reviews.",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      rating: 4.9,
      followers: "320K",
      price: "$2,500",
      platform: "YouTube",
      verified: true,
      featured: false,
      engagementRate: "5.2%",
      reach: "500K+",
      gradient: "from-blue-500 to-indigo-600",
      tags: ["Tech", "Reviews", "Gadgets", "YouTube"],
      stats: {
        engagement: "25K+",
        audience: "Tech Enthusiasts",
        avgViews: "150K",
      },
    },
    {
      id: 5,
      type: "vendor",
      title: "Authentic African Print Fabrics",
      vendor: "Vibrant Textiles Ltd",
      category: "fashion",
      description:
        "Premium quality Ankara and Kitenge fabrics with exclusive designs from across Africa.",
      image:
        "https://images.unsplash.com/photo-1558769132-cb1a40ed0ada?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      rating: 4.6,
      reviews: 203,
      price: "$45/yard",
      originalPrice: "$60/yard",
      discount: 25,
      verified: true,
      featured: true,
      engagementRate: "11.2%",
      reach: "42K+",
      gradient: "from-red-500 to-rose-600",
      tags: ["Fabrics", "Textiles", "Traditional", "Custom"],
      stats: {
        views: "31.2K",
        clicks: "4.5K",
        conversion: "9.8%",
      },
    },
    {
      id: 6,
      type: "influencer",
      title: "Home Decor & Lifestyle",
      influencer: "AfroChic Living",
      category: "home",
      description:
        "Lifestyle influencer showcasing modern African home decor and sustainable living.",
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      rating: 4.7,
      followers: "85K",
      price: "$850",
      platform: "Instagram & TikTok",
      verified: false,
      featured: false,
      engagementRate: "8.9%",
      reach: "120K+",
      gradient: "from-amber-500 to-yellow-600",
      tags: ["Home Decor", "Lifestyle", "Interior", "Sustainable"],
      stats: {
        engagement: "8.5K+",
        audience: "Homeowners",
        location: "East Africa",
      },
    },
  ];

  const filteredAds = ads
    .filter((ad) => {
      const matchesSearch =
        ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ad.vendor || ad.influencer)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || ad.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "trending":
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        case "rating":
          return b.rating - a.rating;
        case "price-low":
          return (
            parseFloat(a.price.replace(/[^0-9.-]+/g, "")) -
            parseFloat(b.price.replace(/[^0-9.-]+/g, ""))
          );
        case "price-high":
          return (
            parseFloat(b.price.replace(/[^0-9.-]+/g, "")) -
            parseFloat(a.price.replace(/[^0-9.-]+/g, ""))
          );
        default:
          return 0;
      }
    });

  const trendingCreators = [
    {
      name: "FashionWithNia",
      followers: "250K",
      category: "Fashion",
      verified: true,
    },
    {
      name: "TechBroAfrica",
      followers: "320K",
      category: "Technology",
      verified: true,
    },
    { name: "AfroFoodie", followers: "180K", category: "Food", verified: true },
    {
      name: "EcoLivingKE",
      followers: "95K",
      category: "Lifestyle",
      verified: false,
    },
    {
      name: "BeautyByZara",
      followers: "210K",
      category: "Beauty",
      verified: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-purple-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-purple-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
              <Megaphone className="w-5 h-5 text-amber-400" />
              <span className="text-amber-200 font-medium tracking-wide">
                Marketplace Hub
              </span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">
                Amplify Your Reach
              </span>
              <br />
              <span className="text-white">Vendor & Influencer Platform</span>
            </h1>

            <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-10">
              Connect brands with Africa's most authentic voices. Showcase
              products, collaborate with influencers, and reach millions of
              engaged customers across the continent.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
              <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
                <div className="text-2xl font-bold text-amber-300">500+</div>
                <div className="text-amber-100/80 text-sm">Active Vendors</div>
              </div>
              <div className="bg-gradient-to-br from-purple-900/20 to-transparent backdrop-blur-sm border border-purple-800/30 rounded-2xl p-4">
                <div className="text-2xl font-bold text-purple-300">2,500+</div>
                <div className="text-purple-100/80 text-sm">Influencers</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4">
                <div className="text-2xl font-bold text-emerald-300">15M+</div>
                <div className="text-emerald-100/80 text-sm">Total Reach</div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4">
                <div className="text-2xl font-bold text-blue-300">92%</div>
                <div className="text-blue-100/80 text-sm">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-purple-500 rounded-2xl blur opacity-30"></div>
              <div className="relative flex bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-2xl overflow-hidden">
                <div className="pl-5 pr-3 flex items-center">
                  <Search className="w-5 h-5 text-amber-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search vendors, influencers, or products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-4 bg-transparent text-amber-100 placeholder-amber-100/50 focus:outline-none text-lg"
                />
                <button className="px-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold hover:from-amber-700 hover:to-amber-800 transition-all duration-300">
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="bg-gradient-to-r from-amber-900/20 via-purple-900/20 to-emerald-900/20 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Boost Your Sales Today
                  </h3>
                  <p className="text-gray-300">Featured placements available</p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-300">
                    24-48h
                  </div>
                  <div className="text-amber-100/80 text-sm">Setup Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-300">
                    From $99
                  </div>
                  <div className="text-purple-100/80 text-sm">Per Campaign</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-300">
                    Free
                  </div>
                  <div className="text-emerald-100/80 text-sm">
                    Consultation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Categories & Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`group relative px-5 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 flex items-center space-x-2 ${
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 shadow-lg shadow-amber-900/30"
                        : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                    }`}
                  >
                    {selectedCategory === category.id && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-purple-500 rounded-xl blur opacity-30"></div>
                    )}
                    <span className="relative">{category.icon}</span>
                    <span className="relative font-medium">
                      {category.name}
                    </span>
                    <span className="relative px-2 py-1 bg-white/10 rounded-full text-xs">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort & Filter */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 text-amber-200 rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="trending">Trending</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400 pointer-events-none" />
              </div>

              <button className="px-5 py-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-purple-700/40 rounded-xl hover:border-purple-500/60 transition-all duration-300">
                <span className="text-purple-200 font-medium">Create Ad</span>
              </button>
            </div>
          </div>

          {/* Ads Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {filteredAds.map((ad) => (
              <div
                key={ad.id}
                className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2"
              >
                {/* Background Glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${ad.gradient}/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                ></div>

                {/* Ad Card */}
                <div className="relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden transition-all duration-500 group-hover:border-amber-500/50 group-hover:shadow-2xl group-hover:shadow-amber-900/30">
                  {/* Featured Badge */}
                  {ad.featured && (
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center space-x-1">
                        <Crown className="w-3 h-3" />
                        <span>FEATURED</span>
                      </div>
                    </div>
                  )}

                  {/* Verified Badge */}
                  {ad.verified && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>VERIFIED</span>
                      </div>
                    </div>
                  )}

                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={ad.image}
                      alt={ad.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>

                    {/* Type Badge */}
                    <div className="absolute bottom-4 left-4 z-10">
                      <div className="px-3 py-1.5 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-700/30 rounded-full">
                        <span className="text-amber-200 text-sm font-medium flex items-center space-x-1">
                          {ad.type === "vendor" ? (
                            <>
                              <ShoppingBag className="w-3 h-3" />
                              <span>VENDOR</span>
                            </>
                          ) : (
                            <>
                              <Users className="w-3 h-3" />
                              <span>INFLUENCER</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors duration-300 mb-2">
                          {ad.title}
                        </h3>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-white ml-1">
                                {ad.rating}
                              </span>
                            </div>
                            {ad.reviews && (
                              <span className="text-gray-400 text-sm">
                                ({ad.reviews} reviews)
                              </span>
                            )}
                            {ad.followers && (
                              <span className="text-gray-400 text-sm">
                                • {ad.followers} followers
                              </span>
                            )}
                          </div>
                          {ad.platform && (
                            <span className="px-2 py-1 bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 rounded-lg text-amber-100 text-xs">
                              {ad.platform}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-6 line-clamp-2">
                      {ad.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-gradient-to-br from-gray-900/50 to-black/50 border border-amber-800/30 rounded-xl">
                        <div className="text-lg font-bold text-amber-300">
                          {ad.engagementRate}
                        </div>
                        <div className="text-amber-100/80 text-xs">
                          Engagement Rate
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-gray-900/50 to-black/50 border border-amber-800/30 rounded-xl">
                        <div className="text-lg font-bold text-emerald-300">
                          {ad.reach}
                        </div>
                        <div className="text-emerald-100/80 text-xs">
                          Monthly Reach
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-gray-900/50 to-black/50 border border-amber-800/30 rounded-xl">
                        <div className="text-lg font-bold text-purple-300">
                          {ad.price}
                        </div>
                        <div className="text-purple-100/80 text-xs">
                          Starting Price
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {ad.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 rounded-lg text-amber-100 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                      <button className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300">
                        View Details
                      </button>
                      <button className="p-3 border-2 border-amber-500/50 text-amber-400 rounded-xl hover:bg-amber-500/10 transition-all duration-300">
                        <Heart className="w-5 h-5" />
                      </button>
                      <button className="p-3 border-2 border-purple-500/50 text-purple-400 rounded-xl hover:bg-purple-500/10 transition-all duration-300">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <div className="mb-12">
            <div className="bg-gradient-to-r from-amber-900/20 via-purple-900/20 to-emerald-900/20 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  How It Works
                </h3>
                <p className="text-gray-300">
                  Three simple steps to amplify your brand
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4">
                    <div className="text-white text-2xl font-bold">1</div>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">
                    Create Your Ad
                  </h4>
                  <p className="text-gray-300">
                    Upload your product details, images, and set your budget.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                    <div className="text-white text-2xl font-bold">2</div>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">
                    Match With Creators
                  </h4>
                  <p className="text-gray-300">
                    Our AI matches you with perfect influencers for your target
                    audience.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <div className="text-white text-2xl font-bold">3</div>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">
                    Track & Optimize
                  </h4>
                  <p className="text-gray-300">
                    Monitor performance in real-time and optimize your
                    campaigns.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trending Creators */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Trending Creators
                </h3>
                <p className="text-gray-300">
                  Top performing influencers this month
                </p>
              </div>
              <Link
                to="/influencers"
                className="text-amber-400 hover:text-amber-300 transition-colors"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {trendingCreators.map((creator, index) => (
                <div
                  key={index}
                  className="group relative p-4 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl hover:border-amber-500/50 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-purple-500"></div>
                      {creator.verified && (
                        <div className="absolute -top-1 -right-1">
                          <CheckCircle className="w-5 h-5 text-emerald-400 fill-current" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{creator.name}</h4>
                      <p className="text-gray-400 text-sm">
                        {creator.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-amber-300">
                        {creator.followers}
                      </div>
                      <div className="text-amber-100/80 text-xs">Followers</div>
                    </div>
                    <button className="px-3 py-1.5 bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 rounded-lg text-amber-200 text-sm hover:border-amber-500/50 transition-colors">
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-amber-900/20 to-purple-900/20 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 md:p-12">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-600 to-purple-600 flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Amplify Your Brand?
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                Join hundreds of successful vendors and influencers who are
                growing their businesses through Nile Mart's premium advertising
                platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300">
                  Start Advertising
                </button>
                <button className="px-8 py-3 border-2 border-amber-500/50 text-amber-400 font-bold rounded-xl hover:bg-amber-500/10 transition-all duration-300">
                  Book a Demo
                </button>
              </div>

              <p className="text-gray-400 text-sm mt-6">
                No setup fees • 24/7 support • Performance-based pricing
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketplaceHub;
