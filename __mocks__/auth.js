/**
 * Authentication Routes Mock
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Logout user
router.post('/logout', authController.logout);

// Forgot password - request reset
router.post('/forgot-password', authController.forgotPassword);

// Reset password with token
router.post('/reset-password', authController.resetPassword);

// Change password (requires authentication)
router.post('/change-password', require('../middlewares/authMiddleware'), authController.changePassword);

// Google OAuth login
router.post('/google', authController.googleLogin);

module.exports = router;