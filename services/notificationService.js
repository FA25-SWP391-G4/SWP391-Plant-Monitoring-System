/**
 * ============================================================================
 * NOTIFICATION SERVICE - WEBSOCKET REAL-TIME NOTIFICATIONS
 * ============================================================================
 * 
 * This service handles WebSocket functionality for real-time notifications:
 * - UC9: Receive Real-Time Notifications
 * 
 * USAGE:
 * This service is designed to be initialized with the HTTP server
 * and provides WebSocket-based real-time notifications to clients.
 * 
 * Example:
 * ```
 * const server = http.createServer(app);
 * const notificationService = require('./services/notificationService');
 * notificationService.init(server);
 * ```
 */

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');
const notificationController = require('../controllers/notificationController');

let io;
const userSockets = new Map(); // Maps userId to socket id

/**
 * Initialize the WebSocket server
 * @param {object} server - HTTP server instance
 */
function init(server) {
    try {
        io = socketIO(server, {
            cors: {
                origin: process.env.CORS_ORIGIN || "*",
                methods: ["GET", "POST"],
                allowedHeaders: ["Authorization"],
                credentials: true
            }
        });

        // Middleware for authentication
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || 
                              socket.handshake.headers.authorization?.split(' ')[1];
                
                if (!token) {
                    return next(new Error('Authentication token required'));
                }
                
                // Verify JWT token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Get user from database
                const user = await User.findById(decoded.user_id);
                
                if (!user) {
                    return next(new Error('User not found'));
                }
                
                // Store user in socket data
                socket.user = {
                    user_id: user.user_id,
                    email: user.email,
                    role: user.role
                };
                
                next();
            } catch (error) {
                console.error('Socket authentication error:', error);
                return next(new Error('Authentication failed'));
            }
        });

        // Handle connections
        io.on('connection', handleConnection);
        
        console.log('WebSocket notification service initialized');
        
        // Log the initialization
        SystemLog.create({
            log_level: 'INFO',
            source: 'NotificationService',
            message: 'WebSocket notification service initialized'
        }).catch(err => console.error('Failed to log initialization:', err));
        
        return io;
    } catch (error) {
        console.error('Failed to initialize WebSocket service:', error);
        
        // Log the error
        SystemLog.create({
            log_level: 'ERROR',
            source: 'NotificationService',
            message: `WebSocket initialization failed: ${error.message}`
        }).catch(err => console.error('Failed to log error:', err));
        
        throw error;
    }
}

/**
 * Handle new socket connection
 * @param {object} socket - Socket.IO socket
 */
function handleConnection(socket) {
    const userId = socket.user.user_id;
    
    console.log(`User ${userId} connected via WebSocket`);
    
    // Store socket for this user
    userSockets.set(userId, socket.id);
    
    // Join user-specific room
    socket.join(`user:${userId}`);
    
    // Handle events
    socket.on('mark-read', (data) => handleMarkRead(socket, data));
    socket.on('subscribe-device', (deviceId) => handleDeviceSubscription(socket, deviceId));
    socket.on('unsubscribe-device', (deviceId) => handleDeviceUnsubscription(socket, deviceId));
    socket.on('disconnect', () => handleDisconnect(socket));
    
    // Get unread notifications for the user
    sendUnreadNotifications(socket);
}

/**
 * Handle device subscription for real-time sensor data
 * @param {object} socket - Socket.IO socket
 * @param {string} deviceId - Device ID to subscribe to
 */
function handleDeviceSubscription(socket, deviceId) {
    if (!deviceId) return;
    
    console.log(`User ${socket.user.user_id} subscribed to device: ${deviceId}`);
    socket.join(`device:${deviceId}`);
}

/**
 * Handle device unsubscription
 * @param {object} socket - Socket.IO socket  
 * @param {string} deviceId - Device ID to unsubscribe from
 */
function handleDeviceUnsubscription(socket, deviceId) {
    if (!deviceId) return;
    
    console.log(`User ${socket.user.user_id} unsubscribed from device: ${deviceId}`);
    socket.leave(`device:${deviceId}`);
}

/**
 * Handle user disconnection
 * @param {object} socket - Socket.IO socket
 */
function handleDisconnect(socket) {
    const userId = socket.user?.user_id;
    
    if (userId) {
        console.log(`User ${userId} disconnected`);
        userSockets.delete(userId);
    }
}

/**
 * Handle marking a notification as read
 * @param {object} socket - Socket.IO socket
 * @param {object} data - Notification data
 */
async function handleMarkRead(socket, data) {
    try {
        const { notificationId } = data;
        const userId = socket.user.user_id;
        
        // Create mock request and response objects for the controller
        const req = {
            user: { user_id: userId },
            params: { notificationId }
        };
        
        const res = {
            status: () => ({ json: () => {} })
        };
        
        // Use the controller function to mark as read
        await notificationController.markNotificationAsRead(req, res);
        
        // Emit updated unread count
        const unreadCount = await getUnreadCount(userId);
        socket.emit('unread-count', { count: unreadCount });
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('error', { message: 'Failed to mark notification as read' });
    }
}

