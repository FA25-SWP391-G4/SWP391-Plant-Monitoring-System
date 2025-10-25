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
}

/** @type {import('next').NextConfig} */
const nextConfig = {
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