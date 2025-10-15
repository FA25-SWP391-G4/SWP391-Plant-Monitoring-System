/**
 * System Integration Startup Script
 * Initializes and verifies system integration on startup
 */

const { logger } = require('../utils/logger');
const systemIntegrationService = require('../services/systemIntegrationService');
const MqttBrokerVerifier = require('./verifyMqttBroker');

class SystemIntegrationStartup {
  constructor() {
    this.initializationSteps = [
      'verifyMqttBroker',
      'checkServiceConnectivity',
      'initializeIntegration',
      'runHealthChecks',
      'setupMonitoring'
    ];
    this.results = {
      steps: {},
      errors: [],
      warnings: [],
      overallSuccess: false
    };
  }

  /**
   * Run complete system integration startup
   */
  async initialize() {
    console.log('🚀 Starting System Integration Initialization...');
    console.log('================================================');

    try {
      for (const step of this.initializationSteps) {
        console.log(`\n📋 Step: ${step}`);
        await this[step]();
        this.results.steps[step] = true;
        console.log(`✅ ${step} completed successfully`);
      }

      this.results.overallSuccess = true;
      this.printSummary();
      return this.results;
    } catch (error) {
      console.error(`❌ Initialization failed at step: ${error.step || 'unknown'}`);
      console.error(`Error: ${error.message}`);
      this.results.errors.push(error.message);
      this.results.overallSuccess = false;
      this.printSummary();
      throw error;
    }
  }

  /**
   * Verify MQTT broker configuration
   */
  async verifyMqttBroker() {
    try {
      const verifier = new MqttBrokerVerifier();
      const results = await verifier.verify();

      if (!results.connection || !results.publish || !results.subscribe) {
        throw new Error('MQTT broker verification failed');
      }

      if (results.latency > 1000) {
        this.results.warnings.push(`High MQTT latency detected: ${results.latency}ms`);
      }

      logger.info('MQTT broker verification completed successfully');
    } catch (error) {
      error.step = 'verifyMqttBroker';
      throw error;
    }
  }

  /**
   * Check connectivity to all services
   */
  async checkServiceConnectivity() {
    try {
      const serviceStatus = await systemIntegrationService.checkServiceConnectivity();
      
      const failedServices = Object.entries(serviceStatus)
        .filter(([service, status]) => !status)
        .map(([service]) => service);

      if (failedServices.length > 0) {
        this.results.warnings.push(`Some services are not available: ${failedServices.join(', ')}`);
        logger.warn('Some services are not available:', failedServices);
      }

      if (!serviceStatus.aiService) {
        throw new Error('AI Service is not available - this is required for integration');
      }

      logger.info('Service connectivity check completed');
    } catch (error) {
      error.step = 'checkServiceConnectivity';
      throw error;
    }
  }

  /**
   * Initialize system integration
   */
  async initializeIntegration() {
    try {
      await systemIntegrationService.initializeIntegration();
      logger.info('System integration initialized successfully');
    } catch (error) {
      error.step = 'initializeIntegration';
      throw error;
    }
  }

  /**
   * Run comprehensive health checks
   */
  async runHealthChecks() {
    try {
      const testResults = await systemIntegrationService.testCrossServiceCommunication();
      
      const failedTests = Object.entries(testResults)
        .filter(([test, result]) => !result)
        .map(([test]) => test);

      if (failedTests.length > 0) {
        this.results.warnings.push(`Some integration tests failed: ${failedTests.join(', ')}`);
        logger.warn('Some integration tests failed:', failedTests);
      }

      logger.info('Health checks completed');
    } catch (error) {
      error.step = 'runHealthChecks';
      throw error;
    }
  }

  /**
   * Setup monitoring and alerting
   */
  async setupMonitoring() {
    try {
      // Setup periodic health checks
      this.setupPeriodicHealthChecks();
      
      // Setup error monitoring
      this.setupErrorMonitoring();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      logger.info('Monitoring and alerting setup completed');
    } catch (error) {
      error.step = 'setupMonitoring';
      throw error;
    }
  }

  /**
   * Setup periodic health checks
   */
  setupPeriodicHealthChecks() {
    const healthCheckInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL) || 60000; // 1 minute

