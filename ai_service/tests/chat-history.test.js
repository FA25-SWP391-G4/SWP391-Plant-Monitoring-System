const ChatHistory = require('../models/ChatHistory');

// Mock the database
const mockQuery = jest.fn();
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: mockQuery
  }))
}));

describe('ChatHistory Model Integration Tests', () => {
  
  beforeEach(() => {
    // Reset mocks before each test
    mockQuery.mockClear();
    jest.clearAllMocks();
  });

  describe('Chat Creation and Storage', () => {
    test('Should create chat history entry with all parameters', async () => {
      const mockResult = {
        rows: [{
          chat_id: 1,
          user_id: 123,
          plant_id: 456,
          conversation_id: 'conv-test-123',
          message: 'How often should I water my plants?',
          response: 'Water when the top inch of soil is dry.',
          context: '{"plantType": "tomato", "currentMoisture": 45}',
          created_at: new Date('2024-10-15T10:30:00Z')
        }]
      };
      
      mockQuery.mockResolvedValueOnce(mockResult);
      
      const result = await ChatHistory.createChat(
        123, // userId
        'How often should I water my plants?', // userMessage
        'Water when the top inch of soil is dry.', // aiResponse
        456, // plantId
        'conv-test-123', // conversationId
        { plantType: 'tomato', currentMoisture: 45 } // context
      );
      
      expect(result).toBeInstanceOf(ChatHistory);
      expect(result.chat_id).toBe(1);
      expect(result.user_id).toBe(123);
      expect(result.plant_id).toBe(456);
      expect(result.conversation_id).toBe('conv-test-123');
      expect(result.message).toBe('How often should I water my plants?');
      expect(result.response).toBe('Water when the top inch of soil is dry.');
      
      // Verify database query was called correctly
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO chat_history'),
        [
          123, // user_id
          456, // plant_id
          'conv-test-123', // conversation_id
          'How often should I water my plants?', // message
          'Water when the top inch of soil is dry.', // response
          '{"plantType":"tomato","currentMoisture":45}', // context as JSON string
          expect.any(Date) // created_at
        ]
      );
    });

    test('Should create chat history with minimal parameters', async () => {
      const mockResult = {
        rows: [{
          chat_id: 2,
          user_id: 123,
          plant_id: null,
          conversation_id: null,
          message: 'Hello',
          response: null,
          context: '{}',
          created_at: new Date()
        }]
      };
      
      mockQuery.mockResolvedValueOnce(mockResult);
      
      const result = await ChatHistory.createChat(
        123, // userId
        'Hello' // userMessage only
      );
      
      expect(result).toBeInstanceOf(ChatHistory);
      expect(result.user_id).toBe(123);
      expect(result.message).toBe('Hello');
      expect(result.plant_id).toBeNull();
      expect(result.response).toBeNull();
      
      // Verify database query
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO chat_history'),
        [
          123, // user_id
          null, // plant_id
          null, // conversation_id
          'Hello', // message
          null, // response
          '{}', // empty context
          expect.any(Date) // created_at
        ]
      );
    });

    test('Should handle database errors during chat creation', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));
      
      await expect(ChatHistory.createChat(123, 'Test message')).rejects.toThrow('Database connection failed');
      
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('Conversation Context Retrieval', () => {
    test('Should retrieve conversation context in correct format for OpenRouter API', async () => {
      const mockResult = {
        rows: [
          {
            message: 'Hello, I need help with my plants',
            response: 'I\'d be happy to help with your plant care questions!',
            created_at: new Date('2024-10-15T10:00:00Z')
          },
          {
            message: 'My tomato plant leaves are yellowing',
            response: 'Yellowing leaves can indicate overwatering, nutrient deficiency, or disease.',
            created_at: new Date('2024-10-15T10:05:00Z')
          },
          {
            message: 'What should I do about it?',
            response: 'First, check the soil moisture and adjust watering accordingly.',
            created_at: new Date('2024-10-15T10:10:00Z')
          }
        ]
      };
      
      mockQuery.mockResolvedValueOnce(mockResult);
      
      const context = await ChatHistory.getConversationContext('conv-test-123', 10);
      
      expect(context).toHaveLength(6); // 3 user messages + 3 assistant responses
      expect(context[0]).toEqual({
        role: 'user',
        content: 'Hello, I need help with my plants'
      });
      expect(context[1]).toEqual({
        role: 'assistant',
        content: 'I\'d be happy to help with your plant care questions!'
      });
      expect(context[2]).toEqual({
        role: 'user',
        content: 'My tomato plant leaves are yellowing'
      });
      expect(context[3]).toEqual({
        role: 'assistant',
        content: 'Yellowing leaves can indicate overwatering, nutrient deficiency, or disease.'
      });
      
      // Verify database query
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT message, response, created_at'),
        ['conv-test-123', 10]
      );
    });

    test('Should handle empty conversation context', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const context = await ChatHistory.getConversationContext('empty-conv', 10);
      
      expect(context).toHaveLength(0);
      expect(Array.isArray(context)).toBe(true);
    });

    test('Should handle conversation with only user messages', async () => {
      const mockResult = {
        rows: [
          {
            message: 'Hello',
            response: null,
            created_at: new Date()
          },
          {
            message: 'How are you?',
            response: null,
            created_at: new Date()
          }
        ]
      };
      
      mockQuery.mockResolvedValueOnce(mockResult);
      
      const context = await ChatHistory.getConversationContext('user-only-conv', 10);
      
      expect(context).toHaveLength(2);
      expect(context[0]).toEqual({
        role: 'user',
        content: 'Hello'
      });
      expect(context[1]).toEqual({
        role: 'user',
        content: 'How are you?'
      });
    });

    test('Should respect limit parameter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      await ChatHistory.getConversationContext('test-conv', 5);
      
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2'),
        ['test-conv', 5]
      );
    });

    test('Should handle database errors during context retrieval', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database query failed'));
      
      await expect(ChatHistory.getConversationContext('test-conv')).rejects.toThrow('Database query failed');
    });
  });

  describe('User Chat History Retrieval', () => {
    test('Should retrieve user chat history correctly', async () => {
      const mockResult = {
        rows: [
          {
            chat_id: 1,
            user_id: 123,
            plant_id: 456,
            conversation_id: 'conv-1',
            message: 'How to water plants?',
            response: 'Water when soil is dry',
            context: '{"plantType": "tomato"}',
            created_at: new Date('2024-10-15T10:00:00Z')
          },
          {
            chat_id: 2,
            user_id: 123,
            plant_id: null,
            conversation_id: 'conv-2',
            message: 'Plant care tips?',
            response: 'Provide adequate light and water',
            context: '{}',
            created_at: new Date('2024-10-15T09:00:00Z')
          }
        ]
      };
      
      mockQuery.mockResolvedValueOnce(mockResult);
      
      const history = await ChatHistory.findByUserId(123, 50);
      
      expect(history).toHaveLength(2);
      expect(history[0]).toBeInstanceOf(ChatHistory);
      expect(history[0].user_id).toBe(123);
      expect(history[0].message).toBe('How to water plants?');
      expect(history[1].user_id).toBe(123);
      expect(history[1].message).toBe('Plant care tips?');
      
      // Verify database query
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        [123, 50]
      );
    });

    test('Should handle empty user history', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const history = await ChatHistory.findByUserId(999, 50);
      
      expect(history).toHaveLength(0);
      expect(Array.isArray(history)).toBe(true);
    });

    test('Should respect limit parameter for user history', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      await ChatHistory.findByUserId(123, 25);
      
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2'),
        [123, 25]
      );
    });
  });

  describe('Conversation History Retrieval', () => {
    test('Should retrieve conversation history by conversation ID', async () => {
      const mockResult = {
        rows: [
          {
            chat_id: 1,
            user_id: 123,
            conversation_id: 'conv-test',
            message: 'First message',
            response: 'First response',
            context: '{}',
            created_at: new Date('2024-10-15T10:00:00Z')
          },
          {
            chat_id: 2,
            user_id: 123,
            conversation_id: 'conv-test',
            message: 'Second message',
            response: 'Second response',
            context: '{}',
            created_at: new Date('2024-10-15T10:05:00Z')
          }
        ]
      };
      
      mockQuery.mockResolvedValueOnce(mockResult);
      
      const conversation = await ChatHistory.findByConversationId('conv-test', 50);
      
      expect(conversation).toHaveLength(2);
      expect(conversation[0]).toBeInstanceOf(ChatHistory);
      expect(conversation[0].conversation_id).toBe('conv-test');
      expect(conversation[0].message).toBe('First message');
      expect(conversation[1].conversation_id).toBe('conv-test');
      expect(conversation[1].message).toBe('Second message');
      
      // Verify database query (should order by created_at ASC for conversation flow)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE conversation_id = $1'),
        ['conv-test', 50]
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at ASC'),
        ['conv-test', 50]
      );
    });

    test('Should handle non-existent conversation ID', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const conversation = await ChatHistory.findByConversationId('non-existent', 50);
      
      expect(conversation).toHaveLength(0);
      expect(Array.isArray(conversation)).toBe(true);
    });
  });

  describe('Chat History Cleanup', () => {
    test('Should cleanup old chat history', async () => {
      const mockResult = { rowCount: 15 };
      mockQuery.mockResolvedValueOnce(mockResult);
      
      const deletedCount = await ChatHistory.cleanupOldHistory(90);
      
      expect(deletedCount).toBe(15);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM chat_history'),
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('90 days')
      );
    });

    test('Should handle cleanup with custom retention period', async () => {
      const mockResult = { rowCount: 5 };
      mockQuery.mockResolvedValueOnce(mockResult);
      
      const deletedCount = await ChatHistory.cleanupOldHistory(30);
      
      expect(deletedCount).toBe(5);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('30 days')
      );
    });

    test('Should handle cleanup errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Cleanup failed'));
      
      await expect(ChatHistory.cleanupOldHistory(90)).rejects.toThrow('Cleanup failed');
    });
  });

  describe('ChatHistory Instance Methods', () => {
    test('Should convert ChatHistory instance to JSON correctly', () => {
      const chatData = {
        chat_id: 1,
        user_id: 123,
        plant_id: 456,
        conversation_id: 'conv-test',
        message: 'Test message',
        response: 'Test response',
        context: { plantType: 'tomato' },
        created_at: new Date('2024-10-15T10:30:00Z')
      };
      
      const chat = new ChatHistory(chatData);
      const json = chat.toJSON();
      
      expect(json).toEqual({
        chat_id: 1,
        user_id: 123,
        plant_id: 456,
        conversation_id: 'conv-test',
        message: 'Test message',
        response: 'Test response',
        context: { plantType: 'tomato' },
        created_at: new Date('2024-10-15T10:30:00Z')
      });
    });

    test('Should handle alternative field names in constructor', () => {
      const chatData = {
        chat_id: 1,
        user_id: 123,
        user_message: 'Alternative message field',
        ai_response: 'Alternative response field',
        timestamp: new Date('2024-10-15T10:30:00Z')
      };
      
      const chat = new ChatHistory(chatData);
      
      expect(chat.message).toBe('Alternative message field');
      expect(chat.response).toBe('Alternative response field');
      expect(chat.created_at).toEqual(new Date('2024-10-15T10:30:00Z'));
    });
  });

  afterEach(() => {
    // Clean up after each test
    mockQuery.mockClear();
  });
});