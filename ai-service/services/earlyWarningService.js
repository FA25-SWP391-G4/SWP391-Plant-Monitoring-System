/**
 * Early Warning Service - Cảnh báo sớm tình trạng cây trồng
 */

const sensorService = require('./sensorService');

class EarlyWarningService {
  constructor() {
    this.alertThresholds = {
      critical: 0.9,
      high: 0.7,
      medium: 0.5,
      low: 0.3
    };
    this.alertHistory = [];
  }

  /**
   * Phân tích và tạo cảnh báo sớm
   */
  async analyzeAndAlert(plantId, options = {}) {
    try {
      // Lấy dữ liệu cần thiết
      const sensorData = await sensorService.getLatestSensorData(plantId);
      const plantInfo = await sensorService.getPlantInfo(plantId);
      const historicalData = await sensorService.getHistoricalData(plantId, 7); // 7 ngày
      const wateringHistory = await sensorService.getWateringHistory(plantId, 5);

      // Phân tích các yếu tố nguy cơ
      const riskAnalysis = await this.analyzeRiskFactors(sensorData, plantInfo, historicalData);
      
      // Phát hiện anomaly
      const anomalies = await this.detectAnomalies(sensorData, historicalData, plantInfo);
      
      // Dự đoán xu hướng
      const trends = await this.analyzeTrends(historicalData, sensorData);
      
      // Đánh giá sức khỏe tổng thể
      const healthAssessment = await this.assessPlantHealth(sensorData, plantInfo, wateringHistory);
      
      // Tạo cảnh báo
      const alerts = await this.generateAlerts(riskAnalysis, anomalies, trends, healthAssessment);
      
      // Lưu lịch sử cảnh báo
      await this.saveAlertHistory(plantId, alerts);

      return {
        plantId,
        timestamp: new Date().toISOString(),
        overallRiskLevel: this.calculateOverallRisk(alerts),
        healthScore: healthAssessment.score,
        alerts,
        riskAnalysis,
        anomalies,
        trends,
        recommendations: this.generateRecommendations(alerts, riskAnalysis),
        nextCheckTime: this.calculateNextCheckTime(alerts)
      };
    } catch (error) {
      console.error('Lỗi phân tích cảnh báo sớm:', error);
      return this.getFallbackWarning(plantId);
    }
  }

  /**
   * Phân tích các yếu tố nguy cơ
   */
  async analyzeRiskFactors(sensorData, plantInfo, historicalData) {
    const risks = [];

    // 1. Nguy cơ thiếu nước
    const waterStressRisk = this.analyzeWaterStress(sensorData, plantInfo, historicalData);
    if (waterStressRisk.level > 0.3) {
      risks.push({
        type: 'water_stress',
        level: waterStressRisk.level,
        severity: this.getSeverityLevel(waterStressRisk.level),
        description: 'Nguy cơ thiếu nước',
        details: waterStressRisk.details,
        timeToAction: waterStressRisk.timeToAction
      });
    }

    // 2. Nguy cơ stress nhiệt độ
    const temperatureStressRisk = this.analyzeTemperatureStress(sensorData, plantInfo, historicalData);
    if (temperatureStressRisk.level > 0.3) {
      risks.push({
        type: 'temperature_stress',
        level: temperatureStressRisk.level,
        severity: this.getSeverityLevel(temperatureStressRisk.level),
        description: 'Nguy cơ stress nhiệt độ',
        details: temperatureStressRisk.details,
        timeToAction: temperatureStressRisk.timeToAction
      });
    }

    // 3. Nguy cơ bệnh nấm
    const fungalRisk = this.analyzeFungalRisk(sensorData, plantInfo, historicalData);
    if (fungalRisk.level > 0.3) {
      risks.push({
        type: 'fungal_disease',
        level: fungalRisk.level,
        severity: this.getSeverityLevel(fungalRisk.level),
        description: 'Nguy cơ bệnh nấm',
        details: fungalRisk.details,
        timeToAction: fungalRisk.timeToAction
      });
    }

    // 4. Nguy cơ thiếu dinh dưỡng
    const nutritionRisk = this.analyzeNutritionDeficiency(sensorData, plantInfo, historicalData);
    if (nutritionRisk.level > 0.3) {
      risks.push({
        type: 'nutrition_deficiency',
        level: nutritionRisk.level,
        severity: this.getSeverityLevel(nutritionRisk.level),
        description: 'Nguy cơ thiếu dinh dưỡng',
        details: nutritionRisk.details,
        timeToAction: nutritionRisk.timeToAction
      });
    }

    // 5. Nguy cơ thối rễ
    const rootRotRisk = this.analyzeRootRotRisk(sensorData, plantInfo, historicalData);
    if (rootRotRisk.level > 0.3) {
      risks.push({
        type: 'root_rot',
        level: rootRotRisk.level,
        severity: this.getSeverityLevel(rootRotRisk.level),
        description: 'Nguy cơ thối rễ',
        details: rootRotRisk.details,
        timeToAction: rootRotRisk.timeToAction
      });
    }

    return risks.sort((a, b) => b.level - a.level);
  }

