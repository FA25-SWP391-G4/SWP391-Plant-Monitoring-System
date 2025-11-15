/**
 * Multi-Language Detection and Processing Utilities
 * Supports Vietnamese and English with expandable architecture
 */

const LANGUAGE_PATTERNS = {
  vietnamese: {
    // Vietnamese diacritics pattern
    diacritics: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
    
    // Common Vietnamese plant care keywords
    keywords: [
      'cây', 'tưới', 'nước', 'đất', 'lá', 'hoa', 'trồng', 'chăm sóc',
      'phân bón', 'ánh sáng', 'úng', 'héo', 'vàng', 'bệnh', 'sâu',
      'chậu', 'giống', 'tỉa', 'cắt', 'ghép', 'nhân giống'
    ],
    
    // Common Vietnamese words
    commonWords: [
      'là', 'của', 'tôi', 'bạn', 'này', 'khi', 'nào', 'như', 'thế',
      'có', 'không', 'được', 'làm', 'sao', 'gì', 'đây', 'để'
    ],
    
    // Vietnamese question patterns
    questionPatterns: [
      /khi nào/i, /làm sao/i, /như thế nào/i, /tại sao/i,
      /có nên/i, /có phải/i, /có thể/i, /bao lâu/i
    ]
  },
  
  english: {
    // English plant care keywords
    keywords: [
      'plant', 'water', 'soil', 'leaf', 'flower', 'grow', 'care',
      'fertilizer', 'light', 'wilting', 'yellow', 'disease', 'pest',
      'pot', 'variety', 'prune', 'cutting', 'propagate'
    ],
    
    // Common English words
    commonWords: [
      'the', 'is', 'my', 'you', 'this', 'when', 'how', 'like', 'what',
      'have', 'not', 'can', 'do', 'why', 'here', 'to', 'should'
    ],
    
    // English question patterns
    questionPatterns: [
      /when should/i, /how to/i, /how do/i, /why is/i,
      /should i/i, /can i/i, /how long/i, /what is/i
    ]
  }
};

/**
 * Detect the language of a message
 * @param {string} message - The user message
 * @param {string} userPreference - User's language preference (optional)
 * @returns {string} - Detected language code ('vietnamese' or 'english')
 */
const detectLanguage = (message, userPreference = null) => {
  if (!message || typeof message !== 'string') {
    return userPreference || 'english';
  }
  
  const text = message.toLowerCase().trim();
  
  // If user has a preference and message is short, use preference
  if (userPreference && text.length < 10) {
    return userPreference;
  }
  
  let vietnameseScore = 0;
  let englishScore = 0;
  
  // Check for Vietnamese diacritics (strong indicator)
  if (LANGUAGE_PATTERNS.vietnamese.diacritics.test(message)) {
    vietnameseScore += 5;
  }
  
  // Check for language-specific keywords
  LANGUAGE_PATTERNS.vietnamese.keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      vietnameseScore += 2;
    }
  });
  
  LANGUAGE_PATTERNS.english.keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      englishScore += 2;
    }
  });
  
  // Check for common words
  LANGUAGE_PATTERNS.vietnamese.commonWords.forEach(word => {
    if (text.includes(word)) {
      vietnameseScore += 1;
    }
  });
  
  LANGUAGE_PATTERNS.english.commonWords.forEach(word => {
    if (text.includes(word)) {
      englishScore += 1;
    }
  });
  
  // Check for question patterns
  LANGUAGE_PATTERNS.vietnamese.questionPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      vietnameseScore += 3;
    }
  });
  
  LANGUAGE_PATTERNS.english.questionPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      englishScore += 3;
    }
  });
  
  // If scores are equal or very close, use user preference
  if (Math.abs(vietnameseScore - englishScore) <= 1 && userPreference) {
    return userPreference;
  }
  
  // Return the language with higher score
  return vietnameseScore > englishScore ? 'vietnamese' : 'english';
};

/**
 * Get system prompt for a specific language
 * @param {string} language - Language code
 * @returns {string} - System prompt for the AI
 */
