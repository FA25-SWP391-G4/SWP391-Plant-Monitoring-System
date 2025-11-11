/**
 * ============================================================================
 * NOTIFICATION CONTROLLER - ALERTS & NOTIFICATIONS
 * ============================================================================
 * 
 * This controller handles notification functionality:
 * - UC9: Receive Real-Time Notifications - Push notifications and alerts
 * 
 * IMPLEMENTATION NOTES:
 * - Integrates with Firebase Cloud Messaging for push notifications
 * - Email notifications for critical alerts
 * - WebSocket for real-time in-app notifications
 * - Notification preferences management
 * 
 * UPDATED FOR UUID MIGRATION:
 * - user_id is now UUID format
 * - Validates UUID parameters before database queries
 */

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { pool } = require('../config/db');
const Alert = require('../models/Alert');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');
const { isValidUUID } = require('../utils/uuidGenerator');

// Initialize Firebase Admin for FCM if not already initialized
let firebaseInitialized = false;
try {
    if (!admin.apps.length) {
        // Use service account if available, otherwise use application default credentials
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            admin.initializeApp();
        }
        firebaseInitialized = true;
    } else {
        firebaseInitialized = true;
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Initialize email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

/**
 * UC9: GET USER NOTIFICATIONS
 * ===============================
 * Gets all notifications for the authenticated user
 * 
 * @route GET /api/notifications
 * @access Private - Requires authentication
 * @returns {Object} User notifications
 * 
 * UPDATED FOR UUID MIGRATION:
 * - user_id from JWT is now UUID
 * - Alert queries use UUID user_id
 */
async function getUserNotifications(req, res) {
    try {
        // Get user_id from authenticated request (now UUID)
        const userId = req.user.user_id;

        // Validate UUID (should already be validated by auth middleware)
        if (!isValidUUID(userId)) {
            console.error('[NOTIFICATIONS] Invalid user_id UUID:', userId);
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }

        // Get notifications (Alert model already validates UUID)
        const notifications = await Alert.findByUserId(userId);

        res.status(200).json({
            success: true,
            data: notifications
        });

    } catch (error) {
        console.error('Get user notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve notifications'
        });
    }
}

/**
 * UC9: GET UNREAD NOTIFICATIONS
 * ===============================
 * Gets only unread notifications for the authenticated user
 * 
 * @route GET /api/notifications/unread
 * @access Private - Requires authentication
 * @returns {Object} Unread notifications
 * 
 * UPDATED FOR UUID MIGRATION:
 * - user_id from JWT is now UUID
 */
async function getUnreadNotifications(req, res) {
    try {
        // Get user_id from authenticated request (now UUID)
        const userId = req.user.user_id;

        // Validate UUID
        if (!isValidUUID(userId)) {
            console.error('[UNREAD NOTIFICATIONS] Invalid user_id UUID:', userId);
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }

        // Get unread notifications (Alert model already validates UUID)
        const notifications = await Alert.findUnreadByUserId(userId);

        res.status(200).json({
            success: true,
            data: notifications
        });

    } catch (error) {
        console.error('Get unread notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve unread notifications'
        });
    }
}

/**
 * UC9: MARK NOTIFICATION AS READ
 * ===============================
 * Marks a specific notification as read
 * 
 * @route PUT /api/notifications/:notificationId/read
 * @access Private - Requires authentication
 * @param {number} notificationId - ID of the notification to mark as read
 * @returns {Object} Updated notification
 * 
 * UPDATED FOR UUID MIGRATION:
 * - user_id comparison uses UUID format
 */
async function markNotificationAsRead(req, res) {
    try {
        // Get notification ID from route params
        const { notificationId } = req.params;

        // Find the notification
        const notification = await Alert.findById(notificationId);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        // Check if notification belongs to user (UUID comparison)
        if (notification.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to update this notification'
            });
        }

        // Mark as read
        notification.is_read = true;
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });

    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update notification'
        });
    }
}

/**
 * UC9: MARK ALL NOTIFICATIONS AS READ
 * ===============================
 * Marks all notifications for the user as read
 * 
 * @route PUT /api/notifications/read-all
 * @access Private - Requires authentication
 * @returns {Object} Success message
 */
