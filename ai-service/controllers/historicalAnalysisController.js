// Giả lập kết nối database để chạy thử nghiệm
const mockDatabase = {
  plants: [],
  sensor_data: [],
  watering_history: [],
  image_analysis: [],
  historical_analysis: []
};

// Giả lập hàm query
const mockQuery = async (query, params) => {
  console.log(`[DB Mock] Executing query: ${query.substring(0, 50)}...`);
  console.log(`[DB Mock] With params:`, params);
  
  // Giả lập kết quả trả về
  return { rows: [] };
};

// Controller cho phân tích dữ liệu lịch sử và đề xuất chăm sóc
const historicalAnalysisController = {
  // Phân tích dữ liệu lịch sử và đưa ra đề xuất chăm sóc
  analyzeAndRecommend: async (req, res) => {
    try {
      const { plantId, timeRange = 30 } = req.body; // Mặc định phân tích dữ liệu 30 ngày gần nhất
      
      if (!plantId) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin cây trồng' });
      }
      
      // Giả lập lấy thông tin cây trồng
      const plantInfo = {
        id: plantId,
        name: 'Cây mẫu',
        type: 'indoor',
        optimal_moisture: 60,
        optimal_temperature: 25,
        optimal_humidity: 60,
        optimal_light: 800
      };
      
      // Giả lập dữ liệu cảm biến lịch sử
      const sensorData = generateMockSensorData(timeRange);
      
      // Giả lập lịch sử tưới
      const wateringHistory = generateMockWateringHistory(timeRange);
      
      // Giả lập lịch sử phân tích ảnh
      const imageAnalysisHistory = generateMockImageAnalysisHistory(timeRange);
      
      // Phân tích dữ liệu và đưa ra đề xuất
      const analysis = analyzeHistoricalData(plantInfo, sensorData, wateringHistory, imageAnalysisHistory);
      
      // Giả lập lưu kết quả phân tích
      console.log(`[Mock] Đã lưu kết quả phân tích cho cây ${plantId}`);
      
      return res.json({
        success: true,
        plantId,
        plantInfo: {
          id: plantInfo.id,
          name: plantInfo.name,
          type: plantInfo.type
        },
        analysis
      });
      
    } catch (error) {
      console.error('Lỗi khi phân tích dữ liệu lịch sử:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi phân tích dữ liệu lịch sử',
        details: error.message
      });
    }
  },
  
  // Lấy lịch sử phân tích
  getAnalysisHistory: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { limit = 10 } = req.query;
      
      if (!plantId) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin cây trồng' });
      }
      
      // Lấy lịch sử phân tích từ mock database
      const history = await getAnalysisHistoryFromDB(plantId, parseInt(limit));
      
      // Thêm thông tin thời gian phân tích dễ đọc
      const historyWithReadableTime = history.map(item => ({
        ...item,
        readable_time: item.created_at.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
      
      return res.json({
        success: true,
        plantId,
        history: historyWithReadableTime
      });
      
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử phân tích:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi lấy lịch sử phân tích',
        details: error.message
      });
    }
  }
};

// Tạo dữ liệu cảm biến giả lập
function generateMockSensorData(days) {
  const data = [];
  const now = Date.now();
  
  for (let i = 0; i < days; i++) {
    const dayOffset = days - i;
    const timestamp = new Date(now - dayOffset * 24 * 60 * 60 * 1000);
    
    // Tạo dữ liệu với xu hướng và biến động
    const baseTemp = 25 + Math.sin(i / 5) * 3;
    const baseHumidity = 55 + Math.sin(i / 7) * 10;
    const baseMoisture = 60 - i * 0.5 + Math.sin(i / 3) * 5;
    const baseLight = 700 + Math.sin(i / 4) * 300;
    
    // Thêm nhiễu ngẫu nhiên
    data.push({
      timestamp,
      soil_moisture: Math.max(20, Math.min(90, baseMoisture + (Math.random() - 0.5) * 10)),
      temperature: Math.max(18, Math.min(35, baseTemp + (Math.random() - 0.5) * 2)),
      humidity: Math.max(30, Math.min(80, baseHumidity + (Math.random() - 0.5) * 5)),
      light: Math.max(100, Math.min(1200, baseLight + (Math.random() - 0.5) * 100))
    });
  }
  
  return data;
}

