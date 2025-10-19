/**
 * Test script for the new watering prediction API endpoint
 */

const axios = require('axios');
require('dotenv').config();

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password123';

async function testWateringPredictionEndpoint() {
    try {
        console.log('🧪 Testing Watering Prediction API Endpoint...\n');

        // Step 1: Login to get JWT token
        console.log('1. Logging in to get authentication token...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: TEST_USER_EMAIL,
            password: TEST_USER_PASSWORD
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Step 2: Test watering prediction with various sensor data scenarios
        const testScenarios = [
            {
                name: 'Low moisture - should water',
                data: {
                    plant_id: 1,
                    sensor_data: {
                        moisture: 25,
                        temperature: 24,
                        humidity: 55,
                        light: 600
                    }
                }
            },
            {
                name: 'High moisture - should not water',
                data: {
                    plant_id: 1,
                    sensor_data: {
                        moisture: 75,
                        temperature: 22,
                        humidity: 60,
                        light: 500
                    }
                }
            },
            {
                name: 'Borderline case - hot and dry',
                data: {
                    plant_id: 1,
                    sensor_data: {
                        moisture: 45,
                        temperature: 32,
                        humidity: 35,
                        light: 800
                    }
                }
            },
            {
                name: 'Minimal sensor data',
                data: {
                    plant_id: 1,
                    sensor_data: {
                        moisture: 40
                    }
                }
            }
        ];

        for (let i = 0; i < testScenarios.length; i++) {
            const scenario = testScenarios[i];
            console.log(`\n${i + 2}. Testing scenario: ${scenario.name}`);
            console.log('Input data:', JSON.stringify(scenario.data, null, 2));

            try {
                const response = await axios.post(`${BASE_URL}/api/ai/watering-prediction`, scenario.data, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    console.log('✅ Prediction successful');
                    console.log('Response:', JSON.stringify(response.data, null, 2));
                } else {
                    console.log('❌ Prediction failed:', response.data.message);
                }
            } catch (error) {
                console.log('❌ Request failed:', error.response?.data?.message || error.message);
                if (error.response?.data?.errors) {
                    console.log('Validation errors:', error.response.data.errors);
                }
            }
        }

        // Step 3: Test error cases
        console.log('\n' + (testScenarios.length + 2) + '. Testing error cases...');
        
        const errorCases = [
            {
                name: 'Missing plant_id',
                data: {
                    sensor_data: { moisture: 50 }
                }
            },
            {
                name: 'Missing sensor_data',
                data: {
                    plant_id: 1
                }
            },
            {
                name: 'Invalid plant_id type',
                data: {
                    plant_id: 'invalid',
                    sensor_data: { moisture: 50 }
                }
            }
        ];

        for (const errorCase of errorCases) {
            console.log(`\nTesting error case: ${errorCase.name}`);
            try {
                const response = await axios.post(`${BASE_URL}/api/ai/watering-prediction`, errorCase.data, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('❌ Expected error but got success:', response.data);
            } catch (error) {
                console.log('✅ Correctly returned error:', error.response?.data?.message || error.message);
            }
        }

        console.log('\n🎉 All tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testWateringPredictionEndpoint();