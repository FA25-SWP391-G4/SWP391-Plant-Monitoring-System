const notificationService = require('../../../services/notificationService');
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');
const SystemLog = require('../../../models/SystemLog');
const notificationController = require('../../../controllers/notificationController');
const Alert = require('../../../models/Alert');
const http = require('http');

    jest.mock('socket.io');
    jest.mock('jsonwebtoken');
    jest.mock('../../../models/User');
    jest.mock('../../../models/SystemLog');
    jest.mock('../../../controllers/notificationController');
    jest.mock('../../../models/Alert');

    describe('notificationService', () => {
      let mockServer;
      let mockIo;
      let mockSocket;
      
      beforeEach(() => {
        jest.clearAllMocks();
        
        mockServer = http.createServer();
        mockSocket = {
          id: 'socket-123',
          handshake: {
            auth: { token: 'valid-token' },
            headers: {}
          },
          user: { user_id: 1, email: 'test@test.com', role: 'Regular' },
          join: jest.fn(),
          emit: jest.fn(),
          on: jest.fn()
        };
        
        mockIo = {
          use: jest.fn(),
          on: jest.fn(),
          to: jest.fn().mockReturnThis(),
          emit: jest.fn()
        };
        
        socketIO.mockReturnValue(mockIo);
        SystemLog.create = jest.fn().mockResolvedValue({});
      });

      afterEach(() => {
        jest.resetModules();
      });

      describe('init()', () => {
        test('should initialize WebSocket server with correct CORS settings', () => {
          process.env.CORS_ORIGIN = 'http://localhost:3000';
          
          notificationService.init(mockServer);
          
          expect(socketIO).toHaveBeenCalledWith(mockServer, {
            cors: {
              origin: 'http://localhost:3000',
              methods: ['GET', 'POST'],
              allowedHeaders: ['Authorization'],
              credentials: true
            }
          });
        });

        test('should set up authentication middleware', () => {
          notificationService.init(mockServer);
          
          expect(mockIo.use).toHaveBeenCalled();
        });

        test('should log successful initialization', async () => {
          notificationService.init(mockServer);
          
          await new Promise(resolve => setTimeout(resolve, 10));
          
          expect(SystemLog.create).toHaveBeenCalledWith({
            log_level: 'INFO',
            source: 'NotificationService',
            message: 'WebSocket notification service initialized'
          });
        });

        test('should handle initialization errors', async () => {
          socketIO.mockImplementation(() => {
            throw new Error('Server error');
          });
          
          expect(() => notificationService.init(mockServer)).toThrow('Server error');
          
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      });

      describe('authentication middleware', () => {
        let authMiddleware;
        
        beforeEach(() => {
          notificationService.init(mockServer);
          authMiddleware = mockIo.use.mock.calls[0][0];
        });

        test('should authenticate valid token from auth object', async () => {
          const next = jest.fn();
          jwt.verify.mockReturnValue({ user_id: 1 });
          User.findById.mockResolvedValue({ 
            user_id: 1, 
            email: 'test@test.com', 
            role: 'Regular' 
          });
          
          await authMiddleware(mockSocket, next);
          
          expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
          expect(User.findById).toHaveBeenCalledWith(1);
          expect(mockSocket.user).toEqual({
            user_id: 1,
            email: 'test@test.com',
            role: 'Regular'
          });
          expect(next).toHaveBeenCalledWith();
        });

        test('should authenticate valid token from authorization header', async () => {
          const next = jest.fn();
          mockSocket.handshake.auth = {};
          mockSocket.handshake.headers.authorization = 'Bearer header-token';
          jwt.verify.mockReturnValue({ user_id: 2 });
          User.findById.mockResolvedValue({ 
            user_id: 2, 
            email: 'user2@test.com', 
            role: 'Premium' 
          });
          
          await authMiddleware(mockSocket, next);
          
          expect(jwt.verify).toHaveBeenCalledWith('header-token', process.env.JWT_SECRET);
          expect(next).toHaveBeenCalledWith();
        });

        test('should reject connection without token', async () => {
          const next = jest.fn();
          mockSocket.handshake.auth = {};
          
          await authMiddleware(mockSocket, next);
          
          expect(next).toHaveBeenCalledWith(new Error('Authentication token required'));
        });

        test('should reject invalid JWT token', async () => {
          const next = jest.fn();
          jwt.verify.mockImplementation(() => {
            throw new Error('Invalid token');
          });
          
          await authMiddleware(mockSocket, next);
          
          expect(next).toHaveBeenCalledWith(new Error('Authentication failed'));
        });

        test('should reject when user not found', async () => {
          const next = jest.fn();
          jwt.verify.mockReturnValue({ user_id: 999 });
          User.findById.mockResolvedValue(null);
          
          await authMiddleware(mockSocket, next);
          
          expect(next).toHaveBeenCalledWith(new Error('User not found'));
        });
      });

      describe('sendToUser()', () => {
        beforeEach(() => {
          notificationService.init(mockServer);
        });

        test('should create notification and send via WebSocket', async () => {
          const mockNotification = {
            notification_id: 1,
            type: 'alert',
            message: 'Test message',
            title: 'Test title',
            details: { key: 'value' }
          };
          
          notificationController.createNotification.mockResolvedValue(mockNotification);
          Alert.getUnreadCountByUserId = jest.fn().mockResolvedValue(5);
          
          const result = await notificationService.sendToUser(
            1, 'alert', 'Test message', 'Test title', { key: 'value' }
          );
          
          expect(notificationController.createNotification).toHaveBeenCalledWith(
            1, 'alert', 'Test message', 'Test title', { key: 'value' }
          );
          expect(mockIo.to).toHaveBeenCalledWith('user:1');
          expect(mockIo.emit).toHaveBeenCalledWith('notification', {
            notification: mockNotification
          });
          expect(result).toEqual(mockNotification);
        });

        test('should parse JSON string details', async () => {
          const mockNotification = {
            notification_id: 1,
            details: '{"key":"value"}'
          };
          
          notificationController.createNotification.mockResolvedValue(mockNotification);
          Alert.getUnreadCountByUserId = jest.fn().mockResolvedValue(0);
          
          await notificationService.sendToUser(1, 'alert', 'Test', 'Title');
          
          expect(mockIo.emit).toHaveBeenCalledWith('notification', {
            notification: {
              notification_id: 1,
              details: { key: 'value' }
            }
          });
        });

        test('should handle errors when sending notification', async () => {
          notificationController.createNotification.mockRejectedValue(new Error('DB error'));
          
          await expect(
            notificationService.sendToUser(1, 'alert', 'Test', 'Title')
          ).rejects.toThrow('DB error');
        });
      });

      describe('sendToRole()', () => {
        beforeEach(() => {
          notificationService.init(mockServer);
        });

        test('should send notifications to all users with specified role', async () => {
          const mockUsers = [
            { user_id: 1, role: 'Premium' },
            { user_id: 2, role: 'Premium' }
          ];
          
          User.findByRole.mockResolvedValue(mockUsers);
          notificationController.createNotification.mockResolvedValue({ notification_id: 1 });
          Alert.getUnreadCountByUserId = jest.fn().mockResolvedValue(0);
          
          const result = await notificationService.sendToRole(
            'Premium', 'alert', 'Test message', 'Test title'
          );
          
          expect(User.findByRole).toHaveBeenCalledWith('Premium');
          expect(notificationController.createNotification).toHaveBeenCalledTimes(2);
          expect(result).toHaveLength(2);
        });

        test('should continue sending even if one user fails', async () => {
          const mockUsers = [
            { user_id: 1 },
            { user_id: 2 }
          ];
          
          User.findByRole.mockResolvedValue(mockUsers);
          notificationController.createNotification
            .mockRejectedValueOnce(new Error('Fail'))
            .mockResolvedValueOnce({ notification_id: 2 });
          Alert.getUnreadCountByUserId = jest.fn().mockResolvedValue(0);
          
          const result = await notificationService.sendToRole('Admin', 'alert', 'Test', 'Title');
          
          expect(result).toHaveLength(1);
        });
      });

      describe('broadcast()', () => {
        beforeEach(() => {
          notificationService.init(mockServer);
        });

        test('should send notifications to all users', async () => {
          const mockUsers = [
            { user_id: 1 },
            { user_id: 2 },
            { user_id: 3 }
          ];
          
          User.findAll.mockResolvedValue(mockUsers);
          notificationController.createNotification.mockResolvedValue({ notification_id: 1 });
          Alert.getUnreadCountByUserId = jest.fn().mockResolvedValue(0);
          
          const result = await notificationService.broadcast(
            'system', 'Broadcast message', 'System Alert'
          );
          
          expect(User.findAll).toHaveBeenCalled();
          expect(notificationController.createNotification).toHaveBeenCalledTimes(3);
          expect(result).toHaveLength(3);
        });
      });

      describe('getUnreadCount()', () => {
        test('should return unread count for user', async () => {
          Alert.getUnreadCountByUserId = jest.fn().mockResolvedValue(7);
          
          const count = await notificationService.getUnreadCount(1);
          
          expect(Alert.getUnreadCountByUserId).toHaveBeenCalledWith(1);
          expect(count).toBe(7);
        });

        test('should return 0 on error', async () => {
          Alert.getUnreadCountByUserId = jest.fn().mockRejectedValue(new Error('DB error'));
          
          const count = await notificationService.getUnreadCount(1);
          
          expect(count).toBe(0);
        });
      });
    });