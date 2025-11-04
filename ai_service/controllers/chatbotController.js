const OpenAI = require('openai');
const ChatbotLog = require('../models/ChatbotLog');
const sensorService = require('../services/sensorService');

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
      const { message, userId, plantId = 1, language = 'vi' } = req.body;
      
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
        // Chuẩn bị context cho AI
        const contextMessage = createContext(plantInfo, sensorData, wateringHistory, recentChats);
        
        // Gọi API OpenRouter với model Mistral
        const completion = await openai.chat.completions.create({
          model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct',
          messages: [
            { role: 'system', content: getSystemPrompt(language) },
            { role: 'user', content: contextMessage },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 500
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const aiResponse = completion.choices[0].message.content;
        
        // Lưu log chat vào database
        try {
          await ChatbotLog.create({
            userId: userId || 'anonymous',
            message: message,
            response: aiResponse,
            plantId,
            language,
            contextData: {
              plantInfo,
              sensorData,
              wateringHistory
            }
          });
        } catch (logError) {
          console.error('Không thể lưu log chat:', logError);
        }
        
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
        details: error.message,
        response: errorMessage
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
const getUserChatHistory: = async (req, res) => {
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
      console.error('Lỗi khi lấy dữ liệu giả lập:', error);
      res.status(500).json({
        error: 'Đã xảy ra lỗi khi lấy dữ liệu giả lập',
        details: error.message
      });
    }
  }
};

// Hàm tạo system prompt cho AI
function getSystemPrompt(language = 'vi') {
  if (language === 'vi') {
    return `Bạn là Trợ lý Vườn Thông minh, một AI chuyên gia về chăm sóc cây trồng và làm vườn.
Nhiệm vụ của bạn là giúp người dùng chăm sóc cây trồng dựa trên dữ liệu cảm biến thời gian thực.

Khi trả lời:
1. Phân tích dữ liệu cảm biến và so sánh với giá trị tối ưu cho loại cây cụ thể
2. Đưa ra cảnh báo nếu bất kỳ thông số nào nằm ngoài phạm vi tối ưu
3. Đề xuất hành động cụ thể dựa trên dữ liệu (tưới nước, điều chỉnh ánh sáng, v.v.)
4. Sử dụng lịch sử tưới cây để đưa ra lời khuyên phù hợp
5. Trả lời ngắn gọn, thân thiện và hữu ích
6. Nếu không có đủ thông tin, hãy yêu cầu thêm chi tiết

XỬ LÝ CÁC TÌNH HUỐNG ĐẶC BIỆT:
- Nếu người dùng hỏi về chủ đề không liên quan đến cây trồng hoặc làm vườn, hãy lịch sự giải thích rằng bạn là Trợ lý Vườn Thông minh và chỉ có thể giúp đỡ về các vấn đề liên quan đến cây trồng và làm vườn. Gợi ý họ hỏi về chăm sóc cây.
- Nếu người dùng hỏi về loại cây không có trong dữ liệu, hãy thông báo rằng bạn không có thông tin chi tiết về loại cây đó trong hệ thống, nhưng có thể cung cấp lời khuyên chung về chăm sóc cây tương tự.
- Nếu dữ liệu cảm biến không khả dụng hoặc không đầy đủ, hãy thông báo với người dùng và đưa ra lời khuyên chung dựa trên kiến thức về loại cây.

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
function createContext(plantInfo, sensorData, wateringHistory, recentChats) {
  if (!plantInfo || !sensorData) {
    return "No plant data available";
  }
  
  return `
Thông tin cây trồng:
- Tên: ${plantInfo.name}
- Loại: ${plantInfo.type || plantInfo.plant_type}
- Mô tả: ${plantInfo.description || 'Không có mô tả'}
- Yêu cầu chăm sóc: ${plantInfo.careInstructions || 'Không có hướng dẫn cụ thể'}

Dữ liệu cảm biến hiện tại:
- Nhiệt độ: ${sensorData.temperature}°C (Tối ưu: ${plantInfo.optimalTemp?.min || plantInfo.optimal_temperature - 5}-${plantInfo.optimalTemp?.max || plantInfo.optimal_temperature + 5}°C)
- Độ ẩm đất: ${sensorData.soilMoisture || sensorData.moisture}% (Tối ưu: ${plantInfo.optimalSoilMoisture?.min || plantInfo.optimal_moisture - 10}-${plantInfo.optimalSoilMoisture?.max || plantInfo.optimal_moisture + 10}%)
- Độ ẩm không khí: ${sensorData.humidity}% (Tối ưu: 40-70%)
- Ánh sáng: ${sensorData.lightLevel || sensorData.light} lux (Tối ưu: ${plantInfo.optimalLight?.min || plantInfo.optimal_light * 0.7}-${plantInfo.optimalLight?.max || plantInfo.optimal_light * 1.3} lux)

Lịch sử tưới cây gần đây:
${wateringHistory && wateringHistory.length > 0 ? wateringHistory.map(entry => `- Ngày ${new Date(entry.timestamp || entry.date).toLocaleDateString('vi-VN')}: ${entry.amount}ml nước`).join('\n') : '- Không có dữ liệu tưới cây gần đây'}

Lịch sử trò chuyện gần đây:
${recentChats && recentChats.length > 0 ? recentChats.map(chat => `Người dùng: ${chat.user_message || chat.message}\nTrợ lý: ${chat.ai_response || chat.response}`).join('\n\n') : '- Không có lịch sử trò chuyện'}
`;
}

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