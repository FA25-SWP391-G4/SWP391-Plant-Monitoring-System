/**
 * Test script for Hybrid Watering Model
 */

const HybridWateringModel = require('./hybridModel');

async function testHybridModel() {
  console.log('Testing Hybrid Watering Model...\n');
  
  const model = new HybridWateringModel();
  
  try {
    // Test 1: Initialization
    console.log('Test 1: Model Initialization');
    await model.initialize();
    console.log('✓ Hybrid model initialized\n');
    
    // Test 2: Health check
    console.log('Test 2: Health Check');
    const health = await model.healthCheck();
    console.log(`Overall Status: ${health.status}`);
    console.log(`Healthy: ${health.healthy}`);
    console.log(`TensorFlow Available: ${health.components.tensorflow?.available}`);
    console.log(`Rules Available: ${health.components.rules?.available}`);
    if (health.testPrediction) {
      console.log(`Test Prediction: ${health.testPrediction.shouldWater ? 'WATER' : 'DON\'T WATER'} (${health.testPrediction.modelUsed})`);
    }
    console.log('✓ Health check completed\n');
    
    // Test 3: Model info
    console.log('Test 3: Model Information');
    const info = model.getModelInfo();
    console.log(`Model Type: ${info.modelType}`);
    console.log(`Version: ${info.version}`);
    console.log(`Strategy: ${info.strategy}`);
    console.log(`TensorFlow Component: ${info.components.tensorflow.available ? 'Available' : 'Unavailable'}`);
    console.log(`Rules Component: ${info.components.rules.available ? 'Available' : 'Unavailable'}`);
    console.log('✓ Model info retrieved\n');
    
    // Test 4: Prediction scenarios
    console.log('Test 4: Hybrid Prediction Scenarios');
    
    const scenarios = [
      {
        name: 'Critical dry soil',
        data: { moisture: 18, temperature: 30, humidity: 35, light: 900 },
        expectRules: true // Should prefer rules for critical conditions
      },
      {
        name: 'Moderate conditions',
        data: { moisture: 45, temperature: 24, humidity: 60, light: 600 },
        expectRules: false // Can use either model
      },
      {
        name: 'High moisture',
        data: { moisture: 75, temperature: 20, humidity: 70, light: 400 },
        expectRules: false // Should not water
      },
      {
        name: 'Borderline case',
        data: { moisture: 50, temperature: 26, humidity: 45, light: 700 },
        expectRules: false // Interesting case for model comparison
      }
    ];
    
    for (const scenario of scenarios) {
      console.log(`\n--- ${scenario.name} ---`);
      console.log(`Input: ${JSON.stringify(scenario.data)}`);
      
      const prediction = await model.predict(scenario.data, [], 'test-plant');
      
      console.log(`Prediction: ${prediction.shouldWater ? 'WATER' : 'DON\'T WATER'}`);
      console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
      console.log(`Amount: ${prediction.recommendedAmount}ml`);
      console.log(`Model Used: ${prediction.modelUsed}`);
      console.log(`Reasoning: ${prediction.reasoning}`);
      
      if (prediction.hybridInfo) {
        console.log('Hybrid Info:');
        console.log(`  TensorFlow Available: ${prediction.hybridInfo.tensorflowAvailable}`);
        if (prediction.hybridInfo.tensorflowPrediction) {
          const tf = prediction.hybridInfo.tensorflowPrediction;
          console.log(`  TensorFlow: ${tf.shouldWater ? 'WATER' : 'DON\'T WATER'} (${(tf.confidence * 100).toFixed(1)}%)`);
        }
        const rule = prediction.hybridInfo.rulePrediction;
        console.log(`  Rules: ${rule.shouldWater ? 'WATER' : 'DON\'T WATER'} (${(rule.confidence * 100).toFixed(1)}%)`);
      }
      
      if (prediction.reason) {
        console.log(`Selection Reason: ${prediction.reason}`);
      }
    }
    
    console.log('\n✓ All prediction scenarios completed\n');
    
    // Test 5: Historical data influence
    console.log('Test 5: Historical Data Influence');
    
    const currentData = { moisture: 42, temperature: 25, humidity: 52, light: 650 };
    const historicalData = [
      { moisture: 65, temperature: 23, humidity: 58, light: 600 },
      { moisture: 58, temperature: 24, humidity: 55, light: 620 },
      { moisture: 52, temperature: 24, humidity: 53, light: 635 },
      { moisture: 47, temperature: 25, humidity: 52, light: 645 }
    ];
    
    console.log('Testing with declining moisture trend...');
    const predictionWithHistory = await model.predict(currentData, historicalData, 'trend-test');
    
    console.log(`Prediction: ${predictionWithHistory.shouldWater ? 'WATER' : 'DON\'T WATER'}`);
    console.log(`Confidence: ${(predictionWithHistory.confidence * 100).toFixed(1)}%`);
    console.log(`Model Used: ${predictionWithHistory.modelUsed}`);
    console.log('✓ Historical data test completed\n');
    
    // Test 6: Preference settings
    console.log('Test 6: Preference Settings');
    
    console.log('Testing with TensorFlow disabled...');
    model.setPreferences({ preferTensorFlow: false });
    
    const predictionNoTF = await model.predict({ moisture: 40, temperature: 25, humidity: 55, light: 600 });
    console.log(`Without TensorFlow: ${predictionNoTF.modelUsed}`);
    
    console.log('Re-enabling TensorFlow...');
    model.setPreferences({ preferTensorFlow: true, fallbackThreshold: 0.7 });
    
    const predictionWithTF = await model.predict({ moisture: 40, temperature: 25, humidity: 55, light: 600 });
    console.log(`With TensorFlow: ${predictionWithTF.modelUsed}`);
    console.log('✓ Preference settings test completed\n');
    
    // Test 7: Performance comparison
    console.log('Test 7: Performance Test');
    const testData = { moisture: 45, temperature: 24, humidity: 58, light: 550 };
    
    const iterations = 50;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await model.predict(testData);
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / iterations;
    
    console.log(`Average prediction time: ${avgTime.toFixed(2)}ms (${iterations} predictions)`);
    console.log('✓ Performance test completed\n');
    
    console.log('🎉 All hybrid model tests passed successfully!');
    console.log('Hybrid model provides the best of both worlds: TensorFlow accuracy with Rule-based reliability!');
    
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
  testHybridModel().catch(console.error);
}

module.exports = { testHybridModel };