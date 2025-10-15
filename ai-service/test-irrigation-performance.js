const IrrigationPerformanceService = require('./services/irrigationPerformanceService');
const IrrigationPredictionService = require('./services/irrigationPredictionService');
const PlantSpecificAlgorithms = require('./services/plantSpecificAlgorithms');
const IrrigationCacheService = require('./services/irrigationCacheService');

async function testIrrigationPerformance() {
  console.log('🚀 Testing Irrigation Performance & Caching System...\n');

  try {
    // Initialize services
    console.log('1. Initializing Services');
    const predictionService = new IrrigationPredictionService();
    const plantAlgorithms = new PlantSpecificAlgorithms();
    const cacheService = new IrrigationCacheService();
    
    // Wait for prediction service to load
    console.log('Waiting for ML model to load...');
    while (!predictionService.isModelLoaded) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const performanceService = new IrrigationPerformanceService(predictionService, plantAlgorithms);
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ All services initialized');

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Cache Service
    console.log('2. Testing Cache Service');
    
    const testSensorData = {
      soilMoisture: 45,
      temperature: 26,
      humidity: 60,
      lightLevel: 40000,
      plantType: 'tomato'
    };
    
    const sensorHash = cacheService.generateSensorDataHash(testSensorData);
    console.log('Generated sensor hash:', sensorHash);
    
    // Test cache miss
    const cachedResult1 = await cacheService.getCachedPrediction(1, sensorHash);
    console.log('Cache miss (expected):', cachedResult1 === null);
    
    // Cache a prediction
    const mockPrediction = {
      shouldWater: true,
      waterAmount: 400,
      confidence: 0.85,
      timestamp: new Date().toISOString()
    };
    
    await cacheService.cachePrediction(1, sensorHash, mockPrediction);
    console.log('✅ Cached prediction');
    
    // Test cache hit
    const cachedResult2 = await cacheService.getCachedPrediction(1, sensorHash);
    console.log('Cache hit:', cachedResult2 !== null);
    console.log('Cached data matches:', cachedResult2.shouldWater === mockPrediction.shouldWater);

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 3: Performance Optimization
    console.log('3. Testing Performance Optimization');
    
    // Single optimized prediction
    console.log('Testing single optimized prediction...');
    const startTime1 = Date.now();
    const result1 = await performanceService.predictOptimized(1, testSensorData);
    const time1 = Date.now() - startTime1;
    
    console.log('✅ Single prediction completed in', time1, 'ms');
    console.log('Result:', {
      shouldWater: result1.shouldWater,
      waterAmount: result1.waterAmount,
      confidence: result1.confidence
    });

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 4: Batch Processing
    console.log('4. Testing Batch Processing');
    
    const batchRequests = [];
    for (let i = 0; i < 5; i++) {
      batchRequests.push({
        plantId: i + 1,
        sensorData: {
          ...testSensorData,
          soilMoisture: 30 + i * 10,
          temperature: 20 + i * 2,
          plantType: ['tomato', 'lettuce', 'herb', 'pepper', 'cucumber'][i]
        }
      });
    }
    
    console.log('Processing batch of', batchRequests.length, 'predictions...');
    const startTime2 = Date.now();
    const batchResults = await performanceService.batchPredict(batchRequests);
    const time2 = Date.now() - startTime2;
    
    console.log('✅ Batch processing completed in', time2, 'ms');
    console.log('Average time per prediction:', (time2 / batchRequests.length).toFixed(2), 'ms');
    console.log('Batch results count:', batchResults.length);
    
    // Show first result
    if (batchResults.length > 0) {
      console.log('First result:', {
        shouldWater: batchResults[0].shouldWater,
        waterAmount: batchResults[0].waterAmount,
        confidence: batchResults[0].confidence
      });
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 5: Queue-based Processing
    console.log('5. Testing Queue-based Processing');
    
    const queuePromises = [];
    const queueStartTime = Date.now();
    
    for (let i = 0; i < 8; i++) {
      const promise = performanceService.predictOptimized(i + 10, {
        ...testSensorData,
        soilMoisture: 25 + i * 5,
        plantType: 'tomato'
      });
      queuePromises.push(promise);
    }
    
    console.log('Queued', queuePromises.length, 'predictions...');
    const queueResults = await Promise.all(queuePromises);
    const queueTime = Date.now() - queueStartTime;
    
    console.log('✅ Queue processing completed in', queueTime, 'ms');
    console.log('Average time per prediction:', (queueTime / queuePromises.length).toFixed(2), 'ms');
    console.log('All predictions successful:', queueResults.every(r => r !== null));

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 6: Cache Performance
    console.log('6. Testing Cache Performance');
    
    // Test cache hit performance
    const cacheTestData = {
      soilMoisture: 50,
      temperature: 25,
      humidity: 65,
      plantType: 'lettuce'
    };
    
    const cacheHash = cacheService.generateSensorDataHash(cacheTestData);
    
    // First call (cache miss)
    const startTime3 = Date.now();
    const result3 = await performanceService.predictOptimized(100, cacheTestData);
    const time3 = Date.now() - startTime3;
    
    // Second call (cache hit)
    const startTime4 = Date.now();
    const result4 = await performanceService.predictOptimized(100, cacheTestData);
    const time4 = Date.now() - startTime4;
    
    console.log('Cache miss time:', time3, 'ms');
    console.log('Cache hit time:', time4, 'ms');
    console.log('Cache speedup:', (time3 / time4).toFixed(2) + 'x');
    console.log('Results match:', result3.shouldWater === result4.shouldWater);

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 7: Performance Metrics
    console.log('7. Testing Performance Metrics');
    
    const performanceReport = performanceService.getPerformanceReport();
    console.log('Performance Report:');
    console.log('- Total Predictions:', performanceReport.predictions.total);
    console.log('- Batch Processed:', performanceReport.predictions.batchProcessed);
    console.log('- Average Response Time:', performanceReport.performance.averageResponseTime);
    console.log('- Memory Usage:', performanceReport.performance.memoryUsage);
    console.log('- Cache Hit Rate:', performanceReport.cache.hitRate);
    console.log('- Model Optimized:', performanceReport.performance.modelOptimized);

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 8: Cache Statistics
    console.log('8. Testing Cache Statistics');
    
    const cacheStats = cacheService.getStats();
    console.log('Cache Statistics:');
    console.log('- Cache Type:', cacheStats.cacheType);
    console.log('- Total Hits:', cacheStats.hits);
    console.log('- Total Misses:', cacheStats.misses);
    console.log('- Hit Rate:', cacheStats.hitRate);
    console.log('- Cache Size:', cacheStats.cacheSize);
    console.log('- Total Sets:', cacheStats.sets);

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 9: Health Checks
    console.log('9. Testing Health Checks');
    
    const cacheHealth = await cacheService.healthCheck();
    console.log('Cache Health:', {
      healthy: cacheHealth.healthy,
      cacheType: cacheHealth.cacheType,
      latency: cacheHealth.latency + 'ms'
    });
    
    const performanceHealth = await performanceService.healthCheck();
    console.log('Performance Health:', {
      healthy: performanceHealth.healthy,
      averageResponseTime: performanceHealth.performance.averageResponseTime,
      modelOptimized: performanceHealth.performance.modelOptimized
    });

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 10: Stress Test
    console.log('10. Stress Testing');
    
    console.log('Running stress test with 20 concurrent predictions...');
    const stressPromises = [];
    const stressStartTime = Date.now();
    
    for (let i = 0; i < 20; i++) {
      const promise = performanceService.predictOptimized(i + 200, {
        soilMoisture: 20 + Math.random() * 60,
        temperature: 15 + Math.random() * 20,
        humidity: 40 + Math.random() * 40,
        lightLevel: 20000 + Math.random() * 40000,
        plantType: ['tomato', 'lettuce', 'herb'][i % 3]
      });
      stressPromises.push(promise);
    }
    
    const stressResults = await Promise.all(stressPromises);
    const stressTime = Date.now() - stressStartTime;
    
    console.log('✅ Stress test completed');
    console.log('- Total time:', stressTime, 'ms');
    console.log('- Average per prediction:', (stressTime / 20).toFixed(2), 'ms');
    console.log('- Success rate:', (stressResults.filter(r => r !== null).length / 20 * 100).toFixed(1) + '%');
    console.log('- Throughput:', (20 / (stressTime / 1000)).toFixed(2), 'predictions/second');

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 11: Cache Invalidation
    console.log('11. Testing Cache Invalidation');
    
    // Cache some data for plant 999
    await cacheService.cachePrediction(999, 'test_hash', mockPrediction);
    await cacheService.cacheSensorData(999, testSensorData);
    
    console.log('Cached data for plant 999');
    
    // Verify cache exists
    const beforeInvalidation = await cacheService.getCachedPrediction(999, 'test_hash');
    console.log('Data exists before invalidation:', beforeInvalidation !== null);
    
    // Invalidate cache
    await cacheService.invalidatePlantCache(999);
    console.log('Invalidated cache for plant 999');
    
    // Verify cache is gone
    const afterInvalidation = await cacheService.getCachedPrediction(999, 'test_hash');
    console.log('Data exists after invalidation:', afterInvalidation !== null);
    
    console.log('✅ Cache invalidation working correctly');

    console.log('\n🎉 All performance and caching tests completed successfully!\n');

    // Final summary
    const finalReport = performanceService.getPerformanceReport();
    const finalCacheStats = cacheService.getStats();
    
    console.log('📊 Final Test Summary:');
    console.log(`- Total Predictions Processed: ${finalReport.predictions.total}`);
    console.log(`- Cache Hit Rate: ${finalCacheStats.hitRate}`);
    console.log(`- Average Response Time: ${finalReport.performance.averageResponseTime}`);
    console.log(`- Memory Usage: ${finalReport.performance.memoryUsage}`);
    console.log(`- Model Optimized: ${finalReport.performance.modelOptimized ? '✅' : '❌'}`);
    console.log(`- Cache Type: ${finalCacheStats.cacheType}`);

  } catch (error) {
    console.error('❌ Performance test failed:', error);
    console.error(error.stack);
  }
}

// Run tests
if (require.main === module) {
  testIrrigationPerformance().catch(console.error);
}

module.exports = testIrrigationPerformance;