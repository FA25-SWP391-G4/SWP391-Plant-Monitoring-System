/**
 * Frontend Authentication Integration for AI API
 * Updated aiApi.js with proper authentication handling
 */

import axiosClient from './axiosClient';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : null;
};

// Helper function to handle AI API errors with user-friendly messages
const handleAIError = (error) => {
  if (error.response?.status === 401) {
    return {
      success: false,
      error: 'Please log in to use AI features',
      code: 'AUTH_REQUIRED',
      requiresLogin: true
    };
  }
  
  if (error.response?.status === 403) {
    return {
      success: false,
      error: 'Premium subscription required for AI features',
      code: 'PREMIUM_REQUIRED',
      requiresPremium: true
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

// Authenticated AI API methods
const authenticatedAiApi = {
  // Health check (no auth required) - matching existing route
  async getHealth() {
    try {
      const response = await axiosClient.get('/ai/test/status');
      return { success: true, data: response.data };
    } catch (error) {
      return handleAIError(error);
    }
  },

  // Chatbot with authentication
  async chatWithAI(message, context = {}) {
    try {
      const authToken = getAuthToken();
      
      if (!authToken) {
        return {
          success: false,
          error: 'Please log in to use the AI chatbot',
          code: 'AUTH_REQUIRED',
          requiresLogin: true
        };
      }
      
      const response = await axiosClient.post('/ai/chatbot', {
        message,
        context,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Authorization': authToken
        }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return handleAIError(error);
    }
  },

  // Image recognition with authentication - matching existing plant-analysis route
  async analyzeImage(formData) {
    try {
      const authToken = getAuthToken();
      
      if (!authToken) {
        return {
          success: false,
          error: 'Please log in to use image recognition',
          code: 'AUTH_REQUIRED',
          requiresLogin: true
        };
      }
      
      const response = await axiosClient.post('/ai/plant-analysis', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': authToken
        },
        timeout: 60000
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return handleAIError(error);
    }
  },

  // Irrigation recommendations with authentication - matching existing watering-prediction route
  async getIrrigationRecommendations(plantData, sensorData = {}) {
    try {
      const authToken = getAuthToken();
      
      if (!authToken) {
        return {
          success: false,
          error: 'Please log in to get irrigation recommendations',
          code: 'AUTH_REQUIRED',
          requiresLogin: true
        };
      }
      
      const response = await axiosClient.post('/ai/watering-prediction', {
        plantData,
        sensorData,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Authorization': authToken
        }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return handleAIError(error);
    }
  },

  // Irrigation scheduling with authentication
  async generateIrrigationSchedule(plantId, preferences = {}) {
    try {
      const authToken = getAuthToken();
      
      if (!authToken) {
        return {
          success: false,
          error: 'Please log in to generate irrigation schedules',
          code: 'AUTH_REQUIRED',
          requiresLogin: true
        };
      }
      
      const response = await axiosClient.post('/ai/irrigation-schedule', {
        plantId,
        preferences,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Authorization': authToken
        }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return handleAIError(error);
    }
  },

  // Historical analysis with authentication
  async analyzeHistoricalData(plantId, timeRange = {}) {
    try {
      const authToken = getAuthToken();
      
      if (!authToken) {
        return {
          success: false,
          error: 'Please log in to access historical analysis',
          code: 'AUTH_REQUIRED',
          requiresLogin: true
        };
      }
      
      const response = await axiosClient.post('/ai/historical-analysis', {
        plantId,
        timeRange,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Authorization': authToken
        },
        timeout: 60000
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return handleAIError(error);
    }
  },

  // Self-learning with authentication
  async provideFeedback(feedbackData) {
    try {
      const authToken = getAuthToken();
      
      if (!authToken) {
        return {
          success: false,
          error: 'Please log in to provide AI feedback',
          code: 'AUTH_REQUIRED',
          requiresLogin: true
        };
      }
      
      const response = await axiosClient.post('/ai/self-learning', {
        ...feedbackData,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Authorization': authToken
        }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return handleAIError(error);
    }
  },

  // Test methods (matching existing test routes)
  async testChatbot(data) {
    try {
      const authToken = getAuthToken();
      const headers = authToken ? { 'Authorization': authToken } : {};
      
      const response = await axiosClient.post('/ai/test/chatbot', {
        message: 'Hello AI, this is a test message',
        isTest: true,
        ...data
      }, { headers });
      
      return { success: true, data: response.data };
    } catch (error) {
      return handleAIError(error);
    }
  },

  async testPlantAnalysis(data) {
    try {
      const authToken = getAuthToken();
      const headers = authToken ? { 'Authorization': authToken } : {};
      
      const response = await axiosClient.post('/ai/test/plant-analysis', {
        testAnalysis: true,
        message: 'Test plant analysis',
        ...data
      }, { headers });
      
      return { success: true, data: response.data };
    } catch (error) {
      return handleAIError(error);
    }
  }
};

export default authenticatedAiApi;