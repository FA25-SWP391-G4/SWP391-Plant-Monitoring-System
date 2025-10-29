/**
 * Backend Authentication Integration for AI Service
 * Updated route handlers with proper authentication forwarding
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// AI Service URL from environment
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3001';

// Helper function to forward authentication headers
const forwardAuthHeaders = (req) => {
  const headers = {};
  
  // Forward authorization header if present
  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }
  
  return headers;
};

// Updated route handlers with authentication forwarding
const authenticatedAIRoutes = {
  // Health check (no auth required)
  async health(req, res) {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 10000
      });
      res.json(response.data);
    } catch (error) {
      res.status(503).json({ 
        success: false,
        error: 'AI service unavailable' 
      });
    }
  },

  // Chatbot with authentication
  async chatbot(req, res) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/chatbot`, req.body, {
        headers: {
          'Content-Type': 'application/json',
          ...forwardAuthHeaders(req)
        },
        timeout: 30000
      });
      res.json(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for AI chatbot',
          code: 'AUTH_REQUIRED'
        });
      }
      
      if (error.response?.status === 403) {
        return res.status(403).json({
          success: false,
          error: 'Premium subscription required for AI chatbot',
          code: 'PREMIUM_REQUIRED'
        });
      }
      
      res.status(503).json({ 
        success: false,
        error: 'AI chatbot service unavailable' 
      });
    }
  },

  // Image recognition with authentication
  async imageRecognition(req, res) {
    try {
      const formData = new FormData();
      
      // Forward the uploaded file
      if (req.file) {
        formData.append('image', fs.createReadStream(req.file.path));
      }
      
      // Forward any additional data
      Object.keys(req.body).forEach(key => {
        formData.append(key, req.body[key]);
      });
      
      const response = await axios.post(`${AI_SERVICE_URL}/api/image-recognition`, formData, {
        headers: {
          ...formData.getHeaders(),
          ...forwardAuthHeaders(req)
        },
        timeout: 60000
      });
      
      // Clean up temporary file
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      }
      
      res.json(response.data);
    } catch (error) {
      // Clean up temporary file on error
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      }
      
      if (error.response?.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for image recognition',
          code: 'AUTH_REQUIRED'
        });
      }
      
      if (error.response?.status === 403) {
        return res.status(403).json({
          success: false,
          error: 'Premium subscription required for image recognition',
          code: 'PREMIUM_REQUIRED'
        });
      }
      
      res.status(503).json({ 
        success: false,
        error: 'AI image recognition service unavailable' 
      });
    }
  },

  // Irrigation recommendations with authentication
  async irrigation(req, res) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/irrigation`, req.body, {
        headers: {
          'Content-Type': 'application/json',
          ...forwardAuthHeaders(req)
        },
        timeout: 30000
      });
      res.json(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for irrigation recommendations',
          code: 'AUTH_REQUIRED'
        });
      }
      
      if (error.response?.status === 403) {
        return res.status(403).json({
          success: false,
          error: 'Premium subscription required for irrigation AI',
          code: 'PREMIUM_REQUIRED'
        });
      }
      
      res.status(503).json({ 
        success: false,
        error: 'AI irrigation service unavailable' 
      });
    }
  },

  // Irrigation schedule with authentication
  async irrigationSchedule(req, res) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/irrigation-schedule`, req.body, {
        headers: {
          'Content-Type': 'application/json',
          ...forwardAuthHeaders(req)
        },
        timeout: 30000
      });
      res.json(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for irrigation scheduling',
          code: 'AUTH_REQUIRED'
        });
      }
      
      if (error.response?.status === 403) {
        return res.status(403).json({
          success: false,
          error: 'Premium subscription required for irrigation scheduling',
          code: 'PREMIUM_REQUIRED'
        });
      }
      
      res.status(503).json({ 
        success: false,
        error: 'AI irrigation scheduling service unavailable' 
      });
    }
  },

  // Historical analysis with authentication
  async historicalAnalysis(req, res) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/historical-analysis`, req.body, {
        headers: {
          'Content-Type': 'application/json',
          ...forwardAuthHeaders(req)
        },
        timeout: 60000
      });
      res.json(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for historical analysis',
          code: 'AUTH_REQUIRED'
        });
      }
      
      if (error.response?.status === 403) {
        return res.status(403).json({
          success: false,
          error: 'Premium subscription required for historical analysis',
          code: 'PREMIUM_REQUIRED'
        });
      }
      
      res.status(503).json({ 
        success: false,
        error: 'AI historical analysis service unavailable' 
      });
    }
  },

  // Self-learning with authentication
  async selfLearning(req, res) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/self-learning`, req.body, {
        headers: {
          'Content-Type': 'application/json',
          ...forwardAuthHeaders(req)
        },
        timeout: 30000
      });
      res.json(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for AI self-learning',
          code: 'AUTH_REQUIRED'
        });
      }
      
      if (error.response?.status === 403) {
        return res.status(403).json({
          success: false,
          error: 'Premium subscription required for AI self-learning',
          code: 'PREMIUM_REQUIRED'
        });
      }
      
      res.status(503).json({ 
        success: false,
        error: 'AI self-learning service unavailable' 
      });
    }
  }
};

module.exports = authenticatedAIRoutes;