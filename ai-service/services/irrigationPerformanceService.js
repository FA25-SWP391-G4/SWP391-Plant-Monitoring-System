const winston = require('winston');
const IrrigationCacheService = require('./irrigationCacheService');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/irrigation-performance.log' }),
    new winston.transports.Console()
  ]
});

class IrrigationPerformanceService {
  constructor(predictionService, plantAlgorithms) {
    this.predictionService = predictionService;
    this.plantAlgorithms = plantAlgorithms;
    this.cacheService = new IrrigationCacheService();
    
    // Performance configuration
    this.config = {
      batchSize: 10,
      maxConcurrentPredictions: 5,
      predictionTimeout: 5000, // 5 seconds
      cacheEnabled: true,
      modelOptimizationEnabled: true,
      
      // Performance thresholds
      maxResponseTime: 3000, // 3 seconds
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB
      
      // Batch processing settings
      batchProcessingInterval: 1000, // 1 second
      maxBatchWaitTime: 2000, // 2 seconds
    };
    
    // Performance metrics
    this.metrics = {
      totalPredictions: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      batchProcessedCount: 0,
      errorRate: 0,
      memoryUsage: 0,
      
      // Response time buckets
      responseTimes: [],
      maxResponseTimes: 100 // Keep last 100 response times
    };
    
    // Batch processing queue
    this.batchQueue = [];
    this.batchTimer = null;
    this.processingBatch = false;
    
    // Model optimization state
    this.modelOptimized = false;
    this.optimizationInProgress = false;
    
    this.initialize();
  }

  async initialize() {
    try {
      logger.info('Initializing irrigation performance service');
      
      // Start batch processing
      this.startBatchProcessing();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      // Optimize model if enabled
      if (this.config.modelOptimizationEnabled) {
        await this.optimizeModel();
      }
      
      logger.info('Irrigation performance service initialized');
      
    } catch (error) {
      logger.error('Error initializing performance service:', error);
    }
  }

