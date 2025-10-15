/**
 * Unit Tests for Chatbot Functionality
 * Task 2.4: Write unit tests cho chatbot functionality
 * 
 * Test Coverage:
 * - Test plant-related question responses
 * - Test non-plant question rejection
 * - Test context integration với sensor data
 * - Test MQTT integration và real-time responses
 * 
 * Requirements: 1.1, 1.3, 4.2
 */

const chatbotController = require('../controllers/chatbotController');
const openRouterService = require('../services/openRouterService');
const sensorService = require('../services/sensorService');
const ChatbotLog = require('../models/ChatbotLog');

// Mock dependencies
jest.mock('../services/openRouterService');
jest.mock('../services/sensorService');
jest.mock('../models/ChatbotLog');
jest.mock('../mqtt/aiMqttClient', () => ({
  publishChatbotResponse: jest.fn().mockResolvedValue(),
  publishChatbotTyping: jest.fn().mockResolvedValue(),
  isClientConnected: jest.fn().mockReturnValue(true),
  healthCheck: jest.fn().mockResolvedValue({ connected: true, mock: true })
}));

describe('Chatbot Controller Unit Tests', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup mock request and response objects
    mockReq = {
      body: {
        message: 'Test message',
        userId: 'test_user_1',
        plantId: 1,
        language: 'vi'
      }
    };

    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    // Setup default mock implementations
    sensorService.getPlantInfo = jest.fn().mockResolvedValue({
      id: 1,
      name: 'Cây Xương Rồng Mini',
      type: 'cactus',
      description: 'Cây xương rồng nhỏ xinh, dễ chăm sóc'
    });

    sensorService.getLatestSensorData = jest.fn().mockResolvedValue({
      plantId: 1,
      temperature: 25.5,
      soilMoisture: 45,
      humidity: 60,
      lightLevel: 3000,
      timestamp: new Date().toISOString()
    });

    sensorService.getWateringHistory = jest.fn().mockResolvedValue([
      {
        id: 1,
        plantId: 1,
        amount: 200,
        method: 'automatic',
        timestamp: new Date().toISOString()
      }
    ]);

    ChatbotLog.create = jest.fn().mockResolvedValue({ id: 1 });
    ChatbotLog.getBySessionId = jest.fn().mockResolvedValue([]);
  });

  describe('Plant-related Question Responses', () => {
    test('should respond correctly to plant care questions', async () => {
      // Arrange
      mockReq.body.message = 'Lá cây của tôi bị vàng, tôi nên làm gì?';
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Lá vàng có thể do thiếu nước hoặc thừa nước. Hãy kiểm tra độ ẩm đất.',
        confidence: 0.8,
        filtered: false
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(openRouterService.generateChatResponse).toHaveBeenCalledWith(
        'Lá cây của tôi bị vàng, tôi nên làm gì?',
        expect.objectContaining({
          plantInfo: expect.any(Object),
          sensorData: expect.any(Object),
          wateringHistory: expect.any(Array)
        })
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          response: expect.stringContaining('Lá vàng'),
          confidence: 0.8,
          fallback: false
        })
      );
    });

    test('should handle watering-related questions with sensor context', async () => {
      // Arrange
      mockReq.body.message = 'Tôi có nên tưới cây không?';
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Dựa trên độ ẩm đất hiện tại là 45%, bạn có thể tưới thêm một chút.',
        confidence: 0.9,
        filtered: false
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(sensorService.getLatestSensorData).toHaveBeenCalledWith(1);
      expect(openRouterService.generateChatResponse).toHaveBeenCalledWith(
        'Tôi có nên tưới cây không?',
        expect.objectContaining({
          sensorData: expect.objectContaining({
            soilMoisture: 45,
            temperature: 25.5
          })
        })
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          response: expect.stringContaining('độ ẩm đất'),
          context: expect.objectContaining({
            sensorData: expect.objectContaining({
              soilMoisture: 45
            })
          })
        })
      );
    });

    test('should provide disease detection suggestions for disease-related questions', async () => {
      // Arrange
      mockReq.body.message = 'Cây có đốm nâu trên lá';
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Đốm nâu có thể là dấu hiệu của bệnh nấm. Để chẩn đoán chính xác hơn, bạn có thể chụp ảnh lá cây và sử dụng tính năng Nhận diện bệnh qua ảnh.',
        confidence: 0.8,
        filtered: false
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          response: expect.stringContaining('Nhận diện bệnh qua ảnh')
        })
      );
    });
  });

  describe('Non-plant Question Rejection', () => {
    test('should reject weather-related questions', async () => {
      // Arrange
      mockReq.body.message = 'Thời tiết hôm nay thế nào?';
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Tôi chỉ có thể tư vấn về cây trồng và chăm sóc cây. Bạn có câu hỏi gì về cây của mình không?',
        filtered: true,
        filterReason: 'forbidden_topic',
        confidence: 1.0
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          response: expect.stringContaining('chỉ có thể tư vấn về cây trồng'),
          fallback: false
        })
      );
    });

    test('should reject cooking-related questions', async () => {
      // Arrange
      mockReq.body.message = 'Làm sao để nấu phở ngon?';
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Tôi chỉ có thể tư vấn về cây trồng và chăm sóc cây. Bạn có câu hỏi gì về cây của mình không?',
        filtered: true,
        filterReason: 'forbidden_topic',
        confidence: 1.0
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          response: expect.stringContaining('chỉ có thể tư vấn về cây trồng')
        })
      );
    });

    test('should reject technology-related questions', async () => {
      // Arrange
      mockReq.body.message = 'Điện thoại nào tốt nhất hiện nay?';
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Tôi chỉ có thể tư vấn về cây trồng và chăm sóc cây. Bạn có câu hỏi gì về cây của mình không?',
        filtered: true,
        filterReason: 'forbidden_topic',
        confidence: 1.0
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          response: expect.stringContaining('chỉ có thể tư vấn về cây trồng')
        })
      );
    });

    test('should handle vague questions appropriately', async () => {
      // Arrange
      mockReq.body.message = 'Làm sao để tốt hơn?';
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Bạn có thể hỏi cụ thể hơn về cây trồng không? Ví dụ: "Lá cây của tôi bị vàng", "Khi nào nên tưới cây?"',
        filtered: true,
        filterReason: 'vague_question',
        confidence: 1.0
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          response: expect.stringContaining('hỏi cụ thể hơn về cây trồng')
        })
      );
    });
  });

  describe('Context Integration with Sensor Data', () => {
    test('should integrate plant information in context', async () => {
      // Arrange
      const mockPlantInfo = {
        id: 1,
        name: 'Cây Xương Rồng Mini',
        type: 'cactus',
        description: 'Cây xương rồng nhỏ xinh, dễ chăm sóc'
      };

      sensorService.getPlantInfo = jest.fn().mockResolvedValue(mockPlantInfo);
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Cây xương rồng của bạn cần ít nước và nhiều ánh sáng.',
        confidence: 0.8,
        filtered: false
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(sensorService.getPlantInfo).toHaveBeenCalledWith(1);
      expect(openRouterService.generateChatResponse).toHaveBeenCalledWith(
        'Test message',
        expect.objectContaining({
          plantInfo: mockPlantInfo
        })
      );
    });

    test('should integrate sensor data in context', async () => {
      // Arrange
      const mockSensorData = {
        plantId: 1,
        temperature: 28.5,
        soilMoisture: 25, // Low moisture
        humidity: 45,
        lightLevel: 4000,
        timestamp: new Date().toISOString()
      };

      sensorService.getLatestSensorData = jest.fn().mockResolvedValue(mockSensorData);
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Độ ẩm đất thấp (25%), bạn nên tưới nước cho cây.',
        confidence: 0.9,
        filtered: false
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(sensorService.getLatestSensorData).toHaveBeenCalledWith(1);
      expect(openRouterService.generateChatResponse).toHaveBeenCalledWith(
        'Test message',
        expect.objectContaining({
          sensorData: mockSensorData
        })
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            sensorData: mockSensorData
          })
        })
      );
    });

    test('should integrate watering history in context', async () => {
      // Arrange
      const mockWateringHistory = [
        {
          id: 1,
          plantId: 1,
          amount: 200,
          method: 'automatic',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        },
        {
          id: 2,
          plantId: 1,
          amount: 150,
          method: 'manual',
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() // 2 days ago
        }
      ];

      sensorService.getWateringHistory = jest.fn().mockResolvedValue(mockWateringHistory);
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Cây đã được tưới 200ml cách đây 1 ngày, có thể chưa cần tưới thêm.',
        confidence: 0.8,
        filtered: false
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(sensorService.getWateringHistory).toHaveBeenCalledWith(1, 3);
      expect(openRouterService.generateChatResponse).toHaveBeenCalledWith(
        'Test message',
        expect.objectContaining({
          wateringHistory: mockWateringHistory
        })
      );
    });

    test('should handle context data retrieval errors gracefully', async () => {
      // Arrange
      sensorService.getPlantInfo = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      sensorService.getLatestSensorData = jest.fn().mockRejectedValue(new Error('Sensor data unavailable'));
      sensorService.getWateringHistory = jest.fn().mockRejectedValue(new Error('History data unavailable'));
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Tôi hiểu câu hỏi của bạn về cây trồng. Hiện tại dữ liệu cảm biến không khả dụng.',
        confidence: 0.6,
        filtered: false
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(openRouterService.generateChatResponse).toHaveBeenCalledWith(
        'Test message',
        expect.objectContaining({
          plantInfo: null,
          sensorData: null,
          wateringHistory: []
        })
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          response: expect.any(String)
        })
      );
    });

    test('should include chat history in context for session continuity', async () => {
      // Arrange
      const sessionId = 'test_session_123';
      mockReq.body.sessionId = sessionId;

      const mockChatHistory = [
        {
          user_message: 'Cây của tôi có vấn đề gì không?',
          ai_response: 'Cây trông khỏe mạnh, độ ẩm đất ổn định.',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
        }
      ];

      ChatbotLog.getBySessionId = jest.fn().mockResolvedValue(mockChatHistory);
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Như tôi đã nói trước đó, cây của bạn trông khỏe mạnh.',
        confidence: 0.8,
        filtered: false
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(ChatbotLog.getBySessionId).toHaveBeenCalledWith(sessionId, 5);
      expect(openRouterService.generateChatResponse).toHaveBeenCalledWith(
        'Test message',
        expect.objectContaining({
          chatHistory: mockChatHistory
        })
      );
    });
  });

  describe('MQTT Integration and Real-time Responses', () => {
    let mockMqttClient;

    beforeEach(() => {
      mockMqttClient = require('../mqtt/aiMqttClient');
    });

    test('should publish typing indicator when processing message', async () => {
      // Arrange
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Test response',
        confidence: 0.8,
        filtered: false
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockMqttClient.publishChatbotTyping).toHaveBeenCalledWith('test_user_1', true);
      expect(mockMqttClient.publishChatbotTyping).toHaveBeenCalledWith('test_user_1', false);
    });

    test('should publish chatbot response via MQTT', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        response: 'Cây của bạn cần được tưới nước.',
        confidence: 0.9,
        filtered: false
      };

      openRouterService.generateChatResponse = jest.fn().mockResolvedValue(mockResponse);

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockMqttClient.publishChatbotResponse).toHaveBeenCalledWith(
        'test_user_1',
        expect.objectContaining({
          response: 'Cây của bạn cần được tưới nước.',
          confidence: 0.9,
          fallback: false,
          sessionId: expect.any(String)
        })
      );
    });

    test('should handle MQTT publishing errors gracefully', async () => {
      // Arrange
      mockMqttClient.publishChatbotTyping = jest.fn().mockRejectedValue(new Error('MQTT connection failed'));
      mockMqttClient.publishChatbotResponse = jest.fn().mockRejectedValue(new Error('MQTT publish failed'));
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Test response',
        confidence: 0.8,
        filtered: false
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert - Should still return successful response despite MQTT errors
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          response: 'Test response'
        })
      );
    });

    test('should stop typing indicator on error', async () => {
      // Arrange
      openRouterService.generateChatResponse = jest.fn().mockRejectedValue(new Error('AI service failed'));

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockMqttClient.publishChatbotTyping).toHaveBeenCalledWith('test_user_1', true);
      expect(mockMqttClient.publishChatbotTyping).toHaveBeenCalledWith('test_user_1', false);
    });

    test('should publish real-time response with plant context', async () => {
      // Arrange
      const mockPlantInfo = {
        id: 1,
        name: 'Cây Xương Rồng Mini',
        type: 'cactus'
      };

      sensorService.getPlantInfo = jest.fn().mockResolvedValue(mockPlantInfo);
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Cây xương rồng cần ít nước.',
        confidence: 0.8,
        filtered: false
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockMqttClient.publishChatbotResponse).toHaveBeenCalledWith(
        'test_user_1',
        expect.objectContaining({
          plantContext: mockPlantInfo,
          response: 'Cây xương rồng cần ít nước.',
          confidence: 0.8
        })
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty message', async () => {
      // Arrange
      mockReq.body.message = '';

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Thiếu nội dung tin nhắn'
        })
      );
    });

    test('should handle missing message field', async () => {
      // Arrange
      delete mockReq.body.message;

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Thiếu nội dung tin nhắn'
        })
      );
    });

    test('should handle AI service failure with fallback', async () => {
      // Arrange
      openRouterService.generateChatResponse = jest.fn().mockRejectedValue(new Error('OpenRouter API failed'));

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: true,
          message: expect.stringContaining('Đã xảy ra lỗi khi xử lý tin nhắn')
        })
      );
    });

    test('should generate session ID when not provided', async () => {
      // Arrange
      delete mockReq.body.sessionId;
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Test response',
        confidence: 0.8,
        filtered: false
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expect.stringMatching(/^session_\d+_[a-z0-9]+$/)
        })
      );
    });

    test('should handle chat history save failure gracefully', async () => {
      // Arrange
      ChatbotLog.create = jest.fn().mockRejectedValue(new Error('Database save failed'));
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Test response',
        confidence: 0.8,
        filtered: false
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert - Should still return successful response despite save error
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          response: 'Test response'
        })
      );
    });
  });

  describe('Response Time and Performance', () => {
    test('should include response time in result', async () => {
      // Arrange
      openRouterService.generateChatResponse = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              response: 'Test response',
              confidence: 0.8,
              filtered: false
            });
          }, 100); // Simulate 100ms processing time
        });
      });

      // Act
      await chatbotController.handleMessage(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          responseTime: expect.any(Number)
        })
      );

      const responseCall = mockRes.json.mock.calls[0][0];
      expect(responseCall.responseTime).toBeGreaterThan(90); // Should be at least 90ms
    });

    test('should handle concurrent requests properly', async () => {
      // Arrange
      const requests = [];
      
      openRouterService.generateChatResponse = jest.fn().mockResolvedValue({
        success: true,
        response: 'Concurrent response',
        confidence: 0.8,
        filtered: false
      });

      // Act - Send 5 concurrent requests
      for (let i = 0; i < 5; i++) {
        const req = { ...mockReq };
        req.body.userId = `user_${i}`;
        const res = {
          json: jest.fn().mockReturnThis(),
          status: jest.fn().mockReturnThis()
        };
        
        requests.push(chatbotController.handleMessage(req, res));
      }

      await Promise.all(requests);

      // Assert
      expect(openRouterService.generateChatResponse).toHaveBeenCalledTimes(5);
    });
  });
});

