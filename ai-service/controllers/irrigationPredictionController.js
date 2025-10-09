// Controller cho dự báo nhu cầu tưới cây
const irrigationPredictionController = {
  // Dự báo nhu cầu tưới cây dựa trên dữ liệu cảm biến
  predictIrrigationNeeds: async (req, res) => {
    try {
      const { plantId, userId } = req.body;
      
      if (!plantId) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin cây trồng' });
      }
      
      // Giả lập lấy dữ liệu cảm biến gần đây
      const sensorData = getMockSensorData(plantId);
      
      // Giả lập lấy thông tin loại cây
      const plantInfo = getMockPlantInfo(plantId);
      
      // Giả lập dự báo nhu cầu tưới cây
      const prediction = predictWateringNeeds(sensorData, plantInfo);
      
      // Giả lập lưu kết quả dự báo
      console.log(`[AI] Đã lưu kết quả dự báo cho plant ${plantId}`);
      
      return res.json({
        success: true,
        plantId,
        prediction
      });
      
    } catch (error) {
      console.error('Lỗi khi dự báo nhu cầu tưới cây:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi dự báo nhu cầu tưới cây',
        details: error.message
      });
    }
  },
  
  // Phân tích và cảnh báo sớm tình trạng cây trồng
  analyzeAndAlert: async (req, res) => {
    try {
      const { plantId, userId } = req.body;
      
      if (!plantId) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin cây trồng' });
      }
      
      // Giả lập lấy dữ liệu cảm biến gần đây
      const sensorData = getMockSensorData(plantId);
      
      // Giả lập phân tích tình trạng cây trồng
      const analysis = analyzePlantCondition(sensorData);
      
      // Giả lập tạo cảnh báo nếu cần
      const alerts = generateAlerts(analysis);
      
      // Giả lập lưu kết quả phân tích
      console.log(`[AI] Đã lưu kết quả phân tích cho plant ${plantId}`);
      
      return res.json({
        success: true,
        plantId,
        analysis,
        alerts
      });
      
    } catch (error) {
      console.error('Lỗi khi phân tích tình trạng cây trồng:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi phân tích tình trạng cây trồng',
        details: error.message
      });
    }
  },
  
  // Lấy lịch sử dự báo
  getPredictionHistory: async (req, res) => {
    try {
      const { plantId } = req.params;
      
      if (!plantId) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin cây trồng' });
      }
      
      // Giả lập lấy lịch sử dự báo
      const history = getMockPredictionHistory(plantId);
      
      return res.json({
        success: true,
        plantId,
        history
      });
      
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử dự báo:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi lấy lịch sử dự báo',
        details: error.message
      });
    }
  }
};

// Hàm giả lập lấy dữ liệu cảm biến gần đây
function getMockSensorData(plantId) {
  const now = new Date();
  
  // Tạo dữ liệu giả cho 24 giờ gần nhất
  const data = [];
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now);
    timestamp.setHours(timestamp.getHours() - i);
    
    data.push({
      timestamp: timestamp.toISOString(),
      soil_moisture: Math.floor(Math.random() * 40) + 30, // 30-70%
      temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
      humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
      light: Math.floor(Math.random() * 800) + 200 // 200-1000 lux
    });
  }
  
  return data;
}

// Hàm giả lập lấy thông tin loại cây
function getMockPlantInfo(plantId) {
  const plantTypes = [
    {
      id: 1,
      name: 'Cây xương rồng',
      optimal_soil_moisture: 30,
      optimal_temperature: 25,
      optimal_humidity: 40,
      optimal_light: 800,
      watering_frequency: 14 // ngày
    },
    {
      id: 2,
      name: 'Cây dương xỉ',
      optimal_soil_moisture: 70,
      optimal_temperature: 22,
      optimal_humidity: 75,
      optimal_light: 400,
      watering_frequency: 3 // ngày
    },
    {
      id: 3,
      name: 'Cây trầu bà',
      optimal_soil_moisture: 60,
      optimal_temperature: 24,
      optimal_humidity: 65,
      optimal_light: 500,
      watering_frequency: 5 // ngày
    }
  ];
  
  // Chọn loại cây dựa trên plantId
  const plantTypeIndex = (parseInt(plantId) - 1) % plantTypes.length;
  return plantTypes[plantTypeIndex];
}

// Hàm giả lập dự báo nhu cầu tưới cây
function predictWateringNeeds(sensorData, plantInfo) {
  // Lấy dữ liệu cảm biến mới nhất
  const latestData = sensorData[0];
  
  // Tính toán điểm số nhu cầu tưới cây
  const moistureScore = calculateMoistureScore(latestData.soil_moisture, plantInfo.optimal_soil_moisture);
  const temperatureScore = calculateTemperatureScore(latestData.temperature, plantInfo.optimal_temperature);
  const humidityScore = calculateHumidityScore(latestData.humidity, plantInfo.optimal_humidity);
  const lightScore = calculateLightScore(latestData.light, plantInfo.optimal_light);
  
  // Tổng hợp điểm số
  const totalScore = (moistureScore * 0.5) + (temperatureScore * 0.2) + (humidityScore * 0.2) + (lightScore * 0.1);
  
  // Xác định nhu cầu tưới cây
  const needsWatering = totalScore > 70;
  
  // Tính toán lượng nước cần thiết
  const waterAmount = needsWatering ? calculateWaterAmount(plantInfo, latestData) : 0;
  
  // Dự báo thời gian tưới tiếp theo
  const nextWateringTime = predictNextWateringTime(latestData, plantInfo, needsWatering);
  
  return {
    timestamp: new Date().toISOString(),
    needs_watering: needsWatering,
    water_amount: waterAmount, // ml
    next_watering_time: nextWateringTime.toISOString(),
    confidence: Math.floor(Math.random() * 10) + 90, // 90-99%
    factors: {
      moisture_score: moistureScore,
      temperature_score: temperatureScore,
      humidity_score: humidityScore,
      light_score: lightScore
    }
  };
}

// Hàm tính điểm số độ ẩm đất
function calculateMoistureScore(current, optimal) {
  const diff = optimal - current;
  if (diff > 20) return 100; // Rất khô, cần tưới ngay
  if (diff > 10) return 80; // Khô, nên tưới
  if (diff > 0) return 60; // Hơi khô, có thể tưới
  if (diff > -10) return 40; // Đủ ẩm, không cần tưới
  return 20; // Quá ẩm, không nên tưới
}

// Hàm tính điểm số nhiệt độ
function calculateTemperatureScore(current, optimal) {
  const diff = Math.abs(current - optimal);
  if (diff < 2) return 20; // Nhiệt độ lý tưởng
  if (diff < 5) return 40; // Nhiệt độ chấp nhận được
  if (diff < 8) return 60; // Nhiệt độ không tốt
  if (diff < 12) return 80; // Nhiệt độ xấu
  return 100; // Nhiệt độ nguy hiểm
}

// Hàm tính điểm số độ ẩm không khí
function calculateHumidityScore(current, optimal) {
  const diff = optimal - current;
  if (diff > 20) return 80; // Không khí khô, tăng nhu cầu tưới
  if (diff > 10) return 60; // Không khí hơi khô
  if (diff > -10) return 40; // Độ ẩm không khí phù hợp
  return 20; // Không khí ẩm, giảm nhu cầu tưới
}

// Hàm tính điểm số ánh sáng
function calculateLightScore(current, optimal) {
  const diff = current - optimal;
  if (diff > 200) return 70; // Ánh sáng mạnh, tăng nhu cầu tưới
  if (diff > 100) return 60; // Ánh sáng hơi mạnh
  if (diff > -100) return 40; // Ánh sáng phù hợp
  if (diff > -200) return 50; // Ánh sáng hơi yếu
  return 30; // Ánh sáng yếu, giảm nhu cầu tưới
}

