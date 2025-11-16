// src/api/adminApi.js
import axiosClient from "./axiosClient";

/**
 * Admin API - For admin dashboard and management operations.
 * All routes require JWT authentication and Admin role.
 */
const adminApi = {
  // Get all users (with optional query params: page, limit, search)
  getUsers: (params) =>
    axiosClient.get("/admin/users", { params }),

  // Get single user by ID
  getUserById: (userId) =>
    axiosClient.get(`/admin/users/${userId}`),

  // Update user (admin privileges)
  updateUser: (userId, updateData) =>
    axiosClient.put(`/admin/users/${userId}`, updateData),

  // Delete user
  deleteUser: (userId) =>
    axiosClient.delete(`/admin/users/${userId}`),

  // Get all payments (with optional filters)
  getPayments: (params) =>
    axiosClient.get("/admin/payments", { params }),

  // Get system logs (with optional filters)
  getSystemLogs: (params) =>
    axiosClient.get("/admin/system-logs", { params }),

  // Get all plants (admin view)
  getAllPlants: (params) =>
    axiosClient.get("/admin/plants", { params }),

  // Get all devices (admin view)
  getAllDevices: (params) =>
    axiosClient.get("/admin/devices", { params }),

  // Get AI model management info
  getAIModels: (params) =>
    axiosClient.get("/admin/ai-models", { params }),

  // Update AI model (e.g., activate/deactivate)
  updateAIModel: (modelId, updateData) =>
    axiosClient.put(`/admin/ai-models/${modelId}`, updateData),

  // Trigger system-wide notification
  sendNotification: (payload) =>
    axiosClient.post("/admin/notifications", payload),
};

export default adminApi;