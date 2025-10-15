const tf = require('@tensorflow/tfjs');
const winston = require('winston');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/irrigation-prediction.log' }),
    new winston.transports.Console()
  ]
});

class IrrigationPredictionService {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
    this.plantTypeMapping = {
      'tomato': 0,
      'lettuce': 1,
      'pepper': 2,
      'cucumber': 3,
      'herb': 4,
      'flower': 5,
      'other': 6
    };
    
    // Plant-specific watering requirements (ml per day baseline)
    this.plantWateringBaseline = {
      'tomato': 500,
      'lettuce': 300,
      'pepper': 400,
      'cucumber': 600,
      'herb': 200,
      'flower': 250,
      'other': 350
    };
    
    this.initializeModel();
  }

  async initializeModel() {
    try {
      // Create a simple neural network for irrigation prediction
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [8], // 8 input features
            units: 32,
            activation: 'relu',
            name: 'hidden1'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 16,
            activation: 'relu',
            name: 'hidden2'
          }),
          tf.layers.dropout({ rate: 0.1 }),
          tf.layers.dense({
            units: 4, // 4 outputs: shouldWater, hoursUntilWater, waterAmount, confidence
            activation: 'sigmoid',
            name: 'output'
          })
        ]
      });

      // Compile the model
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      // Initialize with some basic weights (in production, load pre-trained weights)
      await this.trainInitialModel();
      
      this.isModelLoaded = true;
      logger.info('Irrigation prediction model initialized successfully');
    } catch (error) {
      logger.error('Error initializing irrigation prediction model:', error);
      throw error;
    }
  }

  async trainInitialModel() {
    // Generate synthetic training data for initial model
    const trainingData = this.generateSyntheticTrainingData(1000);
    
    const xs = tf.tensor2d(trainingData.inputs);
    const ys = tf.tensor2d(trainingData.outputs);

    try {
      await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0
      });
      
      logger.info('Initial model training completed');
    } finally {
      xs.dispose();
      ys.dispose();
    }
  }

  generateSyntheticTrainingData(numSamples) {
    const inputs = [];
    const outputs = [];

    for (let i = 0; i < numSamples; i++) {
      // Generate realistic sensor data
      const soilMoisture = Math.random() * 100; // 0-100%
      const temperature = 15 + Math.random() * 25; // 15-40°C
      const humidity = 30 + Math.random() * 60; // 30-90%
      const lightLevel = Math.random() * 100000; // 0-100000 lux
      const plantType = Math.floor(Math.random() * 7); // 0-6
      const seasonalFactor = Math.random(); // 0-1
      const lastWateringHours = Math.random() * 72; // 0-72 hours
      const weatherForecast = Math.random(); // 0-1 (0=no rain, 1=heavy rain)

      // Calculate ideal outputs based on rules
      const shouldWater = this.calculateShouldWater(soilMoisture, temperature, humidity, lastWateringHours, weatherForecast);
      const hoursUntilWater = this.calculateHoursUntilWater(soilMoisture, temperature, humidity, lastWateringHours);
      const waterAmount = this.calculateWaterAmount(plantType, temperature, humidity, soilMoisture);
      const confidence = this.calculateConfidence(soilMoisture, temperature, humidity, lightLevel);

      inputs.push([
        soilMoisture / 100,
        temperature / 40,
        humidity / 100,
        lightLevel / 100000,
        plantType / 6,
        seasonalFactor,
        lastWateringHours / 72,
        weatherForecast
      ]);

      outputs.push([
        shouldWater ? 1 : 0,
        hoursUntilWater / 72,
        waterAmount / 1000,
        confidence
      ]);
    }

    return { inputs, outputs };
  }

  calculateShouldWater(soilMoisture, temperature, humidity, lastWateringHours, weatherForecast) {
    // Rule-based logic for training data
    if (soilMoisture < 30 && lastWateringHours > 12 && weatherForecast < 0.3) {
      return true;
    }
    if (soilMoisture < 20) {
      return true;
    }
    if (temperature > 30 && humidity < 40 && soilMoisture < 50) {
      return true;
    }
    return false;
  }

  calculateHoursUntilWater(soilMoisture, temperature, humidity, lastWateringHours) {
    if (soilMoisture < 20) return 0;
    if (soilMoisture < 30) return Math.random() * 6;
    if (soilMoisture < 50) return 6 + Math.random() * 18;
    return 24 + Math.random() * 48;
  }

  calculateWaterAmount(plantType, temperature, humidity, soilMoisture) {
    const plantTypes = Object.keys(this.plantWateringBaseline);
    const plantName = plantTypes[plantType] || 'other';
    const baseline = this.plantWateringBaseline[plantName];
    
    // Adjust based on conditions
    let multiplier = 1;
    if (temperature > 30) multiplier += 0.3;
    if (humidity < 40) multiplier += 0.2;
    if (soilMoisture < 30) multiplier += 0.4;
    
    return Math.min(baseline * multiplier, 1000);
  }

  calculateConfidence(soilMoisture, temperature, humidity, lightLevel) {
    // Higher confidence when we have good sensor readings
    let confidence = 0.7;
    if (soilMoisture > 0 && soilMoisture < 100) confidence += 0.1;
    if (temperature > 10 && temperature < 45) confidence += 0.1;
    if (humidity > 20 && humidity < 95) confidence += 0.1;
    return Math.min(confidence, 1.0);
  }

  async predict(sensorData) {
    if (!this.isModelLoaded) {
      throw new Error('Model not loaded yet');
    }

    try {
      // Feature engineering
      const features = this.engineerFeatures(sensorData);
      
      // Normalize features
      const normalizedFeatures = this.normalizeFeatures(features);
      
      // Make prediction
      const inputTensor = tf.tensor2d([normalizedFeatures]);
      const prediction = this.model.predict(inputTensor);
      const predictionData = await prediction.data();
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      // Post-process results
      const result = this.postProcessPrediction(predictionData, sensorData);
      
      logger.info('Irrigation prediction completed', { 
        plantId: sensorData.plantId,
        shouldWater: result.shouldWater,
        confidence: result.confidence 
      });
      
      return result;
    } catch (error) {
      logger.error('Error making irrigation prediction:', error);
      throw error;
    }
  }

  engineerFeatures(sensorData) {
    const {
      soilMoisture = 50,
      temperature = 25,
      humidity = 60,
      lightLevel = 50000,
      plantType = 'other',
      lastWateringHours = 24,
      weatherForecast = 0
    } = sensorData;

    // Calculate seasonal factor (simplified)
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const seasonalFactor = 0.5 + 0.5 * Math.sin(2 * Math.PI * dayOfYear / 365);

    return {
      soilMoisture,
      temperature,
      humidity,
      lightLevel,
      plantType: this.plantTypeMapping[plantType] || this.plantTypeMapping['other'],
      seasonalFactor,
      lastWateringHours,
      weatherForecast
    };
  }

  normalizeFeatures(features) {
    return [
      features.soilMoisture / 100,
      features.temperature / 40,
      features.humidity / 100,
      features.lightLevel / 100000,
      features.plantType / 6,
      features.seasonalFactor,
      features.lastWateringHours / 72,
      features.weatherForecast
    ];
  }

  postProcessPrediction(predictionData, sensorData) {
    const [shouldWaterRaw, hoursUntilWaterRaw, waterAmountRaw, confidenceRaw] = predictionData;
    
    // Apply business rules and safety checks
    const shouldWater = shouldWaterRaw > 0.5;
    const hoursUntilWater = Math.max(0, hoursUntilWaterRaw * 72);
    const waterAmount = Math.max(50, Math.min(1000, waterAmountRaw * 1000));
    const confidence = Math.max(0.1, Math.min(1.0, confidenceRaw));
    
    // Apply plant-specific adjustments
    const plantType = sensorData.plantType || 'other';
    const adjustedWaterAmount = this.adjustWaterAmountForPlant(waterAmount, plantType, sensorData);
    
    // Generate explanation
    const explanation = this.generateExplanation(sensorData, {
      shouldWater,
      hoursUntilWater,
      waterAmount: adjustedWaterAmount,
      confidence
    });

    return {
      shouldWater,
      hoursUntilWater: Math.round(hoursUntilWater),
      waterAmount: Math.round(adjustedWaterAmount),
      confidence: Math.round(confidence * 100) / 100,
      explanation,
      timestamp: new Date().toISOString(),
      plantType
    };
  }

  adjustWaterAmountForPlant(baseAmount, plantType, sensorData) {
    const baseline = this.plantWateringBaseline[plantType] || this.plantWateringBaseline['other'];
    
    // Adjust based on current conditions
    let adjustedAmount = baseAmount;
    
    // Temperature adjustment
    if (sensorData.temperature > 30) {
      adjustedAmount *= 1.2;
    } else if (sensorData.temperature < 15) {
      adjustedAmount *= 0.8;
    }
    
    // Humidity adjustment
    if (sensorData.humidity < 40) {
      adjustedAmount *= 1.1;
    }
    
    // Soil moisture adjustment
    if (sensorData.soilMoisture < 20) {
      adjustedAmount *= 1.3;
    }
    
    // Ensure within reasonable bounds
    return Math.max(baseline * 0.5, Math.min(baseline * 2, adjustedAmount));
  }

  generateExplanation(sensorData, prediction) {
    const reasons = [];
    
    if (sensorData.soilMoisture < 30) {
      reasons.push(`Độ ẩm đất thấp (${sensorData.soilMoisture}%)`);
    }
    
    if (sensorData.temperature > 30) {
      reasons.push(`Nhiệt độ cao (${sensorData.temperature}°C)`);
    }
    
    if (sensorData.humidity < 40) {
      reasons.push(`Độ ẩm không khí thấp (${sensorData.humidity}%)`);
    }
    
    if (sensorData.lastWateringHours > 24) {
      reasons.push(`Đã lâu không tưới (${Math.round(sensorData.lastWateringHours)} giờ)`);
    }
    
    if (sensorData.weatherForecast > 0.7) {
      reasons.push('Dự báo có mưa');
    }
    
    let explanation = '';
    if (prediction.shouldWater) {
      explanation = `Nên tưới ngay. Lý do: ${reasons.join(', ')}.`;
    } else {
      explanation = `Chưa cần tưới. Tưới sau ${prediction.hoursUntilWater} giờ nữa.`;
    }
    
    explanation += ` Lượng nước đề xuất: ${prediction.waterAmount}ml.`;
    explanation += ` Độ tin cậy: ${Math.round(prediction.confidence * 100)}%.`;
    
    return explanation;
  }

  // Method to retrain model with new data
  async retrainModel(trainingData) {
    if (!this.isModelLoaded) {
      throw new Error('Model not initialized');
    }

    try {
      const xs = tf.tensor2d(trainingData.inputs);
      const ys = tf.tensor2d(trainingData.outputs);

      await this.model.fit(xs, ys, {
        epochs: 10,
        batchSize: 16,
        verbose: 0
      });

      xs.dispose();
      ys.dispose();
      
      logger.info('Model retrained with new data');
    } catch (error) {
      logger.error('Error retraining model:', error);
      throw error;
    }
  }

  // Method to save model
  async saveModel(path) {
    if (!this.isModelLoaded) {
      throw new Error('Model not loaded');
    }

    try {
      await this.model.save(`file://${path}`);
      logger.info(`Model saved to ${path}`);
    } catch (error) {
      logger.error('Error saving model:', error);
      throw error;
    }
  }

  // Method to load model
  async loadModel(path) {
    try {
      this.model = await tf.loadLayersModel(`file://${path}`);
      this.isModelLoaded = true;
      logger.info(`Model loaded from ${path}`);
    } catch (error) {
      logger.error('Error loading model:', error);
      throw error;
    }
  }
}

module.exports = IrrigationPredictionService;