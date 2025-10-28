/**
 * Test AI Authentication Integration
 * Run this script to test the authentication fixes
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3010';
const AI_SERVICE_URL = 'http://localhost:3001';

console.log('🧪 Testing AI Authentication Integration...\n');

async function testEndpoint(name, url, method = 'GET', data = null, headers = {}) {
  try {
    console.log(`Testing ${name}...`);
    
    const config = {
      method,
      url,
      timeout: 10000,
      headers
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    console.log(`✅ ${name}: ${response.status} - ${response.data.message || 'Success'}`);
    return { success: true, data: response.data };
    
  } catch (error) {
    const status = error.response?.status || 'No response';
    const message = error.response?.data?.error || error.message;
    
    if (error.response?.status === 401) {
      console.log(`🔒 ${name}: ${status} - Authentication required (expected)`);
    } else if (error.response?.status === 503) {
      console.log(`⚠️  ${name}: ${status} - Service unavailable`);
    } else {
      console.log(`❌ ${name}: ${status} - ${message}`);
    }
    
    return { success: false, error: message, status };
  }
}

async function runTests() {
  console.log('=== Testing AI Service Direct Access ===');
  
  // Test AI service health
  await testEndpoint(
    'AI Service Health',
    `${AI_SERVICE_URL}/health`
  );
  
  // Test AI service chatbot without auth (should fail)
  await testEndpoint(
    'AI Service Chatbot (no auth)',
    `${AI_SERVICE_URL}/api/chatbot`,
    'POST',
    { message: 'Hello' }
  );
  
  console.log('\n=== Testing Backend Proxy Routes ===');
  
  // Test backend health via proxy
  await testEndpoint(
    'Backend AI Health',
    `${BASE_URL}/api/ai/test/status`
  );
  
  // Test backend chatbot without auth (should fail)
  await testEndpoint(
    'Backend AI Chatbot (no auth)',
    `${BASE_URL}/api/ai/chatbot`,
    'POST',
    { message: 'Hello' }
  );
  
  // Test with mock token (will fail but shows auth forwarding works)
  await testEndpoint(
    'Backend AI Chatbot (mock auth)',
    `${BASE_URL}/api/ai/chatbot`,
    'POST',
    { message: 'Hello' },
    { 'Authorization': 'Bearer mock-token-for-testing' }
  );
  
  console.log('\n=== Test Summary ===');
  console.log('Expected results:');
  console.log('✅ Health endpoints should work (no auth required)');
  console.log('🔒 Chatbot endpoints should require authentication');
  console.log('⚠️  Some services may be unavailable if not running');
  
  console.log('\n📋 To test with real authentication:');
  console.log('1. Login to get a valid JWT token');
  console.log('2. Use the token in Authorization header');
  console.log('3. Test protected endpoints');
}

// Run the tests
runTests().catch(console.error);