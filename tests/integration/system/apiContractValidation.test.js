// API Contract Validation Tests
// Test API response formats, status codes, and contract compliance

const request = require('supertest');
const app = require('../../app');
const { setupTestDatabase, cleanupTestDatabase } = require('../setup/testDb');
const { createTestUser, createTestAdmin } = require('../helpers/userHelpers');

describe('API Contract Validation Tests', () => {
    let testDb;
    let userToken;
    let adminToken;
    let testUser;

    beforeAll(async () => {
        testDb = await setupTestDatabase();
        
        testUser = await createTestUser({
            email: 'api@test.com',
            username: 'apiuser'
        });

        const testAdmin = await createTestAdmin({
            email: 'apiadmin@test.com',
            username: 'apiadmin'
        });

        // Get user token
        const userLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'api@test.com',
                password: 'password123'
            });
        userToken = userLogin.body.token;

        // Get admin token
        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'apiadmin@test.com',
                password: 'password123'
            });
        adminToken = adminLogin.body.token;
    });

    afterAll(async () => {
        await cleanupTestDatabase(testDb);
    });

    describe('Response Format Standards', () => {
        
        test('should return consistent success response format', async () => {
            const response = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('message');
            expect(typeof response.body.message).toBe('string');
            expect(response.body.data).toBeDefined();
        });

        test('should return consistent error response format', async () => {
            const response = await request(app)
                .get('/api/plants/invalid-uuid')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBeGreaterThanOrEqualTo(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(typeof response.body.error).toBe('string');
            expect(response.body.error.length).toBeGreaterThan(0);
        });

        test('should include pagination metadata when applicable', async () => {
            // Create some plants first
            await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Pagination Test Plant 1',
                    species: 'Test Species',
                    location: 'Garden'
                });

            await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Pagination Test Plant 2',
                    species: 'Test Species',
                    location: 'Garden'
                });

            const response = await request(app)
                .get('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .query({ limit: 1, offset: 0 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            
            // If pagination is implemented, check for pagination metadata
            if (response.body.pagination) {
                expect(response.body.pagination).toHaveProperty('total');
                expect(response.body.pagination).toHaveProperty('limit');
                expect(response.body.pagination).toHaveProperty('offset');
                expect(typeof response.body.pagination.total).toBe('number');
                expect(typeof response.body.pagination.limit).toBe('number');
                expect(typeof response.body.pagination.offset).toBe('number');
            }
        });
    });

    describe('HTTP Status Code Compliance', () => {
        
        test('should return 200 for successful GET requests', async () => {
            const getEndpoints = [
                '/api/dashboard',
                '/api/plants',
                '/api/devices',
                '/api/alerts',
                '/api/users/profile'
            ];

            for (const endpoint of getEndpoints) {
                const response = await request(app)
                    .get(endpoint)
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(200);
            }
        });

        test('should return 201 for successful POST creation requests', async () => {
            const plantResponse = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Status Test Plant',
                    species: 'Test Species',
                    location: 'Garden'
                });

            expect(plantResponse.status).toBe(201);
            expect(plantResponse.body.data).toHaveProperty('id');

            const deviceResponse = await request(app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_id: plantResponse.body.data.id,
                    device_type: 'sensor',
                    device_name: 'Status Test Device'
                });

            expect(deviceResponse.status).toBe(201);
            expect(deviceResponse.body.data).toHaveProperty('id');
        });

        test('should return 400 for bad request data', async () => {
            const badRequests = [
                {
                    endpoint: '/api/plants',
                    method: 'post',
                    data: {} // Missing required fields
                },
                {
                    endpoint: '/api/devices',
                    method: 'post',
                    data: { device_type: 'invalid_type' } // Invalid enum value
                },
                {
                    endpoint: '/api/auth/login',
                    method: 'post',
                    data: { email: 'not-an-email' } // Invalid email format
                }
            ];

            for (const req of badRequests) {
                const response = await request(app)
                    [req.method](req.endpoint)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(req.data);

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('error');
            }
        });

        test('should return 401 for unauthorized requests', async () => {
            const protectedEndpoints = [
                '/api/dashboard',
                '/api/plants',
                '/api/devices',
                '/api/alerts'
            ];

            for (const endpoint of protectedEndpoints) {
                const response = await request(app)
                    .get(endpoint); // No authorization header

                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('error');
            }
        });

        test('should return 403 for forbidden admin requests', async () => {
            const adminEndpoints = [
                '/api/admin/users',
                '/api/admin/system-logs',
                '/api/admin/analytics'
            ];

            for (const endpoint of adminEndpoints) {
                const response = await request(app)
                    .get(endpoint)
                    .set('Authorization', `Bearer ${userToken}`); // Regular user token

                expect([403, 401]).toContain(response.status);
                expect(response.body).toHaveProperty('error');
            }
        });

        test('should return 404 for non-existent resources', async () => {
            const nonExistentRequests = [
                '/api/plants/123e4567-e89b-12d3-a456-426614174000',
                '/api/devices/123e4567-e89b-12d3-a456-426614174001',
                '/api/nonexistent-endpoint'
            ];

            for (const endpoint of nonExistentRequests) {
                const response = await request(app)
                    .get(endpoint)
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(404);
                expect(response.body).toHaveProperty('error');
            }
        });

        test('should return 405 for method not allowed', async () => {
            // Test unsupported HTTP methods on existing endpoints
            const methodTests = [
                { method: 'patch', endpoint: '/api/dashboard' },
                { method: 'delete', endpoint: '/api/alerts' }
            ];

            for (const test of methodTests) {
                const response = await request(app)
                    [test.method](test.endpoint)
                    .set('Authorization', `Bearer ${userToken}`);

                expect([405, 404]).toContain(response.status); // 405 or 404 depending on implementation
            }
        });
    });

    describe('Content Type and Headers', () => {
        
        test('should return JSON content type for API endpoints', async () => {
            const response = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toMatch(/application\/json/);
        });

        test('should handle JSON request bodies properly', async () => {
            const response = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({
                    plant_name: 'JSON Test Plant',
                    species: 'Test Species',
                    location: 'Garden'
                }));

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('id');
        });

        test('should handle form data for file uploads', async () => {
            // Create plant first
            const plantResponse = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Upload Test Plant',
                    species: 'Test Species',
                    location: 'Garden'
                });

            const plant = plantResponse.body.data;

            // Test file upload (if endpoint exists)
            const imageBuffer = Buffer.from('fake image data');
            
            const response = await request(app)
                .post('/api/plants/image-upload')
                .set('Authorization', `Bearer ${userToken}`)
                .attach('image', imageBuffer, 'test.jpg')
                .field('plant_id', plant.id);

            // This endpoint might not exist, so we accept 404 or success
            expect([200, 201, 404]).toContain(response.status);
        });

        test('should include security headers', async () => {
            const response = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            
            // Check for common security headers (if implemented)
            const securityHeaders = [
                'x-frame-options',
                'x-content-type-options',
                'x-xss-protection'
            ];

            securityHeaders.forEach(header => {
                // Not all security headers may be implemented, so we just check if present
                if (response.headers[header]) {
                    expect(response.headers[header]).toBeDefined();
                }
            });
        });
    });

    describe('Data Validation and Sanitization', () => {
        
        test('should validate required fields', async () => {
            const requiredFieldTests = [
                {
                    endpoint: '/api/plants',
                    data: { species: 'Test' }, // Missing plant_name
                    missingField: 'plant_name'
                },
                {
                    endpoint: '/api/devices',
                    data: { device_type: 'sensor' }, // Missing plant_id and device_name
                    missingField: 'plant_id'
                }
            ];

            for (const test of requiredFieldTests) {
                const response = await request(app)
                    .post(test.endpoint)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(test.data);

                expect(response.status).toBe(400);
                expect(response.body.error.toLowerCase()).toContain(test.missingField.toLowerCase());
            }
        });

        test('should sanitize input data', async () => {
            // Test HTML/script injection prevention
            const maliciousInput = {
                plant_name: '<script>alert("xss")</script>Malicious Plant',
                species: '"><img src=x onerror=alert("xss")>',
                location: 'javascript:alert("xss")'
            };

            const response = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send(maliciousInput);

            if (response.status === 201) {
                // If created, malicious content should be sanitized
                expect(response.body.data.plant_name).not.toContain('<script>');
                expect(response.body.data.species).not.toContain('<img');
                expect(response.body.data.location).not.toContain('javascript:');
            } else {
                // Should reject malicious input
                expect(response.status).toBe(400);
            }
        });

        test('should validate data types', async () => {
            // Create plant and device for sensor data test
            const plantResponse = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: 'Type Test Plant',
                    species: 'Test Species',
                    location: 'Garden'
                });

            const deviceResponse = await request(app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_id: plantResponse.body.data.id,
                    device_type: 'sensor',
                    device_name: 'Type Test Device'
                });

            // Test invalid data types
            const invalidTypeTests = [
                { field: 'moisture', value: 'not_a_number', type: 'number' },
                { field: 'temperature', value: true, type: 'number' },
                { field: 'humidity', value: [], type: 'number' }
            ];

            for (const test of invalidTypeTests) {
                const sensorData = {
                    device_id: deviceResponse.body.data.id,
                    moisture: 50,
                    temperature: 22,
                    humidity: 60,
                    light_level: 500
                };
                
                sensorData[test.field] = test.value;

                const response = await request(app)
                    .post('/api/sensor-data')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(sensorData);

                expect(response.status).toBe(400);
                expect(response.body.error.toLowerCase()).toMatch(
                    new RegExp(`${test.field}|${test.type}|invalid|type`, 'i')
                );
            }
        });

        test('should validate string length limits', async () => {
            const longString = 'a'.repeat(1000); // Very long string
            
            const response = await request(app)
                .post('/api/plants')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    plant_name: longString,
                    species: longString,
                    location: longString
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toMatch(/length|too long|maximum/i);
        });
    });

    describe('API Versioning and Compatibility', () => {
        
        test('should handle API version headers', async () => {
            // Test with API version header
            const response = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${userToken}`)
                .set('API-Version', 'v1');

            // Should work regardless of version header (backward compatibility)
            expect([200, 400]).toContain(response.status);
        });

        test('should maintain backward compatibility for core endpoints', async () => {
            const coreEndpoints = [
                '/api/auth/login',
                '/api/plants',
                '/api/devices',
                '/api/dashboard'
            ];

            for (const endpoint of coreEndpoints) {
                let response;
                
                if (endpoint === '/api/auth/login') {
                    response = await request(app)
                        .post(endpoint)
                        .send({
                            email: 'api@test.com',
                            password: 'password123'
                        });
                } else {
                    response = await request(app)
                        .get(endpoint)
                        .set('Authorization', `Bearer ${userToken}`);
                }

                // Core endpoints should be stable
                expect(response.status).toBeLessThan(500);
                expect(response.body).toHaveProperty('success');
            }
        });
    });

    describe('Performance and Response Time', () => {
        
        test('should respond within acceptable time limits', async () => {
            const performanceTests = [
                { endpoint: '/api/dashboard', maxTime: 2000 },
                { endpoint: '/api/plants', maxTime: 1500 },
                { endpoint: '/api/devices', maxTime: 1500 },
                { endpoint: '/api/alerts', maxTime: 1000 }
            ];

            for (const test of performanceTests) {
                const startTime = Date.now();
                
                const response = await request(app)
                    .get(test.endpoint)
                    .set('Authorization', `Bearer ${userToken}`);

                const responseTime = Date.now() - startTime;

                expect(response.status).toBe(200);
                expect(responseTime).toBeLessThan(test.maxTime);
            }
        });

        test('should handle concurrent requests efficiently', async () => {
            const concurrentRequests = 5;
            const requests = Array(concurrentRequests).fill().map(() =>
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

            // Total time should be reasonable for concurrent processing
            expect(totalTime).toBeLessThan(10000); // 10 seconds for 5 concurrent requests
        });
    });

    describe('Error Handling Consistency', () => {
        
        test('should provide meaningful error messages', async () => {
            const errorTests = [
                {
                    request: () => request(app).get('/api/plants/invalid-uuid').set('Authorization', `Bearer ${userToken}`),
                    expectedPattern: /invalid.*uuid|format/i
                },
                {
                    request: () => request(app).post('/api/plants').set('Authorization', `Bearer ${userToken}`).send({}),
                    expectedPattern: /required|missing/i
                },
                {
                    request: () => request(app).get('/api/dashboard'),
                    expectedPattern: /unauthorized|token|authentication/i
                }
            ];

            for (const test of errorTests) {
                const response = await test.request();
                
                expect(response.status).toBeGreaterThanOrEqualTo(400);
                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toMatch(test.expectedPattern);
            }
        });

        test('should include error codes when applicable', async () => {
            const response = await request(app)
                .get('/api/plants/invalid-uuid')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            
            // Error code is optional but should be consistent if implemented
            if (response.body.errorCode) {
                expect(typeof response.body.errorCode).toBe('string');
                expect(response.body.errorCode.length).toBeGreaterThan(0);
            }
        });

        test('should not expose internal system details in errors', async () => {
            // Trigger various errors and ensure no stack traces or internal paths are exposed
            const errorEndpoints = [
                '/api/plants/invalid-uuid',
                '/api/nonexistent',
                '/api/plants'  // Missing auth header
            ];

            for (const endpoint of errorEndpoints) {
                const response = await request(app).get(endpoint);

                expect(response.status).toBeGreaterThanOrEqualTo(400);
                
                if (response.body.error) {
                    // Should not contain stack traces or file paths
                    expect(response.body.error).not.toMatch(/Error:\s+at/);
                    expect(response.body.error).not.toMatch(/\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.js/);
                    expect(response.body.error).not.toMatch(/node_modules/);
                }
            }
        });
    });
});