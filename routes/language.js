/**
 * Language Settings Routes
 * Routes for managing language preferences and internationalization
 */

const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
const { authenticate } = require('../middlewares/authMiddleware');

/**
 * @route GET /api/language/preferences
 * @desc Get user language preferences
 * @access Private
 */
router.get('/preferences', authenticate, languageController.getLanguagePreferences);

/**
 * @route PUT /api/language/preferences
 * @desc Update user language preferences
 * @access Private
 */
router.put('/preferences', authenticate, languageController.updateLanguagePreferences);

/**
 * @route GET /api/language/available
 * @desc Get available languages
 * @access Public
 */
router.get('/available', languageController.getAvailableLanguages);

module.exports = router;