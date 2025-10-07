/**
 * Language Controller
 * Handles API requests related to language settings and preferences
 */

const { User } = require('../models');

/**
 * Get language preferences for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLanguagePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    // Default to English if no preference is set
    const language = user.languagePreference || 'en';
    
    return res.status(200).json({ language });
  } catch (error) {
    console.error('Error getting language preferences:', error);
    return res.status(500).json({ message: 'Error retrieving language preferences' });
  }
};

/**
 * Update language preferences for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateLanguagePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { language } = req.body;
    
    // Validate language code
    if (!language || !['en', 'vi'].includes(language)) {
      return res.status(400).json({ message: 'Invalid language code. Supported: en, vi' });
    }
    
    // Update user preferences
    const user = await User.findByPk(userId);
    user.languagePreference = language;
    await user.save();
    
    return res.status(200).json({ 
      message: 'Language preference updated successfully', 
      language 
    });
  } catch (error) {
    console.error('Error updating language preferences:', error);
    return res.status(500).json({ message: 'Error updating language preferences' });
  }
};

/**
 * Get available languages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAvailableLanguages = async (req, res) => {
  try {
    // List of available languages in the system
    const languages = [
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
    ];
    
    return res.status(200).json({ languages });
  } catch (error) {
    console.error('Error getting available languages:', error);
    return res.status(500).json({ message: 'Error retrieving available languages' });
  }
};

module.exports = {
  getLanguagePreferences,
  updateLanguagePreferences,
  getAvailableLanguages
};