const ChatHistory = require('../../../models/ChatHistory');
const { pool } = require('../../../config/db');

jest.mock('../../../config/db');

describe('ChatHistory Model - Unit Tests', () => {
  let mockQuery;

  beforeEach(() => {
    mockQuery = jest.fn();
    pool.query = mockQuery;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    test('should create ChatHistory instance with all fields', () => {
      const chatData = {
        chat_id: 1,
        user_id: 100,
        plant_id: 50,
        conversation_id: 'conv-123',
        message: 'How to water plants?',
        response: 'Water regularly',
        context: { source: 'web' },
        created_at: new Date()
      };

      const chat = new ChatHistory(chatData);

      expect(chat.chat_id).toBe(1);
      expect(chat.user_id).toBe(100);
      expect(chat.plant_id).toBe(50);
      expect(chat.conversation_id).toBe('conv-123');
      expect(chat.message).toBe('How to water plants?');
      expect(chat.response).toBe('Water regularly');
    });

    test('should support legacy field names (user_message, ai_response)', () => {
      const chatData = {
        user_message: 'Legacy message',
        ai_response: 'Legacy response',
        timestamp: new Date()
      };

      const chat = new ChatHistory(chatData);

      expect(chat.message).toBe('Legacy message');
      expect(chat.response).toBe('Legacy response');
      expect(chat.user_message).toBe('Legacy message');
      expect(chat.ai_response).toBe('Legacy response');
    });

    test('should handle timestamp/created_at field mapping', () => {
      const timestamp = new Date();
      const chatData = { timestamp };

      const chat = new ChatHistory(chatData);

      expect(chat.created_at).toEqual(timestamp);
      expect(chat.timestamp).toEqual(timestamp);
    });
  });

  describe('findAll', () => {
    test('should retrieve all chat history with default limit', async () => {
      const mockRows = [
        { chat_id: 1, user_id: 100, user_message: 'Test 1', user_name: 'John' },
        { chat_id: 2, user_id: 101, user_message: 'Test 2', user_name: 'Jane' }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await ChatHistory.findAll();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT ch.*, u.family_name'), [100]);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ChatHistory);
    });

    test('should retrieve chat history with custom limit', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await ChatHistory.findAll(50);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [50]);
    });

    test('should throw error on database failure', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(ChatHistory.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    test('should find chat history by ID', async () => {
      const mockRow = { chat_id: 1, user_id: 100, user_message: 'Test' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await ChatHistory.findById(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE ch.chat_id = $1'), [1]);
      expect(result).toBeInstanceOf(ChatHistory);
      expect(result.chat_id).toBe(1);
    });

    test('should return null when chat not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await ChatHistory.findById(999);

      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      mockQuery.mockRejectedValue(new Error('Connection lost'));

      await expect(ChatHistory.findById(1)).rejects.toThrow('Connection lost');
    });
  });

  describe('findByUserId', () => {
    test('should find chat history by user ID with default limit', async () => {
      const mockRows = [
        { chat_id: 1, user_id: 100, user_message: 'Test 1' },
        { chat_id: 2, user_id: 100, user_message: 'Test 2' }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await ChatHistory.findByUserId(100);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE ch.user_id = $1'), [100, 50]);
      expect(result).toHaveLength(2);
    });

    test('should find chat history with custom limit', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await ChatHistory.findByUserId(100, 20);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [100, 20]);
    });
  });

  describe('findRecentByUserId', () => {
    test('should find recent conversations with default days', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await ChatHistory.findRecentByUserId(100);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '7 days'"), [100]);
    });

    test('should find recent conversations with custom days', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await ChatHistory.findRecentByUserId(100, 30);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '30 days'"), [100]);
    });
  });

  describe('searchByMessage', () => {
    test('should search chat history by message content', async () => {
      const mockRows = [{ chat_id: 1, user_message: 'water plant' }];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await ChatHistory.searchByMessage(100, 'water', 20);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        [100, '%water%', 20]
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getChatStatsForUser', () => {
    test('should get chat statistics for user', async () => {
      const mockStats = {
        total_conversations: 10,
        responded_conversations: 8,
        avg_message_length: 50,
        avg_response_length: 100
      };
      mockQuery.mockResolvedValue({ rows: [mockStats] });

      const result = await ChatHistory.getChatStatsForUser(100, 30);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('COUNT(*)'), [100]);
      expect(result.total_conversations).toBe(10);
    });
  });

  describe('getOverallChatStats', () => {
    test('should get overall chat statistics', async () => {
      const mockStats = {
        total_conversations: 100,
        unique_users: 25,
        responded_conversations: 80
      };
      mockQuery.mockResolvedValue({ rows: [mockStats] });

      const result = await ChatHistory.getOverallChatStats(30);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('COUNT(DISTINCT user_id)'));
      expect(result.unique_users).toBe(25);
    });
  });

  describe('save', () => {
    test('should create new chat history when no chat_id exists', async () => {
      const mockRow = { chat_id: 1, user_id: 100, message: 'New message' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const chat = new ChatHistory({
        user_id: 100,
        message: 'New message'
      });

      const result = await chat.save();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO chat_history'),
        expect.any(Array)
      );
      expect(result.chat_id).toBe(1);
    });

    test('should update existing chat history when chat_id exists', async () => {
      const mockRow = { chat_id: 1, user_id: 100, message: 'Updated message' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const chat = new ChatHistory({
        chat_id: 1,
        user_id: 100,
        message: 'Updated message'
      });

      const result = await chat.save();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE chat_history'),
        expect.arrayContaining([1])
      );
      expect(result.message).toBe('Updated message');
    });

    test('should stringify context object when saving', async () => {
      const mockRow = { chat_id: 1, context: {} };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const chat = new ChatHistory({
        user_id: 100,
        message: 'Test',
        context: { key: 'value' }
      });

      await chat.save();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([JSON.stringify({ key: 'value' })])
      );
    });
  });

  describe('updateAIResponse', () => {
    test('should update AI response', async () => {
      const mockRow = { chat_id: 1, ai_response: 'New response' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const chat = new ChatHistory({ chat_id: 1 });
      const result = await chat.updateAIResponse('New response');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE chat_history'),
        ['New response', 1]
      );
      expect(result.ai_response).toBe('New response');
    });
  });

  describe('delete', () => {
    test('should delete chat history', async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });

      const chat = new ChatHistory({ chat_id: 1 });
      const result = await chat.delete();

      expect(mockQuery).toHaveBeenCalledWith('DELETE FROM chat_history WHERE chat_id = $1', [1]);
      expect(result).toBe(true);
    });

    test('should throw error when deleting without chat_id', async () => {
      const chat = new ChatHistory({});

      await expect(chat.delete()).rejects.toThrow('Cannot delete chat history without ID');
    });
  });

  describe('createChat', () => {
    test('should create new chat entry', async () => {
      const mockRow = { chat_id: 1, user_id: 100, message: 'Test message' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await ChatHistory.createChat(100, 'Test message', 'AI response', 50, 'conv-1', {});

      expect(result).toBeInstanceOf(ChatHistory);
      expect(result.chat_id).toBe(1);
    });
  });

  describe('findByConversationId', () => {
    test('should find chat history by conversation ID', async () => {
      const mockRows = [
        { chat_id: 1, conversation_id: 'conv-1' },
        { chat_id: 2, conversation_id: 'conv-1' }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await ChatHistory.findByConversationId('conv-1');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ch.conversation_id = $1'),
        ['conv-1', 50]
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('getConversationContext (static)', () => {
    test('should format messages for OpenRouter API', async () => {
      const mockRows = [
        { message: 'User question', response: 'AI answer', created_at: new Date() },
        { message: 'Follow-up', response: 'Another answer', created_at: new Date() }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await ChatHistory.getConversationContext('conv-1', 10);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ role: 'user', content: 'User question' });
      expect(result[1]).toEqual({ role: 'assistant', content: 'AI answer' });
    });
  });

  describe('deleteUserHistory', () => {
    test('should delete all chat history for user', async () => {
      mockQuery.mockResolvedValue({ rowCount: 5 });

      const result = await ChatHistory.deleteUserHistory(100);

      expect(mockQuery).toHaveBeenCalledWith('DELETE FROM chat_history WHERE user_id = $1', [100]);
      expect(result).toBe(5);
    });
  });

  describe('cleanupOldHistory', () => {
    test('should cleanup old chat history with default days', async () => {
      mockQuery.mockResolvedValue({ rowCount: 10 });

      const result = await ChatHistory.cleanupOldHistory();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '90 days'"));
      expect(result).toBe(10);
    });
  });

  describe('getConversationContext (instance)', () => {
    test('should get conversation context in chronological order', async () => {
      const mockRows = [
        { chat_id: 2, user_message: 'Second' },
        { chat_id: 1, user_message: 'First' }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const chat = new ChatHistory({ user_id: 100, timestamp: new Date() });
      const result = await chat.getConversationContext(5);

      expect(result[0].chat_id).toBe(1);
      expect(result[1].chat_id).toBe(2);
    });
  });

  describe('isPlantRelated', () => {
    test('should return true for plant-related messages', () => {
      const chat = new ChatHistory({ user_message: 'How to water my plant?' });
      expect(chat.isPlantRelated()).toBe(true);
    });

    test('should return false for non-plant messages', () => {
      const chat = new ChatHistory({ user_message: 'What is the weather?' });
      expect(chat.isPlantRelated()).toBe(false);
    });

    test('should handle missing message', () => {
      const chat = new ChatHistory({});
      expect(chat.isPlantRelated()).toBe(false);
    });
  });

  describe('getAgeString', () => {
    test('should return "Just now" for very recent messages', () => {
      const chat = new ChatHistory({ timestamp: new Date() });
      expect(chat.getAgeString()).toBe('Just now');
    });

    test('should return minutes for recent messages', () => {
      const timestamp = new Date(Date.now() - 5 * 60 * 1000);
      const chat = new ChatHistory({ timestamp });
      expect(chat.getAgeString()).toBe('5m ago');
    });

    test('should return hours for older messages', () => {
      const timestamp = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const chat = new ChatHistory({ timestamp });
      expect(chat.getAgeString()).toBe('3h ago');
    });

    test('should return days for very old messages', () => {
      const timestamp = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const chat = new ChatHistory({ timestamp });
      expect(chat.getAgeString()).toBe('5d ago');
    });

    test('should return "Unknown" when no timestamp', () => {
      const chat = new ChatHistory({});
      expect(chat.getAgeString()).toBe('Unknown');
    });
  });

  describe('getMessagePreview', () => {
    test('should return full message if shorter than max length', () => {
      const chat = new ChatHistory({ user_message: 'Short message' });
      expect(chat.getMessagePreview(100)).toBe('Short message');
    });

    test('should truncate long messages', () => {
      const longMessage = 'a'.repeat(150);
      const chat = new ChatHistory({ user_message: longMessage });
      const preview = chat.getMessagePreview(100);
      
      expect(preview.length).toBe(100);
      expect(preview.endsWith('...')).toBe(true);
    });

    test('should return empty string for missing message', () => {
      const chat = new ChatHistory({});
      expect(chat.getMessagePreview()).toBe('');
    });
  });

  describe('getResponsePreview', () => {
    test('should return full response if shorter than max length', () => {
      const chat = new ChatHistory({ ai_response: 'Short response' });
      expect(chat.getResponsePreview(100)).toBe('Short response');
    });

    test('should truncate long responses', () => {
      const longResponse = 'b'.repeat(150);
      const chat = new ChatHistory({ ai_response: longResponse });
      const preview = chat.getResponsePreview(100);
      
      expect(preview.length).toBe(100);
      expect(preview.endsWith('...')).toBe(true);
    });
  });

  describe('toJSON', () => {
    test('should convert to JSON with computed fields', () => {
      const chat = new ChatHistory({
        chat_id: 1,
        user_id: 100,
        user_message: 'How to water plants?',
        ai_response: 'Water regularly',
        timestamp: new Date()
      });

      const json = chat.toJSON();

      expect(json).toHaveProperty('chat_id', 1);
      expect(json).toHaveProperty('user_id', 100);
      expect(json).toHaveProperty('age_string');
      expect(json).toHaveProperty('message_preview');
      expect(json).toHaveProperty('response_preview');
      expect(json).toHaveProperty('is_plant_related', true);
    });
  });
});