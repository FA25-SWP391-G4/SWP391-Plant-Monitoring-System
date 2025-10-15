import axiosClient from './axiosClient';

const aiApi = {
  /**
   * Predict watering needs using AI
   * @param {Object} data - Sensor data and plant information
   * @returns {Promise} - AI prediction response
   */
  predictWatering: (data) => {
    return axiosClient.post('/api/ai/watering-prediction', data);
  },

  /**
   * Analyze plant condition using AI
   * @param {Object} data - Sensor data and plant information
   * @returns {Promise} - AI analysis response
   */
  analyzePlant: (data) => {
    return axiosClient.post('/api/ai/plant-analysis', data);
  },

  /**
   * Optimize watering schedule using AI
   * @param {Object} data - Plant and environment information
   * @returns {Promise} - AI optimized schedule
   */
  optimizeWateringSchedule: (data) => {
    return axiosClient.post('/api/ai/watering-schedule', data);
  },

  /**
   * Analyze historical plant data using AI
   * @param {Object} data - Historical sensor data and plant information
   * @returns {Promise} - AI analysis and recommendations
   */
  analyzeHistoricalData: (data) => {
    return axiosClient.post('/api/ai/historical-analysis', data);
  },

  /**
   * Analyze plant image using AI
   * @param {FormData} formData - Form data containing image file and plant type
   * @returns {Promise} - AI image analysis response
   */
  analyzeImage: (formData) => {
    return axiosClient.post('/api/ai/image-recognition', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * Interact with AI chatbot
   * @param {Object} data - User message and conversation history
   * @returns {Promise} - AI chatbot response
   */
  chatWithAI: (data) => {
    return axiosClient.post('/api/ai/chatbot/message', data);
  },

  /**
   * Get chat history for a session
   * @param {string} sessionId - Session ID
   * @param {number} limit - Number of messages to retrieve
   * @returns {Promise} - Chat history response
   */
  getChatHistory: (sessionId, limit = 20) => {
    return axiosClient.get(`/api/ai/chatbot/history/${sessionId}?limit=${limit}`);
  },

  /**
   * Get chat sessions for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of sessions to retrieve
   * @returns {Promise} - Chat sessions response
   */
  getChatSessions: (userId, limit = 10) => {
    return axiosClient.get(`/api/ai/chatbot/sessions/${userId}?limit=${limit}`);
  },

  /**
   * Delete a chat session
   * @param {string} sessionId - Session ID to delete
   * @returns {Promise} - Delete response
   */
  deleteSession: (sessionId) => {
    return axiosClient.delete(`/api/ai/chatbot/session/${sessionId}`);
  },

  /**
   * Get chatbot service status
   * @returns {Promise} - Service status response
   */
  getChatbotStatus: () => {
    return axiosClient.get('/api/ai/chatbot/status');
  },

  // Disease Detection API endpoints
  /**
   * Analyze plant disease from image
   * @param {FormData} formData - Form data containing image file, plantId, userId
   * @returns {Promise} - Disease analysis response
   */
  analyzeDisease: (formData) => {
    return axiosClient.post('/api/ai/disease/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * Get disease analysis history for a plant
   * @param {number} plantId - Plant ID
   * @param {Object} params - Query parameters (limit, offset, includeImages)
   * @returns {Promise} - Disease history response
   */
  getDiseaseHistory: (plantId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return axiosClient.get(`/api/ai/disease/history/${plantId}?${queryParams}`);
  },

  /**
   * Get treatment recommendations for a disease type
   * @param {string} diseaseType - Disease type key
   * @returns {Promise} - Treatment recommendations response
   */
  getTreatments: (diseaseType) => {
    return axiosClient.get(`/api/ai/disease/treatments/${diseaseType}`);
  },

  /**
   * Validate if image contains plant content
   * @param {FormData} formData - Form data containing image file
   * @returns {Promise} - Image validation response
   */
  validateImage: (formData) => {
    return axiosClient.post('/api/ai/disease/validate-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * Submit feedback for disease analysis
   * @param {number} analysisId - Analysis ID
   * @param {Object} feedback - Feedback data (feedbackType, userComment, actualResult, userId)
   * @returns {Promise} - Feedback submission response
   */
  submitDiseaseFeedback: (analysisId, feedback) => {
    return axiosClient.post(`/api/ai/disease/feedback/${analysisId}`, feedback);
  },

  /**
   * Get supported diseases and model status
   * @returns {Promise} - Supported diseases response
   */
  getSupportedDiseases: () => {
    return axiosClient.get('/api/ai/disease/supported');
  },

  /**
   * Get stored disease analysis image
   * @param {string} filename - Image filename
   * @param {boolean} thumbnail - Whether to get thumbnail version
   * @returns {Promise} - Image data response
   */
  getStoredImage: (filename, thumbnail = false) => {
    return axiosClient.get(`/api/ai/disease/image/${filename}?thumbnail=${thumbnail}`, {
      responseType: 'blob'
    });
  },

  /**
   * Get disease analysis statistics
   * @param {string} timeRange - Time range for statistics (e.g., '30d', '7d')
   * @returns {Promise} - Analysis statistics response
   */
  getDiseaseStatistics: (timeRange = '30d') => {
    return axiosClient.get(`/api/ai/disease/statistics?timeRange=${timeRange}`);
  },

  // Irrigation Prediction API endpoints
  /**
   * Predict irrigation needs for a specific plant
   * @param {number} plantId - Plant ID
   * @param {Object} sensorData - Current sensor data (soilMoisture, temperature, humidity, etc.)
   * @returns {Promise} - Irrigation prediction response
   */
  predictIrrigation: (plantId, sensorData) => {
    return axiosClient.post(`/api/ai/irrigation/predict/${plantId}`, sensorData);
  },

  /**
   * Create intelligent irrigation schedule for a plant
   * @param {number} plantId - Plant ID
   * @param {Object} scheduleData - Schedule parameters and preferences
   * @returns {Promise} - Irrigation schedule response
   */
  createIrrigationSchedule: (plantId, scheduleData) => {
    return axiosClient.post(`/api/ai/irrigation/schedule/${plantId}`, scheduleData);
  },

  /**
   * Get irrigation recommendations for a plant
   * @param {number} plantId - Plant ID
   * @param {Object} params - Query parameters (timeRange, includeHistory)
   * @returns {Promise} - Irrigation recommendations response
   */
  getIrrigationRecommendations: (plantId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return axiosClient.get(`/api/ai/irrigation/recommendations/${plantId}?${queryParams}`);
  },

  /**
   * Submit feedback on irrigation prediction accuracy
   * @param {Object} feedback - Feedback data (predictionId, actualResult, accuracy, userId)
   * @returns {Promise} - Feedback submission response
   */
  submitIrrigationFeedback: (feedback) => {
    return axiosClient.post('/api/ai/irrigation/feedback', feedback);
  },

  /**
   * Get supported plant types and their irrigation profiles
   * @returns {Promise} - Plant types response
   */
  getPlantTypes: () => {
    return axiosClient.get('/api/ai/irrigation/plant-types');
  },

  /**
   * Get irrigation service health status
   * @returns {Promise} - Health status response
   */
  getIrrigationHealth: () => {
    return axiosClient.get('/api/ai/irrigation/health');
  },

  /**
   * Get irrigation performance metrics and statistics
   * @returns {Promise} - Performance metrics response
   */
  getIrrigationPerformance: () => {
    return axiosClient.get('/api/ai/irrigation/performance');
  }
};

export default aiApi;