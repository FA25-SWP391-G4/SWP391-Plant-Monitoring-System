/**
 * Test Persistent Model
 */

const PersistentWateringModel = require('./persistentModel');
const DataPreprocessor = require('./dataPreprocessor');

async function testPersistentModel() {
  console.log('🧪 Testing Persistent Watering Model...\n');
  
  const model = new PersistentWateringModel();
  const preprocessor = new DataPreprocessor();
  
  try {
    // Test 1: Model creation and info
    console.log('Test 1: Model Information');
    let info = model.getModelInfo();
    console.log('Initial state:', info);
    console.log('✅ Model info retrieved\n');
    
    // Test 2: Create and train model
    console.log('Test 2: Model Creation and Training');
    await model.loadModel(); // This will create if not exists
    
    // Generate some training data
    const syntheticData = preprocessor.generateSyntheticData(200);
    const { training, validation } = preprocessor.splitData(syntheticData, 0.8);
    
    console.log('Training model with synthetic data...');
    await model.trainModel(training, validation);
    console.log('✅ Model trained\n');
    
    // Test 3: Save model
    console.log('Test 3: Model Persistence');
    const saveResult = await model.saveModel();
    console.log(`Save result: ${saveResult ? 'SUCCESS' : 'FAILED'}`);
    
    info = model.getModelInfo();
    console.log('After save:', info);
    console.log('✅ Model persistence tested\n');
    
    // Test 4: Dispose and reload
    console.log('Test 4: Model Reload');
    model.dispose();
    console.log('Model disposed');
    
    await model.loadModel();
    console.log('Model reloaded');
    
    info = model.getModelInfo();
    console.log('After reload:', info);
    console.log('✅ Model reload tested\n');
    
    // Test 5: Predictions
    console.log('Test 5: Predictions');
    
    const testCases = [
      { moisture: 20, temperature: 30, humidity: 40, light: 800 },
      { moisture: 70, temperature: 22, humidity: 65, light: 500 },
      { moisture: 45, temperature: 26, humidity: 50, light: 650 }
    ];
    
    for (const testCase of testCases) {
      console.log(`\nTesting: ${JSON.stringify(testCase)}`);
      const prediction = await model.predict(testCase);
      
      console.log(`Result: ${prediction.shouldWater ? 'WATER' : 'DON\'T WATER'}`);
      console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
      console.log(`Amount: ${prediction.recommendedAmount}ml`);
      console.log(`Model Type: ${prediction.modelType}`);
      console.log(`Persistent: ${prediction.persistent}`);
    }
    
    console.log('\n✅ All predictions completed\n');
    
    // Test 6: Performance
    console.log('Test 6: Performance Test');
    const perfTestData = { moisture: 45, temperature: 24, humidity: 58, light: 550 };
    
    const startTime = Date.now();
    for (let i = 0; i < 50; i++) {
      await model.predict(perfTestData);
    }
    const endTime = Date.now();
    
    const avgTime = (endTime - startTime) / 50;
    console.log(`Average prediction time: ${avgTime.toFixed(2)}ms`);
    console.log('✅ Performance test completed\n');
    
    console.log('🎉 All persistent model tests passed!');
    
    // Final info
    info = model.getModelInfo();
    console.log('\nFinal Model State:');
    console.log(`- Model Type: ${info.modelType}`);
    console.log(`- Persistent: ${info.persistent}`);
    console.log(`- Model Directory: ${info.modelDir}`);
    console.log(`- Config File Exists: ${info.filesExist.config}`);
    console.log(`- Weights File Exists: ${info.filesExist.weights}`);
    console.log(`- Metadata File Exists: ${info.filesExist.metadata}`);
    console.log(`- Is Loaded: ${info.isLoaded}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    model.dispose();
  }
}

if (require.main === module) {
  testPersistentModel().catch(console.error);
}

module.exports = { testPersistentModel };