async function markAllNotificationsAsRead(req, res) {
    try {
        // Get user_id from authenticated request
        const userId = req.user.user_id;

        // Mark all as read
        await Alert.markAllAsReadForUser(userId);

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update notifications'
        });
    }
}

/**
 * UC9: DELETE NOTIFICATION
 * ===============================
 * Deletes a specific notification
 * 
 * @route DELETE /api/notifications/:notificationId
 * @access Private - Requires authentication
 * @param {number} notificationId - ID of the notification to delete
 * @returns {Object} Success message
 */
async function deleteNotification(req, res) {
    try {
        // Get notification ID from route params
        const { notificationId } = req.params;

        // Find the notification
        const notification = await Alert.findById(notificationId);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        // Check if notification belongs to user
        if (notification.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to delete this notification'
            });
        }

        // Delete notification
        await notification.delete();

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete notification'
        });
    }
}

/**
 * UC9: UPDATE NOTIFICATION PREFERENCES
 * ===============================
 * Updates the user's notification preferences
 * 
 * @route PUT /api/notifications/preferences
 * @access Private - Requires authentication
 * @param {Object} preferences - Notification preferences
 * @returns {Object} Updated preferences
 */
async function updateNotificationPreferences(req, res) {
    try {
        // Get user_id from authenticated request
        const userId = req.user.user_id;
        const { preferences } = req.body;

        // Validate preferences
        if (!preferences || typeof preferences !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid preferences format'
            });
        }

        // Find the user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Update notification preferences
        user.notification_prefs = {
            ...user.notification_prefs || {},
            ...preferences
        };
        
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Notification preferences updated successfully',
            data: user.notification_prefs
        });

    } catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update notification preferences'
        });
    }
}

/**
 * UC9: GET NOTIFICATION PREFERENCES
 * ===============================
 * Gets the user's notification preferences
 * 
 * @route GET /api/notifications/preferences
 * @access Private - Requires authentication
 * @returns {Object} Notification preferences
 */
async function getNotificationPreferences(req, res) {
    try {
        // Get user_id from authenticated request
        const userId = req.user.user_id;

        // Find the user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Return notification preferences
        const preferences = user.notification_prefs || {
            email: true,
            push: true,
            lowMoisture: true,
            highTemperature: true,
            deviceOffline: true,
            pumpActivation: true
        };

        res.status(200).json({
            success: true,
            data: preferences
        });

    } catch (error) {
        console.error('Get notification preferences error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve notification preferences'
        });
    }
}

/**
 * SEND PUSH NOTIFICATION
 * ===============================
 * Internal function to send a push notification to a user's devices
 * 
 * @param {number} userId - ID of the user to send notification to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send
 * @returns {boolean} Success status
 */
async function sendPushNotification(userId, title, body, data = {}) {
    if (!firebaseInitialized) {
        console.error('Firebase not initialized. Cannot send push notification.');
        return false;
    }

    try {
        // Find user to get FCM tokens
        const user = await User.findById(userId);
        
        if (!user || !user.fcm_tokens || user.fcm_tokens.length === 0) {
            console.warn(`No FCM tokens found for user ${userId}`);
            return false;
        }

        // Check notification preferences
        const notifPrefs = user.notification_prefs || {};
        if (notifPrefs.push === false) {
            console.log(`Push notifications disabled for user ${userId}`);
            return false;
        }

        // Prepare message
        const message = {
            notification: {
                title,
                body
            },
            data: {
                ...data,
                timestamp: new Date().toISOString()
            },
            tokens: user.fcm_tokens
        };

        // Send message
        const response = await admin.messaging().sendMulticast(message);
        
        // Log the result
        await SystemLog.create({
            log_level: 'INFO',
            source: 'NotificationController',
            message: `Push notification sent to user ${userId}. Success: ${response.successCount}/${user.fcm_tokens.length}`
        });

        return response.successCount > 0;

    } catch (error) {
        console.error('Send push notification error:', error);
        
        // Log the error
        await SystemLog.create({
            log_level: 'ERROR',
            source: 'NotificationController',
            message: `Failed to send push notification to user ${userId}: ${error.message}`
        });
        
        return false;
    }
}

