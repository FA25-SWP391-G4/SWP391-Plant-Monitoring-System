/**
 * Direct test of the watering prediction controller method
 */

require('dotenv').config();
const aiController = require('./controllers/aiController');

async function testWateringPredictionController() {
    try {
        console.log('🧪 Testing Watering Prediction Controller Method...\n');

        // Mock request and response objects
        const mockReq = {
            body: {
                plant_id: null, // Using null for testing
                sensor_data: {
                    moisture: 30,
                    temperature: 26,
                    humidity: 45,
                    light: 750
                }
            }
        };

        const mockRes = {
            json: function(data) {
                console.log('✅ Response received:');
                console.log(JSON.stringify(data, null, 2));
                return this;
            },
            status: function(code) {
                console.log(`Status code: ${code}`);
                return this;
            }
        };

        // Test the controller method directly
        console.log('1. Testing predictWatering controller method...');
        console.log('Input data:', JSON.stringify(mockReq.body, null, 2));

        await aiController.predictWatering(mockReq, mockRes);

        console.log('\n🎉 Controller test completed successfully!');

    } catch (error) {
        console.error('❌ Controller test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

testWateringPredictionController();