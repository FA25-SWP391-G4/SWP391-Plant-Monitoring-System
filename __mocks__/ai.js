/**
 * AI Features Routes
 * Routes for AI-powered features including watering prediction, plant analysis, 
 * watering schedule optimization, historical analysis, image recognition, and chatbot
 */

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const aiController = require('../controllers/aiController');
const authenticate = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const axios = require('axios');

// AI Service URL from environment or default to localhost in development
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * @route POST /api/ai/watering-prediction
 * @desc Predict watering needs using AI
 * @access Private
 */
router.post('/watering-prediction', authenticate, aiController.runPredictionForPlant);

/**
 * @route POST /api/ai/plant-analysis
 * @desc Analyze plant condition using AI
 * @access Private
 */
router.post('/plant-analysis', authenticate, aiController.analyzePlantCondition);

/**
 * @route POST /api/ai/optimize-schedule
 * @desc Optimize watering schedule using AI
 * @access Private
 */
router.post('/optimize-schedule', authenticate, aiController.optimizeWateringSchedule);

/**
 * @route POST /api/ai/historical-analysis
 * @desc Analyze historical watering and sensor data
 * @access Private
 */
router.post('/historical-analysis', authenticate, aiController.analyzeHistoricalData);

/**
 * @route POST /api/ai/image-recognition
 * @desc Identify plant species or diseases from images
 * @access Private
 */
router.post('/image-recognition', authenticate, upload.single('image'), aiController.processPlantImage);

/**
 * @route POST /api/ai/chatbot
 * @desc Interact with plant care chatbot
 * @access Private
 */
router.post('/chatbot', authenticate, aiController.processChatbotQuery);

/**
 * @route GET /api/ai/models
 * @desc Get all AI models
 * @access Private (Admin)
 */
router.get('/models', authenticate, aiController.getAllModels);

/**
 * @route GET /api/ai/models/:id
 * @desc Get specific AI model
 * @access Private (Admin)
 */
router.get('/models/:id', authenticate, aiController.getModelById);

/**
 * @route POST /api/ai/models
 * @desc Create new AI model
 * @access Private (Admin)
 */
router.post('/models', authenticate, aiController.createModel);

/**
 * @route PUT /api/ai/models/:id
 * @desc Update AI model
 * @access Private (Admin)
 */
router.put('/models/:id', authenticate, aiController.updateModel);

/**
 * @route DELETE /api/ai/models/:id
 * @desc Delete AI model
 * @access Private (Admin)
 */
router.delete('/models/:id', authenticate, aiController.deleteModel);

/**
 * @route POST /api/ai/models/:id/activate
 * @desc Activate specific AI model
 * @access Private (Admin)
 */
router.post('/models/:id/activate', authenticate, aiController.activateModel);

/**
 * @route POST /api/ai/models/:id/test
 * @desc Test AI model performance
 * @access Private (Admin)
 */
router.post('/models/:id/test', authenticate, aiController.testModelPerformance);

module.exports = router;