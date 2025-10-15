/**
 * Controller xử lý phân tích dữ liệu lịch sử và đề xuất chăm sóc
 */

const mongoose = require('mongoose');
const SensorData = require('../models/SensorData');
const Plant = require('../models/Plant');
const WateringHistory = require('../models/WateringHistory');
const Alert = require('../models/Alert');

const historicalAnalysisController = {
  /**
   * Phân tích dữ liệu lịch sử của cây trồng
   */
  analyzeHistoricalData: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { period = 30 } = req.query; // Số ngày phân tích, mặc định 30 ngày
      
      if (!plantId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu ID cây trồng'
        });
      }
      
      // Lấy thông tin cây trồng
      const plant = await Plant.findById(plantId);
      if (!plant) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cây trồng'
        });
      }
      
      // Tính thời điểm bắt đầu phân tích
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      
      // Lấy dữ liệu cảm biến trong khoảng thời gian
      const sensorData = await SensorData.find({
        plantId,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 });
      
      // Lấy lịch sử tưới cây
      const wateringHistory = await WateringHistory.find({
        plantId,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 });
      
      // Lấy lịch sử cảnh báo
      const alerts = await Alert.find({
        plantId,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 });
      
      // Phân tích dữ liệu
      const analysis = {
        trends: analyzeSensorTrends(sensorData),
        wateringEffectiveness: analyzeWateringEffectiveness(sensorData, wateringHistory),
        recurringIssues: analyzeRecurringIssues(alerts),
        growthAnalysis: analyzeGrowthPatterns(sensorData, wateringHistory, plant)
      };
      
      // Tạo đề xuất chăm sóc
      const recommendations = generateCareRecommendations(analysis, plant);
      
      return res.status(200).json({
        success: true,
        message: 'Phân tích dữ liệu lịch sử thành công',
        data: {
          plantId,
          plantName: plant.name,
          plantType: plant.type,
          period,
          analysis,
          recommendations,
          stats: {
            sensorDataCount: sensorData.length,
            wateringCount: wateringHistory.length,
            alertsCount: alerts.length
          }
        }
      });
    } catch (error) {
      console.error('Lỗi khi phân tích dữ liệu lịch sử:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi phân tích dữ liệu lịch sử',
        error: error.message
      });
    }
  },
  
  /**
   * Dự đoán xu hướng dựa trên dữ liệu lịch sử
   */
  predictTrends: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { daysAhead = 7 } = req.query; // Số ngày dự đoán, mặc định 7 ngày
      
      if (!plantId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu ID cây trồng'
        });
      }
      
      // Lấy thông tin cây trồng
      const plant = await Plant.findById(plantId);
      if (!plant) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cây trồng'
        });
      }
      
      // Lấy dữ liệu cảm biến 30 ngày gần đây để dự đoán
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const sensorData = await SensorData.find({
        plantId,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 });
      
      // Dự đoán xu hướng
      const predictions = predictFutureTrends(sensorData, parseInt(daysAhead), plant);
      
      // Tạo đề xuất dựa trên dự đoán
      const recommendations = generatePredictiveRecommendations(predictions, plant);
      
      return res.status(200).json({
        success: true,
        message: 'Dự đoán xu hướng thành công',
        data: {
          plantId,
          plantName: plant.name,
          daysAhead: parseInt(daysAhead),
          predictions,
          recommendations
        }
      });
    } catch (error) {
      console.error('Lỗi khi dự đoán xu hướng:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi dự đoán xu hướng',
        error: error.message
      });
    }
  },
  
  /**
   * Tạo báo cáo tổng hợp về hiệu quả chăm sóc
   */
  generateCareReport: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { period = 90 } = req.query; // Số ngày phân tích, mặc định 90 ngày
      
      if (!plantId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu ID cây trồng'
        });
      }
      
      // Lấy thông tin cây trồng
      const plant = await Plant.findById(plantId);
      if (!plant) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cây trồng'
        });
      }
      
      // Tính thời điểm bắt đầu phân tích
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      
      // Lấy dữ liệu cần thiết
      const [sensorData, wateringHistory, alerts] = await Promise.all([
        SensorData.find({
          plantId,
          timestamp: { $gte: startDate }
        }).sort({ timestamp: 1 }),
        
        WateringHistory.find({
          plantId,
          timestamp: { $gte: startDate }
        }).sort({ timestamp: 1 }),
        
        Alert.find({
          plantId,
          timestamp: { $gte: startDate }
        }).sort({ timestamp: 1 })
      ]);
      
      // Tạo báo cáo
      const report = generateComprehensiveReport(sensorData, wateringHistory, alerts, plant, parseInt(period));
      
      return res.status(200).json({
        success: true,
        message: 'Tạo báo cáo chăm sóc thành công',
        data: report
      });
    } catch (error) {
      console.error('Lỗi khi tạo báo cáo chăm sóc:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo báo cáo chăm sóc',
        error: error.message
      });
    }
  }
};

