const monitoringService = require('./monitoringService');
const fs = require('fs').promises;
const path = require('path');

class AnalyticsService {
  constructor() {
    this.reportingInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.reportsDir = path.join(__dirname, '../reports');
    this.startPeriodicReporting();
    this.ensureReportsDirectory();
  }

  async ensureReportsDirectory() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create reports directory:', error);
    }
  }

  startPeriodicReporting() {
    // Generate daily reports
    setInterval(() => {
      this.generateDailyReport();
    }, this.reportingInterval);

    // Generate weekly reports on Sundays
    const now = new Date();
    const msUntilSunday = (7 - now.getDay()) * 24 * 60 * 60 * 1000;
    setTimeout(() => {
      this.generateWeeklyReport();
      setInterval(() => {
        this.generateWeeklyReport();
      }, 7 * 24 * 60 * 60 * 1000);
    }, msUntilSunday);
  }

  async generateDailyReport() {
    try {
      const metrics = monitoringService.getMetrics();
      const report = this.createDailyReport(metrics);
      
      const filename = `daily-report-${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(this.reportsDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      
      monitoringService.logger.info('Daily report generated', {
        filename,
        reportSummary: report.summary
      });
    } catch (error) {
      monitoringService.trackError(error, { context: 'daily_report_generation' });
    }
  }

  async generateWeeklyReport() {
    try {
      const metrics = monitoringService.getMetrics();
      const report = this.createWeeklyReport(metrics);
      
      const filename = `weekly-report-${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(this.reportsDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      
      monitoringService.logger.info('Weekly report generated', {
        filename,
        reportSummary: report.summary
      });
    } catch (error) {
      monitoringService.trackError(error, { context: 'weekly_report_generation' });
    }
  }

  createDailyReport(metrics) {
    const report = {
      reportType: 'daily',
      generatedAt: new Date().toISOString(),
      period: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      summary: {
        totalChatbotRequests: metrics.chatbot.totalRequests,
        totalDiseaseAnalyses: metrics.diseaseDetection.totalAnalyses,
        totalIrrigationPredictions: metrics.irrigationPrediction.totalPredictions,
        systemUptime: (Date.now() - metrics.system.uptime) / (1000 * 60 * 60), // hours
        errorRate: metrics.system.errorCount / (metrics.system.apiCalls || 1)
      },
      performance: {
        chatbot: {
          averageResponseTime: metrics.chatbot.averageResponseTime,
          satisfactionRate: metrics.derivedMetrics.chatbotSatisfactionRate,
          plantTopicCoverage: metrics.derivedMetrics.plantTopicCoverageRate,
          fallbackRate: metrics.chatbot.fallbackRate
        },
        diseaseDetection: {
          averageProcessingTime: metrics.diseaseDetection.averageProcessingTime,
          accuracy: metrics.derivedMetrics.diseaseDetectionAccuracy,
          averageConfidence: this.calculateAverage(metrics.diseaseDetection.confidenceDistribution)
        },
        irrigationPrediction: {
          accuracy: metrics.derivedMetrics.irrigationPredictionAccuracy,
          userAdoptionRate: metrics.irrigationPrediction.userAdoptionRate,
          waterSavingsEstimate: metrics.irrigationPrediction.waterSavingsEstimate
        }
      },
      insights: this.generateInsights(metrics),
      recommendations: this.generateRecommendations(metrics)
    };

    return report;
  }

  createWeeklyReport(metrics) {
    const dailyReport = this.createDailyReport(metrics);
    
    return {
      ...dailyReport,
      reportType: 'weekly',
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      trends: this.analyzeTrends(metrics),
      topDiseases: this.getTopDiseases(metrics.diseaseDetection.diseaseFrequency),
      userBehaviorAnalysis: this.analyzeUserBehavior(metrics)
    };
  }

  generateInsights(metrics) {
    const insights = [];

    // Chatbot insights
    if (metrics.chatbot.fallbackRate > 0.2) {
      insights.push({
        type: 'warning',
        category: 'chatbot',
        message: `High fallback rate (${(metrics.chatbot.fallbackRate * 100).toFixed(1)}%). Consider improving AI model or expanding knowledge base.`
      });
    }

    if (metrics.derivedMetrics.chatbotSatisfactionRate < 0.7) {
      insights.push({
        type: 'warning',
        category: 'chatbot',
        message: `Low user satisfaction rate (${(metrics.derivedMetrics.chatbotSatisfactionRate * 100).toFixed(1)}%). Review response quality.`
      });
    }

    // Disease detection insights
    if (metrics.derivedMetrics.diseaseDetectionAccuracy < 0.8) {
      insights.push({
        type: 'warning',
        category: 'disease_detection',
        message: `Disease detection accuracy below 80% (${(metrics.derivedMetrics.diseaseDetectionAccuracy * 100).toFixed(1)}%). Model retraining may be needed.`
      });
    }

    const avgConfidence = this.calculateAverage(metrics.diseaseDetection.confidenceDistribution);
    if (avgConfidence < 0.7) {
      insights.push({
        type: 'info',
        category: 'disease_detection',
        message: `Average confidence is ${(avgConfidence * 100).toFixed(1)}%. Consider improving image quality guidelines.`
      });
    }

    // Irrigation prediction insights
    if (metrics.irrigationPrediction.userAdoptionRate < 0.5) {
      insights.push({
        type: 'warning',
        category: 'irrigation_prediction',
        message: `Low user adoption rate (${(metrics.irrigationPrediction.userAdoptionRate * 100).toFixed(1)}%). Review prediction accuracy and user experience.`
      });
    }

    // System insights
    const errorRate = metrics.system.errorCount / (metrics.system.apiCalls || 1);
    if (errorRate > 0.05) {
      insights.push({
        type: 'critical',
        category: 'system',
        message: `High error rate (${(errorRate * 100).toFixed(2)}%). Immediate attention required.`
      });
    }

    return insights;
  }

  generateRecommendations(metrics) {
    const recommendations = [];

    // Performance recommendations
    if (metrics.chatbot.averageResponseTime > 3000) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        action: 'Optimize chatbot response time',
        details: 'Current average response time exceeds 3 seconds. Consider caching, model optimization, or infrastructure scaling.'
      });
    }

    if (metrics.diseaseDetection.averageProcessingTime > 10000) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        action: 'Optimize image processing pipeline',
        details: 'Disease detection processing time is high. Consider model quantization or GPU acceleration.'
      });
    }

    // Accuracy recommendations
    if (metrics.derivedMetrics.diseaseDetectionAccuracy < 0.85) {
      recommendations.push({
        priority: 'high',
        category: 'accuracy',
        action: 'Improve disease detection model',
        details: 'Collect more training data, especially for underperforming disease categories.'
      });
    }

    // User experience recommendations
    if (metrics.derivedMetrics.plantTopicCoverageRate < 0.9) {
      recommendations.push({
        priority: 'medium',
        category: 'user_experience',
        action: 'Improve content filtering',
        details: 'Users are asking non-plant questions. Enhance scope detection and user guidance.'
      });
    }

    return recommendations;
  }

  analyzeTrends(metrics) {
    // This would typically compare with historical data
    // For now, we'll provide basic trend analysis
    return {
      chatbotUsage: 'stable', // Would be calculated from historical data
      diseaseDetectionUsage: 'increasing',
      irrigationPredictionUsage: 'stable',
      overallSystemHealth: metrics.system.errorCount < 10 ? 'good' : 'needs_attention'
    };
  }

  getTopDiseases(diseaseFrequency) {
    return Object.entries(diseaseFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([disease, count]) => ({ disease, count }));
  }

  analyzeUserBehavior(metrics) {
    return {
      chatbotEngagement: {
        averageSessionLength: 'N/A', // Would need session tracking
        repeatUsers: 'N/A', // Would need user tracking
        peakUsageHours: 'N/A' // Would need time-based analysis
      },
      featureAdoption: {
        chatbot: metrics.chatbot.totalRequests > 0,
        diseaseDetection: metrics.diseaseDetection.totalAnalyses > 0,
        irrigationPrediction: metrics.irrigationPrediction.totalPredictions > 0
      },
      userSatisfaction: {
        chatbot: metrics.derivedMetrics.chatbotSatisfactionRate,
        diseaseDetection: metrics.derivedMetrics.diseaseDetectionAccuracy,
        irrigationPrediction: metrics.irrigationPrediction.userAdoptionRate
      }
    };
  }

  calculateAverage(array) {
    if (!array || array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
  }

  // API methods for real-time analytics
  async getRealTimeAnalytics() {
    const metrics = monitoringService.getMetrics();
    
    return {
      timestamp: new Date().toISOString(),
      realTimeMetrics: {
        activeUsers: 'N/A', // Would need session tracking
        currentLoad: {
          chatbotRequests: metrics.chatbot.totalRequests,
          diseaseAnalyses: metrics.diseaseDetection.totalAnalyses,
          irrigationPredictions: metrics.irrigationPrediction.totalPredictions
        },
        systemHealth: {
          uptime: (Date.now() - metrics.system.uptime) / (1000 * 60 * 60),
          errorRate: metrics.system.errorCount / (metrics.system.apiCalls || 1),
          responseTime: {
            chatbot: metrics.chatbot.averageResponseTime,
            diseaseDetection: metrics.diseaseDetection.averageProcessingTime
          }
        }
      },
      alerts: this.generateRealTimeAlerts(metrics)
    };
  }

  generateRealTimeAlerts(metrics) {
    const alerts = [];

    // High response time alert
    if (metrics.chatbot.averageResponseTime > 5000) {
      alerts.push({
        level: 'warning',
        message: 'Chatbot response time is high',
        value: metrics.chatbot.averageResponseTime,
        threshold: 5000
      });
    }

    // High error rate alert
    const errorRate = metrics.system.errorCount / (metrics.system.apiCalls || 1);
    if (errorRate > 0.1) {
      alerts.push({
        level: 'critical',
        message: 'System error rate is high',
        value: errorRate,
        threshold: 0.1
      });
    }

    return alerts;
  }

  // Export analytics data
  async exportAnalytics(startDate, endDate, format = 'json') {
    try {
      const files = await fs.readdir(this.reportsDir);
      const reportFiles = files.filter(file => 
        file.includes('report') && 
        file.endsWith('.json')
      );

      const reports = [];
      for (const file of reportFiles) {
        const content = await fs.readFile(path.join(this.reportsDir, file), 'utf8');
        const report = JSON.parse(content);
        
        const reportDate = new Date(report.generatedAt);
        if (reportDate >= new Date(startDate) && reportDate <= new Date(endDate)) {
          reports.push(report);
        }
      }

      if (format === 'csv') {
        return this.convertToCSV(reports);
      }

      return reports;
    } catch (error) {
      monitoringService.trackError(error, { context: 'analytics_export' });
      throw error;
    }
  }

  convertToCSV(reports) {
    if (reports.length === 0) return '';

    const headers = [
      'Date',
      'Chatbot Requests',
      'Disease Analyses',
      'Irrigation Predictions',
      'Chatbot Response Time',
      'Disease Processing Time',
      'Chatbot Satisfaction',
      'Disease Accuracy',
      'Irrigation Accuracy'
    ];

    const rows = reports.map(report => [
      report.generatedAt.split('T')[0],
      report.summary.totalChatbotRequests,
      report.summary.totalDiseaseAnalyses,
      report.summary.totalIrrigationPredictions,
      report.performance.chatbot.averageResponseTime,
      report.performance.diseaseDetection.averageProcessingTime,
      report.performance.chatbot.satisfactionRate,
      report.performance.diseaseDetection.accuracy,
      report.performance.irrigationPrediction.accuracy
    ]);

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
}

module.exports = new AnalyticsService();