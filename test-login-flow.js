const axios = require('axios');

const API_BASE = 'http://localhost:3010';

async function testLoginFlow() {
    console.log('🧪 Testing Login Flow with Debugging...\n');
    
    try {
        // Test login with the test user we just created
        console.log('1. Testing login with test user...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'test@example.com',
            password: 'testpassword'
        });
        
        console.log('✅ Login successful');
        console.log('Response structure:', {
            success: loginResponse.data.success,
            hasUser: !!loginResponse.data.data?.user,
            hasToken: !!loginResponse.data.data?.token,
            userFields: Object.keys(loginResponse.data.data?.user || {}),
            tokenLength: loginResponse.data.data?.token?.length
        });
        
        const userData = loginResponse.data.data?.user;
        console.log('\nUser Data Details:');
        console.log('  - id:', userData?.id);
        console.log('  - user_id:', userData?.user_id);
        console.log('  - email:', userData?.email);
        console.log('  - isPremium:', userData?.isPremium);
        console.log('  - role:', userData?.role);
        console.log('  - full_name:', userData?.full_name);
        
        // Test 2: Test current user endpoint with token
        console.log('\n2. Testing getCurrentUser endpoint...');
        const token = loginResponse.data.data.token;
        
        const currentUserResponse = await axios.get(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Current user check successful');
        const currentUserData = currentUserResponse.data.user;
        console.log('\nCurrent User Data Details:');
        console.log('  - id:', currentUserData?.id);
        console.log('  - user_id:', currentUserData?.user_id);
        console.log('  - email:', currentUserData?.email);
        console.log('  - isPremium:', currentUserData?.isPremium);
        console.log('  - role:', currentUserData?.role);
        console.log('  - full_name:', currentUserData?.full_name);
        
        // Test 3: Test with cookies
        console.log('\n3. Testing cookie-based authentication...');
        const cookieHeader = loginResponse.headers['set-cookie'];
        console.log('Login response cookies:', cookieHeader);
        
        if (cookieHeader) {
            const cookies = cookieHeader.join('; ');
            const cookieUserResponse = await axios.get(`${API_BASE}/auth/me`, {
                headers: {
                    'Cookie': cookies
                }
            });
            console.log('✅ Cookie-based auth successful');
        } else {
            console.log('ℹ️  No cookies set in login response');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
    }
}

// Run the test
testLoginFlow();