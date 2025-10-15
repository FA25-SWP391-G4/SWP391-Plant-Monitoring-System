const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const chatbotController = require('./controllers/chatbotController');
const { logger, errorHandlerMiddleware, asyncHandler } = require('./utils/errorHandler');
const { 
  rateLimiters, 
  corsOptions, 
  securityHeaders, 
  authenticateToken, 
  sanitizeRequest 
} = require('./middleware/securityMiddleware');
const { privacyCompliance } = require('./middleware/privacyMiddleware');
const { dataProtectionService } = require('./services/dataProtectionService');
const { dataRetentionService } = require('./services/dataRetentionService');

// Performance optimization services
const { redisCacheService } = require('./services/redisCacheService');
const { modelOptimizationService } = require('./services/modelOptimizationService');
const { databaseOptimizationService } = require('./services/databaseOptimizationService');
const { performanceMonitorService } = require('./services/performanceMonitorService');
const { AIComputationWorkerManager } = require('./workers/aiComputationWorker');

// Khởi tạo ứng dụng Express
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize performance optimization services
const workerManager = new AIComputationWorkerManager();

// Security Middleware (applied first)
app.use(securityHeaders);
app.use(cors(corsOptions));

// Rate limiting middleware
app.use('/api/ai/chatbot', rateLimiters.chatbot.middleware());
app.use('/api/ai/disease', rateLimiters.imageUpload.middleware());
app.use('/health', rateLimiters.health.middleware());
app.use('/api', rateLimiters.general.middleware());

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for signature verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Monitoring middleware to track API calls
const monitoringService = require('./services/monitoringService');
app.use((req, res, next) => {
  // Track API calls
  monitoringService.trackAPICall();
  
  // Track MQTT messages if it's an MQTT-related endpoint
  if (req.path.includes('mqtt') || req.headers['x-mqtt-message']) {
    monitoringService.trackMQTTMessage();
  }
  
  next();
});

// Request sanitization
app.use(sanitizeRequest);

// Performance monitoring middleware
app.use((req, res, next) => {
  req.performanceData = performanceMonitorService.recordRequest(req.path, req.method);
  
  const originalSend = res.send;
  res.send = function(data) {
    performanceMonitorService.recordResponse(req.performanceData, res.statusCode);
    return originalSend.call(this, data);
  };
  
  next();
});

// Privacy compliance middleware
app.use(privacyCompliance.addPrivacyHeaders);
app.use(privacyCompliance.logDataAccess);
app.use(privacyCompliance.validateConsent);
app.use(privacyCompliance.minimizeData);

// Handle data subject requests
app.use(privacyCompliance.handleDataSubjectRequest);

// Authentication middleware (optional for now)
app.use(authenticateToken);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Main AI Routes (New comprehensive API)
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);

// Monitoring and Analytics Routes
const monitoringRoutes = require('./routes/monitoringRoutes');
app.use('/api/monitoring', monitoringRoutes);

// Legacy Routes (for backward compatibility)
app.use('/api/image-recognition', require('./routes/imageRecognition'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/irrigation', require('./routes/irrigation'));
app.use('/api/irrigation-schedule', require('./routes/irrigationSchedule'));
app.use('/api/historical-analysis', require('./routes/historicalAnalysis'));
app.use('/api/self-learning', require('./routes/selfLearning'));

// Chatbot UI route
app.get('/chatbot', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
});

// Irrigation Prediction UI route
app.get('/irrigation-prediction', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'irrigation-prediction.html'));
});

// Dashboard UI route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API giả lập dữ liệu cảm biến cho giao diện
app.get('/api/sensor-data', chatbotController.simulateData);

// API giả lập dữ liệu cảm biến cho giao diện
app.get('/api/chatbot/simulate-data', chatbotController.simulateData);

// Enhanced root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Service for Smart Plant Monitoring System',
    version: '2.0.0',
    description: 'Comprehensive AI service with advanced plant care features',
    features: [
      'Smart Irrigation Prediction với AI',
      'Early Warning System - Cảnh báo sớm',
      'Image Recognition & Disease Detection',
      'Self-Learning & Continuous Improvement',
      'Automated Irrigation Control',
      'Intelligent Chatbot Support (Mistral 7B)'
    ],
    endpoints: {
      main: '/api/ai',
      legacy: {
        imageRecognition: '/api/image-recognition',
        chatbot: '/api/chatbot',
        irrigation: '/api/irrigation',
        irrigationSchedule: '/api/irrigation-schedule',
        historicalAnalysis: '/api/historical-analysis',
        selfLearning: '/api/self-learning'
      }
    },
    ui: {
      chatbot: '/chatbot',
      irrigationPrediction: '/irrigation-prediction',
      dashboard: '/dashboard'
    },
    documentation: '/api/docs',
    health: '/health'
  });
});

// Health check routes
app.use('/api/ai', require('./routes/healthRoutes'));

