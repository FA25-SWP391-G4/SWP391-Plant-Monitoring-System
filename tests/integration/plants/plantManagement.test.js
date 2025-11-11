/**
 * PLANT MANAGEMENT INTEGRATION TESTS
 * ===================================
 * 
 * Integration tests for UC2-UC4: Plant Management, Care Reminders, and Monitoring
 * Tests real API endpoints with database interactions
 * 
 * Coverage:
 * - Plant CRUD operations via API
 * - Watering system integration
 * - Sensor data collection and stats
 * - Care reminder scheduling
 * - Auto watering functionality
 */

const request = require('supertest');
const app = require('../../../app');
const { Pool } = require('pg');

describe('Plant Management Integration Tests', () => {
    let authToken;
    let testUserId;
    let testPlantId;
    let testZoneId;
    let testProfileId;

    // Setup test database and authentication
    beforeAll(async () => {
        // Create test user and get auth token
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'planttest@test.com',
                password: 'password123',
                firstName: 'Plant',
                lastName: 'Tester'
            });

        authToken = registerResponse.body.token;
        testUserId = registerResponse.body.user.id;

        // Create test zone
        const zoneResponse = await request(app)
            .post('/api/zones')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                zone_name: 'Test Garden',
                description: 'Integration test zone'
            });

        testZoneId = zoneResponse.body.data?.id || 1;

        // Create test plant profile
        const profileResponse = await request(app)
            .post('/api/plant-profiles')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                species_name: 'Test Rose',
                description: 'Test species for integration tests',
                ideal_moisture: 75,
                ideal_temperature_min: 18,
                ideal_temperature_max: 25
            });

        testProfileId = profileResponse.body.data?.id || 1;
    });

    // Cleanup after tests
    afterAll(async () => {
        // Clean up test data
        if (testPlantId) {
            await request(app)
                .delete(`/api/plants/${testPlantId}`)
                .set('Authorization', `Bearer ${authToken}`);
        }
        
        // Note: In a real test environment, you'd clean up zones, profiles, and users too
    });

    describe('UC2: Manage Plant Information', () => {
        describe('POST /api/plants', () => {
            it('should create a new plant successfully', async () => {
                const plantData = {
                    custom_name: 'Integration Test Rose',
                    profile_id: testProfileId,
                    notes: 'Created during integration testing',
                    zone_id: testZoneId,
                    moisture_threshold: 70
                };

                const response = await request(app)
                    .post('/api/plants')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(plantData);

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toMatchObject({
                    custom_name: plantData.custom_name,
                    profile_id: testProfileId,
                    user_id: testUserId
                });

                testPlantId = response.body.data.id;
            });

            it('should validate required fields', async () => {
                const response = await request(app)
                    .post('/api/plants')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        // Missing custom_name
                        profile_id: testProfileId
                    });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toContain('name is required');
            });

            it('should require authentication', async () => {
                const response = await request(app)
                    .post('/api/plants')
                    .send({
                        custom_name: 'Unauthorized Plant',
                        profile_id: testProfileId
                    });

                expect(response.status).toBe(401);
                expect(response.body.message).toContain('token');
            });
        });

        describe('GET /api/plants', () => {
            it('should retrieve user plants', async () => {
                const response = await request(app)
                    .get('/api/plants')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body.data.length).toBeGreaterThan(0);

                const plant = response.body.data[0];
                expect(plant).toHaveProperty('id');
                expect(plant).toHaveProperty('name');
                expect(plant).toHaveProperty('species');
            });

            it('should not return other users plants', async () => {
                // Create another user
                const otherUserResponse = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'other@test.com',
                        password: 'password123',
                        firstName: 'Other',
                        lastName: 'User'
                    });

                const otherUserToken = otherUserResponse.body.token;

                // Get plants for other user
                const response = await request(app)
                    .get('/api/plants')
                    .set('Authorization', `Bearer ${otherUserToken}`);

                expect(response.status).toBe(200);
                expect(response.body.data).toEqual([]);
            });
        });

        describe('GET /api/plants/:id', () => {
            it('should retrieve specific plant details', async () => {
                const response = await request(app)
                    .get(`/api/plants/${testPlantId}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    id: testPlantId,
                    name: 'Integration Test Rose',
                    species: expect.any(String),
                    status: expect.any(String)
                });
            });

            it('should not allow access to other users plants', async () => {
                // Create another user
                const otherUserResponse = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'another@test.com',
                        password: 'password123',
                        firstName: 'Another',
                        lastName: 'User'
                    });

                const otherUserToken = otherUserResponse.body.token;

                // Try to access test plant with other user token
                const response = await request(app)
                    .get(`/api/plants/${testPlantId}`)
                    .set('Authorization', `Bearer ${otherUserToken}`);

                expect(response.status).toBe(404);
            });

            it('should validate plant ID format', async () => {
                const response = await request(app)
                    .get('/api/plants/invalid-id')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Invalid plant ID');
            });
        });
    });

    describe('UC3: View Plant Care Reminders', () => {
        describe('GET /api/plants/:id/watering-schedule', () => {
            it('should retrieve watering schedule for plant', async () => {
                const response = await request(app)
                    .get(`/api/plants/${testPlantId}/watering-schedule`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                // May be null if no schedule set yet
                expect(response.body.data).toBeDefined();
            });
        });

        describe('POST /api/plants/:id/watering-schedule', () => {
            it('should set watering schedule successfully', async () => {
                const scheduleData = {
                    schedule_time: '08:00',
                    frequency_days: 3,
                    is_active: true
                };

                const response = await request(app)
                    .post(`/api/plants/${testPlantId}/watering-schedule`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(scheduleData);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toMatchObject({
                    schedule_time: '08:00',
                    frequency_days: 3,
                    is_active: true
                });
            });

            it('should validate schedule time format', async () => {
                const response = await request(app)
                    .post(`/api/plants/${testPlantId}/watering-schedule`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        schedule_time: '25:00', // Invalid time
                        frequency_days: 3,
                        is_active: true
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Invalid schedule time');
            });

            it('should validate frequency range', async () => {
                const response = await request(app)
                    .post(`/api/plants/${testPlantId}/watering-schedule`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        schedule_time: '08:00',
                        frequency_days: 50, // Too high
                        is_active: true
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Frequency days must be between 1 and 30');
            });
        });

        describe('GET /api/plants/:id/watering-history', () => {
            it('should retrieve watering history', async () => {
                const response = await request(app)
                    .get(`/api/plants/${testPlantId}/watering-history`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .query({
                        limit: 10,
                        offset: 0
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
            });

            it('should support pagination', async () => {
                const response = await request(app)
                    .get(`/api/plants/${testPlantId}/watering-history`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .query({
                        limit: 5,
                        offset: 10
                    });

                expect(response.status).toBe(200);
                expect(response.body.data.length).toBeLessThanOrEqual(5);
            });
        });
    });

    describe('UC4: View Plant Monitoring Dashboard', () => {
        describe('POST /api/plants/:id/water', () => {
            it('should water plant manually', async () => {
                const wateringData = {
                    amount: 250,
                    method: 'manual'
                };

                const response = await request(app)
                    .post(`/api/plants/${testPlantId}/water`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(wateringData);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toMatchObject({
                    amount: 250,
                    method: 'manual'
                });
            });

            it('should validate water amount', async () => {
                const response = await request(app)
                    .post(`/api/plants/${testPlantId}/water`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        amount: 1500 // Too much water
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Water amount must be between');
            });
        });

        describe('GET /api/plants/:id/sensor-data', () => {
            it('should retrieve current sensor data', async () => {
                const response = await request(app)
                    .get(`/api/plants/${testPlantId}/sensor-data`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                // Data may be null if no sensors connected
                expect(response.body.data).toBeDefined();
            });
        });

        describe('GET /api/plants/:id/sensor-history', () => {
            it('should retrieve sensor history with pagination', async () => {
                const response = await request(app)
                    .get(`/api/plants/${testPlantId}/sensor-history`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .query({
                        limit: 24,
                        offset: 0,
                        period: '24h'
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
            });

            it('should validate period parameter', async () => {
                const response = await request(app)
                    .get(`/api/plants/${testPlantId}/sensor-history`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .query({
                        period: 'invalid-period'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Invalid period');
            });
        });

        describe('GET /api/plants/:id/sensor-stats', () => {
            it('should retrieve sensor statistics', async () => {
                const response = await request(app)
                    .get(`/api/plants/${testPlantId}/sensor-stats`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .query({
                        period: '7d'
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                
                if (response.body.data) {
                    expect(response.body.data).toHaveProperty('period', '7d');
                    expect(response.body.data).toHaveProperty('generated_at');
                }
            });
        });

        describe('POST /api/plants/:id/auto-watering', () => {
            it('should toggle auto watering on', async () => {
                const response = await request(app)
                    .post(`/api/plants/${testPlantId}/auto-watering`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        enabled: true
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('enabled');
            });

            it('should toggle auto watering off', async () => {
                const response = await request(app)
                    .post(`/api/plants/${testPlantId}/auto-watering`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        enabled: false
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('disabled');
            });

            it('should validate enabled parameter', async () => {
                const response = await request(app)
                    .post(`/api/plants/${testPlantId}/auto-watering`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        enabled: 'invalid'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('enabled must be a boolean');
            });
        });

        describe('POST /api/plants/:id/sensor-thresholds', () => {
            it('should update sensor thresholds', async () => {
                const thresholds = {
                    moisture_threshold: 65,
                    temperature_min: 18,
                    temperature_max: 25,
                    humidity_min: 40,
                    humidity_max: 70
                };

                const response = await request(app)
                    .post(`/api/plants/${testPlantId}/sensor-thresholds`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(thresholds);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toMatchObject({
                    moisture_threshold: 65,
                    temperature_min: 18,
                    temperature_max: 25
                });
            });

            it('should validate threshold ranges', async () => {
                const response = await request(app)
                    .post(`/api/plants/${testPlantId}/sensor-thresholds`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        moisture_threshold: 150, // Invalid range
                        temperature_min: 18,
                        temperature_max: 25
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Moisture threshold must be between 0 and 100');
            });
        });

        describe('GET /api/plants/:id/last-watered', () => {
            it('should retrieve last watered timestamp', async () => {
                const response = await request(app)
                    .get(`/api/plants/${testPlantId}/last-watered`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveProperty('last_watered');
            });
        });
    });

    describe('Database Integration', () => {
        it('should handle database connection errors gracefully', async () => {
            // This test would require mocking the database connection
            // to simulate connection failures
        });

        it('should maintain data consistency across operations', async () => {
            // Create plant, update it, retrieve it, verify data consistency
            const createResponse = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    custom_name: 'Consistency Test Plant',
                    profile_id: testProfileId,
                    notes: 'Testing data consistency',
                    moisture_threshold: 80
                });

            const plantId = createResponse.body.data.id;

            // Water the plant
            await request(app)
                .post(`/api/plants/${plantId}/water`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 200 });

            // Verify the watering history was recorded
            const historyResponse = await request(app)
                .get(`/api/plants/${plantId}/watering-history`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(historyResponse.body.data.length).toBeGreaterThan(0);
            expect(historyResponse.body.data[0]).toMatchObject({
                amount: 200,
                plant_id: plantId
            });
        });
    });

    describe('Performance Tests', () => {
        it('should handle multiple concurrent plant requests', async () => {
            const promises = [];
            
            for (let i = 0; i < 5; i++) {
                promises.push(
                    request(app)
                        .get('/api/plants')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            }

            const responses = await Promise.all(promises);
            
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        it('should respond within reasonable time limits', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/plants')
                .set('Authorization', `Bearer ${authToken}`);

            const responseTime = Date.now() - startTime;
            
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        });
    });
});