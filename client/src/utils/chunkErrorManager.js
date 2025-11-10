/**
 * Chunk loading error management utilities
 * 
 * This module provides utilities to manage chunk loading errors across the app,
 * including cleanup of retry flags and error state management.
 */

/**
 * Clear all chunk-related error flags from sessionStorage
 */
export const clearChunkErrorFlags = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('retry-lazy-refreshed');
    sessionStorage.removeItem('chunk-error-refreshed');
  }
};

/**
 * Check if the current session has had chunk loading issues
 */
export const hasChunkErrors = () => {
  if (typeof window === 'undefined') return false;
  
  return !!(
    sessionStorage.getItem('retry-lazy-refreshed') ||
    sessionStorage.getItem('chunk-error-refreshed')
  );
};

/**
 * Initialize chunk error management for the app
 * Should be called once during app initialization
 */
export const initializeChunkErrorManagement = () => {
  if (typeof window === 'undefined') return;

  // Clear flags on successful navigation
  const clearFlags = () => {
    if (window.performance.navigation.type === 0) { // TYPE_NAVIGATE (normal navigation)
      clearChunkErrorFlags();
    }
  };

  // Clear flags after successful load
  if (document.readyState === 'complete') {
    clearFlags();
  } else {
    window.addEventListener('load', clearFlags);
  }

  // Clear flags on successful route changes (for SPAs)
  window.addEventListener('popstate', clearFlags);

  // Optional: Clear flags periodically to prevent stale flags
  const clearStaleFlags = () => {
    const refreshFlag = sessionStorage.getItem('retry-lazy-refreshed');
    const errorFlag = sessionStorage.getItem('chunk-error-refreshed');
    
    if (refreshFlag || errorFlag) {
      // If flags are older than 10 minutes, clear them
      const now = Date.now();
      const flagTime = parseInt(refreshFlag || errorFlag || '0');
      
      if (now - flagTime > 10 * 60 * 1000) { // 10 minutes
        clearChunkErrorFlags();
      }
    }
  };

  // Check for stale flags every 5 minutes
  setInterval(clearStaleFlags, 5 * 60 * 1000);
};

/**
 * Manual recovery function for chunk loading errors
 * Useful for providing users a manual retry option
 */
export const retryChunkLoading = () => {
  if (typeof window === 'undefined') return;
  
  // Clear all error flags
  clearChunkErrorFlags();
  
  // Force a hard reload
  window.location.reload(true);
};

export default {
  clearChunkErrorFlags,
  hasChunkErrors,
  initializeChunkErrorManagement,
  retryChunkLoading
};