  // Optimized prediction with caching
  async predictWithOptimization(plantId, sensorData) {
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const sensorHash = this.cacheService.generateSensorDataHash(sensorData);
      
      // Try cache first if enabled
      if (this.config.cacheEnabled) {
        const cachedPrediction = await this.cacheService.getCachedPrediction(plantId, sensorHash);
        if (cachedPrediction) {
          this.updateMetrics(startTime, true);
          logger.debug('Returned cached prediction', { plantId });
          return cachedPrediction;
        }
      }
      
      // Make prediction
      const prediction = await this.predictionService.predict({
        ...sensorData,
        plantId: plantId
      });
      
      // Cache the result
      if (this.config.cacheEnabled) {
        await this.cacheService.cachePrediction(plantId, sensorHash, prediction);
      }
      
      this.updateMetrics(startTime, false);
      return prediction;
      
    } catch (error) {
      this.metrics.errorRate++;
      logger.error('Error in optimized prediction:', error);
      throw error;
    }
  }

  // Batch prediction processing
  async batchPredict(requests) {
    const startTime = Date.now();
    
    try {
      logger.info('Processing batch predictions', { count: requests.length });
      
      // Group requests by plant type for optimization
      const groupedRequests = this.groupRequestsByPlantType(requests);
      
      // Process each group concurrently
      const groupPromises = Object.entries(groupedRequests).map(
        ([plantType, typeRequests]) => this.processBatchGroup(plantType, typeRequests)
      );
      
      const groupResults = await Promise.all(groupPromises);
      
      // Flatten results
      const results = groupResults.flat();
      
      this.metrics.batchProcessedCount++;
      const processingTime = Date.now() - startTime;
      
      logger.info('Batch prediction completed', {
        count: requests.length,
        processingTime,
        averagePerPrediction: processingTime / requests.length
      });
      
      return results;
      
    } catch (error) {
      logger.error('Error in batch prediction:', error);
      throw error;
    }
  }

  async processBatchGroup(plantType, requests) {
    try {
      // Check cache for all requests first
      const cachePromises = requests.map(req => 
        this.cacheService.getCachedPrediction(
          req.plantId, 
          this.cacheService.generateSensorDataHash(req.sensorData)
        )
      );
      
      const cachedResults = await Promise.all(cachePromises);
      
      // Identify requests that need prediction
      const uncachedRequests = [];
      const results = [];
      
      for (let i = 0; i < requests.length; i++) {
        if (cachedResults[i]) {
          results[i] = cachedResults[i];
        } else {
          uncachedRequests.push({ index: i, ...requests[i] });
        }
      }
      
      // Process uncached requests
      if (uncachedRequests.length > 0) {
        const predictionPromises = uncachedRequests.map(req =>
          this.predictionService.predict({
            ...req.sensorData,
            plantId: req.plantId
          })
        );
        
        const predictions = await Promise.all(predictionPromises);
        
        // Cache new predictions and fill results
        for (let i = 0; i < uncachedRequests.length; i++) {
          const req = uncachedRequests[i];
          const prediction = predictions[i];
          
          results[req.index] = prediction;
          
          // Cache the result
          const sensorHash = this.cacheService.generateSensorDataHash(req.sensorData);
          await this.cacheService.cachePrediction(req.plantId, sensorHash, prediction);
        }
      }
      
      logger.debug('Processed batch group', {
        plantType,
        total: requests.length,
        cached: cachedResults.filter(r => r !== null).length,
        computed: uncachedRequests.length
      });
      
      return results;
      
    } catch (error) {
      logger.error('Error processing batch group:', error);
      throw error;
    }
  }

  // Queue-based batch processing
  addToBatchQueue(plantId, sensorData, callback) {
    const request = {
      plantId,
      sensorData,
      callback,
      timestamp: Date.now()
    };
    
    this.batchQueue.push(request);
    
    // Start batch timer if not already running
    if (!this.batchTimer && !this.processingBatch) {
      this.batchTimer = setTimeout(() => {
        this.processBatchQueue();
      }, this.config.batchProcessingInterval);
    }
    
    // Process immediately if batch is full
    if (this.batchQueue.length >= this.config.batchSize) {
      this.processBatchQueue();
    }
  }

  async processBatchQueue() {
    if (this.processingBatch || this.batchQueue.length === 0) {
      return;
    }
    
    this.processingBatch = true;
    
    try {
      // Clear timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }
      
      // Extract batch
      const batch = this.batchQueue.splice(0, this.config.batchSize);
      
      logger.debug('Processing batch queue', { batchSize: batch.length });
      
      // Process batch
      const requests = batch.map(item => ({
        plantId: item.plantId,
        sensorData: item.sensorData
      }));
      
      const results = await this.batchPredict(requests);
      
      // Call callbacks with results
      for (let i = 0; i < batch.length; i++) {
        try {
          batch[i].callback(null, results[i]);
        } catch (callbackError) {
          logger.error('Error in batch callback:', callbackError);
        }
      }
      
    } catch (error) {
      logger.error('Error processing batch queue:', error);
      
      // Call callbacks with error
      this.batchQueue.forEach(item => {
        try {
          item.callback(error, null);
        } catch (callbackError) {
          logger.error('Error in error callback:', callbackError);
        }
      });
      
    } finally {
      this.processingBatch = false;
      
      // Process remaining items if any
      if (this.batchQueue.length > 0) {
        this.batchTimer = setTimeout(() => {
          this.processBatchQueue();
        }, this.config.batchProcessingInterval);
      }
    }
  }

  // Model optimization
  async optimizeModel() {
    if (this.optimizationInProgress || this.modelOptimized) {
      return;
    }
    
    this.optimizationInProgress = true;
    
    try {
      logger.info('Starting model optimization');
      
      // Model quantization (simulated)
      await this.quantizeModel();
      
      // Warm up model with sample predictions
      await this.warmUpModel();
      
      // Optimize feature engineering
      await this.optimizeFeatureEngineering();
      
      this.modelOptimized = true;
      logger.info('Model optimization completed');
      
    } catch (error) {
      logger.error('Error during model optimization:', error);
    } finally {
      this.optimizationInProgress = false;
    }
  }

  async quantizeModel() {
    try {
      // Simulate model quantization
      logger.info('Quantizing model for better performance');
      
      // In a real implementation, this would:
      // 1. Convert model weights to lower precision (float16, int8)
      // 2. Optimize model graph
      // 3. Remove unnecessary operations
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info('Model quantization completed');
      
    } catch (error) {
      logger.error('Error quantizing model:', error);
    }
  }

  async warmUpModel() {
    try {
      logger.info('Warming up model with sample predictions');
      
      const sampleData = [
        { plantType: 'tomato', soilMoisture: 50, temperature: 25, humidity: 60 },
        { plantType: 'lettuce', soilMoisture: 70, temperature: 18, humidity: 65 },
        { plantType: 'herb', soilMoisture: 45, temperature: 22, humidity: 55 }
      ];
      
      const warmupPromises = sampleData.map(data =>
        this.predictionService.predict({ ...data, plantId: 0 })
      );
      
      await Promise.all(warmupPromises);
      
      logger.info('Model warm-up completed');
      
    } catch (error) {
      logger.error('Error warming up model:', error);
    }
  }

  async optimizeFeatureEngineering() {
    try {
      logger.info('Optimizing feature engineering pipeline');
      
      // Pre-compute common feature transformations
      // Cache plant profiles
      const plantTypes = ['tomato', 'lettuce', 'pepper', 'cucumber', 'herb', 'flower', 'other'];
      
      for (const plantType of plantTypes) {
        const profile = this.plantAlgorithms.getPlantProfile(plantType);
        await this.cacheService.cachePlantProfile(plantType, profile);
      }
      
      logger.info('Feature engineering optimization completed');
      
    } catch (error) {
      logger.error('Error optimizing feature engineering:', error);
    }
  }

  // Performance monitoring
  startPerformanceMonitoring() {
    // Monitor every 30 seconds
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 30000);
  }

  collectPerformanceMetrics() {
    try {
      // Memory usage
      const memUsage = process.memoryUsage();
      this.metrics.memoryUsage = memUsage.heapUsed;
      
      // Cache statistics
      const cacheStats = this.cacheService.getStats();
      this.metrics.cacheHitRate = parseFloat(cacheStats.hitRate);
      
      // Calculate average response time
      if (this.metrics.responseTimes.length > 0) {
        const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
        this.metrics.averageResponseTime = sum / this.metrics.responseTimes.length;
      }
      
      // Log performance metrics
      logger.debug('Performance metrics collected', {
        memoryUsage: `${(this.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        averageResponseTime: `${this.metrics.averageResponseTime.toFixed(2)}ms`,
        cacheHitRate: `${this.metrics.cacheHitRate}%`,
        totalPredictions: this.metrics.totalPredictions
      });
      
      // Check for performance issues
      this.checkPerformanceThresholds();
      
    } catch (error) {
      logger.error('Error collecting performance metrics:', error);
    }
  }

  checkPerformanceThresholds() {
    const warnings = [];
    
    if (this.metrics.averageResponseTime > this.config.maxResponseTime) {
      warnings.push(`High response time: ${this.metrics.averageResponseTime.toFixed(2)}ms`);
    }
    
    if (this.metrics.memoryUsage > this.config.maxMemoryUsage) {
      warnings.push(`High memory usage: ${(this.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }
    
    if (this.metrics.cacheHitRate < 50) {
      warnings.push(`Low cache hit rate: ${this.metrics.cacheHitRate}%`);
    }
    
    if (warnings.length > 0) {
      logger.warn('Performance threshold warnings', { warnings });
    }
  }

  updateMetrics(startTime, fromCache) {
    const responseTime = Date.now() - startTime;
    
    this.metrics.totalPredictions++;
    this.metrics.responseTimes.push(responseTime);
    
    // Keep only recent response times
    if (this.metrics.responseTimes.length > this.metrics.maxResponseTimes) {
      this.metrics.responseTimes.shift();
    }
    
    if (fromCache) {
      logger.debug('Prediction served from cache', { responseTime });
    }
  }

  // Utility methods
  groupRequestsByPlantType(requests) {
    const grouped = {};
    
    for (const request of requests) {
      const plantType = request.sensorData.plantType || 'other';
      if (!grouped[plantType]) {
        grouped[plantType] = [];
      }
      grouped[plantType].push(request);
    }
    
    return grouped;
  }

  // Public API methods
  async predictOptimized(plantId, sensorData) {
    return new Promise((resolve, reject) => {
      // Add to batch queue for processing
      this.addToBatchQueue(plantId, sensorData, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  async predictImmediate(plantId, sensorData) {
    // For urgent predictions that can't wait for batching
    return this.predictWithOptimization(plantId, sensorData);
  }

  // Performance reporting
  getPerformanceReport() {
    const cacheStats = this.cacheService.getStats();
    
    return {
      predictions: {
        total: this.metrics.totalPredictions,
        batchProcessed: this.metrics.batchProcessedCount,
        errorRate: this.metrics.errorRate
      },
      performance: {
        averageResponseTime: `${this.metrics.averageResponseTime.toFixed(2)}ms`,
        memoryUsage: `${(this.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        modelOptimized: this.modelOptimized
      },
      cache: cacheStats,
      queue: {
        currentSize: this.batchQueue.length,
        processing: this.processingBatch
      },
      thresholds: {
        maxResponseTime: `${this.config.maxResponseTime}ms`,
        maxMemoryUsage: `${(this.config.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`
      }
    };
  }

  // Health check
  async healthCheck() {
    try {
      const cacheHealth = await this.cacheService.healthCheck();
      
      return {
        healthy: cacheHealth.healthy && this.metrics.errorRate < 10,
        cache: cacheHealth,
        performance: {
          averageResponseTime: this.metrics.averageResponseTime,
          memoryUsage: this.metrics.memoryUsage,
          modelOptimized: this.modelOptimized
        },
        queue: {
          size: this.batchQueue.length,
          processing: this.processingBatch
        }
      };
      
    } catch (error) {
      logger.error('Performance service health check failed:', error);
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  // Cleanup
  async cleanup() {
    try {
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }
      
      await this.cacheService.cleanup();
      
      logger.info('Performance service cleaned up');
      
    } catch (error) {
      logger.error('Error during performance service cleanup:', error);
    }
  }
}

module.exports = IrrigationPerformanceService;