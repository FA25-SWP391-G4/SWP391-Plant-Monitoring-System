<<<<<<< HEAD
// Import custom webpack configuration
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from root .env
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('./env-loader');

// Dynamically load webpack config
let customizeWebpack = (config) => config; // Default is a pass-through function

// Check if webpack config file exists
const webpackConfigPath = path.join(__dirname, 'next.config.webpack.js');
if (fs.existsSync(webpackConfigPath)) {
  try {
    // For CommonJS modules in ESM context
    const requireModule = await import('module');
    const require = requireModule.default.createRequire(import.meta.url);
    customizeWebpack = require('./next.config.webpack.js');
  } catch (err) {
    console.error('Error loading webpack config:', err);
  }
=======
// ===============================
// ✅ Fixed Next.js 14+ configuration
// ===============================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load environment variables from root .env
require("./env-loader.js");

// Default webpack passthrough
let customizeWebpack = (config) => config;

// Try loading optional custom webpack config if it exists
const webpackConfigPath = path.join(__dirname, "next.config.webpack.js");
if (fs.existsSync(webpackConfigPath)) {
  try {
    const webpackModule = require("./next.config.webpack.js");
    // ✅ Support both default and named export styles
    customizeWebpack = webpackModule.default || webpackModule;
    console.log("🧩 Custom webpack config loaded successfully.");
  } catch (err) {
    console.error("⚠️ Error loading webpack config:", err);
  }
} else {
  console.log("ℹ️ No custom webpack config found — skipping.");
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
}

/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, options) => {
    // Apply custom webpack configuration
    return customizeWebpack(config, options);
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.gstatic.com", "https://apis.google.com"],
      // other directives...
    }
  }
}

export default nextConfig
=======
  // --- ✅ Compiler / Lint options ---
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // --- ✅ Image optimization ---
  images: {
    unoptimized: true,
    domains: ["localhost", "res.cloudinary.com"],
  },

  // --- ✅ Environment variables ---
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // --- ✅ API Rewrites ---
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`, // ensure it's a valid URL
      },
    ];
  },

  // --- ✅ Webpack customization ---
  webpack: (config, options) => {
    const updatedConfig = customizeWebpack(config, options);
    return updatedConfig;
  },
};

export default nextConfig;
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
