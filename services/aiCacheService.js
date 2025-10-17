/**
 * AI Cache Service
 * Performance optimization through intelligent caching of AI responses and models
 */

const NodeCache = require('node-cache');
const crypto = require('crypto');
const SystemLog = require('../models/SystemLog');

class AICacheService {
    constructor() {
        // Response cache - short TTL for dynamic responses
        this.responseCache = new NodeCache({
            stdTTL: 3600, // 1 hour default
            checkperiod: 600, // Check for expired keys every 10 minutes
            useClones: false // Better performance, but be careful with object mutations
        });

        // Model cache - longer TTL for loaded models
        this.modelCache = new NodeCache({
            stdTTL: 86400, // 24 hours
            checkperiod: 3600, // Check every hour
            useClones: false
        });

        // Prediction cache - medium TTL for predictions
        this.predictionCache = new NodeCache({
            stdTTL: 1800, // 30 minutes
            checkperiod: 300, // Check every 5 minutes
            useClones: false
        });

        // Statistics tracking
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0
        };

        // Cache configuration
        this.config = {
            chatbot: {
                ttl: 1800, // 30 minutes
                maxSize: 1000,
                enabled: true
            },
            wateringPrediction: {
                ttl: 3600, // 1 hour
                maxSize: 500,
                enabled: true
            },
            diseaseRecognition: {
                ttl: 7200, // 2 hours (more stable results)
                maxSize: 200,
                enabled: true
            },
            models: {
                ttl: 86400, // 24 hours
                maxSize: 10,
                enabled: true
            }
        };

