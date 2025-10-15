/**
 * Simple Integration Test
 * Basic test to verify integration components are working
 */

const systemIntegrationService = require('../services/systemIntegrationService');
const { logger } = require('../utils/logger');

async function runSimpleIntegrationTest() {
  console.log('🧪 Running Simple Integration Test...');
  console.log('====================================');

  const results = {
    serviceIntegration: false,
    integrationStatus: false,
    errors: []
  };

  try {
    // Test 1: Check if system integration service loads
    console.log('\n1️⃣ Testing System Integration Service...');
    if (systemIntegrationService) {
      console.log('✅ System Integration Service loaded successfully');
      results.serviceIntegration = true;
    } else {
      throw new Error('System Integration Service failed to load');
    }

    // Test 2: Get integration status
    console.log('\n2️⃣ Testing Integration Status...');
    const status = systemIntegrationService.getIntegrationStatus();
    if (status && status.services && status.timestamp) {
      console.log('✅ Integration status retrieved successfully');
      console.log(`   Services: ${Object.keys(status.services).join(', ')}`);
      console.log(`   Timestamp: ${status.timestamp}`);
      results.integrationStatus = true;
    } else {
      throw new Error('Failed to get integration status');
    }

    // Test 3: Test MQTT message publishing (without requiring connection)
    console.log('\n3️⃣ Testing MQTT Message Structure...');
    const testTopic = 'test/integration';
    const testData = { message: 'test', timestamp: new Date().toISOString() };
    
    // This will fail gracefully if MQTT is not connected
    const publishResult = systemIntegrationService.publishMqttMessage(testTopic, testData);
    console.log(`📡 MQTT publish test: ${publishResult ? 'Structure OK' : 'No connection (expected)'}`);

    console.log('\n📊 Simple Integration Test Results:');
    console.log('===================================');
    console.log(`✅ Service Integration: ${results.serviceIntegration ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Integration Status: ${results.integrationStatus ? 'PASS' : 'FAIL'}`);
    
    const overallSuccess = results.serviceIntegration && results.integrationStatus;
    console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    if (overallSuccess) {
      console.log('🎉 Basic integration components are working correctly!');
    } else {
      console.log('⚠️ Some integration components need attention.');
    }

    return results;

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    results.errors.push(error.message);
    logger.error('Simple integration test failed:', error);
    return results;
  }
}

// Run test if called directly
if (require.main === module) {
  runSimpleIntegrationTest()
    .then(results => {
      const success = results.serviceIntegration && results.integrationStatus;
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Simple integration test failed:', error);
      process.exit(1);
    });
}

module.exports = { runSimpleIntegrationTest };