// Tạo lịch sử tưới giả lập
function generateMockWateringHistory(days) {
  const data = [];
  const now = Date.now();
  
  // Tạo lịch sử tưới không đều đặn
  const wateringDays = [1, 4, 7, 10, 13, 16, 20, 24, 28];
  
  for (const day of wateringDays) {
    if (day <= days) {
      const dayOffset = days - day;
      data.push({
        timestamp: new Date(now - dayOffset * 24 * 60 * 60 * 1000),
        duration: 30 + Math.floor(Math.random() * 30),
        amount: 100 + Math.floor(Math.random() * 100),
        type: Math.random() > 0.3 ? 'manual' : 'scheduled'
      });
    }
  }
  
  return data;
}

// Tạo lịch sử phân tích ảnh giả lập
function generateMockImageAnalysisHistory(days) {
  const data = [];
  const now = Date.now();
  
  // Các tình trạng cây có thể có
  const conditions = [
    'Khỏe mạnh',
    'Khỏe mạnh',
    'Thiếu nước',
    'Khỏe mạnh',
    'Thiếu dinh dưỡng',
    'Khỏe mạnh',
    'Khỏe mạnh',
    'Bị sâu bệnh',
    'Khỏe mạnh'
  ];
  
  // Tạo lịch sử phân tích ảnh
  for (let i = 0; i < Math.min(conditions.length, Math.floor(days / 3)); i++) {
    const dayOffset = days - i * 3;
    data.push({
      created_at: new Date(now - dayOffset * 24 * 60 * 60 * 1000),
      condition: conditions[i],
      health_score: conditions[i] === 'Khỏe mạnh' ? 80 + Math.random() * 20 : 40 + Math.random() * 30
    });
  }
  
  return data;
}

// Phân tích dữ liệu lịch sử và đưa ra đề xuất
function analyzeHistoricalData(plantInfo, sensorData, wateringHistory, imageAnalysisHistory) {
  // Kết quả phân tích
  const analysis = {
    summary: {
      overallHealth: 0, // 0-100
      healthTrend: 'stable', // improving, stable, declining
      criticalIssues: [],
      positiveAspects: []
    },
    soilMoisture: analyzeSoilMoisture(sensorData, plantInfo),
    temperature: analyzeTemperature(sensorData, plantInfo),
    humidity: analyzeHumidity(sensorData, plantInfo),
    light: analyzeLight(sensorData, plantInfo),
    watering: analyzeWatering(wateringHistory, sensorData, plantInfo),
    plantCondition: analyzePlantCondition(imageAnalysisHistory),
    recommendations: []
  };
  
  // Tính điểm sức khỏe tổng thể
  analysis.summary.overallHealth = calculateOverallHealth(analysis);
  
  // Xác định xu hướng sức khỏe
  analysis.summary.healthTrend = determineHealthTrend(sensorData, imageAnalysisHistory);
  
  // Xác định vấn đề nghiêm trọng
  analysis.summary.criticalIssues = identifyCriticalIssues(analysis);
  
  // Xác định khía cạnh tích cực
  analysis.summary.positiveAspects = identifyPositiveAspects(analysis);
  
  // Tạo đề xuất chăm sóc
  analysis.recommendations = generateRecommendations(analysis, plantInfo);
  
  return analysis;
}

// Phân tích độ ẩm đất
function analyzeSoilMoisture(sensorData, plantInfo) {
  if (!sensorData || sensorData.length === 0) {
    return {
      average: null,
      min: null,
      max: null,
      trend: 'unknown',
      status: 'unknown',
      issues: []
    };
  }
  
  // Lấy dữ liệu độ ẩm đất
  const moistureData = sensorData.map(data => data.soil_moisture || 0);
  
  // Tính toán thống kê
  const average = calculateAverage(moistureData);
  const min = Math.min(...moistureData);
  const max = Math.max(...moistureData);
  
  // Xác định xu hướng
  const trend = determineTrend(moistureData);
  
  // Ngưỡng độ ẩm đất tối ưu (có thể điều chỉnh theo loại cây)
  const optimalMoisture = plantInfo.optimal_moisture || 60;
  const lowThreshold = optimalMoisture * 0.7; // 70% của độ ẩm tối ưu
  const highThreshold = optimalMoisture * 1.3; // 130% của độ ẩm tối ưu
  
  // Xác định trạng thái
  let status = 'optimal';
  const issues = [];
  
  if (average < lowThreshold) {
    status = 'low';
    issues.push('Độ ẩm đất trung bình thấp hơn mức tối ưu');
    
    if (min < lowThreshold * 0.5) {
      issues.push('Có thời điểm độ ẩm đất rất thấp, có thể gây hại cho cây');
    }
  } else if (average > highThreshold) {
    status = 'high';
    issues.push('Độ ẩm đất trung bình cao hơn mức tối ưu');
    
    if (max > highThreshold * 1.5) {
      issues.push('Có thời điểm độ ẩm đất rất cao, có thể gây úng cho cây');
    }
  }
  
  // Phát hiện biến động lớn
  const fluctuation = max - min;
  if (fluctuation > optimalMoisture * 0.5) {
    issues.push('Độ ẩm đất có biến động lớn, cần ổn định chế độ tưới');
  }
  
  return {
    average,
    min,
    max,
    trend,
    status,
    issues
  };
}

