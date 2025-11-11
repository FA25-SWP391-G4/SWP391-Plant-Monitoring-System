/**
 * Settings API - Frontend client for user settings management
 * 
 * Provides methods for:
 * - General settings CRUD operations
 * - Dashboard widget preferences
 * - Notification settings
 * - Privacy settings
 * - Appearance settings
 */

import axiosClient from "./axiosClient";

const settingsApi = {
  // General settings
  getUserSettings: () => axiosClient.get("/api/settings"),
  updateUserSettings: (settings) => axiosClient.put("/api/settings", settings),
  updateSettingCategory: (category, settings) => axiosClient.patch(`/api/settings/${category}`, settings),

  // Dashboard widget settings
  getWidgetSettings: () => axiosClient.get("/api/settings/widgets"),
  updateWidgetSettings: (widgetSettings) => axiosClient.put("/api/settings/widgets", widgetSettings),
  resetWidgetSettings: () => axiosClient.post("/api/settings/widgets/reset"),

  // Notification settings
  getNotificationSettings: () => axiosClient.get("/api/settings/notifications"),
  updateNotificationSettings: (notificationSettings) => axiosClient.put("/api/settings/notifications", notificationSettings),

  // Privacy settings
  getPrivacySettings: () => axiosClient.get("/api/settings/privacy"),
  updatePrivacySettings: (privacySettings) => axiosClient.put("/api/settings/privacy", privacySettings),

  // Appearance settings
  getAppearanceSettings: () => axiosClient.get("/api/settings/appearance"),
  updateAppearanceSettings: (appearanceSettings) => axiosClient.put("/api/settings/appearance", appearanceSettings),
};

export default settingsApi;