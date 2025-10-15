/**
 * Mock MQTT Client for testing when mqtt module is not available
 */

const EventEmitter = require('events');

class MockMqttClient extends EventEmitter {
  constructor() {
    super();
    this.isConnected = true;
    console.log('🔌 Using Mock MQTT Client (mqtt module not available)');
  }
  
  async publishChatbotResponse(userId, response) {
    console.log(`📤 [MOCK] Publishing chatbot response to user ${userId}:`, response.response);
    return Promise.resolve();
  }
  
  async publishChatbotTyping(userId, isTyping) {
    console.log(`📤 [MOCK] Publishing typing indicator for user ${userId}:`, isTyping);
    return Promise.resolve();
  }
  
  async publishIrrigationPrediction(plantId, prediction) {
    console.log(`📤 [MOCK] Publishing irrigation prediction for plant ${plantId}:`, prediction);
    return Promise.resolve();
  }
  
  async publishIrrigationAlert(plantId, alert) {
    console.log(`📤 [MOCK] Publishing irrigation alert for plant ${plantId}:`, alert);
    return Promise.resolve();
  }
  
  async publishDiseaseAnalysis(plantId, analysis) {
    console.log(`📤 [MOCK] Publishing disease analysis for plant ${plantId}:`, analysis);
    return Promise.resolve();
  }
  
  async publishDiseaseAlert(plantId, alert) {
    console.log(`📤 [MOCK] Publishing disease alert for plant ${plantId}:`, alert);
    return Promise.resolve();
  }
  
  async publishDiseaseProgress(analysisId, progress) {
    console.log(`📤 [MOCK] Publishing disease progress for analysis ${analysisId}:`, progress);
    return Promise.resolve();
  }
  
  async publishSystemStatus(status, details = {}) {
    console.log(`📤 [MOCK] Publishing system status:`, status, details);
    return Promise.resolve();
  }
  
  async publishHealthCheck() {
    console.log(`📤 [MOCK] Publishing health check`);
    return Promise.resolve();
  }
  
  isClientConnected() {
    return this.isConnected;
  }
  
  disconnect() {
    this.isConnected = false;
    console.log('🔌 [MOCK] MQTT client disconnected');
  }
  
  async healthCheck() {
    return {
      connected: this.isClientConnected(),
      reconnectAttempts: 0,
      topics: 10,
      lastActivity: new Date().toISOString(),
      mock: true
    };
  }
}

module.exports = new MockMqttClient();