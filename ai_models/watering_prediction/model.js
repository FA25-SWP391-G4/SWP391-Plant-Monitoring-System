/**
 * Watering Prediction Model
 * TensorFlow.js implementation for predicting plant watering needs
 */

const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-backend-cpu');

class WateringPredictionModel {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.inputFeatures = ['moisture', 'temperature', 'humidity', 'light'];
    this.windowSize = 7; // 7 days of historical data
    this.modelPath = './ai_models/watering_prediction/model.json';
  }

  /**
   * Create and compile the neural network model
   */
  createModel() {
    // Input shape: [batch_size, features]
    // Features: current sensor readings (4) + historical averages (4) + time features (3) = 11 total
    const model = tf.sequential({
      layers: [
        // Input layer
        tf.layers.dense({
          inputShape: [11],
          units: 32,
          activation: 'relu',
          name: 'input_layer'
        }),
        
        // Hidden layers
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
        
        // Output layer - binary classification (water/don't water)
        tf.layers.dense({
          units: 2,
          activation: 'softmax',
          name: 'output_layer'
        })
      ]
    });

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.model = model;
    return model;
  }

  /**
   * Load a pre-trained model from file
   */
  async loadModel(modelPath = null) {
    try {
      const path = modelPath || this.modelPath;
      // Try different URL formats for compatibility
      let loadUrl = path;
      if (path.startsWith('http')) {
        loadUrl = path;
      } else {
        loadUrl = `localstorage://${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
      
      this.model = await tf.loadLayersModel(loadUrl);
      this.isLoaded = true;
      console.log('Watering prediction model loaded successfully');
      return this.model;
    } catch (error) {
      console.warn('Could not load pre-trained model, creating new model:', error.message);
      this.createModel();
      this.isLoaded = true;
      return this.model;
    }
  }

  /**
   * Save the trained model to file
   */
  async saveModel(modelPath = null) {
    if (!this.model) {
      throw new Error('No model to save. Create or load a model first.');
    }

    try {
      const path = modelPath || this.modelPath;
      // Use localstorage:// for browser compatibility or file:// for Node.js
      const saveUrl = path.startsWith('http') ? path : `localstorage://${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await this.model.save(saveUrl);
      console.log(`Model saved to ${saveUrl}`);
    } catch (error) {
      console.warn('Could not save model to file, keeping in memory:', error.message);
    }
  }

  /**
   * Preprocess sensor data for model input
   */
  preprocessData(sensorData, historicalData = []) {
    // Current sensor readings
    const currentReadings = [
      sensorData.moisture || 0,
      sensorData.temperature || 20,
      sensorData.humidity || 50,
      sensorData.light || 500
    ];

    // Calculate historical averages (last 7 days)
    let historicalAverages = [0, 0, 0, 0];
    if (historicalData.length > 0) {
      const features = ['moisture', 'temperature', 'humidity', 'light'];
      features.forEach((feature, index) => {
        const values = historicalData.map(d => d[feature] || 0);
        historicalAverages[index] = values.reduce((a, b) => a + b, 0) / values.length;
      });
    } else {
      // Use current readings as fallback
      historicalAverages = [...currentReadings];
    }

    // Time-based features
    const now = new Date();
    const timeFeatures = [
      now.getHours() / 24, // Hour of day (0-1)
      now.getDay() / 7,    // Day of week (0-1)
      (now.getMonth() + 1) / 12 // Month (0-1)
    ];

    // Combine all features
    const features = [
      ...currentReadings,
      ...historicalAverages,
      ...timeFeatures
    ];

    // Normalize features (simple min-max scaling)
    const normalizedFeatures = features.map((value, index) => {
      if (index < 8) { // Sensor data
        return Math.max(0, Math.min(1, value / 100)); // Assume max values around 100
      }
      return value; // Time features already normalized
    });

    return tf.tensor2d([normalizedFeatures]);
  }

  /**
   * Make a watering prediction
   */
  async predict(sensorData, historicalData = []) {
    if (!this.model) {
      await this.loadModel();
    }

    const inputTensor = this.preprocessData(sensorData, historicalData);
    const prediction = this.model.predict(inputTensor);
    const probabilities = await prediction.data();

    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();

    // Extract probabilities
    const dontWaterProb = probabilities[0];
    const waterProb = probabilities[1];

    // Determine recommendation
    const shouldWater = waterProb > dontWaterProb;
    const confidence = Math.max(dontWaterProb, waterProb);

    // Calculate recommended amount (ml) based on confidence and plant needs
    let recommendedAmount = 0;
    if (shouldWater) {
      // Base amount on moisture deficit and plant size
      const moistureDeficit = Math.max(0, 70 - (sensorData.moisture || 0)); // Target 70% moisture
      recommendedAmount = Math.round(moistureDeficit * 5); // 5ml per percentage point
      recommendedAmount = Math.max(100, Math.min(500, recommendedAmount)); // Clamp between 100-500ml
    }

    // Generate reasoning
    const reasoning = this.generateReasoning(sensorData, shouldWater, confidence);

    return {
      shouldWater,
      confidence: Math.round(confidence * 100) / 100,
      recommendedAmount,
      reasoning,
      probabilities: {
        dontWater: Math.round(dontWaterProb * 100) / 100,
        water: Math.round(waterProb * 100) / 100
      }
    };
  }

  /**
   * Generate human-readable reasoning for the prediction
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
   * Train the model with historical data
   */
  async trainModel(trainingData, validationData = null) {
    if (!this.model) {
      this.createModel();
    }

    // Prepare training data
    const { inputs, outputs } = this.prepareTrainingData(trainingData);
    
    let validationInputs = null;
    let validationOutputs = null;
    if (validationData) {
      const validation = this.prepareTrainingData(validationData);
      validationInputs = validation.inputs;
      validationOutputs = validation.outputs;
    }

    // Training configuration
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

    // Train the model
    const history = await this.model.fit(inputs, outputs, config);

    // Clean up tensors
    inputs.dispose();
    outputs.dispose();
    if (validationInputs) validationInputs.dispose();
    if (validationOutputs) validationOutputs.dispose();

    return history;
  }

  /**
   * Prepare training data for the model
   */
  prepareTrainingData(data) {
    const inputs = [];
    const outputs = [];

    data.forEach(sample => {
      const inputTensor = this.preprocessData(sample.sensorData, sample.historicalData);
      const inputArray = inputTensor.dataSync();
      inputs.push(Array.from(inputArray));
      inputTensor.dispose();

      // Binary classification: [1, 0] for don't water, [0, 1] for water
      outputs.push(sample.shouldWater ? [0, 1] : [1, 0]);
    });

    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor2d(outputs)
    };
  }

  /**
   * Get model summary
   */
  getModelSummary() {
    if (!this.model) {
      return 'No model loaded';
    }
    
    this.model.summary();
    return {
      inputShape: this.model.inputShape,
      outputShape: this.model.outputShape,
      trainableParams: this.model.countParams(),
      layers: this.model.layers.length
    };
  }

  /**
   * Dispose of the model and free memory
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isLoaded = false;
    }
  }
}

module.exports = WateringPredictionModel;