/**
 * ============================================================================
 * USER CONTROLLER - PROFILE MANAGEMENT & PREMIUM UPGRADE
 * ============================================================================
 * 
 * This controller handles user profile management and premium upgrade features:
 * - UC13: Manage Profile - View/edit user info
 * - UC19: Upgrade to Premium - Role upgrade after payment verification
 * 
 * IMPLEMENTATION NOTES:
 * - All routes require authentication middleware
 * - Premium upgrade integrates with the payment system
 * - Profile updates include validation and sanitization
 */

const User = require('../models/User');
const Payment = require('../models/Payment');
const bcrypt = require('bcryptjs');
const { isValidUUID } = require('../utils/uuidGenerator');
const Subscription = require('../models/Subscription');
const e = require('express');
const { isUltimate } = require('../middlewares/accessMiddleware');
const { generateToken } = require('../utils/tokenUtils');

/**
 * UC13: GET USER PROFILE
 * ===============================
 * Retrieves the authenticated user's profile information
 * 
 * @route GET /users/profile
 * @access Private - Requires authentication
 * @returns {Object} User profile data (excluding sensitive information)
 * 
 * UPDATED FOR UUID MIGRATION:
 * - req.user.user_id is now UUID (not integer)
 * - Validates UUID format before database lookup
 */
async function getUserProfile(req, res) {
    try {
        // Get user_id from authenticated request (now UUID)
        const userId = req.user.user_id; 
        
        // Validate UUID format (redundant with auth middleware, but defensive)
        if (!isValidUUID(userId)) {
            console.error('[USER PROFILE] Invalid user_id UUID:', userId);
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user ID format' 
            });
        }
        
        console.log('[USER PROFILE] Fetching profile for user UUID:', userId);
        
        // Find the user by ID
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Return user data (toJSON method excludes password and sensitive data)
        res.status(200).json({
            success: true,
            data: user.toJSON()
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to retrieve user profile' 
        });
    }
}

/**
 * UC13: UPDATE USER PROFILE
 * ===============================
 * Updates the authenticated user's profile information
 * 
 * @route PUT /users/profile
 * @access Private - Requires authentication
 * @param {string} full_name - User's full name
 * @param {object} notification_prefs - User's notification preferences
 * @returns {Object} Updated user profile data
 * 
 * UPDATED FOR UUID MIGRATION:
 * - req.user.user_id is now UUID (not integer)
 * - Validates UUID format before database operations
 */
async function updateUserProfile(req, res) {
    try {
        // Get user_id from authenticated request (now UUID)
        const userId = req.user.user_id;
        
        // Validate UUID format
        if (!isValidUUID(userId)) {
            console.error('[UPDATE PROFILE] Invalid user_id UUID:', userId);
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user ID format' 
            });
        }
        
        console.log('[UPDATE PROFILE] Updating profile for user UUID:', userId);
        
        // Find the user by ID
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Extract updatable fields from request
        const { given_name, family_name, email, phone_number, full_name, notification_prefs } = req.body;
        
        // Update fields if provided
        const updatedFields = {};
        
        if (given_name) {
            updatedFields.given_name = given_name;
        }
        
        if (family_name) {
            updatedFields.family_name = family_name;
        }
        
        if (email) {
            updatedFields.email = email;
        }
        
        if (phone_number) {
            updatedFields.phone_number = phone_number;
        }
        
        // Keep backward compatibility with full_name
        if (full_name) {
            updatedFields.full_name = full_name;
        }
        
        if (notification_prefs) {
            updatedFields.notification_prefs = notification_prefs;
        }
        
        // Update the user profile
        const updatedUser = await user.update(updatedFields);


        try {
            if (updatedUser) {
                const responsePayload = {
                    success: true,
                    message: 'Profile updated successfully',
                    data: updatedUser.toJSON()
                };
                //Send new token in response header and reload page sign
                try {
                    const newToken = generateToken(updatedUser);
                    console.log('[USER CONTROLLER] Generated new token for updated user:', updatedUser.user_id);
                res.setHeader('Authorization', `Bearer ${newToken}`);
                    responsePayload.token = newToken;
                } catch (tokenError) {
                    console.error('[USER CONTROLLER] Error generating new token:', tokenError);
                }
                
                return res.status(200).json(responsePayload);
            }
        } catch (tokenError) {
            console.error('[USER CONTROLLER] Error handling profile update response:', tokenError);
        }

    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update user profile' 
        });
    }
}

