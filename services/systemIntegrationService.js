/**
 * System Integration Service
 * Manages integration between main application and AI service
 */

const axios = require('axios');
const { logger } = require('../utils/logger');
const { client: mqttClient } = require('../mqtt/mqttClient');

class SystemIntegrationService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3001';
    this.mainServiceUrl = process.env.MAIN_SERVICE_URL || 'http://localhost:3010';
    this.mqttTopics = {
      // AI Chatbot real-time responses
      chatbot: {
        request: 'ai/chatbot/request/{userId}',
        response: 'ai/chatbot/response/{userId}',
        typing: 'ai/chatbot/typing/{userId}'
      },
      
      // Irrigation predictions
      irrigation: {
        prediction: 'ai/irrigation/prediction/{plantId}',
        recommendation: 'ai/irrigation/recommendation/{plantId}',
        alert: 'ai/irrigation/alert/{plantId}'
      },
      
      // Disease detection results
      disease: {
        analysis: 'ai/disease/analysis/{plantId}',
        alert: 'ai/disease/alert/{plantId}'
      },
      
      // System status
      system: {
        aiStatus: 'ai/system/status',
        modelUpdate: 'ai/system/model-update'
      }
    };
    
    this.serviceStatus = {
      aiService: false,
      mainService: false,
      mqttBroker: false,
      database: false
    };
    
    this.initializeIntegration();
  }

  /**
   * Initialize system integration
   */
  async initializeIntegration() {
    try {
      logger.info('Initializing system integration...');
      
      // Check service connectivity
      await this.checkServiceConnectivity();
      
      // Setup MQTT subscriptions
      this.setupMqttSubscriptions();
      
      // Setup cross-service communication
      this.setupCrossServiceCommunication();
      
      logger.info('System integration initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize system integration:', error);
      throw error;
    }
  }

  /**
   * Check connectivity to all services
   */
  async checkServiceConnectivity() {
    const checks = [
      this.checkAiService(),
      this.checkMainService(),
      this.checkMqttBroker(),
      this.checkDatabase()
    ];

    const results = await Promise.allSettled(checks);
    
    results.forEach((result, index) => {
      const services = ['aiService', 'mainService', 'mqttBroker', 'database'];
      this.serviceStatus[services[index]] = result.status === 'fulfilled';
    });

    logger.info('Service connectivity check completed:', this.serviceStatus);
    return this.serviceStatus;
  }

  /**
   * Check AI Service health
   */
  async checkAiService() {
    try {
      const response = await axios.get(`${this.aiServiceUrl}/health`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        logger.info('AI Service is healthy');
        return true;
      }
      throw new Error(`AI Service returned status: ${response.status}`);
    } catch (error) {
      logger.error('AI Service health check failed:', error.message);
      throw error;
    }
  }

  /**
   * Check Main Service health
   */
  async checkMainService() {
    try {
      // Since we're running from main service, just check if it's responding
      const response = await axios.get(`${this.mainServiceUrl}/`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        logger.info('Main Service is healthy');
        return true;
      }
      throw new Error(`Main Service returned status: ${response.status}`);
    } catch (error) {
      logger.error('Main Service health check failed:', error.message);
      throw error;
    }
  }

  /**
   * Check MQTT Broker connectivity
   */
  async checkMqttBroker() {
    return new Promise((resolve, reject) => {
      if (mqttClient && mqttClient.connected) {
        logger.info('MQTT Broker is connected');
        resolve(true);
      } else {
        const timeout = setTimeout(() => {
          reject(new Error('MQTT Broker connection timeout'));
        }, 5000);

        mqttClient.once('connect', () => {
          clearTimeout(timeout);
          logger.info('MQTT Broker connected');
          resolve(true);
        });

        mqttClient.once('error', (error) => {
          clearTimeout(timeout);
          logger.error('MQTT Broker connection failed:', error);
          reject(error);
        });
      }
    });
  }

  /**
   * Check Database connectivity
   */
  async checkDatabase() {
    try {
      const { connectDB } = require('../config/db');
      await connectDB();
      logger.info('Database connection is healthy');
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error.message);
      throw error;
    }
  }

  /**
   * Setup MQTT subscriptions for cross-service communication
   */
  setupMqttSubscriptions() {
    if (!mqttClient || !mqttClient.connected) {
      logger.warn('MQTT client not connected, skipping subscription setup');
      return;
    }

    // Subscribe to AI service topics
    const topicsToSubscribe = [
      'ai/chatbot/response/+',
      'ai/chatbot/typing/+',
      'ai/irrigation/prediction/+',
      'ai/irrigation/recommendation/+',
      'ai/irrigation/alert/+',
      'ai/disease/analysis/+',
      'ai/disease/alert/+',
      'ai/system/status',
      'ai/system/model-update'
    ];

    topicsToSubscribe.forEach(topic => {
      mqttClient.subscribe(topic, (err) => {
        if (err) {
          logger.error(`Failed to subscribe to topic ${topic}:`, err);
        } else {
          logger.info(`Subscribed to MQTT topic: ${topic}`);
        }
      });
    });

    // Setup message handlers
    mqttClient.on('message', this.handleMqttMessage.bind(this));
  }

  /**
   * Handle incoming MQTT messages
   */
  handleMqttMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      logger.info(`Received MQTT message on topic: ${topic}`, data);

      // Route messages based on topic
      if (topic.startsWith('ai/chatbot/')) {
        this.handleChatbotMessage(topic, data);
      } else if (topic.startsWith('ai/irrigation/')) {
        this.handleIrrigationMessage(topic, data);
      } else if (topic.startsWith('ai/disease/')) {
        this.handleDiseaseMessage(topic, data);
      } else if (topic.startsWith('ai/system/')) {
        this.handleSystemMessage(topic, data);
      }
    } catch (error) {
      logger.error('Error handling MQTT message:', error);
    }
  }

  /**
   * Handle chatbot MQTT messages
   */
  handleChatbotMessage(topic, data) {
    // Forward to frontend via WebSocket or store for polling
    logger.info('Processing chatbot message:', { topic, data });
    
    // Extract user ID from topic
    const userId = this.extractIdFromTopic(topic, 'ai/chatbot/response/');
    if (userId) {
      // Here you would typically emit to WebSocket or store in cache
      logger.info(`Chatbot response for user ${userId}:`, data);
    }
  }

  /**
   * Handle irrigation MQTT messages
   */
  handleIrrigationMessage(topic, data) {
    logger.info('Processing irrigation message:', { topic, data });
    
    const plantId = this.extractIdFromTopic(topic, 'ai/irrigation/');
    if (plantId) {
      // Process irrigation predictions/recommendations
      if (topic.includes('alert')) {
        logger.warn(`Irrigation alert for plant ${plantId}:`, data);
        // Trigger immediate notification
      }
    }
  }

  /**
   * Handle disease detection MQTT messages
   */
  handleDiseaseMessage(topic, data) {
    logger.info('Processing disease message:', { topic, data });
    
    const plantId = this.extractIdFromTopic(topic, 'ai/disease/');
    if (plantId) {
      // Process disease detection results
      if (topic.includes('alert')) {
        logger.warn(`Disease alert for plant ${plantId}:`, data);
        // Trigger immediate notification
      }
    }
  }

  /**
   * Handle system MQTT messages
   */
  handleSystemMessage(topic, data) {
    logger.info('Processing system message:', { topic, data });
    
    if (topic === 'ai/system/status') {
      this.serviceStatus.aiService = data.status === 'healthy';
    } else if (topic === 'ai/system/model-update') {
      logger.info('AI model updated:', data);
    }
  }

  /**
   * Extract ID from MQTT topic
   */
  extractIdFromTopic(topic, prefix) {
    if (topic.startsWith(prefix)) {
      const parts = topic.replace(prefix, '').split('/');
      return parts[0];
    }
    return null;
  }

  /**
   * Setup cross-service communication endpoints
   */
  setupCrossServiceCommunication() {
    // This would typically be called from the main app.js
    logger.info('Cross-service communication setup completed');
  }

  /**
   * Forward request to AI service
   */
  async forwardToAiService(endpoint, method = 'GET', data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${this.aiServiceUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 30000
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error(`Error forwarding request to AI service: ${endpoint}`, error.message);
      throw error;
    }
  }

  /**
   * Publish message to MQTT topic
   */
  publishMqttMessage(topic, data) {
    if (!mqttClient || !mqttClient.connected) {
      logger.warn('MQTT client not connected, cannot publish message');
      return false;
    }

    try {
      const message = JSON.stringify(data);
      mqttClient.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          logger.error(`Failed to publish to topic ${topic}:`, error);
        } else {
          logger.info(`Published message to topic: ${topic}`);
        }
      });
      return true;
    } catch (error) {
      logger.error('Error publishing MQTT message:', error);
      return false;
    }
  }

  /**
   * Get system integration status
   */
  getIntegrationStatus() {
    return {
      services: this.serviceStatus,
      mqttTopics: Object.keys(this.mqttTopics),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test cross-service communication
   */
  async testCrossServiceCommunication() {
    const results = {
      aiServiceHealth: false,
      mqttPublish: false,
      mqttSubscribe: false,
      databaseConnection: false
    };

    try {
      // Test AI service health
      await this.checkAiService();
      results.aiServiceHealth = true;
    } catch (error) {
      logger.error('AI service test failed:', error.message);
    }

    try {
      // Test MQTT publish
      results.mqttPublish = this.publishMqttMessage('test/integration', {
        message: 'Integration test',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('MQTT publish test failed:', error.message);
    }

    try {
      // Test database connection
      await this.checkDatabase();
      results.databaseConnection = true;
    } catch (error) {
      logger.error('Database test failed:', error.message);
    }

    logger.info('Cross-service communication test results:', results);
    return results;
  }
}

module.exports = new SystemIntegrationService();