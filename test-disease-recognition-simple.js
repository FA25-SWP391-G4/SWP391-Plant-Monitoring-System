/**
 * Simple test runner for Disease Recognition System
 * Runs core functionality tests without Jest dependencies
 */

const { DiseaseRecognitionModel } = require('./ai_models/disease_recognition/index');
const ImagePreprocessor = require('./ai_models/disease_recognition/imagePreprocessor');
const DiseaseRecognitionModelLoader = require('./ai_models/disease_recognition/modelLoader');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Simple test framework
class SimpleTest {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('🧪 Running Disease Recognition Tests...\n');
        
        for (const { name, testFn } of this.tests) {
            try {
                console.log(`⏳ ${name}`);
                await testFn();
                console.log(`✅ ${name} - PASSED\n`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${name} - FAILED`);
                console.log(`   Error: ${error.message}\n`);
                this.failed++;
            }
        }

        console.log(`\n📊 Test Results:`);
        console.log(`   Passed: ${this.passed}`);
        console.log(`   Failed: ${this.failed}`);
        console.log(`   Total: ${this.tests.length}`);
        
        if (this.failed === 0) {
            console.log(`\n🎉 All tests passed!`);
        } else {
            console.log(`\n⚠️  ${this.failed} test(s) failed`);
        }
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, got ${actual}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
                }
            },
            toBeDefined: () => {
                if (actual === undefined) {
                    throw new Error('Expected value to be defined');
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
            },
            toBeGreaterThanOrEqual: (expected) => {
                if (actual < expected) {
                    throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
                }
            },
            toBeLessThanOrEqual: (expected) => {
                if (actual > expected) {
                    throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            },
            toHaveLength: (expected) => {
                if (actual.length !== expected) {
                    throw new Error(`Expected length ${expected}, got ${actual.length}`);
                }
            }
        };
    }
}

// Initialize test framework
const test = new SimpleTest();

// Test setup
let testImageBuffer;
let testImagePath;

async function setupTests() {
    // Create test image
    testImageBuffer = await sharp({
        create: {
            width: 300,
            height: 300,
            channels: 3,
            background: { r: 100, g: 150, b: 100 }
        }
    })
    .png()
    .toBuffer();

    testImagePath = path.join(__dirname, 'temp_test_image.png');
    fs.writeFileSync(testImagePath, testImageBuffer);
}

async function cleanupTests() {
    if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
    }
}

// Image Preprocessing Tests
test.test('Image preprocessing should create correct tensor shape', async () => {
    const imagePreprocessor = new ImagePreprocessor();
    const imageTensor = await imagePreprocessor.preprocessImage(testImageBuffer);
    
    test.expect(imageTensor).toBeDefined();
    test.expect(imageTensor.shape).toEqual([224, 224, 3]);
    test.expect(imageTensor.dtype).toBe('float32');
    
    imageTensor.dispose();
});

test.test('Image preprocessing should handle file path input', async () => {
    const imagePreprocessor = new ImagePreprocessor();
    const imageTensor = await imagePreprocessor.preprocessImage(testImagePath);
    
    test.expect(imageTensor).toBeDefined();
    test.expect(imageTensor.shape).toEqual([224, 224, 3]);
    
    imageTensor.dispose();
});

test.test('Image preprocessing should handle corrupted images gracefully', async () => {
    const imagePreprocessor = new ImagePreprocessor();
    const corruptedBuffer = Buffer.from('not an image');
    
    const imageTensor = await imagePreprocessor.preprocessImage(corruptedBuffer);
    
    test.expect(imageTensor).toBeDefined();
    test.expect(imageTensor.shape).toEqual([224, 224, 3]);
    
    imageTensor.dispose();
});

test.test('Image feature extraction should work correctly', async () => {
    const imagePreprocessor = new ImagePreprocessor();
    const features = await imagePreprocessor.extractImageFeatures(testImageBuffer);
    
    test.expect(features).toBeDefined();
    test.expect(features.dimensions).toBeDefined();
    test.expect(features.dimensions.width).toBeGreaterThan(0);
    test.expect(features.dimensions.height).toBeGreaterThan(0);
    test.expect(features.dimensions.channels).toBe(3);
    test.expect(features.quality).toBeDefined();
    test.expect(features.quality.score).toBeGreaterThanOrEqual(0);
    test.expect(features.quality.score).toBeLessThanOrEqual(1);
});

test.test('Thumbnail creation should work correctly', async () => {
    const imagePreprocessor = new ImagePreprocessor();
    const thumbnail = await imagePreprocessor.createThumbnail(testImageBuffer, 100);
    
    test.expect(thumbnail).toBeDefined();
    test.expect(Buffer.isBuffer(thumbnail)).toBe(true);
    test.expect(thumbnail.length).toBeGreaterThan(0);
});

// Model Loading Tests
test.test('Model loader should load fallback model successfully', async () => {
    const modelLoader = new DiseaseRecognitionModelLoader();
    const loaded = await modelLoader.loadModel();
    
    test.expect(loaded).toBe(true);
    test.expect(modelLoader.isLoaded).toBe(true);
    test.expect(modelLoader.model).toBeDefined();
    test.expect(modelLoader.classes).toBeDefined();
    test.expect(Array.isArray(modelLoader.classes)).toBe(true);
    test.expect(modelLoader.classes.length).toBeGreaterThan(0);
    
    modelLoader.dispose();
});

test.test('Model should make predictions correctly', async () => {
    const modelLoader = new DiseaseRecognitionModelLoader();
    const imagePreprocessor = new ImagePreprocessor();
    
    await modelLoader.loadModel();
    
    const imageTensor = await imagePreprocessor.preprocessImage(testImageBuffer);
    const prediction = await modelLoader.predict(imageTensor);
    
    test.expect(prediction).toBeDefined();
    test.expect(prediction.topPrediction).toBeDefined();
    test.expect(prediction.topPrediction.disease).toBeDefined();
    test.expect(prediction.topPrediction.confidence).toBeGreaterThanOrEqual(0);
    test.expect(prediction.topPrediction.confidence).toBeLessThanOrEqual(1);
    test.expect(prediction.allPredictions).toBeDefined();
    test.expect(Array.isArray(prediction.allPredictions)).toBe(true);
    
    imageTensor.dispose();
    modelLoader.dispose();
});

test.test('Model should calculate severity correctly', async () => {
    const modelLoader = new DiseaseRecognitionModelLoader();
    
    const severityLow = modelLoader.calculateSeverity(0.2);
    const severityMild = modelLoader.calculateSeverity(0.5);
    const severityModerate = modelLoader.calculateSeverity(0.7);
    const severitySevere = modelLoader.calculateSeverity(0.9);

    test.expect(severityLow).toBe('uncertain');
    test.expect(severityMild).toBe('mild');
    test.expect(severityModerate).toBe('moderate');
    test.expect(severitySevere).toBe('severe');
});

test.test('Model should provide treatment recommendations', async () => {
    const modelLoader = new DiseaseRecognitionModelLoader();
    const treatments = modelLoader.getTreatmentRecommendations('Early Blight', 'moderate');
    
    test.expect(treatments).toBeDefined();
    test.expect(Array.isArray(treatments)).toBe(true);
    test.expect(treatments.length).toBeGreaterThan(0);
});

// Full System Integration Tests
test.test('Disease recognition system should initialize correctly', async () => {
    const diseaseModel = new DiseaseRecognitionModel();
    const initialized = await diseaseModel.initialize();
    
    test.expect(initialized).toBe(true);
    test.expect(diseaseModel.isInitialized).toBe(true);
    
    diseaseModel.dispose();
});

test.test('Disease recognition system should analyze images end-to-end', async () => {
    const diseaseModel = new DiseaseRecognitionModel();
    await diseaseModel.initialize();
    
    const result = await diseaseModel.analyzeImage(testImageBuffer);
    
    test.expect(result).toBeDefined();
    test.expect(result.success).toBe(true);
    test.expect(result.analysis).toBeDefined();
    test.expect(result.analysis.diseaseDetected).toBeDefined();
    test.expect(result.analysis.confidence).toBeGreaterThanOrEqual(0);
    test.expect(result.analysis.confidence).toBeLessThanOrEqual(1);
    test.expect(result.recommendations).toBeDefined();
    test.expect(result.imageInfo).toBeDefined();
    
    diseaseModel.dispose();
});

test.test('Disease recognition system should perform health check', async () => {
    const diseaseModel = new DiseaseRecognitionModel();
    await diseaseModel.initialize();
    
    const health = await diseaseModel.healthCheck();
    
    test.expect(health).toBeDefined();
    test.expect(health.status).toBeDefined();
    test.expect(health.initialized).toBe(true);
    
    diseaseModel.dispose();
});

test.test('Disease recognition system should get model information', async () => {
    const diseaseModel = new DiseaseRecognitionModel();
    await diseaseModel.initialize();
    
    const modelInfo = diseaseModel.getModelInfo();
    
    test.expect(modelInfo).toBeDefined();
    test.expect(modelInfo.initialized).toBe(true);
    test.expect(modelInfo.supportedClasses).toBeDefined();
    test.expect(Array.isArray(modelInfo.supportedClasses)).toBe(true);
    test.expect(modelInfo.inputShape).toEqual([224, 224, 3]);
    
    diseaseModel.dispose();
});

// Disease Classification Accuracy Tests
test.test('Disease classification should handle different image types', async () => {
    const diseaseModel = new DiseaseRecognitionModel();
    await diseaseModel.initialize();
    
    // Test with healthy plant simulation (green)
    const healthyImageBuffer = await sharp({
        create: {
            width: 224,
            height: 224,
            channels: 3,
            background: { r: 50, g: 150, b: 50 }
        }
    })
    .png()
    .toBuffer();

    const result = await diseaseModel.analyzeImage(healthyImageBuffer);
    
    test.expect(result).toBeDefined();
    test.expect(result.success).toBe(true);
    test.expect(result.analysis.confidence).toBeGreaterThanOrEqual(0.05);
    
    diseaseModel.dispose();
});

test.test('Disease classification should provide consistent predictions', async () => {
    const modelLoader = new DiseaseRecognitionModelLoader();
    const imagePreprocessor = new ImagePreprocessor();
    
    await modelLoader.loadModel();
    
    const imageTensor = await imagePreprocessor.preprocessImage(testImageBuffer);
    
    const prediction1 = await modelLoader.predict(imageTensor);
    const prediction2 = await modelLoader.predict(imageTensor);
    
    test.expect(prediction1.topPrediction.disease).toBe(prediction2.topPrediction.disease);
    test.expect(Math.abs(prediction1.topPrediction.confidence - prediction2.topPrediction.confidence)).toBeLessThan(0.01);
    
    imageTensor.dispose();
    modelLoader.dispose();
});

// Run all tests
async function runTests() {
    try {
        await setupTests();
        await test.run();
        await cleanupTests();
    } catch (error) {
        console.error('Test setup failed:', error);
        process.exit(1);
    }
}

// Execute tests if run directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };