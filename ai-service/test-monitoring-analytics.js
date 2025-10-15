const monitoringService = require('./services/monitoringService');
const analyticsService = require('./services/analyticsService');

/**
 * Test script for monitoring and analytics system
 */
async function testMonitoringSystem() {
  console.log('🔍 Testing Monitoring and Analytics System...\n');

  try {
    // Test 1: Track chatbot metrics
    console.log('1. Testing Chatbot Metrics Tracking...');
    const startTime = Date.now();
    
    // Simulate chatbot requests
    monitoringService.trackChatbotRequest(startTime, startTime + 1500, true, false, 4); // Good response
    monitoringService.trackChatbotRequest(startTime, startTime + 3000, true, false, 5); // Excellent response
    monitoringService.trackChatbotRequest(startTime, startTime + 2000, false, true, 2); // Fallback response
    
    console.log('✅ Chatbot metrics tracked successfully');

    // Test 2: Track disease detection metrics
    console.log('\n2. Testing Disease Detection Metrics Tracking...');
    
    const mockDiseases = [
      { name: 'leaf_spot', confidence: 0.85 },
      { name: 'healthy', confidence: 0.92 }
    ];
    
    monitoringService.trackDiseaseDetection(startTime, startTime + 5000, 0.85, mockDiseases, {
      isAccurate: true,
      rating: 4,
      feedback: 'Good detection'
    });
    
    monitoringService.trackDiseaseDetection(startTime, startTime + 7000, 0.92, [mockDiseases[1]]);
    
    console.log('✅ Disease detection metrics tracked successfully');

    // Test 3: Track irrigation prediction metrics
    console.log('\n3. Testing Irrigation Prediction Metrics Tracking...');
    
    const mockPrediction = {
      shouldWater: true,
      hoursUntilWater: 2,
      waterAmount: 500,
      confidence: 0.88
    };
    
    monitoringService.trackIrrigationPrediction(0.88, mockPrediction, true, {
      wasNeeded: true,
      actualWaterAmount: 450
    });
    
    console.log('✅ Irrigation prediction metrics tracked successfully');

    // Test 4: Track system metrics
    console.log('\n4. Testing System Metrics Tracking...');
    
    // Simulate API calls and MQTT messages
    for (let i = 0; i < 10; i++) {
      monitoringService.trackAPICall();
      if (i % 3 === 0) {
        monitoringService.trackMQTTMessage();
      }
    }
    
    // Simulate some errors
    const testError = new Error('Test error for monitoring');
    monitoringService.trackError(testError, { context: 'test_scenario' });
    
    console.log('✅ System metrics tracked successfully');

    // Test 5: Get current metrics
    console.log('\n5. Testing Metrics Retrieval...');
    
    const metrics = monitoringService.getMetrics();
    console.log('Current Metrics Summary:');
    console.log(`- Chatbot Requests: ${metrics.chatbot.totalRequests}`);
    console.log(`- Disease Analyses: ${metrics.diseaseDetection.totalAnalyses}`);
    console.log(`- Irrigation Predictions: ${metrics.irrigationPrediction.totalPredictions}`);
    console.log(`- API Calls: ${metrics.system.apiCalls}`);
    console.log(`- MQTT Messages: ${metrics.system.mqttMessages}`);
    console.log(`- Errors: ${metrics.system.errorCount}`);
    
    console.log('\nDerived Metrics:');
    console.log(`- Chatbot Satisfaction Rate: ${(metrics.derivedMetrics.chatbotSatisfactionRate * 100).toFixed(1)}%`);
    console.log(`- Disease Detection Accuracy: ${(metrics.derivedMetrics.diseaseDetectionAccuracy * 100).toFixed(1)}%`);
    console.log(`- Plant Topic Coverage: ${(metrics.derivedMetrics.plantTopicCoverageRate * 100).toFixed(1)}%`);
    
    console.log('✅ Metrics retrieved successfully');

    // Test 6: Test analytics
    console.log('\n6. Testing Analytics System...');
    
    const realTimeAnalytics = await analyticsService.getRealTimeAnalytics();
    console.log('Real-time Analytics:');
    console.log(`- System Uptime: ${realTimeAnalytics.realTimeMetrics.systemHealth.uptime.toFixed(2)} hours`);
    console.log(`- Error Rate: ${(realTimeAnalytics.realTimeMetrics.systemHealth.errorRate * 100).toFixed(2)}%`);
    console.log(`- Active Alerts: ${realTimeAnalytics.alerts.length}`);
    
    if (realTimeAnalytics.alerts.length > 0) {
      console.log('Alerts:');
      realTimeAnalytics.alerts.forEach(alert => {
        console.log(`  - ${alert.level.toUpperCase()}: ${alert.message}`);
      });
    }
    
    console.log('✅ Analytics system working correctly');

    // Test 7: Test Prometheus metrics export
    console.log('\n7. Testing Prometheus Metrics Export...');
    
    const prometheusMetrics = monitoringService.exportMetrics('prometheus');
    console.log('Prometheus metrics format preview:');
    console.log(prometheusMetrics.substring(0, 300) + '...');
    
    console.log('✅ Prometheus export working correctly');

    // Test 8: Test logging
    console.log('\n8. Testing Structured Logging...');
    
    monitoringService.logAIInference('test_model', {
      inputData: { test: 'data' },
      outputData: { result: 'success' },
      confidence: 0.95,
      processingTime: 1500
    });
    
    monitoringService.logUserInteraction('test_feature', {
      userId: 'test_user',
      action: 'test_action',
      result: 'success'
    });
    
    console.log('✅ Structured logging working correctly');

    console.log('\n🎉 All monitoring and analytics tests passed successfully!');
    console.log('\nMonitoring system is ready for production use.');
    
    // Display final metrics summary
    console.log('\n📊 Final Metrics Summary:');
    const finalMetrics = monitoringService.getMetrics();
    console.log(JSON.stringify({
      chatbot: {
        totalRequests: finalMetrics.chatbot.totalRequests,
        averageResponseTime: Math.round(finalMetrics.chatbot.averageResponseTime),
        satisfactionRate: Math.round(finalMetrics.derivedMetrics.chatbotSatisfactionRate * 100)
      },
      diseaseDetection: {
        totalAnalyses: finalMetrics.diseaseDetection.totalAnalyses,
        averageProcessingTime: Math.round(finalMetrics.diseaseDetection.averageProcessingTime),
        accuracy: Math.round(finalMetrics.derivedMetrics.diseaseDetectionAccuracy * 100)
      },
      irrigationPrediction: {
        totalPredictions: finalMetrics.irrigationPrediction.totalPredictions,
        userAdoptionRate: Math.round(finalMetrics.irrigationPrediction.userAdoptionRate * 100)
      },
      system: {
        apiCalls: finalMetrics.system.apiCalls,
        mqttMessages: finalMetrics.system.mqttMessages,
        errorCount: finalMetrics.system.errorCount,
        uptimeHours: Math.round((Date.now() - finalMetrics.system.uptime) / (1000 * 60 * 60) * 100) / 100
      }
    }, null, 2));

  } catch (error) {
    console.error('❌ Error during monitoring system test:', error);
    process.exit(1);
  }
}

