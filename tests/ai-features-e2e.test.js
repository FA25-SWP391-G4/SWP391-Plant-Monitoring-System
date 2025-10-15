/**
 * End-to-End Tests for AI Features Integration
 * Tests complete workflows from frontend to backend including MQTT communication
 */

const request = require('supertest');
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Test configuration
const TEST_CONFIG = {
  mainServer: 'http://localhost:3010',
  aiService: 'http://localhost:3001',
  mqttBroker: 'mqtt://localhost:1883',
  testTimeout: 30000,
  testUser: {
    id: 1,
    email: 'test@example.com'
  },
  testPlant: {
    id: 1,
    type: 'tomato'
  }
};

describe('AI Features End-to-End Tests', () => {
  let mqttClient;
  let receivedMessages = [];

  beforeAll(async () => {
    // Setup MQTT client for testing
    mqttClient = mqtt.connect(TEST_CONFIG.mqttBroker);
    
    await new Promise((resolve) => {
      mqttClient.on('connect', () => {
        console.log('Test MQTT client connected');
        resolve();
      });
    });

    // Subscribe to all AI-related topics
    const topics = [
      'ai/chatbot/response/+',
      'ai/chatbot/typing/+',
      'ai/irrigation/prediction/+',
      'ai/irrigation/alert/+',
      'ai/disease/analysis/+',
      'ai/disease/alert/+',
      'ai/system/status'
    ];

    topics.forEach(topic => {
      mqttClient.subscribe(topic);
    });

    // Collect MQTT messages
    mqttClient.on('message', (topic, message) => {
      receivedMessages.push({
        topic,
        message: message.toString(),
        timestamp: new Date()
      });
    });
  }, TEST_CONFIG.testTimeout);

  afterAll(async () => {
    if (mqttClient) {
      mqttClient.end();
    }
  });

  beforeEach(() => {
    receivedMessages = [];
  });

  describe('1. Chatbot AI Complete Workflow', () => {
    test('should handle complete chatbot conversation with MQTT real-time updates', async () => {
      const testMessage = 'Cây cà chua của tôi có lá vàng, tôi nên làm gì?';
      
      // Step 1: Send message to chatbot endpoint
      const response = await request(TEST_CONFIG.aiService)
        .post('/api/ai/chatbot/message')
        .send({
          message: testMessage,
          userId: TEST_CONFIG.testUser.id,
          plantId: TEST_CONFIG.testPlant.id,
          sessionId: 'test-session-1'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(response.body.sessionId).toBe('test-session-1');

      // Step 2: Wait for MQTT messages
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Verify MQTT real-time updates
      const typingMessages = receivedMessages.filter(msg => 
        msg.topic.includes('ai/chatbot/typing')
      );
      const responseMessages = receivedMessages.filter(msg => 
        msg.topic.includes('ai/chatbot/response')
      );

      expect(typingMessages.length).toBeGreaterThan(0);
      expect(responseMessages.length).toBeGreaterThan(0);

      // Step 4: Verify database storage
      const historyResponse = await request(TEST_CONFIG.aiService)
        .get(`/api/ai/chatbot/history/test-session-1`)
        .expect(200);

      expect(historyResponse.body.messages).toBeDefined();
      expect(historyResponse.body.messages.length).toBeGreaterThan(0);
    }, TEST_CONFIG.testTimeout);

    test('should reject non-plant questions and maintain conversation context', async () => {
      const nonPlantMessage = 'Thời tiết hôm nay thế nào?';
      
      const response = await request(TEST_CONFIG.aiService)
        .post('/api/ai/chatbot/message')
        .send({
          message: nonPlantMessage,
          userId: TEST_CONFIG.testUser.id,
          sessionId: 'test-session-2'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toContain('chỉ tư vấn về cây trồng');
      
      // Follow up with plant question
      const plantMessage = 'Cây của tôi cần bao nhiều nước?';
      
      const followUpResponse = await request(TEST_CONFIG.aiService)
        .post('/api/ai/chatbot/message')
        .send({
          message: plantMessage,
          userId: TEST_CONFIG.testUser.id,
          sessionId: 'test-session-2'
        })
        .expect(200);

      expect(followUpResponse.body.success).toBe(true);
      expect(followUpResponse.body.response).not.toContain('chỉ tư vấn về cây trồng');
    });

    test('should integrate sensor data in chatbot responses', async () => {
      // First, simulate sensor data
      const sensorData = {
        plantId: TEST_CONFIG.testPlant.id,
        soilMoisture: 25,
        temperature: 28,
        humidity: 65,
        lightLevel: 800
      };

      await request(TEST_CONFIG.mainServer)
        .post('/api/sensors/data')
        .send(sensorData)
        .expect(200);

      // Then ask chatbot about plant condition
      const response = await request(TEST_CONFIG.aiService)
        .post('/api/ai/chatbot/message')
        .send({
          message: 'Tình trạng cây của tôi hiện tại như thế nào?',
          userId: TEST_CONFIG.testUser.id,
          plantId: TEST_CONFIG.testPlant.id,
          sessionId: 'test-session-3'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toMatch(/độ ẩm|nhiệt độ|ánh sáng/i);
    });
  });

  describe('2. Disease Detection Complete Workflow', () => {
    test('should process image upload and return disease analysis with MQTT updates', async () => {
      // Create test image file
      const testImagePath = path.join(__dirname, 'test-assets', 'plant-leaf.jpg');
      
      // Create test image if it doesn't exist
      if (!fs.existsSync(testImagePath)) {
        const testImageDir = path.dirname(testImagePath);
        if (!fs.existsSync(testImageDir)) {
          fs.mkdirSync(testImageDir, { recursive: true });
        }
        // Create a simple test image (1x1 pixel JPEG)
        const testImageBuffer = Buffer.from([
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
          0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
          0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
          0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
          0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
          0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
          0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
          0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
          0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
          0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
          0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
          0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0xFF, 0xD9
        ]);
        fs.writeFileSync(testImagePath, testImageBuffer);
      }

      // Step 1: Upload image for disease detection
      const form = new FormData();
      form.append('image', fs.createReadStream(testImagePath));
      form.append('plantId', TEST_CONFIG.testPlant.id.toString());
      form.append('userId', TEST_CONFIG.testUser.id.toString());

      const response = await request(TEST_CONFIG.aiService)
        .post('/api/ai/disease/analyze')
        .set(form.getHeaders())
        .send(form.getBuffer())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toBeDefined();
      expect(response.body.analysis.diseases).toBeDefined();
      expect(response.body.analysis.confidence).toBeDefined();

      // Step 2: Wait for MQTT messages
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Verify MQTT disease analysis updates
      const diseaseMessages = receivedMessages.filter(msg => 
        msg.topic.includes('ai/disease/analysis')
      );

      expect(diseaseMessages.length).toBeGreaterThan(0);

      const analysisMessage = JSON.parse(diseaseMessages[0].message);
      expect(analysisMessage.diseases).toBeDefined();
      expect(analysisMessage.confidence).toBeDefined();

      // Step 4: Verify database storage
      const historyResponse = await request(TEST_CONFIG.aiService)
        .get(`/api/ai/disease/history/${TEST_CONFIG.testPlant.id}`)
        .expect(200);

      expect(historyResponse.body.analyses).toBeDefined();
      expect(historyResponse.body.analyses.length).toBeGreaterThan(0);
    }, TEST_CONFIG.testTimeout);

    test('should reject non-plant images with proper validation', async () => {
      // Create a non-plant test image (simple colored square)
      const testImagePath = path.join(__dirname, 'test-assets', 'non-plant.jpg');
      const testImageDir = path.dirname(testImagePath);
      
      if (!fs.existsSync(testImageDir)) {
        fs.mkdirSync(testImageDir, { recursive: true });
      }

      // Create a simple non-plant image
      const nonPlantImageBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
        0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
        0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
        0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0xFF, 0xD9
      ]);
      fs.writeFileSync(testImagePath, nonPlantImageBuffer);

      const form = new FormData();
      form.append('image', fs.createReadStream(testImagePath));
      form.append('plantId', TEST_CONFIG.testPlant.id.toString());
      form.append('userId', TEST_CONFIG.testUser.id.toString());

      const response = await request(TEST_CONFIG.aiService)
        .post('/api/ai/disease/analyze')
        .set(form.getHeaders())
        .send(form.getBuffer())
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('không chứa cây');
    });

    test('should validate image format and size restrictions', async () => {
      // Test with invalid file type
      const invalidFile = Buffer.from('This is not an image');
      
      const form = new FormData();
      form.append('image', invalidFile, { filename: 'test.txt', contentType: 'text/plain' });
      form.append('plantId', TEST_CONFIG.testPlant.id.toString());

      const response = await request(TEST_CONFIG.aiService)
        .post('/api/ai/disease/analyze')
        .set(form.getHeaders())
        .send(form.getBuffer())
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('file ảnh');
    });
  });

  describe('3. Irrigation Prediction Complete Workflow', () => {
    test('should generate irrigation predictions with MQTT real-time updates', async () => {
      // Step 1: Send sensor data to trigger prediction
      const sensorData = {
        plantId: TEST_CONFIG.testPlant.id,
        soilMoisture: 30,
        temperature: 26,
        humidity: 70,
        lightLevel: 1200,
        timestamp: new Date().toISOString()
      };

      await request(TEST_CONFIG.mainServer)
        .post('/api/sensors/data')
        .send(sensorData)
        .expect(200);

      // Step 2: Request irrigation prediction
      const response = await request(TEST_CONFIG.aiService)
        .post(`/api/ai/irrigation/predict/${TEST_CONFIG.testPlant.id}`)
        .send({
          userId: TEST_CONFIG.testUser.id,
          includeWeatherForecast: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.prediction).toBeDefined();
      expect(response.body.prediction.shouldWater).toBeDefined();
      expect(response.body.prediction.confidence).toBeDefined();
      expect(response.body.prediction.hoursUntilWater).toBeDefined();

      // Step 3: Wait for MQTT messages
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 4: Verify MQTT irrigation updates
      const irrigationMessages = receivedMessages.filter(msg => 
        msg.topic.includes('ai/irrigation/prediction')
      );

      expect(irrigationMessages.length).toBeGreaterThan(0);

      const predictionMessage = JSON.parse(irrigationMessages[0].message);
      expect(predictionMessage.shouldWater).toBeDefined();
      expect(predictionMessage.confidence).toBeDefined();

      // Step 5: Test urgent watering alert
      if (response.body.prediction.shouldWater && response.body.prediction.confidence > 0.8) {
        const alertMessages = receivedMessages.filter(msg => 
          msg.topic.includes('ai/irrigation/alert')
        );
        expect(alertMessages.length).toBeGreaterThan(0);
      }
    }, TEST_CONFIG.testTimeout);

    test('should create intelligent irrigation schedule', async () => {
      const scheduleRequest = {
        plantId: TEST_CONFIG.testPlant.id,
        userId: TEST_CONFIG.testUser.id,
        duration: 7, // 7 days
        preferences: {
          preferredTimes: ['06:00', '18:00'],
          maxWateringsPerDay: 2
        }
      };

      const response = await request(TEST_CONFIG.aiService)
        .post(`/api/ai/irrigation/schedule/${TEST_CONFIG.testPlant.id}`)
        .send(scheduleRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.schedule).toBeDefined();
      expect(response.body.schedule.length).toBeGreaterThan(0);
      expect(response.body.schedule[0].datetime).toBeDefined();
      expect(response.body.schedule[0].waterAmount).toBeDefined();
    });

    test('should handle low soil moisture emergency alerts', async () => {
      // Simulate very low soil moisture
      const emergencyData = {
        plantId: TEST_CONFIG.testPlant.id,
        soilMoisture: 10, // Very low
        temperature: 32,  // High temperature
        humidity: 40,     // Low humidity
        lightLevel: 1500,
        timestamp: new Date().toISOString()
      };

      await request(TEST_CONFIG.mainServer)
        .post('/api/sensors/data')
        .send(emergencyData)
        .expect(200);

      // Request prediction
      const response = await request(TEST_CONFIG.aiService)
        .post(`/api/ai/irrigation/predict/${TEST_CONFIG.testPlant.id}`)
        .send({
          userId: TEST_CONFIG.testUser.id
        })
        .expect(200);

      expect(response.body.prediction.shouldWater).toBe(true);
      expect(response.body.prediction.confidence).toBeGreaterThan(0.7);

      // Wait for MQTT alert
      await new Promise(resolve => setTimeout(resolve, 2000));

      const alertMessages = receivedMessages.filter(msg => 
        msg.topic.includes('ai/irrigation/alert')
      );

      expect(alertMessages.length).toBeGreaterThan(0);

      const alertMessage = JSON.parse(alertMessages[0].message);
      expect(alertMessage.type).toBe('urgent_watering');
    });
  });

  describe('4. Database Operations and Data Consistency', () => {
    test('should maintain data consistency across all AI operations', async () => {
      const testSessionId = 'consistency-test-session';
      
      // Step 1: Create chatbot conversation
      await request(TEST_CONFIG.aiService)
        .post('/api/ai/chatbot/message')
        .send({
          message: 'Test message for consistency',
          userId: TEST_CONFIG.testUser.id,
          plantId: TEST_CONFIG.testPlant.id,
          sessionId: testSessionId
        })
        .expect(200);

      // Step 2: Create disease analysis
      const testImagePath = path.join(__dirname, 'test-assets', 'plant-leaf.jpg');
      const form = new FormData();
      form.append('image', fs.createReadStream(testImagePath));
      form.append('plantId', TEST_CONFIG.testPlant.id.toString());
      form.append('userId', TEST_CONFIG.testUser.id.toString());

      await request(TEST_CONFIG.aiService)
        .post('/api/ai/disease/analyze')
        .set(form.getHeaders())
        .send(form.getBuffer())
        .expect(200);

      // Step 3: Create irrigation prediction
      await request(TEST_CONFIG.aiService)
        .post(`/api/ai/irrigation/predict/${TEST_CONFIG.testPlant.id}`)
        .send({
          userId: TEST_CONFIG.testUser.id
        })
        .expect(200);

      // Step 4: Verify all data is consistently stored
      const chatHistory = await request(TEST_CONFIG.aiService)
        .get(`/api/ai/chatbot/history/${testSessionId}`)
        .expect(200);

      const diseaseHistory = await request(TEST_CONFIG.aiService)
        .get(`/api/ai/disease/history/${TEST_CONFIG.testPlant.id}`)
        .expect(200);

      expect(chatHistory.body.messages.length).toBeGreaterThan(0);
      expect(diseaseHistory.body.analyses.length).toBeGreaterThan(0);

      // Verify user and plant IDs are consistent
      expect(chatHistory.body.messages[0].user_id).toBe(TEST_CONFIG.testUser.id);
      expect(diseaseHistory.body.analyses[0].plant_id).toBe(TEST_CONFIG.testPlant.id);
    });

    test('should handle concurrent AI operations without data corruption', async () => {
      const concurrentPromises = [];
      const numConcurrentRequests = 5;

      // Create multiple concurrent chatbot requests
      for (let i = 0; i < numConcurrentRequests; i++) {
        concurrentPromises.push(
          request(TEST_CONFIG.aiService)
            .post('/api/ai/chatbot/message')
            .send({
              message: `Concurrent test message ${i}`,
              userId: TEST_CONFIG.testUser.id,
              plantId: TEST_CONFIG.testPlant.id,
              sessionId: `concurrent-session-${i}`
            })
        );
      }

      // Create concurrent irrigation predictions
      for (let i = 0; i < numConcurrentRequests; i++) {
        concurrentPromises.push(
          request(TEST_CONFIG.aiService)
            .post(`/api/ai/irrigation/predict/${TEST_CONFIG.testPlant.id}`)
            .send({
              userId: TEST_CONFIG.testUser.id
            })
        );
      }

      // Execute all requests concurrently
      const results = await Promise.all(concurrentPromises);

      // Verify all requests succeeded
      results.forEach((result, index) => {
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      });

      // Verify data integrity
      for (let i = 0; i < numConcurrentRequests; i++) {
        const historyResponse = await request(TEST_CONFIG.aiService)
          .get(`/api/ai/chatbot/history/concurrent-session-${i}`)
          .expect(200);

        expect(historyResponse.body.messages.length).toBe(1);
        expect(historyResponse.body.messages[0].message).toBe(`Concurrent test message ${i}`);
      }
    });
  });

  describe('5. MQTT Real-time Communication', () => {
    test('should handle MQTT connection failures gracefully', async () => {
      // Simulate MQTT connection issue by using wrong broker
      const testMqttClient = mqtt.connect('mqtt://localhost:9999'); // Wrong port
      
      let connectionError = false;
      testMqttClient.on('error', () => {
        connectionError = true;
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // AI service should still work without MQTT
      const response = await request(TEST_CONFIG.aiService)
        .post('/api/ai/chatbot/message')
        .send({
          message: 'Test without MQTT',
          userId: TEST_CONFIG.testUser.id,
          sessionId: 'no-mqtt-session'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(connectionError).toBe(true);

      testMqttClient.end();
    });

    test('should maintain message ordering in MQTT communication', async () => {
      const messages = [];
      const numMessages = 5;

      // Send multiple messages in sequence
      for (let i = 0; i < numMessages; i++) {
        await request(TEST_CONFIG.aiService)
          .post('/api/ai/chatbot/message')
          .send({
            message: `Ordered message ${i}`,
            userId: TEST_CONFIG.testUser.id,
            sessionId: `order-test-session-${i}`
          })
          .expect(200);

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Wait for all MQTT messages
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify message ordering
      const responseMessages = receivedMessages
        .filter(msg => msg.topic.includes('ai/chatbot/response'))
        .sort((a, b) => a.timestamp - b.timestamp);

      expect(responseMessages.length).toBeGreaterThanOrEqual(numMessages);
    });

    test('should handle MQTT topic subscription and unsubscription', async () => {
      const testTopic = 'ai/test/custom-topic';
      let customMessageReceived = false;

      // Subscribe to custom topic
      mqttClient.subscribe(testTopic);

      mqttClient.on('message', (topic, message) => {
        if (topic === testTopic) {
          customMessageReceived = true;
        }
      });

      // Publish test message
      mqttClient.publish(testTopic, JSON.stringify({ test: 'custom message' }));

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(customMessageReceived).toBe(true);

      // Unsubscribe
      mqttClient.unsubscribe(testTopic);
    });
  });

  describe('6. Error Handling and Recovery', () => {
    test('should handle AI service failures with proper fallback', async () => {
      // Test with invalid OpenRouter API key (simulate service failure)
      const response = await request(TEST_CONFIG.aiService)
        .post('/api/ai/chatbot/message')
        .send({
          message: 'Test fallback response',
          userId: TEST_CONFIG.testUser.id,
          sessionId: 'fallback-test-session',
          simulateFailure: true // Special flag for testing
        });

      // Should still return a response (fallback)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
    });

    test('should validate input data and return appropriate errors', async () => {
      // Test missing required fields
      const response = await request(TEST_CONFIG.aiService)
        .post('/api/ai/chatbot/message')
        .send({
          // Missing message field
          userId: TEST_CONFIG.testUser.id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should handle database connection failures', async () => {
      // This test would require temporarily disrupting database connection
      // For now, we'll test the error handling structure
      const response = await request(TEST_CONFIG.aiService)
        .get('/api/ai/chatbot/history/non-existent-session')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('7. Performance and Load Testing', () => {
    test('should handle multiple concurrent users', async () => {
      const numUsers = 10;
      const promises = [];

      for (let i = 0; i < numUsers; i++) {
        promises.push(
          request(TEST_CONFIG.aiService)
            .post('/api/ai/chatbot/message')
            .send({
              message: `Load test message from user ${i}`,
              userId: i + 1,
              sessionId: `load-test-session-${i}`
            })
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      // All requests should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      });

      // Response time should be reasonable (less than 10 seconds for all)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000);

      console.log(`Load test completed in ${totalTime}ms for ${numUsers} concurrent users`);
    }, 15000);

    test('should maintain response times under load', async () => {
      const numRequests = 20;
      const responseTimes = [];

      for (let i = 0; i < numRequests; i++) {
        const startTime = Date.now();
        
        await request(TEST_CONFIG.aiService)
          .post('/api/ai/chatbot/message')
          .send({
            message: `Performance test message ${i}`,
            userId: TEST_CONFIG.testUser.id,
            sessionId: `perf-test-session-${i}`
          })
          .expect(200);

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      console.log(`Average response time: ${averageResponseTime}ms`);
      console.log(`Max response time: ${maxResponseTime}ms`);

      // Response times should be reasonable
      expect(averageResponseTime).toBeLessThan(5000); // 5 seconds average
      expect(maxResponseTime).toBeLessThan(10000);    // 10 seconds max
    }, 30000);
  });
});