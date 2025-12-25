import axios from 'axios';

// React Native + Expo axios client
// Mirrors web client logging/headers but avoids browser-only APIs.
const API_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000';

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  console.log(`[AXIOS DEBUG] Initializing axios with base URL: ${API_URL}`);
  console.log(`[AXIOS DEBUG] Current date: ${new Date().toISOString()}`);
}

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  maxRedirects: 0,
});

// Request interceptor (token hook placeholder; RN-safe)
axiosClient.interceptors.request.use(
  (config) => {
    let token = null;
    // If you store a token in SecureStore/AsyncStorage, attach it here.
    // Example:
    // const token = await SecureStore.getItemAsync('auth_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }

    if (isDev) {
      console.log(
        `[AXIOS DEBUG] Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`
      );
      console.log(`[AXIOS DEBUG] Token found:`, token ? 'Yes' : 'No');
      if (token) {
        const preview = `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
        console.log(`[AXIOS DEBUG] Token preview:`, preview);
        console.log(`[AXIOS DEBUG] Authorization header:`, config.headers.Authorization);
      }
      console.log(`[AXIOS DEBUG] All headers:`, config.headers);
      if (config.data) {
        const sanitizedData = { ...config.data };
        if (sanitizedData.password) sanitizedData.password = '********';
        console.log(`[AXIOS DEBUG] Request payload:`, sanitizedData);
      }
      if (config.url?.includes('/payment/')) {
        if (token) {
          const truncated =
            token.length > 20
              ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}`
              : token;
          console.log(`[PAYMENT DEBUG] Payment request with auth token: ${truncated}`);
        } else {
          console.warn('[PAYMENT DEBUG] WARNING: Making payment request without authentication token!');
        }
      }
    }

    return config;
  },
  (error) => {
    if (isDev) {
      console.error('[AXIOS DEBUG] Request error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    if (isDev) {
      console.log(`[AXIOS DEBUG] Response received from ${response.config.url}:`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });
    }
    return response;
  },
  async (error) => {
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
        },
      });
    } else if (error.request) {
      console.error('[AXIOS DEBUG] No response received:', error.request);
    } else {
      console.error('[AXIOS DEBUG] Request setup error:', error.message);
    }

    // 401 handling: log only (no browser redirect in RN)
    if (error.response && error.response.status === 401) {
      console.log('[AXIOS DEBUG] 401 Unauthorized error detected');
    }

    // 405 handling: log only
    if (error.response && error.response.status === 405) {
      console.error('[AXIOS DEBUG] 405 Method Not Allowed error:', {
        url: error.response.config.url,
        method: error.response.config.method,
        allowedMethods: error.response.headers?.allow,
      });
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
