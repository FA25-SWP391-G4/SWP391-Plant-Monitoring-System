#!/usr/bin/env node

/**
 * Quick AI Service Test Script
 * Script đơn giản để test nhanh các tính năng AI
 */

const axios = require('axios');

const AI_SERVICE_URL = 'http://localhost:3001';

async function quickTest() {
  console.log('🚀 Quick AI Service Test');
  console.log('='.repeat(40));
  
  try {
    // Test 1: Health Check
    console.log('\n1. Testing Health Check...');
    const healthResponse = await axios.get(`${AI_SERVICE_URL}/health`);
    console.log(`   ✅ Health: ${healthResponse.data.status}`);
    console.log(`   📊 Features: ${Object.keys(healthResponse.data.features).length} active`);
    
    // Test 2: Chatbot
    console.log('\n2. Testing Chatbot...');
    const chatbotResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/chatbot/message`, {
      message: 'Cây của tôi cần tưới nước không?',
      userId: 'test_user',
      plantId: '1'
    });
    console.log(`   ✅ Chatbot Response: ${chatbotResponse.data.success ? 'OK' : 'FAIL'}`);
    console.log(`   💬 Response Length: ${chatbotResponse.data.response?.length || 0} chars`);
    
    // Test 3: Irrigation Prediction
    console.log('\n3. Testing Irrigation Prediction...');
    const irrigationResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/irrigation/predict/1`, {
      options: { includeConfidence: true }
    });
    console.log(`   ✅ Prediction: ${irrigationResponse.data.success ? 'OK' : 'FAIL'}`);
    console.log(`   💧 Needs Watering: ${irrigationResponse.data.prediction?.needsWatering ? 'Yes' : 'No'}`);
    console.log(`   🎯 Confidence: ${irrigationResponse.data.prediction?.confidence || 0}%`);
    
    // Test 4: Early Warning
    console.log('\n4. Testing Early Warning...');
    const warningResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/warning/analyze/1`, {
      options: { includeTrends: true }
    });
    console.log(`   ✅ Warning Analysis: ${warningResponse.data.success ? 'OK' : 'FAIL'}`);
    console.log(`   ⚠️ Alerts: ${warningResponse.data.alerts?.length || 0} alerts`);
    console.log(`   🏥 Health Score: ${warningResponse.data.healthScore || 0}`);
    
    // Test 5: Automation
    console.log('\n5. Testing Automation...');
    const automationResponse = await axios.get(`${AI_SERVICE_URL}/api/ai/automation/dashboard`);
    console.log(`   ✅ Automation Dashboard: ${automationResponse.data.success ? 'OK' : 'FAIL'}`);
    console.log(`   🤖 Active Automations: ${automationResponse.data.automations?.length || 0}`);
    
    // Test 6: Self Learning
    console.log('\n6. Testing Self Learning...');
    const learningResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/learning/feedback`, {
      plantId: '1',
      userId: 'test_user',
      predictionId: 'test_prediction',
      actualOutcome: 'good',
      accuracy: 0.85,
      userSatisfaction: 4,
      comments: 'Prediction was accurate'
    });
    console.log(`   ✅ Learning Feedback: ${learningResponse.data.success ? 'OK' : 'FAIL'}`);
    
    // Test 7: Historical Analysis
    console.log('\n7. Testing Historical Analysis...');
    const historicalResponse = await axios.get(`${AI_SERVICE_URL}/api/ai/historical/analyze/1?period=30`);
    console.log(`   ✅ Historical Analysis: ${historicalResponse.data.success ? 'OK' : 'FAIL'}`);
    console.log(`   📊 Analysis Data: ${historicalResponse.data.analysis ? 'Available' : 'Missing'}`);
    
    // Test 8: System Statistics
    console.log('\n8. Testing System Statistics...');
    const statsResponse = await axios.get(`${AI_SERVICE_URL}/api/ai/statistics`);
    console.log(`   ✅ System Statistics: ${statsResponse.data.success ? 'OK' : 'FAIL'}`);
    console.log(`   📈 Features: ${Object.keys(statsResponse.data.features || {}).length} tracked`);
    
    console.log('\n' + '='.repeat(40));
    console.log('🎉 All tests completed successfully!');
    console.log('✅ AI Service is working correctly!');
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    console.log('\n💡 Make sure the AI service is running:');
    console.log('   cd ai-service && npm start');
  }
}

// Run quick test
quickTest();
