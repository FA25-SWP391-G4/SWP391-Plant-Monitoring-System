const { logger } = require('../utils/errorHandler');
const { redisCacheService } = require('./redisCacheService');
const { modelOptimizationService } = require('./modelOptimizationService');
const { databaseOptimizationService } = require('./databaseOptimizationService');

/**
 * Performance Monitoring Service
 * Monitors and optimizes system performance across all AI components
 */
class PerformanceMonitorService {
  constructor() {
    this.metrics = {
      requests: new Map(),
      responses: new Map(),
      errors: new Map(),
      cache: new Map(),
      models: new Map(),
      database: new Map()
    };
    
    this.performanceThresholds = {
      responseTime: {
        chatbot: 3000,      // 3 seconds
        diseaseDetection: 10000, // 10 seconds
        irrigationPrediction: 5000, // 5 seconds
        imageProcessing: 15000  // 15 seconds
      },
      cacheHitRate: 0.7,    // 70%
      errorRate: 0.05,      // 5%
      memoryUsage: 0.8,     // 80%
      cpuUsage: 0.8         // 80%
    };
    
    this.monitoringInterval = null;
    this.alertCallbacks = [];
    this.performanceHistory = [];
    this.maxHistorySize = 1000;
    
    this.startMonitoring();
  }

  /**
   * Record request metrics
   */
  recordRequest(endpoint, method = 'POST') {
    const key = `${method}:${endpoint}`;
    const now = Date.now();
    
    if (!this.metrics.requests.has(key)) {
      this.metrics.requests.set(key, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        lastRequest: now,
        errors: 0
      });
    }
    
    const metric = this.metrics.requests.get(key);
    metric.count++;
    metric.lastRequest = now;
    
