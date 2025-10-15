/**
 * Controller tích hợp các microservice AI với hệ thống chính
 */

const mongoose = require('mongoose');
const axios = require('axios');
const irrigationPredictionController = require('./irrigationPredictionController');
const imageRecognitionController = require('./imageRecognitionController');
const earlyWarningController = require('./earlyWarningController');
const irrigationScheduleController = require('./irrigationScheduleController');
const chatbotController = require('./chatbotController');

// Cấu hình API gateway
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000/api';

/**
 * Tích hợp tất cả các dịch vụ AI và cung cấp API thống nhất
 */
exports.getAIInsights = async (req, res) => {
  try {
    const { plantId, userId } = req.params;
    
    if (!plantId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cây trồng'
      });
    }
    
    // Thu thập dữ liệu từ tất cả các dịch vụ AI
    const [
      irrigationPrediction,
      earlyWarnings,
      irrigationSchedule
    ] = await Promise.allSettled([
      // Dự báo nhu cầu tưới cây
      irrigationPredictionController.getPrediction(plantId),
      
      // Cảnh báo sớm
      earlyWarningController.getActiveAlerts(plantId),
      
      // Lịch tưới tự động
      irrigationScheduleController.getSchedule(plantId)
    ]);
    
    // Tổng hợp kết quả
    const insights = {
      plantId,
      timestamp: new Date(),
      irrigation: {
        prediction: irrigationPrediction.status === 'fulfilled' ? irrigationPrediction.value : null,
        schedule: irrigationSchedule.status === 'fulfilled' ? irrigationSchedule.value : null
      },
      warnings: earlyWarnings.status === 'fulfilled' ? earlyWarnings.value : [],
      recommendations: generateRecommendations({
        irrigationPrediction: irrigationPrediction.status === 'fulfilled' ? irrigationPrediction.value : null,
        earlyWarnings: earlyWarnings.status === 'fulfilled' ? earlyWarnings.value : [],
        irrigationSchedule: irrigationSchedule.status === 'fulfilled' ? irrigationSchedule.value : null
      })
    };
    
    // Lưu insights vào cơ sở dữ liệu
    await saveInsightsToDatabase(insights, userId);
    
    // Gửi thông báo đến hệ thống chính nếu có cảnh báo
    if (insights.warnings && insights.warnings.length > 0) {
      await sendNotificationsToMainSystem(insights, userId);
    }
    
    return res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Lỗi khi tích hợp dịch vụ AI:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tích hợp dịch vụ AI',
      error: error.message
    });
  }
};

/**
 * Tạo khuyến nghị dựa trên dữ liệu từ các dịch vụ AI
 */
const generateRecommendations = (data) => {
  const recommendations = [];
  
  // Khuyến nghị từ dự báo tưới cây
  if (data.irrigationPrediction) {
    if (data.irrigationPrediction.needsWatering) {
      recommendations.push({
        type: 'irrigation',
        priority: 'high',
        message: `Cây cần được tưới trong ${data.irrigationPrediction.timeUntilWatering} giờ tới.`,
        details: data.irrigationPrediction.analysis
      });
    } else {
      recommendations.push({
        type: 'irrigation',
        priority: 'low',
        message: `Cây không cần tưới trong ${data.irrigationPrediction.timeUntilWatering} giờ tới.`,
        details: data.irrigationPrediction.analysis
      });
    }
  }
  
  // Khuyến nghị từ cảnh báo sớm
  if (data.earlyWarnings && data.earlyWarnings.length > 0) {
    data.earlyWarnings.forEach(warning => {
      recommendations.push({
        type: 'warning',
        priority: warning.severity,
        message: warning.message,
        details: warning.details
      });
    });
  }
  
  // Khuyến nghị từ lịch tưới tự động
  if (data.irrigationSchedule) {
    const nextWatering = data.irrigationSchedule.schedule.find(item => new Date(item.time) > new Date());
    if (nextWatering) {
      recommendations.push({
        type: 'schedule',
        priority: 'medium',
        message: `Lịch tưới tiếp theo: ${new Date(nextWatering.time).toLocaleString('vi-VN')} với lượng nước ${nextWatering.amount}ml.`,
        details: `Dựa trên lịch tưới tự động được tối ưu hóa.`
      });
    }
  }
  
  return recommendations;
};

