/**
 * ADMIN CONTROLLER TESTS
 * ======================
 * 
 * Comprehensive unit tests for admin controller functionality
 * Covers user management, system reports, settings, logs, backup/restore, and language settings
 */

const adminController = require('../../../controllers/adminController');
const User = require('../../../models/User');
const SystemLog = require('../../../models/SystemLog');
const Plant = require('../../../models/Plant');
const Device = require('../../../models/Device');
const SensorData = require('../../../models/SensorData');
const WateringHistory = require('../../../models/WateringHistory');
const Payment = require('../../../models/Payment');
const { pool } = require('../../../config/db');
const fs = require('fs');
const { exec } = require('child_process');

// Mock dependencies
jest.mock('../../../models/User');
jest.mock('../../../models/SystemLog');
jest.mock('../../../models/Plant');
jest.mock('../../../models/Device');
jest.mock('../../../models/SensorData');
jest.mock('../../../models/WateringHistory');
jest.mock('../../../models/Payment');
jest.mock('../../../config/db');
jest.mock('fs');
jest.mock('child_process');

describe('Admin Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {},
            user: {
                id: 'admin-123',
                email: 'admin@example.com',
                role: 'Admin'
            }
        };
        
        mockRes = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            download: jest.fn().mockReturnThis()
        };
        
        mockNext = jest.fn();

        // Reset mocks
        jest.clearAllMocks();
    });

    // UC24: User Management
    describe('User Management', () => {
        describe('getAllUsers', () => {
            it('should get all users with pagination', async () => {
                mockReq.query = {
                    page: '1',
                    limit: '10',
                    search: 'test',
                    role: 'Premium'
                };

                const mockUsers = [
                    { id: 'user-1', email: 'user1@test.com', role: 'Premium' },
                    { id: 'user-2', email: 'user2@test.com', role: 'Premium' }
                ];

                User.findAll.mockResolvedValue(mockUsers);
                User.countAll.mockResolvedValue(25);

                await adminController.getAllUsers(mockReq, mockRes);

                expect(User.findAll).toHaveBeenCalledWith({
                    search: 'test',
                    role: 'Premium',
                    page: 1,
                    limit: 10
                });
                expect(mockRes.json).toHaveBeenCalledWith({
                    users: mockUsers,
                    pagination: {
                        totalUsers: 25,
                        currentPage: 1,
                        totalPages: 3,
                        limit: 10
                    }
                });
            });

            it('should handle search and filter parameters', async () => {
                mockReq.query = {
                    search: 'john',
                    role: 'Regular'
                };

                User.findAll.mockResolvedValue([]);
                User.countAll.mockResolvedValue(0);

                await adminController.getAllUsers(mockReq, mockRes);

                expect(User.findAll).toHaveBeenCalledWith({
                    search: 'john',
                    role: 'Regular',
                    page: 1,
                    limit: 10
                });
            });
        });

        describe('getUserById', () => {
            it('should get user by ID with related data', async () => {
                mockReq.params.userId = 'user-123';

                const mockUser = {
                    id: 'user-123',
                    email: 'user@test.com',
                    role: 'Premium',
                    plants: [{ id: 'plant-1', name: 'Rose' }],
                    devices: [{ id: 'device-1', name: 'Sensor 1' }],
                    paymentHistory: [{ id: 'payment-1', amount: 100 }]
                };

                User.findById.mockResolvedValue(mockUser);

                await adminController.getUserById(mockReq, mockRes);

                expect(User.findById).toHaveBeenCalledWith('user-123', { includeRelated: true });
                expect(mockRes.json).toHaveBeenCalledWith({
                    user: mockUser
                });
            });

            it('should handle non-existent user', async () => {
                mockReq.params.userId = 'non-existent';

                User.findById.mockResolvedValue(null);

                await adminController.getUserById(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(404);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'User not found'
                });
            });
        });

        describe('createUser', () => {
            it('should create a new user successfully', async () => {
                mockReq.body = {
                    email: 'newuser@test.com',
                    password: 'SecurePass123!',
                    role: 'Regular',
                    firstName: 'John',
                    lastName: 'Doe'
                };

                const mockCreatedUser = {
                    id: 'new-user-123',
                    email: 'newuser@test.com',
                    role: 'Regular',
                    firstName: 'John',
                    lastName: 'Doe'
                };

                User.findByEmail.mockResolvedValue(null);
                User.create.mockResolvedValue(mockCreatedUser);
                SystemLog.log.mockResolvedValue();

                await adminController.createUser(mockReq, mockRes);

                expect(User.findByEmail).toHaveBeenCalledWith('newuser@test.com');
                expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
                    email: 'newuser@test.com',
                    role: 'Regular',
                    firstName: 'John',
                    lastName: 'Doe'
                }));
                expect(SystemLog.log).toHaveBeenCalledWith(
                    'admin',
                    'user_created',
                    `Admin admin@example.com created user newuser@test.com`,
                    'admin-123'
                );
                expect(mockRes.status).toHaveBeenCalledWith(201);
            });

            it('should prevent duplicate email creation', async () => {
                mockReq.body = {
                    email: 'existing@test.com',
                    password: 'SecurePass123!'
                };

                User.findByEmail.mockResolvedValue({ id: 'existing-user' });

                await adminController.createUser(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Email already exists'
                });
            });

            it('should validate required fields', async () => {
                mockReq.body = {
                    email: 'test@example.com'
                    // Missing password
                };

                await adminController.createUser(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Email and password are required'
                });
            });
        });

        describe('updateUser', () => {
            it('should update user successfully', async () => {
                mockReq.params.userId = 'user-123';
                mockReq.body = {
                    role: 'Premium',
                    firstName: 'Updated',
                    lastName: 'Name'
                };

                const mockUpdatedUser = {
                    id: 'user-123',
                    email: 'user@test.com',
                    role: 'Premium',
                    firstName: 'Updated',
                    lastName: 'Name'
                };

                User.findById.mockResolvedValue({ id: 'user-123', email: 'user@test.com' });
                User.update.mockResolvedValue(mockUpdatedUser);
                SystemLog.log.mockResolvedValue();

                await adminController.updateUser(mockReq, mockRes);

                expect(User.update).toHaveBeenCalledWith('user-123', {
                    role: 'Premium',
                    firstName: 'Updated',
                    lastName: 'Name'
                });
                expect(SystemLog.log).toHaveBeenCalledWith(
                    'admin',
                    'user_updated',
                    expect.any(String),
                    'admin-123'
                );
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'User updated successfully',
                    user: mockUpdatedUser
                });
            });

            it('should handle role change validation', async () => {
                mockReq.params.userId = 'user-123';
                mockReq.body = {
                    role: 'InvalidRole'
                };

                await adminController.updateUser(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid role. Must be Regular, Premium, or Admin'
                });
            });
        });

        describe('deleteUser', () => {
            it('should delete user successfully', async () => {
                mockReq.params.userId = 'user-123';

                const mockUser = {
                    id: 'user-123',
                    email: 'user@test.com'
                };

                User.findById.mockResolvedValue(mockUser);
                User.delete.mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                await adminController.deleteUser(mockReq, mockRes);

                expect(User.delete).toHaveBeenCalledWith('user-123');
                expect(SystemLog.log).toHaveBeenCalledWith(
                    'admin',
                    'user_deleted',
                    `Admin admin@example.com deleted user user@test.com`,
                    'admin-123'
                );
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'User deleted successfully'
                });
            });

            it('should prevent self-deletion', async () => {
                mockReq.params.userId = 'admin-123'; // Same as logged in admin

                await adminController.deleteUser(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Cannot delete your own account'
                });
            });
        });

        describe('bulkUserActions', () => {
            it('should perform bulk role updates', async () => {
                mockReq.body = {
                    action: 'updateRole',
                    userIds: ['user-1', 'user-2', 'user-3'],
                    newRole: 'Premium'
                };

                User.bulkUpdate.mockResolvedValue({ affectedRows: 3 });
                SystemLog.log.mockResolvedValue();

                await adminController.bulkUserActions(mockReq, mockRes);

                expect(User.bulkUpdate).toHaveBeenCalledWith(
                    ['user-1', 'user-2', 'user-3'],
                    { role: 'Premium' }
                );
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Bulk action completed successfully',
                    affectedUsers: 3
                });
            });

            it('should handle bulk deletion', async () => {
                mockReq.body = {
                    action: 'delete',
                    userIds: ['user-1', 'user-2']
                };

                User.bulkDelete.mockResolvedValue({ affectedRows: 2 });

                await adminController.bulkUserActions(mockReq, mockRes);

                expect(User.bulkDelete).toHaveBeenCalledWith(['user-1', 'user-2']);
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Bulk action completed successfully',
                    affectedUsers: 2
                });
            });
        });
    });

    // UC25: System Reports
    describe('System Reports', () => {
        describe('getSystemDashboard', () => {
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

                User.getTotalCount.mockResolvedValue(150);
                User.getActiveCount.mockResolvedValue(120);
                Device.getTotalCount.mockResolvedValue(45);
                Device.getActiveCount.mockResolvedValue(38);
                Plant.getTotalCount.mockResolvedValue(89);
                SensorData.getTotalCount.mockResolvedValue(12450);
                SystemLog.getRecentActivity.mockResolvedValue([]);

                await adminController.getSystemDashboard(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    dashboard: mockMetrics
                });
            });
        });

        describe('getSystemReports', () => {
            it('should generate user reports', async () => {
                mockReq.query = {
                    type: 'users',
                    period: 'month'
                };

                const mockReport = {
                    type: 'users',
                    period: 'month',
                    data: {
                        totalUsers: 150,
                        newUsers: 25,
                        activeUsers: 120,
                        usersByRole: { Regular: 100, Premium: 45, Admin: 5 }
                    }
                };

                // Mock the private helper function result
                jest.spyOn(adminController, 'generateUserReport')
                    .mockResolvedValue(mockReport.data);

                await adminController.getSystemReports(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    report: mockReport
                });
            });

            it('should generate device reports', async () => {
                mockReq.query = {
                    type: 'devices',
                    period: 'week'
                };

                const mockDeviceData = {
                    totalDevices: 45,
                    activeDevices: 38,
                    devicesByType: { sensor: 30, pump: 15 }
                };

                jest.spyOn(adminController, 'generateDeviceReport')
                    .mockResolvedValue(mockDeviceData);

                await adminController.getSystemReports(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    report: {
                        type: 'devices',
                        period: 'week',
                        data: mockDeviceData
                    }
                });
            });

            it('should export reports as CSV', async () => {
                mockReq.query = {
                    type: 'users',
                    period: 'month',
                    format: 'csv'
                };

                const mockCSV = 'Email,Role,Created At\nuser1@test.com,Regular,2023-01-01\n';
                
                jest.spyOn(adminController, 'generateUserReport')
                    .mockResolvedValue({});
                jest.spyOn(adminController, 'convertToCSV')
                    .mockReturnValue(mockCSV);

                await adminController.getSystemReports(mockReq, mockRes);

                expect(mockRes.set).toHaveBeenCalledWith({
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="users_report_month.csv"'
                });
                expect(mockRes.send).toHaveBeenCalledWith(mockCSV);
            });
        });
    });

    // UC26: System Settings
    describe('System Configuration', () => {
        describe('getSystemSettings', () => {
            it('should get all system settings', async () => {
                const mockSettings = {
                    general: {
                        siteName: 'Plant Monitor',
                        maintenanceMode: false,
                        registrationEnabled: true
                    },
                    notifications: {
                        emailEnabled: true,
                        smsEnabled: false,
                        pushEnabled: true
                    },
                    security: {
                        passwordMinLength: 8,
                        sessionTimeout: 3600,
                        maxLoginAttempts: 5
                    }
                };

                // Mock reading settings from database or config
                jest.spyOn(adminController, 'loadSettingsFromDatabase')
                    .mockResolvedValue(mockSettings);

                await adminController.getSystemSettings(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    settings: mockSettings
                });
            });
        });

        describe('updateSystemSettings', () => {
            it('should update system settings', async () => {
                mockReq.body = {
                    category: 'general',
                    settings: {
                        siteName: 'Updated Plant Monitor',
                        maintenanceMode: true
                    }
                };

                jest.spyOn(adminController, 'validateSettingValues')
                    .mockReturnValue(true);
                jest.spyOn(adminController, 'saveSettingsToDatabase')
                    .mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                await adminController.updateSystemSettings(mockReq, mockRes);

                expect(SystemLog.log).toHaveBeenCalledWith(
                    'admin',
                    'settings_updated',
                    expect.stringContaining('Updated system settings'),
                    'admin-123'
                );
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Settings updated successfully'
                });
            });

            it('should validate setting values', async () => {
                mockReq.body = {
                    category: 'security',
                    settings: {
                        passwordMinLength: 3 // Invalid - too short
                    }
                };

                await adminController.updateSystemSettings(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid setting value: passwordMinLength must be at least 6'
                });
            });
        });
    });

    // UC27: System Logs
    describe('System Logs', () => {
        describe('getSystemLogs', () => {
            it('should get system logs with filtering', async () => {
                mockReq.query = {
                    level: 'error',
                    component: 'auth',
                    startDate: '2023-01-01',
                    endDate: '2023-01-31',
                    page: '1',
                    limit: '50'
                };

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

                await adminController.getSystemLogs(mockReq, mockRes);

                expect(SystemLog.findAll).toHaveBeenCalledWith({
                    level: 'error',
                    component: 'auth',
                    startDate: '2023-01-01',
                    endDate: '2023-01-31',
                    page: 1,
                    limit: 50
                });
                expect(mockRes.json).toHaveBeenCalledWith({
                    logs: mockLogs,
                    pagination: {
                        total: 100,
                        page: 1,
                        limit: 50,
                        pages: 2
                    }
                });
            });
        });

        describe('deleteSystemLogs', () => {
            it('should delete old logs', async () => {
                mockReq.body = {
                    olderThan: '2023-01-01',
                    level: 'info'
                };

                SystemLog.deleteOld.mockResolvedValue({ deletedCount: 500 });

                await adminController.deleteSystemLogs(mockReq, mockRes);

                expect(SystemLog.deleteOld).toHaveBeenCalledWith({
                    olderThan: '2023-01-01',
                    level: 'info'
                });
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Logs deleted successfully',
                    deletedCount: 500
                });
            });
        });
    });

    // UC28: Backup and Restore
    describe('Database Backup and Restore', () => {
        describe('backupDatabase', () => {
            it('should create database backup', async () => {
                const mockExec = require('child_process').exec;
                mockExec.mockImplementation((command, callback) => {
                    callback(null, 'Backup created successfully');
                });

                fs.existsSync.mockReturnValue(true);
                fs.statSync.mockReturnValue({ size: 1024000 });

                await adminController.backupDatabase(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Database backup created successfully',
                    filename: expect.stringMatching(/backup_\d{8}_\d{6}\.sql/),
                    size: 1024000
                });
            });
        });

        describe('listBackups', () => {
            it('should list available backups', async () => {
                const mockBackupFiles = [
                    'backup_20231201_143000.sql',
                    'backup_20231130_143000.sql'
                ];

                fs.readdirSync.mockReturnValue(mockBackupFiles);
                fs.statSync.mockReturnValue({
                    size: 1024000,
                    mtime: new Date('2023-12-01T14:30:00Z')
                });

                await adminController.listBackups(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    backups: expect.arrayContaining([
                        expect.objectContaining({
                            filename: 'backup_20231201_143000.sql',
                            size: 1024000
                        })
                    ])
                });
            });
        });

        describe('restoreDatabase', () => {
            it('should restore database from backup', async () => {
                mockReq.body = {
                    filename: 'backup_20231201_143000.sql'
                };

                fs.existsSync.mockReturnValue(true);
                
                const mockExec = require('child_process').exec;
                mockExec.mockImplementation((command, callback) => {
                    callback(null, 'Restore completed successfully');
                });

                SystemLog.log.mockResolvedValue();

                await adminController.restoreDatabase(mockReq, mockRes);

                expect(SystemLog.log).toHaveBeenCalledWith(
                    'admin',
                    'database_restored',
                    expect.stringContaining('Database restored from backup'),
                    'admin-123'
                );
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Database restored successfully',
                    filename: 'backup_20231201_143000.sql'
                });
            });
        });
    });

    // Error handling
    describe('Error Handling', () => {
        it('should handle database connection errors', async () => {
            User.findAll.mockRejectedValue(new Error('Database connection failed'));

            await adminController.getAllUsers(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to fetch users'
            });
        });

        it('should handle backup creation errors', async () => {
            const mockExec = require('child_process').exec;
            mockExec.mockImplementation((command, callback) => {
                callback(new Error('pg_dump failed'));
            });

            await adminController.backupDatabase(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to create backup'
            });
        });
    });
});