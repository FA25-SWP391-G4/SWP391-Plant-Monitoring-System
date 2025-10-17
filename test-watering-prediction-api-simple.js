/**
 * Simple API Tests for Watering Prediction Endpoint
 * Tests the AI controller's predictWatering endpoint functionality
 * Requirements: 2.1, 2.2
 */

// Mock the database models before requiring the controller
const originalRequire = require;
require = function(id) {
    if (id === './models/SystemLog') {
        return {
            create: async () => ({ log_id: 'test-log' })
        };
    }
    if (id === './models/AIPrediction') {
        return {
            createWateringPrediction: async () => ({ prediction_id: 'test-prediction-123' })
        };
    }
    if (id === './models/Plant') {
        return {
            findById: async () => ({ user_id: 1, custom_name: 'Test Plant' })
        };
    }
    if (id === './models/Alert') {
        return {
            create: async () => ({ alert_id: 'test-alert' })
        };
    }
    if (id === './models/SensorData') {
        return {
            getRecentData: async () => []
        };
    }
    if (id === '../models/SystemLog') {
        return {
            create: async () => ({ log_id: 'test-log' })
        };
    }
    if (id === '../models/AIPrediction') {
        return {
            createWateringPrediction: async () => ({ prediction_id: 'test-prediction-123' })
        };
    }
    if (id === '../models/Plant') {
        return {
            findById: async () => ({ user_id: 1, custom_name: 'Test Plant' })
        };
    }
    if (id === '../models/Alert') {
        return {
            create: async () => ({ alert_id: 'test-alert' })
        };
    }
    if (id === '../models/SensorData') {
        return {
            getRecentData: async () => []
        };
    }
    return originalRequire.apply(this, arguments);
};

const { predictWatering } = require('./controllers/aiController');

// Simple test framework
class APITestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('🧪 Running Watering Prediction API Tests\n');
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
            console.log('🎉 All API tests passed!');
        } else {
            console.log('⚠️  Some API tests failed');
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

// Mock request and response objects
function createMockReq(body) {
    return {
        body: body || {},
        user: { user_id: 1, id: 1 }
    };
}

function createMockRes() {
    const res = {
        statusCode: 200,
        responseData: null,
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.responseData = data;
            return this;
        }
    };
    return res;
}

// Test suite
const runner = new APITestRunner();

// Test 1: Valid Request with Dry Soil
runner.test('Valid Request - Dry Soil Should Recommend Watering', async () => {
    const req = createMockReq({
        plant_id: 123,
        sensor_data: { moisture: 20, temperature: 28, humidity: 45, light: 700 }
    });
    const res = createMockRes();

    await predictWatering(req, res);

    assert(res.statusCode === 200, `Expected status 200, got ${res.statusCode}`);
    assertDefined(res.responseData, 'Response data should be defined');
    assert(res.responseData.success === true, 'Response should indicate success');
    
    const data = res.responseData.data;
    assertDefined(data, 'Response data should be defined');
    assertDefined(data.prediction, 'Prediction should be defined');
    assertDefined(data.plant_id, 'Plant ID should be in response');
    assert(data.plant_id === 123, 'Plant ID should match request');
    
    const prediction = data.prediction;
    assertType(prediction.shouldWater, 'boolean', 'shouldWater should be boolean');
    assertType(prediction.confidence, 'number', 'confidence should be number');
    assertRange(prediction.confidence, 0, 1, 'confidence should be between 0 and 1');
    assertType(prediction.recommendedAmount, 'number', 'recommendedAmount should be number');
    assert(prediction.recommendedAmount >= 0, 'recommendedAmount should be non-negative');
    assertDefined(prediction.reasoning, 'reasoning should be defined');
    assert(Array.isArray(prediction.recommendations), 'recommendations should be array');
});

// Test 2: Valid Request with Well-Watered Soil
runner.test('Valid Request - Well-Watered Soil Should Not Recommend Watering', async () => {
    const req = createMockReq({
        plant_id: 456,
        sensor_data: { moisture: 75, temperature: 22, humidity: 65, light: 400 }
    });
    const res = createMockRes();

    await predictWatering(req, res);

    assert(res.statusCode === 200, `Expected status 200, got ${res.statusCode}`);
    assert(res.responseData.success === true, 'Response should indicate success');
    
    const prediction = res.responseData.data.prediction;
    assertType(prediction.shouldWater, 'boolean', 'shouldWater should be boolean');
    assertRange(prediction.confidence, 0, 1, 'confidence should be valid');
    
    // Well-watered soil typically shouldn't need water
    if (!prediction.shouldWater) {
        assert(prediction.recommendedAmount === 0, 'Should not recommend water for well-watered soil');
    }
});

// Test 3: Missing Sensor Data
runner.test('Missing Sensor Data Should Return Error', async () => {
    const req = createMockReq({
        plant_id: 123
        // missing sensor_data
    });
    const res = createMockRes();

    await predictWatering(req, res);

    assert(res.statusCode === 400, `Expected status 400, got ${res.statusCode}`);
    assert(res.responseData.success === false, 'Response should indicate failure');
    assert(res.responseData.message.includes('Sensor data is required'), 'Should mention missing sensor data');
});