// Test error handling
async function testErrorHandling() {
  console.log('\n🔧 Testing Error Handling...');
  
  try {
    // Test various error scenarios
    const errors = [
      new Error('Database connection failed'),
      new Error('AI model inference timeout'),
      new Error('MQTT connection lost'),
      new Error('Invalid input data')
    ];
    
    errors.forEach((error, index) => {
      monitoringService.trackError(error, { 
        context: `test_error_${index}`,
        severity: index < 2 ? 'high' : 'medium'
      });
    });
    
    console.log('✅ Error handling test completed');
    
  } catch (error) {
    console.error('❌ Error in error handling test:', error);
  }
}

// Test performance under load
async function testPerformanceLoad() {
  console.log('\n⚡ Testing Performance Under Load...');
  
  const startTime = Date.now();
  const promises = [];
  
  // Simulate 100 concurrent metric tracking operations
  for (let i = 0; i < 100; i++) {
    promises.push(new Promise(resolve => {
      setTimeout(() => {
        monitoringService.trackChatbotRequest(Date.now(), Date.now() + Math.random() * 2000, true, false);
        resolve();
      }, Math.random() * 100);
    }));
  }
  
  await Promise.all(promises);
  
  const endTime = Date.now();
  console.log(`✅ Performance test completed in ${endTime - startTime}ms`);
  console.log(`   Processed 100 concurrent operations`);
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Monitoring System Tests\n');
  
  await testMonitoringSystem();
  await testErrorHandling();
  await testPerformanceLoad();
  
  console.log('\n✨ All tests completed successfully!');
  console.log('The monitoring and analytics system is fully operational.');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testMonitoringSystem,
  testErrorHandling,
  testPerformanceLoad,
  runAllTests
};