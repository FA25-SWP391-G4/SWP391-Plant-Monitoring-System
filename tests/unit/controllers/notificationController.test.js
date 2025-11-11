/**
 * NOTIFICATION CONTROLLER TESTS
 * ==============================
 * 
 * Comprehensive unit tests for notification and alert controller
 * Covers real-time notifications, alerts, push notifications, and email alerts
 */

const notificationController = require('../../../controllers/notificationController');
const Alert = require('../../../models/Alert');
const User = require('../../../models/User');
const SystemLog = require('../../../models/SystemLog');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Mock dependencies
jest.mock('../../../models/Alert');
jest.mock('../../../models/User');
jest.mock('../../../models/SystemLog');
jest.mock('firebase-admin');
jest.mock('nodemailer');

describe('Notification Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            user: {
                id: 'user-123',
                email: 'test@example.com',
                role: 'Regular'
            },
            body: {},
            params: {},
            query: {},
            ip: '127.0.0.1'
        };

        mockRes = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();

        // Reset mocks
        jest.clearAllMocks();

        // Mock Firebase admin
        admin.messaging = jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue('message-id-123'),
            sendToTopic: jest.fn().mockResolvedValue('topic-message-id')
        });

        // Mock nodemailer
        nodemailer.createTransporter = jest.fn().mockReturnValue({
            sendMail: jest.fn().mockResolvedValue({ messageId: 'email-123' })
        });
    });

    // UC6: View Alerts + Notifications
    describe('View Alerts + Notifications (UC6)', () => {
        describe('getAlerts', () => {
            it('should get user alerts successfully', async () => {
                const mockAlerts = [
                    {
                        id: 'alert-1',
                        plantId: 'plant-1',
                        plantName: 'Tomato Plant',
                        type: 'low_moisture',
                        severity: 'warning',
                        message: 'Moisture level below threshold (25%)',
                        timestamp: new Date('2024-01-15T10:00:00Z'),
                        read: false,
                        acknowledged: false
                    },
                    {
                        id: 'alert-2',
                        deviceId: 'device-1',
                        deviceName: 'Pump 1',
                        type: 'device_offline',
                        severity: 'critical',
                        message: 'Device has been offline for 2 hours',
                        timestamp: new Date('2024-01-15T08:00:00Z'),
                        read: true,
                        acknowledged: false
                    }
                ];

                Alert.findByUserId.mockResolvedValue(mockAlerts);

                await notificationController.getAlerts(mockReq, mockRes);

                expect(Alert.findByUserId).toHaveBeenCalledWith('user-123', {
                    limit: 50,
                    offset: 0,
                    severity: undefined,
                    read: undefined
                });
                expect(mockRes.json).toHaveBeenCalledWith({
                    alerts: mockAlerts,
                    unreadCount: 1,
                    criticalCount: 1,
                    pagination: {
                        limit: 50,
                        offset: 0,
                        total: 2
                    }
                });
            });

            it('should filter alerts by severity', async () => {
                mockReq.query = { severity: 'critical', limit: '10' };

                const mockCriticalAlerts = [
                    {
                        id: 'alert-2',
                        type: 'device_offline',
                        severity: 'critical',
                        message: 'Device offline',
                        timestamp: new Date()
                    }
                ];

                Alert.findByUserId.mockResolvedValue(mockCriticalAlerts);

                await notificationController.getAlerts(mockReq, mockRes);

                expect(Alert.findByUserId).toHaveBeenCalledWith('user-123', {
                    limit: 10,
                    offset: 0,
                    severity: 'critical',
                    read: undefined
                });
            });

            it('should filter alerts by read status', async () => {
                mockReq.query = { read: 'false' };

                const mockUnreadAlerts = [
                    {
                        id: 'alert-1',
                        type: 'low_moisture',
                        read: false
                    }
                ];

                Alert.findByUserId.mockResolvedValue(mockUnreadAlerts);

                await notificationController.getAlerts(mockReq, mockRes);

                expect(Alert.findByUserId).toHaveBeenCalledWith('user-123', {
                    limit: 50,
                    offset: 0,
                    severity: undefined,
                    read: false
                });
            });

            it('should handle pagination parameters', async () => {
                mockReq.query = { limit: '25', offset: '50' };

                Alert.findByUserId.mockResolvedValue([]);

                await notificationController.getAlerts(mockReq, mockRes);

                expect(Alert.findByUserId).toHaveBeenCalledWith('user-123', {
                    limit: 25,
                    offset: 50,
                    severity: undefined,
                    read: undefined
                });
            });
        });

        describe('markAlertAsRead', () => {
            it('should mark alert as read successfully', async () => {
                mockReq.params.alertId = 'alert-123';

                const mockAlert = {
                    id: 'alert-123',
                    userId: 'user-123',
                    read: false
                };

                Alert.findById.mockResolvedValue(mockAlert);
                Alert.markAsRead.mockResolvedValue();

                await notificationController.markAlertAsRead(mockReq, mockRes);

                expect(Alert.findById).toHaveBeenCalledWith('alert-123');
                expect(Alert.markAsRead).toHaveBeenCalledWith('alert-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Alert marked as read'
                });
            });

            it('should prevent marking other user\'s alerts', async () => {
                mockReq.params.alertId = 'alert-123';

                const mockAlert = {
                    id: 'alert-123',
                    userId: 'other-user',
                    read: false
                };

                Alert.findById.mockResolvedValue(mockAlert);

                await notificationController.markAlertAsRead(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(403);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Access denied'
                });
                expect(Alert.markAsRead).not.toHaveBeenCalled();
            });

            it('should handle alert not found', async () => {
                mockReq.params.alertId = 'nonexistent-alert';

                Alert.findById.mockResolvedValue(null);

                await notificationController.markAlertAsRead(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(404);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Alert not found'
                });
            });
        });

        describe('acknowledgeAlert', () => {
            it('should acknowledge alert successfully', async () => {
                mockReq.params.alertId = 'alert-123';

                const mockAlert = {
                    id: 'alert-123',
                    userId: 'user-123',
                    acknowledged: false
                };

                Alert.findById.mockResolvedValue(mockAlert);
                Alert.acknowledge.mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                await notificationController.acknowledgeAlert(mockReq, mockRes);

                expect(Alert.acknowledge).toHaveBeenCalledWith('alert-123');
                expect(SystemLog.log).toHaveBeenCalledWith(
                    'notification',
                    'alert_acknowledged',
                    expect.stringContaining('alert-123'),
                    'user-123'
                );
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Alert acknowledged'
                });
            });
        });

        describe('dismissAlert', () => {
            it('should dismiss alert successfully', async () => {
                mockReq.params.alertId = 'alert-123';

                const mockAlert = {
                    id: 'alert-123',
                    userId: 'user-123'
                };

                Alert.findById.mockResolvedValue(mockAlert);
                Alert.dismiss.mockResolvedValue();

                await notificationController.dismissAlert(mockReq, mockRes);

                expect(Alert.dismiss).toHaveBeenCalledWith('alert-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Alert dismissed'
                });
            });
        });
    });

    // Real-time Notifications
    describe('Real-time Notifications (UC9)', () => {
        describe('sendPushNotification', () => {
            it('should send push notification successfully', async () => {
                const mockNotificationData = {
                    userId: 'user-123',
                    title: 'Plant Alert',
                    body: 'Your tomato plant needs water',
                    data: {
                        plantId: 'plant-1',
                        alertType: 'low_moisture'
                    }
                };

                const mockUser = {
                    id: 'user-123',
                    fcmToken: 'fcm-token-123',
                    pushNotificationsEnabled: true
                };

                User.findById.mockResolvedValue(mockUser);
                admin.messaging().send.mockResolvedValue('message-id-123');

                await notificationController.sendPushNotification(mockNotificationData);

                expect(admin.messaging().send).toHaveBeenCalledWith({
                    token: 'fcm-token-123',
                    notification: {
                        title: 'Plant Alert',
                        body: 'Your tomato plant needs water'
                    },
                    data: {
                        plantId: 'plant-1',
                        alertType: 'low_moisture'
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            icon: 'notification_icon',
                            color: '#4CAF50'
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                badge: 1,
                                sound: 'default'
                            }
                        }
                    }
                });
            });

            it('should skip notification if user disabled push notifications', async () => {
                const mockNotificationData = {
                    userId: 'user-123',
                    title: 'Plant Alert',
                    body: 'Test notification'
                };

                const mockUser = {
                    id: 'user-123',
                    fcmToken: 'fcm-token-123',
                    pushNotificationsEnabled: false
                };

                User.findById.mockResolvedValue(mockUser);

                await notificationController.sendPushNotification(mockNotificationData);

                expect(admin.messaging().send).not.toHaveBeenCalled();
            });

            it('should handle missing FCM token', async () => {
                const mockNotificationData = {
                    userId: 'user-123',
                    title: 'Plant Alert',
                    body: 'Test notification'
                };

                const mockUser = {
                    id: 'user-123',
                    fcmToken: null,
                    pushNotificationsEnabled: true
                };

                User.findById.mockResolvedValue(mockUser);

                await notificationController.sendPushNotification(mockNotificationData);

                expect(admin.messaging().send).not.toHaveBeenCalled();
            });
        });

        describe('sendEmailNotification', () => {
            it('should send email notification successfully', async () => {
                const mockEmailData = {
                    userId: 'user-123',
                    subject: 'Critical Plant Alert',
                    html: '<p>Your plant needs immediate attention</p>',
                    priority: 'high'
                };

                const mockUser = {
                    id: 'user-123',
                    email: 'test@example.com',
                    emailNotificationsEnabled: true
                };

                const mockTransporter = {
                    sendMail: jest.fn().mockResolvedValue({ messageId: 'email-123' })
                };

                User.findById.mockResolvedValue(mockUser);
                nodemailer.createTransporter.mockReturnValue(mockTransporter);

                await notificationController.sendEmailNotification(mockEmailData);

                expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                    from: process.env.SMTP_FROM || 'noreply@plantmonitor.com',
                    to: 'test@example.com',
                    subject: 'Critical Plant Alert',
                    html: '<p>Your plant needs immediate attention</p>',
                    priority: 'high'
                });
            });

            it('should skip email if user disabled email notifications', async () => {
                const mockEmailData = {
                    userId: 'user-123',
                    subject: 'Test Alert',
                    html: '<p>Test</p>'
                };

                const mockUser = {
                    id: 'user-123',
                    email: 'test@example.com',
                    emailNotificationsEnabled: false
                };

                User.findById.mockResolvedValue(mockUser);

                await notificationController.sendEmailNotification(mockEmailData);

                expect(nodemailer.createTransporter).not.toHaveBeenCalled();
            });
        });

        describe('createAlert', () => {
            it('should create and distribute alert successfully', async () => {
                const mockAlertData = {
                    userId: 'user-123',
                    plantId: 'plant-1',
                    type: 'low_moisture',
                    severity: 'warning',
                    message: 'Moisture level critically low',
                    metadata: {
                        currentLevel: 15,
                        threshold: 30
                    }
                };

                const mockCreatedAlert = {
                    id: 'alert-123',
                    ...mockAlertData,
                    timestamp: new Date()
                };

                Alert.create.mockResolvedValue(mockCreatedAlert);
                User.findById.mockResolvedValue({
                    id: 'user-123',
                    email: 'test@example.com',
                    pushNotificationsEnabled: true,
                    emailNotificationsEnabled: true,
                    fcmToken: 'fcm-token-123'
                });

                const sendPushSpy = jest.spyOn(notificationController, 'sendPushNotification');
                const sendEmailSpy = jest.spyOn(notificationController, 'sendEmailNotification');

                await notificationController.createAlert(mockAlertData);

                expect(Alert.create).toHaveBeenCalledWith(mockAlertData);
                expect(sendPushSpy).toHaveBeenCalled();
                expect(sendEmailSpy).toHaveBeenCalled();
            });

            it('should handle critical severity alerts with immediate notifications', async () => {
                const mockCriticalAlert = {
                    userId: 'user-123',
                    plantId: 'plant-1',
                    type: 'extreme_drought',
                    severity: 'critical',
                    message: 'Plant in critical condition - immediate action required'
                };

                Alert.create.mockResolvedValue({ id: 'alert-123', ...mockCriticalAlert });

                await notificationController.createAlert(mockCriticalAlert);

                expect(Alert.create).toHaveBeenCalledWith(mockCriticalAlert);
            });
        });
    });

    // Notification Preferences
    describe('Notification Preferences', () => {
        describe('getNotificationPreferences', () => {
            it('should get user notification preferences', async () => {
                const mockPreferences = {
                    pushNotificationsEnabled: true,
                    emailNotificationsEnabled: true,
                    alertTypes: {
                        lowMoisture: true,
                        deviceOffline: true,
                        systemUpdates: false
                    },
                    quietHours: {
                        enabled: true,
                        start: '22:00',
                        end: '08:00'
                    }
                };

                User.getNotificationPreferences.mockResolvedValue(mockPreferences);

                await notificationController.getNotificationPreferences(mockReq, mockRes);

                expect(User.getNotificationPreferences).toHaveBeenCalledWith('user-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    preferences: mockPreferences
                });
            });
        });

        describe('updateNotificationPreferences', () => {
            it('should update notification preferences successfully', async () => {
                mockReq.body = {
                    pushNotificationsEnabled: false,
                    emailNotificationsEnabled: true,
                    alertTypes: {
                        lowMoisture: true,
                        deviceOffline: false
                    }
                };

                User.updateNotificationPreferences.mockResolvedValue();
                SystemLog.log.mockResolvedValue();

                await notificationController.updateNotificationPreferences(mockReq, mockRes);

                expect(User.updateNotificationPreferences).toHaveBeenCalledWith('user-123', mockReq.body);
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Notification preferences updated successfully'
                });
            });

            it('should validate preference structure', async () => {
                mockReq.body = {
                    invalidField: 'invalid'
                };

                await notificationController.updateNotificationPreferences(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid preferences format'
                });
            });
        });

        describe('registerFCMToken', () => {
            it('should register FCM token for push notifications', async () => {
                mockReq.body = {
                    fcmToken: 'new-fcm-token-123'
                };

                User.updateFCMToken.mockResolvedValue();

                await notificationController.registerFCMToken(mockReq, mockRes);

                expect(User.updateFCMToken).toHaveBeenCalledWith('user-123', 'new-fcm-token-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'FCM token registered successfully'
                });
            });

            it('should validate FCM token format', async () => {
                mockReq.body = {
                    fcmToken: ''
                };

                await notificationController.registerFCMToken(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Valid FCM token is required'
                });
            });
        });
    });

    // Notification Statistics
    describe('Notification Statistics', () => {
        describe('getNotificationStats', () => {
            it('should get notification statistics', async () => {
                const mockStats = {
                    totalAlerts: 25,
                    unreadAlerts: 3,
                    criticalAlerts: 1,
                    alertsByType: {
                        low_moisture: 15,
                        device_offline: 8,
                        system_update: 2
                    },
                    alertsByWeek: [
                        { week: '2024-W01', count: 5 },
                        { week: '2024-W02', count: 8 }
                    ]
                };

                Alert.getStatistics.mockResolvedValue(mockStats);

                await notificationController.getNotificationStats(mockReq, mockRes);

                expect(Alert.getStatistics).toHaveBeenCalledWith('user-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    stats: mockStats
                });
            });
        });
    });

    // Error handling
    describe('Error Handling', () => {
        it('should handle Firebase messaging errors', async () => {
            const mockNotificationData = {
                userId: 'user-123',
                title: 'Test',
                body: 'Test notification'
            };

            User.findById.mockResolvedValue({
                id: 'user-123',
                fcmToken: 'invalid-token',
                pushNotificationsEnabled: true
            });

            admin.messaging().send.mockRejectedValue(new Error('Invalid token'));

            // Should not throw, but handle gracefully
            await expect(notificationController.sendPushNotification(mockNotificationData))
                .resolves.not.toThrow();
        });

        it('should handle email service failures', async () => {
            const mockEmailData = {
                userId: 'user-123',
                subject: 'Test',
                html: '<p>Test</p>'
            };

            User.findById.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                emailNotificationsEnabled: true
            });

            const mockTransporter = {
                sendMail: jest.fn().mockRejectedValue(new Error('SMTP error'))
            };
            nodemailer.createTransporter.mockReturnValue(mockTransporter);

            await expect(notificationController.sendEmailNotification(mockEmailData))
                .resolves.not.toThrow();
        });

        it('should handle database errors gracefully', async () => {
            Alert.findByUserId.mockRejectedValue(new Error('Database connection failed'));

            await notificationController.getAlerts(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to retrieve alerts'
            });
        });

        it('should handle authentication errors', async () => {
            mockReq.user = null;

            await notificationController.getAlerts(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Authentication required'
            });
        });
    });
});