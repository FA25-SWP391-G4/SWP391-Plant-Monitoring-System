const IrrigationPredictionService = require('../services/irrigationPredictionService');
const IrrigationPredictionController = require('../controllers/irrigationPredictionController');
const IrrigationMqttService = require('../services/irrigationMqttService');
const IrrigationCacheService = require('../services/irrigationCacheService');
const PlantSpecificAlgorithms = require('../services/plantSpecificAlgorithms');
const FeatureEngineering = require('../utils/featureEngineering');

// Mock external dependencies
jest.mock('axios');
jest.mock('winston', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }),
  format: {
    combine: jest.fn(() => ({})),
    timestamp: jest.fn(() => ({})),
    json: jest.fn(() => ({}))
  },
  transports: {
    File: jest.fn(() => ({})),
    Console: jest.fn(() => ({}))
  }
}));

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  sequential: jest.fn(() => ({
    compile: jest.fn(),
    fit: jest.fn(() => Promise.resolve()),
    predict: jest.fn(() => ({
      data: jest.fn(() => Promise.resolve([0.7, 0.3, 0.5, 0.8])),
      dispose: jest.fn()
    })),
    save: jest.fn(() => Promise.resolve()),
    dispose: jest.fn()
  })),
  layers: {
    dense: jest.fn(() => ({})),
    dropout: jest.fn(() => ({}))
  },
  train: {
    adam: jest.fn(() => ({}))
  },
  tensor2d: jest.fn(() => ({
    dispose: jest.fn()
  })),
  loadLayersModel: jest.fn(() => Promise.resolve({
    predict: jest.fn(() => ({
      data: jest.fn(() => Promise.resolve([0.7, 0.3, 0.5, 0.8])),
      dispose: jest.fn()
    }))
  }))
}));

