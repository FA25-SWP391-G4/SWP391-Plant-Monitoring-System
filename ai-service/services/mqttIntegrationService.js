/**
 * MQTT Integration Service for AI Features
 * Connects AI service with MQTT broker for real-time communication
 */

const aiMqttClient = require('../mqtt/aiMqttClient');
const db = require('../config/db');

class MQTTIntegrationService {
  constructor() {
    this.isInitialized = false;
    this.eventHandlers = new Map();
    this.init();
  }
  
  init() {
    if (this.isInitialized) return;
    
    console.log('🔌 Initializing MQTT Integration Service...');
    
    // Set up event handlers for MQTT client
    this.setupEventHandlers();
    
    this.isInitialized = true;
    console.log('✅ MQTT Integration Service initialized');
  }
  
  setupEventHandlers() {
    // Handle sensor data for AI processing
    aiMqttClient.on('sensorData', async (data) => {
      try {
        await this.processSensorDataForAI(data);
      } catch (error) {
        console.error('❌ Error processing sensor data for AI:', error);
      }
    });
    
    // Handle chatbot requests
    aiMqttClient.on('chatbotRequest', async (request) => {
      try {
        await this.processChatbotRequest(request);
      } catch (error) {
        console.error('❌ Error processing chatbot request:', error);
      }
    });
    
    // Handle device status updates
    aiMqttClient.on('deviceStatus', async (status) => {
      try {
        await this.processDeviceStatus(status);
      } catch (error) {
        console.error('❌ Error processing device status:', error);
      }
    });
    
    // Handle MQTT connection events
    aiMqttClient.on('connected', () => {
      console.log('✅ AI Service MQTT client connected');
      this.publishAIServiceStatus('online');
    });
    
    aiMqttClient.on('disconnected', () => {
      console.log('🔌 AI Service MQTT client disconnected');
    });
    
    aiMqttClient.on('error', (error) => {
      console.error('❌ AI Service MQTT error:', error);
    });
  }
  
  async processSensorDataForAI(sensorData) {
    console.log(`🌡️ Processing sensor data for AI analysis: ${sensorData.deviceId}`);
    
    try {
      const { deviceId, plantId, data, timestamp } = sensorData;
      
      // Store sensor data analysis
      const analysisResult = await this.analyzeSensorData(data);
      
      if (analysisResult.shouldAnalyze) {
        // Create AI analysis record
        const aiAnalysis = await db.query(`
          INSERT INTO ai_analyses (plant_id, user_id, analysis_type, input_data, result_data, confidence_score)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [
          plantId,
          'system', // System-generated analysis
          'irrigation_prediction',
          JSON.stringify(data),
          JSON.stringify(analysisResult),
          analysisResult.confidence || 0.8
        ]);
        
        // Publish irrigation prediction if needed
        if (analysisResult.irrigationRecommendation) {
          await aiMqttClient.publishIrrigationPrediction(plantId, {
            shouldWater: analysisResult.irrigationRecommendation.shouldWater,
            hoursUntilWater: analysisResult.irrigationRecommendation.hoursUntilWater,
            waterAmount: analysisResult.irrigationRecommendation.waterAmount,
            confidence: analysisResult.confidence,
            reasoning: analysisResult.reasoning
          });
        }
        
        // Publish alerts if needed
        if (analysisResult.alerts && analysisResult.alerts.length > 0) {
          for (const alert of analysisResult.alerts) {
            await aiMqttClient.publishIrrigationAlert(plantId, alert);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error in sensor data AI processing:', error);
    }
  }
  
  async processChatbotRequest(request) {
    console.log(`💬 Processing chatbot request for user: ${request.userId}`);
    
    try {
      const { userId, message, plantId, sessionId } = request;
      
      // Send typing indicator
      await aiMqttClient.publishChatbotTyping(userId, true);
      
      // Process the chatbot request (this would integrate with your existing chatbot logic)
      const response = await this.generateChatbotResponse(message, plantId, userId);
      
      // Stop typing indicator
      await aiMqttClient.publishChatbotTyping(userId, false);
      
      // Store chat history
      await db.query(`
        INSERT INTO chat_histories (user_id, user_message, ai_response, session_id, plant_id, plant_context, ai_confidence, topic_category, language)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        userId,
        message,
        response.response,
        sessionId,
        plantId,
        response.plantContext ? JSON.stringify(response.plantContext) : null,
        response.confidence,
        response.topicCategory,
        response.language || 'vi'
      ]);
      
      // Publish response
      await aiMqttClient.publishChatbotResponse(userId, {
        response: response.response,
        confidence: response.confidence,
        sessionId,
        plantContext: response.plantContext
      });
      
    } catch (error) {
      console.error('❌ Error in chatbot request processing:', error);
      
      // Send error response
      await aiMqttClient.publishChatbotTyping(request.userId, false);
      await aiMqttClient.publishChatbotResponse(request.userId, {
        response: 'Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
        confidence: 0.0,
        sessionId: request.sessionId,
        plantContext: null
      });
    }
  }
  
