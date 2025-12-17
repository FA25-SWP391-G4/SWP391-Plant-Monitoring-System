/**
 * Enhanced React.lazy wrapper that automatically handles chunk loading errors
 * 
 * This utility provides a drop-in replacement for React.lazy that includes
 * automatic retry logic for chunk loading failures. It's particularly useful
 * in applications with frequent deployments or after OAuth redirects.
 * 
 * Usage:
 * Instead of: const Component = React.lazy(() => import('./Component'))
 * Use: const Component = lazyComponent(() => import('./Component'))
 * 
 * @param {Function} importFunction - Function that returns a dynamic import promise
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 1)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @returns {React.LazyExoticComponent} Lazy component with error handling
 */
import React from 'react';
import { lazyRetry } from './lazyRetry';

export const lazyComponent = (importFunction, options = {}) => {
  const { maxRetries = 1, retryDelay = 1000 } = options;

  return React.lazy(() => 
    lazyRetry(importFunction, { maxRetries, retryDelay })
  );
};

/**
 * Hook for handling dynamic imports in functional components
 * with automatic retry logic
 * 
 * Usage:
 * const { component: DynamicComponent, loading, error } = useLazyComponent(
 *   () => import('./Component')
 * );
 */
import { useState, useEffect } from 'react';

export const useLazyComponent = (importFunction, dependencies = []) => {
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    setLoading(true);
    setError(null);

    lazyRetry(importFunction)
      .then(module => {
        if (isMounted) {
          setComponent(() => module.default || module);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { component, loading, error };
};

export default lazyComponent;