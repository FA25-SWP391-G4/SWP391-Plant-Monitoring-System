const { DiseaseRecognitionModel, getInstance } = require('./index');
// Try to use TensorFlow.js Node, fallback to browser version
let tf;
try {
    tf = require('@tensorflow/tfjs-node');
} catch (error) {
    console.warn('TensorFlow.js Node not available, using browser version');
    tf = require('@tensorflow/tfjs');
    require('@tensorflow/tfjs-backend-cpu');
}
const sharp = require('sharp');
const path = require('path');

/**
 * Test the disease recognition model implementation
 */
async function testDiseaseRecognitionModel() {
    console.log('=== Disease Recognition Model Test ===\n');
    
    try {
        // Get model instance
        const diseaseModel = getInstance();
        
        // Test 1: Model initialization
        console.log('1. Testing model initialization...');
        await diseaseModel.initialize();
        console.log('✓ Model initialized successfully\n');
        
        // Test 2: Model info
        console.log('2. Testing model info...');
        const modelInfo = diseaseModel.getModelInfo();
        console.log('Model Info:', JSON.stringify(modelInfo, null, 2));
        console.log('✓ Model info retrieved successfully\n');
        
        // Test 3: Health check
        console.log('3. Testing health check...');
        const healthStatus = await diseaseModel.healthCheck();
        console.log('Health Status:', JSON.stringify(healthStatus, null, 2));
        console.log('✓ Health check completed\n');
        
        // Test 4: Create test image
        console.log('4. Creating test image...');
        const testImageBuffer = await createTestImage();
        console.log('✓ Test image created\n');
        
        // Test 5: Image validation
        console.log('5. Testing image validation...');
        const mockFile = {
            originalname: 'test-plant.jpg',
            mimetype: 'image/jpeg',
            size: testImageBuffer.length
        };
        const validation = diseaseModel.validateImage(mockFile);
        console.log('Validation Result:', JSON.stringify(validation, null, 2));
        console.log('✓ Image validation completed\n');
        
        // Test 6: Disease analysis
        console.log('6. Testing disease analysis...');
        const analysisResult = await diseaseModel.analyzeImage(testImageBuffer);
        console.log('Analysis Result:');
        console.log('- Disease:', analysisResult.analysis?.diseaseDetected);
        console.log('- Confidence:', analysisResult.analysis?.confidence);
        console.log('- Severity:', analysisResult.analysis?.severity);
        console.log('- Treatments:', analysisResult.recommendations?.treatments);
        console.log('✓ Disease analysis completed\n');
        
        // Test 7: Batch analysis
        console.log('7. Testing batch analysis...');
        const batchResults = await diseaseModel.analyzeBatch([testImageBuffer, testImageBuffer]);
        console.log(`✓ Batch analysis completed for ${batchResults.length} images\n`);
        
        // Test 8: Memory cleanup
        console.log('8. Testing memory cleanup...');
        diseaseModel.dispose();
        console.log('✓ Model disposed successfully\n');
        
        console.log('=== All Tests Passed! ===');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

/**
 * Create a test image buffer for testing
 */
async function createTestImage() {
    try {
        // Create a 224x224 test image with plant-like colors
        const testImage = await sharp({
            create: {
                width: 224,
                height: 224,
                channels: 3,
                background: { r: 34, g: 139, b: 34 } // Forest green
            }
        })
        .png()
        .toBuffer();
        
        return testImage;
    } catch (error) {
        console.error('Error creating test image:', error);
        throw error;
    }
}

/**
 * Test individual components
 */
async function testComponents() {
    console.log('\n=== Component Tests ===\n');
    
    try {
        // Test ModelLoader
        console.log('Testing ModelLoader...');
        const ModelLoader = require('./modelLoader');
        const loader = new ModelLoader();
        await loader.loadModel();
        console.log('✓ ModelLoader test passed\n');
        
        // Test ImagePreprocessor
        console.log('Testing ImagePreprocessor...');
        const ImagePreprocessor = require('./imagePreprocessor');
        const preprocessor = new ImagePreprocessor();
        
        const testBuffer = await createTestImage();
        const tensor = await preprocessor.preprocessImage(testBuffer);
        console.log('Tensor shape:', tensor.shape);
        tensor.dispose();
        console.log('✓ ImagePreprocessor test passed\n');
        
        // Cleanup
        loader.dispose();
        
    } catch (error) {
        console.error('❌ Component test failed:', error);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    (async () => {
        try {
            await testDiseaseRecognitionModel();
            await testComponents();
            process.exit(0);
        } catch (error) {
            console.error('Test execution failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = {
    testDiseaseRecognitionModel,
    testComponents,
    createTestImage
};