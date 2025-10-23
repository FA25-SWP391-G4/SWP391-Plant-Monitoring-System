// next.config.webpack.js
<<<<<<< HEAD
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
    config.optimization.splitChunks.cacheGroups.authPages = {
      test: /[\\/]pages[\\/]auth[\\/]/,
      name: 'auth-pages',
      chunks: 'all',
=======
// ✅ Fixed version for Next.js 14+
// This file customizes Webpack safely for your SmartGarden / Plant Monitoring System

import path from "path";

/**
 * Custom Webpack configuration
 * @param {object} config - Existing webpack configuration
 * @param {object} options - Options including isServer and dev flags
 * @returns {object} Updated configuration
 */
export default function customizeWebpack(config, { isServer, dev }) {
  // --- Ensure config structure exists ---
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  config.optimization = config.optimization || {};
  config.optimization.splitChunks = config.optimization.splitChunks || {};
  config.optimization.splitChunks.cacheGroups =
    config.optimization.splitChunks.cacheGroups || {};

  // --- Babel loader for Google OAuth callback ---
  config.module.rules.push({
    test: /pages[\\/](auth|login)[\\/]google-callback\.js$/,
    use: [
      {
        loader: "babel-loader",
        options: {
          presets: ["next/babel"],
          plugins: [],
        },
      },
    ],
  });

  // --- Optimize chunks for auth pages ---
  if (!isServer) {
    config.optimization.splitChunks.cacheGroups.authPages = {
      test: /[\\/]pages[\\/]auth[\\/]/,
      name: "auth-pages",
      chunks: "all",
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
      priority: 10,
      enforce: true,
    };
  }

<<<<<<< HEAD
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
=======
  // --- Dev mode setup ---
  if (dev) {
    config.devtool = "eval-source-map";
  }

  // --- Add path aliases ---
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    "@components": path.resolve(process.cwd(), "components"),
    "@public": path.resolve(process.cwd(), "public"),
    "@app": path.resolve(process.cwd(), "app"),
  };

  return config;
}
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
