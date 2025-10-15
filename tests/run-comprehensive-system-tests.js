/**
 * Comprehensive System Test Runner
 * Orchestrates all system testing components
 * Requirements: 4.1, 4.2, 4.3
 */

const { ComprehensiveSystemTester } = require('./comprehensive-system-test');
const { LoadTestRunner } = require('./load-test-runner');
const { PerformanceMonitor } = require('./performance-monitor');
const { MemoryUsageMonitor } = require('./memory-usage-monitor');
const { UserAcceptanceTester } = require('./user-acceptance-test');
const fs = require('fs').promises;
const path = require('path');

const SYSTEM_TEST_CONFIG = {
  testSequence: [
    {
      name: 'Performance Monitoring',
      runner: 'performance',
      duration: 300000, // 5 minutes
      critical: true
    },
    {
      name: 'Memory Usage Monitoring',
      runner: 'memory',
      duration: 600000, // 10 minutes
      critical: true
    },
    {
      name: 'Load Testing (100 Concurrent Users)',
      runner: 'load',
      duration: 180000, // 3 minutes
      critical: true
    },
    {
      name: 'User Acceptance Testing',
      runner: 'uat',
      duration: 300000, // 5 minutes
      critical: true
    },
    {
      name: 'Comprehensive System Test',
      runner: 'comprehensive',
      duration: 120000, // 2 minutes
      critical: false
    }
  ],
  systemRequirements: {
    minMemory: 2048, // 2GB RAM
    minCPU: 2, // 2 CPU cores
    requiredServices: [
      'http://localhost:3001', // AI Service
      'http://localhost:3010'  // Main Server (if available)
    ]
  },
  reportGeneration: {
    consolidatedReport: true,
    individualReports: true,
    executiveSummary: true
  }
};

class ComprehensiveSystemTestRunner {
  constructor() {
    this.results = {
      startTime: Date.now(),
      endTime: null,
      testResults: {},
      systemInfo: {},
      overallStatus: 'unknown',
      criticalFailures: [],
      recommendations: []
    };
    this.currentTest = null;
  }

  async runAllSystemTests() {
    console.log('🚀 Starting Comprehensive System Testing Suite');
    console.log('=' .repeat(60));
    console.log(`📊 Total Tests: ${SYSTEM_TEST_CONFIG.testSequence.length}`);
    console.log(`⏱️ Estimated Duration: ${this.calculateTotalDuration()} minutes`);
    console.log('=' .repeat(60));

    try {
      // Pre-flight checks
      await this.performPreflightChecks();

      // Run test sequence
      for (const testConfig of SYSTEM_TEST_CONFIG.testSequence) {
        await this.runIndividualTest(testConfig);
      }

      // Generate consolidated reports
      await this.generateConsolidatedReport();

      console.log('\n🎉 Comprehensive System Testing Completed Successfully!');
      console.log(`📊 Overall Status: ${this.results.overallStatus}`);

    } catch (error) {
      console.error('\n❌ Comprehensive System Testing Failed:', error);
      this.results.criticalFailures.push({
        test: this.currentTest?.name || 'Unknown',
        error: error.message,
        timestamp: Date.now()
      });
      
      await this.generateFailureReport();
      throw error;
    } finally {
      this.results.endTime = Date.now();
    }
  }

  async performPreflightChecks() {
    console.log('\n🔍 Performing Pre-flight Checks...');

    // Check system resources
    const systemInfo = {
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      cpuCount: require('os').cpus().length,
      freeMemory: require('os').freemem(),
      totalMemory: require('os').totalmem()
    };

    this.results.systemInfo = systemInfo;

    console.log(`   💻 Platform: ${systemInfo.platform}`);
    console.log(`   🧠 Memory: ${(systemInfo.freeMemory / 1024 / 1024 / 1024).toFixed(1)}GB free / ${(systemInfo.totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB total`);
    console.log(`   ⚡ CPU Cores: ${systemInfo.cpuCount}`);

    // Check minimum requirements
    if (systemInfo.freeMemory < SYSTEM_TEST_CONFIG.systemRequirements.minMemory * 1024 * 1024) {
      console.warn(`   ⚠️ Warning: Low memory (${(systemInfo.freeMemory / 1024 / 1024).toFixed(0)}MB free, ${SYSTEM_TEST_CONFIG.systemRequirements.minMemory}MB recommended)`);
    }

    if (systemInfo.cpuCount < SYSTEM_TEST_CONFIG.systemRequirements.minCPU) {
      console.warn(`   ⚠️ Warning: Low CPU count (${systemInfo.cpuCount} cores, ${SYSTEM_TEST_CONFIG.systemRequirements.minCPU} recommended)`);
    }

    // Check service availability
    console.log('   🌐 Checking service availability...');
    for (const serviceUrl of SYSTEM_TEST_CONFIG.systemRequirements.requiredServices) {
      try {
        const axios = require('axios');
        await axios.get(`${serviceUrl}/api/health`, { timeout: 5000 });
        console.log(`   ✅ ${serviceUrl} - Available`);
      } catch (error) {
        console.log(`   ⚠️ ${serviceUrl} - Not available (${error.message})`);
      }
    }

    console.log('✅ Pre-flight checks completed\n');
  }

