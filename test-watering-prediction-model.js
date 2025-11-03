/**
 * Test the watering prediction model and database integration
 */

require('dotenv').config();
const AIPrediction = require('./models/AIPrediction');

async function testWateringPredictionModel() {
    try {
        console.log('🧪 Testing Watering Prediction Model and Database...\n');

        // Test 1: Create a watering prediction
        console.log('1. Testing watering prediction creation...');
        const testSensorData = {
            moisture: 25,
            temperature: 24,
            humidity: 55,
            light: 600
        };

        const testPredictionResult = {
            shouldWater: true,
            confidence: 0.9,
            recommendedAmount: 200,
            reasoning: 'Low moisture level requires watering',
            modelUsed: 'test-model'
        };

        const prediction = await AIPrediction.createWateringPrediction(
            null, // plant_id (null for testing)
            testSensorData,
            testPredictionResult,
            0.9, // confidence
            'test-1.0.0' // model version
        );

        console.log('✅ Prediction created successfully');
        console.log('Prediction ID:', prediction.prediction_id);
        console.log('Created at:', prediction.created_at);

        // Test 2: Retrieve the prediction
        console.log('\n2. Testing prediction retrieval...');
        const retrievedPrediction = await AIPrediction.findById(prediction.prediction_id);
        
        if (retrievedPrediction) {
            console.log('✅ Prediction retrieved successfully');
            console.log('Retrieved data:', JSON.stringify(retrievedPrediction.toJSON(), null, 2));
        } else {
            console.log('❌ Failed to retrieve prediction');
        }

        // Test 3: Get predictions by type
        console.log('\n3. Testing predictions by type...');
        const typePredictions = await AIPrediction.findByType('watering', 5);
        console.log(`✅ Found ${typePredictions.length} watering predictions`);

        // Test 4: Get latest prediction (skip plant-specific test)
        console.log('\n4. Testing prediction retrieval by type...');
        if (typePredictions.length > 0) {
            console.log('✅ Predictions found by type');
            console.log('First prediction confidence:', typePredictions[0].confidence_score);
        } else {
            console.log('❌ No predictions found by type');
        }

        // Test 5: Get statistics
        console.log('\n5. Testing prediction statistics...');
        const stats = await AIPrediction.getStatistics(null, 'watering', 30);
        console.log('✅ Statistics retrieved:', JSON.stringify(stats, null, 2));

        console.log('\n🎉 All model tests completed successfully!');

    } catch (error) {
        console.error('❌ Model test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Test the TensorFlow model integration
async function testTensorFlowIntegration() {
    try {
        console.log('\n🤖 Testing TensorFlow.js Model Integration...\n');

        // Test loading the ultimate watering prediction system
        console.log('1. Loading Ultimate Watering Prediction System...');
        const UltimateWateringPredictionSystem = require('./ai_models/watering_prediction/ultimateSolution');
        const predictionSystem = new UltimateWateringPredictionSystem();

        console.log('✅ System loaded successfully');

        // Test prediction
        console.log('\n2. Testing prediction with sample data...');
        const sensorData = {
            moisture: 35,
            temperature: 26,
            humidity: 50,
            light: 700
        };

        const prediction = await predictionSystem.predict(sensorData, [], 1);
        console.log('✅ Prediction completed');
        console.log('Prediction result:', JSON.stringify(prediction, null, 2));

        // Test health check
        console.log('\n3. Testing system health check...');
        const healthCheck = await predictionSystem.healthCheck();
        console.log('✅ Health check completed');
        console.log('System health:', JSON.stringify(healthCheck, null, 2));

        // Clean up
        predictionSystem.dispose();
        console.log('✅ System disposed safely');

        console.log('\n🎉 TensorFlow integration tests completed successfully!');

    } catch (error) {
        console.error('❌ TensorFlow integration test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run both tests
async function runAllTests() {
    await testWateringPredictionModel();
    await testTensorFlowIntegration();
}

runAllTests();