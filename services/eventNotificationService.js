/**
 * ============================================================================
 * EVENT NOTIFICATION SERVICE - AUTOMATIC NOTIFICATION GENERATION
 * ============================================================================
 * 
 * This service monitors system events and automatically creates notifications
 * for users based on specific patterns and criteria. It integrates with the
 * existing SystemLog and Alert systems to provide real-time event-driven
 * notifications.
 * 
 * SUPPORTED EVENT TYPES:
 * - Device Events: connection, status changes, errors
 * - Plant Events: health alerts, watering needs, thresholds
 * - System Events: errors, maintenance, user actions
 * - Payment Events: subscription changes, payment failures
 * - Security Events: authentication, access violations
 * 
 * NOTIFICATION PRIORITY LEVELS:
 * - critical: System failures, security issues (immediate attention)
 * - high: Device failures, plant health alerts (urgent action)
 * - medium: Status updates, routine maintenance (normal priority)
 * - low: Informational updates, system info (can be delayed)
 * 
 * FEATURES:
 * - Intelligent event pattern matching
 * - User-specific notification targeting
 * - Duplicate prevention and rate limiting
 * - Configurable notification preferences
 * - Integration with existing notification infrastructure
 */

const Alert = require('../models/Alert');
const SystemLog = require('../models/SystemLog');
const Device = require('../models/Device');
const Plant = require('../models/Plant');
const User = require('../models/User');

class EventNotificationService {
    constructor() {
        // Prevent circular logging by tracking notification creation
        this.isCreatingNotification = false;
        
        // Rate limiting to prevent notification spam
        this.recentNotifications = new Map();
        this.rateLimitWindow = 5 * 60 * 1000; // 5 minutes
        this.maxNotificationsPerWindow = 5;
    }

    /**
     * MAIN EVENT PROCESSOR
     * Analyzes system events and creates appropriate notifications
     */
    async processEvent(eventData) {
        try {
            // Prevent infinite loops when creating notifications
            if (this.isCreatingNotification) {
                return;
            }

            const { level, source, message, metadata = {} } = eventData;

            // Apply rate limiting
            if (this.isRateLimited(source, message)) {
                return;
            }

            // Process different event categories
            const notification = await this.categorizeAndCreateNotification({
                level,
                source,
                message,
                metadata,
                timestamp: new Date()
            });

            if (notification) {
                await this.createNotification(notification);
                this.trackNotification(source, message);
            }

        } catch (error) {
            // Log error without triggering more events
            console.error('EventNotificationService error:', error.message);
        }
    }

    /**
     * NOTIFICATION CATEGORIZATION AND CREATION
     * Determines notification type and creates appropriate notification data
     */
    async categorizeAndCreateNotification(eventData) {
        const { level, source, message, metadata } = eventData;

        // Device-related events
        if (this.isDeviceEvent(source, message)) {
            return await this.handleDeviceEvent(eventData);
        }

        // Plant-related events
        if (this.isPlantEvent(source, message)) {
            return await this.handlePlantEvent(eventData);
        }

        // System-related events
        if (this.isSystemEvent(level, source, message)) {
            return await this.handleSystemEvent(eventData);
        }

        // User-related events
        if (this.isUserEvent(source, message)) {
            return await this.handleUserEvent(eventData);
        }

        // Payment-related events
        if (this.isPaymentEvent(source, message)) {
            return await this.handlePaymentEvent(eventData);
        }

        return null;
    }

    /**
     * DEVICE EVENT DETECTION AND HANDLING
     */
    isDeviceEvent(source, message) {
        return source.toLowerCase().includes('device') ||
               message.toLowerCase().includes('device') ||
               message.toLowerCase().includes('offline') ||
               message.toLowerCase().includes('online') ||
               message.toLowerCase().includes('connected') ||
               message.toLowerCase().includes('disconnected');
    }

