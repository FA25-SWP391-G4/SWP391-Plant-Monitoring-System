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
  /**
   * Fetch all plants for the authenticated user.
   * The server historically returned either a plain array or an object
   * { success, data }. This helper normalizes both shapes to always return
   * the array (or whatever the server places in `data`).
   */
  getAll: async () => {
    try {
      const response = await axiosClient.get('/api/plants');
      // Handle both old format (direct array) and new format (with success wrapper)
      return response.data && response.data.success ? response.data.data : response.data;
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

  /**
   * Send a manual water command for a plant.
   * - To start watering: call with `duration` (seconds) and no `action`.
   * - To explicitly stop watering: set `action` === 'pump_off'.
   * The server endpoint accepts either { duration } or { action }.
   */
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

  /**
   * Retrieve the watering schedule stored for a plant.
   * Expected shape depends on server implementation (array of schedule objects).
   */
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

  // Connect device to plant
  connectDevice: async (plantId, deviceId) => {
    try {
      const response = await axiosClient.put(`/api/plants/${plantId}/connect-device`, { deviceId });
      return response.data;
    } catch (error) {
      console.error(`Error connecting device to plant ${plantId}:`, error);
      throw error;
    }
  },

  // Get current sensor data for a plant
  getCurrentSensorData: async (plantId) => {
    try {
      const response = await axiosClient.get(`/api/plants/${plantId}/sensors/current`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching current sensor data for plant ${plantId}:`, error);
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