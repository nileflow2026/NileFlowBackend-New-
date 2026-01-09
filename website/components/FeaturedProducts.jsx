import React, { useEffect, useState } from "react";
import axiosClient from "../api";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Loader2,
  Star,
  Award,
  Shield,
  Zap,
  Flame,
  ChevronRight,
  Heart,
  ShoppingBag,
  Gem,
  TrendingUp,
  Crown,
} from "lucide-react";
const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosClient(
          "/api/customerprofile/featured-products"
        );
        setProducts(response.data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load featured products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const getProductGradient = (index) => {
    const gradients = [
      "from-amber-500/20 via-orange-500/20 to-yellow-500/20",
      "from-emerald-500/20 via-green-500/20 to-teal-500/20",
      "from-red-500/20 via-rose-500/20 to-pink-500/20",
      "from-blue-500/20 via-indigo-500/20 to-purple-500/20",
      "from-violet-500/20 via-purple-500/20 to-fuchsia-500/20",
      "from-cyan-500/20 via-blue-500/20 to-sky-500/20",
    ];
    return gradients[index % gradients.length];
  };

  if (error) {
    return (
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-red-900/10 to-emerald-900/10"></div>
        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-red-900/30 to-amber-900/30 border border-red-700/30 mb-6">
            <Flame className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            Unable to Load Featured Products
          </h3>
          <p className="text-gray-400 max-w-md mx-auto mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
          >
            <span>Try Again</span>
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/5 via-gray-900/5 to-emerald-900/5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-x-48 translate-y-48"></div>

      <div className="relative max-w-8xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium Selection
            </span>
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Featured Excellence
            </span>
            <br />
            <span className="text-white">Curated African Treasures</span>
          </h2>

          <p className="text-gray-300 max-w-2xl mx-auto text-lg mb-10">
            Handpicked premium products showcasing the finest craftsmanship from
            across Africa
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 animate-pulse"></div>
              <span className="text-amber-200 text-sm">
                Premium Quality Guaranteed
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 animate-pulse"></div>
              <span className="text-emerald-200 text-sm">
                Authentic African Origin
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
              <span className="text-blue-200 text-sm">
                Express Delivery Available
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Gem className="w-10 h-10 text-amber-500 animate-pulse" />
              </div>
            </div>
            <h3 className="mt-8 text-2xl font-bold text-amber-200">
              Curating Premium Selection
            </h3>
            <p className="text-gray-400 mt-2">
              Discovering authentic African treasures...
            </p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product, index) => {
                const gradientClass = getProductGradient(index);
                return (
                  <div
                    key={product.$id || index}
                    className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2"
                    onMouseEnter={() => setHoveredProduct(product.$id || index)}
                    onMouseLeave={() => setHoveredProduct(null)}
                  >
                    {/* Background Glow */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    ></div>

                    {/* Card */}
                    <div className="relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden transition-all duration-500 group-hover:border-amber-500/50 group-hover:shadow-2xl group-hover:shadow-amber-900/30">
                      {/* Product Tag */}
                      {product.tag && (
                        <div className="absolute top-4 left-4 z-10">
                          <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{product.tag}</span>
                          </div>
                        </div>
                      )}

                      {/* Wishlist Button */}
                      <button className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-700/30 flex items-center justify-center text-amber-400 hover:text-amber-300 hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100">
                        <Heart className="w-5 h-5" />
                      </button>

                      {/* Image Container */}
                      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-900 to-black">
                        <Link to={`/products/${product.$id || product.id}`}>
                          <img
                            src={product.image}
                            alt={product.name || product.productName}
                            className={`w-full h-full object-cover transition-transform duration-700 ${
                              hoveredProduct === (product.$id || index)
                                ? "scale-110"
                                : "scale-100"
                            }`}
                          />
                        </Link>

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

                        {/* Premium Badge */}
                        <div className="absolute bottom-4 left-4 bg-gradient-to-r from-amber-900/80 to-yellow-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-amber-700/30">
                          <div className="flex items-center space-x-1">
                            <Award className="w-3 h-3 text-amber-300" />
                            <span className="text-xs font-bold text-amber-200">
                              Premium
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-6">
                        <div className="mb-4">
                          <Link to={`/products/${product.$id || product.id}`}>
                            <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors duration-300 line-clamp-1">
                              {product.name || product.productName}
                            </h3>
                          </Link>

                          <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                            {product.description ||
                              "Premium quality African product with authentic craftsmanship."}
                          </p>
                        </div>

                        {/* Price & Rating */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold text-amber-300">
                              {product.price || "Price on request"}
                            </span>
                            {product.originalPrice && (
                              <span className="text-gray-500 line-through text-sm">
                                {product.originalPrice}
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

                        {/* Features */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          <div className="flex items-center space-x-1 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-amber-800/30">
                            <Shield className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs text-emerald-100">
                              Authentic
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-amber-800/30">
                            <Zap className="w-3 h-3 text-blue-400" />
                            <span className="text-xs text-blue-100">
                              Fast Ship
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            {/* <AddToCartButton
                              product={product}
                              className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center justify-center space-x-2"
                            /> */}
                          </div>

                          <Link
                            to={`/products/${product.$id || product.id}`}
                            className="p-3 border-2 border-amber-500/50 text-amber-400 rounded-xl hover:bg-amber-500/10 transition-all duration-300"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>

                      {/* Hover Effect Line */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-emerald-500 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All Button */}
            <div className="text-center mt-16">
              <Link
                to="/featured-products"
                className="group inline-flex items-center space-x-4 px-10 py-5 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm border border-amber-700/40 rounded-2xl hover:border-amber-500/60 transition-all duration-300"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <ShoppingBag className="w-6 h-6 text-amber-400 group-hover:text-amber-300 transition-colors duration-300 relative" />
                </div>
                <span className="text-xl font-bold text-amber-200 group-hover:text-white transition-colors duration-300">
                  Explore All Premium Products
                </span>
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <ChevronRight className="w-6 h-6 text-amber-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all duration-300 relative" />
                </div>
              </Link>

              <p className="text-gray-400 mt-6 text-sm">
                Discover {products.length}+ premium African products in our
                exclusive collection
              </p>
            </div>

            {/* Trust Badges */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 mb-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="text-xl font-bold text-amber-300 mb-2">
                  Premium Quality
                </div>
                <div className="text-amber-100/80 text-sm">
                  Authentic African Products
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="text-xl font-bold text-emerald-300 mb-2">
                  Secure Payment
                </div>
                <div className="text-emerald-100/80 text-sm">
                  100% Protected
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="text-xl font-bold text-blue-300 mb-2">
                  Fast Delivery
                </div>
                <div className="text-blue-100/80 text-sm">Across Africa</div>
              </div>

              <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 mb-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="text-xl font-bold text-red-300 mb-2">
                  5-Star Support
                </div>
                <div className="text-red-100/80 text-sm">24/7 Assistance</div>
              </div>
            </div>
          </>
        )}

        {/* No Products State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-6">
              <ShoppingBag className="w-12 h-12 text-amber-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">
              No Featured Products Available
            </h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              We're currently updating our featured collection. Check back soon
              for premium African products.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
            >
              <span>Explore All Products</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
