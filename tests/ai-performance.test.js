/**
 * AI Performance Benchmark Tests
 * Tests to ensure AI system meets performance requirements
 */

const request = require('supertest');
const app = require('../app');
const path = require('path');
const fs = require('fs');

// Test utilities
const { setupTestDatabase, cleanupTestDatabase, createTestUser, createTestPlant } = require('./ai-test-setup');

describe('AI Performance Benchmarks', () => {
    let testUser;
    let authToken;
    let testPlant;
    let testImagePath;

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
        
        // Create test image
        testImagePath = path.join(__dirname, 'test-images', 'perf-test-plant.jpg');
        await createTestImage(testImagePath);
    });

    afterAll(async () => {
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
        await cleanupTestDatabase();
    });

    describe('Response Time Requirements', () => {
        test('watering prediction should respond within 3 seconds', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
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

            const responseTime = Date.now() - startTime;
            
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(3000); // 3 seconds
            expect(response.body.data).toHaveProperty('processing_time_ms');
        });

        test('image recognition should respond within 5 seconds', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/ai/image-recognition')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('image', testImagePath)
                .field('plant_id', testPlant.plant_id.toString());

            const responseTime = Date.now() - startTime;
            
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(5000); // 5 seconds
            expect(response.body.data).toHaveProperty('processing_time_ms');
        });

        test('cached responses should be significantly faster', async () => {
            const sensorData = {
                moisture: 50,
                temperature: 25,
                humidity: 60,
                light: 700
            };

            // First request (uncached)
            const startTime1 = Date.now();
            const response1 = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: testPlant.plant_id,
                    sensor_data: sensorData
                });
            const time1 = Date.now() - startTime1;

            expect(response1.status).toBe(200);

            // Second request (should be cached)
            const startTime2 = Date.now();
            const response2 = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: testPlant.plant_id,
                    sensor_data: sensorData
                });
            const time2 = Date.now() - startTime2;

            expect(response2.status).toBe(200);
            
            // Cached response should be at least 50% faster
            expect(time2).toBeLessThan(time1 * 0.5);
        });
    });

    describe('Concurrent User Support', () => {
        test('should handle 10 concurrent watering predictions', async () => {
            const requests = [];
            const startTime = Date.now();
            
            for (let i = 0; i < 10; i++) {
                requests.push(
                    request(app)
                        .post('/api/ai/watering-prediction')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            plant_id: testPlant.plant_id,
                            sensor_data: {
                                moisture: 40 + i,
                                temperature: 22 + (i % 5),
                                humidity: 60,
                                light: 500 + (i * 10)
                            }
                        })
                );
            }

            const responses = await Promise.all(requests);
            const totalTime = Date.now() - startTime;
            
            // All requests should succeed
            responses.forEach((response, index) => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
            
            // Average response time should be reasonable
            const avgTime = totalTime / responses.length;
            expect(avgTime).toBeLessThan(4000); // 4 seconds average
        });

        test('should handle 5 concurrent image analyses', async () => {
            const requests = [];
            const startTime = Date.now();
            
            for (let i = 0; i < 5; i++) {
                requests.push(
                    request(app)
                        .post('/api/ai/image-recognition')
                        .set('Authorization', `Bearer ${authToken}`)
                        .attach('image', testImagePath)
                        .field('plant_id', testPlant.plant_id.toString())
                );
            }

            const responses = await Promise.all(requests);
            const totalTime = Date.now() - startTime;
            
            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
            
            // Average response time should be reasonable
            const avgTime = totalTime / responses.length;
            expect(avgTime).toBeLessThan(8000); // 8 seconds average for image processing
        });
    });

    describe('Memory Usage Monitoring', () => {
        test('should not have excessive memory growth during operations', async () => {
            // Get initial memory usage
            const initialStats = await request(app)
                .get('/api/ai/performance/stats')
                .set('Authorization', `Bearer ${authToken}`);
            
            const initialMemory = initialStats.body.data.system.memory.heapUsed;
            
            // Perform multiple operations
            const operations = [];
            for (let i = 0; i < 20; i++) {
                operations.push(
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
            
            await Promise.all(operations);
            
            // Get final memory usage
            const finalStats = await request(app)
                .get('/api/ai/performance/stats')
                .set('Authorization', `Bearer ${authToken}`);
            
            const finalMemory = finalStats.body.data.system.memory.heapUsed;
            const memoryGrowth = finalMemory - initialMemory;
            
            // Memory growth should be reasonable (less than 100MB)
            expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024);
        });

        test('should cleanup resources properly', async () => {
            // Perform operations that create resources
            await request(app)
                .post('/api/ai/image-recognition')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('image', testImagePath)
                .field('plant_id', testPlant.plant_id.toString());

            // Trigger optimization/cleanup
            const optimizeResponse = await request(app)
                .post('/api/ai/performance/optimize')
                .set('Authorization', `Bearer ${authToken}`);

            // Should either succeed (if admin) or be forbidden
            expect([200, 403]).toContain(optimizeResponse.status);
            
            if (optimizeResponse.status === 200) {
                expect(optimizeResponse.body.success).toBe(true);
                expect(optimizeResponse.body.data).toHaveProperty('cache');
                expect(optimizeResponse.body.data).toHaveProperty('modelManager');
                expect(optimizeResponse.body.data).toHaveProperty('imageProcessor');
            }
        });
    });

    describe('Cache Performance', () => {
        test('should achieve good cache hit rates', async () => {
            const sensorDataTemplates = [
                { moisture: 45, temperature: 24, humidity: 65, light: 600 },
                { moisture: 55, temperature: 26, humidity: 70, light: 650 },
                { moisture: 35, temperature: 22, humidity: 60, light: 550 }
            ];

            // Make multiple requests with similar data
            const requests = [];
            for (let i = 0; i < 15; i++) {
                const template = sensorDataTemplates[i % 3];
                requests.push(
                    request(app)
                        .post('/api/ai/watering-prediction')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            plant_id: testPlant.plant_id,
                            sensor_data: {
                                ...template,
                                moisture: template.moisture + (Math.random() * 2 - 1) // Small variation
                            }
                        })
                );
            }

            await Promise.all(requests);

            // Check cache statistics
            const statsResponse = await request(app)
                .get('/api/ai/performance/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(statsResponse.status).toBe(200);
            expect(statsResponse.body.data.cache).toHaveProperty('stats');
            
            // Should have some cache hits
            const cacheStats = statsResponse.body.data.cache.stats;
            if (cacheStats.hits !== undefined && cacheStats.misses !== undefined) {
                const totalRequests = cacheStats.hits + cacheStats.misses;
                if (totalRequests > 0) {
                    const hitRate = cacheStats.hits / totalRequests;
                    expect(hitRate).toBeGreaterThan(0); // Should have some cache hits
                }
            }
        });
    });

    describe('Error Handling Performance', () => {
        test('should handle errors quickly without blocking', async () => {
            const startTime = Date.now();
            
            // Make request with invalid data
            const response = await request(app)
                .post('/api/ai/watering-prediction')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    plant_id: testPlant.plant_id,
                    sensor_data: {
                        moisture: 'invalid',
                        temperature: 'also_invalid'
                    }
                });

            const responseTime = Date.now() - startTime;
            
            expect(response.status).toBe(400);
            expect(responseTime).toBeLessThan(1000); // Error handling should be fast
        });

        test('should maintain performance after errors', async () => {
            // Generate some errors
            const errorRequests = [];
            for (let i = 0; i < 5; i++) {
                errorRequests.push(
                    request(app)
                        .post('/api/ai/watering-prediction')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            plant_id: testPlant.plant_id,
                            sensor_data: { invalid: 'data' }
                        })
                );
            }

            await Promise.allSettled(errorRequests);

            // Now make valid requests
            const startTime = Date.now();
            const validResponse = await request(app)
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
            const responseTime = Date.now() - startTime;

            expect(validResponse.status).toBe(200);
            expect(responseTime).toBeLessThan(3000); // Should still be fast after errors
        });
    });

    describe('System Health Monitoring', () => {
        test('should provide performance metrics', async () => {
            const response = await request(app)
                .get('/api/ai/performance/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            const data = response.body.data;
            expect(data).toHaveProperty('system');
            expect(data.system).toHaveProperty('memory');
            expect(data.system).toHaveProperty('uptime');
            
            // Memory usage should be reasonable
            const memoryMB = data.system.memory.heapUsed / (1024 * 1024);
            expect(memoryMB).toBeLessThan(500); // Less than 500MB heap usage
        });

        test('should report healthy status for all components', async () => {
            const response = await request(app)
                .get('/api/ai/performance/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            
            const data = response.body.data;
            const components = ['errorHandler', 'cache', 'modelManager', 'imageProcessor'];
            
            components.forEach(component => {
                expect(data).toHaveProperty(component);
                expect(data[component]).toHaveProperty('healthy');
                expect(data[component].healthy).toBe(true);
            });
        });
    });
});

/**
 * Helper function to create a test image
 */
async function createTestImage(imagePath) {
    const sharp = require('sharp');
    const dir = path.dirname(imagePath);
    
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create a test image with some variation for performance testing
    await sharp({
        create: {
            width: 300,
            height: 300,
            channels: 3,
            background: { r: 60, g: 140, b: 60 }
        }
    })
    .jpeg({ quality: 85 })
    .toFile(imagePath);
}