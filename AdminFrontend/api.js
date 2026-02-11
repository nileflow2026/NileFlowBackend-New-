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

// Request interceptor for debugging
axiosClient.interceptors.request.use(
  (config) => {
    console.log(`🔄 Making request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`🍪 Cookies will be sent: ${document.cookie ? 'YES' : 'NO'}`);
    if (document.cookie) {
      console.log(`🍪 Available cookies: ${document.cookie}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

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
  (response) => {
    console.log(`✅ Response success: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.log(`❌ Response error: ${originalRequest.method?.toUpperCase()} ${originalRequest.url} - ${error.response?.status}`);
    console.log(`❌ Error details:`, {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    console.log('🔄 401 error detected, attempting token refresh...');

    // If already refreshing, queue this request
    if (isRefreshing) {
      console.log('⏳ Refresh already in progress, queuing request...');
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => axiosClient(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      console.log('🔄 Attempting to refresh tokens...');
      // Refresh token is sent via httpOnly cookie automatically
      const response = await axios.post(
        `${axiosClient.defaults.baseURL}/api/admin/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log('✅ Token refresh successful');
      // Process queued requests
      processQueue(null, true);

      // Retry original request
      return axiosClient(originalRequest);
    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
      processQueue(refreshError, false);

      // Trigger logout event once to avoid repeated navigation loops
      try {
        if (!window.__nileflow_logout_dispatched) {
          window.__nileflow_logout_dispatched = true;
          console.log('🚨 Dispatching logout event due to refresh failure');
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
