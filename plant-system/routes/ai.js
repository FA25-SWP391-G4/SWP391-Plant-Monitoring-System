/**
 * ============================================================================
 * AI ROUTES - API ENDPOINTS FOR AI-POWERED PLANT CARE FEATURES
 * ============================================================================
 *
 * Routes for premium AI features:
 * - Watering predictions
 * - Plant health analysis
 * - AI chatbot
 * - Schedule optimization
 *
 * All routes require authentication and premium subscription
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

// All AI routes require authentication
router.use(auth);

// ===== WATERING PREDICTION ROUTES =====

/**
 * @route   GET /api/ai/predict-watering/:plantId
 * @desc    Predict when a plant will need watering
 * @access  Private (Premium users only)
 * @param   {number} plantId - Plant ID
 * @query   {number} daysAhead - Days to predict ahead (default: 7)
 */
router.get('/predict-watering/:plantId', aiController.predictWatering);

// ===== PLANT HEALTH ANALYSIS ROUTES =====

/**
 * @route   GET /api/ai/analyze-health/:plantId
 * @desc    Analyze plant health based on sensor data
 * @access  Private (Premium users only)
 * @param   {number} plantId - Plant ID
 */
router.get('/analyze-health/:plantId', aiController.analyzeHealth);

/**
 * @route   GET /api/ai/bulk-health
 * @desc    Analyze health for all user's plants
 * @access  Private (Premium users only)
 */
router.get('/bulk-health', aiController.bulkHealthAnalysis);

// ===== AI CHATBOT ROUTES =====

/**
 * @route   POST /api/ai/chat
 * @desc    Get AI-powered plant care advice
 * @access  Private (Premium users only)
 * @body    {string} message - User's question/message
 * @body    {number} plantId - Optional plant ID for context
 */
router.post('/chat', aiController.chat);

// ===== SCHEDULE OPTIMIZATION ROUTES =====

/**
 * @route   GET /api/ai/optimize-schedule/:plantId
 * @desc    Optimize watering schedule for a plant
 * @access  Private (Premium users only)
 * @param   {number} plantId - Plant ID
 */
router.get('/optimize-schedule/:plantId', aiController.optimizeSchedule);

// ===== AI STATUS ROUTES =====

/**
 * @route   GET /api/ai/status
 * @desc    Get AI features availability and status
 * @access  Private
 */
router.get('/status', aiController.getStatus);

module.exports = router;