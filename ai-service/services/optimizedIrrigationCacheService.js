const { logger } = require('../utils/errorHandler');
const { redisCacheService } = require('./redisCacheService');
const { performanceMonitorService } = require('./performanceMonitorService');

/**
 * Optimized Irrigation Cache Service
 * High-performance caching for irrigation predictions and related data
 */
class OptimizedIrrigationCacheService {
  constructor() {
    this.cacheService = redisCacheService;
    
    // Cache configuration optimized for irrigation data
    this.config = {
      // TTL in seconds - optimized based on data volatility
      predictionTTL: 300,      // 5 minutes - predictions change frequently
      sensorDataTTL: 60,       // 1 minute - sensor data is real-time
      plantProfileTTL: 3600,   // 1 hour - plant profiles are relatively stable
      weatherTTL: 1800,        // 30 minutes - weather data updates regularly
      scheduleTTL: 7200,       // 2 hours - schedules are planned ahead
      modelResultsTTL: 1800,   // 30 minutes - model results for similar inputs
      
      // Performance settings
      batchSize: 50,           // Increased batch size for better performance
      compressionThreshold: 512, // Compress larger payloads
      maxRetries: 3,
      retryDelay: 100          // ms
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      compressions: 0,
      batchOperations: 0
    };
    
    logger.info('Optimized irrigation cache service initialized');
  }

  /**
   * Cache irrigation prediction with optimized key generation
   */
  async cachePrediction(plantId, sensorData, prediction, customTTL = null) {
    try {
      const key = this.generatePredictionKey(plantId, sensorData);
      const value = {
        prediction,
        sensorData: this.compressSensorData(sensorData),
        timestamp: Date.now(),
        plantId,
        confidence: prediction.confidence || 0
      };

      const ttl = customTTL || this.config.predictionTTL;
      const success = await this.cacheService.set('irrigationPredictions', key, value, ttl);
      
      if (success) {
        this.stats.sets++;
        performanceMonitorService.recordCacheOperation('set', 'irrigationPredictions', true);
        logger.debug(`Cached prediction for plant ${plantId} with confidence ${prediction.confidence}`);
      } else {
        this.stats.errors++;
        performanceMonitorService.recordCacheOperation('set', 'irrigationPredictions', false);
      }
      
      return success;
    } catch (error) {
      this.stats.errors++;
      logger.error('Error caching prediction:', error);
      return false;
    }
  }

  /**
   * Get cached prediction with fallback strategies
   */
  async getCachedPrediction(plantId, sensorData, tolerance = 0.1) {
    try {
      // Try exact match first
      const exactKey = this.generatePredictionKey(plantId, sensorData);
      let cached = await this.cacheService.get('irrigationPredictions', exactKey);
      
      if (cached) {
        this.stats.hits++;
        performanceMonitorService.recordCacheOperation('get', 'irrigationPredictions', true);
        logger.debug(`Cache hit (exact) for plant ${plantId}`);
        return this.decompressCachedData(cached);
      }

      // Try fuzzy match for similar sensor conditions
      cached = await this.findSimilarPrediction(plantId, sensorData, tolerance);
      
      if (cached) {
        this.stats.hits++;
        performanceMonitorService.recordCacheOperation('get', 'irrigationPredictions', true);
        logger.debug(`Cache hit (fuzzy) for plant ${plantId}`);
        return this.decompressCachedData(cached);
      }

      this.stats.misses++;
      performanceMonitorService.recordCacheOperation('get', 'irrigationPredictions', false);
      logger.debug(`Cache miss for plant ${plantId}`);
      return null;
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Error getting cached prediction:', error);
      return null;
    }
  }

  /**
   * Cache sensor data with time-series optimization
   */
  async cacheSensorData(plantId, sensorData, customTTL = null) {
    try {
      const key = `sensor:${plantId}:${Date.now()}`;
      const value = {
        data: this.compressSensorData(sensorData),
        timestamp: Date.now(),
        plantId
      };

      const ttl = customTTL || this.config.sensorDataTTL;
      const success = await this.cacheService.set('sensorData', key, value, ttl);
      
      if (success) {
        this.stats.sets++;
        // Also cache latest sensor data with a fixed key for quick access
        await this.cacheService.set('sensorData', `latest:${plantId}`, value, ttl);
      }
      
      return success;
    } catch (error) {
      this.stats.errors++;
      logger.error('Error caching sensor data:', error);
      return false;
    }
  }