    async handleDeviceEvent(eventData) {
        const { level, source, message, metadata } = eventData;

        // Extract device key from message if possible
        const deviceKeyMatch = message.match(/device[:\s]+([a-f0-9-]{36})/i);
        const deviceKey = deviceKeyMatch ? deviceKeyMatch[1] : metadata.deviceKey;

        let device = null;
        if (deviceKey) {
            try {
                device = await Device.findById(deviceKey);
            } catch (error) {
                // Device not found, proceed without device context
            }
        }

        if (message.toLowerCase().includes('device created')) {
            return {
                user_id: device ? device.user_id : metadata.userId || null,
                type: 'device_created',
                title: 'New Device Added',
                message: `Your device "${device?.device_name || 'New Device'}" has been added`,
                priority: 'medium',
                details: JSON.stringify({
                    device_key: deviceKey,
                    device_name: device ? device.device_name : 'Unknown Device',
                    timestamp: new Date(),
                    source: source
                }),
                action_url: device ? `/devices/${deviceKey}` : '/devices',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            };
        }

        // Device offline/online events
        if (message.toLowerCase().includes('offline')) {
            return {
                user_id: device ? device.user_id : null,
                title: `Device Disconnected`,
                message: device ? 
                    `Your device "${device.device_name}" has gone offline` :
                    'A device has disconnected from the system',
                type: 'device_offline',
                priority: 'high',
                details: JSON.stringify({
                    device_key: deviceKey,
                    device_name: device ? device.device_name : 'Unknown Device',
                    timestamp: new Date(),
                    source: source
                }),
                action_url: device ? `/devices/${deviceKey}` : '/devices',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            };
        }

        if (message.toLowerCase().includes('online') || message.toLowerCase().includes('connected')) {
            return {
                user_id: device ? device.user_id : null,
                title: `Device Connected`,
                message: device ? 
                    `Your device "${device.device_name}" is now online` :
                    'A device has connected to the system',
                type: 'device_online',
                priority: 'medium',
                details: JSON.stringify({
                    device_key: deviceKey,
                    device_name: device ? device.device_name : 'Unknown Device',
                    timestamp: new Date(),
                    source: source
                }),
                action_url: device ? `/devices/${deviceKey}` : '/devices',
                expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
            };
        }

        // Device error events
        if (level === 'ERROR' && this.isDeviceEvent(source, message)) {
            return {
                user_id: device ? device.user_id : null,
                title: `Device Error`,
                message: device ? 
                    `Device "${device.device_name}" encountered an error` :
                    'A device error has occurred',
                type: 'device_error',
                priority: 'critical',
                details: JSON.stringify({
                    device_key: deviceKey,
                    device_name: device ? device.device_name : 'Unknown Device',
                    error_message: message,
                    timestamp: new Date(),
                    source: source
                }),
                action_url: device ? `/devices/${deviceKey}` : '/devices',
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
            };
        }

        return null;
    }

    /**
     * PLANT EVENT DETECTION AND HANDLING
     */
    isPlantEvent(source, message) {
        return source.toLowerCase().includes('plant') ||
               message.toLowerCase().includes('plant') ||
               message.toLowerCase().includes('watering') ||
               message.toLowerCase().includes('moisture') ||
               message.toLowerCase().includes('threshold');
    }

