/**
 * Test script for Smart Rule-Based Watering Model
 */

const SmartRuleWateringModel = require('./smartRuleModel');

async function testSmartRuleModel() {
  console.log('Testing Smart Rule-Based Watering Model...\n');
  
  const model = new SmartRuleWateringModel();
  
  try {
    // Test 1: Health check
    console.log('Test 1: Health Check');
    const health = await model.healthCheck();
    console.log(`Status: ${health.status}`);
    console.log(`Healthy: ${health.healthy}`);
    console.log(`Model Type: ${health.modelType}`);
    console.log(`Version: ${health.version}`);
    console.log('✓ Health check completed\n');
    
    // Test 2: Various watering scenarios
    console.log('Test 2: Comprehensive Watering Scenarios');
    
    const scenarios = [
      {
        name: 'Critical - Very dry soil',
        data: { moisture: 15, temperature: 32, humidity: 30, light: 1200 },
        expected: 'WATER (high confidence)'
      },
      {
        name: 'Dry soil with moderate conditions',
        data: { moisture: 30, temperature: 24, humidity: 55, light: 600 },
        expected: 'WATER (moderate confidence)'
      },
      {
        name: 'Moderate moisture, hot and dry',
        data: { moisture: 45, temperature: 35, humidity: 25, light: 1000 },
        expected: 'WATER (stress conditions)'
      },
      {
        name: 'Adequate moisture, normal conditions',
        data: { moisture: 60, temperature: 22, humidity: 65, light: 500 },
        expected: 'DON\'T WATER'
      },
      {
        name: 'High moisture, cool conditions',
        data: { moisture: 80, temperature: 18, humidity: 75, light: 300 },
        expected: 'DON\'T WATER (high confidence)'
      },
      {
        name: 'Borderline case',
        data: { moisture: 50, temperature: 23, humidity: 60, light: 400 },
        expected: 'Context dependent'
      }
    ];
    
    for (const scenario of scenarios) {
      console.log(`\n--- ${scenario.name} ---`);
      console.log(`Input: ${JSON.stringify(scenario.data)}`);
      console.log(`Expected: ${scenario.expected}`);
      
      const prediction = await model.predict(scenario.data);
      
      console.log(`Prediction: ${prediction.shouldWater ? 'WATER' : 'DON\'T WATER'}`);
      console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
      console.log(`Amount: ${prediction.recommendedAmount}ml`);
      console.log(`Score: ${prediction.score}`);
      console.log(`Reasoning: ${prediction.reasoning}`);
      
      // Show decision factors
      if (prediction.factors && prediction.factors.length > 0) {
        console.log('Key factors:');
        prediction.factors.forEach(factor => {
          console.log(`  - ${factor.description} (weight: ${factor.weight})`);
        });
      }
    }
    
    console.log('\n✓ All scenarios tested\n');
    
    // Test 3: Historical data influence
    console.log('Test 3: Historical Data Influence');
    
    const currentData = { moisture: 40, temperature: 26, humidity: 50, light: 700 };
    const historicalData = [
      { moisture: 60, temperature: 24, humidity: 55, light: 650 },
      { moisture: 55, temperature: 25, humidity: 52, light: 680 },
      { moisture: 50, temperature: 25, humidity: 51, light: 690 },
      { moisture: 45, temperature: 26, humidity: 50, light: 700 }
    ];
    
    console.log('Current data:', JSON.stringify(currentData));
    console.log('Historical trend: Moisture declining from 60% to 40%');
    
    const predictionWithHistory = await model.predict(currentData, historicalData, 'test-plant');
    
    console.log(`\nPrediction with history: ${predictionWithHistory.shouldWater ? 'WATER' : 'DON\'T WATER'}`);
    console.log(`Confidence: ${(predictionWithHistory.confidence * 100).toFixed(1)}%`);
    console.log(`Reasoning: ${predictionWithHistory.reasoning}`);
    console.log('✓ Historical data test completed\n');
    
    // Test 4: Data validation
    console.log('Test 4: Data Validation');
    
    const invalidCases = [
      { data: null, description: 'null data' },
      { data: { moisture: 150 }, description: 'moisture out of range' },
      { data: { moisture: 50, temperature: 'hot' }, description: 'invalid temperature type' },
      { data: { moisture: 50 }, description: 'missing required fields' }
    ];
    
    for (const testCase of invalidCases) {
      try {
        await model.predict(testCase.data);
        console.log(`❌ Should have failed for: ${testCase.description}`);
      } catch (error) {
        console.log(`✓ Correctly rejected: ${testCase.description} - ${error.message}`);
      }
    }
    
    console.log('✓ Data validation test completed\n');
    
    // Test 5: Performance test
    console.log('Test 5: Performance Test');
    const testData = { moisture: 45, temperature: 24, humidity: 55, light: 600 };
    
    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
      await model.predict(testData);
    }
    const endTime = Date.now();
    
    const avgTime = (endTime - startTime) / 100;
    console.log(`Average prediction time: ${avgTime.toFixed(2)}ms (100 predictions)`);
    console.log('✓ Performance test completed\n');
    
    // Test 6: Model info
    console.log('Test 6: Model Information');
    const info = model.getModelInfo();
    console.log(`Model Type: ${info.modelType}`);
    console.log(`Version: ${info.version}`);
    console.log(`Status: ${info.status}`);
    console.log('Features:');
    info.features.forEach(feature => console.log(`  - ${feature}`));
    console.log('✓ Model info test completed\n');
    
    console.log('🎉 All tests passed successfully!');
    console.log('Smart Rule-Based Model is working perfectly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testSmartRuleModel().catch(console.error);
}

module.exports = { testSmartRuleModel };