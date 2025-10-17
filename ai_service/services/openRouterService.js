const axios = require('axios');

class OpenRouterService {
  constructor() {
    // Ensure environment variables are loaded
    if (!process.env.OPENROUTER_API_KEY && require('fs').existsSync('.env')) {
      require('dotenv').config();
    }
    
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
    
    // Validate configuration
    if (!this.apiKey) {
      console.warn('OpenRouter API key not configured. Chatbot will use fallback responses.');
    }
  }

  /**
   * Generate plant-specific system prompt with context injection
   */
  generateSystemPrompt(plantContext = {}) {
    const basePrompt = `You are a knowledgeable plant care assistant specializing in indoor and outdoor plant care. 
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
- Include specific care instructions when relevant`;

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
   * Validate that the message is plant-related
   */
  isPlantRelatedQuery(message) {
    const plantKeywords = [
      'plant', 'plants', 'watering', 'water', 'fertilize', 'fertilizer', 'soil', 'light', 'sunlight',
      'leaves', 'leaf', 'roots', 'root', 'flower', 'flowers', 'bloom', 'blooming', 'growth', 'growing',
      'pest', 'pests', 'disease', 'diseases', 'yellow', 'yellowing', 'brown', 'wilting', 'drooping',
      'repot', 'repotting', 'pruning', 'prune', 'humidity', 'temperature', 'garden', 'gardening',
      'indoor', 'outdoor', 'houseplant', 'houseplants', 'succulent', 'succulents', 'cactus', 'cacti',
      'herb', 'herbs', 'vegetable', 'vegetables', 'tree', 'trees', 'shrub', 'shrubs', 'vine', 'vines',
      'seed', 'seeds', 'seedling', 'seedlings', 'transplant', 'transplanting', 'compost', 'mulch',
      'drainage', 'overwatering', 'underwatering', 'photosynthesis', 'chlorophyll', 'nutrients'
    ];
    
    const messageLower = message.toLowerCase();
    return plantKeywords.some(keyword => messageLower.includes(keyword));
  }

  /**
   * Generate fallback response for non-plant queries
   */
  generateNonPlantResponse() {
    const responses = [
      "I'm specialized in plant care and gardening advice. Could you ask me something about your plants instead? I'd love to help with watering, fertilizing, pest control, or any other plant care questions!",
      "I focus on helping with plant and garden care. Do you have any questions about your plants, such as watering schedules, light requirements, or plant health issues?",
      "I'm your plant care assistant! I can help with questions about plant watering, fertilizing, disease identification, pest control, and general plant health. What would you like to know about your plants?",
      "Let's talk about plants! I can assist with plant care advice, troubleshooting plant problems, watering guidance, and much more. What plant-related question can I help you with?"
    ];
    
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
            'HTTP-Referer': 'http://localhost:8000', // AI service URL
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
      // Validate that the query is plant-related
      if (!this.isPlantRelatedQuery(message)) {
        return {
          response: this.generateNonPlantResponse(),
          isPlantRelated: false,
          confidence: 1.0,
          source: 'fallback'
        };
      }

      // If API key is not configured, return fallback response
      if (!this.apiKey) {
        return {
          response: "I'd love to help with your plant care question, but I'm currently running in offline mode. Here are some general plant care tips: Most plants need water when the top inch of soil feels dry, bright indirect light, and regular fertilizing during growing season.",
          isPlantRelated: true,
          confidence: 0.5,
          source: 'fallback'
        };
      }

      // Build conversation messages
      const messages = [
        {
          role: 'system',
          content: this.generateSystemPrompt(plantContext)
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
        usage: response.usage
      };

    } catch (error) {
      console.error('Chat completion error:', error.message);

      // Return fallback response for plant-related queries
      if (this.isPlantRelatedQuery(message)) {
        return {
          response: "I'm having trouble connecting to my knowledge base right now, but I can offer some general plant care advice. Could you be more specific about what plant issue you're experiencing? For example, are you concerned about watering, light, pests, or something else?",
          isPlantRelated: true,
          confidence: 0.3,
          source: 'fallback',
          error: error.message
        };
      } else {
        return {
          response: this.generateNonPlantResponse(),
          isPlantRelated: false,
          confidence: 1.0,
          source: 'fallback'
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