// Phân tích nhiệt độ
function analyzeTemperature(sensorData, plantInfo) {
  if (!sensorData || sensorData.length === 0) {
    return {
      average: null,
      min: null,
      max: null,
      trend: 'unknown',
      status: 'unknown',
      issues: []
    };
  }
  
  // Lấy dữ liệu nhiệt độ
  const temperatureData = sensorData.map(data => data.temperature || 0);
  
  // Tính toán thống kê
  const average = calculateAverage(temperatureData);
  const min = Math.min(...temperatureData);
  const max = Math.max(...temperatureData);
  
  // Xác định xu hướng
  const trend = determineTrend(temperatureData);
  
  // Ngưỡng nhiệt độ tối ưu (có thể điều chỉnh theo loại cây)
  const optimalTemp = plantInfo.optimal_temperature || 25;
  const lowThreshold = optimalTemp - 5;
  const highThreshold = optimalTemp + 5;
  
  // Xác định trạng thái
  let status = 'optimal';
  const issues = [];
  
  if (average < lowThreshold) {
    status = 'low';
    issues.push('Nhiệt độ trung bình thấp hơn mức tối ưu');
    
    if (min < lowThreshold - 10) {
      issues.push('Có thời điểm nhiệt độ rất thấp, có thể gây hại cho cây');
    }
  } else if (average > highThreshold) {
    status = 'high';
    issues.push('Nhiệt độ trung bình cao hơn mức tối ưu');
    
    if (max > highThreshold + 10) {
      issues.push('Có thời điểm nhiệt độ rất cao, có thể gây hại cho cây');
    }
  }
  
  // Phát hiện biến động lớn
  const fluctuation = max - min;
  if (fluctuation > 15) {
    issues.push('Nhiệt độ có biến động lớn, cần ổn định môi trường');
  }
  
  return {
    average,
    min,
    max,
    trend,
    status,
    issues
  };
}

// Phân tích độ ẩm không khí
function analyzeHumidity(sensorData, plantInfo) {
  if (!sensorData || sensorData.length === 0) {
    return {
      average: null,
      min: null,
      max: null,
      trend: 'unknown',
      status: 'unknown',
      issues: []
    };
  }
  
  // Lấy dữ liệu độ ẩm không khí
  const humidityData = sensorData.map(data => data.humidity || 0);
  
  // Tính toán thống kê
  const average = calculateAverage(humidityData);
  const min = Math.min(...humidityData);
  const max = Math.max(...humidityData);
  
  // Xác định xu hướng
  const trend = determineTrend(humidityData);
  
  // Ngưỡng độ ẩm không khí tối ưu (có thể điều chỉnh theo loại cây)
  const optimalHumidity = plantInfo.optimal_humidity || 60;
  const lowThreshold = optimalHumidity * 0.7;
  const highThreshold = optimalHumidity * 1.3;
  
  // Xác định trạng thái
  let status = 'optimal';
  const issues = [];
  
  if (average < lowThreshold) {
    status = 'low';
    issues.push('Độ ẩm không khí trung bình thấp hơn mức tối ưu');
    
    if (min < lowThreshold * 0.5) {
      issues.push('Có thời điểm độ ẩm không khí rất thấp, có thể gây hại cho cây');
    }
  } else if (average > highThreshold) {
    status = 'high';
    issues.push('Độ ẩm không khí trung bình cao hơn mức tối ưu');
    
    if (max > highThreshold * 1.5) {
      issues.push('Có thời điểm độ ẩm không khí rất cao, có thể gây hại cho cây');
    }
  }
  
  return {
    average,
    min,
    max,
    trend,
    status,
    issues
  };
}

