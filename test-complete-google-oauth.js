const axios = require('axios');
const { google } = require('googleapis');

const API_BASE = 'http://localhost:3010';

async function testCompleteGoogleOAuth() {
    console.log('🧪 Testing Complete Google OAuth Flow...\n');
    
    try {
        // Step 1: Get the Google OAuth URL
        console.log('1. Getting Google OAuth authorization URL...');
        const authResponse = await axios.get(`${API_BASE}/auth/google/login`, {
            maxRedirects: 0,
            validateStatus: (status) => status < 400 || status === 302
        });
        
        if (authResponse.status === 302) {
            const authUrl = authResponse.headers.location;
            console.log('✅ Got authorization URL:');
            console.log(`   ${authUrl.substring(0, 100)}...`);
            
            // Parse the URL to get parameters
            const url = new URL(authUrl);
            const clientId = url.searchParams.get('client_id');
            const redirectUri = url.searchParams.get('redirect_uri');
            const state = url.searchParams.get('state');
            
            console.log('\n2. Authorization URL Details:');
            console.log(`   - Client ID: ${clientId}`);
            console.log(`   - Redirect URI: ${redirectUri}`);
            console.log(`   - State: ${state}`);
            console.log(`   - Scopes: ${decodeURIComponent(url.searchParams.get('scope'))}`);
            
            // Step 2: Test callback route with missing parameters
            console.log('\n3. Testing callback route with missing parameters...');
            try {
                const callbackResponse = await axios.get(`${API_BASE}/auth/google/callback`);
            } catch (error) {
                if (error.response?.status >= 400) {
                    console.log(`✅ Callback correctly rejects missing parameters: ${error.response.status}`);
                    console.log(`   Error: ${error.response.data?.error || JSON.stringify(error.response.data)}`);
                } else {
                    console.log(`❌ Unexpected callback response: ${error.response?.status}`);
                }
            }
            
            // Step 3: Test callback route with invalid parameters
            console.log('\n4. Testing callback route with invalid parameters...');
            try {
                const callbackResponse = await axios.get(`${API_BASE}/auth/google/callback?code=invalid&state=${state}`);
            } catch (error) {
                if (error.response?.status >= 400) {
                    console.log(`✅ Callback correctly rejects invalid code: ${error.response.status}`);
                    console.log(`   Error: ${error.response.data?.error || JSON.stringify(error.response.data)}`);
                } else {
                    console.log(`❌ Unexpected callback response: ${error.response?.status}`);
                }
            }
            
            console.log('\n5. 🎯 Next Steps for Manual Testing:');
            console.log('   1. Open this URL in a browser (be sure backend is running):');
            console.log(`      ${authUrl}`);
            console.log('   2. Complete Google OAuth in browser');
            console.log('   3. Check backend logs for callback processing');
            console.log('   4. Verify frontend receives authentication token');
            
        } else {
            console.log('❌ Expected redirect to Google, got status:', authResponse.status);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Headers:', error.response.headers);
        }
    }
}

// Run the test
testCompleteGoogleOAuth();