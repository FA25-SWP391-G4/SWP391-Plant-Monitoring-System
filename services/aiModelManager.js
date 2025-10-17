/**
 * AI Model Manager
 * Optimized loading, caching, and management of TensorFlow.js models
 */

const aiCacheService = require('./aiCacheService');
const aiErrorHandler = require('./aiErrorHandler');
const SystemLog = require('../models/SystemLog');

class AIModelManager {
    constructor() {
        this.loadedModels = new Map();
        this.modelLoadPromises = new Map(); // Prevent concurrent loading
        this.modelStats = new Map();
        this.maxConcurrentLoads = 2;
        this.currentLoads = 0;
        this.loadQueue = [];
        
        this.config = {
            wateringPrediction: {
                path: '../ai_models/watering_prediction/ultimateSolution',
                maxInstances: 3,
                keepAliveTime: 1800000, // 30 minutes
                preload: true
            },
            diseaseRecognition: {
                path: '../ai_models/disease_recognition/enhancedModelLoader',
                maxInstances: 2,
                keepAliveTime: 3600000, // 1 hour
                preload: true
            }
        };

        // Start preloading critical models
        this.preloadModels();
        
        // Setup cleanup interval
        this.setupCleanupInterval();
    }

    /**
     * Preload critical models for better performance
     */
    async preloadModels() {
        try {
            const preloadPromises = [];
            
            for (const [modelType, config] of Object.entries(this.config)) {
                if (config.preload) {
                    preloadPromises.push(
                        this.loadModel(modelType).catch(error => {
                            console.warn(`Failed to preload ${modelType}:`, error.message);
                        })
                    );
                }
            }
            
            await Promise.all(preloadPromises);
            
            await aiErrorHandler.logEvent('INFO', 'Model preloading completed', {
                preloadedModels: Object.keys(this.config).filter(k => this.config[k].preload)
            });
        } catch (error) {
            console.error('Error during model preloading:', error);
        }
    }

    /**
     * Load model with intelligent caching and queue management
     */
    async loadModel(modelType) {
        // Check if model is already loaded
        const existingModel = this.getLoadedModel(modelType);
        if (existingModel) {
            this.updateModelStats(modelType, 'cache_hit');
            return existingModel;
        }

        // Check if model is currently being loaded
        if (this.modelLoadPromises.has(modelType)) {
            return await this.modelLoadPromises.get(modelType);
        }

        // Check cache first
        const cachedModel = await aiCacheService.getCachedModel(modelType);
        if (cachedModel && this.isModelValid(cachedModel)) {
            this.storeLoadedModel(modelType, cachedModel.model, cachedModel.metadata);
            this.updateModelStats(modelType, 'cache_hit');
            return cachedModel.model;
        }

        // Queue the load if we're at capacity
        if (this.currentLoads >= this.maxConcurrentLoads) {
            return await this.queueModelLoad(modelType);
        }

        // Load the model
        const loadPromise = this.performModelLoad(modelType);
        this.modelLoadPromises.set(modelType, loadPromise);

        try {
            const model = await loadPromise;
            return model;
        } finally {
            this.modelLoadPromises.delete(modelType);
        }
    }

    /**
     * Perform the actual model loading
     */
    async performModelLoad(modelType) {
        const config = this.config[modelType];
        if (!config) {
            throw new Error(`Unknown model type: ${modelType}`);
        }

        this.currentLoads++;
        const startTime = Date.now();

        try {
            await aiErrorHandler.logEvent('INFO', `Loading ${modelType} model`, { modelType });

            // Dynamic import of the model class
            const ModelClass = require(config.path);
            const modelInstance = new ModelClass();

            // Load the model with error handling
            await aiErrorHandler.handleModelOperation(async () => {
                if (typeof modelInstance.loadModel === 'function') {
                    await modelInstance.loadModel();
                } else if (typeof modelInstance.initialize === 'function') {
                    await modelInstance.initialize();
                }
                return modelInstance;
            }, modelType, { modelType });

            const loadTime = Date.now() - startTime;

            // Store in memory cache
            this.storeLoadedModel(modelType, modelInstance, {
                loadTime,
                loadedAt: Date.now(),
                version: modelInstance.version || '1.0.0'
            });

            // Store in persistent cache
            await aiCacheService.cacheModel(modelType, modelInstance, {
                loadTime,
                version: modelInstance.version || '1.0.0'
            });

            this.updateModelStats(modelType, 'load_success', { loadTime });

            await aiErrorHandler.logEvent('INFO', `${modelType} model loaded successfully`, {
                modelType,
                loadTime,
                version: modelInstance.version || '1.0.0'
            });

            return modelInstance;

        } catch (error) {
            this.updateModelStats(modelType, 'load_error');
            
            await aiErrorHandler.logEvent('ERROR', `Failed to load ${modelType} model`, {
                modelType,
                error: error.message,
                loadTime: Date.now() - startTime
            });

            throw error;
        } finally {
            this.currentLoads--;
            this.processLoadQueue();
        }
    }

