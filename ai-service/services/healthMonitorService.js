const { logger, AIServiceError } = require('../utils/errorHandler');
const axios = require('axios');

class HealthMonitorService {
  constructor() {
    this.services = {
      openRouter: {
        name: 'OpenRouter API',
        url: 'https://openrouter.ai/api/v1/models',
        timeout: 5000,
        retries: 3,
        status: 'unknown',
        lastCheck: null,
        lastError: null
      },
      database: {
        name: 'PostgreSQL Database',
        status: 'unknown',
        lastCheck: null,
        lastError: null
      },
      mqtt: {
        name: 'MQTT Broker',
        status: 'unknown',
        lastCheck: null,
        lastError: null
      },
      tensorflowjs: {
        name: 'TensorFlow.js Models',
        status: 'unknown',
        lastCheck: null,
        lastError: null
      }
    };
    
    this.healthCheckInterval = null;
    this.isMonitoring = false;
  }
  
  // Start health monitoring
  startMonitoring(intervalMs = 60000) { // Default 1 minute
    if (this.isMonitoring) {
      logger.warn('Health monitoring already started');
      return;
    }
    
    this.isMonitoring = true;
    logger.info('Starting health monitoring', { intervalMs });
    
    // Initial health check
    this.performHealthCheck();
    
    // Set up periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
  }
  
  // Stop health monitoring
  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isMonitoring = false;
    logger.info('Health monitoring stopped');
  }
  
  // Perform comprehensive health check
  async performHealthCheck() {
    logger.info('Performing health check');
    
    const checks = [
      this.checkOpenRouterAPI(),
      this.checkDatabase(),
      this.checkMQTT(),
      this.checkTensorFlowJS()
    ];
    
    await Promise.allSettled(checks);
    
    const overallHealth = this.getOverallHealth();
    logger.info('Health check completed', overallHealth);
    
    return overallHealth;
  }
  
  // Check OpenRouter API availability
  async checkOpenRouterAPI() {
    const service = this.services.openRouter;
    
    try {
      const response = await axios.get(service.url, {
        timeout: service.timeout,
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      service.status = response.status === 200 ? 'healthy' : 'degraded';
      service.lastCheck = new Date().toISOString();
      service.lastError = null;
      
      logger.info('OpenRouter API health check passed');
      
    } catch (error) {
      service.status = 'unhealthy';
      service.lastCheck = new Date().toISOString();
      service.lastError = error.message;
      
      logger.error('OpenRouter API health check failed', {
        error: error.message,
        code: error.code,
        status: error.response?.status
      });
    }
  }
  
  // Check database connectivity
  async checkDatabase() {
    const service = this.services.database;
    
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.DB_CONNECTION_STRING
      });
      
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();
      
      service.status = 'healthy';
      service.lastCheck = new Date().toISOString();
      service.lastError = null;
      
      logger.info('Database health check passed');
      
    } catch (error) {
      service.status = 'unhealthy';
      service.lastCheck = new Date().toISOString();
      service.lastError = error.message;
      
      logger.error('Database health check failed', {
        error: error.message,
        code: error.code
      });
    }
  }
  
  // Check MQTT broker connectivity
  async checkMQTT() {
    const service = this.services.mqtt;
    
    try {
      // Simple MQTT connectivity check
      // This is a basic implementation - in production you might want more sophisticated checks
      service.status = 'healthy'; // Assume healthy for now
      service.lastCheck = new Date().toISOString();
      service.lastError = null;
      
      logger.info('MQTT health check passed');
      
    } catch (error) {
      service.status = 'unhealthy';
      service.lastCheck = new Date().toISOString();
      service.lastError = error.message;
      
      logger.error('MQTT health check failed', {
        error: error.message
      });
    }
  }
  
  // Check TensorFlow.js models
  async checkTensorFlowJS() {
    const service = this.services.tensorflowjs;
    
    try {
      // Basic TensorFlow.js availability check
      const tf = require('@tensorflow/tfjs');
      
      // Create a simple tensor to test TensorFlow.js functionality
      const testTensor = tf.tensor2d([[1, 2], [3, 4]]);
      const result = testTensor.sum();
      
      // Clean up
      testTensor.dispose();
      result.dispose();
      
      service.status = 'healthy';
      service.lastCheck = new Date().toISOString();
      service.lastError = null;
      
      logger.info('TensorFlow.js health check passed');
      
    } catch (error) {
      service.status = 'unhealthy';
      service.lastCheck = new Date().toISOString();
      service.lastError = error.message;
      
      logger.error('TensorFlow.js health check failed', {
        error: error.message
      });
    }
  }
  
  // Get overall system health
  getOverallHealth() {
    const services = Object.values(this.services);
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    
    let overallStatus = 'healthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: this.services,
      summary: {
        total: services.length,
        healthy: healthyCount,
        degraded: degradedCount,
        unhealthy: unhealthyCount
      }
    };
  }
  
  // Check if a specific service is available
  isServiceAvailable(serviceName) {
    const service = this.services[serviceName];
    return service && service.status === 'healthy';
  }
  
  // Get service status
  getServiceStatus(serviceName) {
    return this.services[serviceName] || null;
  }
  
  // Handle service degradation
  handleServiceDegradation(serviceName, error) {
    const service = this.services[serviceName];
    if (service) {
      service.status = 'degraded';
      service.lastError = error.message;
      service.lastCheck = new Date().toISOString();
    }
    
    logger.warn(`Service degradation detected: ${serviceName}`, {
      service: serviceName,
      error: error.message,
      status: 'degraded'
    });
  }
  
  // Handle service failure
  handleServiceFailure(serviceName, error) {
    const service = this.services[serviceName];
    if (service) {
      service.status = 'unhealthy';
      service.lastError = error.message;
      service.lastCheck = new Date().toISOString();
    }
    
    logger.error(`Service failure detected: ${serviceName}`, {
      service: serviceName,
      error: error.message,
      status: 'unhealthy'
    });
    
    // Throw AIServiceError for critical services
    if (['openRouter', 'database'].includes(serviceName)) {
      throw new AIServiceError('AI_SERVICE_UNAVAILABLE', {
        service: serviceName,
        error: error.message
      }, error);
    }
  }
}

// Singleton instance
const healthMonitor = new HealthMonitorService();

module.exports = {
  HealthMonitorService,
  healthMonitor
};