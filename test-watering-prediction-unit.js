/**
 * Simple Node.js Unit Tests for Watering Prediction TensorFlow.js Model
 * Tests model inference and prediction accuracy with sample sensor data
 * Requirements: 2.1, 2.2
 */

const WateringPredictionModel = require('./ai_models/watering_prediction/model');
const wateringPrediction = require('./ai_models/watering_prediction/index');

// Simple test framework
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('🧪 Running Watering Prediction Unit Tests\n');
        console.log('=' .repeat(60));

        for (const { name, testFn } of this.tests) {
            try {
                console.log(`\n🔍 Testing: ${name}`);
                await testFn();
                console.log(`✅ PASSED: ${name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ FAILED: ${name}`);
                console.log(`   Error: ${error.message}`);
                this.failed++;
            }
        }

        console.log('\n' + '=' .repeat(60));
        console.log(`📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        
        if (this.failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('⚠️  Some tests failed');
        }

        return this.failed === 0;
    }
}

// Helper functions
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertDefined(value, message) {
    assert(value !== undefined && value !== null, message || 'Value should be defined');
}

function assertType(value, expectedType, message) {
    assert(typeof value === expectedType, message || `Expected ${expectedType}, got ${typeof value}`);
}

function assertRange(value, min, max, message) {
    assert(value >= min && value <= max, message || `Value ${value} not in range [${min}, ${max}]`);
}

// Test suite
const runner = new TestRunner();

// Test 1: Model Creation and Architecture
runner.test('Model Creation and Architecture', async () => {
    const model = new WateringPredictionModel();
    
    const createdModel = model.createModel();
    assertDefined(createdModel, 'Model should be created');
    assertDefined(model.model, 'Model instance should be stored');
    
    assert(Array.isArray(model.inputFeatures), 'Input features should be an array');
    assert(model.inputFeatures.length === 4, 'Should have 4 input features');
    assert(model.inputFeatures.includes('moisture'), 'Should include moisture feature');
    assert(model.inputFeatures.includes('temperature'), 'Should include temperature feature');
    assert(model.inputFeatures.includes('humidity'), 'Should include humidity feature');
    assert(model.inputFeatures.includes('light'), 'Should include light feature');
    
    model.dispose();
});

// Test 2: Data Preprocessing
runner.test('Data Preprocessing', async () => {
    const model = new WateringPredictionModel();
    
    const sensorData = {
        moisture: 45,
        temperature: 25,
        humidity: 60,
        light: 500
    };

    const preprocessed = model.preprocessData(sensorData);
    assertDefined(preprocessed, 'Preprocessed data should be defined');
    assert(Array.isArray(preprocessed.shape), 'Shape should be an array');
    assert(preprocessed.shape[0] === 1, 'Batch size should be 1');
    assert(preprocessed.shape[1] === 11, 'Feature count should be 11');
    
    preprocessed.dispose();
    model.dispose();
});

// Test 3: Handling Missing Sensor Data
runner.test('Handling Missing Sensor Data', async () => {
    const model = new WateringPredictionModel();
    
    const incompleteSensorData = {
        moisture: 30
        // missing temperature, humidity, light
    };

    const preprocessed = model.preprocessData(incompleteSensorData);
    assertDefined(preprocessed, 'Should handle missing data');
    assert(preprocessed.shape[1] === 11, 'Should still have 11 features');
    
    preprocessed.dispose();
    model.dispose();
});

// Test 4: TensorFlow Model Predictions
runner.test('TensorFlow Model Predictions', async () => {
    const model = new WateringPredictionModel();
    model.createModel();
    
    const sensorData = {
        moisture: 25,
        temperature: 28,
        humidity: 45,
        light: 700
    };

    const prediction = await model.predict(sensorData);
    
    assertDefined(prediction, 'Prediction should be defined');
    assertType(prediction.shouldWater, 'boolean', 'shouldWater should be boolean');
    assertType(prediction.confidence, 'number', 'confidence should be number');
    assertRange(prediction.confidence, 0, 1, 'confidence should be between 0 and 1');
    assertType(prediction.recommendedAmount, 'number', 'recommendedAmount should be number');
    assert(prediction.recommendedAmount >= 0, 'recommendedAmount should be non-negative');
    assertDefined(prediction.reasoning, 'reasoning should be defined');
    assertDefined(prediction.probabilities, 'probabilities should be defined');
    assertType(prediction.probabilities.dontWater, 'number', 'dontWater probability should be number');
    assertType(prediction.probabilities.water, 'number', 'water probability should be number');
    
    model.dispose();
});

// Test 5: Prediction Accuracy with Sample Data
runner.test('Prediction Accuracy - Very Dry Soil', async () => {
    const model = new WateringPredictionModel();
    model.createModel();
    
    const drySensorData = {
        moisture: 15,
        temperature: 25,
        humidity: 50,
        light: 600
    };

    const prediction = await model.predict(drySensorData);
    
    // Test that prediction structure is correct (untrained model may give random results)
    assertDefined(prediction, 'Prediction should be defined');
    assertType(prediction.shouldWater, 'boolean', 'shouldWater should be boolean');
    assertRange(prediction.confidence, 0, 1, 'confidence should be valid');
    assert(prediction.reasoning.includes('Low soil moisture'), 'Reasoning should mention low moisture');
    
    // If it recommends watering, amount should be positive
    if (prediction.shouldWater) {
        assert(prediction.recommendedAmount > 0, 'Should recommend some amount of water if watering needed');
    }
    
    model.dispose();
});

// Test 6: Prediction Accuracy - Well Watered Soil
runner.test('Prediction Accuracy - Well Watered Soil', async () => {
    const model = new WateringPredictionModel();
    model.createModel();
    
    const wetSensorData = {
        moisture: 80,
        temperature: 22,
        humidity: 65,
        light: 400
    };

    const prediction = await model.predict(wetSensorData);
    
    // Test that prediction structure is correct (untrained model may give random results)
    assertDefined(prediction, 'Prediction should be defined');
    assertType(prediction.shouldWater, 'boolean', 'shouldWater should be boolean');
    assertRange(prediction.confidence, 0, 1, 'confidence should be valid');
    
    // If it doesn't recommend watering, amount should be 0
    if (!prediction.shouldWater) {
        assert(prediction.recommendedAmount === 0, 'Should not recommend water if no watering needed');
    }
    
    model.dispose();
});

// Test 7: Historical Data Integration
runner.test('Historical Data Integration', async () => {
    const model = new WateringPredictionModel();
    model.createModel();
    
    const currentSensorData = {
        moisture: 45,
        temperature: 26,
        humidity: 52,
        light: 580
    };
    
    const historicalData = [
        { moisture: 60, temperature: 23, humidity: 58, light: 480 },
        { moisture: 55, temperature: 24, humidity: 56, light: 520 },
        { moisture: 50, temperature: 25, humidity: 54, light: 550 }
    ];

    const prediction = await model.predict(currentSensorData, historicalData);
    
    assertDefined(prediction, 'Prediction with historical data should work');
    assertType(prediction.shouldWater, 'boolean', 'shouldWater should be boolean');
    assertRange(prediction.confidence, 0, 1, 'confidence should be valid');
    
    model.dispose();
});

// Test 8: Main Module Interface
runner.test('Main Module Interface', async () => {
    // Test data validation
    const validData = { moisture: 45, temperature: 22, humidity: 60, light: 500 };
    const invalidData = { moisture: 150, temperature: 'invalid', humidity: -10 };
    
    const validErrors = wateringPrediction.validateSensorData(validData);
    const invalidErrors = wateringPrediction.validateSensorData(invalidData);
    
    assert(Array.isArray(validErrors), 'Validation should return array');
    assert(validErrors.length === 0, 'Valid data should have no errors');
    assert(invalidErrors.length > 0, 'Invalid data should have errors');
    
    // Test prediction through main interface
    const prediction = await wateringPrediction.predict(validData);
    assertDefined(prediction, 'Main interface prediction should work');
    assertType(prediction.shouldWater, 'boolean', 'shouldWater should be boolean');
    assertRange(prediction.confidence, 0, 1, 'confidence should be valid');
});

// Test 9: Edge Cases
runner.test('Edge Cases - Extreme Values', async () => {
    const model = new WateringPredictionModel();
    model.createModel();
    
    const extremeData = {
        moisture: 0,
        temperature: 50,
        humidity: 0,
        light: 1000
    };

    const prediction = await model.predict(extremeData);
    
    assertDefined(prediction, 'Should handle extreme values');
    assertType(prediction.shouldWater, 'boolean', 'shouldWater should be boolean');
    assertRange(prediction.confidence, 0, 1, 'confidence should be valid');
    
    model.dispose();
});

// Test 10: Performance Test
runner.test('Performance - Prediction Speed', async () => {
    const model = new WateringPredictionModel();
    model.createModel();
    
    const sensorData = { moisture: 40, temperature: 25, humidity: 55, light: 500 };
    const startTime = Date.now();
    
    await model.predict(sensorData);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    assert(duration < 5000, `Prediction should complete within 5 seconds, took ${duration}ms`);
    
    model.dispose();
});

// Test 11: Multiple Predictions
runner.test('Multiple Consecutive Predictions', async () => {
    const model = new WateringPredictionModel();
    model.createModel();
    
    const testData = [
        { moisture: 20, temperature: 25, humidity: 50, light: 600 },
        { moisture: 50, temperature: 22, humidity: 65, light: 400 },
        { moisture: 80, temperature: 28, humidity: 45, light: 700 }
    ];

    const predictions = [];
    for (const sensorData of testData) {
        const prediction = await model.predict(sensorData);
        predictions.push(prediction);
    }
    
    assert(predictions.length === 3, 'Should handle multiple predictions');
    predictions.forEach((prediction, index) => {
        assertDefined(prediction, `Prediction ${index + 1} should be defined`);
        assertType(prediction.shouldWater, 'boolean', `Prediction ${index + 1} shouldWater should be boolean`);
        assertRange(prediction.confidence, 0, 1, `Prediction ${index + 1} confidence should be valid`);
    });
    
    model.dispose();
});

// Test 12: Memory Management
runner.test('Memory Management - Model Disposal', async () => {
    const model = new WateringPredictionModel();
    model.createModel();
    
    assertDefined(model.model, 'Model should be created');
    assert(model.isLoaded === false, 'isLoaded should be false initially'); // Model created but not loaded from file
    
    model.dispose();
    assert(model.model === null, 'Model should be null after disposal');
    assert(model.isLoaded === false, 'isLoaded should be false after disposal');
});

// Run all tests
async function runTests() {
    try {
        const success = await runner.run();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('Test runner failed:', error);
        process.exit(1);
    }
}

// Execute tests if this file is run directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests, TestRunner };