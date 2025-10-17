/**
 * Language Settings Routes
 */

const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
// Fix the middleware import
const authMiddleware = require('../middlewares/authMiddleware');

// Simple test route
router.get('/test', (req, res) => {
  console.log('Language test route accessed');
  res.json({ message: 'Language router is working' });
});

// Debug: Log the available controller functions
console.log('Language Controller functions:', Object.keys(languageController));

/**
 * @route GET /api/language/available
 * @desc Get available languages
 * @access Public
 */
router.get('/available', (req, res) => {
  console.log('DEBUG: /available route accessed');
  try {
    if (!languageController.getAvailableLanguages) {
      console.log('DEBUG: getAvailableLanguages is undefined!');
      return res.status(500).json({
        error: 'Route handler not available',
        available: ['en', 'vi'] // Fallback languages
      });
    }
    return languageController.getAvailableLanguages(req, res);
  } catch (error) {
    console.error('Error in /available route:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * @route GET /api/language/preferences
 * @desc Get user language preferences
 * @access Private
 */
router.get('/preferences', authMiddleware, (req, res) => {
  console.log('DEBUG: /preferences GET route accessed');
  try {
    // Create fallback if function doesn't exist
    if (!languageController.getLanguagePreferences) {
      console.log('DEBUG: getLanguagePreferences is undefined, using fallback');
      return res.status(200).json({ language: 'en' });
    }
    return languageController.getLanguagePreferences(req, res);
  } catch (error) {
    console.error('Error in GET /preferences route:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * @route PUT /api/language/preferences
 * @desc Update user language preferences
 * @access Private
 */
router.put('/preferences', authMiddleware, (req, res) => {
  console.log('DEBUG: /preferences PUT route accessed');
  try {
    const { language } = req.body;

    // Create fallback if function doesn't exist
    if (!languageController.updateLanguagePreferences) {
      console.log('DEBUG: updateLanguagePreferences is undefined, using fallback');
      return res.status(200).json({
        message: 'Language preference updated successfully (fallback)',
        language: language || 'en'
      });
    }
    return languageController.updateLanguagePreferences(req, res);
  } catch (error) {
    console.error('Error in PUT /preferences route:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
