/**
 * Persistent Model with Alternative Storage
 * Giải quyết vấn đề model persistence bằng cách lưu weights dưới dạng JSON
 */

const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-backend-cpu');
const fs = require('fs');
const path = require('path');

class PersistentWateringModel {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.modelDir = path.join(__dirname, 'persistent_model');
    this.weightsFile = path.join(this.modelDir, 'weights.json');
    this.configFile = path.join(this.modelDir, 'config.json');
    this.metadataFile = path.join(this.modelDir, 'metadata.json');
  }

  /**
   * Create model architecture
   */
  createModel() {
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
    return model;
  }

  /**
   * Save model với custom format
   */
  async saveModel() {
    if (!this.model) {
      throw new Error('No model to save');
    }

    try {
      // Tạo thư mục nếu chưa có
      if (!fs.existsSync(this.modelDir)) {
        fs.mkdirSync(this.modelDir, { recursive: true });
      }

      // Lưu model config
      const modelConfig = {
        class_name: this.model.getConfig().name || 'Sequential',
        config: this.model.getConfig(),
        keras_version: 'tfjs-custom-4.22.0',
        backend: 'tensorflow.js'
      };

      fs.writeFileSync(this.configFile, JSON.stringify(modelConfig, null, 2));

      // Lưu weights
      const weights = this.model.getWeights();
      const weightsData = weights.map(weight => ({
        shape: weight.shape,
        data: Array.from(weight.dataSync()),
        dtype: weight.dtype
      }));

      fs.writeFileSync(this.weightsFile, JSON.stringify(weightsData, null, 2));

      // Lưu metadata
      const metadata = {
        format: 'custom-json',
        generatedBy: 'persistent-watering-model',
        convertedBy: 'tfjs-custom-saver',
        signature: null,
        userDefinedMetadata: {
          inputShape: [null, 11],
          outputShape: [null, 2],
          trainableParams: this.model.countParams(),
          version: '1.0.0'
        },
        modelInitializer: {},
        trainingConfig: {
          loss: 'categoricalCrossentropy',
          metrics: ['accuracy'],
          optimizer_config: {
            class_name: 'Adam',
            config: { learning_rate: 0.001 }
          }
        }
      };

      fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2));

      // Dispose weights tensors
      weights.forEach(w => w.dispose());

      console.log('✅ Model saved successfully to:', this.modelDir);
      return true;

    } catch (error) {
      console.error('❌ Error saving model:', error.message);
      return false;
    }
  }

  /**
   * Load model từ custom format
   */
  async loadModel() {
    try {
      // Kiểm tra files tồn tại
      if (!fs.existsSync(this.configFile) || !fs.existsSync(this.weightsFile)) {
        console.log('No saved model found, creating new one');
        return this.createModel();
      }

      // Load config
      const configData = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      
      // Tạo model từ config - sử dụng cách an toàn hơn
      if (configData.config && configData.config.layers) {
        this.model = tf.sequential({
          layers: configData.config.layers.map(layerConfig => {
            if (layerConfig.class_name === 'Dense') {
              return tf.layers.dense(layerConfig.config);
            } else if (layerConfig.class_name === 'Dropout') {
              return tf.layers.dropout(layerConfig.config);
            }
            // Add more layer types as needed
            return null;
          }).filter(layer => layer !== null)
        });
      } else {
        throw new Error('Invalid model config format');
      }
      
      // Compile model
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      // Load weights
      const weightsData = JSON.parse(fs.readFileSync(this.weightsFile, 'utf8'));
      const weights = weightsData.map(weightInfo => 
        tf.tensor(weightInfo.data, weightInfo.shape, weightInfo.dtype)
      );

      this.model.setWeights(weights);

      // Dispose temporary tensors
      weights.forEach(w => w.dispose());

      this.isLoaded = true;
      console.log('✅ Model loaded successfully from:', this.modelDir);
      return this.model;

    } catch (error) {
      console.error('❌ Error loading model:', error.message);
      console.log('Creating new model instead');
      return this.createModel();
    }
  }

  /**
   * Predict với preprocessing
   */
  async predict(sensorData, historicalData = []) {
    if (!this.model) {
      await this.loadModel();
    }

    const inputTensor = this.preprocessData(sensorData, historicalData);
    const prediction = this.model.predict(inputTensor);
    const probabilities = await prediction.data();

    // Clean up
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
      modelType: 'persistent-tensorflow',
      persistent: true
    };
  }

  /**
   * Preprocess data
   */
  preprocessData(sensorData, historicalData = []) {
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

    return `${reasons.join(', ')} - ${action} (${confidenceText})`;
  }

  /**
   * Train model
   */
  async trainModel(trainingData, validationData = null) {
    if (!this.model) {
      this.createModel();
    }

    const { inputs, outputs } = this.prepareTrainingData(trainingData);
    
    let validationInputs = null;
    let validationOutputs = null;
    if (validationData) {
      const validation = this.prepareTrainingData(validationData);
      validationInputs = validation.inputs;
      validationOutputs = validation.outputs;
    }

    const config = {
      epochs: 50,
      batchSize: 32,
      validationData: validationData ? [validationInputs, validationOutputs] : null,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
        }
      }
    };

    const history = await this.model.fit(inputs, outputs, config);

    // Clean up
    inputs.dispose();
    outputs.dispose();
    if (validationInputs) validationInputs.dispose();
    if (validationOutputs) validationOutputs.dispose();

    return history;
  }

  /**
   * Prepare training data
   */
  prepareTrainingData(data) {
    const inputs = [];
    const outputs = [];

    data.forEach(sample => {
      const inputTensor = this.preprocessData(sample.sensorData, sample.historicalData);
      const inputArray = inputTensor.dataSync();
      inputs.push(Array.from(inputArray));
      inputTensor.dispose();

      outputs.push(sample.shouldWater ? [0, 1] : [1, 0]);
    });

    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor2d(outputs)
    };
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      modelType: 'persistent-tensorflow',
      persistent: true,
      modelDir: this.modelDir,
      filesExist: {
        config: fs.existsSync(this.configFile),
        weights: fs.existsSync(this.weightsFile),
        metadata: fs.existsSync(this.metadataFile)
      },
      isLoaded: this.isLoaded,
      version: '1.0.0-persistent'
    };
  }

  /**
   * Dispose model safely
   */
  dispose() {
    if (this.model) {
      try {
        // Check if model is already disposed
        if (!this.model.isDisposed) {
          this.model.dispose();
        }
      } catch (error) {
        console.warn('Error disposing model (may already be disposed):', error.message);
      }
      this.model = null;
    }
    this.isLoaded = false;
  }
}

module.exports = PersistentWateringModel;