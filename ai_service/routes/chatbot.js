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
        body('conversation_id').optional().isString(),
        body('plant_id').optional().isNumeric(),
        body('context').optional().isObject()
    ],
    chatbotController.processChatbotQuery
);

/**
 * @route GET /api/chatbot/conversation/:conversation_id
 * @desc Get conversation history by conversation ID
 * @access Private
 */
router.get('/conversation/:conversation_id',
    [
        verifyToken,
        param('conversation_id').notEmpty().withMessage('Conversation ID is required')
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

module.exports = router;