    /**
     * Queue model load when at capacity
     */
    async queueModelLoad(modelType) {
        return new Promise((resolve, reject) => {
            this.loadQueue.push({
                modelType,
                resolve,
                reject,
                queuedAt: Date.now()
            });
        });
    }

    /**
     * Process queued model loads
     */
    async processLoadQueue() {
        if (this.loadQueue.length === 0 || this.currentLoads >= this.maxConcurrentLoads) {
            return;
        }

        const queuedLoad = this.loadQueue.shift();
        
        try {
            const model = await this.performModelLoad(queuedLoad.modelType);
            queuedLoad.resolve(model);
        } catch (error) {
            queuedLoad.reject(error);
        }
    }

    /**
     * Get loaded model from memory cache
     */
    getLoadedModel(modelType) {
        const modelData = this.loadedModels.get(modelType);
        
        if (!modelData) {
            return null;
        }

        // Check if model is still valid (not expired)
        const config = this.config[modelType];
        const isExpired = config && 
            (Date.now() - modelData.loadedAt) > config.keepAliveTime;

        if (isExpired) {
            this.unloadModel(modelType);
            return null;
        }

        // Update last accessed time
        modelData.lastAccessed = Date.now();
        return modelData.model;
    }

    /**
     * Store loaded model in memory cache
     */
    storeLoadedModel(modelType, model, metadata = {}) {
        const config = this.config[modelType];
        
        // Check if we need to evict old instances
        if (config && config.maxInstances) {
            const currentInstances = Array.from(this.loadedModels.entries())
                .filter(([type]) => type.startsWith(modelType))
                .length;

            if (currentInstances >= config.maxInstances) {
                this.evictOldestModel(modelType);
            }
        }

        this.loadedModels.set(modelType, {
            model,
            loadedAt: Date.now(),
            lastAccessed: Date.now(),
            metadata
        });
    }

