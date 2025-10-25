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
    })
};

export default userApi;
