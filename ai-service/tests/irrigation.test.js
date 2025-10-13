const axios = require('axios');

const API_URL = 'http://localhost:3001/api/irrigation';

async function testIrrigationPrediction() {
  try {
    console.log('Bắt đầu kiểm thử tính năng dự báo tưới cây...');
    
    // Dữ liệu mẫu để dự báo nhu cầu tưới cây
    const predictionData = {
      plantId: '123',
      sensorData: {
        soilMoisture: 35,
        temperature: 28,
        humidity: 65,
        light: 800
      },
      plantInfo: {
        type: 'indoor',
        species: 'monstera',
        age: 180, // 6 tháng
        lastWatered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 ngày trước
      }
    };
    
    console.log('Đang gửi yêu cầu dự báo tưới cây...');
    const response = await axios.post(`${API_URL}/predict`, predictionData);
    
    // Kiểm tra kết quả
    console.log('Kết quả dự báo:', response.data);
    
    if (response.data && response.data.needsWater !== undefined) {
      console.log('✅ Kiểm thử thành công! API trả về kết quả dự báo.');
    } else {
      console.log('❌ Kiểm thử thất bại! API không trả về kết quả dự báo.');
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
    
    if (Array.isArray(historyResponse.data)) {
      console.log('✅ Kiểm thử thành công! API trả về lịch sử dự báo.');
      console.log('Số lượng bản ghi:', historyResponse.data.length);
    } else {
      console.log('❌ Kiểm thử thất bại! API không trả về lịch sử dự báo.');
    }
    
  } catch (error) {
    console.error('❌ Kiểm thử thất bại!', error.message);
    if (error.response) {
      console.error('Chi tiết lỗi:', error.response.data);
    }
  }
}

// Chạy kiểm thử
testIrrigationPrediction();