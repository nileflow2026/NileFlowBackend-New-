/* eslint-disable no-unused-vars */
import axiosClient from "./api";

export const getNotifications = async (type) => {
  try {
    let url = "/api/notifications";
    if (type && type !== "all") {
      url += `?type=${type}`;
    }

    const response = await axiosClient.get(url);
    console.log("Notifications:", response.data.notifications);
    return response.data.notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications.");
  }
};

export const clearAllNotifications = async () => {
  try {
    const response = await axiosClient.get("/api/notifications/clear");
    return response.data.response;
  } catch (error) {
    console.error("Error clearing notifications:", error);
    throw new Error("Failed to clear notifications.");
  }
};

export const fetchAdminNotifications = async () => {
  try {
    const response = await axiosClient.get("/api/notifications/admin");
    console.log("Admin notifications response:", response.data);
    console.log(
      "Total notifications fetched:",
      response.data.result?.length || 0
    );

    // Log notification types for debugging
    if (response.data.result) {
      const types = [
        ...new Set(response.data.result.map((n) => n.type).filter(Boolean)),
      ];
      console.log("Notification types found:", types);
    }

    return response.data.result;
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    throw new Error("Failed to fetch admin notifications.");
  }
};

export const markNotificationsAsRead = async (ids) => {
  try {
    const response = await axiosClient.post("/api/notifications/mark-as-read", {
      ids,
    });
    // Optionally update your frontend state after successful update
    return response.data;
  } catch (error) {
    console.error(
      "Error marking notifications as read:",
      error.response?.data?.error || error.message
    );
    throw new Error(
      error.response?.data?.error || "Failed to mark notifications as read."
    );
  }
};

export const fetchUsers = async () => {
  try {
    const response = await axiosClient.get("/api/users/users");
    return response.data; // Returns the array of users (documents)
  } catch (error) {
    console.error(
      "Error fetching users:",
      error.response?.data?.error || error.message
    );
    throw new Error(error.response?.data?.error || "Failed to fetch users.");
  }
};

