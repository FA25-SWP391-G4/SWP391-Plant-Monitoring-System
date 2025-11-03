const axios = require('axios');

const API_BASE = 'http://localhost:3010';

async function testCookiePersistence() {
    console.log('🍪 Testing Cookie Persistence Issue...\n');
    
    try {
        // Simulate the issue: authenticate and then check if cookies work
        console.log('1. Performing regular login to get cookies...');
        
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'test@example.com',
            password: 'testpassword'
        });
        
        if (loginResponse.status === 200) {
            console.log('✅ Login successful');
            
            // Extract cookies from response
            const setCookieHeaders = loginResponse.headers['set-cookie'];
            console.log('\n2. Analyzing backend cookie setting:');
            console.log('Set-Cookie headers:', setCookieHeaders);
            
            if (setCookieHeaders) {
                setCookieHeaders.forEach((cookie, index) => {
                    console.log(`   Cookie ${index + 1}: ${cookie}`);
                    if (cookie.includes('HttpOnly')) {
                        console.log(`   ⚠️  Cookie ${index + 1} is HttpOnly - not readable by frontend JS`);
                    }
                    if (cookie.includes('Secure')) {
                        console.log(`   🔒 Cookie ${index + 1} is Secure`);
                    }
                    if (cookie.includes('SameSite')) {
                        console.log(`   🛡️  Cookie ${index + 1} has SameSite protection`);
                    }
                });
            }
            
            // Test if we can use these cookies for auth
            console.log('\n3. Testing authentication with received cookies...');
            
            if (setCookieHeaders) {
                const cookies = setCookieHeaders.join('; ');
                
                try {
                    const authCheckResponse = await axios.get(`${API_BASE}/auth/me`, {
                        headers: {
                            'Cookie': cookies
                        }
                    });
                    
                    console.log('✅ Authentication check with cookies successful');
                    console.log('   User:', authCheckResponse.data.user?.email);
                    
                } catch (authError) {
                    console.log('❌ Authentication check with cookies failed:', authError.response?.status);
                    console.log('   Error:', authError.response?.data);
                }
            }
            
            console.log('\n4. 🎯 The Issue:');
            console.log('   - Backend sets HttpOnly cookies (secure but not JS-readable)');
            console.log('   - Frontend AuthProvider tries to read cookies with js-cookie library');
            console.log('   - js-cookie can only read NON-HttpOnly cookies');
            console.log('   - On page reload, frontend loses memory state and can\'t read backend cookies');
            
            console.log('\n5. 💡 Solution Options:');
            console.log('   A. Backend also sets non-HttpOnly cookie for frontend (current approach)');
            console.log('   B. Frontend uses /auth/me endpoint to check auth instead of cookies');
            console.log('   C. Use localStorage as backup (less secure)');
            
        } else {
            console.log('❌ Login failed:', loginResponse.status);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testCookiePersistence();