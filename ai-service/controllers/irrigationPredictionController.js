const IrrigationPredictionService = require('../services/irrigationPredictionService');
const PlantSpecificAlgorithms = require('../services/plantSpecificAlgorithms');
const FeatureEngineering = require('../utils/featureEngineering');
const IrrigationMqttService = require('../services/irrigationMqttService');
const IrrigationPerformanceService = require('../services/irrigationPerformanceService');
const monitoringService = require('../services/monitoringService');
const winston = require('winston');
const axios = require('axios');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/irrigation-controller.log' }),
    new winston.transports.Console()
  ]
});

class IrrigationPredictionController {
  constructor(mqttClient = null) {
    this.predictionService = new IrrigationPredictionService();
    this.plantAlgorithms = new PlantSpecificAlgorithms();
    this.featureEngineering = new FeatureEngineering();
    
    // Initialize MQTT service
    this.mqttService = new IrrigationMqttService(mqttClient);
    
    // Initialize performance service
    this.performanceService = new IrrigationPerformanceService(
      this.predictionService, 
      this.plantAlgorithms
    );
    
    // Weather API configuration
    this.weatherApiKey = process.env.WEATHER_API_KEY || 'demo_key';
    this.weatherApiUrl = 'http://api.openweathermap.org/data/2.5/weather';
    
    // Initialize services
    this.initializeServices();
  }

  async initializeServices() {
    try {
      // Wait for prediction service to initialize
      while (!this.predictionService.isModelLoaded) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      logger.info('Irrigation prediction controller initialized');
    } catch (error) {
      logger.error('Error initializing irrigation prediction controller:', error);
    }
  }

  /**
   * POST /api/ai/irrigation/predict/:plantId
   * Predict irrigation needs for a specific plant
   */
  async predictIrrigation(req, res) {
    try {
      const { plantId } = req.params;
      const sensorData = req.body;

      logger.info('Irrigation prediction request', { plantId, sensorData });

      // Validate input data
      const validation = this.featureEngineering.validateSensorData(sensorData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid sensor data',
          issues: validation.issues,
          completeness: validation.completeness
        });
      }

      // Add plant ID to sensor data
      sensorData.plantId = parseInt(plantId);

      // Get weather forecast if location is provided
      if (sensorData.location) {
        try {
          const weatherForecast = await this.getWeatherForecast(sensorData.location);
          sensorData.weatherForecast = weatherForecast.rainProbability;
          sensorData.forecastTemperature = weatherForecast.temperature;
          sensorData.forecastHumidity = weatherForecast.humidity;
        } catch (weatherError) {
          logger.warn('Weather forecast unavailable:', weatherError.message);
          sensorData.weatherForecast = 0; // Default to no rain
        }
      }

      // Get ML prediction with performance optimization
      const mlPrediction = await this.performanceService.predictOptimized(parseInt(plantId), sensorData);

      // Get plant-specific recommendation
      const plantRecommendation = this.plantAlgorithms.getIrrigationRecommendation(
        sensorData.plantType || 'other',
        sensorData,
        { growthStage: sensorData.growthStage }
      );

      // Combine predictions with confidence scoring
      const combinedPrediction = this.combinePredictions(mlPrediction, plantRecommendation);

      // Generate intelligent scheduling
      const schedule = this.generateIntelligentSchedule(combinedPrediction, sensorData);

      const response = {
        success: true,
        plantId: parseInt(plantId),
        prediction: combinedPrediction,
        schedule: schedule,
        sensorData: {
          soilMoisture: sensorData.soilMoisture,
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          lightLevel: sensorData.lightLevel,
          weatherForecast: sensorData.weatherForecast
        },
        timestamp: new Date().toISOString()
      };

      logger.info('Irrigation prediction completed', {
        plantId,
        shouldWater: combinedPrediction.shouldWater,
        confidence: combinedPrediction.confidence
      });

      // Track metrics for monitoring
      monitoringService.trackIrrigationPrediction(
        combinedPrediction.confidence,
        combinedPrediction
      );

      // Publish prediction result via MQTT
      await this.mqttService.publishPredictionResult(parseInt(plantId), combinedPrediction);

