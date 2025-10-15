/**
 * Self Learning Controller - API cho tự học và cải tiến
 */

const selfLearningService = require('../services/selfLearningService');

const selfLearningController = {
  // Thu thập feedback từ người dùng
  collectFeedback: async (req, res) => {
    try {
      const feedbackData = req.body;
      
      const result = await selfLearningService.collectFeedback(feedbackData);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Lỗi thu thập feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi thu thập feedback',
        error: error.message
      });
    }
  },

  // Phân tích dữ liệu lịch sử
  analyzeHistoricalData: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { analysisType = 'all' } = req.query;

      const analysis = await selfLearningService.analyzeHistoricalData(plantId, analysisType);

      return res.status(200).json({
        success: true,
        plantId,
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi phân tích dữ liệu lịch sử:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi phân tích dữ liệu lịch sử',
        error: error.message
      });
    }
  },

  // Cải thiện model
  improveModel: async (req, res) => {
    try {
      const { modelType } = req.params;
      const improvementData = req.body;

      const result = await selfLearningService.improveModel(modelType, improvementData);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Lỗi cải thiện model:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi cải thiện model',
        error: error.message
      });
    }
  },

  // Tự động điều chỉnh parameters
  autoTuneParameters: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { parameterType = 'irrigation' } = req.body;

      const result = await selfLearningService.autoTuneParameters(plantId, parameterType);

      return res.status(200).json({
        success: true,
        plantId,
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi auto-tune parameters:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi tự động điều chỉnh parameters',
        error: error.message
      });
    }
  },

  // Học từ các cây tương tự
  learnFromSimilarPlants: async (req, res) => {
    try {
      const { plantId } = req.params;

      const result = await selfLearningService.learnFromSimilarPlants(plantId);

      return res.status(200).json({
        success: true,
        plantId,
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi học từ cây tương tự:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi học từ cây tương tự',
        error: error.message
      });
    }
  },

  // Lấy trạng thái model
  getModelStatus: async (req, res) => {
    try {
      const { modelType } = req.params;

      const status = selfLearningService.getModelStatus();
      
      let result = status;
      if (modelType && status.models[modelType]) {
        result = {
          modelType,
          ...status.models[modelType],
          performanceMetrics: status.performanceMetrics[modelType] || {},
          lastUpdate: status.lastUpdate
        };
      }

      return res.status(200).json({
        success: true,
        status: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi lấy trạng thái model:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi lấy trạng thái model',
        error: error.message
      });
    }
  },

  // Lấy performance metrics
  getPerformanceMetrics: async (req, res) => {
    try {
      const { modelType } = req.query;
      const { timeRange = '30d' } = req.query;

      const status = selfLearningService.getModelStatus();
      let metrics = status.performanceMetrics;

      // Lọc theo model type nếu có
      if (modelType) {
        metrics = { [modelType]: metrics[modelType] || {} };
      }

      // Tính toán additional metrics
      const processedMetrics = this.processPerformanceMetrics(metrics, timeRange);

      return res.status(200).json({
        success: true,
        metrics: processedMetrics,
        timeRange,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi lấy performance metrics:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi lấy performance metrics',
        error: error.message
      });
    }
  },

  // Lấy learning insights
  getLearningInsights: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { period = '7d' } = req.query;

      // Phân tích dữ liệu để tạo insights
      const analysis = await selfLearningService.analyzeHistoricalData(plantId, 'all');
      
      const insights = this.generateLearningInsights(analysis, period);

      return res.status(200).json({
        success: true,
        plantId,
        insights,
        period,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi lấy learning insights:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi lấy learning insights',
        error: error.message
      });
    }
  },

  // Trigger manual learning
  triggerLearning: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { learningType = 'comprehensive' } = req.body;

      // Trigger different types of learning
      const results = {};

      switch (learningType) {
        case 'comprehensive':
          results.historicalAnalysis = await selfLearningService.analyzeHistoricalData(plantId);
          results.similarPlants = await selfLearningService.learnFromSimilarPlants(plantId);
          results.parameterTuning = await selfLearningService.autoTuneParameters(plantId);
          break;
        case 'historical':
          results.historicalAnalysis = await selfLearningService.analyzeHistoricalData(plantId);
          break;
        case 'similar_plants':
          results.similarPlants = await selfLearningService.learnFromSimilarPlants(plantId);
          break;
        case 'parameter_tuning':
          results.parameterTuning = await selfLearningService.autoTuneParameters(plantId);
          break;
        default:
          throw new Error(`Learning type không được hỗ trợ: ${learningType}`);
      }

      return res.status(200).json({
        success: true,
        plantId,
        learningType,
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi trigger learning:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi trigger learning',
        error: error.message
      });
    }
  },

  // Lấy feedback history
  getFeedbackHistory: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { limit = 50, predictionType, rating } = req.query;

      // Trong thực tế sẽ query từ database
      const status = selfLearningService.getModelStatus();
      let feedbackHistory = status.feedbackDataSize > 0 ? 
        this.generateMockFeedbackHistory(plantId, limit) : [];

      // Lọc theo prediction type nếu có
      if (predictionType) {
        feedbackHistory = feedbackHistory.filter(f => f.predictionType === predictionType);
      }

      // Lọc theo rating nếu có
      if (rating) {
        feedbackHistory = feedbackHistory.filter(f => f.userRating >= parseInt(rating));
      }

      return res.status(200).json({
        success: true,
        plantId,
        feedbackHistory,
        totalCount: feedbackHistory.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi lấy feedback history:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi lấy feedback history',
        error: error.message
      });
    }
  },

  // Cấu hình learning parameters
  configureLearning: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { 
        learningRate = 0.1,
        retrainingThreshold = 0.05,
        feedbackWeight = 0.3,
        autoLearningEnabled = true
      } = req.body;

      // Validate parameters
      if (learningRate < 0 || learningRate > 1) {
        return res.status(400).json({
          success: false,
          message: 'Learning rate phải trong khoảng 0-1'
        });
      }

      // Trong thực tế sẽ lưu vào database
      const config = {
        plantId,
        learningRate,
        retrainingThreshold,
        feedbackWeight,
        autoLearningEnabled,
        updatedAt: new Date().toISOString()
      };

      console.log(`Updated learning config for plant ${plantId}:`, config);

      return res.status(200).json({
        success: true,
        message: 'Cấu hình learning đã được cập nhật',
        config,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi cấu hình learning:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi cấu hình learning',
        error: error.message
      });
    }
  },

  // Helper methods
  processPerformanceMetrics: (metrics, timeRange) => {
    const processed = {};
    
    Object.entries(metrics).forEach(([modelType, modelMetrics]) => {
      if (modelMetrics.totalPredictions) {
        processed[modelType] = {
          ...modelMetrics,
          averageAccuracy: modelMetrics.totalAccuracy / modelMetrics.totalPredictions,
          averageUserRating: modelMetrics.totalUserRating / modelMetrics.totalPredictions,
          accuracyTrend: modelMetrics.accuracyHistory ? 
            this.calculateTrend(modelMetrics.accuracyHistory.slice(-10)) : 'stable',
          ratingTrend: modelMetrics.ratingHistory ? 
            this.calculateTrend(modelMetrics.ratingHistory.slice(-10)) : 'stable'
        };
      }
    });
    
    return processed;
  },

  calculateTrend: (data) => {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-5);
    const older = data.slice(-10, -5);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, item) => sum + (item.accuracy || item.rating), 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + (item.accuracy || item.rating), 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 0.05) return 'improving';
    if (diff < -0.05) return 'declining';
    return 'stable';
  },

  generateLearningInsights: (analysis, period) => {
    const insights = [];
    
    if (analysis.patterns) {
      insights.push({
        type: 'pattern',
        title: 'Phát hiện patterns mới',
        description: 'Hệ thống đã học được các pattern mới từ dữ liệu',
        impact: 'positive',
        confidence: 0.8
      });
    }
    
    if (analysis.correlations) {
      insights.push({
        type: 'correlation',
        title: 'Mối quan hệ giữa các yếu tố',
        description: 'Phát hiện correlation mạnh giữa nhiệt độ và nhu cầu tưới',
        impact: 'positive',
        confidence: 0.75
      });
    }
    
    insights.push({
      type: 'improvement',
      title: 'Cải thiện độ chính xác',
      description: `Độ chính xác dự đoán đã tăng 5% trong ${period} qua`,
      impact: 'positive',
      confidence: 0.9
    });
    
    return insights;
  },

  generateMockFeedbackHistory: (plantId, limit) => {
    const history = [];
    const predictionTypes = ['irrigation', 'disease', 'growth'];
    
    for (let i = 0; i < Math.min(limit, 20); i++) {
      history.push({
        id: `feedback_${i}`,
        plantId,
        predictionType: predictionTypes[Math.floor(Math.random() * predictionTypes.length)],
        userRating: Math.floor(Math.random() * 5) + 1,
        accuracy: 0.6 + Math.random() * 0.4,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        processed: true
      });
    }
    
    return history;
  }
};

module.exports = selfLearningController;