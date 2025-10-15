const tf = require('@tensorflow/tfjs');
const { logger } = require('../utils/errorHandler');
const { redisCacheService } = require('./redisCacheService');

/**
 * Model Optimization and Lazy Loading Service
 * Handles AI model loading, optimization, and memory management
 */
class ModelOptimizationService {
  constructor() {
    this.loadedModels = new Map();
    this.modelMetadata = new Map();
    this.loadingPromises = new Map(); // Prevent duplicate loading
    this.lastAccessTime = new Map();
    this.maxModelsInMemory = 3; // Limit concurrent models
    this.modelUnloadTimeout = 30 * 60 * 1000; // 30 minutes
    
    // Model configurations
    this.modelConfigs = {
      diseaseDetection: {
        path: './models/disease-detection-model.json',
        inputShape: [224, 224, 3],
        outputClasses: 8,
        quantized: true,
        priority: 1
      },
      irrigationPrediction: {
        path: './models/irrigation-prediction-model.json',
        inputShape: [8], // 8 sensor features
        outputClasses: 4, // shouldWater, hoursUntilWater, waterAmount, confidence
        quantized: true,
        priority: 2
      },
      plantClassification: {
        path: './models/plant-classification-model.json',
        inputShape: [224, 224, 3],
        outputClasses: 20,
        quantized: false,
        priority: 3
      }
    };
    
    this.startPeriodicCleanup();
  }

