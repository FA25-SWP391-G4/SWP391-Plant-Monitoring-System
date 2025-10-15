const winston = require('winston');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

class FeatureEngineering {
  constructor() {
    // Environmental factor weights for different plant types
    this.plantEnvironmentalFactors = {
      'tomato': {
        temperatureOptimal: [18, 25],
        humidityOptimal: [60, 80],
        soilMoistureOptimal: [60, 80],
        lightRequirement: 'high'
      },
      'lettuce': {
        temperatureOptimal: [15, 20],
        humidityOptimal: [50, 70],
        soilMoistureOptimal: [70, 85],
        lightRequirement: 'medium'
      },
      'pepper': {
        temperatureOptimal: [20, 28],
        humidityOptimal: [50, 70],
        soilMoistureOptimal: [55, 75],
        lightRequirement: 'high'
      },
      'cucumber': {
        temperatureOptimal: [18, 24],
        humidityOptimal: [70, 90],
        soilMoistureOptimal: [70, 85],
        lightRequirement: 'high'
      },
      'herb': {
        temperatureOptimal: [16, 22],
        humidityOptimal: [40, 60],
        soilMoistureOptimal: [50, 70],
        lightRequirement: 'medium'
      },
      'flower': {
        temperatureOptimal: [18, 24],
        humidityOptimal: [50, 70],
        soilMoistureOptimal: [60, 80],
        lightRequirement: 'medium'
      },
      'other': {
        temperatureOptimal: [18, 25],
        humidityOptimal: [50, 70],
        soilMoistureOptimal: [60, 80],
        lightRequirement: 'medium'
      }
    };
  }

  /**
   * Calculate environmental stress factors for a plant
   */
  calculateEnvironmentalStress(sensorData) {
    const plantType = sensorData.plantType || 'other';
    const factors = this.plantEnvironmentalFactors[plantType];
    
    if (!factors) {
      logger.warn(`Unknown plant type: ${plantType}, using default factors`);
      factors = this.plantEnvironmentalFactors['other'];
    }

    // Temperature stress
    const tempStress = this.calculateTemperatureStress(
      sensorData.temperature, 
      factors.temperatureOptimal
    );

    // Humidity stress
    const humidityStress = this.calculateHumidityStress(
      sensorData.humidity, 
      factors.humidityOptimal
    );

    // Soil moisture stress
    const moistureStress = this.calculateMoistureStress(
      sensorData.soilMoisture, 
      factors.soilMoistureOptimal
    );

    // Light stress
    const lightStress = this.calculateLightStress(
      sensorData.lightLevel, 
      factors.lightRequirement
    );

    // Combined stress score (0 = no stress, 1 = maximum stress)
    const overallStress = (tempStress + humidityStress + moistureStress + lightStress) / 4;

    return {
      temperatureStress: tempStress,
      humidityStress: humidityStress,
      moistureStress: moistureStress,
      lightStress: lightStress,
      overallStress: overallStress
    };
  }

  calculateTemperatureStress(temperature, optimal) {
    if (!temperature || !optimal) return 0.5;
    
    const [min, max] = optimal;
    if (temperature >= min && temperature <= max) {
      return 0; // No stress
    }
    
    if (temperature < min) {
      // Cold stress
      return Math.min(1, (min - temperature) / 10);
    } else {
      // Heat stress
      return Math.min(1, (temperature - max) / 15);
    }
  }

  calculateHumidityStress(humidity, optimal) {
    if (!humidity || !optimal) return 0.5;
    
    const [min, max] = optimal;
    if (humidity >= min && humidity <= max) {
      return 0; // No stress
    }
    
    if (humidity < min) {
      // Dry stress
      return Math.min(1, (min - humidity) / 30);
    } else {
      // High humidity stress
      return Math.min(1, (humidity - max) / 20);
    }
  }

  calculateMoistureStress(soilMoisture, optimal) {
    if (!soilMoisture || !optimal) return 0.5;
    
    const [min, max] = optimal;
    if (soilMoisture >= min && soilMoisture <= max) {
      return 0; // No stress
    }
    
    if (soilMoisture < min) {
      // Drought stress
      return Math.min(1, (min - soilMoisture) / 40);
    } else {
      // Waterlogged stress
      return Math.min(1, (soilMoisture - max) / 20);
    }
  }

