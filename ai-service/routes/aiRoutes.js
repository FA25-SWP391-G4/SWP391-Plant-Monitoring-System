/**
 * AI Routes - Tổng hợp tất cả routes cho AI services với security middleware
 */

const express = require('express');
const router = express.Router();

// Import controllers
const chatbotController = require('../controllers/chatbotController');
const imageRecognitionController = require('../controllers/imageRecognitionController');
const irrigationPredictionController = require('../controllers/irrigationPredictionController');
const earlyWarningController = require('../controllers/earlyWarningController');
const selfLearningController = require('../controllers/selfLearningController');
const automationController = require('../controllers/automationController');
const diseaseDetectionController = require('../controllers/diseaseDetectionController');

// Import security middleware
const {
  validateChatbotRequest,
  validateDiseaseDetectionRequest,
  validateIrrigationRequest,
  validateApiKey,
  validateUploadSecurity
} = require('../middleware/aiSecurityMiddleware');

// Middleware for file upload with security
const multer = require('multer');
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Basic file type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// ============= CHATBOT ROUTES =============
router.post('/chatbot/message', validateChatbotRequest, chatbotController.handleMessage);
router.get('/chatbot/history/:sessionId', chatbotController.getChatHistory);
router.get('/chatbot/sessions/:userId', chatbotController.getChatSessions);
router.get('/chatbot/simulate', chatbotController.simulateData);

// ============= IMAGE RECOGNITION ROUTES =============
router.post('/image/analyze', upload.single('image'), imageRecognitionController.recognizePlantDisease);
router.get('/image/history/:userId/:plantId?', imageRecognitionController.getAnalysisHistory);
router.post('/image/compare', imageRecognitionController.compareImages);

// ============= DISEASE DETECTION ROUTES =============
router.post('/disease/analyze', 
  upload.single('image'), 
  validateUploadSecurity,
  validateDiseaseDetectionRequest, 
  async (req, res) => {
    await diseaseDetectionController.analyzeDisease(req, res);
  }
);
router.get('/disease/history/:plantId', 
  validateDiseaseDetectionRequest,
  async (req, res) => {
    await diseaseDetectionController.getDiseaseHistory(req, res);
  }
);
router.get('/disease/treatments/:diseaseType', async (req, res) => {
  await diseaseDetectionController.getTreatments(req, res);
});
router.post('/disease/validate-image', 
  upload.single('image'),
  validateUploadSecurity,
  validateDiseaseDetectionRequest,
  async (req, res) => {
    await diseaseDetectionController.validateImage(req, res);
  }
);
router.post('/disease/feedback/:analysisId', async (req, res) => {
  await diseaseDetectionController.submitFeedback(req, res);
});
router.get('/disease/supported', async (req, res) => {
  await diseaseDetectionController.getSupportedDiseases(req, res);
});
router.get('/disease/image/:filename', async (req, res) => {
  await diseaseDetectionController.getStoredImage(req, res);
});
router.get('/disease/statistics', async (req, res) => {
  await diseaseDetectionController.getAnalysisStatistics(req, res);
});

// ============= IRRIGATION PREDICTION ROUTES =============
// Import the new irrigation routes
const irrigationRoutes = require('./irrigationRoutes');
router.use('/irrigation', irrigationRoutes);

// Legacy routes for backward compatibility
router.post('/irrigation/predict/:plantId', irrigationPredictionController.analyzeAndAlert);
router.post('/irrigation/optimize/:plantId', irrigationPredictionController.optimizeSchedule);
router.get('/irrigation/history/:plantId', irrigationPredictionController.getPredictionHistory);

// ============= EARLY WARNING ROUTES =============
router.post('/warning/analyze/:plantId', earlyWarningController.analyzeAndAlert);
router.get('/warning/alerts/:plantId', earlyWarningController.getCurrentAlerts);
router.get('/warning/risks/:plantId', earlyWarningController.getRiskAnalysis);
router.get('/warning/trends/:plantId', earlyWarningController.getTrendAnalysis);
router.get('/warning/anomalies/:plantId', earlyWarningController.getAnomalies);
router.get('/warning/recommendations/:plantId', earlyWarningController.getRecommendations);
router.post('/warning/acknowledge/:alertId', earlyWarningController.acknowledgeAlert);
router.post('/warning/configure/:plantId', earlyWarningController.configureThresholds);
router.get('/warning/dashboard/:plantId', earlyWarningController.getDashboard);

