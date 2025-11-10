/**
 * Error boundary specifically designed to handle chunk loading errors
 * in React applications. This component will automatically refresh the page
 * when a chunk loading error occurs.
 */
'use client';
import { Component } from 'react';

class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a chunk loading error
    const isChunkLoadError = 
      error?.message?.toLowerCase().includes('loading chunk') ||
      error?.message?.toLowerCase().includes('loading css chunk') ||
      error?.name === 'ChunkLoadError';

    if (isChunkLoadError) {
      return { hasError: true, isChunkError: true };
    }

    return { hasError: true, isChunkError: false };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ChunkErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo: errorInfo
    });

    const isChunkLoadError = 
      error?.message?.toLowerCase().includes('loading chunk') ||
      error?.message?.toLowerCase().includes('loading css chunk') ||
      error?.name === 'ChunkLoadError';

    if (isChunkLoadError) {
      console.log('Chunk loading error detected, scheduling page refresh...');
      
      // Check if we've already refreshed for a chunk error
      const hasRefreshed = sessionStorage.getItem('chunk-error-refreshed');
      
      if (!hasRefreshed) {
        // Set flag to prevent infinite refresh loops
        sessionStorage.setItem('chunk-error-refreshed', 'true');
        
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.error('Chunk error occurred again after refresh. Manual intervention may be required.');
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        // Chunk loading error - show loading state while preparing to refresh
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #e3e3e3',
              borderTop: '3px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px'
            }} />
            <h3 style={{ color: '#333', marginBottom: '10px' }}>
              Loading Application...
            </h3>
            <p style={{ color: '#666', maxWidth: '400px' }}>
              The application is updating. Please wait while we load the latest version.
            </p>
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        );
      } else {
        // Other types of errors - show error UI
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa'
          }}>
            <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              We encountered an unexpected error. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Refresh Page
            </button>
          </div>
        );
      }
    }

    // Clear the refresh flag when component renders successfully
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('chunk-error-refreshed');
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;