<<<<<<< HEAD
// client/src/api/sensorApi.js
import axiosClient from './axiosClient';

const sensorApi = {
  async getLatest() {
    // Express backend endpoint you already confirmed works:
    const url = '/api/sensor/latest';
    const res = await axiosClient.get(url);
    return res.data;
  },
};

export default sensorApi;
=======
// src/api/sensorApi.js
import axiosClient from "./axiosClient";

const sensorApi = {
  // Get all sensor data for a plant
  getSensorData: (plantId, timeRange = '24h') =>
    axiosClient.get(`/sensor/${plantId}/data?timeRange=${timeRange}`),

  // Get latest sensor readings for a plant
  getLatestReadings: (plantId) =>
    axiosClient.get(`/sensor/${plantId}/latest`),

  // Get historical sensor data with pagination
  getHistoricalData: (plantId, startDate, endDate, limit = 100, offset = 0) =>
    axiosClient.get(`/sensor/${plantId}/history`, {
      params: { startDate, endDate, limit, offset }
    }),

  // Get sensor data summary (averages, min/max)
  getSensorSummary: (plantId, period = 'daily') =>
    axiosClient.get(`/sensor/${plantId}/summary?period=${period}`),

  // Get all sensors for a user
  getUserSensors: () =>
    axiosClient.get("/sensor/user/sensors"),

  // Update sensor configuration
  updateSensorConfig: (sensorId, config) =>
    axiosClient.put(`/sensor/${sensorId}/config`, config),

  // Calibrate sensor
  calibrateSensor: (sensorId, calibrationData) =>
    axiosClient.post(`/sensor/${sensorId}/calibrate`, calibrationData),

  // Get sensor status
  getSensorStatus: (sensorId) =>
    axiosClient.get(`/sensor/${sensorId}/status`),
};

export default sensorApi;
>>>>>>> 1d1e2513b9e8ac5f36f74d326d2a76f901e82987
