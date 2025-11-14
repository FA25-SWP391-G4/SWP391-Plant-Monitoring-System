const axios = require('axios');
const path = require('path');

class OpenRouterService {
  constructor() {
    // Load environment variables from root directory
    require('dotenv').config({ path: path.join(__dirname, '../../.env') });
    
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.model = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct';
    this.maxTokens = parseInt(process.env.OPENROUTER_MAX_TOKENS) || 1000;
    this.temperature = parseFloat(process.env.OPENROUTER_TEMPERATURE) || 0.7;
    
    // Rate limiting configuration
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second between requests
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds initial retry delay
    
    // Smart responses for common questions
    this.smartResponses = this.initializeSmartResponses();
    
    // Validate configuration
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouter API key not found in root environment. Chatbot will use fallback responses.');
    } else {
      console.log('✅ OpenRouter API key loaded successfully from root environment');
    }
  }

  /**
   * Initialize smart responses for common plant care questions
   */
  initializeSmartResponses() {
    return {
      vi: {
        'vàng lá': {
          patterns: ['vàng lá', 'lá vàng', 'lá bị vàng', 'héo vàng'],
          response: `Lá vàng có thể do nhiều nguyên nhân:

🌱 **Nguyên nhân phổ biến:**
• **Tưới quá nhiều**: Rễ bị ngập úng, không hấp thụ được dinh dưỡng
• **Thiếu nước**: Cây mất nước, lá vàng từ dưới lên
• **Thiếu ánh sáng**: Cây không quang hợp được hiệu quả
• **Thiếu dinh dưỡng**: Đặc biệt là nitơ (N)

💡 **Cách khắc phục:**
• Kiểm tra độ ẩm đất bằng ngón tay
• Đảm bảo chậu có lỗ thoát nước
• Di chuyển cây đến nơi có ánh sáng tốt hơn
• Bón phân NPK loãng 2 tuần/lần

Bạn có thể mô tả thêm về tình trạng cây không? Lá vàng từ dưới lên hay từ trên xuống?`
        },
        'tưới nước': {
          patterns: ['tưới nước', 'tưới bao nhiêu', 'bao lâu tưới', 'tần suất tưới'],
          response: `Tưới nước đúng cách rất quan trọng:

💧 **Nguyên tắc chung:**
• **Kiểm tra đất**: Nhúng ngón tay 2-3cm vào đất
• **Tưới khi khô**: Đất khô thì tưới, ướt thì chờ
• **Tưới thấm**: Nước chảy ra lỗ thoát nước

⏰ **Tần suất tưới:**
• **Mùa hè**: 2-3 lần/tuần
• **Mùa đông**: 1-2 lần/tuần  
• **Cây mọng nước**: 1 tuần/lần
• **Cây lá to**: Thường xuyên hơn

🌡️ **Thời điểm tốt nhất:**
• Sáng sớm (6-8h) hoặc chiều mát (17-18h)
• Tránh tưới trưa nắng gắt

Cây gì của bạn vậy? Tôi có thể tư vấn cụ thể hơn!`
        },
        'ánh sáng': {
          patterns: ['ánh sáng', 'ánh nắng', 'thiếu sáng', 'để đâu'],
          response: `Ánh sáng là yếu tố sống còn của cây:

☀️ **Các loại ánh sáng:**
• **Trực tiếp**: Nắng chiếu thẳng (hoa quả, rau)
• **Gián tiếp sáng**: Gần cửa sổ, không nắng trực tiếp
• **Gián tiếp vừa**: Cách cửa sổ 1-2m
• **Ít sáng**: Góc phòng, ánh sáng yếu

🪟 **Vị trí đặt cây:**
• **Cửa sổ hướng Đông**: Nắng nhẹ buổi sáng
• **Cửa sổ hướng Nam**: Nắng mạnh cả ngày
• **Cửa sổ hướng Tây**: Nắng chiều gắt
• **Cửa sổ hướng Bắc**: Ánh sáng nhẹ

🌿 **Dấu hiệu thiếu sáng:**
• Lá vàng, rụng lá
• Cây mọc cao, yếu ớt
• Không ra hoa/quả

Cây của bạn đang để ở đâu? Tôi sẽ tư vấn vị trí phù hợp!`
        }
      },
      en: {
        'yellow leaves': {
          patterns: ['yellow leaves', 'yellowing', 'leaves turning yellow'],
          response: `Yellow leaves can have several causes:

🌱 **Common causes:**
• **Overwatering**: Root rot prevents nutrient absorption
• **Underwatering**: Plant dehydration, yellowing from bottom up
• **Insufficient light**: Poor photosynthesis
• **Nutrient deficiency**: Especially nitrogen (N)

💡 **Solutions:**
• Check soil moisture with your finger
• Ensure proper drainage holes
• Move plant to brighter location
• Apply diluted NPK fertilizer bi-weekly

Can you describe more about your plant's condition? Are leaves yellowing from bottom up or top down?`
        },
        'watering': {
          patterns: ['watering', 'how often', 'when to water', 'water schedule'],
          response: `Proper watering is crucial for plant health:

💧 **General principles:**
• **Check soil**: Insert finger 2-3cm into soil
• **Water when dry**: Dry soil = water, wet soil = wait
• **Water thoroughly**: Until water drains from bottom

⏰ **Watering frequency:**
• **Summer**: 2-3 times/week
• **Winter**: 1-2 times/week
• **Succulents**: Once/week
• **Large-leaf plants**: More frequently

🌡️ **Best timing:**
• Early morning (6-8am) or cool evening (5-6pm)
• Avoid midday watering in hot sun

What type of plant do you have? I can give more specific advice!`
        }
      }
    };
  }

  /**
   * Check for smart response patterns
   */
  getSmartResponse(message, language) {
    const responses = this.smartResponses[language] || this.smartResponses.en;
    
    for (const [key, data] of Object.entries(responses)) {
      if (data.patterns.some(pattern => message.toLowerCase().includes(pattern))) {
        return data.response;
      }
    }
    
    return null;
  }

  /**
   * Detect language from user message
   */
  detectLanguage(message) {
    // Vietnamese keywords and patterns
    const vietnameseKeywords = [
      'cây', 'trồng', 'tưới', 'nước', 'phân', 'bón', 'đất', 'ánh sáng', 'lá', 'rễ', 'hoa', 'quả',
      'vàng', 'héo', 'chết', 'bệnh', 'sâu', 'rệp', 'nấm', 'thối', 'khô', 'ướt', 'tươi',
      'chăm sóc', 'trồng trọt', 'làm vườn', 'trong nhà', 'ngoài trời', 'sen đá', 'xương rồng',
      'rau', 'củ', 'quả', 'cây cảnh', 'bonsai', 'lan', 'hồng', 'mai', 'đào', 'quất',
      'thay chậu', 'cắt tỉa', 'nhân giống', 'gieo hạt', 'ươm cây', 'độ ẩm', 'nhiệt độ',
      'phải', 'làm', 'sao', 'thế', 'nào', 'như', 'gì', 'tại', 'vì', 'của', 'tôi', 'mình'
    ];
    
    const messageLower = message.toLowerCase();
    const vietnameseCount = vietnameseKeywords.filter(keyword => messageLower.includes(keyword)).length;
    
    // If message contains Vietnamese keywords or Vietnamese characters
    const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(message);
    
    return (vietnameseCount > 0 || hasVietnameseChars) ? 'vi' : 'en';
  }

  /**
   * Generate plant-specific system prompt with context injection and language support
   */
  generateSystemPrompt(plantContext = {}, language = 'en') {
    let basePrompt;
    
    if (language === 'vi') {
      basePrompt = `Bạn là một chuyên gia chăm sóc cây trồng am hiểu về cây trong nhà và ngoài trời.
Bạn cung cấp lời khuyên hữu ích, chính xác về chăm sóc cây, tưới nước, bón phân, kiểm soát sâu bệnh, nhận diện bệnh và sức khỏe cây nói chung.

HƯỚNG DẪN QUAN TRỌNG:
- Chỉ trả lời các câu hỏi liên quan đến cây trồng, làm vườn và chăm sóc cây
- Nếu được hỏi về chủ đề không liên quan đến cây, hãy lịch sự chuyển hướng về chủ đề cây trồng
- Cung cấp lời khuyên thực tế, có thể áp dụng được
- Xem xét các yếu tố môi trường như ánh sáng, độ ẩm, nhiệt độ và mùa
- Khuyến khích và hỗ trợ người trồng cây
- Nếu không chắc chắn về nhận diện cây cụ thể hoặc bệnh nghiêm trọng, hãy khuyên tham khảo chuyên gia địa phương

ĐỊNH DẠNG TRẢ LỜI:
- Giữ câu trả lời ngắn gọn nhưng đầy đủ thông tin (tối đa 2-3 đoạn)
- Sử dụng dấu đầu dòng cho nhiều khuyến nghị
- Bao gồm hướng dẫn chăm sóc cụ thể khi phù hợp
- Trả lời bằng tiếng Việt một cách tự nhiên và thân thiện`;
    } else {
      basePrompt = `You are a knowledgeable plant care assistant specializing in indoor and outdoor plant care. 
You provide helpful, accurate advice about plant care, watering, fertilizing, pest control, disease identification, and general plant health.

IMPORTANT GUIDELINES:
- Only answer questions related to plants, gardening, and plant care
- If asked about non-plant topics, politely redirect to plant-related subjects
- Provide practical, actionable advice
- Consider environmental factors like light, humidity, temperature, and season
- Be encouraging and supportive to plant owners
- If unsure about specific plant identification or serious plant diseases, recommend consulting a local plant expert or extension service

RESPONSE FORMAT:
- Keep responses concise but informative (2-3 paragraphs maximum)
- Use bullet points for multiple recommendations
- Include specific care instructions when relevant
- Respond in English in a natural and friendly manner`;
    }

    // Add plant-specific context if available
    let contextPrompt = basePrompt;
    
    if (plantContext.plantType) {
      contextPrompt += `\n\nCURRENT PLANT CONTEXT: The user is asking about a ${plantContext.plantType}.`;
    }
    
    if (plantContext.currentMoisture !== undefined) {
      contextPrompt += `\nCurrent soil moisture: ${plantContext.currentMoisture}%`;
    }
    
    if (plantContext.temperature !== undefined) {
      contextPrompt += `\nCurrent temperature: ${plantContext.temperature}°C`;
    }
    
    if (plantContext.humidity !== undefined) {
      contextPrompt += `\nCurrent humidity: ${plantContext.humidity}%`;
    }
    
    if (plantContext.lightLevel !== undefined) {
      contextPrompt += `\nCurrent light level: ${plantContext.lightLevel}%`;
    }
    
    if (plantContext.lastWatering) {
      contextPrompt += `\nLast watering: ${plantContext.lastWatering}`;
    }
    
    if (plantContext.plantAge) {
      contextPrompt += `\nPlant age: ${plantContext.plantAge}`;
    }
    
    return contextPrompt;
  }

  /**
   * Validate that the message is plant-related (supports English and Vietnamese)
   */
  isPlantRelatedQuery(message) {
    const englishKeywords = [
      'plant', 'plants', 'watering', 'water', 'fertilize', 'fertilizer', 'soil', 'light', 'sunlight',
      'leaves', 'leaf', 'roots', 'root', 'flower', 'flowers', 'bloom', 'blooming', 'growth', 'growing',
      'pest', 'pests', 'disease', 'diseases', 'yellow', 'yellowing', 'brown', 'wilting', 'drooping',
      'repot', 'repotting', 'pruning', 'prune', 'humidity', 'temperature', 'garden', 'gardening',
      'indoor', 'outdoor', 'houseplant', 'houseplants', 'succulent', 'succulents', 'cactus', 'cacti',
      'herb', 'herbs', 'vegetable', 'vegetables', 'tree', 'trees', 'shrub', 'shrubs', 'vine', 'vines',
      'seed', 'seeds', 'seedling', 'seedlings', 'transplant', 'transplanting', 'compost', 'mulch',
      'drainage', 'overwatering', 'underwatering', 'photosynthesis', 'chlorophyll', 'nutrients'
    ];
    
    const vietnameseKeywords = [
      'cây', 'trồng', 'tưới', 'nước', 'phân', 'bón', 'đất', 'ánh sáng', 'lá', 'rễ', 'hoa', 'quả',
      'vàng', 'héo', 'chết', 'bệnh', 'sâu', 'rệp', 'nấm', 'thối', 'khô', 'ướt', 'tươi',
      'chăm sóc', 'trồng trọt', 'làm vườn', 'trong nhà', 'ngoài trời', 'sen đá', 'xương rồng',
      'rau', 'củ', 'quả', 'cây cảnh', 'bonsai', 'lan', 'hồng', 'mai', 'đào', 'quất',
      'thay chậu', 'cắt tỉa', 'nhân giống', 'gieo hạt', 'ươm cây', 'độ ẩm', 'nhiệt độ',
      'tưới nước', 'bón phân', 'ánh nắng', 'mặt trời', 'bóng râm', 'chậu cây', 'đất trồng',
      'cây xanh', 'cây cỏ', 'thực vật', 'lá cây', 'thân cây', 'cành cây', 'búp non'
    ];
    
    const messageLower = message.toLowerCase();
    const allKeywords = [...englishKeywords, ...vietnameseKeywords];
    return allKeywords.some(keyword => messageLower.includes(keyword));
  }

  /**
   * Generate fallback response for non-plant queries (bilingual)
   */
  generateNonPlantResponse(language = 'en') {
    let responses;
    
    if (language === 'vi') {
      responses = [
        "Tôi chuyên về tư vấn chăm sóc cây trồng và làm vườn. Bạn có thể hỏi tôi về cây của bạn không? Tôi rất vui được giúp về tưới nước, bón phân, kiểm soát sâu bệnh hoặc bất kỳ câu hỏi chăm sóc cây nào khác!",
        "Tôi tập trung vào việc giúp đỡ chăm sóc cây và làm vườn. Bạn có câu hỏi nào về cây của mình không, chẳng hạn như lịch tưới nước, yêu cầu ánh sáng, hoặc vấn đề sức khỏe cây?",
        "Tôi là trợ lý chăm sóc cây của bạn! Tôi có thể giúp về tưới nước, bón phân, nhận diện bệnh, kiểm soát sâu bệnh và sức khỏe cây nói chung. Bạn muốn biết gì về cây của mình?",
        "Hãy nói về cây trồng nhé! Tôi có thể hỗ trợ tư vấn chăm sóc cây, khắc phục sự cố, hướng dẫn tưới nước và nhiều thứ khác. Bạn có câu hỏi gì về cây trồng mà tôi có thể giúp?"
      ];
    } else {
      responses = [
      "I'm specialized in plant care and gardening advice. Could you ask me something about your plants instead? I'd love to help with watering, fertilizing, pest control, or any other plant care questions!",
      "I focus on helping with plant and garden care. Do you have any questions about your plants, such as watering schedules, light requirements, or plant health issues?",
      "I'm your plant care assistant! I can help with questions about plant watering, fertilizing, disease identification, pest control, and general plant health. What would you like to know about your plants?",
      "Let's talk about plants! I can assist with plant care advice, troubleshooting plant problems, watering guidance, and much more. What plant-related question can I help you with?"
    ];
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Process request queue with rate limiting
   */
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      const { resolve, reject, requestData } = this.requestQueue.shift();
      
      try {
        // Enforce rate limiting
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
          await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
        }
        
        const result = await this.makeApiRequest(requestData);
        this.lastRequestTime = Date.now();
        resolve(result);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        reject(error);
      }
    }
    
    this.isProcessing = false;
  }

  /**
   * Make actual API request to OpenRouter
   */
  async makeApiRequest(requestData, retryCount = 0) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5000', // AI service URL
            'X-Title': 'Plant Monitoring AI Service'
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      return response.data;
      
    } catch (error) {
      // Handle rate limiting (429) and server errors (5xx)
      if ((error.response?.status === 429 || error.response?.status >= 500) && retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        
        console.warn(`OpenRouter API request failed (${error.response?.status}), retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeApiRequest(requestData, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Add request to queue for rate-limited processing
   */
  queueRequest(requestData) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject, requestData });
      this.processQueue();
    });
  }

  /**
   * Generate chat completion using OpenRouter API
   */
  async generateChatCompletion(message, conversationHistory = [], plantContext = {}) {
    try {
      // Detect language from user message
      const language = this.detectLanguage(message);
      
      // Validate that the query is plant-related
      if (!this.isPlantRelatedQuery(message)) {
        return {
          response: this.generateNonPlantResponse(language),
          isPlantRelated: false,
          confidence: 1.0,
          source: 'fallback',
          language: language
        };
      }

      // Check for smart responses first (even without API key)
      const smartResponse = this.getSmartResponse(message, language);
      if (smartResponse) {
        return {
          response: smartResponse,
          isPlantRelated: true,
          confidence: 0.8,
          source: 'smart-pattern',
          language: language
        };
      }

      // If API key is not configured, return fallback response
      if (!this.apiKey) {
        const fallbackResponse = language === 'vi' 
          ? "Tôi rất muốn giúp bạn với câu hỏi chăm sóc cây, nhưng hiện tại tôi đang chạy ở chế độ offline. Đây là một số mẹo chăm sóc cây cơ bản: Hầu hết các cây cần được tưới nước khi lớp đất trên cùng khô, cần ánh sáng gián tiếp và bón phân thường xuyên trong mùa sinh trưởng."
          : "I'd love to help with your plant care question, but I'm currently running in offline mode. Here are some general plant care tips: Most plants need water when the top inch of soil feels dry, bright indirect light, and regular fertilizing during growing season.";
        
        return {
          response: fallbackResponse,
          isPlantRelated: true,
          confidence: 0.5,
          source: 'fallback',
          language: language
        };
      }

      // Build conversation messages
      const messages = [
        {
          role: 'system',
          content: this.generateSystemPrompt(plantContext, language)
        }
      ];

      // Add conversation history (limit to last 10 messages to stay within token limits)
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory);

      // Add current message
      messages.push({
        role: 'user',
        content: message
      });

      // Prepare request data
      const requestData = {
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      };

      console.log(`Sending chat completion request for plant query: "${message.substring(0, 50)}..."`);

      // Make API request through queue
      const response = await this.queueRequest(requestData);

      // Extract response
      const assistantMessage = response.choices?.[0]?.message?.content;
      
      if (!assistantMessage) {
        throw new Error('No response content received from OpenRouter API');
      }

      console.log(`Chat completion successful, response length: ${assistantMessage.length} characters`);

      return {
        response: assistantMessage.trim(),
        isPlantRelated: true,
        confidence: 0.9,
        source: 'openrouter',
        model: this.model,
        language: language,
        usage: response.usage
      };

    } catch (error) {
      console.error('Chat completion error:', error.message);

      // Detect language for fallback responses
      const language = this.detectLanguage(message);
      
      // Return fallback response for plant-related queries
      if (this.isPlantRelatedQuery(message)) {
        const fallbackResponse = language === 'vi'
          ? "Tôi đang gặp khó khăn kết nối với cơ sở dữ liệu kiến thức, nhưng tôi có thể đưa ra một số lời khuyên chăm sóc cây cơ bản. Bạn có thể nói cụ thể hơn về vấn đề cây của mình không? Ví dụ, bạn lo lắng về tưới nước, ánh sáng, sâu bệnh, hay điều gì khác?"
          : "I'm having trouble connecting to my knowledge base right now, but I can offer some general plant care advice. Could you be more specific about what plant issue you're experiencing? For example, are you concerned about watering, light, pests, or something else?";
        
        return {
          response: fallbackResponse,
          isPlantRelated: true,
          confidence: 0.3,
          source: 'fallback',
          language: language,
          error: error.message
        };
      } else {
        return {
          response: this.generateNonPlantResponse(language),
          isPlantRelated: false,
          confidence: 1.0,
          source: 'fallback',
          language: language
        };
      }
    }
  }

  /**
   * Get service status and configuration
   */
  getServiceStatus() {
    return {
      configured: !!this.apiKey,
      model: this.model,
      baseUrl: this.baseUrl,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      lastRequestTime: this.lastRequestTime,
      rateLimitConfig: {
        minInterval: this.minRequestInterval,
        maxRetries: this.maxRetries,
        retryDelay: this.retryDelay
      }
    };
  }

  /**
   * Clear request queue (useful for testing or emergency stops)
   */
  clearQueue() {
    this.requestQueue.forEach(({ reject }) => {
      reject(new Error('Request queue cleared'));
    });
    this.requestQueue = [];
    this.isProcessing = false;
  }
}

// Export singleton instance
module.exports = new OpenRouterService();