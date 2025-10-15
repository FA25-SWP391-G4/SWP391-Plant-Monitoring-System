#!/usr/bin/env node

/**
 * AI Service Debug and Testing Script
 * Script để debug và kiểm tra tất cả các tính năng AI
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const AI_SERVICE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 10000; // 10 seconds

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().substr(11, 8);
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🔍'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function addTestResult(testName, success, details = '') {
  testResults.total++;
  if (success) {
    testResults.passed++;
    log(`${testName} - PASSED`, 'success');
  } else {
    testResults.failed++;
    log(`${testName} - FAILED: ${details}`, 'error');
  }
  
  testResults.details.push({
    name: testName,
    success,
    details,
    timestamp: new Date().toISOString()
  });
}

async function makeRequest(method, url, data = null, timeout = TEST_TIMEOUT) {
  try {
    const config = {
      method,
      url: `${AI_SERVICE_URL}${url}`,
      timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status || 0,
      data: error.response?.data || null
    };
  }
}

// Test functions
async function testHealthCheck() {
  log('Testing Health Check...', 'debug');
  const result = await makeRequest('GET', '/health');
  addTestResult('Health Check', result.success && result.data.status === 'OK', result.error);
  return result.success;
}

async function testChatbotFeatures() {
  log('Testing Chatbot Features...', 'debug');
  
  // Test 1: Basic message handling
  const messageResult = await makeRequest('POST', '/api/ai/chatbot/message', {
    message: 'Cây của tôi cần tưới nước không?',
    userId: 'test_user',
    plantId: '1'
  });
  addTestResult('Chatbot - Basic Message', 
    messageResult.success && messageResult.data.success, 
    messageResult.error);

  // Test 2: Context-aware responses
  const contextResult = await makeRequest('POST', '/api/ai/chatbot/message', {
    message: 'Độ ẩm đất hiện tại là bao nhiêu?',
    userId: 'test_user',
    plantId: '1'
  });
  addTestResult('Chatbot - Context Aware', 
    contextResult.success && contextResult.data.success, 
    contextResult.error);

  // Test 3: Error handling
  const errorResult = await makeRequest('POST', '/api/ai/chatbot/message', {
    message: '',
    userId: 'test_user',
    plantId: '1'
  });
  addTestResult('Chatbot - Error Handling', 
    errorResult.success && !errorResult.data.success, 
    errorResult.error);
}

async function testImageRecognition() {
  log('Testing Image Recognition...', 'debug');
  
  // Test 1: Image analysis endpoint
  try {
    // Create a simple test image
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    if (!fs.existsSync(testImagePath)) {
      const testImageBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      fs.writeFileSync(testImagePath, testImageBuffer);
    }

    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    formData.append('plantId', '1');
    formData.append('userId', 'test_user');

    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/image/analyze`, formData, {
      headers: formData.getHeaders(),
      timeout: TEST_TIMEOUT
    });
    
    addTestResult('Image Recognition - Analysis', response.data.success, 'Image analysis failed');
  } catch (error) {
    addTestResult('Image Recognition - Analysis', false, error.message);
  }

  // Test 2: Analysis history
  const historyResult = await makeRequest('GET', '/api/ai/image/history/test_user');
  addTestResult('Image Recognition - History', 
    historyResult.success && Array.isArray(historyResult.data), 
    historyResult.error);
}

async function testIrrigationPrediction() {
  log('Testing Irrigation Prediction...', 'debug');
  
  // Test 1: Basic prediction
  const predictionResult = await makeRequest('POST', '/api/ai/irrigation/predict/1', {
    options: { includeConfidence: true }
  });
  addTestResult('Irrigation - Basic Prediction', 
    predictionResult.success && predictionResult.data.success && predictionResult.data.prediction, 
    predictionResult.error);

  // Test 2: Schedule optimization
  const optimizationResult = await makeRequest('POST', '/api/ai/irrigation/optimize/1', {
    userId: 'test_user',
    preferences: { maxWaterPerDay: 1000 }
  });
  addTestResult('Irrigation - Schedule Optimization', 
    optimizationResult.success && optimizationResult.data.success && optimizationResult.data.schedule, 
    optimizationResult.error);
}

async function testEarlyWarning() {
  log('Testing Early Warning System...', 'debug');
  
  // Test 1: Risk analysis
  const analysisResult = await makeRequest('POST', '/api/ai/warning/analyze/1', {
    options: { includeTrends: true }
  });
  addTestResult('Early Warning - Risk Analysis', 
    analysisResult.success && analysisResult.data.success && analysisResult.data.alerts, 
    analysisResult.error);

  // Test 2: Dashboard data
  const dashboardResult = await makeRequest('GET', '/api/ai/warning/dashboard/1');
  addTestResult('Early Warning - Dashboard', 
    dashboardResult.success && dashboardResult.data.success && dashboardResult.data.alerts, 
    dashboardResult.error);
}

async function testAutomation() {
  log('Testing Automation System...', 'debug');
  
  // Test 1: Setup automation
  const automationConfig = {
    enabled: true,
    mode: 'smart',
    triggers: [
      {
        type: 'sensor_threshold',
        parameter: 'soilMoisture',
        operator: 'less_than',
        value: 30,
        action: { type: 'irrigation', amount: 200 }
      }
    ],
    actions: [
      { type: 'irrigation', amount: 200 }
    ],
    constraints: {
      maxAmountPerIrrigation: 500
    }
  };

  const setupResult = await makeRequest('POST', '/api/ai/automation/setup/1', automationConfig);
  addTestResult('Automation - Setup', 
    setupResult.success && setupResult.data.success && setupResult.data.automationId, 
    setupResult.error);

  // Test 2: Automation dashboard
  const dashboardResult = await makeRequest('GET', '/api/ai/automation/dashboard');
  addTestResult('Automation - Dashboard', 
    dashboardResult.success && dashboardResult.data.success && Array.isArray(dashboardResult.data.automations), 
    dashboardResult.error);
}

async function testSelfLearning() {
  log('Testing Self-Learning System...', 'debug');
  
  // Test 1: Collect feedback
  const feedbackData = {
    plantId: '1',
    userId: 'test_user',
    predictionId: 'test_prediction',
    actualOutcome: 'good',
    accuracy: 0.85,
    userSatisfaction: 4,
    comments: 'Prediction was accurate'
  };

  const feedbackResult = await makeRequest('POST', '/api/ai/learning/feedback', feedbackData);
  addTestResult('Self-Learning - Collect Feedback', 
    feedbackResult.success && feedbackResult.data.success, 
    feedbackResult.error);

  // Test 2: Model improvement
  const improvementResult = await makeRequest('POST', '/api/ai/learning/improve', {
    plantId: '1',
    forceUpdate: false
  });
  addTestResult('Self-Learning - Model Improvement', 
    improvementResult.success && improvementResult.data.success, 
    improvementResult.error);
}

async function testHistoricalAnalysis() {
  log('Testing Historical Analysis...', 'debug');
  
  // Test 1: Historical data analysis
  const analysisResult = await makeRequest('GET', '/api/ai/historical/analyze/1?period=30');
  addTestResult('Historical Analysis - Data Analysis', 
    analysisResult.success && analysisResult.data.success && analysisResult.data.analysis, 
    analysisResult.error);

  // Test 2: Trend prediction
  const predictionResult = await makeRequest('POST', '/api/ai/historical/predict/1', {
    period: 7,
    includeFactors: true
  });
  addTestResult('Historical Analysis - Trend Prediction', 
    predictionResult.success && predictionResult.data.success && predictionResult.data.predictions, 
    predictionResult.error);
}

async function testIntegrationFeatures() {
  log('Testing Integration Features...', 'debug');
  
  // Test 1: Comprehensive analysis
  const comprehensiveResult = await makeRequest('POST', '/api/ai/analyze/comprehensive/1', {
    includeImageAnalysis: false,
    includePrediction: true,
    includeWarning: true,
    includeRecommendations: true
  });
  addTestResult('Integration - Comprehensive Analysis', 
    comprehensiveResult.success && comprehensiveResult.data.success && comprehensiveResult.data.analysis, 
    comprehensiveResult.error);

  // Test 2: System statistics
  const statsResult = await makeRequest('GET', '/api/ai/statistics');
  addTestResult('Integration - System Statistics', 
    statsResult.success && statsResult.data.success && statsResult.data.features, 
    statsResult.error);
}

async function testDatabaseConnections() {
  log('Testing Database Connections...', 'debug');
  
  // Test 1: Check if services can access data
  const sensorResult = await makeRequest('GET', '/api/ai/sensor/latest/1');
  addTestResult('Database - Sensor Data Access', 
    sensorResult.success && sensorResult.data.success, 
    sensorResult.error);

  // Test 2: Check plant info access
  const plantResult = await makeRequest('GET', '/api/ai/plant/info/1');
  addTestResult('Database - Plant Info Access', 
    plantResult.success && plantResult.data.success, 
    plantResult.error);
}

function generateReport() {
  log('Generating Test Report...', 'debug');
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 AI SERVICE TEST REPORT');
  console.log('='.repeat(60));
  
  const successRate = testResults.total > 0 ? ((testResults.passed / testResults.total) * 100).toFixed(1) : 0;
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   Passed: ${testResults.passed}`);
  console.log(`   Failed: ${testResults.failed}`);
  console.log(`   Success Rate: ${successRate}%`);
  
  console.log(`\n📝 DETAILED RESULTS:`);
  testResults.details.forEach(test => {
    const status = test.success ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} ${test.name}`);
    if (!test.success && test.details) {
      console.log(`      Error: ${test.details}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (successRate >= 80) {
    log('🎉 EXCELLENT! Most features are working correctly!', 'success');
  } else if (successRate >= 60) {
    log('⚠️ GOOD! Some features need attention.', 'warning');
  } else {
    log('🚨 NEEDS ATTENTION! Multiple issues detected.', 'error');
  }
  
  console.log('='.repeat(60));
  
  // Save report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: parseFloat(successRate)
    },
    details: testResults.details
  };
  
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  log(`Test report saved to: ${reportPath}`, 'info');
}

async function runAllTests() {
  log('🚀 Starting AI Service Debug and Testing...', 'info');
  log(`🔗 Testing against: ${AI_SERVICE_URL}`, 'info');
  
  try {
    // Check if service is running
    const healthOk = await testHealthCheck();
    if (!healthOk) {
      log('❌ AI Service is not running or not accessible!', 'error');
      log('Please start the AI service first:', 'info');
      log('  cd ai-service && npm start', 'info');
      process.exit(1);
    }

    // Run all feature tests
    await testChatbotFeatures();
    await testImageRecognition();
    await testIrrigationPrediction();
    await testEarlyWarning();
    await testAutomation();
    await testSelfLearning();
    await testHistoricalAnalysis();
    await testIntegrationFeatures();
    await testDatabaseConnections();

    // Generate comprehensive report
    generateReport();
    
  } catch (error) {
    log(`❌ Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testHealthCheck,
  testChatbotFeatures,
  testImageRecognition,
  testIrrigationPrediction,
  testEarlyWarning,
  testAutomation,
  testSelfLearning,
  testHistoricalAnalysis,
  testIntegrationFeatures,
  testDatabaseConnections
};
