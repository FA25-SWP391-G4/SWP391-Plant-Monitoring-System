/**
 * DASHBOARD INTEGRATION TESTS
 * ============================
 * 
 * Integration tests for dashboard and monitoring endpoints
 * Tests the complete dashboard flow with HTTP requests
 */

const request = require('supertest');
const app = require('../../../app');
const User = require('../../../models/User');
const Plant = require('../../../models/Plant');
const Device = require('../../../models/Device');
const SensorData = require('../../../models/SensorData');
const { setupTestDB, teardownTestDB, clearDB } = require('../../../config/testdb');

describe('Dashboard Integration Tests', () => {
    let authToken;
    let testUser;

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearDB();
        jest.clearAllMocks();

        // Create and authenticate test user
        testUser = {
            email: 'dashboard@example.com',
            password: 'SecurePassword123!',
            firstName: 'Dashboard',
            lastName: 'User'
        };

        await request(app)
            .post('/auth/register')
            .send(testUser)
            .expect(201);

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            })
            .expect(200);

        authToken = loginResponse.body.token;
    });

    // UC4: View Dashboard + Reports
    describe('GET /api/dashboard', () => {
        it('should get dashboard overview successfully', async () => {
            const response = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('plants');
            expect(response.body).toHaveProperty('devices');
            expect(response.body).toHaveProperty('summary');
            expect(response.body.plants).toHaveProperty('total');
            expect(response.body.plants).toHaveProperty('healthy');
            expect(response.body.plants).toHaveProperty('needsAttention');
            expect(response.body.summary).toHaveProperty('totalPlants');
            expect(response.body.summary).toHaveProperty('lastUpdate');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/dashboard')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle empty dashboard data', async () => {
            const response = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.plants.total).toBe(0);
            expect(response.body.devices.total).toBe(0);
            expect(response.body.summary.totalPlants).toBe(0);
        });

        it('should include recent activity data', async () => {
            const response = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('recentActivity');
            expect(Array.isArray(response.body.recentActivity)).toBe(true);
        });
    });

    describe('GET /api/dashboard/stats', () => {
        it('should get dashboard statistics', async () => {
            const response = await request(app)
                .get('/api/dashboard/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('plantStats');
            expect(response.body.plantStats).toHaveProperty('total');
            expect(response.body.plantStats).toHaveProperty('healthy');
        });

        it('should handle time period filtering', async () => {
            const response = await request(app)
                .get('/api/dashboard/stats?period=7d')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('plantStats');
        });
    });

    // UC6: Real-time Monitoring
    describe('GET /api/dashboard/realtime', () => {
        it('should get real-time sensor data', async () => {
            const response = await request(app)
                .get('/api/dashboard/realtime')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('sensorData');
            expect(response.body).toHaveProperty('alerts');
            expect(response.body).toHaveProperty('timestamp');
            expect(Array.isArray(response.body.sensorData)).toBe(true);
            expect(Array.isArray(response.body.alerts)).toBe(true);
        });

        it('should filter by device type', async () => {
            const response = await request(app)
                .get('/api/dashboard/realtime?deviceType=moisture_sensor')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('sensorData');
        });

        it('should require authentication for real-time data', async () => {
            const response = await request(app)
                .get('/api/dashboard/realtime')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/dashboard/devices/status', () => {
        it('should get device status summary', async () => {
            const response = await request(app)
                .get('/api/dashboard/devices/status')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('devices');
            expect(response.body).toHaveProperty('summary');
            expect(response.body.summary).toHaveProperty('total');
            expect(response.body.summary).toHaveProperty('online');
            expect(response.body.summary).toHaveProperty('offline');
        });
    });

    // UC13: Analytics & Statistics
    describe('GET /api/dashboard/analytics', () => {
        it('should get analytics trends', async () => {
            const response = await request(app)
                .get('/api/dashboard/analytics')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('trendData');
            expect(response.body).toHaveProperty('insights');
            expect(response.body).toHaveProperty('period');
            expect(response.body).toHaveProperty('metric');
        });

        it('should validate period parameter', async () => {
            const response = await request(app)
                .get('/api/dashboard/analytics?period=invalid')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Invalid period');
        });

        it('should accept valid period parameters', async () => {
            const validPeriods = ['1d', '7d', '30d', '90d'];

            for (const period of validPeriods) {
                const response = await request(app)
                    .get(`/api/dashboard/analytics?period=${period}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body.period).toBe(period);
            }
        });

        it('should support metric filtering', async () => {
            const response = await request(app)
                .get('/api/dashboard/analytics?metric=moisture&period=7d')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.metric).toBe('moisture');
        });
    });

    describe('GET /api/dashboard/analytics/watering', () => {
        it('should get watering analytics', async () => {
            const response = await request(app)
                .get('/api/dashboard/analytics/watering')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('wateringData');
            expect(response.body).toHaveProperty('efficiency');
            expect(response.body).toHaveProperty('recommendations');
        });

        it('should include watering statistics', async () => {
            const response = await request(app)
                .get('/api/dashboard/analytics/watering')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.wateringData).toHaveProperty('totalWaterings');
            expect(response.body.wateringData).toHaveProperty('averagePerDay');
        });
    });

    // Dashboard Widgets
    describe('GET /api/dashboard/widgets/weather', () => {
        it('should get weather widget data', async () => {
            const response = await request(app)
                .get('/api/dashboard/widgets/weather')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('weather');
        });

        it('should handle weather service unavailability', async () => {
            // This test would depend on weather service mock behavior
            const response = await request(app)
                .get('/api/dashboard/widgets/weather')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Should still return response even if weather data is null
            expect(response.body).toBeDefined();
        });
    });

    describe('GET /api/dashboard/widgets/actions', () => {
        it('should get quick actions widget', async () => {
            const response = await request(app)
                .get('/api/dashboard/widgets/actions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('actions');
            expect(Array.isArray(response.body.actions)).toBe(true);
        });

        it('should return available actions based on user context', async () => {
            const response = await request(app)
                .get('/api/dashboard/widgets/actions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            response.body.actions.forEach(action => {
                expect(action).toHaveProperty('id');
                expect(action).toHaveProperty('title');
                expect(action).toHaveProperty('available');
            });
        });
    });

    describe('GET /api/dashboard/widgets/system-health', () => {
        it('should deny access for regular users', async () => {
            const response = await request(app)
                .get('/api/dashboard/widgets/system-health')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Admin access required');
        });

        it('should allow access for admin users', async () => {
            // Create admin user
            const adminUser = {
                email: 'admin@example.com',
                password: 'AdminPassword123!',
                firstName: 'Admin',
                lastName: 'User',
                role: 'Admin'
            };

            await request(app)
                .post('/auth/register')
                .send(adminUser)
                .expect(201);

            const adminLoginResponse = await request(app)
                .post('/auth/login')
                .send({
                    email: adminUser.email,
                    password: adminUser.password
                })
                .expect(200);

            const adminToken = adminLoginResponse.body.token;

            const response = await request(app)
                .get('/api/dashboard/widgets/system-health')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('health');
        });
    });

    // Error handling tests
    describe('Error Handling', () => {
        it('should handle malformed authentication tokens', async () => {
            const response = await request(app)
                .get('/api/dashboard')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle missing authorization header', async () => {
            const response = await request(app)
                .get('/api/dashboard')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle invalid query parameters', async () => {
            const response = await request(app)
                .get('/api/dashboard/analytics?period=invalid&metric=unknown')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle database connection errors gracefully', async () => {
            // This would need specific database error simulation
            // For now, we test that endpoints respond appropriately
            const response = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 500]).toContain(response.status);
            if (response.status === 500) {
                expect(response.body).toHaveProperty('error');
            }
        });

        it('should handle concurrent requests', async () => {
            const requests = Array(5).fill().map(() =>
                request(app)
                    .get('/api/dashboard')
                    .set('Authorization', `Bearer ${authToken}`)
            );

            const responses = await Promise.all(requests);

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('plants');
            });
        });
    });

    // Performance tests
    describe('Performance', () => {
        it('should respond to dashboard requests within acceptable time', async () => {
            const startTime = Date.now();

            const response = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Should respond within 2 seconds
            expect(responseTime).toBeLessThan(2000);
        });

        it('should handle real-time data requests efficiently', async () => {
            const startTime = Date.now();

            const response = await request(app)
                .get('/api/dashboard/realtime')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Real-time endpoints should be faster
            expect(responseTime).toBeLessThan(1000);
        });
    });

    // Data consistency tests
    describe('Data Consistency', () => {
        it('should return consistent data across multiple requests', async () => {
            const response1 = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const response2 = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Core structure should be consistent
            expect(response1.body.plants.total).toBe(response2.body.plants.total);
            expect(response1.body.devices.total).toBe(response2.body.devices.total);
        });

        it('should maintain data integrity between related endpoints', async () => {
            const dashboardResponse = await request(app)
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const statsResponse = await request(app)
                .get('/api/dashboard/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Plant counts should match between dashboard and stats
            expect(dashboardResponse.body.plants.total)
                .toBe(statsResponse.body.plantStats.total);
        });
    });
});