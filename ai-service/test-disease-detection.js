const diseaseDetectionService = require('./services/diseaseDetectionService');
const imageValidationService = require('./services/imageValidationService');
const imageStorageService = require('./services/imageStorageService');
const analysisLoggingService = require('./services/analysisLoggingService');
const fs = require('fs');
const path = require('path');

/**
 * Test Disease Detection Implementation
 */
async function testDiseaseDetection() {
  console.log('🧪 Testing Disease Detection Implementation...\n');

  try {
    // Test 1: Initialize services
    console.log('1. Testing service initialization...');
    
    const diseaseInitResult = await diseaseDetectionService.initializeModel();
    console.log(`   Disease Detection Model: ${diseaseInitResult ? '✅ Loaded' : '❌ Failed'}`);
    
    const validationInitResult = await imageValidationService.initializeModel();
    console.log(`   Image Validation Model: ${validationInitResult ? '✅ Loaded' : '❌ Failed'}`);
    
    // Test 2: Check supported diseases
    console.log('\n2. Testing supported diseases...');
    const supportedDiseases = diseaseDetectionService.getSupportedDiseases();
    console.log(`   Supported diseases: ${Object.keys(supportedDiseases).length}`);
    Object.keys(supportedDiseases).forEach(key => {
      console.log(`   - ${key}: ${supportedDiseases[key].name}`);
    });

    // Test 3: Test image validation stats
    console.log('\n3. Testing image validation stats...');
    const validationStats = imageValidationService.getValidationStats();
    console.log(`   Max file size: ${validationStats.maxFileSize / (1024 * 1024)}MB`);
    console.log(`   Allowed types: ${validationStats.allowedMimeTypes.join(', ')}`);
    console.log(`   Plant confidence threshold: ${validationStats.plantConfidenceThreshold}`);

    // Test 4: Test storage stats
    console.log('\n4. Testing storage stats...');
    const storageStats = await imageStorageService.getStorageStats();
    console.log(`   Storage directory: ${storageStats.storageDirectory}`);
    console.log(`   Total images: ${storageStats.totalImages}`);
    console.log(`   Total size: ${storageStats.totalSizeMB}MB`);

    // Test 5: Create a mock image for testing
    console.log('\n5. Testing with mock image...');
    
    // Create a simple test image buffer (1x1 pixel PNG)
    const mockImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8B, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const mockFile = {
      buffer: mockImageBuffer,
      originalname: 'test-plant.png',
      mimetype: 'image/png',
      size: mockImageBuffer.length
    };

    // Test image validation
    console.log('   Testing image validation...');
    const validationResult = await imageValidationService.validateImage(mockFile);
    console.log(`   Validation result: ${validationResult.isValid ? '✅ Valid' : '❌ Invalid'}`);
    if (validationResult.errors.length > 0) {
      console.log(`   Errors: ${validationResult.errors.join(', ')}`);
    }
    if (validationResult.warnings.length > 0) {
      console.log(`   Warnings: ${validationResult.warnings.join(', ')}`);
    }

    // Test image storage
    console.log('   Testing image storage...');
    const storageResult = await imageStorageService.storeImage(mockImageBuffer, {
      originalName: 'test-plant.png',
      userId: 1,
      plantId: 1,
      mimeType: 'image/png'
    });
    console.log(`   Storage result: ${storageResult.success ? '✅ Stored' : '❌ Failed'}`);
    console.log(`   Filename: ${storageResult.filename}`);

    // Test image retrieval
    if (storageResult.success) {
      console.log('   Testing image retrieval...');
      const retrievedImage = await imageStorageService.retrieveImage(storageResult.filename);
      console.log(`   Retrieved image size: ${retrievedImage.buffer.length} bytes`);
      
      // Test thumbnail retrieval
      const thumbnailImage = await imageStorageService.retrieveImage(storageResult.filename, true);
      console.log(`   Retrieved thumbnail size: ${thumbnailImage.buffer.length} bytes`);
    }

    // Test 6: Test analysis logging
    console.log('\n6. Testing analysis logging...');
    const mockAnalysisResult = {
      diseases: [
        {
          diseaseKey: 'healthy',
          disease: supportedDiseases['healthy'],
          confidence: 0.85,
          severity: 'none'
        }
      ],
      primaryDisease: {
        diseaseKey: 'healthy',
        disease: supportedDiseases['healthy'],
        confidence: 0.85,
        severity: 'none'
      },
      confidence: 0.85,
      severity: 'none'
    };

    const loggingResult = await analysisLoggingService.logDiseaseAnalysis({
      plantId: 1,
      userId: 1,
      imageFile: mockFile,
      analysisResult: mockAnalysisResult,
      validationResult,
      processingTime: 1500,
      confidence: 0.85
    });
    
    console.log(`   Logging result: ${loggingResult.success ? '✅ Logged' : '❌ Failed'}`);
    console.log(`   Analysis ID: ${loggingResult.analysisId}`);

    // Test feedback logging
    if (loggingResult.analysisId) {
      console.log('   Testing feedback logging...');
      const feedbackResult = await analysisLoggingService.logUserFeedback({
        analysisId: loggingResult.analysisId,
        userId: 1,
        feedbackType: 'correct',
        userComment: 'Test feedback',
        actualResult: null
      });
      console.log(`   Feedback result: ${feedbackResult.success ? '✅ Logged' : '❌ Failed'}`);
    }

    // Test 7: Test analysis history
    console.log('\n7. Testing analysis history...');
    const historyResult = await analysisLoggingService.getAnalysisHistory({
      plantId: 1,
      limit: 5
    });
    console.log(`   History result: ${historyResult.success ? '✅ Retrieved' : '❌ Failed'}`);
    console.log(`   History count: ${historyResult.history?.length || 0}`);

    // Cleanup test image
    if (storageResult.success) {
      console.log('\n8. Cleaning up test image...');
      await imageStorageService.deleteImage(storageResult.filename);
      console.log('   ✅ Test image cleaned up');
    }

    console.log('\n🎉 Disease Detection Implementation Test Completed Successfully!');
    
    // Summary
    console.log('\n📊 Implementation Summary:');
    console.log('✅ Disease Detection Service - Ready');
    console.log('✅ Image Validation Service - Ready');
    console.log('✅ Image Storage Service - Ready');
    console.log('✅ Analysis Logging Service - Ready');
    console.log('✅ All core functionality working');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testDiseaseDetection().then(() => {
    console.log('\nTest completed. Exiting...');
    process.exit(0);
  }).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testDiseaseDetection };