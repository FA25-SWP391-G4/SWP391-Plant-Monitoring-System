import axiosClient from './axiosClient';

/**
 * Client-side wrapper for Plant-related API endpoints.
 *
 * Each function returns the parsed response data from the server. The
 * functions intentionally rethrow errors so callers (UI components) can
 * decide how to present failures to the user (toasts, alerts, retries).
 *
 * Note: `axiosClient` centralizes Authorization header/token handling and
 * base URL configuration. Avoid duplicating token logic in this module.
 */
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
  waterPlant: async (plantId, duration, action) => {
    try {
      // If frontend wants to stop watering, call with action = 'pump_off'
      const payload = action ? { action } : { duration };
      const response = await axiosClient.post(`/api/plants/${plantId}/water`, payload);
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

  /**
   * Convenience helper to trigger a short water action immediately.
   * Note: some backends implement `/water-now` separately from `/water` for
   * convenience; this wrapper calls that endpoint with a default duration.
   */
  waterNow: async (plantId, duration = 10) => {
    try {
      const response = await axiosClient.post(`/api/plants/${plantId}/water-now`, { duration });
      return response.data;
    } catch (error) {
      console.error(`Error triggering waterNow for plant ${plantId}:`, error);
      throw error;
    }
  },

  /**
   * Toggle server-side auto-watering feature for a plant.
   * `enabled` should be boolean.
   */
  toggleAutoWatering: async (plantId, enabled) => {
    try {
      const response = await axiosClient.post(`/api/plants/${plantId}/auto-watering`, { enabled });
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
  },

  // Update plant information
  update: async (plantId, plantData) => {
    try {
      const response = await axiosClient.put(`/api/plants/${plantId}`, plantData);
      return response.data;
    } catch (error) {
      console.error(`Error updating plant ${plantId}:`, error);
      throw error;
    }
  },

  // Delete a plant
  delete: async (plantId) => {
    try {
      const response = await axiosClient.delete(`/api/plants/${plantId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting plant ${plantId}:`, error);
      throw error;
    }
  }
};

export default plantApi;