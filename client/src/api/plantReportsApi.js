import axiosClient from './axiosClient';

const plantReportsApi = {
  // Get comprehensive health report for a plant
  getPlantHealthReport: (plantId) => {
    return axiosClient.get(`/api/reports/plants/${plantId}/health`);
  },
  
  // Get historical sensor data with filters
  getHistoricalData: (plantId, params) => {
    return axiosClient.get(`/api/reports/plants/${plantId}/history`, { params });
  },
  
  // Get water consumption report
  getWaterConsumption: (plantId, timeRange) => {
    return axiosClient.get(`/api/reports/plants/${plantId}/water-usage`, {
      params: { timeRange }
    });
  },
  
  // Get plant distribution statistics
  getPlantDistribution: () => {
    return axiosClient.get('/api/reports/plants/distribution');
  },
  
  // Generate detailed PDF report
  generatePdfReport: (plantId, reportType) => {
    return axiosClient.get(`/api/reports/plants/${plantId}/export-pdf`, {
      params: { reportType },
      responseType: 'blob'
    });
  },
  
  // Get all available reports for a plant
  getAllReports: (plantId) => {
    return axiosClient.get(`/api/reports/plants/${plantId}`);
  }
};

export default plantReportsApi;