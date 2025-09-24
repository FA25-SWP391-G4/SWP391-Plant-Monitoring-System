const { pool } = require('../config/db');

class Alert {
    constructor(alertData) {
        this.alert_id = alertData.alert_id;
        this.user_id = alertData.user_id;
        this.message = alertData.message;
        this.status = alertData.status || 'unread';
        this.created_at = alertData.created_at;
    }

    // Static method to find all alerts
    static async findAll(limit = 100) {
        try {
            const query = `
                SELECT a.*, u.full_name as user_name 
                FROM Alerts a
                LEFT JOIN Users u ON a.user_id = u.user_id
                ORDER BY a.created_at DESC 
                LIMIT $1
            `;
            const result = await pool.query(query, [limit]);
            return result.rows.map(row => new Alert(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find alert by ID
    static async findById(id) {
        try {
            const query = `
                SELECT a.*, u.full_name as user_name 
                FROM Alerts a
                LEFT JOIN Users u ON a.user_id = u.user_id
                WHERE a.alert_id = $1
            `;
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Alert(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find alerts by user ID
    static async findByUserId(userId, limit = 50) {
        try {
            const query = `
                SELECT a.*, u.full_name as user_name 
                FROM Alerts a
                LEFT JOIN Users u ON a.user_id = u.user_id
                WHERE a.user_id = $1
                ORDER BY a.created_at DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [userId, limit]);
            return result.rows.map(row => new Alert(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find alerts by status
    static async findByStatus(status, limit = 100) {
        try {
            const query = `
                SELECT a.*, u.full_name as user_name 
                FROM Alerts a
                LEFT JOIN Users u ON a.user_id = u.user_id
                WHERE a.status = $1
                ORDER BY a.created_at DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [status, limit]);
            return result.rows.map(row => new Alert(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find unread alerts by user ID
    static async findUnreadByUserId(userId) {
        try {
            const query = `
                SELECT a.*, u.full_name as user_name 
                FROM Alerts a
                LEFT JOIN Users u ON a.user_id = u.user_id
                WHERE a.user_id = $1 AND a.status = 'unread'
                ORDER BY a.created_at DESC
            `;
            const result = await pool.query(query, [userId]);
            return result.rows.map(row => new Alert(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to get unread count for a user
    static async getUnreadCountByUserId(userId) {
        try {
            const query = `
                SELECT COUNT(*) as unread_count 
                FROM Alerts 
                WHERE user_id = $1 AND status = 'unread'
            `;
            const result = await pool.query(query, [userId]);
            return parseInt(result.rows[0].unread_count) || 0;
        } catch (error) {
            throw error;
        }
    }

    // Create or update alert
    async save() {
        try {
            if (this.alert_id) {
                // Update existing alert
                const query = `
                    UPDATE Alerts 
                    SET user_id = $1, message = $2, status = $3
                    WHERE alert_id = $4
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.user_id,
                    this.message,
                    this.status,
                    this.alert_id
                ]);
                
                const updatedAlert = new Alert(result.rows[0]);
                Object.assign(this, updatedAlert);
                return this;
            } else {
                // Create new alert
                const query = `
                    INSERT INTO Alerts (user_id, message, status)
                    VALUES ($1, $2, $3)
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.user_id,
                    this.message,
                    this.status || 'unread'
                ]);
                
                const newAlert = new Alert(result.rows[0]);
                Object.assign(this, newAlert);
                return this;
            }
        } catch (error) {
            throw error;
        }
    }

    // Mark alert as read
    async markAsRead() {
        try {
            const query = `
                UPDATE Alerts 
                SET status = 'read'
                WHERE alert_id = $1
                RETURNING *
            `;
            
            const result = await pool.query(query, [this.alert_id]);
            
            if (result.rows.length > 0) {
                this.status = 'read';
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Mark alert as unread
    async markAsUnread() {
        try {
            const query = `
                UPDATE Alerts 
                SET status = 'unread'
                WHERE alert_id = $1
                RETURNING *
            `;
            
            const result = await pool.query(query, [this.alert_id]);
            
            if (result.rows.length > 0) {
                this.status = 'unread';
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Delete alert
    async delete() {
        try {
            if (!this.alert_id) {
                throw new Error('Cannot delete alert without ID');
            }

            const query = 'DELETE FROM Alerts WHERE alert_id = $1';
            await pool.query(query, [this.alert_id]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Static method to create alert
    static async createAlert(userId, message) {
        try {
            const alert = new Alert({
                user_id: userId,
                message: message,
                status: 'unread'
            });
            
            return await alert.save();
        } catch (error) {
            throw error;
        }
    }

    // Static method to mark all alerts as read for a user
    static async markAllAsReadByUserId(userId) {
        try {
            const query = `
                UPDATE Alerts 
                SET status = 'read'
                WHERE user_id = $1 AND status = 'unread'
            `;
            const result = await pool.query(query, [userId]);
            return result.rowCount;
        } catch (error) {
            throw error;
        }
    }

    // Static method to delete old read alerts
    static async cleanupOldAlerts(daysToKeep = 30) {
        try {
            const query = `
                DELETE FROM Alerts 
                WHERE status = 'read' 
                AND created_at < NOW() - INTERVAL '${daysToKeep} days'
            `;
            const result = await pool.query(query);
            return result.rowCount;
        } catch (error) {
            throw error;
        }
    }

    // Static methods to create common alert types
    static async createPlantAlert(userId, plantName, alertType, details = '') {
        try {
            let message = '';
            
            switch (alertType) {
                case 'low_moisture':
                    message = `🌱 ${plantName}: Soil moisture is below threshold. ${details}`;
                    break;
                case 'watering_completed':
                    message = `💧 ${plantName}: Watering completed successfully. ${details}`;
                    break;
                case 'watering_failed':
                    message = `❌ ${plantName}: Watering failed. ${details}`;
                    break;
                case 'device_offline':
                    message = `📡 ${plantName}: Device went offline. ${details}`;
                    break;
                case 'device_online':
                    message = `✅ ${plantName}: Device is back online. ${details}`;
                    break;
                case 'sensor_error':
                    message = `⚠️ ${plantName}: Sensor reading error. ${details}`;
                    break;
                default:
                    message = `🔔 ${plantName}: ${alertType}. ${details}`;
            }
            
            return await Alert.createAlert(userId, message);
        } catch (error) {
            throw error;
        }
    }

    static async createSystemAlert(userId, alertType, details = '') {
        try {
            let message = '';
            
            switch (alertType) {
                case 'payment_success':
                    message = `💳 Payment completed successfully. ${details}`;
                    break;
                case 'payment_failed':
                    message = `❌ Payment failed. ${details}`;
                    break;
                case 'subscription_expiring':
                    message = `⏰ Your premium subscription is expiring soon. ${details}`;
                    break;
                case 'subscription_expired':
                    message = `📅 Your premium subscription has expired. ${details}`;
                    break;
                case 'system_maintenance':
                    message = `🔧 System maintenance scheduled. ${details}`;
                    break;
                default:
                    message = `🔔 System notification: ${alertType}. ${details}`;
            }
            
            return await Alert.createAlert(userId, message);
        } catch (error) {
            throw error;
        }
    }

    // Get alert age in human readable format
    getAgeString() {
        if (!this.created_at) {
            return 'Unknown';
        }
        
        const now = new Date();
        const alertTime = new Date(this.created_at);
        const diffMs = now - alertTime;
        
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

    // Convert to JSON
    toJSON() {
        return {
            alert_id: this.alert_id,
            user_id: this.user_id,
            message: this.message,
            status: this.status,
            created_at: this.created_at,
            age_string: this.getAgeString()
        };
    }
}

module.exports = Alert;
