const db = require('../../config/db');

// Dịch vụ cảm biến kết nối database thật
const sensorService = {
  // Lấy thông tin cây trồng từ database
  getPlantInfo: async (plantId) => {
    try {
      // Tạo bảng plants nếu chưa có
      await sensorService.createPlantsTableIfNotExists();
      
      const query = 'SELECT * FROM plants WHERE id = $1';
      const result = await db.pool.query(query, [plantId]);
      
      if (result.rows.length > 0) {
        const plant = result.rows[0];
        return {
          id: plant.id,
          name: plant.name,
          type: plant.type,
          plant_type: plant.type,
          description: plant.description,
          optimal_moisture: 50,
          optimal_temperature: 25,
          optimal_light: 3000,
          optimalSoilMoisture: { min: 40, max: 60 },
          optimalTemp: { min: 20, max: 30 },
          optimalLight: { min: 2000, max: 4000 },
          optimalHumidity: { min: 40, max: 60 },
          optimalPH: { min: 6.0, max: 7.0 },
          careInstructions: plant.notes || 'Chăm sóc cây theo hướng dẫn chung'
        };
      } else {
        // Trả về cây mặc định nếu không tìm thấy
        return sensorService.getDefaultPlantInfo(plantId);
      }
    } catch (error) {
      console.error('❌ Lỗi khi lấy thông tin cây từ database:', error);
      return sensorService.getDefaultPlantInfo(plantId);
    }
  },

  // Lấy dữ liệu cảm biến mới nhất từ database
  getLatestSensorData: async (plantId) => {
    try {
      // Tạo bảng sensor_data nếu chưa có
      await sensorService.createSensorTableIfNotExists();
      
      const query = `
        SELECT * FROM sensor_data 
        WHERE plant_id = $1 
        ORDER BY timestamp DESC 
        LIMIT 1
      `;
      
      const result = await db.pool.query(query, [plantId]);
      
      if (result.rows.length > 0) {
        const data = result.rows[0];
        return {
          plantId: parseInt(plantId),
          timestamp: data.timestamp,
          temperature: parseFloat(data.temperature),
          soilMoisture: parseFloat(data.soil_moisture),
          humidity: parseFloat(data.humidity),
          lightLevel: parseInt(data.light_level),
          soilPH: parseFloat(data.soil_ph)
        };
      } else {
        // Tạo và lưu dữ liệu mẫu nếu chưa có
        return await sensorService.generateAndSaveSensorData(plantId);
      }
    } catch (error) {
      console.error('❌ Lỗi khi lấy dữ liệu cảm biến từ database:', error);
      return sensorService.generateMockSensorData(plantId);
    }
  },

  // Lấy lịch sử tưới nước từ database
  getWateringHistory: async (plantId, limit = 5) => {
    try {
      // Tạo bảng watering_history nếu chưa có
      await sensorService.createWateringTableIfNotExists();
      
      const query = `
        SELECT * FROM watering_history 
        WHERE plant_id = $1 
        ORDER BY timestamp DESC 
        LIMIT $2
      `;
      
      const result = await db.pool.query(query, [plantId, limit]);
      
      if (result.rows.length > 0) {
        return result.rows.map(row => ({
          id: row.id,
          plantId: row.plant_id,
          amount: row.amount,
          duration: row.duration,
          method: row.method,
          timestamp: row.timestamp,
          date: row.timestamp
        }));
      } else {
        // Tạo lịch sử mẫu nếu chưa có
        return await sensorService.generateAndSaveWateringHistory(plantId, limit);
      }
    } catch (error) {
      console.error('❌ Lỗi khi lấy lịch sử tưới nước từ database:', error);
      return sensorService.generateMockWateringHistory(plantId, limit);
    }
  },

  // Tạo bảng plants nếu chưa tồn tại
  createPlantsTableIfNotExists: async () => {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS plants (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(100),
          description TEXT,
          user_id VARCHAR(255),
          location VARCHAR(255),
          planted_date DATE,
          status VARCHAR(50) DEFAULT 'healthy',
          image_url VARCHAR(500),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      await db.pool.query(createTableQuery);
      
      // Thêm dữ liệu mẫu nếu bảng trống
      const countQuery = 'SELECT COUNT(*) FROM plants';
      const countResult = await db.pool.query(countQuery);
      
      if (parseInt(countResult.rows[0].count) === 0) {
        await sensorService.insertSamplePlants();
      }
    } catch (error) {
      console.error('❌ Lỗi khi tạo bảng plants:', error);
    }
  },

  // Tạo bảng sensor_data nếu chưa tồn tại
  createSensorTableIfNotExists: async () => {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sensor_data (
          id SERIAL PRIMARY KEY,
          plant_id INTEGER,
          temperature DECIMAL(5,2),
          soil_moisture DECIMAL(5,2),
          humidity DECIMAL(5,2),
          light_level INTEGER,
          soil_ph DECIMAL(3,1),
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      await db.pool.query(createTableQuery);
    } catch (error) {
      console.error('❌ Lỗi khi tạo bảng sensor_data:', error);
    }
  },

  // Tạo bảng watering_history nếu chưa tồn tại
  createWateringTableIfNotExists: async () => {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS watering_history (
          id SERIAL PRIMARY KEY,
          plant_id INTEGER,
          amount INTEGER NOT NULL,
          duration INTEGER,
          method VARCHAR(50) DEFAULT 'manual',
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      await db.pool.query(createTableQuery);
    } catch (error) {
      console.error('❌ Lỗi khi tạo bảng watering_history:', error);
    }
  },

  // Thêm cây mẫu vào database
  insertSamplePlants: async () => {
    try {
      const insertQuery = `
        INSERT INTO plants (name, type, description, user_id, location, status, notes)
        VALUES 
          ('Cây Xương Rồng Mini', 'cactus', 'Cây xương rồng nhỏ xinh, dễ chăm sóc', 'user123', 'Bàn làm việc', 'healthy', 'Tưới ít nước, để nơi có ánh sáng'),
          ('Cây Lưỡi Hổ', 'snake_plant', 'Cây lưỡi hổ thanh lọc không khí', 'user123', 'Phòng khách', 'healthy', 'Chịu được bóng râm, tưới 1-2 tuần/lần'),
          ('Cây Trầu Bà', 'pothos', 'Cây trầu bà xanh tươi, dễ sống', 'user123', 'Ban công', 'growing', 'Thích độ ẩm cao, tưới thường xuyên'),
          ('Cây Hoa Hồng Mini', 'rose', 'Hoa hồng mini trong chậu', 'user123', 'Sân vườn', 'flowering', 'Cần nhiều ánh sáng và nước')
        ON CONFLICT DO NOTHING
      `;
      
      await db.pool.query(insertQuery);
      console.log('✅ Đã thêm cây mẫu vào database');
    } catch (error) {
      console.error('❌ Lỗi khi thêm cây mẫu:', error);
    }
  },

  // Tạo và lưu dữ liệu cảm biến mẫu
  generateAndSaveSensorData: async (plantId) => {
    try {
      const sensorData = sensorService.generateMockSensorData(plantId);
      
      const insertQuery = `
        INSERT INTO sensor_data (plant_id, temperature, soil_moisture, humidity, light_level, soil_ph)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        plantId,
        sensorData.temperature,
        sensorData.soilMoisture,
        sensorData.humidity,
        sensorData.lightLevel,
        sensorData.soilPH
      ];
      
      const result = await db.pool.query(insertQuery, values);
      console.log('✅ Đã tạo dữ liệu cảm biến mới cho cây', plantId);
      
      return sensorData;
    } catch (error) {
      console.error('❌ Lỗi khi tạo dữ liệu cảm biến:', error);
      return sensorService.generateMockSensorData(plantId);
    }
  },

  // Tạo và lưu lịch sử tưới nước mẫu
  generateAndSaveWateringHistory: async (plantId, limit = 5) => {
    try {
      const history = [];
      
      for (let i = 0; i < limit; i++) {
        const amount = Math.floor(Math.random() * 200) + 100; // 100-300ml
        const duration = Math.floor(Math.random() * 15) + 5; // 5-20 giây
        const method = Math.random() > 0.5 ? 'automatic' : 'manual';
        const timestamp = new Date(Date.now() - i * 24 * 60 * 60 * 1000); // i ngày trước
        
        const insertQuery = `
          INSERT INTO watering_history (plant_id, amount, duration, method, timestamp)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        const result = await db.pool.query(insertQuery, [plantId, amount, duration, method, timestamp]);
        
        history.push({
          id: result.rows[0].id,
          plantId: plantId,
          amount: amount,
          duration: duration,
          method: method,
          timestamp: timestamp,
          date: timestamp
        });
      }
      
      console.log('✅ Đã tạo lịch sử tưới nước cho cây', plantId);
      return history;
    } catch (error) {
      console.error('❌ Lỗi khi tạo lịch sử tưới nước:', error);
      return sensorService.generateMockWateringHistory(plantId, limit);
    }
  },

  // Tạo dữ liệu cảm biến giả lập thông minh
  generateMockSensorData: (plantId) => {
    const scenarios = [
      { name: 'healthy', temp: [20, 28], moisture: [45, 65], humidity: [50, 70], light: [2500, 4000] },
      { name: 'dry', temp: [25, 32], moisture: [15, 35], humidity: [30, 50], light: [3000, 5000] },
      { name: 'overwatered', temp: [18, 25], moisture: [70, 90], humidity: [70, 85], light: [1500, 3000] },
      { name: 'low_light', temp: [20, 26], moisture: [40, 60], humidity: [55, 75], light: [500, 1500] }
    ];
    
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    return {
      plantId: parseInt(plantId),
      timestamp: new Date().toISOString(),
      temperature: Math.round((Math.random() * (scenario.temp[1] - scenario.temp[0]) + scenario.temp[0]) * 10) / 10,
      soilMoisture: Math.round(Math.random() * (scenario.moisture[1] - scenario.moisture[0]) + scenario.moisture[0]),
      humidity: Math.round(Math.random() * (scenario.humidity[1] - scenario.humidity[0]) + scenario.humidity[0]),
      lightLevel: Math.round(Math.random() * (scenario.light[1] - scenario.light[0]) + scenario.light[0]),
      soilPH: Math.round((Math.random() * 1.5 + 6.0) * 10) / 10
    };
  },

  // Tạo lịch sử tưới nước giả lập
  generateMockWateringHistory: (plantId, limit = 5) => {
    const history = [];
    
    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      history.push({
        id: `mock_${plantId}_${i}`,
        plantId: parseInt(plantId),
        amount: Math.floor(Math.random() * 200) + 100,
        duration: Math.floor(Math.random() * 15) + 5,
        method: Math.random() > 0.5 ? 'automatic' : 'manual',
        timestamp: timestamp.toISOString(),
        date: timestamp.toISOString()
      });
    }
    
    return history;
  },

  // Thông tin cây mặc định
  getDefaultPlantInfo: (plantId) => {
    const defaultPlants = {
      1: { name: 'Cây Xương Rồng Mini', type: 'cactus', description: 'Cây xương rồng nhỏ xinh, dễ chăm sóc' },
      2: { name: 'Cây Lưỡi Hổ', type: 'snake_plant', description: 'Cây lưỡi hổ thanh lọc không khí' },
      3: { name: 'Cây Trầu Bà', type: 'pothos', description: 'Cây trầu bà xanh tươi, dễ sống' },
      4: { name: 'Cây Hoa Hồng Mini', type: 'rose', description: 'Hoa hồng mini trong chậu' }
    };
    
    const plant = defaultPlants[plantId] || defaultPlants[1];
    
    return {
      id: plantId,
      name: plant.name,
      type: plant.type,
      plant_type: plant.type,
      description: plant.description,
      optimal_moisture: 50,
      optimal_temperature: 25,
      optimal_light: 3000,
      careInstructions: 'Chăm sóc cây theo hướng dẫn chung cho loại cây này'
    };
  }
};

module.exports = sensorService;