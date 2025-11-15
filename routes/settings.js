/**
 * ============================================================================
 * SETTINGS ROUTES - USER PREFERENCES & SYSTEM SETTINGS
 * ============================================================================
 * 
 * Routes for managing user settings including:
 * - Dashboard appearance and widget visibility
 * - Language and region preferences
 * - Notification settings
 * - Privacy and security settings
 * 
 * All routes require authentication middleware
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all settings routes
router.use(authMiddleware);

/**
 * USER SETTINGS ROUTES
 */

// Get all user settings
router.get('/', settingsController.getUserSettings);

// Update user settings (complete replacement)
router.put('/', (req, res, next) => {
  console.log('[ROUTE] PUT /api/settings request received');
  console.log('[ROUTE] Request body:', JSON.stringify(req.body, null, 2));
  next();
}, settingsController.updateUserSettings);

// Update specific setting category
router.patch('/:category', settingsController.updateSettingCategory);

/**
 * DASHBOARD WIDGET SETTINGS
 */

// Get dashboard widget preferences
router.get('/widgets', settingsController.getWidgetSettings);

// Update dashboard widget preferences
router.put('/widgets', settingsController.updateWidgetSettings);

// Reset widget settings to defaults
router.post('/widgets/reset', settingsController.resetWidgetSettings);

/**
 * NOTIFICATION SETTINGS
 */

// Get notification preferences
router.get('/notifications', settingsController.getNotificationSettings);

// Update notification preferences
router.put('/notifications', settingsController.updateNotificationSettings);

/**
 * PRIVACY SETTINGS
 */

// Get privacy preferences
router.get('/privacy', settingsController.getPrivacySettings);

// Update privacy preferences
router.put('/privacy', settingsController.updatePrivacySettings);

/**
 * APPEARANCE SETTINGS
 */

// Get appearance preferences
router.get('/appearance', settingsController.getAppearanceSettings);

// Update appearance preferences
router.put('/appearance', settingsController.updateAppearanceSettings);

module.exports = router;