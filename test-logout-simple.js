const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:3010';

async function testLogoutWithExistingUser() {
    console.log('🧪 Testing Logout Redirect with Browser Simulation...\n');
    console.log(`API Base: ${API_BASE}`);
    
    // Test the logout endpoint directly without authentication first
    console.log('1. 🚪 Testing logout endpoint without authentication...');
    
    try {
        const logoutResponse = await axios.post(`${API_BASE}/auth/logout`, {}, {
            withCredentials: true,
            maxRedirects: 0,
            validateStatus: (status) => status < 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Logout without auth result:');
        console.log(`   Status: ${logoutResponse.status}`);
        console.log(`   Response: ${JSON.stringify(logoutResponse.data, null, 2)}`);
        
    } catch (error) {
        console.log('📊 Logout without auth error (expected):');
        console.log(`   Status: ${error.response?.status || 'N/A'}`);
        console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }
    
    // Test with a fake token to see how the backend handles it
    console.log('\n2. 🎫 Testing logout with fake token...');
    
    try {
        const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        
        const logoutWithFakeTokenResponse = await axios.post(`${API_BASE}/auth/logout`, {}, {
            withCredentials: true,
            maxRedirects: 0,
            validateStatus: (status) => status < 500,
            headers: {
                'Authorization': `Bearer ${fakeToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Logout with fake token result:');
        console.log(`   Status: ${logoutWithFakeTokenResponse.status}`);
        console.log(`   Response: ${JSON.stringify(logoutWithFakeTokenResponse.data, null, 2)}`);
        
        // Check for any redirect headers
        if (logoutWithFakeTokenResponse.headers.location) {
            console.log(`   Redirect Location: ${logoutWithFakeTokenResponse.headers.location}`);
        }
        
    } catch (error) {
        console.log('📊 Logout with fake token error:');
        console.log(`   Status: ${error.response?.status || 'N/A'}`);
        console.log(`   Error: ${error.response?.data?.error || error.message}`);
        
        // Check if this is a redirect
        if (error.response?.status === 302 || error.response?.status === 301) {
            console.log(`   Redirect Location: ${error.response.headers.location || 'N/A'}`);
        }
    }
    
    console.log('\n3. 🔍 Analyzing Frontend vs Backend Flow...');
    console.log('   Current AuthProvider logout flow:');
    console.log('   1. Calls /auth/logout endpoint');
    console.log('   2. Clears cookies (token_client, token, token_httpOnly)');
    console.log('   3. Clears localStorage and sessionStorage');
    console.log('   4. Sets user/token state to null');
    console.log('   5. Calls router.push("/login")');
    
    console.log('\n4. 🎯 Google Auth Fix Reference Analysis...');
    
    // Let me check what the Google auth fix looked like
    try {
        const googleCallbackTest = await axios.get(`${API_BASE}/auth/google/callback`, {
            maxRedirects: 0,
            validateStatus: (status) => status < 500
        });
        
        console.log('   Google callback test (for reference):');
        console.log(`   Status: ${googleCallbackTest.status}`);
        
    } catch (error) {
        console.log('   Google callback test (for reference):');
        console.log(`   Status: ${error.response?.status || 'N/A'}`);
        console.log(`   Error: ${error.response?.data?.error || error.message}`);
        
        if (error.response?.status === 302) {
            console.log(`   Redirect: ${error.response.headers.location || 'N/A'}`);
        }
    }
    
    console.log('\n5. 🔧 Suspected Issues and Solutions:');
    console.log('   Issue 1: Timing - router.push() happens too quickly');
    console.log('   Solution: Add setTimeout delay before redirect');
    console.log('   ');
    console.log('   Issue 2: Cookie clearing not completing before redirect');
    console.log('   Solution: Use window.location.href for hard redirect');
    console.log('   ');
    console.log('   Issue 3: State updates not finishing before redirect');
    console.log('   Solution: Wait for state updates to complete');
    console.log('   ');
    
    console.log('\n6. 📝 Recommended Fix (based on Google auth pattern):');
    console.log(`
   const logout = async () => {
     console.log('[AUTH PROVIDER] Logout initiated');
     
     try {
       // Call logout endpoint
       const response = await fetch('/auth/logout', { ... });
       console.log('[AUTH PROVIDER] Logout response:', response.status);
     } catch (error) {
       console.error('[AUTH PROVIDER] Logout error:', error);
     } finally {
       // Clear all auth data
       Cookies.remove('token_client');
       Cookies.remove('token');
       Cookies.remove('token_httpOnly');
       
       // Clear storage
       localStorage.removeItem('plantsmart_user');
       sessionStorage.removeItem('plantsmart_user');
       
       // Clear state
       setToken(null);
       setUser(null);
       
       // Add delay before redirect (like Google auth fix)
       setTimeout(() => {
         console.log('[AUTH PROVIDER] Redirecting to login...');
         window.location.href = '/login'; // Hard redirect instead of router.push
       }, 100); // Small delay to let cleanup finish
     }
   };
    `);
}

testLogoutWithExistingUser();