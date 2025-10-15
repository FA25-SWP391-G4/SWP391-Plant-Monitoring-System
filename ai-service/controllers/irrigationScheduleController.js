// Controller cho tối ưu lịch tưới tự động
const axios = require('axios');

// Mô phỏng dữ liệu thay vì sử dụng model thực tế
// Các model này sẽ được thay thế bằng mô phỏng

// Biến toàn cục để lưu trữ kết nối với các thiết bị IoT
let iotDeviceConnections = {};
let iotDeviceStatuses = {};

// Khởi tạo kết nối với thiết bị IoT
async function initializeIoTConnection() {
  try {
    console.log('Khởi tạo kết nối với các thiết bị IoT...');
    // Trong môi trường thực tế, đây sẽ là kết nối đến MQTT broker hoặc IoT hub
    // Mô phỏng kết nối thành công
    return true;
  } catch (error) {
    console.error('Lỗi khi khởi tạo kết nối IoT:', error);
    return false;
  }
}

// Kiểm tra kết nối với thiết bị IoT
async function checkIoTDeviceConnection(deviceId) {
  try {
    // Validate deviceId
    if (!deviceId) {
      console.error('Lỗi: deviceId không được cung cấp');
      return {
        connected: false,
        message: 'Thiết bị không hợp lệ: ID thiết bị không được cung cấp',
        error: true,
        errorCode: 'INVALID_DEVICE_ID'
      };
    }
    
    // Kiểm tra xem đã có kết nối với thiết bị này chưa và kết nối còn mới (dưới 5 phút)
    if (iotDeviceConnections[deviceId] && 
        iotDeviceConnections[deviceId].lastChecked && 
        (Date.now() - iotDeviceConnections[deviceId].lastChecked) < 5 * 60 * 1000) {
      console.log(`Sử dụng kết nối đã lưu trong cache cho thiết bị ${deviceId}`);
      return iotDeviceConnections[deviceId];
    }
    
    // Mô phỏng kiểm tra kết nối với thiết bị IoT
    console.log(`Kiểm tra kết nối với thiết bị IoT ${deviceId}...`);
    
    // Trong môi trường thực tế, đây sẽ là lệnh gọi đến API của IoT service
    // Mô phỏng kết nối thành công với xác suất 80%
    const isConnected = Math.random() > 0.2;
    
    const deviceStatus = {
      deviceId,
      connected: isConnected,
      lastChecked: Date.now(),
      message: isConnected ? 'Kết nối thành công' : 'Không thể kết nối đến thiết bị',
      batteryLevel: Math.floor(Math.random() * 100),
      signalStrength: Math.floor(Math.random() * 5) + 1,
      firmwareVersion: '1.2.3',
      lastMaintenance: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Lưu trạng thái kết nối vào cache
    iotDeviceConnections[deviceId] = deviceStatus;
    
    return deviceStatus;
  } catch (error) {
    console.error(`Lỗi khi kiểm tra kết nối với thiết bị IoT ${deviceId}:`, error);
    return {
      deviceId,
      connected: false,
      lastChecked: Date.now(),
      message: `Lỗi khi kiểm tra kết nối: ${error.message}`,
      error: true,
      errorCode: 'CONNECTION_ERROR'
    };
  }
}

// Gửi lệnh điều khiển đến thiết bị IoT
async function sendCommandToIoTDevice(deviceId, command, params = {}) {
  try {
    // Validate deviceId và command
    if (!deviceId || !command) {
      console.error('Lỗi: deviceId hoặc command không được cung cấp');
      return {
        success: false,
        message: 'Thiếu thông tin thiết bị hoặc lệnh điều khiển',
        error: true,
        errorCode: 'INVALID_PARAMETERS'
      };
    }
    
    // Kiểm tra kết nối với thiết bị
    const deviceStatus = await checkIoTDeviceConnection(deviceId);
    if (!deviceStatus.connected) {
      return {
        success: false,
        message: `Không thể gửi lệnh: ${deviceStatus.message}`,
        error: true,
        errorCode: 'DEVICE_DISCONNECTED'
      };
    }
    
    console.log(`Gửi lệnh "${command}" đến thiết bị IoT ${deviceId} với tham số:`, params);
    
    // Trong môi trường thực tế, đây sẽ là lệnh gọi đến API của IoT service
    // Mô phỏng gửi lệnh thành công với xác suất 90%
    const isSuccess = Math.random() > 0.1;
    
    // Lưu lệnh cuối cùng vào trạng thái thiết bị
    iotDeviceStatuses[deviceId] = {
      lastCommand: command,
      lastCommandParams: params,
      lastCommandTime: new Date().toISOString(),
      lastCommandSuccess: isSuccess
    };
    
    if (isSuccess) {
      return {
        success: true,
        message: `Đã gửi lệnh "${command}" thành công`,
        timestamp: new Date().toISOString(),
        commandId: `cmd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        deviceId,
        command,
        params
      };
    } else {
      return {
        success: false,
        message: 'Không thể gửi lệnh đến thiết bị',
        error: true,
        errorCode: 'COMMAND_FAILED',
        deviceId,
        command,
        params
      };
    }
  } catch (error) {
    console.error(`Lỗi khi gửi lệnh đến thiết bị IoT ${deviceId}:`, error);
    return {
      success: false,
      message: `Lỗi khi gửi lệnh: ${error.message}`,
      error: true,
      errorCode: 'COMMAND_ERROR',
      deviceId,
      command,
      params
    };
  }
}

// Lấy dữ liệu cảm biến mới nhất
async function getLatestSensorData(plantId) {
  try {
    // Mô phỏng dữ liệu cảm biến thay vì truy vấn database
    
    // Nếu không có dữ liệu, tạo dữ liệu mô phỏng
    console.log(`Không tìm thấy dữ liệu cảm biến cho cây ${plantId}, tạo dữ liệu mô phỏng`);
    
    const mockData = [];
    const now = new Date();
    
    // Tạo 10 bản ghi dữ liệu mô phỏng
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date(now.getTime() - i * 3600 * 1000); // Mỗi giờ một bản ghi
      
      mockData.push({
        plantId,
        timestamp,
        soilMoisture: Math.floor(Math.random() * 40) + 30, // 30-70%
        temperature: Math.floor(Math.random() * 10) + 20, // 20-30°C
        humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
        light: Math.floor(Math.random() * 500) + 500, // 500-1000 lux
        batteryLevel: Math.floor(Math.random() * 30) + 70 // 70-100%
      });
    }
    
    console.log(`[MÔ PHỎNG] Đã tạo ${mockData.length} bản ghi dữ liệu cảm biến cho cây ${plantId}`);
    return mockData;
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu cảm biến cho cây ${plantId}:`, error);
    
    // Trả về dữ liệu mô phỏng trong trường hợp lỗi
    const mockData = [{
      plantId,
      timestamp: new Date(),
      soilMoisture: 50,
      temperature: 25,
      humidity: 65,
      light: 800,
      batteryLevel: 90,
      isSimulated: true
    }];
    
    console.log(`[MÔ PHỎNG] Đã tạo dữ liệu cảm biến mô phỏng cho cây ${plantId} do lỗi`);
    return mockData;
  }
}

// Lấy thông tin cây trồng
async function getPlantInfo(plantId) {
  try {
    // Mô phỏng thông tin cây trồng thay vì truy vấn database
    
    // Nếu không có thông tin, tạo thông tin mô phỏng
    console.log(`Không tìm thấy thông tin cây ${plantId}, tạo thông tin mô phỏng`);
    
    const plantTypes = ['Cây cảnh', 'Rau', 'Hoa', 'Cây ăn quả', 'Cây thuốc'];
    const waterNeeds = ['low', 'medium', 'high'];
    const growthStages = ['seedling', 'vegetative', 'flowering', 'fruiting'];
    
    const mockPlant = {
      _id: plantId,
      name: `Cây ${plantId}`,
      type: plantTypes[Math.floor(Math.random() * plantTypes.length)],
      waterNeeds: waterNeeds[Math.floor(Math.random() * waterNeeds.length)],
      growthStage: growthStages[Math.floor(Math.random() * growthStages.length)],
      plantedDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
      lastWatered: new Date(Date.now() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000),
      isSimulated: true
    };
    
    console.log(`[MÔ PHỎNG] Đã tạo thông tin mô phỏng cho cây ${plantId}: ${mockPlant.name}`);
    return mockPlant;
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin cây ${plantId}:`, error);
    
    // Trả về thông tin mô phỏng trong trường hợp lỗi
    const mockPlant = {
      _id: plantId,
      name: `Cây ${plantId}`,
      type: 'Cây cảnh',
      waterNeeds: 'medium',
      growthStage: 'vegetative',
      plantedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastWatered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isSimulated: true,
      isErrorFallback: true
    };
    
    console.log(`[MÔ PHỎNG] Đã tạo thông tin mô phỏng cho cây ${plantId} do lỗi`);
    return mockPlant;
  }
}

// Lấy lịch sử tưới
async function getWateringHistory(plantId, startDate, endDate) {
  try {
    // Mô phỏng lịch sử tưới thay vì truy vấn database
    
    // Nếu không có lịch sử, tạo lịch sử mô phỏng
    console.log(`Không tìm thấy lịch sử tưới cho cây ${plantId}, tạo lịch sử mô phỏng`);
    
    const mockHistory = [];
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : now;
    
    // Tạo lịch sử tưới giả
    let currentDate = new Date(start);
    while (currentDate <= end) {
      // Tưới 2-3 ngày/lần
      if (Math.random() > 0.6) {
        mockHistory.push({
          plantId,
          timestamp: new Date(currentDate),
          duration: Math.floor(Math.random() * 10) + 5, // 5-15 phút
          amount: Math.floor(Math.random() * 500) + 200, // 200-700ml
          automatic: Math.random() > 0.3, // 70% tự động, 30% thủ công
          status: Math.random() > 0.1 ? 'completed' : (Math.random() > 0.5 ? 'failed' : 'interrupted') // 90% thành công
        });
      }
      
      // Tăng ngày lên 1
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`[MÔ PHỎNG] Đã tạo ${mockHistory.length} bản ghi lịch sử tưới cho cây ${plantId}`);
    return mockHistory;
  } catch (error) {
    console.error(`Lỗi khi lấy lịch sử tưới cho cây ${plantId}:`, error);
    
    // Trả về lịch sử mô phỏng trong trường hợp lỗi
    const mockHistory = [];
    const now = new Date();
    
    // Tạo 5 bản ghi lịch sử mô phỏng
    for (let i = 0; i < 5; i++) {
      const timestamp = new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000); // Mỗi 2 ngày một bản ghi
      
      mockHistory.push({
        plantId,
        timestamp,
        duration: 10,
        amount: 500,
        automatic: true,
        status: 'completed',
        isSimulated: true
      });
    }
    
    console.log(`[MÔ PHỎNG] Đã tạo ${mockHistory.length} bản ghi lịch sử tưới cho cây ${plantId}`);
    return mockHistory;
  }
}

// Hàm mô phỏng lấy dự báo thời tiết
async function getWeatherForecast(location) {
  // Mô phỏng dự báo thời tiết
  const forecast = [];
  const now = new Date();
  
  // Tạo dự báo thời tiết giả cho 7 ngày tới
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      temperature: Math.floor(Math.random() * 10) + 25, // 25-35°C
      humidity: Math.floor(Math.random() * 30) + 60, // 60-90%
      precipitation: Math.random() > 0.7 ? Math.random() * 20 : 0, // 30% cơ hội mưa
      description: Math.random() > 0.7 ? 'Có mưa' : (Math.random() > 0.5 ? 'Nhiều mây' : 'Nắng')
    });
  }
  
  console.log(`[MÔ PHỎNG] Đã lấy dự báo thời tiết cho ${location}`);
  return forecast;
}

// Hàm tối ưu lịch tưới sử dụng AI
async function optimizeWithAI(sensorData, plantInfo, wateringHistory, weatherForecast, preferences) {
  console.log('[AI] Đang tối ưu lịch tưới sử dụng AI...');
  
  // Phân tích dữ liệu đầu vào
  const latestSensorData = sensorData && sensorData.length > 0 ? sensorData[0] : null;
  const soilMoisture = latestSensorData ? latestSensorData.soilMoisture : 50;
  const temperature = latestSensorData ? latestSensorData.temperature : 25;
  const humidity = latestSensorData ? latestSensorData.humidity : 60;
  
  // Tính toán tốc độ mất nước dựa trên dữ liệu lịch sử và điều kiện hiện tại
  const moistureLossRate = calculateMoistureLossRate(wateringHistory, latestSensorData, temperature);
  
  // Xác định ngưỡng độ ẩm tối ưu dựa trên loại cây
  const optimalMoistureThreshold = getOptimalMoistureThreshold(plantInfo);
  
  // Tính toán số ngày giữa các lần tưới dựa trên tốc độ mất nước và ngưỡng độ ẩm
  let daysUntilNextWatering = 1;
  if (moistureLossRate > 0) {
    daysUntilNextWatering = Math.max(1, Math.floor((soilMoisture - optimalMoistureThreshold) / (moistureLossRate * 24)));
  }
  
  // Điều chỉnh dựa trên giai đoạn phát triển của cây
  if (plantInfo.growthStage === 'seedling') {
    daysUntilNextWatering = Math.max(1, Math.floor(daysUntilNextWatering * 0.8)); // Cây non cần tưới thường xuyên hơn
  } else if (plantInfo.growthStage === 'mature') {
    daysUntilNextWatering = Math.floor(daysUntilNextWatering * 1.2); // Cây trưởng thành chịu hạn tốt hơn
  }
  
  // Điều chỉnh dựa trên tùy chọn người dùng
  if (preferences.waterSaving) {
    daysUntilNextWatering = Math.floor(daysUntilNextWatering * 1.1); // Tiết kiệm nước
  }
  
  // Tạo lịch tưới cho 2 tuần tới
  const schedule = [];
  let nextWateringDate = new Date();
  
  for (let i = 0; i < 5; i++) { // Tạo 5 lần tưới tiếp theo
    // Tính ngày tưới tiếp theo
    nextWateringDate = new Date(nextWateringDate.getTime() + daysUntilNextWatering * 24 * 60 * 60 * 1000);
    
    // Kiểm tra dự báo thời tiết, nếu có mưa thì dời lịch tưới
    const weatherForDay = weatherForecast.find(w => w.date === nextWateringDate.toISOString().split('T')[0]);
    if (weatherForDay && weatherForDay.precipitation > 5) {
      nextWateringDate = new Date(nextWateringDate.getTime() + 24 * 60 * 60 * 1000); // Dời lịch 1 ngày
      continue;
    }
    
    // Xác định thời gian tưới tối ưu trong ngày
    let optimalHour = 6; // Mặc định 6h sáng
    if (preferences.preferMorning) {
      optimalHour = 7;
    } else if (preferences.preferEvening) {
      optimalHour = 18;
    } else {
      // Dựa vào nhiệt độ, nếu nóng thì tưới sớm hoặc muộn để tránh bay hơi
      if (temperature > 30) {
        optimalHour = 5; // Sáng sớm khi trời mát
      } else if (temperature < 15) {
        optimalHour = 10; // Trưa khi trời ấm hơn
      }
    }
    
    // Tính lượng nước cần tưới dựa trên nhu cầu của cây và điều kiện môi trường
    const waterAmount = calculateWaterAmount(plantInfo, temperature, humidity, soilMoisture);
    
    // Tính thời gian tưới dựa trên lượng nước
    const wateringDuration = Math.ceil(waterAmount / 100); // Giả sử 100ml/phút
    
    // Thêm vào lịch tưới
    schedule.push({
      date: nextWateringDate.toISOString().split('T')[0],
      time: `${optimalHour.toString().padStart(2, '0')}:00`,
      duration: wateringDuration,
      amount: waterAmount,
      reason: generateWateringReason(plantInfo, soilMoisture, temperature, humidity)
    });
  }
  
  return schedule;
}

// Hàm tính tốc độ mất nước dựa trên lịch sử tưới và điều kiện hiện tại
function calculateMoistureLossRate(wateringHistory, sensorData, temperature) {
  if (!wateringHistory || wateringHistory.length < 2 || !sensorData) {
    // Nếu không có đủ dữ liệu lịch sử, sử dụng giá trị mặc định dựa trên nhiệt độ
    return temperature > 30 ? 5 : (temperature > 25 ? 3 : 2); // %/giờ
  }
  
  // Tìm 2 lần tưới gần nhất
  const sortedHistory = [...wateringHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const lastWatering = sortedHistory[0];
  const previousWatering = sortedHistory[1];
  
  // Tính thời gian giữa 2 lần tưới (giờ)
  const hoursBetweenWaterings = (new Date(lastWatering.timestamp) - new Date(previousWatering.timestamp)) / (1000 * 60 * 60);
  
  // Tính tốc độ mất nước (%/giờ)
  const moistureLoss = lastWatering.moistureBefore - previousWatering.moistureAfter;
  const lossRate = moistureLoss / hoursBetweenWaterings;
  
  // Điều chỉnh dựa trên nhiệt độ hiện tại
  const temperatureAdjustment = temperature > 30 ? 1.5 : (temperature > 25 ? 1.2 : 1);
  
  return Math.max(0.5, lossRate * temperatureAdjustment);
}

// Hàm xác định ngưỡng độ ẩm tối ưu dựa trên loại cây
function getOptimalMoistureThreshold(plantInfo) {
  if (!plantInfo) return 30; // Giá trị mặc định
  
  switch (plantInfo.waterNeeds) {
    case 'low':
      return 20; // Cây ít nước
    case 'medium':
      return 30; // Cây trung bình
    case 'high':
      return 40; // Cây nhiều nước
    default:
      return 30;
  }
}

// Hàm tính lượng nước cần tưới
function calculateWaterAmount(plantInfo, temperature, humidity, soilMoisture) {
  if (!plantInfo) return 300; // Giá trị mặc định
  
  // Lượng nước cơ bản dựa trên nhu cầu của cây
  let baseAmount = plantInfo.waterNeeds === 'low' ? 200 : (plantInfo.waterNeeds === 'medium' ? 400 : 600);
  
  // Điều chỉnh dựa trên nhiệt độ (nhiệt độ cao cần nhiều nước hơn)
  const tempFactor = temperature > 30 ? 1.3 : (temperature > 25 ? 1.1 : 1);
  
  // Điều chỉnh dựa trên độ ẩm không khí (độ ẩm thấp cần nhiều nước hơn)
  const humidityFactor = humidity < 40 ? 1.2 : (humidity < 60 ? 1.1 : 1);
  
  // Điều chỉnh dựa trên độ ẩm đất hiện tại
  const moistureFactor = soilMoisture < 20 ? 1.3 : (soilMoisture < 30 ? 1.2 : 1);
  
  // Tính lượng nước cuối cùng
  return Math.round(baseAmount * tempFactor * humidityFactor * moistureFactor);
}

// Hàm tạo lý do tưới nước
function generateWateringReason(plantInfo, soilMoisture, temperature, humidity) {
  if (soilMoisture < 20) {
    return "Độ ẩm đất quá thấp, cần tưới để tránh cây bị khô héo";
  } else if (temperature > 30) {
    return "Nhiệt độ cao làm tăng tốc độ bay hơi nước, cần bổ sung nước";
  } else if (humidity < 40) {
    return "Độ ẩm không khí thấp làm tăng tốc độ thoát hơi nước, cần tưới bổ sung";
  } else {
    return "Tưới nước định kỳ để duy trì độ ẩm đất tối ưu cho cây";
  }
}

// Hàm tối ưu lịch tưới sử dụng luật
function optimizeWithRules(sensorData, plantInfo, wateringHistory, weatherForecast, preferences) {
  // Mô phỏng tối ưu lịch tưới dựa trên luật
  console.log('[MÔ PHỎNG] Đang tối ưu lịch tưới sử dụng luật...');
  
  // Tạo lịch tưới dựa trên loại cây và dữ liệu cảm biến
  const schedule = [];
  
  // Xác định tần suất tưới dựa trên loại cây
  let frequency = 1; // Số ngày giữa các lần tưới
  
  if (plantInfo.waterNeeds === 'low') {
    frequency = 3; // Cây ít nước: 3 ngày/lần
  } else if (plantInfo.waterNeeds === 'medium') {
    frequency = 2; // Cây trung bình: 2 ngày/lần
  } else {
    frequency = 1; // Cây nhiều nước: 1 ngày/lần
  }
  
  // Điều chỉnh tần suất dựa trên dữ liệu cảm biến
  if (sensorData && sensorData.length > 0) {
    const latestData = sensorData[0];
    if (latestData.soilMoisture > 60) {
      frequency += 1; // Đất đủ ẩm, tăng thời gian giữa các lần tưới
    } else if (latestData.soilMoisture < 30) {
      frequency = Math.max(1, frequency - 1); // Đất khô, giảm thời gian giữa các lần tưới
    }
  }
  
  // Điều chỉnh dựa trên preferences
  if (preferences.waterSaving) {
    frequency += 1; // Tiết kiệm nước, tăng thời gian giữa các lần tưới
  }
  
  // Tạo lịch tưới
  const days = [1, 3, 5]; // Mặc định: thứ 2, 4, 6
  if (frequency === 1) {
    days.push(0, 2, 4, 6); // Hàng ngày
  } else if (frequency === 2) {
    days.push(0, 4); // 3 ngày/tuần
  }
  
  return {
    id: Math.floor(Math.random() * 1000),
    plantId: plantInfo.id,
    frequency: frequency,
    days: days,
    times: [
      { hour: 6, minute: 0 }
    ],
    duration: plantInfo.waterNeeds === 'low' ? 5 : (plantInfo.waterNeeds === 'medium' ? 10 : 15),
    amount: plantInfo.waterNeeds === 'low' ? 200 : (plantInfo.waterNeeds === 'medium' ? 400 : 600),
    schedule: days.map(day => ({
      day,
      time: '06:00',
      duration: plantInfo.waterNeeds === 'low' ? 5 : (plantInfo.waterNeeds === 'medium' ? 10 : 15),
      amount: plantInfo.waterNeeds === 'low' ? 200 : (plantInfo.waterNeeds === 'medium' ? 400 : 600)
    }))
  };
}

// Hàm lưu lịch tưới
async function saveSchedule(userId, plantId, schedule) {
  // Mô phỏng lưu lịch tưới vào database
  console.log(`[MÔ PHỎNG] Đã lưu lịch tưới cho cây ${plantId}, người dùng ${userId}`);
  return {
    id: Math.floor(Math.random() * 1000),
    userId,
    plantId,
    schedule,
    createdAt: new Date().toISOString()
  };
}

// Hàm tạo dữ liệu mẫu cho lịch tưới
function generateMockSchedules(userId) {
  const schedules = [];
  
  // Tạo 5 lịch tưới mẫu
  for (let i = 1; i <= 5; i++) {
    schedules.push({
      id: i,
      userId: parseInt(userId),
      plantId: i,
      frequency: i % 3 + 1, // 1-3 ngày/lần
      duration: (i % 3 + 1) * 5, // 5-15 phút
      times: [
        { hour: 6, minute: 0 }
      ],
      days: i % 2 === 0 ? [1, 3, 5] : [0, 2, 4, 6], // Các ngày trong tuần (0 = Chủ nhật)
      enabled: Math.random() > 0.2, // 80% đang bật
      createdAt: new Date().toISOString(),
      note: `Lịch tưới cho cây ${i}`
    });
  }
  
  return schedules;
}

// Hàm chuẩn bị dữ liệu đầu vào cho mô hình
function prepareInputData(sensorData, plantInfo, wateringHistory, weatherForecast, preferences) {
  // Mô phỏng việc chuẩn bị dữ liệu
  const inputData = [];
  
  // Thêm dữ liệu cảm biến
  if (sensorData && sensorData.length > 0) {
    const latestData = sensorData[0];
    inputData.push(
      latestData.soilMoisture / 100, // Chuẩn hóa về 0-1
      latestData.temperature / 50,   // Chuẩn hóa về 0-1
      latestData.humidity / 100,     // Chuẩn hóa về 0-1
      latestData.light / 1000        // Chuẩn hóa về 0-1
    );
  } else {
    // Giá trị mặc định nếu không có dữ liệu
    inputData.push(0.5, 0.5, 0.5, 0.5);
  }
  
  // Thêm thông tin cây
  inputData.push(
    plantInfo.waterNeeds === 'low' ? 0 : (plantInfo.waterNeeds === 'medium' ? 0.5 : 1),
    plantInfo.growthStage === 'seedling' ? 0 : (plantInfo.growthStage === 'vegetative' ? 0.5 : 1)
  );
  
  // Thêm thông tin thời tiết
  if (weatherForecast && weatherForecast.length > 0) {
    const tomorrowForecast = weatherForecast[0];
    inputData.push(
      tomorrowForecast.temperature / 50,   // Chuẩn hóa về 0-1
      tomorrowForecast.humidity / 100,     // Chuẩn hóa về 0-1
      tomorrowForecast.precipitation > 0 ? 1 : 0  // Có mưa hay không
    );
  } else {
    // Giá trị mặc định nếu không có dữ liệu
    inputData.push(0.5, 0.5, 0);
  }
  
  // Thêm tùy chọn người dùng
  inputData.push(
    preferences.waterSaving ? 1 : 0,
    preferences.preferMorning ? 1 : 0
  );
  
  return inputData;
}

// Export controller
const irrigationScheduleController = {
  // Tối ưu lịch tưới
  optimizeSchedule: async (req, res) => {
    try {
      const { plantId, userId, preferences = {} } = req.body;
      
      if (!plantId) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin cây trồng' });
      }
      
      // Lấy dữ liệu cần thiết
      const sensorData = await getLatestSensorData(plantId);
      const plantInfo = await getPlantInfo(plantId);
      const wateringHistory = await getWateringHistory(plantId);
      const weatherForecast = await getWeatherForecast(plantInfo.location || 'Hà Nội');
      
      // Tối ưu lịch tưới
      const schedule = await optimizeWithAI(sensorData, plantInfo, wateringHistory, weatherForecast, preferences);
      
      // Lưu lịch tưới
      const savedSchedule = await saveSchedule(userId, plantId, schedule);
      
      return res.json({
        success: true,
        schedule: savedSchedule,
        plant: {
          id: plantInfo._id,
          name: plantInfo.name,
          type: plantInfo.type,
          waterNeeds: plantInfo.waterNeeds
        },
        factors: {
          soilMoisture: sensorData[0].soilMoisture,
          temperature: sensorData[0].temperature,
          humidity: sensorData[0].humidity,
          weather: weatherForecast[0].description
        }
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
  
  // Tự động hóa quá trình tưới cây
  automateIrrigation: async (req, res) => {
    try {
      const { plantId, deviceId, scheduleId, preferences = {}, moistureThreshold, enableRealTimeMonitoring = true } = req.body;
      
      if (!plantId || !deviceId) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin cây trồng hoặc thiết bị' });
      }
      
      // Kiểm tra kết nối với thiết bị IoT
      const deviceStatus = await checkIoTDeviceConnection(deviceId);
      
      if (!deviceStatus.connected) {
        return res.status(400).json({
          error: true,
          message: 'Không thể kết nối với thiết bị IoT',
          deviceStatus
        });
      }
      
      // Lấy dữ liệu cảm biến và thông tin cây trồng
      const sensorData = await getLatestSensorData(plantId);
      const plantInfo = await getPlantInfo(plantId);
      const wateringHistory = await getWateringHistory(plantId);
      const weatherForecast = await getWeatherForecast(plantInfo.location || 'Hà Nội');
      
      // Lấy lịch tưới (từ scheduleId hoặc tạo mới)
      let schedule;
      if (scheduleId) {
        // Trong thực tế, sẽ lấy lịch tưới từ database
        schedule = {
          id: scheduleId,
          plantId,
          frequency: 2,
          days: [1, 3, 5],
          times: [{ hour: 6, minute: 0 }],
          duration: 10,
          amount: 400
        };
      } else {
        // Tạo lịch tưới mới sử dụng AI
        schedule = await optimizeWithAI(sensorData, plantInfo, wateringHistory, weatherForecast, preferences);
      }
      
      // Xác định ngưỡng độ ẩm để kích hoạt tưới tự động
      const soilMoistureThreshold = moistureThreshold || getOptimalMoistureThreshold(plantInfo);
      
      // Cấu hình tự động hóa
      const automationConfig = {
        schedule,
        enabled: true,
        soilMoistureThreshold,
        enableRealTimeMonitoring,
        emergencyWateringEnabled: true, // Cho phép tưới khẩn cấp khi độ ẩm quá thấp
        wateringLimits: {
          maxDailyWaterings: 3, // Giới hạn số lần tưới mỗi ngày
          minTimeBetweenWaterings: 8 * 60 * 60 * 1000, // Thời gian tối thiểu giữa các lần tưới (8 giờ)
          maxWaterAmount: plantInfo.waterNeeds === 'low' ? 300 : (plantInfo.waterNeeds === 'medium' ? 600 : 900) // Lượng nước tối đa mỗi ngày (ml)
        },
        weatherAdaptation: true, // Điều chỉnh lịch tưới dựa trên dự báo thời tiết
        notifyUser: true // Thông báo cho người dùng khi tưới
      };
      
      // Gửi lệnh cấu hình đến thiết bị IoT
      const commandResult = await sendCommandToIoTDevice(deviceId, 'configure_automation', automationConfig);
      
      if (!commandResult.success) {
        return res.status(400).json({
          error: true,
          message: 'Không thể cấu hình tưới tự động',
          commandResult
        });
      }
      
      // Lưu cấu hình vào database
      const savedConfig = {
        id: Math.floor(Math.random() * 1000),
        plantId,
        deviceId,
        schedule,
        soilMoistureThreshold,
        enableRealTimeMonitoring,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Thiết lập giám sát thời gian thực nếu được yêu cầu
      if (enableRealTimeMonitoring) {
        await setupRealTimeMonitoring(deviceId, plantId, soilMoistureThreshold);
      }
      
      return res.json({
        success: true,
        message: 'Đã cấu hình tưới tự động thành công',
        config: savedConfig,
        deviceStatus,
        commandResult
      });
      
    } catch (error) {
      console.error('Lỗi khi tự động hóa quá trình tưới cây:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi tự động hóa quá trình tưới cây',
        details: error.message
      });
    }
  },
  
  // Thiết lập giám sát thời gian thực
  setupRealTimeMonitoring: async (req, res) => {
    try {
      const { deviceId, plantId, threshold } = req.body;
      
      if (!deviceId || !plantId) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin thiết bị hoặc cây trồng' });
      }
      
      const result = await setupRealTimeMonitoring(deviceId, plantId, threshold);
      
      return res.json({
        success: true,
        message: 'Đã thiết lập giám sát thời gian thực thành công',
        deviceId,
        plantId,
        result
      });
    } catch (error) {
      console.error('Lỗi khi thiết lập giám sát thời gian thực:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi thiết lập giám sát thời gian thực',
        details: error.message
      });
    }
  },
  
  // Lấy lịch tưới hiện tại
  getSchedule: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { userId } = req.query;
      
      if (!plantId) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin cây trồng' });
      }
      
      // Trong thực tế, sẽ lấy lịch tưới từ database
      // Mô phỏng lấy lịch tưới
      let schedules;
      
      if (userId) {
        schedules = generateMockSchedules(userId);
        schedules = schedules.filter(s => s.plantId.toString() === plantId.toString());
      } else {
        // Tạo một lịch tưới mô phỏng cho cây này
        const plantInfo = await getPlantInfo(plantId);
        
        schedules = [{
          id: Math.floor(Math.random() * 1000),
          plantId,
          frequency: plantInfo.waterNeeds === 'low' ? 3 : (plantInfo.waterNeeds === 'medium' ? 2 : 1),
          days: [1, 3, 5],
          times: [{ hour: 6, minute: 0 }],
          duration: plantInfo.waterNeeds === 'low' ? 5 : (plantInfo.waterNeeds === 'medium' ? 10 : 15),
          amount: plantInfo.waterNeeds === 'low' ? 200 : (plantInfo.waterNeeds === 'medium' ? 400 : 600),
          enabled: true,
          createdAt: new Date().toISOString(),
          note: `Lịch tưới tự động cho ${plantInfo.name}`
        }];
      }
      
      return res.json({
        success: true,
        schedules,
        count: schedules.length
      });
      
    } catch (error) {
      console.error('Lỗi khi lấy lịch tưới:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi lấy lịch tưới',
        details: error.message
      });
    }
  },
  
  // Kiểm tra trạng thái thiết bị IoT
  checkIoTDevice: async (req, res) => {
    try {
      const { deviceId } = req.params;
      
      if (!deviceId) {
        return res.status(400).json({ error: true, message: 'Thiếu ID thiết bị IoT' });
      }
      
      // Kiểm tra kết nối với thiết bị IoT
      const deviceStatus = await checkIoTDeviceConnection(deviceId);
      
      return res.json({
        success: true,
        deviceId,
        status: deviceStatus,
        last_command: iotDeviceStatuses[deviceId] || null
      });
      
    } catch (error) {
      console.error('Lỗi khi kiểm tra thiết bị IoT:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi kiểm tra thiết bị IoT',
        details: error.message
      });
    }
  },
  
  // Điều khiển thiết bị IoT
  controlIoTDevice: async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { command, params } = req.body;
      
      if (!deviceId || !command) {
        return res.status(400).json({ 
          error: true, 
          message: 'Thiếu ID thiết bị IoT hoặc lệnh điều khiển' 
        });
      }
      
      // Gửi lệnh điều khiển đến thiết bị IoT
      const commandResult = await sendCommandToIoTDevice(deviceId, command, params || {});
      
      return res.json({
        success: commandResult.success,
        deviceId,
        command,
        params: params || {},
        result: commandResult
      });
      
    } catch (error) {
      console.error('Lỗi khi điều khiển thiết bị IoT:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi điều khiển thiết bị IoT',
        details: error.message
      });
    }
  }
};

// Thiết lập giám sát thời gian thực cho thiết bị
async function setupRealTimeMonitoring(deviceId, plantId, threshold) {
  try {
    // Kiểm tra kết nối thiết bị
    const deviceStatus = await checkIoTDeviceConnection(deviceId);
    if (!deviceStatus.connected) {
      throw new Error('Không thể kết nối với thiết bị để thiết lập giám sát');
    }
    
    // Lấy thông tin cây trồng
    const plantInfo = await getPlantInfo(plantId);
    
    // Xác định ngưỡng độ ẩm nếu không được cung cấp
    const soilMoistureThreshold = threshold || getOptimalMoistureThreshold(plantInfo);
    
    // Thiết lập cấu hình giám sát
    const monitoringConfig = {
      plantId,
      deviceId,
      soilMoistureThreshold,
      readingInterval: 15 * 60 * 1000, // Đọc dữ liệu mỗi 15 phút
      alertThresholds: {
        soilMoisture: {
          min: soilMoistureThreshold - 5,
          critical: soilMoistureThreshold - 15
        },
        temperature: {
          min: plantInfo.optimalTemperature?.min || 18,
          max: plantInfo.optimalTemperature?.max || 30
        },
        light: {
          min: plantInfo.lightNeeds === 'low' ? 100 : (plantInfo.lightNeeds === 'medium' ? 300 : 600),
          max: plantInfo.lightNeeds === 'low' ? 1000 : (plantInfo.lightNeeds === 'medium' ? 3000 : 5000)
        }
      },
      emergencyActions: {
        enableEmergencyWatering: true,
        notifyUser: true
      }
    };
    
    // Gửi lệnh cấu hình giám sát đến thiết bị
    const commandResult = await sendCommandToIoTDevice(deviceId, 'setup_monitoring', monitoringConfig);
    
    if (!commandResult.success) {
      throw new Error('Không thể thiết lập giám sát thời gian thực: ' + commandResult.message);
    }
    
    // Lưu cấu hình giám sát vào database (mô phỏng)
    const savedMonitoring = {
      id: Math.floor(Math.random() * 1000),
      plantId,
      deviceId,
      config: monitoringConfig,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    return {
      success: true,
      monitoring: savedMonitoring,
      commandResult
    };
  } catch (error) {
    console.error('Lỗi khi thiết lập giám sát thời gian thực:', error);
    throw error;
  }
}

// Xác định ngưỡng độ ẩm tối ưu dựa trên thông tin cây trồng
function getOptimalMoistureThreshold(plantInfo) {
  if (!plantInfo) {
    return 50; // Giá trị mặc định nếu không có thông tin cây trồng
  }
  
  // Xác định ngưỡng dựa trên nhu cầu nước của cây
  switch (plantInfo.waterNeeds) {
    case 'very_low':
      return 30;
    case 'low':
      return 40;
    case 'medium':
      return 55;
    case 'high':
      return 70;
    case 'very_high':
      return 80;
    default:
      return 50;
  }
}

module.exports = irrigationScheduleController;