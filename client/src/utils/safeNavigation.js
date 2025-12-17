/**
 * Safe navigation utility to handle chunk loading errors and other navigation issues
 */

/**
 * Safely navigate to a route with fallback for chunk loading errors
 * @param {import('next/navigation').AppRouterInstance} router - Next.js router instance
 * @param {string} path - The path to navigate to
 * @param {object} options - Navigation options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 */
export const safeNavigate = async (router, path, options = {}) => {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  
  console.log(`[SAFE NAVIGATION] Attempting to navigate to: ${path}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[SAFE NAVIGATION] Attempt ${attempt}/${maxRetries}`);
      
      // Use router.push for navigation
      router.push(path);
      
      // Wait a bit to see if the navigation succeeds
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`[SAFE NAVIGATION] Navigation to ${path} successful on attempt ${attempt}`);
      return true;
      
    } catch (error) {
      console.error(`[SAFE NAVIGATION] Attempt ${attempt} failed:`, error);
      
      // Check if it's a chunk loading error
      const isChunkError = error.name === 'ChunkLoadError' || 
                          error.message.includes('Loading chunk') ||
                          error.message.includes('Loading CSS chunk');
      
      if (isChunkError) {
        console.log(`[SAFE NAVIGATION] Chunk loading error detected on attempt ${attempt}`);
        
        if (attempt < maxRetries) {
          console.log(`[SAFE NAVIGATION] Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        } else {
          console.error(`[SAFE NAVIGATION] All attempts failed, falling back to window.location`);
          // Fallback to hard navigation
          window.location.href = path;
          return false;
        }
      } else {
        // For non-chunk errors, don't retry
        console.error(`[SAFE NAVIGATION] Non-chunk error, not retrying:`, error);
        throw error;
      }
    }
  }
  
  return false;
};

/**
 * Handle chunk loading errors globally
 */
export const setupChunkErrorHandler = () => {
  if (typeof window !== 'undefined') {
    // Catch unhandled chunk loading errors
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      
      if (error && (
        error.name === 'ChunkLoadError' ||
        (error.message && error.message.includes('Loading chunk'))
      )) {
        console.log('[CHUNK ERROR HANDLER] Detected chunk loading error:', error);
        
        // Prevent the error from appearing in console as unhandled
        event.preventDefault();
        
        // Reload the page as a fallback
        console.log('[CHUNK ERROR HANDLER] Reloading page due to chunk error');
        window.location.reload();
      }
    });
  }
};

/**
 * Preload critical chunks to reduce chunk loading errors
 */
export const preloadCriticalChunks = () => {
  if (typeof window !== 'undefined') {
    try {
      // Preload the main app chunk
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = '/_next/static/chunks/app/layout.js';
      document.head.appendChild(link);
      
      console.log('[CHUNK PRELOADER] Critical chunks preloaded');
    } catch (error) {
      console.warn('[CHUNK PRELOADER] Failed to preload chunks:', error);
    }
  }
};