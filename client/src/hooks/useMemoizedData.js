import { useState, useEffect } from 'react';

/**
 * A custom hook for fetching and caching data with built-in debouncing and caching
 * @param {Function} fetchFunction - The async function to fetch data
 * @param {Array} dependencies - Array of dependencies to trigger refetch
 * @param {Object} options - Configuration options
 * @returns {Object} - The fetched data, loading state, error state, and refetch function
 */
export default function useMemoizedData(fetchFunction, dependencies = [], options = {}) {
  const {
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes by default
    initialData = null,
    debounceMs = 300,
    onSuccess = () => {},
    onError = () => {}
  } = options;

  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create a fetch function with debouncing
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Skip cache check if no cacheKey (null or undefined)
      if (cacheKey) {
        const cachedData = sessionStorage.getItem(cacheKey);
        const expiry = sessionStorage.getItem(`${cacheKey}_expiry`);
        
        if (cachedData && expiry && new Date().getTime() < parseInt(expiry)) {
          const parsedData = JSON.parse(cachedData);
          setData(parsedData);
          setIsLoading(false);
          onSuccess(parsedData);
          return;
        }
      }
      
      // Fetch fresh data
      const result = await fetchFunction();
      
      // Cache the result if cacheKey is provided and result exists
      if (cacheKey && result) {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(result));
          sessionStorage.setItem(
            `${cacheKey}_expiry`, 
            (new Date().getTime() + cacheDuration).toString()
          );
        } catch (cacheError) {
          console.warn('Failed to cache data:', cacheError);
          // Continue without caching
        }
      }
      
      setData(result);
      onSuccess(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      onError(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manual refetch function that bypasses cache
  const refetch = async () => {
    if (cacheKey) {
      sessionStorage.removeItem(cacheKey);
      sessionStorage.removeItem(`${cacheKey}_expiry`);
    }
    await fetchData();
  };
  
  useEffect(() => {
    // Debounce the fetch
    const timeoutId = setTimeout(fetchData, debounceMs);
    
    // Clean up the timeout
    return () => clearTimeout(timeoutId);
  }, dependencies);
  
  return { data, isLoading, error, refetch };
}