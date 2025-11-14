// next.config.webpack.js
// This file contains webpack-specific configurations for Next.js

/**
 * Custom webpack configuration for the Plant Monitoring System
 * @param {object} config - The existing webpack configuration
 * @param {object} options - Options including isServer and dev flags
 * @returns {object} Updated webpack configuration
 */
const customizeWebpack = (config, { isServer, dev }) => {
  // Add specific handling for the Google OAuth callback page
  config.module.rules.push({
    test: /pages\/auth\/google-callback\.js$/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],
          plugins: [
            // Add any specific babel plugins needed for this page
          ]
        }
      }
    ]
  });

  // Optimize chunks for auth pages
  if (!isServer) {
    // Ensure optimization object exists
    if (!config.optimization) {
      config.optimization = {};
    }
    
    // Ensure splitChunks object exists
    if (!config.optimization.splitChunks) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {}
      };
    }
    
    // Ensure cacheGroups object exists
    if (!config.optimization.splitChunks.cacheGroups) {
      config.optimization.splitChunks.cacheGroups = {};
    }
    
    // Now safely add the authPages cache group
    config.optimization.splitChunks.cacheGroups.authPages = {
      test: /[\\/](pages|app)[\\/]auth[\\/]/,
      name: 'auth-pages',
      chunks: 'all',
      priority: 10,
      enforce: true,
    };
  }

  // Add specific configurations for development
  if (dev) {
    // Enable detailed error reporting
    config.devtool = 'eval-source-map';
  }

  // Return the modified config
  return config;
};

// Export as CommonJS module
module.exports = customizeWebpack;

// Also support named export for compatibility
module.exports.default = customizeWebpack;