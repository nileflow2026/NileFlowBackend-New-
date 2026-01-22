/* eslint-disable no-unused-vars */
import { useEffect, useState, useMemo, useCallback } from "react";
import ProductForm from "../components/ProductForm";
import { getProducts } from "../../adminService";
import FeaturedForm from "../components/FeaturedForm";
import DealsForm from "../components/DealsForm";
import PremiumDealForm from "../components/PremiumDealForm";
import axiosClient from "../../api";
import FlashSaleForm from "../components/FlashsaleForm";
import {
  Search,
  Filter,
  Plus,
  Package,
  Tag,
  Star,
  Flame,
  Grid,
  List,
  Download,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  TrendingUp,
  DollarSign,
  BarChart,
  Layers,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image,
  ShoppingBag,
  Award,
  Clock,
  ArrowUpDown,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

export default function Products() {
  // State Management
  const [productsList, setProductsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeForm, setActiveForm] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortOption, setSortOption] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  /* const [productToEdit, setProductToEdit] = useState(null); */
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [showSubModal, setShowSubModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  // Change your state to store only the product ID
  const [editingProductId, setEditingProductId] = useState(null);
  const itemsPerPage = 12;

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosClient.get(
          "/api/customerprofile/categories"
        );
        setCategories(response.data);
        console.log("Raw categories data:", response.data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  // Add this useEffect to debug product data
  useEffect(() => {
    if (productsList.length > 0) {
      console.log("=== FRONTEND PRODUCTS DEBUG ===");
      productsList.forEach((product, index) => {
        console.log(`Product ${index + 1}:`, {
          name: product.productName,
          id: product.$id,
          categories: product.category,
          categoryCount: product.category?.length || 0,
        });
      });
    }
  }, [productsList]);

  // Also add this to your fetchProductsData function:
  const fetchProductsData = async () => {
    setLoading(true);
    try {
      const data = await getProducts("", "");
      console.log("Fetched products data:", data);
      setProductsList(data || []);
      setError(null);
      toast.success(`${data?.length || 0} products loaded`);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setError(error.message);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products
  useEffect(() => {
    const fetchProductsData = async () => {
      setLoading(true);
      try {
        const data = await getProducts("", "");
        setProductsList(data || []);
        setError(null);
        toast.success(`${data?.length || 0} products loaded`);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setError(error.message);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProductsData();
  }, [refreshTrigger]);

  /*   // Calculate statistics
  const productStats = useMemo(() => {
    const totalProducts = productsList.length;
    const totalValue = productsList.reduce(
      (sum, p) => sum + (parseFloat(p.price) || 0) * (parseInt(p.stock) || 0),
      0
    );
    const lowStockProducts = productsList.filter(
      (p) => parseInt(p.stock) <= 10
    ).length;
    const outOfStockProducts = productsList.filter(
      (p) => parseInt(p.stock) <= 0
    ).length;

    // Update categoryCounts in productStats:
    const categoryCounts = productsList.reduce((acc, product) => {
      // Handle multiple categories
      if (product.category && product.category.length > 0) {
        product.category.forEach((cat) => {
          const categoryName = cat.name || "Uncategorized";
          acc[categoryName] = (acc[categoryName] || 0) + 1;
        });
      } else {
        const categoryName = "Uncategorized";
        acc[categoryName] = (acc[categoryName] || 0) + 1;
      }
      return acc;
    }, {});

    const topCategory = Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      totalProducts,
      totalValue,
      lowStockProducts,
      outOfStockProducts,
      avgPrice:
        totalProducts > 0
          ? productsList.reduce(
              (sum, p) => sum + (parseFloat(p.price) || 0),
              0
            ) / totalProducts
          : 0,
      topCategory: topCategory
        ? `${topCategory[0]} (${topCategory[1]})`
        : "N/A",
    };
  }, [productsList]); */
  // Calculate statistics
  const productStats = useMemo(() => {
    const totalProducts = productsList.length;
    const totalValue = productsList.reduce(
      (sum, p) => sum + (parseFloat(p.price) || 0) * (parseInt(p.stock) || 0),
      0
    );
    const lowStockProducts = productsList.filter(
      (p) => parseInt(p.stock) <= 10
    ).length;
    const outOfStockProducts = productsList.filter(
      (p) => parseInt(p.stock) <= 0
    ).length;

    // FIXED: Update categoryCounts in productStats:
    const categoryCounts = productsList.reduce((acc, product) => {
      // Handle multiple categories SAFELY
      if (product.category) {
        // Ensure we're working with an array
        let categoriesArray = [];

        if (Array.isArray(product.category)) {
          // It's already an array
          categoriesArray = product.category;
        } else if (
          typeof product.category === "object" &&
          product.category.$id
        ) {
          // It's a single category object
          categoriesArray = [product.category];
        } else if (typeof product.category === "string") {
          // It's a category ID string - find the category object
          const categoryObj = categories.find(
            (cat) => cat.id === product.category
          );
          if (categoryObj) {
            categoriesArray = [categoryObj];
          }
        }

        // Now safely iterate over the array
        categoriesArray.forEach((cat) => {
          const categoryName = cat.name || "Uncategorized";
          acc[categoryName] = (acc[categoryName] || 0) + 1;
        });
      } else {
        const categoryName = "Uncategorized";
        acc[categoryName] = (acc[categoryName] || 0) + 1;
      }
      return acc;
    }, {});

    const topCategory = Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      totalProducts,
      totalValue,
      lowStockProducts,
      outOfStockProducts,
      avgPrice:
        totalProducts > 0
          ? productsList.reduce(
              (sum, p) => sum + (parseFloat(p.price) || 0),
              0
            ) / totalProducts
          : 0,
      topCategory: topCategory
        ? `${topCategory[0]} (${topCategory[1]})`
        : "N/A",
    };
  }, [productsList, categories]); // Added categories dependency

  // Get unique brands
  const uniqueBrands = useMemo(
    () => [...new Set(productsList.map((p) => p.brand).filter(Boolean))],
    [productsList]
  );

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = productsList.filter((product) => {
      // Category match
      const categoryMatch = selectedCategory
        ? product.category?.some((cat) => cat.id === selectedCategory)
        : true;

      // Brand match
      const brandMatch = selectedBrand ? product.brand === selectedBrand : true;

      // Status match
      const statusMatch =
        selectedStatus === "all" ||
        (selectedStatus === "inStock"
          ? parseInt(product.stock) > 10
          : selectedStatus === "lowStock"
          ? parseInt(product.stock) <= 10 && parseInt(product.stock) > 0
          : selectedStatus === "outOfStock"
          ? parseInt(product.stock) <= 0
          : true);

      // Search term match
      const searchTermMatch =
        product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase());

      return categoryMatch && brandMatch && statusMatch && searchTermMatch;
    });

    // Sort products
    switch (sortOption) {
      case "priceLow":
        filtered.sort(
          (a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
        );
        break;
      case "priceHigh":
        filtered.sort(
          (a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
        );
        break;
      case "newest":
        filtered.sort(
          (a, b) => new Date(b.$createdAt) - new Date(a.$createdAt)
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) => new Date(a.$createdAt) - new Date(b.$createdAt)
        );
        break;
      case "stockHigh":
        filtered.sort(
          (a, b) => (parseInt(b.stock) || 0) - (parseInt(a.stock) || 0)
        );
        break;
      case "stockLow":
        filtered.sort(
          (a, b) => (parseInt(a.stock) || 0) - (parseInt(b.stock) || 0)
        );
        break;
      default:
        break;
    }

    return filtered;
  }, [
    productsList,
    searchTerm,
    selectedCategory,
    selectedBrand,
    selectedStatus,
    sortOption,
  ]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [filteredAndSortedProducts, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

  // Event Handlers
  const handleToggleForm = useCallback(
    (formType) => {
      setActiveForm(activeForm === formType ? null : formType);
    },
    [activeForm]
  );

  const handleProductAdded = useCallback(() => {
    setRefreshTrigger((prev) => !prev);
    setActiveForm(null);
    toast.success("Product added successfully");
  }, []);

  const handleAddProductToCategory = useCallback((product) => {
    setEditingProductId(product.$id);
    setShowCategoryModal(true);
  }, []);

  const productToEdit = useMemo(() => {
    return productsList.find((p) => p.$id === editingProductId);
  }, [editingProductId, productsList]);

  // In your Products component, update the handleUpdateCategory function
  // Add this debug in your handleUpdateCategory function
  const handleUpdateCategory = useCallback(async () => {
    if (!newCategoryId) {
      toast.warning("Please select a category");
      return;
    }

    // Debug: Verify productToEdit
    console.log("=== FRONTEND DEBUG ===");
    console.log("1. productToEdit:", {
      id: productToEdit?.$id,
      name: productToEdit?.productName,
      currentCategories: productToEdit?.category,
    });
    console.log("2. newCategoryId:", newCategoryId);
    console.log(
      "3. Selected category name:",
      categories.find((c) => c.id === newCategoryId)?.name
    );

    try {
      const response = await axiosClient.put("/api/products/updateproducts", {
        productId: productToEdit.$id, // Make sure this is correct!
        categoryId: newCategoryId,
      });

      console.log("4. Update response:", response.data);

      toast.success(response.data.message || "Category added successfully!");
      setShowCategoryModal(false);
      setNewCategoryId("");
      setRefreshTrigger((prev) => !prev);
    } catch (error) {
      console.error("5. Update error:", {
        message: error.response?.data?.error,
        productId: productToEdit?.$id,
        categoryId: newCategoryId,
      });
      toast.error(error.response?.data?.error || "Failed to update category");
    }
  }, [newCategoryId, productToEdit, categories]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-[#E8D6B5]/30 dark:bg-[#3A3A3A] rounded-xl"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-2xl"
                ></div>
              ))}
            </div>
            <div className="h-16 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-2xl"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#E74C3C] to-[#C0392B] flex items-center justify-center">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
            Failed to Load Products
          </h3>
          <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-6">
            {error || "An error occurred while loading products"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-lg transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
                Product Management
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                Manage your marketplace products, inventory, and promotions
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => handleToggleForm("product")}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ${
                  activeForm === "product"
                    ? "bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white"
                    : "bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white"
                }`}
              >
                <Plus className="w-4 h-4" />
                {activeForm === "product" ? "Cancel" : "Add Product"}
              </button>

              <button
                onClick={() => setShowSubModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Subcategory
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {productStats.totalProducts}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#27AE60] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />+
              {Math.floor(productStats.totalProducts * 0.12)} this month
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Inventory Value
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  Ksh {productStats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#27AE60] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +15.3% from last month
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Low Stock
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {productStats.lowStockProducts}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#F39C12] to-[#D68910] flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#E74C3C] flex items-center gap-1">
              <TrendingUp className="w-3 h-3 rotate-180" />
              Needs attention
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Top Category
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] truncate">
                  {productStats.topCategory.split(" (")[0]}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                <BarChart className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#8B4513] dark:text-[#D4A017] flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {productStats.topCategory.split(" (")[1]}
            </div>
          </div>
        </div>

        {/* Promotion Action Buttons */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                Promotions & Specials
              </h3>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                Boost sales with featured products and special offers
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleToggleForm("featured")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  activeForm === "featured"
                    ? "bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white"
                    : "bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white"
                } hover:shadow-lg`}
              >
                <Star className="w-4 h-4" />
                {activeForm === "featured" ? "Cancel" : "Featured"}
              </button>
              <button
                onClick={() => handleToggleForm("deals")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  activeForm === "deals"
                    ? "bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white"
                    : "bg-gradient-to-r from-[#F39C12] to-[#D68910] text-white"
                } hover:shadow-lg`}
              >
                <Tag className="w-4 h-4" />
                {activeForm === "deals" ? "Cancel" : "Deals"}
              </button>
              <button
                onClick={() => handleToggleForm("premiumdeal")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  activeForm === "premiumdeal"
                    ? "bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white"
                    : "bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white"
                } hover:shadow-lg`}
              >
                <Award className="w-4 h-4" />
                {activeForm === "premiumdeal" ? "Cancel" : "Premium Deal"}
              </button>
              <button
                onClick={() => handleToggleForm("flashsale")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  activeForm === "flashsale"
                    ? "bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white"
                    : "bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white"
                } hover:shadow-lg`}
              >
                <Flame className="w-4 h-4" />
                {activeForm === "flashsale" ? "Cancel" : "Flash Sale"}
              </button>
            </div>
          </div>

          {/* Forms */}
          {activeForm === "product" && (
            <div className="mb-6">
              <ProductForm
                key={refreshTrigger}
                onProductAdded={handleProductAdded}
              />
            </div>
          )}
          {activeForm === "featured" && (
            <div className="mb-6">
              <FeaturedForm onProductAdded={handleProductAdded} />
            </div>
          )}
          {activeForm === "deals" && (
            <div className="mb-6">
              <DealsForm onProductAdded={handleProductAdded} />
            </div>
          )}
          {activeForm === "premiumdeal" && (
            <div className="mb-6">
              <PremiumDealForm onProductAdded={handleProductAdded} />
            </div>
          )}
          {activeForm === "flashsale" && (
            <div className="mb-6">
              <FlashSaleForm onProductAdded={handleProductAdded} />
            </div>
          )}
        </div>

        {/* Filters & Search */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 mb-6 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search products by name, brand, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              />
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-xl border transition-colors ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white border-transparent"
                    : "border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-xl border transition-colors ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white border-transparent"
                    : "border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A17] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="">All Brands</option>
              {uniqueBrands.map((brand, idx) => (
                <option key={idx} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="inStock">In Stock (10+)</option>
              <option value="lowStock">Low Stock (1-10)</option>
              <option value="outOfStock">Out of Stock</option>
            </select>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="">Sort By</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="stockHigh">Stock: High to Low</option>
              <option value="stockLow">Stock: Low to High</option>
            </select>
          </div>
        </div>

        {/* Products Display */}
        {viewMode === "grid" ? (
          // Grid View
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => (
                <div
                  key={product.$id}
                  className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gradient-to-br from-[#E8D6B5]/20 to-[#F5E6D3]/10 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A]">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-12 h-12 text-[#E8D6B5] dark:text-[#3A3A3A]" />
                      </div>
                    )}
                    {/* Stock Badge */}
                    <div
                      className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${
                        parseInt(product.stock) > 10
                          ? "bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white"
                          : parseInt(product.stock) > 0
                          ? "bg-gradient-to-r from-[#F39C12] to-[#D68910] text-white"
                          : "bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white"
                      }`}
                    >
                      {parseInt(product.stock) > 10
                        ? "In Stock"
                        : parseInt(product.stock) > 0
                        ? "Low Stock"
                        : "Out of Stock"}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3] line-clamp-1">
                          {product.productName}
                        </h3>
                        <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                          {product.brand}
                        </p>
                      </div>
                      <div className="text-lg font-bold text-[#D4A017]">
                        Ksh {parseFloat(product.price).toFixed(2)}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {product.categories && product.categories.length > 0 ? (
                          product.categories.map((cat) => (
                            <span
                              key={cat.$id}
                              className="inline-block px-2 py-1 bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A] dark:to-[#2A2A2A] text-xs text-[#8B4513] dark:text-[#D4A017] rounded-full"
                            >
                              {cat.name}
                            </span>
                          ))
                        ) : (
                          <span className="inline-block px-2 py-1 bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A] dark:to-[#2A2A2A] text-xs text-[#8B4513] dark:text-[#D4A017] rounded-full">
                            Uncategorized
                          </span>
                        )}
                      </div>
                    </div>
                    {/*  <div className="mb-3">
                      <span className="inline-block px-2 py-1 bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A] dark:to-[#2A2A2A] text-xs text-[#8B4513] dark:text-[#D4A017] rounded-full">
                        {product.category?.[0]?.name || "Uncategorized"}
                      </span>
                    </div> */}

                    {/* Stock & Actions */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                        <span className="font-medium">Stock:</span>{" "}
                        {product.stock || 0}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddProductToCategory(product)}
                          className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                          title="Edit Category"
                        >
                          <Tag className="w-4 h-4 text-[#3498DB]" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // List View
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden shadow-xl mb-8">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-gradient-to-r from-[#E8D6B5]/10 to-[#F5E6D3]/5 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A]/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                      Brand
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D6B5]/30 dark:divide-[#3A3A3A]">
                  {paginatedProducts.map((product) => (
                    <tr
                      key={product.$id}
                      className="hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E8D6B5]/20 to-[#F5E6D3]/10 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A] flex items-center justify-center">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.productName}
                                className="w-12 h-12 rounded-xl object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-[#8B4513] dark:text-[#D4A017]" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                              {product.productName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {product.description?.substring(0, 60)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {product.category && product.category.length > 0 ? (
                            product.category.map((cat) => (
                              <span
                                key={cat.$id}
                                className="inline-block px-2 py-1 bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A] dark:to-[#2A2A2A] text-xs text-[#8B4513] dark:text-[#D4A017] rounded-full"
                              >
                                {cat.name}
                              </span>
                            ))
                          ) : (
                            <span className="inline-block px-2 py-1 bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A] dark:to-[#2A2A2A] text-xs text-[#8B4513] dark:text-[#D4A017] rounded-full">
                              Uncategorized
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                          {product.brand || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-[#D4A017]">
                            Ksh {parseFloat(product.price).toFixed(2)}
                          </div>
                          {product.originalPrice && (
                            <div className="text-sm text-gray-500 line-through">
                              Ksh {parseFloat(product.originalPrice).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              parseInt(product.stock) > 10
                                ? "bg-[#27AE60] animate-pulse"
                                : parseInt(product.stock) > 0
                                ? "bg-[#F39C12]"
                                : "bg-[#E74C3C]"
                            }`}
                          ></div>
                          <span
                            className={`text-sm font-semibold ${
                              parseInt(product.stock) > 10
                                ? "text-[#27AE60]"
                                : parseInt(product.stock) > 0
                                ? "text-[#F39C12]"
                                : "text-[#E74C3C]"
                            }`}
                          >
                            {product.stock || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddProductToCategory(product)}
                            className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                            title="Edit Category"
                          >
                            <Tag className="w-4 h-4 text-[#3498DB]" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors">
                            <Eye className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017]" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors">
                            <Edit className="w-4 h-4 text-[#D4A017]" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
              Showing{" "}
              <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredAndSortedProducts.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                {filteredAndSortedProducts.length}
              </span>{" "}
              products
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-sm"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        currentPage === pageNumber
                          ? "bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white"
                          : "text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"
                      } transition-colors text-sm`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-9 h-9 rounded-lg text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors text-sm"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && productToEdit && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                Add "{productToEdit.productName}" to Category
              </h3>
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                  Select a Category
                </label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCategory}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subcategory Modal */}
        {showSubModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                Add New Subcategory
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                    Select Parent Category
                  </label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                    Subcategory Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter subcategory name"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSubModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newCategoryId || !newSubName) {
                      toast.warning("Please fill all fields");
                      return;
                    }
                    try {
                      await axiosClient.post(
                        `/api/products/${newCategoryId}/subcategories`,
                        { name: newSubName }
                      );
                      setShowSubModal(false);
                      setNewSubName("");
                      setRefreshTrigger((prev) => !prev);
                      toast.success("Subcategory created successfully!");
                    } catch (error) {
                      console.error("Error creating subcategory:", error);
                      toast.error("Failed to create subcategory");
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Create Subcategory
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Footer */}
        <div className="mt-8 p-6 rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-gradient-to-r from-[#E8D6B5]/10 to-[#D4A017]/5 dark:from-[#3A3A3A]/30 dark:to-[#2A2A2A]/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                Need help managing your products?
              </p>
              <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                Contact support or check our documentation
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-lg transition-all duration-200">
              <ShoppingBag className="w-4 h-4" />
              View Product Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
