const axios = require('axios');

const API_BASE = 'http://localhost:3010';

async function testImprovedAuthFlow() {
    console.log('🔐 Testing Improved Auth Flow...\n');
    
    try {
        // Step 1: Login to get cookies
        console.log('1. Performing login to establish session...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'test@example.com',
            password: 'testpassword'
        });
        
        if (loginResponse.status !== 200) {
            console.log('❌ Login failed');
            return;
        }
        
        console.log('✅ Login successful');
        const setCookieHeaders = loginResponse.headers['set-cookie'];
        console.log('   Cookies set:', setCookieHeaders?.length || 0);
        
        // Step 2: Test /auth/me with httpOnly cookies (simulating browser behavior)
        console.log('\n2. Testing /auth/me with httpOnly cookies...');
        
        if (setCookieHeaders) {
            const cookies = setCookieHeaders.join('; ');
            
            try {
                const authResponse = await axios.get(`${API_BASE}/auth/me`, {
                    headers: {
                        'Cookie': cookies
                    }
                });
                
                console.log('✅ /auth/me works with httpOnly cookies!');
                console.log('   Status:', authResponse.status);
                console.log('   User:', authResponse.data.user?.email);
                console.log('   Has isPremium field:', 'isPremium' in authResponse.data.user);
                
            } catch (error) {
                console.log('❌ /auth/me failed with cookies:', error.response?.status);
                console.log('   Error:', error.response?.data);
            }
        }
        
        // Step 3: Test /auth/me without any authentication (should fail)
        console.log('\n3. Testing /auth/me without authentication...');
        try {
            const noAuthResponse = await axios.get(`${API_BASE}/auth/me`);
            console.log('⚠️  Unexpected success without auth:', noAuthResponse.status);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly rejected unauthenticated request');
            } else {
                console.log('❌ Unexpected error:', error.response?.status);
            }
        }
        
        console.log('\n4. 🎯 Expected Frontend Behavior:');
        console.log('   - AuthProvider calls /auth/me with credentials: "include"');
        console.log('   - Browser automatically sends httpOnly cookies');
        console.log('   - Backend validates using cookie-based auth middleware');
        console.log('   - No need for frontend to read cookies manually');
        console.log('   - Auth state persists through page reloads');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testImprovedAuthFlow();