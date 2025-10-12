// Controller cho tối ưu lịch tưới tự động - Sử dụng dữ liệu giả lập
const irrigationScheduleController = {
  // Tạo lịch tưới tự động tối ưu
  optimizeSchedule: async (req, res) => {
    try {
      const { plantId, userId, preferences = {} } = req.body;
      
      if (!plantId) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin cây trồng' });
      }
      
      // Lấy dữ liệu cảm biến gần đây
      const sensorData = await getRecentSensorData(plantId);
      
      // Lấy thông tin loại cây
      const plantInfo = await getPlantInfo(plantId);
      
      // Lấy lịch sử tưới
      const wateringHistory = await getWateringHistory(plantId);
      
      // Tối ưu lịch tưới
      const schedule = optimizeIrrigationSchedule(sensorData, plantInfo, wateringHistory, preferences);
      
      // Lưu lịch tưới
      await saveSchedule(userId, plantId, schedule);
      
      return res.json({
        success: true,
        plantId,
        schedule
      });
      
    } catch (error) {
      console.error('Lỗi khi tối ưu lịch tưới:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi tối ưu lịch tưới',
        details: error.message
      });
    }
  },
  
  // Lấy lịch tưới hiện tại
  getSchedule: async (req, res) => {
    try {
      const { plantId } = req.params;
      
      if (!plantId) {
        return res.status(400).json({ error: true, message: 'Thiếu ID cây trồng' });
      }
      
      // Mô phỏng lấy lịch tưới
      const schedule = {
        id: Math.floor(Math.random() * 1000),
        plantId: parseInt(plantId),
        frequency: 3,
        duration: 10,
        times: [
          { hour: 6, minute: 0 },
          { hour: 18, minute: 0 }
        ],
        days: [1, 3, 5],
        enabled: true,
        createdAt: new Date().toISOString(),
        note: 'Lịch tưới hiện tại'
      };
      
      return res.json(schedule);
    } catch (error) {
      console.error('Lỗi khi lấy lịch tưới:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi lấy lịch tưới',
        details: error.message
      });
    }
  },
  
  // Lấy tất cả lịch tưới
  getSchedules: async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Mô phỏng lấy lịch tưới từ database
      const schedules = generateMockSchedules(userId);
      
      return res.json(schedules);
    } catch (error) {
      console.error('Lỗi khi lấy lịch tưới:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi lấy lịch tưới',
        details: error.message
      });
    }
  },
  
  // Tạo lịch tưới mới
  createSchedule: async (req, res) => {
    try {
      const { userId, plantId, schedule } = req.body;
      
      if (!userId || !plantId || !schedule) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin cần thiết' });
      }
      
      // Mô phỏng lưu lịch tưới
      const savedSchedule = {
        id: Math.floor(Math.random() * 1000),
        userId,
        plantId,
        ...schedule,
        createdAt: new Date().toISOString()
      };
      
      return res.json({
        success: true,
        schedule: savedSchedule
      });
    } catch (error) {
      console.error('Lỗi khi tạo lịch tưới:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi tạo lịch tưới',
        details: error.message
      });
    }
  },
  
  // Cập nhật lịch tưới
  updateSchedule: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const updates = req.body;
      
      if (!scheduleId) {
        return res.status(400).json({ error: true, message: 'Thiếu ID lịch tưới' });
      }
      
      // Mô phỏng cập nhật lịch tưới
      const updatedSchedule = {
        id: parseInt(scheduleId),
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      return res.json({
        success: true,
        schedule: updatedSchedule
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật lịch tưới:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi cập nhật lịch tưới',
        details: error.message
      });
    }
  },
  
  // Xóa lịch tưới
  deleteSchedule: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      
      if (!scheduleId) {
        return res.status(400).json({ error: true, message: 'Thiếu ID lịch tưới' });
      }
      
      // Mô phỏng xóa lịch tưới
      return res.json({
        success: true,
        message: `Đã xóa lịch tưới ID: ${scheduleId}`
      });
    } catch (error) {
      console.error('Lỗi khi xóa lịch tưới:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi xóa lịch tưới',
        details: error.message
      });
    }
  },
  
  // Bật/tắt lịch tưới
  toggleSchedule: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const { enabled } = req.body;
      
      if (!scheduleId || enabled === undefined) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin cần thiết' });
      }
      
      // Mô phỏng bật/tắt lịch tưới
      return res.json({
        success: true,
        scheduleId: parseInt(scheduleId),
        enabled,
        message: `Đã ${enabled ? 'bật' : 'tắt'} lịch tưới ID: ${scheduleId}`
      });
    } catch (error) {
      console.error('Lỗi khi bật/tắt lịch tưới:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi bật/tắt lịch tưới',
        details: error.message
      });
    }
  },
  
  // Lấy lịch sử tưới
  getWateringHistory: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!plantId) {
        return res.status(400).json({ error: true, message: 'Thiếu ID cây trồng' });
      }
      
      // Mô phỏng lấy lịch sử tưới
      const history = generateMockWateringHistory(plantId, startDate, endDate);
      
      return res.json(history);
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử tưới:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi lấy lịch sử tưới',
        details: error.message
      });
    }
  }
};

