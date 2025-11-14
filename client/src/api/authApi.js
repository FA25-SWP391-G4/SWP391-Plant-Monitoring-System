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

  // Google Login - Updated to use credential token from Google Identity Services
  loginWithGoogle: (credential) =>
    axiosClient.post("/auth/google-login", { credential }),

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
  resetPassword: (token, password, confirmPassword) =>
    axiosClient.post(`/auth/reset-password?token=${encodeURIComponent(token)}`, { password, confirmPassword }),
};

export default authApi;