// ============= SELF LEARNING ROUTES =============
router.post('/learning/feedback', selfLearningController.collectFeedback);
router.get('/learning/analyze/:plantId', selfLearningController.analyzeHistoricalData);
router.post('/learning/improve/:modelType', selfLearningController.improveModel);
router.post('/learning/tune/:plantId', selfLearningController.autoTuneParameters);
router.get('/learning/similar/:plantId', selfLearningController.learnFromSimilarPlants);
router.get('/learning/status/:modelType?', selfLearningController.getModelStatus);
router.get('/learning/metrics', selfLearningController.getPerformanceMetrics);
router.get('/learning/insights/:plantId', selfLearningController.getLearningInsights);
router.post('/learning/trigger/:plantId', selfLearningController.triggerLearning);
router.get('/learning/feedback/:plantId', selfLearningController.getFeedbackHistory);
router.post('/learning/configure/:plantId', selfLearningController.configureLearning);

// ============= AUTOMATION ROUTES =============
router.post('/automation/setup/:plantId', automationController.setupAutomation);
router.post('/automation/start/:automationId', automationController.startAutomation);
router.post('/automation/stop/:automationId', automationController.stopAutomation);
router.get('/automation/status/:automationId', automationController.getAutomationStatus);
router.get('/automation/list', automationController.getAllAutomations);
router.put('/automation/update/:automationId', automationController.updateAutomation);
router.delete('/automation/delete/:automationId', automationController.deleteAutomation);
router.get('/automation/history/:automationId', automationController.getAutomationHistory);
router.get('/automation/statistics/:automationId', automationController.getAutomationStatistics);
router.post('/automation/manual/:plantId', automationController.manualIrrigation);
router.get('/automation/device/:plantId', automationController.checkDeviceStatus);
router.post('/automation/test/:automationId', automationController.testAutomation);
router.get('/automation/templates', automationController.getAutomationTemplates);
router.get('/automation/dashboard', automationController.getAutomationDashboard);

// ============= HISTORICAL ANALYSIS ROUTES =============
router.get('/historical/analyze/:plantId', async (req, res) => {
  try {
    const { plantId } = req.params;
    const { period = 30 } = req.query;
    
    // Mock historical analysis
    const analysis = {
      plantId,
      period: parseInt(period),
      trends: {
        soilMoisture: { trend: 'stable', change: 2.5 },
        temperature: { trend: 'increasing', change: 1.2 },
        growth: { trend: 'positive', change: 15.3 }
      },
      patterns: [
        { type: 'watering_frequency', value: 'every_2_days' },
        { type: 'optimal_time', value: '07:00-09:00' }
      ],
      recommendations: [
        'Maintain current watering schedule',
        'Consider increasing fertilizer frequency'
      ]
    };

    return res.status(200).json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Historical analysis failed',
      error: error.message
    });
  }
});

router.post('/historical/predict/:plantId', async (req, res) => {
  try {
    const { plantId } = req.params;
    const { period = 7, includeFactors = false } = req.body;
    
    // Mock trend predictions
    const predictions = {
      plantId,
      period: parseInt(period),
      forecasts: [
        { date: new Date(Date.now() + 24*60*60*1000).toISOString(), soilMoisture: 45, temperature: 24 },
        { date: new Date(Date.now() + 2*24*60*60*1000).toISOString(), soilMoisture: 42, temperature: 25 },
        { date: new Date(Date.now() + 3*24*60*60*1000).toISOString(), soilMoisture: 38, temperature: 26 }
      ],
      factors: includeFactors ? {
        weather: 'sunny_week',
        season: 'spring',
        growth_stage: 'active'
      } : null
    };

    return res.status(200).json({
      success: true,
      predictions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Trend prediction failed',
      error: error.message
    });
  }
});