// Phân tích ánh sáng
function analyzeLight(sensorData, plantInfo) {
  if (!sensorData || sensorData.length === 0 || !sensorData[0].light) {
    return {
      average: null,
      min: null,
      max: null,
      trend: 'unknown',
      status: 'unknown',
      issues: []
    };
  }
  
  // Lấy dữ liệu ánh sáng
  const lightData = sensorData.map(data => data.light || 0);
  
  // Tính toán thống kê
  const average = calculateAverage(lightData);
  const min = Math.min(...lightData);
  const max = Math.max(...lightData);
  
  // Xác định xu hướng
  const trend = determineTrend(lightData);
  
  // Ngưỡng ánh sáng tối ưu (có thể điều chỉnh theo loại cây)
  const optimalLight = plantInfo.optimal_light || 800;
  const lowThreshold = optimalLight * 0.7;
  const highThreshold = optimalLight * 1.3;
  
  // Xác định trạng thái
  let status = 'optimal';
  const issues = [];
  
  if (average < lowThreshold) {
    status = 'low';
    issues.push('Cường độ ánh sáng trung bình thấp hơn mức tối ưu');
    
    if (min < lowThreshold * 0.5) {
      issues.push('Có thời điểm cường độ ánh sáng rất thấp, cây có thể thiếu ánh sáng');
    }
  } else if (average > highThreshold) {
    status = 'high';
    issues.push('Cường độ ánh sáng trung bình cao hơn mức tối ưu');
    
    if (max > highThreshold * 1.5) {
      issues.push('Có thời điểm cường độ ánh sáng rất cao, có thể gây cháy lá');
    }
  }
  
  return {
    average,
    min,
    max,
    trend,
    status,
    issues
  };
}

// Phân tích lịch sử tưới
function analyzeWatering(wateringHistory, sensorData, plantInfo) {
  if (!wateringHistory || wateringHistory.length === 0) {
    return {
      frequency: null,
      averageDuration: null,
      pattern: 'unknown',
      effectiveness: 'unknown',
      issues: []
    };
  }
  
  // Tính toán tần suất tưới (số lần/tuần)
  const days = 7;
  const totalWaterings = wateringHistory.length;
  const frequency = (totalWaterings / days) * 7;
  
  // Tính toán thời lượng tưới trung bình
  const durations = wateringHistory.map(entry => entry.duration || 0);
  const averageDuration = calculateAverage(durations);
  
  // Xác định mẫu tưới
  const pattern = determineWateringPattern(wateringHistory);
  
  // Đánh giá hiệu quả tưới
  const effectiveness = evaluateWateringEffectiveness(wateringHistory, sensorData);
  
  // Xác định vấn đề
  const issues = [];
  
  // Kiểm tra tần suất tưới
  const optimalFrequency = getOptimalWateringFrequency(plantInfo);
  if (frequency < optimalFrequency * 0.7) {
    issues.push('Tần suất tưới thấp hơn mức khuyến nghị');
  } else if (frequency > optimalFrequency * 1.3) {
    issues.push('Tần suất tưới cao hơn mức khuyến nghị');
  }
  
  // Kiểm tra thời lượng tưới
  const optimalDuration = getOptimalWateringDuration(plantInfo);
  if (averageDuration < optimalDuration * 0.7) {
    issues.push('Thời lượng tưới trung bình thấp hơn mức khuyến nghị');
  } else if (averageDuration > optimalDuration * 1.3) {
    issues.push('Thời lượng tưới trung bình cao hơn mức khuyến nghị');
  }
  
  // Kiểm tra hiệu quả tưới
  if (effectiveness === 'poor') {
    issues.push('Hiệu quả tưới kém, độ ẩm đất không cải thiện đáng kể sau khi tưới');
  }
  
  return {
    frequency,
    averageDuration,
    pattern,
    effectiveness,
    issues
  };
}

