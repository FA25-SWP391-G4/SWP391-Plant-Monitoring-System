/**
 * Deployment Verification Script
 * Verifies that the system is ready for production deployment
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

class DeploymentVerifier {
  constructor() {
    this.mainServiceUrl = process.env.MAIN_SERVICE_URL || 'http://localhost:3010';
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3001';
    
    this.checks = [
      'environmentVariables',
      'serviceHealth',
      'databaseConnection',
      'aiIntegrationEndpoints',
      'securityConfiguration',
      'performanceBaseline'
    ];
    
    this.results = {
      checks: {},
      warnings: [],
      errors: [],
      overallReady: false
    };
  }

  /**
   * Run complete deployment verification
   */
  async verify() {
    console.log('🚀 Deployment Verification Starting...');
    console.log('=====================================');

    try {
      for (const check of this.checks) {
        console.log(`\n🔍 Running ${check}...`);
        await this[check]();
        this.results.checks[check] = true;
        console.log(`✅ ${check} passed`);
      }

      this.results.overallReady = true;
      this.printVerificationReport();
      return this.results;
    } catch (error) {
      console.error(`❌ Deployment verification failed: ${error.message}`);
      this.results.errors.push(error.message);
      this.printVerificationReport();
      throw error;
    }
  }

  /**
   * Check environment variables
   */
  async environmentVariables() {
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NODE_ENV',
      'PORT'
    ];

    const optionalVars = [
      'AI_SERVICE_URL',
      'MQTT_URL',
      'OPENROUTER_API_KEY',
      'EMAIL_USER',
      'EMAIL_PASS'
    ];

    // Check required variables
    const missingRequired = requiredVars.filter(varName => !process.env[varName]);
    if (missingRequired.length > 0) {
      throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
    }

    // Check optional variables
    const missingOptional = optionalVars.filter(varName => !process.env[varName]);
    if (missingOptional.length > 0) {
      this.results.warnings.push(`Missing optional environment variables: ${missingOptional.join(', ')}`);
    }

    // Check JWT secret strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      this.results.warnings.push('JWT_SECRET should be at least 32 characters long');
    }

    console.log(`   ✅ Required variables: ${requiredVars.length - missingRequired.length}/${requiredVars.length}`);
    console.log(`   ⚠️ Optional variables: ${optionalVars.length - missingOptional.length}/${optionalVars.length}`);
  }

  /**
   * Check service health
   */
  async serviceHealth() {
    const services = [
      { name: 'Main Service', url: `${this.mainServiceUrl}/` },
      { name: 'AI Service', url: `${this.aiServiceUrl}/health` }
    ];

    for (const service of services) {
      try {
        const response = await axios.get(service.url, { timeout: 10000 });
        if (response.status === 200) {
          console.log(`   ✅ ${service.name}: Healthy`);
        } else {
          throw new Error(`${service.name} returned status: ${response.status}`);
        }
      } catch (error) {
        if (service.name === 'AI Service') {
          this.results.warnings.push(`${service.name} is not available - AI features will be disabled`);
          console.log(`   ⚠️ ${service.name}: Not available (AI features disabled)`);
        } else {
          throw new Error(`${service.name} health check failed: ${error.message}`);
        }
      }
    }
  }

  /**
   * Check database connection
   */
  async databaseConnection() {
    try {
      const { connectDB } = require('../config/db');
      await connectDB();
      console.log('   ✅ Database connection successful');
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Check AI integration endpoints
   */
  async aiIntegrationEndpoints() {
    const endpoints = [
      '/api/ai-integration/status',
      '/api/ai-integration/health'
    ];

    let workingEndpoints = 0;

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${this.mainServiceUrl}${endpoint}`, { timeout: 10000 });
        if (response.status === 200) {
          workingEndpoints++;
          console.log(`   ✅ ${endpoint}: Working`);
        } else {
          console.log(`   ❌ ${endpoint}: Status ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint}: ${error.message}`);
        this.results.warnings.push(`AI integration endpoint ${endpoint} not working`);
      }
    }

    if (workingEndpoints === 0) {
      throw new Error('No AI integration endpoints are working');
    }

    console.log(`   📊 Working endpoints: ${workingEndpoints}/${endpoints.length}`);
  }

  /**
   * Check security configuration
   */
  async securityConfiguration() {
    const securityChecks = [];

    // Check if running in production mode
    if (process.env.NODE_ENV === 'production') {
      securityChecks.push('✅ Production mode enabled');
    } else {
      this.results.warnings.push('Not running in production mode');
      securityChecks.push('⚠️ Development mode (not recommended for production)');
    }

    // Check HTTPS configuration
    if (process.env.SSL_ENABLED === 'true') {
      securityChecks.push('✅ SSL/HTTPS enabled');
    } else {
      this.results.warnings.push('SSL/HTTPS not enabled');
      securityChecks.push('⚠️ SSL/HTTPS not configured');
    }

    // Check CORS configuration
    if (process.env.CORS_ORIGIN) {
      securityChecks.push('✅ CORS origin configured');
    } else {
      this.results.warnings.push('CORS origin not configured');
      securityChecks.push('⚠️ CORS origin not set');
    }

    securityChecks.forEach(check => console.log(`   ${check}`));
  }

  /**
   * Check performance baseline
   */
  async performanceBaseline() {
    const startTime = Date.now();
    const requests = [];

    // Test concurrent requests
    for (let i = 0; i < 5; i++) {
      requests.push(
        axios.get(`${this.mainServiceUrl}/`, { timeout: 5000 })
          .catch(() => null) // Don't fail on individual request errors
      );
    }

    const responses = await Promise.allSettled(requests);
    const endTime = Date.now();
    
    const successfulRequests = responses.filter(r => r.status === 'fulfilled' && r.value).length;
    const avgResponseTime = (endTime - startTime) / requests.length;

    console.log(`   📈 Successful requests: ${successfulRequests}/${requests.length}`);
    console.log(`   ⏱️ Average response time: ${avgResponseTime.toFixed(2)}ms`);

    if (avgResponseTime > 5000) {
      this.results.warnings.push('High response times detected - consider performance optimization');
    }

    if (successfulRequests < requests.length * 0.8) {
      this.results.warnings.push('Low success rate in performance test');
    }
  }

  /**
   * Print verification report
   */
  printVerificationReport() {
    console.log('\n📊 Deployment Verification Report:');
    console.log('==================================');

    // Checks
    console.log('\n🔍 Verification Checks:');
    Object.entries(this.results.checks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${check}`);
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
    console.log(`\n🎯 Deployment Ready: ${this.results.overallReady ? '✅ YES' : '❌ NO'}`);
    
    if (this.results.overallReady) {
      console.log('\n🎉 System is ready for deployment!');
      
      if (this.results.warnings.length > 0) {
        console.log('\n💡 Consider addressing warnings for optimal production setup.');
      }
      
      console.log('\n🚀 Deployment Checklist:');
      console.log('  1. ✅ Environment variables configured');
      console.log('  2. ✅ Services are healthy');
      console.log('  3. ✅ Database connection working');
      console.log('  4. ✅ Integration endpoints available');
      console.log('  5. ✅ Security configuration checked');
      console.log('  6. ✅ Performance baseline established');
      
    } else {
      console.log('\n⚠️ System is NOT ready for deployment.');
      console.log('Please address the errors above before deploying.');
    }

    // Next Steps
    console.log('\n📋 Next Steps:');
    if (this.results.overallReady) {
      console.log('  • Run integration tests: npm run integration:test');
      console.log('  • Start services: npm run start:all');
      console.log('  • Monitor logs for any issues');
      console.log('  • Set up monitoring and alerting');
    } else {
      console.log('  • Fix the errors listed above');
      console.log('  • Re-run verification: node scripts/verifyDeployment.js');
      console.log('  • Check service logs for detailed error information');
    }
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new DeploymentVerifier();
  verifier.verify()
    .then(results => {
      process.exit(results.overallReady ? 0 : 1);
    })
    .catch(error => {
      console.error('Deployment verification failed:', error);
      process.exit(1);
    });
}

module.exports = DeploymentVerifier;