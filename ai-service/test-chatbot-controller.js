const express = require('express');
const chatbotController = require('./controllers/chatbotController');
require('dotenv').config();

// Create test Express app
const app = express();
app.use(express.json());

// Test routes
app.post('/api/ai/chatbot/message', chatbotController.handleMessage);
app.get('/api/ai/chatbot/history/:sessionId', chatbotController.getChatHistory);
app.get('/api/ai/chatbot/sessions/:userId', chatbotController.getChatSessions);
app.delete('/api/ai/chatbot/session/:sessionId', chatbotController.deleteSession);
app.get('/api/ai/chatbot/status', chatbotController.getStatus);

async function testChatbotController() {
  console.log('🧪 Testing Chatbot Controller...\n');

  try {
    // Test 1: Status check
    console.log('1. Testing status endpoint...');
    const statusResponse = await fetch('http://localhost:3001/api/ai/chatbot/status');
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('Status:', status.status);
    } else {
      console.log('Status endpoint not available (server not running)');
    }
    console.log('');

    // Test 2: Direct controller method test
    console.log('2. Testing handleMessage method directly...');
    
    const mockReq = {
      body: {
        message: 'Lá cây của tôi bị vàng, tôi nên làm gì?',
        userId: 'test_user_1',
        plantId: 1,
        language: 'vi'
      }
    };

    const mockRes = {
      json: (data) => {
        console.log('Response received:');
        console.log('- Success:', data.success);
        console.log('- Response:', data.response);
        console.log('- Session ID:', data.sessionId);
        console.log('- Response Time:', data.responseTime + 'ms');
        console.log('- Fallback used:', data.fallback);
        return data;
      },
      status: (code) => ({
        json: (data) => {
          console.log('Error response:', code, data);
          return data;
        }
      })
    };

    await chatbotController.handleMessage(mockReq, mockRes);
    console.log('');

    // Test 3: Non-plant question
    console.log('3. Testing non-plant question rejection...');
    
    const mockReq2 = {
      body: {
        message: 'Thời tiết hôm nay thế nào?',
        userId: 'test_user_1',
        plantId: 1,
        language: 'vi'
      }
    };

    await chatbotController.handleMessage(mockReq2, mockRes);
    console.log('');

    // Test 4: Question with context
    console.log('4. Testing question with sensor context...');
    
    const mockReq3 = {
      body: {
        message: 'Tôi có nên tưới cây không?',
        userId: 'test_user_1',
        plantId: 1,
        language: 'vi'
      }
    };

    await chatbotController.handleMessage(mockReq3, mockRes);
    console.log('');

    console.log('✅ Chatbot controller test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Start server for testing if needed
const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  
  // Run tests after server starts
  setTimeout(() => {
    testChatbotController().then(() => {
      console.log('\n🛑 Shutting down test server...');
      server.close();
    });
  }, 1000);
});

module.exports = testChatbotController;