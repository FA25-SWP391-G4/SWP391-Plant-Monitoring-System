import notificationApi from './notificationApi';
import axiosClient from './axiosClient';

// Mock axiosClient
jest.mock('./axiosClient', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
}));

describe('notificationApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('getNotifications', () => {
        it('should get notifications with default parameters', async () => {
            const mockResponse = { data: { notifications: [] } };
            axiosClient.get.mockResolvedValue(mockResponse);

            const result = await notificationApi.getNotifications();

            expect(axiosClient.get).toHaveBeenCalledWith('/notifications', {
                params: { page: 1, limit: 20, type: undefined, status: undefined, priority: undefined }
            });
            expect(result).toBe(mockResponse);
        });

        it('should get notifications with custom parameters', async () => {
            const params = { page: 2, limit: 10, type: 'alert', status: 'unread', priority: 'high' };
            const mockResponse = { data: { notifications: [] } };
            axiosClient.get.mockResolvedValue(mockResponse);

            await notificationApi.getNotifications(params);

            expect(axiosClient.get).toHaveBeenCalledWith('/notifications', { params });
        });
    });

    describe('getUnreadNotifications', () => {
        it('should get unread notifications', async () => {
            const mockResponse = { data: { notifications: [] } };
            axiosClient.get.mockResolvedValue(mockResponse);

            const result = await notificationApi.getUnreadNotifications();

            expect(axiosClient.get).toHaveBeenCalledWith('/notifications/unread');
            expect(result).toBe(mockResponse);
        });
    });

    describe('getNotificationStats', () => {
        it('should get notification statistics', async () => {
            const mockResponse = { data: { total: 10, unread: 5 } };
            axiosClient.get.mockResolvedValue(mockResponse);

            const result = await notificationApi.getNotificationStats();

            expect(axiosClient.get).toHaveBeenCalledWith('/notifications/stats');
            expect(result).toBe(mockResponse);
        });
    });

    describe('getNotificationsByType', () => {
        it('should get notifications by type with default parameters', async () => {
            const mockResponse = { data: { notifications: [] } };
            axiosClient.get.mockResolvedValue(mockResponse);

            await notificationApi.getNotificationsByType('alert');

            expect(axiosClient.get).toHaveBeenCalledWith('/notifications/by-type/alert', {
                params: { limit: 50, status: undefined }
            });
        });

        it('should get notifications by type with custom parameters', async () => {
            const params = { limit: 25, status: 'read' };
            axiosClient.get.mockResolvedValue({ data: {} });

            await notificationApi.getNotificationsByType('warning', params);

            expect(axiosClient.get).toHaveBeenCalledWith('/notifications/by-type/warning', { params });
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
            const mockResponse = { data: { success: true } };
            axiosClient.put.mockResolvedValue(mockResponse);

            const result = await notificationApi.markAsRead('123');

            expect(axiosClient.put).toHaveBeenCalledWith('/notifications/123/read');
            expect(result).toBe(mockResponse);
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read', async () => {
            const mockResponse = { data: { success: true } };
            axiosClient.put.mockResolvedValue(mockResponse);

            const result = await notificationApi.markAllAsRead();

            expect(axiosClient.put).toHaveBeenCalledWith('/notifications/read-all');
            expect (result).toBe(mockResponse);
        });
    });

    describe('deleteNotification', () => {
        it('should delete notification', async () => {
            const mockResponse = { data: { success: true } };
            axiosClient.delete.mockResolvedValue(mockResponse);

            const result = await notificationApi.deleteNotification('123');

            expect(axiosClient.delete).toHaveBeenCalledWith('/notifications/123');
            expect(result).toBe(mockResponse);
        });
    });

    describe('deleteExpiredNotifications', () => {
        it('should delete expired notifications', async () => {
            const mockResponse = { data: { deleted: 5 } };
            axiosClient.delete.mockResolvedValue(mockResponse);

            const result = await notificationApi.deleteExpiredNotifications();

            expect(axiosClient.delete).toHaveBeenCalledWith('/notifications/expired');
            expect(result).toBe(mockResponse);
        });
    });

    describe('createTestNotification', () => {
        it('should create test notification with default data', async () => {
            const mockResponse = { data: { id: '123' } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await notificationApi.createTestNotification();

            expect(axiosClient.post).toHaveBeenCalledWith('/notifications/test', {});
            expect(result).toBe(mockResponse);
        });

        it('should create test notification with custom data', async () => {
            const data = { title: 'Test', message: 'Test message' };
            axiosClient.post.mockResolvedValue({ data: {} });

            await notificationApi.createTestNotification(data);

            expect(axiosClient.post).toHaveBeenCalledWith('/notifications/test', data);
        });
    });

    describe('getPreferences', () => {
        it('should get notification preferences', async () => {
            const mockResponse = { data: { email: true, push: false } };
            axiosClient.get.mockResolvedValue(mockResponse);

            const result = await notificationApi.getPreferences();

            expect(axiosClient.get).toHaveBeenCalledWith('/notifications/preferences');
            expect(result).toBe(mockResponse);
        });
    });

    describe('updatePreferences', () => {
        it('should update notification preferences', async () => {
            const preferences = { email: true, push: true };
            const mockResponse = { data: { success: true } };
            axiosClient.put.mockResolvedValue(mockResponse);

            const result = await notificationApi.updatePreferences(preferences);

            expect(axiosClient.put).toHaveBeenCalledWith('/notifications/preferences', preferences);
            expect(result).toBe(mockResponse);
        });
    });

    describe('Legacy compatibility methods', () => {
        it('should get unread count', async () => {
            const mockResponse = { data: { unread: 5 } };
            axiosClient.get.mockResolvedValue(mockResponse);

            const result = await notificationApi.getUnreadCount();

            expect(result).toEqual({ data: { count: 5 } });
        });

        it('should clear all notifications', async () => {
            axiosClient.put.mockResolvedValue({ data: {} });

            await notificationApi.clearAllNotifications();

            expect(axiosClient.put).toHaveBeenCalledWith('/notifications/read-all');
        });

        it('should get settings', async () => {
            axiosClient.get.mockResolvedValue({ data: {} });

            await notificationApi.getSettings();

            expect(axiosClient.get).toHaveBeenCalledWith('/notifications/preferences');
        });

        it('should update settings', async () => {
            const settings = { email: false };
            axiosClient.put.mockResolvedValue({ data: {} });

            await notificationApi.updateSettings(settings);

            expect(axiosClient.put).toHaveBeenCalledWith('/notifications/preferences', settings);
        });
    });

    describe('Push notification methods', () => {
        it('should subscribe to push notifications', async () => {
            const subscription = { endpoint: 'test-endpoint' };
            const mockResponse = { data: { success: true } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await notificationApi.subscribeToPush(subscription);

            expect(axiosClient.post).toHaveBeenCalledWith('/notifications/push/subscribe', subscription);
            expect(result).toBe(mockResponse);
        });

        it('should unsubscribe from push notifications', async () => {
            const mockResponse = { data: { success: true } };
            axiosClient.post.mockResolvedValue(mockResponse);

            const result = await notificationApi.unsubscribeFromPush();

            expect(axiosClient.post).toHaveBeenCalledWith('/notifications/push/unsubscribe');
            expect(result).toBe(mockResponse);
        });
    });

    describe('Enhanced utility methods', () => {
        it('should bulk mark notifications as read', async () => {
            const notificationIds = ['1', '2', '3'];
            axiosClient.put.mockResolvedValue({ data: { success: true } });

            await notificationApi.bulkMarkAsRead(notificationIds);

            expect(axiosClient.put).toHaveBeenCalledTimes(3);
            expect(axiosClient.put).toHaveBeenCalledWith('/notifications/1/read');
            expect(axiosClient.put).toHaveBeenCalledWith('/notifications/2/read');
            expect(axiosClient.put).toHaveBeenCalledWith('/notifications/3/read');
        });

        it('should bulk delete notifications', async () => {
            const notificationIds = ['1', '2'];
            axiosClient.delete.mockResolvedValue({ data: { success: true } });

            await notificationApi.bulkDelete(notificationIds);

            expect(axiosClient.delete).toHaveBeenCalledTimes(2);
            expect(axiosClient.delete).toHaveBeenCalledWith('/notifications/1');
            expect(axiosClient.delete).toHaveBeenCalledWith('/notifications/2');
        });
    });

    describe('startPolling', () => {
        it('should start polling with default interval', () => {
            const mockCallback = jest.fn();
            const mockResponse = { data: { total: 10, unread: 5 } };
            axiosClient.get.mockResolvedValue(mockResponse);

            const poller = notificationApi.startPolling(mockCallback);

            expect(typeof poller.stop).toBe('function');
        });

        it('should call callback on polling interval', async () => {
            const mockCallback = jest.fn();
            const mockResponse = { data: { total: 10, unread: 5 } };
            axiosClient.get.mockResolvedValue(mockResponse);

            notificationApi.startPolling(mockCallback, 1000);

            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            expect(axiosClient.get).toHaveBeenCalledWith('/notifications/stats');
            expect(mockCallback).toHaveBeenCalledWith(mockResponse.data);
        });

        it('should handle polling errors gracefully', async () => {
            const mockCallback = jest.fn();
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            axiosClient.get.mockRejectedValue(new Error('Network error'));

            notificationApi.startPolling(mockCallback, 1000);

            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            expect(consoleErrorSpy).toHaveBeenCalledWith('Notification polling error:', expect.any(Error));
            consoleErrorSpy.mockRestore();
        });

        it('should stop polling when stop is called', () => {
            const mockCallback = jest.fn();
            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

            const poller = notificationApi.startPolling(mockCallback);
            poller.stop();

            expect(clearIntervalSpy).toHaveBeenCalled();
            clearIntervalSpy.mockRestore();
        });
    });
});