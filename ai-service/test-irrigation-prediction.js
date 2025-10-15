const IrrigationPredictionService = require('./services/irrigationPredictionService');
const FeatureEngineering = require('./utils/featureEngineering');
const PlantSpecificAlgorithms = require('./services/plantSpecificAlgorithms');

async function testIrrigationPrediction() {
  console.log('🌱 Testing Irrigation Prediction ML Model...\n');

  try {
    // Initialize services
    console.log('Initializing services...');
    const predictionService = new IrrigationPredictionService();
    const featureEngineering = new FeatureEngineering();
    const plantAlgorithms = new PlantSpecificAlgorithms();

    // Wait for model to load
    console.log('Waiting for model initialization...');
    while (!predictionService.isModelLoaded) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('Model loaded successfully!');

    // Test data scenarios
    const testScenarios = [
      {
        name: 'Tomato - Dry soil, hot weather',
        data: {
          plantId: 1,
          plantType: 'tomato',
          soilMoisture: 25,
          temperature: 32,
          humidity: 45,
          lightLevel: 60000,
          lastWateringHours: 18,
          weatherForecast: 0.1
        }
      },
      {
        name: 'Lettuce - Optimal conditions',
        data: {
          plantId: 2,
          plantType: 'lettuce',
          soilMoisture: 75,
          temperature: 18,
          humidity: 65,
          lightLevel: 25000,
          lastWateringHours: 12,
          weatherForecast: 0.0
        }
      },
      {
        name: 'Herb - Moderate conditions',
        data: {
          plantId: 3,
          plantType: 'herb',
          soilMoisture: 55,
          temperature: 22,
          humidity: 50,
          lightLevel: 20000,
          lastWateringHours: 36,
          weatherForecast: 0.3
        }
      },
      {
        name: 'Cucumber - High humidity, rain expected',
        data: {
          plantId: 4,
          plantType: 'cucumber',
          soilMoisture: 80,
          temperature: 24,
          humidity: 85,
          lightLevel: 40000,
          lastWateringHours: 8,
          weatherForecast: 0.8
        }
      },
      {
        name: 'Pepper - Critical dry conditions',
        data: {
          plantId: 5,
          plantType: 'pepper',
          soilMoisture: 15,
          temperature: 35,
          humidity: 30,
          lightLevel: 70000,
          lastWateringHours: 48,
          weatherForecast: 0.0
        }
      }
    ];

    console.log('Running test scenarios...\n');

    for (const scenario of testScenarios) {
      console.log(`📊 ${scenario.name}`);
      console.log('Input data:', JSON.stringify(scenario.data, null, 2));

      try {
        // Test feature engineering
        console.log('\n🔧 Feature Engineering:');
        const validation = featureEngineering.validateSensorData(scenario.data);
        console.log('Data validation:', validation);

        if (validation.isValid) {
          const features = featureEngineering.createFeatureVector(scenario.data);
          console.log('Feature vector length:', features.vector.length);
          console.log('Stress factors:', features.metadata.stressFactors);
          console.log('Water demand:', features.metadata.waterDemand);

          // Test plant-specific algorithms
          console.log('\n🌿 Plant-Specific Algorithm:');
          const plantRecommendation = plantAlgorithms.getIrrigationRecommendation(
            scenario.data.plantType, 
            scenario.data
          );
          console.log('Plant recommendation:', {
            shouldWater: plantRecommendation.shouldWater,
            waterAmount: plantRecommendation.waterAmount,
            nextWateringHours: plantRecommendation.nextWateringHours,
            confidence: plantRecommendation.confidence,
            plantName: plantRecommendation.plantName
          });
          console.log('Advice:', plantRecommendation.plantSpecificAdvice.slice(0, 2));

          // Test ML model prediction
          console.log('\n🤖 ML Model Prediction:');
          const mlPrediction = await predictionService.predict(scenario.data);
          console.log('ML prediction:', {
            shouldWater: mlPrediction.shouldWater,
            waterAmount: mlPrediction.waterAmount,
            hoursUntilWater: mlPrediction.hoursUntilWater,
            confidence: mlPrediction.confidence
          });
          console.log('Explanation:', mlPrediction.explanation);

          // Compare results
          console.log('\n📈 Comparison:');
          console.log('Plant Algorithm vs ML Model:');
          console.log(`Should Water: ${plantRecommendation.shouldWater} vs ${mlPrediction.shouldWater}`);
          console.log(`Water Amount: ${plantRecommendation.waterAmount}ml vs ${mlPrediction.waterAmount}ml`);
          console.log(`Confidence: ${plantRecommendation.confidence} vs ${mlPrediction.confidence}`);

        } else {
          console.log('❌ Invalid sensor data:', validation.issues);
        }

      } catch (error) {
        console.error('❌ Error in scenario:', error.message);
      }

      console.log('\n' + '='.repeat(80) + '\n');
    }

    // Test model performance
    console.log('🚀 Performance Test:');
    const startTime = Date.now();
    const performancePromises = [];

    for (let i = 0; i < 10; i++) {
      const testData = {
        plantId: i,
        plantType: 'tomato',
        soilMoisture: 30 + Math.random() * 40,
        temperature: 20 + Math.random() * 15,
        humidity: 40 + Math.random() * 40,
        lightLevel: 20000 + Math.random() * 40000,
        lastWateringHours: Math.random() * 48,
        weatherForecast: Math.random()
      };

      performancePromises.push(predictionService.predict(testData));
    }

    const results = await Promise.all(performancePromises);
    const endTime = Date.now();
    
    console.log(`Processed 10 predictions in ${endTime - startTime}ms`);
    console.log(`Average time per prediction: ${(endTime - startTime) / 10}ms`);
    console.log(`Success rate: ${results.length}/10`);

    // Test edge cases
    console.log('\n🔍 Edge Cases Test:');
    
    const edgeCases = [
      {
        name: 'Missing data',
        data: { plantId: 1, plantType: 'tomato' }
      },
      {
        name: 'Extreme values',
        data: {
          plantId: 2,
          plantType: 'lettuce',
          soilMoisture: 150, // Invalid
          temperature: -10,  // Extreme
          humidity: 200,     // Invalid
          lightLevel: -1000  // Invalid
        }
      },
      {
        name: 'Unknown plant type',
        data: {
          plantId: 3,
          plantType: 'unknown_plant',
          soilMoisture: 50,
          temperature: 25,
          humidity: 60
        }
      }
    ];

    for (const edgeCase of edgeCases) {
      console.log(`\n🧪 ${edgeCase.name}:`);
      try {
        const validation = featureEngineering.validateSensorData(edgeCase.data);
        console.log('Validation result:', validation);
        
        if (validation.completeness.requiredComplete) {
          const prediction = await predictionService.predict(edgeCase.data);
          console.log('Prediction successful:', {
            shouldWater: prediction.shouldWater,
            confidence: prediction.confidence
          });
        } else {
          console.log('❌ Missing required data:', validation.completeness.missingRequired);
        }
      } catch (error) {
        console.log('❌ Expected error:', error.message);
      }
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
if (require.main === module) {
  testIrrigationPrediction().catch(console.error);
}

module.exports = testIrrigationPrediction;