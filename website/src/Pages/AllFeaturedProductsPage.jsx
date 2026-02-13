import React, { useState, useEffect } from "react";
import axiosClient from "../../api";
import {
  Sparkles,
  Loader2,
  Crown,
  Award,
  Star,
  Shield,
  Zap,
  Filter,
  Grid,
  List,
  ChevronRight,
  Gem,
  TrendingUp,
  ShoppingBag,
  Heart,
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";

const AllFeaturedProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const categories = [
    { id: "fashion", name: "Fashion", icon: "👗" },
    { id: "electronics", name: "Electronics", icon: "📱" },
    { id: "home", name: "Home Decor", icon: "🏠" },
    { id: "art", name: "Art & Craft", icon: "🎨" },
    { id: "beauty", name: "Beauty", icon: "💄" },
    { id: "food", name: "Food & Spices", icon: "🍲" },
  ];

  useEffect(() => {
    const fetchAllFeaturedProducts = async () => {
      try {
        const response = await axiosClient(
          "/api/customerprofile/featured-products?showAll=true",
        );
        setProducts(response.data);
      } catch (err) {
        console.error("Failed to fetch all featured products:", err);
        setError("Failed to load featured products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllFeaturedProducts();
  }, []);

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const filteredProducts =
    selectedCategories.length > 0
      ? products.filter((product) =>
          selectedCategories.includes(product.category || "fashion"),
        )
      : products;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <Header />
        <div className="flex flex-col justify-center items-center h-screen">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Gem className="w-10 h-10 text-amber-500 animate-pulse" />
            </div>
          </div>
          <h3 className="mt-8 text-2xl font-bold text-amber-200">
            Loading Premium Collection
          </h3>
          <p className="text-gray-400 mt-2">
            Curating exclusive African treasures...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <Header />
        <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-gray-900/20 to-amber-900/20"></div>
          <div className="relative max-w-8xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-red-900/30 to-amber-900/30 border border-red-700/30 mb-6">
              <Zap className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">
              Unable to Load Products
            </h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
            >
              <span>Try Again</span>
              <Zap className="w-5 h-5" />
            </button>
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
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium Collection
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Featured Excellence
            </span>
            <br />
            <span className="text-white">All Premium Products</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Discover our complete collection of handpicked African treasures,
            each selected for exceptional quality and cultural significance.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-300">
                {products.length}
              </div>
              <div className="text-amber-100/80 text-sm">Premium Products</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-300">54</div>
              <div className="text-emerald-100/80 text-sm">
                African Countries
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-300">100%</div>
              <div className="text-blue-100/80 text-sm">Authentic Origin</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-300">5★</div>
              <div className="text-red-100/80 text-sm">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Filters & Controls */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Categories */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-200 mb-3">
                    Filter by Category
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryToggle(category.id)}
                        className={`group relative px-4 py-2 rounded-xl border backdrop-blur-sm transition-all duration-300 flex items-center space-x-2 ${
                          selectedCategories.includes(category.id)
                            ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 shadow-lg shadow-amber-900/30"
                            : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                        }`}
                      >
                        <span className="text-lg">{category.icon}</span>
                        <span className="font-medium">{category.name}</span>
                        {selectedCategories.includes(category.id) && (
                          <Star className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* View & Sort Controls */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-3 ${
                        viewMode === "grid" ? "bg-amber-900/30" : ""
                      } transition-colors`}
                    >
                      <Grid
                        className={`w-5 h-5 ${
                          viewMode === "grid"
                            ? "text-amber-400"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-3 ${
                        viewMode === "list" ? "bg-amber-900/30" : ""
                      } transition-colors`}
                    >
                      <List
                        className={`w-5 h-5 ${
                          viewMode === "list"
                            ? "text-amber-400"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 text-amber-200 rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="featured">Featured First</option>
                    <option value="newest">Newest First</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Products Count */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="text-amber-200">
                Showing{" "}
                <span className="text-amber-300 font-bold">
                  {filteredProducts.length}
                </span>{" "}
                premium products
                {selectedCategories.length > 0 && (
                  <span className="text-amber-100/70 ml-2">
                    in {selectedCategories.length} categor
                    {selectedCategories.length === 1 ? "y" : "ies"}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedCategories([])}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                  selectedCategories.length > 0
                    ? "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-amber-200 hover:border-amber-500/50"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                <span>Clear Filters</span>
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div
              className={`${
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col"
              } gap-6`}
            >
              {filteredProducts.map((product, index) => (
                <div
                  key={product.$id || index}
                  className={`transform transition-all duration-500 hover:-translate-y-2 ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  <ProductCard
                    product={product}
                    id={product.$id || product.id}
                    premium={true}
                  />

                  {/* Featured Badge for first few products */}
                  {index < 3 && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>TRENDING</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-6">
                <ShoppingBag className="w-12 h-12 text-amber-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                No Products Found
              </h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                No products match your selected categories. Try adjusting your
                filters to see more premium African products.
              </p>
              <button
                onClick={() => setSelectedCategories([])}
                className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
              >
                <span>Clear All Filters</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Collection Stats */}
          <div className="mt-16">
            <div className="bg-gradient-to-r from-amber-900/20 via-emerald-900/20 to-blue-900/20 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-amber-200 mb-2">
                    Premium Quality
                  </h4>
                  <p className="text-amber-100/70">
                    Every product is handpicked for exceptional craftsmanship
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-emerald-200 mb-2">
                    Authentic Origin
                  </h4>
                  <p className="text-emerald-100/70">
                    Directly sourced from African artisans and communities
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-blue-200 mb-2">
                    Customer Love
                  </h4>
                  <p className="text-blue-100/70">
                    98% customer satisfaction with our featured collection
                  </p>
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

export default AllFeaturedProductsPage;
