import { ID, Query, Storage } from "appwrite";
import axiosClient from "./api";
import { Config, storage } from "./appwrite";
import { getCurrentUser } from "./authServices";
/* import { getCurrentUser } from "./Context/GlobalProvider"; */

export const createNotification = async ({
  message,
  type,
  username,
  email,
  userId,
}) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No access token found");

    const response = await axiosClient.post(
      "/api/customernotifications/createnotification",
      {
        message,
        type,
        username,
        email,
        userId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.notification;
  } catch (error) {
    console.error("❌ Failed to send notification:", error.message);
    throw error;
  }
};

export const saveRecentSearch = async (query) => {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      console.log("No token found, skipping save recent search");
      return;
    }

    const userId = await fetchUserId();
    if (!userId) {
      console.log("No userId found, skipping save recent search");
      return;
    }
    
    const response = await axiosClient.post(
      `/api/customerprofile/customer-searches`,
      {
        userId,
        query,
      }
    );

    console.log("Recent search saved:", response.data.message);
  } catch (error) {
    console.error(
      "Failed to save recent search:",
      error.response?.data || error.message
    );
  }
};

export const getRecentSearches = async () => {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      console.log("No token found, skipping recent searches");
      return [];
    }
    
    const userId = await fetchUserId();
    if (!userId) {
      console.log("No userId found, skipping recent searches");
      return [];
    }
    
    const response = await axiosClient.get(
      "/api/customerprofile/customer-recent-search",
      {
        params: {
          userId: userId,
        },
      }
    );
    return response.data.searches || [];
  } catch (error) {
    console.error(
      "Error fetching recent searches:",
      error.response?.data || error.message
    );
    return [];
  }
};

export const getPopularSearches = async (limit = 6) => {
  try {
    const response = await axiosClient.get(
      "/api/customerprofile/popular-searches",
      {
        params: { limit }
      }
    );
    return response.data.searches || [];
  } catch (error) {
    console.error(
      "Error fetching popular searches:",
      error.response?.data || error.message
    );
    return [];
  }
};

export const clearRecentSearches = async () => {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) throw new Error("No access token found");

    const response = await axiosClient.delete(
      "/api/customerprofile/clear-recent-search",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error clearing recent searches:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getCustomerNotification = async () => {
  /* console.log('➡️ getCustomerNotification called...'); */

  try {
    const token = localStorage.getItem("accessToken");
    /* console.log('Token from AsyncStorage:', token); */

    /* console.log('➡️ Making GET request to /api/customernotifications/customernotification...'); */

    const response = await axiosClient.get(
      "/api/customernotifications/customernotification",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const notifications = response.data?.result;

    if (!Array.isArray(notifications)) {
      throw new Error("Invalid notifications data received");
    }

    return notifications; // ✅ Return just the array
  } catch (error) {
    console.error("❌ Error fetching userNotifications:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    throw error; /* catch (error) {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('accessToken');
      console.warn('⚠️ Token expired or invalid. Logging out user.');
    }

    console.error(
      '❌ Error fetching notifications:',
      error.response?.data?.error || error.message
    );
    throw error; */
  }
};

export const getProducts = async () => {
  try {
    const response = await axiosClient.get(
      "/api/customerprofile/fetch-products"
    );

    if (response.data.success) {
      console.log("✅ Products fetched:", response.data.products.length);
      return response.data.products; // <-- return array directly
    } else {
      console.warn("⚠️ Failed to fetch products:", response.data.error);
      return [];
    }
  } catch (error) {
    console.error("❌ Error in fetchProducts:", error);
    return [];
  }
};

export const updateCurrencyRates = async () => {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No auth token found");
    }
    const response = await axiosClient.get(
      "/api/update-currencies/update-currencies",
      {
        headers: {
          Authorization: `Bearer ${token}`, // 🔐 Set the token here
        },
      }
    );

    /* sendNotification(); */
    return response.data;
  } catch (error) {
    console.error("❌ Error updating currency rates:", error);
  }
};

export const fetchReviews = async (productId) => {
  try {
    const response = await axiosClient.get(
      `/api/customerprofile/fetch-reviews/${productId}`
    );
    /* console.log("Review data:", response.data); */
    return response.data;
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return [];
  }
};

export const fetchUserName = async () => {
  try {
    const result = await getCurrentUser(); // This returns { success, data } or { success, error }

    // Check if the request was successful
    if (!result.success) {
      console.warn("Failed to fetch user:", result.error);
      return "Guest"; // Fallback if request failed
    }

    // Access the username from the correct path
    // Assuming your backend returns user object with a 'name' or 'username' field
    const userName =
      result.data?.user?.name ||
      result.data?.user?.username ||
      result.data?.user?.email?.split("@")[0]; // Fallback to email prefix
    console.log("User name fetched:", userName);
    return userName || "Guest"; // Return username or "Guest" if not found
  } catch (error) {
    console.error("Error fetching user name:", error);
    return "Anonymous"; // Fallback if an error occurs
  }
};

