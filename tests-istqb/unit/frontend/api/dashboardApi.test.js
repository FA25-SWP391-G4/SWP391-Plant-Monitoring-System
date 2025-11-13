import dashboardApi from './dashboardApi';
import axiosClient from './axiosClient';

// Mock axiosClient
jest.mock('./axiosClient', () => ({
    get: jest.fn(),
    put: jest.fn(),
}));

describe('dashboardApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getLayout', () => {
        it('should call axiosClient.get with correct endpoint', async () => {
            const mockResponse = { data: { layout: 'grid' } };
            axiosClient.get.mockResolvedValue(mockResponse);

            await dashboardApi.getLayout();

            expect(axiosClient.get).toHaveBeenCalledWith('/dashboard/layout');
        });
    });

    describe('saveLayout', () => {
        it('should call axiosClient.put with correct endpoint and data', async () => {
            const layout = { type: 'grid', columns: 3 };
            const mockResponse = { data: { success: true } };
            axiosClient.put.mockResolvedValue(mockResponse);

            await dashboardApi.saveLayout(layout);

            expect(axiosClient.put).toHaveBeenCalledWith('/dashboard/layout', { layout });
        });
    });

    describe('getStats', () => {
        it('should call axiosClient.get with correct endpoint', async () => {
            const mockResponse = { data: { totalPlants: 5, activeDevices: 3 } };
            axiosClient.get.mockResolvedValue(mockResponse);

            await dashboardApi.getStats();

            expect(axiosClient.get).toHaveBeenCalledWith('/dashboard/stats');
        });
    });

    describe('getRecentActivities', () => {
        it('should call axiosClient.get with correct endpoint', async () => {
            const mockResponse = { data: [{ id: 1, activity: 'watered plant' }] };
            axiosClient.get.mockResolvedValue(mockResponse);

            await dashboardApi.getRecentActivities();

            expect(axiosClient.get).toHaveBeenCalledWith('/dashboard/activities');
        });
    });

    describe('getSystemHealth', () => {
        it('should call axiosClient.get with correct endpoint', async () => {
            const mockResponse = { data: { status: 'healthy', uptime: '99.9%' } };
            axiosClient.get.mockResolvedValue(mockResponse);

            await dashboardApi.getSystemHealth();

            expect(axiosClient.get).toHaveBeenCalledWith('/dashboard/health');
        });
    });

    describe('getWidgetData', () => {
        it('should call axiosClient.get with correct endpoint and widget type', async () => {
            const widgetType = 'temperature';
            const mockResponse = { data: { value: 25.5, unit: '°C' } };
            axiosClient.get.mockResolvedValue(mockResponse);

            await dashboardApi.getWidgetData(widgetType);

            expect(axiosClient.get).toHaveBeenCalledWith(`/dashboard/widget/${widgetType}`);
        });
    });

    describe('getNotifications', () => {
        it('should call axiosClient.get with correct endpoint', async () => {
            const mockResponse = { data: [{ id: 1, message: 'Plant needs water' }] };
            axiosClient.get.mockResolvedValue(mockResponse);

            await dashboardApi.getNotifications();

            expect(axiosClient.get).toHaveBeenCalledWith('/dashboard/notifications');
        });
    });

    describe('markNotificationRead', () => {
        it('should call axiosClient.put with correct endpoint and notification ID', async () => {
            const notificationId = 123;
            const mockResponse = { data: { success: true } };
            axiosClient.put.mockResolvedValue(mockResponse);

            await dashboardApi.markNotificationRead(notificationId);

            expect(axiosClient.put).toHaveBeenCalledWith(`/dashboard/notifications/${notificationId}/read`);
        });
    });

    describe('markAllNotificationsRead', () => {
        it('should call axiosClient.put with correct endpoint', async () => {
            const mockResponse = { data: { success: true } };
            axiosClient.put.mockResolvedValue(mockResponse);

            await dashboardApi.markAllNotificationsRead();

            expect(axiosClient.put).toHaveBeenCalledWith('/dashboard/notifications/read-all');
        });
    });
});