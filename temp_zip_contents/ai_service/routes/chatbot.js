const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const chatbotController = require('../controllers/chatbotController');

// JWT verification middleware
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

/**
 * @route POST /api/chatbot/query
 * @desc Process chatbot query with OpenRouter API
 * @access Private
 */
router.post('/query',
    [
        verifyToken,
        body('message').notEmpty().withMessage('Message is required'),
        body('chat_id').optional().isString(),
        body('plant_id').optional().isNumeric(),
        body('context').optional().isObject()
    ],
    chatbotController.processChatbotQuery
);

/**
 * @route GET /api/chatbot/conversation/:chat_id
 * @desc Get conversation history by conversation ID
 * @access Private
 */
router.get('/conversation/:chat_id',
    [
        verifyToken,
        param('chat_id').notEmpty().withMessage('Conversation ID is required')
    ],
    chatbotController.getConversationHistory
);

/**
 * @route GET /api/chatbot/history
 * @desc Get user's chat history
 * @access Private
 */
router.get('/history',
    verifyToken,
    chatbotController.getUserChatHistory
);

/**
 * @route GET /api/chatbot/status
 * @desc Get chatbot service status
 * @access Private
 */
router.get('/status',
    verifyToken,
    chatbotController.getServiceStatus
);

/**
 * @route GET /api/chatbot/health-report
 * @desc Generate AI-powered health report for dashboard stats
 * @access Private
 */
router.get('/health-report',
    verifyToken,
    async (req, res) => {
        try {
            const aiUtils = require('../services/aiUtils');
            
            // In a real implementation, you'd fetch user's plants from database
            // For now, we'll generate a sample report
            const samplePlants = [
                { health_score: 85, care_recommendations: [] },
                { health_score: 72, care_recommendations: ['Increase watering frequency'] },
                { health_score: 45, care_recommendations: ['Move to warmer location', 'Increase light exposure'] }
            ];
            
            const healthReport = aiUtils.generateHealthReport(samplePlants);
            
            res.json({
                success: true,
                data: healthReport
            });
        } catch (error) {
            console.error('Health report generation error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate health report'
            });
        }
    }
);

/**
 * @route POST /api/chatbot/plant-stats
 * @desc Calculate AI-powered plant statistics
 * @access Private
 */
router.post('/plant-stats',
    [
        verifyToken,
        body('sensor_data').isObject().withMessage('Sensor data is required'),
        body('plant_id').optional().isNumeric()
    ],
    async (req, res) => {
        try {
            const aiUtils = require('../services/aiUtils');
            const { sensor_data, historical_data, plant_id } = req.body;
            
            const plantStats = aiUtils.calculatePlantStats(sensor_data, historical_data);
            
            res.json({
                success: true,
                data: {
                    plant_id: plant_id || null,
                    stats: plantStats,
                    calculated_at: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Plant stats calculation error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to calculate plant stats'
            });
        }
    }
);

module.exports = router;