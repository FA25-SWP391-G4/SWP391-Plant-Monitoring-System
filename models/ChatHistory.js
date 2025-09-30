const { pool } = require('../config/db');

class ChatHistory {
    constructor(chatData) {
        this.chat_id = chatData.chat_id;
        this.user_id = chatData.user_id;
        this.timestamp = chatData.timestamp;
        this.user_message = chatData.user_message;
        this.ai_response = chatData.ai_response;
    }

    // Static method to find all chat history
    static async findAll(limit = 100) {
        try {
            const query = `
                SELECT ch.*, u.full_name as user_name 
                FROM Chat_History ch
                LEFT JOIN Users u ON ch.user_id = u.user_id
                ORDER BY ch.timestamp DESC 
                LIMIT $1
            `;
            const result = await pool.query(query, [limit]);
            return result.rows.map(row => new ChatHistory(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find chat history by ID
    static async findById(id) {
        try {
            const query = `
                SELECT ch.*, u.full_name as user_name 
                FROM Chat_History ch
                LEFT JOIN Users u ON ch.user_id = u.user_id
                WHERE ch.chat_id = $1
            `;
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new ChatHistory(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find chat history by user ID
    static async findByUserId(userId, limit = 50) {
        try {
            const query = `
                SELECT ch.*, u.full_name as user_name 
                FROM Chat_History ch
                LEFT JOIN Users u ON ch.user_id = u.user_id
                WHERE ch.user_id = $1
                ORDER BY ch.timestamp DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [userId, limit]);
            return result.rows.map(row => new ChatHistory(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find recent conversations for a user
    static async findRecentByUserId(userId, days = 7) {
        try {
            const query = `
                SELECT ch.*, u.full_name as user_name 
                FROM Chat_History ch
                LEFT JOIN Users u ON ch.user_id = u.user_id
                WHERE ch.user_id = $1 
                AND ch.timestamp >= NOW() - INTERVAL '${days} days'
                ORDER BY ch.timestamp DESC
            `;
            const result = await pool.query(query, [userId]);
            return result.rows.map(row => new ChatHistory(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to search chat history by message content
    static async searchByMessage(userId, searchTerm, limit = 20) {
        try {
            const query = `
                SELECT ch.*, u.full_name as user_name 
                FROM Chat_History ch
                LEFT JOIN Users u ON ch.user_id = u.user_id
                WHERE ch.user_id = $1 
                AND (ch.user_message ILIKE $2 OR ch.ai_response ILIKE $2)
                ORDER BY ch.timestamp DESC 
                LIMIT $3
            `;
            const result = await pool.query(query, [userId, `%${searchTerm}%`, limit]);
            return result.rows.map(row => new ChatHistory(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to get chat statistics for a user
    static async getChatStatsForUser(userId, days = 30) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_conversations,
                    COUNT(CASE WHEN ai_response IS NOT NULL THEN 1 END) as responded_conversations,
                    AVG(LENGTH(user_message)) as avg_message_length,
                    AVG(LENGTH(ai_response)) as avg_response_length
                FROM Chat_History 
                WHERE user_id = $1 
                AND timestamp >= NOW() - INTERVAL '${days} days'
            `;
            const result = await pool.query(query, [userId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Static method to get overall chat statistics
    static async getOverallChatStats(days = 30) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_conversations,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(CASE WHEN ai_response IS NOT NULL THEN 1 END) as responded_conversations,
                    AVG(LENGTH(user_message)) as avg_message_length,
                    AVG(LENGTH(ai_response)) as avg_response_length
                FROM Chat_History 
                WHERE timestamp >= NOW() - INTERVAL '${days} days'
            `;
            const result = await pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Create or update chat history
    async save() {
        try {
            if (this.chat_id) {
                // Update existing chat history
                const query = `
                    UPDATE Chat_History 
                    SET user_id = $1, timestamp = $2, user_message = $3, ai_response = $4
                    WHERE chat_id = $5
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.user_id,
                    this.timestamp || new Date(),
                    this.user_message,
                    this.ai_response,
                    this.chat_id
                ]);
                
                const updatedChat = new ChatHistory(result.rows[0]);
                Object.assign(this, updatedChat);
                return this;
            } else {
                // Create new chat history
                const query = `
                    INSERT INTO Chat_History (user_id, timestamp, user_message, ai_response)
                    VALUES ($1, $2, $3, $4)
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.user_id,
                    this.timestamp || new Date(),
                    this.user_message,
                    this.ai_response
                ]);
                
                const newChat = new ChatHistory(result.rows[0]);
                Object.assign(this, newChat);
                return this;
            }
        } catch (error) {
            throw error;
        }
    }

    // Update AI response
    async updateAIResponse(aiResponse) {
        try {
            const query = `
                UPDATE Chat_History 
                SET ai_response = $1
                WHERE chat_id = $2
                RETURNING *
            `;
            
            const result = await pool.query(query, [aiResponse, this.chat_id]);
            
            if (result.rows.length > 0) {
                this.ai_response = aiResponse;
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Delete chat history
    async delete() {
        try {
            if (!this.chat_id) {
                throw new Error('Cannot delete chat history without ID');
            }

            const query = 'DELETE FROM Chat_History WHERE chat_id = $1';
            await pool.query(query, [this.chat_id]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Static method to create chat entry
    static async createChat(userId, userMessage, aiResponse = null) {
        try {
            const chatHistory = new ChatHistory({
                user_id: userId,
                timestamp: new Date(),
                user_message: userMessage,
                ai_response: aiResponse
            });
            
            return await chatHistory.save();
        } catch (error) {
            throw error;
        }
    }

    // Static method to delete user's chat history
    static async deleteUserHistory(userId) {
        try {
            const query = 'DELETE FROM Chat_History WHERE user_id = $1';
            const result = await pool.query(query, [userId]);
            return result.rowCount;
        } catch (error) {
            throw error;
        }
    }

    // Static method to cleanup old chat history
    static async cleanupOldHistory(daysToKeep = 90) {
        try {
            const query = `
                DELETE FROM Chat_History 
                WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
            `;
            const result = await pool.query(query);
            return result.rowCount;
        } catch (error) {
            throw error;
        }
    }

    // Get conversation context (previous messages in chronological order)
    async getConversationContext(contextLimit = 5) {
        try {
            const query = `
                SELECT * FROM Chat_History 
                WHERE user_id = $1 
                AND timestamp <= $2
                ORDER BY timestamp DESC 
                LIMIT $3
            `;
            const result = await pool.query(query, [
                this.user_id, 
                this.timestamp, 
                contextLimit
            ]);
            
            // Return in chronological order (oldest first)
            return result.rows.reverse().map(row => new ChatHistory(row));
        } catch (error) {
            throw error;
        }
    }

    // Check if message contains plant-related keywords
    isPlantRelated() {
        const plantKeywords = [
            'plant', 'water', 'moisture', 'sensor', 'device', 'pump', 
            'schedule', 'watering', 'soil', 'humidity', 'temperature', 
            'light', 'garden', 'irrigation', 'threshold', 'alert'
        ];
        
        const message = (this.user_message || '').toLowerCase();
        return plantKeywords.some(keyword => message.includes(keyword));
    }

    // Get chat age in human readable format
    getAgeString() {
        if (!this.timestamp) {
            return 'Unknown';
        }
        
        const now = new Date();
        const chatTime = new Date(this.timestamp);
        const diffMs = now - chatTime;
        
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMinutes < 1) {
            return 'Just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else {
            return `${diffDays}d ago`;
        }
    }

    // Truncate long messages for preview
    getMessagePreview(maxLength = 100) {
        if (!this.user_message) {
            return '';
        }
        
        if (this.user_message.length <= maxLength) {
            return this.user_message;
        }
        
        return this.user_message.substring(0, maxLength - 3) + '...';
    }

    getResponsePreview(maxLength = 100) {
        if (!this.ai_response) {
            return '';
        }
        
        if (this.ai_response.length <= maxLength) {
            return this.ai_response;
        }
        
        return this.ai_response.substring(0, maxLength - 3) + '...';
    }

    // Convert to JSON
    toJSON() {
        return {
            chat_id: this.chat_id,
            user_id: this.user_id,
            timestamp: this.timestamp,
            user_message: this.user_message,
            ai_response: this.ai_response,
            age_string: this.getAgeString(),
            message_preview: this.getMessagePreview(),
            response_preview: this.getResponsePreview(),
            is_plant_related: this.isPlantRelated()
        };
    }
}

module.exports = ChatHistory;
