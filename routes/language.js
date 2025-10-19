/**
 * Language Settings Routes
 * Routes for managing language preferences and internationalization
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');

// Hàm xử lý mặc định
const getLanguagePreferences = (req, res) => {
  res.status(200).json({ language: 'en' });
};

const updateLanguagePreferences = (req, res) => {
  res.status(200).json({ 
    message: 'Language updated successfully', 
    language: req.body.language || 'en' 
  });
};

const getAvailableLanguages = (req, res) => {
  res.status(200).json({
    languages: [
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
    ]
  });
};

/**
 * @route GET /api/language/preferences
 * @desc Get user language preferences
 * @access Private
 */
router.get('/preferences', authenticate, (req, res) => {
  getLanguagePreferences(req, res);
});

/**
 * @route PUT /api/language/preferences
 * @desc Update user language preferences
 * @access Private
 */
router.put('/preferences', authenticate, (req, res) => {
  updateLanguagePreferences(req, res);
});

/**
 * @route GET /api/language/available
 * @desc Get available languages
 * @access Public
 */
router.get('/available', (req, res) => {
  getAvailableLanguages(req, res);
});

module.exports = router;