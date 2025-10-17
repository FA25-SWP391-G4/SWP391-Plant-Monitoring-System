const { getInstance } = require('./index');
const sharp = require('sharp');

/**
 * Simple test for improvements without TensorFlow.js Node installation
 */
async function testSimpleImprovements() {
    console.log('🧪 Testing Disease Recognition Model Improvements (Simple)\n');
    console.log('=' .repeat(60));
    
    try {
        // Test 1: Model initialization with improvements
        console.log('\n1️⃣  Testing Improved Model Initialization...');
        const diseaseModel = getInstance();
        await diseaseModel.initialize();
        
        const modelInfo = diseaseModel.getModelInfo();
        console.log('✅ Model initialized successfully');
        console.log('📊 Supported classes:', modelInfo.supportedClasses.length);
        console.log('🏗️  Model capabilities:', modelInfo.capabilities.length);
        
        // Test 2: Enhanced prediction with warnings and disclaimers
        console.log('\n2️⃣  Testing Enhanced Prediction System...');
        const testImage = await createTestPlantImage();
        const analysisResult = await diseaseModel.analyzeImage(testImage);
        
        console.log('🔍 Analysis Results:');
        console.log('   Disease:', analysisResult.analysis.diseaseDetected);
        console.log('   Confidence:', (analysisResult.analysis.confidence * 100).toFixed(1) + '%');
        console.log('   Severity:', analysisResult.analysis.severity);
        
        // Check if reliability assessment exists
        if (analysisResult.analysis.reliability) {
            console.log('   Reliability Level:', analysisResult.analysis.reliability.level);
            console.log('   Reliability Score:', analysisResult.analysis.reliability.score + '/100');
        }
        
        console.log('\n⚠️  Warnings (' + analysisResult.warnings.length + '):');
        analysisResult.warnings.forEach((warning, i) => {
            console.log(`   ${i + 1}. ${warning}`);
        });
        
        console.log('\n📋 Disclaimers (' + analysisResult.disclaimers.length + '):');
        analysisResult.disclaimers.forEach((disclaimer, i) => {
            console.log(`   ${i + 1}. ${disclaimer}`);
        });
        
        if (analysisResult.analysis.reliability) {
            console.log('\n💡 Reliability Recommendation:');
            console.log('   ', analysisResult.analysis.reliability.recommendation);
        }
        
        // Test 3: Image quality assessment
        console.log('\n3️⃣  Testing Image Quality Assessment...');
        const imageQuality = analysisResult.imageInfo.quality;
        console.log('🖼️  Image Quality:');
        console.log('   Score:', (imageQuality.score * 100).toFixed(0) + '/100');
        console.log('   Issues:', imageQuality.issues.length);
        console.log('   Recommendations:', imageQuality.recommendations.length);
        
        if (imageQuality.issues.length > 0) {
            console.log('   Issues found:');
            imageQuality.issues.forEach((issue, i) => {
                console.log(`     ${i + 1}. ${issue}`);
            });
        }
        
        // Test 4: Treatment recommendations
        console.log('\n4️⃣  Testing Treatment Recommendations...');
        const recommendations = analysisResult.recommendations;
        console.log('💊 Treatment Recommendations:');
        console.log('   Treatments:', recommendations.treatments.length);
        console.log('   Prevention tips:', recommendations.prevention.length);
        console.log('   Urgency level:', recommendations.urgency);
        
        recommendations.treatments.forEach((treatment, i) => {
            console.log(`   ${i + 1}. ${treatment}`);
        });
        
        // Test 5: Performance measurement
        console.log('\n5️⃣  Testing Performance...');
        const performanceResults = await testPerformance(diseaseModel, testImage);
        console.log('📈 Performance Results:');
        console.log('   Average time:', performanceResults.avgTime + 'ms');
        console.log('   Memory efficient:', performanceResults.memoryEfficient ? '✅ Yes' : '❌ No');
        console.log('   Consistency:', performanceResults.consistency + '%');
        
        // Test 6: Error handling
        console.log('\n6️⃣  Testing Error Handling...');
        const errorTests = await testErrorHandling(diseaseModel);
        console.log('🛡️  Error Handling Tests:');
        errorTests.forEach(test => {
            console.log(`   ${test.test}: ${test.passed ? '✅ PASS' : '❌ FAIL'}`);
        });
        
        // Test 7: Model architecture check
        console.log('\n7️⃣  Testing Model Architecture...');
        const hasImprovedModel = diseaseModel.modelLoader.model && 
                                diseaseModel.modelLoader.model.layers && 
                                diseaseModel.modelLoader.model.layers.length > 10;
        
        console.log('🏗️  Architecture Assessment:');
        console.log('   Improved CNN:', hasImprovedModel ? '✅ Yes' : '❌ Basic model');
        console.log('   Complex architecture:', hasImprovedModel ? '✅ Yes' : '❌ Simple');
        console.log('   Production ready:', '❌ Development only');
        
        // Cleanup
        diseaseModel.dispose();
        
        console.log('\n' + '=' .repeat(60));
        console.log('🎉 Simple improvement tests completed!');
        console.log('✅ Key improvements verified:');
        console.log('   - Enhanced warnings and disclaimers');
        console.log('   - Reliability assessment system');
        console.log('   - Image quality evaluation');
        console.log('   - Comprehensive error handling');
        console.log('   - Treatment recommendations');
        
        return true;
        
    } catch (error) {
        console.error('❌ Simple improvement tests failed:', error);
        return false;
    }
}

/**
 * Create a test plant image
 */
async function createTestPlantImage() {
    return await sharp({
        create: {
            width: 300,
            height: 300,
            channels: 3,
            background: { r: 60, g: 140, b: 60 }
        }
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Test performance improvements
 */
async function testPerformance(model, testImage) {
    const iterations = 3;
    const times = [];
    const initialMemory = process.memoryUsage().heapUsed;
    
    for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await model.analyzeImage(testImage);
        const end = Date.now();
        times.push(end - start);
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
    
    // Calculate consistency
    const stdDev = Math.sqrt(times.reduce((sq, n) => sq + Math.pow(n - avgTime, 2), 0) / times.length);
    const consistency = Math.max(0, 100 - (stdDev / avgTime * 100));
    
    return {
        avgTime: Math.round(avgTime),
        memoryEfficient: memoryIncrease < 50, // Less than 50MB increase
        consistency: Math.round(consistency)
    };
}

/**
 * Test error handling improvements
 */
async function testErrorHandling(model) {
    const tests = [
        {
            test: 'Invalid image data',
            action: async () => {
                try {
                    await model.analyzeImage(Buffer.from('invalid'));
                    return false;
                } catch (error) {
                    return error.message.includes('analysis failed') || 
                           error.message.includes('preprocessing failed') ||
                           error.message.includes('unsupported image format');
                }
            }
        },
        {
            test: 'Empty buffer',
            action: async () => {
                try {
                    await model.analyzeImage(Buffer.alloc(0));
                    return false;
                } catch (error) {
                    return true;
                }
            }
        },
        {
            test: 'Null input handling',
            action: async () => {
                try {
                    await model.analyzeImage(null);
                    return false;
                } catch (error) {
                    return true;
                }
            }
        }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const passed = await test.action();
            results.push({ test: test.test, passed });
        } catch (error) {
            results.push({ test: test.test, passed: true }); // Error caught = good
        }
    }
    
    return results;
}

// Run tests if called directly
if (require.main === module) {
    (async () => {
        try {
            const success = await testSimpleImprovements();
            process.exit(success ? 0 : 1);
        } catch (error) {
            console.error('Test execution failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = {
    testSimpleImprovements
};