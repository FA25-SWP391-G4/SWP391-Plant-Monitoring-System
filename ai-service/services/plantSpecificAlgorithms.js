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

class PlantSpecificAlgorithms {
  constructor() {
    // Detailed plant care profiles
    this.plantProfiles = {
      'tomato': {
        name: 'Cà chua',
        wateringFrequency: 'daily', // daily, every2days, weekly
        waterAmount: { min: 400, max: 600, optimal: 500 },
        soilMoisture: { min: 60, max: 80, critical: 30 },
        temperature: { min: 18, max: 25, critical: 35 },
        humidity: { min: 60, max: 80, critical: 90 },
        lightHours: { min: 6, max: 8, optimal: 7 },
        growthStages: {
          seedling: { waterMultiplier: 0.5, frequency: 'daily' },
          vegetative: { waterMultiplier: 1.0, frequency: 'daily' },
          flowering: { waterMultiplier: 1.2, frequency: 'daily' },
          fruiting: { waterMultiplier: 1.4, frequency: 'daily' }
        },
        seasonalAdjustments: {
          spring: 1.0,
          summer: 1.3,
          autumn: 0.9,
          winter: 0.7
        }
      },
      'lettuce': {
        name: 'Xà lách',
        wateringFrequency: 'daily',
        waterAmount: { min: 250, max: 400, optimal: 300 },
        soilMoisture: { min: 70, max: 85, critical: 40 },
        temperature: { min: 15, max: 20, critical: 25 },
        humidity: { min: 50, max: 70, critical: 80 },
        lightHours: { min: 4, max: 6, optimal: 5 },
        growthStages: {
          seedling: { waterMultiplier: 0.4, frequency: 'daily' },
          vegetative: { waterMultiplier: 1.0, frequency: 'daily' },
          mature: { waterMultiplier: 1.1, frequency: 'daily' }
        },
        seasonalAdjustments: {
          spring: 1.1,
          summer: 0.8, // Lettuce prefers cooler weather
          autumn: 1.2,
          winter: 1.0
        }
      },
      'pepper': {
        name: 'Ớt',
        wateringFrequency: 'daily',
        waterAmount: { min: 350, max: 500, optimal: 400 },
        soilMoisture: { min: 55, max: 75, critical: 25 },
        temperature: { min: 20, max: 28, critical: 35 },
        humidity: { min: 50, max: 70, critical: 85 },
        lightHours: { min: 6, max: 8, optimal: 7 },
        growthStages: {
          seedling: { waterMultiplier: 0.5, frequency: 'daily' },
          vegetative: { waterMultiplier: 1.0, frequency: 'daily' },
          flowering: { waterMultiplier: 1.1, frequency: 'daily' },
          fruiting: { waterMultiplier: 1.3, frequency: 'daily' }
        },
        seasonalAdjustments: {
          spring: 1.0,
          summer: 1.2,
          autumn: 1.0,
          winter: 0.8
        }
      },
      'cucumber': {
        name: 'Dưa chuột',
        wateringFrequency: 'daily',
        waterAmount: { min: 500, max: 800, optimal: 600 },
        soilMoisture: { min: 70, max: 85, critical: 35 },
        temperature: { min: 18, max: 24, critical: 30 },
        humidity: { min: 70, max: 90, critical: 95 },
        lightHours: { min: 6, max: 8, optimal: 7 },
        growthStages: {
          seedling: { waterMultiplier: 0.6, frequency: 'daily' },
          vegetative: { waterMultiplier: 1.0, frequency: 'daily' },
          flowering: { waterMultiplier: 1.3, frequency: 'daily' },
          fruiting: { waterMultiplier: 1.5, frequency: 'daily' }
        },
        seasonalAdjustments: {
          spring: 1.0,
          summer: 1.4,
          autumn: 1.0,
          winter: 0.7
        }
      },
      'herb': {
        name: 'Thảo mộc',
        wateringFrequency: 'every2days',
        waterAmount: { min: 150, max: 300, optimal: 200 },
        soilMoisture: { min: 50, max: 70, critical: 25 },
        temperature: { min: 16, max: 22, critical: 30 },
        humidity: { min: 40, max: 60, critical: 75 },
        lightHours: { min: 4, max: 6, optimal: 5 },
        growthStages: {
          seedling: { waterMultiplier: 0.4, frequency: 'daily' },
          vegetative: { waterMultiplier: 1.0, frequency: 'every2days' },
          mature: { waterMultiplier: 0.9, frequency: 'every2days' }
        },
        seasonalAdjustments: {
          spring: 1.1,
          summer: 1.0,
          autumn: 0.9,
          winter: 0.8
        }
      },
      'flower': {
        name: 'Hoa',
        wateringFrequency: 'every2days',
        waterAmount: { min: 200, max: 350, optimal: 250 },
        soilMoisture: { min: 60, max: 80, critical: 30 },
        temperature: { min: 18, max: 24, critical: 32 },
        humidity: { min: 50, max: 70, critical: 80 },
        lightHours: { min: 5, max: 7, optimal: 6 },
        growthStages: {
          seedling: { waterMultiplier: 0.5, frequency: 'daily' },
          vegetative: { waterMultiplier: 1.0, frequency: 'every2days' },
          budding: { waterMultiplier: 1.2, frequency: 'daily' },
          flowering: { waterMultiplier: 1.1, frequency: 'every2days' }
        },
        seasonalAdjustments: {
          spring: 1.2,
          summer: 1.0,
          autumn: 0.9,
          winter: 0.8
        }
      },
      'other': {
        name: 'Khác',
        wateringFrequency: 'every2days',
        waterAmount: { min: 250, max: 450, optimal: 350 },
        soilMoisture: { min: 60, max: 80, critical: 30 },
        temperature: { min: 18, max: 25, critical: 32 },
        humidity: { min: 50, max: 70, critical: 80 },
        lightHours: { min: 5, max: 7, optimal: 6 },
        growthStages: {
          seedling: { waterMultiplier: 0.5, frequency: 'daily' },
          vegetative: { waterMultiplier: 1.0, frequency: 'every2days' },
          mature: { waterMultiplier: 1.0, frequency: 'every2days' }
        },
        seasonalAdjustments: {
          spring: 1.0,
          summer: 1.1,
          autumn: 1.0,
          winter: 0.9
        }
      }
    };
  }

