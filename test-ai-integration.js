const axios = require('axios');

async function testAIIntegration() {
    console.log('🧪 Testing AI Service Integration...\n');
    
    try {
        // Test 1: AI Service Health Check
        console.log('1. Testing AI Service Health...');
        const healthResponse = await axios.get('http://localhost:3001/health');
        console.log('✅ AI Service Health:', healthResponse.data);
        
        // Test 2: AI Service Direct Chatbot
        console.log('\n2. Testing AI Service Direct Chatbot...');
        const directChatResponse = await axios.post('http://localhost:3001/api/test/chatbot', {
            message: 'How are my plants doing?'
        });
        console.log('✅ Direct AI Chatbot:', directChatResponse.data);
        
        // Test 3: Check if main backend is running
        console.log('\n3. Testing Main Backend Health...');
        try {
            const backendHealthResponse = await axios.get('http://localhost:3010/health');
            console.log('✅ Main Backend Health:', backendHealthResponse.data);
        } catch (error) {
            console.log('❌ Main Backend not responding:', error.message);
            console.log('⚠️ Cannot test proxy routes without main backend');
            return;
        }
        
        // Test 4: Main Backend AI Proxy Chatbot
        console.log('\n4. Testing Main Backend AI Proxy Chatbot...');
        const proxyChatResponse = await axios.post('http://localhost:3010/api/ai/chatbot', {
            message: 'Hello, tell me about my plants!'
        });
        console.log('✅ Proxy AI Chatbot:', proxyChatResponse.data);
        
        // Test 5: Test AI Plant Analysis endpoint
        console.log('\n5. Testing AI Plant Analysis...');
        const analysisResponse = await axios.post('http://localhost:3010/api/ai/plant-analysis', {
            plantId: 'test-plant-123',
            sensorData: {
                moisture: 45,
                temperature: 22,
                humidity: 65,
                light: 15000
            }
        });
        console.log('✅ Plant Analysis:', analysisResponse.data);
        
        console.log('\n🎉 All AI Integration Tests Passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    }
}

// Run the test
testAIIntegration();