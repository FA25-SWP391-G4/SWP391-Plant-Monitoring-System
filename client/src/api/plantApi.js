import axiosClient from './axiosClient';

const plantApi = {
  // Get all plants for the authenticated user
  getAll: async () => {
    try {
      const response = await axiosClient.get('/plants');
      return response.data;
    } catch (error) {
      console.error('Error fetching plants:', error);
      throw error;
    }
  },

  // Get a specific plant by ID
  getById: async (plantId) => {
    try {
      const response = await axiosClient.get(`/plants/${plantId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching plant ${plantId}:`, error);
      throw error;
    }
  },

  // Water a plant manually
  waterPlant: async (plantId, duration) => {
    try {
      const response = await axiosClient.post(`/plants/${plantId}/water`, { duration });
      return response.data;
    } catch (error) {
      console.error(`Error watering plant ${plantId}:`, error);
      throw error;
    }
  },

  // Get watering schedule for a plant
  getWateringSchedule: async (plantId) => {
    try {
      const response = await axiosClient.get(`/plants/${plantId}/schedule`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching watering schedule for plant ${plantId}:`, error);
      throw error;
    }
  },

  // Set watering schedule for a plant
  setWateringSchedule: async (plantId, schedule) => {
    try {
      const response = await axiosClient.post(`/plants/${plantId}/schedule`, schedule);
      return response.data;
    } catch (error) {
      console.error(`Error setting watering schedule for plant ${plantId}:`, error);
      throw error;
    }
  },

  // Toggle auto-watering for a plant
  toggleAutoWatering: async (plantId, enabled) => {
    try {
      const response = await axiosClient.put(`/plants/${plantId}/auto-watering`, { enabled });
      return response.data;
    } catch (error) {
      console.error(`Error toggling auto-watering for plant ${plantId}:`, error);
      throw error;
    }
  },

  // Set sensor thresholds for a plant
  setSensorThresholds: async (plantId, thresholds) => {
    try {
      const response = await axiosClient.put(`/plants/${plantId}/thresholds`, thresholds);
      return response.data;
    } catch (error) {
      console.error(`Error setting thresholds for plant ${plantId}:`, error);
      throw error;
    }
  }
};

export default plantApi;