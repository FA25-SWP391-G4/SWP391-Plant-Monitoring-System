const express = require('express');
const IrrigationPredictionController = require('../controllers/irrigationPredictionController');
const { logger } = require('../utils/errorHandler');
const { validateIrrigationRequest } = require('../middleware/aiSecurityMiddleware');

const router = express.Router();

// Initialize controller
const irrigationController = new IrrigationPredictionController();

// Middleware for request logging
router.use((req, res, next) => {
  logger.info('Irrigation API request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Validation middleware for plant ID
const validatePlantId = (req, res, next) => {
  const { plantId } = req.params;
  
  if (!plantId || isNaN(parseInt(plantId))) {
    return res.status(400).json({
      success: false,
      error: 'Invalid plant ID',
      message: 'Plant ID must be a valid number'
    });
  }
  
  next();
};

// Validation middleware for sensor data
const validateSensorData = (req, res, next) => {
  const { soilMoisture, temperature, humidity } = req.body;
  
  if (soilMoisture === undefined || temperature === undefined || humidity === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Missing required sensor data',
      message: 'soilMoisture, temperature, and humidity are required'
    });
  }
  
  next();
};

// Rate limiting middleware (simple implementation)
const rateLimitMap = new Map();
const rateLimit = (req, res, next) => {
  const clientIp = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // 100 requests per minute

  if (!rateLimitMap.has(clientIp)) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const clientData = rateLimitMap.get(clientIp);
  
  if (now > clientData.resetTime) {
    // Reset the window
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (clientData.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }

  clientData.count++;
  next();
};

// Apply rate limiting to all routes
router.use(rateLimit);

/**
 * @route POST /api/ai/irrigation/predict/:plantId
 * @desc Predict irrigation needs for a specific plant
 * @access Public
 */
router.post('/predict/:plantId', validateIrrigationRequest, async (req, res) => {
  try {
    await irrigationController.predictIrrigation(req, res);
  } catch (error) {
    logger.error('Error in predict route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * @route POST /api/ai/irrigation/schedule/:plantId
 * @desc Create intelligent irrigation schedule
 * @access Public
 */
router.post('/schedule/:plantId', validateIrrigationRequest, async (req, res) => {
  try {
    await irrigationController.createSchedule(req, res);
  } catch (error) {
    logger.error('Error in schedule route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * @route GET /api/ai/irrigation/recommendations/:plantId
 * @desc Get irrigation recommendations for a plant
 * @access Public
 */
router.get('/recommendations/:plantId', validatePlantId, async (req, res) => {
  try {
    await irrigationController.getRecommendations(req, res);
  } catch (error) {
    logger.error('Error in recommendations route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * @route POST /api/ai/irrigation/feedback
 * @desc Submit feedback on prediction accuracy
 * @access Public
 */
router.post('/feedback', async (req, res) => {
  try {
    await irrigationController.submitFeedback(req, res);
  } catch (error) {
    logger.error('Error in feedback route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * @route GET /api/ai/irrigation/plant-types
 * @desc Get supported plant types and their profiles
 * @access Public
 */
router.get('/plant-types', async (req, res) => {
  try {
    const plantAlgorithms = irrigationController.plantAlgorithms;
    const supportedTypes = plantAlgorithms.getSupportedPlantTypes();
    
    res.json({
      success: true,
      plantTypes: supportedTypes,
      count: supportedTypes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in plant-types route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * @route GET /api/ai/irrigation/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const isModelLoaded = irrigationController.predictionService.isModelLoaded;
    const performanceHealth = await irrigationController.performanceService.healthCheck();
    
    res.json({
      success: true,
      status: 'healthy',
      services: {
        mlModel: isModelLoaded ? 'loaded' : 'loading',
        plantAlgorithms: 'ready',
        featureEngineering: 'ready',
        performance: performanceHealth.healthy ? 'healthy' : 'degraded',
        cache: performanceHealth.cache.healthy ? 'healthy' : 'degraded'
      },
      performance: performanceHealth.performance,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Error in health route:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/ai/irrigation/performance
 * @desc Get performance metrics and statistics
 * @access Public
 */
router.get('/performance', async (req, res) => {
  try {
    const performanceReport = irrigationController.performanceService.getPerformanceReport();
    
    res.json({
      success: true,
      performance: performanceReport,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in performance route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('Unhandled error in irrigation routes:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'POST /api/ai/irrigation/predict/:plantId',
      'POST /api/ai/irrigation/schedule/:plantId',
      'GET /api/ai/irrigation/recommendations/:plantId',
      'POST /api/ai/irrigation/feedback',
      'GET /api/ai/irrigation/plant-types',
      'GET /api/ai/irrigation/health'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;