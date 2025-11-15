// Simple verification script for AI chatbot
const http = require('http');

function testService(port, path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: path.includes('query') ? 'POST' : 'GET',
      headers: path.includes('query') ? { 'Content-Type': 'application/json' } : {}
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`${description}: ${res.statusCode === 200 ? '✅ OK' : '❌ Failed'}`);
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log(`Response: ${JSON.stringify(parsed).substring(0, 100)}...`);
          } catch (e) {
            console.log(`Response: ${data.substring(0, 100)}...`);
          }
        }
        resolve(res.statusCode === 200);
      });
    });

    req.on('error', () => {
      console.log(`${description}: ❌ Connection failed`);
      resolve(false);
    });

    if (path.includes('query')) {
      req.write(JSON.stringify({ message: 'Test message' }));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🔍 Verifying AI Chatbot System...\n');
  
  const results = [];
  
  // Test AI Service Health
  results.push(await testService(8000, '/health', 'AI Service Health Check'));
  
  // Test AI Chatbot Endpoint
  results.push(await testService(8000, '/api/chatbot/query', 'AI Chatbot Query'));
  
  // Test Main App (if running)
  results.push(await testService(3010, '/api/ai/test/chatbot', 'Main App Test Endpoint'));
  
  console.log('\n📋 Summary:');
  console.log(`✅ Passed: ${results.filter(r => r).length}/${results.length} tests`);
  
  if (results.every(r => r)) {
    console.log('\n🎉 AI Chatbot system is ready!');
    console.log('📱 Access the chatbot at: http://localhost:3000/ai/chat');
    console.log('🔧 AI Service running on: http://localhost:8000');
  } else {
    console.log('\n⚠️ Some services are not running. Please check the startup instructions.');
  }
}

runTests().catch(console.error);