/**
 * Phân tích xu hướng dữ liệu cảm biến
 */
function analyzeSensorTrends(sensorData) {
  if (!sensorData || sensorData.length < 2) {
    return {
      soilMoisture: { trend: 'không đủ dữ liệu', value: 0 },
      temperature: { trend: 'không đủ dữ liệu', value: 0 },
      humidity: { trend: 'không đủ dữ liệu', value: 0 },
      light: { trend: 'không đủ dữ liệu', value: 0 }
    };
  }
  
  // Chia dữ liệu thành 2 nửa để so sánh
  const midpoint = Math.floor(sensorData.length / 2);
  const firstHalf = sensorData.slice(0, midpoint);
  const secondHalf = sensorData.slice(midpoint);
  
  // Tính trung bình cho từng nửa
  const calcAverage = (data, field) => {
    const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
    return sum / data.length;
  };
  
  // Tính xu hướng cho từng thông số
  const calculateTrend = (firstAvg, secondAvg) => {
    const diff = secondAvg - firstAvg;
    const percentChange = (diff / firstAvg) * 100;
    
    let trend;
    if (Math.abs(percentChange) < 5) {
      trend = 'ổn định';
    } else if (percentChange > 0) {
      trend = 'tăng';
    } else {
      trend = 'giảm';
    }
    
    return { trend, value: parseFloat(percentChange.toFixed(1)) };
  };
  
  // Phân tích từng thông số
  return {
    soilMoisture: calculateTrend(
      calcAverage(firstHalf, 'soilMoisture'),
      calcAverage(secondHalf, 'soilMoisture')
    ),
    temperature: calculateTrend(
      calcAverage(firstHalf, 'temperature'),
      calcAverage(secondHalf, 'temperature')
    ),
    humidity: calculateTrend(
      calcAverage(firstHalf, 'humidity'),
      calcAverage(secondHalf, 'humidity')
    ),
    light: calculateTrend(
      calcAverage(firstHalf, 'light'),
      calcAverage(secondHalf, 'light')
    )
  };
}

/**
 * Phân tích hiệu quả tưới nước
 */
function analyzeWateringEffectiveness(sensorData, wateringHistory) {
  if (!wateringHistory || wateringHistory.length === 0 || !sensorData || sensorData.length < 2) {
    return {
      effectiveness: 'không đủ dữ liệu',
      averageMoistureIncrease: 0,
      retentionTime: 0
    };
  }
  
  const results = [];
  
  // Phân tích từng lần tưới
  wateringHistory.forEach(watering => {
    // Tìm dữ liệu cảm biến trước khi tưới
    const beforeWatering = sensorData
      .filter(data => new Date(data.timestamp) < new Date(watering.timestamp))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    // Tìm dữ liệu cảm biến sau khi tưới (trong vòng 6 giờ)
    const afterWateringTime = new Date(watering.timestamp);
    afterWateringTime.setHours(afterWateringTime.getHours() + 6);
    
    const afterWatering = sensorData
      .filter(data => 
        new Date(data.timestamp) > new Date(watering.timestamp) && 
        new Date(data.timestamp) < afterWateringTime
      )
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0];
    
    if (beforeWatering && afterWatering) {
      const moistureIncrease = afterWatering.soilMoisture - beforeWatering.soilMoisture;
      
      // Tìm thời gian giữ ẩm (thời gian để độ ẩm giảm xuống mức trước khi tưới)
      const retentionData = sensorData
        .filter(data => new Date(data.timestamp) > new Date(afterWatering.timestamp))
        .find(data => data.soilMoisture <= beforeWatering.soilMoisture);
      
      let retentionHours = 0;
      if (retentionData) {
        retentionHours = (new Date(retentionData.timestamp) - new Date(watering.timestamp)) / (1000 * 60 * 60);
      }
      
      results.push({
        wateringTime: watering.timestamp,
        moistureIncrease,
        retentionHours
      });
    }
  });
  
  if (results.length === 0) {
    return {
      effectiveness: 'không đủ dữ liệu',
      averageMoistureIncrease: 0,
      retentionTime: 0
    };
  }
  
  // Tính trung bình
  const avgMoistureIncrease = results.reduce((sum, item) => sum + item.moistureIncrease, 0) / results.length;
  const avgRetentionHours = results.reduce((sum, item) => sum + item.retentionHours, 0) / results.length;
  
  // Đánh giá hiệu quả
  let effectiveness;
  if (avgMoistureIncrease < 5) {
    effectiveness = 'kém';
  } else if (avgMoistureIncrease < 15) {
    effectiveness = 'trung bình';
  } else {
    effectiveness = 'tốt';
  }
  
  return {
    effectiveness,
    averageMoistureIncrease: parseFloat(avgMoistureIncrease.toFixed(1)),
    retentionTime: parseFloat(avgRetentionHours.toFixed(1)),
    details: results
  };
}

