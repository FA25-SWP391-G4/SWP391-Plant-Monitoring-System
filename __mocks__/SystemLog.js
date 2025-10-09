/**
 * ============================================================================
 * SYSTEM LOG MODEL - MONITORING, DEBUGGING & AUDITING
 * ============================================================================
 * 
 * This model supports UC27: Monitor System Logs
 * Critical for system debugging, monitoring, and security auditing
 */

const { pool } = require('../config/db');

class SystemLog {
    constructor(logData) {
        this.log_id = logData.log_id;
        this.timestamp = logData.timestamp || new Date();
        this.log_level = logData.log_level || 'info';
        this.source = logData.source || 'system';
        this.message = logData.message || '';
        this.details = logData.details || {};
        this.user_id = logData.user_id || null;
    }

    // Save system log to database
    async save() {
        try {
            const query = `
                INSERT INTO System_Logs (timestamp, log_level, source, message, details, user_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING log_id
            `;
            
            const values = [
                this.timestamp,
                this.log_level,
                this.source,
                this.message,
                this.details,
                this.user_id
            ];
            
            const result = await pool.query(query, values);
            this.log_id = result.rows[0].log_id;
            return this;
        } catch (error) {
            console.error('Error saving system log:', error);
            throw error;
        }
    }

    // Static method to find all system logs
    static async findAll(limit = 100, offset = 0) {
        try {
            const query = `
                SELECT * FROM System_Logs 
                ORDER BY timestamp DESC 
                LIMIT $1 OFFSET $2
            `;
            const result = await pool.query(query, [limit, offset]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            console.error('Error finding system logs:', error);
            throw error;
        }
    }

    // Static method to find system log by ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM System_Logs WHERE log_id = $1';
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new SystemLog(result.rows[0]);
        } catch (error) {
            console.error('Error finding system log by ID:', error);
            throw error;
        }
    }

    // Static method to find logs by level
    static async findByLevel(logLevel, limit = 100, offset = 0) {
        try {
            const query = `
                SELECT * FROM System_Logs 
                WHERE log_level = $1 
                ORDER BY timestamp DESC 
                LIMIT $2 OFFSET $3
            `;
            const result = await pool.query(query, [logLevel, limit, offset]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            console.error('Error finding logs by level:', error);
            throw error;
        }
    }

    // Static method to find logs by source
    static async findBySource(source, limit = 100, offset = 0) {
        try {
            const query = `
                SELECT * FROM System_Logs 
                WHERE source = $1 
                ORDER BY timestamp DESC 
                LIMIT $2 OFFSET $3
            `;
            const result = await pool.query(query, [source, limit, offset]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            console.error('Error finding logs by source:', error);
            throw error;
        }
    }

    // Static method to find logs by user ID
    static async findByUserId(userId, limit = 100, offset = 0) {
        try {
            const query = `
                SELECT * FROM System_Logs 
                WHERE user_id = $1 
                ORDER BY timestamp DESC 
                LIMIT $2 OFFSET $3
            `;
            const result = await pool.query(query, [userId, limit, offset]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            console.error('Error finding logs by user ID:', error);
            throw error;
        }
    }

    // Static method to find logs by date range
    static async findByDateRange(startDate, endDate, limit = 100, offset = 0) {
        try {
            const query = `
                SELECT * FROM System_Logs 
                WHERE timestamp BETWEEN $1 AND $2 
                ORDER BY timestamp DESC 
                LIMIT $3 OFFSET $4
            `;
            const result = await pool.query(query, [startDate, endDate, limit, offset]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            console.error('Error finding logs by date range:', error);
            throw error;
        }
    }

    // Static method to search logs by message content
    static async searchByMessage(searchTerm, limit = 100, offset = 0) {
        try {
            const query = `
                SELECT * FROM System_Logs 
                WHERE message ILIKE $1 
                ORDER BY timestamp DESC 
                LIMIT $2 OFFSET $3
            `;
            const result = await pool.query(query, [`%${searchTerm}%`, limit, offset]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            console.error('Error searching logs by message:', error);
            throw error;
        }
    }

    // Static method to count logs by level
    static async countByLevel() {
        try {
            const query = `
                SELECT log_level, COUNT(*) as count 
                FROM System_Logs 
                GROUP BY log_level 
                ORDER BY count DESC
            `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error counting logs by level:', error);
            throw error;
        }
    }

    // Static method to delete old logs
    static async deleteOldLogs(olderThan) {
        try {
            const query = `
                DELETE FROM System_Logs 
                WHERE timestamp < $1
                RETURNING *
            `;
            const result = await pool.query(query, [olderThan]);
            return result.rowCount;
        } catch (error) {
            console.error('Error deleting old logs:', error);
            throw error;
        }
    }

    // Log convenience methods
    static async logInfo(message, source = 'system', userId = null, details = {}) {
        const log = new SystemLog({
            log_level: 'info',
            source,
            message,
            user_id: userId,
            details
        });
        return log.save();
    }

    static async logWarning(message, source = 'system', userId = null, details = {}) {
        const log = new SystemLog({
            log_level: 'warning',
            source,
            message,
            user_id: userId,
            details
        });
        return log.save();
    }

    static async logError(message, source = 'system', userId = null, details = {}) {
        const log = new SystemLog({
            log_level: 'error',
            source,
            message,
            user_id: userId,
            details
        });
        return log.save();
    }

    static async logSecurity(message, source = 'security', userId = null, details = {}) {
        const log = new SystemLog({
            log_level: 'security',
            source,
            message,
            user_id: userId,
            details
        });
        return log.save();
    }

    static async logAudit(message, source = 'audit', userId = null, details = {}) {
        const log = new SystemLog({
            log_level: 'audit',
            source,
            message,
            user_id: userId,
            details
        });
        return log.save();
    }
}

module.exports = SystemLog;