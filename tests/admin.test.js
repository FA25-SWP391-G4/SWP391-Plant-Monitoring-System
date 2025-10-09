/**
 * ============================================================================
 * ADMIN CONTROLLER TESTS
 * ============================================================================
 * 
 * Test suite for the adminController functionality:
 * - UC24: Manage Users
 * - UC25: View System-Wide Reports
 * - UC26: Configure Global Settings
 * - UC27: Monitor System Logs
 * - UC28: Backup and Restore Data
 * - UC31: Manage Multi-Language Settings
 */

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');

// Mock data for testing
const adminUser = {
  id: 1,
  email: 'admin@plantsystem.com',
  role: 'ADMIN'
};

// Helper to create admin JWT token for tests
const generateAdminToken = () => {
  return jwt.sign(
    { id: adminUser.id, email: adminUser.email, role: adminUser.role },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
};

describe('Admin Controller Tests', () => {
  let adminToken;
  
  beforeAll(async () => {
    // Create test admin token
    adminToken = generateAdminToken();
    
    // Create a few system logs for testing
    await SystemLog.info('TEST', 'Admin controller test setup');
    await SystemLog.warning('TEST', 'Admin controller test warning');
    await SystemLog.error('TEST', 'Admin controller test error');
  });

  /**
   * UC24: MANAGE USERS TESTS
   */
  describe('UC24: Manage Users', () => {
    test('GET /api/admin/users should return user list for admins', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    test('POST /api/admin/users should create a new user', async () => {
      const newUser = {
        email: 'test-user@plantsystem.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      };
      
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', newUser.email);
    });
  });

  /**
   * UC25: VIEW SYSTEM-WIDE REPORTS TESTS
   */
  describe('UC25: View System-Wide Reports', () => {
    test('GET /api/admin/dashboard should return system dashboard data', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userCount');
      expect(response.body.data).toHaveProperty('plantCount');
      expect(response.body.data).toHaveProperty('deviceCount');
      expect(response.body.data).toHaveProperty('alertCount');
    });
    
    test('GET /api/admin/reports should return system reports', async () => {
      const response = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userReport');
      expect(response.body.data).toHaveProperty('plantReport');
      expect(response.body.data).toHaveProperty('wateringReport');
    });
  });

  /**
   * UC26: CONFIGURE GLOBAL SETTINGS TESTS
   */
  describe('UC26: Configure Global Settings', () => {
    test('GET /api/admin/settings should return system settings', async () => {
      const response = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('settings');
    });
    
    test('PUT /api/admin/settings should update system settings', async () => {
      const updatedSettings = {
        allowUserRegistration: true,
        defaultLanguage: 'en',
        emailNotifications: true
      };
      
      const response = await request(app)
        .put('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedSettings);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toHaveProperty('allowUserRegistration', updatedSettings.allowUserRegistration);
    });
  });

  /**
   * UC27: MONITOR SYSTEM LOGS TESTS
   */
  describe('UC27: Monitor System Logs', () => {
    test('GET /api/admin/logs should return system logs', async () => {
      const response = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.logs)).toBe(true);
    });
    
    test('GET /api/admin/logs should support filtering logs by level', async () => {
      const response = await request(app)
        .get('/api/admin/logs?level=ERROR')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.logs)).toBe(true);
      expect(response.body.data.logs.every(log => log.log_level === 'ERROR')).toBe(true);
    });
  });

  /**
   * UC28: BACKUP AND RESTORE DATA TESTS
   */
  describe('UC28: Backup and Restore Data', () => {
    test('POST /api/admin/backup should create a database backup', async () => {
      const response = await request(app)
        .post('/api/admin/backup')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('backupId');
      expect(response.body.data).toHaveProperty('timestamp');
    });
    
    test('GET /api/admin/backups should list available backups', async () => {
      const response = await request(app)
        .get('/api/admin/backups')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.backups)).toBe(true);
    });
  });

  /**
   * UC31: MANAGE MULTI-LANGUAGE SETTINGS TESTS
   */
  describe('UC31: Manage Multi-Language Settings', () => {
    test('GET /api/admin/languages should return language settings', async () => {
      const response = await request(app)
        .get('/api/admin/languages')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('languages');
      expect(response.body.data).toHaveProperty('defaultLanguage');
    });
    
    test('PUT /api/admin/languages should update language settings', async () => {
      const updatedSettings = {
        defaultLanguage: 'en',
        availableLanguages: ['en', 'vi', 'fr']
      };
      
      const response = await request(app)
        .put('/api/admin/languages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedSettings);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('defaultLanguage', updatedSettings.defaultLanguage);
    });
  });

  /**
   * ADMIN ACCESS CONTROL TESTS
   */
  describe('Admin Access Control', () => {
    test('Non-admin users should not have access to admin routes', async () => {
      // Create regular user token
      const regularUserToken = jwt.sign(
        { id: 2, email: 'user@plantsystem.com', role: 'USER' },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );
      
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${regularUserToken}`);
      
      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });
    
    test('Unauthenticated requests should be rejected', async () => {
      const response = await request(app)
        .get('/api/admin/users');
      
      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});