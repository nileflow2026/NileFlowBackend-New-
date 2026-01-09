/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom"; // If you get category from URL
import AddToCartButton from "../../components/AddToCartButton";
import Header from "../../components/Header"; // Adjust path if necessary
import Footer from "../../components/Footer"; // Adjust path if necessary
import { RecommendationSection } from "../../components/RecommendationSection";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";
import axiosClient from "../../api";
import { useCurrency } from "../../Context/CurrencyProvider";
import {
  Sparkles,
  Loader2,
  ChevronRight,
  Filter,
  Star,
  Shield,
  Truck,
  Zap,
  Gem,
  Award,
  Heart,
  ShoppingBag,
  ArrowLeft,
  Grid,
  List,
} from "lucide-react";

const CategoryPage = () => {
  const { categoryId } = useParams();
  const { user, isAuthenticated } = useCustomerAuth();
  const [products, setProducts] = useState([]);
  const [categoryDetails, setCategoryDetails] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("featured");
  const { convertPrice } = useCurrency();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log("🔄 Loading data for category ID:", categoryId);

        // 1. Load category details
        const categoryResponse = await axiosClient.get(
          `/api/customerprofile/categories/${categoryId}`
        );
        setCategoryDetails(categoryResponse.data);
        console.log("Category Details:", categoryResponse.data);

        // 2. Load subcategories
        const subResponse = await axiosClient.get(
          `/api/products/categories/${categoryId}/subcategories`
        );
        const allSubcategories = subResponse.data.subcategories || [];
        const filteredSubcategories = allSubcategories.filter(
          (sub) => sub.name.toLowerCase() !== "all products"
        );
        setSubcategories(filteredSubcategories);
        console.log("Filtered Subcategories:", filteredSubcategories);

        // 3. Load products - FIX THIS PART
        const productsUrl = `/api/customerprofile/products/category/${categoryId}`;
        console.log("📞 Calling products endpoint:", productsUrl);

        const productsResponse = await axiosClient.get(productsUrl);

        console.log("📦 Products response:", productsResponse.data);
        console.log("✅ Products array:", productsResponse.data.products);
        console.log("✅ Number of products:", productsResponse.data.count);

        // ✅ FIX: Extract the products array from the response
        if (productsResponse.data.success) {
          setProducts(productsResponse.data.products || []);
          console.log(
            "✅ Products loaded:",
            productsResponse.data.products?.length || 0
          );
        } else {
          console.error("❌ Products API error:", productsResponse.data.error);
          setProducts([]);
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        // Clear products on error
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      loadData();
    }
  }, [categoryId]);

  const handleSubcategoryClick = async (subId) => {
    setSelectedSubcategory(subId);
    setLoading(true);

    try {
      // Use a single request and normalize the response into an array
      const url = !subId
        ? `/api/customerprofile/products/category/${categoryId}`
        : `/api/products/products/subcategory/${subId}`;

      const productsResponse = await axiosClient.get(url);
      const resData = productsResponse.data;

      // Common API shapes:
      // { success: true, products: [...] }
      // { products: [...] }
      // [...] (array)
      if (resData && resData.success && Array.isArray(resData.products)) {
        setProducts(resData.products);
        console.log("Products (success):", resData.products);
      } else if (resData && Array.isArray(resData.products)) {
        setProducts(resData.products);
        console.log("Products:", resData.products);
      } else if (Array.isArray(resData)) {
        setProducts(resData);
        console.log("Products array:", resData);
      } else if (resData && resData.products) {
        // fallback - try to coerce to array
        setProducts(resData.products || []);
        console.log("Products (fallback):", resData.products);
      } else {
        console.warn("Unexpected products response shape:", resData);
        setProducts([]);
      }
    } catch (error) {
      console.error("❌ Error fetching subcategory products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryGradient = (categoryName) => {
    const gradients = {
      fashion: "from-pink-600/20 via-rose-600/20 to-red-600/20",
      electronics: "from-blue-600/20 via-indigo-600/20 to-purple-600/20",
      home: "from-amber-600/20 via-orange-600/20 to-yellow-600/20",
      beauty: "from-fuchsia-600/20 via-pink-600/20 to-rose-600/20",
      food: "from-emerald-600/20 via-green-600/20 to-teal-600/20",
      art: "from-violet-600/20 via-purple-600/20 to-fuchsia-600/20",
      default: "from-amber-600/20 via-yellow-600/20 to-orange-600/20",
    };

    const name = categoryName?.toLowerCase() || "";
    if (name.includes("fashion")) return gradients.fashion;
    if (name.includes("electronic")) return gradients.electronics;
    if (name.includes("home")) return gradients.home;
    if (name.includes("beauty")) return gradients.beauty;
    if (name.includes("food")) return gradients.food;
    if (name.includes("art")) return gradients.art;
    return gradients.default;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-gray-900/10 to-emerald-900/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-3 mb-8">
            {/* <Link
              to="/categories"
              className="flex items-center space-x-2 text-amber-300 hover:text-amber-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">All Categories</span>
            </Link> */}
            <ChevronRight className="w-4 h-4 text-amber-500/50" />
            <span className="text-amber-200 font-bold">
              {categoryDetails?.name || "Loading..."}
            </span>
          </div>

          {/* Category Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-12">
            <div className="mb-8 lg:mb-0">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-amber-700/30 mb-4">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-amber-200 text-sm font-medium">
                  Premium Collection
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
                <span
                  className={`bg-gradient-to-r ${getCategoryGradient(
                    categoryDetails?.name
                  ).replace("/20", "")} bg-clip-text text-transparent`}
                >
                  {categoryDetails?.name || "Loading..."}
                </span>
              </h1>

              <p className="text-gray-300 text-lg max-w-2xl">
                Discover authentic{" "}
                {categoryDetails?.name?.toLowerCase() || "African"} products
                crafted with tradition and premium quality.
                <span className="block mt-2 text-amber-200/70">
                  {products.length} premium products available
                </span>
              </p>

              {/* Category Stats */}
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center space-x-2 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-amber-800/30">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-100 text-sm">
                    Premium Quality
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-amber-800/30">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-100 text-sm">
                    Authentic Origin
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-amber-800/30">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-100 text-sm">Fast Delivery</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
              <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm border border-amber-700/40 rounded-xl hover:border-amber-500/60 transition-all duration-300">
                <Filter className="w-4 h-4 text-amber-400" />
                <span className="text-amber-200 font-medium">Filter</span>
              </button>

              <div className="flex items-center bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 ${
                    viewMode === "grid" ? "bg-amber-900/30" : ""
                  } transition-colors`}
                >
                  <Grid
                    className={`w-5 h-5 ${
                      viewMode === "grid" ? "text-amber-400" : "text-gray-400"
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
                      viewMode === "list" ? "text-amber-400" : "text-gray-400"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Subcategories Bar */}
          {subcategories.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-amber-200">
                  Browse Collections
                </h2>
                <div className="text-sm text-gray-400">
                  {selectedSubcategory
                    ? "Filtered by subcategory"
                    : "All products"}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleSubcategoryClick(null)}
                  className={`group relative px-6 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                    !selectedSubcategory
                      ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 shadow-lg shadow-amber-900/30"
                      : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                  }`}
                >
                  {!selectedSubcategory && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-30"></div>
                  )}
                  <span className="relative font-medium">All Products</span>
                  <span className="relative ml-2 text-xs opacity-75">
                    ({products.length})
                  </span>
                </button>

                {subcategories.map((sub) => (
                  <button
                    key={sub.$id}
                    onClick={() => handleSubcategoryClick(sub.$id)}
                    className={`group relative px-6 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                      selectedSubcategory === sub.$id
                        ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 shadow-lg shadow-amber-900/30"
                        : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                    }`}
                  >
                    {selectedSubcategory === sub.$id && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-30"></div>
                    )}
                    <span className="relative font-medium">{sub.name}</span>
                    <Zap className="relative inline-block w-3 h-3 ml-2 text-amber-300" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Section */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Gem className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>
              </div>
              <h3 className="mt-8 text-2xl font-bold text-amber-200">
                Loading Premium Products
              </h3>
              <p className="text-gray-400 mt-2">
                Curating authentic African treasures for you...
              </p>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              {products.length === 0 ? (
                <div className="text-center py-32">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-6">
                    <ShoppingBag className="w-12 h-12 text-amber-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    No Products Found
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-8">
                    We're currently updating our collection of premium{" "}
                    {categoryDetails?.name?.toLowerCase() || "African"}{" "}
                    products. Check back soon or explore other categories.
                  </p>
                  <Link
                    to="/categories"
                    className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
                  >
                    <span>Explore Other Categories</span>
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              ) : (
                <div
                  className={`${
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "flex flex-col"
                  } gap-6`}
                >
                  {products.map((product) => (
                    <div
                      key={product.$id}
                      className={`group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2 ${
                        viewMode === "list"
                          ? "flex bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 p-6"
                          : ""
                      }`}
                    >
                      {/* Background Glow */}
                      <div
                        className={`absolute inset-0 ${getCategoryGradient(
                          categoryDetails?.name
                        )} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      ></div>

                      {/* Product Card */}
                      <div
                        className={`relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden transition-all duration-500 group-hover:border-amber-500/50 group-hover:shadow-2xl group-hover:shadow-amber-900/30 ${
                          viewMode === "list" ? "flex flex-1" : ""
                        }`}
                      >
                        {/* Product Image */}
                        <div
                          className={`relative overflow-hidden ${
                            viewMode === "list"
                              ? "w-48 h-48 flex-shrink-0"
                              : "h-64"
                          }`}
                        >
                          <Link to={`/products/${product.$id}`}>
                            <img
                              src={product.image}
                              alt={product.productName}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          </Link>

                          {/* Image Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60"></div>

                          {/* Premium Badge */}
                          <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1">
                            <Award className="w-3 h-3" />
                            <span>Premium</span>
                          </div>

                          {/* Quick Actions */}
                          <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-700/30 flex items-center justify-center text-amber-400 hover:text-amber-300 hover:scale-110 transition-all">
                              <Heart className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div
                          className={`${
                            viewMode === "list" ? "flex-1 p-6" : "p-6"
                          }`}
                        >
                          <div className="mb-4">
                            <Link to={`/products/${product.$id}`}>
                              <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors duration-300 line-clamp-2">
                                {product.productName}
                              </h3>
                            </Link>

                            {viewMode === "grid" && (
                              <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                                {product.description ||
                                  "Premium quality African product with authentic craftsmanship."}
                              </p>
                            )}
                          </div>

                          {/* Price & Rating */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex flex-col">
                              <span className="text-2xl font-bold text-amber-300">
                                {convertPrice(product.price)}
                              </span>
                              {product.originalPrice && (
                                <span className="text-gray-500 line-through text-sm">
                                  {convertPrice(product.originalPrice)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-amber-700/30">
                              <Star className="w-3 h-3 text-amber-400 fill-current" />
                              <span className="text-xs font-bold text-amber-200">
                                4.8
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <AddToCartButton
                                product={product}
                                className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center justify-center space-x-2"
                              />
                            </div>

                            <Link
                              to={`/products/${product.$id}`}
                              className="p-3 border-2 border-amber-500/50 text-amber-400 rounded-xl hover:bg-amber-500/10 transition-all duration-300"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </Link>
                          </div>

                          {/* Features */}
                          {viewMode === "list" && (
                            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-amber-800/30">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm text-emerald-100">
                                  Authentic Origin
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Truck className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-blue-100">
                                  Free Shipping
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span className="text-sm text-amber-100">
                                  Premium Quality
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Category-specific Recommendations */}
              <div className="my-16">
                {isAuthenticated && user ? (
                  <RecommendationSection
                    userId={user.id}
                    category={categoryDetails?.name}
                    title={`More in ${
                      categoryDetails?.name || "this category"
                    }`}
                    context="category_page"
                  />
                ) : (
                  <RecommendationSection
                    userId={null}
                    category={categoryDetails?.name}
                    title={`Popular in ${
                      categoryDetails?.name || "this category"
                    }`}
                    context="category_page_guest"
                  />
                )}
              </div>

              {/* Category Stats Footer */}
              <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6">
                  <div className="text-2xl font-bold text-amber-300 mb-2">
                    {products.length}
                  </div>
                  <div className="text-amber-100/80">Premium Products</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6">
                  <div className="text-2xl font-bold text-emerald-300 mb-2">
                    100%
                  </div>
                  <div className="text-emerald-100/80">Authentic Quality</div>
                </div>
                <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6">
                  <div className="text-2xl font-bold text-blue-300 mb-2">
                    Free
                  </div>
                  <div className="text-blue-100/80">Shipping Available</div>
                </div>
                <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-6">
                  <div className="text-2xl font-bold text-red-300 mb-2">
                    24/7
                  </div>
                  <div className="text-red-100/80">Customer Support</div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
