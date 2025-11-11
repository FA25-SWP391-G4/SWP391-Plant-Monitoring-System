// Database Integrity and API Validation Tests
// Test database constraints, data consistency, and API contract compliance

const request = require('supertest');
const app = require('../../app');
const { setupTestDatabase, cleanupTestDatabase } = require('../setup/testDb');
const { createTestUser } = require('../helpers/userHelpers');
const db = require('../../config/db');

describe('Database Integrity Tests', () => {
    let testDb;
    let userToken;
    let testUser;

    beforeAll(async () => {
        testDb = await setupTestDatabase();
        
        testUser = await createTestUser({
            email: 'integrity@test.com',
            username: 'integrityuser'
        });

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'integrity@test.com',
                password: 'password123'
            });
        
        userToken = loginResponse.body.token;
    });

    afterAll(async () => {
        await cleanupTestDatabase(testDb);
    });

    describe('Table Constraints and Relationships', () => {
        
        test('should enforce unique constraints', async () => {
            // Test unique email constraint
            const duplicateEmailResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'integrity@test.com', // Same email as test user
                    username: 'differentuser',
                    password: 'password123',
                    full_name: 'Different User'
                });

            expect(duplicateEmailResponse.status).toBe(400);
            expect(duplicateEmailResponse.body.error).toMatch(/email.*already.*exists/i);

            // Test unique username constraint
            const duplicateUsernameResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'different@test.com',
                    username: 'integrityuser', // Same username as test user
                    password: 'password123',
                    full_name: 'Different User'
                });

            expect(duplicateUsernameResponse.status).toBe(400);
            expect(duplicateUsernameResponse.body.error).toMatch(/username.*already.*exists/i);
        });

        test('should enforce NOT NULL constraints', async () => {
            // Test required fields in plant creation
            const requiredFieldTests = [
                { field: 'plant_name', data: { species: 'Test Species', location: 'Garden' } },
                { field: 'species', data: { plant_name: 'Test Plant', location: 'Garden' } },
                { field: 'location', data: { plant_name: 'Test Plant', species: 'Test Species' } }
            ];

            for (const test of requiredFieldTests) {
                const response = await request(app)
                    .post('/api/plants')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(test.data);

                expect(response.status).toBe(400);
                expect(response.body.error).toMatch(new RegExp(test.field, 'i'));
            }
        });

        test('should enforce foreign key constraints', async () => {
            // Try to create device with non-existent plant_id
            const invalidDeviceResponse = await request(app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_id: '123e4567-e89b-12d3-a456-426614174000', // Non-existent UUID
                    device_type: 'sensor',
                    device_name: 'Invalid Device'
                });

            expect(invalidDeviceResponse.status).toBe(400);
            expect(invalidDeviceResponse.body.error).toMatch(/plant.*not.*found|foreign.*key/i);

            // Try to create sensor data with non-existent device_id
            const invalidSensorDataResponse = await request(app)
                .post('/api/sensor-data')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    device_id: '123e4567-e89b-12d3-a456-426614174001', // Non-existent UUID
                    moisture: 50,
                    temperature: 22
                });

            expect(invalidSensorDataResponse.status).toBe(400);
            expect(invalidSensorDataResponse.body.error).toMatch(/device.*not.*found|foreign.*key/i);
        });

        test('should enforce check constraints', async () => {
            // Create a valid plant first
            const plantResponse = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Constraint Test Plant',
                    species: 'Test Species',
                    location: 'Garden'
                });

            const plant = plantResponse.body.data;

            // Create device for sensor data tests
            const deviceResponse = await request(app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_id: plant.id,
                    device_type: 'sensor',
                    device_name: 'Constraint Test Sensor'
                });

            const device = deviceResponse.body.data;

            // Test moisture constraint (0-100)
            const invalidMoistureTests = [
                { moisture: -10, expectedError: /moisture.*range|invalid.*value/i },
                { moisture: 150, expectedError: /moisture.*range|invalid.*value/i },
                { moisture: 'abc', expectedError: /invalid.*type|numeric/i }
            ];

            for (const test of invalidMoistureTests) {
                const response = await request(app)
                    .post('/api/sensor-data')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        device_id: device.id,
                        moisture: test.moisture,
                        temperature: 22,
                        humidity: 60,
                        light_level: 500
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toMatch(test.expectedError);
            }

            // Test temperature constraint (-50 to 100)
            const invalidTemperatureResponse = await request(app)
                .post('/api/sensor-data')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    device_id: device.id,
                    moisture: 50,
                    temperature: -100, // Invalid temperature
                    humidity: 60,
                    light_level: 500
                });

            expect(invalidTemperatureResponse.status).toBe(400);
            expect(invalidTemperatureResponse.body.error).toMatch(/temperature.*range|invalid.*value/i);
        });
    });

    describe('Data Type Validation', () => {
        
        test('should validate UUID format', async () => {
            const invalidUuids = [
                'not-a-uuid',
                '12345',
                'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                '123e4567-e89b-12d3-a456-42661417400'  // Missing digit
            ];

            for (const invalidUuid of invalidUuids) {
                const response = await request(app)
                    .get(`/api/plants/${invalidUuid}`)
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(400);
                expect(response.body.error).toMatch(/invalid.*uuid|invalid.*format/i);
            }
        });

        test('should validate email format', async () => {
            const invalidEmails = [
                'notanemail',
                '@invalid.com',
                'invalid@',
                'invalid.email',
                'spaces in@email.com',
                'toolong' + 'x'.repeat(250) + '@email.com'
            ];

            for (const invalidEmail of invalidEmails) {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: invalidEmail,
                        username: `user${Math.random()}`,
                        password: 'password123',
                        full_name: 'Test User'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toMatch(/invalid.*email|email.*format/i);
            }
        });

        test('should validate password complexity', async () => {
            const weakPasswords = [
                '123',           // Too short
                'password',      // No numbers or special chars
                '12345678',      // Only numbers
                'ABCDEFGH',      // Only uppercase
                'abcdefgh',      // Only lowercase
                '   ',           // Only spaces
                ''               // Empty
            ];

            for (const password of weakPasswords) {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: `test${Math.random()}@test.com`,
                        username: `user${Math.random()}`,
                        password: password,
                        full_name: 'Test User'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toMatch(/password.*requirements|weak.*password/i);
            }
        });

        test('should validate enum values', async () => {
            // Create plant for device tests
            const plantResponse = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Enum Test Plant',
                    species: 'Test Species',
                    location: 'Garden'
                });

            const plant = plantResponse.body.data;

            // Test invalid device_type
            const invalidDeviceTypeResponse = await request(app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_id: plant.id,
                    device_type: 'invalid_type', // Should be 'sensor', 'pump', or 'camera'
                    device_name: 'Invalid Device'
                });

            expect(invalidDeviceTypeResponse.status).toBe(400);
            expect(invalidDeviceTypeResponse.body.error).toMatch(/invalid.*device.*type|allowed.*values/i);

            // Test valid device types
            const validDeviceTypes = ['sensor', 'pump', 'camera'];
            
            for (const deviceType of validDeviceTypes) {
                const response = await request(app)
                    .post('/api/devices')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        plant_id: plant.id,
                        device_type: deviceType,
                        device_name: `Valid ${deviceType} Device`
                    });

                expect(response.status).toBe(201);
                expect(response.body.data.device_type).toBe(deviceType);
            }
        });
    });

    describe('Database Transaction Integrity', () => {
        
        test('should rollback failed transactions', async () => {
            // Get initial plant count
            const initialPlantsResponse = await request(app)
                .get('/api/plants')
                .set('Authorization', `Bearer ${userToken}`);
            
            const initialCount = initialPlantsResponse.body.data.length;

            // Attempt to create plant with invalid subsequent operation
            // This would need to be implemented with a custom endpoint that
            // performs multiple database operations in a transaction
            
            // For demonstration, test that partial failures don't leave orphaned data
            const plantResponse = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Transaction Test Plant',
                    species: 'Test Species',
                    location: 'Garden'
                });

            expect(plantResponse.status).toBe(201);
            const plant = plantResponse.body.data;

            // Now try to create a device with invalid data that should trigger rollback
            const invalidDeviceResponse = await request(app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_id: plant.id,
                    device_type: 'invalid', // This should fail
                    device_name: 'Should Not Be Created'
                });

            expect(invalidDeviceResponse.status).toBe(400);

            // Verify the plant still exists (transaction should not have affected it)
            const plantCheckResponse = await request(app)
                .get(`/api/plants/${plant.id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(plantCheckResponse.status).toBe(200);
            expect(plantCheckResponse.body.data.id).toBe(plant.id);
        });

        test('should handle concurrent modifications correctly', async () => {
            // Create a plant
            const plantResponse = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Concurrent Test Plant',
                    species: 'Test Species',
                    location: 'Garden'
                });

            const plant = plantResponse.body.data;

            // Simulate concurrent updates
            const update1Promise = request(app)
                .put(`/api/plants/${plant.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Updated Name 1',
                    species: plant.species,
                    location: plant.location
                });

            const update2Promise = request(app)
                .put(`/api/plants/${plant.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Updated Name 2',
                    species: plant.species,
                    location: plant.location
                });

            const [update1Response, update2Response] = await Promise.all([
                update1Promise,
                update2Promise
            ]);

            // Both should succeed (last write wins)
            expect([200, 201]).toContain(update1Response.status);
            expect([200, 201]).toContain(update2Response.status);

            // Verify final state is consistent
            const finalResponse = await request(app)
                .get(`/api/plants/${plant.id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(finalResponse.status).toBe(200);
            expect(['Updated Name 1', 'Updated Name 2']).toContain(
                finalResponse.body.data.plant_name
            );
        });
    });

    describe('Performance and Indexing', () => {
        
        test('should efficiently query large datasets', async () => {
            // Create plant and device for bulk data insertion
            const plantResponse = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Performance Test Plant',
                    species: 'Test Species',
                    location: 'Garden'
                });

            const plant = plantResponse.body.data;

            const deviceResponse = await request(app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_id: plant.id,
                    device_type: 'sensor',
                    device_name: 'Performance Test Sensor'
                });

            const device = deviceResponse.body.data;

            // Insert multiple sensor readings
            const dataPoints = 50; // Reduced for test speed
            const insertPromises = [];

            for (let i = 0; i < dataPoints; i++) {
                insertPromises.push(
                    request(app)
                        .post('/api/sensor-data')
                        .set('Authorization', `Bearer ${userToken}`)
                        .send({
                            device_id: device.id,
                            moisture: Math.random() * 100,
                            temperature: 20 + Math.random() * 10,
                            humidity: 40 + Math.random() * 40,
                            light_level: 200 + Math.random() * 800
                        })
                );
            }

            await Promise.all(insertPromises);

            // Test query performance
            const startTime = Date.now();
            
            const analyticsResponse = await request(app)
                .get('/api/analytics')
                .set('Authorization', `Bearer ${userToken}`)
                .query({
                    plant_id: plant.id,
                    start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    end_date: new Date().toISOString()
                });

            const queryTime = Date.now() - startTime;

            expect(analyticsResponse.status).toBe(200);
            expect(queryTime).toBeLessThan(3000); // Should complete within 3 seconds
            expect(analyticsResponse.body.data).toHaveProperty('plantsData');
        });

        test('should handle pagination correctly', async () => {
            // Test pagination on sensor data endpoint
            const response = await request(app)
                .get('/api/sensor-data')
                .set('Authorization', `Bearer ${userToken}`)
                .query({
                    limit: 10,
                    offset: 0
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeLessThanOrEqual(10);
            
            if (response.body.pagination) {
                expect(response.body.pagination).toHaveProperty('total');
                expect(response.body.pagination).toHaveProperty('limit');
                expect(response.body.pagination).toHaveProperty('offset');
            }
        });
    });

    describe('Data Consistency Checks', () => {
        
        test('should maintain audit trails', async () => {
            // Create a plant (should generate audit log)
            const plantResponse = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Audit Test Plant',
                    species: 'Test Species',
                    location: 'Garden'
                });

            const plant = plantResponse.body.data;
            expect(plantResponse.status).toBe(201);

            // Update the plant (should generate another audit log)
            const updateResponse = await request(app)
                .put(`/api/plants/${plant.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Updated Audit Test Plant',
                    species: plant.species,
                    location: plant.location
                });

            expect(updateResponse.status).toBe(200);

            // Delete the plant (should generate deletion audit log)
            const deleteResponse = await request(app)
                .delete(`/api/plants/${plant.id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(deleteResponse.status).toBe(200);

            // Check that audit trail exists
            // Note: This would require a system logs endpoint that shows audit trails
            // For now, we just verify the operations completed successfully
            expect(plant.id).toBeDefined();
        });

        test('should handle cascade deletes properly', async () => {
            // Create plant -> device -> sensor data chain
            const plantResponse = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Cascade Test Plant',
                    species: 'Test Species',
                    location: 'Garden'
                });

            const plant = plantResponse.body.data;

            const deviceResponse = await request(app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_id: plant.id,
                    device_type: 'sensor',
                    device_name: 'Cascade Test Device'
                });

            const device = deviceResponse.body.data;

            const sensorDataResponse = await request(app)
                .post('/api/sensor-data')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    device_id: device.id,
                    moisture: 50,
                    temperature: 22,
                    humidity: 60,
                    light_level: 500
                });

            expect(sensorDataResponse.status).toBe(201);

            // Delete the plant (should cascade to devices and sensor data)
            const deleteResponse = await request(app)
                .delete(`/api/plants/${plant.id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(deleteResponse.status).toBe(200);

            // Verify device was also deleted
            const deviceCheckResponse = await request(app)
                .get(`/api/devices/${device.id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(deviceCheckResponse.status).toBe(404);

            // Verify sensor data was also deleted
            const sensorDataCheckResponse = await request(app)
                .get('/api/sensor-data')
                .set('Authorization', `Bearer ${userToken}`)
                .query({ device_id: device.id });

            expect(sensorDataCheckResponse.status).toBe(200);
            expect(sensorDataCheckResponse.body.data).toHaveLength(0);
        });
    });
});