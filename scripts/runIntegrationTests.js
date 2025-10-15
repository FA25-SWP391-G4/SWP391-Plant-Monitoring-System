#!/usr/bin/env node

/**
 * Integration Test Runner
 * Runs comprehensive integration tests for the system
 */

const SystemIntegrationTest = require('../tests/systemIntegrationTest');
const MqttBrokerVerifier = require('./verifyMqttBroker');
const { logger } = require('../utils/logger');

class IntegrationTestRunner {
  constructor() {
    this.testSuites = [
      'mqttBrokerVerification',
      'systemIntegrationTest'
    ];
    this.results = {
      suites: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      errors: [],
      startTime: null,
      endTime: null,
      duration: null
    };
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('🧪 Starting Integration Test Suite...');
    console.log('====================================');
    
    this.results.startTime = new Date();

    try {
      for (const suite of this.testSuites) {
        console.log(`\n🔬 Running ${suite}...`);
        await this.runTestSuite(suite);
      }

      this.results.endTime = new Date();
      this.results.duration = this.results.endTime - this.results.startTime;
      
      this.calculateSummary();
      this.printFinalReport();
      
      return this.results;
    } catch (error) {
      console.error('❌ Integration test suite failed:', error.message);
      this.results.errors.push(error.message);
      this.results.endTime = new Date();
      this.results.duration = this.results.endTime - this.results.startTime;
      
      this.printFinalReport();
      throw error;
    }
  }

  /**
   * Run individual test suite
   */
  async runTestSuite(suiteName) {
    try {
      let results;
      
      switch (suiteName) {
        case 'mqttBrokerVerification':
          results = await this.runMqttBrokerVerification();
          break;
        case 'systemIntegrationTest':
          results = await this.runSystemIntegrationTest();
          break;
        default:
          throw new Error(`Unknown test suite: ${suiteName}`);
      }

      this.results.suites[suiteName] = {
        success: true,
        results,
        duration: results.duration || 0
      };

      console.log(`✅ ${suiteName} completed successfully`);
    } catch (error) {
      this.results.suites[suiteName] = {
        success: false,
        error: error.message,
        duration: 0
      };
      
      console.log(`❌ ${suiteName} failed: ${error.message}`);
      this.results.errors.push(`${suiteName}: ${error.message}`);
    }
  }

  /**
   * Run MQTT broker verification
   */
  async runMqttBrokerVerification() {
    const verifier = new MqttBrokerVerifier();
    const startTime = Date.now();
    
    try {
      const results = await verifier.verify();
      const duration = Date.now() - startTime;
      
      return {
        ...results,
        duration,
        testType: 'mqttBrokerVerification'
      };
    } catch (error) {
      throw new Error(`MQTT broker verification failed: ${error.message}`);
    }
  }

  /**
   * Run system integration test
   */
  async runSystemIntegrationTest() {
    const integrationTest = new SystemIntegrationTest();
    const startTime = Date.now();
    
    try {
      const results = await integrationTest.runTests();
      const duration = Date.now() - startTime;
      
      return {
        ...results,
        duration,
        testType: 'systemIntegrationTest'
      };
    } catch (error) {
      throw new Error(`System integration test failed: ${error.message}`);
    }
  }

  /**
   * Calculate test summary
   */
  calculateSummary() {
    const suiteResults = Object.values(this.results.suites);
    
    this.results.summary.total = suiteResults.length;
    this.results.summary.passed = suiteResults.filter(suite => suite.success).length;
    this.results.summary.failed = suiteResults.filter(suite => !suite.success).length;
    
    // Count warnings from individual test results
    suiteResults.forEach(suite => {
      if (suite.results && suite.results.errors) {
        this.results.summary.warnings += suite.results.errors.length;
      }
    });
  }

  /**
   * Print final test report
   */
  printFinalReport() {
    console.log('\n📊 Integration Test Report:');
    console.log('===========================');
    
    // Test Suite Results
    console.log('\n🧪 Test Suites:');
    Object.entries(this.results.suites).forEach(([suiteName, result]) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const duration = result.duration ? `(${result.duration}ms)` : '';
      console.log(`  ${status} ${suiteName} ${duration}`);
      
      if (!result.success && result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });

    // Summary Statistics
    console.log('\n📈 Summary:');
    console.log(`  Total Suites: ${this.results.summary.total}`);
    console.log(`  Passed: ${this.results.summary.passed}`);
    console.log(`  Failed: ${this.results.summary.failed}`);
    console.log(`  Warnings: ${this.results.summary.warnings}`);
    console.log(`  Duration: ${this.results.duration}ms`);

    // Detailed Results
    this.printDetailedResults();

    // Overall Status
    const overallSuccess = this.results.summary.failed === 0;
    console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    if (overallSuccess) {
      console.log('🎉 All integration tests passed successfully!');
      console.log('\n✨ System is ready for production deployment.');
    } else {
      console.log('⚠️ Some integration tests failed.');
      console.log('\n🔧 Please address the issues before deployment.');
    }

    // Recommendations
    this.printRecommendations();
  }

