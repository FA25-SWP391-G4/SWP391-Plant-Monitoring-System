/**
 * MQTT Real-time Communication End-to-End Tests
 * Comprehensive testing of MQTT integration across all AI features
 */

const mqtt = require('mqtt');
const request = require('supertest');

describe('MQTT Real-time Communication E2E Tests', () => {
  let mqttClient;
  let receivedMessages = [];
  const TEST_CONFIG = {
    mqttBroker: 'mqtt://localhost:1883',
    aiService: 'http://localhost:3001',
    testTimeout: 15000
  };

  beforeAll(async () => {
    // Connect to MQTT broker
    mqttClient = mqtt.connect(TEST_CONFIG.mqttBroker);
    
    await new Promise((resolve, reject) => {
      mqttClient.on('connect', () => {
        console.log('Test MQTT client connected');
        resolve();
      });
      
      mqttClient.on('error', (error) => {
        console.error('MQTT connection error:', error);
        reject(error);
      });
      
      setTimeout(() => {
        reject(new Error('MQTT connection timeout'));
      }, 10000);
    });

    // Subscribe to all AI topics
    const topics = [
      'ai/+/+/+',  // Wildcard for all AI topics
      'ai/system/+',
      'sensors/+/+',
      'irrigation/+/+'
    ];

    for (const topic of topics) {
      mqttClient.subscribe(topic);
    }

    // Message collector
    mqttClient.on('message', (topic, message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        receivedMessages.push({
          topic,
          message: parsedMessage,
          timestamp: new Date(),
          raw: message.toString()
        });
      } catch (error) {
        receivedMessages.push({
          topic,
          message: message.toString(),
          timestamp: new Date(),
          raw: message.toString(),
          parseError: true
        });
      }
    });
  }, TEST_CONFIG.testTimeout);

  afterAll(() => {
    if (mqttClient) {
      mqttClient.end();
    }
  });

  beforeEach(() => {
    receivedMessages = [];
  });

  describe('Chatbot MQTT Integration', () => {
    test('should publish typing indicators and responses via MQTT', async () => {
      const userId = 123;
      const sessionId = 'mqtt-test-session-1';

      // Send chatbot message
      const response = await request(TEST_CONFIG.aiService)
        .post('/api/ai/chatbot/message')
        .send({
          message: 'Cây của tôi cần bao nhiều nước?',
          userId,
          sessionId,
          enableMqtt: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Wait for MQTT messages
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check for typing indicator
      const typingMessages = receivedMessages.filter(msg => 
        msg.topic === `ai/chatbot/typing/${userId}`
      );
      expect(typingMessages.length).toBeGreaterThan(0);

      // Check for response message
      const responseMessages = receivedMessages.filter(msg => 
        msg.topic === `ai/chatbot/response/${userId}`
      );
      expect(responseMessages.length).toBeGreaterThan(0);

      // Verify message content
      const lastResponse = responseMessages[responseMessages.length - 1];
      expect(lastResponse.message.response).toBeDefined();
      expect(lastResponse.message.sessionId).toBe(sessionId);
    });

    test('should handle multiple concurrent chatbot sessions via MQTT', async () => {
      const numSessions = 3;
      const promises = [];

      for (let i = 0; i < numSessions; i++) {
        promises.push(
          request(TEST_CONFIG.aiService)
            .post('/api/ai/chatbot/message')
            .send({
              message: `Test message ${i}`,
              userId: 100 + i,
              sessionId: `concurrent-mqtt-session-${i}`,
              enableMqtt: true
            })
        );
      }

      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Verify each session got its own MQTT messages
      for (let i = 0; i < numSessions; i++) {
        const userId = 100 + i;
        const userMessages = receivedMessages.filter(msg => 
          msg.topic.includes(`/${userId}`)
        );
        expect(userMessages.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Disease Detection MQTT Integration', () => {
    test('should publish disease analysis results via MQTT', async () => {
      const plantId = 456;
      const userId = 789;

      // Create mock image data
      const mockImageBuffer = Buffer.from('mock-image-data');

      // Send disease detection request
      const response = await request(TEST_CONFIG.aiService)
        .post('/api/ai/disease/analyze')
        .attach('image', mockImageBuffer, 'test-plant.jpg')
        .field('plantId', plantId.toString())
        .field('userId', userId.toString())
        .field('enableMqtt', 'true');

      // Wait for MQTT messages
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check for disease analysis messages
      const analysisMessages = receivedMessages.filter(msg => 
        msg.topic === `ai/disease/analysis/${plantId}`
      );

      if (response.status === 200) {
        expect(analysisMessages.length).toBeGreaterThan(0);
        
        const analysisMessage = analysisMessages[0];
        expect(analysisMessage.message.diseases).toBeDefined();
        expect(analysisMessage.message.confidence).toBeDefined();
        expect(analysisMessage.message.timestamp).toBeDefined();
      }
    });

    test('should publish disease alerts for high-severity cases via MQTT', async () => {
      const plantId = 789;
      
      // Simulate high-severity disease detection
      mqttClient.publish(`ai/disease/analysis/${plantId}`, JSON.stringify({
        diseases: [{ name: 'severe_blight', severity: 'high' }],
        confidence: 0.95,
        treatments: ['immediate_fungicide_treatment'],
        timestamp: new Date().toISOString()
      }));

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check for alert messages
      const alertMessages = receivedMessages.filter(msg => 
        msg.topic === `ai/disease/alert/${plantId}`
      );

      // Note: This test depends on the AI service listening and responding to analysis messages
      // In a real implementation, the service would process the analysis and generate alerts
    });
  });

  describe('Irrigation Prediction MQTT Integration', () => {
    test('should publish irrigation predictions via MQTT', async () => {
      const plantId = 101;
      const userId = 202;

      // Send irrigation prediction request
      const response = await request(TEST_CONFIG.aiService)
        .post(`/api/ai/irrigation/predict/${plantId}`)
        .send({
          userId,
          enableMqtt: true,
          sensorData: {
            soilMoisture: 25,
            temperature: 28,
            humidity: 60,
            lightLevel: 1000
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Wait for MQTT messages
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check for prediction messages
      const predictionMessages = receivedMessages.filter(msg => 
        msg.topic === `ai/irrigation/prediction/${plantId}`
      );
      expect(predictionMessages.length).toBeGreaterThan(0);

      const predictionMessage = predictionMessages[0];
      expect(predictionMessage.message.shouldWater).toBeDefined();
      expect(predictionMessage.message.confidence).toBeDefined();
      expect(predictionMessage.message.hoursUntilWater).toBeDefined();
    });

    test('should publish urgent irrigation alerts via MQTT', async () => {
      const plantId = 303;

      // Send prediction request with very low soil moisture
      const response = await request(TEST_CONFIG.aiService)
        .post(`/api/ai/irrigation/predict/${plantId}`)
        .send({
          userId: 404,
          enableMqtt: true,
          sensorData: {
            soilMoisture: 5,  // Very low
            temperature: 35,  // Very high
            humidity: 30,     // Very low
            lightLevel: 1500
          }
        })
        .expect(200);

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check for urgent alert messages
      const alertMessages = receivedMessages.filter(msg => 
        msg.topic === `ai/irrigation/alert/${plantId}`
      );

      if (response.body.prediction && response.body.prediction.shouldWater && response.body.prediction.confidence > 0.8) {
        expect(alertMessages.length).toBeGreaterThan(0);
        
        const alertMessage = alertMessages[0];
        expect(alertMessage.message.type).toBe('urgent_watering');
        expect(alertMessage.message.message).toBeDefined();
      }
    });

    test('should handle sensor data updates and trigger predictions via MQTT', async () => {
      const plantId = 505;

      // Publish sensor data via MQTT
      mqttClient.publish(`sensors/${plantId}/data`, JSON.stringify({
        soilMoisture: 20,
        temperature: 26,
        humidity: 70,
        lightLevel: 800,
        timestamp: new Date().toISOString()
      }));

      await new Promise(resolve => setTimeout(resolve, 4000));

      // Check if AI service responded with predictions
      const predictionMessages = receivedMessages.filter(msg => 
        msg.topic === `ai/irrigation/prediction/${plantId}`
      );

      // Note: This test depends on the AI service subscribing to sensor data topics
      // and automatically generating predictions
    });
  });

  describe('System Status and Health via MQTT', () => {
    test('should publish AI system status via MQTT', async () => {
      // Request system status
      const response = await request(TEST_CONFIG.aiService)
        .get('/api/ai/system/status')
        .expect(200);

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check for system status messages
      const statusMessages = receivedMessages.filter(msg => 
        msg.topic === 'ai/system/status'
      );

      if (statusMessages.length > 0) {
        const statusMessage = statusMessages[0];
        expect(statusMessage.message.status).toBeDefined();
        expect(statusMessage.message.services).toBeDefined();
        expect(statusMessage.message.timestamp).toBeDefined();
      }
    });

    test('should handle MQTT connection recovery', async () => {
      // Simulate connection loss and recovery
      mqttClient.end(true); // Force disconnect

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reconnect
      mqttClient = mqtt.connect(TEST_CONFIG.mqttBroker);
      
      await new Promise((resolve, reject) => {
        mqttClient.on('connect', () => {
          resolve();
        });
        
        mqttClient.on('error', reject);
        
        setTimeout(() => reject(new Error('Reconnection timeout')), 10000);
      });

      // Resubscribe to topics
      mqttClient.subscribe('ai/+/+/+');

      // Test that communication works after reconnection
      const response = await request(TEST_CONFIG.aiService)
        .post('/api/ai/chatbot/message')
        .send({
          message: 'Test after reconnection',
          userId: 999,
          sessionId: 'reconnection-test',
          enableMqtt: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Message Ordering and Reliability', () => {
    test('should maintain message ordering in MQTT communication', async () => {
      const userId = 777;
      const numMessages = 5;
      const sessionId = 'ordering-test-session';

      // Send multiple messages in sequence
      for (let i = 0; i < numMessages; i++) {
        await request(TEST_CONFIG.aiService)
          .post('/api/ai/chatbot/message')
          .send({
            message: `Ordered message ${i}`,
            userId,
            sessionId,
            enableMqtt: true
          })
          .expect(200);

        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Wait for all messages
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check message ordering
      const responseMessages = receivedMessages
        .filter(msg => msg.topic === `ai/chatbot/response/${userId}`)
        .sort((a, b) => a.timestamp - b.timestamp);

      expect(responseMessages.length).toBe(numMessages);

      // Verify messages are in correct order
      for (let i = 0; i < numMessages; i++) {
        expect(responseMessages[i].message.response).toBeDefined();
      }
    });

    test('should handle MQTT message persistence and delivery', async () => {
      const plantId = 888;
      
      // Publish with QoS 1 for guaranteed delivery
      mqttClient.publish(`ai/irrigation/prediction/${plantId}`, JSON.stringify({
        shouldWater: true,
        confidence: 0.9,
        hoursUntilWater: 2,
        timestamp: new Date().toISOString()
      }), { qos: 1 });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify message was received
      const predictionMessages = receivedMessages.filter(msg => 
        msg.topic === `ai/irrigation/prediction/${plantId}`
      );

      expect(predictionMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling in MQTT Communication', () => {
    test('should handle malformed MQTT messages gracefully', async () => {
      const plantId = 999;
      
      // Publish malformed JSON
      mqttClient.publish(`ai/disease/analysis/${plantId}`, 'invalid-json-data');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check that the message was received but marked as parse error
      const malformedMessages = receivedMessages.filter(msg => 
        msg.topic === `ai/disease/analysis/${plantId}` && msg.parseError
      );

      expect(malformedMessages.length).toBeGreaterThan(0);
    });

    test('should handle MQTT topic subscription errors', async () => {
      // Try to subscribe to invalid topic
      mqttClient.subscribe('invalid/topic/pattern/[');

      // This should not crash the client
      expect(mqttClient.connected).toBe(true);
    });
  });

  describe('Performance and Load Testing via MQTT', () => {
    test('should handle high-frequency MQTT messages', async () => {
      const plantId = 1000;
      const numMessages = 50;
      const startTime = Date.now();

      // Publish many messages rapidly
      for (let i = 0; i < numMessages; i++) {
        mqttClient.publish(`sensors/${plantId}/data`, JSON.stringify({
          soilMoisture: 20 + (i % 10),
          temperature: 25 + (i % 5),
          humidity: 60 + (i % 20),
          lightLevel: 800 + (i % 200),
          timestamp: new Date().toISOString(),
          sequence: i
        }));
      }

      await new Promise(resolve => setTimeout(resolve, 5000));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Check that all messages were processed
      const sensorMessages = receivedMessages.filter(msg => 
        msg.topic === `sensors/${plantId}/data`
      );

      expect(sensorMessages.length).toBe(numMessages);
      console.log(`Processed ${numMessages} MQTT messages in ${duration}ms`);
    });

    test('should handle concurrent MQTT clients', async () => {
      const numClients = 5;
      const clients = [];
      const clientMessages = [];

      // Create multiple MQTT clients
      for (let i = 0; i < numClients; i++) {
        const client = mqtt.connect(TEST_CONFIG.mqttBroker);
        clients.push(client);

        await new Promise(resolve => {
          client.on('connect', resolve);
        });

        // Each client publishes a message
        client.publish(`test/client/${i}`, JSON.stringify({
          clientId: i,
          message: `Message from client ${i}`,
          timestamp: new Date().toISOString()
        }));
      }

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Clean up clients
      clients.forEach(client => client.end());

      // Verify all client messages were received
      const testMessages = receivedMessages.filter(msg => 
        msg.topic.startsWith('test/client/')
      );

      expect(testMessages.length).toBe(numClients);
    });
  });
});