// Enhanced health check endpoint with performance metrics
app.get('/health', asyncHandler(async (req, res) => {
  const { healthMonitor } = require('./services/healthMonitorService');
  
  const systemHealth = await healthMonitor.performHealthCheck();
  const performanceReport = await performanceMonitorService.getPerformanceReport();
  const cacheStats = await redisCacheService.getStats();
  const modelStats = modelOptimizationService.getModelStats();
  const dbHealth = await databaseOptimizationService.healthCheck();
  
  const healthStatus = {
    status: systemHealth.status.toUpperCase(),
    timestamp: new Date().toISOString(),
    service: 'AI Service',
    version: '2.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    systemHealth,
    performance: {
      requests: performanceReport.requests.totalRequests,
      avgResponseTime: performanceReport.requests.avgResponseTime,
      errorRate: performanceReport.requests.errorRate,
      cacheHitRate: performanceReport.cache.metrics.overallHitRate
    },
    cache: {
      redis: cacheStats.redis.connected,
      fallbackSize: cacheStats.fallback.size
    },
    models: {
      loaded: modelStats.loadedModels,
      maxModels: modelStats.maxModels
    },
    database: dbHealth,
    features: {
      chatbot: healthMonitor.isServiceAvailable('openRouter') ? 'active' : 'degraded',
      imageRecognition: healthMonitor.isServiceAvailable('tensorflowjs') ? 'active' : 'degraded',
      irrigationPrediction: healthMonitor.isServiceAvailable('tensorflowjs') ? 'active' : 'degraded',
      earlyWarning: 'active',
      selfLearning: 'active',
      automation: healthMonitor.isServiceAvailable('mqtt') ? 'active' : 'degraded',
      caching: cacheStats.redis.connected ? 'active' : 'fallback',
      optimization: 'active'
    }
  };

  const statusCode = systemHealth.status === 'healthy' && dbHealth.status === 'healthy' ? 200 : 
                    systemHealth.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(healthStatus);
}));

// Privacy and Data Protection endpoints
app.get('/privacy/report/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const report = await dataProtectionService.generatePrivacyReport(userId);
  res.json(report);
}));

app.post('/privacy/delete/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await dataProtectionService.deleteUserData(userId);
  res.json(result);
}));

app.get('/privacy/retention-status', (req, res) => {
  const status = dataRetentionService.getRetentionStatus();
  res.json(status);
});

app.post('/privacy/manual-cleanup', asyncHandler(async (req, res) => {
  const { cleanupType = 'daily' } = req.body;
  const result = await dataRetentionService.performManualCleanup(cleanupType);
  res.json(result);
}));

// Performance and optimization endpoints
app.get('/performance/report', asyncHandler(async (req, res) => {
  const report = await performanceMonitorService.getPerformanceReport();
  res.json(report);
}));

app.get('/performance/history', asyncHandler(async (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  const history = performanceMonitorService.getPerformanceHistory(hours);
  res.json(history);
}));

app.get('/cache/stats', asyncHandler(async (req, res) => {
  const stats = await redisCacheService.getStats();
  res.json(stats);
}));

app.post('/cache/clear/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  const result = await redisCacheService.clearCacheType(type);
  res.json({ success: result, cacheType: type });
}));

app.post('/cache/warm', asyncHandler(async (req, res) => {
  const result = await redisCacheService.warmCache();
  res.json({ success: result });
}));

app.get('/models/stats', asyncHandler(async (req, res) => {
  const stats = modelOptimizationService.getModelStats();
  res.json(stats);
}));

app.post('/models/warm', asyncHandler(async (req, res) => {
  const { models } = req.body;
  await modelOptimizationService.warmUpModels(models);
  res.json({ success: true, warmedModels: models });
}));

app.post('/models/unload/:modelName', asyncHandler(async (req, res) => {
  const { modelName } = req.params;
  const result = await modelOptimizationService.unloadModel(modelName);
  res.json({ success: result, model: modelName });
}));

app.get('/database/stats', asyncHandler(async (req, res) => {
  const stats = await databaseOptimizationService.getDatabaseStats();
  res.json(stats);
}));

app.post('/database/analyze', asyncHandler(async (req, res) => {
  const { query, params } = req.body;
  const analysis = await databaseOptimizationService.analyzeQuery(query, params);
  res.json(analysis);
}));

