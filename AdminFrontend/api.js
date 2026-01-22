/* eslint-disable no-unused-vars */

import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://new-nile-flow-backend.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true, // Important: send cookies with requests
});

// Track if refresh is in progress to avoid multiple simultaneous refresh attempts
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
      // Refresh token is sent via httpOnly cookie automatically
      const response = await axios.post(
        `${axiosClient.defaults.baseURL}/api/admin/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      // Process queued requests
      processQueue(null, true);

      // Retry original request
      return axiosClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, false);

      // Trigger logout event once to avoid repeated navigation loops
      try {
        if (!window.__nileflow_logout_dispatched) {
          window.__nileflow_logout_dispatched = true;
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
      } catch (e) {
        // swallow errors from env/readonly window
        void e;
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;
