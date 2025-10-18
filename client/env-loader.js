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
  Object.entries(clientEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });
} else {
  console.warn('Root .env file not found at:', rootEnvPath);
}