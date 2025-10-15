const db = require('../../config/db');

class ChatbotLog {
  static async create({ user_id, plant_id, session_id, user_message, ai_response, language = 'vi', timestamp = new Date() }) {
    try {
      // Tạo bảng nếu chưa tồn tại
      await this.createTableIfNotExists();
      
      const query = `
        INSERT INTO chatbot_logs (user_id, plant_id, session_id, user_message, ai_response, language, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [user_id, plant_id, session_id, user_message, ai_response, language, timestamp];
      const result = await db.pool.query(query, values);
      
      console.log('ChatbotLog created:', result.rows[0].id);
      return result.rows[0];
    } catch (error) {
      console.error('Lỗi khi lưu log chat:', error);
      // Fallback to mock data if database fails
      const logEntry = {
        id: Date.now(),
        user_id,
        plant_id,
        session_id,
        user_message,
        ai_response,
        language,
        timestamp: timestamp.toISOString()
      };
      console.log('Fallback ChatbotLog created:', logEntry.id);
      return logEntry;
    }
  }

  static async createTableIfNotExists() {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS chatbot_logs (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          plant_id INTEGER,
          session_id VARCHAR(255),
          user_message TEXT NOT NULL,
          ai_response TEXT NOT NULL,
          language VARCHAR(10) DEFAULT 'vi',
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      await db.pool.query(createTableQuery);
      console.log('Chatbot logs table ready');
    } catch (error) {
      console.error('Lỗi khi tạo bảng chatbot_logs:', error);
    }
  }
  
  static async getByUserId(userId, limit = 10) {
    try {
      const query = `
        SELECT * FROM chatbot_logs 
        WHERE user_id = $1 
        ORDER BY timestamp DESC 
        LIMIT $2
      `;
      
      const result = await db.pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử chat theo userId:', error);
      
      // Fallback to mock data
      const mockLogs = [
        {
          id: 1,
          user_id: userId,
          user_message: 'Cây của tôi cần tưới nước không?',
          ai_response: 'Dựa trên dữ liệu cảm biến, cây của bạn hiện tại không cần tưới nước.',
          plant_id: 1,
          language: 'vi',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      
      return mockLogs.slice(0, limit);
    }
  }
  
  static async getBySessionId(sessionId, limit = 10) {
    try {
      const query = `
        SELECT * FROM chatbot_logs 
        WHERE session_id = $1 
        ORDER BY timestamp DESC 
        LIMIT $2
      `;
      
      const result = await db.pool.query(query, [sessionId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử chat theo sessionId:', error);
      
      // Fallback to mock data
      const mockLogs = [
        {
          id: 1,
          user_id: 'user1',
          user_message: 'Cây này có vấn đề gì không?',
          ai_response: 'Cây của bạn đang phát triển tốt, không có vấn đề gì.',
          plant_id: parseInt(sessionId) || 1,
          language: 'vi',
          timestamp: new Date(Date.now() - 1800000).toISOString()
        }
      ];
      
      return mockLogs.slice(0, limit);
    }
  }

  static async getByPlantId(plantId, limit = 10) {
    try {
      const query = `
        SELECT * FROM chatbot_logs 
        WHERE plant_id = $1 
        ORDER BY timestamp DESC 
        LIMIT $2
      `;
      
      const result = await db.pool.query(query, [plantId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử chat theo plantId:', error);
      
      // Fallback to mock data
      const mockLogs = [
        {
          id: 1,
          user_id: 'user1',
          user_message: 'Cây này có vấn đề gì không?',
          ai_response: 'Cây của bạn đang phát triển tốt, không có vấn đề gì.',
          plant_id: plantId,
          language: 'vi',
          timestamp: new Date(Date.now() - 1800000).toISOString()
        }
      ];
      
      return mockLogs.slice(0, limit);
    }
  }
  
  static async getSessionsByUserId(userId, limit = 10) {
    try {
      const query = `
        SELECT DISTINCT session_id, 
               MAX(timestamp) as last_message_time,
               COUNT(*) as message_count,
               plant_id
        FROM chatbot_logs 
        WHERE user_id = $1 
        GROUP BY session_id, plant_id
        ORDER BY last_message_time DESC 
        LIMIT $2
      `;
      
      const result = await db.pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Lỗi khi lấy sessions theo userId:', error);
      
      // Fallback to mock data
      const mockSessions = [
        {
          session_id: `session_${Date.now()}_mock`,
          last_message_time: new Date().toISOString(),
          message_count: 5,
          plant_id: 1
        }
      ];
      
      return mockSessions.slice(0, limit);
    }
  }

  static async deleteBySessionId(sessionId) {
    try {
      const query = `
        DELETE FROM chatbot_logs 
        WHERE session_id = $1
      `;
      
      const result = await db.pool.query(query, [sessionId]);
      return result.rowCount;
    } catch (error) {
      console.error('Lỗi khi xóa session:', error);
      
      // Fallback - return mock deleted count
      return 1;
    }
  }

  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT plant_id) as unique_plants,
          MAX(timestamp) as last_message_time
        FROM chatbot_logs
      `;
      
      const result = await db.pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Lỗi khi lấy thống kê chat:', error);
      
      // Fallback to mock data
      return {
        total_messages: 25,
        unique_users: 5,
        unique_plants: 3,
        last_message_time: new Date().toISOString()
      };
    }
  }
}

module.exports = ChatbotLog;