const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct';
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second base delay
    
    if (!this.apiKey) {
      console.error('OpenRouter API key not found in environment variables');
    }
  }

  /**
   * System prompt chuyên về cây trồng với scope limitation
   */
  getSystemPrompt() {
    return `Bạn là một chuyên gia tư vấn cây trồng AI thông minh. Nhiệm vụ của bạn:

PHẠM VI HOẠT ĐỘNG NGHIÊM NGẶT:
- CHỈ trả lời các câu hỏi liên quan đến: cây trồng, chăm sóc cây, bệnh cây, sâu hại, tưới nước, phân bón, ánh sáng, nhiệt độ, độ ẩm, đất trồng, nhân giống cây
- TUYỆT ĐỐI TỪ CHỐI: thời tiết, tin tức, giải trí, nấu ăn, y tế con người, chính trị, thể thao, công nghệ không liên quan đến cây

KIỂM TRA NGHIÊM NGẶT:
- Nếu câu hỏi KHÔNG liên quan đến cây trồng → Trả lời: "Tôi chỉ có thể tư vấn về cây trồng và chăm sóc cây. Bạn có câu hỏi gì về cây của mình không?"
- Nếu câu hỏi mơ hồ → Yêu cầu làm rõ về loại cây và vấn đề cụ thể

CÁCH THỨC TRẢ LỜI:
- Trả lời bằng tiếng Việt, ngắn gọn và dễ hiểu (tối đa 200 từ)
- Đưa ra lời khuyên thực tế, khoa học và có thể áp dụng ngay
- Khi phát hiện bệnh phức tạp → Đề xuất: "Hãy chụp ảnh lá cây và sử dụng tính năng nhận diện bệnh để chẩn đoán chính xác hơn"
- Luôn khuyến khích quan sát cây cẩn thận và theo dõi thay đổi

KHAI THÁC NGỮ CẢNH:
- Ưu tiên sử dụng dữ liệu cảm biến thực tế (độ ẩm đất, nhiệt độ, độ ẩm không khí)
- Tham khảo lịch sử tưới nước và chăm sóc
- Đưa ra khuyến nghị cụ thể cho từng loại cây

TÍCH HỢP TÍNH NĂNG:
- Khi cần chẩn đoán bệnh → "Sử dụng tính năng nhận diện bệnh qua ảnh để có kết quả chính xác"
- Khi cần dự báo tưới → "Hệ thống sẽ phân tích dữ liệu cảm biến và đưa ra khuyến nghị tưới nước tối ưu"

QUAN TRỌNG: Nếu không chắc chắn câu hỏi có liên quan đến cây trồng hay không, hãy TỪ CHỐI và yêu cầu hỏi về cây trồng.`;
  }

  /**
   * Retry logic với exponential backoff
   */
  async retryWithBackoff(fn, retries = this.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        const delay = this.retryDelay * (this.maxRetries - retries + 1);
        console.log(`OpenRouter API call failed, retrying in ${delay}ms... (${retries} retries left)`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(fn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Kiểm tra lỗi có thể retry được không
   */
  isRetryableError(error) {
    if (!error.response) return true; // Network errors
    
    const status = error.response.status;
    return status >= 500 || status === 429; // Server errors or rate limiting
  }

  /**
   * Gọi OpenRouter API với retry logic
   */
  async callOpenRouterAPI(messages, options = {}) {
    const requestData = {
      model: this.model,
      messages: messages,
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
      top_p: options.topP || 0.9,
      stream: false
    };

    const apiCall = async () => {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
            'X-Title': 'Plant Monitoring AI Assistant'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      return response.data;
    };

    return this.retryWithBackoff(apiCall);
  }

  /**
   * Content filtering và scope restriction
   */
  filterAndValidateMessage(userMessage) {
    const message = userMessage.toLowerCase().trim();
    
    // Danh sách từ khóa liên quan đến cây trồng
    const plantKeywords = [
      // Cây trồng cơ bản
      'cây', 'lá', 'rễ', 'thân', 'cành', 'hoa', 'quả', 'bông', 'nụ',
      // Chăm sóc
      'tưới', 'nước', 'phân', 'bón', 'cắt', 'tỉa', 'trồng', 'gieo', 'ươm',
      // Bệnh và sâu hại
      'bệnh', 'sâu', 'rệp', 'nấm', 'vi khuẩn', 'virus', 'héo', 'chết', 'úng',
      // Triệu chứng
      'vàng', 'nâu', 'đen', 'đốm', 'rụng', 'khô', 'thối', 'cong', 'quăn',
      // Môi trường
      'đất', 'chậu', 'ánh sáng', 'nắng', 'bóng', 'nhiệt độ', 'độ ẩm', 'gió',
      // Loại cây phổ biến
      'hoa hồng', 'lan', 'sen đá', 'xương rồng', 'cactus', 'bonsai', 'cảnh',
      'rau', 'củ', 'quả', 'gia vị', 'thảo mộc', 'dược liệu',
      // Công cụ chăm sóc
      'chậu', 'xẻng', 'kéo', 'vòi', 'phun', 'thuốc', 'kích thích'
    ];
    
    // Danh sách chủ đề bị cấm (kiểm tra nghiêm ngặt)
    const forbiddenTopics = [
      // Thời tiết và khí hậu chung
      'thời tiết', 'weather', 'mưa', 'nắng', 'gió', 'bão', 'lũ',
      // Y tế con người
      'cảm cúm', 'cảm lạnh', 'sốt', 'đau đầu', 'bác sĩ', 'bệnh viện', 'thuốc người', 'sức khỏe người',
      // Nấu ăn
      'nấu ăn', 'món ăn', 'công thức', 'phở', 'cơm', 'chế biến thức ăn',
      // Giải trí
      'phim', 'nhạc', 'game', 'thể thao', 'bóng đá', 'ca sĩ', 'diễn viên',
      // Công nghệ không liên quan
      'điện thoại', 'máy tính', 'internet', 'facebook', 'youtube', 'wifi',
      // Chính trị và xã hội
      'chính trị', 'bầu cử', 'tổng thống', 'thủ tướng', 'đảng',
      // Tài chính
      'bitcoin', 'tiền', 'đầu tư', 'chứng khoán', 'ngân hàng', 'vay vốn',
      // Du lịch
      'du lịch', 'khách sạn', 'máy bay', 'tàu xe', 'đà lạt',
      // Thể thao
      'đội bóng', 'thắng thua', 'trận đấu', 'world cup'
    ];
    
    // Kiểm tra từ khóa cấm trước
    const hasForbiddenContent = forbiddenTopics.some(topic => 
      message.includes(topic)
    );
    
    if (hasForbiddenContent) {
      return {
        isValid: false,
        reason: 'forbidden_topic',
        suggestion: 'Tôi chỉ có thể tư vấn về cây trồng và chăm sóc cây. Bạn có câu hỏi gì về cây của mình không?'
      };
    }
    
    // Kiểm tra có từ khóa liên quan đến cây trồng
    const hasPlantContent = plantKeywords.some(keyword => 
      message.includes(keyword)
    );
    
    // Kiểm tra các câu hỏi mơ hồ (không có từ khóa cây trồng cụ thể)
    const vaguePhrases = [
      'làm sao để tốt hơn', 'thế nào là đúng', 'tại sao lại như vậy', 
      'có nên làm không', 'có thể giúp', 'giúp tôi với'
    ];
    
    const isVague = vaguePhrases.some(phrase => message.includes(phrase)) || 
                   (!hasPlantContent && (message.includes('làm sao') || message.includes('thế nào') || 
                    message.includes('tại sao') || message.includes('có nên') || message.includes('giúp tôi')));
    
    if (isVague) {
      return {
        isValid: false,
        reason: 'vague_question',
        suggestion: 'Bạn có thể hỏi cụ thể hơn về cây trồng không? Ví dụ: "Lá cây của tôi bị vàng", "Khi nào nên tưới cây?", "Cây bị sâu hại phải làm sao?"'
      };
    }
    
    // Nếu không có từ khóa cây trồng và không phải câu chào hỏi
    const greetings = ['chào', 'hello', 'hi', 'xin chào', 'cảm ơn', 'thanks'];
    const isGreeting = greetings.some(greeting => message.includes(greeting));
    
    if (!hasPlantContent && !isGreeting) {
      return {
        isValid: false,
        reason: 'not_plant_related',
        suggestion: 'Tôi chỉ có thể tư vấn về cây trồng và chăm sóc cây. Bạn có câu hỏi gì về cây của mình không?'
      };
    }
    
    return {
      isValid: true,
      reason: 'valid_plant_question'
    };
  }

  /**
   * Tạo response từ chatbot với context và content filtering
   */
  async generateChatResponse(userMessage, context = {}) {
    try {
      // Step 1: Content filtering và scope restriction
      const filterResult = this.filterAndValidateMessage(userMessage);
      
      if (!filterResult.isValid) {
        return {
          success: true,
          response: filterResult.suggestion,
          filtered: true,
          filterReason: filterResult.reason,
          confidence: 1.0
        };
      }

      const messages = [
        {
          role: 'system',
          content: this.getSystemPrompt()
        }
      ];

      // Thêm context nếu có
      if (context.sensorData || context.plantInfo || context.chatHistory) {
        let contextMessage = 'THÔNG TIN NGỮ CẢNH:\n';
        
        if (context.plantInfo) {
          contextMessage += `- Loại cây: ${context.plantInfo.type || 'Không xác định'}\n`;
          contextMessage += `- Tuổi cây: ${context.plantInfo.age || 'Không xác định'}\n`;
        }
        
        if (context.sensorData) {
          contextMessage += `- Độ ẩm đất: ${context.sensorData.soilMoisture || 'N/A'}%\n`;
          contextMessage += `- Nhiệt độ: ${context.sensorData.temperature || 'N/A'}°C\n`;
          contextMessage += `- Độ ẩm không khí: ${context.sensorData.humidity || 'N/A'}%\n`;
        }
        
        if (context.chatHistory && context.chatHistory.length > 0) {
          contextMessage += '\nLỊCH SỬ CHAT GẦN ĐÂY:\n';
          context.chatHistory.slice(-3).forEach(chat => {
            contextMessage += `- Người dùng: ${chat.user_message}\n`;
            contextMessage += `- AI: ${chat.ai_response}\n`;
          });
        }

        messages.push({
          role: 'user',
          content: contextMessage
        });
      }

      // Thêm tin nhắn của người dùng
      messages.push({
        role: 'user',
        content: userMessage
      });

      const response = await this.callOpenRouterAPI(messages);
      
      const aiResponse = response.choices[0].message.content;
      
      // Step 2: Post-process response để tích hợp với disease detection
      const enhancedResponse = this.enhanceResponseWithFeatureSuggestions(aiResponse, userMessage);
      
      return {
        success: true,
        response: enhancedResponse,
        model: this.model,
        usage: response.usage,
        filtered: false
      };

    } catch (error) {
      console.error('OpenRouter API Error:', error.message);
      
      // Fallback response
      return this.getFallbackResponse(userMessage, error);
    }
  }

  /**
   * Enhance AI response với feature suggestions
   */
  enhanceResponseWithFeatureSuggestions(aiResponse, userMessage) {
    const message = userMessage.toLowerCase();
    let enhancedResponse = aiResponse;
    
    // Detect disease-related questions
    const diseaseKeywords = [
      'bệnh', 'sâu', 'rệp', 'nấm', 'vi khuẩn', 'virus', 'đốm', 'vàng', 'nâu', 
      'đen', 'héo', 'thối', 'rụng', 'cong', 'quăn', 'lỗ', 'khô'
    ];
    
    const hasDiseaseKeywords = diseaseKeywords.some(keyword => message.includes(keyword));
    
    if (hasDiseaseKeywords) {
      enhancedResponse += '\n\n💡 **Gợi ý**: Để chẩn đoán chính xác hơn, bạn có thể chụp ảnh lá cây và sử dụng tính năng **Nhận diện bệnh qua ảnh** trong ứng dụng.';
    }
    
    // Detect watering-related questions
    const wateringKeywords = ['tưới', 'nước', 'khô', 'ẩm', 'úng'];
    const hasWateringKeywords = wateringKeywords.some(keyword => message.includes(keyword));
    
    if (hasWateringKeywords) {
      enhancedResponse += '\n\n🌊 **Gợi ý**: Hệ thống có thể phân tích dữ liệu cảm biến và đưa ra **dự báo tưới nước thông minh** dựa trên điều kiện thực tế của cây.';
    }
    
    // Detect care schedule questions
    const scheduleKeywords = ['khi nào', 'bao lâu', 'thường xuyên', 'lịch', 'thời gian'];
    const hasScheduleKeywords = scheduleKeywords.some(keyword => message.includes(keyword));
    
    if (hasScheduleKeywords && hasWateringKeywords) {
      enhancedResponse += '\n\n📅 **Gợi ý**: Bạn có thể thiết lập **lịch tưới tự động** dựa trên AI để cây luôn được chăm sóc tối ưu.';
    }
    
    // Add general monitoring suggestion
    if (!hasDiseaseKeywords && !hasWateringKeywords) {
      enhancedResponse += '\n\n📊 **Lưu ý**: Hãy theo dõi thường xuyên dữ liệu cảm biến (độ ẩm đất, nhiệt độ, độ ẩm không khí) để chăm sóc cây hiệu quả nhất.';
    }
    
    return enhancedResponse;
  }

  /**
   * Fallback system khi API không khả dụng
   */
  getFallbackResponse(userMessage, error) {
    console.log('Using fallback response system');
    
    // Sử dụng content filtering cho fallback
    const filterResult = this.filterAndValidateMessage(userMessage);
    
    if (!filterResult.isValid) {
      return {
        success: true,
        response: filterResult.suggestion,
        fallback: true,
        filtered: true,
        filterReason: filterResult.reason,
        error: error.message
      };
    }

    // Fallback responses cho câu hỏi về cây trồng
    const fallbackResponses = {
      'lá vàng': 'Lá vàng có thể do thiếu nước, thừa nước, thiếu dinh dưỡng hoặc bệnh. Hãy kiểm tra độ ẩm đất và quan sát thêm các triệu chứng khác.',
      'tưới nước': 'Tần suất tưới nước phụ thuộc vào loại cây, thời tiết và độ ẩm đất. Hãy kiểm tra độ ẩm đất bằng cách nhấn ngón tay xuống đất 2-3cm.',
      'phân bón': 'Nên bón phân vào buổi sáng sớm hoặc chiều mát. Sử dụng phân hữu cơ hoặc phân NPK theo hướng dẫn trên bao bì.',
      'bệnh cây': 'Để chẩn đoán chính xác bệnh cây, bạn có thể sử dụng tính năng nhận diện bệnh qua ảnh trong ứng dụng.'
    };

    // Tìm response phù hợp
    for (const [keyword, response] of Object.entries(fallbackResponses)) {
      if (userMessage.toLowerCase().includes(keyword)) {
        return {
          success: true,
          response: response + '\n\n⚠️ Dịch vụ AI tạm thời không khả dụng, đây là phản hồi cơ bản.',
          fallback: true,
          error: error.message
        };
      }
    }

    // Default fallback
    return {
      success: true,
      response: 'Tôi hiểu bạn đang hỏi về cây trồng. Do dịch vụ AI tạm thời không khả dụng, tôi khuyên bạn:\n\n1. Quan sát cây cẩn thận\n2. Kiểm tra độ ẩm đất\n3. Chụp ảnh và sử dụng tính năng nhận diện bệnh\n4. Thử lại sau ít phút\n\n⚠️ Dịch vụ AI sẽ sớm hoạt động trở lại.',
      fallback: true,
      error: error.message
    };
  }

  /**
   * Kiểm tra trạng thái API
   */
  async checkAPIStatus() {
    try {
      const response = await this.callOpenRouterAPI([
        {
          role: 'user',
          content: 'Test connection'
        }
      ]);
      
      return {
        status: 'healthy',
        model: this.model,
        response: response
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new OpenRouterService();