  /**
   * Phát hiện bất thường trong dữ liệu
   */
  async detectAnomalies(sensorData, historicalData, plantInfo) {
    const anomalies = [];

    if (historicalData.length < 3) {
      return [{ type: 'insufficient_data', message: 'Chưa đủ dữ liệu lịch sử để phát hiện bất thường' }];
    }

    // Tính toán giá trị trung bình và độ lệch chuẩn
    const stats = this.calculateStatistics(historicalData);

    // Phát hiện anomaly cho từng thông số
    const parameters = ['soilMoisture', 'temperature', 'humidity', 'lightLevel', 'soilPH'];
    
    parameters.forEach(param => {
      const currentValue = sensorData[param];
      const paramStats = stats[param];
      
      if (currentValue && paramStats) {
        const zScore = Math.abs((currentValue - paramStats.mean) / paramStats.stdDev);
        
        if (zScore > 2.5) { // Anomaly threshold
          anomalies.push({
            type: 'statistical_anomaly',
            parameter: param,
            currentValue,
            expectedRange: {
              min: paramStats.mean - 2 * paramStats.stdDev,
              max: paramStats.mean + 2 * paramStats.stdDev
            },
            severity: zScore > 3 ? 'high' : 'medium',
            zScore: parseFloat(zScore.toFixed(2)),
            description: this.getAnomalyDescription(param, currentValue, paramStats)
          });
        }
      }
    });

    // Phát hiện pattern anomaly
    const patternAnomalies = this.detectPatternAnomalies(historicalData, sensorData);
    anomalies.push(...patternAnomalies);

    return anomalies;
  }

  /**
   * Phân tích xu hướng
   */
  async analyzeTrends(historicalData, currentData) {
    if (historicalData.length < 5) {
      return { message: 'Chưa đủ dữ liệu để phân tích xu hướng' };
    }

    const trends = {};
    const parameters = ['soilMoisture', 'temperature', 'humidity', 'lightLevel'];

    parameters.forEach(param => {
      const values = historicalData.map(d => d[param]).filter(v => v != null);
      if (values.length >= 3) {
        const trend = this.calculateTrend(values);
        trends[param] = {
          direction: trend.direction,
          slope: trend.slope,
          confidence: trend.confidence,
          prediction: this.predictNextValue(values, trend),
          interpretation: this.interpretTrend(param, trend)
        };
      }
    });

    return trends;
  }

