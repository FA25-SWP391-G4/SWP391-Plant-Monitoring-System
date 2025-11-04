'use client';

/**
 * Handler for x-direct-redirect headers
 * This utility helps with cross-domain redirects when CORS prevents direct redirects
 * 
 * @param {Response} response - The fetch response object
 * @returns {boolean} True if a redirect was performed, false otherwise
 */
export function handleDirectRedirect(response) {
  // Check if response has the special header
  const redirectUrl = response.headers.get('x-direct-redirect');
  
  if (redirectUrl) {
    console.log('Received x-direct-redirect header:', redirectUrl);
    
    // Perform the redirect
    window.location.href = redirectUrl;
    return true;
  }
  
  return false;
}

/**
 * Enhanced version of fetch that handles x-direct-redirect headers
 * 
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} The fetch response
 */
export async function fetchWithRedirectSupport(url, options = {}) {
  const response = await fetch(url, options);
  
  // Handle redirect headers if present
  if (handleDirectRedirect(response)) {
    // Return a promise that never resolves since we're redirecting
    return new Promise(() => {});
  }
  
  return response;
}

/**
 * Enhanced version of Axios interceptor to handle x-direct-redirect headers
 * 
 * @param {Object} axiosInstance - The axios instance
 */
export function setupRedirectInterceptor(axiosInstance) {
  axiosInstance.interceptors.response.use(
    (response) => {
      // Check for x-direct-redirect header
      const redirectUrl = response.headers?.['x-direct-redirect'];
      
      if (redirectUrl) {
        console.log('Axios intercepted x-direct-redirect header:', redirectUrl);
        
        // Perform redirect
        window.location.href = redirectUrl;
        
        // Return a promise that never resolves since we're redirecting
        return new Promise(() => {});
      }
      
      return response;
    },
    (error) => {
      // Also check headers in error responses
      const redirectUrl = error.response?.headers?.['x-direct-redirect'];
      
      if (redirectUrl) {
        console.log('Axios intercepted x-direct-redirect header in error response:', redirectUrl);
        window.location.href = redirectUrl;
        return new Promise(() => {});
      }
      
      return Promise.reject(error);
    }
  );
}