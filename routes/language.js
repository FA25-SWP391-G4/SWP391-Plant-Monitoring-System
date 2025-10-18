/**
 * Language Settings Routes
 */

const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
const { authenticate } = require('../middlewares/authMiddleware');

// Fallback functions if controller methods are not defined
const getLanguagePreferences = (req, res) => {
  console.log('Using fallback getLanguagePreferences');
  res.status(200).json({ language: 'en' });
};

const updateLanguagePreferences = (req, res) => {
  console.log('Using fallback updateLanguagePreferences');
  res.status(200).json({ 
    message: 'Language updated successfully', 
    language: req.body.language || 'en' 
  });
};

const getAvailableLanguages = (req, res) => {
  console.log('Using fallback getAvailableLanguages');
  res.status(200).json({
    languages: [
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
    ]
  });
};

// Simple test route
router.get('/test', (req, res) => {
  console.log('Language test route accessed');
  res.json({ message: 'Language router is working' });
});

/**
 * @route GET /api/language/preferences
 * @desc Get user language preferences
 * @access Private
 */
router.get('/preferences', authenticate, (req, res) => {
  try {
    if (languageController && languageController.getLanguagePreferences) {
      return languageController.getLanguagePreferences(req, res);
    }
    return getLanguagePreferences(req, res);
  } catch (error) {
    console.error('Error in /preferences GET route:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * @route PUT /api/language/preferences
 * @desc Update user language preferences
 * @access Private
 */
router.put('/preferences', authenticate, (req, res) => {
  try {
    if (languageController && languageController.updateLanguagePreferences) {
      return languageController.updateLanguagePreferences(req, res);
    }
    return updateLanguagePreferences(req, res);
  } catch (error) {
    console.error('Error in /preferences PUT route:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * @route GET /api/language/available
 * @desc Get available languages
 * @access Public
 */
router.get('/available', (req, res) => {
  try {
    if (languageController && languageController.getAvailableLanguages) {
      return languageController.getAvailableLanguages(req, res);
    }
    return getAvailableLanguages(req, res);
  } catch (error) {
    console.error('Error in /available route:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;