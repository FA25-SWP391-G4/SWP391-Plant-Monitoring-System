// check-env.js
require('./env-loader');

console.log('=== Environment Variables Check ===');
console.log('Checking for NEXT_PUBLIC_ variables:');

// List all environment variables starting with NEXT_PUBLIC_
const nextPublicVars = Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_'));

if (nextPublicVars.length === 0) {
  console.log('❌ No NEXT_PUBLIC_ variables found');
} else {
  console.log('✅ Found', nextPublicVars.length, 'NEXT_PUBLIC_ variables:');
  nextPublicVars.forEach(key => {
    // Don't show the actual values for security
    const value = process.env[key];
    const maskedValue = value ? '✓ [value set]' : '✗ [no value]';
    console.log(`  - ${key}: ${maskedValue}`);
  });
}

// Specifically check for Google client ID
if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
  console.log('✅ NEXT_PUBLIC_GOOGLE_CLIENT_ID is set');
} else {
  console.log('❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
}

console.log('===================================')