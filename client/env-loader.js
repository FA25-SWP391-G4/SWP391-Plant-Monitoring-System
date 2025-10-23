<<<<<<< HEAD
// env-loader.js
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Path to the root .env file
const rootEnvPath = path.resolve(__dirname, '../.env');

// Check if the file exists
if (fs.existsSync(rootEnvPath)) {
  console.log('Loading environment variables from root .env file:', rootEnvPath);
  
  // Parse the .env file
  const rootEnv = dotenv.parse(fs.readFileSync(rootEnvPath));
  
  // Filter for client-side variables (those starting with NEXT_PUBLIC_)
  const clientEnv = Object.fromEntries(
    Object.entries(rootEnv).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
  );
  
  // Log the variables being loaded (but not their values for security)
  console.log('Client-side environment variables loaded:', Object.keys(clientEnv));
  
  // Set each client variable in the process.env
=======
/**
 * env-loader.js
 * Loads environment variables from the root `.env` file before Next.js starts.
 * Filters only NEXT_PUBLIC_* variables to avoid leaking secrets.
 */

const fs = require("fs");
const path = require("path");

let dotenv;
try {
  dotenv = require("dotenv");
} catch (err) {
  console.warn("⚠️ dotenv not found. Please install it with `npm install dotenv`");
  process.exit(1);
}

// Path to root-level .env file (one level above /client)
const rootEnvPath = path.resolve(__dirname, "../.env");

// Check if .env exists
if (fs.existsSync(rootEnvPath)) {
  console.log("✅ Loading environment variables from:", rootEnvPath);

  const rootEnv = dotenv.parse(fs.readFileSync(rootEnvPath));

  // Only allow NEXT_PUBLIC_ variables to reach the client
  const clientEnv = Object.fromEntries(
    Object.entries(rootEnv).filter(([key]) => key.startsWith("NEXT_PUBLIC_"))
  );

  // Log which variables are loaded (not their values)
  console.log("🔑 Loaded client variables:", Object.keys(clientEnv));

  // Apply them to process.env
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
  Object.entries(clientEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });
} else {
<<<<<<< HEAD
  console.warn('Root .env file not found at:', rootEnvPath);
}
=======
  console.warn("⚠️ No .env file found at:", rootEnvPath);
}
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
