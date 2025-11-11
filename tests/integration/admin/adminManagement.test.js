/**
 * ADMIN INTEGRATION TESTS
 * =======================
 * 
 * Integration tests for admin API endpoints
 * Tests real API routes with database interaction simulation
 */

const request = require('supertest');
const app = require('../../../app');
const { pool } = require('../../../config/db');
const User = require('../../../models/User');
const SystemLog = require('../../../models/SystemLog');

// Mock database
jest.mock('../../../config/db');
jest.mock('../../../models/User');
jest.mock('../../../models/SystemLog');

describe('Admin API Integration Tests', () => {
    let adminToken, regularUserToken;

    beforeAll(async () => {
        // Setup test tokens
        adminToken = 'Bearer mock-admin-token';
        regularUserToken = 'Bearer mock-user-token';
        
        // Mock JWT verification in auth middleware
        const jwt = require('jsonwebtoken');
        jest.spyOn(jwt, 'verify').mockImplementation((token, secret) => {
            if (token === 'mock-admin-token') {
                return {
                    id: 'admin-123',
                    email: 'admin@test.com',
                    role: 'Admin'
                };
            } else if (token === 'mock-user-token') {
                return {
                    id: 'user-123',
                    email: 'user@test.com',
                    role: 'Regular'
                };
            }
            throw new Error('Invalid token');
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // User Management API Tests
    describe('User Management API', () => {
        describe('GET /api/admin/users', () => {
            it('should get users with pagination for admin', async () => {
                const mockUsers = [
                    { id: 'user-1', email: 'user1@test.com', role: 'Regular' },
                    { id: 'user-2', email: 'user2@test.com', role: 'Premium' }
                ];

                User.findAll.mockResolvedValue(mockUsers);
                User.countAll.mockResolvedValue(25);

                const response = await request(app)
                    .get('/api/admin/users')
                    .set('Authorization', adminToken)
                    .query({
                        page: 1,
                        limit: 10,
                        search: 'test',
                        role: 'Regular'
                    });

                expect(response.status).toBe(200);
                expect(response.body.users).toEqual(mockUsers);
                expect(response.body.pagination).toEqual({
                    totalUsers: 25,
                    currentPage: 1,
                    totalPages: 3,
                    limit: 10
                });
            });

            it('should deny access to non-admin users', async () => {
                const response = await request(app)
                    .get('/api/admin/users')
                    .set('Authorization', regularUserToken);

                expect(response.status).toBe(403);
                expect(response.body.error).toBe('Admin access required');
            });

            it('should require authentication', async () => {
                const response = await request(app)
                    .get('/api/admin/users');

                expect(response.status).toBe(401);
            });
        });

        describe('GET /api/admin/users/:userId', () => {
            it('should get user details with related data', async () => {
                const mockUser = {
                    id: 'user-123',
                    email: 'user@test.com',
                    role: 'Premium',
                    plants: [{ id: 'plant-1', name: 'Rose Garden' }],
                    devices: [{ id: 'device-1', name: 'Moisture Sensor' }],
                    paymentHistory: [{ id: 'payment-1', amount: 100 }]
                };

                User.findById.mockResolvedValue(mockUser);

                const response = await request(app)
                    .get('/api/admin/users/user-123')
                    .set('Authorization', adminToken);

                expect(response.status).toBe(200);
                expect(response.body.user).toEqual(mockUser);
                expect(User.findById).toHaveBeenCalledWith('user-123', { includeRelated: true });
            });

            it('should return 404 for non-existent user', async () => {
                User.findById.mockResolvedValue(null);

                const response = await request(app)
                    .get('/api/admin/users/non-existent')
                    .set('Authorization', adminToken);

                expect(response.status).toBe(404);
                expect(response.body.error).toBe('User not found');
            });
        });

        describe('POST /api/admin/users', () => {
            it('should create new user successfully', async () => {
                const newUserData = {
                    email: 'newuser@test.com',
                    password: 'SecurePass123!',
                    role: 'Regular',
                    firstName: 'John',
                    lastName: 'Doe'
                };

                const mockCreatedUser = {
                    id: 'new-user-123',
                    ...newUserData,
                    password: undefined // Password should not be returned
                };

                User.findByEmail.mockResolvedValue(null);
                User.create.mockResolvedValue(mockCreatedUser);
                SystemLog.log.mockResolvedValue();

                const response = await request(app)
                    .post('/api/admin/users')
                    .set('Authorization', adminToken)
                    .send(newUserData);

                expect(response.status).toBe(201);
                expect(response.body.message).toBe('User created successfully');
                expect(response.body.user).toEqual(mockCreatedUser);
            });

            it('should prevent duplicate email creation', async () => {
                User.findByEmail.mockResolvedValue({ id: 'existing-user' });

                const response = await request(app)
                    .post('/api/admin/users')
                    .set('Authorization', adminToken)
                    .send({
                        email: 'existing@test.com',
                        password: 'password123'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toBe('Email already exists');
            });

            it('should validate required fields', async () => {
                const response = await request(app)
                    .post('/api/admin/users')
                    .set('Authorization', adminToken)
                    .send({
                        email: 'test@example.com'
                        // Missing password
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toBe('Email and password are required');
            });
        });

        describe('PUT /api/admin/users/:userId', () => {
            it('should update user successfully', async () => {
                const updateData = {
                    role: 'Premium',
                    firstName: 'Updated',
                    lastName: 'Name'
                };

                const mockUpdatedUser = {
                    id: 'user-123',
                    email: 'user@test.com',
                    ...updateData
                };

                User.findById.mockResolvedValue({ id: 'user-123', email: 'user@test.com' });
                User.update.mockResolvedValue(mockUpdatedUser);
                SystemLog.log.mockResolvedValue();

                const response = await request(app)
                    .put('/api/admin/users/user-123')
                    .set('Authorization', adminToken)
                    .send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('User updated successfully');
                expect(response.body.user).toEqual(mockUpdatedUser);
            });

            it('should validate role values', async () => {
                const response = await request(app)
                    .put('/api/admin/users/user-123')
                    .set('Authorization', adminToken)
                    .send({
                        role: 'InvalidRole'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toBe('Invalid role. Must be Regular, Premium, or Admin');
            });
        });

        describe('DELETE /api/admin/users/:userId', () => {
            it('should delete user successfully', async () => {
                const mockUser = {
                    id: 'user-123',
                    email: 'user@test.com'
                };

                User.findById.mockResolvedValue(mockUser);
                User.delete.mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                const response = await request(app)
                    .delete('/api/admin/users/user-123')
                    .set('Authorization', adminToken);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('User deleted successfully');
                expect(User.delete).toHaveBeenCalledWith('user-123');
            });

            it('should prevent self-deletion', async () => {
                const response = await request(app)
                    .delete('/api/admin/users/admin-123') // Same as admin token ID
                    .set('Authorization', adminToken);

                expect(response.status).toBe(400);
                expect(response.body.error).toBe('Cannot delete your own account');
            });
        });

        describe('POST /api/admin/users/:userId/reset-password', () => {
            it('should reset user password', async () => {
                const mockUser = { id: 'user-123', email: 'user@test.com' };

                User.findById.mockResolvedValue(mockUser);
                User.updatePassword.mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                const response = await request(app)
                    .post('/api/admin/users/user-123/reset-password')
                    .set('Authorization', adminToken);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Password reset successfully');
                expect(response.body.temporaryPassword).toBeDefined();
            });
        });

        describe('POST /api/admin/users/bulk', () => {
            it('should perform bulk role update', async () => {
                const bulkAction = {
                    action: 'updateRole',
                    userIds: ['user-1', 'user-2', 'user-3'],
                    newRole: 'Premium'
                };

                User.bulkUpdate.mockResolvedValue({ affectedRows: 3 });
                SystemLog.log.mockResolvedValue();

                const response = await request(app)
                    .post('/api/admin/users/bulk')
                    .set('Authorization', adminToken)
                    .send(bulkAction);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Bulk action completed successfully');
                expect(response.body.affectedUsers).toBe(3);
            });

            it('should perform bulk deletion', async () => {
                const bulkAction = {
                    action: 'delete',
                    userIds: ['user-1', 'user-2']
                };

                User.bulkDelete.mockResolvedValue({ affectedRows: 2 });
                SystemLog.log.mockResolvedValue();

                const response = await request(app)
                    .post('/api/admin/users/bulk')
                    .set('Authorization', adminToken)
                    .send(bulkAction);

                expect(response.status).toBe(200);
                expect(response.body.affectedUsers).toBe(2);
            });
        });
    });

    // System Reports API Tests
    describe('System Reports API', () => {
        describe('GET /api/admin/dashboard', () => {
            it('should get system dashboard metrics', async () => {
                const mockMetrics = {
                    totalUsers: 150,
                    activeUsers: 120,
                    totalDevices: 45,
                    activeDevices: 38,
                    totalPlants: 89,
                    totalSensorReadings: 12450,
                    recentActivity: []
                };

                // Mock model methods
                User.getTotalCount.mockResolvedValue(150);
                User.getActiveCount.mockResolvedValue(120);

                const response = await request(app)
                    .get('/api/admin/dashboard')
                    .set('Authorization', adminToken);

                expect(response.status).toBe(200);
                expect(response.body.dashboard).toEqual(mockMetrics);
            });
        });

        describe('GET /api/admin/reports', () => {
            it('should generate user reports', async () => {
                const mockUserReport = {
                    totalUsers: 150,
                    newUsers: 25,
                    activeUsers: 120,
                    usersByRole: { Regular: 100, Premium: 45, Admin: 5 }
                };

                // Mock the report generation
                User.getReportData.mockResolvedValue(mockUserReport);

                const response = await request(app)
                    .get('/api/admin/reports')
                    .set('Authorization', adminToken)
                    .query({
                        type: 'users',
                        period: 'month'
                    });

                expect(response.status).toBe(200);
                expect(response.body.report.type).toBe('users');
                expect(response.body.report.period).toBe('month');
                expect(response.body.report.data).toEqual(mockUserReport);
            });

            it('should export report as CSV', async () => {
                const response = await request(app)
                    .get('/api/admin/reports')
                    .set('Authorization', adminToken)
                    .query({
                        type: 'users',
                        period: 'month',
                        format: 'csv'
                    });

                expect(response.status).toBe(200);
                expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
                expect(response.headers['content-disposition']).toContain('attachment; filename="users_report_month.csv"');
            });
        });

        describe('GET /api/admin/profit-analysis', () => {
            it('should get profit analysis data', async () => {
                const mockProfitData = {
                    totalRevenue: 15000,
                    monthlyRevenue: 2500,
                    subscriptionBreakdown: {
                        Premium: { count: 45, revenue: 4500 }
                    },
                    revenueGrowth: 12.5
                };

                // Mock payment data
                require('../../../models/Payment').getProfitAnalysis.mockResolvedValue(mockProfitData);

                const response = await request(app)
                    .get('/api/admin/profit-analysis')
                    .set('Authorization', adminToken);

                expect(response.status).toBe(200);
                expect(response.body.analysis).toEqual(mockProfitData);
            });
        });
    });

    // System Settings API Tests
    describe('System Settings API', () => {
        describe('GET /api/admin/settings', () => {
            it('should get all system settings', async () => {
                const mockSettings = {
                    general: {
                        siteName: 'Plant Monitor',
                        maintenanceMode: false,
                        registrationEnabled: true
                    },
                    notifications: {
                        emailEnabled: true,
                        smsEnabled: false
                    },
                    security: {
                        passwordMinLength: 8,
                        sessionTimeout: 3600
                    }
                };

                // Mock settings loading
                pool.query.mockResolvedValue({
                    rows: [
                        { category: 'general', key: 'siteName', value: 'Plant Monitor' },
                        { category: 'general', key: 'maintenanceMode', value: 'false' }
                    ]
                });

                const response = await request(app)
                    .get('/api/admin/settings')
                    .set('Authorization', adminToken);

                expect(response.status).toBe(200);
                expect(response.body.settings).toBeDefined();
            });
        });

        describe('PUT /api/admin/settings', () => {
            it('should update system settings', async () => {
                const settingsUpdate = {
                    category: 'general',
                    settings: {
                        siteName: 'Updated Plant Monitor',
                        maintenanceMode: true
                    }
                };

                pool.query.mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                const response = await request(app)
                    .put('/api/admin/settings')
                    .set('Authorization', adminToken)
                    .send(settingsUpdate);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Settings updated successfully');
            });

            it('should validate setting values', async () => {
                const invalidSettings = {
                    category: 'security',
                    settings: {
                        passwordMinLength: 3 // Too short
                    }
                };

                const response = await request(app)
                    .put('/api/admin/settings')
                    .set('Authorization', adminToken)
                    .send(invalidSettings);

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('passwordMinLength must be at least 6');
            });
        });
    });

    // System Logs API Tests
    describe('System Logs API', () => {
        describe('GET /api/admin/logs', () => {
            it('should get system logs with filtering', async () => {
                const mockLogs = [
                    {
                        id: 'log-1',
                        level: 'error',
                        component: 'auth',
                        message: 'Failed login attempt',
                        created_at: '2023-01-15T10:30:00Z'
                    }
                ];

                SystemLog.findAll.mockResolvedValue(mockLogs);
                SystemLog.count.mockResolvedValue(100);

                const response = await request(app)
                    .get('/api/admin/logs')
                    .set('Authorization', adminToken)
                    .query({
                        level: 'error',
                        component: 'auth',
                        startDate: '2023-01-01',
                        endDate: '2023-01-31'
                    });

                expect(response.status).toBe(200);
                expect(response.body.logs).toEqual(mockLogs);
                expect(response.body.pagination).toBeDefined();
            });
        });

        describe('DELETE /api/admin/logs', () => {
            it('should delete old logs', async () => {
                const deleteParams = {
                    olderThan: '2023-01-01',
                    level: 'info'
                };

                SystemLog.deleteOld.mockResolvedValue({ deletedCount: 500 });

                const response = await request(app)
                    .delete('/api/admin/logs')
                    .set('Authorization', adminToken)
                    .send(deleteParams);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Logs deleted successfully');
                expect(response.body.deletedCount).toBe(500);
            });
        });
    });

    // Backup and Restore API Tests
    describe('Database Management API', () => {
        describe('POST /api/admin/backup', () => {
            it('should create database backup', async () => {
                // Mock file system operations
                const fs = require('fs');
                jest.spyOn(fs, 'existsSync').mockReturnValue(true);
                jest.spyOn(fs, 'statSync').mockReturnValue({ size: 1024000 });

                // Mock exec command
                const { exec } = require('child_process');
                exec.mockImplementation((command, callback) => {
                    callback(null, 'Backup created successfully');
                });

                const response = await request(app)
                    .post('/api/admin/backup')
                    .set('Authorization', adminToken);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Database backup created successfully');
                expect(response.body.filename).toMatch(/backup_\d{8}_\d{6}\.sql/);
            });
        });

        describe('GET /api/admin/backups', () => {
            it('should list available backups', async () => {
                const fs = require('fs');
                jest.spyOn(fs, 'readdirSync').mockReturnValue([
                    'backup_20231201_143000.sql',
                    'backup_20231130_143000.sql'
                ]);
                jest.spyOn(fs, 'statSync').mockReturnValue({
                    size: 1024000,
                    mtime: new Date('2023-12-01T14:30:00Z')
                });

                const response = await request(app)
                    .get('/api/admin/backups')
                    .set('Authorization', adminToken);

                expect(response.status).toBe(200);
                expect(response.body.backups).toBeInstanceOf(Array);
                expect(response.body.backups[0]).toEqual({
                    filename: 'backup_20231201_143000.sql',
                    size: 1024000,
                    created_at: expect.any(String)
                });
            });
        });

        describe('POST /api/admin/restore', () => {
            it('should restore database from backup', async () => {
                const restoreParams = {
                    filename: 'backup_20231201_143000.sql'
                };

                const fs = require('fs');
                jest.spyOn(fs, 'existsSync').mockReturnValue(true);

                const { exec } = require('child_process');
                exec.mockImplementation((command, callback) => {
                    callback(null, 'Restore completed successfully');
                });

                SystemLog.log.mockResolvedValue();

                const response = await request(app)
                    .post('/api/admin/restore')
                    .set('Authorization', adminToken)
                    .send(restoreParams);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Database restored successfully');
                expect(SystemLog.log).toHaveBeenCalledWith(
                    'admin',
                    'database_restored',
                    expect.any(String),
                    'admin-123'
                );
            });

            it('should validate backup file exists', async () => {
                const fs = require('fs');
                jest.spyOn(fs, 'existsSync').mockReturnValue(false);

                const response = await request(app)
                    .post('/api/admin/restore')
                    .set('Authorization', adminToken)
                    .send({
                        filename: 'non-existent.sql'
                    });

                expect(response.status).toBe(404);
                expect(response.body.error).toBe('Backup file not found');
            });
        });
    });

    // Language Management API Tests
    describe('Language Management API', () => {
        describe('GET /api/admin/languages', () => {
            it('should get language settings', async () => {
                const mockLanguages = {
                    availableLanguages: ['en', 'es', 'fr', 'zh'],
                    defaultLanguage: 'en',
                    translationStatus: {
                        en: 100,
                        es: 85,
                        fr: 75,
                        zh: 60
                    }
                };

                // Mock language data loading
                pool.query.mockResolvedValue({
                    rows: [
                        { language: 'en', completion: 100 },
                        { language: 'es', completion: 85 }
                    ]
                });

                const response = await request(app)
                    .get('/api/admin/languages')
                    .set('Authorization', adminToken);

                expect(response.status).toBe(200);
                expect(response.body.languages).toBeDefined();
            });
        });

        describe('PUT /api/admin/languages/:language', () => {
            it('should update language translations', async () => {
                const translationUpdate = {
                    translations: {
                        'common.welcome': 'Bienvenido',
                        'common.goodbye': 'Adiós'
                    }
                };

                pool.query.mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                const response = await request(app)
                    .put('/api/admin/languages/es')
                    .set('Authorization', adminToken)
                    .send(translationUpdate);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Language translations updated successfully');
            });
        });
    });

    // Access Control Tests
    describe('Access Control', () => {
        it('should deny access to all admin endpoints for regular users', async () => {
            const adminEndpoints = [
                '/api/admin/users',
                '/api/admin/dashboard',
                '/api/admin/reports',
                '/api/admin/settings',
                '/api/admin/logs',
                '/api/admin/backup'
            ];

            for (const endpoint of adminEndpoints) {
                const response = await request(app)
                    .get(endpoint)
                    .set('Authorization', regularUserToken);

                expect(response.status).toBe(403);
                expect(response.body.error).toBe('Admin access required');
            }
        });

        it('should require authentication for all admin endpoints', async () => {
            const adminEndpoints = [
                '/api/admin/users',
                '/api/admin/dashboard',
                '/api/admin/settings'
            ];

            for (const endpoint of adminEndpoints) {
                const response = await request(app).get(endpoint);
                expect(response.status).toBe(401);
            }
        });
    });

    // Error Handling Tests
    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            User.findAll.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', adminToken);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to fetch users');
        });

        it('should handle invalid JSON in request body', async () => {
            const response = await request(app)
                .post('/api/admin/users')
                .set('Authorization', adminToken)
                .set('Content-Type', 'application/json')
                .send('invalid json');

            expect(response.status).toBe(400);
        });

        it('should handle backup creation failures', async () => {
            const { exec } = require('child_process');
            exec.mockImplementation((command, callback) => {
                callback(new Error('pg_dump failed'), null);
            });

            const response = await request(app)
                .post('/api/admin/backup')
                .set('Authorization', adminToken);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to create backup');
        });
    });
});