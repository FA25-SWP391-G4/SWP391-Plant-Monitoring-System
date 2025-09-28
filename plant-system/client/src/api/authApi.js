// src/api/authApi.js
import axiosClient from "./axiosClient";

const authApi = {
  login: (email, password) =>
    axiosClient.post("/auth/login", { email, password }),

  changePassword: (payload) =>
    axiosClient.put("/auth/change-password", payload),

  forgotPassword: (email) =>
    axiosClient.post("/auth/forgot-password", { email }),

  resetPassword: (token, newPassword) =>
    axiosClient.post("/auth/reset-password", { token, newPassword }),

  // For Google login when backend is ready
  loginWithGoogle: () => axiosClient.get("/auth/google"),
};

export default authApi;
