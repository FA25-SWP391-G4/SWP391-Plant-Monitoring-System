/**
 * Comprehensive Test Suite - Kiểm tra chi tiết tất cả tính năng AI
 */

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';

class AITestSuite {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    
    if (type === 'error') this.errors.push(logMessage);
    if (type === 'warning') this.warnings.push(logMessage);
  }

  async testAPI(name, method, url, data = null, expectedFields = []) {
    try {
      await this.log(`Testing ${name}...`);
      
      const config = {
        method,
        url,
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      };
      
      if (data) config.data = data;
      
      const startTime = Date.now();
      const response = await axios(config);
      const responseTime = Date.now() - startTime;
      
      // Check response status
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Check response structure
      const responseData = response.data;
      const issues = [];
      
      // Check for success field
      if (responseData.success === false) {
        issues.push(`API returned success: false - ${responseData.error || responseData.message}`);
      }
      
      // Check expected fields
      expectedFields.forEach(field => {
        if (!(field in responseData)) {
          issues.push(`Missing expected field: ${field}`);
        }
      });
      
      // Check for error indicators
      if (responseData.error) {
        issues.push(`Error in response: ${responseData.error}`);
      }
      
      // Performance check
      if (responseTime > 10000) {
        issues.push(`Slow response time: ${responseTime}ms`);
      }
      
      const result = {
        name,
        success: issues.length === 0,
        responseTime,
        issues,
        responseSize: JSON.stringify(responseData).length,
        hasData: Object.keys(responseData).length > 0
      };
      
      this.results.push(result);
      
      if (result.success) {
        await this.log(`✅ ${name} - SUCCESS (${responseTime}ms)`);
      } else {
        await this.log(`❌ ${name} - ISSUES FOUND:`, 'error');
        issues.forEach(issue => this.log(`   - ${issue}`, 'error'));
      }
      
      return result;
      
    } catch (error) {
      const result = {
        name,
        success: false,
        error: error.message,
        issues: [error.message]
      };
      
      this.results.push(result);
      await this.log(`❌ ${name} - ERROR: ${error.message}`, 'error');
      return result;
    }
  }

  async runComprehensiveTests() {
    await this.log('🚀 Starting Comprehensive AI Test Suite...');
    
    // 1. Health Check
    await this.testAPI(
      'Health Check',
      'GET',
      `${BASE_URL}/health`,
      null,
      ['status', 'features', 'models']
    );
    
    // 2. API Documentation
    await this.testAPI(
      'API Documentation',
      'GET',
      `${BASE_URL}/api/docs`,
      null,
      ['title', 'endpoints']
    );
    
    // 3. Chatbot - Basic Test
    await this.testAPI(
      'Chatbot - Basic Query',
      'POST',
      `${BASE_URL}/api/ai/chatbot/message`,
      {
        message: "Cây của tôi cần tưới không?",
        plantId: "1",
        userId: "test_user"
      },
      ['success', 'response']
    );
    
    // 4. Chatbot - Complex Query
    await this.testAPI(
      'Chatbot - Complex Query',
      'POST',
      `${BASE_URL}/api/ai/chatbot/message`,
      {
        message: "Lá cây tôi bị vàng và có đốm nâu, nguyên nhân là gì và cách xử lý?",
        plantId: "1",
        userId: "test_user",
        language: "vi"
      },
      ['success', 'response', 'sensorData']
    );
    
    // 5. Irrigation Prediction
    await this.testAPI(
      'Irrigation Prediction',
      'POST',
      `${BASE_URL}/api/ai/irrigation/predict/1`,
      {},
      ['success', 'prediction']
    );
    
    // 6. Irrigation Optimization
    await this.testAPI(
      'Irrigation Optimization',
      'POST',
      `${BASE_URL}/api/ai/irrigation/optimize/1`,
      { timeHorizon: 7, algorithm: 'reinforcement' },
      ['success', 'optimizedSchedule']
    );
    
    // 7. Early Warning Analysis
    await this.testAPI(
      'Early Warning Analysis',
      'POST',
      `${BASE_URL}/api/ai/warning/analyze/1`,
      {},
      ['success', 'analysis']
    );
    
    // 8. Early Warning Dashboard
    await this.testAPI(
      'Early Warning Dashboard',
      'GET',
      `${BASE_URL}/api/ai/warning/dashboard/1`,
      null,
      ['success', 'dashboard']
    );
    
    // 9. Image Analysis History
    await this.testAPI(
      'Image Analysis History',
      'GET',
      `${BASE_URL}/api/ai/image/history/test_user/1`,
      null,
      ['success', 'history']
    );
    
    // 10. Self Learning - Feedback
    await this.testAPI(
      'Self Learning Feedback',
      'POST',
      `${BASE_URL}/api/ai/learning/feedback`,
      {
        plantId: "1",
        predictionType: "irrigation",
        actualOutcome: { wasWateringNeeded: true, actualWaterAmount: 200 },
        userRating: 4,
        userComments: "Dự đoán chính xác"
      },
      ['success', 'feedbackId']
    );
    
    // 11. Self Learning - Historical Analysis
    await this.testAPI(
      'Self Learning Historical Analysis',
      'GET',
      `${BASE_URL}/api/ai/learning/analyze/1`,
      null,
      ['success', 'analysis']
    );
    
    // 12. Self Learning - Model Status
    await this.testAPI(
      'Self Learning Model Status',
      'GET',
      `${BASE_URL}/api/ai/learning/status`,
      null,
      ['success', 'status']
    );
    
    // 13. Automation Setup
    await this.testAPI(
      'Automation Setup',
      'POST',
      `${BASE_URL}/api/ai/automation/setup/1`,
      {
        enabled: true,
        mode: "smart",
        triggers: [{ type: "ai_prediction", threshold: 0.7 }],
        actions: [{ type: "irrigation", amount: 200 }],
        constraints: { maxWaterPerDay: 1000 }
      },
      ['success', 'automationId']
    );
    
    // 14. Automation Dashboard
    await this.testAPI(
      'Automation Dashboard',
      'GET',
      `${BASE_URL}/api/ai/automation/dashboard`,
      null,
      ['success', 'dashboard']
    );
    
    // 15. Statistics
    await this.testAPI(
      'AI Statistics',
      'GET',
      `${BASE_URL}/api/ai/statistics`,
      null,
      ['success', 'statistics']
    );
    
    // 16. Comprehensive Analysis
    await this.testAPI(
      'Comprehensive Analysis',
      'POST',
      `${BASE_URL}/api/ai/analyze/comprehensive/1`,
      { includeOptimization: true, includeLearning: true },
      ['success', 'results']
    );
    
    await this.generateReport();
  }

  async generateReport() {
    await this.log('\n📊 GENERATING COMPREHENSIVE TEST REPORT...');
    
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.filter(r => !r.success).length;
    
    const avgResponseTime = this.results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / 
      this.results.filter(r => r.responseTime).length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`📊 Overall Results:`);
    console.log(`   ✅ Successful: ${successfulTests}/${totalTests} (${(successfulTests/totalTests*100).toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${failedTests}/${totalTests} (${(failedTests/totalTests*100).toFixed(1)}%)`);
    console.log(`   ⏱️  Average Response Time: ${avgResponseTime?.toFixed(0) || 'N/A'}ms`);
    
    if (failedTests > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   - ${result.name}:`);
        result.issues?.forEach(issue => console.log(`     • ${issue}`));
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach(warning => console.log(`   ${warning}`));
    }
    
    // Performance Analysis
    console.log(`\n⚡ PERFORMANCE ANALYSIS:`);
    const slowTests = this.results.filter(r => r.responseTime > 5000);
    if (slowTests.length > 0) {
      console.log(`   🐌 Slow responses (>5s):`);
      slowTests.forEach(test => {
        console.log(`     - ${test.name}: ${test.responseTime}ms`);
      });
    } else {
      console.log(`   ✅ All responses under 5 seconds`);
    }
    
    // Feature Status
    console.log(`\n🎯 FEATURE STATUS:`);
    const featureGroups = {
      'Chatbot': ['Chatbot - Basic Query', 'Chatbot - Complex Query'],
      'Irrigation': ['Irrigation Prediction', 'Irrigation Optimization'],
      'Early Warning': ['Early Warning Analysis', 'Early Warning Dashboard'],
      'Image Analysis': ['Image Analysis History'],
      'Self Learning': ['Self Learning Feedback', 'Self Learning Historical Analysis', 'Self Learning Model Status'],
      'Automation': ['Automation Setup', 'Automation Dashboard'],
      'System': ['Health Check', 'API Documentation', 'AI Statistics']
    };
    
    Object.entries(featureGroups).forEach(([feature, tests]) => {
      const featureResults = this.results.filter(r => tests.includes(r.name));
      const featureSuccess = featureResults.filter(r => r.success).length;
      const status = featureSuccess === featureResults.length ? '✅' : 
                    featureSuccess > 0 ? '⚠️' : '❌';
      console.log(`   ${status} ${feature}: ${featureSuccess}/${featureResults.length}`);
    });
    
    // Final Assessment
    console.log(`\n🏆 FINAL ASSESSMENT:`);
    if (successfulTests === totalTests) {
      console.log(`   🎉 EXCELLENT! All AI features working perfectly!`);
    } else if (successfulTests >= totalTests * 0.8) {
      console.log(`   👍 GOOD! Most features working, minor issues to fix.`);
    } else if (successfulTests >= totalTests * 0.6) {
      console.log(`   ⚠️  FAIR! Several issues need attention.`);
    } else {
      console.log(`   🚨 POOR! Major issues require immediate fixing.`);
    }
    
    console.log('\n🌱 AI Service Comprehensive Test Complete!');
    console.log('='.repeat(60));
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        successful: successfulTests,
        failed: failedTests,
        successRate: successfulTests/totalTests*100,
        avgResponseTime
      },
      results: this.results,
      errors: this.errors,
      warnings: this.warnings
    };
    
    fs.writeFileSync('test-report.json', JSON.stringify(reportData, null, 2));
    console.log('📄 Detailed report saved to: test-report.json');
  }
}

// Run comprehensive tests
const testSuite = new AITestSuite();
testSuite.runComprehensiveTests().catch(console.error);