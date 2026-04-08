/* eslint-disable no-constant-binary-expression */
import axios from "axios";
import { refreshSession } from "./authServices";

// Create Axios instance
const axiosClient = axios.create({
  baseURL: "http://localhost:3000", // your backend URL
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

// Attach access token to every request
axiosClient.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage for tokens
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 (expired token)
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If request failed with 401 Unauthorized and we haven’t retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshSession();
        axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return axiosClient(originalRequest); // retry request with new token
      } catch (refreshError) {
        console.error("Refresh token failed, logging out...");
        // Clear auth data but don't redirect here - let the app handle it
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        // Dispatch event for auth context to handle logout
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
