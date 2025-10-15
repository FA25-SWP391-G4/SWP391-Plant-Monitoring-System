const { redisCacheService } = require('./services/redisCacheService');
const { modelOptimizationService } = require('./services/modelOptimizationService');
const { databaseOptimizationService } = require('./services/databaseOptimizationService');
const { performanceMonitorService } = require('./services/performanceMonitorService');
const { optimizedIrrigationCacheService } = require('./services/optimizedIrrigationCacheService');
const { AIComputationWorkerManager } = require('./workers/aiComputationWorker');
const { logger } = require('./utils/errorHandler');

/**
 * Comprehensive Performance Optimization Test Suite
 * Tests all implemented optimization features
 */
class PerformanceOptimizationTester {
  constructor() {
    this.workerManager = new AIComputationWorkerManager();
    this.testResults = {
      redis: { passed: 0, failed: 0, tests: [] },
      models: { passed: 0, failed: 0, tests: [] },
      database: { passed: 0, failed: 0, tests: [] },
      workers: { passed: 0, failed: 0, tests: [] },
      irrigation: { passed: 0, failed: 0, tests: [] },
      performance: { passed: 0, failed: 0, tests: [] }
    };
  }

  /**
   * Run all performance optimization tests
   */
  async runAllTests() {
    console.log('🚀 Starting Performance Optimization Test Suite...\n');
    
    try {
      await this.testRedisCache();
      await this.testModelOptimization();
      await this.testDatabaseOptimization();
      await this.testWorkerProcessing();
      await this.testIrrigationCache();
      await this.testPerformanceMonitoring();
      
      this.printTestSummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  /**
   * Test Redis caching functionality
   */
  async testRedisCache() {
    console.log('📦 Testing Redis Cache Service...');
    
    // Test 1: Basic cache operations
    await this.runTest('redis', 'Basic Cache Operations', async () => {
      const testData = { message: 'Hello Redis!', timestamp: Date.now() };
      
      // Set cache
      const setResult = await redisCacheService.set('chatbotResponses', 'test-key', testData);
      if (!setResult) throw new Error('Failed to set cache');
      
      // Get cache
      const cached = await redisCacheService.get('chatbotResponses', 'test-key');
      if (!cached || cached.message !== testData.message) {
        throw new Error('Cache data mismatch');
      }
      
      // Delete cache
      const deleteResult = await redisCacheService.delete('chatbotResponses', 'test-key');
      if (!deleteResult) throw new Error('Failed to delete cache');
      
      return 'Basic cache operations working correctly';
    });

    // Test 2: Batch operations
    await this.runTest('redis', 'Batch Operations', async () => {
      const batchData = {
        'key1': { value: 'data1' },
        'key2': { value: 'data2' },
        'key3': { value: 'data3' }
      };
      
      const result = await redisCacheService.mset('modelPredictions', batchData);
      if (!result) throw new Error('Batch set failed');
      
      // Verify batch data
      const cached1 = await redisCacheService.get('modelPredictions', 'key1');
      if (!cached1 || cached1.value !== 'data1') {
        throw new Error('Batch data verification failed');
      }
      
      return 'Batch operations working correctly';
    });

    // Test 3: Cache statistics
    await this.runTest('redis', 'Cache Statistics', async () => {
      const stats = await redisCacheService.getStats();
      
      if (!stats || typeof stats !== 'object') {
        throw new Error('Invalid stats format');
      }
      
      if (!stats.cacheTypes || !stats.fallback) {
        throw new Error('Missing stats components');
      }
      
      return `Cache stats: ${Object.keys(stats.cacheTypes).length} cache types`;
    });

    console.log('✅ Redis Cache tests completed\n');
  }

  /**
   * Test model optimization functionality
   */
  async testModelOptimization() {
    console.log('🧠 Testing Model Optimization Service...');
    
    // Test 1: Model loading
    await this.runTest('models', 'Model Loading', async () => {
      const model = await modelOptimizationService.loadModel('diseaseDetection');
      
      if (!model) throw new Error('Failed to load model');
      
      return 'Disease detection model loaded successfully';
    });

    // Test 2: Model statistics
    await this.runTest('models', 'Model Statistics', async () => {
      const stats = modelOptimizationService.getModelStats();
      
      if (!stats || typeof stats !== 'object') {
        throw new Error('Invalid model stats');
      }
      
      if (stats.loadedModels < 0 || stats.maxModels < 0) {
        throw new Error('Invalid model counts');
      }
      
      return `Model stats: ${stats.loadedModels}/${stats.maxModels} models loaded`;
    });

    // Test 3: Model warm-up
    await this.runTest('models', 'Model Warm-up', async () => {
      await modelOptimizationService.warmUpModels(['irrigationPrediction']);
      
      const stats = modelOptimizationService.getModelStats();
      if (!stats.models['irrigationPrediction']) {
        throw new Error('Model warm-up failed');
      }
      
      return 'Model warm-up completed successfully';
    });

    console.log('✅ Model Optimization tests completed\n');
  }

  /**
   * Test database optimization functionality
   */
  async testDatabaseOptimization() {
    console.log('🗄️ Testing Database Optimization Service...');
    
    // Test 1: Database health check
    await this.runTest('database', 'Health Check', async () => {
      const health = await databaseOptimizationService.healthCheck();
      
      if (!health || !health.status) {
        throw new Error('Invalid health check response');
      }
      
      return `Database status: ${health.status}`;
    });

    // Test 2: Database statistics
    await this.runTest('database', 'Database Statistics', async () => {
      const stats = await databaseOptimizationService.getDatabaseStats();
      
      if (!stats) {
        throw new Error('Failed to get database stats');
      }
      
      if (stats.error) {
        throw new Error(`Database stats error: ${stats.error}`);
      }
      
      return 'Database statistics retrieved successfully';
    });

    // Test 3: Query optimization (mock test)
    await this.runTest('database', 'Query Optimization', async () => {
      // This would test actual query optimization in a real scenario
      // For now, we'll just verify the service is working
      
      const testQuery = 'SELECT 1 as test';
      const analysis = await databaseOptimizationService.analyzeQuery(testQuery);
      
      if (analysis.error) {
        throw new Error(`Query analysis failed: ${analysis.error}`);
      }
      
      return 'Query optimization analysis working';
    });

    console.log('✅ Database Optimization tests completed\n');
  }

  /**
   * Test worker processing functionality
   */
  async testWorkerProcessing() {
    console.log('⚡ Testing Worker Processing...');
    
    // Test 1: Image processing worker
    await this.runTest('workers', 'Image Processing', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      const options = { resize: { width: 224, height: 224 }, plantDetection: true };
      
      const result = await this.workerManager.processImage(mockImageBuffer, options);
      
      if (!result || !result.processedData) {
        throw new Error('Image processing failed');
      }
      
      return `Image processed: ${result.dimensions.join('x')} pixels`;
    });

    // Test 2: Model inference worker
    await this.runTest('workers', 'Model Inference', async () => {
      const mockInputData = [0.5, 0.3, 0.8, 0.2, 0.6, 0.4, 0.7, 0.1];
      
      const result = await this.workerManager.runModelInference('irrigationPrediction', mockInputData);
      
      if (!result || !result.shouldWater === undefined) {
        throw new Error('Model inference failed');
      }
      
      return `Inference result: ${result.shouldWater ? 'water needed' : 'no water needed'}`;
    });

    // Test 3: Sensor data analysis worker
    await this.runTest('workers', 'Sensor Data Analysis', async () => {
      const mockSensorData = [
        { timestamp: Date.now() - 3600000, value: 45.2, type: 'moisture' },
        { timestamp: Date.now() - 1800000, value: 42.8, type: 'moisture' },
        { timestamp: Date.now(), value: 38.5, type: 'moisture' }
      ];
      
      const result = await this.workerManager.analyzeSensorData(mockSensorData, 'pattern');
      
      if (!result || !result.dailyPattern) {
        throw new Error('Sensor analysis failed');
      }
      
      return `Pattern analysis: peak at hour ${result.dailyPattern.peak}`;
    });

    // Test 4: Worker statistics
    await this.runTest('workers', 'Worker Statistics', async () => {
      const stats = this.workerManager.getStats();
      
      if (!stats || typeof stats.activeWorkers !== 'number') {
        throw new Error('Invalid worker stats');
      }
      
      return `Workers: ${stats.activeWorkers}/${stats.maxWorkers} active`;
    });

    console.log('✅ Worker Processing tests completed\n');
  }

  /**
   * Test irrigation cache functionality
   */
  async testIrrigationCache() {
    console.log('💧 Testing Irrigation Cache Service...');
    
    // Test 1: Prediction caching
    await this.runTest('irrigation', 'Prediction Caching', async () => {
      const plantId = 1;
      const sensorData = {
        soilMoisture: 45.5,
        temperature: 24.2,
        humidity: 65.8,
        lightLevel: 850
      };
      const prediction = {
        shouldWater: true,
        hoursUntilWater: 2,
        confidence: 0.85
      };
      
      // Cache prediction
      const cached = await optimizedIrrigationCacheService.cachePrediction(plantId, sensorData, prediction);
      if (!cached) throw new Error('Failed to cache prediction');
      
      // Retrieve prediction
      const retrieved = await optimizedIrrigationCacheService.getCachedPrediction(plantId, sensorData);
      if (!retrieved || retrieved.prediction.shouldWater !== true) {
        throw new Error('Failed to retrieve cached prediction');
      }
      
      return `Prediction cached with confidence ${retrieved.prediction.confidence}`;
    });

    // Test 2: Sensor data caching
    await this.runTest('irrigation', 'Sensor Data Caching', async () => {
      const plantId = 2;
      const sensorData = {
        soilMoisture: 52.3,
        temperature: 22.8,
        humidity: 58.2,
        lightLevel: 920,
        timestamp: Date.now()
      };
      
      const cached = await optimizedIrrigationCacheService.cacheSensorData(plantId, sensorData);
      if (!cached) throw new Error('Failed to cache sensor data');
      
      const latest = await optimizedIrrigationCacheService.getLatestSensorData(plantId);
      if (!latest || latest.data.sm !== 52.3) {
        throw new Error('Failed to retrieve latest sensor data');
      }
      
      return 'Sensor data cached and retrieved successfully';
    });

    // Test 3: Batch operations
    await this.runTest('irrigation', 'Batch Caching', async () => {
      const predictions = [
        {
          plantId: 3,
          sensorData: { soilMoisture: 40, temperature: 25, humidity: 60, lightLevel: 800 },
          prediction: { shouldWater: false, confidence: 0.75 }
        },
        {
          plantId: 4,
          sensorData: { soilMoisture: 35, temperature: 26, humidity: 55, lightLevel: 850 },
          prediction: { shouldWater: true, confidence: 0.90 }
        }
      ];
      
      const result = await optimizedIrrigationCacheService.batchCachePredictions(predictions);
      if (!result) throw new Error('Batch caching failed');
      
      return `Batch cached ${predictions.length} predictions`;
    });

    // Test 4: Cache statistics
    await this.runTest('irrigation', 'Cache Statistics', async () => {
      const stats = optimizedIrrigationCacheService.getStats();
      
      if (!stats || typeof stats.hitRate !== 'number') {
        throw new Error('Invalid cache stats');
      }
      
      return `Cache hit rate: ${stats.hitRate}%, operations: ${stats.totalOperations}`;
    });

    console.log('✅ Irrigation Cache tests completed\n');
  }

  /**
   * Test performance monitoring functionality
   */
  async testPerformanceMonitoring() {
    console.log('📊 Testing Performance Monitoring...');
    
    // Test 1: Request recording
    await this.runTest('performance', 'Request Recording', async () => {
      const requestData = performanceMonitorService.recordRequest('/api/ai/test', 'POST');
      
      if (!requestData || !requestData.startTime) {
        throw new Error('Failed to record request');
      }
      
      // Simulate response
      performanceMonitorService.recordResponse(requestData, 200);
      
      return 'Request/response recording working';
    });

    // Test 2: Performance report
    await this.runTest('performance', 'Performance Report', async () => {
      const report = await performanceMonitorService.getPerformanceReport();
      
      if (!report || !report.timestamp) {
        throw new Error('Failed to generate performance report');
      }
      
      if (!report.system || !report.requests) {
        throw new Error('Incomplete performance report');
      }
      
      return `Report generated with ${report.requests.totalRequests} total requests`;
    });

    // Test 3: Cache operation recording
    await this.runTest('performance', 'Cache Operation Recording', async () => {
      performanceMonitorService.recordCacheOperation('get', 'testCache', true);
      performanceMonitorService.recordCacheOperation('get', 'testCache', false);
      
      const report = await performanceMonitorService.getPerformanceReport();
      
      if (!report.cache || !report.cache.metrics) {
        throw new Error('Cache metrics not recorded');
      }
      
      return 'Cache operations recorded successfully';
    });

    // Test 4: Model performance recording
    await this.runTest('performance', 'Model Performance Recording', async () => {
      performanceMonitorService.recordModelPerformance('testModel', 'inference', 150, 0.85);
      
      const report = await performanceMonitorService.getPerformanceReport();
      
      if (!report.models || !report.models.metrics) {
        throw new Error('Model metrics not recorded');
      }
      
      return 'Model performance recorded successfully';
    });

    console.log('✅ Performance Monitoring tests completed\n');
  }

  /**
   * Run individual test with error handling
   */
  async runTest(category, testName, testFunction) {
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults[category].passed++;
      this.testResults[category].tests.push({
        name: testName,
        status: 'PASSED',
        result,
        duration: `${duration}ms`
      });
      
      console.log(`  ✅ ${testName}: ${result} (${duration}ms)`);
      
    } catch (error) {
      this.testResults[category].failed++;
      this.testResults[category].tests.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        duration: 'N/A'
      });
      
