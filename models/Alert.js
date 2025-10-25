const { pool } = require('../config/db');

class Alert {
    constructor(alertData) {
        this.alert_id = alertData.alert_id;
        this.user_id = alertData.user_id;
        this.title = alertData.title || ''; // Added title field
        this.message = alertData.message;
        this.type = alertData.type || 'general'; // Added type field
        this.details = alertData.details || '{}'; // Added details field
        this.is_read = alertData.is_read === false ? false : alertData.status === 'read'; // Convert status to is_read boolean
        this.status = alertData.status || 'unread'; // Maintain backward compatibility
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
                    SET user_id = $1, title = $2, message = $3, type = $4, details = $5, status = $6
                    WHERE alert_id = $7
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.user_id,
                    this.title,
                    this.message,
                    this.type,
                    this.details,
                    this.is_read ? 'read' : 'unread',
                    this.alert_id
                ]);
                
                const updatedAlert = new Alert(result.rows[0]);
                Object.assign(this, updatedAlert);
                return this;
            } else {
                // Create new alert
                const query = `
                    INSERT INTO Alerts (user_id, title, message, type, details, status)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.user_id,
                    this.title,
                    this.message,
                    this.type,
                    this.details,
                    this.is_read ? 'read' : 'unread'
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
                this.is_read = true;
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
                this.is_read = false;
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
    
    // Enhanced static method to create alert with more details
    static async create(alertData) {
        try {
            const alert = new Alert({
                user_id: alertData.user_id,
                title: alertData.title || '',
                message: alertData.message,
                type: alertData.type || 'general',
                details: alertData.details || '{}',
                is_read: false
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

    // Alias for markAllAsReadByUserId for better naming consistency
    static async markAllAsReadForUser(userId) {
        return this.markAllAsReadByUserId(userId);
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
            let title = '';
            let type = alertType;
            
            switch (alertType) {
                case 'lowMoisture':
                    title = 'Low Moisture Alert';
                    message = `🌱 ${plantName}: Soil moisture is below threshold.`;
                    break;
                case 'highTemperature':
                    title = 'High Temperature Alert';
                    message = `🔥 ${plantName}: Temperature is above threshold.`;
                    break;
                case 'watering_completed':
                    title = 'Watering Completed';
                    message = `💧 ${plantName}: Watering completed successfully.`;
                    break;
                case 'watering_failed':
                    title = 'Watering Failed';
                    message = `❌ ${plantName}: Watering failed.`;
                    break;
                case 'deviceOffline':
                    title = 'Device Offline';
                    message = `📡 ${plantName}: Device went offline.`;
                    break;
                case 'deviceOnline':
                    title = 'Device Online';
                    message = `✅ ${plantName}: Device is back online.`;
                    break;
                case 'sensorError':
                    title = 'Sensor Error';
                    message = `⚠️ ${plantName}: Sensor reading error.`;
                    break;
                case 'pumpActivation':
                    title = 'Pump Activated';
                    message = `🚿 ${plantName}: Watering pump has been activated.`;
                    break;
                default:
                    title = `Plant Alert: ${plantName}`;
                    message = `🔔 ${plantName}: ${alertType}.`;
            }
            
            return await Alert.create({
                user_id: userId,
                title: title,
                message: message + (details ? ` ${details}` : ''),
                type: type,
                details: typeof details === 'object' ? JSON.stringify(details) : details
            });
        } catch (error) {
            throw error;
        }
    }

    static async createSystemAlert(userId, alertType, details = '') {
        try {
            let message = '';
            let title = '';
            let type = alertType;
            
            switch (alertType) {
                case 'payment_success':
                    title = 'Payment Successful';
                    message = `💳 Payment completed successfully.`;
                    break;
                case 'payment_failed':
                    title = 'Payment Failed';
                    message = `❌ Payment failed.`;
                    break;
                case 'subscription_expiring':
                    title = 'Subscription Expiring';
                    message = `⏰ Your premium subscription is expiring soon.`;
                    break;
                case 'subscription_expired':
                    title = 'Subscription Expired';
                    message = `📅 Your premium subscription has expired.`;
                    break;
                case 'system_maintenance':
                    title = 'System Maintenance';
                    message = `🔧 System maintenance scheduled.`;
                    break;
                default:
                    title = 'System Notification';
                    message = `🔔 System notification: ${alertType}.`;
            }
            
            return await Alert.create({
                user_id: userId,
                title: title,
                message: message + (details ? ` ${details}` : ''),
                type: type,
                details: typeof details === 'object' ? JSON.stringify(details) : details
            });
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
            title: this.title,
            message: this.message,
            type: this.type,
            details: typeof this.details === 'string' ? JSON.parse(this.details) : this.details,
            is_read: this.is_read,
            status: this.status, // For backward compatibility
            created_at: this.created_at,
            age_string: this.getAgeString()
        };
    }
}

module.exports = Alert;
