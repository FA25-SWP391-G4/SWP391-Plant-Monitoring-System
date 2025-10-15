const axios = require('axios');

const API_URL = 'http://localhost:3001/api/irrigation';

async function testIrrigationPrediction() {
  try {
    console.log('Bắt đầu kiểm thử tính năng dự báo tưới cây thông minh...');
    
    // Dữ liệu mẫu để dự báo nhu cầu tưới cây
    const predictionData = {
      plantId: '123',
      userId: 'user123',
      sensorData: getMockSensorData(),
      plantInfo: getMockPlantInfo(1),
      weatherData: getMockWeatherData()
    };
    
    console.log('Đang gửi yêu cầu dự báo tưới cây...');
    const response = await axios.post(`${API_URL}/predict`, predictionData);
    
    // Kiểm tra kết quả
    console.log('Kết quả dự báo:', response.data);
    
    if (response.data && response.data.prediction && response.data.prediction.needs_watering !== undefined) {
      console.log('✅ Kiểm thử thành công! API trả về kết quả dự báo.');
      console.log(`Cần tưới cây: ${response.data.prediction.needs_watering ? 'Có' : 'Không'}`);
      console.log(`Lượng nước đề xuất: ${response.data.waterAmount || response.data.prediction.water_amount} ml`);
      console.log(`Độ tin cậy: ${response.data.confidence || response.data.prediction.confidence}%`);
      console.log(`Thời điểm tưới tiếp theo: ${response.data.nextWatering || response.data.prediction.next_watering_time}`);
    } else {
      console.log('❌ Kiểm thử thất bại! API không trả về kết quả dự báo.');
    }
    
    // Kiểm tra API dự báo chi tiết
    console.log('\nĐang kiểm tra API dự báo chi tiết...');
    const detailedResponse = await axios.post(`${API_URL}/predict/detailed`, {
      ...predictionData,
      includeFactors: true,
      includeConfidence: true
    });
    
    if (detailedResponse.data && detailedResponse.data.prediction && detailedResponse.data.factors) {
      console.log('✅ Kiểm thử thành công! API trả về kết quả dự báo chi tiết.');
      console.log('Các yếu tố ảnh hưởng:', detailedResponse.data.factors);
    } else {
      console.log('❌ Kiểm thử thất bại! API không trả về kết quả dự báo chi tiết.');
    }
    
    // Kiểm tra API phân tích cảnh báo sớm
    console.log('\nĐang kiểm tra API phân tích cảnh báo sớm...');
    const analysisResponse = await axios.post(`${API_URL}/analyze`, predictionData);
    
    if (analysisResponse.data && analysisResponse.data.alerts) {
      console.log('✅ Kiểm thử thành công! API trả về kết quả phân tích.');
      console.log('Số lượng cảnh báo:', analysisResponse.data.alerts.length);
    } else {
      console.log('❌ Kiểm thử thất bại! API không trả về kết quả phân tích.');
    }
    
    // Kiểm tra API lấy lịch sử dự báo
    console.log('\nĐang kiểm tra API lấy lịch sử dự báo...');
    const historyResponse = await axios.get(`${API_URL}/history/123`);
    
    if (historyResponse.data) {
      console.log('✅ Kiểm thử thành công! API trả về lịch sử dự báo.');
      if (Array.isArray(historyResponse.data)) {
        console.log('Số lượng bản ghi:', historyResponse.data.length);
      } else if (historyResponse.data.predictions && Array.isArray(historyResponse.data.predictions)) {
        console.log('Số lượng bản ghi:', historyResponse.data.predictions.length);
      }
    } else {
      console.log('❌ Kiểm thử thất bại! API không trả về lịch sử dự báo.');
    }
    
    // Kiểm tra API lấy lịch sử dự báo với khoảng thời gian
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();
    
    console.log('\nĐang kiểm tra API lấy lịch sử dự báo với khoảng thời gian...');
    const timeRangeHistoryResponse = await axios.get(
      `${API_URL}/history/123/${startDate.toISOString()}/${endDate.toISOString()}`
    );
    
    if (timeRangeHistoryResponse.data) {
      console.log('✅ Kiểm thử thành công! API trả về lịch sử dự báo theo khoảng thời gian.');
      if (Array.isArray(timeRangeHistoryResponse.data)) {
        console.log('Số lượng bản ghi:', timeRangeHistoryResponse.data.length);
      } else if (timeRangeHistoryResponse.data.predictions && Array.isArray(timeRangeHistoryResponse.data.predictions)) {
        console.log('Số lượng bản ghi:', timeRangeHistoryResponse.data.predictions.length);
      }
    } else {
      console.log('❌ Kiểm thử thất bại! API không trả về lịch sử dự báo theo khoảng thời gian.');
    }
    
  } catch (error) {
    console.error('❌ Kiểm thử thất bại!', error.message);
    if (error.response) {
      console.error('Chi tiết lỗi:', error.response.data);
    }
  }
}

// Hàm tạo dữ liệu cảm biến giả lập
function getMockSensorData() {
  const now = new Date();
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

// Hàm tạo thông tin cây trồng giả lập
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
  
  const plantTypeIndex = (parseInt(plantId) - 1) % plantTypes.length;
  return plantTypes[plantTypeIndex];
}

// Hàm tạo dữ liệu thời tiết giả lập
function getMockWeatherData() {
  return {
    forecast: Array(8).fill(0).map((_, i) => ({
      dt: Math.floor(Date.now() / 1000) + i * 3600,
      main: {
        temp: 20 + Math.floor(Math.random() * 10),
        humidity: 40 + Math.floor(Math.random() * 40)
      },
      weather: [{ main: 'Clear' }],
      rain: Math.random() > 0.7 ? { '3h': Math.random() * 5 } : undefined
    })),
    current: {
      temperature: 20 + Math.floor(Math.random() * 10),
      humidity: 40 + Math.floor(Math.random() * 40),
      weather: 'Clear',
      rain: Math.random() > 0.7 ? Math.random() * 5 : 0
    }
  };
}

// Chạy kiểm thử
testIrrigationPrediction();