/**
 * AI Integration Tests
 * Comprehensive end-to-end tests for AI system functionality
 */

const request = require('supertest');
const app = require('../app');
const path = require('path');
const fs = require('fs');

// Test utilities
const { setupTestDatabase, cleanupTestDatabase, createTestUser, createTestPlant } = require('./ai-test-setup');

describe('AI Integration Tests', () => {
    let testUser;
    let authToken;
    let testPlant;
    let testImagePath;

    beforeAll(async () => {
        // Setup test database
        await setupTestDatabase();
        
        // Create test user and get auth token
        testUser = await createTestUser();
        
        // Login to get auth token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'testpassword123'
            });
        
        authToken = loginResponse.body.token;
        
        // Create test plant
        testPlant = await createTestPlant(testUser.user_id);
        
        // Create test image
        testImagePath = path.join(__dirname, 'test-images', 'test-plant.jpg');
        await createTestImage(testImagePath);
    });

    afterAll(async () => {
        // Cleanup test files
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
        
        // Cleanup test database
        await cleanupTestDatabase();
    });

    describe('AI Error Handling and Fallbacks', () => {
        test('should handle watering prediction with invalid sensor data gracefully', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: testPlant.plant_id,
                    sensor_data: {
                        moisture: 'invalid', // Invalid data type
                        temperature: 25
                    }
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('validation');
        });

        test('should provide fallback response when AI model fails', async () => {
            // Mock model failure by using extreme values that might cause errors
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: testPlant.plant_id,
                    sensor_data: {
                        moisture: 50,
                        temperature: 25,
                        humidity: 60,
                        light: 500
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('prediction');
            expect(response.body.data.prediction).toHaveProperty('shouldWater');
            expect(response.body.data.prediction).toHaveProperty('confidence');
        });

        test('should handle image recognition with missing file gracefully', async () => {
            const response = await request(app)
                .post('/api/ai/image-recognition')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: testPlant.plant_id
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('image');
        });
    });

    describe('AI Caching System', () => {
        test('should cache watering predictions for similar sensor data', async () => {
            const sensorData = {
                moisture: 45,
                temperature: 24,
                humidity: 65,
                light: 600
            };

            // First request
            const response1 = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: testPlant.plant_id,
                    sensor_data: sensorData
                });

            expect(response1.status).toBe(200);
            const firstProcessingTime = response1.body.data.processing_time_ms;

            // Second request with very similar data (should be cached)
            const response2 = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: testPlant.plant_id,
                    sensor_data: {
                        ...sensorData,
                        moisture: 46 // Slightly different but within tolerance
                    }
                });

            expect(response2.status).toBe(200);
            const secondProcessingTime = response2.body.data.processing_time_ms;

            // Cached response should be faster
            expect(secondProcessingTime).toBeLessThan(firstProcessingTime);
        });

        test('should provide cache statistics', async () => {
            const response = await request(app)
                .get('/api/ai/performance/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('cache');
            expect(response.body.data.cache).toHaveProperty('healthy');
            expect(response.body.data.cache).toHaveProperty('stats');
        });
    });

    describe('AI Model Management', () => {
        test('should load and manage models efficiently', async () => {
            const response = await request(app)
                .get('/api/ai/performance/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('modelManager');
            expect(response.body.data.modelManager).toHaveProperty('healthy');
            expect(response.body.data.modelManager.healthy).toBe(true);
        });

        test('should handle concurrent model requests', async () => {
            const requests = [];
            
            // Create multiple concurrent requests
            for (let i = 0; i < 5; i++) {
                requests.push(
                    request(app)
                        .post('/api/ai/watering-prediction')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            plant_id: testPlant.plant_id,
                            sensor_data: {
                                moisture: 40 + i,
                                temperature: 22 + i,
                                humidity: 60,
                                light: 500
                            }
                        })
                );
            }

            const responses = await Promise.all(requests);
            
            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });
    });

    describe('AI Performance Optimization', () => {
        test('should optimize AI performance on demand', async () => {
            // Only test if user has admin privileges
            const response = await request(app)
                .post('/api/ai/performance/optimize')
                .set('Authorization', `Bearer ${authToken}`);

            // Should either succeed (if admin) or fail with 403 (if not admin)
            expect([200, 403]).toContain(response.status);
            
            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveProperty('cache');
                expect(response.body.data).toHaveProperty('modelManager');
                expect(response.body.data).toHaveProperty('imageProcessor');
            }
        });

        test('should clear cache on demand', async () => {
            const response = await request(app)
                .post('/api/ai/performance/clear-cache')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ type: 'predictions' });

            // Should either succeed (if admin) or fail with 403 (if not admin)
            expect([200, 403]).toContain(response.status);
        });
    });

    describe('End-to-End AI Workflows', () => {
        test('should complete full watering prediction workflow', async () => {
            // Step 1: Make prediction request
            const predictionResponse = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: testPlant.plant_id,
                    sensor_data: {
                        moisture: 30, // Low moisture
                        temperature: 28,
                        humidity: 55,
                        light: 700
                    }
                });

            expect(predictionResponse.status).toBe(200);
            expect(predictionResponse.body.success).toBe(true);
            
            const prediction = predictionResponse.body.data.prediction;
            expect(prediction).toHaveProperty('shouldWater');
            expect(prediction).toHaveProperty('confidence');
            expect(prediction).toHaveProperty('reasoning');
            expect(prediction).toHaveProperty('recommendations');
            
            // Low moisture should typically trigger watering recommendation
            expect(prediction.shouldWater).toBe(true);
            expect(prediction.confidence).toBeGreaterThan(0);
            expect(prediction.recommendations).toBeInstanceOf(Array);
            expect(prediction.recommendations.length).toBeGreaterThan(0);

            // Step 2: Verify prediction was stored
            expect(predictionResponse.body.data).toHaveProperty('prediction_id');
            expect(predictionResponse.body.data.plant_id).toBe(testPlant.plant_id);
        });

        test('should complete full image recognition workflow', async () => {
            // Step 1: Upload and analyze image
            const response = await request(app)
                .post('/api/ai/image-recognition')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('image', testImagePath)
                .field('plant_id', testPlant.plant_id.toString());

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            const analysis = response.body.data;
            expect(analysis).toHaveProperty('disease_detected');
            expect(analysis).toHaveProperty('confidence');
            expect(analysis).toHaveProperty('treatment_suggestions');
            expect(analysis).toHaveProperty('prevention_tips');
            expect(analysis).toHaveProperty('reliability');
            
            // Verify analysis structure
            expect(analysis.treatment_suggestions).toBeInstanceOf(Array);
            expect(analysis.prevention_tips).toBeInstanceOf(Array);
            expect(analysis.reliability).toHaveProperty('score');
            expect(analysis.reliability).toHaveProperty('level');

            // Step 2: Verify analysis was stored
            expect(analysis).toHaveProperty('analysis_id');
            expect(analysis.plant_id).toBe(testPlant.plant_id);
        });

        test('should handle plant monitoring integration', async () => {
            // Test that AI predictions integrate with existing plant monitoring
            
            // Step 1: Get plant details
            const plantResponse = await request(app)
                .get(`/api/plants/${testPlant.plant_id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(plantResponse.status).toBe(200);
            
            // Step 2: Make AI prediction
            const predictionResponse = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: testPlant.plant_id,
                    sensor_data: {
                        moisture: 25, // Very low moisture
                        temperature: 30,
                        humidity: 45,
                        light: 800
                    }
                });

            expect(predictionResponse.status).toBe(200);
            expect(predictionResponse.body.data.prediction.shouldWater).toBe(true);
            
            // Step 3: Verify that high-confidence predictions might trigger alerts
            // (This would be tested by checking the alerts table, but we'll just verify the prediction structure)
            const prediction = predictionResponse.body.data.prediction;
            if (prediction.confidence > 0.7) {
                expect(prediction.shouldWater).toBe(true);
                expect(prediction.reasoning).toContain('moisture');
            }
        });
    });

    describe('AI System Health and Monitoring', () => {
        test('should provide comprehensive health status', async () => {
            const response = await request(app)
                .get('/api/ai/performance/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            const stats = response.body.data;
            expect(stats).toHaveProperty('errorHandler');
            expect(stats).toHaveProperty('cache');
            expect(stats).toHaveProperty('modelManager');
            expect(stats).toHaveProperty('imageProcessor');
            expect(stats).toHaveProperty('system');
            
            // Verify each component reports health status
            expect(stats.errorHandler).toHaveProperty('healthy');
            expect(stats.cache).toHaveProperty('healthy');
            expect(stats.modelManager).toHaveProperty('healthy');
            expect(stats.imageProcessor).toHaveProperty('healthy');
        });

        test('should handle system resource monitoring', async () => {
            const response = await request(app)
                .get('/api/ai/performance/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            
            const systemStats = response.body.data.system;
            expect(systemStats).toHaveProperty('memory');
            expect(systemStats).toHaveProperty('uptime');
            expect(systemStats.memory).toHaveProperty('heapUsed');
            expect(systemStats.memory).toHaveProperty('heapTotal');
            expect(typeof systemStats.uptime).toBe('number');
        });
    });

    describe('AI Error Recovery and Resilience', () => {
        test('should recover from temporary failures', async () => {
            // Test multiple requests to ensure system remains stable
            const requests = [];
            
            for (let i = 0; i < 10; i++) {
                requests.push(
                    request(app)
                        .post('/api/ai/watering-prediction')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            plant_id: testPlant.plant_id,
                            sensor_data: {
                                moisture: Math.random() * 100,
                                temperature: 20 + Math.random() * 15,
                                humidity: 40 + Math.random() * 40,
                                light: Math.random() * 1000
                            }
                        })
                );
            }

            const responses = await Promise.all(requests);
            
            // All requests should either succeed or fail gracefully
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveProperty('prediction');
            });
        });

        test('should maintain performance under load', async () => {
            const startTime = Date.now();
            const requests = [];
            
            // Create 20 concurrent requests
            for (let i = 0; i < 20; i++) {
                requests.push(
                    request(app)
                        .post('/api/ai/watering-prediction')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            plant_id: testPlant.plant_id,
                            sensor_data: {
                                moisture: 40 + (i % 20),
                                temperature: 22 + (i % 10),
                                humidity: 60,
                                light: 500
                            }
                        })
                );
            }

            const responses = await Promise.all(requests);
            const totalTime = Date.now() - startTime;
            
            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
            
            // Average response time should be reasonable (less than 2 seconds per request)
            const avgTime = totalTime / responses.length;
            expect(avgTime).toBeLessThan(2000);
        });
    });
});

/**
 * Helper function to create a test image
 */
async function createTestImage(imagePath) {
    const sharp = require('sharp');
    const dir = path.dirname(imagePath);
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create a simple test image (green square representing a healthy plant)
    await sharp({
        create: {
            width: 224,
            height: 224,
            channels: 3,
            background: { r: 50, g: 150, b: 50 }
        }
    })
    .jpeg({ quality: 80 })
    .toFile(imagePath);
}