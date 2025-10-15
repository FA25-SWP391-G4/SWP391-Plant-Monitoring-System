const IrrigationPredictionController = require('./controllers/irrigationPredictionController');

async function testController() {
  console.log('🌱 Testing Irrigation Prediction Controller...\n');

  try {
    // Initialize controller
    console.log('Initializing controller...');
    const controller = new IrrigationPredictionController();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock request and response objects
    const mockReq = {
      params: { plantId: '1' },
      body: {
        soilMoisture: 35,
        temperature: 28,
        humidity: 55,
        lightLevel: 45000,
        plantType: 'tomato',
        lastWateringHours: 20,
        weatherForecast: 0.2,
        growthStage: 'flowering'
      }
    };

    const mockRes = {
      json: (data) => {
        console.log('✅ Controller Response:');
        console.log(JSON.stringify(data, null, 2));
        return mockRes;
      },
      status: (code) => {
        console.log(`Status Code: ${code}`);
        return mockRes;
      }
    };

    // Test prediction
    console.log('Testing predictIrrigation method...');
    await controller.predictIrrigation(mockReq, mockRes);

    console.log('\n✅ Controller test completed successfully!');

  } catch (error) {
    console.error('❌ Controller test failed:', error.message);
    console.error(error.stack);
  }
}

// Run test
if (require.main === module) {
  testController().catch(console.error);
}

module.exports = testController;