/**
 * Lưu insights vào cơ sở dữ liệu
 */
const saveInsightsToDatabase = async (insights, userId) => {
  try {
    // Giả định có model AIInsight
    const AIInsight = mongoose.model('AIInsight');
    
    await AIInsight.create({
      plantId: insights.plantId,
      userId,
      timestamp: insights.timestamp,
      data: insights,
      isRead: false
    });
    
    return true;
  } catch (error) {
    console.error('Lỗi khi lưu insights:', error);
    return false;
  }
};

/**
 * Gửi thông báo đến hệ thống chính
 */
const sendNotificationsToMainSystem = async (insights, userId) => {
  try {
    // Gửi thông báo cho các cảnh báo có mức độ cao
    const highPriorityWarnings = insights.warnings.filter(w => w.severity === 'high');
    
    if (highPriorityWarnings.length > 0) {
      await axios.post(`${API_GATEWAY_URL}/notifications`, {
        userId,
        plantId: insights.plantId,
        title: 'Cảnh báo quan trọng về cây trồng',
        message: highPriorityWarnings[0].message,
        type: 'warning',
        data: {
          warnings: highPriorityWarnings,
          timestamp: insights.timestamp
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi khi gửi thông báo:', error);
    return false;
  }
};

/**
 * API phân tích ảnh cây trồng và tích hợp kết quả
 */
exports.analyzeImage = async (req, res) => {
  try {
    // Sử dụng controller phân tích ảnh
    const analysisResult = await imageRecognitionController.analyzeImage(req, res);
    
    // Nếu phân tích thành công, tích hợp với các dịch vụ khác
    if (analysisResult && analysisResult.success) {
      const { plantId, userId } = req.body;
      
      // Lấy thêm thông tin từ các dịch vụ khác
      const [
        irrigationPrediction,
        earlyWarnings
      ] = await Promise.allSettled([
        irrigationPredictionController.getPrediction(plantId),
        earlyWarningController.getActiveAlerts(plantId)
      ]);
      
      // Tổng hợp kết quả
      const enhancedAnalysis = {
        ...analysisResult,
        additionalInsights: {
          irrigation: irrigationPrediction.status === 'fulfilled' ? irrigationPrediction.value : null,
          warnings: earlyWarnings.status === 'fulfilled' ? earlyWarnings.value : []
        }
      };
      
      // Gửi thông báo nếu phát hiện bệnh nghiêm trọng
      if (analysisResult.condition && analysisResult.condition.severity === 'high') {
        await sendNotificationsToMainSystem({
          plantId,
          timestamp: new Date(),
          warnings: [{
            severity: 'high',
            message: `Phát hiện bệnh nghiêm trọng: ${analysisResult.condition.name}`,
            details: analysisResult.condition.description
          }]
        }, userId);
      }
      
      return res.status(200).json({
        success: true,
        data: enhancedAnalysis
      });
    }
    
    // Nếu controller đã trả về response, không cần trả về thêm
    return;
  } catch (error) {
    console.error('Lỗi khi phân tích ảnh và tích hợp:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi phân tích ảnh và tích hợp',
      error: error.message
    });
  }
};

/**
 * API tổng hợp tất cả dữ liệu lịch sử và đề xuất chăm sóc
 */
exports.getHistoricalAnalysis = async (req, res) => {
  try {
    const { plantId, userId, period = 30 } = req.params; // period: số ngày
    
    if (!plantId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cây trồng'
      });
    }
    
    // Lấy dữ liệu lịch sử từ cơ sở dữ liệu
    const SensorData = mongoose.model('SensorData');
    const WateringHistory = mongoose.model('WateringHistory');
    const AIInsight = mongoose.model('AIInsight');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    const [
      sensorData,
      wateringHistory,
      aiInsights
    ] = await Promise.all([
      SensorData.find({
        plantId,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 }),
      
      WateringHistory.find({
        plantId,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 }),
      
      AIInsight.find({
        plantId,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 })
    ]);
    
    // Phân tích dữ liệu lịch sử
    const analysis = analyzeHistoricalData(sensorData, wateringHistory, aiInsights);
    
    // Tạo đề xuất chăm sóc dựa trên phân tích
    const careRecommendations = generateCareRecommendations(analysis);
    
    return res.status(200).json({
      success: true,
      data: {
        plantId,
        period,
        analysis,
        recommendations: careRecommendations,
        stats: {
          sensorDataCount: sensorData.length,
          wateringCount: wateringHistory.length,
          insightsCount: aiInsights.length
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
};

/**
 * Phân tích dữ liệu lịch sử
 */
const analyzeHistoricalData = (sensorData, wateringHistory, aiInsights) => {
  // Phân tích xu hướng dữ liệu cảm biến
  const sensorTrends = analyzeSensorTrends(sensorData);
  
  // Phân tích hiệu quả tưới nước
  const wateringEffectiveness = analyzeWateringEffectiveness(sensorData, wateringHistory);
  
  // Phân tích các cảnh báo và vấn đề lặp lại
  const recurringIssues = analyzeRecurringIssues(aiInsights);
  
  return {
    sensorTrends,
    wateringEffectiveness,
    recurringIssues
  };
};

/**
 * Phân tích xu hướng dữ liệu cảm biến
 */
const analyzeSensorTrends = (sensorData) => {
  if (!sensorData || sensorData.length < 2) {
    return {
      temperature: { trend: 'stable', value: 0 },
      moisture: { trend: 'stable', value: 0 },
      humidity: { trend: 'stable', value: 0 },
      light: { trend: 'stable', value: 0 }
    };
  }
  
  // Tính toán xu hướng cho từng loại dữ liệu
  const calculateTrend = (dataPoints, key) => {
    const values = dataPoints.map(point => point[key]).filter(val => val !== undefined);
    
    if (values.length < 2) return { trend: 'stable', value: 0 };
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    const percentChange = (change / firstAvg) * 100;
    
    let trend = 'stable';
    if (percentChange > 5) trend = 'increasing';
    else if (percentChange < -5) trend = 'decreasing';
    
    return {
      trend,
      value: parseFloat(percentChange.toFixed(2))
    };
  };
  
  return {
    temperature: calculateTrend(sensorData, 'temperature'),
    moisture: calculateTrend(sensorData, 'soilMoisture'),
    humidity: calculateTrend(sensorData, 'humidity'),
    light: calculateTrend(sensorData, 'lightLevel')
  };
};

/**
 * Phân tích hiệu quả tưới nước
 */
const analyzeWateringEffectiveness = (sensorData, wateringHistory) => {
  if (!wateringHistory || wateringHistory.length === 0 || !sensorData || sensorData.length === 0) {
    return {
      effectiveness: 'unknown',
      moistureIncrease: 0,
      retentionTime: 0
    };
  }
  
  // Tính toán hiệu quả tưới nước
  const effectiveness = wateringHistory.map(watering => {
    const wateringTime = new Date(watering.timestamp);
    
    // Tìm dữ liệu cảm biến trước khi tưới
    const beforeWatering = sensorData
      .filter(data => new Date(data.timestamp) < wateringTime)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    // Tìm dữ liệu cảm biến sau khi tưới
    const afterWatering = sensorData
      .filter(data => new Date(data.timestamp) > wateringTime)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0];
    
    if (!beforeWatering || !afterWatering) return null;
    
    const moistureBefore = beforeWatering.soilMoisture;
    const moistureAfter = afterWatering.soilMoisture;
    const moistureIncrease = moistureAfter - moistureBefore;
    
    // Tìm thời gian giữ ẩm
    const retentionData = sensorData
      .filter(data => new Date(data.timestamp) > new Date(afterWatering.timestamp))
      .find(data => data.soilMoisture <= moistureBefore);
    
    let retentionTime = 0;
    if (retentionData) {
      retentionTime = (new Date(retentionData.timestamp) - new Date(afterWatering.timestamp)) / (1000 * 60 * 60); // giờ
    }
    
    return {
      wateringTime,
      moistureBefore,
      moistureAfter,
      moistureIncrease,
      retentionTime
    };
  }).filter(item => item !== null);
  
  if (effectiveness.length === 0) {
    return {
      effectiveness: 'unknown',
      moistureIncrease: 0,
      retentionTime: 0
    };
  }
  
  // Tính trung bình
  const avgMoistureIncrease = effectiveness.reduce((sum, item) => sum + item.moistureIncrease, 0) / effectiveness.length;
  const avgRetentionTime = effectiveness.reduce((sum, item) => sum + item.retentionTime, 0) / effectiveness.length;
  
  let effectivenessRating = 'medium';
  if (avgMoistureIncrease > 15 && avgRetentionTime > 24) {
    effectivenessRating = 'high';
  } else if (avgMoistureIncrease < 5 || avgRetentionTime < 12) {
    effectivenessRating = 'low';
  }
  
  return {
    effectiveness: effectivenessRating,
    moistureIncrease: parseFloat(avgMoistureIncrease.toFixed(2)),
    retentionTime: parseFloat(avgRetentionTime.toFixed(2))
  };
};

/**
 * Phân tích các vấn đề lặp lại
 */
const analyzeRecurringIssues = (aiInsights) => {
  if (!aiInsights || aiInsights.length === 0) {
    return [];
  }
  
  // Tìm các cảnh báo và vấn đề từ insights
  const allIssues = [];
  
  aiInsights.forEach(insight => {
    if (insight.data && insight.data.warnings) {
      insight.data.warnings.forEach(warning => {
        allIssues.push({
          type: warning.type || 'warning',
          message: warning.message,
          severity: warning.severity || 'medium',
          timestamp: insight.timestamp
        });
      });
    }
    
    if (insight.data && insight.data.recommendations) {
      insight.data.recommendations.forEach(rec => {
        if (rec.priority === 'high') {
          allIssues.push({
            type: rec.type || 'recommendation',
            message: rec.message,
            severity: 'medium',
            timestamp: insight.timestamp
          });
        }
      });
    }
  });
  
  // Nhóm các vấn đề tương tự
  const issueGroups = {};
  
  allIssues.forEach(issue => {
    const key = `${issue.type}_${issue.message}`;
    if (!issueGroups[key]) {
      issueGroups[key] = {
        type: issue.type,
        message: issue.message,
        severity: issue.severity,
        count: 1,
        firstOccurrence: issue.timestamp,
        lastOccurrence: issue.timestamp
      };
    } else {
      issueGroups[key].count += 1;
      if (new Date(issue.timestamp) > new Date(issueGroups[key].lastOccurrence)) {
        issueGroups[key].lastOccurrence = issue.timestamp;
      }
    }
  });
  
  // Chuyển đổi thành mảng và sắp xếp theo số lần xuất hiện
  return Object.values(issueGroups)
    .filter(issue => issue.count > 1) // Chỉ lấy các vấn đề lặp lại
    .sort((a, b) => b.count - a.count);
};

/**
 * Tạo đề xuất chăm sóc dựa trên phân tích
 */
const generateCareRecommendations = (analysis) => {
  const recommendations = [];
  
  // Đề xuất dựa trên xu hướng cảm biến
  if (analysis.sensorTrends) {
    if (analysis.sensorTrends.moisture.trend === 'decreasing' && analysis.sensorTrends.moisture.value < -10) {
      recommendations.push({
        type: 'watering',
        priority: 'high',
        message: 'Tăng tần suất tưới nước do độ ẩm đất đang giảm nhanh',
        details: `Độ ẩm đất đã giảm ${Math.abs(analysis.sensorTrends.moisture.value)}% trong thời gian gần đây`
      });
    }
    
    if (analysis.sensorTrends.temperature.trend === 'increasing' && analysis.sensorTrends.temperature.value > 15) {
      recommendations.push({
        type: 'environment',
        priority: 'medium',
        message: 'Nhiệt độ đang tăng nhanh, cân nhắc di chuyển cây đến nơi mát mẻ hơn',
        details: `Nhiệt độ đã tăng ${analysis.sensorTrends.temperature.value}% trong thời gian gần đây`
      });
    }
    
    if (analysis.sensorTrends.light.trend === 'decreasing' && analysis.sensorTrends.light.value < -20) {
      recommendations.push({
        type: 'environment',
        priority: 'medium',
        message: 'Ánh sáng đang giảm đáng kể, cân nhắc di chuyển cây đến nơi có nhiều ánh sáng hơn',
        details: `Mức ánh sáng đã giảm ${Math.abs(analysis.sensorTrends.light.value)}% trong thời gian gần đây`
      });
    }
  }
  
  // Đề xuất dựa trên hiệu quả tưới nước
  if (analysis.wateringEffectiveness) {
    if (analysis.wateringEffectiveness.effectiveness === 'low') {
      recommendations.push({
        type: 'watering',
        priority: 'high',
        message: 'Hiệu quả tưới nước thấp, cân nhắc thay đổi phương pháp tưới hoặc kiểm tra chất lượng đất',
        details: `Tưới nước chỉ làm tăng độ ẩm ${analysis.wateringEffectiveness.moistureIncrease}% và duy trì trong ${analysis.wateringEffectiveness.retentionTime} giờ`
      });
    } else if (analysis.wateringEffectiveness.effectiveness === 'high' && analysis.wateringEffectiveness.retentionTime > 48) {
      recommendations.push({
        type: 'watering',
        priority: 'low',
        message: 'Hiệu quả tưới nước tốt, có thể giảm tần suất tưới',
        details: `Tưới nước làm tăng độ ẩm ${analysis.wateringEffectiveness.moistureIncrease}% và duy trì trong ${analysis.wateringEffectiveness.retentionTime} giờ`
      });
    }
  }
  
  // Đề xuất dựa trên các vấn đề lặp lại
  if (analysis.recurringIssues && analysis.recurringIssues.length > 0) {
    analysis.recurringIssues.forEach(issue => {
      if (issue.count >= 3) {
        recommendations.push({
          type: 'recurring_issue',
          priority: issue.severity === 'high' ? 'high' : 'medium',
          message: `Vấn đề lặp lại: ${issue.message}`,
          details: `Đã xảy ra ${issue.count} lần từ ${new Date(issue.firstOccurrence).toLocaleDateString('vi-VN')} đến ${new Date(issue.lastOccurrence).toLocaleDateString('vi-VN')}`
        });
      }
    });
  }
  
  return recommendations;
};

/**
 * API tự động hóa quá trình tưới cây
 */
exports.automateIrrigation = async (req, res) => {
  try {
    const { plantId } = req.params;
    const { enable, threshold, scheduleId } = req.body;
    
    if (!plantId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cây trồng'
      });
    }
    
    // Lấy thông tin lịch tưới
    let schedule = null;
    if (scheduleId) {
      schedule = await irrigationScheduleController.getScheduleById(scheduleId);
    } else {
      schedule = await irrigationScheduleController.getSchedule(plantId);
    }
    
    // Cập nhật cấu hình tự động hóa
    const AutomationConfig = mongoose.model('AutomationConfig');
    
    let config = await AutomationConfig.findOne({ plantId });
    
    if (!config) {
      config = new AutomationConfig({
        plantId,
        enabled: enable !== undefined ? enable : true,
        moistureThreshold: threshold || 30,
        scheduleId: schedule ? schedule._id : null,
        lastWatering: null,
        nextScheduledWatering: schedule ? schedule.schedule[0].time : null
      });
    } else {
      if (enable !== undefined) config.enabled = enable;
      if (threshold) config.moistureThreshold = threshold;
      if (schedule) {
        config.scheduleId = schedule._id;
        config.nextScheduledWatering = schedule.schedule[0].time;
      }
    }
    
    await config.save();
    
    // Gửi cấu hình đến hệ thống chính
    try {
      await axios.post(`${API_GATEWAY_URL}/automation/irrigation`, {
        plantId,
        enabled: config.enabled,
        moistureThreshold: config.moistureThreshold,
        schedule: schedule ? schedule.schedule : [],
        nextWatering: config.nextScheduledWatering
      });
    } catch (apiError) {
      console.error('Lỗi khi gửi cấu hình đến hệ thống chính:', apiError);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        plantId,
        enabled: config.enabled,
        moistureThreshold: config.moistureThreshold,
        schedule: schedule ? schedule.schedule : [],
        nextWatering: config.nextScheduledWatering
      }
    });
  } catch (error) {
    console.error('Lỗi khi cấu hình tự động hóa tưới cây:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cấu hình tự động hóa tưới cây',
      error: error.message
    });
  }
};