const getSystemPrompt = (language) => {
  const prompts = {
    vietnamese: `Bạn là một trợ lý AI chuyên nghiệp về chăm sóc cây trồng và làm vườn. Hãy:

🌱 Trả lời bằng tiếng Việt một cách thân thiện, dễ hiểu và chuyên nghiệp
🌿 Cung cấp lời khuyên phù hợp với khí hậu nhiệt đới Việt Nam
🏡 Sử dụng kiến thức về các loại cây phổ biến tại Việt Nam
📚 Kết hợp phương pháp truyền thống và hiện đại
🔬 Đưa ra lời khuyên dựa trên dữ liệu cảm biến khi có
💡 Giải thích rõ ràng nguyên nhân và cách khắc phục

Hãy trả lời ngắn gọn (2-3 câu) nhưng đầy đủ thông tin. Nếu cần thêm thông tin, hãy hỏi lại người dùng.`,

    english: `You are a professional AI plant care assistant and gardening expert. Please:

🌱 Provide friendly, clear, and professional advice in English
🌿 Consider different climate zones and growing conditions
🏡 Use scientific plant names alongside common names when relevant
📚 Combine traditional wisdom with modern horticultural practices
🔬 Base recommendations on sensor data when available
💡 Explain the reasoning behind your advice

Keep responses concise (2-3 sentences) but informative. Ask follow-up questions if more information is needed.`
  };
  
  return prompts[language] || prompts.english;
};

/**
 * Create context message for AI including plant data and conversation history
 * @param {Object} plantInfo - Plant information
 * @param {Object} sensorData - Current sensor readings
 * @param {Array} wateringHistory - Recent watering events
 * @param {Array} recentChats - Recent conversation history
 * @param {string} language - User's language
 * @returns {string} - Formatted context message
 */
const createContext = (plantInfo, sensorData, wateringHistory, recentChats, language) => {
  const isVietnamese = language === 'vietnamese';
  
  const templates = {
    vietnamese: {
      plant: `Thông tin cây: ${plantInfo.name || 'Không rõ'} (${plantInfo.plant_type || 'Loại không xác định'})`,
      sensors: `Dữ liệu cảm biến hiện tại:
- Nhiệt độ: ${sensorData.temperature}°C
- Độ ẩm đất: ${sensorData.soilMoisture}%
- Độ ẩm không khí: ${sensorData.humidity}%
- Ánh sáng: ${sensorData.lightLevel} lux
- pH đất: ${sensorData.soilPH}`,
      watering: `Lịch sử tưới nước gần đây: ${wateringHistory.length === 0 ? 'Chưa có dữ liệu' : wateringHistory.map(w => w.timestamp).join(', ')}`,
      conversation: `Cuộc trò chuyện trước: ${recentChats.slice(0, 3).map(c => `Người dùng: "${c.user_message}" - AI: "${c.ai_response}"`).join(' | ')}`
    },
    english: {
      plant: `Plant Information: ${plantInfo.name || 'Unknown'} (${plantInfo.plant_type || 'Unidentified species'})`,
      sensors: `Current Sensor Data:
- Temperature: ${sensorData.temperature}°C
- Soil Moisture: ${sensorData.soilMoisture}%
- Air Humidity: ${sensorData.humidity}%
- Light Level: ${sensorData.lightLevel} lux
- Soil pH: ${sensorData.soilPH}`,
      watering: `Recent Watering History: ${wateringHistory.length === 0 ? 'No data available' : wateringHistory.map(w => w.timestamp).join(', ')}`,
      conversation: `Previous Conversation: ${recentChats.slice(0, 3).map(c => `User: "${c.user_message}" - AI: "${c.ai_response}"`).join(' | ')}`
    }
  };
  
  const t = templates[language] || templates.english;
  
  return `${t.plant}

${t.sensors}

${t.watering}

${t.conversation}

Based on this information, please provide specific advice for the user's question.`;
};

/**
 * Post-process AI response for language-specific improvements
 * @param {string} response - Raw AI response
 * @param {string} language - Target language
 * @returns {string} - Processed response
 */
const processResponse = (response, language) => {
  if (!response) return response;
  
  // Remove any language mixing or inconsistencies
  let processed = response.trim();
  
  if (language === 'vietnamese') {
    // Ensure Vietnamese punctuation and formatting
    processed = processed.replace(/\?/g, ' không?').replace(/ không\?/g, '?');
    
    // Add Vietnamese plant care context
    processed = processed.replace(/plant/gi, 'cây');
    processed = processed.replace(/water/gi, 'tưới nước');
  } else {
    // Ensure proper English formatting
    processed = processed.replace(/\s+/g, ' ');
  }
  
  return processed;
};

module.exports = {
  detectLanguage,
  getSystemPrompt,
  createContext,
  processResponse,
  LANGUAGE_PATTERNS
};