export const getProfile = async () => {
  /* console.log('➡️ Frontend Service: getAdminProfile called...');  */
  try {
    const token = localStorage.getItem("token");
    /*  console.log('➡️ Frontend Service: Making GET request to /api/admin/profile');  */
    const response = await axiosClient.get("/api/customerprofile/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("⬅️ Frontend Service: Received response:", response);
    return response.data; // Contains the admin user's profile data
  } catch (error) {
    console.error(
      "❌ Frontend Service: Error fetching admin profile:",
      error.response?.data?.error || error.message
    );
    throw error; // Re-throw the error for the component to handle
  }
};

export const fetchProduct = async (
  { category = "all", search = "" } = {},
  setLoading
) => {
  try {
    if (typeof setLoading === "function") setLoading(true);

    const response = await axiosClient.get(
      "/api/customerprofile/fetch-product",
      {
        params: { category, search },
      }
    );

    if (!response?.data?.products || !Array.isArray(response.data.products)) {
      console.error("Invalid response structure:", response);
      return [];
    }

    return response.data.products;
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return [];
  } finally {
    if (typeof setLoading === "function") setLoading(false);
  }
};

export const fetchProducts = async (
  { category = "", search = "", cursor = null } = {},
  setLoading
) => {
  try {
    if (typeof setLoading === "function") setLoading(true);

    const response = await axiosClient.get(
      "/api/customerprofile/fetch-product",
      {
        params: { category, search, cursor },
      }
    );

    if (!response || !response.data || !Array.isArray(response.data.products)) {
      console.error("Invalid response structure:", response);
      return { products: [], nextCursor: null };
    }

    console.log("Products fetched:", response.data.products.length);

    return {
      products: response.data.products,
      nextCursor: response.data.nextCursor || null, // backend should return this
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [], nextCursor: null };
  } finally {
    if (typeof setLoading === "function") setLoading(false);
  }
};

export const incrementProductRatingsCount = async (productId) => {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No access token found.");
    }

    const response = await axiosClient.post(
      "/api/customerprofile/increment-rating",
      { productId } // Request body
      /*     {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } */
    );

    console.log("Ratings count updated:", response.data.ratingsCount);
    return response.data;
  } catch (error) {
    console.error(
      "Error incrementing product ratings count:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getOrders = async () => {
  try {
    const response = await axiosClient.get("/api/orders/orders");
    console.log("Orders fetched:", response.data.response);
    return response.data.response; // Returns the array of orders (documents)
  } catch (error) {
    console.error(
      "Error fetching orders:",
      error.response?.data?.error || error.message
    );
    throw new Error(error.response?.data?.error || "Failed to fetch orders.");
  }
};

export const getCustomerOrders = async () => {
  const response = await axiosClient.get(
    "/api/customerprofile/customer-orders"
  );
  console.log("Customer Orders fetched:", response.data.orders);

  return response.data.orders;
};

export const submitReview = async ({
  productId,
  reviewText,
  rating,
  image, // single image URL
  images, // optional multiple image URLs
  parentReviewId, // optional threading if supported
}) => {
  const response = await axiosClient.post(
    "/api/customerprofile/submit-review",
    {
      productId,
      reviewText,
      rating,
      image: image || "",
      images: Array.isArray(images) ? images : undefined,
      parentReviewId: parentReviewId || undefined,
    }
  );

  return response.data;
};

export const uploadFile = async (file) => {
  if (!file) {
    console.warn("uploadFile: No file provided.");
    return null;
  }

  try {
    // Upload file to Appwrite Storage
    const uploadedFile = await storage.createFile(
      Config.StorageId,
      ID.unique(), // Use ID.unique() from Appwrite SDK
      file // Pass the raw File object directly
    );

    // Get a public view URL for the uploaded file
    const url = storage.getFileView(Config.StorageId, uploadedFile.$id);
    console.log("Appwrite upload successful:", uploadedFile, url);
    // SDK returns a URL string; fallback to constructing if not
    return typeof url === "string"
      ? url
      : `${Config.endpoint}/storage/buckets/${Config.StorageId}/files/${uploadedFile.$id}/view?project=${Config.projectId}`;
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
};

export const fetchUserId = async () => {
  try {
    const result = await getCurrentUser(); // This returns { success, data } or { success, error }

    if (!result.success || !result.data?.user?.id) {
      throw new Error("User not authenticated or userId not found");
    }

    console.log("User ID fetched:", result.data.user.id);
    return result.data.user.id; // Return the user ID from the correct path
  } catch (error) {
    console.error("Error fetching user ID from Appwrite:", error);
    throw new Error("Unable to fetch user ID");
  }
};

export const fetchCategories = async () => {
  try {
    const response = await axiosClient.get("/api/customerprofile/categories");
    console.log("fetched categories:", response.data);
    return response?.data || [];
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    return [];
  }
};
