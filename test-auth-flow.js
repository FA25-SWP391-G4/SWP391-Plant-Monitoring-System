const axios = require('axios');

const API_BASE = 'http://localhost:3010';

async function testAuthFlow() {
    console.log('🧪 Testing Authentication Flow...\n');
    
    try {
        // Test 1: Check if backend is running
        console.log('1. Testing backend connection...');
        const healthCheck = await axios.get(`${API_BASE}/health`);
        console.log('✅ Backend is running\n');
        
        // Test 2: Test login with a dummy user
        console.log('2. Testing login endpoint...');
        try {
            const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
                email: 'test@example.com',
                password: 'testpassword'
            });
            
            console.log('✅ Login successful');
            console.log('User data received:', loginResponse.data.data?.user);
            console.log('Token length:', loginResponse.data.data?.token?.length);
            
            // Test 3: Test current user endpoint with token
            console.log('\n3. Testing getCurrentUser endpoint...');
            const token = loginResponse.data.data.token;
            
            const currentUserResponse = await axios.get(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('✅ Current user check successful');
            console.log('Current user data:', currentUserResponse.data.user);
            
        } catch (loginError) {
            if (loginError.response?.status === 401) {
                console.log('ℹ️  Login failed (expected for test user) - checking registration...');
                
                // Test registration instead
                const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
                    email: 'test@example.com',
                    password: 'testpassword',
                    given_name: 'Test',
                    family_name: 'User'
                });
                
                console.log('✅ Registration successful');
                console.log('User data:', registerResponse.data.data?.user);
            } else {
                throw loginError;
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testAuthFlow();