/**
 * Test script for Fixed Watering Prediction Model
 * Tests both TensorFlow and fallback modes
 */

const WateringPredictionModelFixed = require('./modelFixed');

async function runFixedTests() {
  console.log('Testing Fixed Watering Prediction Model...\n');
  
  const model = new WateringPredictionModelFixed();
  
  try {
    // Test 1: Model initialization
    console.log('Test 1: Model Initialization');
    await model.loadModel();
    console.log('✓ Model initialized\n');
    
    // Test 2: Health check
    console.log('Test 2: Health Check');
    const health = await model.healthCheck();
    console.log(`TensorFlow Available: ${health.tensorflowAvailable}`);
    console.log(`Model Type: ${health.modelType}`);
    console.log(`Fallback Mode: ${health.fallbackMode}`);
    console.log(`Healthy: ${health.healthy}`);
    console.log('✓ Health check completed\n');
    
    // Test 3: Predictions in different scenarios
    console.log('Test 3: Prediction Scenarios');
    
    const scenarios = [
      {
        name: 'Very dry soil',
        data: { moisture: 15, temperature: 28, humidity: 40, light: 800 }
      },
      {
        name: 'Moderately dry with heat',
        data: { moisture: 35, temperature: 30, humidity: 35, light: 900 }
      },
      {
        name: 'Adequate moisture',
        data: { moisture: 65, temperature: 22, humidity: 65, light: 400 }
      },
      {
        name: 'Very wet soil',
        data: { moisture: 85, temperature: 20, humidity: 70, light: 300 }
      }
    ];
    
    for (const scenario of scenarios) {
      console.log(`\n--- ${scenario.name} ---`);
      console.log(`Input: ${JSON.stringify(scenario.data)}`);
      
      const prediction = await model.predict(scenario.data);
      
      console.log(`Prediction: ${prediction.shouldWater ? 'WATER' : 'DON\'T WATER'}`);
      console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
      console.log(`Amount: ${prediction.recommendedAmount}ml`);
      console.log(`Model Type: ${prediction.modelType}`);
      console.log(`Reasoning: ${prediction.reasoning}`);
      
      // Validate prediction structure
      if (typeof prediction.shouldWater !== 'boolean') {
        throw new Error('shouldWater should be boolean');
      }
      if (prediction.confidence < 0 || prediction.confidence > 1) {
        throw new Error('confidence should be between 0 and 1');
      }
    }
    
    console.log('\n✓ All prediction scenarios completed\n');
    
    // Test 4: Model saving (if TensorFlow is available)
    console.log('Test 4: Model Persistence');
    if (!model.fallbackMode) {
      const saved = await model.saveModel();
      console.log(`Model saving: ${saved ? 'SUCCESS' : 'FAILED'}`);
    } else {
      console.log('Model saving: SKIPPED (fallback mode)');
    }
    console.log('✓ Model persistence test completed\n');
    
    // Test 5: Model info
    console.log('Test 5: Model Information');
    const info = model.getModelInfo();
    console.log(`Status: ${info.status}`);
    console.log(`Model Type: ${info.modelType}`);
    console.log(`Fallback Mode: ${info.fallbackMode}`);
    console.log(`Version: ${info.version}`);
    console.log('✓ Model info retrieved\n');
    
    // Test 6: Performance comparison
    console.log('Test 6: Performance Test');
    const testData = { moisture: 45, temperature: 24, humidity: 55, light: 600 };
    
    const startTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await model.predict(testData);
    }
    const endTime = Date.now();
    
    const avgTime = (endTime - startTime) / 10;
    console.log(`Average prediction time: ${avgTime.toFixed(2)}ms`);
    console.log('✓ Performance test completed\n');
    
    console.log('🎉 All tests passed successfully!');
    console.log(`Final Status: ${model.fallbackMode ? 'FALLBACK MODE' : 'TENSORFLOW MODE'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Clean up
    model.dispose();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runFixedTests().catch(console.error);
}

module.exports = { runFixedTests };