// Hàm tính lượng nước cần thiết
function calculateWaterAmount(plantInfo, sensorData) {
  // Lượng nước cơ bản dựa trên loại cây
  let baseAmount = 0;
  
  switch (plantInfo.name) {
    case 'Cây xương rồng':
      baseAmount = 50; // ml
      break;
    case 'Cây dương xỉ':
      baseAmount = 200; // ml
      break;
    case 'Cây trầu bà':
      baseAmount = 150; // ml
      break;
    default:
      baseAmount = 100; // ml
  }
  
  // Điều chỉnh dựa trên độ ẩm đất
  const moistureAdjustment = (plantInfo.optimal_soil_moisture - sensorData.soil_moisture) / 100;
  
  // Điều chỉnh dựa trên nhiệt độ
  const tempDiff = sensorData.temperature - plantInfo.optimal_temperature;
  const tempAdjustment = tempDiff > 0 ? tempDiff / 10 : 0;
  
  // Tổng hợp điều chỉnh
  const adjustmentFactor = 1 + moistureAdjustment + tempAdjustment;
  
  return Math.round(baseAmount * adjustmentFactor);
}

// Hàm dự báo thời gian tưới tiếp theo
function predictNextWateringTime(sensorData, plantInfo, needsWateringNow) {
  const now = new Date();
  
  if (needsWateringNow) {
    // Nếu cần tưới ngay, thời gian tưới tiếp theo là sau khi tưới xong
    return now;
  } else {
    // Dự báo dựa trên tốc độ giảm độ ẩm và tần suất tưới
    const daysToAdd = Math.max(1, Math.round(plantInfo.watering_frequency / 2));
    const nextWatering = new Date(now);
    nextWatering.setDate(nextWatering.getDate() + daysToAdd);
    return nextWatering;
  }
}

// Hàm giả lập phân tích tình trạng cây trồng
function analyzePlantCondition(sensorData) {
  // Lấy dữ liệu cảm biến mới nhất
  const latestData = sensorData[0];
  
  // Phân tích xu hướng
  const trends = analyzeTrends(sensorData);
  
  // Xác định tình trạng cây trồng
  const condition = determineCondition(latestData, trends);
  
  return {
    timestamp: new Date().toISOString(),
    current_condition: condition.status,
    health_score: condition.score,
    trends,
    recommendations: condition.recommendations
  };
}

// Hàm phân tích xu hướng
function analyzeTrends(sensorData) {
  // Tính toán xu hướng cho từng thông số
  const moistureTrend = calculateTrend(sensorData, 'soil_moisture');
  const temperatureTrend = calculateTrend(sensorData, 'temperature');
  const humidityTrend = calculateTrend(sensorData, 'humidity');
  const lightTrend = calculateTrend(sensorData, 'light');
  
  return {
    soil_moisture: moistureTrend,
    temperature: temperatureTrend,
    humidity: humidityTrend,
    light: lightTrend
  };
}