    /**
     * Evict oldest model instance of the same type
     */
    evictOldestModel(modelType) {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, data] of this.loadedModels.entries()) {
            if (key.startsWith(modelType) && data.lastAccessed < oldestTime) {
                oldestTime = data.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.unloadModel(oldestKey);
        }
    }

    /**
     * Unload model and free memory
     */
    unloadModel(modelType) {
        const modelData = this.loadedModels.get(modelType);
        
        if (modelData) {
            try {
                // Dispose of TensorFlow.js model if it has dispose method
                if (modelData.model && typeof modelData.model.dispose === 'function') {
                    modelData.model.dispose();
                }
            } catch (error) {
                console.warn(`Warning disposing ${modelType} model:`, error.message);
            }

            this.loadedModels.delete(modelType);
            this.updateModelStats(modelType, 'unload');
            
            console.log(`✅ Unloaded ${modelType} model`);
        }
    }

    /**
     * Check if cached model is still valid
     */
    isModelValid(cachedModel) {
        // Check if model was cached recently (within 1 hour)
        const cacheAge = Date.now() - cachedModel.cachedAt;
        return cacheAge < 3600000; // 1 hour
    }

    /**
     * Update model statistics
     */
    updateModelStats(modelType, event, data = {}) {
        if (!this.modelStats.has(modelType)) {
            this.modelStats.set(modelType, {
                loads: 0,
                cacheHits: 0,
                errors: 0,
                unloads: 0,
                totalLoadTime: 0,
                averageLoadTime: 0
            });
        }

        const stats = this.modelStats.get(modelType);

        switch (event) {
            case 'load_success':
                stats.loads++;
                if (data.loadTime) {
                    stats.totalLoadTime += data.loadTime;
                    stats.averageLoadTime = stats.totalLoadTime / stats.loads;
                }
                break;
            case 'cache_hit':
                stats.cacheHits++;
                break;
            case 'load_error':
                stats.errors++;
                break;
            case 'unload':
                stats.unloads++;
                break;
        }
    }

    /**
     * Setup cleanup interval to remove expired models
     */
    setupCleanupInterval() {
        setInterval(() => {
            this.cleanupExpiredModels();
        }, 300000); // Every 5 minutes
    }

    /**
     * Clean up expired models
     */
    cleanupExpiredModels() {
        const now = Date.now();
        const expiredModels = [];

        for (const [modelType, modelData] of this.loadedModels.entries()) {
            const config = this.config[modelType];
            if (config && (now - modelData.lastAccessed) > config.keepAliveTime) {
                expiredModels.push(modelType);
            }
        }

        expiredModels.forEach(modelType => {
            this.unloadModel(modelType);
        });

        if (expiredModels.length > 0) {
            console.log(`🧹 Cleaned up ${expiredModels.length} expired models`);
        }
    }

    /**
     * Optimize model performance
     */
    async optimizePerformance() {
        try {
            // Clean up expired models
            this.cleanupExpiredModels();

            // Optimize cache
            await aiCacheService.optimizeCache();

            // Preload frequently used models
            const frequentModels = this.getFrequentlyUsedModels();
            for (const modelType of frequentModels) {
                if (!this.getLoadedModel(modelType)) {
                    await this.loadModel(modelType).catch(error => {
                        console.warn(`Failed to preload frequent model ${modelType}:`, error.message);
                    });
                }
            }

            await aiErrorHandler.logEvent('INFO', 'AI performance optimization completed', {
                loadedModels: this.loadedModels.size,
                frequentModels: frequentModels.length
            });

            return {
                success: true,
                message: 'Performance optimization completed',
                stats: this.getStats()
            };
        } catch (error) {
            console.error('Error optimizing AI performance:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get frequently used models based on statistics
     */
    getFrequentlyUsedModels() {
        const threshold = 5; // Minimum cache hits to be considered frequent
        
        return Array.from(this.modelStats.entries())
            .filter(([_, stats]) => stats.cacheHits >= threshold)
            .sort((a, b) => b[1].cacheHits - a[1].cacheHits)
            .map(([modelType]) => modelType)
            .slice(0, 3); // Top 3 most frequent
    }

    /**
     * Get model manager statistics
     */
    getStats() {
        const stats = {
            loadedModels: this.loadedModels.size,
            currentLoads: this.currentLoads,
            queuedLoads: this.loadQueue.length,
            modelStats: Object.fromEntries(this.modelStats),
            memoryUsage: process.memoryUsage(),
            config: this.config
        };

        // Calculate hit rates
        for (const [modelType, modelStats] of this.modelStats.entries()) {
            const totalRequests = modelStats.loads + modelStats.cacheHits;
            if (totalRequests > 0) {
                modelStats.hitRate = ((modelStats.cacheHits / totalRequests) * 100).toFixed(2) + '%';
            }
        }

        return stats;
    }

    /**
     * Health check for model manager
     */
    async healthCheck() {
        try {
            const stats = this.getStats();
            const loadedModelTypes = Array.from(this.loadedModels.keys());
            
            // Test loading a simple model
            let testResult = 'not_tested';
            try {
                if (this.config.wateringPrediction) {
                    const testModel = await this.loadModel('wateringPrediction');
                    testResult = testModel ? 'success' : 'failed';
                }
            } catch (error) {
                testResult = 'failed';
            }

            return {
                healthy: true,
                status: 'operational',
                loadedModels: loadedModelTypes,
                stats: stats,
                testResult: testResult,
                features: [
                    'Intelligent model caching',
                    'Concurrent load management',
                    'Automatic model cleanup',
                    'Performance optimization',
                    'Memory usage monitoring'
                ]
            };
        } catch (error) {
            return {
                healthy: false,
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Dispose of all models and cleanup
     */
    dispose() {
        try {
            // Unload all models
            for (const modelType of this.loadedModels.keys()) {
                this.unloadModel(modelType);
            }

            // Clear all data structures
            this.loadedModels.clear();
            this.modelLoadPromises.clear();
            this.modelStats.clear();
            this.loadQueue.length = 0;

            console.log('✅ AI Model Manager disposed');
        } catch (error) {
            console.error('Error disposing AI Model Manager:', error);
        }
    }
}

module.exports = new AIModelManager();