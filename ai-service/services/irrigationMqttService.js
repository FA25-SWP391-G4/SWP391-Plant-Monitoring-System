const winston = require('winston');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/irrigation-mqtt.log' }),
    new winston.transports.Console()
  ]
});

class IrrigationMqttService {
  constructor(mqttClient) {
    this.mqttClient = mqttClient;
    this.isConnected = false;
    this.subscriptions = new Set();
    
    // MQTT Topics for irrigation
    this.topics = {
      // Sensor data input
      sensorData: 'sensors/plant/{plantId}/data',
      
      // Irrigation predictions output
      prediction: 'ai/irrigation/prediction/{plantId}',
      recommendation: 'ai/irrigation/recommendation/{plantId}',
      alert: 'ai/irrigation/alert/{plantId}',
      schedule: 'ai/irrigation/schedule/{plantId}',
      
      // System status
      status: 'ai/irrigation/status',
      modelUpdate: 'ai/irrigation/model-update',
      
      // Control commands
      waterCommand: 'irrigation/command/{plantId}/water',
      stopCommand: 'irrigation/command/{plantId}/stop',
      
      // Feedback from irrigation system
      wateringConfirm: 'irrigation/status/{plantId}/watering',
      systemStatus: 'irrigation/status/{plantId}/system'
    };
    
    this.initialize();
  }

  async initialize() {
    try {
      if (this.mqttClient && typeof this.mqttClient.on === 'function') {
        this.setupMqttHandlers();
        this.isConnected = true;
        logger.info('Irrigation MQTT service initialized');
      } else {
        logger.warn('MQTT client not available, using mock mode');
        this.isConnected = false;
      }
    } catch (error) {
      logger.error('Error initializing irrigation MQTT service:', error);
      this.isConnected = false;
    }
  }

  setupMqttHandlers() {
    // Handle connection events
    this.mqttClient.on('connect', () => {
      logger.info('MQTT connected for irrigation service');
      this.subscribeToSensorData();
      this.publishSystemStatus('online');
    });

    this.mqttClient.on('disconnect', () => {
      logger.warn('MQTT disconnected for irrigation service');
      this.isConnected = false;
    });

    this.mqttClient.on('error', (error) => {
      logger.error('MQTT error in irrigation service:', error);
    });

    // Handle incoming messages
    this.mqttClient.on('message', (topic, message) => {
      this.handleIncomingMessage(topic, message);
    });
  }

  subscribeToSensorData() {
    try {
      // Subscribe to all plant sensor data
      const sensorTopic = 'sensors/plant/+/data';
      this.mqttClient.subscribe(sensorTopic, (err) => {
        if (err) {
          logger.error('Failed to subscribe to sensor data:', err);
        } else {
          logger.info('Subscribed to sensor data topic:', sensorTopic);
          this.subscriptions.add(sensorTopic);
        }
      });

      // Subscribe to irrigation system status
      const statusTopic = 'irrigation/status/+/system';
      this.mqttClient.subscribe(statusTopic, (err) => {
        if (err) {
          logger.error('Failed to subscribe to irrigation status:', err);
        } else {
          logger.info('Subscribed to irrigation status topic:', statusTopic);
          this.subscriptions.add(statusTopic);
        }
      });

      // Subscribe to watering confirmations
      const confirmTopic = 'irrigation/status/+/watering';
      this.mqttClient.subscribe(confirmTopic, (err) => {
        if (err) {
          logger.error('Failed to subscribe to watering confirmations:', err);
        } else {
          logger.info('Subscribed to watering confirmations:', confirmTopic);
          this.subscriptions.add(confirmTopic);
        }
      });

    } catch (error) {
      logger.error('Error subscribing to MQTT topics:', error);
    }
  }

  handleIncomingMessage(topic, message) {
    try {
      const messageStr = message.toString();
      logger.debug('Received MQTT message', { topic, message: messageStr });

      // Parse sensor data messages
      if (topic.startsWith('sensors/plant/') && topic.endsWith('/data')) {
        const plantId = this.extractPlantIdFromTopic(topic);
        const sensorData = JSON.parse(messageStr);
        this.handleSensorData(plantId, sensorData);
      }
      
      // Parse irrigation system status
      else if (topic.startsWith('irrigation/status/') && topic.endsWith('/system')) {
        const plantId = this.extractPlantIdFromTopic(topic);
        const statusData = JSON.parse(messageStr);
        this.handleIrrigationSystemStatus(plantId, statusData);
      }
      
      // Parse watering confirmations
      else if (topic.startsWith('irrigation/status/') && topic.endsWith('/watering')) {
        const plantId = this.extractPlantIdFromTopic(topic);
        const wateringData = JSON.parse(messageStr);
        this.handleWateringConfirmation(plantId, wateringData);
      }

    } catch (error) {
      logger.error('Error handling MQTT message:', error, { topic });
    }
  }