  /**
   * Get latest sensor data for a plant
   */
  async getLatestSensorData(plantId) {
    try {
      const cached = await this.cacheService.get('sensorData', `latest:${plantId}`);
      
      if (cached) {
        this.stats.hits++;
        return this.decompressCachedData(cached);
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      logger.error('Error getting latest sensor data:', error);
      return null;
    }
  }

  /**
   * Cache plant profile with extended TTL
   */
  async cachePlantProfile(plantId, profile, customTTL = null) {
    try {
      const key = `profile:${plantId}`;
      const value = {
        profile,
        timestamp: Date.now(),
        plantId
      };

      const ttl = customTTL || this.config.plantProfileTTL;
      const success = await this.cacheService.set('plantProfiles', key, value, ttl);
      
      if (success) {
        this.stats.sets++;
      }
      
      return success;
    } catch (error) {
      this.stats.errors++;
      logger.error('Error caching plant profile:', error);
      return false;
    }
  }

  /**
   * Get cached plant profile
   */
  async getCachedPlantProfile(plantId) {
    try {
      const cached = await this.cacheService.get('plantProfiles', `profile:${plantId}`);
      
      if (cached) {
        this.stats.hits++;
        return cached;
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      logger.error('Error getting cached plant profile:', error);
      return null;
    }
  }

  /**
   * Cache weather data for location-based predictions
   */
  async cacheWeatherData(location, weatherData, customTTL = null) {
    try {
      const key = `weather:${this.generateLocationHash(location)}`;
      const value = {
        weather: weatherData,
        location,
        timestamp: Date.now()
      };

      const ttl = customTTL || this.config.weatherTTL;
      const success = await this.cacheService.set('weatherData', key, value, ttl);
      
      if (success) {
        this.stats.sets++;
      }
      
      return success;
    } catch (error) {
      this.stats.errors++;
      logger.error('Error caching weather data:', error);
      return false;
    }
  }

  /**
   * Get cached weather data
   */
  async getCachedWeatherData(location) {
    try {
      const key = `weather:${this.generateLocationHash(location)}`;
      const cached = await this.cacheService.get('weatherData', key);
      
      if (cached) {
        this.stats.hits++;
        return cached;
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      logger.error('Error getting cached weather data:', error);
      return null;
    }
  }

  /**
   * Cache irrigation schedule with optimization
   */
  async cacheIrrigationSchedule(plantId, schedule, customTTL = null) {
    try {
      const key = `schedule:${plantId}`;
      const value = {
        schedule,
        plantId,
        timestamp: Date.now(),
        version: schedule.version || '1.0'
      };

      const ttl = customTTL || this.config.scheduleTTL;
      const success = await this.cacheService.set('irrigationPredictions', key, value, ttl);
      
      if (success) {
        this.stats.sets++;
      }
      
      return success;
    } catch (error) {
      this.stats.errors++;
      logger.error('Error caching irrigation schedule:', error);
      return false;
    }
  }

  /**
   * Batch cache multiple predictions for performance
   */
  async batchCachePredictions(predictions) {
    try {
      const batchData = {};
      
      for (const pred of predictions) {
        const key = this.generatePredictionKey(pred.plantId, pred.sensorData);
        batchData[key] = {
          prediction: pred.prediction,
          sensorData: this.compressSensorData(pred.sensorData),
          timestamp: Date.now(),
          plantId: pred.plantId
        };
      }

      const success = await this.cacheService.mset('irrigationPredictions', batchData, this.config.predictionTTL);
      
      if (success) {
        this.stats.sets += predictions.length;
        this.stats.batchOperations++;
        logger.info(`Batch cached ${predictions.length} predictions`);
      }
      
      return success;
    } catch (error) {
      this.stats.errors++;
      logger.error('Error batch caching predictions:', error);
      return false;
    }
  }

  /**
   * Generate optimized prediction key
   */
  generatePredictionKey(plantId, sensorData) {
    // Create a hash of sensor data for consistent key generation
    const sensorHash = this.generateSensorHash(sensorData);
    return `${plantId}:${sensorHash}`;
  }

  /**
   * Generate sensor data hash for key generation
   */
  generateSensorHash(sensorData) {
    // Round sensor values to reduce key variations while maintaining accuracy
    const rounded = {
      soilMoisture: Math.round(sensorData.soilMoisture || 0),
      temperature: Math.round((sensorData.temperature || 0) * 10) / 10, // 1 decimal place
      humidity: Math.round(sensorData.humidity || 0),
      lightLevel: Math.round((sensorData.lightLevel || 0) / 100) * 100 // Round to nearest 100
    };
    
    return Buffer.from(JSON.stringify(rounded)).toString('base64').slice(0, 16);
  }

  /**
   * Generate location hash for weather data
   */
  generateLocationHash(location) {
    if (typeof location === 'string') {
      return Buffer.from(location).toString('base64').slice(0, 12);
    }
    
    // For coordinate-based locations
    const rounded = {
      lat: Math.round((location.lat || 0) * 1000) / 1000, // 3 decimal places
      lng: Math.round((location.lng || 0) * 1000) / 1000
    };
    
    return Buffer.from(JSON.stringify(rounded)).toString('base64').slice(0, 12);
  }

  /**
   * Compress sensor data to reduce memory usage
   */
  compressSensorData(sensorData) {
    const compressed = {};
    
    // Only store essential fields with reduced precision
    if (sensorData.soilMoisture !== undefined) {
      compressed.sm = Math.round(sensorData.soilMoisture * 10) / 10;
    }
    if (sensorData.temperature !== undefined) {
      compressed.temp = Math.round(sensorData.temperature * 10) / 10;
    }
    if (sensorData.humidity !== undefined) {
      compressed.hum = Math.round(sensorData.humidity);
    }
    if (sensorData.lightLevel !== undefined) {
      compressed.light = Math.round(sensorData.lightLevel);
    }
    if (sensorData.timestamp !== undefined) {
      compressed.ts = sensorData.timestamp;
    }
    
    this.stats.compressions++;
    return compressed;
  }

  /**
   * Decompress cached data
   */
  decompressCachedData(cached) {
    if (cached.sensorData && cached.sensorData.sm !== undefined) {
      // Decompress sensor data
      cached.sensorData = {
        soilMoisture: cached.sensorData.sm,
        temperature: cached.sensorData.temp,
        humidity: cached.sensorData.hum,
        lightLevel: cached.sensorData.light,
        timestamp: cached.sensorData.ts
      };
    }
    
    return cached;
  }

  /**
   * Find similar prediction using fuzzy matching
   */
  async findSimilarPrediction(plantId, sensorData, tolerance) {
    // This is a simplified implementation
    // In a real system, you might use Redis modules or custom logic
    try {
      // For now, we'll skip fuzzy matching and return null
      // This could be implemented using Redis search modules or custom algorithms
      return null;
    } catch (error) {
      logger.error('Error in fuzzy prediction search:', error);
      return null;
    }
  }

  /**
   * Invalidate cache for specific plant
   */
  async invalidatePlantCache(plantId) {
    try {
      const patterns = [
        `prediction:${plantId}:*`,
        `sensor:${plantId}:*`,
        `latest:${plantId}`,
        `profile:${plantId}`,
        `schedule:${plantId}`
      ];

      let deletedCount = 0;
      for (const pattern of patterns) {
        // Note: This is a simplified approach
        // In production, you'd use Redis SCAN with pattern matching
        const deleted = await this.cacheService.delete('irrigationPredictions', pattern);
        if (deleted) deletedCount++;
      }

      this.stats.deletes += deletedCount;
      logger.info(`Invalidated cache for plant ${plantId}, deleted ${deletedCount} entries`);
      
      return deletedCount > 0;
    } catch (error) {
      this.stats.errors++;
      logger.error('Error invalidating plant cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics with performance metrics
   */
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    const errorRate = this.stats.errors / (this.stats.sets + this.stats.hits + this.stats.misses) || 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 1000) / 10, // Percentage with 1 decimal
      errorRate: Math.round(errorRate * 1000) / 10,
      totalOperations: this.stats.hits + this.stats.misses + this.stats.sets,
      compressionRatio: this.stats.compressions / this.stats.sets || 0,
      config: this.config
    };
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(plantIds = []) {
    try {
      logger.info(`Starting cache warm-up for ${plantIds.length} plants`);
      
      // This would typically pre-load frequently accessed data
      // For now, we'll just log the process
      for (const plantId of plantIds) {
        // In a real implementation, you'd load:
        // - Recent sensor data
        // - Plant profiles
        // - Weather data for plant location
        // - Recent predictions
        
        logger.debug(`Warming cache for plant ${plantId}`);
        await new Promise(resolve => setTimeout(resolve, 10)); // Simulate work
      }
      
      logger.info('Cache warm-up completed');
      return true;
    } catch (error) {
      logger.error('Cache warm-up failed:', error);
      return false;
    }
  }

  /**
   * Clean up expired entries and optimize cache
   */
  async optimizeCache() {
    try {
      logger.info('Starting cache optimization');
      
      // Clear expired entries, defragment, etc.
      // This would be handled by Redis automatically, but we can trigger manual cleanup
      
      const beforeStats = this.getStats();
      
      // Reset local stats periodically
      if (beforeStats.totalOperations > 10000) {
        this.stats = {
          hits: 0,
          misses: 0,
          sets: 0,
          deletes: 0,
          errors: 0,
          compressions: 0,
          batchOperations: 0
        };
        logger.info('Cache stats reset after optimization');
      }
      
      logger.info('Cache optimization completed');
      return true;
    } catch (error) {
      logger.error('Cache optimization failed:', error);
      return false;
    }
  }
}

// Singleton instance
const optimizedIrrigationCacheService = new OptimizedIrrigationCacheService();

module.exports = {
  optimizedIrrigationCacheService,
  OptimizedIrrigationCacheService
};