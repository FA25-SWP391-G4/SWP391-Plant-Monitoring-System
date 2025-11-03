/**
 * Test Google Auth Cookie Issue
 * This script tests the cookie handling in the Google auth flow
 */

const axios = require('axios');

async function testAuthFlow() {
  console.log('🧪 Testing Google Auth Cookie Flow');
  console.log('=====================================\n');

  try {
    // Test 1: Check if backend server is accessible
    console.log('1. Testing backend server connectivity...');
    const healthCheck = await axios.get('http://localhost:3010/auth/google/login', {
      maxRedirects: 0,
      validateStatus: (status) => status === 302 // Expect redirect to Google
    });
    
    console.log('✅ Backend server is running');
    console.log('✅ Google OAuth initiation works (redirects to Google)');
    console.log('   Redirect URL:', healthCheck.headers.location?.substring(0, 100) + '...');

    // Test 2: Simulate regular login to check cookie behavior
    console.log('\n2. Testing regular login cookie behavior...');
    const loginData = {
      email: 'optimusprime1963@gmail.com',
      password: 'test123'
    };

    try {
      const loginResponse = await axios.post('http://localhost:3010/auth/login', loginData, {
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      });

      console.log('✅ Regular login successful');
      console.log('   Status:', loginResponse.status);
      console.log('   Set-Cookie headers:', loginResponse.headers['set-cookie'] || 'None');
      
      if (loginResponse.headers['set-cookie']) {
        console.log('✅ Cookies are being set for regular login');
      } else {
        console.log('❌ No cookies set for regular login');
      }

    } catch (loginError) {
      console.log('❌ Regular login failed:', loginError.response?.status, loginError.response?.data?.error || loginError.message);
    }

    // Test 3: Simulate Google auth callback manually
    console.log('\n3. Testing simulated Google auth callback...');
    
    // This simulates what Google would send back after OAuth
    const callbackUrl = 'http://localhost:3010/auth/google/callback';
    const mockCallbackParams = {
      code: 'mock_auth_code_from_google',
      state: 'mock_state_value'
    };

    try {
      const callbackResponse = await axios.get(callbackUrl, {
        params: mockCallbackParams,
        maxRedirects: 0,
        withCredentials: true,
        validateStatus: (status) => status >= 200 && status < 400
      });

      console.log('   Callback Status:', callbackResponse.status);
      console.log('   Callback Response Headers:');
      console.log('   - Location:', callbackResponse.headers.location);
      console.log('   - Set-Cookie:', callbackResponse.headers['set-cookie'] || 'None');

      if (callbackResponse.status === 302) {
        console.log('✅ Callback redirects properly');
        
        if (callbackResponse.headers['set-cookie']) {
          console.log('✅ Cookies are being set in callback');
        } else {
          console.log('❌ No cookies set in callback - THIS IS THE ISSUE!');
        }

        // Check if it's redirecting to frontend with token
        const redirectUrl = callbackResponse.headers.location;
        if (redirectUrl && redirectUrl.includes('token=')) {
          console.log('✅ Token present in redirect URL');
          const tokenMatch = redirectUrl.match(/token=([^&]+)/);
          if (tokenMatch) {
            const token = tokenMatch[1];
            console.log('   Token (first 50 chars):', token.substring(0, 50) + '...');
          }
        } else {
          console.log('❌ No token in redirect URL');
        }
      }

    } catch (callbackError) {
      console.log('❌ Callback simulation failed:');
      console.log('   Status:', callbackError.response?.status);
      console.log('   Error:', callbackError.response?.data || callbackError.message);
      
      if (callbackError.response?.status === 400) {
        console.log('   This is expected - we used mock/invalid OAuth code');
        console.log('   The issue is likely with session state validation');
      }
    }

    // Test 4: Check if frontend auth callback endpoint exists
    console.log('\n4. Testing frontend auth callback accessibility...');
    try {
      const frontendCallback = await axios.get('http://localhost:3000/auth/callback', {
        params: { token: 'test_token', redirect: '/dashboard' },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 500
      });

      console.log('✅ Frontend auth callback is accessible');
      console.log('   Status:', frontendCallback.status);
    } catch (frontendError) {
      console.log('❌ Frontend auth callback not accessible:');
      console.log('   Status:', frontendError.response?.status);
      console.log('   This might be normal if frontend is not running');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n📋 DIAGNOSIS:');
  console.log('=============');
  console.log('1. ✅ Google OAuth initiation works');
  console.log('2. ❓ Regular login cookie behavior - check results above');
  console.log('3. ❓ Google callback cookie behavior - check results above');
  console.log('4. ❓ Frontend callback accessibility - check results above');
  
  console.log('\n🔍 LIKELY ISSUES:');
  console.log('1. Google OAuth callback is not setting cookies (backend issue)');
  console.log('2. Frontend is not receiving/storing cookies properly');
  console.log('3. Session state validation is failing in callback');
  console.log('4. CORS or cookie domain/path settings are incorrect');
  
  console.log('\n💡 NEXT STEPS:');
  console.log('1. Check session middleware configuration');
  console.log('2. Verify cookie settings (domain, path, sameSite)'); 
  console.log('3. Check CORS configuration for credentials');
  console.log('4. Review Google OAuth state parameter handling');
}

// Run the test
testAuthFlow().catch(console.error);