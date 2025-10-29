<<<<<<< HEAD
const { validationResult } = require('express-validator');
const openRouterService = require('../services/openRouterService');
const ChatHistory = require('../models/ChatHistory');
const { initializeTensorFlow } = require('../services/aiUtils');
const jwt = require('jsonwebtoken');
=======
const OpenAI = require('openai');
const ChatbotLog = require('../models/ChatbotLog');
const sensorService = require('../services/sensorService');
const { detectLanguage, getSystemPrompt, createContext, processResponse } = require('../utils/languageUtils');
>>>>>>> 1d1e2513b9e8ac5f36f74d326d2a76f901e82987

/**
 * Process chatbot queries
 */
const processChatbotQuery = async (req, res) => {
    try {
<<<<<<< HEAD
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
=======
      const { message, user_id, context, plantId = 1 } = req.body;
      
      // Detect language from message
      const detectedLanguage = detectLanguage(message, req.user?.language_preference);
      console.log(`[Chatbot] Detected language: ${detectedLanguage} for message: "${message.substring(0, 50)}..."`);
      
      const userId = user_id || req.user?.user_id;
      
      if (!message || message.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          error: 'Thiếu nội dung tin nhắn'
        });
      }
      
      // Lấy thông tin cây trồng
      let plantInfo;
      let sensorData;
      let wateringHistory;
      let hasError = false;
      
      try {
        // Lấy thông tin cây trồng
        plantInfo = await sensorService.getPlantInfo(plantId);
        
        // Lấy dữ liệu cảm biến mới nhất
        sensorData = await sensorService.getLatestSensorData(plantId);
        
        // Lấy lịch sử tưới nước
        wateringHistory = await sensorService.getWateringHistory(plantId, 3);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu cây trồng:', error);
        hasError = true;
        // Tạo dữ liệu mặc định để tránh lỗi
        plantInfo = {
          name: 'Cây không xác định',
          plant_type: 'Không có thông tin',
          description: 'Không có thông tin chi tiết',
          careInstructions: 'Không có hướng dẫn cụ thể',
          optimalSoilMoisture: { min: 40, max: 60 },
          optimalTemp: { min: 20, max: 30 },
          optimalLight: { min: 2000, max: 4000 },
          optimalHumidity: { min: 40, max: 60 },
          optimalPH: { min: 6.0, max: 7.0 }
        };
        
        sensorData = {
          temperature: 25,
          soilMoisture: 50,
          humidity: 50,
          lightLevel: 3000,
          soilPH: 6.5
        };
        
        wateringHistory = [];
      }
      
      // Lấy lịch sử chat gần đây
      let recentChats = [];
      try {
        if (plantId) {
          recentChats = await ChatbotLog.getByPlantId(plantId, 5);
        }
      } catch (error) {
        console.error('Lỗi khi lấy lịch sử chat:', error);
        // Sử dụng dữ liệu mẫu nếu không thể truy cập cơ sở dữ liệu
        recentChats = [
          { user_message: 'Cây của tôi có vẻ không khỏe', ai_response: 'Tôi sẽ kiểm tra dữ liệu cảm biến để xem vấn đề là gì.' },
          { user_message: 'Khi nào tôi nên tưới cây?', ai_response: 'Dựa trên độ ẩm đất hiện tại, bạn nên tưới cây trong 2 ngày tới.' }
        ];
      }
      
      // Đo thời gian phản hồi để tối ưu hiệu suất
      const startTime = Date.now();
      
      try {
        // Prepare context for AI with language support
        const contextMessage = createContext(plantInfo, sensorData, wateringHistory, recentChats, detectedLanguage);
        
        // Get language-specific system prompt
        const systemPrompt = getSystemPrompt(detectedLanguage);
        
        console.log(`[Chatbot] Using system prompt for ${detectedLanguage}`);
        
        // Call OpenRouter API with Mistral model
        const completion = await openai.chat.completions.create({
          model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextMessage },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 500
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const rawResponse = completion.choices[0].message.content;
        
        // Process response for language-specific improvements
        const aiResponse = processResponse(rawResponse, detectedLanguage);
        
        console.log(`[Chatbot] Generated response in ${responseTime}ms: "${aiResponse.substring(0, 100)}..."`);
        
        // Save chat log to database
        try {
          await ChatbotLog.create({
            userId: userId || 'anonymous',
            message: message,
            response: aiResponse,
            plantId,
            language: detectedLanguage,
            contextData: {
              plantInfo,
              sensorData,
              wateringHistory,
              detectedLanguage
            }
          });
        } catch (logError) {
          console.error('Unable to save chat log:', logError);
        }
>>>>>>> 1d1e2513b9e8ac5f36f74d326d2a76f901e82987
        
        console.log(`Chatbot response generated via ${chatResult.source}, plant-related: ${chatResult.isPlantRelated}, confidence: ${chatResult.confidence}`);

        return res.json({
<<<<<<< HEAD
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

        return res.status(500).json({
            success: false,
            message: 'Failed to process chatbot query',
            error: error.message
        });
=======
          success: true,
          response: aiResponse,
          language: detectedLanguage,
          sensorData,
          plantInfo,
          responseTime,
          hasError,
          confidence: 0.95,
          conversation_id: `conv_${Date.now()}`,
          timestamp: new Date().toISOString()
        });
      } catch (aiError) {
        console.error('Error calling AI API:', aiError);
        
        // Return friendly error message in detected language
        const errorMessage = detectedLanguage === 'vi' 
          ? 'Xin lỗi, tôi đang gặp vấn đề kỹ thuật. Vui lòng thử lại sau ít phút.'
          : 'Sorry, I am experiencing technical issues. Please try again in a few minutes.';
          
        return res.status(500).json({
          success: false,
          error: true,
          response: errorMessage,
          language: detectedLanguage,
          details: process.env.NODE_ENV === 'development' ? aiError.message : undefined
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Try to detect language from the message for error response
      const language = detectLanguage(req.body.message || '');
      
      const errorMessage = req.body.language === 'vi'
        ? 'Đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại.'
        : 'An error occurred while processing your message. Please try again.';
        
      return res.status(500).json({
        success: false,
        error: true,
        message: errorMessage,
        response: errorMessage,
        language: language,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
>>>>>>> 1d1e2513b9e8ac5f36f74d326d2a76f901e82987
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

<<<<<<< HEAD
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
=======
Đừng đề cập đến việc bạn đang xem dữ liệu cảm biến hoặc ngữ cảnh này trong câu trả lời của bạn.
Trả lời như thể bạn tự nhiên biết thông tin này.`;
  } else {
    return `You are a Smart Garden Assistant, an AI expert in plant care and gardening.
Your task is to help users care for their plants based on real-time sensor data.

When responding:
1. Analyze sensor data and compare with optimal values for the specific plant type
2. Provide warnings if any parameters are outside the optimal range
3. Suggest specific actions based on data (watering, adjusting light, etc.)
4. Use watering history to provide appropriate advice
5. Keep answers concise, friendly and helpful
6. If there's not enough information, ask for more details

HANDLING SPECIAL SITUATIONS:
- If the user asks about topics unrelated to plants or gardening, politely explain that you are a Smart Garden Assistant and can only help with plant and gardening related issues. Suggest they ask about plant care instead.
- If the user asks about a plant type not in your data, inform them that you don't have detailed information about that specific plant in your system, but you can provide general care advice for similar plants.
- If sensor data is unavailable or incomplete, inform the user and provide general advice based on knowledge of the plant type.

Don't mention that you're looking at sensor data or this context in your response.
Respond as if you naturally know this information.`;
  }
}

// Hàm tạo ngữ cảnh cho AI
// Context creation is now handled by languageUtils

// Hàm gọi OpenRouter API với Mistral 7B Instruct
async function callOpenRouterAPI(message, context = [], contextData = {}, language = 'vi') {
  try {
    const startTime = Date.now();
    
    // Sử dụng OpenAI client đã được khởi tạo ở trên
    const systemPrompt = getSystemPrompt(language);
    
    // Chuẩn bị tin nhắn cho API
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Thêm context nếu có
    if (context && context.length > 0) {
      context.forEach(item => {
        messages.push({ role: 'user', content: item.message || item.user_message });
        messages.push({ role: 'assistant', content: item.response || item.ai_response });
      });
>>>>>>> 1d1e2513b9e8ac5f36f74d326d2a76f901e82987
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