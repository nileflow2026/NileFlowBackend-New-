/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  fetchCategories,
  fetchProduct,
  fetchReviews,
} from "../../CustomerServices";
import ProductCard from "../../components/ProductCard";
import axiosClient from "../../api";
import {
  Filter,
  X,
  ChevronDown,
  Sparkles,
  Star,
  Zap,
  Gem,
  Crown,
  TrendingUp,
  Search,
  SlidersHorizontal,
  MapPin,
  Shield,
  Truck,
  Globe,
  Loader2,
} from "lucide-react";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500000 });
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegions, setSelectedRegions] = useState([]);

  const africanRegions = [
    { id: "west", name: "West Africa", color: "from-amber-600 to-orange-600" },
    { id: "east", name: "East Africa", color: "from-emerald-600 to-green-600" },
    {
      id: "south",
      name: "Southern Africa",
      color: "from-blue-600 to-indigo-600",
    },
    { id: "north", name: "North Africa", color: "from-red-600 to-pink-600" },
    {
      id: "central",
      name: "Central Africa",
      color: "from-purple-600 to-violet-600",
    },
  ];

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories([
          { id: "all", name: "All", icon: <Globe className="w-4 h-4" /> },
          ...data.filter((c) => c.name !== "All"),
        ]);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        let data;
        if (selectedCategory === "all") {
          data = await fetchProduct(
            { category: selectedCategory, search: "" },
            setLoading,
          );
        } else {
          const res = await axiosClient.get(
            `/api/customerprofile/products/category/${selectedCategory}`,
          );
          data = Array.isArray(res.data) ? res.data : res.data?.products || [];
        }
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [selectedCategory]);

  useEffect(() => {
    const fetchAllRatings = async () => {
      if (products.length === 0) return;

      const promises = products.map(async (product) => {
        if (!product.$id) return { productId: product.$id, reviews: [] };

        try {
          const reviews = await fetchReviews(product.$id);
          return { productId: product.$id, reviews: reviews || [] };
        } catch (error) {
          console.error("Error fetching reviews:", error);
          return { productId: product.$id, reviews: [] };
        }
      });

      const results = await Promise.all(promises);

      const ratingsData = {};
      results.forEach(({ productId, reviews }) => {
        const totalRatings = reviews.length;
        const averageRating =
          totalRatings > 0
            ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
              totalRatings
            : 0;
        ratingsData[productId] = {
          count: totalRatings,
          average: averageRating,
        };
      });

      setRatings(ratingsData);
    };

    fetchAllRatings();
  }, [products]);

  const filteredProducts = products
    .filter((product) => {
      const price = product.price || 0;
      return price >= priceRange.min && price <= priceRange.max;
    })
    .filter((product) => {
      if (searchQuery === "") return true;
      const name = product.productName || product.name || "";
      const desc = product.description || "";
      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "rating":
          return (
            (ratings[b.$id]?.average || 0) - (ratings[a.$id]?.average || 0)
          );
        default:
          return 0;
      }
    });

  const clearFilters = () => {
    setSelectedCategory("all");
    setPriceRange({ min: 0, max: 500000 });
    // setSelectedRegions([]);
    setSearchQuery("");
    setSortBy("featured");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium Marketplace
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              African Treasures
            </span>
            <br />
            <span className="text-white">Premium Collection</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Discover authentic products from across Africa, handpicked for
            quality and cultural significance
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12 px-4 sm:px-0">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl sm:rounded-2xl blur opacity-30"></div>
              <div className="relative flex bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-xl sm:rounded-2xl overflow-hidden">
                <div className="pl-3 sm:pl-4 md:pl-5 pr-2 sm:pr-3 flex items-center">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-2 sm:px-3 md:px-4 py-3 sm:py-4 bg-transparent text-amber-100 placeholder-amber-100/50 focus:outline-none text-sm sm:text-base md:text-lg"
                />
                <button className="px-3 sm:px-4 md:px-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold hover:from-amber-700 hover:to-amber-800 transition-all duration-300 text-sm sm:text-base">
                  <span className="hidden xs:hidden sm:inline">Search</span>
                  <Search className="w-4 h-4 sm:hidden" />
                </button>
              </div>
            </div>

            {/* Search suggestions for better UX on mobile */}
            <div className="mt-3 sm:mt-4 text-center">
              <p className="text-xs sm:text-sm text-amber-100/60">
                <span className="hidden sm:inline">Try searching for: </span>
                <span className="text-amber-300 font-medium">
                  Art, Jewelry, Textiles, Spices
                </span>
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-0">
            {/* Mobile: Horizontal scroll */}
            <div className="md:hidden">
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                <div className="flex-shrink-0 bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-xl p-4 min-w-[140px] snap-start">
                  <div className="text-xl sm:text-2xl font-bold text-amber-300">
                    {products.length}
                  </div>
                  <div className="text-amber-100/80 text-xs sm:text-sm whitespace-nowrap">
                    Premium Products
                  </div>
                </div>
                <div className="flex-shrink-0 bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-xl p-4 min-w-[140px] snap-start">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-300">
                    {categories.length}
                  </div>
                  <div className="text-emerald-100/80 text-xs sm:text-sm whitespace-nowrap">
                    Categories
                  </div>
                </div>
                <div className="flex-shrink-0 bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-xl p-4 min-w-[140px] snap-start">
                  <div className="text-xl sm:text-2xl font-bold text-blue-300">
                    5
                  </div>
                  <div className="text-blue-100/80 text-xs sm:text-sm whitespace-nowrap">
                    African Regions
                  </div>
                </div>
                <div className="flex-shrink-0 bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-xl p-4 min-w-[140px] snap-start">
                  <div className="text-xl sm:text-2xl font-bold text-red-300">
                    24/7
                  </div>
                  <div className="text-red-100/80 text-xs sm:text-sm whitespace-nowrap">
                    Support
                  </div>
                </div>
              </div>

              {/* Scroll indicator dots */}
              <div className="flex justify-center space-x-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-amber-400/60"></div>
                <div className="w-2 h-2 rounded-full bg-amber-400/30"></div>
                <div className="w-2 h-2 rounded-full bg-amber-400/30"></div>
                <div className="w-2 h-2 rounded-full bg-amber-400/30"></div>
              </div>
            </div>

            {/* Tablet and Desktop: Grid layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-center">
                <div className="text-2xl lg:text-3xl font-bold text-amber-300">
                  {products.length}
                </div>
                <div className="text-amber-100/80 text-sm lg:text-base">
                  Premium Products
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-center">
                <div className="text-2xl lg:text-3xl font-bold text-emerald-300">
                  {categories.length}
                </div>
                <div className="text-emerald-100/80 text-sm lg:text-base">
                  Categories
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-center">
                <div className="text-2xl lg:text-3xl font-bold text-blue-300">
                  5
                </div>
                <div className="text-blue-100/80 text-sm lg:text-base">
                  African Regions
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-center">
                <div className="text-2xl lg:text-3xl font-bold text-red-300">
                  24/7
                </div>
                <div className="text-red-100/80 text-sm lg:text-base">
                  Support
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Filter Bar */}
          <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Categories */}
            <div className="w-full">
              {/* Mobile: Horizontal scroll */}
              <div className="md:hidden">
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`group relative flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border backdrop-blur-sm transition-all duration-300 flex items-center space-x-2 snap-start ${
                        selectedCategory === category.id
                          ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 shadow-lg shadow-amber-900/30"
                          : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                      }`}
                    >
                      {selectedCategory === category.id && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-lg sm:rounded-xl blur opacity-30"></div>
                      )}
                      {category.icon && (
                        <span className="relative text-sm">
                          {category.icon}
                        </span>
                      )}
                      <span className="relative font-medium text-sm sm:text-base whitespace-nowrap">
                        {category.name}
                      </span>
                      {selectedCategory === category.id && (
                        <Zap className="relative w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Scroll hint for mobile */}
                <div className="flex justify-center mt-2">
                  <div className="text-xs text-amber-100/50">
                    Swipe to see more categories
                  </div>
                </div>
              </div>

              {/* Tablet and Desktop: Wrap layout */}
              <div className="hidden md:flex md:flex-wrap gap-2 lg:gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`group relative px-4 lg:px-5 py-2 lg:py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 flex items-center space-x-2 ${
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 shadow-lg shadow-amber-900/30"
                        : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                    }`}
                  >
                    {selectedCategory === category.id && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-30"></div>
                    )}
                    {category.icon && (
                      <span className="relative">{category.icon}</span>
                    )}
                    <span className="relative font-medium">
                      {category.name}
                    </span>
                    {selectedCategory === category.id && (
                      <Zap className="relative w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              {/* Sort Dropdown */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative min-w-0 flex-1 sm:flex-none">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none w-full sm:w-auto bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 text-amber-200 rounded-lg sm:rounded-xl pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-3 focus:outline-none focus:border-amber-500/50 text-sm sm:text-base"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                  <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-amber-400 pointer-events-none" />
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="flex items-center space-x-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-3 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm border border-amber-700/40 rounded-lg sm:rounded-xl hover:border-amber-500/60 transition-all duration-300 text-sm sm:text-base"
                >
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  <span className="text-amber-200 font-medium">
                    <span className="hidden xs:inline">Filters</span>
                    <span className="xs:hidden">Filter</span>
                  </span>
                </button>
              </div>

              {/* Clear Filters Button */}
              {(selectedCategory !== "all" || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-lg sm:rounded-xl hover:border-amber-500/50 transition-all duration-300 text-sm sm:text-base"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  <span className="text-amber-200 font-medium">
                    <span className="hidden sm:inline">Clear Filters</span>
                    <span className="sm:hidden">Clear</span>
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {filterOpen && (
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <SlidersHorizontal className="w-6 h-6 text-amber-400" />
                  <h3 className="text-xl font-bold text-amber-200">
                    Filter Products
                  </h3>
                </div>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="p-2 hover:bg-amber-900/30 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-amber-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Price Range */}
                <div>
                  <h4 className="text-amber-100 font-medium mb-3">
                    Price Range
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="text-sm text-amber-100/70 mb-1 block">
                          Min
                        </label>
                        <input
                          type="number"
                          value={priceRange.min}
                          onChange={(e) =>
                            setPriceRange({
                              ...priceRange,
                              min: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-2 bg-gray-900/50 border border-amber-800/30 rounded-lg text-amber-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm text-amber-100/70 mb-1 block">
                          Max
                        </label>
                        <input
                          type="number"
                          value={priceRange.max}
                          onChange={(e) =>
                            setPriceRange({
                              ...priceRange,
                              max: Number(e.target.value) || 500000,
                            })
                          }
                          className="w-full px-4 py-2 bg-gray-900/50 border border-amber-800/30 rounded-lg text-amber-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="text-sm text-amber-100/70">
                        Range:{" "}
                        <span className="text-amber-300">
                          {priceRange.min} - {priceRange.max}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Regions - Commented out for now */}
                {/* <div>
                  <h4 className="text-amber-100 font-medium mb-3 flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>African Regions</span>
                  </h4>
                  <div className="space-y-2">
                    {africanRegions.map((region) => (
                      <button
                        key={region.id}
                        onClick={() => {
                          setSelectedRegions((prev) =>
                            prev.includes(region.id)
                              ? prev.filter((r) => r !== region.id)
                              : [...prev, region.id]
                          );
                        }}
                        className={`w-full px-4 py-2 rounded-lg border backdrop-blur-sm transition-all duration-300 flex items-center justify-between ${
                          selectedRegions.includes(region.id)
                            ? `bg-gradient-to-r ${region.color} border-transparent text-white`
                            : "bg-gray-900/50 border-amber-800/30 text-amber-100 hover:border-amber-500/50"
                        }`}
                      >
                        <span>{region.name}</span>
                        {selectedRegions.includes(region.id) && (
                          <Star className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div> */}

                {/* Features - Commented out for now */}
                {/* <div>
                  <h4 className="text-amber-100 font-medium mb-3">Features</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-900/50 border border-amber-800/30 rounded-lg">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <span className="text-amber-100">Authentic Origin</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-900/50 border border-amber-800/30 rounded-lg">
                      <Truck className="w-5 h-5 text-blue-400" />
                      <span className="text-amber-100">Fast Shipping</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-900/50 border border-amber-800/30 rounded-lg">
                      <Gem className="w-5 h-5 text-amber-400" />
                      <span className="text-amber-100">Premium Quality</span>
                    </div>
                  </div>
                </div> */}

                {/* Active Filters */}
                <div>
                  <h4 className="text-amber-100 font-medium mb-3">
                    Active Filters
                  </h4>
                  <div className="space-y-2">
                    {selectedCategory !== "all" && (
                      <div className="px-3 py-2 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-amber-700/30 rounded-lg flex items-center justify-between">
                        <span className="text-amber-200">Category</span>
                        <span className="text-amber-300 font-medium">
                          {
                            categories.find((c) => c.id === selectedCategory)
                              ?.name
                          }
                        </span>
                      </div>
                    )}
                    {searchQuery && (
                      <div className="px-3 py-2 bg-gradient-to-r from-emerald-900/30 to-green-900/30 border border-emerald-700/30 rounded-lg flex items-center justify-between">
                        <span className="text-emerald-200">Search</span>
                        <span className="text-emerald-300 font-medium">
                          "{searchQuery}"
                        </span>
                      </div>
                    )}
                    {/* {selectedRegions.length > 0 && (
                      <div className="px-3 py-2 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700/30 rounded-lg flex items-center justify-between">
                        <span className="text-blue-200">Regions</span>
                        <span className="text-blue-300 font-medium">
                          {selectedRegions.length}
                        </span>
                      </div>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Gem className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>
              </div>
              <h3 className="mt-8 text-2xl font-bold text-amber-200">
                Discovering African Treasures
              </h3>
              <p className="text-gray-400 mt-2">
                Curating premium products for you...
              </p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              {/* Results Info */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-amber-200">
                  Showing{" "}
                  <span className="text-amber-300 font-bold">
                    {filteredProducts.length}
                  </span>{" "}
                  of{" "}
                  <span className="text-amber-300 font-bold">
                    {products.length}
                  </span>{" "}
                  premium products
                </div>
                <div className="text-amber-100/70 text-sm">
                  Sorted by{" "}
                  <span className="text-amber-300 font-medium">
                    {sortBy === "featured"
                      ? "Featured"
                      : sortBy === "price-low"
                        ? "Price: Low to High"
                        : sortBy === "price-high"
                          ? "Price: High to Low"
                          : "Highest Rated"}
                  </span>
                </div>
              </div>

              {/* Products */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, index) => {
                  try {
                    return (
                      <div
                        key={product.$id}
                        className="transform transition-all duration-500 hover:-translate-y-2"
                      >
                        <ProductCard
                          product={product}
                          id={product.$id}
                          totalRatings={
                            product.totalRatings ||
                            ratings[product.$id]?.count ||
                            0
                          }
                          averageRating={
                            product.averageRating ||
                            ratings[product.$id]?.average ||
                            0
                          }
                          premium={true}
                        />
                      </div>
                    );
                  } catch (error) {
                    return (
                      <div
                        key={product.$id}
                        className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-center"
                      >
                        <p className="text-red-400 text-sm">
                          Error rendering product
                        </p>
                        <p className="text-red-300 text-xs mt-2">
                          {product.productName}
                        </p>
                      </div>
                    );
                  }
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-32">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-6">
                <TrendingUp className="w-12 h-12 text-amber-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                No Products Found
              </h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                {searchQuery
                  ? `No products match "${searchQuery}". Try a different search.`
                  : "No products match your current filters. Try adjusting your criteria."}
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
              >
                <X className="w-5 h-5" />
                <span>Clear All Filters</span>
              </button>
            </div>
          )}

          {/* Trust Badges */}
          <div className="mt-12 sm:mt-16 w-full">
            {/* Mobile: Horizontal scroll */}
            <div className="lg:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory px-4 sm:px-0">
                <div className="flex-shrink-0 bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center min-w-[160px] snap-start">
                  <div className="text-xl sm:text-2xl font-bold text-amber-300 mb-1 sm:mb-2">
                    100%
                  </div>
                  <div className="text-amber-100/80 text-xs sm:text-sm lg:text-base whitespace-nowrap">
                    Authentic Products
                  </div>
                </div>
                <div className="flex-shrink-0 bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center min-w-[160px] snap-start">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-300 mb-1 sm:mb-2">
                    Free
                  </div>
                  <div className="text-emerald-100/80 text-xs sm:text-sm lg:text-base whitespace-nowrap">
                    Shipping Over 100
                  </div>
                </div>
                <div className="flex-shrink-0 bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center min-w-[160px] snap-start">
                  <div className="text-xl sm:text-2xl font-bold text-blue-300 mb-1 sm:mb-2">
                    30 Days
                  </div>
                  <div className="text-blue-100/80 text-xs sm:text-sm lg:text-base whitespace-nowrap">
                    Returns Policy
                  </div>
                </div>
                <div className="flex-shrink-0 bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center min-w-[160px] snap-start">
                  <div className="text-xl sm:text-2xl font-bold text-red-300 mb-1 sm:mb-2">
                    24/7
                  </div>
                  <div className="text-red-100/80 text-xs sm:text-sm lg:text-base whitespace-nowrap">
                    Customer Support
                  </div>
                </div>
              </div>

              {/* Scroll hint for mobile */}
              <div className="flex justify-center mt-3">
                <div className="text-xs text-amber-100/50">
                  Swipe to see all features
                </div>
              </div>
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center">
                <div className="text-2xl font-bold text-amber-300 mb-2">
                  100%
                </div>
                <div className="text-amber-100/80">Authentic Products</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6 text-center">
                <div className="text-2xl font-bold text-emerald-300 mb-2">
                  Free
                </div>
                <div className="text-emerald-100/80">Shipping Over 100</div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6 text-center">
                <div className="text-2xl font-bold text-blue-300 mb-2">
                  30 Days
                </div>
                <div className="text-blue-100/80">Returns Policy</div>
              </div>
              <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-6 text-center">
                <div className="text-2xl font-bold text-red-300 mb-2">24/7</div>
                <div className="text-red-100/80">Customer Support</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
