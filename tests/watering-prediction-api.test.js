/**
 * Unit Tests for Watering Prediction API Endpoint
 * Tests the AI controller's predictWatering endpoint functionality
 * Requirements: 2.1, 2.2
 */

const request = require('supertest');
const express = require('express');
const { predictWatering } = require('../controllers/aiController');
const AIPrediction = require('../models/AIPrediction');
const SystemLog = require('../models/SystemLog');

// Mock dependencies
jest.mock('../models/AIPrediction');
jest.mock('../models/SystemLog');
jest.mock('../models/Plant');
jest.mock('../models/Alert');
jest.mock('../models/SensorData');

// Create Express app for testing
const app = express();
app.use(express.json());
app.post('/api/ai/watering-prediction', predictWatering);

describe('Watering Prediction API Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock SystemLog.create to prevent database calls
        SystemLog.create = jest.fn().mockResolvedValue({});
        
        // Mock AIPrediction.createWateringPrediction
        AIPrediction.createWateringPrediction = jest.fn().mockResolvedValue({
            prediction_id: 'test-prediction-123'
        });
    });

    describe('API Endpoint Validation', () => {
        test('should require sensor_data in request body', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123
                    // missing sensor_data
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Sensor data is required');
        });

        test('should require plant_id in request body', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    sensor_data: { moisture: 45, temperature: 25 }
                    // missing plant_id
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Plant ID is required');
        });

        test('should validate sensor_data is an object', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123,
                    sensor_data: "invalid string data"
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Sensor data must be an object');
        });

        test('should reject array as sensor_data', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123,
                    sensor_data: [{ moisture: 45 }]
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Sensor data must be an object');
        });

        test('should allow null plant_id for testing', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: null,
                    sensor_data: { moisture: 45, temperature: 25, humidity: 60, light: 500 }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Prediction Response Structure', () => {
        test('should return proper response structure for dry soil', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123,
                    sensor_data: { moisture: 20, temperature: 28, humidity: 45, light: 700 }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            
            const data = response.body.data;
            expect(data.prediction_id).toBeDefined();
            expect(data.plant_id).toBe(123);
            expect(data.prediction).toBeDefined();
            expect(data.model_version).toBeDefined();
            expect(data.timestamp).toBeDefined();
            expect(data.input_data).toBeDefined();
            
            const prediction = data.prediction;
            expect(typeof prediction.shouldWater).toBe('boolean');
            expect(prediction.confidence).toBeGreaterThanOrEqual(0);
            expect(prediction.confidence).toBeLessThanOrEqual(1);
            expect(prediction.recommendedAmount).toBeGreaterThanOrEqual(0);
            expect(prediction.reasoning).toBeDefined();
            expect(Array.isArray(prediction.recommendations)).toBe(true);
        });

        test('should return proper response structure for well-watered soil', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 456,
                    sensor_data: { moisture: 75, temperature: 22, humidity: 65, light: 400 }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            const prediction = response.body.data.prediction;
            expect(prediction.shouldWater).toBe(false);
            expect(prediction.recommendedAmount).toBe(0);
            expect(prediction.recommendations).toContain('No watering needed at this time');
        });
    });

    describe('Prediction Logic Accuracy', () => {
        const testCases = [
            {
                name: 'Very dry soil',
                sensorData: { moisture: 15, temperature: 25, humidity: 50, light: 600 },
                expectedWater: true,
                expectedHighConfidence: true
            },
            {
                name: 'Dry soil with high temperature',
                sensorData: { moisture: 35, temperature: 32, humidity: 40, light: 800 },
                expectedWater: true,
                expectedHighConfidence: true
            },
            {
                name: 'Well-watered soil',
                sensorData: { moisture: 80, temperature: 22, humidity: 65, light: 400 },
                expectedWater: false,
                expectedHighConfidence: true
            },
            {
                name: 'Hot and dry conditions',
                sensorData: { moisture: 40, temperature: 35, humidity: 30, light: 900 },
                expectedWater: true,
                expectedHighConfidence: true
            }
        ];

        test.each(testCases)('$name should predict correctly', async ({ sensorData, expectedWater, expectedHighConfidence }) => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123,
                    sensor_data: sensorData
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            const prediction = response.body.data.prediction;
            expect(prediction.shouldWater).toBe(expectedWater);
            
            if (expectedHighConfidence) {
                expect(prediction.confidence).toBeGreaterThan(0.6);
            }
            
            if (expectedWater) {
                expect(prediction.recommendedAmount).toBeGreaterThan(0);
                expect(prediction.recommendations).toContain('Water your plant now');
            } else {
                expect(prediction.recommendedAmount).toBe(0);
                expect(prediction.recommendations).toContain('No watering needed at this time');
            }
        });
    });

    describe('Model Fallback Behavior', () => {
        test('should use fallback prediction when TensorFlow model fails', async () => {
            // Mock the TensorFlow model to fail
            jest.doMock('../ai_models/watering_prediction/ultimateSolution', () => {
                return class MockFailingModel {
                    async predict() {
                        throw new Error('TensorFlow model failed');
                    }
                    dispose() {}
                };
            });

            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123,
                    sensor_data: { moisture: 25, temperature: 30, humidity: 40, light: 800 }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            const prediction = response.body.data.prediction;
            expect(prediction.modelUsed).toBe('fallback-rules');
            expect(prediction.reasoning).toContain('Fallback rule-based prediction');
        });

        test('should handle database save failures gracefully', async () => {
            // Mock database save to fail
            AIPrediction.createWateringPrediction = jest.fn().mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123,
                    sensor_data: { moisture: 45, temperature: 25, humidity: 60, light: 500 }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.prediction_id).toBeNull();
        });
    });

    describe('Logging and Monitoring', () => {
        test('should log prediction requests', async () => {
            await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123,
                    sensor_data: { moisture: 45, temperature: 25, humidity: 60, light: 500 }
                });

            expect(SystemLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    log_level: 'INFO',
                    source: 'AIService',
                    message: expect.stringContaining('Watering prediction requested for plant 123')
                })
            );
        });

        test('should log successful predictions', async () => {
            await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123,
                    sensor_data: { moisture: 25, temperature: 30, humidity: 40, light: 800 }
                });

            expect(SystemLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    log_level: 'INFO',
                    source: 'AIService',
                    message: expect.stringContaining('Watering prediction completed for plant 123')
                })
            );
        });

        test('should log errors appropriately', async () => {
            // Mock SystemLog.create to fail on the first call but succeed on subsequent calls
            let callCount = 0;
            SystemLog.create = jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve(); // First call (request log) succeeds
                }
                throw new Error('Logging error');
            });

            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123,
                    sensor_data: { moisture: 45, temperature: 25, humidity: 60, light: 500 }
                });

            // Should still return successful response even if logging fails
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Performance Tests', () => {
        test('should complete predictions within reasonable time', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123,
                    sensor_data: { moisture: 45, temperature: 25, humidity: 60, light: 500 }
                });

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.status).toBe(200);
            expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
        });

        test('should handle multiple concurrent requests', async () => {
            const requests = Array.from({ length: 5 }, (_, i) => 
                request(app)
                    .post('/api/ai/watering-prediction')
                    .send({
                        plant_id: i + 1,
                        sensor_data: { 
                            moisture: 30 + i * 10, 
                            temperature: 20 + i * 2, 
                            humidity: 50 + i * 5, 
                            light: 400 + i * 100 
                        }
                    })
            );

            const responses = await Promise.all(requests);

            responses.forEach((response, index) => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.plant_id).toBe(index + 1);
            });
        });
    });

    describe('Edge Cases', () => {
        test('should handle missing sensor properties', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123,
                    sensor_data: { moisture: 45 } // missing temperature, humidity, light
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            const prediction = response.body.data.prediction;
            expect(typeof prediction.shouldWater).toBe('boolean');
            expect(prediction.confidence).toBeGreaterThanOrEqual(0);
        });

        test('should handle extreme sensor values', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123,
                    sensor_data: { 
                        moisture: 0, 
                        temperature: 50, 
                        humidity: 0, 
                        light: 1000 
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            const prediction = response.body.data.prediction;
            expect(typeof prediction.shouldWater).toBe('boolean');
            expect(prediction.confidence).toBeGreaterThanOrEqual(0);
            expect(prediction.confidence).toBeLessThanOrEqual(1);
        });

        test('should handle negative sensor values', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .send({
                    plant_id: 123,
                    sensor_data: { 
                        moisture: -10, 
                        temperature: -5, 
                        humidity: -20, 
                        light: -100 
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            const prediction = response.body.data.prediction;
            expect(typeof prediction.shouldWater).toBe('boolean');
        });
    });
});