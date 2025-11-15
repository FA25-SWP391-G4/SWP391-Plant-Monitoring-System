import axiosClient from './axiosClient';
import Cookies from 'js-cookie';

// Helper function to get auth token
const getAuthToken = () => {
  const token = Cookies.get('token');
  return token ? `Bearer ${token}` : null;
};

// Helper function to check user access level
const checkUserAccess = () => {
  const token = Cookies.get('token');
  if (!token) return { hasAccess: false, requiresLogin: true };
  
  try {
    // Decode JWT to check user role (basic decode without verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Only Ultimate role and Admin role can access AI features
    const isAdmin = payload.role === 'admin' || payload.role === 'Admin';
    const isUltimate = payload.role === 'ultimate' || payload.role === 'Ultimate' || payload.isUltimate === true;
    
    // AI features require Ultimate subscription specifically (or admin override)
    const hasAIAccess = isUltimate || isAdmin;
    
    return { 
      hasAccess: hasAIAccess, 
      isAdmin: isAdmin,
      isPremium: false, // Premium no longer grants AI access
      isUltimate: isUltimate,
      requiresLogin: false,
      requiresUltimate: !hasAIAccess
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return { hasAccess: false, requiresLogin: true };
  }
};

// Helper function to handle auth errors
const handleAuthError = (error) => {
  console.log('AI API Error:', error.response?.status, error.response?.data);
  
  if (error.response?.status === 401) {
    const errorData = error.response.data;
    
    // Handle specific token errors
    if (errorData?.code === 'TOKEN_EXPIRED') {
      // Clear the expired token
      Cookies.remove('token');
      return {
        success: false,
        error: 'Your session has expired. Please log in again.',
        requiresLogin: true,
        code: 'TOKEN_EXPIRED'
      };
    }
    
    if (errorData?.code === 'INVALID_TOKEN') {
      // Clear the invalid token
      Cookies.remove('token');
      return {
        success: false,
        error: 'Invalid authentication. Please log in again.',
        requiresLogin: true,
        code: 'INVALID_TOKEN'
      };
    }
    
    return {
      success: false,
      error: 'Please log in to use AI features',
      requiresLogin: true,
      code: 'AUTH_REQUIRED'
    };
  }
  
  if (error.response?.status === 403) {
    return {
      success: false,
      error: 'Ultimate subscription required for AI features',
      requiresUltimate: true,
      code: 'ULTIMATE_REQUIRED'
    };
  }
  
  if (error.response?.status === 503) {
    return {
      success: false,
      error: 'AI service is temporarily unavailable. Please try again later.',
      code: 'SERVICE_UNAVAILABLE'
    };
  }
  
  return {
    success: false,
    error: error.response?.data?.error || 'An unexpected error occurred',
    code: error.response?.data?.code || 'UNKNOWN_ERROR'
  };
};

const aiApi = {
  // ===================== CORE AI ENDPOINTS =====================
  
  /**
   * Get AI service health status
   * @returns {Promise} - AI service health response
   */
  getHealth: () => {
    return axiosClient.get('/api/ai/test/status');
  },

  /**
   * Interact with AI chatbot (requires authentication and premium)
   * @param {Object} data - User message and conversation history
   * @returns {Promise} - AI chatbot response
   */
  chatWithAI: async (data) => {
    try {
      const access = checkUserAccess();
      
      // Debug logging for authentication issues
      console.log('AI API - checkUserAccess result:', access);
      
      if (access.requiresLogin) {
        console.log('AI API - Login required');
        return {
          success: false,
          error: 'Please log in to use the AI chatbot',
          requiresLogin: true,
          code: 'AUTH_REQUIRED'
        };
      }
      
      if (access.requiresUltimate) {
        console.log('AI API - Ultimate required');
        return {
          success: false,
          error: 'Ultimate subscription required for AI chatbot access',
          requiresUltimate: true,
          code: 'ULTIMATE_REQUIRED'
        };
      }
      
      const authToken = getAuthToken();
      
      const response = await axiosClient.post('/api/ai/chatbot', data, {
        headers: {
          'Authorization': authToken
        }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return handleAuthError(error);
    }
  },

  /**
   * Test AI chatbot (no authentication required)
   * @param {Object} data - User message for testing
   * @returns {Promise} - AI chatbot response
   */
  testChatbot: (data) => {
    return axiosClient.post('/api/ai/test/chatbot', data);
  },

  /**
   * Analyze plant image using AI (requires authentication and premium)
   * @param {FormData} formData - Form data containing image file
   * @returns {Promise} - AI image analysis response
   */
  analyzeImage: async (formData) => {
    try {
      const access = checkUserAccess();
      
      if (access.requiresLogin) {
        return {
          success: false,
          error: 'Please log in to use image analysis',
          requiresLogin: true,
          code: 'AUTH_REQUIRED'
        };
      }
      
      if (access.requiresUltimate) {
        return {
          success: false,
          error: 'Ultimate subscription required for image analysis',
          requiresUltimate: true,
          code: 'ULTIMATE_REQUIRED'
        };
      }
      
      const authToken = getAuthToken();
      
      const response = await axiosClient.post('/api/ai/plant-analysis', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': authToken
        },
        timeout: 60000
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return handleAuthError(error);
    }
  },

  /**
   * Test plant image analysis (no authentication required)
   * @param {Object} data - Plant data for testing
   * @returns {Promise} - AI analysis response
   */
  testPlantAnalysis: (data) => {
    return axiosClient.post('/api/ai/test/plant-analysis', data);
  },

  // ===================== IRRIGATION & WATERING =====================

  /**
   * Get AI irrigation recommendations (requires authentication)
   * @param {Object} data - Sensor data and plant information
   * @returns {Promise} - AI irrigation recommendations
   */
  getIrrigationRecommendations: async (data) => {
    try {
      const authToken = getAuthToken();
      
      if (!authToken) {
        return {
          success: false,
          error: 'Please log in to get irrigation recommendations',
          requiresLogin: true,
          code: 'AUTH_REQUIRED'
        };
      }
      
      const response = await axiosClient.post('/api/ai/watering-prediction', data, {
        headers: {
          'Authorization': authToken
        }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return handleAuthError(error);
    }
  },

  /**
   * Optimize irrigation schedule using AI (requires authentication and premium)
   * @param {Object} data - Plant and environment information
   * @returns {Promise} - AI optimized irrigation schedule  
   */
  optimizeIrrigationSchedule: async (data) => {
    try {
      const authToken = getAuthToken();
      
      if (!authToken) {
        return {
          success: false,
          error: 'Please log in to optimize irrigation schedule',
          requiresLogin: true,
          code: 'AUTH_REQUIRED'
        };
      }
      
      const response = await axiosClient.post('/api/ai/watering-schedule', data, {
        headers: {
          'Authorization': authToken
        }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return handleAuthError(error);
    }
  },

  // ===================== ANALYSIS & INSIGHTS =====================

  /**
   * Analyze historical plant data using AI (requires authentication and premium)
   * @param {Object} data - Historical sensor data and plant information
   * @returns {Promise} - AI analysis and recommendations
   */
  analyzeHistoricalData: async (data) => {
    try {
      const authToken = getAuthToken();
      
      if (!authToken) {
        return {
          success: false,
          error: 'Please log in to access historical analysis',
          requiresLogin: true,
          code: 'AUTH_REQUIRED'
        };
      }
      
      const response = await axiosClient.post('/api/ai/historical-analysis', data, {
        headers: {
          'Authorization': authToken
        },
        timeout: 60000
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return handleAuthError(error);
    }
  },

  // ===================== LEGACY METHODS (for backward compatibility) =====================

  /**
   * @deprecated Use getIrrigationRecommendations instead
   */
  predictWatering: (data) => {
    return aiApi.getIrrigationRecommendations(data);
  },

  /**
   * @deprecated Use testPlantAnalysis instead
   */
  analyzePlant: (data) => {
    return aiApi.testPlantAnalysis(data);
  },

  /**
   * @deprecated Use optimizeIrrigationSchedule instead
   */
  optimizeWateringSchedule: (data) => {
    return aiApi.optimizeIrrigationSchedule(data);
  },

  // ===================== IMAGE ANALYSIS METHODS =====================

  /**
   * Analyze plant health from an image (requires authentication)
   * @param {File} imageFile - The plant image file to analyze
   * @returns {Promise} - Health analysis results
   */
  analyzeHealth: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Use the new authenticated analyzeImage method
    return await aiApi.analyzeImage(formData);
  },

  /**
   * Identify plant species from an image
   * @param {File} imageFile - The plant image file to identify
   * @returns {Promise} - Plant identification results
   */
  identifyPlant: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return axiosClient.post('/api/ai/plant-analysis', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Detect disease from plant image (requires authentication)
   * @param {File} imageFile - The plant image file to analyze for diseases
   * @returns {Promise} - Disease detection results
   */
  detectDisease: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Use the new authenticated analyzeImage method
    return await aiApi.analyzeImage(formData);
  },

  // ===================== ANALYTICS & HISTORY =====================

  /**
   * Get AI-based growth predictions for a plant
   * @param {Number} plantId - The ID of the plant
   * @returns {Promise} - Growth predictions data
   */
  getGrowthPrediction: (plantId) => {
    return axiosClient.get(`/api/ai/historical-analysis/${plantId}`);
  },
  
  /**
   * Get the history of AI analyses for a plant
   * @param {Number} plantId - The ID of the plant
   * @param {Object} options - Query parameters (page, limit, etc.)
   * @returns {Promise} - Analysis history data
   */
  getAnalysisHistory: (plantId, options = {}) => {
    return axiosClient.get(`/api/ai/historical-analysis/${plantId}`, { params: options });
  },

  // ===================== DEVELOPMENT & TESTING =====================

  /**
   * Test AI service endpoints (for development)
   * @param {string} endpoint - The endpoint to test
   * @param {Object} data - Data to send
   * @returns {Promise} - Test response
   */
  testEndpoint: (endpoint, data = {}) => {
    const testEndpoints = {
      'health': () => axiosClient.get('/api/ai/test/status'),
      'chatbot': (data) => axiosClient.post('/api/ai/test/chatbot', data),
      'plant-analysis': (data) => axiosClient.post('/api/ai/test/plant-analysis', data),
    };

    const testFunction = testEndpoints[endpoint];
    if (!testFunction) {
      return Promise.reject(new Error(`Test endpoint '${endpoint}' not found`));
    }

    return testFunction(data);
  }
};

export default aiApi;