  /**
   * Print detailed test results
   */
  printDetailedResults() {
    console.log('\n📋 Detailed Results:');
    
    Object.entries(this.results.suites).forEach(([suiteName, suite]) => {
      if (suite.results) {
        console.log(`\n  📁 ${suiteName}:`);
        
        // MQTT Broker Verification Details
        if (suite.results.testType === 'mqttBrokerVerification') {
          console.log(`    Connection: ${suite.results.connection ? '✅' : '❌'}`);
          console.log(`    Publish: ${suite.results.publish ? '✅' : '❌'}`);
          console.log(`    Subscribe: ${suite.results.subscribe ? '✅' : '❌'}`);
          if (suite.results.latency) {
            console.log(`    Latency: ${suite.results.latency}ms`);
          }
        }
        
        // System Integration Test Details
        if (suite.results.testType === 'systemIntegrationTest') {
          console.log('    Services:');
          Object.entries(suite.results.services || {}).forEach(([service, status]) => {
            console.log(`      ${status ? '✅' : '❌'} ${service}`);
          });
          
          console.log('    AI Features:');
          Object.entries(suite.results.aiFeatures || {}).forEach(([feature, status]) => {
            console.log(`      ${status ? '✅' : '❌'} ${feature}`);
          });
          
          if (suite.results.performance) {
            console.log('    Performance:');
            console.log(`      Response Time: ${suite.results.performance.responseTime?.toFixed(2)}ms`);
            console.log(`      Throughput: ${suite.results.performance.throughput?.toFixed(2)} req/s`);
            console.log(`      Error Rate: ${suite.results.performance.errorRate?.toFixed(2)}%`);
          }
        }
      }
    });
  }

  /**
   * Print recommendations based on test results
   */
  printRecommendations() {
    console.log('\n💡 Recommendations:');
    
    const recommendations = [];
    
    // Check MQTT broker results
    const mqttResults = this.results.suites.mqttBrokerVerification?.results;
    if (mqttResults) {
      if (!mqttResults.connection) {
        recommendations.push('🔌 Fix MQTT broker connection issues');
      }
      if (mqttResults.latency > 1000) {
        recommendations.push('⚡ Optimize MQTT broker performance (high latency detected)');
      }
    }
    
    // Check system integration results
    const systemResults = this.results.suites.systemIntegrationTest?.results;
    if (systemResults) {
      const unhealthyServices = Object.entries(systemResults.services || {})
        .filter(([service, status]) => !status)
        .map(([service]) => service);
      
      if (unhealthyServices.length > 0) {
        recommendations.push(`🏥 Fix unhealthy services: ${unhealthyServices.join(', ')}`);
      }
      
      const nonWorkingFeatures = Object.entries(systemResults.aiFeatures || {})
        .filter(([feature, status]) => !status)
        .map(([feature]) => feature);
      
      if (nonWorkingFeatures.length > 0) {
        recommendations.push(`🤖 Fix AI features: ${nonWorkingFeatures.join(', ')}`);
      }
      
      if (systemResults.performance?.errorRate > 10) {
        recommendations.push('📈 Investigate high error rate in system performance');
      }
      
      if (systemResults.performance?.responseTime > 5000) {
        recommendations.push('🚀 Optimize system performance (slow response times)');
      }
    }
    
    // General recommendations
    if (this.results.summary.failed > 0) {
      recommendations.push('🔍 Review failed test details and fix underlying issues');
    }
    
    if (this.results.summary.warnings > 0) {
      recommendations.push('⚠️ Address warnings to improve system reliability');
    }
    
    if (recommendations.length === 0) {
      console.log('  🎉 No issues detected - system is ready for deployment!');
    } else {
      recommendations.forEach(recommendation => {
        console.log(`  • ${recommendation}`);
      });
    }
  }

  /**
   * Save test results to file
   */
  async saveResults(filename = 'integration-test-results.json') {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const resultsPath = path.join(__dirname, '../logs', filename);
      await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Test results saved to: ${resultsPath}`);
    } catch (error) {
      console.error('❌ Failed to save test results:', error.message);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  
  runner.runAllTests()
    .then(async (results) => {
      await runner.saveResults();
      const success = results.summary.failed === 0;
      process.exit(success ? 0 : 1);
    })
    .catch(async (error) => {
      console.error('Integration test runner failed:', error);
      await runner.saveResults('integration-test-results-failed.json');
      process.exit(1);
    });
}

module.exports = IntegrationTestRunner;