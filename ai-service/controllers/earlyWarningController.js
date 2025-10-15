/**
 * Early Warning Controller - API cho cảnh báo sớm
 */

const earlyWarningService = require('../services/earlyWarningService');

const earlyWarningController = {
  // Phân tích và tạo cảnh báo sớm
  analyzeAndAlert: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { options = {} } = req.body;

      const warningAnalysis = await earlyWarningService.analyzeAndAlert(plantId, options);

      return res.status(200).json({
        success: true,
        plantId,
        analysis: warningAnalysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi phân tích cảnh báo sớm:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi phân tích cảnh báo sớm',
        error: error.message
      });
    }
  },

  // Lấy danh sách cảnh báo hiện tại
  getCurrentAlerts: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { severity, category, limit = 20 } = req.query;

      // Lấy cảnh báo từ service
      const analysis = await earlyWarningService.analyzeAndAlert(plantId);
      let alerts = analysis.alerts || [];

      // Lọc theo severity nếu có
      if (severity) {
        alerts = alerts.filter(alert => alert.severity === severity);
      }

      // Lọc theo category nếu có
      if (category) {
        alerts = alerts.filter(alert => alert.category === category);
      }

      // Giới hạn số lượng
      alerts = alerts.slice(0, parseInt(limit));

      return res.status(200).json({
        success: true,
        plantId,
        alerts,
        totalCount: alerts.length,
        overallRiskLevel: analysis.overallRiskLevel,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi lấy cảnh báo hiện tại:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi lấy cảnh báo',
        error: error.message
      });
    }
  },

  // Lấy phân tích rủi ro chi tiết
  getRiskAnalysis: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { riskType } = req.query;

      const analysis = await earlyWarningService.analyzeAndAlert(plantId);
      let riskAnalysis = analysis.riskAnalysis || [];

      // Lọc theo loại rủi ro nếu có
      if (riskType) {
        riskAnalysis = riskAnalysis.filter(risk => risk.type === riskType);
      }

      return res.status(200).json({
        success: true,
        plantId,
        riskAnalysis,
        overallRiskLevel: analysis.overallRiskLevel,
        healthScore: analysis.healthScore,
        recommendations: analysis.recommendations,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi phân tích rủi ro:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi phân tích rủi ro',
        error: error.message
      });
    }
  },

  // Lấy phân tích xu hướng
  getTrendAnalysis: async (req, res) => {
    try {
      const { plantId } = req.params;

      const analysis = await earlyWarningService.analyzeAndAlert(plantId);
      const trends = analysis.trends || {};

      return res.status(200).json({
        success: true,
        plantId,
        trends,
        interpretation: earlyWarningController.interpretTrends(trends),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi phân tích xu hướng:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi phân tích xu hướng',
        error: error.message
      });
    }
  },

  // Lấy phát hiện bất thường
  getAnomalies: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { severity, parameter } = req.query;

      const analysis = await earlyWarningService.analyzeAndAlert(plantId);
      let anomalies = analysis.anomalies || [];

      // Lọc theo severity nếu có
      if (severity) {
        anomalies = anomalies.filter(anomaly => anomaly.severity === severity);
      }

      // Lọc theo parameter nếu có
      if (parameter) {
        anomalies = anomalies.filter(anomaly => anomaly.parameter === parameter);
      }

      return res.status(200).json({
        success: true,
        plantId,
        anomalies,
        totalCount: anomalies.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi lấy bất thường:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi lấy bất thường',
        error: error.message
      });
    }
  },

  // Lấy khuyến nghị dựa trên cảnh báo
  getRecommendations: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { priority, category } = req.query;

      const analysis = await earlyWarningService.analyzeAndAlert(plantId);
      let recommendations = analysis.recommendations || [];

      // Lọc theo priority nếu có
      if (priority) {
        recommendations = recommendations.filter(rec => rec.priority === priority);
      }

      // Lọc theo category nếu có
      if (category) {
        recommendations = recommendations.filter(rec => rec.category === category);
      }

      return res.status(200).json({
        success: true,
        plantId,
        recommendations,
        totalCount: recommendations.length,
        nextCheckTime: analysis.nextCheckTime,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi lấy khuyến nghị:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi lấy khuyến nghị',
        error: error.message
      });
    }
  },

  // Đánh dấu cảnh báo đã xem/xử lý
  acknowledgeAlert: async (req, res) => {
    try {
      const { alertId } = req.params;
      const { userId, notes } = req.body;

      // Trong thực tế sẽ cập nhật database
      console.log(`Alert ${alertId} acknowledged by user ${userId}`);
      if (notes) {
        console.log(`Notes: ${notes}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Cảnh báo đã được đánh dấu đã xem',
        alertId,
        acknowledgedBy: userId,
        acknowledgedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi acknowledge alert:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi đánh dấu cảnh báo',
        error: error.message
      });
    }
  },

  // Cấu hình ngưỡng cảnh báo
  configureThresholds: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { thresholds } = req.body;

      // Validate thresholds
      const validatedThresholds = earlyWarningController.validateThresholds(thresholds);
      if (!validatedThresholds.valid) {
        return res.status(400).json({
          success: false,
          message: 'Ngưỡng cảnh báo không hợp lệ',
          errors: validatedThresholds.errors
        });
      }

      // Trong thực tế sẽ lưu vào database
      console.log(`Updated thresholds for plant ${plantId}:`, thresholds);

      return res.status(200).json({
        success: true,
        message: 'Ngưỡng cảnh báo đã được cập nhật',
        plantId,
        thresholds,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi cấu hình ngưỡng:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi cấu hình ngưỡng',
        error: error.message
      });
    }
  },

  // Lấy dashboard tổng quan cảnh báo
  getDashboard: async (req, res) => {
    try {
      const { plantId } = req.params;

      const analysis = await earlyWarningService.analyzeAndAlert(plantId);

      // Tạo dashboard data
      const dashboard = {
        overallStatus: {
          riskLevel: analysis.overallRiskLevel,
          healthScore: analysis.healthScore,
          totalAlerts: analysis.alerts.length,
          criticalAlerts: analysis.alerts.filter(a => a.severity === 'critical').length,
          highAlerts: analysis.alerts.filter(a => a.severity === 'high').length
        },
        alertsByCategory: earlyWarningController.groupAlertsByCategory(analysis.alerts),
        riskFactors: analysis.riskAnalysis.map(risk => ({
          type: risk.type,
          level: risk.level,
          severity: risk.severity,
          description: risk.description
        })),
        recentAnomalies: analysis.anomalies.slice(0, 5),
        topRecommendations: analysis.recommendations.slice(0, 3),
        nextCheckTime: analysis.nextCheckTime
      };

      return res.status(200).json({
        success: true,
        plantId,
        dashboard,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi lấy dashboard:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi lấy dashboard',
        error: error.message
      });
    }
  },

  // Helper methods
  interpretTrends: (trends) => {
    const interpretations = {};
    
    Object.entries(trends).forEach(([parameter, trend]) => {
      if (trend.direction && trend.confidence) {
        interpretations[parameter] = {
          direction: trend.direction,
          confidence: trend.confidence,
          interpretation: trend.interpretation,
          concernLevel: trend.direction === 'decreasing' && parameter === 'soilMoisture' ? 'high' : 'low'
        };
      }
    });
    
    return interpretations;
  },

  validateThresholds: (thresholds) => {
    const errors = [];
    
    if (!thresholds || typeof thresholds !== 'object') {
      errors.push('Thresholds phải là object');
      return { valid: false, errors };
    }

    // Validate individual thresholds
    const requiredFields = ['soilMoisture', 'temperature', 'humidity'];
    requiredFields.forEach(field => {
      if (thresholds[field]) {
        const threshold = thresholds[field];
        if (!threshold.min || !threshold.max || threshold.min >= threshold.max) {
          errors.push(`${field} threshold không hợp lệ`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  },

  groupAlertsByCategory: (alerts) => {
    const grouped = {};
    
    alerts.forEach(alert => {
      const category = alert.category || 'other';
      if (!grouped[category]) {
        grouped[category] = {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        };
      }
      
      grouped[category].total++;
      grouped[category][alert.severity]++;
    });
    
    return grouped;
  }
};

module.exports = earlyWarningController;