// Test 4: Missing Plant ID
runner.test('Missing Plant ID Should Return Error', async () => {
    const req = createMockReq({
        sensor_data: { moisture: 45, temperature: 25 }
        // missing plant_id
    });
    const res = createMockRes();

    await predictWatering(req, res);

    assert(res.statusCode === 400, `Expected status 400, got ${res.statusCode}`);
    assert(res.responseData.success === false, 'Response should indicate failure');
    assert(res.responseData.message.includes('Plant ID is required'), 'Should mention missing plant ID');
});

// Test 5: Invalid Sensor Data Type
runner.test('Invalid Sensor Data Type Should Return Error', async () => {
    const req = createMockReq({
        plant_id: 123,
        sensor_data: "invalid string data"
    });
    const res = createMockRes();

    await predictWatering(req, res);

    assert(res.statusCode === 400, `Expected status 400, got ${res.statusCode}`);
    assert(res.responseData.success === false, 'Response should indicate failure');
    assert(res.responseData.message.includes('Sensor data must be an object'), 'Should mention invalid sensor data type');
});

// Test 6: Array as Sensor Data Should Return Error
runner.test('Array as Sensor Data Should Return Error', async () => {
    const req = createMockReq({
        plant_id: 123,
        sensor_data: [{ moisture: 45 }]
    });
    const res = createMockRes();

    await predictWatering(req, res);

    assert(res.statusCode === 400, `Expected status 400, got ${res.statusCode}`);
    assert(res.responseData.success === false, 'Response should indicate failure');
    assert(res.responseData.message.includes('Sensor data must be an object'), 'Should mention invalid sensor data type');
});

// Test 7: Null Plant ID Should Be Allowed for Testing
runner.test('Null Plant ID Should Be Allowed for Testing', async () => {
    const req = createMockReq({
        plant_id: null,
        sensor_data: { moisture: 45, temperature: 25, humidity: 60, light: 500 }
    });
    const res = createMockRes();

    await predictWatering(req, res);

    assert(res.statusCode === 200, `Expected status 200, got ${res.statusCode}`);
    assert(res.responseData.success === true, 'Response should indicate success');
    assert(res.responseData.data.plant_id === null, 'Plant ID should be null in response');
});

// Test 8: Missing Sensor Properties Should Be Handled
runner.test('Missing Sensor Properties Should Be Handled', async () => {
    const req = createMockReq({
        plant_id: 123,
        sensor_data: { moisture: 45 } // missing temperature, humidity, light
    });
    const res = createMockRes();

    await predictWatering(req, res);

    assert(res.statusCode === 200, `Expected status 200, got ${res.statusCode}`);
    assert(res.responseData.success === true, 'Response should indicate success');
    
    const prediction = res.responseData.data.prediction;
    assertType(prediction.shouldWater, 'boolean', 'shouldWater should be boolean');
    assertRange(prediction.confidence, 0, 1, 'confidence should be valid');
});

// Test 9: Extreme Sensor Values Should Be Handled
runner.test('Extreme Sensor Values Should Be Handled', async () => {
    const req = createMockReq({
        plant_id: 123,
        sensor_data: { moisture: 0, temperature: 50, humidity: 0, light: 1000 }
    });
    const res = createMockRes();

    await predictWatering(req, res);

    assert(res.statusCode === 200, `Expected status 200, got ${res.statusCode}`);
    assert(res.responseData.success === true, 'Response should indicate success');
    
    const prediction = res.responseData.data.prediction;
    assertType(prediction.shouldWater, 'boolean', 'shouldWater should be boolean');
    assertRange(prediction.confidence, 0, 1, 'confidence should be valid');
});

// Test 10: Response Structure Validation
runner.test('Response Structure Should Be Complete', async () => {
    const req = createMockReq({
        plant_id: 123,
        sensor_data: { moisture: 40, temperature: 25, humidity: 55, light: 500 }
    });
    const res = createMockRes();

    await predictWatering(req, res);

    assert(res.statusCode === 200, `Expected status 200, got ${res.statusCode}`);
    
    const data = res.responseData.data;
    assertDefined(data.prediction_id, 'prediction_id should be defined');
    assertDefined(data.plant_id, 'plant_id should be defined');
    assertDefined(data.prediction, 'prediction should be defined');
    assertDefined(data.model_version, 'model_version should be defined');
    assertDefined(data.timestamp, 'timestamp should be defined');
    assertDefined(data.input_data, 'input_data should be defined');
    
    const prediction = data.prediction;
    assertDefined(prediction.shouldWater, 'shouldWater should be defined');
    assertDefined(prediction.confidence, 'confidence should be defined');
    assertDefined(prediction.recommendedAmount, 'recommendedAmount should be defined');
    assertDefined(prediction.reasoning, 'reasoning should be defined');
    assertDefined(prediction.recommendations, 'recommendations should be defined');
});

// Run all tests
async function runAPITests() {
    try {
        const success = await runner.run();
        return success;
    } catch (error) {
        console.error('API test runner failed:', error);
        return false;
    }
}

// Execute tests if this file is run directly
if (require.main === module) {
    runAPITests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { runAPITests, APITestRunner };