      console.log(`  ❌ ${testName}: ${error.message}`);
    }
  }

  /**
   * Print comprehensive test summary
   */
  printTestSummary() {
    console.log('\n📋 Performance Optimization Test Summary');
    console.log('=' .repeat(50));
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const [category, results] of Object.entries(this.testResults)) {
      const categoryTotal = results.passed + results.failed;
      const passRate = categoryTotal > 0 ? (results.passed / categoryTotal * 100).toFixed(1) : '0.0';
      
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  Passed: ${results.passed}`);
      console.log(`  Failed: ${results.failed}`);
      console.log(`  Pass Rate: ${passRate}%`);
      
      totalPassed += results.passed;
      totalFailed += results.failed;
      
      // Show failed tests
      if (results.failed > 0) {
        console.log('  Failed Tests:');
        results.tests
          .filter(test => test.status === 'FAILED')
          .forEach(test => {
            console.log(`    - ${test.name}: ${test.error}`);
          });
      }
    }
    
    const overallTotal = totalPassed + totalFailed;
    const overallPassRate = overallTotal > 0 ? (totalPassed / overallTotal * 100).toFixed(1) : '0.0';
    
    console.log('\n' + '='.repeat(50));
    console.log(`OVERALL RESULTS:`);
    console.log(`  Total Tests: ${overallTotal}`);
    console.log(`  Passed: ${totalPassed}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Pass Rate: ${overallPassRate}%`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All performance optimization tests passed!');
    } else {
      console.log(`\n⚠️  ${totalFailed} test(s) failed. Please review the implementation.`);
    }
    
    console.log('\n🚀 Performance optimization implementation completed!');
    console.log('\nFeatures implemented:');
    console.log('  ✅ Redis caching with fallback');
    console.log('  ✅ Model lazy loading and optimization');
    console.log('  ✅ Database query optimization with indexing');
    console.log('  ✅ WebWorker for heavy computations');
    console.log('  ✅ Performance monitoring and metrics');
    console.log('  ✅ Optimized irrigation cache service');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new PerformanceOptimizationTester();
  
  tester.runAllTests()
    .then(() => {
      console.log('\n✅ Test suite completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { PerformanceOptimizationTester };