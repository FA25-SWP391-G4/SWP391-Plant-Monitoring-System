// env-loader.js
const fs = require('fs');
const path = require('path');

// Fallback .env parser in case dotenv is not installed in production / CI
function parseEnvContent(content) {
  const result = {};
  const lines = content.toString().split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

// Path to the root .env file (for local development monorepo setup)
const rootEnvPath = path.resolve(__dirname, '../.env');

// Check if the local root .env file exists
if (fs.existsSync(rootEnvPath)) {
  try {
    let rootEnv;
    try {
      const dotenv = require('dotenv');
      rootEnv = dotenv.parse(fs.readFileSync(rootEnvPath));
    } catch {
      rootEnv = parseEnvContent(fs.readFileSync(rootEnvPath, 'utf8'));
    }

    // Filter for client-side variables (those starting with NEXT_PUBLIC_)
    const clientEnv = Object.fromEntries(
      Object.entries(rootEnv || {}).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
    );

    // Only set variables if not already provided by the environment (e.g. Vercel dashboard)
    Object.entries(clientEnv).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch (err) {
    console.warn('env-loader: Note loading root .env:', err.message);
  }
}