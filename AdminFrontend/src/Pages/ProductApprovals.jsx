/* eslint-disable no-unused-vars */
// components/admin/ProductApprovals.jsx
import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Download,
} from "lucide-react";
import { adminProductService } from "../services/adminProductService";

const ProductApprovals = () => {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [approvedProducts, setApprovedProducts] = useState([]);
  const [rejectedProducts, setRejectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [currentTab, setCurrentTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState(new Set()); // For bulk actions
  const [bulkAction, setBulkAction] = useState("");

  // Fetch products using service
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all statuses in parallel
      const [pendingRes, approvedRes, rejectedRes] = await Promise.allSettled([
        adminProductService.getPendingProducts(),
        adminProductService.getApprovedProducts(),
        adminProductService.getRejectedProducts(),
      ]);

      if (pendingRes.status === "fulfilled" && pendingRes.value.success) {
        setPendingProducts(pendingRes.value.data.products || []);
      } else {
        console.error("Failed to fetch pending products:", pendingRes.reason);
      }

      if (approvedRes.status === "fulfilled" && approvedRes.value.success) {
        setApprovedProducts(approvedRes.value.data.products || []);
      } else {
        console.error("Failed to fetch approved products:", approvedRes.reason);
      }

      if (rejectedRes.status === "fulfilled" && rejectedRes.value.success) {
        setRejectedProducts(rejectedRes.value.data.products || []);
      } else {
        console.error("Failed to fetch rejected products:", rejectedRes.reason);
      }
    } catch (err) {
      setError(err.message || "Failed to load products");
      console.error("Fetch products error:", err);
    } finally {
      setLoading(false);
      setSelectedProducts(new Set()); // Clear selections
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle approve product
  const handleApprove = async (productId) => {
    try {
      const result = await adminProductService.approveProduct(productId);

      if (result.success) {
        // Update state
        const product = pendingProducts.find((p) => p.$id === productId);
        setPendingProducts((prev) => prev.filter((p) => p.$id !== productId));
        setApprovedProducts((prev) => [product, ...prev]);

        // Close modals
        setShowDetailsModal(false);
        setSelectedProduct(null);

        alert("Product approved successfully!");
      } else {
        alert(result.error || "Failed to approve product");
      }
    } catch (err) {
      alert(err.message || "Failed to approve product");
      console.error(err);
    }
  };

  // Handle reject product
  const handleReject = async (productId) => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      const result = await adminProductService.rejectProduct(
        productId,
        rejectReason
      );

      if (result.success) {
        // Update state
        const product = pendingProducts.find((p) => p.$id === productId);
        setPendingProducts((prev) => prev.filter((p) => p.$id !== productId));
        setRejectedProducts((prev) => [product, ...prev]);

        // Reset and close modals
        setRejectReason("");
        setShowRejectModal(false);
        setShowDetailsModal(false);
        setSelectedProduct(null);

        alert("Product rejected successfully");
      } else {
        alert(result.error || "Failed to reject product");
      }
    } catch (err) {
      alert(err.message || "Failed to reject product");
      console.error(err);
    }
  };

  // Handle bulk approve
  const handleBulkApprove = async () => {
    if (selectedProducts.size === 0) {
      alert("Please select at least one product");
      return;
    }

    if (!confirm(`Approve ${selectedProducts.size} selected product(s)?`)) {
      return;
    }

    try {
      const productIds = Array.from(selectedProducts);
      const result = await adminProductService.bulkApproveProducts(productIds);

      if (result.success) {
        // Update state
        const approvedProducts = pendingProducts.filter((p) =>
          selectedProducts.has(p.$id)
        );
        setPendingProducts((prev) =>
          prev.filter((p) => !selectedProducts.has(p.$id))
        );
        setApprovedProducts((prev) => [...approvedProducts, ...prev]);
        setSelectedProducts(new Set());

        alert(`Successfully approved ${approvedProducts.length} product(s)`);
      } else {
        alert(result.error || "Failed to bulk approve products");
      }
    } catch (err) {
      alert(err.message || "Failed to bulk approve products");
      console.error(err);
    }
  };

  // Handle bulk reject
  const handleBulkReject = async () => {
    if (selectedProducts.size === 0) {
      alert("Please select at least one product");
      return;
    }

    const reason = prompt("Enter reason for rejection:");
    if (!reason || !reason.trim()) {
      alert("Rejection reason is required");
      return;
    }

    if (!confirm(`Reject ${selectedProducts.size} selected product(s)?`)) {
      return;
    }

    try {
      const productIds = Array.from(selectedProducts);
      const result = await adminProductService.bulkRejectProducts(
        productIds,
        reason
      );

      if (result.success) {
        // Update state
        const rejectedProducts = pendingProducts.filter((p) =>
          selectedProducts.has(p.$id)
        );
        setPendingProducts((prev) =>
          prev.filter((p) => !selectedProducts.has(p.$id))
        );
        setRejectedProducts((prev) => [...rejectedProducts, ...prev]);
        setSelectedProducts(new Set());

        alert(`Successfully rejected ${rejectedProducts.length} product(s)`);
      } else {
        alert(result.error || "Failed to bulk reject products");
      }
    } catch (err) {
      alert(err.message || "Failed to bulk reject products");
      console.error(err);
    }
  };

  // Toggle product selection
  const toggleProductSelection = (productId) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  // Select all products
  const selectAllProducts = () => {
    const allIds = getCurrentProducts().map((p) => p.$id);
    setSelectedProducts(new Set(allIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedProducts(new Set());
  };

  // Get current products based on tab
  const getCurrentProducts = () => {
    switch (currentTab) {
      case "pending":
        return pendingProducts;
      case "approved":
        return approvedProducts;
      case "rejected":
        return rejectedProducts;
      default:
        return pendingProducts;
    }
  };

  // Filter products
  const filteredProducts = getCurrentProducts().filter((product) => {
    const matchesSearch =
      product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.vendor?.storeName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Format price
  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Product Approvals
        </h1>
        <p className="text-gray-600">
          Review and approve products submitted by vendors
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Pending Review
              </p>
              <p className="text-3xl font-bold text-yellow-600">
                {pendingProducts.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Filter className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Approved</p>
              <p className="text-3xl font-bold text-green-600">
                {approvedProducts.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Rejected</p>
              <p className="text-3xl font-bold text-red-600">
                {rejectedProducts.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Selected</p>
              <p className="text-3xl font-bold text-blue-600">
                {selectedProducts.size}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.size > 0 && currentTab === "pending" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-blue-800">
                {selectedProducts.size} product(s) selected
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Selected</span>
              </button>
              <button
                onClick={handleBulkReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Selected</span>
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => {
              setCurrentTab("pending");
              clearSelection();
            }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              currentTab === "pending"
                ? "border-yellow-500 text-yellow-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending ({pendingProducts.length})
          </button>
          <button
            onClick={() => {
              setCurrentTab("approved");
              clearSelection();
            }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              currentTab === "approved"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Approved ({approvedProducts.length})
          </button>
          <button
            onClick={() => {
              setCurrentTab("rejected");
              clearSelection();
            }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              currentTab === "rejected"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Rejected ({rejectedProducts.length})
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products or vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="fashion">Fashion</option>
            <option value="home">Home & Living</option>
            <option value="beauty">Beauty</option>
          </select>

          <button
            onClick={fetchProducts}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh List</span>
          </button>

          {currentTab === "pending" && (
            <button
              onClick={selectAllProducts}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Select All
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No products found</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {currentTab === "pending" && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={
                          selectedProducts.size === filteredProducts.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllProducts();
                          } else {
                            clearSelection();
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Price & Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.$id} className="hover:bg-gray-50">
                    {currentTab === "pending" && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.$id)}
                          onChange={() => toggleProductSelection(product.$id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg overflow-hidden mr-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.productName}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">
                                No Image
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {product.productName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.category}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Vendor Column - FIXED */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {product.vendorName ||
                            product.vendor?.storeName ||
                            product.vendor?.name ||
                            "Unknown Vendor"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.vendorId
                            ? `ID: ${product.vendorId.substring(0, 8)}...`
                            : "No ID"}
                        </div>
                      </div>
                    </td>

                    {/* Price & Stock Column - FIXED */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-bold text-gray-900">
                          ${parseFloat(product.price || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Stock: {product.stock || product.inventory || 0}
                        </div>
                      </div>
                    </td>

                    {/* Submitted Column - FIXED */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.submittedAt
                        ? formatDate(product.submittedAt)
                        : product.createdAt
                        ? formatDate(product.createdAt)
                        : product.$createdAt
                        ? formatDate(product.$createdAt)
                        : "N/A"}
                    </td>

                    {/* Status Column - FIXED */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                          product.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : product.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : product.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : product.isApproved
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.status
                          ? product.status.toUpperCase()
                          : product.isApproved
                          ? "APPROVED"
                          : "PENDING"}
                      </span>
                    </td>

                    {/* Actions Column - FIXED */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDetailsModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 flex items-center space-x-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">View</span>
                        </button>

                        {currentTab === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(product.$id)}
                              className="px-3 py-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 flex items-center space-x-1"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">Approve</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowRejectModal(true);
                              }}
                              className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center space-x-1"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm">Reject</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    {/* ... rest of table cells (same as before) */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Product Details
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedProduct(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Product Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Images */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-4">
                    Product Images
                  </h4>
                  <div className="space-y-4">
                    {selectedProduct.image && (
                      <div className="rounded-lg overflow-hidden">
                        <img
                          src={selectedProduct.image}
                          alt="Main product"
                          className="w-full h-64 object-cover"
                          crossOrigin="anonymous"
                        />
                      </div>
                    )}

                    {selectedProduct.images &&
                      selectedProduct.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {selectedProduct.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Product ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                              crossOrigin="anonymous"
                            />
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                {/* Details */}
                <div>
                  <div className="mb-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedProduct.productName}
                    </h4>
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                        {selectedProduct.category}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          selectedProduct.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : selectedProduct.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedProduct.status?.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {formatPrice(selectedProduct.price)}
                    </div>

                    <div className="text-gray-600 mb-6">
                      {selectedProduct.description}
                    </div>
                  </div>

                  {/* Vendor Info */}
                  {/* <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-bold text-gray-900 mb-3">
                      Vendor Information
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Store Name:</span>
                        <span className="font-medium">
                          {selectedProduct.vendor?.storeName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact Email:</span>
                        <span className="font-medium">
                          {selectedProduct.vendor?.email}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">
                          {selectedProduct.vendor?.phone || "Not provided"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vendor ID:</span>
                        <span className="font-medium text-sm">
                          {selectedProduct.vendorId}
                        </span>
                      </div>
                    </div>
                  </div> */}

                  {/* Vendor Info - UPDATED */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-bold text-gray-900 mb-3">
                      Vendor Information
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Store Name:</span>
                        <span className="font-medium">
                          {selectedProduct.vendorName ||
                            selectedProduct.vendor?.storeName ||
                            "Unknown"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vendor ID:</span>
                        <span className="font-medium text-sm">
                          {selectedProduct.vendorId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Specs */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <span className="text-gray-600 text-sm">
                        Stock Quantity:
                      </span>
                      <div className="font-bold">{selectedProduct.stock}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">SKU:</span>
                      <div className="font-bold">
                        {selectedProduct.sku || "Not set"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Type:</span>
                      <div className="font-bold">
                        {selectedProduct.type || "Physical"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Brand:</span>
                      <div className="font-bold">
                        {selectedProduct.brand || "Not specified"}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {currentTab === "pending" && (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleApprove(selectedProduct.$id)}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Approve Product</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          setShowRejectModal(true);
                        }}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Reject Product</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Reject Product
              </h3>

              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Product:{" "}
                  <span className="font-bold">
                    {selectedProduct.productName}
                  </span>
                </p>
                <p className="text-gray-600 mb-4">
                  Vendor:{" "}
                  <span className="font-bold">
                    {selectedProduct.vendor?.storeName}
                  </span>
                </p>

                <label className="block text-gray-700 mb-2">
                  Reason for rejection (required):
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  placeholder="Please provide a reason for rejecting this product..."
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedProduct.$id)}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductApprovals;
