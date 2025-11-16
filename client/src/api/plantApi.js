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

  /**
   * Get details for a single plant by id.
   * Example response: { id, name, thresholds, device_id, ... }
   */
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

  /**
   * Fetch recent sensor history (default window: last 12 hours).
   * Use this to show charts or trend lines in the UI.
   */
  getSensorHistory: async (plantId) => {
    try {
      const response = await axiosClient.get(`/api/plants/${plantId}/history/sensors`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sensor history:', error);
      throw error;
    }
  },

  /**
   * Get aggregated sensor statistics for a plant (averages, mins, maxes).
   */
  getSensorStats: async (plantId) => {
    try {
      const response = await axiosClient.get(`/api/plants/${plantId}/stats/sensors`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sensor stats:', error);
      throw error;
    }
  },

  /**
   * Get recent watering history entries for a plant.
   * Useful to display a log of past watering events in the UI.
   */
  getWateringHistory: async (plantId) => {
    try {
      const response = await axiosClient.get(`/api/plants/${plantId}/history/watering`);
      return response.data;
    } catch (error) {
      console.error('Error fetching watering history:', error);
      throw error;
    }
  },

  /**
   * Returns the most recent watering event (single object) for the plant.
   * This endpoint is used by the UI to detect when watering completes.
   * Example return: { timestamp: '2025-11-16T...', duration_seconds: 30 }
   */
  getLastWatered: async (plantId) => {
    try {
      const response = await axiosClient.get(`/api/plants/${plantId}/last-watered`);
      return response.data;
    } catch (error) {
      console.error('Error fetching last watered info:', error);
      throw error;
    }
  },

  /**
   * Persist a set of schedules for the plant.
   * `schedule` should be a payload shape that the server expects (often an array).
   */
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

  /**
   * Update sensor thresholds for a plant.
   * `thresholds` expected example: { moisture: 30, temperature: 28 }
   */
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