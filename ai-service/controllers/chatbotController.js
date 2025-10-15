const ChatbotLog = require('../models/ChatbotLog');
const sensorService = require('../services/sensorService');
const openRouterService = require('../services/openRouterService');
const { logger, AIServiceError, asyncHandler, retryWithBackoff, GracefulDegradation } = require('../utils/errorHandler');
const { healthMonitor } = require('../services/healthMonitorService');
const monitoringService = require('../services/monitoringService');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Try to load MQTT services, fallback to mock if not available
let mqttIntegrationService;
let aiMqttClient;

try {
  mqttIntegrationService = require('../services/mqttIntegrationService');
  aiMqttClient = require('../mqtt/aiMqttClient');
} catch (error) {
  console.warn('MQTT services not available, using mock client:', error.message);
  mqttIntegrationService = {
    healthCheck: async () => ({ status: 'mock', available: false })
  };
  aiMqttClient = require('../mqtt/mockMqttClient');
}

// Simple UUID generator
function generateUUID() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
}

// Debug log
console.log('🤖 Chatbot Controller initialized with OpenRouter integration');

const chatbotController = {
  /**
   * POST /api/ai/chatbot/message - Main chatbot endpoint
   * Handles user messages with context management and MQTT real-time responses
   */
  handleMessage: asyncHandler(async (req, res) => {
    const startTime = Date.now();
    let currentSessionId = null;

    const {
      message,
      userId,
      plantId = 1,
      language = 'vi',
      sessionId
    } = req.body;

    // Validate input
    if (!message || message.trim() === '') {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'message',
        value: message,
        requirement: 'Message cannot be empty'
      });
    }

    if (!userId) {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'userId',
        value: userId,
        requirement: 'User ID is required'
      });
    }

    logger.info('Chatbot message received', {
      userId,
      plantId,
      messageLength: message.length,
      sessionId,
      language
    });

    try {
      // Check if OpenRouter service is available
      if (!healthMonitor.isServiceAvailable('openRouter')) {
        logger.warn('OpenRouter service unavailable, using fallback');
        const fallbackResponse = GracefulDegradation.chatbotFallback(message, { userId, plantId });

        return res.json({
          ...fallbackResponse,
          sessionId: sessionId || generateUUID(),
          processingTime: Date.now() - startTime
        });
      }

      // Generate or use existing session ID
      currentSessionId = sessionId || generateUUID();

      // Send typing indicator via MQTT
      try {
        await aiMqttClient.publishChatbotTyping(userId, true);
      } catch (mqttError) {
        logger.warn('MQTT typing indicator failed', { error: mqttError.message, userId });
      }

      // Get plant context data with error handling
      let plantInfo = null;
      let sensorData = null;
      let wateringHistory = [];
      let chatHistory = [];

      try {
        // Get plant information with retry
        plantInfo = await retryWithBackoff(
          () => sensorService.getPlantInfo(plantId),
          2,
          1000
        );

        // Get latest sensor data
        sensorData = await sensorService.getLatestSensorData(plantId);

        // Get recent watering history
        wateringHistory = await sensorService.getWateringHistory(plantId, 3);

        // Get recent chat history for context
        if (currentSessionId) {
          chatHistory = await ChatbotLog.getBySessionId(currentSessionId, 5);
        }

        logger.info('Context data retrieved successfully', {
          plantId,
          hasPlantInfo: !!plantInfo,
          hasSensorData: !!sensorData,
          wateringHistoryCount: wateringHistory.length,
          chatHistoryCount: chatHistory.length
        });

      } catch (contextError) {
        logger.warn('Error getting context data, continuing with limited context', {
          error: contextError.message,
          plantId
        });

        // If we can't get context, we can still proceed with basic AI response
        healthMonitor.handleServiceDegradation('database', contextError);
      }

      // Prepare context for AI
      const context = {
        plantInfo,
        sensorData,
        wateringHistory,
        chatHistory
      };

      // Call OpenRouter AI service with retry mechanism
      let aiResult;
      try {
        aiResult = await retryWithBackoff(
          () => openRouterService.generateChatResponse(message, context),
          3,
          2000
        );

        logger.info('AI response generated successfully', {
          confidence: aiResult.confidence,
          responseLength: aiResult.response?.length,
          fallback: aiResult.fallback
        });

      } catch (aiError) {
        logger.error('OpenRouter AI service failed, using fallback', {
          error: aiError.message,
          message: message.substring(0, 100)
        });

        healthMonitor.handleServiceFailure('openRouter', aiError);

        // Use fallback response
        aiResult = GracefulDegradation.chatbotFallback(message, { userId, plantId });
      }

      // Stop typing indicator
      try {
        await aiMqttClient.publishChatbotTyping(userId, false);
      } catch (mqttError) {
        logger.warn('MQTT typing stop failed', { error: mqttError.message, userId });
      }

      // Save chat history with error handling
      try {
        await ChatbotLog.create({
          user_id: userId || 'anonymous',
          plant_id: plantId,
          session_id: currentSessionId,
          user_message: message,
          ai_response: aiResult.response,
          language: language,
          timestamp: new Date()
        });

        logger.info('Chat history saved successfully', { sessionId: currentSessionId });

      } catch (saveError) {
        logger.error('Error saving chat history', {
          error: saveError.message,
          sessionId: currentSessionId,
          userId
        });

        // Don't fail the request if we can't save history
        healthMonitor.handleServiceDegradation('database', saveError);
      }

      // Publish response via MQTT for real-time updates
      try {
        await aiMqttClient.publishChatbotResponse(userId, {
          response: aiResult.response,
          sessionId: currentSessionId,
          plantContext: context.plantInfo,
          confidence: aiResult.confidence || 0.8,
          fallback: aiResult.fallback || false
        });

        logger.info('MQTT response published successfully', { userId, sessionId: currentSessionId });

      } catch (mqttError) {
        logger.warn('MQTT response publish failed', {
          error: mqttError.message,
          userId,
          sessionId: currentSessionId
        });

        healthMonitor.handleServiceDegradation('mqtt', mqttError);
      }

      const responseTime = Date.now() - startTime;

      // Track metrics for monitoring
      const isPlantRelated = !aiResult.fallback && aiResult.confidence > 0.5;
      monitoringService.trackChatbotRequest(
        startTime,
        Date.now(),
        isPlantRelated,
        aiResult.fallback || false
      );

      // Return successful response
      const response = {
        success: true,
        response: aiResult.response,
        sessionId: currentSessionId,
        responseTime: responseTime,
        confidence: aiResult.confidence || 0.8,
        fallback: aiResult.fallback || false,
        context: {
          plantInfo,
          sensorData,
          wateringHistory: wateringHistory.length > 0 ? wateringHistory : null
        }
      };

      logger.info('Chatbot response completed successfully', {
        userId,
        plantId,
        sessionId: currentSessionId,
        responseTime,
        confidence: response.confidence,
        fallback: response.fallback
      });

      return res.json(response);

    } catch (error) {
      logger.error('Critical error in chatbot handleMessage', {
        error: error.message,
        stack: error.stack,
        userId,
        plantId,
        sessionId: currentSessionId
      });

      // Stop typing indicator on error
      try {
        if (userId) {
          await aiMqttClient.publishChatbotTyping(userId, false);
        }
      } catch (mqttError) {
        logger.warn('MQTT typing stop on error failed', { error: mqttError.message });
      }

      // Track error metrics
      monitoringService.trackError(error, { 
        context: 'chatbot_message_handling',
        userId,
        plantId,
        sessionId: currentSessionId
      });

      // Track fallback usage
      monitoringService.trackChatbotRequest(
        startTime,
        Date.now(),
        false, // not plant related due to error
        true   // used fallback
      );

      // Use fallback response for critical errors
      const fallbackResponse = GracefulDegradation.chatbotFallback(message, { userId, plantId });

      return res.status(500).json({
        ...fallbackResponse,
        sessionId: currentSessionId,
        processingTime: Date.now() - startTime,
        error: {
          code: 'AI_002',
          message: 'Đã xảy ra lỗi khi xử lý tin nhắn',
          retryable: true
        }
      });
    }
  }),

  /**
   * GET /api/ai/chatbot/history/:sessionId - Get chat history by session
   */
  getChatHistory: asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { limit = 20 } = req.query;

    if (!sessionId) {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'sessionId',
        value: sessionId,
        requirement: 'Session ID is required'
      });
    }

    logger.info('Getting chat history', { sessionId, limit });

    // Check database availability
    if (!healthMonitor.isServiceAvailable('database')) {
      throw new AIServiceError('DATABASE_ERROR', {
        operation: 'getChatHistory',
        sessionId
      });
    }

    const chatHistory = await retryWithBackoff(
      () => ChatbotLog.getBySessionId(sessionId, parseInt(limit)),
      2,
      1000
    );

    logger.info('Chat history retrieved successfully', {
      sessionId,
      count: chatHistory.length
    });

    return res.json({
      success: true,
      sessionId,
      count: chatHistory.length,
      history: chatHistory
    });
  }),

  /**
   * GET /api/ai/chatbot/sessions/:userId - Get chat sessions for user
   */
  getChatSessions: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    if (!userId) {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'userId',
        value: userId,
        requirement: 'User ID is required'
      });
    }

    logger.info('Getting chat sessions', { userId, limit });

    // Check database availability
    if (!healthMonitor.isServiceAvailable('database')) {
      throw new AIServiceError('DATABASE_ERROR', {
        operation: 'getChatSessions',
        userId
      });
    }

    // Get recent sessions for user
    const sessions = await retryWithBackoff(
      () => ChatbotLog.getSessionsByUserId(userId, parseInt(limit)),
      2,
      1000
    );

    logger.info('Chat sessions retrieved successfully', {
      userId,
      count: sessions.length
    });

    return res.json({
      success: true,
      userId,
      count: sessions.length,
      sessions
    });
  }),

  /**
   * DELETE /api/ai/chatbot/session/:sessionId - Delete chat session
   */
  deleteSession: asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new AIServiceError('VALIDATION_ERROR', {
        field: 'sessionId',
        value: sessionId,
        requirement: 'Session ID is required'
      });
    }

    logger.info('Deleting chat session', { sessionId });

    // Check database availability
    if (!healthMonitor.isServiceAvailable('database')) {
      throw new AIServiceError('DATABASE_ERROR', {
        operation: 'deleteSession',
        sessionId
      });
    }

    const deletedCount = await retryWithBackoff(
      () => ChatbotLog.deleteBySessionId(sessionId),
      2,
      1000
    );

    logger.info('Chat session deleted successfully', {
      sessionId,
      deletedCount
    });

    return res.json({
      success: true,
      sessionId,
      deletedCount,
      message: `Deleted ${deletedCount} messages from session`
    });
  }),

  /**
   * GET /api/ai/chatbot/status - Get chatbot service status
   */
  getStatus: asyncHandler(async (req, res) => {
    logger.info('Getting chatbot service status');

    const openRouterStatus = await retryWithBackoff(
      () => openRouterService.checkAPIStatus(),
      2,
      1000
    );

    const mqttStatus = await retryWithBackoff(
      () => mqttIntegrationService.healthCheck(),
      2,
      1000
    );

    const overallStatus = openRouterStatus.available && mqttStatus.available ? 'healthy' : 'degraded';

    logger.info('Chatbot service status retrieved', {
      overallStatus,
      openRouterAvailable: openRouterStatus.available,
      mqttAvailable: mqttStatus.available
    });

    return res.json({
      success: true,
      status: overallStatus,
      services: {
        openRouter: openRouterStatus,
        mqtt: mqttStatus
      },
      timestamp: new Date().toISOString()
    });
  })
};

module.exports = chatbotController;