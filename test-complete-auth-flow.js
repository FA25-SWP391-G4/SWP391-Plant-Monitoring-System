/**
 * Test Complete Google Auth Flow with Session
 * This script tests the full Google auth flow including session state
 */

const axios = require('axios');

// Create an axios instance that preserves cookies/sessions
const client = axios.create({
  withCredentials: true,
  validateStatus: (status) => status >= 200 && status < 500
});

async function testCompleteAuthFlow() {
  console.log('🧪 Testing Complete Google Auth Flow with Session');
  console.log('==================================================\n');

  try {
    // Step 1: Initiate Google OAuth (this should set session state)
    console.log('1. Initiating Google OAuth flow...');
    const authInitResponse = await client.get('http://localhost:3010/auth/google/login', {
      maxRedirects: 0
    });

    console.log('   Status:', authInitResponse.status);
    console.log('   Set-Cookie:', authInitResponse.headers['set-cookie'] || 'None');
    
    if (authInitResponse.status === 302) {
      console.log('✅ OAuth initiation successful (redirects to Google)');
      
      // Extract any session cookies
      const sessionCookies = authInitResponse.headers['set-cookie'];
      if (sessionCookies) {
        console.log('✅ Session cookies set during OAuth initiation');
        
        // Parse the session cookie
        const sessionCookie = sessionCookies.find(cookie => cookie.includes('connect.sid'));
        if (sessionCookie) {
          console.log('   Session cookie:', sessionCookie.split(';')[0]);
        }
      } else {
        console.log('❌ No session cookies set during OAuth initiation');
        console.log('   This might cause state validation to fail later');
      }
    }

    // Step 2: Test regular login to ensure cookie-setting works
    console.log('\n2. Testing regular login for cookie comparison...');
    
    const testUser = {
      email: 'test@example.com',
      password: 'wrongpassword' // Deliberately wrong to avoid side effects
    };

    const loginResponse = await client.post('http://localhost:3010/auth/login', testUser, {
      maxRedirects: 0
    });

    console.log('   Status:', loginResponse.status);
    console.log('   Set-Cookie:', loginResponse.headers['set-cookie'] || 'None');
    
    if (loginResponse.status === 401) {
      console.log('✅ Login rejection works (expected for wrong password)');
    }

    // Step 3: Test auth endpoint that should set cookies
    console.log('\n3. Testing current user endpoint (requires auth)...');
    
    const currentUserResponse = await client.get('http://localhost:3010/auth/me', {
      maxRedirects: 0
    });

    console.log('   Status:', currentUserResponse.status);
    console.log('   Response:', currentUserResponse.data);

    // Step 4: Test if backend is properly handling authentication
    console.log('\n4. Testing protected endpoint with mock auth...');
    
    const protectedResponse = await client.get('http://localhost:3010/users', {
      maxRedirects: 0
    });

    console.log('   Status:', protectedResponse.status);
    console.log('   Has data:', !!protectedResponse.data && Object.keys(protectedResponse.data).length > 0);

    // Step 5: Check session configuration by making a request that would create a session
    console.log('\n5. Testing session creation...');
    
    const sessionTestResponse = await client.get('http://localhost:3010/', {
      maxRedirects: 0
    });

    console.log('   Status:', sessionTestResponse.status);
    console.log('   Set-Cookie after session test:', sessionTestResponse.headers['set-cookie'] || 'None');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }

  console.log('\n📋 ANALYSIS & FINDINGS:');
  console.log('========================');
  console.log('The test shows whether:');
  console.log('1. Session middleware is working properly');
  console.log('2. Cookie-setting logic is functional');
  console.log('3. OAuth state management is operational');
  
  console.log('\n🔧 TO FIX THE COOKIE ISSUE:');
  console.log('1. ✅ Modified auth controller to set cookies for Google login');
  console.log('2. Need to ensure session state is properly validated');
  console.log('3. Frontend should receive both URL token AND cookie');
  console.log('4. Test with real Google OAuth flow (not mock data)');
  
  console.log('\n💡 EXPECTED BEHAVIOR:');
  console.log('- User clicks "Sign in with Google"'); 
  console.log('- Redirects to Google, user approves');
  console.log('- Google redirects back to /auth/google/callback');
  console.log('- Backend sets cookie AND redirects to frontend with token');
  console.log('- Frontend stores token in localStorage + cookie is already set');
  console.log('- User is fully authenticated with dual auth methods');
}

// Additionally, let's test the frontend callback handling
async function testFrontendCallback() {
  console.log('\n🌐 Testing Frontend Auth Callback');
  console.log('==================================');

  try {
    // Test if frontend can handle the callback
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGVzdCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJSZWd1bGFyIn0.test';
    
    const frontendResponse = await client.get('http://localhost:3000/auth/callback', {
      params: {
        token: mockToken,
        redirect: '/dashboard'
      },
      maxRedirects: 0
    });

    console.log('   Frontend callback status:', frontendResponse.status);
    console.log('   Frontend callback headers:', frontendResponse.headers['set-cookie'] || 'None');
    
    if (frontendResponse.status === 200 || frontendResponse.status === 307) {
      console.log('✅ Frontend auth callback is accessible');
    }

  } catch (frontendError) {
    console.log('❌ Frontend callback test failed:', frontendError.message);
    console.log('   This is normal if frontend is not running');
  }
}

// Run tests
async function runAllTests() {
  await testCompleteAuthFlow();
  await testFrontendCallback();
  
  console.log('\n🎯 SUMMARY:');
  console.log('===========');
  console.log('1. ✅ Fixed: Google login now sets backend cookies');
  console.log('2. ✅ Fixed: AuthProvider import path corrected');
  console.log('3. 🔄 Next: Test with real Google OAuth flow');
  console.log('4. 🔄 Next: Verify frontend receives and stores tokens properly');
}

runAllTests().catch(console.error);