require('dotenv').config({ path: './ai_service/.env' });

const openRouterService = require('./ai_service/services/openRouterService');

async function testChatbot() {
    console.log('🤖 Testing AI Chatbot Integration...\n');
    
    // Test 1: Service Status
    console.log('1. Checking service status:');
    const status = openRouterService.getServiceStatus();
    console.log('   - Configured:', status.configured);
    console.log('   - Model:', status.model);
    console.log('   - Queue length:', status.queueLength);
    console.log('');
    
    // Test 2: Plant-related query
    console.log('2. Testing plant-related query...');
    try {
        const result = await openRouterService.generateChatCompletion(
            'How often should I water my tomato plants?',
            [],
            { plantType: 'tomato', currentMoisture: 45 }
        );
        
        console.log('   ✅ SUCCESS!');
        console.log('   - Response length:', result.response.length);
        console.log('   - Source:', result.source);
        console.log('   - Plant related:', result.isPlantRelated);
        console.log('   - Confidence:', result.confidence);
        console.log('   - Preview:', result.response.substring(0, 100) + '...');
        
    } catch (error) {
        console.log('   ❌ ERROR:', error.message);
    }
    
    console.log('');
    
    // Test 3: Non-plant query
    console.log('3. Testing non-plant query...');
    try {
        const result = await openRouterService.generateChatCompletion(
            'What is the weather today?',
            [],
            {}
        );
        
        console.log('   ✅ SUCCESS!');
        console.log('   - Response length:', result.response.length);
        console.log('   - Source:', result.source);
        console.log('   - Plant related:', result.isPlantRelated);
        console.log('   - Confidence:', result.confidence);
        console.log('   - Preview:', result.response.substring(0, 100) + '...');
        
    } catch (error) {
        console.log('   ❌ ERROR:', error.message);
    }
    
    console.log('\n🎉 Test completed!');
}

testChatbot().catch(console.error);