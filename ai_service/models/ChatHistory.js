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
        this.plant_id = chatData.plant_id;
        this.conversation_id = chatData.conversation_id;
        this.message = chatData.message || chatData.user_message;
        this.response = chatData.response || chatData.ai_response;
        this.context = chatData.context;
        this.created_at = chatData.created_at || chatData.timestamp;
    }

    // Static method to create chat entry
    static async createChat(userId, userMessage, aiResponse = null, plantId = null, conversationId = null, context = {}) {
        try {
            const query = `
                INSERT INTO chat_history (user_id, plant_id, conversation_id, message, response, context, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            
            const result = await pool.query(query, [
                userId,
                plantId,
                conversationId,
                userMessage,
                aiResponse,
                JSON.stringify(context || {}),
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
            const query = `
                SELECT message, response, created_at
                FROM chat_history 
                WHERE conversation_id = $1
                ORDER BY created_at ASC 
                LIMIT $2
            `;
            const result = await pool.query(query, [conversationId, limit]);
            
            // Format for OpenRouter API (alternating user/assistant messages)
            const messages = [];
            result.rows.forEach(row => {
                if (row.message) {
                    messages.push({
                        role: 'user',
                        content: row.message
                    });
                }
                if (row.response) {
                    messages.push({
                        role: 'assistant',
                        content: row.response
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
                ORDER BY created_at DESC 
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
            const query = `
                SELECT * FROM chat_history
                WHERE conversation_id = $1
                ORDER BY created_at ASC 
                LIMIT $2
            `;
            const result = await pool.query(query, [conversationId, limit]);
            return result.rows.map(row => new ChatHistory(row));
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
            created_at: this.created_at
        };
    }
}

module.exports = ChatHistory;