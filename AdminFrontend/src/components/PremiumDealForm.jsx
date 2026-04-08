// components/admin/PremiumDealForm.jsx

import React, { useState, useEffect } from "react";
import { getProducts } from "../../adminService";
import axiosClient from "../../api";
import { Award, Package, Check } from "lucide-react";

const PremiumDealForm = ({ onProductAdded }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    // Fetch products to populate the dropdown
    const fetchAllProducts = async () => {
      try {
        const allProducts = await getProducts();
        setProducts(allProducts);
      } catch (error) {
        console.error("Failed to fetch products for premium deals:", error);
      }
    };
    fetchAllProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    if (!selectedProduct) {
      setStatus("Please select a product.");
      setLoading(false);
      return;
    }

    try {
      await axiosClient.put("/api/products/premium-deal", {
        productId: selectedProduct,
        premiumDeal: true, // Setting the boolean attribute
      });
      setStatus("Product successfully marked as premium deal!");
      onProductAdded(); // Call parent function to refresh product list
      setSelectedProduct(""); // Reset form
    } catch (error) {
      console.error(
        "Failed to mark product as premium deal:",
        error.response?.data?.error
      );
      setStatus(
        `Error: ${
          error.response?.data?.error || "Failed to mark as premium deal."
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePremium = async (productId) => {
    setLoading(true);
    setStatus("");

    try {
      await axiosClient.put("/api/products/premium-deal", {
        productId: productId,
        premiumDeal: false, // Removing premium status
      });
      setStatus("Premium deal status removed successfully!");
      onProductAdded(); // Refresh product list
    } catch (error) {
      console.error(
        "Failed to remove premium deal status:",
        error.response?.data?.error
      );
      setStatus(
        `Error: ${
          error.response?.data?.error || "Failed to remove premium status."
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter premium products for display
  const premiumProducts = products.filter((product) => product.premiumDeal);

  return (
    <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#2A2A2A] dark:to-[#1A1A1A] rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
            Premium Deal Management
          </h3>
          <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
            Mark products as premium deals for exclusive benefits
          </p>
        </div>
      </div>

      {/* Add Premium Deal Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label
            htmlFor="productSelect"
            className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2"
          >
            Select Product to Mark as Premium Deal
          </label>
          <div className="relative">
            <select
              id="productSelect"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#9B59B6]/50 focus:border-transparent"
              required
            >
              <option value="">-- Choose a product --</option>
              {products
                .filter((product) => !product.premiumDeal) // Only show non-premium products
                .map((product) => (
                  <option key={product.$id} value={product.$id}>
                    {product.productName} - Ksh{" "}
                    {parseFloat(product.price).toFixed(2)}
                  </option>
                ))}
            </select>
            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8B4513] dark:text-[#D4A017]" />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Award className="w-4 h-4" />
              Mark as Premium Deal
            </div>
          )}
        </button>
      </form>

      {/* Current Premium Products */}
      {premiumProducts.length > 0 && (
        <div className="border-t border-[#E8D6B5] dark:border-[#3A3A3A] pt-6">
          <h4 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#9B59B6]" />
            Current Premium Deals ({premiumProducts.length})
          </h4>
          <div className="space-y-3">
            {premiumProducts.map((product) => (
              <div
                key={product.$id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-[#9B59B6]/10 to-[#8E44AD]/5 dark:from-[#9B59B6]/20 dark:to-[#8E44AD]/10 rounded-xl border border-[#9B59B6]/20 dark:border-[#9B59B6]/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                      {product.productName}
                    </p>
                    <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Ksh {parseFloat(product.price).toFixed(2)} • Premium Deal
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePremium(product.$id)}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                  disabled={loading}
                >
                  Remove Premium
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Message */}
      {status && (
        <div
          className={`mt-4 p-4 rounded-xl flex items-center gap-2 ${
            status.includes("Error")
              ? "bg-gradient-to-r from-[#E74C3C]/10 to-[#C0392B]/5 border border-[#E74C3C]/20 text-[#E74C3C]"
              : "bg-gradient-to-r from-[#27AE60]/10 to-[#2ECC71]/5 border border-[#27AE60]/20 text-[#27AE60]"
          }`}
        >
          <Check className="w-4 h-4" />
          <p className="text-sm font-medium">{status}</p>
        </div>
      )}
    </div>
  );
};

export default PremiumDealForm;
