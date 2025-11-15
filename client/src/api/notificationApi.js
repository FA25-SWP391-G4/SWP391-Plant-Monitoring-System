// src/api/notificationApi.js
import axiosClient from "./axiosClient";

const notificationApi = {
  // Get all notifications for the user
  getNotifications: (params = {}) => {
    const { page = 1, limit = 20, type, status, priority } = params;
    return axiosClient.get("/notifications", {
      params: { page, limit, type, status, priority }
    });
  },

  // Get unread notifications
  getUnreadNotifications: () =>
    axiosClient.get("/notifications/unread"),

  // Get notification statistics
  getNotificationStats: () =>
    axiosClient.get("/notifications/stats"),

  // Get notifications by type
  getNotificationsByType: (type, params = {}) => {
    const { limit = 50, status } = params;
    return axiosClient.get(`/notifications/by-type/${type}`, {
      params: { limit, status }
    });
  },

  // Mark notification as read
  markAsRead: (notificationId) =>
    axiosClient.put(`/notifications/${notificationId}/read`),

  // Mark all notifications as read
  markAllAsRead: () =>
    axiosClient.put("/notifications/read-all"),

  // Delete notification
  deleteNotification: (notificationId) =>
    axiosClient.delete(`/notifications/${notificationId}`),

  // Delete expired notifications
  deleteExpiredNotifications: () =>
    axiosClient.delete("/notifications/expired"),

  // Create test notification (development only)
  createTestNotification: (data = {}) =>
    axiosClient.post("/notifications/test", data),

  // Get notification preferences
  getPreferences: () =>
    axiosClient.get("/notifications/preferences"),

  // Update notification preferences
  updatePreferences: (preferences) =>
    axiosClient.put("/notifications/preferences", preferences),

  // Legacy compatibility methods
  getUnreadCount: () =>
    notificationApi.getNotificationStats().then(response => ({
      data: { count: response.data.unread }
    })),

  clearAllNotifications: () =>
    notificationApi.markAllAsRead(),

  getSettings: () =>
    notificationApi.getPreferences(),

  updateSettings: (settings) =>
    notificationApi.updatePreferences(settings),

  // Subscribe to push notifications
  subscribeToPush: (subscription) =>
    axiosClient.post("/notifications/push/subscribe", subscription),

  // Unsubscribe from push notifications
  unsubscribeFromPush: () =>
    axiosClient.post("/notifications/push/unsubscribe"),

  // Enhanced utility methods
  bulkMarkAsRead: async (notificationIds) => {
    const promises = notificationIds.map(id => notificationApi.markAsRead(id));
    return Promise.all(promises);
  },

  bulkDelete: async (notificationIds) => {
    const promises = notificationIds.map(id => notificationApi.deleteNotification(id));
    return Promise.all(promises);
  },

  // Real-time notification polling
  startPolling: (callback, interval = 30000) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await notificationApi.getNotificationStats();
        callback(response.data);
      } catch (error) {
        console.error('Notification polling error:', error);
      }
    }, interval);

    return {
      stop: () => clearInterval(pollInterval)
    };
  }
};

export default notificationApi;