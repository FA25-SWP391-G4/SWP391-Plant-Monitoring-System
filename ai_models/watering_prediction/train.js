/**
 * Training Script for Watering Prediction Model
 * Demonstrates how to train the model with sample data
 */

const WateringPredictionModel = require('./model');
const DataPreprocessor = require('./dataPreprocessor');
const path = require('path');

async function trainModel() {
  console.log('Starting watering prediction model training...');
  
  try {
    // Initialize components
    const model = new WateringPredictionModel();
    const preprocessor = new DataPreprocessor();
    
    // Create the model architecture
    console.log('Creating model architecture...');
    model.createModel();
    
    // Display model summary
    console.log('\nModel Architecture:');
    console.log(model.getModelSummary());
    
    // Generate synthetic training data
    console.log('\nGenerating synthetic training data...');
    const syntheticData = preprocessor.generateSyntheticData(1000);
    
    // Analyze data quality
    const dataStats = preprocessor.analyzeDataQuality(syntheticData);
    console.log('\nData Quality Analysis:');
    console.log(`Total samples: ${dataStats.totalSamples}`);
    console.log(`Watering samples: ${dataStats.wateringSamples}`);
    console.log(`No watering samples: ${dataStats.noWateringSamples}`);
    console.log(`Class balance ratio: ${dataStats.classBalance.wateringRatio.toFixed(3)}`);
    console.log(`Balanced: ${dataStats.classBalance.balanced ? 'Yes' : 'No'}`);
    
    // Split data into training and validation sets
    console.log('\nSplitting data...');
    const { training, validation } = preprocessor.splitData(syntheticData, 0.8);
    console.log(`Training samples: ${training.length}`);
    console.log(`Validation samples: ${validation.length}`);
    
    // Train the model
    console.log('\nTraining model...');
    const history = await model.trainModel(training, validation);
    
    console.log('\nTraining completed!');
    
    // Test the trained model
    console.log('\nTesting model with sample predictions...');
    await testModel(model);
    
    // Save the trained model
    const modelPath = path.join(__dirname, 'model.json');
    console.log(`\nSaving model to ${modelPath}...`);
    await model.saveModel(modelPath);
    
    console.log('Training process completed successfully!');
    
  } catch (error) {
    console.error('Error during training:', error);
    process.exit(1);
  }
}

async function testModel(model) {
  const testCases = [
    {
      name: 'Low moisture, high temperature',
      sensorData: { moisture: 25, temperature: 30, humidity: 45, light: 800 },
      historicalData: [
        { moisture: 35, temperature: 28, humidity: 50, light: 750 },
        { moisture: 30, temperature: 29, humidity: 48, light: 780 }
      ]
    },
    {
      name: 'High moisture, normal conditions',
      sensorData: { moisture: 75, temperature: 22, humidity: 65, light: 500 },
      historicalData: [
        { moisture: 70, temperature: 21, humidity: 68, light: 480 },
        { moisture: 72, temperature: 23, humidity: 62, light: 520 }
      ]
    },
    {
      name: 'Moderate moisture, dry conditions',
      sensorData: { moisture: 45, temperature: 26, humidity: 35, light: 900 },
      historicalData: [
        { moisture: 50, temperature: 25, humidity: 40, light: 850 },
        { moisture: 48, temperature: 25, humidity: 38, light: 880 }
      ]
    }
  ];

  for (const testCase of testCases) {
    console.log(`\nTest: ${testCase.name}`);
    console.log(`Input: ${JSON.stringify(testCase.sensorData)}`);
    
    const prediction = await model.predict(testCase.sensorData, testCase.historicalData);
    
    console.log(`Prediction: ${prediction.shouldWater ? 'WATER' : 'DON\'T WATER'}`);
    console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
    console.log(`Recommended amount: ${prediction.recommendedAmount}ml`);
    console.log(`Reasoning: ${prediction.reasoning}`);
  }
}

// Run training if this script is executed directly
if (require.main === module) {
  trainModel().catch(console.error);
}

module.exports = { trainModel };