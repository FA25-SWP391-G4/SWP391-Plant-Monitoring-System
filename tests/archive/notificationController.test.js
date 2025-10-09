/**
 * ============================================================================
 * NOTIFICATION CONTROLLER TESTS
 * ============================================================================
 * 
 * Unit tests for notification functionality:
 * - UC9: Receive Real-Time Notifications - Push notifications and alerts
 */

const notificationController = require('../controllers/notificationController');
const Alert = require('../models/Alert');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');

// Mock database models
jest.mock('../models/Alert');
jest.mock('../models/User');
jest.mock('../models/SystemLog');

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
    apps: [],
    initializeApp: jest.fn(),
    credential: {
        cert: jest.fn()
    },
    messaging: () => ({
        sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 })
    })
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
    })
}));

describe('Notification Controller', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock req object
        mockReq = {
            user: { user_id: 1 },
            params: {},
            body: {}
        };

        // Mock res object
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('getUserNotifications', () => {
        it('should return user notifications', async () => {
            // Arrange
            const mockNotifications = [
                { alert_id: 1, message: 'Test notification 1' },
                { alert_id: 2, message: 'Test notification 2' }
            ];
            Alert.findByUserId.mockResolvedValue(mockNotifications);

            // Act
            await notificationController.getUserNotifications(mockReq, mockRes);

            // Assert
            expect(Alert.findByUserId).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockNotifications
            });
        });

        it('should handle errors', async () => {
            // Arrange
            Alert.findByUserId.mockRejectedValue(new Error('Database error'));

            // Act
            await notificationController.getUserNotifications(mockReq, mockRes);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to retrieve notifications'
            });
        });
    });

    describe('getUnreadNotifications', () => {
        it('should return unread notifications', async () => {
            // Arrange
            const mockNotifications = [
                { alert_id: 1, message: 'Test notification 1', is_read: false }
            ];
            Alert.findUnreadByUserId.mockResolvedValue(mockNotifications);

            // Act
            await notificationController.getUnreadNotifications(mockReq, mockRes);

            // Assert
            expect(Alert.findUnreadByUserId).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockNotifications
            });
        });
    });

    describe('markNotificationAsRead', () => {
        it('should mark a notification as read', async () => {
            // Arrange
            const mockNotification = {
                alert_id: 123,
                user_id: 1,
                is_read: false,
                save: jest.fn().mockResolvedValue({ alert_id: 123, is_read: true })
            };
            mockReq.params.notificationId = '123';
            Alert.findById.mockResolvedValue(mockNotification);

            // Act
            await notificationController.markNotificationAsRead(mockReq, mockRes);

            // Assert
            expect(Alert.findById).toHaveBeenCalledWith('123');
            expect(mockNotification.is_read).toBe(true);
            expect(mockNotification.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Notification marked as read'
            }));
        });

        it('should return 404 if notification not found', async () => {
            // Arrange
            mockReq.params.notificationId = '999';
            Alert.findById.mockResolvedValue(null);

            // Act
            await notificationController.markNotificationAsRead(mockReq, mockRes);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Notification not found'
            });
        });

        it('should return 403 if notification belongs to another user', async () => {
            // Arrange
            const mockNotification = {
                alert_id: 123,
                user_id: 2 // Different from request user
            };
            mockReq.params.notificationId = '123';
            Alert.findById.mockResolvedValue(mockNotification);

            // Act
            await notificationController.markNotificationAsRead(mockReq, mockRes);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'You do not have permission to update this notification'
            });
        });
    });

    describe('markAllNotificationsAsRead', () => {
        it('should mark all notifications as read', async () => {
            // Arrange
            Alert.markAllAsReadForUser.mockResolvedValue(5); // 5 notifications updated

            // Act
            await notificationController.markAllNotificationsAsRead(mockReq, mockRes);

            // Assert
            expect(Alert.markAllAsReadForUser).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'All notifications marked as read'
            });
        });
    });

    describe('deleteNotification', () => {
        it('should delete a notification', async () => {
            // Arrange
            const mockNotification = {
                alert_id: 123,
                user_id: 1,
                delete: jest.fn().mockResolvedValue(true)
            };
            mockReq.params.notificationId = '123';
            Alert.findById.mockResolvedValue(mockNotification);

            // Act
            await notificationController.deleteNotification(mockReq, mockRes);

            // Assert
            expect(Alert.findById).toHaveBeenCalledWith('123');
            expect(mockNotification.delete).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Notification deleted successfully'
            });
        });
    });

    describe('updateNotificationPreferences', () => {
        it('should update notification preferences', async () => {
            // Arrange
            const mockUser = {
                user_id: 1,
                notification_prefs: { email: true },
                save: jest.fn().mockResolvedValue({ user_id: 1 })
            };
            mockReq.body.preferences = { push: false, email: true };
            User.findById.mockResolvedValue(mockUser);

            // Act
            await notificationController.updateNotificationPreferences(mockReq, mockRes);

            // Assert
            expect(User.findById).toHaveBeenCalledWith(1);
            expect(mockUser.notification_prefs).toEqual({
                email: true,
                push: false
            });
            expect(mockUser.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Notification preferences updated successfully'
            }));
        });

        it('should handle invalid preferences format', async () => {
            // Arrange
            mockReq.body.preferences = 'not-an-object';

            // Act
            await notificationController.updateNotificationPreferences(mockReq, mockRes);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid preferences format'
            });
        });
    });

    describe('getNotificationPreferences', () => {
        it('should get notification preferences', async () => {
            // Arrange
            const mockUser = {
                user_id: 1,
                notification_prefs: { email: true, push: false }
            };
            User.findById.mockResolvedValue(mockUser);

            // Act
            await notificationController.getNotificationPreferences(mockReq, mockRes);

            // Assert
            expect(User.findById).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: { email: true, push: false }
            });
        });

        it('should provide default preferences if none exist', async () => {
            // Arrange
            const mockUser = {
                user_id: 1,
                notification_prefs: null
            };
            User.findById.mockResolvedValue(mockUser);

            // Act
            await notificationController.getNotificationPreferences(mockReq, mockRes);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    email: true,
                    push: true
                })
            });
        });
    });

    describe('createNotification', () => {
        it('should create a notification and send push notification', async () => {
            // Arrange
            const mockNotification = {
                alert_id: 123,
                user_id: 1,
                type: 'test',
                message: 'Test message'
            };
            const mockUser = {
                user_id: 1,
                notification_prefs: { test: true },
                fcm_tokens: ['token1', 'token2']
            };
            Alert.create.mockResolvedValue(mockNotification);
            User.findById.mockResolvedValue(mockUser);

            // Act
            const result = await notificationController.createNotification(
                1, 'test', 'Test message', 'Test title', { data: 'value' }
            );

            // Assert
            expect(Alert.create).toHaveBeenCalledWith(expect.objectContaining({
                user_id: 1,
                type: 'test',
                message: 'Test message',
                title: 'Test title'
            }));
            expect(SystemLog.create).toHaveBeenCalled(); // Log was created
            expect(result).toEqual(mockNotification);
        });
    });
});