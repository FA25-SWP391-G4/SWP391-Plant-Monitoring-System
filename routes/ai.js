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
const { isPremium } = require('../middlewares/premiumMiddleware');
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
const FormData = require('form-data');

// AI Service URL from environment or default to localhost in development
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3001';

// Helper function to forward authentication headers
const forwardAuthHeaders = (req) => {
  const headers = {};
  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }
  return headers;
};

console.log("AI Controller keys:", Object.keys(aiController));
/**
 * @route POST /api/ai/watering-prediction
<<<<<<< HEAD
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
=======
 * @desc Predict watering needs using AI (maps to irrigation endpoint)
 * @access Private
 */
router.post('/watering-prediction', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/irrigation`, req.body, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...forwardAuthHeaders(req)
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for irrigation prediction:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get irrigation prediction', 
      message: 'AI service unavailable',
      details: error.response?.data || error.message 
    });
  }
});
>>>>>>> 1d1e2513b9e8ac5f36f74d326d2a76f901e82987

/**
 * @route POST /api/ai/plant-analysis
 * @desc Analyze plant condition using AI
 * @access Private
 */
router.post('/plant-analysis', authenticate, upload.single('image'), async (req, res) => {
  try {
    const formData = new FormData();
    
    // Add image file if present
    if (req.file) {
      formData.append('image', fs.createReadStream(req.file.path));
    }
    
    // Add other form fields
    Object.keys(req.body).forEach(key => {
      formData.append(key, req.body[key]);
    });
    
    const response = await axios.post(`${AI_SERVICE_URL}/api/image-recognition`, formData, {
      timeout: 30000,
      headers: {
        ...formData.getHeaders(),
        ...forwardAuthHeaders(req)
      }
    });
    
    // Clean up temporary file
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for plant analysis:', error);
    
    // Clean up temporary file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to analyze plant condition', 
      message: 'AI service unavailable',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * @route POST /api/ai/watering-schedule
 * @desc Optimize watering schedule using AI (maps to irrigation-schedule endpoint)
 * @access Private
 */
router.post('/watering-schedule', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/irrigation-schedule`, req.body, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...forwardAuthHeaders(req)
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for irrigation schedule:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to optimize irrigation schedule', 
      message: 'AI service unavailable',
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
    const response = await axios.post(`${AI_SERVICE_URL}/api/historical-analysis`, req.body, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...forwardAuthHeaders(req)
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for historical analysis:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to analyze historical data', 
      message: 'AI service unavailable',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * @route POST /api/ai/image-recognition
<<<<<<< HEAD
 * @desc Enhanced plant image analysis with disease recognition using TensorFlow.js
 * @access Private
 */
router.post('/image-recognition', 
  [
    // Rate limiting for image uploads
    require('../middlewares/rateLimitMiddleware').imageUploadLimiter,
    require('../middlewares/rateLimitMiddleware').imageUploadSpeedLimiter,
=======
 * @desc Analyze plant image using AI
 * @access Private (Premium)
 */
router.post('/image-recognition', authenticate, isPremium, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Read the file as base64
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    // Send to AI service
    const response = await axios.post(`${AI_SERVICE_URL}/image-recognition`, {
      image: base64Image,
      plant_type: req.body.plant_type || 'unknown'
    });

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for image recognition:', error);
>>>>>>> 1d1e2513b9e8ac5f36f74d326d2a76f901e82987
    
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

// ==================== TEST ROUTES (NO AUTH) ====================
/**
 * @route POST /api/ai/test/chatbot
 * @desc Test AI chatbot without authentication
 * @access Public (TEST ONLY)
 */
router.post('/test/chatbot', async (req, res) => {
  try {
    console.log('🧪 Testing AI chatbot:', req.body);
    const response = await axios.post(`${AI_SERVICE_URL}/api/chatbot`, req.body, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    res.json({
      success: true,
      test: true,
      data: response.data
    });
  } catch (error) {
    console.error('❌ Error testing AI chatbot:', error.message);
    res.status(500).json({ 
      success: false,
      test: true,
      error: 'Failed to test chatbot', 
      message: 'AI service unavailable',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * @route POST /api/ai/test/plant-analysis
 * @desc Test AI plant analysis without authentication
 * @access Public (TEST ONLY)
 */
router.post('/test/plant-analysis', async (req, res) => {
  try {
    console.log('🧪 Testing AI plant analysis:', req.body);
    const response = await axios.post(`${AI_SERVICE_URL}/api/image-recognition`, req.body, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    res.json({
      success: true,
      test: true,
      data: response.data
    });
  } catch (error) {
    console.error('❌ Error testing AI plant analysis:', error.message);
    res.status(500).json({ 
      success: false,
      test: true,
      error: 'Failed to test plant analysis', 
      message: 'AI service unavailable',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * @route GET /api/ai/test/status
 * @desc Test AI service status
 * @access Public (TEST ONLY)
 */
router.get('/test/status', async (req, res) => {
  try {
    console.log('🧪 Testing AI service status');
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 10000
    });
    res.json({
      success: true,
      test: true,
      aiService: response.data,
      connection: 'OK'
    });
  } catch (error) {
    console.error('❌ Error testing AI service status:', error.message);
    res.status(500).json({ 
      success: false,
      test: true,
      error: 'AI service unavailable', 
      details: error.message 
    });
  }
});

// ==================== AUTHENTICATED ROUTES ====================

/**
 * @route POST /api/ai/chatbot
<<<<<<< HEAD
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
=======
 * @desc Interact with AI chatbot
 * @access Private (Premium)
 */
router.post('/chatbot', authenticate, isPremium, async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/chatbot`, req.body, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...forwardAuthHeaders(req)
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for chatbot:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get chatbot response', 
      message: 'AI service unavailable',
      details: error.response?.data || error.message 
    });
>>>>>>> 1d1e2513b9e8ac5f36f74d326d2a76f901e82987
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
<<<<<<< HEAD
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
=======
 * @route POST /api/ai/analyze-health
 * @desc Analyze plant health from image
 * @access Private (Premium)
 */
router.post('/analyze-health', 
  authenticate, 
  isPremium,
  upload.single('image'), 
  aiController.analyzeHealth
);

/**
 * @route POST /api/ai/identify-plant
 * @desc Identify plant species from image
 * @access Private (Premium)
 */
router.post('/identify-plant', 
  authenticate, 
  isPremium,
  upload.single('image'), 
  aiController.identifyPlant
);

/**
 * @route GET /api/ai/analysis-history/:plantId
 * @desc Get analysis history for a plant
 * @access Private
 */
router.get('/analysis-history/:plantId',
  [
    authenticate,
    param('plantId').isNumeric().withMessage('Invalid plant ID')
  ],
  aiController.getAnalysisHistory
);

/**
 * @route POST /api/ai/detect-disease
 * @desc Detect disease from plant image
 * @access Private (Premium)
 */
router.post('/detect-disease',
  authenticate,
  isPremium,
  upload.single('image'),
  aiController.detectDisease
>>>>>>> 1d1e2513b9e8ac5f36f74d326d2a76f901e82987
);

module.exports = router;