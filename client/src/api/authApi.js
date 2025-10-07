// src/api/authApi.js
import axiosClient from "./axiosClient";

const authApi = {
  // User Registration
  register: (email, password, confirmPassword, full_name) =>
    axiosClient.post("/auth/register", { 
      email, 
      password, 
      confirmPassword, 
      full_name 
    }),

  // User Login
  login: (email, password) =>
    axiosClient.post("/auth/login", { email, password }),

  // Google Login
  loginWithGoogle: (googleData) =>
    axiosClient.post("/auth/google-login", googleData),

  // User Logout
  logout: () =>
    axiosClient.post("/auth/logout"),

  // Change Password
  changePassword: (payload) =>
    axiosClient.put("/auth/change-password", payload),

  // Forgot Password
  forgotPassword: (email) =>
    axiosClient.post("/auth/forgot-password", { email }),

  // Reset Password
  resetPassword: (token, newPassword) =>
    axiosClient.post("/auth/reset-password", { token, newPassword }),
};

export default authApi;
