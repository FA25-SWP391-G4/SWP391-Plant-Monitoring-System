import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '../../notifications/notification.controller';
import { NotificationService } from '../../notifications/notification.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

// Mock the NotificationService
const mockNotificationService = {
  getNotificationsByUser: jest.fn(),
  getUnreadNotifications: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
};

// Mock the guard
const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService }
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should call notificationService.getNotificationsByUser with user ID', async () => {
      // Arrange
      const req = { user: { userId: 'test-user-id' } };
      const expectedResult = [
        { id: 'notif-1', message: 'Test notification 1' },
        { id: 'notif-2', message: 'Test notification 2' }
      ];
      mockNotificationService.getNotificationsByUser.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getNotifications(req);

      // Assert
      expect(mockNotificationService.getNotificationsByUser).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUnreadNotifications', () => {
    it('should call notificationService.getUnreadNotifications with user ID', async () => {
      // Arrange
      const req = { user: { userId: 'test-user-id' } };
      const expectedResult = [{ id: 'notif-1', message: 'Unread notification' }];
      mockNotificationService.getUnreadNotifications.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getUnreadNotifications(req);

      // Assert
      expect(mockNotificationService.getUnreadNotifications).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('markAsRead', () => {
    it('should call notificationService.markAsRead with notification ID and user ID', async () => {
      // Arrange
      const req = { user: { userId: 'test-user-id' } };
      const notificationId = 'notif-1';
      const expectedResult = { 
        id: 'notif-1', 
        message: 'Test notification',
        isRead: true 
      };
      mockNotificationService.markAsRead.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.markAsRead(notificationId, req);

      // Assert
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(notificationId, 'test-user-id');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('markAllAsRead', () => {
    it('should call notificationService.markAllAsRead with user ID', async () => {
      // Arrange
      const req = { user: { userId: 'test-user-id' } };
      mockNotificationService.markAllAsRead.mockResolvedValue(undefined);

      // Act
      const result = await controller.markAllAsRead(req);

      // Assert
      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual({ message: 'All notifications marked as read' });
    });
  });

  describe('deleteNotification', () => {
    it('should call notificationService.deleteNotification with notification ID and user ID', async () => {
      // Arrange
      const req = { user: { userId: 'test-user-id' } };
      const notificationId = 'notif-1';
      mockNotificationService.deleteNotification.mockResolvedValue(undefined);

      // Act
      const result = await controller.deleteNotification(notificationId, req);

      // Assert
      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith(notificationId, 'test-user-id');
      expect(result).toEqual({ message: 'Notification deleted' });
    });
  });
});