  async processDeviceStatus(status) {
    console.log(`📊 Processing device status: ${status.deviceId}`);
    
    try {
      // You can add logic here to process device status updates
      // For example, update device health, trigger maintenance alerts, etc.
      
      // Store device status if needed
      // This is a placeholder for device status processing
      
    } catch (error) {
      console.error('❌ Error processing device status:', error);
    }
  }
  
  async analyzeSensorData(sensorData) {
    // Simple AI analysis logic for sensor data
    // In a real implementation, this would use ML models
    
    const analysis = {
      shouldAnalyze: true,
      confidence: 0.8,
      irrigationRecommendation: null,
      alerts: [],
      reasoning: []
    };
    
    // Check soil moisture
    if (sensorData.soil_moisture !== undefined) {
      if (sensorData.soil_moisture < 30) {
        analysis.irrigationRecommendation = {
          shouldWater: true,
          hoursUntilWater: 0,
          waterAmount: 200,
          priority: 'high'
        };
        analysis.alerts.push({
          type: 'urgent_watering',
          severity: 'high',
          message: 'Độ ẩm đất thấp, cần tưới nước ngay',
          action: 'water_immediately',
          confidence: 0.9
        });
        analysis.reasoning.push('Độ ẩm đất dưới 30% - cần tưới nước ngay');
      } else if (sensorData.soil_moisture > 80) {
        analysis.alerts.push({
          type: 'overwatering_risk',
          severity: 'medium',
          message: 'Độ ẩm đất cao, có thể bị úng nước',
          action: 'reduce_watering',
          confidence: 0.7
        });
        analysis.reasoning.push('Độ ẩm đất trên 80% - nguy cơ úng nước');
      }
    }
    
    // Check temperature
    if (sensorData.temperature !== undefined) {
      if (sensorData.temperature > 35) {
        analysis.alerts.push({
          type: 'high_temperature',
          severity: 'medium',
          message: 'Nhiệt độ cao, cần tăng tưới nước',
          action: 'increase_watering',
          confidence: 0.8
        });
        analysis.reasoning.push('Nhiệt độ cao trên 35°C - cần tăng tưới nước');
      } else if (sensorData.temperature < 10) {
        analysis.alerts.push({
          type: 'low_temperature',
          severity: 'medium',
          message: 'Nhiệt độ thấp, giảm tưới nước',
          action: 'reduce_watering',
          confidence: 0.8
        });
        analysis.reasoning.push('Nhiệt độ thấp dưới 10°C - giảm tưới nước');
      }
    }
    
    return analysis;
  }
  
