/**
 * Utility function to handle React.lazy chunk loading errors
 * 
 * This function automatically retries failed chunk loads and refreshes the page
 * if necessary to resolve chunk loading issues. This is particularly useful
 * after OAuth redirects or when chunks become outdated.
 * 
 * Usage:
 * const LazyComponent = React.lazy(() => lazyRetry(() => import('./Component')))
 * 
 * @param {Function} componentImport - Function that returns a dynamic import promise
 * @returns {Promise} Promise that resolves to the component module
 */
export const lazyRetry = function(componentImport) {
    return new Promise((resolve, reject) => {
        // Check if we've already refreshed the page for this chunk error
        const hasRefreshed = JSON.parse(
            window.sessionStorage.getItem('retry-lazy-refreshed') || 'false'
        );

        componentImport()
            .then((component) => {
                // Component loaded successfully, clear refresh flag
                window.sessionStorage.setItem('retry-lazy-refreshed', 'false');
                resolve(component);
            })
            .catch((error) => {
                console.warn('Chunk loading failed:', error);
                
                if (!hasRefreshed) {
                    // First failure - set flag and refresh the page
                    console.log('First chunk load failure, refreshing page...');
                    window.sessionStorage.setItem('retry-lazy-refreshed', 'true');
                    return window.location.reload(); // This will refresh the page
                } else {
                    // Already refreshed once, reject with error
                    console.error('Chunk loading failed after refresh:', error);
                    reject(error);
                }
            });
    });
};

export default lazyRetry;