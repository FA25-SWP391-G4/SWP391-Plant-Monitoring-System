/**
 * Model Loader for Watering Prediction
 * Handles model initialization, loading, and inference management
 */

const WateringPredictionModel = require('./model');
const DataPreprocessor = require('./dataPreprocessor');
const path = require('path');
const fs = require('fs');

class ModelLoader {
  constructor() {
    this.model = null;
    this.preprocessor = new DataPreprocessor();
    this.modelPath = path.join(__dirname, 'model.json');
    this.isInitialized = false;
    this.lastPrediction = null;
    this.predictionCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize the model (load or create)
   */
  async initialize() {
    if (this.isInitialized) {
      return this.model;
    }

    try {
      this.model = new WateringPredictionModel();
      
      // Try to load existing model
      if (fs.existsSync(this.modelPath)) {
        console.log('Loading existing watering prediction model...');
        await this.model.loadModel(this.modelPath);
      } else {
        console.log('Creating new watering prediction model...');
        this.model.createModel();
        
        // Train with synthetic data for initial functionality
        await this.trainWithSyntheticData();
        
        // Save the initial model
        await this.model.saveModel(this.modelPath);
      }

      this.isInitialized = true;
      console.log('Watering prediction model initialized successfully');
      return this.model;
    } catch (error) {
      console.error('Error initializing watering prediction model:', error);
      
      // Fallback: create a basic model
      this.model = new WateringPredictionModel();
      this.model.createModel();
      this.isInitialized = true;
      
      return this.model;
    }
  }

  /**
   * Train the model with synthetic data for initial functionality
   */
  async trainWithSyntheticData() {
    console.log('Training model with synthetic data...');
    
    // Generate synthetic training data
    const syntheticData = this.preprocessor.generateSyntheticData(500);
    const { training, validation } = this.preprocessor.splitData(syntheticData, 0.8);
    
    // Train the model
    await this.model.trainModel(training, validation);
    
    console.log('Initial training completed with synthetic data');
  }

  /**
   * Make a prediction with caching
   */
  async predict(sensorData, historicalData = [], plantId = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Create cache key
    const cacheKey = this.createCacheKey(sensorData, historicalData, plantId);
    
    // Check cache
    const cached = this.predictionCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.prediction;
    }

    try {
      // Make prediction
      const prediction = await this.model.predict(sensorData, historicalData);
      
      // Add metadata
      prediction.timestamp = new Date().toISOString();
      prediction.plantId = plantId;
      prediction.modelVersion = '1.0.0';
      
      // Cache the result
      this.predictionCache.set(cacheKey, {
        prediction,
        timestamp: Date.now()
      });
      
      // Clean old cache entries
      this.cleanCache();
      
      this.lastPrediction = prediction;
      return prediction;
    } catch (error) {
      console.error('Error making prediction:', error);
      
      // Return fallback prediction
      return this.getFallbackPrediction(sensorData);
    }
  }

  /**
   * Create cache key for prediction caching
   */
  createCacheKey(sensorData, historicalData, plantId) {
    const sensorKey = JSON.stringify({
      moisture: Math.round(sensorData.moisture || 0),
      temperature: Math.round(sensorData.temperature || 0),
      humidity: Math.round(sensorData.humidity || 0),
      light: Math.round(sensorData.light || 0)
    });
    
    const historyKey = historicalData.length > 0 ? 
      historicalData.slice(-3).map(d => Math.round(d.moisture || 0)).join(',') : 'none';
    
    return `${plantId || 'default'}_${sensorKey}_${historyKey}`;
  }

  /**
   * Clean expired cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.predictionCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.predictionCache.delete(key);
      }
    }
  }

  /**
   * Get fallback prediction when model fails
   */
  getFallbackPrediction(sensorData) {
    const moisture = sensorData.moisture || 50;
    const temperature = sensorData.temperature || 22;
    const humidity = sensorData.humidity || 60;
    
    // Simple rule-based fallback
    let shouldWater = false;
    let confidence = 0.6;
    let reasoning = 'Fallback prediction based on simple rules';
    
    if (moisture < 30) {
      shouldWater = true;
      confidence = 0.8;
      reasoning = 'Low soil moisture detected (fallback mode)';
    } else if (moisture < 50 && temperature > 25) {
      shouldWater = true;
      confidence = 0.7;
      reasoning = 'Moderate moisture with high temperature (fallback mode)';
    } else if (moisture > 70) {
      shouldWater = false;
      confidence = 0.8;
      reasoning = 'Adequate soil moisture (fallback mode)';
    }

    const recommendedAmount = shouldWater ? 
      Math.max(100, Math.min(400, (70 - moisture) * 5)) : 0;

    return {
      shouldWater,
      confidence,
      recommendedAmount,
      reasoning,
      probabilities: {
        dontWater: shouldWater ? 1 - confidence : confidence,
        water: shouldWater ? confidence : 1 - confidence
      },
      timestamp: new Date().toISOString(),
      modelVersion: 'fallback-1.0.0',
      isFallback: true
    };
  }

