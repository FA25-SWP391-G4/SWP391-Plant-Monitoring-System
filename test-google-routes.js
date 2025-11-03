const axios = require('axios');

const API_BASE = 'http://localhost:3010';

async function testGoogleOAuthRoutes() {
    console.log('🧪 Testing Google OAuth Routes...\n');
    
    try {
        // Test 1: Check if Google login initiation route exists
        console.log('1. Testing Google OAuth initiation route...');
        try {
            const response = await axios.get(`${API_BASE}/auth/google/login`, {
                maxRedirects: 0,  // Don't follow redirects so we can see the redirect URL
                validateStatus: (status) => status < 400 || status === 302  // Accept redirects
            });
            
            if (response.status === 302) {
                console.log('✅ Google OAuth login route works - got redirect to:', response.headers.location);
            } else {
                console.log('✅ Google OAuth login route accessible');
            }
        } catch (error) {
            if (error.response?.status === 302) {
                console.log('✅ Google OAuth login route works - got redirect to:', error.response.headers.location);
            } else {
                console.log('❌ Google OAuth login route failed:', error.response?.status, error.message);
            }
        }
        
        // Test 2: Check if callback route exists (without valid code, should error appropriately)
        console.log('\n2. Testing Google OAuth callback route...');
        try {
            const response = await axios.get(`${API_BASE}/auth/google/callback`);
            console.log('✅ Callback route accessible, response:', response.status);
        } catch (error) {
            if (error.response?.status === 400 || error.response?.status === 401) {
                console.log('✅ Callback route exists and properly rejects invalid requests:', error.response.status);
                console.log('   Error message:', error.response.data?.error || error.response.data);
            } else {
                console.log('❌ Callback route failed unexpectedly:', error.response?.status, error.message);
            }
        }
        
        // Test 3: Check conflicting routes to ensure they're not duplicated
        console.log('\n3. Testing for route conflicts...');
        
        // These should NOT exist anymore (removed from auth.js)
        const conflictRoutes = [
            '/auth/google/login',
            '/auth/google/callback'
        ];
        
        for (const route of conflictRoutes) {
            try {
                const response = await axios.get(`${API_BASE}${route}`, {
                    maxRedirects: 0,
                    validateStatus: (status) => status < 500  // Accept all responses except server errors
                });
                console.log(`⚠️  Potential conflict: ${route} still accessible`);
            } catch (error) {
                if (error.response?.status === 404) {
                    console.log(`✅ Good: Old route ${route} properly removed`);
                } else if (error.response?.status === 302) {
                    console.log(`⚠️  Potential conflict: ${route} redirects to:`, error.response.headers.location);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testGoogleOAuthRoutes();