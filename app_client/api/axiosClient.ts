import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
// In React Native, use EncryptedStorage for secure JWT storage and retrieval
import EncryptedStorage from 'react-native-encrypted-storage';
// @ts-ignore
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  console.log(`[AXIOS DEBUG] Initializing axios with base URL: ${API_URL}`);
  console.log(`[AXIOS DEBUG] Current date: ${new Date().toISOString()}`);
}

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  maxRedirects: 0,
});

// [2025-11-06] Centralized token management for JWT handling
import type { InternalAxiosRequestConfig } from "axios";

axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token: string | null = null;
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      try {
        token = await EncryptedStorage.getItem('auth_token');
      } catch (e) {
        if (isDev) console.warn('[AXIOS DEBUG] Failed to get token from EncryptedStorage:', e);
      }
    } else if (typeof window !== 'undefined') {
      token = Cookies.get("token") || null;
      if (!token) {
        token = localStorage.getItem("auth_token");
      }
    }
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }

    if (isDev) {
      console.log(`[AXIOS DEBUG] Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
      console.log(`[AXIOS DEBUG] Token source:`, token ? (typeof window !== 'undefined' && Cookies.get("token") ? 'Cookies' : 'LocalStorage/SecureStorage') : 'None');
      console.log(`[AXIOS DEBUG] Token found:`, token ? 'Yes' : 'No');
      if (token) {
        const tokenPreview = `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
        console.log(`[AXIOS DEBUG] Token preview:`, tokenPreview);
        console.log(`[AXIOS DEBUG] Authorization header:`, config.headers?.Authorization);
      }
      console.log(`[AXIOS DEBUG] All headers:`, config.headers);
    }

    if (isDev && config.data) {
      const sanitizedData = { ...config.data };
      if (sanitizedData.password) sanitizedData.password = '********';
      console.log(`[AXIOS DEBUG] Request payload:`, sanitizedData);
    }

    if (isDev && config.url && config.url.includes('/payment/')) {
      if (token) {
        const truncatedToken = token.length > 20 ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : token;
        console.log(`[PAYMENT DEBUG] Payment request with auth token: ${truncatedToken}`);
      } else {
        console.warn(`[PAYMENT DEBUG] WARNING: Making payment request without authentication token!`);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    if (isDev) {
      console.error("[AXIOS DEBUG] Request error:", error);
    }
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (isDev) {
      console.log(`[AXIOS DEBUG] Response received from ${response.config.url}:`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    if (error.response && isDev) {
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
      console.error('[AXIOS DEBUG] No response received:', error.request);
    } else {
      console.error('[AXIOS DEBUG] Request setup error:', error.message);
    }

    if (error.response && error.response.status === 401) {
      console.log('[AXIOS DEBUG] 401 Unauthorized error detected');
      Cookies.remove("token");
      Cookies.remove("user");
      if (typeof window !== "undefined") {
        localStorage.setItem("redirectAfterLogin", window.location.pathname);
        if (!window.location.pathname.includes('/login')) {
          console.log('[AXIOS DEBUG] Redirecting to login page');
          window.location.href = "/login";
        } else {
          console.log('[AXIOS DEBUG] Already on login page, not redirecting');
        }
      }
    }

    if (error.response && error.response.status === 405) {
      console.error('[AXIOS DEBUG] 405 Method Not Allowed error:', {
        url: error.response.config.url,
        method: error.response.config.method,
        allowedMethods: error.response.headers['allow'],
      });
    }

    return Promise.reject(error);
  }
);

// You need to define or import setupRedirectInterceptor for TypeScript
// setupRedirectInterceptor(axiosClient);

export default axiosClient;