/**
 * UC19: UPGRADE TO PREMIUM
 * ===============================
 * Upgrades user to Premium role after payment verification
 * 
 * @route POST /users/upgrade-to-premium
 * @access Private - Requires authentication
 * @param {string} paymentId - ID of the completed payment
 * @returns {Object} Updated user profile with premium status
 */
async function upgradeToPremium(req, res) {
    try {
        // Get user_id from authenticated request
        const userId = req.user.user_id;
        const { paymentId } = req.body;
        
        // Find the user by ID
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        // Verify payment ID
        if (!paymentId) {
            return res.status(400).json({
                success: false,
                error: 'Payment ID is required'
            });
        }
        
        // Check if payment exists and is completed
        const payment = await Payment.findById(paymentId);
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }
        
        if (payment.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Payment does not belong to this user'
            });
        }
        
        if (payment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                error: 'Payment has not been completed'
            });
        }
        
        // Check if user is already premium
        if (user.role === 'Premium' || user.role === 'Admin') {
            return res.status(400).json({
                success: false,
                error: 'User already has Premium or higher privileges'
            });
        }
        
        // Upgrade user to Premium
        const updatedUser = await user.update({ role: 'Premium' });
        
        // Return updated user data
        res.status(200).json({
            success: true,
            message: 'Successfully upgraded to Premium',
            data: updatedUser.toJSON()
        });

    } catch (error) {
        console.error('Upgrade to premium error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to upgrade to premium' 
        });
    }
}

/**
 * GET USER PREMIUM STATUS
 * ===============================
 * Checks if the user has premium status
 * 
 * @route GET /users/premium-status
 * @access Private - Requires authentication
 * @returns {Object} User's premium status
 */
async function getPremiumStatus(req, res) {
    try {
        // Get user_id from authenticated request
        const userId = req.user.user_id;
        
        // Find the user by ID
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Check if user is premium
        const isPremium = user.role === 'Premium' || user.role === 'Admin';
        
        // Return premium status
        res.status(200).json({
            success: true,
            data: {
                isPremium,
                role: user.role,
                premiumFeatures: isPremium ? [
                    'Advanced plant analytics',
                    'Multiple plant zones management',
                    'Custom dashboard widgets',
                    'Advanced sensor thresholds',
                    'Priority customer support'
                ] : []
            }
        });

    } catch (error) {
        console.error('Get premium status error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to check premium status' 
        });
    }
}

async function hasActivePremiumSubscription(req, res) {
    try {
        // Get user_id from authenticated request
        const userId = req.user.user_id;
        
        // Validate UUID format
        if (!isValidUUID(userId)) {
            console.error('[SUBSCRIPTION CHECK] Invalid user_id UUID:', userId);
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user ID format' 
            });
        }
        
        const subscription = await Subscription.getUserActiveSubscription(userId);
        
        if (subscription) {
            console.log('[SUBSCRIPTION CHECK] Active subscription found:', {
                id: subscription.id,
                planId: subscription.planId,
                type: subscription.subscriptionType,
                isActive: subscription.isActive
            });
            
            return res.status(200).json({
                success: true,
                data: {
                    id: subscription.id,
                    userId: subscription.userId,
                    planId: subscription.planId,
                    subscriptionType: subscription.subscriptionType,
                    subStart: subscription.subStart,
                    subEnd: subscription.subEnd,
                    isActive: subscription.isActive,
                    autoRenew: subscription.autoRenew,
                    planName: subscription.planName,
                    planDescription: subscription.planDescription,
                    planFeatures: subscription.planFeatures
                }
            });
        } else {
            console.log('[SUBSCRIPTION CHECK] No active subscription found for user:', userId);
            return res.status(404).json({ 
                success: false,
                error: 'No active subscription found'
            });
        }
    } catch (error) {
        console.error('Error checking active subscription:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to check subscription status' 
        });
    }   
}

module.exports = {
    getUserProfile,
    updateUserProfile,
    upgradeToPremium,
    getPremiumStatus,
    hasActivePremiumSubscription
};
