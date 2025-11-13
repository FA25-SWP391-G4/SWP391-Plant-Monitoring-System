// src/api/userApi.js
import axiosClient from "./axiosClient";

const userApi = {
  // Get current user profile
  getProfile: () =>
    axiosClient.get("/user/profile"),

  // Update user profile
  updateProfile: (userData) =>
    axiosClient.put("/user/profile", userData),

  // Upload profile picture
  uploadProfilePicture: (formData) =>
    axiosClient.post("/user/profile/picture", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),

  // Update user settings
  updateSettings: (settings) =>
    axiosClient.put("/user/settings", settings),

  // Get user preferences
  getPreferences: () =>
    axiosClient.get("/user/preferences"),

  // Update user preferences
  updatePreferences: (preferences) =>
    axiosClient.put("/user/preferences", preferences),

  // Delete account
  deleteAccount: (password) =>
    axiosClient.delete("/user/account", { data: { password } }),

  // Get subscription info
  getUserSubscription: () =>
    axiosClient.get("/user/subscription"),

  // Cancel subscription
  cancelSubscription: () =>
    axiosClient.post("/user/subscription/cancel"),
};

export default userApi;
