// Controller xử lý dự đoán tưới cây thông minh

// Hàm dự đoán thời gian tưới cây dựa trên dữ liệu cảm biến
async function predictIrrigation(req, res) {
  try {
    const { plantId, sensorData } = req.body;
    
    if (!plantId || !sensorData) {
      return res.status(400).json({ error: 'Thiếu thông tin plantId hoặc dữ liệu cảm biến' });
    }
    
    // Kiểm tra dữ liệu cảm biến
    if (!sensorData.soilMoisture || !sensorData.temperature || !sensorData.humidity) {
      return res.status(400).json({ error: 'Dữ liệu cảm biến không đầy đủ' });
    }
    
    // Giả lập dự đoán dựa trên dữ liệu cảm biến
    const prediction = simulatePrediction(sensorData);
    
    // Giả lập lưu kết quả dự đoán vào database
    console.log(`[DB] Đã lưu dự đoán tưới cây cho plant ${plantId}: ${prediction.shouldWater ? 'Cần tưới' : 'Chưa cần tưới'}`);
    
    return res.json({
      plantId,
      prediction
    });
  } catch (error) {
    console.error('Lỗi khi dự đoán tưới cây:', error);
    return res.status(500).json({ error: 'Lỗi khi dự đoán tưới cây', details: error.message });
  }
}

// Hàm giả lập dự đoán tưới cây
function simulatePrediction(sensorData) {
  const { soilMoisture, temperature, humidity } = sensorData;
  
  // Ngưỡng cơ bản cho việc tưới cây
  const MOISTURE_THRESHOLD = 30; // Dưới 30% là khô
  const TEMP_THRESHOLD = 28; // Trên 28°C là nóng
  const HUMIDITY_THRESHOLD = 40; // Dưới 40% là khô
  
  // Tính toán điểm số dựa trên các yếu tố
  let score = 0;
  
  // Độ ẩm đất là yếu tố quan trọng nhất
  if (soilMoisture < MOISTURE_THRESHOLD) {
    score += 60;
  } else if (soilMoisture < MOISTURE_THRESHOLD + 10) {
    score += 30;
  }
  
  // Nhiệt độ cao làm tăng nhu cầu nước
  if (temperature > TEMP_THRESHOLD) {
    score += 20;
  } else if (temperature > TEMP_THRESHOLD - 5) {
    score += 10;
  }
  
  // Độ ẩm không khí thấp làm tăng nhu cầu nước
  if (humidity < HUMIDITY_THRESHOLD) {
    score += 20;
  } else if (humidity < HUMIDITY_THRESHOLD + 10) {
    score += 10;
  }
  
  // Quyết định tưới cây
  const shouldWater = score >= 60;
  
  // Tính thời gian tưới tiếp theo (nếu chưa cần tưới)
  let nextWateringHours = 0;
  if (!shouldWater) {
    // Công thức đơn giản: càng gần ngưỡng cần tưới, thời gian càng ngắn
    nextWateringHours = Math.max(1, Math.round((100 - score) / 10));
  }
  
  // Tạo cảnh báo sớm nếu cần
  const earlyWarning = score >= 40 && score < 60 ? {
    message: 'Cây sẽ cần tưới trong thời gian tới',
    timeFrame: `${nextWateringHours} giờ`
  } : null;
  
  return {
    shouldWater,
    confidence: score / 100,
    nextWateringIn: shouldWater ? 0 : nextWateringHours,
    earlyWarning,
    factors: {
      soilMoisture: {
        value: soilMoisture,
        status: soilMoisture < MOISTURE_THRESHOLD ? 'Thấp' : 'Đủ'
      },
      temperature: {
        value: temperature,
        status: temperature > TEMP_THRESHOLD ? 'Cao' : 'Bình thường'
      },
      humidity: {
        value: humidity,
        status: humidity < HUMIDITY_THRESHOLD ? 'Thấp' : 'Đủ'
      }
    }
  };
}

// Hàm phân tích cảnh báo sớm
async function analyzeEarlyWarnings(req, res) {
  try {
    const { plantId } = req.params;
    
    if (!plantId) {
      return res.status(400).json({ error: 'Thiếu thông tin plantId' });
    }
    
    // Giả lập dữ liệu cảm biến gần đây
    const recentData = generateMockSensorData(plantId);
    
    // Phân tích xu hướng
    const trends = analyzeTrends(recentData);
    
    // Tạo cảnh báo dựa trên xu hướng
    const warnings = generateWarnings(trends);
    
    return res.json({
      plantId,
      trends,
      warnings
    });
  } catch (error) {
    console.error('Lỗi khi phân tích cảnh báo sớm:', error);
    return res.status(500).json({ error: 'Lỗi khi phân tích cảnh báo sớm', details: error.message });
  }
}

