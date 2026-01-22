// components/admin/DealsForm.jsx

import React, { useState, useEffect } from "react";
import { getProducts } from "../../adminService";
import axiosClient from "../../api";

const FlashSaleForm = ({ onProductAdded }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [discount, setDiscount] = useState("");
  const [saleDurationHours, setSaleDurationHours] = useState("");
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

    // ✅ Updated validation check
    if (!selectedProduct || !discount || !saleDurationHours) {
      setStatus("Please select a product, a discount, and a sale duration.");
      setLoading(false);
      return;
    }

    try {
      await axiosClient.post("/api/addproducts/products/flashsale", {
        productId: selectedProduct,
        discountPercentage: parseFloat(discount),
        saleDurationHours: parseFloat(saleDurationHours), // Convert to a number
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
    <div className="p-6 bg-white rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-semibold mb-4">Add Product to Deals</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="productSelect" className="block text-gray-700 ">
            Select Product
          </label>
          <select
            id="productSelect"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full p-2 border rounded bg-gray-900 border-gray-700 text-white"
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
        <div>
          <label
            htmlFor="discount"
            className="block text-gray-700 text-gray-300"
          >
            Discount (%)
          </label>
          <input
            type="number"
            id="discount"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            min="0"
            max="100"
            className="w-full p-2 border rounded bg-gray-900 border-gray-700 text-white"
            required
          />
          <label htmlFor="durationInput"> Sale Duration (in hours) </label>

          <input
            id="durationInput"
            type="number"
            value={saleDurationHours}
            onChange={(e) => setSaleDurationHours(e.target.value)}
            min="1"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600 transition"
          disabled={loading}
        >
          {loading ? "Processing..." : "Add to Deals"}
        </button>
      </form>
      {status && <p className="mt-4 text-center text-sm">{status}</p>}
    </div>
  );
};

export default FlashSaleForm;
