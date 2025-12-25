import axiosClient from './axiosClient';

// Mobile plantService uses shared axios client within app_client.
// Methods return the full axios response to match existing mobile usage.
const plantService = {
  // Get all plants for authenticated user
  getAllPlants: () => axiosClient.get('/api/plants'),

  // Get specific plant by id
  getPlantById: (plantId) => axiosClient.get(`/api/plants/${plantId}`),

  // Sensor history (align with web app endpoints)
  getSensorHistory: (plantId, params) =>
    axiosClient.get(`/api/plants/${plantId}/history/sensors`, { params }),

  // Sensor stats
  getSensorStats: (plantId, params) =>
    axiosClient.get(`/api/plants/${plantId}/stats/sensors`, { params }),

  // Watering history
  getWateringHistory: (plantId, params) =>
    axiosClient.get(`/api/plants/${plantId}/history/watering`, { params }),
};

export default plantService;