/**
 * SEND EMAIL NOTIFICATION
 * ===============================
 * Internal function to send an email notification to a user
 * 
 * @param {number} userId - ID of the user to send notification to
 * @param {string} subject - Email subject
 * @param {string} htmlContent - Email HTML content
 * @returns {boolean} Success status
 */
async function sendEmailNotification(userId, subject, htmlContent) {
    try {
        // Find user to get email
        const user = await User.findById(userId);
        
        if (!user || !user.email) {
            console.warn(`No email found for user ${userId}`);
            return false;
        }

        // Check notification preferences
        const notifPrefs = user.notification_prefs || {};
        if (notifPrefs.email === false) {
            console.log(`Email notifications disabled for user ${userId}`);
            return false;
        }

        // Send email
        const mailOptions = {
            from: process.env.SMTP_FROM || '"Plant Monitoring System" <no-reply@plant-system.com>',
            to: user.email,
            subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        
        // Log the result
        await SystemLog.create({
            log_level: 'INFO',
            source: 'NotificationController',
            message: `Email notification sent to user ${userId} at ${user.email}`
        });

        return true;

    } catch (error) {
        console.error('Send email notification error:', error);
        
        // Log the error
        await SystemLog.create({
            log_level: 'ERROR',
            source: 'NotificationController',
            message: `Failed to send email notification to user ${userId}: ${error.message}`
        });
        
        return false;
    }
}

/**
 * CREATE NOTIFICATION
 * ===============================
 * Internal function to create a notification for a user
 * This would typically be called by other parts of the system,
 * such as the sensor monitoring service or IoT controller
 * 
 * @param {number} userId - ID of the user to notify
 * @param {string} type - Type of notification
 * @param {string} message - Notification message
 * @param {string} title - Notification title
 * @param {Object} details - Additional details
 * @returns {Object} Created notification
 */
async function createNotification(userId, type, message, title, details = {}) {
    try {
        // Create notification in database
        const notification = await Alert.create({
            user_id: userId,
            type,
            message,
            title,
            details: JSON.stringify(details),
            is_read: false
        });

        // Check if we should send push notification
        const user = await User.findById(userId);
        if (user && (!user.notification_prefs || user.notification_prefs[type] !== false)) {
            // Send push notification
            await sendPushNotification(userId, title, message, {
                type,
                notification_id: notification.alert_id.toString(),
                ...details
            });
            
            // Send email for critical notifications
            if (type === 'critical' || type === 'deviceOffline') {
                const htmlContent = `
                    <h2>${title}</h2>
                    <p>${message}</p>
                    <p>Please check your plant monitoring system for details.</p>
                    <p>This is an automated message, please do not reply.</p>
                `;
                
                await sendEmailNotification(userId, title, htmlContent);
            }
        }

        return notification;

    } catch (error) {
        console.error('Create notification error:', error);
        
        // Log the error
        await SystemLog.create({
            log_level: 'ERROR',
            source: 'NotificationController',
            message: `Failed to create notification for user ${userId}: ${error.message}`
        });
        
        throw error;
    }
}

/**
 * UC9: GET NOTIFICATION STATISTICS
 * ===============================
 * Gets notification statistics for the authenticated user
 * 
 * @route GET /api/notifications/stats
 * @access Private - Requires authentication
 * @returns {Object} Notification statistics
 */
async function getNotificationStats(req, res) {
    try {
        const userId = req.user.user_id;

        if (!isValidUUID(userId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }

        // Use the database function to get comprehensive stats
        const query = 'SELECT get_notification_stats($1) as stats';
        const result = await pool.query(query, [userId]);
        
        const stats = result.rows[0]?.stats || {
            total: 0,
            unread: 0,
            critical: 0,
            high_priority: 0,
            recent: 0,
            by_type: {}
        };

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve notification statistics'
        });
    }
}

/**
 * UC9: GET NOTIFICATIONS BY TYPE
 * ===============================
 * Gets notifications filtered by type
 * 
 * @route GET /api/notifications/by-type/:type
 * @access Private - Requires authentication
 * @returns {Object} Filtered notifications
 */
