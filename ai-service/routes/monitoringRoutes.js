const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const analyticsService = require('../services/analyticsService');

// Get current metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    monitoringService.trackError(error, { endpoint: '/metrics' });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics'
    });
  }
});

// Get metrics in Prometheus format
router.get('/metrics/prometheus', (req, res) => {
  try {
    const prometheusMetrics = monitoringService.exportMetrics('prometheus');
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    monitoringService.trackError(error, { endpoint: '/metrics/prometheus' });
    res.status(500).send('# Error retrieving metrics');
  }
});

// Get real-time analytics
router.get('/analytics/realtime', async (req, res) => {
  try {
    const analytics = await analyticsService.getRealTimeAnalytics();
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    monitoringService.trackError(error, { endpoint: '/analytics/realtime' });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve real-time analytics'
    });
  }
});

// Export analytics data
router.get('/analytics/export', async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const data = await analyticsService.exportAnalytics(startDate, endDate, format);
    
    if (format === 'csv') {
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', `attachment; filename="analytics-${startDate}-${endDate}.csv"`);
      res.send(data);
    } else {
      res.json({
        success: true,
        data
      });
    }
  } catch (error) {
    monitoringService.trackError(error, { endpoint: '/analytics/export' });
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    const uptime = (Date.now() - metrics.system.uptime) / 1000;
    const errorRate = metrics.system.errorCount / (metrics.system.apiCalls || 1);
    
    const health = {
      status: 'healthy',
      uptime: uptime,
      errorRate: errorRate,
      services: {
        monitoring: 'operational',
        analytics: 'operational',
        logging: 'operational'
      }
    };

    // Determine overall health status
    if (errorRate > 0.1) {
      health.status = 'unhealthy';
      health.services.monitoring = 'degraded';
    } else if (errorRate > 0.05) {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    monitoringService.trackError(error, { endpoint: '/health' });
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      status: 'unhealthy'
    });
  }
});

// Reset metrics (for testing purposes)
router.post('/metrics/reset', (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Metrics reset not allowed in production'
      });
    }

    monitoringService.resetMetrics();
    res.json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    monitoringService.trackError(error, { endpoint: '/metrics/reset' });
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics'
    });
  }
});

// Submit user feedback
router.post('/feedback', (req, res) => {
  try {
    const { feature, rating, feedback, analysisId } = req.body;

    if (!feature || rating === undefined) {
      return res.status(400).json({
        success: false,
        error: 'feature and rating are required'
      });
    }

    // Track the feedback based on feature type
    switch (feature) {
      case 'chatbot':
        monitoringService.trackChatbotRequest(0, 0, true, false, rating);
        break;
      case 'disease_detection':
        if (analysisId) {
          monitoringService.trackDiseaseDetection(0, 0, 1, [], {
            isAccurate: rating >= 4,
            rating,
            feedback,
            analysisId
          });
        }
        break;
      case 'irrigation_prediction':
        monitoringService.trackIrrigationPrediction(1, {}, rating >= 4);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid feature type'
        });
    }

    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    monitoringService.trackError(error, { endpoint: '/feedback' });
    res.status(500).json({
      success: false,
      error: 'Failed to record feedback'
    });
  }
});

// Get system logs (with pagination)
router.get('/logs', async (req, res) => {
  try {
    const { level = 'info', limit = 100, offset = 0 } = req.query;
    
    // This is a simplified implementation
    // In production, you'd want to use a proper log aggregation system
    res.json({
      success: true,
      message: 'Log retrieval endpoint - implement with proper log aggregation system',
      data: {
        logs: [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: 0
        }
      }
    });
  } catch (error) {
    monitoringService.trackError(error, { endpoint: '/logs' });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve logs'
    });
  }
});

module.exports = router;