  /**
   * Get plant-specific irrigation recommendation
   */
  getIrrigationRecommendation(plantType, sensorData, plantMetadata = {}) {
    try {
      const profile = this.plantProfiles[plantType] || this.plantProfiles['other'];
      const currentSeason = this.getCurrentSeason();
      const growthStage = plantMetadata.growthStage || 'vegetative';

      // Calculate base water amount
      let baseWaterAmount = profile.waterAmount.optimal;
      
      // Apply growth stage multiplier
      if (profile.growthStages[growthStage]) {
        baseWaterAmount *= profile.growthStages[growthStage].waterMultiplier;
      }

      // Apply seasonal adjustment
      baseWaterAmount *= profile.seasonalAdjustments[currentSeason];

      // Apply environmental adjustments
      const environmentalAdjustment = this.calculateEnvironmentalAdjustment(
        profile, sensorData
      );
      baseWaterAmount *= environmentalAdjustment.multiplier;

      // Determine if watering is needed
      const shouldWater = this.shouldWaterPlant(profile, sensorData, plantMetadata);
      
      // Calculate next watering time
      const nextWateringHours = this.calculateNextWateringTime(
        profile, sensorData, plantMetadata, shouldWater
      );

      // Generate plant-specific advice
      const advice = this.generatePlantSpecificAdvice(
        profile, sensorData, environmentalAdjustment
      );

      const recommendation = {
        shouldWater,
        waterAmount: Math.round(Math.max(profile.waterAmount.min, 
                                Math.min(profile.waterAmount.max, baseWaterAmount))),
        nextWateringHours: Math.round(nextWateringHours),
        confidence: this.calculateConfidence(profile, sensorData),
        plantSpecificAdvice: advice,
        environmentalStatus: environmentalAdjustment.status,
        growthStage,
        season: currentSeason,
        plantName: profile.name
      };

      logger.info('Plant-specific recommendation generated', {
        plantType,
        shouldWater,
        waterAmount: recommendation.waterAmount,
        confidence: recommendation.confidence
      });

      return recommendation;
    } catch (error) {
      logger.error('Error generating plant-specific recommendation:', error);
      throw error;
    }
  }