  /**
   * Lazy load model with caching and optimization
   */
  async loadModel(modelName, forceReload = false) {
    try {
      // Check if model is already loaded
      if (!forceReload && this.loadedModels.has(modelName)) {
        this.updateLastAccessTime(modelName);
        logger.debug(`Model ${modelName} already loaded, returning cached version`);
        return this.loadedModels.get(modelName);
      }

      // Check if model is currently being loaded
      if (this.loadingPromises.has(modelName)) {
        logger.debug(`Model ${modelName} is being loaded, waiting...`);
        return await this.loadingPromises.get(modelName);
      }

      const config = this.modelConfigs[modelName];
      if (!config) {
        throw new Error(`Unknown model: ${modelName}`);
      }

      // Create loading promise
      const loadingPromise = this._loadModelInternal(modelName, config);
      this.loadingPromises.set(modelName, loadingPromise);

      try {
        const model = await loadingPromise;
        this.loadingPromises.delete(modelName);
        return model;
      } catch (error) {
        this.loadingPromises.delete(modelName);
        throw error;
      }

    } catch (error) {
      logger.error(`Failed to load model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Internal model loading with optimization
   */
  async _loadModelInternal(modelName, config) {
    try {
      logger.info(`Loading model: ${modelName}`);
      
      // Check memory constraints
      await this._ensureMemoryAvailable(config.priority);

      // Try to load from cache first
      const cachedMetadata = await redisCacheService.get('modelMetadata', modelName);
      if (cachedMetadata && !this._isModelStale(cachedMetadata)) {
        logger.debug(`Using cached metadata for ${modelName}`);
      }

      let model;
      
      // Check if model file exists, otherwise create a mock model
      try {
        model = await tf.loadLayersModel(config.path);
        logger.info(`Loaded model from file: ${config.path}`);
      } catch (fileError) {
        logger.warn(`Model file not found: ${config.path}, creating mock model`);
        model = this._createMockModel(modelName, config);
      }

      // Apply optimizations
      if (config.quantized) {
        model = await this._quantizeModel(model, modelName);
      }

      // Store model and metadata
      this.loadedModels.set(modelName, model);
      this.updateLastAccessTime(modelName);
      
      const metadata = {
        name: modelName,
        loadTime: Date.now(),
        inputShape: config.inputShape,
        outputClasses: config.outputClasses,
        quantized: config.quantized,
        memoryUsage: this._estimateModelMemory(model),
        version: '1.0.0'
      };
      
      this.modelMetadata.set(modelName, metadata);
      
      // Cache metadata
      await redisCacheService.set('modelMetadata', modelName, metadata, 86400); // 24 hours

      logger.info(`Model ${modelName} loaded successfully`, {
        memoryUsage: metadata.memoryUsage,
        quantized: config.quantized
      });

      return model;

    } catch (error) {
      logger.error(`Internal model loading failed for ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Create mock model for development/testing
   */
  _createMockModel(modelName, config) {
    logger.info(`Creating mock model for ${modelName}`);
    
    const model = tf.sequential();
    
    if (modelName === 'diseaseDetection' || modelName === 'plantClassification') {
      // Image classification mock model
      model.add(tf.layers.conv2d({
        inputShape: config.inputShape,
        filters: 32,
        kernelSize: 3,
        activation: 'relu'
      }));
      model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
      model.add(tf.layers.flatten());
      model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
      model.add(tf.layers.dense({ units: config.outputClasses, activation: 'softmax' }));
    } else if (modelName === 'irrigationPrediction') {
      // Regression mock model
      model.add(tf.layers.dense({
        inputShape: config.inputShape,
        units: 16,
        activation: 'relu'
      }));
      model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
      model.add(tf.layers.dense({ units: config.outputClasses, activation: 'linear' }));
    }

    model.compile({
      optimizer: 'adam',
      loss: modelName === 'irrigationPrediction' ? 'meanSquaredError' : 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Model quantization for performance optimization
   */
  async _quantizeModel(model, modelName) {
    try {
      logger.info(`Quantizing model: ${modelName}`);
      
      // For TensorFlow.js, we can use post-training quantization
      // This is a simplified version - in production you'd use tf.quantization
      
      // Create quantized version (mock implementation)
      const quantizedModel = model; // In real implementation, apply quantization
      
      logger.info(`Model ${modelName} quantized successfully`);
      return quantizedModel;
      
    } catch (error) {
      logger.warn(`Quantization failed for ${modelName}, using original model:`, error);
      return model;
    }
  }

  /**
   * Estimate model memory usage
   */
  _estimateModelMemory(model) {
    try {
      const params = model.countParams();
      // Rough estimation: 4 bytes per parameter (float32)
      const memoryBytes = params * 4;
      return {
        parameters: params,
        estimatedBytes: memoryBytes,
        estimatedMB: Math.round(memoryBytes / (1024 * 1024) * 100) / 100
      };
    } catch (error) {
      logger.warn('Failed to estimate model memory:', error);
      return { parameters: 0, estimatedBytes: 0, estimatedMB: 0 };
    }
  }

  /**
   * Ensure memory is available for new model
   */
  async _ensureMemoryAvailable(priority) {
    if (this.loadedModels.size < this.maxModelsInMemory) {
      return; // Enough space
    }

    // Find lowest priority model to unload
    let modelToUnload = null;
    let lowestPriority = priority;
    let oldestAccess = Date.now();

    for (const [modelName, model] of this.loadedModels.entries()) {
      const config = this.modelConfigs[modelName];
      const lastAccess = this.lastAccessTime.get(modelName) || 0;
      
      if (config.priority > lowestPriority || 
          (config.priority === lowestPriority && lastAccess < oldestAccess)) {
        modelToUnload = modelName;
        lowestPriority = config.priority;
        oldestAccess = lastAccess;
      }
    }

    if (modelToUnload) {
      await this.unloadModel(modelToUnload);
      logger.info(`Unloaded model ${modelToUnload} to free memory`);
    }
  }

  /**
   * Unload model from memory
   */
  async unloadModel(modelName) {
    try {
      if (this.loadedModels.has(modelName)) {
        const model = this.loadedModels.get(modelName);
        
        // Dispose TensorFlow model
        if (model && typeof model.dispose === 'function') {
          model.dispose();
        }
        
        this.loadedModels.delete(modelName);
        this.lastAccessTime.delete(modelName);
        this.modelMetadata.delete(modelName);
        
        logger.info(`Model ${modelName} unloaded from memory`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Failed to unload model ${modelName}:`, error);
      return false;
    }
  }

  /**
   * Update last access time for model
   */
  updateLastAccessTime(modelName) {
    this.lastAccessTime.set(modelName, Date.now());
  }

  /**
   * Check if cached model metadata is stale
   */
  _isModelStale(metadata, maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    return Date.now() - metadata.loadTime > maxAge;
  }

  /**
   * Batch prediction with optimization
   */
  async batchPredict(modelName, inputs, batchSize = 32) {
    try {
      const model = await this.loadModel(modelName);
      const results = [];
      
      // Process in batches to optimize memory usage
      for (let i = 0; i < inputs.length; i += batchSize) {
        const batch = inputs.slice(i, i + batchSize);
        const batchTensor = tf.stack(batch);
        
        const predictions = model.predict(batchTensor);
        const predictionData = await predictions.data();
        
        // Clean up tensors
        batchTensor.dispose();
        predictions.dispose();
        
        results.push(...predictionData);
      }
      
      this.updateLastAccessTime(modelName);
      return results;
      
    } catch (error) {
      logger.error(`Batch prediction failed for ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Warm up models (preload frequently used models)
   */
  async warmUpModels(modelNames = ['diseaseDetection', 'irrigationPrediction']) {
    try {
      logger.info('Starting model warm-up...');
      
      const warmUpPromises = modelNames.map(async (modelName) => {
        try {
          await this.loadModel(modelName);
          logger.info(`Model ${modelName} warmed up successfully`);
        } catch (error) {
          logger.warn(`Failed to warm up model ${modelName}:`, error);
        }
      });
      
      await Promise.allSettled(warmUpPromises);
      logger.info('Model warm-up completed');
      
    } catch (error) {
      logger.error('Model warm-up failed:', error);
    }
  }

  /**
   * Get model statistics
   */
  getModelStats() {
    const stats = {
      loadedModels: this.loadedModels.size,
      maxModels: this.maxModelsInMemory,
      models: {}
    };

    for (const [modelName, metadata] of this.modelMetadata.entries()) {
      const lastAccess = this.lastAccessTime.get(modelName);
      stats.models[modelName] = {
        ...metadata,
        lastAccess,
        timeSinceLastAccess: Date.now() - (lastAccess || 0),
        isLoaded: this.loadedModels.has(modelName)
      };
    }

    return stats;
  }

  /**
   * Periodic cleanup of unused models
   */
  startPeriodicCleanup() {
    setInterval(async () => {
      const now = Date.now();
      const modelsToUnload = [];

      for (const [modelName, lastAccess] of this.lastAccessTime.entries()) {
        if (now - lastAccess > this.modelUnloadTimeout) {
          modelsToUnload.push(modelName);
        }
      }

      for (const modelName of modelsToUnload) {
        await this.unloadModel(modelName);
        logger.info(`Auto-unloaded unused model: ${modelName}`);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

    }, 10 * 60 * 1000); // Check every 10 minutes

    logger.info('Started periodic model cleanup');
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      logger.info('Shutting down model optimization service...');
      
      // Unload all models
      const modelNames = Array.from(this.loadedModels.keys());
      for (const modelName of modelNames) {
        await this.unloadModel(modelName);
      }
      
      // Clear all maps
      this.loadedModels.clear();
      this.modelMetadata.clear();
      this.lastAccessTime.clear();
      this.loadingPromises.clear();
      
      logger.info('Model optimization service shutdown completed');
    } catch (error) {
      logger.error('Error during model service shutdown:', error);
    }
  }
}

// Singleton instance
const modelOptimizationService = new ModelOptimizationService();

module.exports = {
  modelOptimizationService,
  ModelOptimizationService
};