    setInterval(async () => {
      try {
        const status = await systemIntegrationService.checkServiceConnectivity();
        const unhealthyServices = Object.entries(status)
          .filter(([service, healthy]) => !healthy)
          .map(([service]) => service);

        if (unhealthyServices.length > 0) {
          logger.warn('Unhealthy services detected:', unhealthyServices);
          
          // Attempt to reconnect or restart services
          await this.handleUnhealthyServices(unhealthyServices);
        }
      } catch (error) {
        logger.error('Periodic health check failed:', error);
      }
    }, healthCheckInterval);

    logger.info(`Periodic health checks scheduled every ${healthCheckInterval}ms`);
  }

  /**
   * Setup error monitoring
   */
  setupErrorMonitoring() {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      // Don't exit in production, just log
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit in production, just log
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    });

    logger.info('Error monitoring setup completed');
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      };

      // Alert if memory usage is high
      const memoryThreshold = parseInt(process.env.MEMORY_ALERT_THRESHOLD) || 512; // MB
      if (memUsageMB.heapUsed > memoryThreshold) {
        logger.warn('High memory usage detected:', memUsageMB);
      }

      logger.debug('Memory usage:', memUsageMB);
    }, 300000); // Check every 5 minutes

    logger.info('Performance monitoring setup completed');
  }

  /**
   * Handle unhealthy services
   */
  async handleUnhealthyServices(unhealthyServices) {
    for (const service of unhealthyServices) {
      logger.info(`Attempting to recover unhealthy service: ${service}`);
      
      try {
        switch (service) {
          case 'mqttBroker':
            // Attempt to reconnect MQTT
            await this.reconnectMqtt();
            break;
          case 'aiService':
            // Log AI service issue (can't restart from here)
            logger.error('AI Service is unhealthy - manual intervention required');
            break;
          case 'database':
            // Attempt database reconnection
            await this.reconnectDatabase();
            break;
          default:
            logger.warn(`No recovery procedure defined for service: ${service}`);
        }
      } catch (error) {
        logger.error(`Failed to recover service ${service}:`, error);
      }
    }
  }

  /**
   * Attempt to reconnect MQTT
   */
  async reconnectMqtt() {
    try {
      const { client } = require('../mqtt/mqttClient');
      if (client && !client.connected) {
        client.reconnect();
        logger.info('MQTT reconnection attempted');
      }
    } catch (error) {
      logger.error('MQTT reconnection failed:', error);
    }
  }

  /**
   * Attempt to reconnect database
   */
  async reconnectDatabase() {
    try {
      const { connectDB } = require('../config/db');
      await connectDB();
      logger.info('Database reconnection successful');
    } catch (error) {
      logger.error('Database reconnection failed:', error);
    }
  }

  /**
   * Print initialization summary
   */
  printSummary() {
    console.log('\n📊 System Integration Initialization Summary:');
    console.log('==============================================');

    // Steps
    console.log('\n📋 Initialization Steps:');
    Object.entries(this.results.steps).forEach(([step, success]) => {
      console.log(`  ${success ? '✅' : '❌'} ${step}`);
    });

    // Warnings
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.results.warnings.forEach(warning => {
        console.log(`  • ${warning}`);
      });
    }

    // Errors
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }

    // Overall Status
    console.log(`\n🎯 Overall Status: ${this.results.overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (this.results.overallSuccess) {
      console.log('🎉 System integration is ready!');
      console.log('\n🔗 Available Integration Endpoints:');
      console.log('  • GET  /api/ai-integration/status');
      console.log('  • POST /api/ai-integration/test');
      console.log('  • POST /api/ai-integration/chatbot/message');
      console.log('  • POST /api/ai-integration/disease/analyze');
      console.log('  • POST /api/ai-integration/irrigation/predict/:plantId');
      console.log('  • GET  /api/ai-integration/health');
    } else {
      console.log('⚠️ System integration needs attention before use.');
    }
  }

  /**
   * Get initialization results
   */
  getResults() {
    return this.results;
  }
}

// Export for use in other modules
module.exports = SystemIntegrationStartup;

// Run initialization if called directly
if (require.main === module) {
  const startup = new SystemIntegrationStartup();
  startup.initialize()
    .then(results => {
      console.log('\n✅ System integration startup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ System integration startup failed:', error.message);
      process.exit(1);
    });
}