  calculateLightStress(lightLevel, requirement) {
    if (!lightLevel) return 0.5;
    
    const lightThresholds = {
      'low': [1000, 10000],
      'medium': [10000, 30000],
      'high': [30000, 80000]
    };
    
    const [min, max] = lightThresholds[requirement] || lightThresholds['medium'];
    
    if (lightLevel >= min && lightLevel <= max) {
      return 0; // No stress
    }
    
    if (lightLevel < min) {
      // Low light stress
      return Math.min(1, (min - lightLevel) / min);
    } else {
      // High light stress (less common)
      return Math.min(1, (lightLevel - max) / max * 0.5);
    }
  }

  /**
   * Calculate water demand based on environmental factors
   */
  calculateWaterDemand(sensorData, stressFactors) {
    let baseDemand = 1.0; // Base water demand multiplier
    
    // Increase demand based on stress factors
    baseDemand += stressFactors.temperatureStress * 0.5;
    baseDemand += stressFactors.humidityStress * 0.3;
    baseDemand += stressFactors.lightStress * 0.2;
    
    // Decrease demand if soil is already moist
    if (sensorData.soilMoisture > 70) {
      baseDemand *= 0.7;
    } else if (sensorData.soilMoisture > 50) {
      baseDemand *= 0.85;
    }
    
    // Weather forecast adjustment
    if (sensorData.weatherForecast > 0.7) {
      baseDemand *= 0.5; // Reduce if rain expected
    } else if (sensorData.weatherForecast > 0.3) {
      baseDemand *= 0.8; // Slightly reduce if some rain expected
    }
    
    return Math.max(0.1, Math.min(2.0, baseDemand));
  }

  /**
   * Calculate time-based features
   */
  calculateTimeFeatures(lastWateringTime) {
    const now = new Date();
    const lastWatering = new Date(lastWateringTime);
    
    // Hours since last watering
    const hoursSinceWatering = (now - lastWatering) / (1000 * 60 * 60);
    
    // Time of day factor (plants need more water during day)
    const hour = now.getHours();
    const timeOfDayFactor = hour >= 6 && hour <= 18 ? 1.2 : 0.8;
    
    // Day of week factor (weekend vs weekday - for user convenience)
    const dayOfWeek = now.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.1 : 1.0;
    
    // Seasonal factor
    const month = now.getMonth();
    const seasonalFactor = this.calculateSeasonalFactor(month);
    
    return {
      hoursSinceWatering,
      timeOfDayFactor,
      weekendFactor,
      seasonalFactor,
      currentHour: hour,
      currentMonth: month
    };
  }

  calculateSeasonalFactor(month) {
    // Vietnam seasons: Spring (Feb-Apr), Summer (May-Jul), Autumn (Aug-Oct), Winter (Nov-Jan)
    const seasonFactors = {
      0: 0.8,  // January - Winter
      1: 0.9,  // February - Spring start
      2: 1.0,  // March - Spring
      3: 1.1,  // April - Spring end
      4: 1.3,  // May - Summer start
      5: 1.4,  // June - Summer
      6: 1.4,  // July - Summer
      7: 1.2,  // August - Autumn start
      8: 1.1,  // September - Autumn
      9: 1.0,  // October - Autumn end
      10: 0.9, // November - Winter start
      11: 0.8  // December - Winter
    };
    
    return seasonFactors[month] || 1.0;
  }

