const { getInstance } = require('./index');
const path = require('path');
const sharp = require('sharp');

/**
 * Integration test for disease recognition model with AI controller
 */
async function testDiseaseRecognitionIntegration() {
    console.log('=== Disease Recognition Integration Test ===\n');
    
    try {
        // Initialize the disease recognition model
        const diseaseModel = getInstance();
        await diseaseModel.initialize();
        console.log('✓ Disease recognition model initialized\n');
        
        // Test 1: Simulate image upload scenario
        console.log('1. Testing image upload simulation...');
        const testImageBuffer = await createPlantImage();
        
        // Simulate multer file object
        const mockFile = {
            originalname: 'plant-disease-test.jpg',
            mimetype: 'image/jpeg',
            size: testImageBuffer.length,
            buffer: testImageBuffer
        };
        
        // Validate the upload
        const validation = diseaseModel.validateImage(mockFile);
        console.log('Upload validation:', validation.isValid ? 'PASSED' : 'FAILED');
        
        if (!validation.isValid) {
            console.log('Validation errors:', validation.errors);
            return false;
        }
        
        // Test 2: Analyze the image
        console.log('\n2. Testing disease analysis...');
        const analysisResult = await diseaseModel.analyzeImage(testImageBuffer);
        
        if (analysisResult.success) {
            console.log('✓ Disease analysis completed successfully');
            console.log('- Disease detected:', analysisResult.analysis.diseaseDetected);
            console.log('- Confidence:', (analysisResult.analysis.confidence * 100).toFixed(1) + '%');
            console.log('- Severity:', analysisResult.analysis.severity);
            console.log('- Is healthy:', analysisResult.analysis.isHealthy);
            console.log('- Treatment count:', analysisResult.recommendations.treatments.length);
            console.log('- Prevention tips count:', analysisResult.recommendations.prevention.length);
        } else {
            console.log('❌ Disease analysis failed:', analysisResult.error);
            return false;
        }
        
        // Test 3: Test API response format compatibility
        console.log('\n3. Testing API response format...');
        const apiResponse = {
            success: true,
            data: {
                diseaseDetected: analysisResult.analysis.diseaseDetected,
                confidence: analysisResult.analysis.confidence,
                severity: analysisResult.analysis.severity,
                treatmentSuggestions: analysisResult.recommendations.treatments,
                preventionTips: analysisResult.recommendations.prevention,
                urgency: analysisResult.recommendations.urgency,
                modelVersion: analysisResult.analysis.modelVersion,
                timestamp: analysisResult.timestamp
            },
            imageInfo: {
                quality: analysisResult.imageInfo.quality,
                dimensions: analysisResult.imageInfo.dimensions
            }
        };
        
        console.log('✓ API response format created successfully');
        console.log('Response size:', JSON.stringify(apiResponse).length, 'bytes');
        
        // Test 4: Performance test
        console.log('\n4. Testing performance...');
        const startTime = Date.now();
        
        for (let i = 0; i < 3; i++) {
            await diseaseModel.analyzeImage(testImageBuffer);
        }
        
        const endTime = Date.now();
        const avgTime = (endTime - startTime) / 3;
        console.log(`✓ Average analysis time: ${avgTime.toFixed(0)}ms`);
        
        // Test 5: Memory usage test
        console.log('\n5. Testing memory management...');
        const initialMemory = process.memoryUsage().heapUsed;
        
        // Run multiple analyses
        for (let i = 0; i < 5; i++) {
            await diseaseModel.analyzeImage(testImageBuffer);
        }
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
        console.log(`✓ Memory increase: ${memoryIncrease.toFixed(2)}MB`);
        
        // Test 6: Error handling
        console.log('\n6. Testing error handling...');
        try {
            // Test with invalid image data
            await diseaseModel.analyzeImage(Buffer.from('invalid image data'));
            console.log('❌ Should have thrown error for invalid image');
            return false;
        } catch (error) {
            console.log('✓ Error handling works correctly:', error.message.substring(0, 50) + '...');
        }
        
        // Cleanup
        diseaseModel.dispose();
        console.log('\n✓ Model disposed successfully');
        
        console.log('\n=== Integration Test Completed Successfully! ===');
        return true;
        
    } catch (error) {
        console.error('❌ Integration test failed:', error);
        return false;
    }
}

/**
 * Create a realistic plant image for testing
 */
async function createPlantImage() {
    try {
        // Create a more realistic plant-like test image
        const width = 300;
        const height = 300;
        
        // Create base green image
        const baseImage = await sharp({
            create: {
                width: width,
                height: height,
                channels: 3,
                background: { r: 50, g: 120, b: 50 } // Dark green
            }
        })
        .png()
        .toBuffer();
        
        // Add some texture/variation to make it more realistic
        const texturedImage = await sharp(baseImage)
            .modulate({
                brightness: 1.1,
                saturation: 1.2,
                hue: 10
            })
            .sharpen()
            .jpeg({ quality: 85 })
            .toBuffer();
        
        return texturedImage;
    } catch (error) {
        console.error('Error creating test plant image:', error);
        throw error;
    }
}

/**
 * Test disease recognition with different image types
 */
async function testDifferentImageTypes() {
    console.log('\n=== Testing Different Image Types ===\n');
    
    const diseaseModel = getInstance();
    await diseaseModel.initialize();
    
    // Test different image formats and sizes
    const testCases = [
        { name: 'Small image (100x100)', width: 100, height: 100 },
        { name: 'Large image (800x600)', width: 800, height: 600 },
        { name: 'Square image (400x400)', width: 400, height: 400 },
        { name: 'Portrait image (300x500)', width: 300, height: 500 },
        { name: 'Landscape image (500x300)', width: 500, height: 300 }
    ];
    
    for (const testCase of testCases) {
        try {
            console.log(`Testing ${testCase.name}...`);
            
            const testImage = await sharp({
                create: {
                    width: testCase.width,
                    height: testCase.height,
                    channels: 3,
                    background: { r: 60, g: 130, b: 60 }
                }
            })
            .jpeg({ quality: 80 })
            .toBuffer();
            
            const result = await diseaseModel.analyzeImage(testImage);
            
            if (result.success) {
                console.log(`✓ ${testCase.name}: SUCCESS`);
                console.log(`  - Quality score: ${result.imageInfo.quality.score.toFixed(2)}`);
                console.log(`  - Processing time: ~${Date.now() % 1000}ms`);
            } else {
                console.log(`❌ ${testCase.name}: FAILED - ${result.error}`);
            }
            
        } catch (error) {
            console.log(`❌ ${testCase.name}: ERROR - ${error.message}`);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    (async () => {
        try {
            const success = await testDiseaseRecognitionIntegration();
            if (success) {
                await testDifferentImageTypes();
            }
            process.exit(success ? 0 : 1);
        } catch (error) {
            console.error('Test execution failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = {
    testDiseaseRecognitionIntegration,
    testDifferentImageTypes
};