/**
 * Send unread notifications to the user
 * @param {object} socket - Socket.IO socket
 */
async function sendUnreadNotifications(socket) {
    try {
        const userId = socket.user.user_id;
        
        // Create mock request and response objects for the controller
        const req = {
            user: { user_id: userId }
        };
        
        let notifications = [];
        let unreadCount = 0;
        
        // Get unread notifications using the controller's method directly
        const notifRes = {
            status: () => ({
                json: (data) => {
                    if (data.success && data.data) {
                        notifications = data.data;
                        unreadCount = notifications.length;
                    }
                }
            })
        };
        
        await notificationController.getUnreadNotifications(req, notifRes);
        
        // Send unread notifications and count to the client
        socket.emit('unread-notifications', { notifications });
        socket.emit('unread-count', { count: unreadCount });
        
    } catch (error) {
        console.error('Error sending unread notifications:', error);
    }
}

/**
 * Get unread notification count for a user
 * @param {number} userId - User ID
 * @returns {number} Unread count
 */
async function getUnreadCount(userId) {
    try {
        return await require('../models/Alert').getUnreadCountByUserId(userId);
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}

/**
 * Send a notification to a specific user
 * @param {number} userId - User ID
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {string} title - Notification title
 * @param {object} details - Additional details
 */
async function sendToUser(userId, type, message, title, details = {}) {
    try {
        // Ensure details is a string for DB
        const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
        // Create notification in database
        const notification = await notificationController.createNotification(
            userId, type, message, title, detailsStr
        );
        // Send via WebSocket if user is connected
        if (io) {
            io.to(`user:${userId}`).emit('notification', {
                notification: {
                    ...notification,
                    details: typeof notification.details === 'string' 
                        ? JSON.parse(notification.details)
                        : notification.details
                }
            });
            // Update unread count
            const unreadCount = await getUnreadCount(userId);
            io.to(`user:${userId}`).emit('unread-count', { count: unreadCount });
        }
        return notification;
    } catch (error) {
        console.error('Error sending notification to user:', error);
        throw error;
    }
}

/**
 * Send a notification to all users with a specific role
 * @param {string} role - User role (Regular, Premium, Admin)
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {string} title - Notification title
 * @param {object} details - Additional details
 */
async function sendToRole(role, type, message, title, details = {}) {
    try {
        // Get all users with the specified role
        const users = await User.findByRole(role);
        
        // Create notifications for each user
        const notifications = [];
        
        for (const user of users) {
            try {
                const notification = await sendToUser(
                    user.user_id, type, message, title, details
                );
                
                notifications.push(notification);
            } catch (error) {
                console.error(`Failed to send notification to user ${user.user_id}:`, error);
            }
        }
        
        return notifications;
    } catch (error) {
        console.error(`Error sending notification to role ${role}:`, error);
        throw error;
    }
}

/**
 * Send a notification to all connected users
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {string} title - Notification title
 * @param {object} details - Additional details
 */
async function broadcast(type, message, title, details = {}) {
    try {
        // Get all users
        const users = await User.findAll();
        
        // Create notifications for each user
        const notifications = [];
        
        for (const user of users) {
            try {
                const notification = await sendToUser(
                    user.user_id, type, message, title, details
                );
                
                notifications.push(notification);
            } catch (error) {
                console.error(`Failed to send notification to user ${user.user_id}:`, error);
            }
        }
        
        return notifications;
    } catch (error) {
        console.error('Error broadcasting notification:', error);
        throw error;
    }
}

/**
 * Send sensor update to all subscribers of a device
 * @param {string} deviceId - Device ID
 * @param {object} sensorData - Sensor data to broadcast
 */
function broadcastSensorUpdate(deviceId, sensorData) {
    if (!io) {
        console.warn('Socket.IO not initialized, cannot broadcast sensor update');
        return;
    }
    
    try {
        console.log(`📡 Broadcasting sensor update for device: ${deviceId}`);
        io.to(`device:${deviceId}`).emit('sensor-update', {
            deviceId,
            timestamp: sensorData.timestamp,
            soil_moisture: sensorData.soil_moisture,
            temperature: sensorData.temperature,
            air_humidity: sensorData.air_humidity,
            light_intensity: sensorData.light_intensity,
            raw: sensorData.raw
        });
    } catch (error) {
        console.error('Error broadcasting sensor update:', error);
    }
}

module.exports = {
    init,
    sendToUser,
    sendToRole,
    broadcast,
    broadcastSensorUpdate,
    getUnreadCount
};