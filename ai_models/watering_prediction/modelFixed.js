/**
 * Fixed Watering Prediction Model
 * Improved TensorFlow.js implementation with better error handling
 */

const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-backend-cpu');
const fs = require('fs');
const path = require('path');

class WateringPredictionModelFixed {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.inputFeatures = ['moisture', 'temperature', 'humidity', 'light'];
    this.windowSize = 7;
    this.modelDir = path.join(__dirname, 'saved_model');
    this.fallbackMode = false;
  }

  /**
   * Create model with better error handling
   */
  createModel() {
    try {
      const model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [11],
            units: 32,
            activation: 'relu',
            name: 'input_layer'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 16,
            activation: 'relu',
            name: 'hidden_layer_1'
          }),
          tf.layers.dropout({ rate: 0.1 }),
          tf.layers.dense({
            units: 8,
            activation: 'relu',
            name: 'hidden_layer_2'
          }),
          tf.layers.dense({
            units: 2,
            activation: 'softmax',
            name: 'output_layer'
          })
        ]
      });

      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.model = model;
      this.fallbackMode = false;
      return model;
    } catch (error) {
      console.error('Error creating TensorFlow model:', error.message);
      this.fallbackMode = true;
      return null;
    }
  }

  /**
   * Save model with JSON format (workaround for file system issues)
   */
  async saveModel() {
    if (!this.model || this.fallbackMode) {
      console.log('Model not available for saving or in fallback mode');
      return false;
    }

    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(this.modelDir)) {
        fs.mkdirSync(this.modelDir, { recursive: true });
      }

      // Save model weights and architecture separately
      const modelConfig = this.model.toJSON();
      const weights = this.model.getWeights().map(w => w.dataSync());
      
      // Save configuration
      fs.writeFileSync(
        path.join(this.modelDir, 'model_config.json'),
        JSON.stringify(modelConfig, null, 2)
      );

      // Save weights as JSON (simple approach)
      fs.writeFileSync(
        path.join(this.modelDir, 'model_weights.json'),
        JSON.stringify(weights.map(w => Array.from(w)), null, 2)
      );

      console.log('Model saved successfully to', this.modelDir);
      return true;
    } catch (error) {
      console.error('Error saving model:', error.message);
      return false;
    }
  }

  /**
   * Load model from JSON files
   */
  async loadModel() {
    try {
      const configPath = path.join(this.modelDir, 'model_config.json');
      const weightsPath = path.join(this.modelDir, 'model_weights.json');

      if (!fs.existsSync(configPath) || !fs.existsSync(weightsPath)) {
        console.log('No saved model found, creating new one');
        return this.createModel();
      }

      // Load configuration
      const modelConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      this.model = await tf.models.modelFromJSON(modelConfig);

      // Load weights
      const weightsData = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
      const weights = weightsData.map(w => tf.tensor(w));
      this.model.setWeights(weights);

      // Dispose temporary tensors
      weights.forEach(w => w.dispose());

      this.isLoaded = true;
      this.fallbackMode = false;
      console.log('Model loaded successfully');
      return this.model;
    } catch (error) {
      console.error('Error loading model:', error.message);
      console.log('Creating new model instead');
      return this.createModel();
    }
  }

  /**
   * Predict with fallback support
   */
  async predict(sensorData, historicalData = []) {
    // Use fallback if TensorFlow fails
    if (this.fallbackMode || !this.model) {
      return this.fallbackPredict(sensorData, historicalData);
    }

    try {
      const inputTensor = this.preprocessData(sensorData, historicalData);
      const prediction = this.model.predict(inputTensor);
      const probabilities = await prediction.data();

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      const dontWaterProb = probabilities[0];
      const waterProb = probabilities[1];
      const shouldWater = waterProb > dontWaterProb;
      const confidence = Math.max(dontWaterProb, waterProb);

      let recommendedAmount = 0;
      if (shouldWater) {
        const moistureDeficit = Math.max(0, 70 - (sensorData.moisture || 0));
        recommendedAmount = Math.round(moistureDeficit * 5);
        recommendedAmount = Math.max(100, Math.min(500, recommendedAmount));
      }

      return {
        shouldWater,
        confidence: Math.round(confidence * 100) / 100,
        recommendedAmount,
        reasoning: this.generateReasoning(sensorData, shouldWater, confidence),
        probabilities: {
          dontWater: Math.round(dontWaterProb * 100) / 100,
          water: Math.round(waterProb * 100) / 100
        },
        modelType: 'tensorflow'
      };
    } catch (error) {
      console.error('TensorFlow prediction failed, using fallback:', error.message);
      this.fallbackMode = true;
      return this.fallbackPredict(sensorData, historicalData);
    }
  }

  /**
   * Fallback prediction using rule-based logic
   */
  fallbackPredict(sensorData, historicalData = []) {
    const moisture = sensorData.moisture || 50;
    const temperature = sensorData.temperature || 22;
    const humidity = sensorData.humidity || 60;
    const light = sensorData.light || 500;

    let shouldWater = false;
    let confidence = 0.7;
    let reasoning = 'Rule-based prediction (TensorFlow unavailable)';

    // Rule-based logic
    if (moisture < 25) {
      shouldWater = true;
      confidence = 0.9;
      reasoning = 'Very low soil moisture - immediate watering needed';
    } else if (moisture < 40) {
      if (temperature > 25 || humidity < 50) {
        shouldWater = true;
        confidence = 0.8;
        reasoning = 'Low moisture with high evaporation conditions';
      } else {
        shouldWater = true;
        confidence = 0.7;
        reasoning = 'Low soil moisture detected';
      }
    } else if (moisture < 55) {
      if (temperature > 28 && humidity < 45) {
        shouldWater = true;
        confidence = 0.75;
        reasoning = 'Moderate moisture but high stress conditions';
      } else {
        shouldWater = false;
        confidence = 0.6;
        reasoning = 'Moderate moisture levels - monitoring recommended';
      }
    } else {
      shouldWater = false;
      confidence = 0.8;
      reasoning = 'Adequate soil moisture levels';
    }

    // Calculate recommended amount
    let recommendedAmount = 0;
    if (shouldWater) {
      const moistureDeficit = Math.max(0, 65 - moisture);
      recommendedAmount = Math.round(moistureDeficit * 4);
      recommendedAmount = Math.max(100, Math.min(400, recommendedAmount));
    }

    return {
      shouldWater,
      confidence,
      recommendedAmount,
      reasoning,
      probabilities: {
        dontWater: shouldWater ? 1 - confidence : confidence,
        water: shouldWater ? confidence : 1 - confidence
      },
      modelType: 'fallback',
      isFallback: true
    };
  }

  /**
   * Preprocess data (same as before but with error handling)
   */
  preprocessData(sensorData, historicalData = []) {
    try {
      const currentReadings = [
        sensorData.moisture || 0,
        sensorData.temperature || 20,
        sensorData.humidity || 50,
        sensorData.light || 500
      ];

      let historicalAverages = [0, 0, 0, 0];
      if (historicalData.length > 0) {
        const features = ['moisture', 'temperature', 'humidity', 'light'];
        features.forEach((feature, index) => {
          const values = historicalData.map(d => d[feature] || 0);
          historicalAverages[index] = values.reduce((a, b) => a + b, 0) / values.length;
        });
      } else {
        historicalAverages = [...currentReadings];
      }

      const now = new Date();
      const timeFeatures = [
        now.getHours() / 24,
        now.getDay() / 7,
        (now.getMonth() + 1) / 12
      ];

      const features = [
        ...currentReadings,
        ...historicalAverages,
        ...timeFeatures
      ];

      const normalizedFeatures = features.map((value, index) => {
        if (index < 8) {
          return Math.max(0, Math.min(1, value / 100));
        }
        return value;
      });

      return tf.tensor2d([normalizedFeatures]);
    } catch (error) {
      console.error('Error preprocessing data:', error.message);
      throw error;
    }
  }

  /**
   * Generate reasoning (same as before)
   */
  generateReasoning(sensorData, shouldWater, confidence) {
    const reasons = [];
    
    if (sensorData.moisture < 30) {
      reasons.push('Low soil moisture detected');
    } else if (sensorData.moisture > 80) {
      reasons.push('Soil moisture is adequate');
    }

    if (sensorData.temperature > 25) {
      reasons.push('High temperature increases water needs');
    }

    if (sensorData.humidity < 40) {
      reasons.push('Low humidity increases evaporation');
    }

    if (sensorData.light > 800) {
      reasons.push('High light levels increase water consumption');
    }

    if (reasons.length === 0) {
      reasons.push('Based on current sensor readings and patterns');
    }

    const action = shouldWater ? 'watering recommended' : 'watering not needed';
    const confidenceText = confidence > 0.8 ? 'high confidence' : 
                          confidence > 0.6 ? 'moderate confidence' : 'low confidence';

    return `${reasons.join(', ')} - ${action} (${confidenceText})`;
  }

  /**
   * Health check with detailed status
   */
  async healthCheck() {
    const status = {
      tensorflowAvailable: !this.fallbackMode,
      modelLoaded: this.isLoaded,
      fallbackMode: this.fallbackMode,
      modelType: this.fallbackMode ? 'rule-based' : 'tensorflow',
      healthy: true
    };

    try {
      // Test prediction
      const testData = { moisture: 45, temperature: 22, humidity: 60, light: 500 };
      const prediction = await this.predict(testData);
      status.testPrediction = prediction;
      status.predictionWorking = true;
    } catch (error) {
      status.healthy = false;
      status.error = error.message;
      status.predictionWorking = false;
    }

    return status;
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      status: this.isLoaded ? 'ready' : 'not_loaded',
      fallbackMode: this.fallbackMode,
      modelType: this.fallbackMode ? 'rule-based' : 'tensorflow',
      modelDir: this.modelDir,
      version: '1.1.0-fixed'
    };
  }

  /**
   * Dispose resources
   */
  dispose() {
    if (this.model && !this.fallbackMode) {
      this.model.dispose();
      this.model = null;
    }
    this.isLoaded = false;
  }
}

module.exports = WateringPredictionModelFixed;