const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:3010';

// Create axios instance 
const client = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    withCredentials: true
});

async function testLogoutRedirectFlow() {
    console.log('🧪 Testing Logout Redirect Flow...\n');
    console.log(`API Base: ${API_BASE}`);
    
    try {
        // Step 1: First login to get a valid session
        console.log('1. 🔐 Logging in to establish session...');
        
        const loginData = {
            email: 'test@example.com',
            password: 'testpassword123'
        };
        
        let loginResponse;
        try {
            loginResponse = await client.post('/auth/login', loginData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Login successful:');
            console.log(`   Status: ${loginResponse.status}`);
            console.log(`   User: ${loginResponse.data?.user?.email || 'N/A'}`);
            
            // Check cookies received
            const cookies = loginResponse.headers['set-cookie'];
            if (cookies) {
                console.log('   Cookies received:');
                cookies.forEach(cookie => {
                    const cookieName = cookie.split('=')[0];
                    const isHttpOnly = cookie.includes('HttpOnly');
                    const isSecure = cookie.includes('Secure');
                    console.log(`     - ${cookieName} (HttpOnly: ${isHttpOnly}, Secure: ${isSecure})`);
                });
            }
            
        } catch (loginError) {
            console.log('⚠️ Login failed (creating test user may be needed):');
            console.log(`   Status: ${loginError.response?.status || 'N/A'}`);
            console.log(`   Message: ${loginError.response?.data?.error || loginError.message}`);
            
            // Try to create a test user if login fails
            console.log('\n   Attempting to create test user...');
            try {
                const registerResponse = await client.post('/auth/register', {
                    ...loginData,
                    name: 'Test User',
                    confirmPassword: 'testpassword123'
                }, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('✅ Test user created, now logging in...');
                loginResponse = await client.post('/auth/login', loginData, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('✅ Login after registration successful');
                
            } catch (registerError) {
                console.log('❌ Both login and registration failed. Manual setup may be needed.');
                console.log(`   Register error: ${registerError.response?.data?.error || registerError.message}`);
                return;
            }
        }
        
        // Step 2: Extract token for Authorization header testing
        const token = loginResponse.data?.token;
        console.log(`\n2. 🎫 Token extracted: ${token ? `${token.substring(0, 20)}...` : 'NONE'}`);
        
        // Step 3: Test /auth/me to verify session
        console.log('\n3. 🔍 Verifying session with /auth/me...');
        
        try {
            const meResponse = await client.get('/auth/me', {
                withCredentials: true,
                headers: token ? {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                } : {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Session verified:');
            console.log(`   Status: ${meResponse.status}`);
            console.log(`   User: ${meResponse.data?.user?.email || 'N/A'}`);
            
        } catch (meError) {
            console.log('❌ Session verification failed:');
            console.log(`   Status: ${meError.response?.status || 'N/A'}`);
            console.log(`   Error: ${meError.response?.data?.error || meError.message}`);
            return;
        }
        
        // Step 4: Test logout endpoint
        console.log('\n4. 🚪 Testing logout endpoint...');
        
        try {
            const logoutResponse = await client.post('/auth/logout', {}, {
                withCredentials: true,
                maxRedirects: 0, // Don't follow redirects automatically
                validateStatus: (status) => status < 400 || status === 302 || status === 301,
                headers: token ? {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                } : {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Logout request completed:');
            console.log(`   Status: ${logoutResponse.status}`);
            console.log(`   Message: ${logoutResponse.data?.message || 'N/A'}`);
            
            // Check for redirect headers
            if (logoutResponse.status === 302 || logoutResponse.status === 301) {
                console.log('🔄 Redirect detected:');
                console.log(`   Location: ${logoutResponse.headers.location || 'N/A'}`);
            }
            
            // Check cookies cleared
            const clearCookies = logoutResponse.headers['set-cookie'];
            if (clearCookies) {
                console.log('🍪 Cookies being cleared:');
                clearCookies.forEach(cookie => {
                    console.log(`   - ${cookie}`);
                });
            }
            
        } catch (logoutError) {
            console.log('❌ Logout request failed:');
            console.log(`   Status: ${logoutError.response?.status || 'N/A'}`);
            console.log(`   Error: ${logoutError.response?.data?.error || logoutError.message}`);
            
            // Check if this is a redirect that axios couldn't handle
            if (logoutError.response?.status === 302 || logoutError.response?.status === 301) {
                console.log('🔄 This appears to be a redirect:');
                console.log(`   Location: ${logoutError.response.headers.location || 'N/A'}`);
            }
        }
        
        // Step 5: Verify session is cleared
        console.log('\n5. 🔍 Verifying session is cleared after logout...');
        
        try {
            const postLogoutMeResponse = await client.get('/auth/me', {
                withCredentials: true,
                headers: token ? {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                } : {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('⚠️ Session still active after logout (this might be expected with JWT):');
            console.log(`   Status: ${postLogoutMeResponse.status}`);
            console.log(`   User: ${postLogoutMeResponse.data?.user?.email || 'N/A'}`);
            
        } catch (postLogoutError) {
            if (postLogoutError.response?.status === 401) {
                console.log('✅ Session properly cleared - user not authenticated');
            } else {
                console.log('❓ Unexpected error checking post-logout session:');
                console.log(`   Status: ${postLogoutError.response?.status || 'N/A'}`);
                console.log(`   Error: ${postLogoutError.response?.data?.error || postLogoutError.message}`);
            }
        }
        
        console.log('\n6. 🎯 Frontend Behavior Analysis:');
        console.log('   Based on Google auth fix, the issue might be:');
        console.log('   - Frontend not properly handling logout response');
        console.log('   - Redirect happening before frontend can process');
        console.log('   - Cookie clearing not working as expected');
        console.log('   - Router.push() timing issues in AuthProvider');
        
        console.log('\n7. 🔧 Recommended Fixes:');
        console.log('   - Add setTimeout delay before router.push() like Google auth');
        console.log('   - Check if cookies are properly cleared on client-side');
        console.log('   - Ensure logout response is processed before redirect');
        console.log('   - Consider using window.location.href instead of router.push()');
        
    } catch (error) {
        console.error('❌ Test failed with unexpected error:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        }
    }
}

// Add some helper functions to test different scenarios
async function testLogoutWithoutAuth() {
    console.log('\n🧪 Testing logout without authentication...');
    
    try {
        const response = await client.post('/auth/logout', {}, {
            withCredentials: true,
            maxRedirects: 0,
            validateStatus: (status) => status < 500, // Accept all non-server-error responses
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Logout without auth result:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Message: ${response.data?.message || response.data?.error || 'N/A'}`);
        
    } catch (error) {
        console.log('❌ Logout without auth failed:');
        console.log(`   Status: ${error.response?.status || 'N/A'}`);
        console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }
}

async function main() {
    await testLogoutRedirectFlow();
    await testLogoutWithoutAuth();
    
    console.log('\n✅ Logout redirect debugging complete!');
    console.log('Check the output above for potential issues and recommended fixes.');
}

// Run the test
if (require.main === module) {
    main();
}

module.exports = { testLogoutRedirectFlow, testLogoutWithoutAuth };