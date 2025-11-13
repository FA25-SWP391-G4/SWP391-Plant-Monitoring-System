/**
 * ============================================================================
 * SETTINGS CONTROLLER - USER PREFERENCES & SYSTEM SETTINGS
 * ============================================================================
 * 
 * This controller handles user settings management including:
 * - Dashboard appearance and widget visibility
 * - Language and region preferences  
 * - Notification settings
 * - Privacy and security settings
 * 
 * All functions require authentication and work with user-specific settings
 */

console.log('🔥🔥🔥 SETTINGS CONTROLLER FILE LOADED 🔥🔥🔥');

const User = require('../models/User');
const { isValidUUID } = require('../utils/uuidGenerator');

/**
 * DEFAULT SETTINGS STRUCTURE
 * Used when user has no existing settings
 */
const DEFAULT_SETTINGS = {
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    colorScheme: 'blue'
  },
  language: {
    preferred: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  },
  notifications: {
    email: true,
    push: true,
    sms: false,
    wateringReminders: true,
    criticalAlerts: true,
    weeklyReports: true
  },
  privacy: {
    shareData: false,
    anonymousAnalytics: true,
    locationAccess: 'while-using'
  },
  widgets: {
    // Main dashboard widgets
    showPlantOverview: true,
    showSensorData: true,
    showAIInsights: true,
    showAIPredictions: true,
    showAIHistory: false,
    showWateringSchedule: true,
    showWeatherWidget: true,
    showNotifications: true,
    showQuickActions: true,
    showRecentActivity: false,
    showPlantHealth: true,
    showEnvironmentalData: true,
    
    // AI Section widgets
    showChatbot: true,
    showImageAnalysis: true,
    showDiseaseDetection: false,
    showGrowthPredictions: false,
    
    // Appearance settings
    compactMode: false,
    showWidgetTitles: true,
    showWidgetIcons: true,
    animationsEnabled: true,
    darkModeCompatible: true,
    
    // AI Features
    enableAIFeatures: false
  }
};

/**
 * GET ALL USER SETTINGS
 * ======================
 * Retrieves stored user settings or returns defaults - NO MERGING
 * 
 * @route GET /settings
 * @access Private
 */
