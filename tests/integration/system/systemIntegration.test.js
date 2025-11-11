// System Integration Tests
// Test comprehensive API routing, database integrity, and system-wide functionality

const request = require('supertest');
const app = require('../../app');
const { setupTestDatabase, cleanupTestDatabase } = require('../setup/testDb');
const { createTestUser, createTestAdmin } = require('../helpers/userHelpers');
const { createTestPlant, createTestDevice } = require('../helpers/plantHelpers');
const { mockPaymentService } = require('../mocks/paymentMocks');
const { mockAIService } = require('../mocks/aiMocks');

describe('System Integration Tests', () => {
    let testDb;
    let userToken;
    let adminToken;
    let testUser;
    let testAdmin;
    let testPlant;
    let testDevice;

    beforeAll(async () => {
        testDb = await setupTestDatabase();
        
        // Create test users
        testUser = await createTestUser({
            email: 'user@test.com',
            username: 'testuser',
            isPremium: true
        });
        
        testAdmin = await createTestAdmin({
            email: 'admin@test.com',
            username: 'testadmin'
        });

        // Get authentication tokens
        const userLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'user@test.com',
                password: 'password123'
            });
        userToken = userLogin.body.token;

        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@test.com',
                password: 'password123'
            });
        adminToken = adminLogin.body.token;

        // Create test plant and device
        testPlant = await createTestPlant({
            user_id: testUser.id,
            plant_name: 'Test Plant',
            species: 'Test Species'
        });

        testDevice = await createTestDevice({
            plant_id: testPlant.id,
            device_type: 'sensor',
            device_name: 'Test Sensor'
        });
    });

    afterAll(async () => {
        await cleanupTestDatabase(testDb);
    });

    describe('API Route Mapping and Security', () => {
        
        test('should have proper authentication middleware on protected routes', async () => {
            const protectedRoutes = [
                { method: 'get', path: '/api/dashboard' },
                { method: 'get', path: '/api/plants' },
                { method: 'post', path: '/api/plants' },
                { method: 'get', path: '/api/devices' },
                { method: 'post', path: '/api/devices' },
                { method: 'get', path: '/api/alerts' },
                { method: 'get', path: '/api/analytics' },
                { method: 'get', path: '/api/users/profile' },
                { method: 'put', path: '/api/users/profile' }
            ];

            for (const route of protectedRoutes) {
                const response = await request(app)
                    [route.method](route.path);
                
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toMatch(/unauthorized|token|authentication/i);
            }
        });

        test('should have proper admin middleware on admin routes', async () => {
            const adminRoutes = [
                { method: 'get', path: '/api/admin/users' },
                { method: 'post', path: '/api/admin/plant-profiles' },
                { method: 'get', path: '/api/admin/system-logs' },
                { method: 'post', path: '/api/admin/backup' },
                { method: 'get', path: '/api/admin/analytics' }
            ];

            // Test without token
            for (const route of adminRoutes) {
                const response = await request(app)
                    [route.method](route.path);
                
                expect(response.status).toBe(401);
            }

            // Test with regular user token
            for (const route of adminRoutes) {
                const response = await request(app)
                    [route.method](route.path)
                    .set('Authorization', `Bearer ${userToken}`);
                
                expect([403, 401]).toContain(response.status);
            }
        });

        test('should properly handle CORS for API routes', async () => {
            const response = await request(app)
                .options('/api/auth/login')
                .set('Origin', 'http://localhost:3000');

            expect(response.status).toBe(200);
            expect(response.headers['access-control-allow-origin']).toBeDefined();
            expect(response.headers['access-control-allow-methods']).toBeDefined();
            expect(response.headers['access-control-allow-headers']).toBeDefined();
        });

        test('should have proper rate limiting on sensitive endpoints', async () => {
            const sensitiveRoutes = [
                '/api/auth/login',
                '/api/auth/register',
                '/api/auth/forgot-password'
            ];

            for (const route of sensitiveRoutes) {
                // Make multiple rapid requests
                const requests = Array(10).fill().map(() => 
                    request(app)
                        .post(route)
                        .send({ email: 'test@test.com', password: 'test123' })
                );

                const responses = await Promise.all(requests);
                
                // At least some requests should be rate limited
                const rateLimitedResponses = responses.filter(r => r.status === 429);
                expect(rateLimitedResponses.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Database Integrity and Consistency', () => {
        
        test('should maintain referential integrity across tables', async () => {
            // Create related records
            const plantResponse = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Integrity Test Plant',
                    species: 'Test Species',
                    location: 'Test Location'
                });

            const plant = plantResponse.body.data;
            expect(plant).toBeDefined();
            expect(plant.id).toBeDefined();

            // Create device for plant
            const deviceResponse = await request(app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_id: plant.id,
                    device_type: 'sensor',
                    device_name: 'Integrity Test Sensor'
                });

            const device = deviceResponse.body.data;
            expect(device).toBeDefined();
            expect(device.plant_id).toBe(plant.id);

            // Verify foreign key relationship
            const plantWithDevices = await request(app)
                .get(`/api/plants/${plant.id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(plantWithDevices.body.data.devices).toBeDefined();
            expect(plantWithDevices.body.data.devices).toHaveLength(1);
            expect(plantWithDevices.body.data.devices[0].id).toBe(device.id);

            // Test cascade delete behavior
            const deleteResponse = await request(app)
                .delete(`/api/plants/${plant.id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(deleteResponse.status).toBe(200);

            // Verify device is also deleted (cascade)
            const orphanedDevice = await request(app)
                .get(`/api/devices/${device.id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(orphanedDevice.status).toBe(404);
        });

        test('should handle concurrent operations properly', async () => {
            // Create multiple concurrent plant creation requests
            const concurrentRequests = Array(5).fill().map((_, index) => 
                request(app)
                    .post('/api/plants')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        plant_name: `Concurrent Plant ${index}`,
                        species: 'Concurrent Species',
                        location: 'Test Location'
                    })
            );

            const responses = await Promise.all(concurrentRequests);
            
            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(201);
                expect(response.body.data.id).toBeDefined();
            });

            // All plants should have unique IDs
            const plantIds = responses.map(r => r.body.data.id);
            const uniqueIds = new Set(plantIds);
            expect(uniqueIds.size).toBe(plantIds.length);
        });

        test('should properly handle database transactions', async () => {
            // Test a complex operation that should be transactional
            const paymentData = {
                amount: 10000,
                package: 'premium',
                description: 'Test Premium Subscription'
            };

            // Mock payment service to simulate failure
            mockPaymentService.mockImplementation(() => {
                throw new Error('Payment processing failed');
            });

            const paymentResponse = await request(app)
                .post('/api/payment/create')
                .set('Authorization', `Bearer ${userToken}`)
                .send(paymentData);

            expect(paymentResponse.status).toBe(500);

            // Verify no partial data was saved
            const userProfile = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${userToken}`);

            expect(userProfile.body.data.isPremium).toBe(true); // Should remain unchanged
        });
    });

    describe('End-to-End System Workflows', () => {
        
        test('complete plant monitoring workflow', async () => {
            // 1. Create plant
            const plantResponse = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'E2E Test Plant',
                    species: 'Rosa damascena',
                    location: 'Garden'
                });

            const plant = plantResponse.body.data;
            expect(plant.id).toBeDefined();

            // 2. Add sensor device
            const sensorResponse = await request(app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_id: plant.id,
                    device_type: 'sensor',
                    device_name: 'E2E Moisture Sensor'
                });

            const sensor = sensorResponse.body.data;
            expect(sensor.id).toBeDefined();

            // 3. Add pump device
            const pumpResponse = await request(app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_id: plant.id,
                    device_type: 'pump',
                    device_name: 'E2E Water Pump'
                });

            const pump = pumpResponse.body.data;
            expect(pump.id).toBeDefined();

            // 4. Submit sensor data
            const sensorDataResponse = await request(app)
                .post('/api/sensor-data')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    device_id: sensor.id,
                    moisture: 25,
                    temperature: 22,
                    humidity: 65,
                    light_level: 800
                });

            expect(sensorDataResponse.status).toBe(201);

            // 5. Check dashboard reflects new data
            const dashboardResponse = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${userToken}`);

            expect(dashboardResponse.status).toBe(200);
            expect(dashboardResponse.body.data.plants).toContainEqual(
                expect.objectContaining({
                    id: plant.id,
                    plant_name: 'E2E Test Plant'
                })
            );

            // 6. Trigger manual watering
            const waterResponse = await request(app)
                .post(`/api/plants/${plant.id}/water`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    duration: 30
                });

            expect(waterResponse.status).toBe(200);

            // 7. Verify watering history
            const historyResponse = await request(app)
                .get(`/api/plants/${plant.id}/watering-history`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(historyResponse.status).toBe(200);
            expect(historyResponse.body.data).toHaveLength(1);
            expect(historyResponse.body.data[0]).toMatchObject({
                plant_id: plant.id,
                trigger_type: 'manual',
                duration: 30
            });

            // 8. Set up automatic schedule
            const scheduleResponse = await request(app)
                .post(`/api/plants/${plant.id}/schedule`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    cron_expression: '0 8 * * *', // Daily at 8 AM
                    duration: 60,
                    is_active: true
                });

            expect(scheduleResponse.status).toBe(201);

            // 9. Check analytics includes this plant
            const analyticsResponse = await request(app)
                .get('/api/analytics')
                .set('Authorization', `Bearer ${userToken}`)
                .query({
                    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    end_date: new Date().toISOString()
                });

            expect(analyticsResponse.status).toBe(200);
            expect(analyticsResponse.body.data.plantsData).toBeDefined();
        });

        test('complete AI integration workflow', async () => {
            // Mock AI service for this test
            mockAIService.mockResolvedValue({
                disease_detected: true,
                disease_name: 'Leaf Spot',
                confidence: 0.85,
                treatment_recommendations: ['Apply fungicide', 'Improve air circulation']
            });

            // 1. Upload plant image for AI analysis
            const imageBuffer = Buffer.from('mock image data');
            
            const aiResponse = await request(app)
                .post('/api/ai/analyze-image')
                .set('Authorization', `Bearer ${userToken}`)
                .attach('image', imageBuffer, 'test-plant.jpg')
                .field('plant_id', testPlant.id);

            expect(aiResponse.status).toBe(200);
            expect(aiResponse.body.data).toMatchObject({
                disease_detected: true,
                disease_name: 'Leaf Spot',
                confidence: 0.85
            });

            // 2. Check AI predictions were saved
            const predictionsResponse = await request(app)
                .get('/api/ai/predictions')
                .set('Authorization', `Bearer ${userToken}`)
                .query({ plant_id: testPlant.id });

            expect(predictionsResponse.status).toBe(200);
            expect(predictionsResponse.body.data).toHaveLength(1);
            expect(predictionsResponse.body.data[0]).toMatchObject({
                plant_id: testPlant.id,
                disease_name: 'Leaf Spot',
                confidence: 0.85
            });

            // 3. Get AI-powered care recommendations
            const recommendationsResponse = await request(app)
                .get(`/api/ai/care-recommendations/${testPlant.id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(recommendationsResponse.status).toBe(200);
            expect(recommendationsResponse.body.data).toHaveProperty('recommendations');
            expect(recommendationsResponse.body.data.recommendations).toBeInstanceOf(Array);
        });
    });

    describe('Performance and Load Testing', () => {
        
        test('should handle dashboard load efficiently', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${userToken}`);

            const responseTime = Date.now() - startTime;

            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
            expect(response.body.data).toHaveProperty('plants');
            expect(response.body.data).toHaveProperty('recentAlerts');
            expect(response.body.data).toHaveProperty('systemStatus');
        });

        test('should handle concurrent user requests', async () => {
            // Simulate multiple users accessing dashboard simultaneously
            const concurrentUsers = 10;
            const requests = Array(concurrentUsers).fill().map(() => 
                request(app)
                    .get('/api/dashboard')
                    .set('Authorization', `Bearer ${userToken}`)
            );

            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const totalTime = Date.now() - startTime;

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });

            // Average response time should be reasonable
            const averageResponseTime = totalTime / concurrentUsers;
            expect(averageResponseTime).toBeLessThan(3000);
        });

        test('should handle large dataset queries efficiently', async () => {
            // Create multiple sensor data points
            const sensorDataPoints = Array(100).fill().map((_, index) => ({
                device_id: testDevice.id,
                moisture: Math.random() * 100,
                temperature: 20 + Math.random() * 15,
                humidity: 40 + Math.random() * 40,
                light_level: 200 + Math.random() * 800,
                recorded_at: new Date(Date.now() - index * 60000).toISOString()
            }));

            // Batch insert sensor data
            for (const dataPoint of sensorDataPoints) {
                await request(app)
                    .post('/api/sensor-data')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(dataPoint);
            }

            const startTime = Date.now();
            
            // Query analytics with large dataset
            const analyticsResponse = await request(app)
                .get('/api/analytics')
                .set('Authorization', `Bearer ${userToken}`)
                .query({
                    start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    end_date: new Date().toISOString(),
                    plant_id: testPlant.id
                });

            const responseTime = Date.now() - startTime;

            expect(analyticsResponse.status).toBe(200);
            expect(responseTime).toBeLessThan(5000); // Should handle large datasets within 5 seconds
            expect(analyticsResponse.body.data).toHaveProperty('plantsData');
        });
    });

    describe('Error Handling and Recovery', () => {
        
        test('should gracefully handle database connection failures', async () => {
            // This would need to be implemented with database mocking
            // to simulate connection failures
            
            // For now, test that errors are properly formatted
            const response = await request(app)
                .get('/api/plants/invalid-uuid')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBeDefined();
        });

        test('should handle malformed request data', async () => {
            const malformedRequests = [
                {
                    endpoint: '/api/plants',
                    method: 'post',
                    data: { invalid_field: 'test' }
                },
                {
                    endpoint: '/api/devices',
                    method: 'post',
                    data: { device_type: 'invalid_type' }
                },
                {
                    endpoint: '/api/sensor-data',
                    method: 'post',
                    data: { moisture: 'not_a_number' }
                }
            ];

            for (const req of malformedRequests) {
                const response = await request(app)
                    [req.method](req.endpoint)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(req.data);

                expect(response.status).toBeGreaterThanOrEqualTo(400);
                expect(response.status).toBeLessThan(500);
                expect(response.body).toHaveProperty('error');
            }
        });

        test('should properly log system errors', async () => {
            // Trigger an error that should be logged
            await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({}); // Empty data should trigger validation error

            // Check system logs (admin endpoint)
            const logsResponse = await request(app)
                .get('/api/admin/system-logs')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    level: 'error',
                    limit: 10
                });

            expect(logsResponse.status).toBe(200);
            expect(logsResponse.body.data).toBeInstanceOf(Array);
            
            // Should have at least one error log
            const errorLogs = logsResponse.body.data.filter(log => 
                log.level === 'error' && 
                log.message.includes('validation')
            );
            
            expect(errorLogs.length).toBeGreaterThan(0);
        });
    });

    describe('Security Integration', () => {
        
        test('should prevent SQL injection attacks', async () => {
            const maliciousInputs = [
                "'; DROP TABLE users; --",
                "1' OR '1'='1",
                "admin'--",
                "1; SELECT * FROM users WHERE '1'='1"
            ];

            for (const input of maliciousInputs) {
                const response = await request(app)
                    .get('/api/plants')
                    .set('Authorization', `Bearer ${userToken}`)
                    .query({ search: input });

                // Should not crash or return unexpected data
                expect(response.status).toBeLessThan(500);
                
                if (response.status === 200) {
                    expect(response.body.data).toBeInstanceOf(Array);
                }
            }
        });

        test('should prevent XSS attacks', async () => {
            const xssPayloads = [
                '<script>alert("xss")</script>',
                '"><script>alert("xss")</script>',
                "javascript:alert('xss')",
                '<img src=x onerror=alert("xss")>'
            ];

            for (const payload of xssPayloads) {
                const response = await request(app)
                    .post('/api/plants')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        plant_name: payload,
                        species: 'Test Species',
                        location: 'Test Location'
                    });

                if (response.status === 201) {
                    // If created, the XSS should be sanitized
                    expect(response.body.data.plant_name).not.toContain('<script>');
                    expect(response.body.data.plant_name).not.toContain('javascript:');
                }
            }
        });

        test('should enforce proper authentication token validation', async () => {
            const invalidTokens = [
                'Bearer invalid.jwt.token',
                'Bearer ',
                'InvalidFormat',
                'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
            ];

            for (const token of invalidTokens) {
                const response = await request(app)
                    .get('/api/dashboard')
                    .set('Authorization', token);

                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('error');
            }
        });
    });
});