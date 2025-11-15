const axios = require('axios');

// Test configuration
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3010';
const AI_SERVICE_URL = 'http://localhost:8000';

async function testConnections() {
  console.log('🔍 Testing Frontend-AI Service Connections...\n');
  
  const tests = [
    {
      name: 'AI Service Health Check',
      url: `${AI_SERVICE_URL}/health`,
      method: 'GET'
    },
    {
      name: 'AI Service Chatbot Endpoint',
      url: `${AI_SERVICE_URL}/api/chatbot/query`,
      method: 'POST',
      data: { message: 'Test connection' }
    },
    {
      name: 'Backend AI Test Endpoint',
      url: `${BACKEND_URL}/api/ai/test/chatbot`,
      method: 'POST',
      data: { message: 'Test backend connection' }
    },
    {
      name: 'Backend AI Status',
      url: `${BACKEND_URL}/api/ai/status`,
      method: 'GET'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      
      const config = {
        method: test.method,
        url: test.url,
        timeout: 5000
      };
      
      if (test.data) {
        config.data = test.data;
        config.headers = { 'Content-Type': 'application/json' };
      }
      
      const response = await axios(config);
      
      console.log(`✅ ${test.name}: SUCCESS (${response.status})`);
      if (response.data) {
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED`);
      console.log(`   Error: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        console.log(`   💡 Service may not be running on expected port`);
      }
    }
    console.log();
  }
  
  // Check if ports are in use
  console.log('📊 Port Status Check:');
  const { spawn } = require('child_process');
  
  return new Promise((resolve) => {
    const netstat = spawn('netstat', ['-an']);
    let output = '';
    
    netstat.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    netstat.on('close', () => {
      const ports = {
        3000: 'Frontend (Next.js)',
        3010: 'Backend (Express)',
        8000: 'AI Service'
      };
      
      Object.entries(ports).forEach(([port, service]) => {
        const isInUse = output.includes(`:${port}`);
        console.log(`   Port ${port} (${service}): ${isInUse ? '✅ Running' : '❌ Not running'}`);
      });
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Start missing services');
      console.log('2. Test the chatbot at: http://localhost:3000/ai/chat');
      console.log('3. Check browser console for API errors');
      console.log('4. Verify user authentication (Ultimate subscription required)');
      
      resolve();
    });
  });
}

testConnections().catch(console.error);