/**
 * Phân tích các vấn đề lặp lại
 */
function analyzeRecurringIssues(alerts) {
  if (!alerts || alerts.length === 0) {
    return {
      hasRecurringIssues: false,
      issues: []
    };
  }
  
  // Nhóm cảnh báo theo loại
  const issueGroups = {};
  alerts.forEach(alert => {
    const issueType = alert.type || 'unknown';
    if (!issueGroups[issueType]) {
      issueGroups[issueType] = [];
    }
    issueGroups[issueType].push(alert);
  });
  
  // Phân tích từng nhóm
  const recurringIssues = [];
  for (const [type, alertList] of Object.entries(issueGroups)) {
    if (alertList.length >= 3) { // Nếu có từ 3 cảnh báo trở lên cùng loại
      recurringIssues.push({
        type,
        count: alertList.length,
        firstOccurrence: alertList[0].timestamp,
        lastOccurrence: alertList[alertList.length - 1].timestamp,
        severity: alertList[0].severity || 'medium'
      });
    }
  }
  
  return {
    hasRecurringIssues: recurringIssues.length > 0,
    issues: recurringIssues
  };
}

/**
 * Phân tích mô hình tăng trưởng
 */
function analyzeGrowthPatterns(sensorData, wateringHistory, plant) {
  if (!sensorData || sensorData.length < 7) {
    return {
      growthRate: 'không đủ dữ liệu',
      healthScore: 0,
      stressFactors: []
    };
  }
  
  // Tính điểm sức khỏe dựa trên các thông số cảm biến
  const calculateHealthScore = (data, plant) => {
    let score = 100;
    
    // Xác định ngưỡng tối ưu dựa trên loại cây
    const optimalRanges = {
      soilMoisture: { min: 40, max: 70 },
      temperature: { min: 18, max: 30 },
      humidity: { min: 40, max: 70 },
      light: { min: 1000, max: 10000 }
    };
    
    // Điều chỉnh ngưỡng dựa trên thông tin cây trồng
    if (plant.waterNeeds === 'low') {
      optimalRanges.soilMoisture = { min: 30, max: 50 };
    } else if (plant.waterNeeds === 'high') {
      optimalRanges.soilMoisture = { min: 60, max: 80 };
    }
    
    // Tính điểm cho từng thông số
    const parameters = ['soilMoisture', 'temperature', 'humidity', 'light'];
    const stressFactors = [];
    
    parameters.forEach(param => {
      if (data[param] !== undefined) {
        const value = data[param];
        const { min, max } = optimalRanges[param];
        
        if (value < min) {
          const penalty = Math.min(30, ((min - value) / min) * 100);
          score -= penalty;
          stressFactors.push({ parameter: param, issue: 'thấp', value });
        } else if (value > max) {
          const penalty = Math.min(30, ((value - max) / max) * 100);
          score -= penalty;
          stressFactors.push({ parameter: param, issue: 'cao', value });
        }
      }
    });
    
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      stressFactors
    };
  };
  
  // Tính điểm sức khỏe trung bình
  const healthScores = sensorData.map(data => calculateHealthScore(data, plant));
  const avgHealthScore = healthScores.reduce((sum, item) => sum + item.score, 0) / healthScores.length;
  
  // Tổng hợp các yếu tố gây stress
  const allStressFactors = [];
  healthScores.forEach(result => {
    result.stressFactors.forEach(factor => {
      const existingFactor = allStressFactors.find(f => f.parameter === factor.parameter && f.issue === factor.issue);
      if (existingFactor) {
        existingFactor.count++;
      } else {
        allStressFactors.push({ ...factor, count: 1 });
      }
    });
  });
  
  // Sắp xếp theo tần suất xuất hiện
  allStressFactors.sort((a, b) => b.count - a.count);
  
  // Đánh giá tốc độ tăng trưởng
  let growthRate;
  if (avgHealthScore >= 80) {
    growthRate = 'tốt';
  } else if (avgHealthScore >= 60) {
    growthRate = 'trung bình';
  } else {
    growthRate = 'kém';
  }
  
  return {
    growthRate,
    healthScore: Math.round(avgHealthScore),
    stressFactors: allStressFactors.slice(0, 3) // Chỉ lấy 3 yếu tố stress chính
  };
}

