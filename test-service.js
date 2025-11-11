require('dotenv').config({ path: './ai_service/.env' });

const openRouterService = require('./ai_service/services/openRouterService');

async function testService() {
    console.log('🤖 Testing OpenRouter Service...\n');
    
    try {
        console.log('Testing plant-related query...');
        const result = await openRouterService.generateChatCompletion(
            'How often should I water my tomato plants?',
            [],
            { plantType: 'tomato', currentMoisture: 45 }
        );
        
        console.log('✅ SUCCESS!');
        console.log('Response:', result.response);
        console.log('Source:', result.source);
        console.log('Plant related:', result.isPlantRelated);
        console.log('Confidence:', result.confidence);
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
    }
}

// Set timeout to prevent hanging
setTimeout(() => {
    console.log('⏰ Test timeout - exiting');
    process.exit(0);
}, 30000);

testService();