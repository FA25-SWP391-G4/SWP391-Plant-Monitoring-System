/**
 * AI Features Routes
 * Routes for AI-powered features including watering prediction, plant analysis, 
 * watering schedule optimization, historical analysis, image recognition, and chatbot
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, param } = require('express-validator');
const aiController = require('../controllers/aiController');
const auth = require('../middlewares/authMiddleware');
const authenticate = auth;
const isAdmin = auth.isAdmin;
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/images/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'plant-image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/tiff'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and TIFF images are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
const fs = require('fs');

// AI Service URL from environment or default to localhost in development
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

console.log("AI Controller keys:", Object.keys(aiController));
/**
 * @route POST /api/ai/watering-prediction
 * @desc Predict watering needs using TensorFlow.js model
 * @access Private
 */
router.post('/watering-prediction', 
  [
    authenticate,
    body('plant_id').optional().custom(value => {
      if (value !== null && value !== undefined && !Number.isInteger(Number(value))) {
        throw new Error('Plant ID must be a number or null');
      }
      return true;
    }),
    body('sensor_data').isObject().withMessage('Sensor data must be an object'),
    body('sensor_data.moisture').optional().isFloat({ min: 0, max: 100 }).withMessage('Moisture must be a number between 0-100'),
    body('sensor_data.temperature').optional().isFloat({ min: -50, max: 80 }).withMessage('Temperature must be a number between -50 to 80°C'),
    body('sensor_data.humidity').optional().isFloat({ min: 0, max: 100 }).withMessage('Humidity must be a number between 0-100'),
    body('sensor_data.light').optional().isFloat({ min: 0, max: 10000 }).withMessage('Light must be a number between 0-10000 lux')
  ],
  aiController.predictWatering
);

/**
 * @route POST /api/ai/plant-analysis
 * @desc Analyze plant condition using AI
 * @access Private
 */
router.post('/plant-analysis', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/plant-analysis`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for plant analysis:', error);
    res.status(500).json({ 
      error: 'Failed to analyze plant condition', 
      details: error.response?.data || error.message 
    });
  }
});

/**
 * @route POST /api/ai/watering-schedule
 * @desc Optimize watering schedule using AI
 * @access Private
 */
router.post('/watering-schedule', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/watering-schedule`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for watering schedule:', error);
    res.status(500).json({ 
      error: 'Failed to optimize watering schedule', 
      details: error.response?.data || error.message 
    });
  }
});

/**
 * @route POST /api/ai/historical-analysis
 * @desc Analyze historical plant data using AI
 * @access Private
 */
router.post('/historical-analysis', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/historical-analysis`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for historical analysis:', error);
    res.status(500).json({ 
      error: 'Failed to analyze historical data', 
      details: error.response?.data || error.message 
    });
  }
});

/**
 * @route POST /api/ai/image-recognition
 * @desc Enhanced plant image analysis with disease recognition using TensorFlow.js
 * @access Private
 */
router.post('/image-recognition', 
  [
    // Rate limiting for image uploads
    require('../middlewares/rateLimitMiddleware').imageUploadLimiter,
    require('../middlewares/rateLimitMiddleware').imageUploadSpeedLimiter,
    
    // Authentication
    authenticate,
    
    // File upload with enhanced security
    upload.single('image'),
    
    // Enhanced file security validation
    require('../middlewares/fileSecurityMiddleware').validateFileUpload,
    
    // Input validation
    body('plant_id').optional().isNumeric().withMessage('Plant ID must be a number'),
    body('plant_type').optional().isString().trim().isLength({ max: 100 }).withMessage('Plant type must be a string (max 100 chars)')
  ],
  aiController.processImageRecognition
);

/**
 * @route POST /api/ai/chatbot
 * @desc Interact with AI chatbot via AI microservice
 * @access Private
 */
router.post('/chatbot', 
  [
    authenticate,
    body('message').notEmpty().withMessage('Message is required'),
    body('conversation_id').optional().isString(),
    body('plant_id').optional().isNumeric(),
    body('context').optional().isObject()
  ],
  async (req, res) => {
    try {
      // Forward request to AI microservice
      const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      
      const response = await axios.post(`${AI_SERVICE_URL}/api/chatbot/query`, req.body, {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        }
      });
      
      res.json(response.data);
    } catch (error) {
      console.error('Error calling AI service for chatbot:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to process chatbot request', 
        error: error.response?.data?.message || error.message 
      });
    }
  }
);

/**
 * AI Model Management Routes
 * CRUD operations for AI models used in the application
 */

// Get all AI models
router.get('/models', authenticate, aiController.getAllModels);

// Get active AI model
router.get('/models/active', authenticate, aiController.getActiveModel);

// Get AI model by ID
router.get('/models/:id', authenticate, aiController.getModelById);

// Create new AI model - only for admins
router.post('/models',
    [
        authenticate,
        isAdmin,
        body('model_name').notEmpty().withMessage('Model name is required'),
        body('version').notEmpty().withMessage('Model version is required'),
        body('file_path').notEmpty().withMessage('Model file path is required')
    ],
    aiController.createModel
);

// Update AI model - only for admins
router.put('/models/:id',
    [
        authenticate,
        isAdmin,
        param('id').isNumeric().withMessage('Invalid model ID')
    ],
    aiController.updateModel
);

// Set model as active - only for admins
router.post('/models/:id/activate',
    [
        authenticate,
        isAdmin,
        param('id').isNumeric().withMessage('Invalid model ID')
    ],
    aiController.setModelActive
);

// Delete AI model - only for admins
router.delete('/models/:id',
    [
        authenticate,
        isAdmin,
        param('id').isNumeric().withMessage('Invalid model ID')
    ],
    aiController.deleteModel
);

// Run prediction for a plant
router.post('/models/predict/:plantId',
    [
        authenticate,
        param('plantId').isNumeric().withMessage('Invalid plant ID'),
        body('moisture').optional().isNumeric().withMessage('Moisture must be a number'),
        body('temperature').optional().isNumeric().withMessage('Temperature must be a number'),
        body('light').optional().isNumeric().withMessage('Light must be a number')
    ],
    aiController.runPredictionForPlant
);

// Test model performance - only for admins
router.post('/models/:id/test',
    [
        authenticate,
        isAdmin,
        param('id').isNumeric().withMessage('Invalid model ID'),
        body('testDataPath').notEmpty().withMessage('Test data path is required')
    ],
    aiController.testModelPerformance
);

/**
 * AI Performance and Optimization Routes
 */

// Get AI performance statistics
router.get('/performance/stats', authenticate, aiController.getAIPerformanceStats);

// Optimize AI performance - admin only
router.post('/performance/optimize', 
    [authenticate, isAdmin], 
    aiController.optimizeAIPerformance
);

// Clear AI cache - admin only
router.post('/performance/clear-cache', 
    [
        authenticate, 
        isAdmin,
        body('type').optional().isIn(['all', 'responses', 'models', 'predictions']).withMessage('Invalid cache type')
    ], 
    aiController.clearAICache
);

module.exports = router;