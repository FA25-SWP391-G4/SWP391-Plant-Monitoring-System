/**
 * MQTT Client for AI Service
 * Handles real-time communication for AI features
 */

const mqtt = require('mqtt');
const EventEmitter = require('events');
require('dotenv').config();

class AIMqttClient extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectInterval = 5000; // 5 seconds
    
    // MQTT Topics Structure for AI Features
    this.topics = {
      // AI Chatbot real-time responses
      chatbot: {
        request: 'ai/chatbot/request/{userId}',
        response: 'ai/chatbot/response/{userId}',
        typing: 'ai/chatbot/typing/{userId}',
        session: 'ai/chatbot/session/{sessionId}'
      },
      
      // Irrigation predictions
      irrigation: {
        prediction: 'ai/irrigation/prediction/{plantId}',
        recommendation: 'ai/irrigation/recommendation/{plantId}',
        alert: 'ai/irrigation/alert/{plantId}',
        schedule: 'ai/irrigation/schedule/{plantId}'
      },
      
      // Disease detection results
      disease: {
        analysis: 'ai/disease/analysis/{plantId}',
        alert: 'ai/disease/alert/{plantId}',
        progress: 'ai/disease/progress/{analysisId}'
      },
      
      // System status
      system: {
        aiStatus: 'ai/system/status',
        modelUpdate: 'ai/system/model-update',
        health: 'ai/system/health'
      },
      
      // Sensor data input (subscribe to these)
      sensors: {
        data: 'plant-system/+/sensor-data',
        status: 'plant-system/+/status'
      }
    };
    
    this.init();
  }
  
  init() {
    try {
      // MQTT broker configuration
      const mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
      const clientId = `ai-service-${Math.random().toString(16).slice(3)}`;
      
      console.log(`🔌 Connecting to MQTT broker: ${mqttUrl}`);
      
      this.client = mqtt.connect(mqttUrl, {
        clientId,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: this.reconnectInterval,
        will: {
          topic: this.topics.system.aiStatus,
          payload: JSON.stringify({
            status: 'offline',
            timestamp: new Date().toISOString(),
            service: 'ai-service'
          }),
          qos: 1,
          retain: true
        }
      });
      
      this.setupEventHandlers();
      
    } catch (error) {
      console.error('❌ MQTT initialization failed:', error);
      this.emit('error', error);
    }
  }
  
  setupEventHandlers() {
    // Connection successful
    this.client.on('connect', () => {
      console.log('✅ AI Service connected to MQTT broker');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Publish AI service status
      this.publishSystemStatus('online');
      
      // Subscribe to relevant topics
      this.subscribeToTopics();
      
      this.emit('connected');
    });
    
    // Handle incoming messages
    this.client.on('message', (topic, payload) => {
      try {
        const message = JSON.parse(payload.toString());
        this.handleIncomingMessage(topic, message);
      } catch (error) {
        console.error('❌ Error processing MQTT message:', error);
        console.error('Topic:', topic);
        console.error('Payload:', payload.toString());
      }
    });
    
    // Handle connection errors
    this.client.on('error', (error) => {
      console.error('❌ MQTT connection error:', error);
      this.isConnected = false;
      this.emit('error', error);
    });
    
    // Handle disconnection
    this.client.on('close', () => {
      console.log('🔌 MQTT connection closed');
      this.isConnected = false;
      this.emit('disconnected');
    });
    
    // Handle reconnection
    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      console.log(`🔄 MQTT reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        this.client.end();
      }
    });
  }
  
  subscribeToTopics() {
    const subscriptions = [
      // Subscribe to sensor data for AI processing
      this.topics.sensors.data,
      this.topics.sensors.status,
      
      // Subscribe to chatbot requests
      'ai/chatbot/request/+',
      
      // Subscribe to system commands
      this.topics.system.modelUpdate
    ];
    
    subscriptions.forEach(topic => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`❌ Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`📡 Subscribed to: ${topic}`);
        }
      });
    });
  }
  
  handleIncomingMessage(topic, message) {
    console.log(`📨 Received message on topic: ${topic}`);
    
    try {
      // Route messages based on topic patterns
      if (topic.includes('/sensor-data')) {
        this.handleSensorData(topic, message);
      } else if (topic.includes('/chatbot/request/')) {
        this.handleChatbotRequest(topic, message);
      } else if (topic.includes('/system/model-update')) {
        this.handleModelUpdate(topic, message);
      } else if (topic.includes('/status')) {
        this.handleDeviceStatus(topic, message);
      }
      
      // Emit event for other parts of the application
      this.emit('message', { topic, message });
      
    } catch (error) {
      console.error('❌ Error handling MQTT message:', error);
    }
  }
  
  handleSensorData(topic, data) {
    // Extract plant/device ID from topic
    const topicParts = topic.split('/');
    const deviceId = topicParts[1];
    
    console.log(`🌡️ Processing sensor data for device: ${deviceId}`);
    
    // Emit sensor data event for AI processing
    this.emit('sensorData', {
      deviceId,
      plantId: data.plantId || deviceId,
      data,
      timestamp: new Date().toISOString()
    });
  }
  
  handleChatbotRequest(topic, message) {
    // Extract user ID from topic
    const userId = topic.split('/').pop();
    
    console.log(`💬 Processing chatbot request for user: ${userId}`);
    
    // Emit chatbot request event
    this.emit('chatbotRequest', {
      userId,
      message: message.message,
      plantId: message.plantId,
      sessionId: message.sessionId,
      timestamp: new Date().toISOString()
    });
  }
  
  handleModelUpdate(topic, message) {
    console.log('🤖 Processing model update:', message);
    
    // Emit model update event
    this.emit('modelUpdate', {
      modelType: message.modelType,
      version: message.version,
      action: message.action, // 'update', 'activate', 'deactivate'
      timestamp: new Date().toISOString()
    });
  }
  
  handleDeviceStatus(topic, data) {
    const topicParts = topic.split('/');
    const deviceId = topicParts[1];
    
    console.log(`📊 Device status update for: ${deviceId}`, data);
    
    // Emit device status event
    this.emit('deviceStatus', {
      deviceId,
      status: data.status,
      data,
      timestamp: new Date().toISOString()
    });
  }
  
  // Publishing methods for AI features
  
  publishChatbotResponse(userId, response) {
    const topic = this.topics.chatbot.response.replace('{userId}', userId);
    const payload = {
      response: response.response,
      confidence: response.confidence,
      timestamp: new Date().toISOString(),
      sessionId: response.sessionId,
      plantContext: response.plantContext
    };
    
    return this.publish(topic, payload);
  }
  
  publishChatbotTyping(userId, isTyping = true) {
    const topic = this.topics.chatbot.typing.replace('{userId}', userId);
    const payload = {
      typing: isTyping,
      timestamp: new Date().toISOString()
    };
    
    return this.publish(topic, payload);
  }
  
  publishIrrigationPrediction(plantId, prediction) {
    const topic = this.topics.irrigation.prediction.replace('{plantId}', plantId);
    const payload = {
      shouldWater: prediction.shouldWater,
      hoursUntilWater: prediction.hoursUntilWater,
      waterAmount: prediction.waterAmount,
      confidence: prediction.confidence,
      reasoning: prediction.reasoning,
      timestamp: new Date().toISOString()
    };
    
    return this.publish(topic, payload);
  }
  
  publishIrrigationAlert(plantId, alert) {
    const topic = this.topics.irrigation.alert.replace('{plantId}', plantId);
    const payload = {
      type: alert.type, // 'urgent_watering', 'overwatering_risk', etc.
      severity: alert.severity, // 'low', 'medium', 'high', 'critical'
      message: alert.message,
      action: alert.action,
      confidence: alert.confidence,
      timestamp: new Date().toISOString()
    };
    
    return this.publish(topic, payload, { qos: 2 }); // Higher QoS for alerts
  }
  
  publishDiseaseAnalysis(plantId, analysis) {
    const topic = this.topics.disease.analysis.replace('{plantId}', plantId);
    const payload = {
      diseases: analysis.diseases,
      confidence: analysis.confidence,
      treatments: analysis.treatments,
      severity: analysis.severity,
      imageId: analysis.imageId,
      timestamp: new Date().toISOString()
    };
    
    return this.publish(topic, payload);
  }
  
  publishDiseaseAlert(plantId, alert) {
    const topic = this.topics.disease.alert.replace('{plantId}', plantId);
    const payload = {
      type: 'disease_detected',
      disease: alert.disease,
      severity: alert.severity,
      urgentAction: alert.urgentAction,
      confidence: alert.confidence,
      timestamp: new Date().toISOString()
    };
    
    return this.publish(topic, payload, { qos: 2 }); // Higher QoS for alerts
  }
  
  publishDiseaseProgress(analysisId, progress) {
    const topic = this.topics.disease.progress.replace('{analysisId}', analysisId);
    const payload = {
      progress: progress.percentage, // 0-100
      stage: progress.stage, // 'uploading', 'processing', 'analyzing', 'complete'
      message: progress.message,
      timestamp: new Date().toISOString()
    };
    
    return this.publish(topic, payload);
  }
  
  publishSystemStatus(status, details = {}) {
    const payload = {
      status, // 'online', 'offline', 'maintenance', 'error'
      service: 'ai-service',
      version: '1.0.0',
      features: {
        chatbot: 'active',
        diseaseDetection: 'active',
        irrigationPrediction: 'active'
      },
      ...details,
      timestamp: new Date().toISOString()
    };
    
    return this.publish(this.topics.system.aiStatus, payload, { retain: true });
  }
  
  publishHealthCheck() {
    const payload = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: this.isConnected ? 1 : 0,
      timestamp: new Date().toISOString()
    };
    
    return this.publish(this.topics.system.health, payload);
  }
  
  // Generic publish method
  publish(topic, payload, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('MQTT client not connected'));
        return;
      }
      
      const message = JSON.stringify(payload);
      const publishOptions = {
        qos: 1,
        retain: false,
        ...options
      };
      
      this.client.publish(topic, message, publishOptions, (error) => {
        if (error) {
          console.error(`❌ Failed to publish to ${topic}:`, error);
          reject(error);
        } else {
          console.log(`📤 Published to ${topic}`);
          resolve();
        }
      });
    });
  }
  
  // Utility methods
  
  isClientConnected() {
    return this.isConnected && this.client && this.client.connected;
  }
  
  disconnect() {
    if (this.client) {
      // Publish offline status before disconnecting
      this.publishSystemStatus('offline');
      
      this.client.end();
      this.isConnected = false;
      console.log('🔌 MQTT client disconnected');
    }
  }
  
  // Health check method
  async healthCheck() {
    return {
      connected: this.isClientConnected(),
      reconnectAttempts: this.reconnectAttempts,
      topics: Object.keys(this.topics).length,
      lastActivity: new Date().toISOString()
    };
  }
}

// Create singleton instance
const aiMqttClient = new AIMqttClient();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, disconnecting MQTT client...');
  aiMqttClient.disconnect();
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, disconnecting MQTT client...');
  aiMqttClient.disconnect();
});

module.exports = aiMqttClient;