// Phân tích tình trạng cây qua lịch sử phân tích ảnh
function analyzePlantCondition(imageAnalysisHistory) {
  if (!imageAnalysisHistory || imageAnalysisHistory.length === 0) {
    return {
      latestCondition: null,
      trend: 'unknown',
      issues: []
    };
  }
  
  // Lấy tình trạng cây mới nhất
  const latestAnalysis = imageAnalysisHistory[imageAnalysisHistory.length - 1];
  const latestCondition = latestAnalysis.condition;
  
  // Xác định xu hướng sức khỏe cây
  const healthScores = imageAnalysisHistory.map(analysis => analysis.health_score || 0);
  const trend = determineTrend(healthScores);
  
  // Xác định vấn đề
  const issues = [];
  
  // Kiểm tra tình trạng cây
  if (latestCondition !== 'Khỏe mạnh') {
    issues.push(`Tình trạng cây hiện tại: ${latestCondition}`);
  }
  
  // Kiểm tra xu hướng sức khỏe
  if (trend === 'decreasing') {
    issues.push('Sức khỏe cây có xu hướng giảm');
  }
  
  // Kiểm tra các vấn đề lặp lại
  const conditions = imageAnalysisHistory.map(analysis => analysis.condition);
  const conditionCounts = {};
  
  conditions.forEach(condition => {
    if (condition !== 'Khỏe mạnh') {
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
    }
  });
  
  for (const [condition, count] of Object.entries(conditionCounts)) {
    if (count >= 3) {
      issues.push(`Vấn đề "${condition}" xuất hiện ${count} lần, cần xử lý triệt để`);
    }
  }
  
  return {
    latestCondition,
    trend,
    issues
  };
}

// Tính điểm sức khỏe tổng thể
function calculateOverallHealth(analysis) {
  let score = 100;
  
  // Trừ điểm cho mỗi vấn đề
  const allIssues = [
    ...(analysis.soilMoisture?.issues || []),
    ...(analysis.temperature?.issues || []),
    ...(analysis.humidity?.issues || []),
    ...(analysis.light?.issues || []),
    ...(analysis.watering?.issues || []),
    ...(analysis.plantCondition?.issues || [])
  ];
  
  // Trừ điểm cho mỗi vấn đề
  score -= allIssues.length * 5;
  
  // Trừ điểm nếu tình trạng cây không khỏe mạnh
  if (analysis.plantCondition?.latestCondition && analysis.plantCondition.latestCondition !== 'Khỏe mạnh') {
    score -= 20;
  }
  
  // Trừ điểm nếu xu hướng sức khỏe giảm
  if (analysis.plantCondition?.trend === 'decreasing') {
    score -= 10;
  }
  
  // Đảm bảo điểm nằm trong khoảng 0-100
  return Math.max(0, Math.min(100, score));
}

// Xác định xu hướng sức khỏe
function determineHealthTrend(sensorData, imageAnalysisHistory) {
  if (!sensorData || sensorData.length === 0) {
    return 'unknown';
  }
  
  // Nếu có lịch sử phân tích ảnh, sử dụng điểm sức khỏe
  if (imageAnalysisHistory && imageAnalysisHistory.length >= 3) {
    const healthScores = imageAnalysisHistory.map(analysis => analysis.health_score || 0);
    return determineTrend(healthScores);
  }
  
  // Nếu không có lịch sử phân tích ảnh, sử dụng dữ liệu cảm biến
  // Lấy dữ liệu độ ẩm đất
  const moistureData = sensorData.map(data => data.soil_moisture || 0);
  const moistureTrend = determineTrend(moistureData);
  
  return moistureTrend;
}

// Xác định vấn đề nghiêm trọng
function identifyCriticalIssues(analysis) {
  const criticalIssues = [];
  
  // Kiểm tra tình trạng cây
  if (analysis.plantCondition?.latestCondition && analysis.plantCondition.latestCondition !== 'Khỏe mạnh') {
    criticalIssues.push(`Tình trạng cây: ${analysis.plantCondition.latestCondition}`);
  }
  
  // Kiểm tra độ ẩm đất
  if (analysis.soilMoisture?.status === 'low') {
    criticalIssues.push('Độ ẩm đất thấp');
  } else if (analysis.soilMoisture?.status === 'high') {
    criticalIssues.push('Độ ẩm đất cao');
  }
  
  // Kiểm tra nhiệt độ
  if (analysis.temperature?.status === 'low') {
    criticalIssues.push('Nhiệt độ thấp');
  } else if (analysis.temperature?.status === 'high') {
    criticalIssues.push('Nhiệt độ cao');
  }
  
  // Kiểm tra ánh sáng
  if (analysis.light?.status === 'low') {
    criticalIssues.push('Thiếu ánh sáng');
  } else if (analysis.light?.status === 'high') {
    criticalIssues.push('Ánh sáng quá mạnh');
  }
  
  return criticalIssues;
}

