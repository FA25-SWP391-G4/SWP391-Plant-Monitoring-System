import axiosClient from './axiosClient';

const plantApi = {
  // Get all plants for the authenticated user
  getAll: async () => {
    try {
      const response = await axiosClient.get('/api/plants');
      // Handle both old format (direct array) and new format (with success wrapper)
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Error fetching plants:', error);
      throw error;
    }
  },

  // Get a specific plant by ID
  // [2025-11-06] Removed redundant token handling to fix JWT malformed error
  // Letting axiosClient handle token management to prevent duplication
  getById: async (plantId) => {
    try {
      const response = await axiosClient.get(`/api/plants/${plantId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching plant ${plantId}:`, error);
      throw error;
    }
  },

  // Water a plant manually
  waterPlant: async (plantId, duration) => {
    try {
      const response = await axiosClient.post(`/api/plants/${plantId}/water`, { duration });
      return response.data;
    } catch (error) {
      console.error(`Error watering plant ${plantId}:`, error);
      throw error;
    }
  },

  // Get watering schedule for a plant
  getWateringSchedule: async (plantId) => {
    try {
      const response = await axiosClient.get(`/api/plants/${plantId}/schedule`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching watering schedule for plant ${plantId}:`, error);
      throw error;
    }
  },

  // Get sensor history for last 12 hours
  getSensorHistory: async (plantId) => {
    try {
      const response = await axiosClient.get(`/api/plants/${plantId}/history/sensors`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sensor history:', error);
      throw error;
    }
  },

  // Get sensor statistics
  getSensorStats: async (plantId) => {
    try {
      const response = await axiosClient.get(`/api/plants/${plantId}/stats/sensors`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sensor stats:', error);
      throw error;
    }
  },

  // Get recent watering history
  getWateringHistory: async (plantId) => {
    try {
      const response = await axiosClient.get(`/api/plants/${plantId}/history/watering`);
      return response.data;
    } catch (error) {
      console.error('Error fetching watering history:', error);
      throw error;
    }
  },

  // Get last watered information
  getLastWatered: async (plantId) => {
    try {
      const response = await axiosClient.get(`/api/plants/${plantId}/last-watered`);
      return response.data;
    } catch (error) {
      console.error('Error fetching last watered info:', error);
      throw error;
    }
  },

  // Set watering schedule for a plant
  setWateringSchedule: async (plantId, schedule) => {
    try {
      const response = await axiosClient.post(`/api/plants/${plantId}/schedule`, schedule);
      return response.data;
    } catch (error) {
      console.error(`Error setting watering schedule for plant ${plantId}:`, error);
      throw error;
    }
  },

  // Toggle auto-watering for a plant
  toggleAutoWatering: async (plantId, enabled) => {
    try {
      const response = await axiosClient.put(`/api/plants/${plantId}/auto-watering`, { enabled });
      return response.data;
    } catch (error) {
      console.error(`Error toggling auto-watering for plant ${plantId}:`, error);
      throw error;
    }
  },

  // Set sensor thresholds for a plant
  setSensorThresholds: async (plantId, thresholds) => {
    try {
      const response = await axiosClient.put(`/api/plants/${plantId}/thresholds`, thresholds);
      return response.data;
    } catch (error) {
      console.error(`Error setting thresholds for plant ${plantId}:`, error);
      throw error;
    }
  }
};

export default plantApi;