/**
 * ============================================================================
 * ADMIN ROUTES - SYSTEM ADMINISTRATION
 * ============================================================================
 * 
 * Routes for administrative functionality:
 * - UC24: Manage Users - User CRUD, role management, bulk operations
 * - UC25: View System-Wide Reports - Global metrics and analytics
 * - UC26: Configure Global Settings - System configuration management
 * - UC27: Monitor System Logs - Error tracking and audit logs
 * - UC28: Backup and Restore Data - Data management utilities
 * - UC31: Manage Multi-Language Settings - Internationalization admin
 * 
 * SECURITY CONSIDERATIONS:
 * - All routes require Admin role authentication
 * - Access control verification for sensitive operations
 * - Rate limiting for API protection
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Apply authentication and admin-only middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * UC24: MANAGE USERS ROUTES
 */
// Get all users with filtering and pagination
router.get('/users', adminController.getAllUsers);

// Get user by ID with detailed information
router.get('/users/:userId', adminController.getUserById);

// Create a new user (admin action)
router.post('/users', adminController.createUser);

// Update an existing user
router.put('/users/:userId', adminController.updateUser);

// Delete a user
router.delete('/users/:userId', adminController.deleteUser);

// Reset a user's password
router.post('/users/:userId/reset-password', adminController.resetUserPassword);

// Perform bulk actions on users (delete, change role, etc.)
router.post('/users/bulk', adminController.bulkUserActions);

/**
 * UC25: VIEW SYSTEM-WIDE REPORTS ROUTES
 */
// Get system dashboard data
router.get('/dashboard', adminController.getSystemDashboard);

// Get system reports (users, devices, sensors, watering)
router.get('/reports', adminController.getSystemReports);

/**
 * UC26: CONFIGURE GLOBAL SETTINGS ROUTES
 */
// Get system settings
router.get('/settings', adminController.getSystemSettings);

// Update system settings
router.put('/settings', adminController.updateSystemSettings);

/**
 * UC27: MONITOR SYSTEM LOGS ROUTES
 */
// Get system logs with filtering and pagination
router.get('/logs', adminController.getSystemLogs);

// Delete system logs matching criteria
router.delete('/logs', adminController.deleteSystemLogs);

/**
 * UC28: BACKUP AND RESTORE DATA ROUTES
 */
// Create a database backup
router.post('/backup', adminController.backupDatabase);

// List available backups
router.get('/backups', adminController.listBackups);

// Restore database from backup
router.post('/restore', adminController.restoreDatabase);

/**
 * UC31: MANAGE MULTI-LANGUAGE SETTINGS ROUTES
 */
// Get language settings and available translations
router.get('/languages', adminController.getLanguageSettings);

// Update language settings
router.put('/languages', adminController.updateLanguageSettings);

// Update translations for a specific language
router.put('/languages/:language/translations', adminController.updateTranslations);

module.exports = router;