// ============= INTEGRATED AI ROUTES =============
// Comprehensive plant analysis
router.post('/analyze/comprehensive/:plantId', async (req, res) => {
  try {
    const { plantId } = req.params;
    const { includeOptimization = true, includeLearning = true } = req.body;

    // Run multiple AI analyses in parallel
    const analyses = await Promise.allSettled([
      irrigationPredictionController.analyzeAndAlert({ params: { plantId }, body: {} }, { json: () => {} }),
      earlyWarningController.analyzeAndAlert({ params: { plantId }, body: {} }, { json: () => {} }),
      includeLearning ? selfLearningController.analyzeHistoricalData({ params: { plantId }, query: {} }, { json: () => {} }) : null,
      includeOptimization ? irrigationPredictionController.optimizeSchedule({ params: { plantId }, body: {} }, { json: () => {} }) : null
    ].filter(Boolean));

    const results = {
      plantId,
      timestamp: new Date().toISOString(),
      analyses: {
        irrigation: analyses[0].status === 'fulfilled' ? analyses[0].value : { error: analyses[0].reason },
        earlyWarning: analyses[1].status === 'fulfilled' ? analyses[1].value : { error: analyses[1].reason },
        learning: includeLearning && analyses[2] ? 
          (analyses[2].status === 'fulfilled' ? analyses[2].value : { error: analyses[2].reason }) : null,
        optimization: includeOptimization && analyses[3] ? 
          (analyses[3].status === 'fulfilled' ? analyses[3].value : { error: analyses[3].reason }) : null
      }
    };

    return res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Lỗi phân tích tổng hợp:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi phân tích tổng hợp',
      error: error.message
    });
  }
});

// AI Health Check
router.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      services: {
        chatbot: 'healthy',
        imageRecognition: 'healthy',
        irrigationPrediction: 'healthy',
        earlyWarning: 'healthy',
        selfLearning: 'healthy',
        automation: 'healthy'
      },
      models: {
        irrigation: { status: 'active', accuracy: 0.85, version: '1.2' },
        disease_detection: { status: 'active', accuracy: 0.82, version: '1.1' },
        growth_prediction: { status: 'active', accuracy: 0.78, version: '1.0' }
      },
      systemMetrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    return res.status(200).json({
      success: true,
      health: healthStatus
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// AI Configuration
router.get('/config', (req, res) => {
  const config = {
    version: '2.0.0',
    features: {
      chatbot: {
        enabled: true,
        model: 'mistralai/mistral-7b-instruct',
        provider: 'openrouter'
      },
      imageRecognition: {
        enabled: true,
        models: ['plant_disease_detection', 'growth_analysis']
      },
      irrigationPrediction: {
        enabled: true,
        algorithms: ['reinforcement_learning', 'genetic_algorithm', 'rule_based']
      },
      earlyWarning: {
        enabled: true,
        riskTypes: ['water_stress', 'temperature_stress', 'fungal_disease', 'nutrition_deficiency', 'root_rot']
      },
      selfLearning: {
        enabled: true,
        autoRetraining: true,
        feedbackIntegration: true
      },
      automation: {
        enabled: true,
        modes: ['smart', 'scheduled', 'sensor_based'],
        safetyLimits: {
          maxWaterPerDay: 2000,
          maxWaterPerHour: 500,
          minTimeBetweenIrrigations: 7200000
        }
      }
    },
    limits: {
      maxPlantsPerUser: 50,
      maxAutomationsPerPlant: 5,
      maxFeedbackPerDay: 100,
      maxImageAnalysisPerDay: 50
    }
  };

  return res.status(200).json({
    success: true,
    config
  });
});

// AI Statistics
router.get('/statistics', async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;

    // Mock statistics - in real implementation, would query from database
    const statistics = {
      timeRange,
      timestamp: new Date().toISOString(),
      usage: {
        totalRequests: 15420,
        chatbotMessages: 8750,
        imageAnalyses: 1230,
        irrigationPredictions: 3450,
        automationExecutions: 1990
      },
      performance: {
        averageResponseTime: 245, // ms
        successRate: 98.5, // %
        modelAccuracy: {
          irrigation: 85.2,
          disease_detection: 82.8,
          growth_prediction: 78.5
        }
      },
      learning: {
        feedbackReceived: 456,
        modelsRetrained: 3,
        accuracyImprovement: 2.3 // %
      },
      automation: {
        activeAutomations: 234,
        waterSaved: 15.6, // liters
        successfulIrrigations: 1876
      }
    };

    return res.status(200).json({
      success: true,
      statistics
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê',
      error: error.message
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('AI Routes Error:', error);
  
  return res.status(500).json({
    success: false,
    message: 'Lỗi hệ thống AI',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;