  /**
   * Đánh giá sức khỏe cây trồng
   */
  async assessPlantHealth(sensorData, plantInfo, wateringHistory) {
    let healthScore = 100;
    const factors = [];

    // Yếu tố độ ẩm đất
    const moistureScore = this.scoreMoisture(sensorData.soilMoisture, plantInfo.optimalSoilMoisture);
    healthScore -= (100 - moistureScore) * 0.3;
    factors.push({
      factor: 'Độ ẩm đất',
      score: moistureScore,
      weight: 0.3,
      status: this.getScoreStatus(moistureScore)
    });

    // Yếu tố nhiệt độ
    const tempScore = this.scoreTemperature(sensorData.temperature, plantInfo.optimalTemp);
    healthScore -= (100 - tempScore) * 0.25;
    factors.push({
      factor: 'Nhiệt độ',
      score: tempScore,
      weight: 0.25,
      status: this.getScoreStatus(tempScore)
    });

    // Yếu tố độ ẩm không khí
    const humidityScore = this.scoreHumidity(sensorData.humidity, plantInfo.optimalHumidity);
    healthScore -= (100 - humidityScore) * 0.2;
    factors.push({
      factor: 'Độ ẩm không khí',
      score: humidityScore,
      weight: 0.2,
      status: this.getScoreStatus(humidityScore)
    });

    // Yếu tố ánh sáng
    const lightScore = this.scoreLight(sensorData.lightLevel, plantInfo.optimalLight);
    healthScore -= (100 - lightScore) * 0.15;
    factors.push({
      factor: 'Ánh sáng',
      score: lightScore,
      weight: 0.15,
      status: this.getScoreStatus(lightScore)
    });

    // Yếu tố pH đất
    const phScore = this.scorePH(sensorData.soilPH, plantInfo.optimalPH);
    healthScore -= (100 - phScore) * 0.1;
    factors.push({
      factor: 'pH đất',
      score: phScore,
      weight: 0.1,
      status: this.getScoreStatus(phScore)
    });

    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      score: Math.round(healthScore),
      status: this.getHealthStatus(healthScore),
      factors,
      summary: this.generateHealthSummary(healthScore, factors)
    };
  }

  /**
   * Tạo cảnh báo
   */
  async generateAlerts(riskAnalysis, anomalies, trends, healthAssessment) {
    const alerts = [];

    // Cảnh báo từ phân tích rủi ro
    riskAnalysis.forEach(risk => {
      if (risk.level >= this.alertThresholds.medium) {
        alerts.push({
          id: `risk_${risk.type}_${Date.now()}`,
          type: 'risk_alert',
          category: risk.type,
          severity: risk.severity,
          title: risk.description,
          message: risk.details.message,
          timeToAction: risk.timeToAction,
          actionRequired: true,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Cảnh báo từ anomaly
    anomalies.forEach(anomaly => {
      if (anomaly.severity === 'high') {
        alerts.push({
          id: `anomaly_${anomaly.parameter}_${Date.now()}`,
          type: 'anomaly_alert',
          category: 'data_anomaly',
          severity: 'high',
          title: `Bất thường về ${anomaly.parameter}`,
          message: anomaly.description,
          timeToAction: '2 giờ',
          actionRequired: true,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Cảnh báo từ xu hướng
    Object.entries(trends).forEach(([param, trend]) => {
      if (trend.confidence > 0.7 && this.isTrendConcerning(param, trend)) {
        alerts.push({
          id: `trend_${param}_${Date.now()}`,
          type: 'trend_alert',
          category: 'trend_warning',
          severity: 'medium',
          title: `Xu hướng bất thường về ${param}`,
          message: trend.interpretation,
          timeToAction: '24 giờ',
          actionRequired: false,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Cảnh báo sức khỏe tổng thể
    if (healthAssessment.score < 60) {
      alerts.push({
        id: `health_${Date.now()}`,
        type: 'health_alert',
        category: 'plant_health',
        severity: healthAssessment.score < 40 ? 'critical' : 'high',
        title: 'Sức khỏe cây trồng kém',
        message: healthAssessment.summary,
        timeToAction: healthAssessment.score < 40 ? '1 giờ' : '6 giờ',
        actionRequired: true,
        timestamp: new Date().toISOString()
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // Các hàm phân tích rủi ro cụ thể
  analyzeWaterStress(sensorData, plantInfo, historicalData) {
    const currentMoisture = sensorData.soilMoisture || 50;
    const optimalMin = plantInfo.optimalSoilMoisture?.min || 40;
    const optimalMax = plantInfo.optimalSoilMoisture?.max || 60;
    
    let stressLevel = 0;
    let timeToAction = '24 giờ';
    let message = '';

    if (currentMoisture < optimalMin - 15) {
      stressLevel = 0.9;
      timeToAction = '2 giờ';
      message = `Độ ẩm đất rất thấp (${currentMoisture}%), cây có nguy cơ héo cao`;
    } else if (currentMoisture < optimalMin - 10) {
      stressLevel = 0.7;
      timeToAction = '6 giờ';
      message = `Độ ẩm đất thấp (${currentMoisture}%), cần tưới nước sớm`;
    } else if (currentMoisture < optimalMin) {
      stressLevel = 0.4;
      timeToAction = '12 giờ';
      message = `Độ ẩm đất dưới mức tối ưu (${currentMoisture}%)`;
    }

    // Phân tích xu hướng giảm độ ẩm
    if (historicalData.length >= 3) {
      const recentMoisture = historicalData.slice(0, 3).map(d => d.soilMoisture);
      const trend = this.calculateTrend(recentMoisture);
      
      if (trend.direction === 'decreasing' && trend.slope < -2) {
        stressLevel = Math.min(1, stressLevel + 0.2);
        message += '. Xu hướng giảm nhanh';
      }
    }

    return {
      level: stressLevel,
      details: { message, currentValue: currentMoisture, optimalRange: `${optimalMin}-${optimalMax}%` },
      timeToAction
    };
  }

  analyzeTemperatureStress(sensorData, plantInfo, historicalData) {
    const currentTemp = sensorData.temperature || 25;
    const optimalMin = plantInfo.optimalTemp?.min || 20;
    const optimalMax = plantInfo.optimalTemp?.max || 30;
    
    let stressLevel = 0;
    let timeToAction = '24 giờ';
    let message = '';

    if (currentTemp < optimalMin - 10 || currentTemp > optimalMax + 10) {
      stressLevel = 0.8;
      timeToAction = '4 giờ';
      message = `Nhiệt độ cực đoan (${currentTemp}°C), cây có nguy cơ stress cao`;
    } else if (currentTemp < optimalMin - 5 || currentTemp > optimalMax + 5) {
      stressLevel = 0.6;
      timeToAction = '8 giờ';
      message = `Nhiệt độ không phù hợp (${currentTemp}°C)`;
    } else if (currentTemp < optimalMin || currentTemp > optimalMax) {
      stressLevel = 0.3;
      timeToAction = '12 giờ';
      message = `Nhiệt độ ngoài phạm vi tối ưu (${currentTemp}°C)`;
    }

    return {
      level: stressLevel,
      details: { message, currentValue: currentTemp, optimalRange: `${optimalMin}-${optimalMax}°C` },
      timeToAction
    };
  }

  analyzeFungalRisk(sensorData, plantInfo, historicalData) {
    const humidity = sensorData.humidity || 60;
    const temperature = sensorData.temperature || 25;
    const soilMoisture = sensorData.soilMoisture || 50;
    
    let riskLevel = 0;
    let timeToAction = '48 giờ';
    let message = '';

    // Điều kiện thuận lợi cho nấm: độ ẩm cao + nhiệt độ ấm
    if (humidity > 80 && temperature >= 20 && temperature <= 30) {
      riskLevel += 0.4;
      message += 'Độ ẩm không khí cao và nhiệt độ ấm. ';
    }

    // Đất quá ẩm
    if (soilMoisture > 70) {
      riskLevel += 0.3;
      message += 'Đất quá ẩm. ';
      timeToAction = '24 giờ';
    }

    // Kiểm tra xu hướng độ ẩm cao kéo dài
    if (historicalData.length >= 3) {
      const recentHumidity = historicalData.slice(0, 3).map(d => d.humidity);
      const avgHumidity = recentHumidity.reduce((a, b) => a + b, 0) / recentHumidity.length;
      
      if (avgHumidity > 75) {
        riskLevel += 0.2;
        message += 'Độ ẩm cao kéo dài. ';
        timeToAction = '12 giờ';
      }
    }

    if (riskLevel > 0.3) {
      message += 'Nguy cơ phát triển bệnh nấm cao.';
    }

    return {
      level: Math.min(1, riskLevel),
      details: { message, humidity, temperature, soilMoisture },
      timeToAction
    };
  }

  analyzeNutritionDeficiency(sensorData, plantInfo, historicalData) {
    const soilPH = sensorData.soilPH || 6.5;
    const optimalPH = plantInfo.optimalPH || { min: 6.0, max: 7.0 };
    
    let deficiencyRisk = 0;
    let timeToAction = '7 ngày';
    let message = '';

    // pH không phù hợp ảnh hưởng hấp thụ dinh dưỡng
    if (soilPH < optimalPH.min - 1 || soilPH > optimalPH.max + 1) {
      deficiencyRisk = 0.7;
      timeToAction = '3 ngày';
      message = `pH đất (${soilPH}) không phù hợp, ảnh hưởng hấp thụ dinh dưỡng`;
    } else if (soilPH < optimalPH.min || soilPH > optimalPH.max) {
      deficiencyRisk = 0.4;
      timeToAction = '5 ngày';
      message = `pH đất (${soilPH}) cần điều chỉnh`;
    }

    // Phân tích dấu hiệu thiếu dinh dưỡng từ xu hướng
    if (historicalData.length >= 5) {
      // Giả định: nếu cây phát triển chậm (ít thay đổi về các thông số)
      const variability = this.calculateDataVariability(historicalData);
      if (variability < 0.1) {
        deficiencyRisk = Math.min(1, deficiencyRisk + 0.3);
        message += '. Dấu hiệu phát triển chậm';
      }
    }

    return {
      level: deficiencyRisk,
      details: { message, currentPH: soilPH, optimalPH: `${optimalPH.min}-${optimalPH.max}` },
      timeToAction
    };
  }

  analyzeRootRotRisk(sensorData, plantInfo, historicalData) {
    const soilMoisture = sensorData.soilMoisture || 50;
    const temperature = sensorData.temperature || 25;
    
    let rotRisk = 0;
    let timeToAction = '48 giờ';
    let message = '';

    // Đất quá ẩm kéo dài
    if (soilMoisture > 80) {
      rotRisk = 0.6;
      timeToAction = '24 giờ';
      message = `Độ ẩm đất rất cao (${soilMoisture}%), nguy cơ thối rễ`;
    } else if (soilMoisture > 70) {
      rotRisk = 0.4;
      message = `Độ ẩm đất cao (${soilMoisture}%)`;
    }

    // Nhiệt độ ấm + độ ẩm cao = điều kiện lý tưởng cho vi khuẩn
    if (temperature >= 25 && temperature <= 30 && soilMoisture > 70) {
      rotRisk = Math.min(1, rotRisk + 0.3);
      message += '. Điều kiện thuận lợi cho vi khuẩn gây thối rễ';
      timeToAction = '12 giờ';
    }

    // Kiểm tra xu hướng độ ẩm cao kéo dài
    if (historicalData.length >= 3) {
      const recentMoisture = historicalData.slice(0, 3).map(d => d.soilMoisture);
      const highMoistureCount = recentMoisture.filter(m => m > 70).length;
      
      if (highMoistureCount >= 2) {
        rotRisk = Math.min(1, rotRisk + 0.2);
        message += '. Độ ẩm cao kéo dài';
      }
    }

    return {
      level: rotRisk,
      details: { message, soilMoisture, temperature },
      timeToAction
    };
  }

  // Các hàm hỗ trợ
  getSeverityLevel(level) {
    if (level >= 0.8) return 'critical';
    if (level >= 0.6) return 'high';
    if (level >= 0.4) return 'medium';
    return 'low';
  }

  calculateStatistics(data) {
    const stats = {};
    const parameters = ['soilMoisture', 'temperature', 'humidity', 'lightLevel', 'soilPH'];
    
    parameters.forEach(param => {
      const values = data.map(d => d[param]).filter(v => v != null);
      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        stats[param] = { mean, stdDev, min: Math.min(...values), max: Math.max(...values) };
      }
    });
    
    return stats;
  }

  calculateTrend(values) {
    if (values.length < 3) return { direction: 'unknown', slope: 0, confidence: 0 };
    
    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    return {
      direction: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
      slope,
      confidence: Math.max(0, rSquared),
      intercept
    };
  }

  predictNextValue(values, trend) {
    const nextX = values.length;
    return trend.slope * nextX + trend.intercept;
  }

  interpretTrend(parameter, trend) {
    const paramNames = {
      soilMoisture: 'độ ẩm đất',
      temperature: 'nhiệt độ',
      humidity: 'độ ẩm không khí',
      lightLevel: 'cường độ ánh sáng'
    };
    
    const paramName = paramNames[parameter] || parameter;
    const direction = trend.direction === 'increasing' ? 'tăng' : 
                     trend.direction === 'decreasing' ? 'giảm' : 'ổn định';
    
    return `${paramName} có xu hướng ${direction} với độ tin cậy ${Math.round(trend.confidence * 100)}%`;
  }

  detectPatternAnomalies(historicalData, currentData) {
    const anomalies = [];
    
    // Phát hiện thay đổi đột ngột
    if (historicalData.length >= 2) {
      const recent = historicalData[0];
      const previous = historicalData[1];
      
      const parameters = ['soilMoisture', 'temperature', 'humidity'];
      parameters.forEach(param => {
        const currentValue = currentData[param];
        const recentValue = recent[param];
        const previousValue = previous[param];
        
        if (currentValue && recentValue && previousValue) {
          const recentChange = Math.abs(currentValue - recentValue);
          const normalChange = Math.abs(recentValue - previousValue);
          
          if (recentChange > normalChange * 3) {
            anomalies.push({
              type: 'sudden_change',
              parameter: param,
              currentValue,
              previousValue: recentValue,
              changeRate: recentChange,
              severity: 'medium',
              description: `Thay đổi đột ngột về ${param}: từ ${recentValue} thành ${currentValue}`
            });
          }
        }
      });
    }
    
    return anomalies;
  }

  getAnomalyDescription(parameter, currentValue, stats) {
    const paramNames = {
      soilMoisture: 'độ ẩm đất',
      temperature: 'nhiệt độ',
      humidity: 'độ ẩm không khí',
      lightLevel: 'cường độ ánh sáng',
      soilPH: 'pH đất'
    };
    
    const paramName = paramNames[parameter] || parameter;
    const deviation = currentValue > stats.mean ? 'cao' : 'thấp';
    
    return `${paramName} hiện tại (${currentValue}) ${deviation} bất thường so với mức trung bình (${stats.mean.toFixed(1)})`;
  }

  // Các hàm scoring
  scoreMoisture(current, optimal) {
    if (!optimal || !current) return 50;
    const mid = (optimal.min + optimal.max) / 2;
    const range = optimal.max - optimal.min;
    const deviation = Math.abs(current - mid);
    return Math.max(0, 100 - (deviation / range) * 100);
  }

  scoreTemperature(current, optimal) {
    if (!optimal || !current) return 50;
    const mid = (optimal.min + optimal.max) / 2;
    const range = optimal.max - optimal.min;
    const deviation = Math.abs(current - mid);
    return Math.max(0, 100 - (deviation / range) * 100);
  }

  scoreHumidity(current, optimal) {
    if (!optimal || !current) return 50;
    const mid = (optimal.min + optimal.max) / 2;
    const range = optimal.max - optimal.min;
    const deviation = Math.abs(current - mid);
    return Math.max(0, 100 - (deviation / range) * 100);
  }

  scoreLight(current, optimal) {
    if (!optimal || !current) return 50;
    const mid = (optimal.min + optimal.max) / 2;
    const range = optimal.max - optimal.min;
    const deviation = Math.abs(current - mid);
    return Math.max(0, 100 - (deviation / range) * 100);
  }

  scorePH(current, optimal) {
    if (!optimal || !current) return 50;
    const mid = (optimal.min + optimal.max) / 2;
    const range = optimal.max - optimal.min;
    const deviation = Math.abs(current - mid);
    return Math.max(0, 100 - (deviation / range) * 100);
  }

  getScoreStatus(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  getHealthStatus(score) {
    if (score >= 80) return 'Rất khỏe mạnh';
    if (score >= 60) return 'Khỏe mạnh';
    if (score >= 40) return 'Cần chú ý';
    return 'Cần can thiệp ngay';
  }

  generateHealthSummary(score, factors) {
    const poorFactors = factors.filter(f => f.score < 60);
    
    if (score >= 80) {
      return 'Cây đang trong tình trạng rất tốt, tất cả các thông số đều ở mức tối ưu';
    } else if (score >= 60) {
      return 'Cây khỏe mạnh nhưng có thể cải thiện một số yếu tố';
    } else if (poorFactors.length > 0) {
      const issues = poorFactors.map(f => f.factor).join(', ');
      return `Cây cần chú ý về: ${issues}`;
    } else {
      return 'Cây đang gặp nhiều vấn đề và cần can thiệp ngay lập tức';
    }
  }

  calculateOverallRisk(alerts) {
    if (alerts.length === 0) return 'low';
    
    const severityCounts = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {});
    
    if (severityCounts.critical > 0) return 'critical';
    if (severityCounts.high > 0) return 'high';
    if (severityCounts.medium > 1) return 'high';
    if (severityCounts.medium > 0) return 'medium';
    return 'low';
  }

  generateRecommendations(alerts, riskAnalysis) {
    const recommendations = [];
    
    // Khuyến nghị dựa trên alerts
    alerts.forEach(alert => {
      if (alert.actionRequired) {
        recommendations.push({
          priority: alert.severity,
          category: alert.category,
          title: `Xử lý ${alert.title}`,
          action: this.getActionForAlert(alert),
          timeframe: alert.timeToAction
        });
      }
    });
    
    // Khuyến nghị dựa trên rủi ro
    riskAnalysis.forEach(risk => {
      if (risk.level > 0.6) {
        recommendations.push({
          priority: risk.severity,
          category: risk.type,
          title: `Phòng ngừa ${risk.description}`,
          action: this.getPreventiveAction(risk.type),
          timeframe: risk.timeToAction
        });
      }
    });
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  getActionForAlert(alert) {
    const actions = {
      water_stress: 'Tưới nước ngay lập tức và kiểm tra hệ thống tưới',
      temperature_stress: 'Điều chỉnh vị trí cây hoặc tạo bóng mát/sưởi ấm',
      fungal_disease: 'Giảm độ ẩm, tăng thông gió và xử lý bằng thuốc diệt nấm',
      root_rot: 'Giảm tưới nước, cải thiện thoát nước và kiểm tra rễ',
      nutrition_deficiency: 'Bón phân và điều chỉnh pH đất',
      data_anomaly: 'Kiểm tra cảm biến và xác minh dữ liệu',
      plant_health: 'Đánh giá toàn diện và điều chỉnh chế độ chăm sóc'
    };
    
    return actions[alert.category] || 'Kiểm tra và đánh giá tình trạng cây';
  }

  getPreventiveAction(riskType) {
    const actions = {
      water_stress: 'Thiết lập lịch tưới đều đặn và theo dõi độ ẩm đất',
      temperature_stress: 'Chuẩn bị biện pháp điều chỉnh nhiệt độ',
      fungal_disease: 'Duy trì thông gió tốt và tránh tưới lên lá',
      root_rot: 'Đảm bảo thoát nước tốt và tránh tưới quá nhiều',
      nutrition_deficiency: 'Lập kế hoạch bón phân định kỳ'
    };
    
    return actions[riskType] || 'Theo dõi chặt chẽ tình trạng cây';
  }

  calculateNextCheckTime(alerts) {
    if (alerts.length === 0) return new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const highAlerts = alerts.filter(a => a.severity === 'high');
    
    let hoursToAdd = 24;
    if (criticalAlerts.length > 0) hoursToAdd = 2;
    else if (highAlerts.length > 0) hoursToAdd = 6;
    else if (alerts.length > 2) hoursToAdd = 12;
    
    return new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);
  }

  calculateDataVariability(data) {
    if (data.length < 2) return 0;
    
    const parameters = ['soilMoisture', 'temperature', 'humidity'];
    let totalVariability = 0;
    let validParams = 0;
    
    parameters.forEach(param => {
      const values = data.map(d => d[param]).filter(v => v != null);
      if (values.length >= 2) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const cv = Math.sqrt(variance) / mean; // Coefficient of variation
        totalVariability += cv;
        validParams++;
      }
    });
    
    return validParams > 0 ? totalVariability / validParams : 0;
  }

  isTrendConcerning(parameter, trend) {
    const concerningTrends = {
      soilMoisture: trend.direction === 'decreasing' && trend.slope < -2,
      temperature: Math.abs(trend.slope) > 1,
      humidity: trend.direction === 'increasing' && trend.slope > 3,
      lightLevel: trend.direction === 'decreasing' && trend.slope < -100
    };
    
    return concerningTrends[parameter] || false;
  }

  async saveAlertHistory(plantId, alerts) {
    // Lưu vào memory cho demo, trong thực tế sẽ lưu vào database
    this.alertHistory.push({
      plantId,
      timestamp: new Date().toISOString(),
      alerts: alerts.map(a => ({ ...a, acknowledged: false }))
    });
    
    // Giữ chỉ 100 bản ghi gần nhất
    if (this.alertHistory.length > 100) {
      this.alertHistory = this.alertHistory.slice(-100);
    }
  }

  getFallbackWarning(plantId) {
    return {
      plantId,
      timestamp: new Date().toISOString(),
      overallRiskLevel: 'medium',
      healthScore: 70,
      alerts: [{
        id: `fallback_${Date.now()}`,
        type: 'system_alert',
        category: 'system_error',
        severity: 'medium',
        title: 'Không thể phân tích đầy đủ',
        message: 'Hệ thống gặp lỗi khi phân tích dữ liệu. Vui lòng kiểm tra thủ công.',
        timeToAction: '6 giờ',
        actionRequired: true,
        timestamp: new Date().toISOString()
      }],
      riskAnalysis: [],
      anomalies: [],
      trends: { message: 'Không thể phân tích xu hướng' },
      recommendations: [{
        priority: 'medium',
        category: 'manual_check',
        title: 'Kiểm tra thủ công',
        action: 'Kiểm tra trực tiếp tình trạng cây và các thông số môi trường',
        timeframe: '6 giờ'
      }],
      nextCheckTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      error: 'Sử dụng cảnh báo dự phòng do lỗi hệ thống'
    };
  }
}

module.exports = new EarlyWarningService();