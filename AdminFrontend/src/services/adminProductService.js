// services/adminProductService.js

import axiosClient from "../../api";

export const adminProductService = {
  // Get pending products
  getPendingProducts: async () => {
    try {
      const response = await axiosClient.get(
        "/api/admin/products/products/pending"
      );
      console.log("Pending products fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get pending products error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch pending products"
      );
    }
  },

  // Get approved products
  getApprovedProducts: async () => {
    try {
      const response = await axiosClient.get(
        "/api/admin/products/products/approved"
      );
      return response.data;
    } catch (error) {
      console.error("Get approved products error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch approved products"
      );
    }
  },

  // Get rejected products
  getRejectedProducts: async () => {
    try {
      const response = await axiosClient.get(
        "/api/admin/products/products/rejected"
      );
      return response.data;
    } catch (error) {
      console.error("Get rejected products error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch rejected products"
      );
    }
  },

  // Approve product
  approveProduct: async (productId) => {
    try {
      const response = await axiosClient.post(
        `/api/admin/products/products/approve/${productId}`
      );
      return response.data;
    } catch (error) {
      console.error("Approve product error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to approve product"
      );
    }
  },

  // Reject product
  rejectProduct: async (productId, reason) => {
    try {
      const response = await axiosClient.post(
        `/api/admin/products/products/reject/${productId}`,
        { reason }
      );
      return response.data;
    } catch (error) {
      console.error("Reject product error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to reject product"
      );
    }
  },

  // Get product details
  getProductDetails: async (productId) => {
    try {
      const response = await axiosClient.get(
        `/api/admin/products/products/${productId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get product details error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch product details"
      );
    }
  },

  // Get all products with filters
  getAllProducts: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value);
        }
      });

      const url = `/api/admin/products/products${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await axiosClient.get(url);
      return response.data;
    } catch (error) {
      console.error("Get all products error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch products"
      );
    }
  },

  // Update product
  updateProduct: async (productId, updateData) => {
    try {
      const response = await axiosClient.patch(
        `/api/admin/products/products/${productId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error("Update product error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to update product"
      );
    }
  },

  // Delete product
  deleteProduct: async (productId) => {
    try {
      const response = await axiosClient.delete(
        `/api/admin/products/products/${productId}`
      );
      return response.data;
    } catch (error) {
      console.error("Delete product error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to delete product"
      );
    }
  },

  // Get product statistics
  getProductStats: async () => {
    try {
      const response = await axiosClient.get(
        "/api/admin/products/products/stats"
      );
      return response.data;
    } catch (error) {
      console.error("Get product stats error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to fetch product statistics"
      );
    }
  },

  // Bulk actions
  bulkApproveProducts: async (productIds) => {
    try {
      const response = await axiosClient.post(
        "/api/admin/products/products/bulk/approve",
        { productIds }
      );
      return response.data;
    } catch (error) {
      console.error("Bulk approve error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to bulk approve products"
      );
    }
  },

  bulkRejectProducts: async (productIds, reason) => {
    try {
      const response = await axiosClient.post(
        "/api/admin/products/products/bulk/reject",
        { productIds, reason }
      );
      return response.data;
    } catch (error) {
      console.error("Bulk reject error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to bulk reject products"
      );
    }
  },
};
