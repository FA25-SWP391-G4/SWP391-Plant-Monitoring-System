// src/api/authApi.js
import axiosClient from "./axiosClient";

const authApi = {
  // User Registration
  register: (email, password, confirmPassword, given_name, family_name, phoneNumber, newsletter) =>
    axiosClient.post("/auth/register", { 
      email, 
      password, 
      confirmPassword,
      given_name,
      family_name,
      phoneNumber,
      newsletter
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
  resetPassword: (token, newPassword) =>
    axiosClient.post("/auth/reset-password", { token, newPassword }),

  // Get Current User Profile
  getCurrentUser: () =>
    axiosClient.get("/auth/me"),

  // Update User Profile
  updateProfile: (profileData) =>
    axiosClient.put("/auth/profile", profileData),

  // Verify Email
  verifyEmail: (token) =>
    axiosClient.get(`/auth/verify-email/${token}`),

  // Resend Verification Email
  resendVerification: () =>
    axiosClient.post("/auth/resend-verification"),
};

export default authApi;
