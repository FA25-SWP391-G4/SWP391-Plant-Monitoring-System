/**
 * Mock notification controller for testing
 */

// Mock notification records
const notifications = [
    {
        id: 'notif1',
        userId: 'user123',
        type: 'ALERT',
        message: 'Plant needs water!',
        read: false,
        createdAt: '2022-01-01T12:00:00Z'
    },
    {
        id: 'notif2',
        userId: 'user123',
        type: 'INFO',
        message: 'Weekly plant summary available',
        read: true,
        readAt: '2022-01-02T10:15:00Z',
        createdAt: '2022-01-01T15:00:00Z'
    },
    {
        id: 'notif3',
        userId: 'user123',
        type: 'SYSTEM',
        message: 'System maintenance scheduled',
        read: false,
        createdAt: '2022-01-03T08:00:00Z'
    }
];

// Get all notifications for a user
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        // Filter notifications by userId
        const userNotifications = notifications.filter(n => n.userId === userId);
        res.status(200).json(userNotifications);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching notifications'
        });
    }
};

// Get unread notifications for a user
const getUnreadNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        // Filter unread notifications by userId
        const unreadNotifications = notifications.filter(n => n.userId === userId && !n.read);
        res.status(200).json(unreadNotifications);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching unread notifications'
        });
    }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;
        
        // Find the notification
        const notification = notifications.find(n => n.id === notificationId && n.userId === userId);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        // Mark as read
        notification.read = true;
        notification.readAt = new Date().toISOString();
        
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error marking notification as read'
        });
    }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error marking all notifications as read'
        });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;
        
        // Find the notification index
        const notificationIndex = notifications.findIndex(n => n.id === notificationId && n.userId === userId);
        
        if (notificationIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        // Remove the notification (in a real implementation this would update the database)
        const deletedNotification = notifications[notificationIndex];
        
        res.status(200).json({
            message: 'Notification deleted successfully',
            id: deletedNotification.id
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error deleting notification'
        });
    }
};

// Update notification preferences
const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { emailNotifications, pushNotifications, alertThreshold } = req.body;
        
        // In a real implementation, this would update the user's preferences in the database
        const preferences = {
            userId,
            emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
            pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
            alertThreshold: alertThreshold !== undefined ? alertThreshold : 30
        };
        
        res.status(200).json(preferences);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error updating notification preferences'
        });
    }
};

// Get notification preferences
const getNotificationPreferences = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                email: true,
                push: true,
                sms: false,
                wateringAlerts: true,
                healthAlerts: true,
                systemAlerts: false
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching notification preferences'
        });
    }
};

module.exports = {
    getUserNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    updateNotificationPreferences,
    getNotificationPreferences
};