  extractPlantIdFromTopic(topic) {
    const parts = topic.split('/');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'plant' && i + 1 < parts.length) {
        return parseInt(parts[i + 1]);
      }
    }
    return null;
  }

  async handleSensorData(plantId, sensorData) {
    try {
      logger.info('Processing sensor data for irrigation prediction', { plantId });
      
      // Add timestamp if not present
      if (!sensorData.timestamp) {
        sensorData.timestamp = new Date().toISOString();
      }

      // Trigger irrigation prediction analysis
      // This would typically call the irrigation prediction service
      const predictionResult = await this.triggerIrrigationAnalysis(plantId, sensorData);
      
      if (predictionResult) {
        // Publish prediction results
        await this.publishPredictionResult(plantId, predictionResult);
        
        // Check for urgent alerts
        if (predictionResult.shouldWater && predictionResult.confidence > 0.8) {
          await this.publishUrgentAlert(plantId, predictionResult, sensorData);
        }
      }

    } catch (error) {
      logger.error('Error handling sensor data:', error, { plantId });
    }
  }

  async triggerIrrigationAnalysis(plantId, sensorData) {
    try {
      // This would integrate with the IrrigationPredictionService
      // For now, we'll create a mock analysis
      const mockPrediction = {
        plantId: plantId,
        shouldWater: sensorData.soilMoisture < 30,
        waterAmount: sensorData.soilMoisture < 20 ? 500 : 300,
        hoursUntilWater: sensorData.soilMoisture < 20 ? 0 : 12,
        confidence: 0.85,
        explanation: `Soil moisture: ${sensorData.soilMoisture}%, Temperature: ${sensorData.temperature}°C`,
        timestamp: new Date().toISOString(),
        sensorData: sensorData
      };

      logger.info('Irrigation analysis completed', { 
        plantId, 
        shouldWater: mockPrediction.shouldWater,
        confidence: mockPrediction.confidence 
      });

      return mockPrediction;
    } catch (error) {
      logger.error('Error in irrigation analysis:', error);
      return null;
    }
  }

  async publishPredictionResult(plantId, prediction) {
    try {
      const topic = this.topics.prediction.replace('{plantId}', plantId);
      const message = JSON.stringify({
        plantId: plantId,
        prediction: {
          shouldWater: prediction.shouldWater,
          waterAmount: prediction.waterAmount,
          hoursUntilWater: prediction.hoursUntilWater,
          confidence: prediction.confidence,
          explanation: prediction.explanation
        },
        timestamp: prediction.timestamp,
        source: 'ai-irrigation-service'
      });

      if (this.isConnected) {
        this.mqttClient.publish(topic, message, { qos: 1 }, (err) => {
          if (err) {
            logger.error('Failed to publish prediction result:', err);
          } else {
            logger.info('Published prediction result', { plantId, topic });
          }
        });
      } else {
        logger.warn('MQTT not connected, prediction result not published', { plantId });
      }

    } catch (error) {
      logger.error('Error publishing prediction result:', error);
    }
  }

  async publishUrgentAlert(plantId, prediction, sensorData) {
    try {
      const alertLevel = this.determineAlertLevel(prediction, sensorData);
      const topic = this.topics.alert.replace('{plantId}', plantId);
      
      const alertMessage = {
        plantId: plantId,
        alertType: 'urgent_watering',
        level: alertLevel, // 'low', 'medium', 'high', 'critical'
        message: this.generateAlertMessage(alertLevel, prediction, sensorData),
        recommendation: {
          action: 'water_immediately',
          waterAmount: prediction.waterAmount,
          reason: prediction.explanation
        },
        sensorData: {
          soilMoisture: sensorData.soilMoisture,
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          lastWatering: sensorData.lastWateringTime
        },
        confidence: prediction.confidence,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
      };

      if (this.isConnected) {
        this.mqttClient.publish(topic, JSON.stringify(alertMessage), { qos: 2 }, (err) => {
          if (err) {
            logger.error('Failed to publish urgent alert:', err);
          } else {
            logger.warn('Published urgent irrigation alert', { 
              plantId, 
              level: alertLevel,
              topic 
            });
          }
        });
      } else {
        logger.error('MQTT not connected, urgent alert not published', { plantId, level: alertLevel });
      }

    } catch (error) {
      logger.error('Error publishing urgent alert:', error);
    }
  }

  determineAlertLevel(prediction, sensorData) {
    const soilMoisture = sensorData.soilMoisture;
    const temperature = sensorData.temperature;
    const confidence = prediction.confidence;

    // Critical: Very dry soil + high temperature + high confidence
    if (soilMoisture < 15 && temperature > 35 && confidence > 0.9) {
      return 'critical';
    }
    
    // High: Dry soil + hot weather + high confidence
    if (soilMoisture < 20 && temperature > 30 && confidence > 0.8) {
      return 'high';
    }
    
    // Medium: Moderately dry soil + warm weather
    if (soilMoisture < 25 && temperature > 25 && confidence > 0.7) {
      return 'medium';
    }
    
    // Low: Slightly dry soil
    return 'low';
  }

  generateAlertMessage(level, prediction, sensorData) {
    const plantId = prediction.plantId;
    const soilMoisture = sensorData.soilMoisture;
    const temperature = sensorData.temperature;

    switch (level) {
      case 'critical':
        return `🚨 CRITICAL: Plant ${plantId} needs immediate watering! Soil moisture: ${soilMoisture}%, Temperature: ${temperature}°C. Risk of plant damage.`;
      
      case 'high':
        return `⚠️ HIGH PRIORITY: Plant ${plantId} requires watering soon. Soil moisture: ${soilMoisture}%, Temperature: ${temperature}°C.`;
      
      case 'medium':
        return `⚡ MEDIUM: Plant ${plantId} should be watered within a few hours. Soil moisture: ${soilMoisture}%, Temperature: ${temperature}°C.`;
      
      case 'low':
        return `💧 LOW: Plant ${plantId} may need watering. Monitor soil moisture: ${soilMoisture}%, Temperature: ${temperature}°C.`;
      
      default:
        return `Plant ${plantId} irrigation alert. Soil moisture: ${soilMoisture}%, Temperature: ${temperature}°C.`;
    }
  }

  async publishRecommendation(plantId, recommendation) {
    try {
      const topic = this.topics.recommendation.replace('{plantId}', plantId);
      const message = JSON.stringify({
        plantId: plantId,
        recommendation: recommendation,
        timestamp: new Date().toISOString(),
        source: 'ai-irrigation-service'
      });

      if (this.isConnected) {
        this.mqttClient.publish(topic, message, { qos: 1 }, (err) => {
          if (err) {
            logger.error('Failed to publish recommendation:', err);
          } else {
            logger.info('Published irrigation recommendation', { plantId });
          }
        });
      }

    } catch (error) {
      logger.error('Error publishing recommendation:', error);
    }
  }

  async publishSchedule(plantId, schedule) {
    try {
      const topic = this.topics.schedule.replace('{plantId}', plantId);
      const message = JSON.stringify({
        plantId: plantId,
        schedule: schedule,
        timestamp: new Date().toISOString(),
        source: 'ai-irrigation-service'
      });

      if (this.isConnected) {
        this.mqttClient.publish(topic, message, { qos: 1 }, (err) => {
          if (err) {
            logger.error('Failed to publish schedule:', err);
          } else {
            logger.info('Published irrigation schedule', { plantId, scheduleItems: schedule.length });
          }
        });
      }

    } catch (error) {
      logger.error('Error publishing schedule:', error);
    }
  }

  async sendWateringCommand(plantId, waterAmount, duration = null) {
    try {
      const topic = this.topics.waterCommand.replace('{plantId}', plantId);
      const command = {
        plantId: plantId,
        action: 'start_watering',
        waterAmount: waterAmount, // ml
        duration: duration, // seconds (optional)
        timestamp: new Date().toISOString(),
        source: 'ai-irrigation-service',
        commandId: `cmd_${Date.now()}_${plantId}`
      };

      if (this.isConnected) {
        this.mqttClient.publish(topic, JSON.stringify(command), { qos: 2 }, (err) => {
          if (err) {
            logger.error('Failed to send watering command:', err);
          } else {
            logger.info('Sent watering command', { 
              plantId, 
              waterAmount, 
              commandId: command.commandId 
            });
          }
        });
      } else {
        logger.error('MQTT not connected, watering command not sent', { plantId });
      }

      return command.commandId;
    } catch (error) {
      logger.error('Error sending watering command:', error);
      return null;
    }
  }

  async sendStopCommand(plantId, reason = 'manual_stop') {
    try {
      const topic = this.topics.stopCommand.replace('{plantId}', plantId);
      const command = {
        plantId: plantId,
        action: 'stop_watering',
        reason: reason,
        timestamp: new Date().toISOString(),
        source: 'ai-irrigation-service',
        commandId: `stop_${Date.now()}_${plantId}`
      };

      if (this.isConnected) {
        this.mqttClient.publish(topic, JSON.stringify(command), { qos: 2 }, (err) => {
          if (err) {
            logger.error('Failed to send stop command:', err);
          } else {
            logger.info('Sent stop watering command', { plantId, reason });
          }
        });
      }

      return command.commandId;
    } catch (error) {
      logger.error('Error sending stop command:', error);
      return null;
    }
  }

  handleIrrigationSystemStatus(plantId, statusData) {
    try {
      logger.info('Received irrigation system status', { plantId, status: statusData.status });
      
      // Handle different system statuses
      switch (statusData.status) {
        case 'watering':
          logger.info(`Plant ${plantId} is currently being watered`);
          break;
        case 'idle':
          logger.info(`Plant ${plantId} irrigation system is idle`);
          break;
        case 'error':
          logger.error(`Plant ${plantId} irrigation system error:`, statusData.error);
          this.handleIrrigationError(plantId, statusData);
          break;
        case 'maintenance':
          logger.warn(`Plant ${plantId} irrigation system in maintenance mode`);
          break;
      }

    } catch (error) {
      logger.error('Error handling irrigation system status:', error);
    }
  }

  handleWateringConfirmation(plantId, wateringData) {
    try {
      logger.info('Received watering confirmation', { 
        plantId, 
        waterAmount: wateringData.waterAmount,
        duration: wateringData.duration 
      });

      // This could trigger feedback learning for the ML model
      // Store the actual watering data for model improvement
      const feedbackData = {
        plantId: plantId,
        actualWatering: {
          waterAmount: wateringData.waterAmount,
          duration: wateringData.duration,
          timestamp: wateringData.timestamp
        },
        success: wateringData.success,
        sensorDataBefore: wateringData.sensorDataBefore,
        sensorDataAfter: wateringData.sensorDataAfter
      };

      // In a real implementation, this would be sent to the learning service
      logger.debug('Watering feedback data collected', feedbackData);

    } catch (error) {
      logger.error('Error handling watering confirmation:', error);
    }
  }

  handleIrrigationError(plantId, statusData) {
    try {
      // Publish error alert
      const errorAlert = {
        plantId: plantId,
        alertType: 'system_error',
        level: 'high',
        message: `Irrigation system error for plant ${plantId}: ${statusData.error}`,
        errorDetails: statusData,
        timestamp: new Date().toISOString(),
        requiresAttention: true
      };

      const topic = this.topics.alert.replace('{plantId}', plantId);
      
      if (this.isConnected) {
        this.mqttClient.publish(topic, JSON.stringify(errorAlert), { qos: 2 });
      }

      logger.error('Published irrigation system error alert', { plantId });

    } catch (error) {
      logger.error('Error handling irrigation error:', error);
    }
  }

  publishSystemStatus(status) {
    try {
      const statusMessage = {
        service: 'irrigation-ai-service',
        status: status, // 'online', 'offline', 'error'
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        capabilities: [
          'irrigation_prediction',
          'urgent_alerts',
          'schedule_optimization',
          'real_time_monitoring'
        ]
      };

      if (this.isConnected) {
        this.mqttClient.publish(this.topics.status, JSON.stringify(statusMessage), { qos: 1 });
      }

      logger.info('Published system status', { status });

    } catch (error) {
      logger.error('Error publishing system status:', error);
    }
  }

  // Cleanup method
  async cleanup() {
    try {
      if (this.isConnected && this.mqttClient) {
        // Unsubscribe from all topics
        for (const topic of this.subscriptions) {
          this.mqttClient.unsubscribe(topic);
        }
        
        // Publish offline status
        this.publishSystemStatus('offline');
        
        logger.info('Irrigation MQTT service cleaned up');
      }
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }

  // Getters
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      subscriptions: Array.from(this.subscriptions),
      topics: this.topics
    };
  }
}

module.exports = IrrigationMqttService;