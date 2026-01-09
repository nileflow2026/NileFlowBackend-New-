import { useEffect, useState } from "react";
import { fetchProduct } from "../../CustomerServices";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import useDebounce from "../../useDebounce";
import {
  Search,
  Filter,
  X,
  Sparkles,
  Zap,
  Clock,
  TrendingUp,
  Star,
  Award,
  MapPin,
  Globe,
  Loader2,
  ShoppingBag,
  Grid,
  List,
  Shield,
} from "lucide-react";

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [popularSearches] = useState([
    "African Fashion",
    "Handmade Crafts",
    "Premium Jewelry",
    "Traditional Art",
    "Organic Products",
    "Home Decor",
  ]);
  const [recentSearches] = useState([
    "Kente Cloth",
    "Maasai Beads",
    "Wood Carvings",
    "Shea Butter",
  ]);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const fetchProducts = async () => {
      if (debouncedSearchTerm) {
        setLoading(true);
        const fetchedProducts = await fetchProduct(
          { search: debouncedSearchTerm },
          setLoading
        );
        setProducts(fetchedProducts);
        setHasSearched(true);
      }
    };
    fetchProducts();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      const fetchedProducts = await fetchProduct(
        { category: "all", search: "" },
        setLoading
      );
      setProducts(fetchedProducts);
      setLoading(false);
    };
    fetchAllProducts();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setHasSearched(true);
    const fetchedProducts = await fetchProduct(
      { search: searchTerm },
      setLoading
    );
    setProducts(fetchedProducts);
  };

  const handleQuickSearch = async (term) => {
    setSearchTerm(term);
    setLoading(true);
    setHasSearched(true);
    const fetchedProducts = await fetchProduct({ search: term }, setLoading);
    setProducts(fetchedProducts);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSelectedFilters([]);
    const fetchAllProducts = async () => {
      setLoading(true);
      const fetchedProducts = await fetchProduct(
        { category: "all", search: "" },
        setLoading
      );
      setProducts(fetchedProducts);
      setLoading(false);
    };
    fetchAllProducts();
  };

  const toggleFilter = (filter) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const filteredProducts = products.filter((product) => {
    if (selectedFilters.length === 0) return true;

    // In a real app, you would check product categories/attributes
    // This is a simplified version
    return selectedFilters.some(
      (filter) =>
        product.productName?.toLowerCase().includes(filter.toLowerCase()) ||
        product.category?.toLowerCase().includes(filter.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <Search className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium Search
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Discover Treasures
            </span>
            <br />
            <span className="text-white">Premium African Products</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Search our curated collection of authentic African products. Find
            exactly what you're looking for.
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl blur opacity-30"></div>
              <form onSubmit={handleSearch} className="relative">
                <div className="flex bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-2xl overflow-hidden">
                  <div className="pl-5 pr-3 flex items-center">
                    <Search className="w-6 h-6 text-amber-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search premium African products, crafts, fashion, art..."
                    className="flex-1 px-4 py-4 bg-transparent text-amber-100 placeholder-amber-100/50 focus:outline-none text-lg"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="px-4 flex items-center text-amber-400 hover:text-amber-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-8 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center space-x-2"
                  >
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Search Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-300">
                {products.length}
              </div>
              <div className="text-amber-100/80 text-sm">Premium Products</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-300">50+</div>
              <div className="text-emerald-100/80 text-sm">Categories</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-300">100%</div>
              <div className="text-blue-100/80 text-sm">Authentic</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-300">Instant</div>
              <div className="text-red-100/80 text-sm">Search Results</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Quick Searches */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center space-x-2 text-amber-200">
                <Zap className="w-4 h-4" />
                <span className="font-medium">Popular:</span>
              </div>
              {popularSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleQuickSearch(term)}
                  className="px-4 py-2 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl text-amber-100 hover:border-amber-500/50 hover:text-amber-300 transition-all duration-300"
                >
                  {term}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2 text-amber-200">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Recent:</span>
              </div>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleQuickSearch(term)}
                  className="px-4 py-2 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl text-amber-100 hover:border-amber-500/50 hover:text-amber-300 transition-all duration-300"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Filters & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center space-x-4">
              <div className="text-amber-200">
                {hasSearched ? (
                  <>
                    <span className="text-amber-300 font-bold">
                      {filteredProducts.length}
                    </span>{" "}
                    results for "
                    <span className="text-amber-300 font-bold">
                      {searchTerm}
                    </span>
                    "
                  </>
                ) : (
                  <>
                    <span className="text-amber-300 font-bold">
                      {filteredProducts.length}
                    </span>{" "}
                    premium products
                  </>
                )}
              </div>

              {selectedFilters.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-amber-100/70 text-sm">Filters:</span>
                  {selectedFilters.map((filter) => (
                    <div
                      key={filter}
                      className="flex items-center space-x-1 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 backdrop-blur-sm px-3 py-1 rounded-full border border-amber-700/30"
                    >
                      <span className="text-xs text-amber-200">{filter}</span>
                      <button
                        onClick={() => toggleFilter(filter)}
                        className="text-amber-400 hover:text-amber-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 text-amber-200 rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
                <TrendingUp className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400 pointer-events-none" />
              </div>

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

              <button className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm border border-amber-700/40 rounded-xl hover:border-amber-500/60 transition-all duration-300">
                <Filter className="w-5 h-5 text-amber-400" />
                <span className="text-amber-200 font-medium">Filters</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>
              </div>
              <h3 className="mt-8 text-2xl font-bold text-amber-200">
                {searchTerm
                  ? `Searching for "${searchTerm}"`
                  : "Discovering Premium Products"}
              </h3>
              <p className="text-gray-400 mt-2">
                Curating authentic African treasures for you...
              </p>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              {hasSearched && filteredProducts.length === 0 ? (
                <div className="text-center py-32">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-6">
                    <Search className="w-12 h-12 text-amber-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    No Products Found
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-8">
                    We couldn't find any products matching "{searchTerm}". Try a
                    different search term or browse our categories.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={clearSearch}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
                    >
                      <X className="w-5 h-5" />
                      <span>Clear Search</span>
                    </button>
                    <button
                      onClick={() => handleQuickSearch("African Crafts")}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl text-amber-300 hover:border-amber-500/50 transition-all duration-300"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>Browse All Products</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`${
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "flex flex-col"
                  } gap-6`}
                >
                  {filteredProducts.map((product) => (
                    <div
                      key={product.$id}
                      className="transform transition-all duration-500 hover:-translate-y-2"
                    >
                      <ProductCard
                        product={product}
                        id={product.$id}
                        premium={true}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Search Suggestions */}
              {hasSearched && filteredProducts.length > 0 && (
                <div className="mt-16">
                  <h3 className="text-xl font-bold text-amber-200 mb-6">
                    Related Searches
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      "Traditional",
                      "Handmade",
                      "Organic",
                      "Artisan",
                      "Cultural",
                      "Authentic",
                    ].map((term) => (
                      <button
                        key={term}
                        onClick={() =>
                          handleQuickSearch(`${searchTerm} ${term}`)
                        }
                        className="px-5 py-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl text-amber-100 hover:border-amber-500/50 hover:text-amber-300 transition-all duration-300"
                      >
                        {searchTerm} {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
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
                    Secure Search
                  </div>
                  <div className="text-emerald-100/80 text-sm">
                    Protected Privacy
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-4">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xl font-bold text-blue-300 mb-2">
                    African Coverage
                  </div>
                  <div className="text-blue-100/80 text-sm">
                    Products from 54 Nations
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 mb-4">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xl font-bold text-red-300 mb-2">
                    5-Star Support
                  </div>
                  <div className="text-red-100/80 text-sm">
                    24/7 Customer Service
                  </div>
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

export default SearchPage;
