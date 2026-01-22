// components/admin/FeaturedForm.jsx

import React, { useState, useEffect } from "react";
import { getProducts } from "../../adminService";
import axiosClient from "../../api";

const FeaturedForm = ({ onProductAdded }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [tag, setTag] = useState("Trending"); // State for the tag
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    // Fetch products to populate the dropdown
    const fetchAllProducts = async () => {
      try {
        const allProducts = await getProducts();
        setProducts(allProducts);
      } catch (error) {
        console.error("Failed to fetch products for featured list:", error);
      }
    };
    fetchAllProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    if (!selectedProduct || !tag) {
      // Validate that a tag is provided
      setStatus("Please select a product and provide a tag.");
      setLoading(false);
      return;
    }

    try {
      await axiosClient.post("/api/products/products/feature", {
        productId: selectedProduct,
        tag: tag, // Pass the tag to the backend
      });
      setStatus("Product successfully marked as featured!");
      onProductAdded(); // Call parent function to refresh product list
    } catch (error) {
      console.error("Failed to feature product:", error.response?.data?.error);
      setStatus(
        `Error: ${error.response?.data?.error || "Failed to feature product."}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-semibold mb-4">Add Featured Product</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="tagInput"
            className="block text-gray-700 dark:text-gray-300"
          >
            Tags (e.g., Trending, New)
          </label>
          <input
            id="tagInput"
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            required
          />
          <label
            htmlFor="productSelect"
            className="block text-gray-700 dark:text-gray-300"
          >
            Select Product
          </label>
          <select
            id="productSelect"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            required
          >
            <option value="">-- Choose a product --</option>
            {products.map((product) => (
              <option key={product.$id} value={product.$id}>
                {product.productName}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
          disabled={loading}
        >
          {loading ? "Processing..." : "Feature Product"}
        </button>
      </form>
      {status && <p className="mt-4 text-center text-sm">{status}</p>}
    </div>
  );
};

export default FeaturedForm;
