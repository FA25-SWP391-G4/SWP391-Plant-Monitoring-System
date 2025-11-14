const axios = require('axios');

async function testAuthFlow() {
  console.log('🔍 Testing Authentication Flow...\n');
  
  const FRONTEND = 'http://localhost:3000';
  const BACKEND = 'http://localhost:3001';
  
  try {
    // 1. Test frontend is running
    console.log('1. Testing frontend...');
    const frontendResponse = await axios.get(FRONTEND, { timeout: 5000 });
    console.log(`✅ Frontend: ${frontendResponse.status} OK`);
    
    // 2. Test backend login
    console.log('\n2. Testing backend login...');
    const loginResponse = await axios.post(`${BACKEND}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ Backend login: Success');
      console.log(`   Token: ${token.substring(0, 20)}...`);
      
      // 3. Test AI endpoints with token
      console.log('\n3. Testing AI endpoints...');
      
      const aiTests = [
        {
          name: 'Chatbot',
          url: `${BACKEND}/api/ai/chatbot`,
          data: { message: 'Hello AI' }
        },
        {
          name: 'Watering Prediction', 
          url: `${BACKEND}/api/ai/watering-prediction`,
          data: {
            plant_id: 1,
            sensor_data: { moisture: 30, temperature: 25, humidity: 60, light: 70 }
          }
        }
      ];
      
      for (const test of aiTests) {
        try {
          const response = await axios.post(test.url, test.data, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`✅ ${test.name}: Working`);
        } catch (error) {
          console.log(`❌ ${test.name}: ${error.response?.status || error.message}`);
        }
      }
      
      // 4. Test frontend pages (would need browser for full test)
      console.log('\n4. Frontend AI pages status:');
      const aiPages = ['/ai/chat', '/ai/image-analysis', '/ai/predictions'];
      
      for (const page of aiPages) {
        try {
          const response = await axios.get(`${FRONTEND}${page}`, { 
            timeout: 3000,
            validateStatus: (status) => status < 500 // Accept redirects
          });
          
          if (response.status === 200) {
            console.log(`✅ ${page}: Accessible`);
          } else if (response.status === 307 || response.status === 302) {
            console.log(`⚠️  ${page}: Redirects (need login)`);
          } else {
            console.log(`❌ ${page}: ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ ${page}: ${error.message}`);
        }
      }
      
    } else {
      console.log('❌ Backend login: Failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n📋 Manual Test Instructions:');
  console.log('1. Open browser: http://localhost:3000');
  console.log('2. Login with: test@example.com / password123');
  console.log('3. Try AI pages:');
  console.log('   - http://localhost:3000/ai/chat');
  console.log('   - http://localhost:3000/ai/image-analysis');
  console.log('   - http://localhost:3000/ai/predictions');
}

testAuthFlow();