/**
 * Fixed Persistent Model - Giải quyết tất cả lỗi
 * Version 2.0 - Completely rewritten for stability
 */

const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-backend-cpu');
const fs = require('fs');
const path = require('path');

class FixedPersistentWateringModel {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.modelDir = path.join(__dirname, 'fixed_persistent_model');
    this.weightsFile = path.join(this.modelDir, 'weights.json');
    this.configFile = path.join(this.modelDir, 'config.json');
    this.metadataFile = path.join(this.modelDir, 'metadata.json');
    this.isDisposed = false;
  }

  /**
   * Create model architecture - simplified and stable
   */
  createModel() {
    try {
      if (this.isDisposed) {
        throw new Error('Model has been disposed');
      }

      const model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [11],
            units: 16,
            activation: 'relu',
            name: 'dense_1'
          }),
          tf.layers.dense({
            units: 8,
            activation: 'relu',
            name: 'dense_2'
          }),
          tf.layers.dense({
            units: 2,
            activation: 'softmax',
            name: 'output'
          })
        ]
      });

      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.model = model;
      this.isLoaded = true;
      console.log('✅ Fixed persistent model created successfully');
      return model;

    } catch (error) {
      console.error('❌ Error creating model:', error.message);
      throw error;
    }
  }

  /**
   * Save model with improved error handling
   */
  async saveModel() {
    if (this.isDisposed || !this.model) {
      console.warn('⚠️  Cannot save: model is disposed or not available');
      return false;
    }

    try {
      // Create directory
      if (!fs.existsSync(this.modelDir)) {
        fs.mkdirSync(this.modelDir, { recursive: true });
      }

      // Save model configuration
      const modelConfig = {
        class_name: 'Sequential',
        config: {
          name: 'fixed_persistent_model',
          layers: [
            {
              class_name: 'Dense',
              config: {
                units: 16,
                activation: 'relu',
                use_bias: true,
                name: 'dense_1',
                trainable: true,
                batch_input_shape: [null, 11],
                dtype: 'float32'
              }
            },
            {
              class_name: 'Dense',
              config: {
                units: 8,
                activation: 'relu',
                use_bias: true,
                name: 'dense_2',
                trainable: true
              }
            },
            {
              class_name: 'Dense',
              config: {
                units: 2,
                activation: 'softmax',
                use_bias: true,
                name: 'output',
                trainable: true
              }
            }
          ]
        },
        keras_version: 'tfjs-fixed-4.22.0',
        backend: 'tensorflow.js'
      };

      fs.writeFileSync(this.configFile, JSON.stringify(modelConfig, null, 2));

      // Save weights safely
      const weights = this.model.getWeights();
      const weightsData = [];
      
      for (let i = 0; i < weights.length; i++) {
        const weight = weights[i];
        const data = await weight.data();
        weightsData.push({
          name: `weight_${i}`,
          shape: weight.shape,
          data: Array.from(data),
          dtype: weight.dtype
        });
      }

      fs.writeFileSync(this.weightsFile, JSON.stringify(weightsData, null, 2));

      // Save metadata
      const metadata = {
        format: 'fixed-persistent-v2',
        version: '2.0.0',
        created: new Date().toISOString(),
        inputShape: [null, 11],
        outputShape: [null, 2],
        totalParams: this.model.countParams(),
        layers: this.model.layers.length
      };

      fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2));

      // Dispose weight tensors to prevent memory leaks
      weights.forEach(w => {
        try {
          if (!w.isDisposed) {
            w.dispose();
          }
        } catch (e) {
          // Ignore disposal errors
        }
      });

      console.log('✅ Fixed persistent model saved successfully');
      return true;

    } catch (error) {
      console.error('❌ Error saving model:', error.message);
      return false;
    }
  }

  /**
   * Load model with improved error handling
   */
  async loadModel() {
    if (this.isDisposed) {
      throw new Error('Model has been disposed');
    }

    try {
      // Check if saved model exists
      if (!fs.existsSync(this.configFile) || !fs.existsSync(this.weightsFile)) {
        console.log('📝 No saved model found, creating new one');
        return this.createModel();
      }

      console.log('📂 Loading saved model...');

      // Load and validate config
      const configData = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      if (!configData.config || !configData.config.layers) {
        throw new Error('Invalid config format');
      }

      // Create model from config
      this.model = this.createModelFromConfig(configData.config);
      
      // Compile model
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      // Load weights
      const weightsData = JSON.parse(fs.readFileSync(this.weightsFile, 'utf8'));
      const weightTensors = weightsData.map(weightInfo => 
        tf.tensor(weightInfo.data, weightInfo.shape, weightInfo.dtype)
      );

      this.model.setWeights(weightTensors);

      // Clean up temporary tensors
      weightTensors.forEach(tensor => {
        try {
          if (!tensor.isDisposed) {
            tensor.dispose();
          }
        } catch (e) {
          // Ignore disposal errors
        }
      });

      this.isLoaded = true;
      console.log('✅ Fixed persistent model loaded successfully');
      return this.model;

    } catch (error) {
      console.error('❌ Error loading model:', error.message);
      console.log('📝 Creating new model instead');
      return this.createModel();
    }
  }

  /**
   * Create model from config safely
   */
  createModelFromConfig(config) {
    const layers = [];
    
    for (const layerConfig of config.layers) {
      if (layerConfig.class_name === 'Dense') {
        const denseConfig = {
          units: layerConfig.config.units,
          activation: layerConfig.config.activation,
          name: layerConfig.config.name
        };
        
        // Add input shape for first layer
        if (layerConfig.config.batch_input_shape) {
          denseConfig.inputShape = [layerConfig.config.batch_input_shape[1]];
        }
        
        layers.push(tf.layers.dense(denseConfig));
      }
    }
    
    return tf.sequential({ layers });
  }

  /**
   * Predict with comprehensive error handling
   */
  async predict(sensorData, historicalData = []) {
    if (this.isDisposed) {
      throw new Error('Model has been disposed');
    }

    if (!this.model) {
      await this.loadModel();
    }

    try {
      const inputTensor = this.preprocessData(sensorData, historicalData);
      const prediction = this.model.predict(inputTensor);
      const probabilities = await prediction.data();

      // Clean up immediately
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
        modelType: 'fixed-persistent-tensorflow',
        version: '2.0.0',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Prediction error:', error.message);
      throw error;
    }
  }

  /**
   * Preprocess data
   */
  preprocessData(sensorData, historicalData = []) {
    const currentReadings = [
      (sensorData.moisture || 0) / 100,
      (sensorData.temperature || 20) / 40,
      (sensorData.humidity || 50) / 100,
      (sensorData.light || 500) / 1000
    ];

    let historicalAverages = [0, 0, 0, 0];
    if (historicalData.length > 0) {
      const features = ['moisture', 'temperature', 'humidity', 'light'];
      const scales = [100, 40, 100, 1000];
      
      features.forEach((feature, index) => {
        const values = historicalData.map(d => (d[feature] || 0) / scales[index]);
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

    return tf.tensor2d([features]);
  }

  /**
   * Generate reasoning
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
      reasons.push('Based on current sensor readings and historical patterns');
    }

    const action = shouldWater ? 'watering recommended' : 'watering not needed';
    const confidenceText = confidence > 0.8 ? 'high confidence' : 
                          confidence > 0.6 ? 'moderate confidence' : 'low confidence';

    return `Fixed persistent model: ${reasons.join(', ')} - ${action} (${confidenceText})`;
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      modelType: 'fixed-persistent-tensorflow',
      version: '2.0.0',
      isLoaded: this.isLoaded,
      isDisposed: this.isDisposed,
      modelDir: this.modelDir,
      filesExist: {
        config: fs.existsSync(this.configFile),
        weights: fs.existsSync(this.weightsFile),
        metadata: fs.existsSync(this.metadataFile)
      },
      hasModel: !!this.model,
      totalParams: this.model ? this.model.countParams() : 0
    };
  }

  /**
   * Dispose safely
   */
  dispose() {
    if (this.isDisposed) {
      return;
    }

    try {
      if (this.model && !this.model.isDisposed) {
        this.model.dispose();
      }
    } catch (error) {
      console.warn('Warning during model disposal:', error.message);
    }

    this.model = null;
    this.isLoaded = false;
    this.isDisposed = true;
    console.log('✅ Fixed persistent model disposed safely');
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (this.isDisposed) {
        return { healthy: false, error: 'Model is disposed' };
      }

      const testData = { moisture: 45, temperature: 22, humidity: 60, light: 500 };
      const prediction = await this.predict(testData);
      
      return {
        healthy: true,
        modelType: 'fixed-persistent-tensorflow',
        version: '2.0.0',
        testPrediction: prediction,
        modelInfo: this.getModelInfo()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        modelType: 'fixed-persistent-tensorflow'
      };
    }
  }
}

module.exports = FixedPersistentWateringModel;