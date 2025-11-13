// src/api/userApi.js
import axiosClient from "./axiosClient";

const userApi = {
  // Get current user profile
  getProfile: async () => {
    const response = await axiosClient.get("/users/profile");
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await axiosClient.put("/users/profile", userData);
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (formData) => {
    const response = await axiosClient.post("/users/profile/picture", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Update user settings
  updateSettings: async (settings) => {
    const response = await axiosClient.put("/users/settings", settings);
    return response.data;
  },

  // Get user preferences
  getPreferences: async () => {
    const response = await axiosClient.get("/users/preferences");
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    const response = await axiosClient.put("/users/preferences", preferences);
    return response.data;
  },

  // Delete account
  deleteAccount: async (password) => {
    const response = await axiosClient.delete("/users/account", { data: { password } });
    return response.data;
  },

  // Get subscription info
  getUserSubscription: async () => {
    const response = await axiosClient.get("/users/subscription");
    return response.data;
  },

  // Cancel subscription
  cancelSubscription: async () => {
    const response = await axiosClient.post("/users/subscription/cancel");
    return response.data;
  },
};

export default userApi;
