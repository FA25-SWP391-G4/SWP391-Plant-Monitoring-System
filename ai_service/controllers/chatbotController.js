const OpenAI = require('openai');
const ChatbotLog = require('../models/ChatbotLog');
const sensorService = require('../services/sensorService');
const { detectLanguage, getSystemPrompt, createContext, processResponse } = require('../utils/languageUtils');

// Khởi tạo OpenAI client với OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || 'MISSING_API_KEY',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
    'X-Title': 'Smart Garden Assistant'
  }
});

const chatbotController = {
  async handleMessage(req, res) {
    try {
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
        
        return res.json({
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
    }
  },
  
  // Lấy lịch sử trò chuyện
  getChatHistory: async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: true, message: 'User ID không được để trống' });
      }
      
      // Lấy lịch sử chat từ database
      const chatHistory = await ChatbotLog.getByUserId(userId, 10);
      
      return res.json({
        success: true,
        history: chatHistory
      });
      
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử chat:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi lấy lịch sử chat',
        details: error.message
      });
    }
  },
  
  // API giả lập dữ liệu cảm biến cho giao diện
  simulateData: async (req, res) => {
    try {
      const plantId = req.query.plantId || 1;
      
      // Lấy thông tin cây trồng và dữ liệu cảm biến
      const plantInfo = await sensorService.getPlantInfo(plantId);
      const sensorData = await sensorService.getLatestSensorData(plantId);
      const wateringHistory = await sensorService.getWateringHistory(plantId, 3);
      
      // Tạo các kịch bản test khác nhau
      const testScenarios = [
        {
          id: 1,
          name: "Thiếu nước",
          description: "Độ ẩm đất thấp, cần tưới nước ngay",
          sampleQuestion: "Cây của tôi có vẻ héo, tôi nên làm gì?",
          modifiedData: {
            ...sensorData,
            soilMoisture: Math.max(5, plantInfo.optimalSoilMoisture.min - 15)
          }
        },
        {
          id: 2,
          name: "Quá nóng",
          description: "Nhiệt độ cao hơn mức tối ưu",
          sampleQuestion: "Tại sao lá cây của tôi bị vàng?",
          modifiedData: {
            ...sensorData,
            temperature: plantInfo.optimalTemp.max + 5
          }
        },
        {
          id: 3,
          name: "Thiếu ánh sáng",
          description: "Mức ánh sáng thấp hơn mức tối ưu",
          sampleQuestion: "Cây của tôi phát triển chậm, tại sao vậy?",
          modifiedData: {
            ...sensorData,
            lightLevel: Math.max(100, plantInfo.optimalLight.min - 200)
          }
        },
        {
          id: 4,
          name: "Điều kiện tối ưu",
          description: "Tất cả các thông số đều trong phạm vi tối ưu",
          sampleQuestion: "Làm thế nào để duy trì cây khỏe mạnh?",
          modifiedData: {
            ...sensorData,
            temperature: (plantInfo.optimalTemp.min + plantInfo.optimalTemp.max) / 2,
            soilMoisture: (plantInfo.optimalSoilMoisture.min + plantInfo.optimalSoilMoisture.max) / 2,
            humidity: (plantInfo.optimalHumidity.min + plantInfo.optimalHumidity.max) / 2,
            lightLevel: (plantInfo.optimalLight.min + plantInfo.optimalLight.max) / 2,
            soilPH: (plantInfo.optimalPH.min + plantInfo.optimalPH.max) / 2
          }
        },
        {
          id: 5,
          name: "Độ pH không phù hợp",
          description: "Độ pH đất không phù hợp với loại cây",
          sampleQuestion: "Tại sao cây của tôi không hấp thụ chất dinh dưỡng?",
          modifiedData: {
            ...sensorData,
            soilPH: plantInfo.optimalPH.max + 1.5
          }
        }
      ];
      
      res.json({
        plantInfo,
        sensorData,
        wateringHistory,
        testScenarios
      });
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu giả lập:', error);
      res.status(500).json({
        error: 'Đã xảy ra lỗi khi lấy dữ liệu giả lập',
        details: error.message
      });
    }
  }
};

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
    }
    
    // Thêm thông tin cây trồng và dữ liệu cảm biến vào prompt nếu có
    if (contextData && Object.keys(contextData).length > 0) {
      const contextMessage = createContext(
        contextData.plantInfo || {}, 
        contextData.sensorData || {}, 
        contextData.wateringHistory || [],
        []
      );
      messages.push({ role: 'user', content: contextMessage });
    }
    
    // Thêm tin nhắn hiện tại
    messages.push({ role: 'user', content: message });
    
    // Gọi API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
      timeout: 30000 // 30 giây timeout
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`OpenRouter API response time: ${responseTime}ms`);
    
    // Trích xuất phản hồi
    if (completion.choices && 
        completion.choices.length > 0 && 
        completion.choices[0].message) {
      return completion.choices[0].message.content;
    } else {
      throw new Error('Không nhận được phản hồi hợp lệ từ API');
    }
    
  } catch (error) {
    console.error('Lỗi khi gọi OpenRouter API:', error);
    if (error.response) {
      console.error('Chi tiết lỗi API:', error.response.data);
    }
    
    // Trả về phản hồi dự phòng nếu API gặp lỗi
    return language === 'vi'
      ? 'Xin lỗi, tôi đang gặp khó khăn trong việc xử lý yêu cầu của bạn. Vui lòng thử lại sau hoặc đặt câu hỏi khác.'
      : 'Sorry, I am experiencing difficulties processing your request. Please try again later or ask a different question.';
  }
}

// Hàm giả lập lịch sử chat
function getMockChatHistory(userId) {
  // Trong thực tế, dữ liệu này sẽ được lấy từ cơ sở dữ liệu
  return [
    {
      id: '1',
      userId: userId,
      message: 'Làm thế nào để chăm sóc cây cảnh trong nhà?',
      response: 'Để chăm sóc cây cảnh trong nhà, bạn cần chú ý đến ánh sáng, nước và độ ẩm. Hầu hết các loại cây cảnh trong nhà cần ánh sáng gián tiếp, tưới nước khi đất khô và độ ẩm vừa phải.',
      timestamp: new Date(Date.now() - 86400000).toISOString() // 1 ngày trước
    },
    {
      id: '2',
      userId: userId,
      message: 'Cây của tôi có lá vàng, tôi nên làm gì?',
      response: 'Lá vàng có thể do nhiều nguyên nhân như tưới nước quá nhiều, thiếu ánh sáng hoặc thiếu dinh dưỡng. Bạn nên kiểm tra độ ẩm của đất, vị trí đặt cây và xem xét bón phân nếu cần.',
      timestamp: new Date(Date.now() - 43200000).toISOString() // 12 giờ trước
    },
    {
      id: '3',
      userId: userId,
      message: 'Làm thế nào để nhân giống cây?',
      response: 'Có nhiều cách để nhân giống cây như giâm cành, gieo hạt, chiết cành hoặc tách cây con. Mỗi phương pháp phù hợp với từng loại cây khác nhau. Bạn muốn nhân giống loại cây nào?',
      timestamp: new Date(Date.now() - 3600000).toISOString() // 1 giờ trước
    }
  ];
}

module.exports = chatbotController;