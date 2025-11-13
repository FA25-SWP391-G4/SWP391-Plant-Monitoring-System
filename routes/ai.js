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
const { isUltimate, isPremium, isAdmin } = require('../middlewares/accessMiddleware');
const authenticate = auth;
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
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
 * @desc Predict watering needs using AI (maps to irrigation endpoint)
 * @access Private
 */
router.post('/watering-prediction', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/watering-prediction/predict`, req.body, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for watering prediction:', error);
    res.status(500).json({ 
      error: 'Failed to get watering prediction', 
      details: error.response?.data || error.message 
    });
  }
});

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
 * @desc Analyze plant image using AI
 * @access Private (Ultimate)
 */
router.post('/image-recognition', authenticate, isUltimate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Read the file as base64
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    // Send to AI service
    const response = await axios.post(`${AI_SERVICE_URL}/api/disease-recognition/analyze`, {
      image: base64Image,
      plant_type: req.body.plant_type || 'unknown'
    });

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for image recognition:', error);
    
    // Clean up temp file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to analyze plant image', 
      details: error.response?.data || error.message 
    });
  }
});

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
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to analyze plant image', 
      details: error.response?.data || error.message 
    });
  }
});

/**
 * @route POST /api/ai/chatbot
 * @desc Interact with AI chatbot
 * @access Private (Ultimate)
 */
router.post('/chatbot', authenticate, isUltimate, async (req, res) => {
  try {
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
      error: 'Failed to get chatbot response', 
      details: error.response?.data || error.message 
    });
  }
});

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
 * @route POST /api/ai/analyze-health
 * @desc Analyze plant health from image
 * @access Private (Ultimate)
 */
router.post('/analyze-health', 
  authenticate, 
  isUltimate,
  upload.single('image'), 
  aiController.analyzeHealth
);

/**
 * @route POST /api/ai/identify-plant
 * @desc Identify plant species from image
 * @access Private (Ultimate)
 */
router.post('/identify-plant', 
  authenticate, 
  isUltimate,
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
 * @access Private (Ultimate)
 */
router.post('/detect-disease',
  authenticate,
  isUltimate,
  upload.single('image'),
  aiController.detectDisease
);

module.exports = router;