describe('OpenRouter Service Content Filtering Unit Tests', () => {
  describe('Content Filtering Logic', () => {
    test('should validate plant-related questions', () => {
      // Test cases for valid plant questions
      const validQuestions = [
        'Lá cây của tôi bị vàng',
        'Khi nào nên tưới cây?',
        'Cây bị sâu hại phải làm sao?',
        'Phân bón nào tốt cho hoa hồng?',
        'Cây sen đá có cần nhiều nước không?'
      ];

      validQuestions.forEach(question => {
        const result = openRouterService.filterAndValidateMessage(question);
        expect(result.isValid).toBe(true);
        expect(result.reason).toBe('valid_plant_question');
      });
    });

    test('should reject forbidden topics', () => {
      // Test cases for forbidden topics
      const forbiddenQuestions = [
        'Thời tiết hôm nay thế nào?',
        'Làm sao để nấu phở ngon?',
        'Bệnh cảm cúm có nguy hiểm không?',
        'Phim hay nào đang chiếu?',
        'Giá Bitcoin hôm nay ra sao?'
      ];

      forbiddenQuestions.forEach(question => {
        const result = openRouterService.filterAndValidateMessage(question);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('forbidden_topic');
        expect(result.suggestion).toContain('chỉ có thể tư vấn về cây trồng');
      });
    });

    test('should handle vague questions', () => {
      // Test cases for vague questions
      const vagueQuestions = [
        'Làm sao để tốt hơn?',
        'Tại sao lại như vậy?',
        'Có nên làm không?',
        'Giúp tôi với'
      ];

      vagueQuestions.forEach(question => {
        const result = openRouterService.filterAndValidateMessage(question);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('vague_question');
        expect(result.suggestion).toContain('hỏi cụ thể hơn về cây trồng');
      });
    });

    test('should allow greetings', () => {
      // Test cases for greetings
      const greetings = [
        'Chào bạn',
        'Hello',
        'Xin chào',
        'Cảm ơn bạn',
        'Thanks'
      ];

      greetings.forEach(greeting => {
        const result = openRouterService.filterAndValidateMessage(greeting);
        expect(result.isValid).toBe(true);
        expect(result.reason).toBe('valid_plant_question');
      });
    });
  });

  describe('Feature Integration Suggestions', () => {
    test('should suggest disease detection for disease-related questions', () => {
      const diseaseQuestions = [
        'Cây có đốm nâu trên lá',
        'Lá bị héo và rụng',
        'Có sâu bọ trên cây'
      ];

      diseaseQuestions.forEach(question => {
        const enhanced = openRouterService.enhanceResponseWithFeatureSuggestions(
          'Đây là vấn đề về bệnh cây.',
          question
        );
        expect(enhanced).toContain('Nhận diện bệnh qua ảnh');
      });
    });

    test('should suggest irrigation prediction for watering questions', () => {
      const wateringQuestions = [
        'Bao lâu tưới cây một lần?',
        'Đất khô có nên tưới không?',
        'Cây bị úng nước phải làm sao?'
      ];

      wateringQuestions.forEach(question => {
        const enhanced = openRouterService.enhanceResponseWithFeatureSuggestions(
          'Đây là vấn đề về tưới nước.',
          question
        );
        expect(enhanced).toContain('dự báo tưới nước thông minh');
      });
    });

    test('should suggest automatic scheduling for schedule-related questions', () => {
      const scheduleQuestions = [
        'Khi nào nên tưới cây?',
        'Bao lâu tưới một lần?',
        'Lịch tưới thế nào là tốt?'
      ];

      scheduleQuestions.forEach(question => {
        const enhanced = openRouterService.enhanceResponseWithFeatureSuggestions(
          'Đây là vấn đề về lịch tưới.',
          question
        );
        expect(enhanced).toContain('lịch tưới tự động');
      });
    });
  });
});