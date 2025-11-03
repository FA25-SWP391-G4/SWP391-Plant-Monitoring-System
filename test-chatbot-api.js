require('dotenv').config({ path: './ai_service/.env' });
const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testChatbotAPI() {
    console.log('🧪 Testing Chatbot API Endpoint...\n');
    
    // Create test JWT token
    const testToken = jwt.sign(
        { user_id: 1, id: 1 }, 
        process.env.JWT_SECRET || 'cd9f94297383bffbd6b3f8d7146d1bfb',
        { expiresIn: '1h' }
    );
    
    console.log('✅ Test JWT token created');
    
    try {
        // Test chatbot endpoint
        console.log('🤖 Testing chatbot query...');
        
        const response = await axios.post('http://localhost:8000/api/chatbot/query', {
            message: 'How often should I water my tomato plants?',
            context: {
                plantType: 'tomato',
                currentMoisture: 45,
                temperature: 24,
                humidity: 60
            }
        }, {
            headers: {
                'Authorization': `Bearer ${testToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        console.log('✅ Chatbot API Success!');
        console.log('Status:', response.status);
        console.log('Response data:');
        console.log('- Success:', response.data.success);
        console.log('- Response length:', response.data.data?.response?.length || 0);
        console.log('- Source:', response.data.data?.source);
        console.log('- Plant related:', response.data.data?.isPlantRelated);
        console.log('- Confidence:', response.data.data?.confidence);
        console.log('- Conversation ID:', response.data.data?.conversation_id);
        console.log('- Preview:', response.data.data?.response?.substring(0, 100) + '...');
        
    } catch (error) {
        console.log('❌ Chatbot API Error:');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message || error.message);
        console.log('Error details:', error.response?.data);
    }
}

testChatbotAPI();