    async handlePlantEvent(eventData) {
        const { level, source, message, metadata } = eventData;

        // Extract plant ID from message if possible
        const plantIdMatch = message.match(/plant[:\s]+(\d+)/i);
        const plantId = plantIdMatch ? plantIdMatch[1] : metadata.plantId;

        let plant = null;
        if (plantId) {
            try {
                plant = await Plant.findById(plantId);
            } catch (error) {
                // Plant not found, proceed without plant context
            }
        }

        if (message.toLowerCase().includes('plant created')) {
            return {
                user_id: plant ? plant.user_id : metadata.userId || null,
                type: 'plant_created',
                title: 'New Plant Added',
                message: `Your plant "${plant?.custom_name || 'New Plant'}" has been added`,
                priority: 'medium',
                details: JSON.stringify({
                    plant_id: plantId,
                    plant_name: plant ? plant.custom_name : 'Unknown Plant',
                    message: message,
                    timestamp: new Date(),
                    source: source
                }),
                action_url: plant ? `/plants/${plantId}` : '/plants',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            };
        }

        // Watering alerts
        if (message.toLowerCase().includes('watering') || message.toLowerCase().includes('water')) {
            return {
                user_id: plant ? plant.user_id : null,
                title: `Watering Alert`,
                message: plant ? 
                    `Your plant "${plant.custom_name}" needs attention` :
                    'A plant watering event has occurred',
                type: 'plant_watering',
                priority: 'high',
                details: JSON.stringify({
                    plant_id: plantId,
                    plant_name: plant ? plant.custom_name : 'Unknown Plant',
                    message: message,
                    timestamp: new Date(),
                    source: source
                }),
                action_url: plant ? `/plants/${plantId}` : '/plants',
                expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours
            };
        }

        // Moisture threshold alerts
        if (message.toLowerCase().includes('moisture') || message.toLowerCase().includes('threshold')) {
            return {
                user_id: plant ? plant.user_id : null,
                title: `Moisture Alert`,
                message: plant ? 
                    `Plant "${plant.custom_name}" moisture levels require attention` :
                    'A plant moisture alert has been triggered',
                type: 'plant_moisture',
                priority: 'high',
                details: JSON.stringify({
                    plant_id: plantId,
                    plant_name: plant ? plant.custom_name : 'Unknown Plant',
                    message: message,
                    timestamp: new Date(),
                    source: source
                }),
                action_url: plant ? `/plants/${plantId}` : '/plants',
                expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
            };
        }

        // Plant error events
        if (level === 'ERROR' && this.isPlantEvent(source, message)) {
            return {
                user_id: plant ? plant.user_id : null,
                title: `Plant System Error`,
                message: plant ? 
                    `Error with plant "${plant.custom_name}"` :
                    'A plant system error has occurred',
                type: 'plant_error',
                priority: 'critical',
                details: JSON.stringify({
                    plant_id: plantId,
                    plant_name: plant ? plant.custom_name : 'Unknown Plant',
                    error_message: message,
                    timestamp: new Date(),
                    source: source
                }),
                action_url: plant ? `/plants/${plantId}` : '/plants',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            };
        }

        return null;
    }

    /**
     * SYSTEM EVENT DETECTION AND HANDLING
     */
    isSystemEvent(level, source, message) {
        return level === 'ERROR' || 
               level === 'WARNING' ||
               source.toLowerCase().includes('system') ||
               message.toLowerCase().includes('system') ||
               message.toLowerCase().includes('server') ||
               message.toLowerCase().includes('database');
    }

    async handleSystemEvent(eventData) {
        const { level, source, message } = eventData;

        // Critical system errors
        if (level === 'ERROR') {
            return {
                user_id: null, // System notifications go to admins
                title: `System Error`,
                message: `A system error has occurred: ${message.substring(0, 100)}`,
                type: 'system_error',
                priority: 'critical',
                details: JSON.stringify({
                    error_message: message,
                    source: source,
                    timestamp: new Date()
                }),
                action_url: '/admin/logs',
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
            };
        }

        // System warnings
        if (level === 'WARNING' || level === 'WARN') {
            return {
                user_id: null, // System notifications go to admins
                title: `System Warning`,
                message: `System warning: ${message.substring(0, 100)}`,
                type: 'system_warning',
                priority: 'medium',
                details: JSON.stringify({
                    warning_message: message,
                    source: source,
                    timestamp: new Date()
                }),
                action_url: '/admin/logs',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            };
        }

        return null;
    }

    /**
     * USER EVENT DETECTION AND HANDLING
     */
    isUserEvent(source, message) {
        return source.toLowerCase().includes('user') ||
               source.toLowerCase().includes('auth') ||
               message.toLowerCase().includes('user') ||
               message.toLowerCase().includes('login') ||
               message.toLowerCase().includes('register');
    }

