// src/api/reportApi.js
import axiosClient from "./axiosClient";

/**
 * Admin Reports API
 * Mirrors the lightweight helper style used in adminApi for consistency.
 */
const reportApi = {
  // Fetch aggregated report data (users, devices, etc.)
  getReports: (params) =>
    axiosClient.get("/admin/reports", { params }),

  // Fetch profit analysis dataset for selected period
  getProfitAnalysis: (params) =>
    axiosClient.get("/admin/profit-analysis", { params }),

  // Download reports (CSV, PDF, etc.) with blob response
  downloadReport: (params) =>
    axiosClient.get("/admin/reports", {
      params,
      responseType: "blob",
    }),
};

export default reportApi;