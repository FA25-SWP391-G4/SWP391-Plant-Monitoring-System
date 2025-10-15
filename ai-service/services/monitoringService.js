const winston = require('winston');
const path = require('path');

class MonitoringService {
  constructor() {
    this.metrics = {
      chatbot: {
        totalRequests: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        userSatisfactionRatings: [],
        topicCoverage: { plant: 0, nonPlant: 0 },
        fallbackRate: 0,
        fallbackCount: 0
      },
      diseaseDetection: {
        totalAnalyses: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        accuracyRatings: [],
        confidenceDistribution: [],
        diseaseFrequency: {},
        userFeedback: []
      },
      irrigationPrediction: {
        totalPredictions: 0,
        accuracyRatings: [],
        waterSavingsEstimate: 0,
        userAdoptionRate: 0,
        modelDriftMetrics: [],
        predictionConfidence: []
      },
      system: {
        uptime: Date.now(),
        errorCount: 0,
        apiCalls: 0,
        mqttMessages: 0
      }
    };

    this.setupLogger();
    this.startMetricsCollection();
  }

  setupLogger() {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, '../logs');
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'ai-monitoring' },
      transports: [
        // Error logs
        new winston.transports.File({ 
          filename: path.join(logsDir, 'error.log'), 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        // Combined logs
        new winston.transports.File({ 
          filename: path.join(logsDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        // AI inference logs
        new winston.transports.File({ 
          filename: path.join(logsDir, 'ai-inference.log'),
          level: 'info',
          maxsize: 10485760, // 10MB
          maxFiles: 10
        }),
        // User interaction logs
        new winston.transports.File({ 
          filename: path.join(logsDir, 'user-interactions.log'),
          level: 'info',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });

    // Add console transport for development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  startMetricsCollection() {
    // Update system metrics every minute
    setInterval(() => {
      this.updateSystemMetrics();
    }, 60000);

    // Calculate derived metrics every 5 minutes
    setInterval(() => {
      this.calculateDerivedMetrics();
    }, 300000);
  }

  // Chatbot Metrics
  trackChatbotRequest(startTime, endTime, isPlantRelated, usedFallback, userSatisfaction = null) {
    const responseTime = endTime - startTime;
    
    this.metrics.chatbot.totalRequests++;
    this.metrics.chatbot.totalResponseTime += responseTime;
    this.metrics.chatbot.averageResponseTime = 
      this.metrics.chatbot.totalResponseTime / this.metrics.chatbot.totalRequests;

    if (isPlantRelated) {
      this.metrics.chatbot.topicCoverage.plant++;
    } else {
      this.metrics.chatbot.topicCoverage.nonPlant++;
    }

    if (usedFallback) {
      this.metrics.chatbot.fallbackCount++;
    }

    if (userSatisfaction !== null) {
      this.metrics.chatbot.userSatisfactionRatings.push(userSatisfaction);
    }

    this.metrics.chatbot.fallbackRate = 
      this.metrics.chatbot.fallbackCount / this.metrics.chatbot.totalRequests;

    // Log the interaction
    this.logUserInteraction('chatbot', {
      responseTime,
      isPlantRelated,
      usedFallback,
      userSatisfaction,
      timestamp: new Date().toISOString()
    });
  }

  // Disease Detection Metrics
  trackDiseaseDetection(startTime, endTime, confidence, detectedDiseases, userFeedback = null) {
    const processingTime = endTime - startTime;
    
    this.metrics.diseaseDetection.totalAnalyses++;
    this.metrics.diseaseDetection.totalProcessingTime += processingTime;
    this.metrics.diseaseDetection.averageProcessingTime = 
      this.metrics.diseaseDetection.totalProcessingTime / this.metrics.diseaseDetection.totalAnalyses;

    this.metrics.diseaseDetection.confidenceDistribution.push(confidence);

    // Track disease frequency
    detectedDiseases.forEach(disease => {
      if (!this.metrics.diseaseDetection.diseaseFrequency[disease.name]) {
        this.metrics.diseaseDetection.diseaseFrequency[disease.name] = 0;
      }
      this.metrics.diseaseDetection.diseaseFrequency[disease.name]++;
    });

    if (userFeedback) {
      this.metrics.diseaseDetection.userFeedback.push(userFeedback);
      if (userFeedback.isAccurate !== undefined) {
        this.metrics.diseaseDetection.accuracyRatings.push(userFeedback.isAccurate ? 1 : 0);
      }
    }

    // Log AI inference
    this.logAIInference('disease_detection', {
      processingTime,
      confidence,
      detectedDiseases,
      userFeedback,
      timestamp: new Date().toISOString()
    });
  }

  // Irrigation Prediction Metrics
  trackIrrigationPrediction(confidence, prediction, userAdopted = null, actualOutcome = null) {
    this.metrics.irrigationPrediction.totalPredictions++;
    this.metrics.irrigationPrediction.predictionConfidence.push(confidence);

    if (userAdopted !== null) {
      const adoptionCount = this.metrics.irrigationPrediction.userAdoptionRate * 
        (this.metrics.irrigationPrediction.totalPredictions - 1);
      const newAdoptionRate = (adoptionCount + (userAdopted ? 1 : 0)) / 
        this.metrics.irrigationPrediction.totalPredictions;
      this.metrics.irrigationPrediction.userAdoptionRate = newAdoptionRate;
    }

    if (actualOutcome !== null && prediction.shouldWater !== undefined) {
      const isAccurate = prediction.shouldWater === actualOutcome.wasNeeded;
      this.metrics.irrigationPrediction.accuracyRatings.push(isAccurate ? 1 : 0);
    }

    // Estimate water savings (simplified calculation)
    if (prediction.shouldWater === false && prediction.confidence > 0.7) {
      this.metrics.irrigationPrediction.waterSavingsEstimate += prediction.waterAmount || 500; // ml
    }

    // Log AI inference
    this.logAIInference('irrigation_prediction', {
      confidence,
      prediction,
      userAdopted,
      actualOutcome,
      timestamp: new Date().toISOString()
    });
  }

  // System Metrics
  trackAPICall() {
    this.metrics.system.apiCalls++;
  }

  trackMQTTMessage() {
    this.metrics.system.mqttMessages++;
  }

  trackError(error, context = {}) {
    this.metrics.system.errorCount++;
    
    this.logger.error('System error occurred', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  updateSystemMetrics() {
    const currentTime = Date.now();
    const uptimeHours = (currentTime - this.metrics.system.uptime) / (1000 * 60 * 60);
    
    this.logger.info('System metrics update', {
      uptime: uptimeHours,
      totalAPIcalls: this.metrics.system.apiCalls,
      totalMQTTMessages: this.metrics.system.mqttMessages,
      totalErrors: this.metrics.system.errorCount,
      timestamp: new Date().toISOString()
    });
  }

  calculateDerivedMetrics() {
    // Calculate chatbot satisfaction rate
    const chatbotSatisfaction = this.metrics.chatbot.userSatisfactionRatings.length > 0 ?
      this.metrics.chatbot.userSatisfactionRatings.reduce((a, b) => a + b, 0) / 
      this.metrics.chatbot.userSatisfactionRatings.length : 0;

    // Calculate disease detection accuracy
    const diseaseAccuracy = this.metrics.diseaseDetection.accuracyRatings.length > 0 ?
      this.metrics.diseaseDetection.accuracyRatings.reduce((a, b) => a + b, 0) / 
      this.metrics.diseaseDetection.accuracyRatings.length : 0;

    // Calculate irrigation prediction accuracy
    const irrigationAccuracy = this.metrics.irrigationPrediction.accuracyRatings.length > 0 ?
      this.metrics.irrigationPrediction.accuracyRatings.reduce((a, b) => a + b, 0) / 
      this.metrics.irrigationPrediction.accuracyRatings.length : 0;

    this.logger.info('Derived metrics calculated', {
      chatbotSatisfactionRate: chatbotSatisfaction,
      diseaseDetectionAccuracy: diseaseAccuracy,
      irrigationPredictionAccuracy: irrigationAccuracy,
      waterSavingsEstimate: this.metrics.irrigationPrediction.waterSavingsEstimate,
      timestamp: new Date().toISOString()
    });
  }

  logAIInference(modelType, data) {
    this.logger.info('AI inference completed', {
      modelType,
      ...data,
      category: 'ai_inference'
    });
  }

  logUserInteraction(feature, data) {
    this.logger.info('User interaction tracked', {
      feature,
      ...data,
      category: 'user_interaction'
    });
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      derivedMetrics: {
        chatbotSatisfactionRate: this.metrics.chatbot.userSatisfactionRatings.length > 0 ?
          this.metrics.chatbot.userSatisfactionRatings.reduce((a, b) => a + b, 0) / 
          this.metrics.chatbot.userSatisfactionRatings.length : 0,
        diseaseDetectionAccuracy: this.metrics.diseaseDetection.accuracyRatings.length > 0 ?
          this.metrics.diseaseDetection.accuracyRatings.reduce((a, b) => a + b, 0) / 
          this.metrics.diseaseDetection.accuracyRatings.length : 0,
        irrigationPredictionAccuracy: this.metrics.irrigationPrediction.accuracyRatings.length > 0 ?
          this.metrics.irrigationPrediction.accuracyRatings.reduce((a, b) => a + b, 0) / 
          this.metrics.irrigationPrediction.accuracyRatings.length : 0,
        plantTopicCoverageRate: this.metrics.chatbot.topicCoverage.plant / 
          (this.metrics.chatbot.topicCoverage.plant + this.metrics.chatbot.topicCoverage.nonPlant || 1)
      }
    };
  }

  // Export metrics for external monitoring systems
  exportMetrics(format = 'json') {
    const metrics = this.getMetrics();
    
    if (format === 'prometheus') {
      return this.formatPrometheusMetrics(metrics);
    }
    
    return JSON.stringify(metrics, null, 2);
  }

  formatPrometheusMetrics(metrics) {
    let prometheusFormat = '';
    
    // Chatbot metrics
    prometheusFormat += `# HELP chatbot_total_requests Total number of chatbot requests\n`;
    prometheusFormat += `# TYPE chatbot_total_requests counter\n`;
    prometheusFormat += `chatbot_total_requests ${metrics.chatbot.totalRequests}\n\n`;
    
    prometheusFormat += `# HELP chatbot_average_response_time Average response time in milliseconds\n`;
    prometheusFormat += `# TYPE chatbot_average_response_time gauge\n`;
    prometheusFormat += `chatbot_average_response_time ${metrics.chatbot.averageResponseTime}\n\n`;
    
    // Disease detection metrics
    prometheusFormat += `# HELP disease_detection_total_analyses Total number of disease analyses\n`;
    prometheusFormat += `# TYPE disease_detection_total_analyses counter\n`;
    prometheusFormat += `disease_detection_total_analyses ${metrics.diseaseDetection.totalAnalyses}\n\n`;
    
    // System metrics
    prometheusFormat += `# HELP system_api_calls_total Total number of API calls\n`;
    prometheusFormat += `# TYPE system_api_calls_total counter\n`;
    prometheusFormat += `system_api_calls_total ${metrics.system.apiCalls}\n\n`;
    
    return prometheusFormat;
  }

  // Reset metrics (for testing or periodic resets)
  resetMetrics() {
    this.metrics = {
      chatbot: {
        totalRequests: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        userSatisfactionRatings: [],
        topicCoverage: { plant: 0, nonPlant: 0 },
        fallbackRate: 0,
        fallbackCount: 0
      },
      diseaseDetection: {
        totalAnalyses: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        accuracyRatings: [],
        confidenceDistribution: [],
        diseaseFrequency: {},
        userFeedback: []
      },
      irrigationPrediction: {
        totalPredictions: 0,
        accuracyRatings: [],
        waterSavingsEstimate: 0,
        userAdoptionRate: 0,
        modelDriftMetrics: [],
        predictionConfidence: []
      },
      system: {
        uptime: Date.now(),
        errorCount: 0,
        apiCalls: 0,
        mqttMessages: 0
      }
    };
    
    this.logger.info('Metrics reset', { timestamp: new Date().toISOString() });
  }
}

module.exports = new MonitoringService();