// Dịch vụ giả lập dữ liệu cảm biến và thông tin cây trồng
const sensorService = {
  // Lấy lịch sử tưới nước
  getWateringHistory: async (plantId, limit = 5) => {
    // Tạo dữ liệu giả lập lịch sử tưới nước
    const history = [];
    const now = new Date();
    
    for (let i = 0; i < limit; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 2)); // Mỗi 2 ngày tưới một lần
      
      history.push({
        date: date.toISOString(),
        amount: Math.floor(Math.random() * 200) + 100, // 100-300ml
        duration: Math.floor(Math.random() * 10) + 5 // 5-15 giây
      });
    }
    
    return history;
  },
  // Lấy thông tin cây trồng theo ID
  getPlantInfo: async (plantId) => {
    // Trong thực tế, dữ liệu này sẽ được lấy từ cơ sở dữ liệu
    const mockPlants = {
      '1': {
        id: 1,
        name: 'Cây xương rồng',
        plant_type: 'Cây sa mạc',
        optimal_moisture: 20,
        optimal_temperature: 25,
        optimal_light: 5000,
        optimalSoilMoisture: { min: 15, max: 25 },
        optimalTemp: { min: 20, max: 30 },
        optimalLight: { min: 4000, max: 6000 },
        optimalHumidity: { min: 20, max: 40 },
        optimalPH: { min: 6.0, max: 7.5 },
        description: 'Cây xương rồng cần ít nước, chịu được khô hạn và ánh nắng mạnh.',
        careInstructions: 'Tưới nước ít, 1-2 lần/tháng. Đặt ở nơi có nhiều ánh sáng.'
      },
      '2': {
        id: 2,
        name: 'Cây lưỡi hổ',
        plant_type: 'Cây trong nhà',
        optimal_moisture: 40,
        optimal_temperature: 22,
        optimal_light: 2000,
        optimalSoilMoisture: { min: 30, max: 50 },
        optimalTemp: { min: 18, max: 26 },
        optimalLight: { min: 1500, max: 2500 },
        optimalHumidity: { min: 30, max: 50 },
        optimalPH: { min: 5.5, max: 7.0 },
        description: 'Cây lưỡi hổ dễ chăm sóc, có khả năng lọc không khí và cần ít nước.',
        careInstructions: 'Tưới nước khi đất khô, khoảng 1 lần/tuần. Có thể sống trong điều kiện ánh sáng thấp.'
      },
      '3': {
        id: 3,
        name: 'Cây trầu bà',
        plant_type: 'Cây trong nhà',
        optimal_moisture: 60,
        optimal_temperature: 24,
        optimal_light: 1500,
        optimalSoilMoisture: { min: 50, max: 70 },
        optimalTemp: { min: 20, max: 28 },
        optimalLight: { min: 1000, max: 2000 },
        optimalHumidity: { min: 50, max: 70 },
        optimalPH: { min: 5.5, max: 7.0 },
        description: 'Cây trầu bà ưa bóng râm, cần độ ẩm cao và tưới nước thường xuyên.',
        careInstructions: 'Tưới nước 2-3 lần/tuần. Đặt ở nơi có ánh sáng gián tiếp.'
      },
      '4': {
        id: 4,
        name: 'Cây hoa hồng',
        plant_type: 'Cây hoa',
        optimal_moisture: 55,
        optimal_temperature: 23,
        optimal_light: 4000,
        optimalSoilMoisture: { min: 45, max: 65 },
        optimalTemp: { min: 18, max: 28 },
        optimalLight: { min: 3500, max: 5000 },
        optimalHumidity: { min: 40, max: 60 },
        optimalPH: { min: 6.0, max: 7.0 },
        description: 'Cây hoa hồng cần nhiều ánh sáng, tưới nước đều đặn và bón phân định kỳ.',
        careInstructions: 'Tưới nước đều đặn, bón phân mỗi 2 tuần trong mùa sinh trưởng.'
      }
    };
    
    // Trả về thông tin cây hoặc thông tin cây mặc định nếu không tìm thấy
    if (mockPlants[plantId]) {
      return mockPlants[plantId];
    } else {
      // Thay vì ném lỗi, trả về thông tin cây không xác định
      return {
        id: 0,
        name: 'Cây không xác định',
        plant_type: 'Không có thông tin',
        optimal_moisture: 50,
        optimal_temperature: 25,
        optimal_light: 3000,
        optimalSoilMoisture: { min: 40, max: 60 },
        optimalTemp: { min: 20, max: 30 },
        optimalLight: { min: 2000, max: 4000 },
        optimalHumidity: { min: 40, max: 60 },
        optimalPH: { min: 6.0, max: 7.0 },
        description: 'Không có thông tin chi tiết về loại cây này trong hệ thống.',
        careInstructions: 'Vui lòng cung cấp thêm thông tin về loại cây để nhận hướng dẫn chăm sóc cụ thể.',
        isUnknownPlant: true
      };
    }
  },
  
  // Lấy dữ liệu cảm biến mới nhất theo ID cây
  getLatestSensorData: async (plantId) => {
    // Tạo dữ liệu giả lập với các giá trị ngẫu nhiên nhưng hợp lý
    const getRandomValue = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Lấy thông tin cây để tạo dữ liệu phù hợp
    try {
      const plantInfo = await sensorService.getPlantInfo(plantId);
      
      // Tạo dữ liệu cảm biến dựa trên thông tin cây
      // Với một số trường hợp, tạo dữ liệu ngoài ngưỡng tối ưu để test phản hồi
      const isOptimal = getRandomValue(1, 10) > 3; // 70% trường hợp là tối ưu
      
      let moisture, temperature, light, humidity;
      
      if (isOptimal) {
        // Dữ liệu trong ngưỡng tối ưu (với độ dao động nhỏ)
        moisture = getRandomValue(plantInfo.optimal_moisture - 5, plantInfo.optimal_moisture + 5);
        temperature = getRandomValue(plantInfo.optimal_temperature - 2, plantInfo.optimal_temperature + 2);
        light = getRandomValue(plantInfo.optimal_light - 500, plantInfo.optimal_light + 500);
        humidity = getRandomValue(50, 70); // Độ ẩm không khí thường ở mức 50-70%
      } else {
        // Dữ liệu ngoài ngưỡng tối ưu (để test phản hồi cảnh báo)
        const scenario = getRandomValue(1, 4);
        
        switch (scenario) {
          case 1: // Quá khô
            moisture = getRandomValue(5, plantInfo.optimal_moisture - 15);
            temperature = getRandomValue(plantInfo.optimal_temperature, plantInfo.optimal_temperature + 5);
            light = getRandomValue(plantInfo.optimal_light, plantInfo.optimal_light * 1.5);
            humidity = getRandomValue(20, 40);
            break;
          case 2: // Quá ẩm
            moisture = getRandomValue(plantInfo.optimal_moisture + 15, 95);
            temperature = getRandomValue(plantInfo.optimal_temperature - 3, plantInfo.optimal_temperature);
            light = getRandomValue(plantInfo.optimal_light * 0.5, plantInfo.optimal_light);
            humidity = getRandomValue(75, 95);
            break;
          case 3: // Quá nóng
            moisture = getRandomValue(plantInfo.optimal_moisture - 10, plantInfo.optimal_moisture);
            temperature = getRandomValue(plantInfo.optimal_temperature + 5, plantInfo.optimal_temperature + 15);
            light = getRandomValue(plantInfo.optimal_light, plantInfo.optimal_light * 2);
            humidity = getRandomValue(30, 50);
            break;
          case 4: // Quá tối
            moisture = getRandomValue(plantInfo.optimal_moisture, plantInfo.optimal_moisture + 10);
            temperature = getRandomValue(plantInfo.optimal_temperature - 5, plantInfo.optimal_temperature);
            light = getRandomValue(plantInfo.optimal_light * 0.2, plantInfo.optimal_light * 0.5);
            humidity = getRandomValue(60, 80);
            break;
        }
      }
      
      return {
        plantId: parseInt(plantId),
        timestamp: new Date().toISOString(),
        moisture: moisture,
        temperature: temperature,
        light: light,
        humidity: humidity
      };
      
    } catch (error) {
      console.error('Lỗi khi tạo dữ liệu cảm biến:', error);
      
      // Trả về dữ liệu mặc định nếu không lấy được thông tin cây
      return {
        plantId: parseInt(plantId),
        timestamp: new Date().toISOString(),
        moisture: getRandomValue(30, 70),
        temperature: getRandomValue(18, 30),
        light: getRandomValue(1000, 5000),
        humidity: getRandomValue(40, 80)
      };
    }
  },
  
  // Lấy lịch sử tưới nước theo ID cây
  getRecentWateringHistory: async (plantId, limit = 5) => {
    // Tạo dữ liệu giả lập lịch sử tưới nước
    const history = [];
    const now = new Date();
    
    for (let i = 0; i < limit; i++) {
      // Tạo thời gian tưới cách nhau 1-3 ngày
      const daysAgo = i * (Math.floor(Math.random() * 3) + 1);
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      
      // Lượng nước tưới từ 100ml đến 500ml
      const amount = Math.floor(Math.random() * 401) + 100;
      
      history.push({
        id: `wh-${plantId}-${i}`,
        plantId: parseInt(plantId),
        timestamp: timestamp.toISOString(),
        amount: amount,
        method: Math.random() > 0.5 ? 'manual' : 'automatic'
      });
    }
    
    return history;
  },
  
  // Lấy danh sách cây trồng
  getPlants: async () => {
    return [
      {
        id: 1,
        name: 'Cây xương rồng',
        plant_type: 'Cây sa mạc'
      },
      {
        id: 2,
        name: 'Cây lưỡi hổ',
        plant_type: 'Cây trong nhà'
      },
      {
        id: 3,
        name: 'Cây trầu bà',
        plant_type: 'Cây trong nhà'
      },
      {
        id: 4,
        name: 'Cây hoa hồng',
        plant_type: 'Cây hoa'
      }
    ];
  }
};

module.exports = sensorService;