        this.setupEventListeners();
    }

    /**
     * Setup cache event listeners for monitoring
     */
    setupEventListeners() {
        // Response cache events
        this.responseCache.on('set', (key, value) => {
            this.stats.sets++;
            this.logCacheEvent('SET', 'response', key);
        });

        this.responseCache.on('del', (key, value) => {
            this.stats.deletes++;
            this.logCacheEvent('DELETE', 'response', key);
        });

        this.responseCache.on('expired', (key, value) => {
            this.logCacheEvent('EXPIRED', 'response', key);
        });

        // Model cache events
        this.modelCache.on('set', (key, value) => {
            this.logCacheEvent('SET', 'model', key);
        });

        this.modelCache.on('del', (key, value) => {
            this.logCacheEvent('DELETE', 'model', key);
        });
    }

    /**
     * Generate cache key from input data
     */
    generateCacheKey(type, data) {
        try {
            const dataString = JSON.stringify(data);
            const hash = crypto.createHash('md5').update(dataString).digest('hex');
            return `${type}:${hash}`;
        } catch (error) {
            console.error('Error generating cache key:', error);
            return `${type}:${Date.now()}:${Math.random()}`;
        }
    }

    /**
     * Cache chatbot response
     */
    async cacheChatbotResponse(message, context, response) {
        if (!this.config.chatbot.enabled) return false;

        try {
            const key = this.generateCacheKey('chatbot', { message, context });
            const cacheData = {
                response,
                timestamp: Date.now(),
                context: context
            };

            this.responseCache.set(key, cacheData, this.config.chatbot.ttl);
            return true;
        } catch (error) {
            this.stats.errors++;
            console.error('Error caching chatbot response:', error);
            return false;
        }
    }

    /**
     * Get cached chatbot response
     */
    async getCachedChatbotResponse(message, context) {
        if (!this.config.chatbot.enabled) return null;

        try {
            const key = this.generateCacheKey('chatbot', { message, context });
            const cached = this.responseCache.get(key);

            if (cached) {
                this.stats.hits++;
                return cached.response;
            } else {
                this.stats.misses++;
                return null;
            }
        } catch (error) {
            this.stats.errors++;
            console.error('Error getting cached chatbot response:', error);
            return null;
        }
    }

    /**
     * Cache watering prediction
     */
    async cacheWateringPrediction(sensorData, plantId, prediction) {
        if (!this.config.wateringPrediction.enabled) return false;

        try {
            const key = this.generateCacheKey('watering', { sensorData, plantId });
            const cacheData = {
                prediction,
                timestamp: Date.now(),
                sensorData,
                plantId
            };

            this.predictionCache.set(key, cacheData, this.config.wateringPrediction.ttl);
            return true;
        } catch (error) {
            this.stats.errors++;
            console.error('Error caching watering prediction:', error);
            return false;
        }
    }

    /**
     * Get cached watering prediction
     */
    async getCachedWateringPrediction(sensorData, plantId) {
        if (!this.config.wateringPrediction.enabled) return null;

        try {
            const key = this.generateCacheKey('watering', { sensorData, plantId });
            const cached = this.predictionCache.get(key);

            if (cached) {
                this.stats.hits++;
                // Check if sensor data is still similar (within 5% tolerance)
                if (this.isSensorDataSimilar(sensorData, cached.sensorData)) {
                    return cached.prediction;
                } else {
                    // Remove outdated cache entry
                    this.predictionCache.del(key);
                    this.stats.misses++;
                    return null;
                }
            } else {
                this.stats.misses++;
                return null;
            }
        } catch (error) {
            this.stats.errors++;
            console.error('Error getting cached watering prediction:', error);
            return null;
        }
    }

    /**
     * Cache disease recognition result
     */
    async cacheDiseaseRecognition(imageHash, result) {
        if (!this.config.diseaseRecognition.enabled) return false;

        try {
            const key = `disease:${imageHash}`;
            const cacheData = {
                result,
                timestamp: Date.now(),
                imageHash
            };

            this.responseCache.set(key, cacheData, this.config.diseaseRecognition.ttl);
            return true;
        } catch (error) {
            this.stats.errors++;
            console.error('Error caching disease recognition:', error);
            return false;
        }
    }

    /**
     * Get cached disease recognition result
     */
    async getCachedDiseaseRecognition(imageHash) {
        if (!this.config.diseaseRecognition.enabled) return null;

        try {
            const key = `disease:${imageHash}`;
            const cached = this.responseCache.get(key);

            if (cached) {
                this.stats.hits++;
                return cached.result;
            } else {
                this.stats.misses++;
                return null;
            }
        } catch (error) {
            this.stats.errors++;
            console.error('Error getting cached disease recognition:', error);
            return null;
        }
    }

    /**
     * Cache loaded TensorFlow.js model
     */
    async cacheModel(modelType, model, metadata = {}) {
        if (!this.config.models.enabled) return false;

        try {
            const key = `model:${modelType}`;
            const cacheData = {
                model,
                metadata,
                timestamp: Date.now(),
                type: modelType
            };

            this.modelCache.set(key, cacheData, this.config.models.ttl);
            await this.logCacheEvent('CACHE_MODEL', 'model', key, { modelType, ...metadata });
            return true;
        } catch (error) {
            this.stats.errors++;
            console.error('Error caching model:', error);
            return false;
        }
    }

    /**
     * Get cached model
     */
    async getCachedModel(modelType) {
        if (!this.config.models.enabled) return null;

        try {
            const key = `model:${modelType}`;
            const cached = this.modelCache.get(key);

            if (cached) {
                this.stats.hits++;
                return {
                    model: cached.model,
                    metadata: cached.metadata,
                    cachedAt: cached.timestamp
                };
            } else {
                this.stats.misses++;
                return null;
            }
        } catch (error) {
            this.stats.errors++;
            console.error('Error getting cached model:', error);
            return null;
        }
    }

    /**
     * Check if sensor data is similar enough to use cached prediction
     */
    isSensorDataSimilar(current, cached, tolerance = 0.05) {
        const fields = ['moisture', 'temperature', 'humidity', 'light'];
        
        for (const field of fields) {
            const currentVal = current[field] || 0;
            const cachedVal = cached[field] || 0;
            
            if (cachedVal === 0) continue; // Skip if no cached value
            
            const difference = Math.abs(currentVal - cachedVal) / cachedVal;
            if (difference > tolerance) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Generate hash for image file
     */
    async generateImageHash(imagePath) {
        try {
            const fs = require('fs');
            const imageBuffer = fs.readFileSync(imagePath);
            return crypto.createHash('sha256').update(imageBuffer).digest('hex');
        } catch (error) {
            console.error('Error generating image hash:', error);
            return null;
        }
    }

    /**
     * Clear cache by type
     */
    async clearCache(type = 'all') {
        try {
            switch (type) {
                case 'responses':
                    this.responseCache.flushAll();
                    break;
                case 'models':
                    this.modelCache.flushAll();
                    break;
                case 'predictions':
                    this.predictionCache.flushAll();
                    break;
                case 'all':
                    this.responseCache.flushAll();
                    this.modelCache.flushAll();
                    this.predictionCache.flushAll();
                    break;
                default:
                    // Clear specific cache entries by pattern
                    this.clearCacheByPattern(type);
            }

            await this.logCacheEvent('CLEAR', type, 'all');
            return true;
        } catch (error) {
            console.error('Error clearing cache:', error);
            return false;
        }
    }

    /**
     * Clear cache entries matching pattern
     */
    clearCacheByPattern(pattern) {
        const caches = [this.responseCache, this.modelCache, this.predictionCache];
        
        caches.forEach(cache => {
            const keys = cache.keys();
            keys.forEach(key => {
                if (key.includes(pattern)) {
                    cache.del(key);
                }
            });
        });
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 ? 
            (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) : 0;

        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            cacheInfo: {
                responses: {
                    keys: this.responseCache.keys().length,
                    stats: this.responseCache.getStats()
                },
                models: {
                    keys: this.modelCache.keys().length,
                    stats: this.modelCache.getStats()
                },
                predictions: {
                    keys: this.predictionCache.keys().length,
                    stats: this.predictionCache.getStats()
                }
            }
        };
    }

    /**
     * Optimize cache performance
     */
    async optimizeCache() {
        try {
            // Remove expired entries
            this.responseCache.flushExpired();
            this.modelCache.flushExpired();
            this.predictionCache.flushExpired();

            // Log optimization
            await this.logCacheEvent('OPTIMIZE', 'all', 'cache_optimization');

            return {
                success: true,
                message: 'Cache optimized successfully',
                stats: this.getStats()
            };
        } catch (error) {
            console.error('Error optimizing cache:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Log cache events
     */
    async logCacheEvent(action, type, key, metadata = {}) {
        try {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Cache ${action}: ${type}:${key}`);
            }

            // Only log important events to database to avoid spam
            const importantEvents = ['CACHE_MODEL', 'CLEAR', 'OPTIMIZE'];
            if (importantEvents.includes(action)) {
                await SystemLog.create({
                    log_level: 'INFO',
                    source: 'AICacheService',
                    message: `Cache ${action}: ${type}:${key}`,
                    details: JSON.stringify(metadata)
                });
            }
        } catch (error) {
            // Don't throw errors for logging failures
            console.error('Error logging cache event:', error);
        }
    }

    /**
     * Health check for cache service
     */
    async healthCheck() {
        try {
            // Test cache operations
            const testKey = 'health_check_test';
            const testData = { timestamp: Date.now() };
            
            this.responseCache.set(testKey, testData, 60);
            const retrieved = this.responseCache.get(testKey);
            this.responseCache.del(testKey);

            const isHealthy = retrieved && retrieved.timestamp === testData.timestamp;

            return {
                healthy: isHealthy,
                status: isHealthy ? 'operational' : 'degraded',
                stats: this.getStats(),
                config: this.config,
                features: [
                    'Response caching with TTL',
                    'Model caching for performance',
                    'Prediction caching with similarity check',
                    'Automatic cache optimization',
                    'Comprehensive statistics tracking'
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
     * Dispose of cache service
     */
    dispose() {
        try {
            this.responseCache.close();
            this.modelCache.close();
            this.predictionCache.close();
            console.log('✅ AI Cache Service disposed');
        } catch (error) {
            console.error('Error disposing cache service:', error);
        }
    }
}

module.exports = new AICacheService();