  /**
   * Retrain model with new data
   */
  async retrain(newData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('Retraining model with new data...');
      
      // Clean and preprocess the new data
      const cleanedData = this.preprocessor.cleanSensorData(newData);
      const samples = this.preprocessor.generateTrainingSamples(cleanedData);
      
      if (samples.length < 10) {
        console.warn('Not enough data for retraining, need at least 10 samples');
        return false;
      }

      // Split data
      const { training, validation } = this.preprocessor.splitData(samples, 0.8);
      
      // Retrain the model
      await this.model.trainModel(training, validation);
      
      // Save the updated model
      await this.model.saveModel(this.modelPath);
      
      // Clear prediction cache
      this.predictionCache.clear();
      
      console.log(`Model retrained with ${samples.length} samples`);
      return true;
    } catch (error) {
      console.error('Error retraining model:', error);
      return false;
    }
  }

  /**
   * Get model information and statistics
   */
  getModelInfo() {
    if (!this.model) {
      return { status: 'not_initialized' };
    }

    return {
      status: this.isInitialized ? 'ready' : 'initializing',
      modelSummary: this.model.getModelSummary(),
      lastPrediction: this.lastPrediction,
      cacheSize: this.predictionCache.size,
      modelPath: this.modelPath,
      version: '1.0.0'
    };
  }

  /**
   * Validate sensor data before prediction
   */
  validateSensorData(sensorData) {
    const errors = [];
    
    if (!sensorData || typeof sensorData !== 'object') {
      errors.push('Sensor data must be an object');
      return errors;
    }

    // Check required fields
    const requiredFields = ['moisture', 'temperature', 'humidity', 'light'];
    requiredFields.forEach(field => {
      if (sensorData[field] === undefined || sensorData[field] === null) {
        errors.push(`Missing required field: ${field}`);
      } else if (isNaN(sensorData[field])) {
        errors.push(`Invalid value for ${field}: must be a number`);
      }
    });

    // Check value ranges
    if (sensorData.moisture < 0 || sensorData.moisture > 100) {
      errors.push('Moisture must be between 0 and 100');
    }
    if (sensorData.temperature < -20 || sensorData.temperature > 60) {
      errors.push('Temperature must be between -20 and 60 degrees Celsius');
    }
    if (sensorData.humidity < 0 || sensorData.humidity > 100) {
      errors.push('Humidity must be between 0 and 100');
    }
    if (sensorData.light < 0 || sensorData.light > 5000) {
      errors.push('Light must be between 0 and 5000 lux');
    }

    return errors;
  }

  /**
   * Dispose of the model and clean up resources
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    
    this.predictionCache.clear();
    this.isInitialized = false;
    console.log('Watering prediction model disposed');
  }

  /**
   * Health check for the model
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return { status: 'not_initialized', healthy: false };
      }

      // Test prediction with sample data
      const testData = {
        moisture: 45,
        temperature: 22,
        humidity: 60,
        light: 500
      };

      const prediction = await this.predict(testData);
      
      return {
        status: 'healthy',
        healthy: true,
        testPrediction: prediction,
        cacheSize: this.predictionCache.size,
        modelInfo: this.getModelInfo()
      };
    } catch (error) {
      return {
        status: 'error',
        healthy: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
let modelLoaderInstance = null;

/**
 * Get singleton instance of ModelLoader
 */
function getModelLoader() {
  if (!modelLoaderInstance) {
    modelLoaderInstance = new ModelLoader();
  }
  return modelLoaderInstance;
}

module.exports = {
  ModelLoader,
  getModelLoader
};