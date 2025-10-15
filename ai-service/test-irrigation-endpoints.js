const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001/api/ai/irrigation';
const TEST_PLANT_ID = 1;

// Test data
const testSensorData = {
  soilMoisture: 35,
  temperature: 28,
  humidity: 55,
  lightLevel: 45000,
  plantType: 'tomato',
  lastWateringHours: 20,
  weatherForecast: 0.2,
  growthStage: 'flowering'
};

const testScheduleData = {
  sensorData: testSensorData,
  preferences: {
    preferredTimes: ['07:00', '18:00'],
    avoidTimes: ['12:00-14:00'],
    maxWateringsPerDay: 2
  }
};

async function testIrrigationEndpoints() {
  console.log('🌱 Testing Irrigation Prediction API Endpoints...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check Endpoint');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Health Check:', healthResponse.data.status);
      console.log('   Services:', JSON.stringify(healthResponse.data.services, null, 2));
    } catch (error) {
      console.log('❌ Health Check failed:', error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Get Plant Types
    console.log('2. Testing Plant Types Endpoint');
    try {
      const plantTypesResponse = await axios.get(`${BASE_URL}/plant-types`);
      console.log('✅ Plant Types retrieved:', plantTypesResponse.data.count, 'types');
      console.log('   Available types:', plantTypesResponse.data.plantTypes.map(p => p.key).join(', '));
    } catch (error) {
      console.log('❌ Plant Types failed:', error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 3: Get Recommendations
    console.log('3. Testing Recommendations Endpoint');
    try {
      const recommendationsResponse = await axios.get(
        `${BASE_URL}/recommendations/${TEST_PLANT_ID}?plantType=tomato&growthStage=flowering`
      );
      console.log('✅ Recommendations retrieved for plant', TEST_PLANT_ID);
      console.log('   Plant Profile:', recommendationsResponse.data.recommendations.plantProfile.name);
      console.log('   Watering Frequency:', recommendationsResponse.data.recommendations.plantProfile.wateringFrequency);
      console.log('   Growth Stage Tips:', recommendationsResponse.data.recommendations.growthStage?.advice?.slice(0, 1));
    } catch (error) {
      console.log('❌ Recommendations failed:', error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 4: Predict Irrigation
    console.log('4. Testing Irrigation Prediction Endpoint');
    try {
      const predictionResponse = await axios.post(`${BASE_URL}/predict/${TEST_PLANT_ID}`, testSensorData);
      console.log('✅ Irrigation Prediction completed');
      console.log('   Should Water:', predictionResponse.data.prediction.shouldWater);
      console.log('   Water Amount:', predictionResponse.data.prediction.waterAmount, 'ml');
      console.log('   Confidence:', predictionResponse.data.prediction.confidence);
      console.log('   Hours Until Water:', predictionResponse.data.prediction.hoursUntilWater);
      console.log('   Explanation:', predictionResponse.data.prediction.explanation.substring(0, 100) + '...');
      
      // Store prediction for feedback test
      global.lastPredictionId = predictionResponse.data.timestamp;
    } catch (error) {
      console.log('❌ Irrigation Prediction failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 5: Create Schedule
    console.log('5. Testing Schedule Creation Endpoint');
    try {
      const scheduleResponse = await axios.post(`${BASE_URL}/schedule/${TEST_PLANT_ID}`, testScheduleData);
      console.log('✅ Schedule created');
      console.log('   Schedule length:', scheduleResponse.data.schedule.length, 'items');
      console.log('   First 3 schedule items:');
      scheduleResponse.data.schedule.slice(0, 3).forEach((item, index) => {
        console.log(`     ${index + 1}. ${item.date} ${item.time} - ${item.action} ${item.amount ? item.amount + 'ml' : ''}`);
      });
    } catch (error) {
      console.log('❌ Schedule Creation failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 6: Submit Feedback
    console.log('6. Testing Feedback Submission Endpoint');
    try {
      const feedbackData = {
        plantId: TEST_PLANT_ID,
        predictionId: global.lastPredictionId || 'test_prediction_123',
        feedback: 'correct',
        actualOutcome: {
          wateringPerformed: true,
          plantResponse: 'positive',
          soilMoistureAfter: 65
        }
      };

      const feedbackResponse = await axios.post(`${BASE_URL}/feedback`, feedbackData);
      console.log('✅ Feedback submitted successfully');
      console.log('   Feedback ID:', feedbackResponse.data.feedbackId);
      console.log('   Message:', feedbackResponse.data.message);
    } catch (error) {
      console.log('❌ Feedback Submission failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 7: Error Handling - Invalid Plant ID
    console.log('7. Testing Error Handling - Invalid Plant ID');
    try {
      await axios.post(`${BASE_URL}/predict/invalid_id`, testSensorData);
      console.log('❌ Should have failed with invalid plant ID');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly handled invalid plant ID');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 8: Error Handling - Missing Sensor Data
    console.log('8. Testing Error Handling - Missing Sensor Data');
    try {
      await axios.post(`${BASE_URL}/predict/${TEST_PLANT_ID}`, { plantType: 'tomato' });
      console.log('❌ Should have failed with missing sensor data');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly handled missing sensor data');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 9: Performance Test
    console.log('9. Testing Performance - Multiple Concurrent Requests');
    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < 5; i++) {
      promises.push(
        axios.post(`${BASE_URL}/predict/${TEST_PLANT_ID}`, {
          ...testSensorData,
          soilMoisture: 30 + i * 5
        })
      );
    }

    try {
      const results = await Promise.all(promises);
      const endTime = Date.now();
      console.log('✅ Performance Test completed');
      console.log('   Processed 5 concurrent requests in', endTime - startTime, 'ms');
      console.log('   Average response time:', (endTime - startTime) / 5, 'ms');
      console.log('   All predictions successful:', results.every(r => r.data.success));
    } catch (error) {
      console.log('❌ Performance Test failed:', error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 10: Edge Cases
    console.log('10. Testing Edge Cases');
    
    // Extreme sensor values
    const extremeData = {
      soilMoisture: 5, // Very dry
      temperature: 40, // Very hot
      humidity: 20,    // Very dry air
      lightLevel: 80000, // Very bright
      plantType: 'tomato',
      lastWateringHours: 72, // 3 days ago
      weatherForecast: 0.0   // No rain
    };

    try {
      const extremeResponse = await axios.post(`${BASE_URL}/predict/${TEST_PLANT_ID}`, extremeData);
      console.log('✅ Extreme conditions handled');
      console.log('   Should Water:', extremeResponse.data.prediction.shouldWater);
      console.log('   Water Amount:', extremeResponse.data.prediction.waterAmount, 'ml');
      console.log('   Confidence:', extremeResponse.data.prediction.confidence);
    } catch (error) {
      console.log('❌ Extreme conditions test failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 All endpoint tests completed!\n');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Helper function to start server if needed
async function checkServerStatus() {
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running, starting tests...\n');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the AI service first:');
    console.log('   cd ai-service && npm start\n');
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Irrigation Prediction API Test Suite\n');
  
  const serverRunning = await checkServerStatus();
  if (serverRunning) {
    await testIrrigationEndpoints();
  }
}

// Execute if run directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testIrrigationEndpoints, checkServerStatus };