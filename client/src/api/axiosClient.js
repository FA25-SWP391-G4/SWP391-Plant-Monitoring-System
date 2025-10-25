import axios from "axios";
import Cookies from "js-cookie";

// Ensure the API URL has the correct structure with protocol and no trailing slash
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Debug information
console.log(`[AXIOS DEBUG] Initializing axios with base URL: ${API_URL}`);
console.log(`[AXIOS DEBUG] Current date: ${new Date().toISOString()}`);

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for API calls
axiosClient.interceptors.request.use(
  (config) => {
    // Get the JWT token from cookies
    const token = Cookies.get("token");
    
    // Debug logging
    console.log(`[AXIOS DEBUG] Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    console.log(`[AXIOS DEBUG] Request headers:`, config.headers);

    // Add explicit origin header for CORS
    config.headers["Origin"] = window.location.origin;

    if (config.data) {
      // Log data but mask passwords
      const sanitizedData = { ...config.data };
      if (sanitizedData.password) sanitizedData.password = '********';
      console.log(`[AXIOS DEBUG] Request payload:`, sanitizedData);
    }

    // If token exists, add it to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Show a truncated version of the token for debugging
      const truncatedToken = token.length > 20 ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : token;
      console.log(`[AXIOS DEBUG] Token found, added to Authorization header: ${truncatedToken}`);
      
      // Add special logging for payment-related requests
      if (config.url.includes('/payment/')) {
        console.log(`[PAYMENT DEBUG] Payment request with auth token: ${truncatedToken}`);
      }
    } else {
      console.log(`[AXIOS DEBUG] No token found in cookies`);
      
      // Warn about payment requests without authentication
      if (config.url.includes('/payment/')) {
        console.warn(`[PAYMENT DEBUG] WARNING: Making payment request without authentication token!`);
      }
    }
    return config;
  },
  (error) => {
    // Handle request errors
    console.error("[AXIOS DEBUG] Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
axiosClient.interceptors.response.use(
  (response) => {
    console.log(`[AXIOS DEBUG] Response received from ${response.config.url}:`, {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  async (error) => {
    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`[AXIOS DEBUG] Response error (${error.response.status}):`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        config: {
          url: error.response.config.url,
          method: error.response.config.method,
          baseURL: error.response.config.baseURL,
          headers: error.response.config.headers,
        }
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[AXIOS DEBUG] No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[AXIOS DEBUG] Request setup error:', error.message);
    }

    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      console.log('[AXIOS DEBUG] 401 Unauthorized error detected');

      // Clear cookies and redirect to login
      Cookies.remove("token");
      Cookies.remove("user");
      
      // Check if we're in browser environment
      if (typeof window !== "undefined") {
        // Store the current URL for redirect after login
        localStorage.setItem("redirectAfterLogin", window.location.pathname);
        
        // Redirect to login page - only if not already on login page
        if (!window.location.pathname.includes('/login')) {
          console.log('[AXIOS DEBUG] Redirecting to login page');
          window.location.href = "/login";
        } else {
          console.log('[AXIOS DEBUG] Already on login page, not redirecting');
        }
      }
    }

    // Handle 405 Method Not Allowed errors
    if (error.response && error.response.status === 405) {
      console.error('[AXIOS DEBUG] 405 Method Not Allowed error:', {
        url: error.response.config.url,
        method: error.response.config.method,
        allowedMethods: error.response.headers['allow'],
      });
    }

    // Continue with error rejection
    return Promise.reject(error);
  }
);

export default axiosClient;