// Hàm mô phỏng lấy dữ liệu cảm biến gần đây
async function getRecentSensorData(plantId) {
  // Mô phỏng dữ liệu cảm biến
  const now = new Date();
  const data = [];
  
  // Tạo dữ liệu giả cho 7 ngày gần nhất
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Tạo dữ liệu ngẫu nhiên cho mỗi ngày
    data.push({
      timestamp: date.toISOString(),
      soilMoisture: Math.floor(Math.random() * 40) + 30, // 30-70%
      temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
      humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
      light: Math.floor(Math.random() * 800) + 200 // 200-1000 lux
    });
  }
  
  console.log(`[MÔ PHỎNG] Đã lấy ${data.length} bản ghi dữ liệu cảm biến cho cây ${plantId}`);
  return data;
}

// Hàm mô phỏng lấy thông tin loại cây
async function getPlantInfo(plantId) {
  // Danh sách các loại cây mẫu
  const plantTypes = [
    {
      id: 1,
      name: 'Cây xương rồng',
      waterNeeds: 'low',
      idealMoisture: 30,
      idealTemperature: 25,
      idealLight: 800
    },
    {
      id: 2,
      name: 'Cây dương xỉ',
      waterNeeds: 'high',
      idealMoisture: 70,
      idealTemperature: 22,
      idealLight: 400
    },
    {
      id: 3,
      name: 'Cây trầu bà',
      waterNeeds: 'medium',
      idealMoisture: 50,
      idealTemperature: 24,
      idealLight: 500
    },
    {
      id: 4,
      name: 'Cây lưỡi hổ',
      waterNeeds: 'low',
      idealMoisture: 40,
      idealTemperature: 23,
      idealLight: 600
    }
  ];
  
  // Chọn loại cây dựa trên ID
  const plantTypeId = (parseInt(plantId) % plantTypes.length);
  const plantInfo = plantTypes[plantTypeId];
  
  console.log(`[MÔ PHỎNG] Đã lấy thông tin cây ${plantInfo.name} cho ID ${plantId}`);
  return plantInfo;
}

// Hàm mô phỏng lấy lịch sử tưới
async function getWateringHistory(plantId) {
  // Mô phỏng lịch sử tưới
  const now = new Date();
  const history = [];
  
  // Tạo lịch sử tưới giả cho 30 ngày gần nhất
  for (let i = 0; i < 10; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 3)); // Tưới 3 ngày/lần
    
    history.push({
      timestamp: date.toISOString(),
      duration: Math.floor(Math.random() * 10) + 5, // 5-15 phút
      amount: Math.floor(Math.random() * 500) + 200, // 200-700ml
      automatic: Math.random() > 0.3 // 70% tự động, 30% thủ công
    });
  }
  
  console.log(`[MÔ PHỎNG] Đã lấy ${history.length} bản ghi lịch sử tưới cho cây ${plantId}`);
  return history;
}