// Xác định khía cạnh tích cực
function identifyPositiveAspects(analysis) {
  const positiveAspects = [];
  
  // Kiểm tra tình trạng cây
  if (analysis.plantCondition?.latestCondition === 'Khỏe mạnh') {
    positiveAspects.push('Cây đang khỏe mạnh');
  }
  
  // Kiểm tra xu hướng sức khỏe
  if (analysis.plantCondition?.trend === 'increasing') {
    positiveAspects.push('Sức khỏe cây đang cải thiện');
  }
  
  // Kiểm tra độ ẩm đất
  if (analysis.soilMoisture?.status === 'optimal') {
    positiveAspects.push('Độ ẩm đất ở mức tối ưu');
  }
  
  // Kiểm tra nhiệt độ
  if (analysis.temperature?.status === 'optimal') {
    positiveAspects.push('Nhiệt độ ở mức tối ưu');
  }
  
  // Kiểm tra độ ẩm không khí
  if (analysis.humidity?.status === 'optimal') {
    positiveAspects.push('Độ ẩm không khí ở mức tối ưu');
  }
  
  // Kiểm tra ánh sáng
  if (analysis.light?.status === 'optimal') {
    positiveAspects.push('Ánh sáng ở mức tối ưu');
  }
  
  // Kiểm tra hiệu quả tưới
  if (analysis.watering?.effectiveness === 'good') {
    positiveAspects.push('Chế độ tưới hiệu quả');
  }
  
  return positiveAspects;
}

// Tạo đề xuất chăm sóc
function generateRecommendations(analysis, plantInfo) {
  const recommendations = [];
  
  // Đề xuất về tưới nước
  if (analysis.soilMoisture?.status === 'low') {
    recommendations.push({
      category: 'watering',
      priority: 'high',
      content: 'Tăng tần suất tưới hoặc thời lượng tưới để cải thiện độ ẩm đất'
    });
  } else if (analysis.soilMoisture?.status === 'high') {
    recommendations.push({
      category: 'watering',
      priority: 'high',
      content: 'Giảm tần suất tưới hoặc thời lượng tưới để tránh úng nước'
    });
  }
  
  // Đề xuất về nhiệt độ
  if (analysis.temperature?.status === 'low') {
    recommendations.push({
      category: 'environment',
      priority: 'medium',
      content: 'Tăng nhiệt độ môi trường hoặc di chuyển cây đến nơi ấm hơn'
    });
  } else if (analysis.temperature?.status === 'high') {
    recommendations.push({
      category: 'environment',
      priority: 'medium',
      content: 'Giảm nhiệt độ môi trường hoặc di chuyển cây đến nơi mát hơn'
    });
  }
  
  // Đề xuất về ánh sáng
  if (analysis.light?.status === 'low') {
    recommendations.push({
      category: 'environment',
      priority: 'medium',
      content: 'Tăng cường ánh sáng hoặc di chuyển cây đến nơi có nhiều ánh sáng hơn'
    });
  } else if (analysis.light?.status === 'high') {
    recommendations.push({
      category: 'environment',
      priority: 'medium',
      content: 'Giảm cường độ ánh sáng hoặc di chuyển cây đến nơi có ánh sáng dịu hơn'
    });
  }
  
  // Đề xuất về độ ẩm không khí
  if (analysis.humidity?.status === 'low') {
    recommendations.push({
      category: 'environment',
      priority: 'low',
      content: 'Tăng độ ẩm không khí bằng cách phun sương hoặc sử dụng máy tạo ẩm'
    });
  } else if (analysis.humidity?.status === 'high') {
    recommendations.push({
      category: 'environment',
      priority: 'low',
      content: 'Giảm độ ẩm không khí bằng cách tăng thông gió'
    });
  }
  
  // Đề xuất dựa trên tình trạng cây
  if (analysis.plantCondition?.latestCondition) {
    switch (analysis.plantCondition.latestCondition) {
      case 'Thiếu nước':
        recommendations.push({
          category: 'watering',
          priority: 'high',
          content: 'Tăng lượng nước tưới và tần suất tưới'
        });
        break;
      case 'Thừa nước':
        recommendations.push({
          category: 'watering',
          priority: 'high',
          content: 'Giảm lượng nước tưới và tần suất tưới, đảm bảo đất thoát nước tốt'
        });
        break;
      case 'Bị sâu bệnh':
        recommendations.push({
          category: 'pest',
          priority: 'high',
          content: 'Kiểm tra và xử lý sâu bệnh, có thể sử dụng thuốc trừ sâu hoặc phương pháp tự nhiên'
        });
        break;
      case 'Thiếu dinh dưỡng':
        recommendations.push({
          category: 'nutrition',
          priority: 'high',
          content: 'Bổ sung phân bón hoặc chất dinh dưỡng cho cây'
        });
        break;
    }
  }
  
  // Đề xuất về hiệu quả tưới
  if (analysis.watering?.effectiveness === 'poor') {
    recommendations.push({
      category: 'watering',
      priority: 'medium',
      content: 'Điều chỉnh phương pháp tưới để đảm bảo nước thấm đều vào đất'
    });
  }
  
  // Đề xuất dựa trên xu hướng sức khỏe
  if (analysis.summary.healthTrend === 'declining') {
    recommendations.push({
      category: 'general',
      priority: 'high',
      content: 'Theo dõi sát sao tình trạng cây và điều chỉnh chế độ chăm sóc kịp thời'
    });
  }
  
  // Đề xuất chung
  recommendations.push({
    category: 'general',
    priority: 'low',
    content: 'Tiếp tục theo dõi và ghi lại dữ liệu để cải thiện chế độ chăm sóc'
  });
  
  return recommendations;
}