    return {
      startTime: now,
      endpoint: key
    };
  }

  /**
   * Record response metrics
   */
  recordResponse(requestData, statusCode = 200, error = null) {
    const duration = Date.now() - requestData.startTime;
    const metric = this.metrics.requests.get(requestData.endpoint);
    
    if (metric) {
      metric.totalTime += duration;
      metric.avgTime = metric.totalTime / metric.count;
      metric.minTime = Math.min(metric.minTime, duration);
      metric.maxTime = Math.max(metric.maxTime, duration);
      
      if (statusCode >= 400 || error) {
        metric.errors++;
      }
    }
    
    // Check performance thresholds
    this.checkPerformanceThresholds(requestData.endpoint, duration, statusCode);
    
    // Log slow requests
    if (duration > 5000) {
      logger.warn('Slow request detected', {
        endpoint: requestData.endpoint,
        duration: `${duration}ms`,
        statusCode
      });
    }
  }

  /**
   * Record cache metrics
   */
  recordCacheOperation(operation, cacheType, hit = false) {
    const key = `${cacheType}:${operation}`;
    
    if (!this.metrics.cache.has(key)) {
      this.metrics.cache.set(key, {
        hits: 0,
        misses: 0,
        operations: 0,
        hitRate: 0
      });
    }
    
    const metric = this.metrics.cache.get(key);
    metric.operations++;
    
    if (hit) {
      metric.hits++;
    } else {
      metric.misses++;
    }
    
    metric.hitRate = metric.hits / metric.operations;
  }

  /**
   * Record model performance metrics
   */
  recordModelPerformance(modelName, operation, duration, accuracy = null) {
    const key = `${modelName}:${operation}`;
    
    if (!this.metrics.models.has(key)) {
      this.metrics.models.set(key, {
        operations: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        accuracySum: 0,
        avgAccuracy: 0
      });
    }
    
    const metric = this.metrics.models.get(key);
    metric.operations++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.operations;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    
    if (accuracy !== null) {
      metric.accuracySum += accuracy;
      metric.avgAccuracy = metric.accuracySum / metric.operations;
    }
  }

  /**
   * Record database performance metrics
   */
  recordDatabaseOperation(operation, duration, rowsAffected = 0) {
    const key = operation;
    
    if (!this.metrics.database.has(key)) {
      this.metrics.database.set(key, {
        operations: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        totalRows: 0,
        avgRows: 0
      });
    }
    
    const metric = this.metrics.database.get(key);
    metric.operations++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.operations;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.totalRows += rowsAffected;
    metric.avgRows = metric.totalRows / metric.operations;
  }

  /**
   * Check performance thresholds and trigger alerts
   */
  checkPerformanceThresholds(endpoint, duration, statusCode) {
    const endpointType = this.getEndpointType(endpoint);
    const threshold = this.performanceThresholds.responseTime[endpointType];
    
    if (threshold && duration > threshold) {
      this.triggerAlert('response_time', {
        endpoint,
        duration,
        threshold,
        severity: duration > threshold * 2 ? 'high' : 'medium'
      });
    }
    
    if (statusCode >= 500) {
      this.triggerAlert('server_error', {
        endpoint,
        statusCode,
        severity: 'high'
      });
    }
  }

  /**
   * Get endpoint type for threshold checking
   */
  getEndpointType(endpoint) {
    if (endpoint.includes('chatbot')) return 'chatbot';
    if (endpoint.includes('disease')) return 'diseaseDetection';
    if (endpoint.includes('irrigation')) return 'irrigationPrediction';
    if (endpoint.includes('image')) return 'imageProcessing';
    return 'chatbot'; // default
  }

  /**
   * Trigger performance alert
   */
  triggerAlert(type, data) {
    const alert = {
      type,
      timestamp: new Date().toISOString(),
      data,
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    logger.warn('Performance alert triggered', alert);
    
    // Call registered alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        logger.error('Alert callback error:', error);
      }
    });
    
    // Store alert in cache for dashboard
    redisCacheService.set('modelPredictions', `alert:${alert.id}`, alert, 3600);
  }

  /**
   * Register alert callback
   */
  onAlert(callback) {
    this.alertCallbacks.push(callback);
  }

  /**
   * Get comprehensive performance report
   */
  async getPerformanceReport() {
    const systemMetrics = await this.getSystemMetrics();
    const cacheStats = await redisCacheService.getStats();
    const modelStats = modelOptimizationService.getModelStats();
    const dbStats = await databaseOptimizationService.getDatabaseStats();
    
    return {
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      requests: this.getRequestMetrics(),
      cache: {
        stats: cacheStats,
        metrics: this.getCacheMetrics()
      },
      models: {
        stats: modelStats,
        metrics: this.getModelMetrics()
      },
      database: {
        stats: dbStats,
        metrics: this.getDatabaseMetrics()
      },
      alerts: await this.getRecentAlerts(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Get system metrics (CPU, memory, etc.)
   */
  async getSystemMetrics() {
    const process = require('process');
    const os = require('os');
    
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        usage: memUsage.heapUsed / memUsage.heapTotal
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        cores: os.cpus().length,
        loadAvg: os.loadavg()
      },
      uptime: process.uptime(),
      platform: os.platform(),
      nodeVersion: process.version
    };
  }

  /**
   * Get request metrics summary
   */
  getRequestMetrics() {
    const summary = {
      totalRequests: 0,
      totalErrors: 0,
      avgResponseTime: 0,
      endpoints: {}
    };
    
    for (const [endpoint, metric] of this.metrics.requests.entries()) {
      summary.totalRequests += metric.count;
      summary.totalErrors += metric.errors;
      summary.endpoints[endpoint] = {
        ...metric,
        errorRate: metric.errors / metric.count
      };
    }
    
    summary.errorRate = summary.totalErrors / summary.totalRequests || 0;
    
    return summary;
  }

  /**
   * Get cache metrics summary
   */
  getCacheMetrics() {
    const summary = {
      totalOperations: 0,
      totalHits: 0,
      totalMisses: 0,
      overallHitRate: 0,
      cacheTypes: {}
    };
    
    for (const [key, metric] of this.metrics.cache.entries()) {
      summary.totalOperations += metric.operations;
      summary.totalHits += metric.hits;
      summary.totalMisses += metric.misses;
      summary.cacheTypes[key] = metric;
    }
    
    summary.overallHitRate = summary.totalHits / summary.totalOperations || 0;
    
    return summary;
  }

  /**
   * Get model metrics summary
   */
  getModelMetrics() {
    const summary = {
      totalOperations: 0,
      avgResponseTime: 0,
      models: {}
    };
    
    let totalTime = 0;
    
    for (const [key, metric] of this.metrics.models.entries()) {
      summary.totalOperations += metric.operations;
      totalTime += metric.totalTime;
      summary.models[key] = metric;
    }
    
    summary.avgResponseTime = totalTime / summary.totalOperations || 0;
    
    return summary;
  }

  /**
   * Get database metrics summary
   */
  getDatabaseMetrics() {
    const summary = {
      totalOperations: 0,
      avgResponseTime: 0,
      operations: {}
    };
    
    let totalTime = 0;
    
    for (const [key, metric] of this.metrics.database.entries()) {
      summary.totalOperations += metric.operations;
      totalTime += metric.totalTime;
      summary.operations[key] = metric;
    }
    
    summary.avgResponseTime = totalTime / summary.totalOperations || 0;
    
    return summary;
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit = 10) {
    // This would typically query from cache or database
    // For now, return empty array
    return [];
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Check cache hit rates
    const cacheMetrics = this.getCacheMetrics();
    if (cacheMetrics.overallHitRate < this.performanceThresholds.cacheHitRate) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        message: `Cache hit rate is ${(cacheMetrics.overallHitRate * 100).toFixed(1)}%, consider increasing cache TTL or warming strategies`
      });
    }
    
    // Check error rates
    const requestMetrics = this.getRequestMetrics();
    if (requestMetrics.errorRate > this.performanceThresholds.errorRate) {
      recommendations.push({
        type: 'errors',
        priority: 'high',
        message: `Error rate is ${(requestMetrics.errorRate * 100).toFixed(1)}%, investigate failing endpoints`
      });
    }
    
    // Check slow endpoints
    for (const [endpoint, metric] of Object.entries(requestMetrics.endpoints)) {
      const endpointType = this.getEndpointType(endpoint);
      const threshold = this.performanceThresholds.responseTime[endpointType];
      
      if (metric.avgTime > threshold) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: `Endpoint ${endpoint} avg response time is ${metric.avgTime}ms, consider optimization`
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.monitoringInterval) {
      return;
    }
    
    this.monitoringInterval = setInterval(async () => {
      try {
        const report = await this.getPerformanceReport();
        
        // Store performance snapshot
        this.performanceHistory.push({
          timestamp: Date.now(),
          summary: {
            requests: report.requests.totalRequests,
            errors: report.requests.totalErrors,
            cacheHitRate: report.cache.metrics.overallHitRate,
            avgResponseTime: report.requests.avgResponseTime,
            memoryUsage: report.system.memory.usage
          }
        });
        
        // Limit history size
        if (this.performanceHistory.length > this.maxHistorySize) {
          this.performanceHistory.shift();
        }
        
        // Cache current performance data
        await redisCacheService.set('modelPredictions', 'performance:current', report, 300);
        
      } catch (error) {
        logger.error('Performance monitoring error:', error);
      }
    }, 60000); // Every minute
    
    logger.info('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Performance monitoring stopped');
    }
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(hours = 24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.performanceHistory.filter(entry => entry.timestamp > cutoff);
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics.requests.clear();
    this.metrics.responses.clear();
    this.metrics.errors.clear();
    this.metrics.cache.clear();
    this.metrics.models.clear();
    this.metrics.database.clear();
    this.performanceHistory = [];
    
    logger.info('Performance metrics reset');
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    this.stopMonitoring();
    this.alertCallbacks = [];
    logger.info('Performance monitor service shutdown completed');
  }
}

// Singleton instance
const performanceMonitorService = new PerformanceMonitorService();

module.exports = {
  performanceMonitorService,
  PerformanceMonitorService
};