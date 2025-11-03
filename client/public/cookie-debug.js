// Debug cookie storage in browser console
// Run this in the browser console on localhost:3000

console.log('🍪 Cookie Debugging Tool');
console.log('=======================');

// Method 1: Using document.cookie (raw browser API)
console.log('\n1. Raw document.cookie:');
console.log(document.cookie);

// Method 2: Parse cookies manually
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [key, value] = cookie.trim().split('=');
  if (key && value) {
    acc[key] = value;
  }
  return acc;
}, {});

console.log('\n2. Parsed cookies object:');
console.log(cookies);

// Method 3: Check if js-cookie can find the token
try {
  const jsCookieLib = window.Cookies || (window.require && window.require('js-cookie'));
  if (jsCookieLib) {
    console.log('\n3. js-cookie library results:');
    console.log('   - All cookies:', jsCookieLib.get());
    console.log('   - Token specifically:', jsCookieLib.get('token'));
  } else {
    console.log('\n3. js-cookie library not found in window');
  }
} catch (e) {
  console.log('\n3. Error accessing js-cookie:', e.message);
}

// Method 4: Check localStorage as backup
console.log('\n4. LocalStorage check:');
console.log('   - Token in localStorage:', localStorage.getItem('token'));

// Method 5: Check current domain and path
console.log('\n5. Current page info:');
console.log('   - Domain:', window.location.hostname);
console.log('   - Port:', window.location.port);
console.log('   - Full origin:', window.location.origin);
console.log('   - Path:', window.location.pathname);

// Method 6: Manual cookie inspection
console.log('\n6. Manual cookie analysis:');
const allCookies = document.cookie.split(';');
allCookies.forEach((cookie, index) => {
  const trimmed = cookie.trim();
  console.log(`   Cookie ${index + 1}: "${trimmed}"`);
  if (trimmed.startsWith('token=')) {
    console.log(`   ✅ Found token cookie: ${trimmed.substring(0, 50)}...`);
  }
});

console.log('\n🔍 Copy and paste this entire output to help debug the cookie issue!');