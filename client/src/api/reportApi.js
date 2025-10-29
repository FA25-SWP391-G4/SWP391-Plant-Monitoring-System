// src/api/reportApi.js
import axiosClient from "./axiosClient";

const reportApi = {
  // Generate plant health report
  generatePlantReport: (plantId, period = 'weekly') =>
    axiosClient.post(`/reports/plant/${plantId}`, { period }),

  // Get existing reports
  getReports: (type = 'all', limit = 10, offset = 0) =>
    axiosClient.get("/reports", {
      params: { type, limit, offset }
    }),

  // Get specific report by ID
  getReportById: (reportId) =>
    axiosClient.get(`/reports/${reportId}`),

  // Download report as PDF
  downloadReport: (reportId) =>
    axiosClient.get(`/reports/${reportId}/download`, {
      responseType: 'blob'
    }),

  // Generate system analytics report
  generateSystemReport: (startDate, endDate) =>
    axiosClient.post("/reports/system", { startDate, endDate }),

  // Get report templates
  getReportTemplates: () =>
    axiosClient.get("/reports/templates"),

  // Schedule automated report
  scheduleReport: (reportConfig) =>
    axiosClient.post("/reports/schedule", reportConfig),

  // Delete report
  deleteReport: (reportId) =>
    axiosClient.delete(`/reports/${reportId}`),
};

export default reportApi;