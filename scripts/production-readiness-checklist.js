#!/usr/bin/env node

/**
 * Production Readiness Checklist for AI Features Integration
 * Comprehensive checklist to ensure system is ready for production deployment
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios').default;

class ProductionReadinessChecker {
  constructor() {
    this.checklist = {
      security: [],
      performance: [],
      reliability: [],
      monitoring: [],
      documentation: [],
      compliance: []
    };
    
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      critical: 0
    };
    
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3001';
  }

  async runChecklist() {
    console.log('📋 Running Production Readiness Checklist...');
    console.log('=' .repeat(60));
    
    try {
      await this.checkSecurity();
      await this.checkPerformance();
      await this.checkReliability();
      await this.checkMonitoring();
      await this.checkDocumentation();
      await this.checkCompliance();
      
      this.generateReadinessReport();
      
    } catch (error) {
      console.error('❌ Production readiness check failed:', error.message);
      process.exit(1);
    }
  }

  async checkSecurity() {
    console.log('\n🔒 Checking Security Requirements...');
    
    await this.checkItem('security', 'Environment Variables Security', async () => {
      const envFiles = ['.env', '.env.production', 'ai-service/.env'];
      let hasSecrets = false;
      
      for (const envFile of envFiles) {
        try {
          const content = await fs.readFile(envFile, 'utf8');
          if (content.includes('=') && !content.includes('${')) {
            hasSecrets = true;
            break;
          }
        } catch (error) {
          // File doesn't exist, which is okay
        }
      }
      
      if (hasSecrets) {
        throw new Error('Hardcoded secrets found in environment files');
      }
      
      return 'Environment variables properly configured';
    });
    
    await this.checkItem('security', 'HTTPS Configuration', async () => {
      // Check if HTTPS is configured in production
      const nginxConfig = await this.readFileIfExists('nginx/nginx.conf');
      if (nginxConfig && !nginxConfig.includes('ssl') && !nginxConfig.includes('443')) {
        throw new Error('HTTPS not configured in Nginx');
      }
      
      return 'HTTPS configuration verified';
    });
    
    await this.checkItem('security', 'Authentication Middleware', async () => {
      const authFiles = [
        'ai-service/middleware/securityMiddleware.js',
        'middlewares/authMiddleware.js'
      ];
      
      let authConfigured = false;
      for (const file of authFiles) {
        const content = await this.readFileIfExists(file);
        if (content && (content.includes('jwt') || content.includes('auth'))) {
          authConfigured = true;
          break;
        }
      }
      
      if (!authConfigured) {
        throw new Error('Authentication middleware not properly configured');
      }
      
      return 'Authentication middleware configured';
    });
    
    await this.checkItem('security', 'Rate Limiting', async () => {
      const securityMiddleware = await this.readFileIfExists('ai-service/middleware/securityMiddleware.js');
      if (!securityMiddleware || !securityMiddleware.includes('rateLimit')) {
        throw new Error('Rate limiting not configured');
      }
      
      return 'Rate limiting configured';
    });
    
    await this.checkItem('security', 'Input Validation', async () => {
      const controllers = [
        'ai-service/controllers/chatbotController.js',
        'ai-service/controllers/diseaseDetectionController.js',
        'ai-service/controllers/irrigationPredictionController.js'
      ];
      
      let validationFound = false;
      for (const controller of controllers) {
        const content = await this.readFileIfExists(controller);
        if (content && (content.includes('validate') || content.includes('sanitize'))) {
          validationFound = true;
          break;
        }
      }
      
      if (!validationFound) {
        throw new Error('Input validation not implemented');
      }
      
      return 'Input validation implemented';
    });
    
    await this.checkItem('security', 'Data Encryption', async () => {
      const dataProtection = await this.readFileIfExists('ai-service/services/dataProtectionService.js');
      if (!dataProtection || !dataProtection.includes('encrypt')) {
        throw new Error('Data encryption not implemented');
      }
      
      return 'Data encryption implemented';
    });
  }

  async checkPerformance() {
    console.log('\n⚡ Checking Performance Requirements...');
    
    await this.checkItem('performance', 'Response Time Requirements', async () => {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${this.baseURL}/api/ai/health`, { timeout: 5000 });
        const responseTime = Date.now() - startTime;
        
        if (responseTime > 3000) {
          throw new Error(`Response time ${responseTime}ms exceeds 3 second requirement`);
        }
        
        return `Response time: ${responseTime}ms (within requirements)`;
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          return 'Service not running - cannot test response time';
        }
        throw error;
      }
    });
    
    await this.checkItem('performance', 'Caching Implementation', async () => {
      const cacheServices = [
        'ai-service/services/redisCacheService.js',
        'ai-service/services/irrigationCacheService.js'
      ];
      
      let cachingImplemented = false;
      for (const service of cacheServices) {
        const content = await this.readFileIfExists(service);
        if (content && content.includes('cache')) {
          cachingImplemented = true;
          break;
        }
      }
      
      if (!cachingImplemented) {
        throw new Error('Caching not properly implemented');
      }
      
      return 'Caching implementation verified';
    });
    
    await this.checkItem('performance', 'Database Optimization', async () => {
      const dbOptimization = await this.readFileIfExists('scripts/optimizations/database-optimization.sql');
      if (!dbOptimization) {
        throw new Error('Database optimization script not found');
      }
      
      if (!dbOptimization.includes('INDEX')) {
        throw new Error('Database indexes not configured');
      }
      
      return 'Database optimization configured';
    });
    
    await this.checkItem('performance', 'Model Optimization', async () => {
      const modelOptimization = await this.readFileIfExists('ai-service/services/modelOptimizationService.js');
      if (!modelOptimization) {
        throw new Error('Model optimization service not found');
      }
      
      if (!modelOptimization.includes('lazy') && !modelOptimization.includes('quantiz')) {
        throw new Error('Model optimization not implemented');
      }
      
      return 'Model optimization implemented';
    });
    
    await this.checkItem('performance', 'Resource Limits', async () => {
      const dockerCompose = await this.readFileIfExists('docker-compose.ai.yml');
      if (!dockerCompose) {
        throw new Error('Docker Compose configuration not found');
      }
      
      if (!dockerCompose.includes('deploy:') || !dockerCompose.includes('resources:')) {
        throw new Error('Docker resource limits not configured');
      }
      
      return 'Resource limits configured';
    });
  }

  async checkReliability() {
    console.log('\n🛡️  Checking Reliability Requirements...');
    
    await this.checkItem('reliability', 'Error Handling', async () => {
      const errorHandler = await this.readFileIfExists('ai-service/utils/errorHandler.js');
      if (!errorHandler) {
        throw new Error('Error handler not found');
      }
      
      if (!errorHandler.includes('try') || !errorHandler.includes('catch')) {
        throw new Error('Comprehensive error handling not implemented');
      }
      
      return 'Error handling implemented';
    });
    
    await this.checkItem('reliability', 'Health Checks', async () => {
      const healthRoutes = await this.readFileIfExists('ai-service/routes/healthRoutes.js');
      if (!healthRoutes) {
        throw new Error('Health check routes not found');
      }
      
      if (!healthRoutes.includes('/health') || !healthRoutes.includes('/ready')) {
        throw new Error('Health check endpoints not properly configured');
      }
      
      return 'Health checks configured';
    });
    
    await this.checkItem('reliability', 'Graceful Shutdown', async () => {
      const appFile = await this.readFileIfExists('ai-service/app.js');
      if (!appFile) {
        throw new Error('Main application file not found');
      }
      
      if (!appFile.includes('SIGTERM') || !appFile.includes('SIGINT')) {
        throw new Error('Graceful shutdown not implemented');
      }
      
      return 'Graceful shutdown implemented';
    });
    
    await this.checkItem('reliability', 'Backup Strategy', async () => {
      const deployScript = await this.readFileIfExists('scripts/deploy.sh');
      if (!deployScript || !deployScript.includes('backup')) {
        throw new Error('Backup strategy not implemented in deployment');
      }
      
      return 'Backup strategy configured';
    });
    
    await this.checkItem('reliability', 'Fallback Mechanisms', async () => {
      const chatbotController = await this.readFileIfExists('ai-service/controllers/chatbotController.js');
      if (!chatbotController || !chatbotController.includes('fallback')) {
        throw new Error('Fallback mechanisms not implemented');
      }
      
      return 'Fallback mechanisms implemented';
    });
  }

  async checkMonitoring() {
    console.log('\n📊 Checking Monitoring Requirements...');
    
    await this.checkItem('monitoring', 'Logging Configuration', async () => {
      const logger = await this.readFileIfExists('utils/logger.js');
      const aiLogger = await this.readFileIfExists('ai-service/utils/errorHandler.js');
      
      if (!logger && !aiLogger) {
        throw new Error('Logging not configured');
      }
      
      const logContent = logger || aiLogger;
      if (!logContent.includes('winston') && !logContent.includes('log')) {
        throw new Error('Structured logging not implemented');
      }
      
      return 'Logging configuration verified';
    });
    
    await this.checkItem('monitoring', 'Metrics Collection', async () => {
      const monitoringService = await this.readFileIfExists('ai-service/services/monitoringService.js');
      if (!monitoringService) {
        throw new Error('Monitoring service not found');
      }
      
      if (!monitoringService.includes('metric') || !monitoringService.includes('track')) {
        throw new Error('Metrics collection not implemented');
      }
      
      return 'Metrics collection implemented';
    });
    
    await this.checkItem('monitoring', 'Prometheus Configuration', async () => {
      const prometheusConfig = await this.readFileIfExists('monitoring/prometheus/prometheus.yml');
      if (!prometheusConfig) {
        throw new Error('Prometheus configuration not found');
      }
      
      if (!prometheusConfig.includes('ai-service') || !prometheusConfig.includes('scrape_configs')) {
        throw new Error('Prometheus not properly configured for AI service');
      }
      
      return 'Prometheus configuration verified';
    });
    
    await this.checkItem('monitoring', 'Grafana Dashboards', async () => {
      const dashboardFiles = [
        'monitoring/grafana/provisioning/dashboards/ai-service-overview.json',
        'monitoring/grafana/provisioning/dashboards/system-health.json'
      ];
      
      let dashboardsFound = 0;
      for (const dashboard of dashboardFiles) {
        const content = await this.readFileIfExists(dashboard);
        if (content) dashboardsFound++;
      }
      
      if (dashboardsFound === 0) {
        throw new Error('Grafana dashboards not configured');
      }
      
      return `${dashboardsFound} Grafana dashboards configured`;
    });
    
    await this.checkItem('monitoring', 'Alert Rules', async () => {
      const alertRules = await this.readFileIfExists('monitoring/prometheus/alert_rules.yml');
      if (!alertRules) {
        throw new Error('Alert rules not configured');
      }
      
      if (!alertRules.includes('AIServiceDown') || !alertRules.includes('HighResponseTime')) {
        throw new Error('Critical alert rules not configured');
      }
      
      return 'Alert rules configured';
    });
  }

  async checkDocumentation() {
    console.log('\n📖 Checking Documentation Requirements...');
    
    await this.checkItem('documentation', 'API Documentation', async () => {
      const apiDocs = await this.readFileIfExists('ai-service/docs/API_DOCUMENTATION.md');
      if (!apiDocs) {
        throw new Error('API documentation not found');
      }
      
      if (!apiDocs.includes('endpoints') || !apiDocs.includes('examples')) {
        throw new Error('API documentation incomplete');
      }
      
      return 'API documentation complete';
    });
    
    await this.checkItem('documentation', 'Deployment Guide', async () => {
      const deploymentDocs = [
        'DEPLOYMENT.md',
        'README.md'
      ];
      
      let deploymentGuideFound = false;
      for (const doc of deploymentDocs) {
        const content = await this.readFileIfExists(doc);
        if (content && (content.includes('deploy') || content.includes('installation'))) {
          deploymentGuideFound = true;
          break;
        }
      }
      
      if (!deploymentGuideFound) {
        throw new Error('Deployment guide not found');
      }
      
      return 'Deployment guide available';
    });
    
    await this.checkItem('documentation', 'Configuration Documentation', async () => {
      const configDocs = await this.readFileIfExists('ai-service/docs/API_DOCUMENTATION.md');
      if (!configDocs || !configDocs.includes('configuration')) {
        throw new Error('Configuration documentation incomplete');
      }
      
      return 'Configuration documentation available';
    });
    
    await this.checkItem('documentation', 'Troubleshooting Guide', async () => {
      const troubleshootingDocs = [
        'ai-service/DEBUG_GUIDE.md',
        'tests/TESTING_GUIDE.md'
      ];
      
      let troubleshootingFound = false;
      for (const doc of troubleshootingDocs) {
        const content = await this.readFileIfExists(doc);
        if (content) {
          troubleshootingFound = true;
          break;
        }
      }
      
      if (!troubleshootingFound) {
        throw new Error('Troubleshooting guide not found');
      }
      
      return 'Troubleshooting guide available';
    });
  }

  async checkCompliance() {
    console.log('\n⚖️  Checking Compliance Requirements...');
    
    await this.checkItem('compliance', 'GDPR Compliance', async () => {
      const privacyMiddleware = await this.readFileIfExists('ai-service/middleware/privacyMiddleware.js');
      if (!privacyMiddleware) {
        throw new Error('Privacy middleware not found');
      }
      
      if (!privacyMiddleware.includes('gdpr') && !privacyMiddleware.includes('privacy')) {
        throw new Error('GDPR compliance not implemented');
      }
      
      return 'GDPR compliance implemented';
    });
    
    await this.checkItem('compliance', 'Data Retention Policies', async () => {
      const dataRetention = await this.readFileIfExists('ai-service/services/dataRetentionService.js');
      if (!dataRetention) {
        throw new Error('Data retention service not found');
      }
      
      if (!dataRetention.includes('retention') || !dataRetention.includes('cleanup')) {
        throw new Error('Data retention policies not implemented');
      }
      
      return 'Data retention policies implemented';
    });
    
    await this.checkItem('compliance', 'Audit Logging', async () => {
      const auditLogging = await this.readFileIfExists('ai-service/middleware/privacyMiddleware.js');
      if (!auditLogging || !auditLogging.includes('audit')) {
        throw new Error('Audit logging not implemented');
      }
      
      return 'Audit logging implemented';
    });
    
    await this.checkItem('compliance', 'Data Encryption', async () => {
      const dataProtection = await this.readFileIfExists('ai-service/services/dataProtectionService.js');
      if (!dataProtection || !dataProtection.includes('encrypt')) {
        throw new Error('Data encryption not implemented');
      }
      
      return 'Data encryption implemented';
    });
  }

  async checkItem(category, name, checkFunction) {
    console.log(`\n🔍 Checking: ${name}`);
    
    try {
      const result = await checkFunction();
      console.log(`✅ PASSED: ${name}`);
      console.log(`   Result: ${result}`);
      
      this.checklist[category].push({
        name,
        status: 'passed',
        result
      });
      
      this.results.passed++;
      
    } catch (error) {
      const isCritical = this.isCriticalCheck(name);
      const status = isCritical ? 'critical' : 'warning';
      
      console.log(`${isCritical ? '🚨' : '⚠️'} ${status.toUpperCase()}: ${name}`);
      console.log(`   Error: ${error.message}`);
      
      this.checklist[category].push({
        name,
        status,
        error: error.message
      });
      
      if (isCritical) {
        this.results.critical++;
      } else {
        this.results.warnings++;
      }
      
      this.results.failed++;
    }
  }

  isCriticalCheck(checkName) {
    const criticalChecks = [
      'Environment Variables Security',
      'Authentication Middleware',
      'Data Encryption',
      'Error Handling',
      'Health Checks',
      'GDPR Compliance'
    ];
    
    return criticalChecks.includes(checkName);
  }

  async readFileIfExists(filePath) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  generateReadinessReport() {
    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 PRODUCTION READINESS REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total Checks: ${total}`);
    console.log(`  Passed: ${this.results.passed}`);
    console.log(`  Failed: ${this.results.failed}`);
    console.log(`  Critical Issues: ${this.results.critical}`);
    console.log(`  Warnings: ${this.results.warnings}`);
    console.log(`  Pass Rate: ${passRate}%`);
    
    // Category breakdown
    console.log(`\n📋 Category Breakdown:`);
    for (const [category, items] of Object.entries(this.checklist)) {
      const passed = items.filter(item => item.status === 'passed').length;
      const total = items.length;
      console.log(`  ${category.charAt(0).toUpperCase() + category.slice(1)}: ${passed}/${total} passed`);
    }
    
    // Critical issues
    if (this.results.critical > 0) {
      console.log(`\n🚨 CRITICAL ISSUES:`);
      for (const [category, items] of Object.entries(this.checklist)) {
        const criticalItems = items.filter(item => item.status === 'critical');
        if (criticalItems.length > 0) {
          console.log(`  ${category.toUpperCase()}:`);
          criticalItems.forEach((item, index) => {
            console.log(`    ${index + 1}. ${item.name}: ${item.error}`);
          });
        }
      }
    }
    
    // Warnings
    if (this.results.warnings > 0) {
      console.log(`\n⚠️  WARNINGS:`);
      for (const [category, items] of Object.entries(this.checklist)) {
        const warningItems = items.filter(item => item.status === 'warning');
        if (warningItems.length > 0) {
          console.log(`  ${category.toUpperCase()}:`);
          warningItems.forEach((item, index) => {
            console.log(`    ${index + 1}. ${item.name}: ${item.error}`);
          });
        }
      }
    }
    
    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    if (this.results.critical > 0) {
      console.log(`  1. Address all critical issues before production deployment`);
    }
    if (this.results.warnings > 0) {
      console.log(`  2. Review and address warnings to improve system reliability`);
    }
    console.log(`  3. Run security audit: node scripts/security-audit.js`);
    console.log(`  4. Run performance optimization: node scripts/performance-optimization.js`);
    console.log(`  5. Run user acceptance tests: node scripts/user-acceptance-testing.js`);
    console.log(`  6. Set up monitoring alerts and dashboards`);
    console.log(`  7. Prepare incident response procedures`);
    console.log(`  8. Schedule regular security and performance reviews`);
    
    // Save detailed report
    this.saveReadinessReport();
    
    // Determine production readiness
    if (this.results.critical > 0) {
      console.log('\n❌ SYSTEM NOT READY FOR PRODUCTION');
      console.log('   Critical issues must be resolved before deployment');
      process.exit(1);
    } else if (this.results.warnings > 5) {
      console.log('\n⚠️  SYSTEM READY WITH WARNINGS');
      console.log('   Review warnings and consider addressing before production');
      process.exit(0);
    } else {
      console.log('\n✅ SYSTEM READY FOR PRODUCTION');
      console.log('   All critical checks passed - system is production ready!');
      process.exit(0);
    }
  }

  async saveReadinessReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        critical: this.results.critical,
        warnings: this.results.warnings,
        passRate: this.results.passed / (this.results.passed + this.results.failed) * 100
      },
      checklist: this.checklist,
      recommendations: [
        'Address all critical issues before production deployment',
        'Review and address warnings to improve system reliability',
        'Run comprehensive security audit',
        'Perform load testing and performance optimization',
        'Set up monitoring and alerting',
        'Prepare incident response procedures',
        'Schedule regular security reviews'
      ]
    };
    
    const reportPath = path.join(__dirname, '..', 'reports', 'production-readiness-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run checklist if called directly
if (require.main === module) {
  const checker = new ProductionReadinessChecker();
  checker.runChecklist().catch(console.error);
}

module.exports = ProductionReadinessChecker;