async function getUserSettings(req, res) {
  try {
    console.log('🔥 [SETTINGS] getUserSettings CALLED - function is executing');
    const userId = req.user.user_id;
    
    if (!isValidUUID(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    console.log('[SETTINGS] Fetching settings for user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return stored settings or defaults - NO MERGING
    let settings = user.settings || DEFAULT_SETTINGS;
    console.log('[SETTINGS] Raw stored settings:', settings);
    console.log('[SETTINGS] Returning settings exactly as stored (no merging)');

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('[SETTINGS] Error fetching user settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
}

/**
 * UPDATE ALL USER SETTINGS
 * =========================
 * Updates the complete user settings object - NO MERGING, just save what's sent
 * 
 * @route PUT /settings
 * @access Private
 */
async function updateUserSettings(req, res) {
  try {
    console.log('🔥🔥 [SETTINGS] updateUserSettings CALLED - PUT request received! 🔥🔥');
    const userId = req.user.user_id;
    const newSettings = req.body;
    
    console.log('[SETTINGS] PUT request details:');
    console.log('[SETTINGS] User ID:', userId);
    console.log('[SETTINGS] Request body:', JSON.stringify(newSettings, null, 2));

    if (!isValidUUID(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    // Validate settings structure
    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid settings format'
      });
    }

    // NO MERGING - Save exactly what the frontend sends
    console.log('[SETTINGS] Saving settings exactly as received (no merging)');
    
    // Update user settings in database
    const updated = await User.updateUserSettings(userId, JSON.stringify(newSettings));
    if (!updated) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update settings'
      });
    }

    console.log('[SETTINGS] ✅ Settings successfully saved to database');

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: newSettings
    });

  } catch (error) {
    console.error('[SETTINGS] Error updating user settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
}

/**
 * UPDATE SPECIFIC SETTING CATEGORY
 * =================================
 * Updates a specific category of settings (appearance, language, etc.)
 * 
 * @route PATCH /settings/:category
 * @access Private
 */
async function updateSettingCategory(req, res) {
  try {
    const userId = req.user.user_id;
    const category = req.params.category;
    const categorySettings = req.body;

    if (!isValidUUID(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    const validCategories = ['appearance', 'language', 'notifications', 'privacy', 'widgets'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid settings category'
      });
    }

    console.log(`[SETTINGS] Updating ${category} settings for user:`, userId);

    const user = await User.findByUserId(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const existingSettings = user.settings ? JSON.parse(user.settings) : DEFAULT_SETTINGS;
    const updatedSettings = {
      ...existingSettings,
      [category]: {
        ...existingSettings[category],
        ...categorySettings
      }
    };

    const updated = await User.updateUserSettings(userId, JSON.stringify(updatedSettings));
    if (!updated) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update settings'
      });
    }

    res.json({
      success: true,
      message: `${category} settings updated successfully`,
      data: updatedSettings
    });

  } catch (error) {
    console.error('[SETTINGS] Error updating category settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
}

/**
 * GET WIDGET SETTINGS
 * ====================
 * Retrieves dashboard widget preferences
 * 
 * @route GET /settings/widgets
 * @access Private
 */
async function getWidgetSettings(req, res) {
  try {
    const userId = req.user.user_id;
    
    if (!isValidUUID(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    const user = await User.findByUserId(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const settings = user.settings ? JSON.parse(user.settings) : DEFAULT_SETTINGS;
    const widgetSettings = settings.widgets || DEFAULT_SETTINGS.widgets;

    res.json({
      success: true,
      data: widgetSettings
    });

  } catch (error) {
    console.error('[SETTINGS] Error fetching widget settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch widget settings'
    });
  }
}

/**
 * UPDATE WIDGET SETTINGS
 * =======================
 * Updates dashboard widget preferences
 * 
 * @route PUT /settings/widgets
 * @access Private
 */
async function updateWidgetSettings(req, res) {
  try {
    const userId = req.user.user_id;
    const widgetSettings = req.body;

    if (!isValidUUID(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    const user = await User.findByUserId(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const existingSettings = user.settings ? JSON.parse(user.settings) : DEFAULT_SETTINGS;
    const updatedSettings = {
      ...existingSettings,
      widgets: {
        ...existingSettings.widgets,
        ...widgetSettings
      }
    };

    const updated = await User.updateUserSettings(userId, JSON.stringify(updatedSettings));
    if (!updated) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update widget settings'
      });
    }

    res.json({
      success: true,
      message: 'Widget settings updated successfully',
      data: updatedSettings.widgets
    });

  } catch (error) {
    console.error('[SETTINGS] Error updating widget settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update widget settings'
    });
  }
}

/**
 * RESET WIDGET SETTINGS
 * ======================
 * Resets widget settings to defaults
 * 
 * @route POST /settings/widgets/reset
 * @access Private
 */
async function resetWidgetSettings(req, res) {
  try {
    const userId = req.user.user_id;

    if (!isValidUUID(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    const user = await User.findByUserId(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const existingSettings = user.settings ? JSON.parse(user.settings) : DEFAULT_SETTINGS;
    const updatedSettings = {
      ...existingSettings,
      widgets: DEFAULT_SETTINGS.widgets
    };

    const updated = await User.updateUserSettings(userId, JSON.stringify(updatedSettings));
    if (!updated) {
      return res.status(500).json({
        success: false,
        error: 'Failed to reset widget settings'
      });
    }

    res.json({
      success: true,
      message: 'Widget settings reset to defaults',
      data: DEFAULT_SETTINGS.widgets
    });

  } catch (error) {
    console.error('[SETTINGS] Error resetting widget settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset widget settings'
    });
  }
}

// Specific category getters and setters for convenience
async function getNotificationSettings(req, res) {
  return getCategorySettings(req, res, 'notifications');
}

async function updateNotificationSettings(req, res) {
  return updateCategorySettings(req, res, 'notifications');
}

async function getPrivacySettings(req, res) {
  return getCategorySettings(req, res, 'privacy');
}

async function updatePrivacySettings(req, res) {
  return updateCategorySettings(req, res, 'privacy');
}

async function getAppearanceSettings(req, res) {
  return getCategorySettings(req, res, 'appearance');
}

async function updateAppearanceSettings(req, res) {
  return updateCategorySettings(req, res, 'appearance');
}

// Helper functions
async function getCategorySettings(req, res, category) {
  try {
    const userId = req.user.user_id;
    
    if (!isValidUUID(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    const user = await User.findByUserId(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const settings = user.settings ? JSON.parse(user.settings) : DEFAULT_SETTINGS;
    const categorySettings = settings[category] || DEFAULT_SETTINGS[category];

    res.json({
      success: true,
      data: categorySettings
    });

  } catch (error) {
    console.error(`[SETTINGS] Error fetching ${category} settings:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch ${category} settings`
    });
  }
}

async function updateCategorySettings(req, res, category) {
  try {
    const userId = req.user.user_id;
    const categorySettings = req.body;

    if (!isValidUUID(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    const user = await User.findByUserId(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const existingSettings = user.settings ? JSON.parse(user.settings) : DEFAULT_SETTINGS;
    const updatedSettings = {
      ...existingSettings,
      [category]: {
        ...existingSettings[category],
        ...categorySettings
      }
    };

    const updated = await User.updateUserSettings(userId, JSON.stringify(updatedSettings));
    if (!updated) {
      return res.status(500).json({
        success: false,
        error: `Failed to update ${category} settings`
      });
    }

    res.json({
      success: true,
      message: `${category} settings updated successfully`,
      data: updatedSettings[category]
    });

  } catch (error) {
    console.error(`[SETTINGS] Error updating ${category} settings:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to update ${category} settings`
    });
  }
}

module.exports = {
  getUserSettings,
  updateUserSettings,
  updateSettingCategory,
  getWidgetSettings,
  updateWidgetSettings,
  resetWidgetSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getPrivacySettings,
  updatePrivacySettings,
  getAppearanceSettings,
  updateAppearanceSettings
};

console.log('🔥🔥🔥 SETTINGS CONTROLLER MODULE.EXPORTS EXECUTED 🔥🔥🔥');