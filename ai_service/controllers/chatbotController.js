const { validationResult } = require('express-validator');
const openRouterService = require('../services/openRouterService');
const ChatHistory = require('../models/ChatHistory');
const { initializeTensorFlow } = require('../services/aiUtils');
const jwt = require('jsonwebtoken');

// Rate limiting storage (in production, use Redis)
const userRateLimit = new Map();

/**
 * Sanitize user input to prevent XSS and other attacks
 */
function sanitizeInput(message) {
    if (!message || typeof message !== 'string') {
        return null;
    }
    
    // Remove script tags and other dangerous HTML
    let sanitized = message
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '') // Remove all HTML tags
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    
    // Limit length
    if (sanitized.length > 1000) {
        sanitized = sanitized.substring(0, 1000);
    }
    
    // Must have some content
    if (sanitized.length < 1) {
        return null;
    }
    
    return sanitized;
}

/**
 * Check rate limiting for user
 */
function checkRateLimit(userId) {
    if (!userId) return false;
    
    const now = Date.now();
    const userRequests = userRateLimit.get(userId) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter(time => now - time < 60000);
    
    // Allow max 15 requests per minute
    if (recentRequests.length >= 15) {
        return false;
    }
    
    // Add current request
    recentRequests.push(now);
    userRateLimit.set(userId, recentRequests);
    
    return true;
}

/**
 * Process chatbot queries
 */
const processChatbotQuery = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { message, conversation_id, plant_id, context } = req.body;
        const userId = req.user?.user_id || req.user?.id;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Input validation and sanitization
        const sanitizedMessage = sanitizeInput(message);
        if (!sanitizedMessage) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message content'
            });
        }

        // Rate limiting check
        if (!checkRateLimit(userId)) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please wait a moment before asking another question.'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        // Generate conversation ID if not provided
        const conversationId = conversation_id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        console.log(`Chatbot query received from user ${userId}: "${message.substring(0, 50)}..."`);

        // Get conversation history from database
        const conversationHistory = await ChatHistory.getConversationContext(conversationId, 10);

        // Use OpenRouter service for chat completion
        const startTime = Date.now();
        const chatResult = await openRouterService.generateChatCompletion(
            sanitizedMessage,
            conversationHistory,
            context || {}
        );
        const responseTime = Date.now() - startTime;

        // Log slow responses
        if (responseTime > 5000) {
            console.warn(`Slow chatbot response: ${responseTime}ms for user ${userId}`);
        }
        
        // Store the conversation in database
        await ChatHistory.createChat(
            userId,
            sanitizedMessage,
            chatResult.response,
            plant_id,
            conversationId,
            {
                ...context,
                source: chatResult.source,
                model: chatResult.model,
                confidence: chatResult.confidence,
                isPlantRelated: chatResult.isPlantRelated,
                responseTime: responseTime,
                language: chatResult.language
            }
        );
        
        console.log(`Chatbot response generated via ${chatResult.source}, plant-related: ${chatResult.isPlantRelated}, confidence: ${chatResult.confidence}`);

        return res.json({
            success: true,
            data: {
                response: chatResult.response,
                conversation_id: conversationId,
                timestamp: new Date(),
                isPlantRelated: chatResult.isPlantRelated,
                confidence: chatResult.confidence,
                source: chatResult.source,
                model: chatResult.model,
                usage: chatResult.usage
            }
        });
    } catch (error) {
        console.error('Error processing chatbot query:', error);

        // User-friendly error messages
        let userMessage = 'I\'m having trouble right now. Please try again in a moment.';
        
        if (error.code === 'ECONNREFUSED') {
            userMessage = 'I\'m temporarily unavailable. Please try again later.';
        } else if (error.response?.status === 429) {
            userMessage = 'I\'m getting too many requests right now. Please wait a moment and try again.';
        } else if (error.message.includes('timeout')) {
            userMessage = 'I\'m thinking too slowly right now. Please try a shorter question.';
        }

        return res.status(500).json({
            success: false,
            message: userMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get conversation history
 */
const getConversationHistory = async (req, res) => {
    try {
        const { conversation_id } = req.params;
        const userId = req.user?.user_id || req.user?.id;

        if (!conversation_id) {
            return res.status(400).json({
                success: false,
                message: 'Conversation ID is required'
            });
        }

        // Get conversation history
        const history = await ChatHistory.findByConversationId(conversation_id, 50);
        
        // Filter by user ID for security
        const userHistory = history.filter(chat => chat.user_id === userId);

        return res.json({
            success: true,
            data: {
                conversation_id,
                messages: userHistory.map(chat => chat.toJSON()),
                total: userHistory.length
            }
        });
    } catch (error) {
        console.error('Error getting conversation history:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get conversation history',
            error: error.message
        });
    }
};

/**
 * Get user's chat history
 */
const getUserChatHistory = async (req, res) => {
    try {
        const userId = req.user?.user_id || req.user?.id;
        const limit = parseInt(req.query.limit) || 50;

        // Get user's chat history
        const history = await ChatHistory.findByUserId(userId, limit);

        return res.json({
            success: true,
            data: {
                user_id: userId,
                chats: history.map(chat => chat.toJSON()),
                total: history.length
            }
        });
    } catch (error) {
        console.error('Error getting user chat history:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get user chat history',
            error: error.message
        });
    }
};

/**
 * Get OpenRouter service status
 */
const getServiceStatus = async (req, res) => {
    try {
        const status = openRouterService.getServiceStatus();
        
        return res.json({
            success: true,
            data: {
                service: 'chatbot',
                ...status,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Error getting service status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get service status',
            error: error.message
        });
    }
};

module.exports = {
    processChatbotQuery,
    getConversationHistory,
    getUserChatHistory,
    getServiceStatus
};