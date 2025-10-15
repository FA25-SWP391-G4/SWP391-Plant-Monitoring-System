#!/usr/bin/env node

/**
 * Comprehensive AI Features Testing Script
 * Kiểm tra tất cả các tính năng AI của hệ thống Plant Monitoring
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const AI_SERVICE_URL = 'http://localhost:3001';
const TEST_RESULTS = {
  chatbot: { passed: 0, failed: 0, tests: [] },
  imageRecognition: { passed: 0, failed: 0, tests: [] },
  irrigationPrediction: { passed: 0, failed: 0, tests: [] },
  earlyWarning: { passed: 0, failed: 0, tests: [] },
  automation: { passed: 0, failed: 0, tests: [] },
  selfLearning: { passed: 0, failed: 0, tests: [] },
  historicalAnalysis: { passed: 0, failed: 0, tests: [] }
};

// Utility functions
function logTest(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}${details ? ` - ${details}` : ''}`);
}

function addTestResult(feature, testName, success, details = '') {
  TEST_RESULTS[feature].tests.push({ name: testName, success, details });
  if (success) {
    TEST_RESULTS[feature].passed++;
  } else {
    TEST_RESULTS[feature].failed++;
  }
}

async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`);
    const success = response.status === 200 && response.data.status === 'OK';
    logTest('Health Check', success);
    return success;
  } catch (error) {
    logTest('Health Check', false, error.message);
    return false;
  }
}

async function testChatbot() {
  console.log('\n🤖 Testing Chatbot Features...');
  
  // Test 1: Basic message handling
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/chatbot/message`, {
      message: 'Cây của tôi cần tưới nước không?',
      userId: 'test_user',
      plantId: '1'
    });
    const success = response.data.success && response.data.response;
    addTestResult('chatbot', 'Basic Message Handling', success);
    logTest('Basic Message Handling', success);
  } catch (error) {
    addTestResult('chatbot', 'Basic Message Handling', false, error.message);
    logTest('Basic Message Handling', false, error.message);
  }

  // Test 2: Context-aware responses
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/chatbot/message`, {
      message: 'Độ ẩm đất hiện tại là bao nhiêu?',
      userId: 'test_user',
      plantId: '1'
    });
    const success = response.data.success && response.data.response.includes('độ ẩm');
    addTestResult('chatbot', 'Context-aware Responses', success);
    logTest('Context-aware Responses', success);
  } catch (error) {
    addTestResult('chatbot', 'Context-aware Responses', false, error.message);
    logTest('Context-aware Responses', false, error.message);
  }

  // Test 3: Error handling
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/chatbot/message`, {
      message: '',
      userId: 'test_user',
      plantId: '1'
    });
    const success = !response.data.success;
    addTestResult('chatbot', 'Error Handling', success);
    logTest('Error Handling', success);
  } catch (error) {
    addTestResult('chatbot', 'Error Handling', true); // Expected to fail
    logTest('Error Handling', true);
  }
}

async function testImageRecognition() {
  console.log('\n📸 Testing Image Recognition...');
  
  // Test 1: Image analysis endpoint
  try {
    // Create a simple test image
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    if (!fs.existsSync(testImagePath)) {
      // Create a minimal test image
      const testImageBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      fs.writeFileSync(testImagePath, testImageBuffer);
    }

    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    formData.append('plantId', '1');
    formData.append('userId', 'test_user');

    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/image/analyze`, formData, {
      headers: formData.getHeaders()
    });
    
    const success = response.data.success;
    addTestResult('imageRecognition', 'Image Analysis', success);
    logTest('Image Analysis', success);
  } catch (error) {
    addTestResult('imageRecognition', 'Image Analysis', false, error.message);
    logTest('Image Analysis', false, error.message);
  }

  // Test 2: Analysis history
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/ai/image/history/test_user`);
    const success = Array.isArray(response.data);
    addTestResult('imageRecognition', 'Analysis History', success);
    logTest('Analysis History', success);
  } catch (error) {
    addTestResult('imageRecognition', 'Analysis History', false, error.message);
    logTest('Analysis History', false, error.message);
  }
}

async function testIrrigationPrediction() {
  console.log('\n💧 Testing Irrigation Prediction...');
  
  // Test 1: Basic prediction
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/irrigation/predict/1`, {
      options: { includeConfidence: true }
    });
    const success = response.data.success && response.data.prediction;
    addTestResult('irrigationPrediction', 'Basic Prediction', success);
    logTest('Basic Prediction', success);
  } catch (error) {
    addTestResult('irrigationPrediction', 'Basic Prediction', false, error.message);
    logTest('Basic Prediction', false, error.message);
  }

  // Test 2: Schedule optimization
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/irrigation/optimize/1`, {
      userId: 'test_user',
      preferences: { maxWaterPerDay: 1000 }
    });
    const success = response.data.success && response.data.schedule;
    addTestResult('irrigationPrediction', 'Schedule Optimization', success);
    logTest('Schedule Optimization', success);
  } catch (error) {
    addTestResult('irrigationPrediction', 'Schedule Optimization', false, error.message);
    logTest('Schedule Optimization', false, error.message);
  }
}

async function testEarlyWarning() {
  console.log('\n⚠️ Testing Early Warning System...');
  
  // Test 1: Risk analysis
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/warning/analyze/1`, {
      options: { includeTrends: true }
    });
    const success = response.data.success && response.data.alerts;
    addTestResult('earlyWarning', 'Risk Analysis', success);
    logTest('Risk Analysis', success);
  } catch (error) {
    addTestResult('earlyWarning', 'Risk Analysis', false, error.message);
    logTest('Risk Analysis', false, error.message);
  }

  // Test 2: Dashboard data
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/ai/warning/dashboard/1`);
    const success = response.data.success && response.data.alerts;
    addTestResult('earlyWarning', 'Dashboard Data', success);
    logTest('Dashboard Data', success);
  } catch (error) {
    addTestResult('earlyWarning', 'Dashboard Data', false, error.message);
    logTest('Dashboard Data', false, error.message);
  }
}

async function testAutomation() {
  console.log('\n🤖 Testing Automation System...');
  
  // Test 1: Setup automation
  try {
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

    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/automation/setup/1`, automationConfig);
    const success = response.data.success && response.data.automationId;
    addTestResult('automation', 'Setup Automation', success);
    logTest('Setup Automation', success);
  } catch (error) {
    addTestResult('automation', 'Setup Automation', false, error.message);
    logTest('Setup Automation', false, error.message);
  }

  // Test 2: Automation dashboard
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/ai/automation/dashboard`);
    const success = response.data.success && Array.isArray(response.data.automations);
    addTestResult('automation', 'Automation Dashboard', success);
    logTest('Automation Dashboard', success);
  } catch (error) {
    addTestResult('automation', 'Automation Dashboard', false, error.message);
    logTest('Automation Dashboard', false, error.message);
  }
}

async function testSelfLearning() {
  console.log('\n🧠 Testing Self-Learning System...');
  
  // Test 1: Collect feedback
  try {
    const feedbackData = {
      plantId: '1',
      userId: 'test_user',
      predictionId: 'test_prediction',
      actualOutcome: 'good',
      accuracy: 0.85,
      userSatisfaction: 4,
      comments: 'Prediction was accurate'
    };

    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/learning/feedback`, feedbackData);
    const success = response.data.success;
    addTestResult('selfLearning', 'Collect Feedback', success);
    logTest('Collect Feedback', success);
  } catch (error) {
    addTestResult('selfLearning', 'Collect Feedback', false, error.message);
    logTest('Collect Feedback', false, error.message);
  }

  // Test 2: Model improvement
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/learning/improve`, {
      plantId: '1',
      forceUpdate: false
    });
    const success = response.data.success;
    addTestResult('selfLearning', 'Model Improvement', success);
    logTest('Model Improvement', success);
  } catch (error) {
    addTestResult('selfLearning', 'Model Improvement', false, error.message);
    logTest('Model Improvement', false, error.message);
  }
}

async function testHistoricalAnalysis() {
  console.log('\n📊 Testing Historical Analysis...');
  
  // Test 1: Historical data analysis
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/ai/historical/analyze/1?period=30`);
    const success = response.data.success && response.data.analysis;
    addTestResult('historicalAnalysis', 'Historical Analysis', success);
    logTest('Historical Analysis', success);
  } catch (error) {
    addTestResult('historicalAnalysis', 'Historical Analysis', false, error.message);
    logTest('Historical Analysis', false, error.message);
  }

  // Test 2: Trend prediction
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/historical/predict/1`, {
      period: 7,
      includeFactors: true
    });
    const success = response.data.success && response.data.predictions;
    addTestResult('historicalAnalysis', 'Trend Prediction', success);
    logTest('Trend Prediction', success);
  } catch (error) {
    addTestResult('historicalAnalysis', 'Trend Prediction', false, error.message);
    logTest('Trend Prediction', false, error.message);
  }
}

async function testIntegration() {
  console.log('\n🔗 Testing Integration Features...');
  
  // Test 1: Comprehensive analysis
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/analyze/comprehensive/1`, {
      includeImageAnalysis: false, // Skip image analysis for now
      includePrediction: true,
      includeWarning: true,
      includeRecommendations: true
    });
    const success = response.data.success && response.data.analysis;
    logTest('Comprehensive Analysis', success);
  } catch (error) {
    logTest('Comprehensive Analysis', false, error.message);
  }

  // Test 2: System statistics
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/ai/statistics`);
    const success = response.data.success && response.data.features;
    logTest('System Statistics', success);
  } catch (error) {
    logTest('System Statistics', false, error.message);
  }
}

function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(60));

  let totalPassed = 0;
  let totalFailed = 0;

  Object.entries(TEST_RESULTS).forEach(([feature, results]) => {
    const total = results.passed + results.failed;
    const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`\n${feature.toUpperCase()}:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  📊 Success Rate: ${percentage}%`);
    
    if (results.tests.length > 0) {
      console.log('  📝 Test Details:');
      results.tests.forEach(test => {
        const status = test.success ? '✅' : '❌';
        console.log(`    ${status} ${test.name}${test.details ? ` - ${test.details}` : ''}`);
      });
    }
    
    totalPassed += results.passed;
    totalFailed += results.failed;
  });

  const overallTotal = totalPassed + totalFailed;
  const overallPercentage = overallTotal > 0 ? ((totalPassed / overallTotal) * 100).toFixed(1) : 0;

  console.log('\n' + '='.repeat(60));
  console.log('📊 OVERALL RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Total Passed: ${totalPassed}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  console.log(`📊 Overall Success Rate: ${overallPercentage}%`);

  if (overallPercentage >= 80) {
    console.log('\n🎉 EXCELLENT! System is working well!');
  } else if (overallPercentage >= 60) {
    console.log('\n⚠️ GOOD! Some issues need attention.');
  } else {
    console.log('\n🚨 NEEDS ATTENTION! Multiple issues detected.');
  }

  console.log('\n' + '='.repeat(60));
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive AI Features Testing...');
  console.log(`🔗 Testing against: ${AI_SERVICE_URL}`);
  
  // Check if service is running
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ AI Service is not running or not accessible!');
    console.log('Please start the AI service first:');
    console.log('  cd ai-service && npm start');
    process.exit(1);
  }

  // Run all feature tests
  await testChatbot();
  await testImageRecognition();
  await testIrrigationPrediction();
  await testEarlyWarning();
  await testAutomation();
  await testSelfLearning();
  await testHistoricalAnalysis();
  await testIntegration();

  // Generate comprehensive report
  generateReport();
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testChatbot,
  testImageRecognition,
  testIrrigationPrediction,
  testEarlyWarning,
  testAutomation,
  testSelfLearning,
  testHistoricalAnalysis
};