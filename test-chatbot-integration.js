const axios = require('axios');

// Test configuration
const MAIN_APP_URL = 'http://localhost:3010';
const AI_SERVICE_URL = 'http://localhost:8000';

async function testAIService() {
  console.log('🔍 Testing AI Service Health...');
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`);
    console.log('✅ AI Service Health:', response.data);
    return true;
  } catch (error) {
    console.log('❌ AI Service not available:', error.message);
    return false;
  }
}

async function testChatbotEndpoint() {
  console.log('🔍 Testing Chatbot Endpoint...');
  
  // Test the AI service directly
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/chatbot/query`, {
      message: 'Hello, how often should I water my plants?'
    });
    console.log('✅ Direct AI Service Chatbot Response:', response.data);
  } catch (error) {
    console.log('❌ Direct AI Service Chatbot Error:', error.message);
  }

  // Test through main app
  try {
    const response = await axios.post(`${MAIN_APP_URL}/api/ai/test/chatbot`, {
      message: 'Test message through main app'
    });
    console.log('✅ Main App Test Chatbot Response:', response.data);
  } catch (error) {
    console.log('❌ Main App Test Chatbot Error:', error.message);
  }
}

async function checkPorts() {
  console.log('🔍 Checking port availability...');
  
  const { spawn } = require('child_process');
  
  return new Promise((resolve) => {
    const netstat = spawn('netstat', ['-an']);
    let output = '';
    
    netstat.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    netstat.on('close', (code) => {
      const port3010 = output.includes(':3010');
      const port8000 = output.includes(':8000');
      
      console.log(`📊 Port 3010 (Main App): ${port3010 ? '✅ In use' : '❌ Not in use'}`);
      console.log(`📊 Port 8000 (AI Service): ${port8000 ? '✅ In use' : '❌ Not in use'}`);
      
      resolve({ port3010, port8000 });
    });
  });
}

async function main() {
  console.log('🚀 Starting AI Chatbot Integration Test...\n');
  
  // Check ports first
  const ports = await checkPorts();
  console.log();
  
  // Test AI service
  const aiServiceAvailable = await testAIService();
  console.log();
  
  // Test chatbot endpoints
  await testChatbotEndpoint();
  console.log();
  
  // Summary
  console.log('📋 Test Summary:');
  console.log(`- Main App (Port 3010): ${ports.port3010 ? '✅ Running' : '❌ Not running'}`);
  console.log(`- AI Service (Port 8000): ${ports.port8000 ? '✅ Running' : '❌ Not running'}`);
  console.log(`- AI Service Health: ${aiServiceAvailable ? '✅ Healthy' : '❌ Unhealthy'}`);
  
  if (!ports.port3010) {
    console.log('\n💡 To start the main app: cd [project] && npm start');
  }
  
  if (!ports.port8000) {
    console.log('💡 To start the AI service: cd [project]/ai_service && node app.js');
    console.log('   Or use the test service: cd [project] && node test-ai-service.js');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Ensure both services are running');
  console.log('2. Test the chatbot through the web interface at http://localhost:3000/ai/chat');
  console.log('3. Check browser console for any API errors');
}

main().catch(console.error);
