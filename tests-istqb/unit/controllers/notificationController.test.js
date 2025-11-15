const notificationController = require('../../../controllers/notificationController');
const Alert = require('../../../models/Alert');
const User = require('../../../models/User');
const SystemLog = require('../../../models/SystemLog');
const { pool } = require('../../../config/db');
const { isValidUUID } = require('../../../utils/uuidGenerator');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

    /**
     * ============================================================================
     * UNIT TEST: Notification Controller
     * ============================================================================
     * ISTQB Level: Unit Testing
     * Component: controllers/notificationController.js
     */


    // Mock all dependencies
    jest.mock('../../../models/Alert');
    jest.mock('../../../models/User');
    jest.mock('../../../models/SystemLog');
    jest.mock('../../../config/db');
    jest.mock('../../../utils/uuidGenerator');
    jest.mock('firebase-admin');
    jest.mock('nodemailer');

    describe('notificationController', () => {
      let req, res, mockUser, mockNotification;

      beforeEach(() => {
        req = {
          user: { user_id: 'uuid-123-456' },
          params: {},
          body: {},
          query: {}
        };
        
        res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        mockUser = {
          user_id: 'uuid-123-456',
          email: 'test@example.com',
          notification_prefs: { email: true, push: true },
          fcm_tokens: ['token1', 'token2'],
          save: jest.fn()
        };

        mockNotification = {
          alert_id: 1,
          user_id: 'uuid-123-456',
          title: 'Test Alert',
          message: 'Test message',
          is_read: false,
          save: jest.fn(),
          delete: jest.fn()
        };

        // Reset all mocks
        jest.clearAllMocks();
        
        // Default mock implementations
        isValidUUID.mockReturnValue(true);
        SystemLog.create = jest.fn();
        SystemLog.info = jest.fn();
        SystemLog.error = jest.fn();
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      describe('getUserNotifications()', () => {
        test('should retrieve user notifications successfully', async () => {
          // Arrange
          const mockNotifications = [mockNotification];
          Alert.findByUserId.mockResolvedValue(mockNotifications);

          // Act
          await notificationController.getUserNotifications(req, res);

          // Assert
          expect(isValidUUID).toHaveBeenCalledWith('uuid-123-456');
          expect(Alert.findByUserId).toHaveBeenCalledWith('uuid-123-456');
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockNotifications
          });
        });

        test('should return 400 for invalid UUID', async () => {
          // Arrange
          isValidUUID.mockReturnValue(false);

          // Act
          await notificationController.getUserNotifications(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Invalid user ID format'
          });
          expect(Alert.findByUserId).not.toHaveBeenCalled();
        });

        test('should handle database errors', async () => {
          // Arrange
          Alert.findByUserId.mockRejectedValue(new Error('Database error'));

          // Act
          await notificationController.getUserNotifications(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Failed to retrieve notifications'
          });
        });
      });

      describe('getUnreadNotifications()', () => {
        test('should retrieve unread notifications successfully', async () => {
          // Arrange
          const mockUnreadNotifications = [mockNotification];
          Alert.findUnreadByUserId.mockResolvedValue(mockUnreadNotifications);

          // Act
          await notificationController.getUnreadNotifications(req, res);

          // Assert
          expect(Alert.findUnreadByUserId).toHaveBeenCalledWith('uuid-123-456');
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockUnreadNotifications
          });
        });

        test('should return 400 for invalid UUID', async () => {
          // Arrange
          isValidUUID.mockReturnValue(false);

          // Act
          await notificationController.getUnreadNotifications(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Invalid user ID format'
          });
        });
      });

      describe('markNotificationAsRead()', () => {
        beforeEach(() => {
          req.params.notificationId = '1';
        });

        test('should mark notification as read successfully', async () => {
          // Arrange
          Alert.findById.mockResolvedValue(mockNotification);

          // Act
          await notificationController.markNotificationAsRead(req, res);

          // Assert
          expect(Alert.findById).toHaveBeenCalledWith('1');
          expect(mockNotification.save).toHaveBeenCalled();
          expect(mockNotification.is_read).toBe(true);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Notification marked as read',
            data: mockNotification
          });
        });

        test('should return 404 if notification not found', async () => {
          // Arrange
          Alert.findById.mockResolvedValue(null);

          // Act
          await notificationController.markNotificationAsRead(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Notification not found'
          });
        });

        test('should return 403 if notification belongs to different user', async () => {
          // Arrange
          mockNotification.user_id = 'different-uuid';
          Alert.findById.mockResolvedValue(mockNotification);

          // Act
          await notificationController.markNotificationAsRead(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'You do not have permission to update this notification'
          });
        });

        test('should handle save errors', async () => {
          // Arrange
          Alert.findById.mockResolvedValue(mockNotification);
          mockNotification.save.mockRejectedValue(new Error('Save error'));

          // Act
          await notificationController.markNotificationAsRead(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Failed to update notification'
          });
        });
      });

      describe('markAllNotificationsAsRead()', () => {
        test('should mark all notifications as read successfully', async () => {
          // Arrange
          Alert.markAllAsReadForUser.mockResolvedValue();

          // Act
          await notificationController.markAllNotificationsAsRead(req, res);

          // Assert
          expect(Alert.markAllAsReadForUser).toHaveBeenCalledWith('uuid-123-456');
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'All notifications marked as read'
          });
        });

        test('should handle database errors', async () => {
          // Arrange
          Alert.markAllAsReadForUser.mockRejectedValue(new Error('Database error'));

          // Act
          await notificationController.markAllNotificationsAsRead(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Failed to update notifications'
          });
        });
      });

      describe('deleteNotification()', () => {
        beforeEach(() => {
          req.params.notificationId = '1';
        });

        test('should delete notification successfully', async () => {
          // Arrange
          Alert.findById.mockResolvedValue(mockNotification);

          // Act
          await notificationController.deleteNotification(req, res);

          // Assert
          expect(Alert.findById).toHaveBeenCalledWith('1');
          expect(mockNotification.delete).toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Notification deleted successfully'
          });
        });

        test('should return 404 if notification not found', async () => {
          // Arrange
          Alert.findById.mockResolvedValue(null);

          // Act
          await notificationController.deleteNotification(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Notification not found'
          });
        });

        test('should return 403 if notification belongs to different user', async () => {
          // Arrange
          mockNotification.user_id = 'different-uuid';
          Alert.findById.mockResolvedValue(mockNotification);

          // Act
          await notificationController.deleteNotification(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'You do not have permission to delete this notification'
          });
        });
      });

      describe('updateNotificationPreferences()', () => {
        test('should update preferences successfully', async () => {
          // Arrange
          req.body.preferences = { email: false, push: true };
          User.findById.mockResolvedValue(mockUser);

          // Act
          await notificationController.updateNotificationPreferences(req, res);

          // Assert
          expect(User.findById).toHaveBeenCalledWith('uuid-123-456');
          expect(mockUser.save).toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Notification preferences updated successfully',
            data: { ...mockUser.notification_prefs, ...req.body.preferences }
          });
        });

        test('should return 400 for invalid preferences format', async () => {
          // Arrange
          req.body.preferences = null;

          // Act
          await notificationController.updateNotificationPreferences(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Invalid preferences format'
          });
        });

        test('should return 404 if user not found', async () => {
          // Arrange
          req.body.preferences = { email: false };
          User.findById.mockResolvedValue(null);

          // Act
          await notificationController.updateNotificationPreferences(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'User not found'
          });
        });
      });

      describe('getNotificationPreferences()', () => {
        test('should return user preferences successfully', async () => {
          // Arrange
          User.findById.mockResolvedValue(mockUser);

          // Act
          await notificationController.getNotificationPreferences(req, res);

          // Assert
          expect(User.findById).toHaveBeenCalledWith('uuid-123-456');
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockUser.notification_prefs
          });
        });

        test('should return default preferences if user has none', async () => {
          // Arrange
          mockUser.notification_prefs = null;
          User.findById.mockResolvedValue(mockUser);

          // Act
          await notificationController.getNotificationPreferences(req, res);

          // Assert
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
              email: true,
              push: true,
              lowMoisture: true,
              highTemperature: true,
              deviceOffline: true,
              pumpActivation: true
            }
          });
        });

        test('should return 404 if user not found', async () => {
          // Arrange
          User.findById.mockResolvedValue(null);

          // Act
          await notificationController.getNotificationPreferences(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'User not found'
          });
        });
      });

      describe('getNotificationStats()', () => {
        test('should return notification statistics successfully', async () => {
          // Arrange
          const mockStats = {
            total: 10,
            unread: 3,
            critical: 1,
            high_priority: 2,
            recent: 5,
            by_type: { alert: 4, info: 6 }
          };
          pool.query.mockResolvedValue({
            rows: [{ stats: mockStats }]
          });

          // Act
          await notificationController.getNotificationStats(req, res);

          // Assert
          expect(pool.query).toHaveBeenCalledWith(
            'SELECT get_notification_stats($1) as stats',
            ['uuid-123-456']
          );
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockStats
          });
        });

        test('should return default stats if query returns null', async () => {
          // Arrange
          pool.query.mockResolvedValue({ rows: [{ stats: null }] });

          // Act
          await notificationController.getNotificationStats(req, res);

          // Assert
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
              total: 0,
              unread: 0,
              critical: 0,
              high_priority: 0,
              recent: 0,
              by_type: {}
            }
          });
        });

        test('should return 400 for invalid UUID', async () => {
          // Arrange
          isValidUUID.mockReturnValue(false);

          // Act
          await notificationController.getNotificationStats(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Invalid user ID format'
          });
        });
      });

      describe('createNotification()', () => {
        test('should create new notification successfully', async () => {
          // Arrange
          const userId = 'uuid-123-456';
          const title = 'Test Title';
          const message = 'Test Message';
          const type = 'info';
          
          pool.query.mockResolvedValue({
            rows: [{ notification_id: 'notif-123' }]
          });

          // Act
          const result = await notificationController.createNotification(
            userId, title, message, type
          );

          // Assert
          expect(isValidUUID).toHaveBeenCalledWith(userId);
          expect(pool.query).toHaveBeenCalled();
          expect(SystemLog.info).toHaveBeenCalled();
          expect(result).toBe('notif-123');
        });

        test('should throw error for invalid UUID', async () => {
          // Arrange
          isValidUUID.mockReturnValue(false);

          // Act & Assert
          await expect(
            notificationController.createNotification('invalid-uuid', 'title', 'message')
          ).rejects.toThrow('Invalid user ID format');
          expect(SystemLog.error).toHaveBeenCalled();
        });

        test('should handle database errors', async () => {
          // Arrange
          pool.query.mockRejectedValue(new Error('Database error'));

          // Act & Assert
          await expect(
            notificationController.createNotification('uuid-123-456', 'title', 'message')
          ).rejects.toThrow('Database error');
          expect(SystemLog.error).toHaveBeenCalled();
        });
      });

      describe('deleteExpiredNotifications()', () => {
        test('should delete expired notifications successfully', async () => {
          // Arrange
          pool.query.mockResolvedValue({ rowCount: 5 });

          // Act
          await notificationController.deleteExpiredNotifications(req, res);

          // Assert
          expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM Alerts'),
            ['uuid-123-456']
          );
          expect(SystemLog.info).toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Deleted 5 expired notifications',
            deleted_count: 5
          });
        });

        test('should return 400 for invalid UUID', async () => {
          // Arrange
          isValidUUID.mockReturnValue(false);

          // Act
          await notificationController.deleteExpiredNotifications(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Invalid user ID format'
          });
        });
      });

      describe('createTestNotification()', () => {
        beforeEach(() => {
          process.env.NODE_ENV = 'development';
        });

        test('should create test notification in development mode', async () => {
          // Arrange
          pool.query.mockResolvedValue({
            rows: [{ notification_id: 'test-123' }]
          });

          // Act
          await notificationController.createTestNotification(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Test notification created successfully',
            data: { notification_id: 'test-123' }
          });
        });

        test('should reject test notification in production mode', async () => {
          // Arrange
          process.env.NODE_ENV = 'production';

          // Act
          await notificationController.createTestNotification(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Test notifications are only available in development mode'
          });
        });
      });

      describe('getNotificationsByType()', () => {
        beforeEach(() => {
          req.params.type = 'alert';
          req.query.limit = '20';
          req.query.status = 'unread';
        });

        test('should return notifications filtered by type', async () => {
          // Arrange
          const mockResults = [mockNotification];
          pool.query.mockResolvedValue({ rows: mockResults });

          // Act
          await notificationController.getNotificationsByType(req, res);

          // Assert
          expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('WHERE user_id = $1 AND type = $2'),
            ['uuid-123-456', 'alert', 'unread', 20]
          );
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockResults,
            filter: { type: 'alert', status: 'unread' },
            count: 1
          });
        });

        test('should return 400 for invalid UUID', async () => {
          // Arrange
          isValidUUID.mockReturnValue(false);

          // Act
          await notificationController.getNotificationsByType(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Invalid user ID format'
          });
        });
      });
    });