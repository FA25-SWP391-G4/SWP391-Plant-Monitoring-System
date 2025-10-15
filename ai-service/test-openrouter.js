const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const openRouterService = require('./services/openRouterService');

async function testOpenRouterIntegration() {
  console.log('🧪 Testing OpenRouter API Integration...\n');

  try {
    // Test 1: API Status Check
    console.log('1. Checking API Status...');
    const status = await openRouterService.checkAPIStatus();
    console.log('Status:', status.status);
    if (status.error) {
      console.log('Error:', status.error);
    }
    console.log('');

    // Test 2: Plant-related question
    console.log('2. Testing plant-related question...');
    const plantResponse = await openRouterService.generateChatResponse(
      'Lá cây của tôi bị vàng, tôi nên làm gì?'
    );
    console.log('Success:', plantResponse.success);
    console.log('Response:', plantResponse.response);
    console.log('Fallback used:', plantResponse.fallback || false);
    console.log('');

    // Test 3: Non-plant question (should be rejected)
    console.log('3. Testing non-plant question (should be rejected)...');
    const nonPlantResponse = await openRouterService.generateChatResponse(
      'Thời tiết hôm nay thế nào?'
    );
    console.log('Success:', nonPlantResponse.success);
    console.log('Response:', nonPlantResponse.response);
    console.log('');

    // Test 4: Question with context
    console.log('4. Testing question with sensor context...');
    const contextResponse = await openRouterService.generateChatResponse(
      'Tôi có nên tưới cây không?',
      {
        sensorData: {
          soilMoisture: 25,
          temperature: 28,
          humidity: 65
        },
        plantInfo: {
          type: 'Cây cảnh',
          age: '6 tháng'
        }
      }
    );
    console.log('Success:', contextResponse.success);
    console.log('Response:', contextResponse.response);
    console.log('');

    console.log('✅ OpenRouter integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test if called directly
if (require.main === module) {
  testOpenRouterIntegration();
}

module.exports = testOpenRouterIntegration;