// Hàm tính xu hướng
function calculateTrend(data, parameter) {
  // Lấy 6 giá trị gần nhất
  const recentValues = data.slice(0, 6).map(item => item[parameter]);
  
  // Tính xu hướng
  let increasing = 0;
  let decreasing = 0;
  
  for (let i = 0; i < recentValues.length - 1; i++) {
    if (recentValues[i] > recentValues[i + 1]) {
      increasing++;
    } else if (recentValues[i] < recentValues[i + 1]) {
      decreasing++;
    }
  }
  
  // Xác định xu hướng
  if (increasing > decreasing + 1) {
    return 'increasing';
  } else if (decreasing > increasing + 1) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

// Hàm xác định tình trạng cây trồng
function determineCondition(latestData, trends) {
  // Tính điểm sức khỏe
  let healthScore = 0;
  
  // Đánh giá độ ẩm đất
  if (latestData.soil_moisture < 30) {
    healthScore -= 30;
  } else if (latestData.soil_moisture < 40) {
    healthScore -= 15;
  } else if (latestData.soil_moisture > 80) {
    healthScore -= 20;
  } else if (latestData.soil_moisture > 70) {
    healthScore -= 10;
  } else {
    healthScore += 25;
  }
  
  // Đánh giá nhiệt độ
  if (latestData.temperature < 15 || latestData.temperature > 35) {
    healthScore -= 25;
  } else if (latestData.temperature < 18 || latestData.temperature > 30) {
    healthScore -= 10;
  } else {
    healthScore += 20;
  }
  
  // Đánh giá độ ẩm không khí
  if (latestData.humidity < 30) {
    healthScore -= 15;
  } else if (latestData.humidity > 85) {
    healthScore -= 10;
  } else {
    healthScore += 15;
  }
  
  // Đánh giá ánh sáng
  if (latestData.light < 200) {
    healthScore -= 15;
  } else if (latestData.light > 1000) {
    healthScore -= 10;
  } else {
    healthScore += 15;
  }
  
  // Điều chỉnh dựa trên xu hướng
  if (trends.soil_moisture === 'decreasing' && latestData.soil_moisture < 50) {
    healthScore -= 10;
  }
  
  if (trends.temperature === 'increasing' && latestData.temperature > 28) {
    healthScore -= 10;
  }
  
  // Chuẩn hóa điểm số
  healthScore = Math.max(0, Math.min(100, healthScore + 50));
  
  // Xác định tình trạng và đề xuất
  let status;
  let recommendations = [];
  
  if (healthScore >= 80) {
    status = 'excellent';
    recommendations = ['Duy trì chế độ chăm sóc hiện tại'];
  } else if (healthScore >= 60) {
    status = 'good';
    recommendations = ['Tiếp tục theo dõi các thông số'];
  } else if (healthScore >= 40) {
    status = 'fair';
    recommendations = ['Cần chú ý theo dõi thường xuyên hơn'];
    
    if (latestData.soil_moisture < 40) {
      recommendations.push('Tăng lượng nước tưới');
    }
    
    if (latestData.light < 300) {
      recommendations.push('Di chuyển cây đến vị trí có nhiều ánh sáng hơn');
    }
  } else {
    status = 'poor';
    recommendations = ['Cần can thiệp ngay lập tức'];
    
    if (latestData.soil_moisture < 30) {
      recommendations.push('Tưới nước ngay lập tức');
    } else if (latestData.soil_moisture > 75) {
      recommendations.push('Giảm lượng nước tưới, kiểm tra hệ thống thoát nước');
    }
    
    if (latestData.temperature < 15) {
      recommendations.push('Di chuyển cây đến nơi ấm hơn');
    } else if (latestData.temperature > 35) {
      recommendations.push('Di chuyển cây đến nơi mát hơn');
    }
    
    if (latestData.humidity < 30) {
      recommendations.push('Tăng độ ẩm không khí xung quanh cây');
    }
  }
  
  return {
    status,
    score: healthScore,
    recommendations
  };
}

// Hàm tạo cảnh báo
function generateAlerts(analysis) {
  const alerts = [];
  
  // Cảnh báo dựa trên tình trạng cây
  if (analysis.health_score < 40) {
    alerts.push({
      level: 'high',
      message: 'Cây đang trong tình trạng sức khỏe kém, cần can thiệp ngay',
      type: 'health'
    });
  } else if (analysis.health_score < 60) {
    alerts.push({
      level: 'medium',
      message: 'Cây đang có dấu hiệu stress, cần theo dõi',
      type: 'health'
    });
  }
  
  // Cảnh báo dựa trên xu hướng
  if (analysis.trends.soil_moisture === 'decreasing' && analysis.trends.temperature === 'increasing') {
    alerts.push({
      level: 'medium',
      message: 'Độ ẩm đất đang giảm và nhiệt độ đang tăng, có thể cần tưới nước sớm',
      type: 'trend'
    });
  }
  
  return alerts;
}

// Hàm giả lập lấy lịch sử dự báo
function getMockPredictionHistory(plantId) {
  const history = [];
  const now = new Date();
  
  // Tạo lịch sử dự báo cho 10 ngày gần nhất
  for (let i = 0; i < 10; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Tạo dữ liệu dự báo giả
    history.push({
      id: `pred_${plantId}_${i}`,
      timestamp: date.toISOString(),
      needs_watering: Math.random() > 0.7,
      water_amount: Math.floor(Math.random() * 200) + 50,
      actual_watering: Math.random() > 0.3,
      accuracy: Math.floor(Math.random() * 15) + 85
    });
  }
  
  return history;
}

module.exports = irrigationPredictionController;