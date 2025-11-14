const request = require('supertest');
const app = require('../app');
const openRouterService = require('../services/openRouterService');
const ChatHistory = require('../models/ChatHistory');

// Mock the database
const mockQuery = jest.fn();
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: mockQuery
  }))
}));

// Mock JWT for testing
const jwt = require('jsonwebtoken');
const testToken = jwt.sign({ user_id: 1, id: 1 }, process.env.JWT_SECRET || 'test-secret');

describe('AI Service - Chatbot Integration Tests', () => {
  
  beforeEach(() => {
    // Reset mocks before each test
    mockQuery.mockClear();
    jest.clearAllMocks();
    
    // Clear OpenRouter service queue
    openRouterService.clearQueue();
  });

  describe('Basic Endpoint Tests', () => {
    test('Health check should work', async () => {
      const response = await request(app)
        .get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('plant-monitoring-ai-service');
    });

    test('POST /api/chatbot/query should require authentication', async () => {
      const response = await request(app)
        .post('/api/chatbot/query')
        .send({
          message: 'How to water plants?'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/chatbot/query should validate message', async () => {
      const response = await request(app)
        .post('/api/chatbot/query')
        .set('Authorization', `Bearer ${testToken}`)
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('OpenRouter API Integration Tests', () => {
    test('Should process plant-related queries with OpenRouter integration', async () => {
      // Mock database operations
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // getConversationContext
        .mockResolvedValueOnce({ rows: [{ chat_id: 1, user_id: 1, chat_id: 'test-conv' }] }); // createChat

      const response = await request(app)
        .post('/api/chatbot/query')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'How often should I water my tomato plants?',
          context: { 
            plantType: 'tomato',
            currentMoisture: 45,
            temperature: 24,
            humidity: 60
          }
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('response');
      expect(response.body.data).toHaveProperty('chat_id');
      expect(response.body.data).toHaveProperty('isPlantRelated');
      expect(response.body.data).toHaveProperty('confidence');
      expect(response.body.data).toHaveProperty('source');
      expect(response.body.data.isPlantRelated).toBe(true);
      expect(typeof response.body.data.response).toBe('string');
      expect(response.body.data.response.length).toBeGreaterThan(0);
    });

    test('Should reject non-plant queries with appropriate response', async () => {
      // Mock database operations
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // getConversationContext
        .mockResolvedValueOnce({ rows: [{ chat_id: 1, user_id: 1, chat_id: 'test-conv' }] }); // createChat

      const response = await request(app)
        .post('/api/chatbot/query')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'What is the weather today?'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isPlantRelated).toBe(false);
      expect(response.body.data.response).toContain('plant');
      expect(response.body.data.source).toBe('fallback');
      expect(response.body.data.confidence).toBe(1.0);
    });

    test('Should handle OpenRouter API errors gracefully', async () => {
      // Mock database operations
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // getConversationContext
        .mockResolvedValueOnce({ rows: [{ chat_id: 1, user_id: 1, chat_id: 'test-conv' }] }); // createChat

      // Temporarily disable API key to trigger error handling
      const originalApiKey = openRouterService.apiKey;
      openRouterService.apiKey = null;

      const response = await request(app)
        .post('/api/chatbot/query')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'How do I care for my plants?'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isPlantRelated).toBe(true);
      expect(response.body.data.source).toBe('fallback');
      expect(response.body.data.confidence).toBeLessThan(1.0);
      expect(response.body.data.response).toContain('offline mode');

      // Restore API key
      openRouterService.apiKey = originalApiKey;
    });

    test('Should include plant context in OpenRouter requests', async () => {
      // Mock database operations
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // getConversationContext
        .mockResolvedValueOnce({ rows: [{ chat_id: 1, user_id: 1, chat_id: 'test-conv' }] }); // createChat

      const plantContext = {
        plantType: 'tomato',
        currentMoisture: 30,
        temperature: 26,
        humidity: 55,
        lastWatering: '2024-10-15T10:30:00Z'
      };

      const response = await request(app)
        .post('/api/chatbot/query')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'Should I water my plant now?',
          context: plantContext
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isPlantRelated).toBe(true);
      
      // Verify that context was stored in database
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO chat_history'),
        expect.arrayContaining([
          1, // user_id
          null, // plant_id
          expect.any(String), // chat_id
          'Should I water my plant now?', // message
          expect.any(String), // response
          expect.stringContaining('tomato'), // context should include plant type
          expect.any(Date) // created_at
        ])
      );
    });
  });

  describe('Conversation Context Management Tests', () => {
    test('Should maintain conversation context across multiple messages', async () => {
      const conversationId = 'test-conversation-123';
      
      // Mock conversation history
      const mockHistory = [
        {
          message: 'Hello, I need help with my plants',
          response: 'I\'d be happy to help with your plant care questions!',
          created_at: new Date('2024-10-15T10:00:00Z')
        },
        {
          message: 'My tomato plant leaves are yellowing',
          response: 'Yellowing leaves on tomato plants can indicate several issues...',
          created_at: new Date('2024-10-15T10:05:00Z')
        }
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: mockHistory }) // getConversationContext
        .mockResolvedValueOnce({ rows: [{ chat_id: 3, user_id: 1, chat_id: conversationId }] }); // createChat

      const response = await request(app)
        .post('/api/chatbot/query')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'What should I do about it?',
          chat_id: conversationId,
          context: { plantType: 'tomato' }
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.chat_id).toBe(conversationId);
      
      // Verify conversation context was retrieved
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT user_message, ai_response, created_at'),
        [conversationId, 10]
      );
    });

    test('Should generate new conversation ID when not provided', async () => {
      // Mock database operations
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // getConversationContext
        .mockResolvedValueOnce({ rows: [{ chat_id: 1, user_id: 1, chat_id: 'generated-conv' }] }); // createChat

      const response = await request(app)
        .post('/api/chatbot/query')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'How do I start a garden?'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('chat_id');
      expect(response.body.data.chat_id).toMatch(/^conv_\d+_[a-z0-9]+$/);
    });

    test('Should store conversation history in database', async () => {
      const conversationId = 'test-storage-conv';
      const plantId = 42;
      
      // Mock database operations
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // getConversationContext
        .mockResolvedValueOnce({ rows: [{ chat_id: 1, user_id: 1, chat_id: conversationId }] }); // createChat

      const response = await request(app)
        .post('/api/chatbot/query')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'How much water does a succulent need?',
          chat_id: conversationId,
          plant_id: plantId,
          context: { plantType: 'succulent', currentMoisture: 20 }
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify chat history was stored with correct parameters
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO chat_history'),
        expect.arrayContaining([
          1, // user_id
          plantId, // plant_id
          conversationId, // chat_id
          'How much water does a succulent need?', // message
          expect.any(String), // response
          expect.stringContaining('succulent'), // context
          expect.any(Date) // created_at
        ])
      );
    });
  });

  describe('Chat History Management Tests', () => {
    test('GET /api/chatbot/history should return user chat history', async () => {
      const mockChatHistory = [
        {
          chat_id: 1,
          user_id: 1,
          plant_id: null,
          chat_id: 'conv-1',
          message: 'How to water plants?',
          response: 'Water when soil is dry...',
          context: '{}',
          created_at: new Date()
        },
        {
          chat_id: 2,
          user_id: 1,
          plant_id: 42,
          chat_id: 'conv-2',
          message: 'My plant is wilting',
          response: 'Wilting can be caused by...',
          context: '{"plantType": "tomato"}',
          created_at: new Date()
        }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockChatHistory });

      const response = await request(app)
        .get('/api/chatbot/history')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('chats');
      expect(response.body.data.chats).toHaveLength(2);
      expect(response.body.data.user_id).toBe(1);
      
      // Verify database query
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM chat_history'),
        [1, 50] // user_id, limit
      );
    });

    test('GET /api/chatbot/conversation/:id should return specific conversation', async () => {
      const conversationId = 'test-conversation-456';
      const mockConversation = [
        {
          chat_id: 1,
          user_id: 1,
          chat_id: conversationId,
          message: 'Hello',
          response: 'Hi there!',
          context: '{}',
          created_at: new Date()
        }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockConversation });

      const response = await request(app)
        .get(`/api/chatbot/conversation/${conversationId}`)
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.chat_id).toBe(conversationId);
      expect(response.body.data.messages).toHaveLength(1);
      
      // Verify database query
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM chat_history'),
        [conversationId, 50]
      );
    });

    test('Should handle database errors gracefully', async () => {
      // Mock database error
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/chatbot/query')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'How to care for plants?'
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to process chatbot query');
    });
  });

  describe('Service Status Tests', () => {
    test('GET /api/chatbot/status should return comprehensive service status', async () => {
      const response = await request(app)
        .get('/api/chatbot/status')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('service');
      expect(response.body.data.service).toBe('chatbot');
      expect(response.body.data).toHaveProperty('configured');
      expect(response.body.data).toHaveProperty('model');
      expect(response.body.data).toHaveProperty('queueLength');
      expect(response.body.data).toHaveProperty('rateLimitConfig');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });

  describe('Rate Limiting and Error Handling Tests', () => {
    test('Should handle rate limiting appropriately', async () => {
      // Mock database operations for multiple requests
      mockQuery
        .mockResolvedValue({ rows: [] }) // getConversationContext
        .mockResolvedValue({ rows: [{ chat_id: 1, user_id: 1, chat_id: 'test-conv' }] }); // createChat

      // Make multiple rapid requests to test rate limiting
      const requests = Array.from({ length: 3 }, (_, i) => 
        request(app)
          .post('/api/chatbot/query')
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            message: `Plant question ${i + 1}: How to water plants?`
          })
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed (rate limiting is handled internally)
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('Should validate request parameters properly', async () => {
      const testCases = [
        { body: { message: '' }, expectedStatus: 400 },
        { body: { message: null }, expectedStatus: 400 },
        { body: { message: undefined }, expectedStatus: 400 },
        { body: {}, expectedStatus: 400 }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/chatbot/query')
          .set('Authorization', `Bearer ${testToken}`)
          .send(testCase.body);
        
        expect(response.status).toBe(testCase.expectedStatus);
        expect(response.body.success).toBe(false);
      }
    });
  });

  afterEach(() => {
    // Clean up after each test
    openRouterService.clearQueue();
  });
});