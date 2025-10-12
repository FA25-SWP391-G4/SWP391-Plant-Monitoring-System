const db = require('../config/db');

class ChatbotLog {
  static async create({ userId, message, response, plantId = null, language = 'vi', contextData = null }) {
    try {
      const query = `
        INSERT INTO chatbot_logs 
        (user_id, message, response, plant_id, language, context_data, created_at) 
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id, created_at
      `;
      
      const values = [userId, message, response, plantId, language, contextData ? JSON.stringify(contextData) : null];
      const result = await db.query(query, values);
      
      return result.rows[0];
    } catch (error) {
      console.error('Lỗi khi lưu log chat:', error);
      throw error;
    }
  }
  
  static async getByUserId(userId, limit = 10) {
    try {
      const query = `
        SELECT id, user_id as "userId", message, response, plant_id as "plantId", 
               language, context_data as "contextData", created_at as "timestamp"
        FROM chatbot_logs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
      
      const result = await db.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử chat theo userId:', error);
      throw error;
    }
  }
  
  static async getByPlantId(plantId, limit = 10) {
    try {
      const query = `
        SELECT id, user_id as "userId", message, response, plant_id as "plantId", 
               language, context_data as "contextData", created_at as "timestamp"
        FROM chatbot_logs
        WHERE plant_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
      
      const result = await db.query(query, [plantId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử chat theo plantId:', error);
      throw error;
    }
  }
  
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT plant_id) as unique_plants,
          MAX(created_at) as last_message_time
        FROM chatbot_logs
      `;
      
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Lỗi khi lấy thống kê chat:', error);
      throw error;
    }
  }
}

module.exports = ChatbotLog;