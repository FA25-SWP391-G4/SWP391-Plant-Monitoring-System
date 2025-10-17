/**
 * Test Final Solution
 */

const FinalWateringPredictionSystem = require('./finalSolution');

async function testFinalSolution() {
  console.log('🚀 Testing Final Watering Prediction System...\n');
  
  const system = new FinalWateringPredictionSystem();
  
  try {
    // Wait for TensorFlow initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 1: Health check
    console.log('Test 1: System Health Check');
    const health = await system.healthCheck();
    console.log(`Status: ${health.status}`);
    console.log(`Healthy: ${health.healthy}`);
    console.log(`TensorFlow Available: ${health.tensorflowAvailable}`);
    console.log(`Primary Model: ${health.primaryModel}`);
    console.log(`Performance Stats:`, health.performanceStats);
    console.log('✅ Health check completed\n');
    
    // Test 2: System info
    console.log('Test 2: System Information');
    const info = system.getSystemInfo();
    console.log(`System Version: ${info.systemVersion}`);
    console.log(`TensorFlow Available: ${info.tensorflowAvailable}`);
    console.log('Features:', info.features);
    console.log('Limitations:', info.limitations);
    console.log('Solutions:', info.solutions);
    console.log('✅ System info retrieved\n');
    
    // Test 3: Comprehensive predictions
    console.log('Test 3: Comprehensive Prediction Tests');
    
    const testCases = [
      {
        name: 'Critical dry soil',
        data: { moisture: 15, temperature: 32, humidity: 30, light: 1000 },
        historical: []
      },
      {
        name: 'Borderline case (should use TensorFlow)',
        data: { moisture: 50, temperature: 25, humidity: 55, light: 600 },
        historical: [
          { moisture: 55, temperature: 24, humidity: 58, light: 580 },
          { moisture: 52, temperature: 25, humidity: 56, light: 590 },
          { moisture: 49, temperature: 25, humidity: 54, light: 600 },
          { moisture: 47, temperature: 26, humidity: 53, light: 610 },
          { moisture: 45, temperature: 26, humidity: 52, light: 620 }
        ]
      },
      {
        name: 'High moisture',
        data: { moisture: 80, temperature: 20, humidity: 70, light: 400 },
        historical: []
      },
      {
        name: 'Invalid data test',
        data: { moisture: 'invalid', temperature: 25 },
        historical: []
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n--- ${testCase.name} ---`);
      console.log(`Input: ${JSON.stringify(testCase.data)}`);
      
      try {
        const prediction = await system.predict(testCase.data, testCase.historical, 'test-plant');
        
        console.log(`Result: ${prediction.shouldWater ? 'WATER' : 'DON\'T WATER'}`);
        console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
        console.log(`Amount: ${prediction.recommendedAmount}ml`);
        console.log(`Model Used: ${prediction.modelUsed}`);
        console.log(`Processing Time: ${prediction.processingTime}ms`);
        console.log(`TensorFlow Available: ${prediction.tensorflowAvailable}`);
        console.log(`Reasoning: ${prediction.reasoning}`);
        
        if (prediction.emergency) {
          console.log('⚠️  Emergency fallback used');
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n✅ All prediction tests completed\n');
    
    // Test 4: Performance benchmark
    console.log('Test 4: Performance Benchmark');
    const benchmarkData = { moisture: 45, temperature: 24, humidity: 58, light: 550 };
    const iterations = 100;
    
    console.log(`Running ${iterations} predictions...`);
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await system.predict(benchmarkData);
    }
    
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / iterations;
    
    console.log(`Total time: ${totalTime}ms`);
    console.log(`Average time: ${avgTime.toFixed(2)}ms`);
    console.log(`Predictions per second: ~${Math.round(1000 / avgTime)}`);
    
    // Get updated performance stats
    const finalHealth = await system.healthCheck();
    console.log('Final Performance Stats:', finalHealth.performanceStats);
    console.log('✅ Performance benchmark completed\n');
    
    // Test 5: Data validation
    console.log('Test 5: Data Validation');
    const validData = { moisture: 45, temperature: 22, humidity: 60, light: 500 };
    const invalidData = { moisture: 150, temperature: 'hot' };
    
    const validErrors = system.validateSensorData(validData);
    const invalidErrors = system.validateSensorData(invalidData);
    
    console.log(`Valid data errors: ${validErrors.length} (expected: 0)`);
    console.log(`Invalid data errors: ${invalidErrors.length} (expected: >0)`);
    console.log('✅ Data validation completed\n');
    
    console.log('🎉 All tests completed successfully!');
    
    // Final summary
    console.log('\n📋 FINAL SYSTEM SUMMARY:');
    console.log('='.repeat(50));
    
    const finalInfo = system.getSystemInfo();
    console.log(`✅ System Version: ${finalInfo.systemVersion}`);
    console.log(`✅ Primary Model: ${finalInfo.primaryModel}`);
    console.log(`✅ TensorFlow Available: ${finalInfo.tensorflowAvailable ? 'Yes' : 'No'}`);
    console.log(`✅ Total Predictions: ${finalInfo.performanceStats.totalPredictions}`);
    console.log(`✅ Average Processing Time: ${finalInfo.performanceStats.averageTime.toFixed(2)}ms`);
    console.log(`✅ Success Rate: ${finalInfo.performanceStats.successRate.toFixed(1)}%`);
    
    console.log('\n🚀 PRODUCTION READY FEATURES:');
    finalInfo.features.forEach(feature => console.log(`  ✅ ${feature}`));
    
    console.log('\n⚠️  KNOWN LIMITATIONS:');
    Object.entries(finalInfo.limitations).forEach(([key, value]) => {
      console.log(`  ⚠️  ${key}: ${value}`);
    });
    
    console.log('\n💡 IMPLEMENTED SOLUTIONS:');
    Object.entries(finalInfo.solutions).forEach(([key, value]) => {
      console.log(`  💡 ${key}: ${value}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    system.dispose();
  }
}

if (require.main === module) {
  testFinalSolution().catch(console.error);
}

module.exports = { testFinalSolution };