app.get('/workers/stats', asyncHandler(async (req, res) => {
  const stats = workerManager.getStats();
  res.json(stats);
}));

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'AI Service API Documentation',
    version: '2.0.0',
    baseUrl: `http://localhost:${PORT}/api/ai`,
    features: {
      'Smart Irrigation': 'AI-powered irrigation prediction and optimization',
      'Early Warning': 'Proactive plant health monitoring and alerts',
      'Image Recognition': 'Plant disease detection through image analysis',
      'Self-Learning': 'Continuous improvement through user feedback',
      'Automation': 'Automated irrigation control with safety limits',
      'Chatbot': 'Intelligent plant care assistant using Mistral 7B',
      'Data Protection': 'GDPR-compliant data encryption and privacy',
      'Data Retention': 'Automated data lifecycle management'
    },
    endpoints: {
      chatbot: {
        'POST /api/ai/chatbot/message': 'Send message to AI chatbot',
        'GET /api/ai/chatbot/history/:sessionId': 'Get chat history'
      },
      irrigation: {
        'POST /api/ai/irrigation/predict/:plantId': 'Predict irrigation needs',
        'POST /api/ai/irrigation/optimize/:plantId': 'Optimize irrigation schedule'
      },
      earlyWarning: {
        'POST /api/ai/warning/analyze/:plantId': 'Analyze and generate warnings',
        'GET /api/ai/warning/dashboard/:plantId': 'Get warning dashboard'
      },
      automation: {
        'POST /api/ai/automation/setup/:plantId': 'Setup automation',
        'GET /api/ai/automation/dashboard': 'Get automation dashboard'
      },
      privacy: {
        'GET /privacy/report/:userId': 'Get user privacy report',
        'POST /privacy/delete/:userId': 'Delete user data (GDPR)',
        'GET /privacy/retention-status': 'Get data retention status',
        'POST /privacy/manual-cleanup': 'Trigger manual data cleanup'
      }
    },
    dataProtection: {
      encryption: 'AES-256-GCM',
      retention: 'Automated policy-based cleanup',
      privacy: 'GDPR compliant',
      audit: 'Comprehensive logging'
    }
  });
});

// Xử lý lỗi 404
app.use((req, res, next) => {
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    success: false,
    error: {
      code: 'AI_404',
      message: 'Không tìm thấy endpoint',
      availableEndpoints: [
        '/api/ai/chatbot/message',
        '/api/ai/disease/analyze',
        '/api/ai/irrigation/predict',
        '/health',
        '/api/docs'
      ]
    }
  });
});

// Comprehensive error handling middleware
app.use(errorHandlerMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request Warning', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  const { healthMonitor } = require('./services/healthMonitorService');
  
  // Stop all services
  healthMonitor.stopMonitoring();
  dataRetentionService.stop();
  
  // Shutdown optimization services
  await redisCacheService.shutdown();
  await modelOptimizationService.shutdown();
  await databaseOptimizationService.shutdown();
  performanceMonitorService.shutdown();
  await workerManager.shutdown();
  
  logger.info('All services stopped, exiting');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  const { healthMonitor } = require('./services/healthMonitorService');
  
  // Stop all services
  healthMonitor.stopMonitoring();
  dataRetentionService.stop();
  
  // Shutdown optimization services
  await redisCacheService.shutdown();
  await modelOptimizationService.shutdown();
  await databaseOptimizationService.shutdown();
  performanceMonitorService.shutdown();
  await workerManager.shutdown();
  
  logger.info('All services stopped, exiting');
  process.exit(0);
});

// Khởi động server
app.listen(PORT, async () => {
  const { healthMonitor } = require('./services/healthMonitorService');
  
  logger.info('AI Service Started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    features: [
      'Smart Irrigation',
      'Early Warning', 
      'Image Recognition',
      'Self-Learning',
      'Automation',
      'Chatbot (Mistral 7B)',
      'Data Protection',
      'Privacy Compliance',
      'Performance Optimization',
      'Redis Caching',
      'Model Lazy Loading',
      'Database Optimization',
      'WebWorker Processing'
    ]
  });
  
  // Start health monitoring
  healthMonitor.startMonitoring(60000); // Check every minute
  
  // Start data retention service
  try {
    dataRetentionService.start();
    logger.info('Data retention service started successfully');
  } catch (error) {
    logger.error('Failed to start data retention service', { error: error.message });
  }
  
  // Start automatic data protection cleanup
  dataProtectionService.startAutomaticCleanup();
  
  // Initialize performance optimization services
  try {
    // Start Redis cache periodic cleanup
    redisCacheService.startPeriodicCleanup();
    logger.info('Redis cache service initialized');
    
    // Warm up frequently used models
    await modelOptimizationService.warmUpModels(['diseaseDetection', 'irrigationPrediction']);
    logger.info('Model optimization service initialized');
    
    // Start performance monitoring
    performanceMonitorService.onAlert((alert) => {
      logger.warn('Performance alert:', alert);
    });
    logger.info('Performance monitoring service initialized');
    
  } catch (error) {
    logger.error('Failed to initialize optimization services:', error);
  }
  
  console.log(`🚀 AI Service đang chạy trên cổng ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Performance: http://localhost:${PORT}/performance/report`);
  console.log(`🗄️ Cache stats: http://localhost:${PORT}/cache/stats`);
  console.log(`🤖 Models stats: http://localhost:${PORT}/models/stats`);
  console.log(`📖 Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🤖 Main API: http://localhost:${PORT}/api/ai`);
  console.log(`🌱 Tính năng: Smart Irrigation, Early Warning, Image Recognition, Self-Learning, Automation`);
  console.log(`💬 Chatbot: Mistral 7B Instruct qua OpenRouter API`);
  console.log(`🔒 Data Protection: Encryption, Privacy Compliance, Data Retention`);
  console.log(`⚡ Performance: Redis Caching, Model Optimization, Database Optimization, WebWorker Processing`);
});

module.exports = app;