// Hàm mô phỏng tối ưu lịch tưới
function optimizeIrrigationSchedule(sensorData, plantInfo, wateringHistory, preferences) {
  console.log('[MÔ PHỎNG] Đang tối ưu lịch tưới...');
  
  // Tính toán giá trị trung bình từ dữ liệu cảm biến
  const avgSoilMoisture = sensorData.reduce((sum, data) => sum + data.soilMoisture, 0) / sensorData.length;
  const avgTemperature = sensorData.reduce((sum, data) => sum + data.temperature, 0) / sensorData.length;
  const avgHumidity = sensorData.reduce((sum, data) => sum + data.humidity, 0) / sensorData.length;
  const avgLight = sensorData.reduce((sum, data) => sum + data.light, 0) / sensorData.length;
  
  // Xác định ngưỡng độ ẩm lý tưởng dựa trên loại cây
  const moistureThreshold = plantInfo.idealMoisture;
  
  // Xác định mẫu tưới dựa trên lịch sử
  const wateringPattern = analyzeWateringPattern(wateringHistory);
  
  // Tính toán tần suất tưới dựa trên điều kiện môi trường
  const baseFrequency = calculateBaseFrequency(plantInfo, avgTemperature, avgHumidity);
  
  // Điều chỉnh tần suất dựa trên độ ẩm đất hiện tại
  let adjustedFrequency = baseFrequency;
  if (avgSoilMoisture < moistureThreshold * 0.8) {
    // Tăng tần suất nếu đất quá khô
    adjustedFrequency = Math.max(1, baseFrequency - 1);
  } else if (avgSoilMoisture > moistureThreshold * 1.2) {
    // Giảm tần suất nếu đất quá ẩm
    adjustedFrequency = baseFrequency + 1;
  }
  
  // Tính toán thời lượng tưới
  const wateringDuration = calculateWateringDuration(plantInfo, avgSoilMoisture, moistureThreshold);
  
  // Tạo lịch tưới
  const schedule = createSchedule(adjustedFrequency, wateringDuration, wateringPattern, preferences);
  
  return schedule;
}

// Tạo lịch tưới mặc định
function createDefaultSchedule(plantInfo, preferences) {
  // Mặc định tưới 3 lần một tuần
  const frequency = 3;
  const duration = 10; // 10 phút
  
  // Thời gian tưới mặc định
  const defaultTimes = [
    { hour: 6, minute: 0 }, // 6:00 sáng
    { hour: 18, minute: 0 } // 6:00 chiều
  ];
  
  // Ngày tưới mặc định (thứ 2, thứ 4, thứ 6)
  const defaultDays = [1, 3, 5];
  
  // Tạo lịch tưới
  const schedule = {
    frequency,
    duration,
    times: preferences.times || defaultTimes,
    days: preferences.days || defaultDays,
    enabled: true,
    createdAt: new Date().toISOString(),
    note: 'Lịch tưới mặc định do không có đủ dữ liệu cảm biến'
  };
  
  return schedule;
}

