import axiosClient from './axiosClient';

const deviceApi = {
  // Get all devices for the authenticated user
  getAll: async () => {
    try {
      const response = await axiosClient.get('/api/devices');
      return response.data;
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  },

  // Get a specific device by ID
  getById: async (deviceId) => {
    try {
      const response = await axiosClient.get(`/api/devices/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching device ${deviceId}:`, error);
      throw error;
    }
  },
  
  // Get the latest sensor data for all devices
  getLatestSensorData: async () => {
    try {
      const response = await axiosClient.get('/api/sensor/latest');
      return response.data;
    } catch (error) {
      console.error('Error fetching latest sensor data:', error);
      throw error;
    }
  },

  // Get sensor data history for a device
  getSensorHistory: async (deviceId, params = {}) => {
    try {
      const response = await axiosClient.get(`/api/sensor/history/${deviceId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching sensor history for device ${deviceId}:`, error);
      throw error;
    }
  },
  
  // Register a new device
  registerDevice: async (deviceData) => {
    try {
      const response = await axiosClient.post('/api/devices', deviceData);
      return response.data;
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  },
  
  // Update device information
  updateDevice: async (deviceId, deviceData) => {
    try {
      const response = await axiosClient.put(`/api/devices/${deviceId}`, deviceData);
      return response.data;
    } catch (error) {
      console.error(`Error updating device ${deviceId}:`, error);
      throw error;
    }
  },
  
  // Delete a device
  deleteDevice: async (deviceId) => {
    try {
      const response = await axiosClient.delete(`/api/devices/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting device ${deviceId}:`, error);
      throw error;
    }
  }
};

export default deviceApi;