    async handleUserEvent(eventData) {
        const { level, source, message, metadata } = eventData;

        // User registration
        if (message.toLowerCase().includes('register') || message.toLowerCase().includes('created')) {
            return {
                user_id: metadata.userId || null,
                title: `Welcome to Plant Monitoring`,
                message: 'Your account has been successfully created. Start by adding your first device!',
                type: 'user_welcome',
                priority: 'medium',
                details: JSON.stringify({
                    message: message,
                    timestamp: new Date(),
                    source: source
                }),
                action_url: '/devices/add',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            };
        }

        // Authentication failures
        if (level === 'WARNING' && message.toLowerCase().includes('login')) {
            return {
                user_id: metadata.userId || null,
                title: `Security Alert`,
                message: 'Failed login attempt detected on your account',
                type: 'security_alert',
                priority: 'high',
                details: JSON.stringify({
                    message: message,
                    timestamp: new Date(),
                    source: source
                }),
                action_url: '/profile/security',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            };
        }

        return null;
    }

    /**
     * PAYMENT EVENT DETECTION AND HANDLING
     */
    isPaymentEvent(source, message) {
        return source.toLowerCase().includes('payment') ||
               source.toLowerCase().includes('vnpay') ||
               message.toLowerCase().includes('payment') ||
               message.toLowerCase().includes('subscription') ||
               message.toLowerCase().includes('premium');
    }

    async handlePaymentEvent(eventData) {
        const { level, source, message, metadata } = eventData;

        // Payment success
        if (message.toLowerCase().includes('success') || message.toLowerCase().includes('completed')) {
            await SystemLog.info(
                'payment',
                'Payment completed successfully',
                { userId: metadata.userId }
            );
            return {
                user_id: metadata.userId || null,
                title: `Payment Successful`,
                message: 'Your payment has been processed successfully. Premium features are now available!',
                type: 'payment_success',
                priority: 'medium',
                details: JSON.stringify({
                    message: message,
                    timestamp: new Date(),
                    source: source
                }),
                action_url: '/profile/subscription',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            };
        }

        // Payment failure
        if (level === 'ERROR' || message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')) {
            return {
                user_id: metadata.userId || null,
                title: `Payment Failed`,
                message: 'There was an issue processing your payment. Please try again or contact support.',
                type: 'payment_failed',
                priority: 'high',
                details: JSON.stringify({
                    error_message: message,
                    timestamp: new Date(),
                    source: source
                }),
                action_url: '/profile/subscription',
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
            };
        }

        return null;
    }

    /**
     * NOTIFICATION CREATION AND PERSISTENCE
     */
    async createNotification(notificationData) {
        try {
            this.isCreatingNotification = true;

            // Create the notification in the database
            const notification = await Alert.create(notificationData);

            // Log the notification creation (but prevent recursive notifications)
            console.log(`Created notification: ${notificationData.title} for user ${notificationData.user_id || 'system'}`);

            return notification;

        } catch (error) {
            console.error('Error creating notification:', error.message);
            throw error;
        } finally {
            this.isCreatingNotification = false;
        }
    }

    /**
     * RATE LIMITING AND DUPLICATE PREVENTION
     */
    isRateLimited(source, message) {
        const key = `${source}:${message.substring(0, 50)}`;
        const now = Date.now();

        // Clean up old entries
        for (const [k, timestamps] of this.recentNotifications.entries()) {
            const validTimestamps = timestamps.filter(t => now - t < this.rateLimitWindow);
            if (validTimestamps.length === 0) {
                this.recentNotifications.delete(k);
            } else {
                this.recentNotifications.set(k, validTimestamps);
            }
        }

        // Check rate limit for this event
        if (!this.recentNotifications.has(key)) {
            this.recentNotifications.set(key, []);
        }

        const timestamps = this.recentNotifications.get(key);
        const recentCount = timestamps.filter(t => now - t < this.rateLimitWindow).length;

        return recentCount >= this.maxNotificationsPerWindow;
    }

    trackNotification(source, message) {
        const key = `${source}:${message.substring(0, 50)}`;
        const now = Date.now();

        if (!this.recentNotifications.has(key)) {
            this.recentNotifications.set(key, []);
        }

        this.recentNotifications.get(key).push(now);
    }
}

// Export singleton instance
module.exports = new EventNotificationService();