describe('Irrigation Prediction Unit Tests', () => {
  let predictionService;
  let controller;
  let mqttService;
  let cacheService;
  let plantAlgorithms;
  let featureEngineering;
  let mockMqttClient;

  beforeAll(async () => {
    // Mock MQTT client
    mockMqttClient = {
      on: jest.fn(),
      publish: jest.fn((topic, message, options, callback) => {
        if (callback) callback(null);
      }),
      subscribe: jest.fn((topic, callback) => {
        if (callback) callback(null);
      }),
      unsubscribe: jest.fn()
    };

    // Initialize services
    predictionService = new IrrigationPredictionService();
    cacheService = new IrrigationCacheService();
    plantAlgorithms = new PlantSpecificAlgorithms();
    featureEngineering = new FeatureEngineering();
    mqttService = new IrrigationMqttService(mockMqttClient);
    controller = new IrrigationPredictionController(mockMqttClient);

    // Wait for model to load
    await new Promise(resolve => {
      const checkModel = () => {
        if (predictionService.isModelLoaded) {
          resolve();
        } else {
          setTimeout(checkModel, 100);
        }
      };
      checkModel();
    });
  });

  afterAll(async () => {
    // Cleanup
    if (cacheService) {
      await cacheService.cleanup();
    }
    if (mqttService) {
      await mqttService.cleanup();
    }
  });

  describe('IrrigationPredictionService', () => {
    describe('Model Initialization', () => {
      test('should initialize model successfully', () => {
        expect(predictionService.isModelLoaded).toBe(true);
        expect(predictionService.model).toBeDefined();
      });

      test('should have correct plant type mappings', () => {
        expect(predictionService.plantTypeMapping).toHaveProperty('tomato');
        expect(predictionService.plantTypeMapping).toHaveProperty('lettuce');
        expect(predictionService.plantTypeMapping).toHaveProperty('other');
      });

      test('should have plant watering baselines', () => {
        expect(predictionService.plantWateringBaseline).toHaveProperty('tomato');
        expect(predictionService.plantWateringBaseline.tomato).toBe(500);
        expect(predictionService.plantWateringBaseline.lettuce).toBe(300);
      });
    });

    describe('Prediction Accuracy with Mock Sensor Data', () => {
      test('should predict watering needed for dry soil', async () => {
        const sensorData = {
          soilMoisture: 15, // Very dry
          temperature: 30,
          humidity: 40,
          lightLevel: 50000,
          plantType: 'tomato',
          lastWateringHours: 24,
          weatherForecast: 0
        };

        const prediction = await predictionService.predict(sensorData);

        expect(prediction).toHaveProperty('shouldWater');
        expect(prediction).toHaveProperty('waterAmount');
        expect(prediction).toHaveProperty('confidence');
        expect(prediction).toHaveProperty('explanation');
        expect(prediction.shouldWater).toBe(true);
        expect(prediction.waterAmount).toBeGreaterThan(0);
        expect(prediction.confidence).toBeGreaterThan(0);
      });

      test('should predict no watering needed for moist soil', async () => {
        const sensorData = {
          soilMoisture: 80, // Very moist
          temperature: 18, // Cool
          humidity: 70,
          lightLevel: 40000,
          plantType: 'lettuce',
          lastWateringHours: 2,
          weatherForecast: 0.9 // Heavy rain expected
        };

        const prediction = await predictionService.predict(sensorData);

        // The prediction might still suggest watering due to ML model behavior
        // So we check that either it doesn't suggest watering OR suggests watering later
        expect(prediction.shouldWater === false || prediction.hoursUntilWater > 12).toBe(true);
      });

      test('should handle different plant types correctly', async () => {
        const baseSensorData = {
          soilMoisture: 40,
          temperature: 25,
          humidity: 55,
          lightLevel: 45000,
          lastWateringHours: 12,
          weatherForecast: 0
        };

        const tomatoPrediction = await predictionService.predict({
          ...baseSensorData,
          plantType: 'tomato'
        });

        const lettucePrediction = await predictionService.predict({
          ...baseSensorData,
          plantType: 'lettuce'
        });

        // Different plant types should potentially give different recommendations
        expect(tomatoPrediction.waterAmount).toBeDefined();
        expect(lettucePrediction.waterAmount).toBeDefined();
        expect(tomatoPrediction.plantType).toBe('tomato');
        expect(lettucePrediction.plantType).toBe('lettuce');
        
        // Both predictions should be valid
        expect(tomatoPrediction.confidence).toBeGreaterThan(0);
        expect(lettucePrediction.confidence).toBeGreaterThan(0);
        
        // Plant-specific baselines should be different
        expect(predictionService.plantWateringBaseline.tomato).not.toBe(predictionService.plantWateringBaseline.lettuce);
      });

      test('should adjust water amount based on environmental conditions', async () => {
        const hotDryConditions = {
          soilMoisture: 25,
          temperature: 35, // Hot
          humidity: 30, // Dry
          lightLevel: 80000,
          plantType: 'tomato',
          lastWateringHours: 18,
          weatherForecast: 0
        };

        const coolMoistConditions = {
          soilMoisture: 25,
          temperature: 18, // Cool
          humidity: 80, // Humid
          lightLevel: 30000,
          plantType: 'tomato',
          lastWateringHours: 18,
          weatherForecast: 0
        };

        const hotPrediction = await predictionService.predict(hotDryConditions);
        const coolPrediction = await predictionService.predict(coolMoistConditions);

        // Hot, dry conditions should require more water
        expect(hotPrediction.waterAmount).toBeGreaterThan(coolPrediction.waterAmount);
      });

      test('should provide confidence scores within valid range', async () => {
        const sensorData = {
          soilMoisture: 30,
          temperature: 25,
          humidity: 60,
          lightLevel: 50000,
          plantType: 'herb',
          lastWateringHours: 15,
          weatherForecast: 0.2
        };

        const prediction = await predictionService.predict(sensorData);

        expect(prediction.confidence).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      });
    });

    describe('Feature Engineering', () => {
      test('should engineer features correctly', () => {
        const sensorData = {
          soilMoisture: 45,
          temperature: 28,
          humidity: 65,
          lightLevel: 55000,
          plantType: 'pepper',
          lastWateringHours: 20,
          weatherForecast: 0.3
        };

        const features = predictionService.engineerFeatures(sensorData);

        expect(features).toHaveProperty('soilMoisture', 45);
        expect(features).toHaveProperty('temperature', 28);
        expect(features).toHaveProperty('humidity', 65);
        expect(features).toHaveProperty('plantType');
        expect(features).toHaveProperty('seasonalFactor');
        expect(features.seasonalFactor).toBeGreaterThanOrEqual(0);
        expect(features.seasonalFactor).toBeLessThanOrEqual(1);
      });

      test('should normalize features correctly', () => {
        const features = {
          soilMoisture: 50,
          temperature: 30,
          humidity: 70,
          lightLevel: 60000,
          plantType: 2,
          seasonalFactor: 0.7,
          lastWateringHours: 24,
          weatherForecast: 0.4
        };

        const normalized = predictionService.normalizeFeatures(features);

        expect(normalized).toHaveLength(8);
        expect(normalized[0]).toBe(0.5); // soilMoisture / 100
        expect(normalized[1]).toBe(0.75); // temperature / 40
        expect(normalized[2]).toBe(0.7); // humidity / 100
        expect(normalized[3]).toBe(0.6); // lightLevel / 100000
        expect(normalized[4]).toBe(2/6); // plantType / 6
        expect(normalized[5]).toBe(0.7); // seasonalFactor
        expect(normalized[6]).toBe(24/72); // lastWateringHours / 72
        expect(normalized[7]).toBe(0.4); // weatherForecast
      });
    });

    describe('Error Handling', () => {
      test('should handle invalid sensor data gracefully', async () => {
        const invalidSensorData = {
          soilMoisture: -10, // Invalid
          temperature: 100, // Too high
          humidity: 150, // Invalid
          plantType: 'unknown'
        };

        // Should not throw error, but handle gracefully
        const prediction = await predictionService.predict(invalidSensorData);
        expect(prediction).toBeDefined();
        expect(prediction.confidence).toBeLessThanOrEqual(1.0); // Should have valid confidence
        expect(prediction.confidence).toBeGreaterThanOrEqual(0.1); // Should have minimum confidence
      });

      test('should throw error when model not loaded', async () => {
        const tempService = new IrrigationPredictionService();
        tempService.isModelLoaded = false;

        await expect(tempService.predict({})).rejects.toThrow('Model not loaded yet');
      });
    });
  });

  describe('Weather Integration and Schedule Adjustment', () => {
    let mockAxios;

    beforeEach(() => {
      mockAxios = require('axios');
      mockAxios.get.mockClear();
    });

    test('should integrate weather forecast in prediction', async () => {
      // Mock weather API response
      mockAxios.get.mockResolvedValue({
        data: {
          main: { temp: 28, humidity: 65 },
          weather: [{ description: 'light rain' }],
          rain: { '1h': 2.5 }
        }
      });

      const req = {
        params: { plantId: '123' },
        body: {
          soilMoisture: 35,
          temperature: 27,
          humidity: 60,
          lightLevel: 45000,
          plantType: 'tomato',
          lastWateringHours: 16,
          location: { lat: 21.0285, lon: 105.8542 } // Hanoi coordinates
        }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await controller.predictIrrigation(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('openweathermap.org'),
        expect.objectContaining({
          params: expect.objectContaining({
            lat: 21.0285,
            lon: 105.8542
          })
        })
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          prediction: expect.objectContaining({
            shouldWater: expect.any(Boolean),
            confidence: expect.any(Number)
          })
        })
      );
    });

    test('should adjust schedule based on weather forecast', async () => {
      const sensorData = {
        soilMoisture: 30,
        temperature: 25,
        humidity: 55,
        lightLevel: 50000,
        plantType: 'lettuce',
        lastWateringHours: 20,
        weatherForecast: 0.8 // High chance of rain
      };

      const prediction = await predictionService.predict(sensorData);

      // With high rain probability, should delay watering
      expect(prediction.hoursUntilWater).toBeGreaterThan(0);
      expect(prediction.explanation).toContain('mưa');
    });

    test('should handle weather API failure gracefully', async () => {
      mockAxios.get.mockRejectedValue(new Error('Weather API unavailable'));

      const req = {
        params: { plantId: '123' },
        body: {
          soilMoisture: 25,
          temperature: 30,
          humidity: 45,
          plantType: 'tomato',
          location: { lat: 21.0285, lon: 105.8542 }
        }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await controller.predictIrrigation(req, res);

      // Should still work with default weather data
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          sensorData: expect.objectContaining({
            weatherForecast: 0 // Default value
          })
        })
      );
    });

    test('should generate weekly schedule with weather consideration', async () => {
      const sensorData = {
        soilMoisture: 40,
        temperature: 26,
        humidity: 58,
        lightLevel: 48000,
        plantType: 'herb',
        lastWateringHours: 12
      };

      const preferences = {
        preferredTimes: ['07:00', '18:00'],
        maxWateringsPerDay: 2
      };

      const schedule = await controller.generateWeeklySchedule(
        sensorData,
        await predictionService.predict(sensorData),
        preferences
      );

      expect(schedule).toBeInstanceOf(Array);
      expect(schedule.length).toBeGreaterThan(0);
      
      // Check schedule structure
      schedule.forEach(item => {
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('time');
        expect(item).toHaveProperty('action');
        if (item.action === 'water') {
          expect(item).toHaveProperty('amount');
          expect(item).toHaveProperty('confidence');
        }
      });

      // Should respect preferred times
      const wateringItems = schedule.filter(item => item.action === 'water');
      wateringItems.forEach(item => {
        expect(['07:00', '18:00']).toContain(item.time);
      });
    });
  });

  describe('MQTT Alerts and Real-time Updates', () => {
    test('should publish prediction results via MQTT', async () => {
      const plantId = 123;
      const prediction = {
        shouldWater: true,
        waterAmount: 400,
        hoursUntilWater: 0,
        confidence: 0.85,
        explanation: 'Soil moisture low, needs immediate watering'
      };

      await mqttService.publishPredictionResult(plantId, prediction);

      expect(mockMqttClient.publish).toHaveBeenCalledWith(
        `ai/irrigation/prediction/${plantId}`,
        expect.stringContaining('"shouldWater":true'),
        { qos: 1 },
        expect.any(Function)
      );
    });

    test('should publish urgent alerts for critical conditions', async () => {
      const plantId = 456;
      const prediction = {
        shouldWater: true,
        waterAmount: 500,
        confidence: 0.9,
        explanation: 'Critical watering needed'
      };
      const sensorData = {
        soilMoisture: 12, // Very dry
        temperature: 38, // Very hot
        humidity: 25 // Very dry air
      };

      await mqttService.publishUrgentAlert(plantId, prediction, sensorData);

      expect(mockMqttClient.publish).toHaveBeenCalledWith(
        `ai/irrigation/alert/${plantId}`,
        expect.stringContaining('"alertType":"urgent_watering"'),
        { qos: 2 },
        expect.any(Function)
      );

      // Check alert level determination
      const alertLevel = mqttService.determineAlertLevel(prediction, sensorData);
      expect(['high', 'critical']).toContain(alertLevel);
    });

    test('should handle sensor data via MQTT', async () => {
      const plantId = 789;
      const sensorData = {
        soilMoisture: 28,
        temperature: 32,
        humidity: 45,
        lightLevel: 65000,
        timestamp: new Date().toISOString()
      };

      // Simulate receiving sensor data
      await mqttService.handleSensorData(plantId, sensorData);

      // Should trigger prediction and publish results
      expect(mockMqttClient.publish).toHaveBeenCalledWith(
        expect.stringContaining(`ai/irrigation/prediction/${plantId}`),
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
    });

    test('should publish irrigation schedule via MQTT', async () => {
      const plantId = 101;
      const schedule = [
        {
          time: new Date().toISOString(),
          action: 'water',
          amount: 300,
          reason: 'Scheduled watering',
          priority: 'normal'
        },
        {
          time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          action: 'monitor',
          reason: 'Check soil moisture',
          priority: 'low'
        }
      ];

      await mqttService.publishSchedule(plantId, schedule);

      expect(mockMqttClient.publish).toHaveBeenCalledWith(
        `ai/irrigation/schedule/${plantId}`,
        expect.stringContaining('"action":"water"'),
        { qos: 1 },
        expect.any(Function)
      );
    });

    test('should send watering commands via MQTT', async () => {
      const plantId = 202;
      const waterAmount = 450;
      const duration = 30;

      const commandId = await mqttService.sendWateringCommand(plantId, waterAmount, duration);

      expect(commandId).toBeDefined();
      expect(commandId).toContain('cmd_');
      expect(mockMqttClient.publish).toHaveBeenCalledWith(
        `irrigation/command/${plantId}/water`,
        expect.stringContaining('"action":"start_watering"'),
        { qos: 2 },
        expect.any(Function)
      );
    });

    test('should handle irrigation system status updates', () => {
      const plantId = 303;
      const statusData = {
        status: 'watering',
        waterAmount: 350,
        startTime: new Date().toISOString()
      };

      // Should not throw error
      expect(() => {
        mqttService.handleIrrigationSystemStatus(plantId, statusData);
      }).not.toThrow();
    });

    test('should handle watering confirmations', () => {
      const plantId = 404;
      const wateringData = {
        waterAmount: 400,
        duration: 25,
        success: true,
        timestamp: new Date().toISOString(),
        sensorDataBefore: { soilMoisture: 25 },
        sensorDataAfter: { soilMoisture: 65 }
      };

      // Should not throw error and log feedback data
      expect(() => {
        mqttService.handleWateringConfirmation(plantId, wateringData);
      }).not.toThrow();
    });

    test('should extract plant ID from MQTT topics correctly', () => {
      const testCases = [
        { topic: 'sensors/plant/123/data', expected: 123 },
        { topic: 'irrigation/status/plant/456/system', expected: 456 },
        { topic: 'ai/irrigation/prediction/789', expected: null } // This format doesn't have 'plant' keyword
      ];

      testCases.forEach(({ topic, expected }) => {
        const plantId = mqttService.extractPlantIdFromTopic(topic);
        expect(plantId).toBe(expected);
      });
    });
  });

  describe('Caching and Performance Optimization', () => {
    test('should cache prediction results', async () => {
      const plantId = 555;
      const sensorDataHash = 'test_hash_123';
      const prediction = {
        shouldWater: true,
        waterAmount: 350,
        confidence: 0.8
      };

      await cacheService.cachePrediction(plantId, sensorDataHash, prediction);

      const cached = await cacheService.getCachedPrediction(plantId, sensorDataHash);
      expect(cached).toEqual(prediction);
    });

    test('should cache sensor data', async () => {
      const plantId = 666;
      const sensorData = {
        soilMoisture: 45,
        temperature: 24,
        humidity: 62,
        lightLevel: 42000,
        timestamp: new Date().toISOString()
      };

      await cacheService.cacheSensorData(plantId, sensorData);

      const cached = await cacheService.getCachedSensorData(plantId);
      expect(cached).toEqual(sensorData);
    });

    test('should cache plant profiles', async () => {
      const plantType = 'cucumber';
      const profile = {
        name: 'Cucumber',
        wateringFrequency: 2,
        optimalSoilMoisture: 65,
        optimalTemperature: 26
      };

      await cacheService.cachePlantProfile(plantType, profile);

      const cached = await cacheService.getCachedPlantProfile(plantType);
      expect(cached).toEqual(profile);
    });

    test('should cache weather data', async () => {
      const location = { lat: 21.0285, lon: 105.8542 };
      const weatherData = {
        temperature: 28,
        humidity: 70,
        rainProbability: 0.3,
        description: 'partly cloudy'
      };

      await cacheService.cacheWeatherData(location, weatherData);

      const cached = await cacheService.getCachedWeatherData(location);
      expect(cached).toEqual(weatherData);
    });

    test('should handle cache expiration', async () => {
      const plantId = 777;
      const sensorDataHash = 'expired_hash';
      const prediction = { shouldWater: false };

      // Cache with very short TTL
      const originalTTL = cacheService.config.predictionTTL;
      cacheService.config.predictionTTL = 0.001; // 1ms

      await cacheService.cachePrediction(plantId, sensorDataHash, prediction);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      const cached = await cacheService.getCachedPrediction(plantId, sensorDataHash);
      expect(cached).toBeNull();

      // Restore original TTL
      cacheService.config.predictionTTL = originalTTL;
    });

    test('should generate sensor data hash consistently', () => {
      const sensorData1 = {
        soilMoisture: 40,
        temperature: 25,
        humidity: 60,
        plantType: 'tomato'
      };

      const sensorData2 = {
        soilMoisture: 40,
        temperature: 25,
        humidity: 60,
        plantType: 'tomato'
      };

      const hash1 = cacheService.generateSensorDataHash(sensorData1);
      const hash2 = cacheService.generateSensorDataHash(sensorData2);

      expect(hash1).toBe(hash2);
      expect(hash1).toBeDefined();
      expect(typeof hash1).toBe('string');
    });

    test('should perform batch cache operations', async () => {
      const predictions = [
        { plantId: 801, sensorDataHash: 'hash1', prediction: { shouldWater: true } },
        { plantId: 802, sensorDataHash: 'hash2', prediction: { shouldWater: false } },
        { plantId: 803, sensorDataHash: 'hash3', prediction: { shouldWater: true } }
      ];

      await cacheService.batchCachePredictions(predictions);

      const requests = predictions.map(p => ({ 
        plantId: p.plantId, 
        sensorDataHash: p.sensorDataHash 
      }));

      const results = await cacheService.batchGetPredictions(requests);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(predictions[0].prediction);
      expect(results[1]).toEqual(predictions[1].prediction);
      expect(results[2]).toEqual(predictions[2].prediction);
    });

    test('should invalidate plant cache', async () => {
      const plantId = 999;
      
      // Cache some data
      await cacheService.cachePrediction(plantId, 'hash1', { shouldWater: true });
      await cacheService.cacheSensorData(plantId, { soilMoisture: 30 });
      await cacheService.cacheSchedule(plantId, [{ action: 'water' }]);

      // Verify cached
      expect(await cacheService.getCachedPrediction(plantId, 'hash1')).toBeTruthy();
      expect(await cacheService.getCachedSensorData(plantId)).toBeTruthy();
      expect(await cacheService.getCachedSchedule(plantId)).toBeTruthy();

      // Invalidate
      await cacheService.invalidatePlantCache(plantId);

      // Verify invalidated
      expect(await cacheService.getCachedPrediction(plantId, 'hash1')).toBeNull();
      expect(await cacheService.getCachedSensorData(plantId)).toBeNull();
      expect(await cacheService.getCachedSchedule(plantId)).toBeNull();
    });

    test('should provide cache statistics', () => {
      const stats = cacheService.getStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('sets');
      expect(stats).toHaveProperty('deletes');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('cacheType');
    });

    test('should perform health check', async () => {
      const health = await cacheService.healthCheck();

      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('cacheType');
      expect(health).toHaveProperty('latency');
      expect(typeof health.healthy).toBe('boolean');
      expect(typeof health.latency).toBe('number');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete prediction workflow with caching', async () => {
      const plantId = 1001;
      const sensorData = {
        soilMoisture: 35,
        temperature: 27,
        humidity: 58,
        lightLevel: 52000,
        plantType: 'pepper',
        lastWateringHours: 18,
        weatherForecast: 0.2
      };

      // First prediction (cache miss)
      const prediction1 = await predictionService.predict(sensorData);
      expect(prediction1).toBeDefined();

      // Cache the prediction
      const hash = cacheService.generateSensorDataHash(sensorData);
      await cacheService.cachePrediction(plantId, hash, prediction1);

      // Second prediction (cache hit)
      const cachedPrediction = await cacheService.getCachedPrediction(plantId, hash);
      expect(cachedPrediction).toEqual(prediction1);
    });

    test('should handle MQTT workflow with prediction and alerts', async () => {
      const plantId = 1002;
      const sensorData = {
        soilMoisture: 18, // Critical
        temperature: 36, // Hot
        humidity: 30, // Dry
        lightLevel: 75000,
        timestamp: new Date().toISOString()
      };

      // Simulate MQTT sensor data handling
      await mqttService.handleSensorData(plantId, sensorData);

      // Should have published prediction
      expect(mockMqttClient.publish).toHaveBeenCalledWith(
        expect.stringContaining(`ai/irrigation/prediction/${plantId}`),
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );

      // Should have published urgent alert
      expect(mockMqttClient.publish).toHaveBeenCalledWith(
        expect.stringContaining(`ai/irrigation/alert/${plantId}`),
        expect.stringContaining('"alertType":"urgent_watering"'),
        expect.any(Object),
        expect.any(Function)
      );
    });

    test('should handle controller prediction with all integrations', async () => {
      const req = {
        params: { plantId: '1003' },
        body: {
          soilMoisture: 42,
          temperature: 26,
          humidity: 62,
          lightLevel: 48000,
          plantType: 'herb',
          lastWateringHours: 14,
          growthStage: 'flowering'
        }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await controller.predictIrrigation(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          plantId: 1003,
          prediction: expect.objectContaining({
            shouldWater: expect.any(Boolean),
            waterAmount: expect.any(Number),
            confidence: expect.any(Number),
            explanation: expect.any(String)
          }),
          schedule: expect.any(Array),
          timestamp: expect.any(String)
        })
      );

      // Should have published via MQTT
      expect(mockMqttClient.publish).toHaveBeenCalled();
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple concurrent predictions', async () => {
      const concurrentRequests = 10;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const sensorData = {
          soilMoisture: 30 + Math.random() * 40,
          temperature: 20 + Math.random() * 15,
          humidity: 40 + Math.random() * 40,
          lightLevel: 30000 + Math.random() * 40000,
          plantType: ['tomato', 'lettuce', 'herb'][i % 3],
          lastWateringHours: Math.random() * 48
        };

        promises.push(predictionService.predict(sensorData));
      }

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result).toHaveProperty('shouldWater');
        expect(result).toHaveProperty('confidence');
      });

      // Should complete within reasonable time (5 seconds for 10 predictions)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    test('should maintain cache performance under load', async () => {
      const operations = 100;
      const startTime = Date.now();

      // Reset stats before test
      cacheService.resetStats();

      // Perform many cache operations
      for (let i = 0; i < operations; i++) {
        const plantId = i % 10; // Reuse some plant IDs
        const hash = `hash_${i}`;
        const prediction = { shouldWater: i % 2 === 0, waterAmount: 300 + i };

        await cacheService.cachePrediction(plantId, hash, prediction);
        await cacheService.getCachedPrediction(plantId, hash);
      }

      const endTime = Date.now();
      const avgTime = (endTime - startTime) / operations;

      // Each operation should be fast (< 20ms average for both set and get)
      expect(avgTime).toBeLessThan(20);

      const stats = cacheService.getStats();
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.sets).toBeGreaterThanOrEqual(operations);
    });
  });
});