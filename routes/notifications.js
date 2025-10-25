/**
 * ============================================================================
 * NOTIFICATION ROUTES
 * ============================================================================
 * 
 * Routes for notification functionality:
 * - UC9: Receive Real-Time Notifications
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../__mocks__/notificationController');
const authenticate = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the authenticated user
 * @access  Private
 */
router.get('/', authenticate, notificationController.getUserNotifications);

/**
 * @route   GET /api/notifications/unread
 * @desc    Get unread notifications for the authenticated user
 * @access  Private
 */
router.get('/unread', authenticate, notificationController.getUnreadNotifications);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:notificationId/read', authenticate, notificationController.markNotificationAsRead);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', authenticate, notificationController.markAllNotificationsAsRead);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:notificationId', authenticate, notificationController.deleteNotification);

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get notification preferences
 * @access  Private
 */
router.get('/preferences', authenticate, notificationController.getNotificationPreferences);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update notification preferences
 * @access  Private
 */
router.put('/preferences', authenticate, notificationController.updateNotificationPreferences);

module.exports = router;