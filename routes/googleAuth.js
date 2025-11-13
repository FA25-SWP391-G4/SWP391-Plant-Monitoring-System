/**
 * Google OAuth 2.0 Authentication Routes
 */
const express = require('express');
const router = express.Router();
const googleAuthController = require('../controllers/googleAuthController');
const authMiddleware = require('../middlewares/authMiddleware');

// Start the Google OAuth flow
router.get('/login', googleAuthController.initiateGoogleAuth);

// Handle the OAuth callback from Google
router.get('/callback', googleAuthController.googleAuthCallback);

// Revoke Google access (requires authentication)
router.post('/revoke', authMiddleware.verifyToken, googleAuthController.revokeGoogleAccess);

module.exports = router;