/**
 * Dự đoán xu hướng tương lai
 */
function predictFutureTrends(sensorData, daysAhead, plant) {
  if (!sensorData || sensorData.length < 7) {
    return {
      soilMoisture: { value: 0, trend: 'không đủ dữ liệu' },
      temperature: { value: 0, trend: 'không đủ dữ liệu' },
      humidity: { value: 0, trend: 'không đủ dữ liệu' },
      light: { value: 0, trend: 'không đủ dữ liệu' }
    };
  }
  
  // Phân tích xu hướng hiện tại
  const trends = analyzeSensorTrends(sensorData);
  
  // Lấy giá trị gần đây nhất
  const latestData = sensorData[sensorData.length - 1];
  
  // Dự đoán giá trị tương lai dựa trên xu hướng hiện tại
  const predictValue = (currentValue, trend, daysAhead) => {
    if (trend.trend === 'không đủ dữ liệu' || trend.trend === 'ổn định') {
      return { value: currentValue, trend: 'ổn định' };
    }
    
    // Tính toán giá trị dự đoán
    const dailyChangePercent = trend.value / 15; // Giả sử xu hướng được tính trong 15 ngày
    const totalChangePercent = dailyChangePercent * daysAhead;
    const predictedValue = currentValue * (1 + totalChangePercent / 100);
    
    return {
      value: Math.round(predictedValue),
      trend: trend.trend
    };
  };
  
  return {
    soilMoisture: predictValue(latestData.soilMoisture, trends.soilMoisture, daysAhead),
    temperature: predictValue(latestData.temperature, trends.temperature, daysAhead),
    humidity: predictValue(latestData.humidity, trends.humidity, daysAhead),
    light: predictValue(latestData.light, trends.light, daysAhead)
  };
}

/**
 * Tạo đề xuất chăm sóc dựa trên phân tích
 */