// Hàm tạo dữ liệu cảm biến giả lập
function generateMockSensorData(plantId) {
  // Tạo dữ liệu cho 24 giờ qua, mỗi giờ một bản ghi
  const data = [];
  const now = Date.now();
  
  // Tạo xu hướng giảm độ ẩm đất
  let soilMoisture = 60; // Bắt đầu từ 60%
  let temperature = 25; // Nhiệt độ ổn định
  let humidity = 50; // Độ ẩm không khí ổn định
  
  for (let i = 0; i < 24; i++) {
    // Giảm độ ẩm đất theo thời gian
    soilMoisture -= 1.5;
    // Dao động nhỏ cho nhiệt độ và độ ẩm
    temperature += (Math.random() - 0.5) * 2;
    humidity += (Math.random() - 0.5) * 3;
    
    // Đảm bảo giá trị hợp lý
    soilMoisture = Math.max(20, Math.min(80, soilMoisture));
    temperature = Math.max(20, Math.min(35, temperature));
    humidity = Math.max(30, Math.min(70, humidity));
    
    data.push({
      timestamp: new Date(now - (23 - i) * 60 * 60 * 1000),
      soilMoisture: parseFloat(soilMoisture.toFixed(1)),
      temperature: parseFloat(temperature.toFixed(1)),
      humidity: parseFloat(humidity.toFixed(1))
    });
  }
  
  return data;
}

// Hàm phân tích xu hướng
function analyzeTrends(data) {
  // Tính toán xu hướng cho từng thông số
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];
  const midPoint = data[Math.floor(data.length / 2)];
  
  // Tính tốc độ thay đổi
  const soilMoistureChange = lastPoint.soilMoisture - firstPoint.soilMoisture;
  const temperatureChange = lastPoint.temperature - firstPoint.temperature;
  const humidityChange = lastPoint.humidity - firstPoint.humidity;
  
  // Xác định xu hướng
  const soilMoistureTrend = soilMoistureChange < -5 ? 'giảm mạnh' : 
                           soilMoistureChange < 0 ? 'giảm nhẹ' : 
                           soilMoistureChange > 5 ? 'tăng mạnh' : 
                           soilMoistureChange > 0 ? 'tăng nhẹ' : 'ổn định';
  
  const temperatureTrend = temperatureChange < -3 ? 'giảm mạnh' : 
                          temperatureChange < 0 ? 'giảm nhẹ' : 
                          temperatureChange > 3 ? 'tăng mạnh' : 
                          temperatureChange > 0 ? 'tăng nhẹ' : 'ổn định';
  
  const humidityTrend = humidityChange < -10 ? 'giảm mạnh' : 
                       humidityChange < 0 ? 'giảm nhẹ' : 
                       humidityChange > 10 ? 'tăng mạnh' : 
                       humidityChange > 0 ? 'tăng nhẹ' : 'ổn định';
  
  return {
    soilMoisture: {
      current: lastPoint.soilMoisture,
      change: soilMoistureChange,
      trend: soilMoistureTrend
    },
    temperature: {
      current: lastPoint.temperature,
      change: temperatureChange,
      trend: temperatureTrend
    },
    humidity: {
      current: lastPoint.humidity,
      change: humidityChange,
      trend: humidityTrend
    }
  };
}

// Hàm tạo cảnh báo dựa trên xu hướng
function generateWarnings(trends) {
  const warnings = [];
  
  // Cảnh báo độ ẩm đất
  if (trends.soilMoisture.current < 30) {
    warnings.push({
      type: 'high',
      message: 'Độ ẩm đất rất thấp, cần tưới ngay lập tức'
    });
  } else if (trends.soilMoisture.current < 40 && trends.soilMoisture.trend.includes('giảm')) {
    warnings.push({
      type: 'medium',
      message: 'Độ ẩm đất đang giảm và sắp xuống ngưỡng thấp, nên chuẩn bị tưới'
    });
  }
  
  // Cảnh báo nhiệt độ
  if (trends.temperature.current > 30 && trends.soilMoisture.current < 50) {
    warnings.push({
      type: 'medium',
      message: 'Nhiệt độ cao kết hợp với độ ẩm đất thấp có thể gây stress cho cây'
    });
  }
  
  // Cảnh báo độ ẩm không khí
  if (trends.humidity.current < 35 && trends.temperature.current > 28) {
    warnings.push({
      type: 'low',
      message: 'Độ ẩm không khí thấp và nhiệt độ cao, nên phun sương cho cây'
    });
  }
  
  return warnings;
}

// Hàm lấy lịch sử dự đoán tưới cây
async function getPredictionHistory(req, res) {
  try {
    const { plantId } = req.params;
    
    if (!plantId) {
      return res.status(400).json({ error: 'Thiếu thông tin plantId' });
    }
    
    // Tạo dữ liệu lịch sử giả lập
    const mockHistory = [
      {
        id: 1,
        plant_id: plantId,
        prediction: {
          shouldWater: true,
          confidence: 0.85,
          factors: {
            soilMoisture: { value: 25, status: 'Thấp' },
            temperature: { value: 30, status: 'Cao' },
            humidity: { value: 35, status: 'Thấp' }
          }
        },
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        plant_id: plantId,
        prediction: {
          shouldWater: false,
          confidence: 0.72,
          nextWateringIn: 12,
          factors: {
            soilMoisture: { value: 45, status: 'Đủ' },
            temperature: { value: 26, status: 'Bình thường' },
            humidity: { value: 48, status: 'Đủ' }
          }
        },
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: 3,
        plant_id: plantId,
        prediction: {
          shouldWater: true,
          confidence: 0.91,
          factors: {
            soilMoisture: { value: 22, status: 'Thấp' },
            temperature: { value: 32, status: 'Cao' },
            humidity: { value: 30, status: 'Thấp' }
          }
        },
        created_at: new Date()
      }
    ];
    
    return res.json(mockHistory);
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử dự đoán:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy lịch sử dự đoán', details: error.message });
  }
}

module.exports = {
  predictIrrigation,
  analyzeEarlyWarnings,
  getPredictionHistory
};