export const getProfile = async () => {
  try {
    const response = await axiosClient.get("/api/admin/profile");
    return response.data;
  } catch (error) {
    console.error(
      "Profile fetch error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getOrders = async () => {
  try {
    const response = await axiosClient.get("/api/orders/orders");
    return response.data.response; // Returns the array of orders (documents)
  } catch (error) {
    console.error(
      "Error fetching orders:",
      error.response?.data?.error || error.message
    );
    throw new Error(error.response?.data?.error || "Failed to fetch orders.");
  }
};

export const getCancelledOrders = async () => {
  try {
    const response = await axiosClient.get("/api/orders/orders/cancelled");
    return response.data.response; // Returns the array of orders (documents)
  } catch (error) {
    console.error(
      "Error fetching orders:",
      error.response?.data?.error || error.message
    );
    throw new Error(error.response?.data?.error || "Failed to fetch orders.");
  }
};

export const getProduct = async () => {
  try {
    const response = await axiosClient.get("/api/products/products");
    console.log("Products fetched successfully:", response.data.response);
    return response.data.response;
  } catch (error) {
    console.error(
      "Error fetching products:",
      error.response?.data?.error || error.message
    );
    throw new Error(error.response?.data?.error || "Failed to fetch products.");
  }
};

export const getProducts = async (category = "", search = "", setLoading) => {
  try {
    if (typeof setLoading === "function") setLoading(true);

    const response = await axiosClient.get("/api/products/products", {
      params: { category, search },
    });
    console.log("Products fetched:", response.data.products.length);

    if (!response || !response.data || !Array.isArray(response.data.products)) {
      console.error("Invalid response structure:", response);
      return [];
    }

    return response.data.products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  } finally {
    if (typeof setLoading === "function") setLoading(false);
  }
};

export const addProducts = async () => {
  try {
    const response = await axiosClient.get(
      "/api/admin/addproducts/addproducts"
    );
    return response.data.response;
  } catch (error) {
    console.error(
      "Error adding products:",
      error.response?.data?.error || error.message
    );
    throw new Error(error.response?.data?.error || "Failed to add products.");
  }
};

export const getAuditLogs = async () => {
  try {
    const response = await axiosClient.get("/api/audit-logs/audit-logs");
    /* console.log(' Received response:', response); */
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching products:",
      error.response?.data?.error || error.message
    );
    throw new Error(error.response?.data?.error || "Failed to fetch products.");
  }
};

// User-specific data fetching functions for admin panel
export const getUserById = async (userId) => {
  try {
    // Use existing users endpoint and filter by ID
    const response = await axiosClient.get("/api/users/users");
    const users = response.data;
    const user = users.find((u) => u.$id === userId);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.error(
      "Error fetching user:",
      error.response?.data?.error || error.message
    );
    throw new Error(error.response?.data?.error || "Failed to fetch user.");
  }
};

export const getUserOrders = async (userId) => {
  try {
    // Use existing orders endpoint and filter by user ID
    const response = await axiosClient.get("/api/orders/orders");
    const allOrders = response.data.response || response.data; // Handle different response formats

    // Filter orders for the specific user
    // Orders might have user ID in different fields, check common ones
    const userOrders = allOrders.filter(
      (order) =>
        order.users === userId ||
        order.userId === userId ||
        order.user === userId ||
        order.users?.includes?.(userId) // If users is an array
    );

    console.log(`Found ${userOrders.length} orders for user ${userId}`);
    return userOrders;
  } catch (error) {
    console.error(
      "Error fetching user orders:",
      error.response?.data?.error || error.message
    );
    // Return empty array instead of throwing to gracefully handle missing orders
    return [];
  }
};

export const getUserAddresses = async (userId) => {
  try {
    // Try to use a general addresses endpoint or return empty for now
    // Since addresses endpoint may not exist, we'll return empty array
    console.log("Address endpoint not available, returning empty array");
    return [];
  } catch (error) {
    console.error(
      "Error fetching user addresses:",
      error.response?.data?.error || error.message
    );
    // Return empty array instead of throwing to gracefully handle missing addresses
    return [];
  }
};

export const getUserPreferences = async (userId) => {
  try {
    console.log("Fetching user preferences for user ID:", userId);
    const response = await axiosClient.get(`/api/users/${userId}/preferences`);
    console.log("User preferences fetched:", response.data);
    return response.data.preferences || response.data;
  } catch (error) {
    console.error(
      "Error fetching user preferences:",
      error.response?.data?.error || error.message
    );
    // Return default preferences structure instead of null
    return {
      preferredPaymentMethod: "Credit Card",
      preferredShippingMethod: "Standard Shipping",
      emailNotifications: true,
      smsNotifications: true,
      marketingEmails: false,
      currency: "KSh",
      language: "en",
      timezone: "Africa/Nairobi",
    };
  }
};

export const updateUserPreferences = async (userId, preferences) => {
  try {
    console.log("Updating user preferences for user ID:", userId, preferences);
    const response = await axiosClient.put(`/api/users/${userId}/preferences`, {
      preferences,
    });
    console.log("User preferences updated:", response.data);
    return response.data.preferences || response.data;
  } catch (error) {
    console.error(
      "Error updating user preferences:",
      error.response?.data?.error || error.message
    );
    throw new Error("Failed to update user preferences.");
  }
};

// Rider Management Functions
export const getRiders = async () => {
  try {
    const response = await axiosClient.get("/api/rider/riders");
    return response.data.response || response.data.riders || [];
  } catch (error) {
    console.error(
      "Error fetching riders:",
      error.response?.data?.error || error.message
    );
    throw new Error("Failed to fetch riders.");
  }
};

export const assignRiderToOrder = async ({
  deliveryId,
  riderId,
  pickupAddress,
}) => {
  try {
    const response = await axiosClient.post("/api/deliveries/assign-delivery", {
      deliveryId,
      riderId,
      pickupAddress,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error assigning rider to order:",
      error.response?.data?.error || error.message
    );
    throw new Error(
      error.response?.data?.error || "Failed to assign delivery."
    );
  }
};

export const updateOrderStatus = async (orderId, orderStatus) => {
  try {
    const response = await axiosClient.post(
      `/api/orders/orderStatus`,

      { orderId, orderStatus }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating order status:",
      error.response?.data?.error || error.message
    );
    throw new Error("Failed to update order status.");
  }
};

// Function to fetch customer addresses by type
export const getCustomerAddress = async (
  customerId,
  addressType = "pickup"
) => {
  try {
    const response = await axiosClient.get(
      `/api/nileflow/addresses/customer/${customerId}?type=${addressType}`
    );
    console.log("Customer addresses fetched:", response.data.addresses);
    return response.data.addresses || [];
  } catch (error) {
    console.error(
      "Error fetching customer address:",
      error.response?.data?.error || error.message
    );
    return [];
  }
};

// Comprehensive notification fetching function
export const fetchAllNotificationTypes = async () => {
  try {
    console.log("Fetching all notification types...");

    // Add cache-busting timestamp
    const timestamp = new Date().getTime();

    // Try admin endpoint first with cache busting
    const adminResponse = await axiosClient.get(
      `/api/notifications/admin?_t=${timestamp}`
    );
    console.log("Admin endpoint response:", adminResponse.data);
    console.log(
      "Admin endpoint count:",
      adminResponse.data.result?.length || 0
    );

    if (adminResponse.data.result && adminResponse.data.result.length > 0) {
      // Log the latest notification from admin endpoint
      const sorted = adminResponse.data.result.sort(
        (a, b) =>
          new Date(b.timestamp || b.$createdAt) -
          new Date(a.timestamp || a.$createdAt)
      );
      console.log("Latest notification from admin:", sorted[0]);
      return adminResponse.data.result;
    }

    // If admin endpoint returns empty or limited results, try regular endpoint
    console.log("Admin endpoint limited, trying regular endpoint...");
    const regularResponse = await axiosClient.get(
      `/api/notifications?_t=${timestamp}`
    );
    console.log("Regular endpoint response:", regularResponse.data);
    console.log(
      "Regular endpoint count:",
      regularResponse.data.notifications?.length || 0
    );

    if (
      regularResponse.data.notifications &&
      regularResponse.data.notifications.length > 0
    ) {
      // Log the latest notification from regular endpoint
      const sorted = regularResponse.data.notifications.sort(
        (a, b) =>
          new Date(b.timestamp || b.$createdAt) -
          new Date(a.timestamp || a.$createdAt)
      );
      console.log("Latest notification from regular:", sorted[0]);
      return regularResponse.data.notifications;
    }

    return [];
  } catch (error) {
    console.error("Error fetching notifications:", error);

    // Fallback: try to get notifications by individual type
    try {
      console.log("Trying type-specific fetching...");
      const types = [
        "order",
        "user",
        "system",
        "payment",
        "warning",
        "delivery_update",
      ];
      const allNotifications = [];

      for (const type of types) {
        try {
          const response = await axiosClient.get(
            `/api/notifications?type=${type}`
          );
          if (response.data.notifications) {
            allNotifications.push(...response.data.notifications);
          }
        } catch (typeError) {
          console.warn(`Failed to fetch ${type} notifications:`, typeError);
        }
      }

      console.log(
        `Fetched ${allNotifications.length} notifications across all types`
      );
      return allNotifications;
    } catch (fallbackError) {
      console.error("All notification fetching methods failed:", fallbackError);
      throw new Error("Failed to fetch notifications from any endpoint.");
    }
  }
};

// Force refresh notifications - bypasses all caching
export const forceRefreshNotifications = async () => {
  try {
    console.log("🔄 Force refreshing notifications...");
    const timestamp = new Date().getTime();

    // Try multiple endpoints with cache busting
    const endpoints = [
      `/api/notifications/admin?_t=${timestamp}&force=true`,
      `/api/notifications?_t=${timestamp}&force=true`,
      `/api/notifications/all?_t=${timestamp}&force=true`,
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await axiosClient.get(endpoint);
        console.log(`Response from ${endpoint}:`, response.data);

        const notifications =
          response.data.result || response.data.notifications || response.data;

        if (Array.isArray(notifications) && notifications.length > 0) {
          console.log(
            `✅ Got ${notifications.length} notifications from ${endpoint}`
          );

          // Sort by timestamp descending to see newest first
          const sorted = notifications.sort(
            (a, b) =>
              new Date(b.timestamp || b.$createdAt) -
              new Date(a.timestamp || a.$createdAt)
          );

          console.log(
            "📅 Latest notification timestamp:",
            sorted[0]?.timestamp || sorted[0]?.$createdAt
          );
          console.log("📄 Latest notification:", sorted[0]);

          return sorted;
        }
      } catch (endpointError) {
        console.warn(`Endpoint ${endpoint} failed:`, endpointError.message);
      }
    }

    throw new Error("All endpoints failed to return fresh data");
  } catch (error) {
    console.error("❌ Force refresh failed:", error);
    throw error;
  }
};

// Commission System API Functions
export const getCommissionSettings = async () => {
  try {
    const response = await axiosClient.get("/api/commission/settings");
    return response.data;
  } catch (error) {
    console.error("Error fetching commission settings:", error);
    throw new Error("Failed to fetch commission settings.");
  }
};

export const updateCommissionRate = async (newRate) => {
  try {
    const response = await axiosClient.put("/api/commission/settings", {
      commission_rate: newRate
    });
    return response.data;
  } catch (error) {
    console.error("Error updating commission rate:", error);
    throw new Error("Failed to update commission rate.");
  }
};

export const getCommissionAnalytics = async (timeframe = 'last30') => {
  try {
    const response = await axiosClient.get(`/api/commission/analytics?timeframe=${timeframe}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching commission analytics:", error);
    throw new Error("Failed to fetch commission analytics.");
  }
};

export const getGMVData = async (timeframe = 'last30') => {
  try {
    const response = await axiosClient.get(`/api/admin/commission/gmv?timeframe=${timeframe}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching GMV data:", error);
    throw new Error("Failed to fetch GMV data.");
  }
};

export const recalculateOrderCommission = async (orderId) => {
  try {
    const response = await axiosClient.post(`/api/commission/order/${orderId}/recalculate`);
    return response.data;
  } catch (error) {
    console.error("Error recalculating commission:", error);
    throw new Error("Failed to recalculate commission.");
  }
};

export const batchRecalculateCommissions = async (filters = {}) => {
  try {
    const response = await axiosClient.post("/api/commission/batch-recalculate", filters);
    return response.data;
  } catch (error) {
    console.error("Error batch recalculating commissions:", error);
    throw new Error("Failed to batch recalculate commissions.");
  }
};
