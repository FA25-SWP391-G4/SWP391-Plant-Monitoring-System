import axiosClient from "./axiosClient";

const dashboardApi = {
  // Dashboard layout
  getLayout: () => axiosClient.get("/dashboard/layout"),
  saveLayout: (layout) => axiosClient.put("/dashboard/layout", { layout }),

  // Dashboard stats
  getStats: () => axiosClient.get("/dashboard/stats"),

  // Recent activities
  getRecentActivities: () => axiosClient.get("/dashboard/activities"),

  // System health
  getSystemHealth: () => axiosClient.get("/dashboard/health"),

  // Widget data
  getWidgetData: (widgetType) => axiosClient.get(`/dashboard/widget/${widgetType}`),

  // Notifications
  getNotifications: () => axiosClient.get("/dashboard/notifications"),
  markNotificationRead: (notificationId) => axiosClient.put(`/dashboard/notifications/${notificationId}/read`),
  markAllNotificationsRead: () => axiosClient.put("/dashboard/notifications/read-all"),
};

export default dashboardApi;