  shouldWaterPlant(profile, sensorData, plantMetadata) {
    const { soilMoisture, temperature, lastWateringHours = 24 } = sensorData;
    
    // Critical conditions - always water
    if (soilMoisture <= profile.soilMoisture.critical) {
      return true;
    }

    // Below minimum threshold
    if (soilMoisture < profile.soilMoisture.min) {
      return true;
    }

    // High temperature stress
    if (temperature > profile.temperature.critical && soilMoisture < profile.soilMoisture.max) {
      return true;
    }

    // Time-based watering (if it's been too long)
    const maxHoursBetweenWatering = this.getMaxHoursBetweenWatering(profile.wateringFrequency);
    if (lastWateringHours > maxHoursBetweenWatering) {
      return true;
    }

    // Growth stage specific needs
    const growthStage = plantMetadata.growthStage || 'vegetative';
    if (profile.growthStages[growthStage] && 
        profile.growthStages[growthStage].frequency === 'daily' && 
        lastWateringHours > 20) {
      return true;
    }

    return false;
  }

  calculateEnvironmentalAdjustment(profile, sensorData) {
    let multiplier = 1.0;
    const status = [];

    // Temperature adjustment
    if (sensorData.temperature > profile.temperature.max) {
      const tempExcess = sensorData.temperature - profile.temperature.max;
      multiplier += Math.min(0.5, tempExcess / 10);
      status.push(`Nhiệt độ cao (${sensorData.temperature}°C)`);
    } else if (sensorData.temperature < profile.temperature.min) {
      const tempDeficit = profile.temperature.min - sensorData.temperature;
      multiplier -= Math.min(0.3, tempDeficit / 10);
      status.push(`Nhiệt độ thấp (${sensorData.temperature}°C)`);
    }

    // Humidity adjustment
    if (sensorData.humidity < profile.humidity.min) {
      const humidityDeficit = profile.humidity.min - sensorData.humidity;
      multiplier += Math.min(0.3, humidityDeficit / 30);
      status.push(`Độ ẩm không khí thấp (${sensorData.humidity}%)`);
    } else if (sensorData.humidity > profile.humidity.critical) {
      multiplier -= 0.2;
      status.push(`Độ ẩm không khí quá cao (${sensorData.humidity}%)`);
    }

    // Light level adjustment (if available)
    if (sensorData.lightLevel !== undefined) {
      const optimalLight = profile.lightHours.optimal * 10000; // Rough conversion
      if (sensorData.lightLevel > optimalLight * 1.5) {
        multiplier += 0.2;
        status.push('Ánh sáng mạnh');
      } else if (sensorData.lightLevel < optimalLight * 0.5) {
        multiplier -= 0.1;
        status.push('Ánh sáng yếu');
      }
    }

    // Weather forecast adjustment
    if (sensorData.weatherForecast > 0.7) {
      multiplier *= 0.5;
      status.push('Dự báo mưa lớn');
    } else if (sensorData.weatherForecast > 0.3) {
      multiplier *= 0.8;
      status.push('Dự báo có mưa');
    }

    return {
      multiplier: Math.max(0.3, Math.min(2.0, multiplier)),
      status: status.length > 0 ? status : ['Điều kiện bình thường']
    };
  }