      // Publish urgent alert if needed
      if (combinedPrediction.shouldWater && combinedPrediction.confidence > 0.8) {
        await this.mqttService.publishUrgentAlert(parseInt(plantId), combinedPrediction, sensorData);
      }

      // Publish schedule via MQTT
      if (schedule && schedule.length > 0) {
        await this.mqttService.publishSchedule(parseInt(plantId), schedule);
      }

      res.json(response);

    } catch (error) {
      logger.error('Error in irrigation prediction:', error);
      
      // Track error metrics
      monitoringService.trackError(error, { 
        context: 'irrigation_prediction',
        plantId: req.params.plantId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * POST /api/ai/irrigation/schedule/:plantId
   * Create intelligent irrigation schedule
   */
  async createSchedule(req, res) {
    try {
      const { plantId } = req.params;
      const { sensorData, preferences = {} } = req.body;

      logger.info('Schedule creation request', { plantId, preferences });

      // Validate sensor data
      const validation = this.featureEngineering.validateSensorData(sensorData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid sensor data',
          issues: validation.issues
        });
      }

      // Get current prediction
      const prediction = await this.predictionService.predict({
        ...sensorData,
        plantId: parseInt(plantId)
      });

      // Generate 7-day schedule
      const schedule = await this.generateWeeklySchedule(
        sensorData,
        prediction,
        preferences
      );

      const response = {
        success: true,
        plantId: parseInt(plantId),
        schedule: schedule,
        preferences: preferences,
        generatedAt: new Date().toISOString()
      };

      logger.info('Irrigation schedule created', { plantId, scheduleLength: schedule.length });

      // Publish schedule via MQTT
      await this.mqttService.publishSchedule(parseInt(plantId), schedule);

      res.json(response);

    } catch (error) {
      logger.error('Error creating irrigation schedule:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * GET /api/ai/irrigation/recommendations/:plantId
   * Get irrigation recommendations for a plant
   */
  async getRecommendations(req, res) {
    try {
      const { plantId } = req.params;
      const { plantType = 'other', growthStage = 'vegetative' } = req.query;

      logger.info('Recommendations request', { plantId, plantType, growthStage });

      // Get plant profile
      const plantProfile = this.plantAlgorithms.getPlantProfile(plantType);
      
      // Get growth stage recommendations
      const growthStageRec = this.plantAlgorithms.getGrowthStageRecommendations(
        plantType,
        growthStage
      );

      // Generate general recommendations
      const recommendations = {
        plantProfile: {
          name: plantProfile.name,
          wateringFrequency: plantProfile.wateringFrequency,
          optimalWaterAmount: plantProfile.waterAmount.optimal,
          soilMoistureRange: `${plantProfile.soilMoisture.min}-${plantProfile.soilMoisture.max}%`,
          temperatureRange: `${plantProfile.temperature.min}-${plantProfile.temperature.max}°C`,
          humidityRange: `${plantProfile.humidity.min}-${plantProfile.humidity.max}%`
        },
        growthStage: growthStageRec,
        generalTips: this.getGeneralIrrigationTips(plantType),
        seasonalAdjustments: plantProfile.seasonalAdjustments,
        currentSeason: this.plantAlgorithms.getCurrentSeason()
      };

      const response = {
        success: true,
        plantId: parseInt(plantId),
        plantType: plantType,
        recommendations: recommendations,
        timestamp: new Date().toISOString()
      };

      logger.info('Recommendations generated', { plantId, plantType });

      res.json(response);

    } catch (error) {
      logger.error('Error getting recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * POST /api/ai/irrigation/feedback
   * Submit feedback on prediction accuracy
   */
  async submitFeedback(req, res) {
    try {
      const { plantId, predictionId, feedback, actualOutcome } = req.body;

      logger.info('Feedback submission', { plantId, predictionId, feedback });

      // Validate feedback data
      if (!plantId || !feedback || !actualOutcome) {
        return res.status(400).json({
          success: false,
          error: 'Missing required feedback data'
        });
      }

      // Store feedback for model improvement
      const feedbackData = {
        plantId: parseInt(plantId),
        predictionId: predictionId,
        userFeedback: feedback, // 'correct', 'incorrect', 'partially_correct'
        actualOutcome: actualOutcome,
        timestamp: new Date().toISOString()
      };

      // In a real implementation, this would be stored in database
      // For now, just log it
      logger.info('Feedback stored', feedbackData);

      // If we have enough feedback data, retrain model
      if (feedback === 'incorrect') {
        logger.info('Incorrect prediction feedback received, consider model retraining');
      }

      const response = {
        success: true,
        message: 'Feedback received successfully',
        feedbackId: `feedback_${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      logger.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Helper methods

  async getWeatherForecast(location) {
    try {
      const { lat, lon } = location;
      const response = await axios.get(this.weatherApiUrl, {
        params: {
          lat: lat,
          lon: lon,
          appid: this.weatherApiKey,
          units: 'metric'
        },
        timeout: 5000
      });

      const weather = response.data;
      
      return {
        temperature: weather.main.temp,
        humidity: weather.main.humidity,
        rainProbability: weather.rain ? Math.min(weather.rain['1h'] / 10, 1) : 0,
        description: weather.weather[0].description
      };
    } catch (error) {
      logger.warn('Weather API error:', error.message);
      throw new Error('Weather forecast unavailable');
    }
  }

  combinePredictions(mlPrediction, plantRecommendation) {
    // Weighted combination of ML and rule-based predictions
    const mlWeight = 0.7;
    const ruleWeight = 0.3;

    // Combine should water decision
    const mlShouldWater = mlPrediction.shouldWater ? 1 : 0;
    const ruleShouldWater = plantRecommendation.shouldWater ? 1 : 0;
    const combinedScore = (mlShouldWater * mlWeight) + (ruleShouldWater * ruleWeight);
    const shouldWater = combinedScore > 0.5;

    // Combine water amounts
    const combinedWaterAmount = Math.round(
      (mlPrediction.waterAmount * mlWeight) + (plantRecommendation.waterAmount * ruleWeight)
    );

    // Combine confidence scores
    const combinedConfidence = Math.round(
      ((mlPrediction.confidence * mlWeight) + (plantRecommendation.confidence * ruleWeight)) * 100
    ) / 100;

    // Combine timing
    const combinedHours = Math.round(
      (mlPrediction.hoursUntilWater * mlWeight) + (plantRecommendation.nextWateringHours * ruleWeight)
    );

    return {
      shouldWater: shouldWater,
      waterAmount: combinedWaterAmount,
      hoursUntilWater: shouldWater ? 0 : combinedHours,
      confidence: combinedConfidence,
      explanation: this.generateCombinedExplanation(mlPrediction, plantRecommendation, shouldWater),
      mlPrediction: {
        shouldWater: mlPrediction.shouldWater,
        waterAmount: mlPrediction.waterAmount,
        confidence: mlPrediction.confidence
      },
      plantSpecific: {
        shouldWater: plantRecommendation.shouldWater,
        waterAmount: plantRecommendation.waterAmount,
        confidence: plantRecommendation.confidence,
        advice: plantRecommendation.plantSpecificAdvice.slice(0, 2)
      }
    };
  }

  generateCombinedExplanation(mlPrediction, plantRecommendation, shouldWater) {
    let explanation = '';
    
    if (shouldWater) {
      explanation = `Nên tưới ngay. `;
      if (mlPrediction.shouldWater && plantRecommendation.shouldWater) {
        explanation += `Cả AI và thuật toán chuyên biệt đều khuyến nghị tưới. `;
      } else if (mlPrediction.shouldWater) {
        explanation += `AI khuyến nghị tưới dựa trên phân tích dữ liệu. `;
      } else {
        explanation += `Thuật toán chuyên biệt khuyến nghị tưới cho loại cây này. `;
      }
    } else {
      explanation = `Chưa cần tưới. `;
      if (!mlPrediction.shouldWater && !plantRecommendation.shouldWater) {
        explanation += `Cả AI và thuật toán chuyên biệt đều cho rằng chưa cần tưới. `;
      }
    }

    // Add specific advice from plant algorithm
    if (plantRecommendation.plantSpecificAdvice.length > 0) {
      explanation += plantRecommendation.plantSpecificAdvice[0];
    }

    return explanation;
  }

  generateIntelligentSchedule(prediction, sensorData) {
    const schedule = [];
    const now = new Date();

    if (prediction.shouldWater) {
      // Immediate watering
      schedule.push({
        time: now.toISOString(),
        action: 'water',
        amount: prediction.waterAmount,
        reason: 'Immediate watering needed',
        priority: 'high'
      });
    }

    // Next watering based on prediction
    if (prediction.hoursUntilWater > 0) {
      const nextWatering = new Date(now.getTime() + prediction.hoursUntilWater * 60 * 60 * 1000);
      schedule.push({
        time: nextWatering.toISOString(),
        action: 'water',
        amount: prediction.waterAmount,
        reason: 'Scheduled watering based on prediction',
        priority: 'normal'
      });
    }

    // Add monitoring checkpoints
    const checkInterval = Math.max(6, prediction.hoursUntilWater / 3);
    for (let i = 1; i <= 3; i++) {
      const checkTime = new Date(now.getTime() + checkInterval * i * 60 * 60 * 1000);
      schedule.push({
        time: checkTime.toISOString(),
        action: 'monitor',
        reason: 'Check soil moisture and plant condition',
        priority: 'low'
      });
    }

    return schedule.sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  async generateWeeklySchedule(sensorData, currentPrediction, preferences) {
    const schedule = [];
    const now = new Date();
    
    // User preferences
    const preferredTimes = preferences.preferredTimes || ['07:00', '18:00'];
    const avoidTimes = preferences.avoidTimes || ['12:00-14:00']; // Avoid midday
    const maxWateringsPerDay = preferences.maxWateringsPerDay || 2;

    for (let day = 0; day < 7; day++) {
      const date = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
      
      // Simulate sensor data changes over time (in real app, this would be predicted)
      const simulatedSensorData = {
        ...sensorData,
        soilMoisture: Math.max(20, sensorData.soilMoisture - (day * 10)),
        temperature: sensorData.temperature + (Math.random() - 0.5) * 4,
        humidity: sensorData.humidity + (Math.random() - 0.5) * 10
      };

      // Get prediction for this day
      const dayPrediction = await this.predictionService.predict(simulatedSensorData);

      if (dayPrediction.shouldWater) {
        // Schedule watering at preferred times
        for (const time of preferredTimes.slice(0, maxWateringsPerDay)) {
          const [hours, minutes] = time.split(':').map(Number);
          const scheduledTime = new Date(date);
          scheduledTime.setHours(hours, minutes, 0, 0);

          schedule.push({
            date: date.toISOString().split('T')[0],
            time: time,
            scheduledDateTime: scheduledTime.toISOString(),
            action: 'water',
            amount: dayPrediction.waterAmount,
            confidence: dayPrediction.confidence,
            reason: `Day ${day + 1}: ${dayPrediction.explanation.substring(0, 50)}...`
          });
        }
      }

      // Add daily monitoring
      schedule.push({
        date: date.toISOString().split('T')[0],
        time: '09:00',
        scheduledDateTime: new Date(date.setHours(9, 0, 0, 0)).toISOString(),
        action: 'monitor',
        reason: 'Daily plant health check'
      });
    }

    return schedule;
  }

  getGeneralIrrigationTips(plantType) {
    const generalTips = [
      'Tưới vào buổi sáng sớm hoặc chiều mát để giảm bay hơi',
      'Kiểm tra độ ẩm đất bằng cách nhúng ngón tay xuống đất 2-3cm',
      'Tưới chậm và sâu thay vì tưới nhanh và nông',
      'Đảm bảo hệ thống thoát nước tốt để tránh úng nước',
      'Điều chỉnh lượng nước theo mùa và thời tiết'
    ];

    const plantSpecificTips = {
      'tomato': [
        'Tưới đều đặn để tránh nứt quả',
        'Tránh tưới lên lá để giảm nguy cơ bệnh nấm'
      ],
      'lettuce': [
        'Giữ độ ẩm đất cao và ổn định',
        'Tưới nhẹ và thường xuyên'
      ],
      'herb': [
        'Để đất hơi khô giữa các lần tưới',
        'Tưới ít nhưng đều đặn'
      ]
    };

    return [
      ...generalTips,
      ...(plantSpecificTips[plantType] || [])
    ];
  }
}

module.exports = IrrigationPredictionController;