  async generateChatbotResponse(message, plantId, userId) {
    // Simple chatbot response logic
    // In a real implementation, this would integrate with your OpenRouter API
    
    const response = {
      response: 'Tôi đã nhận được tin nhắn của bạn. Đây là phản hồi tự động từ hệ thống AI.',
      confidence: 0.7,
      topicCategory: 'general',
      language: 'vi',
      plantContext: null
    };
    
    // Get plant context if plantId is provided
    if (plantId) {
      try {
        const plantResult = await db.query('SELECT * FROM plants WHERE plant_id = $1', [plantId]);
        if (plantResult.rows.length > 0) {
          response.plantContext = {
            plantId: plantId,
            plantName: plantResult.rows[0].custom_name,
            autoWatering: plantResult.rows[0].auto_watering_on
          };
        }
      } catch (error) {
        console.error('Error getting plant context:', error);
      }
    }
    
    // Simple keyword-based responses
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('tưới') || lowerMessage.includes('nước')) {
      response.response = 'Tôi sẽ kiểm tra độ ẩm đất và đưa ra khuyến nghị tưới nước phù hợp cho cây của bạn.';
      response.topicCategory = 'watering';
      response.confidence = 0.8;
    } else if (lowerMessage.includes('bệnh') || lowerMessage.includes('sâu')) {
      response.response = 'Để chẩn đoán bệnh cây, bạn có thể gửi hình ảnh lá cây để tôi phân tích.';
      response.topicCategory = 'disease';
      response.confidence = 0.8;
    } else if (lowerMessage.includes('nhiệt độ') || lowerMessage.includes('độ ẩm')) {
      response.response = 'Tôi sẽ kiểm tra dữ liệu cảm biến và đưa ra thông tin về điều kiện môi trường hiện tại.';
      response.topicCategory = 'environment';
      response.confidence = 0.8;
    }
    
    return response;
  }
  
  async publishAIServiceStatus(status) {
    try {
      await aiMqttClient.publishSystemStatus(status, {
        features: {
          sensorAnalysis: 'active',
          chatbotIntegration: 'active',
          irrigationPrediction: 'active',
          diseaseDetection: 'active'
        }
      });
    } catch (error) {
      console.error('❌ Error publishing AI service status:', error);
    }
  }
  
  // Public methods for external use
  
  async triggerIrrigationAnalysis(plantId) {
    try {
      console.log(`🔍 Triggering irrigation analysis for plant: ${plantId}`);
      
      // Get recent sensor data
      const sensorResult = await db.query(`
        SELECT * FROM sensor_data 
        WHERE plant_id = $1 
        ORDER BY timestamp DESC 
        LIMIT 1
      `, [plantId]);
      
      if (sensorResult.rows.length > 0) {
        const sensorData = sensorResult.rows[0];
        await this.processSensorDataForAI({
          deviceId: `plant_${plantId}`,
          plantId,
          data: sensorData,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('❌ Error triggering irrigation analysis:', error);
      throw error;
    }
  }
  
  async publishDiseaseAnalysisProgress(analysisId, progress) {
    try {
      await aiMqttClient.publishDiseaseProgress(analysisId, progress);
    } catch (error) {
      console.error('❌ Error publishing disease analysis progress:', error);
    }
  }
  
  async publishDiseaseResults(plantId, analysisResults) {
    try {
      await aiMqttClient.publishDiseaseAnalysis(plantId, analysisResults);
      
      // Publish alerts if diseases detected
      if (analysisResults.diseases && analysisResults.diseases.length > 0) {
        for (const disease of analysisResults.diseases) {
          if (disease.confidence > 0.6) {
            await aiMqttClient.publishDiseaseAlert(plantId, {
              disease: disease.name,
              severity: disease.severity,
              urgentAction: disease.urgentAction,
              confidence: disease.confidence
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Error publishing disease results:', error);
    }
  }
  
  // Health check
  async healthCheck() {
    return {
      mqttConnected: aiMqttClient.isClientConnected(),
      initialized: this.isInitialized,
      eventHandlers: this.eventHandlers.size,
      timestamp: new Date().toISOString()
    };
  }
  
  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down MQTT Integration Service...');
    
    try {
      await this.publishAIServiceStatus('offline');
      aiMqttClient.disconnect();
      this.isInitialized = false;
      console.log('✅ MQTT Integration Service shut down');
    } catch (error) {
      console.error('❌ Error during MQTT Integration Service shutdown:', error);
    }
  }
}

// Create singleton instance
const mqttIntegrationService = new MQTTIntegrationService();

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  mqttIntegrationService.shutdown();
});

process.on('SIGINT', () => {
  mqttIntegrationService.shutdown();
});

module.exports = mqttIntegrationService;