  calculateNextWateringTime(profile, sensorData, plantMetadata, shouldWater) {
    if (shouldWater) {
      return 0; // Water immediately
    }

    const { soilMoisture, temperature } = sensorData;
    const baseFrequency = this.getMaxHoursBetweenWatering(profile.wateringFrequency);
    
    // Adjust based on current soil moisture
    let hoursUntilWater = baseFrequency;
    
    if (soilMoisture > profile.soilMoisture.max) {
      // Soil is very moist, extend time
      hoursUntilWater *= 1.5;
    } else if (soilMoisture < profile.soilMoisture.min + 10) {
      // Soil is getting dry, reduce time
      hoursUntilWater *= 0.7;
    }

    // Temperature adjustment
    if (temperature > profile.temperature.max) {
      hoursUntilWater *= 0.8; // Water sooner in hot weather
    } else if (temperature < profile.temperature.min) {
      hoursUntilWater *= 1.2; // Water later in cool weather
    }

    // Growth stage adjustment
    const growthStage = plantMetadata.growthStage || 'vegetative';
    if (profile.growthStages[growthStage]) {
      if (profile.growthStages[growthStage].frequency === 'daily') {
        hoursUntilWater = Math.min(hoursUntilWater, 24);
      }
    }

    return Math.max(1, Math.min(72, hoursUntilWater));
  }

  generatePlantSpecificAdvice(profile, sensorData, environmentalAdjustment) {
    const advice = [];
    
    // Soil moisture advice
    if (sensorData.soilMoisture < profile.soilMoisture.min) {
      advice.push(`Độ ẩm đất thấp cho ${profile.name}. Nên tưới để duy trì ${profile.soilMoisture.min}-${profile.soilMoisture.max}%.`);
    } else if (sensorData.soilMoisture > profile.soilMoisture.max) {
      advice.push(`Độ ẩm đất hơi cao cho ${profile.name}. Tạm dừng tưới và đảm bảo thoát nước tốt.`);
    }

    // Temperature advice
    if (sensorData.temperature > profile.temperature.critical) {
      advice.push(`Nhiệt độ quá cao cho ${profile.name}. Cần che bóng mát và tăng tần suất tưới.`);
    } else if (sensorData.temperature < profile.temperature.min) {
      advice.push(`Nhiệt độ thấp cho ${profile.name}. Giảm tần suất tưới và bảo vệ khỏi lạnh.`);
    }

    // Humidity advice
    if (sensorData.humidity < profile.humidity.min) {
      advice.push(`Độ ẩm không khí thấp. Tăng độ ẩm xung quanh ${profile.name} bằng cách phun sương.`);
    } else if (sensorData.humidity > profile.humidity.critical) {
      advice.push(`Độ ẩm không khí quá cao. Tăng thông gió để tránh bệnh nấm cho ${profile.name}.`);
    }

    // Seasonal advice
    const season = this.getCurrentSeason();
    switch (season) {
      case 'summer':
        advice.push(`Mùa hè: Tăng tần suất tưới và che bóng mát cho ${profile.name}.`);
        break;
      case 'winter':
        advice.push(`Mùa đông: Giảm tần suất tưới và bảo vệ ${profile.name} khỏi lạnh.`);
        break;
      case 'spring':
        advice.push(`Mùa xuân: Thời điểm tốt để ${profile.name} phát triển, duy trì tưới đều đặn.`);
        break;
      case 'autumn':
        advice.push(`Mùa thu: Điều chỉnh tưới phù hợp với thời tiết mát mẻ cho ${profile.name}.`);
        break;
    }

    return advice.length > 0 ? advice : [`${profile.name} đang trong điều kiện chăm sóc tốt.`];
  }

  calculateConfidence(profile, sensorData) {
    let confidence = 0.8; // Base confidence

    // Increase confidence with complete sensor data
    if (sensorData.soilMoisture !== undefined) confidence += 0.05;
    if (sensorData.temperature !== undefined) confidence += 0.05;
    if (sensorData.humidity !== undefined) confidence += 0.05;
    if (sensorData.lightLevel !== undefined) confidence += 0.03;
    if (sensorData.weatherForecast !== undefined) confidence += 0.02;

    // Decrease confidence for extreme values
    if (sensorData.soilMoisture < 10 || sensorData.soilMoisture > 95) confidence -= 0.1;
    if (sensorData.temperature < 5 || sensorData.temperature > 45) confidence -= 0.1;
    if (sensorData.humidity < 10 || sensorData.humidity > 95) confidence -= 0.05;

    return Math.max(0.3, Math.min(1.0, confidence));
  }

  getCurrentSeason() {
    const month = new Date().getMonth();
    // Vietnam seasons
    if (month >= 1 && month <= 3) return 'spring';   // Feb-Apr
    if (month >= 4 && month <= 6) return 'summer';   // May-Jul
    if (month >= 7 && month <= 9) return 'autumn';   // Aug-Oct
    return 'winter'; // Nov-Jan
  }

  getMaxHoursBetweenWatering(frequency) {
    switch (frequency) {
      case 'daily': return 24;
      case 'every2days': return 48;
      case 'weekly': return 168;
      default: return 48;
    }
  }

  /**
   * Get plant profile information
   */
  getPlantProfile(plantType) {
    return this.plantProfiles[plantType] || this.plantProfiles['other'];
  }

  /**
   * Get all supported plant types
   */
  getSupportedPlantTypes() {
    return Object.keys(this.plantProfiles).map(key => ({
      key,
      name: this.plantProfiles[key].name,
      wateringFrequency: this.plantProfiles[key].wateringFrequency,
      waterAmount: this.plantProfiles[key].waterAmount
    }));
  }

  /**
   * Validate plant type
   */
  isValidPlantType(plantType) {
    return this.plantProfiles.hasOwnProperty(plantType);
  }

  /**
   * Get growth stage recommendations
   */
  getGrowthStageRecommendations(plantType, growthStage) {
    const profile = this.plantProfiles[plantType] || this.plantProfiles['other'];
    const stageInfo = profile.growthStages[growthStage];
    
    if (!stageInfo) {
      return null;
    }

    return {
      waterMultiplier: stageInfo.waterMultiplier,
      frequency: stageInfo.frequency,
      recommendedWaterAmount: Math.round(profile.waterAmount.optimal * stageInfo.waterMultiplier),
      advice: this.getGrowthStageAdvice(plantType, growthStage)
    };
  }

  getGrowthStageAdvice(plantType, growthStage) {
    const profile = this.plantProfiles[plantType] || this.plantProfiles['other'];
    const advice = [];

    switch (growthStage) {
      case 'seedling':
        advice.push(`Giai đoạn mạ: ${profile.name} cần ít nước hơn nhưng tưới thường xuyên.`);
        advice.push('Tránh tưới quá nhiều để không làm thối rễ.');
        break;
      case 'vegetative':
        advice.push(`Giai đoạn sinh trưởng: ${profile.name} cần nước đều đặn để phát triển lá.`);
        advice.push('Đây là thời kỳ quan trọng để xây dựng hệ thống rễ mạnh.');
        break;
      case 'flowering':
      case 'budding':
        advice.push(`Giai đoạn ra hoa: ${profile.name} cần nhiều nước hơn để hỗ trợ quá trình ra hoa.`);
        advice.push('Tránh để thiếu nước trong giai đoạn này.');
        break;
      case 'fruiting':
        advice.push(`Giai đoạn kết quả: ${profile.name} cần lượng nước cao nhất.`);
        advice.push('Duy trì độ ẩm đất ổn định để quả phát triển tốt.');
        break;
      case 'mature':
        advice.push(`Giai đoạn trưởng thành: ${profile.name} cần nước ổn định.`);
        advice.push('Có thể giảm nhẹ tần suất tưới so với giai đoạn sinh trưởng.');
        break;
    }

    return advice;
  }
}

module.exports = PlantSpecificAlgorithms;