/**
 * Kiểm tra tích hợp hệ thống AI
 * Kiểm tra kết nối giữa các module và đảm bảo hoạt động ổn định
 */

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Mock các module phụ thuộc
jest.mock('../controllers/irrigationPredictionController');
jest.mock('../controllers/imageRecognitionController');
jest.mock('../controllers/earlyWarningController');
jest.mock('../controllers/irrigationScheduleController');
jest.mock('../controllers/chatbotController');
jest.mock('../controllers/historicalAnalysisController');

// Import các controller để mock
const irrigationPredictionController = require('../controllers/irrigationPredictionController');
const imageRecognitionController = require('../controllers/imageRecognitionController');
const earlyWarningController = require('../controllers/earlyWarningController');
const irrigationScheduleController = require('../controllers/irrigationScheduleController');
const chatbotController = require('../controllers/chatbotController');
const historicalAnalysisController = require('../controllers/historicalAnalysisController');

describe('Kiểm tra tích hợp hệ thống AI', () => {
  beforeAll(async () => {
    // Mock các hàm cần thiết
    irrigationPredictionController.getPrediction.mockResolvedValue({
      needsWatering: true,
      confidence: 0.85,
      nextWateringTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      recommendations: ['Tưới cây vào buổi sáng', 'Sử dụng 200ml nước']
    });

    imageRecognitionController.analyzePlantImage.mockResolvedValue({
      disease: 'Healthy',
      confidence: 0.92,
      recommendations: ['Cây khỏe mạnh', 'Tiếp tục chăm sóc như hiện tại']
    });

    earlyWarningController.getActiveAlerts.mockResolvedValue([
      {
        type: 'moisture',
        severity: 'medium',
        message: 'Độ ẩm đất thấp',
        timestamp: new Date()
      }
    ]);

    irrigationScheduleController.getSchedule.mockResolvedValue({
      plantId: 'plant123',
      schedule: [
        { day: 'Monday', time: '08:00', amount: 200 },
        { day: 'Thursday', time: '08:00', amount: 200 }
      ],
      nextScheduledWatering: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    });

    chatbotController.processMessage.mockResolvedValue({
      response: 'Cây của bạn cần được tưới nước vào ngày mai.',
      context: { plantId: 'plant123', needsWatering: true }
    });

    historicalAnalysisController.analyzeAndRecommend.mockResolvedValue({
      analysis: {
        wateringEfficiency: 0.78,
        healthScore: 0.85,
        growthPotential: 0.72
      },
      recommendations: [
        'Tăng tần suất tưới nước vào mùa hè',
        'Bổ sung phân bón vào tuần tới'
      ]
    });
  });

  afterAll(async () => {
    // Dọn dẹp sau khi test
    jest.resetAllMocks();
  });

  describe('Kiểm tra API Gateway', () => {
    test('Endpoint chính trả về thông tin API', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('Kiểm tra tích hợp AI', () => {
    test('API getAIInsights tích hợp đúng các module', async () => {
      const response = await request(app).get('/api/insights/plant123/user456');
      
      expect(response.status).toBe(200);
      expect(irrigationPredictionController.getPrediction).toHaveBeenCalled();
      expect(earlyWarningController.getActiveAlerts).toHaveBeenCalled();
      expect(irrigationScheduleController.getSchedule).toHaveBeenCalled();
    });

    test('API analyzeImage tích hợp đúng với module nhận diện hình ảnh', async () => {
      // Tạo file ảnh test
      const testImagePath = path.join(__dirname, 'test-image.jpg');
      fs.writeFileSync(testImagePath, 'test image content');

      const response = await request(app)
        .post('/api/image/analyze-integrated')
        .attach('image', testImagePath);
      
      expect(response.status).toBe(200);
      expect(imageRecognitionController.analyzePlantImage).toHaveBeenCalled();
      
      // Xóa file test
      fs.unlinkSync(testImagePath);
    });

    test('API automateIrrigation tích hợp đúng với module lịch tưới', async () => {
      const response = await request(app)
        .post('/api/automation/irrigation/plant123')
        .send({
          enabled: true,
          moistureThreshold: 30
        });
      
      expect(response.status).toBe(200);
      expect(irrigationScheduleController.automateIrrigation).toHaveBeenCalled();
    });

    test('API chatbot tích hợp đúng với module chatbot', async () => {
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          userId: 'user123',
          message: 'Cây của tôi cần tưới nước không?',
          plantId: 'plant123'
        });
      
      expect(response.status).toBe(200);
      expect(chatbotController.processMessage).toHaveBeenCalled();
    });

    test('API historical analysis tích hợp đúng với module phân tích lịch sử', async () => {
      const response = await request(app)
        .get('/api/analysis/historical/plant123/user456/month');
      
      expect(response.status).toBe(200);
      expect(historicalAnalysisController.analyzeAndRecommend).toHaveBeenCalled();
    });
  });

  describe('Kiểm tra xử lý lỗi', () => {
    test('Xử lý đúng khi thiếu tham số bắt buộc', async () => {
      const response = await request(app).get('/api/insights//user456');
      expect(response.status).toBe(400);
    });

    test('Xử lý đúng khi endpoint không tồn tại', async () => {
      const response = await request(app).get('/api/non-existent-endpoint');
      expect(response.status).toBe(404);
    });
  });
});