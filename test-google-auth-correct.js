const axios = require('axios');

const API_BASE = 'http://localhost:3010';

async function testGoogleAuthFlowCorrectPath() {
    console.log('🧪 Testing Google Auth Flow with Correct Path...\n');
    
    try {
        // Test 1: Check Google auth initiation endpoint with correct path
        console.log('1. Testing Google auth initiation at /auth/google/login...');
        
        try {
            const response = await axios.get(`${API_BASE}/auth/google/login`, {
                maxRedirects: 0  // Don't follow redirects, just get the redirect URL
            });
            console.log('Unexpected success - should have redirected');
        } catch (error) {
            if (error.response && error.response.status === 302) {
                console.log('✅ Google auth redirect working');
                console.log('Redirect location:', error.response.headers.location);
                
                // Check if the redirect goes to Google
                const redirectUrl = error.response.headers.location;
                if (redirectUrl.includes('accounts.google.com')) {
                    console.log('✅ Correctly redirecting to Google OAuth');
                } else {
                    console.log('❌ Not redirecting to Google OAuth');
                    console.log('Redirect URL:', redirectUrl);
                }
            } else {
                console.log('❌ Google auth initiation failed:', error.message);
                if (error.response) {
                    console.log('Status:', error.response.status);
                    console.log('Data:', error.response.data);
                }
            }
        }
        
        // Test 2: Test the callback endpoint too
        console.log('\n2. Testing callback endpoint...');
        
        try {
            const response = await axios.get(`${API_BASE}/auth/google/callback`);
            console.log('Unexpected success from callback');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Callback endpoint exists (returns 400 as expected without params)');
            } else {
                console.log('❌ Callback endpoint failed:', error.message);
                if (error.response) {
                    console.log('Status:', error.response.status);
                    console.log('Data:', error.response.data);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testGoogleAuthFlowCorrectPath();