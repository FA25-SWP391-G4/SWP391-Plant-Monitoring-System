/**
 * ============================================================================
 * API TEST HELPERS
 * ============================================================================
 * Helper functions for API integration tests
 */

const axios = require('axios');

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';

/**
 * Create axios instance with base configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Set authentication token
 */
function setAuthToken(token) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

/**
 * Register test user
 */
async function registerUser(userData) {
  try {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

/**
 * Login test user
 */
async function loginUser(email, password) {
  try {
    const response = await apiClient.post('/api/auth/login', { email, password });
    const { token } = response.data;
    setAuthToken(token);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

/**
 * Create test plant
 */
async function createPlant(plantData) {
  try {
    const response = await apiClient.post('/api/plants', plantData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

/**
 * Create test zone
 */
async function createZone(zoneData) {
  try {
    const response = await apiClient.post('/api/zones', zoneData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

/**
 * Get user plants
 */
async function getUserPlants() {
  try {
    const response = await apiClient.get('/api/plants');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

/**
 * Delete plant
 */
async function deletePlant(plantId) {
  try {
    const response = await apiClient.delete(`/api/plants/${plantId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

/**
 * Make authenticated GET request
 */
async function get(endpoint) {
  try {
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

/**
 * Make authenticated POST request
 */
async function post(endpoint, data) {
  try {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

/**
 * Make authenticated PUT request
 */
async function put(endpoint, data) {
  try {
    const response = await apiClient.put(endpoint, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

/**
 * Make authenticated DELETE request
 */
async function del(endpoint) {
  try {
    const response = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

/**
 * Clear authentication
 */
function clearAuth() {
  setAuthToken(null);
}

module.exports = {
  apiClient,
  setAuthToken,
  registerUser,
  loginUser,
  createPlant,
  createZone,
  getUserPlants,
  deletePlant,
  get,
  post,
  put,
  del,
  clearAuth
};
