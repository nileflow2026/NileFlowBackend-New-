/* eslint-disable no-unused-vars */
// src/api/customerAxiosClient.js (or update your existing api.js)
import axios from "axios";

const API_BASE_URL = "https://new-nile-flow-backend.onrender.com"; // Update with your API base URL

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // Increased from 10000 to 30000 ms
  withCredentials: true, // CRITICAL: Send cookies with requests
});

// Track if refresh is in progress
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, success = false) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(success);
    }
  });
  failedQueue = [];
};

// NO REQUEST INTERCEPTOR NEEDED - cookies are sent automatically with withCredentials: true

// Response interceptor - handle token refresh on 401
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => axiosClient(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Get deviceId from sessionStorage if available
      const deviceId = sessionStorage.getItem("customerDeviceId") || null;

      console.log("[Axios Interceptor] Refreshing token...");

      // Refresh token is sent via httpOnly cookie automatically
      // IMPORTANT: Use a separate axios instance to avoid interceptor loop
      const response = await axios.post(
        `${API_BASE_URL}/api/customerauth/refresh`,
        { deviceId },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      console.log("[Axios Interceptor] Token refreshed successfully");

      // Process queued requests with success
      processQueue(null, true);
      isRefreshing = false;

      // Retry original request
      return axiosClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      processQueue(refreshError, false);

      // Clear queued requests
      failedQueue = [];

      console.error(
        "[Axios Interceptor] Refresh token failed:",
        refreshError.response?.data || refreshError.message,
      );

      // Trigger logout event (only once)
      if (!window.__customer_auth_logout_triggered) {
        window.__customer_auth_logout_triggered = true;
        window.dispatchEvent(new CustomEvent("auth:logout"));

        // Reset flag after a short delay
        setTimeout(() => {
          window.__customer_auth_logout_triggered = false;
        }, 1000);
      }

      return Promise.reject(refreshError);
    }
  },
);

export default axiosClient;
