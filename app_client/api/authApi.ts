// src/api/authApi.ts
import axiosClient from "./axiosClient";

interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  given_name: string;
  family_name: string;
  phoneNumber: string;
  newsletter: boolean;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

interface UpdateProfilePayload {
  given_name?: string;
  family_name?: string;
  phoneNumber?: string;
  [key: string]: any;
}

const authApi = {
  // User Registration
  register: (payload: RegisterPayload) =>
    axiosClient.post("/auth/register", payload),

  // User Login
  login: (email: string, password: string) =>
    axiosClient.post("/auth/login", { email, password }),

  // Google Login - Updated to use credential token from Google Identity Services
  loginWithGoogle: (credential: string) =>
    axiosClient.post("/auth/google-login", { credential }),

  // User Logout
  logout: () =>
    axiosClient.post("/auth/logout"),

  // Change Password
  changePassword: (payload: ChangePasswordPayload) =>
    axiosClient.put("/auth/change-password", payload),

  // Forgot Password
  forgotPassword: (email: string) =>
    axiosClient.post("/auth/forgot-password", { email }),

  // Reset Password
  resetPassword: (token: string, newPassword: string) =>
    axiosClient.post("/auth/reset-password", { token, newPassword }),

  // Get Current User Profile
  getCurrentUser: () =>
    axiosClient.get("/auth/me"),

  // Update User Profile
  updateProfile: (profileData: UpdateProfilePayload) =>
    axiosClient.put("/auth/profile", profileData),

  // Verify Email
  verifyEmail: (token: string) =>
    axiosClient.get(`/auth/verify-email/${token}`),

  // Resend Verification Email
  resendVerification: () =>
    axiosClient.post("/auth/resend-verification"),

  // Refresh JWT token with updated user data
  refreshToken: () =>
    axiosClient.post("/auth/refresh-token"),
};

export default authApi;
