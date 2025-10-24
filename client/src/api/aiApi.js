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
    return axiosClient.post('/api/ai/chatbot', data);
  },

  /**
   * Analyze plant health from an image
   * @param {File} imageFile - The plant image file to analyze
   * @returns {Promise} - Health analysis results
   */
  analyzeHealth: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return axiosClient.post('/api/ai/analyze-health', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Identify plant species from an image
   * @param {File} imageFile - The plant image file to identify
   * @returns {Promise} - Plant identification results
   */
  identifyPlant: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return axiosClient.post('/api/ai/identify-plant', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Get AI-based growth predictions for a plant
   * @param {Number} plantId - The ID of the plant
   * @returns {Promise} - Growth predictions data
   */
  getGrowthPrediction: (plantId) => {
    return axiosClient.get(`/api/ai/growth-prediction/${plantId}`);
  },
  
  /**
   * Detect disease from plant image
   * @param {File} imageFile - The plant image file to analyze for diseases
   * @returns {Promise} - Disease detection results
   */
  detectDisease: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return axiosClient.post('/api/ai/detect-disease', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  /**
   * Get the history of AI analyses for a plant
   * @param {Number} plantId - The ID of the plant
   * @param {Object} options - Query parameters (page, limit, etc.)
   * @returns {Promise} - Analysis history data
   */
  getAnalysisHistory: (plantId, options = {}) => {
    return axiosClient.get(`/api/ai/analysis-history/${plantId}`, { params: options });
  }
};

export default aiApi;