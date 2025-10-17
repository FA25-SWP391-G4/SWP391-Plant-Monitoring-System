/**
 * AI System Resilience Tests
 * Tests for error recovery, fallback mechanisms, and system stability
 */

const request = require('supertest');
const app = require('../app');
const path = require('path');
const fs = require('fs');

// Test utilities
const { setupTestDatabase, cleanupTestDatabase, createTestUser, createTestPlant } = require('./ai-test-setup');

describe('AI System Resilience Tests', () => {
    let testUser;
    let authToken;
    let testPlant;

    beforeAll(async () => {
        await setupTestDatabase();
        testUser = await createTestUser();
        
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'testpassword123'
            });
        
        authToken = loginResponse.body.token;
        testPlant = await createTestPlant(testUser.user_id);
    });

    afterAll(async () => {
        await cleanupTestDatabase();
    });

    describe('Fallback Mechanisms', () => {
        test('should provide fallback response when model loading fails', async () => {
            // Test with extreme sensor values that might cause model issues
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: testPlant.plant_id,
                    sensor_data: {
                        moisture: 999999, // Extreme value
                        temperature: -999,
                        humidity: 999999,
                        light: -999999
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('prediction');
            
            // Should still provide a reasonable response
            const prediction = response.body.data.prediction;
            expect(prediction).toHaveProperty('shouldWater');
            expect(prediction).toHaveProperty('confidence');
            expect(prediction).toHaveProperty('reasoning');
            expect(typeof prediction.shouldWater).toBe('boolean');
            expect(typeof prediction.confidence).toBe('number');
        });

        test('should handle image recognition fallback gracefully', async () => {
            // Create a corrupted or very small image
            const testImagePath = path.join(__dirname, 'test-images', 'tiny-image.jpg');
            const dir = path.dirname(testImagePath);
            
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // Create a very small image that might cause processing issues
            const sharp = require('sharp');
            await sharp({
                create: {
                    width: 1,
                    height: 1,
                    channels: 3,
                    background: { r: 0, g: 0, b: 0 }
                }
            })
            .jpeg({ quality: 10 })
            .toFile(testImagePath);

            const response = await request(app)
                .post('/api/ai/image-recognition')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('image', testImagePath)
                .field('plant_id', testPlant.plant_id.toString());

            // Should either succeed with fallback or fail gracefully
            expect([200, 400]).toContain(response.status);
            
            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveProperty('disease_detected');
                expect(response.body.data).toHaveProperty('treatment_suggestions');
            } else {
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBeDefined();
            }

            // Cleanup
            if (fs.existsSync(testImagePath)) {
                fs.unlinkSync(testImagePath);
            }
        });

        test('should handle missing plant data gracefully', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: 999999, // Non-existent plant
                    sensor_data: {
                        moisture: 45,
                        temperature: 24,
                        humidity: 65,
                        light: 600
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('prediction');
            
            // Should still provide prediction even without plant data
            const prediction = response.body.data.prediction;
            expect(prediction).toHaveProperty('shouldWater');
            expect(prediction).toHaveProperty('confidence');
        });
    });

    describe('Error Recovery', () => {
        test('should recover from temporary database issues', async () => {
            // Simulate multiple requests that might stress the database
            const requests = [];
            
            for (let i = 0; i < 50; i++) {
                requests.push(
                    request(app)
                        .post('/api/ai/watering-prediction')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            plant_id: testPlant.plant_id,
                            sensor_data: {
                                moisture: Math.random() * 100,
                                temperature: 15 + Math.random() * 20,
                                humidity: 30 + Math.random() * 50,
                                light: Math.random() * 1000
                            }
                        })
                );
            }

            const responses = await Promise.allSettled(requests);
            
            // Most requests should succeed
            const successfulResponses = responses.filter(r => 
                r.status === 'fulfilled' && r.value.status === 200
            );
            
            const successRate = successfulResponses.length / responses.length;
            expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate
        });

        test('should handle retry mechanisms correctly', async () => {
            // Test with data that might cause temporary failures
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: testPlant.plant_id,
                    sensor_data: {
                        moisture: 50,
                        temperature: 25,
                        humidity: 60,
                        light: 700
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            // Response should include processing time (indicating it went through the system)
            expect(response.body.data).toHaveProperty('processing_time_ms');
            expect(typeof response.body.data.processing_time_ms).toBe('number');
        });
    });

    describe('System Stability Under Load', () => {
        test('should maintain stability with rapid successive requests', async () => {
            const requests = [];
            const startTime = Date.now();
            
            // Create 30 rapid requests
            for (let i = 0; i < 30; i++) {
                requests.push(
                    request(app)
                        .post('/api/ai/watering-prediction')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            plant_id: testPlant.plant_id,
                            sensor_data: {
                                moisture: 40 + (i % 20),
                                temperature: 20 + (i % 15),
                                humidity: 50 + (i % 30),
                                light: 400 + (i % 400)
                            }
                        })
                );
            }

            const responses = await Promise.all(requests);
            const totalTime = Date.now() - startTime;
            
            // All requests should complete
            expect(responses).toHaveLength(30);
            
            // Most should succeed
            const successfulResponses = responses.filter(r => r.status === 200);
            expect(successfulResponses.length).toBeGreaterThan(25); // At least 83% success
            
            // Average response time should be reasonable
            const avgTime = totalTime / responses.length;
            expect(avgTime).toBeLessThan(5000); // 5 seconds average
        });

        test('should handle mixed request types concurrently', async () => {
            const requests = [];
            
            // Mix of watering predictions and other requests
            for (let i = 0; i < 15; i++) {
                if (i % 3 === 0) {
                    // Performance stats request
                    requests.push(
                        request(app)
                            .get('/api/ai/performance/stats')
                            .set('Authorization', `Bearer ${authToken}`)
                    );
                } else {
                    // Watering prediction request
                    requests.push(
                        request(app)
                            .post('/api/ai/watering-prediction')
                            .set('Authorization', `Bearer ${authToken}`)
                            .send({
                                plant_id: testPlant.plant_id,
                                sensor_data: {
                                    moisture: 30 + (i % 40),
                                    temperature: 18 + (i % 12),
                                    humidity: 45 + (i % 35),
                                    light: 300 + (i % 500)
                                }
                            })
                    );
                }
            }

            const responses = await Promise.all(requests);
            
            // All requests should complete successfully
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });
    });

    describe('Resource Management', () => {
        test('should not leak memory during extended operations', async () => {
            // Get initial memory usage
            const initialStatsResponse = await request(app)
                .get('/api/ai/performance/stats')
                .set('Authorization', `Bearer ${authToken}`);
            
            const initialMemory = initialStatsResponse.body.data.system.memory.heapUsed;
            
            // Perform many operations
            const operations = [];
            for (let i = 0; i < 100; i++) {
                operations.push(
                    request(app)
                        .post('/api/ai/watering-prediction')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            plant_id: testPlant.plant_id,
                            sensor_data: {
                                moisture: Math.random() * 100,
                                temperature: 10 + Math.random() * 30,
                                humidity: 20 + Math.random() * 60,
                                light: Math.random() * 1000
                            }
                        })
                );
            }
            
            // Process in batches to avoid overwhelming the system
            const batchSize = 10;
            for (let i = 0; i < operations.length; i += batchSize) {
                const batch = operations.slice(i, i + batchSize);
                await Promise.all(batch);
                
                // Small delay between batches
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Get final memory usage
            const finalStatsResponse = await request(app)
                .get('/api/ai/performance/stats')
                .set('Authorization', `Bearer ${authToken}`);
            
            const finalMemory = finalStatsResponse.body.data.system.memory.heapUsed;
            const memoryGrowth = finalMemory - initialMemory;
            
            // Memory growth should be reasonable (less than 200MB)
            expect(memoryGrowth).toBeLessThan(200 * 1024 * 1024);
        });

        test('should handle resource cleanup properly', async () => {
            // Trigger optimization to test cleanup
            const optimizeResponse = await request(app)
                .post('/api/ai/performance/optimize')
                .set('Authorization', `Bearer ${authToken}`);

            // Should either succeed (if admin) or be forbidden
            expect([200, 403]).toContain(optimizeResponse.status);
            
            if (optimizeResponse.status === 200) {
                expect(optimizeResponse.body.success).toBe(true);
                
                // Verify system is still functional after optimization
                const testResponse = await request(app)
                    .post('/api/ai/watering-prediction')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        plant_id: testPlant.plant_id,
                        sensor_data: {
                            moisture: 45,
                            temperature: 24,
                            humidity: 65,
                            light: 600
                        }
                    });

                expect(testResponse.status).toBe(200);
                expect(testResponse.body.success).toBe(true);
            }
        });
    });

    describe('Data Validation and Sanitization', () => {
        test('should handle malformed sensor data gracefully', async () => {
            const malformedDataTests = [
                { moisture: null, temperature: 25, humidity: 60, light: 500 },
                { moisture: undefined, temperature: 25, humidity: 60, light: 500 },
                { moisture: 'fifty', temperature: 25, humidity: 60, light: 500 },
                { moisture: {}, temperature: 25, humidity: 60, light: 500 },
                { moisture: [], temperature: 25, humidity: 60, light: 500 },
                { moisture: 50, temperature: Infinity, humidity: 60, light: 500 },
                { moisture: 50, temperature: 25, humidity: -Infinity, light: 500 }
            ];

            for (const sensorData of malformedDataTests) {
                const response = await request(app)
                    .post('/api/ai/watering-prediction')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        plant_id: testPlant.plant_id,
                        sensor_data: sensorData
                    });

                // Should either handle gracefully (200) or reject properly (400)
                expect([200, 400]).toContain(response.status);
                
                if (response.status === 200) {
                    expect(response.body.success).toBe(true);
                    expect(response.body.data).toHaveProperty('prediction');
                } else {
                    expect(response.body.success).toBe(false);
                    expect(response.body.message).toBeDefined();
                }
            }
        });

        test('should sanitize and validate input parameters', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: 'not_a_number',
                    sensor_data: {
                        moisture: 50,
                        temperature: 25,
                        humidity: 60,
                        light: 500
                    }
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('validation');
        });
    });

    describe('System Health Monitoring', () => {
        test('should maintain health status during stress', async () => {
            // Create some load
            const loadRequests = [];
            for (let i = 0; i < 20; i++) {
                loadRequests.push(
                    request(app)
                        .post('/api/ai/watering-prediction')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            plant_id: testPlant.plant_id,
                            sensor_data: {
                                moisture: Math.random() * 100,
                                temperature: 15 + Math.random() * 20,
                                humidity: 30 + Math.random() * 50,
                                light: Math.random() * 1000
                            }
                        })
                );
            }

            await Promise.all(loadRequests);

            // Check health status
            const healthResponse = await request(app)
                .get('/api/ai/performance/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(healthResponse.status).toBe(200);
            expect(healthResponse.body.success).toBe(true);
            
            const healthData = healthResponse.body.data;
            expect(healthData.errorHandler.healthy).toBe(true);
            expect(healthData.cache.healthy).toBe(true);
            expect(healthData.modelManager.healthy).toBe(true);
            expect(healthData.imageProcessor.healthy).toBe(true);
        });

        test('should provide meaningful error messages', async () => {
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    // Missing required fields
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBeDefined();
            expect(typeof response.body.message).toBe('string');
            expect(response.body.message.length).toBeGreaterThan(0);
        });
    });
});