/**
 * AI Integration Routes
 * Handles integration between main application and AI service
 */

const express = require('express');
const router = express.Router();
const systemIntegrationService = require('../services/systemIntegrationService');
const { logger } = require('../utils/logger');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @route GET /api/ai-integration/status
 * @desc Get system integration status
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = systemIntegrationService.getIntegrationStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting integration status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get integration status'
    });
  }
});

/**
 * @route POST /api/ai-integration/test
 * @desc Test cross-service communication
 * @access Public
 */
router.post('/test', async (req, res) => {
  try {
    const results = await systemIntegrationService.testCrossServiceCommunication();
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error testing cross-service communication:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test cross-service communication'
    });
  }
});

/**
 * @route POST /api/ai-integration/chatbot/message
 * @desc Send message to AI chatbot
 * @access Public
 */
router.post('/chatbot/message', async (req, res) => {
  try {
    const { message, userId, plantId, sessionId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Message and userId are required'
      });
    }

    // Forward to AI service
    const response = await systemIntegrationService.forwardToAiService(
      '/api/ai/chatbot/message',
      'POST',
      { message, userId, plantId, sessionId }
    );

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Error sending chatbot message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message to chatbot'
    });
  }
});

/**
 * @route GET /api/ai-integration/chatbot/history/:sessionId
 * @desc Get chatbot conversation history
 * @access Public
 */
router.get('/chatbot/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const response = await systemIntegrationService.forwardToAiService(
      `/api/ai/chatbot/history/${sessionId}`,
      'GET'
    );

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Error getting chatbot history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chatbot history'
    });
  }
});

/**
 * @route POST /api/ai-integration/disease/analyze
 * @desc Analyze plant disease from image
 * @access Public
 */
router.post('/disease/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      });
    }

    const { plantId, userId } = req.body;

    // Create form data for AI service
    const FormData = require('form-data');
    const fs = require('fs');
    const formData = new FormData();
    
    formData.append('image', fs.createReadStream(req.file.path));
    if (plantId) formData.append('plantId', plantId);
    if (userId) formData.append('userId', userId);

    // Forward to AI service with form data
    const response = await systemIntegrationService.forwardToAiService(
      '/api/ai/disease/analyze',
      'POST',
      formData,
      formData.getHeaders()
    );

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Error analyzing disease:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        logger.error('Error cleaning up uploaded file:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to analyze disease'
    });
  }
});

/**
 * @route GET /api/ai-integration/disease/history/:plantId
 * @desc Get disease analysis history for a plant
 * @access Public
 */
router.get('/disease/history/:plantId', async (req, res) => {
  try {
    const { plantId } = req.params;

    const response = await systemIntegrationService.forwardToAiService(
      `/api/ai/disease/history/${plantId}`,
      'GET'
    );

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Error getting disease history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get disease history'
    });
  }
});

/**
 * @route POST /api/ai-integration/irrigation/predict/:plantId
 * @desc Predict irrigation needs for a plant
 * @access Public
 */
router.post('/irrigation/predict/:plantId', async (req, res) => {
  try {
    const { plantId } = req.params;
    const sensorData = req.body;

    const response = await systemIntegrationService.forwardToAiService(
      `/api/ai/irrigation/predict/${plantId}`,
      'POST',
      sensorData
    );

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Error predicting irrigation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict irrigation needs'
    });
  }
});

/**
 * @route GET /api/ai-integration/irrigation/recommendations/:plantId
 * @desc Get irrigation recommendations for a plant
 * @access Public
 */
router.get('/irrigation/recommendations/:plantId', async (req, res) => {
  try {
    const { plantId } = req.params;

    const response = await systemIntegrationService.forwardToAiService(
      `/api/ai/irrigation/recommendations/${plantId}`,
      'GET'
    );

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Error getting irrigation recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get irrigation recommendations'
    });
  }
});

/**
 * @route POST /api/ai-integration/mqtt/publish
 * @desc Publish message to MQTT topic
 * @access Public
 */
router.post('/mqtt/publish', async (req, res) => {
  try {
    const { topic, data } = req.body;

    if (!topic || !data) {
      return res.status(400).json({
        success: false,
        error: 'Topic and data are required'
      });
    }

    const success = systemIntegrationService.publishMqttMessage(topic, data);

    res.json({
      success,
      message: success ? 'Message published successfully' : 'Failed to publish message'
    });
  } catch (error) {
    logger.error('Error publishing MQTT message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish MQTT message'
    });
  }
});

/**
 * @route GET /api/ai-integration/health
 * @desc Get health status of all integrated services
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const serviceStatus = await systemIntegrationService.checkServiceConnectivity();
    
    const overallHealth = Object.values(serviceStatus).every(status => status);
    
    res.status(overallHealth ? 200 : 503).json({
      success: true,
      data: {
        overall: overallHealth ? 'healthy' : 'degraded',
        services: serviceStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error checking health:', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

module.exports = router;