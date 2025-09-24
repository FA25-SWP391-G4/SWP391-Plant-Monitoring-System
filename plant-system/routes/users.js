/**
 * ============================================================================
 * USER ROUTES - PROFILE MANAGEMENT & PREMIUM UPGRADE
 * ============================================================================
 * 
 * Routes for:
 * - UC13: Manage Profile - View/edit user info, avatar upload
 * - UC19: Upgrade to Premium - Role upgrade after payment verification
 * 
 * All routes require authentication middleware
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware'); // Authentication middleware

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * UC13: PROFILE MANAGEMENT ROUTES
 */
// Get user profile
router.get('/profile', userController.getUserProfile);

// Update user profile
router.put('/profile', userController.updateUserProfile);

// Change password (moved to userController from authController for better organization)
router.put('/change-password', userController.changePassword);

/**
 * UC19: PREMIUM UPGRADE ROUTES
 */
// Upgrade user to premium
router.post('/upgrade-to-premium', userController.upgradeToPremium);

// Get premium status
router.get('/premium-status', userController.getPremiumStatus);

module.exports = router;