function generateCareRecommendations(analysis, plant) {
  const recommendations = [];
  
  // Đề xuất dựa trên xu hướng cảm biến
  if (analysis.trends) {
    if (analysis.trends.soilMoisture.trend === 'giảm' && analysis.trends.soilMoisture.value < -10) {
      recommendations.push({
        type: 'watering',
        priority: 'high',
        message: 'Tăng tần suất tưới nước do độ ẩm đất đang giảm nhanh',
        details: `Độ ẩm đất đã giảm ${Math.abs(analysis.trends.soilMoisture.value)}% trong thời gian gần đây`
      });
    }
    
    if (analysis.trends.temperature.trend === 'tăng' && analysis.trends.temperature.value > 15) {
      recommendations.push({
        type: 'environment',
        priority: 'medium',
        message: 'Nhiệt độ đang tăng nhanh, cân nhắc di chuyển cây đến nơi mát mẻ hơn',
        details: `Nhiệt độ đã tăng ${analysis.trends.temperature.value}% trong thời gian gần đây`
      });
    }
    
    if (analysis.trends.light.trend === 'giảm' && analysis.trends.light.value < -20) {
      recommendations.push({
        type: 'environment',
        priority: 'medium',
        message: 'Ánh sáng đang giảm đáng kể, cân nhắc di chuyển cây đến nơi có nhiều ánh sáng hơn',
        details: `Ánh sáng đã giảm ${Math.abs(analysis.trends.light.value)}% trong thời gian gần đây`
      });
    }
  }
  
  // Đề xuất dựa trên hiệu quả tưới nước
  if (analysis.wateringEffectiveness) {
    if (analysis.wateringEffectiveness.effectiveness === 'kém') {
      recommendations.push({
        type: 'watering',
        priority: 'high',
        message: 'Hiệu quả tưới nước kém, cần điều chỉnh phương pháp tưới',
        details: `Độ ẩm đất chỉ tăng trung bình ${analysis.wateringEffectiveness.averageMoistureIncrease}% sau mỗi lần tưới`
      });
    }
    
    if (analysis.wateringEffectiveness.retentionTime < 24) {
      recommendations.push({
        type: 'soil',
        priority: 'medium',
        message: 'Đất không giữ nước tốt, cân nhắc cải thiện chất lượng đất',
        details: `Đất chỉ giữ ẩm trong khoảng ${analysis.wateringEffectiveness.retentionTime} giờ sau khi tưới`
      });
    }
  }
  
  // Đề xuất dựa trên vấn đề lặp lại
  if (analysis.recurringIssues && analysis.recurringIssues.hasRecurringIssues) {
    analysis.recurringIssues.issues.forEach(issue => {
      let message = '';
      let details = '';
      
      switch (issue.type) {
        case 'temperature_high':
          message = 'Nhiệt độ cao lặp lại nhiều lần, cần điều chỉnh môi trường';
          details = `Đã xảy ra ${issue.count} lần cảnh báo nhiệt độ cao`;
          break;
        case 'moisture_low':
          message = 'Độ ẩm đất thấp lặp lại nhiều lần, cần điều chỉnh lịch tưới';
          details = `Đã xảy ra ${issue.count} lần cảnh báo độ ẩm đất thấp`;
          break;
        case 'light_low':
          message = 'Ánh sáng thấp lặp lại nhiều lần, cần điều chỉnh vị trí cây';
          details = `Đã xảy ra ${issue.count} lần cảnh báo ánh sáng thấp`;
          break;
        default:
          message = `Vấn đề "${issue.type}" lặp lại nhiều lần, cần kiểm tra`;
          details = `Đã xảy ra ${issue.count} lần cảnh báo`;
      }
      
      recommendations.push({
        type: 'recurring_issue',
        priority: issue.severity,
        message,
        details
      });
    });
  }
  
  // Đề xuất dựa trên mô hình tăng trưởng
  if (analysis.growthAnalysis) {
    if (analysis.growthAnalysis.healthScore < 60) {
      recommendations.push({
        type: 'health',
        priority: 'high',
        message: 'Sức khỏe cây kém, cần cải thiện điều kiện chăm sóc',
        details: `Điểm sức khỏe hiện tại: ${analysis.growthAnalysis.healthScore}/100`
      });
      
      // Đề xuất cụ thể dựa trên các yếu tố stress
      if (analysis.growthAnalysis.stressFactors && analysis.growthAnalysis.stressFactors.length > 0) {
        analysis.growthAnalysis.stressFactors.forEach(factor => {
          let message = '';
          
          switch (factor.parameter) {
            case 'soilMoisture':
              message = factor.issue === 'thấp' 
                ? 'Tăng lượng nước tưới và tần suất tưới' 
                : 'Giảm lượng nước tưới và cải thiện thoát nước';
              break;
            case 'temperature':
              message = factor.issue === 'thấp'
                ? 'Di chuyển cây đến nơi ấm hơn hoặc sử dụng đèn sưởi'
                : 'Di chuyển cây đến nơi mát mẻ hơn hoặc tăng độ ẩm không khí';
              break;
            case 'humidity':
              message = factor.issue === 'thấp'
                ? 'Tăng độ ẩm không khí bằng cách phun sương hoặc sử dụng máy tạo ẩm'
                : 'Cải thiện thông gió để giảm độ ẩm không khí';
              break;
            case 'light':
              message = factor.issue === 'thấp'
                ? 'Di chuyển cây đến nơi có nhiều ánh sáng hơn hoặc bổ sung đèn trồng cây'
                : 'Di chuyển cây đến nơi có ánh sáng gián tiếp hoặc sử dụng màn che';
              break;
          }
          
          recommendations.push({
            type: 'stress_factor',
            priority: 'medium',
            message,
            details: `${factor.parameter} ${factor.issue} (${factor.value}) xuất hiện ${factor.count} lần`
          });
        });
      }
    }
  }
  
  // Sắp xếp đề xuất theo mức độ ưu tiên
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations;
}

/**
 * Tạo đề xuất dựa trên dự đoán
 */
