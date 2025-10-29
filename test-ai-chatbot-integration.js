/**
 * Comprehensive AI Chatbot Integration Test
 * Tests the complete flow from frontend to AI service with multi-language support
 */

const axios = require('axios');
const { testToken } = require('./generate-test-jwt');

const AI_SERVICE_URL = 'http://localhost:3001';
const BACKEND_URL = 'http://localhost:8080';

// Test configurations
const testScenarios = [
  {
    name: 'Vietnamese plant care question',
    message: 'Cây của tôi có lá vàng, tôi nên làm gì?',
    expectedLanguage: 'vi',
    description: 'Vietnamese question about yellow leaves should trigger Vietnamese response'
  },
  {
    name: 'English sensor data question', 
    message: 'What does the current sensor data tell me about my plant?',
    expectedLanguage: 'en',
    description: 'English question should trigger English response with sensor analysis'
  },
  {
    name: 'Mixed language question',
    message: 'My plant has độ ẩm thấp, what should I do?',
    expectedLanguage: 'en', // Should default to English for mixed
    description: 'Mixed language should default to English'
  }
];

async function testAIServiceHealth() {
  console.log('🔍 Testing AI Service Health...');
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`);
    console.log('✅ AI Service health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ AI Service health check failed:', error.message);
    return false;
  }
}

async function testLanguageDetection() {
  console.log('\n🌐 Testing Language Detection...');
  
  for (const scenario of testScenarios) {
    console.log(`\n📝 Testing: ${scenario.name}`);
    console.log(`Message: "${scenario.message}"`);
    
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/chatbot`, {
        message: scenario.message,
        userId: 'test-user-123',
        sessionId: `test-session-${Date.now()}`
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}` // Valid JWT for testing
        }
      });
      
      console.log('✅ Response received:', {
        status: response.status,
        responseLength: response.data.response?.length || 0,
        detectedLanguage: response.data.detectedLanguage || 'not specified'
      });
      
      if (response.data.response) {
        console.log('📄 AI Response preview:', response.data.response.substring(0, 100) + '...');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.response?.data || error.message);
    }
  }
}

async function testAuthenticationFlow() {
  console.log('\n🔐 Testing Authentication Flow...');
  
  try {
    // Test with missing auth header
    const noAuthResponse = await axios.post(`${AI_SERVICE_URL}/api/chatbot`, {
      message: 'Test message',
      userId: 'test-user'
    }).catch(err => err.response);
    
    console.log('📍 No auth header response:', {
      status: noAuthResponse?.status,
      message: noAuthResponse?.data?.error
    });
    
    // Test with invalid JWT
    const invalidAuthResponse = await axios.post(`${AI_SERVICE_URL}/api/chatbot`, {
      message: 'Test message', 
      userId: 'test-user'
    }, {
      headers: {
        'Authorization': 'Bearer invalid-jwt'
      }
    }).catch(err => err.response);
    
    console.log('📍 Invalid JWT response:', {
      status: invalidAuthResponse?.status,
      message: invalidAuthResponse?.data?.error
    });
    
  } catch (error) {
    console.error('❌ Auth test error:', error.message);
  }
}

async function testContextGeneration() {
  console.log('\n🌱 Testing Context Generation with Mock Data...');
  
  const mockPlantData = {
    name: 'Test Tomato Plant',
    type: 'tomato',
    optimal_temperature: 25,
    optimal_moisture: 60,
    optimal_light: 8000
  };
  
  const mockSensorData = {
    temperature: 28,
    moisture: 45,
    humidity: 65,
    light: 6000,
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/chatbot`, {
      message: 'Analyze my plant data',
      userId: 'test-user-123',
      context: {
        plantInfo: mockPlantData,
        sensorData: mockSensorData,
        wateringHistory: [
          { timestamp: new Date(Date.now() - 86400000), amount: 200 },
          { timestamp: new Date(Date.now() - 172800000), amount: 150 }
        ]
      }
    }, {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    console.log('✅ Context test response:', {
      status: response.status,
      hasResponse: !!response.data.response,
      detectedLanguage: response.data.detectedLanguage
    });
    
    if (response.data.response) {
      console.log('📊 Context-aware response preview:', response.data.response.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.error('❌ Context test failed:', error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive AI Chatbot Integration Tests\n');
  console.log('=' .repeat(60));
  
  // Test 1: Health check
  const healthOk = await testAIServiceHealth();
  if (!healthOk) {
    console.log('⚠️  AI Service not healthy - some tests may fail');
  }
  
  // Test 2: Language detection and responses
  await testLanguageDetection();
  
  // Test 3: Authentication
  await testAuthenticationFlow();
  
  // Test 4: Context generation
  await testContextGeneration();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 All tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Open http://localhost:3000 in browser');
  console.log('2. Login as premium user');
  console.log('3. Test the AI chatbot popup');
  console.log('4. Try both Vietnamese and English questions');
  console.log('5. Verify intelligent responses vs previous mock responses');
}

// Run tests
runAllTests().catch(console.error);