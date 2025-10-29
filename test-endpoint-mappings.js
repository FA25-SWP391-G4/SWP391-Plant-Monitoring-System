const axios = require('axios');

async function testEndpointMappings() {
    console.log('🔍 Testing AI Endpoint Mappings...\n');
    
    try {
        // Test 1: AI Service Root Endpoint (should show endpoint structure)
        console.log('1. Testing AI Service Root Endpoint...');
        const rootResponse = await axios.get('http://localhost:3001/');
        console.log('✅ AI Service Root:', rootResponse.data);
        
        // Test 2: AI Service Health
        console.log('\n2. Testing AI Service Health...');
        const healthResponse = await axios.get('http://localhost:3001/health');
        console.log('✅ AI Service Health:', healthResponse.data);
        
        // Test 3: Backend Test Chatbot (should proxy to AI service)
        console.log('\n3. Testing Backend Test Chatbot...');
        try {
            const testChatResponse = await axios.post('http://localhost:3010/api/ai/test/chatbot', {
                message: 'Test endpoint mapping!'
            });
            console.log('✅ Backend Test Chatbot Response:', testChatResponse.data);
        } catch (error) {
            if (error.response && error.response.data) {
                console.log('ℹ️ Backend Test Chatbot (Error):', error.response.data);
            } else {
                console.log('❌ Backend Test Chatbot Failed:', error.message);
            }
        }
        
        // Test 4: Backend Test Plant Analysis
        console.log('\n4. Testing Backend Test Plant Analysis...');
        try {
            const testAnalysisResponse = await axios.post('http://localhost:3010/api/ai/test/plant-analysis', {
                plantId: 'test-123',
                sensorData: { moisture: 45, temperature: 22, humidity: 65, light: 15000 }
            });
            console.log('✅ Backend Test Plant Analysis Response:', testAnalysisResponse.data);
        } catch (error) {
            if (error.response && error.response.data) {
                console.log('ℹ️ Backend Test Plant Analysis (Error):', error.response.data);
            } else {
                console.log('❌ Backend Test Plant Analysis Failed:', error.message);
            }
        }
        
        console.log('\n📊 Endpoint Mapping Test Complete!');
        console.log('==========================================');
        console.log('Frontend API Endpoints (aiApi.js):');
        console.log('- testChatbot() → POST /api/ai/test/chatbot');
        console.log('- testPlantAnalysis() → POST /api/ai/test/plant-analysis');
        console.log('- chatWithAI() → POST /api/ai/chatbot');
        console.log('- analyzeImage() → POST /api/ai/plant-analysis');
        console.log('- getIrrigationRecommendations() → POST /api/ai/watering-prediction');
        console.log('- optimizeIrrigationSchedule() → POST /api/ai/watering-schedule');
        console.log('- analyzeHistoricalData() → POST /api/ai/historical-analysis');
        
        console.log('\nBackend Routes → AI Service Mapping:');
        console.log('- /api/ai/chatbot → /api/chatbot');
        console.log('- /api/ai/plant-analysis → /api/image-recognition');
        console.log('- /api/ai/watering-prediction → /api/irrigation');
        console.log('- /api/ai/watering-schedule → /api/irrigation-schedule');
        console.log('- /api/ai/historical-analysis → /api/historical-analysis');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run the test
testEndpointMappings();