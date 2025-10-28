// src/api/notificationApi.js
import axiosClient from "./axiosClient";

const notificationApi = {
  // Get all notifications for the user
  getNotifications: (page = 1, limit = 20) =>
    axiosClient.get("/notifications", {
      params: { page, limit }
    }),

  // Mark notification as read
  markAsRead: (notificationId) =>
    axiosClient.put(`/notifications/${notificationId}/read`),

  // Mark all notifications as read
  markAllAsRead: () =>
    axiosClient.put("/notifications/read-all"),

  // Get unread notification count
  getUnreadCount: () =>
    axiosClient.get("/notifications/unread-count"),

  // Delete notification
  deleteNotification: (notificationId) =>
    axiosClient.delete(`/notifications/${notificationId}`),

  // Clear all notifications
  clearAllNotifications: () =>
    axiosClient.delete("/notifications/clear-all"),

  // Update notification settings
  updateSettings: (settings) =>
    axiosClient.put("/notifications/settings", settings),

  // Get notification settings
  getSettings: () =>
    axiosClient.get("/notifications/settings"),

  // Subscribe to push notifications
  subscribeToPush: (subscription) =>
    axiosClient.post("/notifications/push/subscribe", subscription),

  // Unsubscribe from push notifications
  unsubscribeFromPush: () =>
    axiosClient.post("/notifications/push/unsubscribe"),
};

export default notificationApi;