// Phân tích mẫu tưới từ lịch sử
function analyzeWateringPattern(wateringHistory) {
  // Mặc định
  const pattern = {
    preferredDays: [1, 3, 5], // Thứ 2, 4, 6
    preferredTimes: [
      { hour: 6, minute: 0 }, // 6:00 sáng
      { hour: 18, minute: 0 } // 6:00 chiều
    ]
  };
  
  // Nếu có lịch sử tưới, phân tích để tìm mẫu
  if (wateringHistory && wateringHistory.length > 0) {
    // Đếm số lần tưới theo ngày trong tuần
    const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Chủ nhật - Thứ 7
    
    // Đếm số lần tưới theo giờ trong ngày
    const hourCount = Array(24).fill(0);
    
    wateringHistory.forEach(entry => {
      const date = new Date(entry.timestamp);
      const day = date.getDay(); // 0 = Chủ nhật, 1-6 = Thứ 2 - Thứ 7
      const hour = date.getHours();
      
      dayCount[day]++;
      hourCount[hour]++;
    });
    
    // Tìm 3 ngày được tưới nhiều nhất
    const topDays = dayCount
      .map((count, day) => ({ day, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.day);
    
    // Tìm 2 giờ được tưới nhiều nhất
    const topHours = hourCount
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);
    
    // Cập nhật mẫu tưới
    if (topDays.length > 0) {
      pattern.preferredDays = topDays;
    }
    
    if (topHours.length > 0) {
      pattern.preferredTimes = topHours.map(item => ({ hour: item.hour, minute: 0 }));
    }
  }
  
  return pattern;
}

// Tính toán tần suất tưới cơ bản
function calculateBaseFrequency(plantInfo, temperature, humidity) {
  // Tần suất tưới dựa trên nhu cầu nước của cây
  let baseFrequency;
  
  switch (plantInfo.waterNeeds) {
    case 'low':
      baseFrequency = 7; // 1 lần/tuần
      break;
    case 'medium':
      baseFrequency = 3; // 2-3 lần/tuần
      break;
    case 'high':
      baseFrequency = 2; // 3-4 lần/tuần
      break;
    default:
      baseFrequency = 3;
  }
  
  // Điều chỉnh dựa trên nhiệt độ
  if (temperature > 30) {
    baseFrequency = Math.max(1, baseFrequency - 1); // Tăng tần suất khi nóng
  } else if (temperature < 15) {
    baseFrequency += 1; // Giảm tần suất khi lạnh
  }
  
  // Điều chỉnh dựa trên độ ẩm không khí
  if (humidity < 40) {
    baseFrequency = Math.max(1, baseFrequency - 1); // Tăng tần suất khi khô
  } else if (humidity > 80) {
    baseFrequency += 1; // Giảm tần suất khi ẩm
  }
  
  return baseFrequency;
}

// Tính toán thời lượng tưới
function calculateWateringDuration(plantInfo, currentMoisture, targetMoisture) {
  // Thời lượng cơ bản dựa trên loại cây
  let baseDuration;
  
  switch (plantInfo.waterNeeds) {
    case 'low':
      baseDuration = 5; // 5 phút
      break;
    case 'medium':
      baseDuration = 10; // 10 phút
      break;
    case 'high':
      baseDuration = 15; // 15 phút
      break;
    default:
      baseDuration = 10;
  }
  
  // Điều chỉnh dựa trên chênh lệch độ ẩm
  const moistureGap = targetMoisture - currentMoisture;
  
  if (moistureGap > 20) {
    // Tăng thời lượng nếu đất quá khô
    return baseDuration + 5;
  } else if (moistureGap < 0) {
    // Giảm thời lượng nếu đất đã đủ ẩm
    return Math.max(1, baseDuration - 5);
  }
  
  return baseDuration;
}

// Tạo lịch tưới dựa trên các tham số
function createSchedule(frequency, duration, pattern, preferences) {
  // Sử dụng mẫu tưới hoặc tùy chọn người dùng
  const days = preferences.days || pattern.preferredDays;
  const times = preferences.times || pattern.preferredTimes;
  
  // Tạo lịch tưới
  const schedule = {
    frequency,
    duration,
    times,
    days,
    enabled: true,
    createdAt: new Date().toISOString(),
    note: 'Lịch tưới được tối ưu dựa trên dữ liệu cảm biến và lịch sử tưới'
  };
  
  return schedule;
}

// Hàm mô phỏng lưu lịch tưới
async function saveSchedule(userId, plantId, schedule) {
  console.log(`[MÔ PHỎNG] Đã lưu lịch tưới cho user ${userId}, cây ${plantId}`);
  return {
    id: Math.floor(Math.random() * 1000),
    userId,
    plantId,
    ...schedule,
    savedAt: new Date().toISOString()
  };
}

// Hàm mô phỏng tạo lịch tưới
function generateMockSchedules(userId) {
  const schedules = [];
  
  // Tạo 3 lịch tưới mẫu
  for (let i = 1; i <= 3; i++) {
    schedules.push({
      id: i,
      userId: userId,
      plantId: i,
      plantName: `Cây mẫu ${i}`,
      frequency: i === 1 ? 2 : (i === 2 ? 3 : 7), // 2, 3 hoặc 7 ngày/lần
      duration: i * 5, // 5, 10 hoặc 15 phút
      times: [
        { hour: 6, minute: 0 },
        { hour: 18, minute: 0 }
      ],
      days: i === 1 ? [1, 3, 5] : (i === 2 ? [2, 4, 6] : [0]), // Các ngày khác nhau
      enabled: i !== 3, // 2 cái đầu bật, cái cuối tắt
      createdAt: new Date().toISOString(),
      note: `Lịch tưới mẫu ${i}`
    });
  }
  
  return schedules;
}

// Hàm mô phỏng tạo lịch sử tưới
function generateMockWateringHistory(plantId, startDate, endDate) {
  const history = [];
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Mặc định 30 ngày
  const end = endDate ? new Date(endDate) : now;
  
  // Tạo lịch sử tưới giả
  let currentDate = new Date(start);
  while (currentDate <= end) {
    // Tưới 2-3 ngày/lần
    currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 2) + 2);
    
    if (currentDate <= end) {
      history.push({
        id: history.length + 1,
        plantId: parseInt(plantId),
        timestamp: currentDate.toISOString(),
        duration: Math.floor(Math.random() * 10) + 5, // 5-15 phút
        amount: Math.floor(Math.random() * 500) + 200, // 200-700ml
        automatic: Math.random() > 0.3, // 70% tự động, 30% thủ công
        success: Math.random() > 0.1 // 90% thành công
      });
    }
  }
  
  return history;
}

module.exports = irrigationScheduleController;