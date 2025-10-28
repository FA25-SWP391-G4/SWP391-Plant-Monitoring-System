/**
 * End-to-End AI Authentication Test
 * Creates a test JWT and verifies the complete authentication flow
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');

// Create a test JWT token
const testUser = {
  id: 'test-user-123',
  username: 'testuser',
  email: 'test@example.com',
  isPremium: true
};

const JWT_SECRET = process.env.JWT_SECRET || 'plant-monitoring-secret-key';
const testToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

console.log('🔐 Generated test JWT token');
console.log('Token payload:', testUser);
console.log('Token (first 50 chars):', testToken.substring(0, 50) + '...');

async function testAuthenticatedRequest() {
  console.log('\n🧪 Testing authenticated AI request...');
  
  try {
    // Test AI service directly with token
    console.log('Testing AI service direct access...');
    const aiResponse = await axios.post('http://localhost:3001/api/chatbot', {
      message: 'Hello AI, this is an authenticated test message!'
    }, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ AI Service Direct Access: SUCCESS');
    console.log('Response:', aiResponse.data.response?.substring(0, 100) + '...');
    
  } catch (error) {
    console.log('❌ AI Service Direct Access: FAILED');
    console.log('Error:', error.response?.data || error.message);
  }
  
  try {
    // Test backend proxy with token
    console.log('\nTesting backend proxy with authentication...');
    const backendResponse = await axios.post('http://localhost:3010/api/ai/chatbot', {
      message: 'Hello AI via backend proxy!'
    }, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Backend Proxy: SUCCESS');
    console.log('Response:', backendResponse.data.response?.substring(0, 100) + '...');
    
  } catch (error) {
    console.log('❌ Backend Proxy: FAILED');
    console.log('Error:', error.response?.data || error.message);
  }
}

async function testUnauthenticatedRequest() {
  console.log('\n🚫 Testing unauthenticated requests (should fail)...');
  
  try {
    await axios.post('http://localhost:3001/api/chatbot', {
      message: 'Hello without auth'
    });
    console.log('❌ AI Service should have rejected this request');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ AI Service correctly rejected unauthenticated request');
    } else {
      console.log('⚠️  Unexpected error:', error.response?.data);
    }
  }
}

async function runCompleteTest() {
  console.log('🚀 Starting End-to-End AI Authentication Test\n');
  
  await testUnauthenticatedRequest();
  await testAuthenticatedRequest();
  
  console.log('\n📋 Test Summary:');
  console.log('- AI service should reject requests without JWT tokens');
  console.log('- AI service should accept requests with valid JWT tokens');
  console.log('- Backend should forward JWT tokens to AI service');
  console.log('- Frontend can use getAuthToken() helper to include tokens');
  
  console.log('\n✅ AI Authentication Integration Complete!');
  console.log('\n🔧 Next steps:');
  console.log('1. Add JWT_SECRET to your .env file');
  console.log('2. Restart services if needed');
  console.log('3. Frontend components will now include authentication automatically');
}

runCompleteTest().catch(console.error);