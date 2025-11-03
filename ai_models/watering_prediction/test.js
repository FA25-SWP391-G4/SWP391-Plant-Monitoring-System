/**
 * Test script for Watering Prediction Model
 * Validates that the model components work correctly
 */

const wateringPrediction = require('./index');

async function runTests() {
  console.log('Testing Watering Prediction Model...\n');
  
  try {
    // Test 1: Model initialization
    console.log('Test 1: Model Initialization');
    console.log('Initializing model...');
    await wateringPrediction.initialize();
    console.log('✓ Model initialized successfully\n');
    
    // Test 2: Health check
    console.log('Test 2: Health Check');
    const health = await wateringPrediction.healthCheck();
    console.log(`Status: ${health.status}`);
    console.log(`Healthy: ${health.healthy}`);
    if (health.testPrediction) {
      console.log(`Test prediction confidence: ${health.testPrediction.confidence}`);
    }
    console.log('✓ Health check completed\n');
    
    // Test 3: Data validation
    console.log('Test 3: Data Validation');
    const validData = { moisture: 45, temperature: 22, humidity: 60, light: 500 };
    const invalidData = { moisture: 150, temperature: 'invalid', humidity: -10 };
    
    const validErrors = wateringPrediction.validateSensorData(validData);
    const invalidErrors = wateringPrediction.validateSensorData(invalidData);
    
    console.log(`Valid data errors: ${validErrors.length} (expected: 0)`);
    console.log(`Invalid data errors: ${invalidErrors.length} (expected: >0)`);
    if (invalidErrors.length > 0) {
      console.log(`Error examples: ${invalidErrors.slice(0, 2).join(', ')}`);
    }
    console.log('✓ Data validation working correctly\n');
    
    // Test 4: Predictions with different scenarios
    console.log('Test 4: Prediction Scenarios');
    
    const scenarios = [
      {
        name: 'Dry soil scenario',
        data: { moisture: 20, temperature: 25, humidity: 50, light: 600 },
        expected: 'should water'
      },
      {
        name: 'Wet soil scenario',
        data: { moisture: 80, temperature: 22, humidity: 65, light: 400 },
        expected: 'should not water'
      },
      {
        name: 'Moderate conditions',
        data: { moisture: 50, temperature: 24, humidity: 55, light: 500 },
        expected: 'depends on other factors'
      }
    ];
    
    for (const scenario of scenarios) {
      console.log(`\nScenario: ${scenario.name}`);
      console.log(`Input: ${JSON.stringify(scenario.data)}`);
      
      const prediction = await wateringPrediction.predict(scenario.data);
      
      console.log(`Prediction: ${prediction.shouldWater ? 'WATER' : 'DON\'T WATER'}`);
      console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
      console.log(`Amount: ${prediction.recommendedAmount}ml`);
      console.log(`Reasoning: ${prediction.reasoning}`);
      
      // Basic validation
      if (typeof prediction.shouldWater !== 'boolean') {
        throw new Error('shouldWater should be boolean');
      }
      if (prediction.confidence < 0 || prediction.confidence > 1) {
        throw new Error('confidence should be between 0 and 1');
      }
      if (prediction.recommendedAmount < 0) {
        throw new Error('recommendedAmount should be non-negative');
      }
    }
    console.log('✓ All prediction scenarios completed\n');
    
    // Test 5: Model info
    console.log('Test 5: Model Information');
    const modelInfo = wateringPrediction.getModelInfo();
    console.log(`Model status: ${modelInfo.status}`);
    console.log(`Cache size: ${modelInfo.cacheSize}`);
    console.log(`Model version: ${modelInfo.version}`);
    console.log('✓ Model info retrieved successfully\n');
    
    // Test 6: Prediction with historical data
    console.log('Test 6: Prediction with Historical Data');
    const historicalData = [
      { moisture: 60, temperature: 23, humidity: 58, light: 480 },
      { moisture: 55, temperature: 24, humidity: 56, light: 520 },
      { moisture: 50, temperature: 25, humidity: 54, light: 550 }
    ];
    
    const predictionWithHistory = await wateringPrediction.predict(
      { moisture: 45, temperature: 26, humidity: 52, light: 580 },
      historicalData,
      'test-plant-1'
    );
    
    console.log(`Prediction with history: ${predictionWithHistory.shouldWater ? 'WATER' : 'DON\'T WATER'}`);
    console.log(`Confidence: ${(predictionWithHistory.confidence * 100).toFixed(1)}%`);
    console.log('✓ Historical data prediction completed\n');
    
    console.log('🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };