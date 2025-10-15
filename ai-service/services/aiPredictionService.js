/**
 * AI Prediction Service - Dự báo nhu cầu tưới cây thông minh
 */

const sensorService = require('./sensorService');

class AIPredictionService {
  constructor() {
    this.models = {
      irrigation: null,
      weather: null,
      plant_health: null
    };
    this.learningData = [];
  }

  /**
   * Dự báo nhu cầu tưới cây dựa trên AI
   */
  async predictIrrigationNeed(plantId, options = {}) {
    try {
      // Lấy dữ liệu đầu vào
      const sensorData = await sensorService.getLatestSensorData(plantId);
      const plantInfo = await sensorService.getPlantInfo(plantId);
      const wateringHistory = await sensorService.getWateringHistory(plantId, 10);
      const weatherData = await this.getWeatherForecast();

      // Chuẩn bị features cho model
      const features = this.prepareFeatures(sensorData, plantInfo, wateringHistory, weatherData);
      
      // Dự báo với AI model
      const prediction = await this.runPredictionModel(features, 'irrigation');
      
      // Tính toán confidence score
      const confidence = this.calculateConfidence(features, prediction);
      
      // Tạo khuyến nghị chi tiết
      const recommendations = this.generateRecommendations(prediction, features);

      return {
        plantId,
        prediction: {
          needsWatering: prediction.needsWatering,
          urgencyLevel: prediction.urgencyLevel, // low, medium, high, critical
          optimalWateringTime: prediction.optimalTime,
          recommendedAmount: prediction.amount, // ml
          confidence: confidence,
          nextCheckTime: prediction.nextCheck
        },
        analysis: {
          currentConditions: this.analyzeCurrentConditions(sensorData, plantInfo),
          weatherImpact: this.analyzeWeatherImpact(weatherData),
          historicalTrends: this.analyzeHistoricalTrends(wateringHistory),
          plantSpecificFactors: this.analyzePlantFactors(plantInfo, sensorData)
        },
        recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Lỗi dự báo AI:', error);
      return this.getFallbackPrediction(plantId);
    }
  }

  /**
   * Chuẩn bị features cho AI model
   */
  prepareFeatures(sensorData, plantInfo, wateringHistory, weatherData) {
    const now = new Date();
    const hourOfDay = now.getHours();
    const dayOfWeek = now.getDay();
    const seasonFactor = this.getSeasonFactor(now);

    // Tính toán các features từ lịch sử tưới
    const avgWateringInterval = this.calculateAverageInterval(wateringHistory);
    const lastWateringHours = wateringHistory.length > 0 
      ? (now - new Date(wateringHistory[0].timestamp)) / (1000 * 60 * 60)
      : 48;

    // Features cơ bản
    const features = {
      // Dữ liệu cảm biến hiện tại
      soilMoisture: sensorData.soilMoisture || 50,
      temperature: sensorData.temperature || 25,
      humidity: sensorData.humidity || 60,
      lightLevel: sensorData.lightLevel || 3000,
      soilPH: sensorData.soilPH || 6.5,

      // Thông tin cây trồng
      plantType: this.encodePlantType(plantInfo.type),
      plantAge: plantInfo.age || 30, // days
      optimalMoisture: plantInfo.optimalSoilMoisture?.min || 40,
      optimalTemp: plantInfo.optimalTemp?.min || 20,

      // Yếu tố thời gian
      hourOfDay,
      dayOfWeek,
      seasonFactor,

      // Lịch sử tưới
      lastWateringHours,
      avgWateringInterval,
      wateringFrequency: wateringHistory.length,

      // Dữ liệu thời tiết
      weatherTemp: weatherData.temperature || 25,
      weatherHumidity: weatherData.humidity || 60,
      rainProbability: weatherData.rainProbability || 0,
      windSpeed: weatherData.windSpeed || 5,

      // Features tính toán
      moistureDeficit: Math.max(0, (plantInfo.optimalSoilMoisture?.min || 40) - sensorData.soilMoisture),
      tempStress: Math.abs(sensorData.temperature - (plantInfo.optimalTemp?.min || 25)),
      evapotranspirationRate: this.calculateET(sensorData, weatherData)
    };

    return features;
  }

  /**
   * Chạy AI prediction model
   */
  async runPredictionModel(features, modelType) {
    // Mô phỏng AI model prediction
    // Trong thực tế sẽ sử dụng TensorFlow.js hoặc gọi Python service
    
    const moistureDeficit = features.moistureDeficit;
    const tempStress = features.tempStress;
    const etRate = features.evapotranspirationRate;
    const timeSinceLastWatering = features.lastWateringHours;

    // Logic dự báo dựa trên weighted scoring
    let needsWateringScore = 0;
    let urgencyScore = 0;

    // Yếu tố độ ẩm đất (40% trọng số)
    if (moistureDeficit > 15) {
      needsWateringScore += 40;
      urgencyScore += 30;
    } else if (moistureDeficit > 10) {
      needsWateringScore += 25;
      urgencyScore += 15;
    } else if (moistureDeficit > 5) {
      needsWateringScore += 15;
      urgencyScore += 5;
    }

    // Yếu tố thời gian (25% trọng số)
    if (timeSinceLastWatering > features.avgWateringInterval * 1.2) {
      needsWateringScore += 25;
      urgencyScore += 20;
    } else if (timeSinceLastWatering > features.avgWateringInterval) {
      needsWateringScore += 15;
      urgencyScore += 10;
    }

    // Yếu tố thời tiết (20% trọng số)
    if (features.rainProbability < 30 && etRate > 3) {
      needsWateringScore += 20;
      urgencyScore += 15;
    } else if (features.rainProbability > 70) {
      needsWateringScore -= 15;
      urgencyScore -= 10;
    }

    // Yếu tố stress nhiệt độ (15% trọng số)
    if (tempStress > 5) {
      needsWateringScore += 15;
      urgencyScore += 10;
    }

    // Xác định kết quả
    const needsWatering = needsWateringScore > 50;
    let urgencyLevel = 'low';
    if (urgencyScore > 50) urgencyLevel = 'critical';
    else if (urgencyScore > 35) urgencyLevel = 'high';
    else if (urgencyScore > 20) urgencyLevel = 'medium';

    // Tính toán thời gian tưới tối ưu
    const optimalTime = this.calculateOptimalWateringTime(features, urgencyLevel);
    
    // Tính toán lượng nước khuyến nghị
    const recommendedAmount = this.calculateWateringAmount(features, moistureDeficit);

    // Thời gian kiểm tra tiếp theo
    const nextCheck = this.calculateNextCheckTime(urgencyLevel, features);

    return {
      needsWatering,
      urgencyLevel,
      optimalTime,
      amount: recommendedAmount,
      nextCheck,
      score: needsWateringScore,
      urgencyScore
    };
  }

  /**
   * Tính toán độ tin cậy của dự báo
   */
  calculateConfidence(features, prediction) {
    let confidence = 70; // Base confidence

    // Tăng confidence nếu có đủ dữ liệu lịch sử
    if (features.wateringFrequency > 5) confidence += 10;
    if (features.wateringFrequency > 10) confidence += 5;

    // Tăng confidence nếu dữ liệu cảm biến ổn định
    if (features.soilMoisture > 0 && features.temperature > 0) confidence += 10;

    // Giảm confidence nếu thời tiết không ổn định
    if (features.rainProbability > 30 && features.rainProbability < 70) confidence -= 5;

    // Tăng confidence nếu prediction rõ ràng
    if (prediction.score > 70 || prediction.score < 30) confidence += 10;

    return Math.max(60, Math.min(95, confidence));
  }

  /**
   * Tạo khuyến nghị chi tiết
   */
  generateRecommendations(prediction, features) {
    const recommendations = [];

    if (prediction.needsWatering) {
      recommendations.push({
        type: 'watering',
        priority: prediction.urgencyLevel,
        title: 'Cần tưới nước',
        message: `Cây cần được tưới ${prediction.amount}ml nước`,
        action: `Tưới vào ${prediction.optimalTime.toLocaleTimeString('vi-VN')}`,
        reason: `Độ ẩm đất hiện tại (${features.soilMoisture}%) thấp hơn mức tối ưu`
      });

      // Khuyến nghị về thời gian tưới
      const hour = prediction.optimalTime.getHours();
      if (hour >= 6 && hour <= 9) {
        recommendations.push({
          type: 'timing',
          priority: 'medium',
          title: 'Thời gian tưới tối ưu',
          message: 'Tưới vào buổi sáng sớm để giảm bay hơi',
          action: 'Duy trì lịch tưới buổi sáng'
        });
      } else if (hour >= 17 && hour <= 19) {
        recommendations.push({
          type: 'timing',
          priority: 'medium',
          title: 'Thời gian tưới phù hợp',
          message: 'Tưới vào buổi chiều muộn',
          action: 'Tránh tưới vào giữa trưa'
        });
      }
    }

    // Khuyến nghị về thời tiết
    if (features.rainProbability > 60) {
      recommendations.push({
        type: 'weather',
        priority: 'low',
        title: 'Dự báo có mưa',
        message: `Xác suất mưa ${features.rainProbability}%`,
        action: 'Có thể hoãn tưới và chờ mưa tự nhiên'
      });
    }

    // Khuyến nghị về nhiệt độ
    if (features.tempStress > 5) {
      recommendations.push({
        type: 'environment',
        priority: 'medium',
        title: 'Nhiệt độ không tối ưu',
        message: `Nhiệt độ hiện tại ${features.temperature}°C`,
        action: 'Cân nhắc di chuyển cây hoặc tạo bóng mát'
      });
    }

    return recommendations;
  }

  /**
   * Các hàm hỗ trợ
   */
  getSeasonFactor(date) {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 1.2; // Mùa xuân
    if (month >= 6 && month <= 8) return 1.5; // Mùa hè
    if (month >= 9 && month <= 11) return 1.0; // Mùa thu
    return 0.8; // Mùa đông
  }

  encodePlantType(type) {
    const typeMap = {
      'tomato': 1, 'cà chua': 1,
      'pepper': 2, 'ớt': 2,
      'lettuce': 3, 'xà lách': 3,
      'herb': 4, 'thảo mộc': 4,
      'flower': 5, 'hoa': 5
    };
    return typeMap[type?.toLowerCase()] || 0;
  }

  calculateAverageInterval(history) {
    if (history.length < 2) return 48; // Default 48 hours
    
    const intervals = [];
    for (let i = 1; i < history.length; i++) {
      const diff = (new Date(history[i-1].timestamp) - new Date(history[i].timestamp)) / (1000 * 60 * 60);
      intervals.push(diff);
    }
    
    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  calculateET(sensorData, weatherData) {
    // Simplified Evapotranspiration calculation
    const temp = sensorData.temperature || 25;
    const humidity = sensorData.humidity || 60;
    const windSpeed = weatherData.windSpeed || 5;
    const lightLevel = sensorData.lightLevel || 3000;
    
    // Penman-Monteith simplified
    const et = (temp * 0.1) + ((100 - humidity) * 0.05) + (windSpeed * 0.02) + (lightLevel * 0.0001);
    return Math.max(0, et);
  }

  calculateOptimalWateringTime(features, urgencyLevel) {
    const now = new Date();
    let optimalHour = 7; // Default morning watering
    
    // Điều chỉnh dựa trên urgency
    if (urgencyLevel === 'critical') {
      return now; // Tưới ngay
    } else if (urgencyLevel === 'high') {
      // Tưới trong 2 giờ tới, nhưng tránh giữa trưa
      const currentHour = now.getHours();
      if (currentHour >= 11 && currentHour <= 15) {
        optimalHour = 17; // Chiều
      } else {
        return new Date(now.getTime() + 2 * 60 * 60 * 1000);
      }
    }
    
    // Tính toán thời gian tưới cho ngày mai
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(optimalHour, 0, 0, 0);
    
    return tomorrow;
  }

  calculateWateringAmount(features, moistureDeficit) {
    // Base amount dựa trên loại cây
    let baseAmount = 200; // ml
    
    // Điều chỉnh dựa trên kích thước cây (plant age)
    const ageMultiplier = Math.min(2, features.plantAge / 30);
    baseAmount *= ageMultiplier;
    
    // Điều chỉnh dựa trên moisture deficit
    const deficitMultiplier = 1 + (moistureDeficit / 50);
    baseAmount *= deficitMultiplier;
    
    // Điều chỉnh dựa trên thời tiết
    if (features.rainProbability > 50) {
      baseAmount *= 0.7; // Giảm nếu có mưa
    }
    
    return Math.round(Math.max(50, Math.min(1000, baseAmount)));
  }

  calculateNextCheckTime(urgencyLevel, features) {
    const now = new Date();
    let hoursToAdd = 24; // Default check sau 24h
    
    switch (urgencyLevel) {
      case 'critical':
        hoursToAdd = 2;
        break;
      case 'high':
        hoursToAdd = 6;
        break;
      case 'medium':
        hoursToAdd = 12;
        break;
      case 'low':
        hoursToAdd = 24;
        break;
    }
    
    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  }

  async getWeatherForecast() {
    // Mô phỏng dữ liệu thời tiết
    // Trong thực tế sẽ gọi API thời tiết thực
    return {
      temperature: 25 + Math.random() * 10 - 5,
      humidity: 60 + Math.random() * 20 - 10,
      rainProbability: Math.random() * 100,
      windSpeed: 3 + Math.random() * 7,
      forecast: {
        nextRain: Math.random() > 0.7 ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
      }
    };
  }

  analyzeCurrentConditions(sensorData, plantInfo) {
    const conditions = [];
    
    // Phân tích độ ẩm đất
    const moistureStatus = this.getMoistureStatus(sensorData.soilMoisture, plantInfo.optimalSoilMoisture);
    conditions.push({
      parameter: 'Độ ẩm đất',
      current: `${sensorData.soilMoisture}%`,
      optimal: `${plantInfo.optimalSoilMoisture?.min}-${plantInfo.optimalSoilMoisture?.max}%`,
      status: moistureStatus,
      impact: moistureStatus === 'low' ? 'Cây có thể bị stress thiếu nước' : 'Bình thường'
    });
    
    // Phân tích nhiệt độ
    const tempStatus = this.getTemperatureStatus(sensorData.temperature, plantInfo.optimalTemp);
    conditions.push({
      parameter: 'Nhiệt độ',
      current: `${sensorData.temperature}°C`,
      optimal: `${plantInfo.optimalTemp?.min}-${plantInfo.optimalTemp?.max}°C`,
      status: tempStatus,
      impact: tempStatus !== 'optimal' ? 'Ảnh hưởng đến tốc độ phát triển' : 'Bình thường'
    });
    
    return conditions;
  }

  analyzeWeatherImpact(weatherData) {
    const impacts = [];
    
    if (weatherData.rainProbability > 60) {
      impacts.push({
        factor: 'Mưa',
        probability: `${weatherData.rainProbability}%`,
        impact: 'Có thể hoãn tưới nước',
        recommendation: 'Theo dõi lượng mưa thực tế'
      });
    }
    
    if (weatherData.temperature > 30) {
      impacts.push({
        factor: 'Nhiệt độ cao',
        value: `${weatherData.temperature}°C`,
        impact: 'Tăng tốc độ bay hơi nước',
        recommendation: 'Tưới nhiều hơn hoặc tạo bóng mát'
      });
    }
    
    return impacts;
  }

  analyzeHistoricalTrends(wateringHistory) {
    if (wateringHistory.length < 3) {
      return { message: 'Chưa đủ dữ liệu lịch sử để phân tích xu hướng' };
    }
    
    const avgInterval = this.calculateAverageInterval(wateringHistory);
    const recentInterval = wateringHistory.length > 1 
      ? (new Date(wateringHistory[0].timestamp) - new Date(wateringHistory[1].timestamp)) / (1000 * 60 * 60)
      : avgInterval;
    
    let trend = 'stable';
    if (recentInterval > avgInterval * 1.2) trend = 'decreasing_frequency';
    else if (recentInterval < avgInterval * 0.8) trend = 'increasing_frequency';
    
    return {
      averageInterval: `${Math.round(avgInterval)} giờ`,
      recentInterval: `${Math.round(recentInterval)} giờ`,
      trend,
      interpretation: this.interpretTrend(trend)
    };
  }

  analyzePlantFactors(plantInfo, sensorData) {
    return {
      plantType: plantInfo.type,
      age: `${plantInfo.age || 'Không xác định'} ngày`,
      healthScore: this.calculatePlantHealthScore(sensorData, plantInfo),
      growthStage: this.determineGrowthStage(plantInfo.age),
      specialNeeds: this.getSpecialNeeds(plantInfo.type)
    };
  }

  // Helper methods
  getMoistureStatus(current, optimal) {
    if (!optimal) return 'unknown';
    if (current < optimal.min - 10) return 'very_low';
    if (current < optimal.min) return 'low';
    if (current > optimal.max + 10) return 'very_high';
    if (current > optimal.max) return 'high';
    return 'optimal';
  }

  getTemperatureStatus(current, optimal) {
    if (!optimal) return 'unknown';
    if (current < optimal.min - 5) return 'very_low';
    if (current < optimal.min) return 'low';
    if (current > optimal.max + 5) return 'very_high';
    if (current > optimal.max) return 'high';
    return 'optimal';
  }

  interpretTrend(trend) {
    const interpretations = {
      'stable': 'Tần suất tưới ổn định',
      'decreasing_frequency': 'Đang tưới ít hơn, có thể do thời tiết mát hoặc cây đã thích nghi',
      'increasing_frequency': 'Đang tưới nhiều hơn, có thể do thời tiết nóng hoặc cây đang phát triển'
    };
    return interpretations[trend] || 'Không xác định';
  }

  calculatePlantHealthScore(sensorData, plantInfo) {
    let score = 100;
    
    // Giảm điểm dựa trên độ lệch so với điều kiện tối ưu
    const moistureDeviation = Math.abs(sensorData.soilMoisture - (plantInfo.optimalSoilMoisture?.min + plantInfo.optimalSoilMoisture?.max) / 2);
    score -= moistureDeviation * 0.5;
    
    const tempDeviation = Math.abs(sensorData.temperature - (plantInfo.optimalTemp?.min + plantInfo.optimalTemp?.max) / 2);
    score -= tempDeviation * 0.3;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  determineGrowthStage(age) {
    if (!age) return 'Không xác định';
    if (age < 14) return 'Giai đoạn mầm';
    if (age < 30) return 'Giai đoạn non';
    if (age < 60) return 'Giai đoạn phát triển';
    return 'Giai đoạn trưởng thành';
  }

  getSpecialNeeds(plantType) {
    const needs = {
      'tomato': ['Cần giàn đỡ', 'Tỉa cành định kỳ'],
      'pepper': ['Tránh úng nước', 'Cần nhiều ánh sáng'],
      'lettuce': ['Tránh nhiệt độ cao', 'Cần độ ẩm cao'],
      'herb': ['Tỉa hoa để kích thích lá', 'Tưới đều đặn']
    };
    return needs[plantType?.toLowerCase()] || ['Chăm sóc theo hướng dẫn chung'];
  }

  getFallbackPrediction(plantId) {
    return {
      plantId,
      prediction: {
        needsWatering: true,
        urgencyLevel: 'medium',
        optimalWateringTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        recommendedAmount: 200,
        confidence: 60,
        nextCheckTime: new Date(Date.now() + 12 * 60 * 60 * 1000)
      },
      analysis: {
        currentConditions: [{ message: 'Không thể phân tích do lỗi dữ liệu' }],
        weatherImpact: [{ message: 'Không có dữ liệu thời tiết' }],
        historicalTrends: { message: 'Không thể phân tích xu hướng' },
        plantSpecificFactors: { message: 'Sử dụng thông số mặc định' }
      },
      recommendations: [{
        type: 'fallback',
        priority: 'medium',
        title: 'Khuyến nghị cơ bản',
        message: 'Kiểm tra độ ẩm đất và tưới nếu cần',
        action: 'Sử dụng phương pháp kiểm tra thủ công'
      }],
      timestamp: new Date().toISOString(),
      error: 'Sử dụng dự báo dự phòng do lỗi hệ thống'
    };
  }
}

module.exports = new AIPredictionService();