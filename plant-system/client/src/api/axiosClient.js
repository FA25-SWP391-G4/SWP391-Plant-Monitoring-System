// src/api/axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
  withCredentials: true, // if backend uses cookies
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
