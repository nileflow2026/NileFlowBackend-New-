// components/admin/DealsForm.jsx

import React, { useState, useEffect } from "react";
import { getProducts } from "../../adminService";
import axiosClient from "../../api";

const DealsForm = ({ onProductAdded }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [discount, setDiscount] = useState("");
  const [tag, setTag] = useState("Trending"); // State for the tag
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const allProducts = await getProducts();
        setProducts(allProducts);
      } catch (error) {
        console.error("Failed to fetch products for deals:", error);
      }
    };
    fetchAllProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    if (!selectedProduct || !discount || !tag) {
      setStatus("Please select a product and a discount percentage.");
      setLoading(false);
      return;
    }

    try {
      await axiosClient.post("/api/addproducts/products/deal", {
        productId: selectedProduct,
        discountPercentage: parseFloat(discount),
        tag: tag,
      });
      setStatus("Product successfully added to deals!");
      onProductAdded();
    } catch (error) {
      console.error(
        "Failed to add product to deals:",
        error.response?.data?.error
      );
      setStatus(
        `Error: ${
          error.response?.data?.error || "Failed to add product to deals."
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-section space-y-6">
      <div className="admin-header">
        <h3 className="text-2xl font-bold text-earth-900 dark:text-earth-100">
          Add Product to Deals
        </h3>
        <p className="text-earth-600 dark:text-earth-400 mt-2">
          Select a product and set discount to create a new deal
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-section">
        <div className="form-row">
          {/* Product Selection */}
          <div className="form-group">
            <label htmlFor="productSelect" className="label">
              Select Product *
            </label>
            <select
              id="productSelect"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="input"
              required
            >
              <option value="">-- Choose a product --</option>
              {products.map((product) => (
                <option key={product.$id} value={product.$id}>
                  {product.productName} - ${product.price}
                </option>
              ))}
            </select>
          </div>

          {/* Discount Percentage */}
          <div className="form-group">
            <label htmlFor="discount" className="label">
              Discount Percentage *
            </label>
            <div className="relative">
              <input
                type="number"
                id="discount"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                min="0"
                max="100"
                className="input pr-8"
                placeholder="Enter discount"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-earth-500 dark:text-earth-400 text-sm font-medium">
                %
              </span>
            </div>
          </div>
        </div>

        {/* Tag Selection */}
        <div className="form-group">
          <label htmlFor="tag" className="label">
            Deal Tag
          </label>
          <select
            id="tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="input"
            required
          >
            <option value="Trending">🔥 Trending</option>
            <option value="Hot Deal">🌟 Hot Deal</option>
            <option value="Limited Time">⏰ Limited Time</option>
            <option value="Best Seller">👑 Best Seller</option>
            <option value="Flash Sale">⚡ Flash Sale</option>
          </select>
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`p-4 rounded-xl border-l-4 ${
              status.includes("Error")
                ? "bg-accent-red/10 border-accent-red text-accent-red dark:bg-accent-red/20"
                : "bg-flora-50 border-flora-500 text-flora-700 dark:bg-flora-900/20 dark:text-flora-400"
            }`}
          >
            <p className="font-medium">{status}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading || !selectedProduct || !discount}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Adding...</span>
              </div>
            ) : (
              "Add to Deals"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DealsForm;