  async runIndividualTest(testConfig) {
    this.currentTest = testConfig;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Running: ${testConfig.name}`);
    console.log(`⏱️ Expected Duration: ${(testConfig.duration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`🔥 Critical: ${testConfig.critical ? 'Yes' : 'No'}`);
    console.log(`${'='.repeat(60)}`);

    const testStartTime = Date.now();
    let testResult = {
      name: testConfig.name,
      runner: testConfig.runner,
      startTime: testStartTime,
      endTime: null,
      duration: 0,
      success: false,
      critical: testConfig.critical,
      error: null,
      summary: {}
    };

    try {
      switch (testConfig.runner) {
        case 'performance':
          testResult.summary = await this.runPerformanceTest();
          break;
        case 'memory':
          testResult.summary = await this.runMemoryTest();
          break;
        case 'load':
          testResult.summary = await this.runLoadTest();
          break;
        case 'uat':
          testResult.summary = await this.runUATTest();
          break;
        case 'comprehensive':
          testResult.summary = await this.runComprehensiveTest();
          break;
        default:
          throw new Error(`Unknown test runner: ${testConfig.runner}`);
      }

      testResult.success = true;
      console.log(`✅ ${testConfig.name} completed successfully`);

    } catch (error) {
      testResult.error = error.message;
      testResult.success = false;
      
      console.error(`❌ ${testConfig.name} failed: ${error.message}`);
      
      if (testConfig.critical) {
        this.results.criticalFailures.push({
          test: testConfig.name,
          error: error.message,
          timestamp: Date.now()
        });
      }
    } finally {
      testResult.endTime = Date.now();
      testResult.duration = testResult.endTime - testResult.startTime;
      this.results.testResults[testConfig.runner] = testResult;
      
      console.log(`⏱️ Duration: ${(testResult.duration / 1000).toFixed(1)} seconds`);
    }
  }

  async runPerformanceTest() {
    const monitor = new PerformanceMonitor();
    
    // Run a shorter performance test for the comprehensive suite
    const originalDuration = monitor.constructor.prototype.monitoringDuration;
    monitor.monitoringDuration = 300000; // 5 minutes
    
    await monitor.startMonitoring();
    
    return {
      averageResponseTimes: monitor.metrics.summary.averageResponseTimes,
      systemHealth: monitor.metrics.summary.systemHealth,
      thresholdViolations: Object.values(monitor.metrics.summary.thresholdViolations).reduce((a, b) => a + b, 0)
    };
  }

  async runMemoryTest() {
    const monitor = new MemoryUsageMonitor();
    
    // Run a shorter memory test
    const originalDuration = monitor.constructor.prototype.monitoringDuration;
    monitor.monitoringDuration = 600000; // 10 minutes
    
    await monitor.startMonitoring();
    
    return {
      peakMemoryMB: (monitor.metrics.summary.peakMemory.heapUsed / 1024 / 1024).toFixed(1),
      memoryGrowthRate: monitor.metrics.summary.memoryGrowthRate.toFixed(2),
      leakDetected: monitor.metrics.summary.leakDetected,
      gcEvents: monitor.metrics.gcEvents.length
    };
  }

  async runLoadTest() {
    const loadTester = new LoadTestRunner();
    
    // Run load test with reduced duration for comprehensive suite
    const originalDuration = loadTester.constructor.prototype.testDurationMinutes;
    loadTester.testDurationMinutes = 3; // 3 minutes
    
    await loadTester.runLoadTest();
    
    return {
      totalRequests: loadTester.results.totalRequests,
      successRate: ((loadTester.results.successfulRequests / loadTester.results.totalRequests) * 100).toFixed(2),
      requestsPerSecond: loadTester.results.requestsPerSecond.toFixed(2),
      averageResponseTime: loadTester.results.responseTimeStats.average.toFixed(2)
    };
  }

  async runUATTest() {
    const uatTester = new UserAcceptanceTester();
    await uatTester.runUserAcceptanceTests();
    
    return {
      totalTests: uatTester.results.summary.totalTests,
      passedTests: uatTester.results.summary.passedTests,
      overallScore: uatTester.results.summary.overallScore.toFixed(1),
      chatbotTests: uatTester.results.testResults.chatbotTests.length,
      irrigationTests: uatTester.results.testResults.irrigationTests.length
    };
  }

  async runComprehensiveTest() {
    const comprehensiveTester = new ComprehensiveSystemTester();
    await comprehensiveTester.runAllTests();
    
    return {
      loadTestPassed: comprehensiveTester.results.loadTest.successfulRequests > 0,
      performancePassed: comprehensiveTester.results.performanceTest.thresholdViolations.length === 0,
      memoryPassed: comprehensiveTester.results.memoryTest.memoryLeaks.length === 0,
      userAcceptancePassed: comprehensiveTester.results.userAcceptanceTest.overallScore >= 70
    };
  }

  calculateTotalDuration() {
    return SYSTEM_TEST_CONFIG.testSequence.reduce((total, test) => {
      return total + (test.duration / 1000 / 60);
    }, 0).toFixed(1);
  }

  async generateConsolidatedReport() {
    console.log('\n📊 Generating Consolidated System Test Report...');

    // Determine overall status
    const criticalTests = Object.values(this.results.testResults).filter(test => test.critical);
    const criticalFailures = criticalTests.filter(test => !test.success);
    
    if (criticalFailures.length === 0) {
      this.results.overallStatus = 'PASSED';
    } else if (criticalFailures.length <= criticalTests.length / 2) {
      this.results.overallStatus = 'PARTIAL';
    } else {
      this.results.overallStatus = 'FAILED';
    }

    // Generate recommendations
    this.generateRecommendations();

    const consolidatedReport = {
      testSuite: 'Comprehensive System Testing Suite',
      timestamp: new Date().toISOString(),
      duration: this.results.endTime - this.results.startTime,
      systemInfo: this.results.systemInfo,
      overallStatus: this.results.overallStatus,
      testResults: this.results.testResults,
      criticalFailures: this.results.criticalFailures,
      recommendations: this.results.recommendations,
      summary: this.generateExecutiveSummary()
    };

    // Save consolidated report
    await fs.writeFile(
      path.join(__dirname, 'consolidated-system-test-report.json'),
      JSON.stringify(consolidatedReport, null, 2)
    );

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummaryMarkdown(consolidatedReport);
    await fs.writeFile(
      path.join(__dirname, 'executive-summary.md'),
      executiveSummary
    );

    console.log('📄 Reports generated:');
    console.log('   - consolidated-system-test-report.json');
    console.log('   - executive-summary.md');

    return consolidatedReport;
  }

  generateRecommendations() {
    const recommendations = [];

    // Analyze test results and generate recommendations
    Object.values(this.results.testResults).forEach(test => {
      if (!test.success && test.critical) {
        recommendations.push({
          priority: 'HIGH',
          category: test.runner,
          issue: `Critical test failure: ${test.name}`,
          recommendation: `Address ${test.error} before production deployment`
        });
      }

      // Specific recommendations based on test type
      if (test.runner === 'performance' && test.summary.thresholdViolations > 0) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'performance',
          issue: 'Performance threshold violations detected',
          recommendation: 'Optimize response times and implement caching strategies'
        });
      }

      if (test.runner === 'memory' && test.summary.leakDetected) {
        recommendations.push({
          priority: 'HIGH',
          category: 'memory',
          issue: 'Memory leak detected',
          recommendation: 'Review object lifecycle management and implement proper cleanup'
        });
      }

      if (test.runner === 'load' && parseFloat(test.summary.successRate) < 95) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'reliability',
          issue: 'Load test success rate below 95%',
          recommendation: 'Improve error handling and system stability under load'
        });
      }

      if (test.runner === 'uat' && parseFloat(test.summary.overallScore) < 70) {
        recommendations.push({
          priority: 'HIGH',
          category: 'user_experience',
          issue: 'User acceptance score below 70%',
          recommendation: 'Address user experience issues before production release'
        });
      }
    });

    this.results.recommendations = recommendations;
  }

  generateExecutiveSummary() {
    const totalTests = Object.keys(this.results.testResults).length;
    const passedTests = Object.values(this.results.testResults).filter(test => test.success).length;
    const criticalFailures = this.results.criticalFailures.length;

    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      criticalFailures,
      overallScore: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
      testDuration: (this.results.endTime - this.results.startTime) / 1000,
      systemReadiness: this.determineSystemReadiness()
    };
  }

  determineSystemReadiness() {
    if (this.results.overallStatus === 'PASSED') {
      return 'PRODUCTION_READY';
    } else if (this.results.overallStatus === 'PARTIAL') {
      return 'NEEDS_MONITORING';
    } else {
      return 'NOT_READY';
    }
  }

  generateExecutiveSummaryMarkdown(report) {
    return `# Executive Summary - Comprehensive System Testing

## Test Overview
- **Test Suite**: ${report.testSuite}
- **Execution Date**: ${new Date(report.timestamp).toLocaleString()}
- **Total Duration**: ${(report.duration / 1000 / 60).toFixed(1)} minutes
- **Overall Status**: ${report.overallStatus}

## System Readiness: ${report.summary.systemReadiness.replace(/_/g, ' ')}

## Test Results Summary
- **Total Tests**: ${report.summary.totalTests}
- **Passed Tests**: ${report.summary.passedTests}
- **Failed Tests**: ${report.summary.failedTests}
- **Critical Failures**: ${report.summary.criticalFailures}
- **Overall Score**: ${report.summary.overallScore.toFixed(1)}%

## Individual Test Results

${Object.values(report.testResults).map(test => `### ${test.name}
- **Status**: ${test.success ? '✅ PASSED' : '❌ FAILED'}
- **Duration**: ${(test.duration / 1000).toFixed(1)} seconds
- **Critical**: ${test.critical ? 'Yes' : 'No'}
${test.error ? `- **Error**: ${test.error}` : ''}
${Object.keys(test.summary).length > 0 ? `- **Key Metrics**: ${Object.entries(test.summary).map(([key, value]) => `${key}: ${value}`).join(', ')}` : ''}`).join('\n\n')}

## System Information
- **Platform**: ${report.systemInfo.platform}
- **Node Version**: ${report.systemInfo.nodeVersion}
- **CPU Cores**: ${report.systemInfo.cpuCount}
- **Total Memory**: ${(report.systemInfo.totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB
- **Free Memory**: ${(report.systemInfo.freeMemory / 1024 / 1024 / 1024).toFixed(1)}GB

## Critical Issues
${report.criticalFailures.length > 0 ? 
  report.criticalFailures.map(failure => `- **${failure.test}**: ${failure.error}`).join('\n') :
  'No critical issues detected ✅'
}

## Recommendations
${report.recommendations.length > 0 ? 
  report.recommendations.map(rec => `### ${rec.priority} Priority - ${rec.category.toUpperCase()}
**Issue**: ${rec.issue}
**Recommendation**: ${rec.recommendation}`).join('\n\n') :
  'No specific recommendations. System performance is acceptable.'
}

## Production Deployment Decision

${report.summary.systemReadiness === 'PRODUCTION_READY' ? 
  `🎉 **APPROVED FOR PRODUCTION**
- All critical tests passed
- System performance meets requirements
- No blocking issues identified` :
  
  report.summary.systemReadiness === 'NEEDS_MONITORING' ?
  `⚠️ **CONDITIONAL APPROVAL**
- Most tests passed with minor issues
- Deploy with enhanced monitoring
- Address non-critical issues post-deployment` :
  
  `🚨 **NOT APPROVED FOR PRODUCTION**
- Critical test failures detected
- System performance issues identified
- Must address all critical issues before deployment`
}

## Next Steps
1. Review detailed test reports for specific issues
2. Address high-priority recommendations
3. ${report.summary.systemReadiness === 'PRODUCTION_READY' ? 'Proceed with production deployment' : 'Re-run tests after fixes'}
4. Implement monitoring and alerting for production environment

---
*Generated by Comprehensive System Test Runner*
*Report Date: ${new Date().toLocaleString()}*
`;
  }

  async generateFailureReport() {
    const failureReport = {
      testSuite: 'Comprehensive System Testing Suite - FAILURE REPORT',
      timestamp: new Date().toISOString(),
      overallStatus: 'FAILED',
      criticalFailures: this.results.criticalFailures,
      completedTests: this.results.testResults,
      systemInfo: this.results.systemInfo
    };

    await fs.writeFile(
      path.join(__dirname, 'system-test-failure-report.json'),
      JSON.stringify(failureReport, null, 2)
    );

    console.log('\n📄 Failure report saved: system-test-failure-report.json');
  }
}

// Main execution
async function runComprehensiveSystemTests() {
  const testRunner = new ComprehensiveSystemTestRunner();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping comprehensive system tests...');
    process.exit(1);
  });
  
  try {
    await testRunner.runAllSystemTests();
    
    if (testRunner.results.overallStatus === 'PASSED') {
      console.log('\n🎉 All system tests passed! System is ready for production.');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some tests failed. Review reports before production deployment.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Comprehensive system testing failed:', error);
    process.exit(1);
  }
}

// Export for use in other test files
module.exports = { ComprehensiveSystemTestRunner, SYSTEM_TEST_CONFIG };

// Run if called directly
if (require.main === module) {
  runComprehensiveSystemTests();
}