// Giả lập lưu kết quả phân tích
async function saveAnalysisResult(plantId, analysis) {
  try {
    // Giả lập lưu vào database
    console.log(`[Mock DB] Lưu kết quả phân tích cho cây ${plantId}`);
    
    // Trả về kết quả giả lập
    return {
      id: `analysis_${Date.now()}`,
      plant_id: plantId,
      analysis_data: analysis,
      created_at: new Date()
    };
  } catch (error) {
    console.error('Lỗi khi lưu kết quả phân tích:', error);
    return null;
  }
}

// Giả lập lấy lịch sử phân tích từ database
async function getAnalysisHistoryFromDB(plantId, limit) {
  try {
    console.log(`[Mock DB] Lấy lịch sử phân tích cho cây ${plantId}, giới hạn ${limit} bản ghi`);
    
    // Tạo dữ liệu lịch sử giả lập
    const mockHistory = [];
    const now = Date.now();
    
    for (let i = 0; i < limit; i++) {
      const dayOffset = i * 7; // Mỗi 7 ngày có một bản ghi
      
      mockHistory.push({
        id: `analysis_${i}`,
        plant_id: plantId,
        analysis_data: {
          summary: {
            overallHealth: 70 + Math.floor(Math.random() * 30),
            healthTrend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)],
            criticalIssues: [],
            positiveAspects: ['Độ ẩm đất ở mức tối ưu', 'Nhiệt độ ở mức tối ưu']
          },
          recommendations: [
            {
              category: 'watering',
              priority: 'medium',
              content: 'Duy trì lịch tưới hiện tại'
            }
          ]
        },
        created_at: new Date(now - dayOffset * 24 * 60 * 60 * 1000)
      });
    }
    
    return mockHistory;
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử phân tích:', error);
    return [];
  }
}

// Tính giá trị trung bình của mảng
function calculateAverage(array) {
  if (!array || array.length === 0) return 0;
  return array.reduce((sum, val) => sum + val, 0) / array.length;
}

// Xác định xu hướng của dữ liệu
function determineTrend(data) {
  if (!data || data.length < 3) return 'unknown';
  
  // Chia dữ liệu thành hai nửa
  const half = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, half);
  const secondHalf = data.slice(half);
  
  // Tính giá trị trung bình của mỗi nửa
  const firstAvg = calculateAverage(firstHalf);
  const secondAvg = calculateAverage(secondHalf);
  
  // So sánh giá trị trung bình
  if (secondAvg > firstAvg * 1.05) {
    return 'increasing';
  } else if (secondAvg < firstAvg * 0.95) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

// Xác định mẫu tưới
function determineWateringPattern(wateringHistory) {
  if (!wateringHistory || wateringHistory.length < 5) {
    return 'irregular';
  }
  
  // Tính khoảng thời gian giữa các lần tưới (giờ)
  const intervals = [];
  for (let i = 1; i < wateringHistory.length; i++) {
    const current = new Date(wateringHistory[i].timestamp);
    const previous = new Date(wateringHistory[i - 1].timestamp);
    const diffHours = (current - previous) / (1000 * 60 * 60);
    intervals.push(diffHours);
  }
  
  // Tính độ lệch chuẩn của khoảng thời gian
  const avg = calculateAverage(intervals);
  const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  
  // Nếu độ lệch chuẩn nhỏ, mẫu tưới đều đặn
  if (stdDev < avg * 0.2) {
    return 'regular';
  } else {
    return 'irregular';
  }
}