  /**
   * Create comprehensive feature vector for ML model
   */
  createFeatureVector(sensorData, includeTimeFeatures = true) {
    try {
      // Basic sensor features (normalized)
      const basicFeatures = {
        soilMoisture: (sensorData.soilMoisture || 50) / 100,
        temperature: Math.max(0, Math.min(50, sensorData.temperature || 25)) / 50,
        humidity: (sensorData.humidity || 60) / 100,
        lightLevel: Math.min(100000, sensorData.lightLevel || 30000) / 100000
      };

      // Environmental stress features
      const stressFactors = this.calculateEnvironmentalStress(sensorData);
      
      // Water demand feature
      const waterDemand = this.calculateWaterDemand(sensorData, stressFactors);
      
      // Time-based features
      let timeFeatures = {};
      if (includeTimeFeatures && sensorData.lastWateringTime) {
        timeFeatures = this.calculateTimeFeatures(sensorData.lastWateringTime);
      } else {
        // Default time features
        timeFeatures = {
          hoursSinceWatering: 24,
          timeOfDayFactor: 1.0,
          weekendFactor: 1.0,
          seasonalFactor: 1.0
        };
      }

      // Plant type encoding
      const plantTypeMapping = {
        'tomato': 0, 'lettuce': 1, 'pepper': 2, 'cucumber': 3,
        'herb': 4, 'flower': 5, 'other': 6
      };
      const plantTypeEncoded = (plantTypeMapping[sensorData.plantType] || 6) / 6;

      // Weather forecast feature
      const weatherForecast = Math.max(0, Math.min(1, sensorData.weatherForecast || 0));

      // Combine all features into a vector
      const featureVector = [
        basicFeatures.soilMoisture,
        basicFeatures.temperature,
        basicFeatures.humidity,
        basicFeatures.lightLevel,
        plantTypeEncoded,
        stressFactors.overallStress,
        waterDemand / 2, // Normalize to 0-1 range
        Math.min(1, timeFeatures.hoursSinceWatering / 72), // Normalize to 0-1 (max 72 hours)
        timeFeatures.seasonalFactor / 1.4, // Normalize to 0-1
        weatherForecast
      ];

      logger.debug('Feature vector created', {
        plantType: sensorData.plantType,
        vectorLength: featureVector.length,
        overallStress: stressFactors.overallStress,
        waterDemand: waterDemand
      });

      return {
        vector: featureVector,
        metadata: {
          basicFeatures,
          stressFactors,
          waterDemand,
          timeFeatures,
          plantType: sensorData.plantType
        }
      };
    } catch (error) {
      logger.error('Error creating feature vector:', error);
      throw error;
    }
  }

  /**
   * Validate sensor data completeness and quality
   */
  validateSensorData(sensorData) {
    const issues = [];
    
    // Check required fields
    if (sensorData.soilMoisture === undefined || sensorData.soilMoisture === null) {
      issues.push('Missing soil moisture data');
    } else if (sensorData.soilMoisture < 0 || sensorData.soilMoisture > 100) {
      issues.push('Invalid soil moisture value (should be 0-100%)');
    }
    
    if (sensorData.temperature === undefined || sensorData.temperature === null) {
      issues.push('Missing temperature data');
    } else if (sensorData.temperature < -10 || sensorData.temperature > 60) {
      issues.push('Invalid temperature value (should be -10 to 60°C)');
    }
    
    if (sensorData.humidity === undefined || sensorData.humidity === null) {
      issues.push('Missing humidity data');
    } else if (sensorData.humidity < 0 || sensorData.humidity > 100) {
      issues.push('Invalid humidity value (should be 0-100%)');
    }
    
    // Optional fields validation
    if (sensorData.lightLevel !== undefined && (sensorData.lightLevel < 0 || sensorData.lightLevel > 200000)) {
      issues.push('Invalid light level value');
    }
    
    if (sensorData.weatherForecast !== undefined && (sensorData.weatherForecast < 0 || sensorData.weatherForecast > 1)) {
      issues.push('Invalid weather forecast value (should be 0-1)');
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      completeness: this.calculateDataCompleteness(sensorData)
    };
  }

  calculateDataCompleteness(sensorData) {
    const requiredFields = ['soilMoisture', 'temperature', 'humidity'];
    const optionalFields = ['lightLevel', 'plantType', 'weatherForecast', 'lastWateringTime'];
    
    const requiredComplete = requiredFields.filter(field => 
      sensorData[field] !== undefined && sensorData[field] !== null
    ).length;
    
    const optionalComplete = optionalFields.filter(field => 
      sensorData[field] !== undefined && sensorData[field] !== null
    ).length;
    
    const totalFields = requiredFields.length + optionalFields.length;
    const completeFields = requiredComplete + optionalComplete;
    
    return {
      percentage: (completeFields / totalFields) * 100,
      requiredComplete: requiredComplete === requiredFields.length,
      missingRequired: requiredFields.filter(field => 
        sensorData[field] === undefined || sensorData[field] === null
      ),
      missingOptional: optionalFields.filter(field => 
        sensorData[field] === undefined || sensorData[field] === null
      )
    };
  }
}

module.exports = FeatureEngineering;