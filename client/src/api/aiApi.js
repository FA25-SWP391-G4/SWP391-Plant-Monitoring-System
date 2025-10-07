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
  }
};

export default aiApi;