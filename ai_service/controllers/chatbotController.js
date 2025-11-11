const { validationResult } = require('express-validator');
const openRouterService = require('../services/openRouterService');
const ChatHistory = require('../models/ChatHistory');
const { initializeTensorFlow } = require('../services/aiUtils');
const jwt = require('jsonwebtoken');
const OpenAI = require('openai');
const sensorService = require('../services/sensorService');
const { detectLanguage, getSystemPrompt, createContext, processResponse } = require('../utils/languageUtils');

/**
 * Process chatbot queries
 */
const processChatbotQuery = async (req, res) => {
  try {
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
        const chatResult = await openRouterService.generateChatCompletion(
            message,
            conversationHistory,
            context || {}
        );
        
        // Store the conversation in database
        await ChatHistory.createChat(
            userId,
            message,
            chatResult.response,
            plant_id,
            conversationId,
            {
                ...context,
                source: chatResult.source,
                model: chatResult.model,
                confidence: chatResult.confidence,
                isPlantRelated: chatResult.isPlantRelated
            }
        );
        
        console.log(`Chatbot response generated via ${chatResult.source}, plant-related: ${chatResult.isPlantRelated}, confidence: ${chatResult.confidence}`);

        return res.json({
          success: true,
          response: aiResponse,
          sensorData,
          plantInfo,
          responseTime,
          hasError
        });
      } catch (aiError) {
        console.error('Lỗi khi gọi API AI:', aiError);
        
        // Trả về thông báo lỗi thân thiện
        const errorMessage = language === 'vi' 
          ? 'Xin lỗi, tôi đang gặp vấn đề kỹ thuật. Vui lòng thử lại sau ít phút.'
          : 'Sorry, I am experiencing technical issues. Please try again in a few minutes.';
          
        return res.status(500).json({
          success: false,
          error: true,
          response: errorMessage,
          details: aiError.message
        });
      }
    } catch (error) {
      console.error('Lỗi khi xử lý tin nhắn:', error);
      
      const errorMessage = req.body.language === 'vi'
        ? 'Đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại.'
        : 'An error occurred while processing your message. Please try again.';
        
      return res.status(500).json({
        error: true,
        message: errorMessage,
        response: errorMessage,
        language: language,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
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