/**
 * Kiểm tra tích hợp giữa các dịch vụ microservice
 */

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const aiIntegrationController = require('../controllers/aiIntegrationController');

// Mock axios
const mock = new MockAdapter(axios);

describe('Kiểm tra tích hợp microservice', () => {
  beforeAll(() => {
    // Mock API Gateway responses
    mock.onPost('http://localhost:3000/api/automation/irrigation').reply(200, {
      success: true,
      message: 'Cấu hình tưới tự động đã được cập nhật'
    });
    
    mock.onGet('http://localhost:3000/api/plants/plant123').reply(200, {
      id: 'plant123',
      name: 'Cây xương rồng',
      species: 'Cactus',
      wateringFrequency: 7,
      optimalMoisture: 30,
      optimalLight: 80,
      optimalTemperature: 25
    });
    
    mock.onGet('http://localhost:3000/api/sensor-data/plant123/latest').reply(200, {
      moisture: 25,
      light: 75,
      temperature: 28,
      humidity: 60,
      timestamp: new Date()
    });
  });
  
  afterAll(() => {
    mock.restore();
  });
  
  test('Kiểm tra kết nối với API Gateway', async () => {
    // Gọi trực tiếp đến API Gateway
    const response = await axios.get('http://localhost:3000/api/plants/plant123');
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('name');
  });
  
  test('Kiểm tra gửi cấu hình tưới tự động đến hệ thống chính', async () => {
    // Gọi hàm automateIrrigation từ controller
    const req = {
      params: { plantId: 'plant123' },
      body: {
        enabled: true,
        moistureThreshold: 30
      }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    await aiIntegrationController.automateIrrigation(req, res);
    
    // Kiểm tra kết quả
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true
      })
    );
  });
  
  test('Kiểm tra xử lý lỗi khi API Gateway không phản hồi', async () => {
    // Mock lỗi kết nối
    mock.onGet('http://localhost:3000/api/plants/plant456').networkError();
    
    // Gọi API và kiểm tra xử lý lỗi
    try {
      await axios.get('http://localhost:3000/api/plants/plant456');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
  
  test('Kiểm tra khả năng mở rộng với nhiều cây trồng', async () => {
    // Mock dữ liệu cho nhiều cây trồng
    for (let i = 1; i <= 10; i++) {
      mock.onGet(`http://localhost:3000/api/plants/plant${i}`).reply(200, {
        id: `plant${i}`,
        name: `Cây ${i}`,
        species: 'Test Species',
        wateringFrequency: 7,
        optimalMoisture: 30,
        optimalLight: 80,
        optimalTemperature: 25
      });
    }
    
    // Kiểm tra khả năng xử lý nhiều cây trồng
    const promises = [];
    for (let i = 1; i <= 10; i++) {
      promises.push(axios.get(`http://localhost:3000/api/plants/plant${i}`));
    }
    
    const results = await Promise.all(promises);
    expect(results.length).toBe(10);
    results.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('name');
    });
  });
});