function generatePredictiveRecommendations(predictions, plant) {
  const recommendations = [];
  
  // Xác định ngưỡng tối ưu dựa trên loại cây
  const optimalRanges = {
    soilMoisture: { min: 40, max: 70 },
    temperature: { min: 18, max: 30 },
    humidity: { min: 40, max: 70 },
    light: { min: 1000, max: 10000 }
  };
  
  // Điều chỉnh ngưỡng dựa trên thông tin cây trồng
  if (plant.waterNeeds === 'low') {
    optimalRanges.soilMoisture = { min: 30, max: 50 };
  } else if (plant.waterNeeds === 'high') {
    optimalRanges.soilMoisture = { min: 60, max: 80 };
  }
  
  // Kiểm tra từng thông số
  if (predictions.soilMoisture.value < optimalRanges.soilMoisture.min) {
    recommendations.push({
      type: 'watering',
      priority: 'high',
      message: 'Dự đoán độ ẩm đất sẽ xuống thấp, cần tăng tần suất tưới',
      details: `Độ ẩm đất dự đoán: ${predictions.soilMoisture.value}% (dưới ngưỡng tối thiểu ${optimalRanges.soilMoisture.min}%)`
    });
  }
  
  if (predictions.temperature.value > optimalRanges.temperature.max) {
    recommendations.push({
      type: 'environment',
      priority: 'medium',
      message: 'Dự đoán nhiệt độ sẽ tăng cao, cần chuẩn bị biện pháp làm mát',
      details: `Nhiệt độ dự đoán: ${predictions.temperature.value}°C (trên ngưỡng tối đa ${optimalRanges.temperature.max}°C)`
    });
  }
  
  if (predictions.humidity.value < optimalRanges.humidity.min) {
    recommendations.push({
      type: 'environment',
      priority: 'medium',
      message: 'Dự đoán độ ẩm không khí sẽ xuống thấp, cần tăng độ ẩm',
      details: `Độ ẩm không khí dự đoán: ${predictions.humidity.value}% (dưới ngưỡng tối thiểu ${optimalRanges.humidity.min}%)`
    });
  }
  
  if (predictions.light.value < optimalRanges.light.min) {
    recommendations.push({
      type: 'environment',
      priority: 'medium',
      message: 'Dự đoán ánh sáng sẽ giảm, cần chuẩn bị bổ sung ánh sáng',
      details: `Ánh sáng dự đoán: ${predictions.light.value} lux (dưới ngưỡng tối thiểu ${optimalRanges.light.min} lux)`
    });
  }
  
  // Sắp xếp đề xuất theo mức độ ưu tiên
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations;
}

/**
 * Tạo báo cáo tổng hợp
 */
function generateComprehensiveReport(sensorData, wateringHistory, alerts, plant, period) {
  // Phân tích dữ liệu
  const analysis = {
    trends: analyzeSensorTrends(sensorData),
    wateringEffectiveness: analyzeWateringEffectiveness(sensorData, wateringHistory),
    recurringIssues: analyzeRecurringIssues(alerts),
    growthAnalysis: analyzeGrowthPatterns(sensorData, wateringHistory, plant)
  };
  
  // Tính toán các chỉ số tổng hợp
  const overallHealthScore = analysis.growthAnalysis.healthScore || 0;
  
  // Tính số lần tưới trung bình mỗi tuần
  const wateringsPerWeek = wateringHistory.length / (period / 7);
  
  // Tính tỷ lệ cảnh báo
  const alertRate = alerts.length / period;
  
  // Đánh giá tổng thể
  let overallAssessment;
  if (overallHealthScore >= 80) {
    overallAssessment = 'Xuất sắc';
  } else if (overallHealthScore >= 70) {
    overallAssessment = 'Tốt';
  } else if (overallHealthScore >= 60) {
    overallAssessment = 'Khá';
  } else if (overallHealthScore >= 50) {
    overallAssessment = 'Trung bình';
  } else {
    overallAssessment = 'Cần cải thiện';
  }
  
  // Tạo đề xuất
  const recommendations = generateCareRecommendations(analysis, plant);
  
  return {
    plantId: plant._id,
    plantName: plant.name,
    plantType: plant.type,
    period,
    overallAssessment,
    overallHealthScore,
    wateringsPerWeek: parseFloat(wateringsPerWeek.toFixed(1)),
    alertRate: parseFloat(alertRate.toFixed(2)),
    analysis,
    recommendations,
    stats: {
      sensorDataCount: sensorData.length,
      wateringCount: wateringHistory.length,
      alertsCount: alerts.length
    }
  };
}

module.exports = historicalAnalysisController;