// Đánh giá hiệu quả tưới
function evaluateWateringEffectiveness(wateringHistory, sensorData) {
  if (!wateringHistory || wateringHistory.length === 0 || !sensorData || sensorData.length === 0) {
    return 'unknown';
  }
  
  // Đếm số lần tưới có hiệu quả
  let effectiveCount = 0;
  let totalCount = 0;
  
  wateringHistory.forEach(watering => {
    const wateringTime = new Date(watering.timestamp);
    
    // Tìm dữ liệu cảm biến trước khi tưới
    const beforeData = sensorData.filter(data => {
      const dataTime = new Date(data.timestamp);
      return dataTime < wateringTime && dataTime > new Date(wateringTime - 3 * 60 * 60 * 1000); // 3 giờ trước
    });
    
    // Tìm dữ liệu cảm biến sau khi tưới
    const afterData = sensorData.filter(data => {
      const dataTime = new Date(data.timestamp);
      return dataTime > wateringTime && dataTime < new Date(wateringTime.getTime() + 3 * 60 * 60 * 1000); // 3 giờ sau
    });
    
    if (beforeData.length > 0 && afterData.length > 0) {
      // Tính độ ẩm đất trung bình trước và sau khi tưới
      const beforeMoisture = calculateAverage(beforeData.map(data => data.soil_moisture || 0));
      const afterMoisture = calculateAverage(afterData.map(data => data.soil_moisture || 0));
      
      // Nếu độ ẩm đất tăng đáng kể, tưới có hiệu quả
      if (afterMoisture > beforeMoisture * 1.1) {
        effectiveCount++;
      }
      
      totalCount++;
    }
  });
  
  // Đánh giá hiệu quả tưới
  if (totalCount === 0) {
    return 'unknown';
  } else if (effectiveCount / totalCount >= 0.7) {
    return 'good';
  } else if (effectiveCount / totalCount >= 0.4) {
    return 'moderate';
  } else {
    return 'poor';
  }
}

// Lấy tần suất tưới tối ưu
function getOptimalWateringFrequency(plantInfo) {
  // Mặc định tưới 3 lần một tuần
  let frequency = 3;
  
  // Điều chỉnh theo loại cây
  const plantType = plantInfo.type || 'unknown';
  
  switch (plantType.toLowerCase()) {
    case 'cactus':
    case 'succulent':
    case 'xương rồng':
    case 'sen đá':
      frequency = 1; // 1 lần/tuần
      break;
    case 'vegetable':
    case 'rau':
    case 'rau xanh':
      frequency = 5; // 5 lần/tuần
      break;
    case 'herb':
    case 'thảo mộc':
      frequency = 4; // 4 lần/tuần
      break;
    case 'flower':
    case 'hoa':
      frequency = 3; // 3 lần/tuần
      break;
    case 'fruit':
    case 'cây ăn quả':
      frequency = 2; // 2 lần/tuần
      break;
    default:
      frequency = 3; // 3 lần/tuần
  }
  
  return frequency;
}

// Lấy thời lượng tưới tối ưu
function getOptimalWateringDuration(plantInfo) {
  // Mặc định tưới 10 phút
  let duration = 10;
  
  // Điều chỉnh theo loại cây
  const plantType = plantInfo.type || 'unknown';
  
  switch (plantType.toLowerCase()) {
    case 'cactus':
    case 'succulent':
    case 'xương rồng':
    case 'sen đá':
      duration = 5; // 5 phút
      break;
    case 'vegetable':
    case 'rau':
    case 'rau xanh':
      duration = 15; // 15 phút
      break;
    case 'herb':
    case 'thảo mộc':
      duration = 8; // 8 phút
      break;
    case 'flower':
    case 'hoa':
      duration = 10; // 10 phút
      break;
    case 'fruit':
    case 'cây ăn quả':
      duration = 20; // 20 phút
      break;
    default:
      duration = 10; // 10 phút
  }
  
  return duration;
}

module.exports = historicalAnalysisController;