async function getNotificationsByType(req, res) {
    try {
        const userId = req.user.user_id;
        const { type } = req.params;
        const { limit = 50, status } = req.query;

        if (!isValidUUID(userId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }

        let query = `
            SELECT * FROM user_notifications 
            WHERE user_id = $1 AND type = $2
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        `;
        const params = [userId, type];

        if (status) {
            query += ` AND status = $${params.length + 1}`;
            params.push(status);
        }

        query += ` ORDER BY priority ASC, created_at DESC LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));

        const result = await pool.query(query, params);

        res.status(200).json({
            success: true,
            data: result.rows,
            filter: { type, status },
            count: result.rows.length
        });

    } catch (error) {
        console.error('Get notifications by type error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve notifications by type'
        });
    }
}

/**
 * UC9: DELETE EXPIRED NOTIFICATIONS
 * ===============================
 * Deletes expired notifications for the authenticated user
 * 
 * @route DELETE /api/notifications/expired
 * @access Private - Requires authentication
 * @returns {Object} Deletion result
 */
async function deleteExpiredNotifications(req, res) {
    try {
        const userId = req.user.user_id;

        if (!isValidUUID(userId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }

        const query = `
            DELETE FROM Alerts 
            WHERE user_id = $1 
            AND expires_at IS NOT NULL 
            AND expires_at < CURRENT_TIMESTAMP 
            AND is_persistent = FALSE
        `;
        
        const result = await pool.query(query, [userId]);

        await SystemLog.info('notifications', 'delete_expired', 
            `User ${userId} deleted ${result.rowCount} expired notifications`);

        res.status(200).json({
            success: true,
            message: `Deleted ${result.rowCount} expired notifications`,
            deleted_count: result.rowCount
        });

    } catch (error) {
        console.error('Delete expired notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete expired notifications'
        });
    }
}

/**
 * UC9: CREATE TEST NOTIFICATION
 * ===============================
 * Creates a test notification (development only)
 * 
 * @route POST /api/notifications/test
 * @access Private - Requires authentication (development only)
 * @returns {Object} Created notification
 */
async function createTestNotification(req, res) {
    try {
        if (process.env.NODE_ENV !== 'development') {
            return res.status(403).json({
                success: false,
                error: 'Test notifications are only available in development mode'
            });
        }

        const userId = req.user.user_id;
        const { 
            title = 'Test Notification',
            message = 'This is a test notification created via API',
            type = 'info',
            priority = 3
        } = req.body;

        if (!isValidUUID(userId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }

        const notificationId = await createNotification(
            userId,
            title,
            message,
            type,
            priority,
            { test: true, created_via_api: true },
            null, // no expiration
            null, // no action URL
            null, // no action label
            'api_test'
        );

        res.status(201).json({
            success: true,
            message: 'Test notification created successfully',
            data: { notification_id: notificationId }
        });

    } catch (error) {
        console.error('Create test notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create test notification'
        });
    }
}

/**
 * ENHANCED CREATE NOTIFICATION FUNCTION
 * ===============================
 * Updated to support enhanced notification features
 */
async function createNotification(userId, title, message, type = 'general', priority = 3, details = {}, expiresAt = null, actionUrl = null, actionLabel = null, source = 'system') {
    try {
        if (!isValidUUID(userId)) {
            throw new Error('Invalid user ID format');
        }

        const query = `
            SELECT create_notification($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) as notification_id
        `;
        
        const params = [
            userId, title, message, type, priority,
            JSON.stringify(details), expiresAt, actionUrl, actionLabel, source, false
        ];

        const result = await pool.query(query, params);
        const notificationId = result.rows[0]?.notification_id;

        // Log the notification creation
        await SystemLog.info('notifications', 'create', 
            `Created notification for user ${userId}: ${title}`);

        return notificationId;
    } catch (error) {
        await SystemLog.error('notifications', 'create', 
            `Failed to create notification: ${error.message}`);
        throw error;
    }
}

module.exports = {
    // API routes
    getUserNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    updateNotificationPreferences,
    getNotificationPreferences,
    
    // Enhanced API routes
    getNotificationStats,
    getNotificationsByType,
    deleteExpiredNotifications,
    createTestNotification,
    
    // Internal functions to be used by other controllers/services
    createNotification,
    sendPushNotification,
    sendEmailNotification
};