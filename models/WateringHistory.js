const { pool } = require('../config/db');
const { isValidUUID } = require('../utils/uuidGenerator');

class WateringHistory {
    constructor(historyData) {
        this.history_id = historyData.history_id;
        this.plant_id = historyData.plant_id;
        this.timestamp = historyData.timestamp;
        this.trigger_type = historyData.trigger_type;
        this.duration_seconds = historyData.duration_seconds;
        this.device_key = historyData.device_key || null;
    }

    // Static method to find all watering history
    static async findAll(limit = 100) {
        try {
            const query = `
                SELECT wh.*, p.custom_name as plant_name, 
                       u.full_name as owner_name, d.device_name
                FROM watering_history wh
                LEFT JOIN plants p ON wh.plant_id = p.plant_id
                LEFT JOIN users u ON p.user_id = u.user_id
                LEFT JOIN devices d ON p.device_key = d.device_key
                ORDER BY wh.timestamp DESC 
                LIMIT $1
            `;
            const result = await pool.query(query, [limit]);
            return result.rows.map(row => new WateringHistory(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find watering history by ID
    static async findById(id) {
        try {
            const query = `
                SELECT wh.*, p.custom_name as plant_name, 
                       u.full_name as owner_name, d.device_name
                FROM watering_history wh
                LEFT JOIN plants p ON wh.plant_id = p.plant_id
                LEFT JOIN users u ON p.user_id = u.user_id
                LEFT JOIN devices d ON p.device_key = d.device_key
                WHERE wh.history_id = $1
            `;
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new WateringHistory(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find watering history by plant ID
    static async findByPlantId(plantId, limit = 50) {
        try {
            const query = `
                SELECT wh.*, p.custom_name as plant_name, 
                       u.full_name as owner_name, d.device_name
                FROM watering_history wh
                LEFT JOIN plants p ON wh.plant_id = p.plant_id
                LEFT JOIN users u ON p.user_id = u.user_id
                LEFT JOIN devices d ON p.device_key = d.device_key
                WHERE wh.plant_id = $1
                ORDER BY wh.timestamp DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [plantId, limit]);
            return result.rows.map(row => new WateringHistory(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find watering history by user ID
    static async findByUserId(userId, limit = 100) {
        // Validate UUID
        if (!isValidUUID(userId)) {
            console.error('[WATERING_HISTORY] Invalid user_id UUID:', userId);
            return [];
        }

        try {
            const query = `
                SELECT wh.*, p.custom_name as plant_name, 
                       u.full_name as owner_name, d.device_name
                FROM watering_history wh
                INNER JOIN plants p ON wh.plant_id = p.plant_id
                INNER JOIN users u ON p.user_id = u.user_id
                LEFT JOIN devices d ON p.device_key = d.device_key
                WHERE u.user_id = $1
                ORDER BY wh.timestamp DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [userId, limit]);
            return result.rows.map(row => new WateringHistory(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find watering history by trigger type
    static async findByTriggerType(triggerType, limit = 100) {
        try {
            const query = `
                SELECT wh.*, p.custom_name as plant_name, 
                       u.full_name as owner_name, d.device_name
                FROM watering_history wh
                LEFT JOIN plants p ON wh.plant_id = p.plant_id
                LEFT JOIN users u ON p.user_id = u.user_id
                LEFT JOIN devices d ON p.device_key = d.device_key
                WHERE wh.trigger_type = $1
                ORDER BY wh.timestamp DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [triggerType, limit]);
            return result.rows.map(row => new WateringHistory(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find watering history within date range
    static async findByDateRange(plantId, startDate, endDate) {
        try {
            const query = `
                SELECT wh.*, p.custom_name as plant_name, 
                       u.full_name as owner_name, d.device_name
                FROM watering_history wh
                LEFT JOIN plants p ON wh.plant_id = p.plant_id
                LEFT JOIN users u ON p.user_id = u.user_id
                LEFT JOIN devices d ON p.device_key = d.device_key
                WHERE wh.plant_id = $1 
                AND wh.timestamp >= $2 
                AND wh.timestamp <= $3
                ORDER BY wh.timestamp DESC
            `;
            const result = await pool.query(query, [plantId, startDate, endDate]);
            return result.rows.map(row => new WateringHistory(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to get watering statistics for a plant
    static async getStatsByPlantId(plantId, days = 30) {
        try {
            const query = `
                SELECT 
                    plant_id,
                    COUNT(*) as total_waterings,
                    AVG(duration_seconds) as avg_duration,
                    SUM(duration_seconds) as total_duration,
                    COUNT(CASE WHEN trigger_type = 'manual' THEN 1 END) as manual_count,
                    COUNT(CASE WHEN trigger_type = 'automatic_threshold' THEN 1 END) as auto_threshold_count,
                    COUNT(CASE WHEN trigger_type = 'schedule' THEN 1 END) as schedule_count,
                    COUNT(CASE WHEN trigger_type = 'ai_prediction' THEN 1 END) as ai_prediction_count
                FROM watering_history 
                WHERE plant_id = $1 
                AND timestamp >= NOW() - INTERVAL '${days} days'
                GROUP BY plant_id
            `;
            const result = await pool.query(query, [plantId]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    // Create or update entry
    async save() {
        try {
            if (this.history_id) {
                const query = `
                    UPDATE watering_history 
                    SET plant_id = $1, timestamp = $2, trigger_type = $3, duration_seconds = $4, device_key = $5
                    WHERE history_id = $6
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.plant_id,
                    this.timestamp || new Date(),
                    this.trigger_type,
                    this.duration_seconds,
                    this.device_key,
                    this.history_id
                ]);
                
                const updatedHistory = new WateringHistory(result.rows[0]);
                Object.assign(this, updatedHistory);
                return this;
            } else {
                const query = `
                    INSERT INTO watering_history (plant_id, timestamp, trigger_type, duration_seconds, device_key)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.plant_id,
                    this.timestamp || new Date(),
                    this.trigger_type,
                    this.duration_seconds,
                    this.device_key
                ]);
                
                const newHistory = new WateringHistory(result.rows[0]);
                Object.assign(this, newHistory);
                return this;
            }
        } catch (error) {
            throw error;
        }
    }

    // Static method to log watering event (accept deviceKey)
    static async logWatering(plantId, triggerType, durationSeconds = null, deviceKey = null) {
        try {
            const wateringHistory = new WateringHistory({
                plant_id: plantId,
                timestamp: new Date(),
                trigger_type: triggerType,
                duration_seconds: durationSeconds,
                device_key: deviceKey
            });
            
            return await wateringHistory.save();
        } catch (error) {
            throw error;
        }
    }

    // Delete watering history
    async delete() {
        try {
            if (!this.history_id) {
                throw new Error('Cannot delete watering history without ID');
            }

            const query = 'DELETE FROM watering_history WHERE history_id = $1';
            await pool.query(query, [this.history_id]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Static method to cleanup old watering history
    static async cleanupOldHistory(daysToKeep = 365) {
        try {
            const query = `
                DELETE FROM watering_history 
                WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
            `;
            const result = await pool.query(query);
            return result.rowCount;
        } catch (error) {
            throw error;
        }
    }

    // Get duration in human readable format
    getDurationString() {
        if (!this.duration_seconds) {
            return 'Unknown duration';
        }
        
        if (this.duration_seconds < 60) {
            return `${this.duration_seconds} seconds`;
        } else if (this.duration_seconds < 3600) {
            const minutes = Math.floor(this.duration_seconds / 60);
            const seconds = this.duration_seconds % 60;
            return `${minutes}m ${seconds}s`;
        } else {
            const hours = Math.floor(this.duration_seconds / 3600);
            const minutes = Math.floor((this.duration_seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }

    // Convert to JSON
    toJSON() {
        return {
            history_id: this.history_id,
            plant_id: this.plant_id,
            timestamp: this.timestamp,
            trigger_type: this.trigger_type,
            duration_seconds: this.duration_seconds,
            device_key: this.device_key,
            duration_string: this.getDurationString()
        };
    }

    /**
     * ADMIN METHODS - Support for admin dashboard
     */
    static async countToday() {
        try {
            const query = `
                SELECT COUNT(*) as count 
                FROM watering_history 
                WHERE DATE(timestamp) = CURRENT_DATE
            `;
            const result = await pool.query(query);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('[WATERING HISTORY COUNT TODAY ERROR] Error counting today watering events:', error.message);
            throw error;
        }
    }
}

module.exports = WateringHistory;
