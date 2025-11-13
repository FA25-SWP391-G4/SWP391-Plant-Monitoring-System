const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class ChatHistory {
    constructor(chatData) {
        this.chat_id = chatData.chat_id;
        this.user_id = chatData.user_id;
        this.plant_id = chatData.plant_id || null;
        this.conversation_id = chatData.conversation_id || null;
        // Map database columns to consistent property names
        this.message = chatData.user_message || chatData.message;
        this.response = chatData.ai_response || chatData.response;
        this.context = chatData.context;
        this.created_at = chatData.timestamp || chatData.created_at;
    }

    // Static method to create chat entry
    static async createChat(userId, userMessage, aiResponse = null, plantId = null, conversationId = null, context = {}) {
        try {
            // Use the actual database schema
            const query = `
                INSERT INTO chat_history (user_id, user_message, ai_response, timestamp)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            
            const result = await pool.query(query, [
                userId,
                userMessage,
                aiResponse,
                new Date()
            ]);
            
            return new ChatHistory(result.rows[0]);
        } catch (error) {
            console.error('Error creating chat history:', error);
            throw error;
        }
    }

    // Static method to get conversation context for OpenRouter API
    static async getConversationContext(conversationId, limit = 10) {
        try {
            // Since the current schema doesn't have conversation_id, 
            // we'll return the most recent messages for the context
            const query = `
                SELECT user_message, ai_response, timestamp
                FROM chat_history 
                ORDER BY timestamp DESC 
                LIMIT $1
            `;
            const result = await pool.query(query, [limit]);
            
            // Format for OpenRouter API (alternating user/assistant messages)
            const messages = [];
            result.rows.reverse().forEach(row => {
                if (row.user_message) {
                    messages.push({
                        role: 'user',
                        content: row.user_message
                    });
                }
                if (row.ai_response) {
                    messages.push({
                        role: 'assistant',
                        content: row.ai_response
                    });
                }
            });
            
            return messages;
        } catch (error) {
            console.error('Error getting conversation context:', error);
            throw error;
        }
    }

    // Static method to find chat history by user ID
    static async findByUserId(userId, limit = 50) {
        try {
            const query = `
                SELECT * FROM chat_history
                WHERE user_id = $1
                ORDER BY timestamp DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [userId, limit]);
            return result.rows.map(row => new ChatHistory(row));
        } catch (error) {
            console.error('Error finding chat history by user ID:', error);
            throw error;
        }
    }

    // Static method to find conversation history by conversation_id
    static async findByConversationId(conversationId, limit = 50) {
        try {
            // Current schema doesn't have conversation_id column
            // Return empty array for now
            console.log('Current schema does not support conversation_id');
            return [];
        } catch (error) {
            console.error('Error finding chat history by conversation ID:', error);
            throw error;
        }
    }

    // Static method to cleanup old chat history
    static async cleanupOldHistory(daysToKeep = 90) {
        try {
            const query = `
                DELETE FROM chat_history 
                WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
            `;
            const result = await pool.query(query);
            return result.rowCount;
        } catch (error) {
            console.error('Error cleaning up old chat history:', error);
            throw error;
        }
    }

    // Convert to JSON
    toJSON() {
        return {
            chat_id: this.chat_id,
            user_id: this.user_id,
            plant_id: this.plant_id,
            conversation_id: this.conversation_id,
            message: this.message,
            response: this.response,
            context: this.context,
            created_at: this.created_at,
            timestamp: this.created_at // For backward compatibility
        };
    }
}

module.exports = ChatHistory;