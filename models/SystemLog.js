const { pool } = require('../config/db');

// Import event notification service (avoid circular dependency)
let eventNotificationService = null;
try {
    eventNotificationService = require('../services/eventNotificationService');
} catch (error) {
    // Service may not be available during testing or initialization
    console.log('EventNotificationService not available:', error.message);
}

class SystemLog {
    constructor(logData) {
        this.log_id = logData.log_id;
        this.timestamp = logData.timestamp;
        this.log_level = logData.log_level;
        this.source = logData.source;
        this.message = logData.message;
    }

    //create log 
    static async create(level, source, message, metadata = {}) {
        try {
            let log_level, log_source, log_message;

            //object syntax
            if(typeof level === 'object' && level !== null) {
                log_level = level.log_level || 'INFO';
                log_source = level.source || 'System';
                log_message = level.message || '';
                // Extract metadata from object syntax
                metadata = { ...metadata, ...level.metadata };
            } else if (typeof level === 'string') {
                log_level = level || 'INFO';
                log_source = source || 'System';
                log_message = message || '';
        }else{
            throw new Error('Invalid parameters for creating log');
        }
        log_level = log_level.toUpperCase();

        const validLevels = ['INFO', 'WARNING', 'ERROR', 'DEBUG'];
        if (!validLevels.includes(log_level)) {
            log_level = 'INFO';
        }
        const systemLog = new SystemLog({
            log_level: log_level,
            source: log_source,
            message: log_message,
            timestamp: new Date()
        });
        const savedLog = await systemLog.save();
        
        // Trigger event notification processing with metadata
        if (savedLog && eventNotificationService) {
            try {
                await eventNotificationService.processEvent({
                    level: log_level,
                    source: log_source,
                    message: log_message,
                    metadata: {
                        ...metadata,
                        log_id: savedLog.log_id,
                        timestamp: savedLog.timestamp
                    }
                });
            } catch (error) {
                // Don't throw error to avoid disrupting the logging process
                console.error('Failed to trigger event notification from create:', error.message);
            }
        }
        
        return savedLog;
        } catch (error) {
            // Don't throw error in logging to avoid infinite loops
            console.error('Failed to create system log:', error);
            return null;
        }
    }
    
    // Static method to find all system logs
    static async findAll(limit = 100) {
        try {
            const query = `
                SELECT * FROM System_Logs 
                ORDER BY timestamp DESC 
                LIMIT $1
            `;
            const result = await pool.query(query, [limit]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
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
            throw error;
        }
    }

    // Static method to find logs by level
    static async findByLevel(logLevel, limit = 100) {
        try {
            const query = `
                SELECT * FROM System_Logs 
                WHERE log_level = $1 
                ORDER BY timestamp DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [logLevel, limit]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            throw error;
        }
    }
    
    // Static method to find logs by source
    static async findBySource(source, limit = 100) {
        try {
            const query = `
                SELECT * FROM System_Logs 
                WHERE source = $1 
                ORDER BY timestamp DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [logLevel, limit]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find logs by source
    static async findBySource(source, limit = 100) {
        try {
            const query = `
                SELECT * FROM System_Logs 
                WHERE source = $1 
                ORDER BY timestamp DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [source, limit]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find logs within date range
    static async findByDateRange(startDate, endDate, limit = 1000) {
        try {
            const query = `
                SELECT * FROM System_Logs 
                WHERE timestamp >= $1 AND timestamp <= $2 
                ORDER BY timestamp DESC 
                LIMIT $3
            `;
            const result = await pool.query(query, [startDate, endDate, limit]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            throw error;
        }
    }
    
    // Advanced filtering method for admin panel
    static async findWithFilters(filters = {}) {
        try {
            let conditions = [];
            let params = [];
            let paramIndex = 1;
            
            // Build dynamic query based on provided filters
            if (filters.startDate) {
                conditions.push(`timestamp >= $${paramIndex}`);
                params.push(filters.startDate);
                paramIndex++;
            }
            
            if (filters.endDate) {
                conditions.push(`timestamp <= $${paramIndex}`);
                params.push(filters.endDate);
                paramIndex++;
            }
            
            if (filters.logLevel && filters.logLevel !== 'ALL') {
                if (Array.isArray(filters.logLevel)) {
                    conditions.push(`log_level IN (${filters.logLevel.map((_, i) => `$${paramIndex + i}`).join(', ')})`);
                    params.push(...filters.logLevel);
                    paramIndex += filters.logLevel.length;
                } else {
                    conditions.push(`log_level = $${paramIndex}`);
                    params.push(filters.logLevel);
                    paramIndex++;
                }
            }
            
            if (filters.source) {
                conditions.push(`source = $${paramIndex}`);
                params.push(filters.source);
                paramIndex++;
            }
            
            if (filters.searchTerm) {
                conditions.push(`message ILIKE $${paramIndex}`);
                params.push(`%${filters.searchTerm}%`);
                paramIndex++;
            }
            
            // Build the query
            let query = 'SELECT * FROM System_Logs';
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            // Add sorting
            query += ` ORDER BY timestamp ${filters.sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
            
            // Add pagination
            const limit = filters.limit || 100;
            const offset = filters.offset || 0;
            query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);
            
            const result = await pool.query(query, params);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find error and warning logs
    static async findErrorsAndWarnings(limit = 100) {
        try {
            const query = `
                SELECT * FROM System_Logs 
                WHERE log_level IN ('ERROR', 'WARNING', 'WARN') 
                ORDER BY timestamp DESC 
                LIMIT $1
            `;
            const result = await pool.query(query, [limit]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to search logs by message content
    static async searchByMessage(searchTerm, limit = 100) {
        try {
            const query = `
                SELECT * FROM System_Logs 
                WHERE message ILIKE $1 
                ORDER BY timestamp DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [`%${searchTerm}%`, limit]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to get log statistics
    static async getLogStats(hours = 24) {
        try {
            const query = `
                SELECT 
                    log_level,
                    COUNT(*) as count
                FROM System_Logs 
                WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
                GROUP BY log_level
                ORDER BY count DESC
            `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    // Create system log entry
    async save() {
        try {
            if (this.log_id) {
                // Update existing log (rarely needed)
                const query = `
                    UPDATE System_Logs 
                    SET timestamp = $1, log_level = $2, source = $3, message = $4
                    WHERE log_id = $5
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.timestamp || new Date(),
                    this.log_level,
                    this.source,
                    this.message,
                    this.log_id
                ]);
                
                const updatedLog = new SystemLog(result.rows[0]);
                Object.assign(this, updatedLog);
                
                // Trigger event notification processing
                await this.triggerEventNotification();
                
                return this;
            } else {
                // Create new log entry
                const query = `
                    INSERT INTO System_Logs (timestamp, log_level, source, message)
                    VALUES ($1, $2, $3, $4)
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.timestamp || new Date(),
                    this.log_level,
                    this.source,
                    this.message
                ]);
                
                const newLog = new SystemLog(result.rows[0]);
                Object.assign(this, newLog);
                
                // Trigger event notification processing
                await this.triggerEventNotification();
                
                return this;
            }
        } catch (error) {
            throw error;
        }
    }

    // Delete system log
    async delete() {
        try {
            if (!this.log_id) {
                throw new Error('Cannot delete log without ID');
            }

            const query = 'DELETE FROM System_Logs WHERE log_id = $1';
            await pool.query(query, [this.log_id]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Trigger event notification processing for this log entry
    async triggerEventNotification() {
        try {
            // Only trigger if the event notification service is available
            if (eventNotificationService) {
                await eventNotificationService.processEvent({
                    level: this.log_level,
                    source: this.source,
                    message: this.message,
                    metadata: {
                        log_id: this.log_id,
                        timestamp: this.timestamp
                    }
                });
            }
        } catch (error) {
            // Don't throw error to avoid disrupting the logging process
            console.error('Failed to trigger event notification:', error.message);
        }
    }

    // Static logging methods for different levels
    static async log(level, source, message, metadata = {}) {
        try {
            const systemLog = new SystemLog({
                log_level: level.toUpperCase(),
                source: source,
                message: message,
                timestamp: new Date()
            });
            
            const savedLog = await systemLog.save();
            
            // Trigger event notification processing with metadata
            if (savedLog && eventNotificationService) {
                try {
                    await eventNotificationService.processEvent({
                        level: level.toUpperCase(),
                        source: source,
                        message: message,
                        metadata: {
                            ...metadata,
                            log_id: savedLog.log_id,
                            timestamp: savedLog.timestamp
                        }
                    });
                } catch (error) {
                    // Don't throw error to avoid disrupting the logging process
                    console.error('Failed to trigger event notification from log:', error.message);
                }
            }
            
            return savedLog;
        } catch (error) {
            // Don't throw error in logging to avoid infinite loops
            console.error('Failed to save system log:', error);
            return null;
        }
    }

    static async info(source, message, metadata = {}) {
        return await SystemLog.log('INFO', source, message, metadata);
    }

    static async warning(source, message, metadata = {}) {
        return await SystemLog.log('WARNING', source, message, metadata);
    }

    static async error(source, message, metadata = {}) {
        return await SystemLog.log('ERROR', source, message, metadata);
    }

    static async debug(source, message, metadata = {}) {
        return await SystemLog.log('DEBUG', source, message, metadata);
    }

    // Static method to cleanup old logs
    static async cleanupOldLogs(daysToKeep = 30) {
        try {
            const query = `
                DELETE FROM System_Logs 
                WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
            `;
            const result = await pool.query(query);
            return result.rowCount;
        } catch (error) {
            throw error;
        }
    }

    // Static method to cleanup logs by level (keep fewer debug logs)
    static async cleanupLogsByLevel() {
        try {
            // Keep debug logs for only 7 days
            const debugQuery = `
                DELETE FROM System_Logs 
                WHERE log_level = 'DEBUG' 
                AND timestamp < NOW() - INTERVAL '7 days'
            `;
            
            // Keep info logs for 30 days
            const infoQuery = `
                DELETE FROM System_Logs 
                WHERE log_level = 'INFO' 
                AND timestamp < NOW() - INTERVAL '30 days'
            `;
            
            // Keep warning/error logs for 90 days
            const errorQuery = `
                DELETE FROM System_Logs 
                WHERE log_level IN ('WARNING', 'ERROR') 
                AND timestamp < NOW() - INTERVAL '90 days'
            `;
            
            const debugResult = await pool.query(debugQuery);
            const infoResult = await pool.query(infoQuery);
            const errorResult = await pool.query(errorQuery);
            
            return {
                debug_deleted: debugResult.rowCount,
                info_deleted: infoResult.rowCount,
                error_deleted: errorResult.rowCount
            };
        } catch (error) {
            throw error;
        }
    }

    // Get log age in human readable format
    getAgeString() {
        if (!this.timestamp) {
            return 'Unknown';
        }
        
        const now = new Date();
        const logTime = new Date(this.timestamp);
        const diffMs = now - logTime;
        
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

    // Get log level color for UI
    getLevelColor() {
        switch (this.log_level) {
            case 'ERROR':
                return '#dc3545'; // Red
            case 'WARNING':
            case 'WARN':
                return '#ffc107'; // Yellow
            case 'INFO':
                return '#17a2b8'; // Blue
            case 'DEBUG':
                return '#6c757d'; // Gray
            default:
                return '#000000'; // Black
        }
    }

    // Convert to JSON
    toJSON() {
        return {
            log_id: this.log_id,
            timestamp: this.timestamp,
            log_level: this.log_level,
            source: this.source,
            message: this.message,
            age_string: this.getAgeString(),
            level_color: this.getLevelColor()
        };
    }

    /**
     * ADMIN METHODS - Additional methods for admin dashboard
     */
    static async findByUserId(userId, limit = 50) {
        try {
            const query = `
                SELECT * FROM system_logs 
                WHERE user_id = $1 
                ORDER BY timestamp DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [userId, limit]);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            console.error('[SYSTEM LOG FIND BY USER ID ERROR] Error finding logs by user ID:', error.message);
            throw error;
        }
    }

    static async countAll(filters = {}) {
        try {
            let query = 'SELECT COUNT(*) as count FROM system_logs WHERE 1=1';
            const params = [];
            let paramIndex = 1;

            if (filters.log_level) {
                query += ` AND log_level = $${paramIndex}`;
                params.push(filters.log_level);
                paramIndex++;
            }

            if (filters.source) {
                query += ` AND source = $${paramIndex}`;
                params.push(filters.source);
                paramIndex++;
            }

            if (filters.startDate) {
                query += ` AND timestamp >= $${paramIndex}`;
                params.push(filters.startDate);
                paramIndex++;
            }

            if (filters.endDate) {
                query += ` AND timestamp <= $${paramIndex}`;
                params.push(filters.endDate);
                paramIndex++;
            }

            if (filters.search) {
                query += ` AND message ILIKE $${paramIndex}`;
                params.push(`%${filters.search}%`);
                paramIndex++;
            }

            if (filters.user_id) {
                query += ` AND user_id = $${paramIndex}`;
                params.push(filters.user_id);
                paramIndex++;
            }

            const result = await pool.query(query, params);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('[SYSTEM LOG COUNT ERROR] Error counting logs:', error.message);
            throw error;
        }
    }

    static async findAll(options = {}) {
        try {
            let query = 'SELECT * FROM system_logs WHERE 1=1';
            const params = [];
            let paramIndex = 1;

            // Apply filters
            if (options.log_level) {
                query += ` AND log_level = $${paramIndex}`;
                params.push(options.log_level);
                paramIndex++;
            }

            if (options.source) {
                query += ` AND source = $${paramIndex}`;
                params.push(options.source);
                paramIndex++;
            }

            if (options.startDate) {
                query += ` AND timestamp >= $${paramIndex}`;
                params.push(options.startDate);
                paramIndex++;
            }

            if (options.endDate) {
                query += ` AND timestamp <= $${paramIndex}`;
                params.push(options.endDate);
                paramIndex++;
            }

            if (options.search) {
                query += ` AND message ILIKE $${paramIndex}`;
                params.push(`%${options.search}%`);
                paramIndex++;
            }

            if (options.user_id) {
                query += ` AND user_id = $${paramIndex}`;
                params.push(options.user_id);
                paramIndex++;
            }

            // Add ordering
            const orderBy = options.orderBy || 'timestamp DESC';
            query += ` ORDER BY ${orderBy}`;

            // Add pagination
            if (options.limit) {
                query += ` LIMIT $${paramIndex}`;
                params.push(options.limit);
                paramIndex++;
            }

            if (options.offset) {
                query += ` OFFSET $${paramIndex}`;
                params.push(options.offset);
                paramIndex++;
            }

            const result = await pool.query(query, params);
            return result.rows.map(row => new SystemLog(row));
        } catch (error) {
            console.error('[SYSTEM LOG FIND ALL ERROR] Error finding logs:', error.message);
            throw error;
        }
    }

    static async getDistinctValues(column) {
        try {
            const query = `SELECT DISTINCT ${column} FROM system_logs ORDER BY ${column}`;
            const result = await pool.query(query);
            return result.rows.map(row => row[column]);
        } catch (error) {
            console.error('[SYSTEM LOG DISTINCT VALUES ERROR] Error getting distinct values:', error.message);
            throw error;
        }
    }

    static async deleteAll(filters = {}) {
        try {
            let query = 'DELETE FROM system_logs WHERE 1=1';
            const params = [];
            let paramIndex = 1;

            if (filters.log_level) {
                query += ` AND log_level = $${paramIndex}`;
                params.push(filters.log_level);
                paramIndex++;
            }

            if (filters.source) {
                query += ` AND source = $${paramIndex}`;
                params.push(filters.source);
                paramIndex++;
            }

            if (filters.before) {
                query += ` AND timestamp < $${paramIndex}`;
                params.push(filters.before);
                paramIndex++;
            }

            const result = await pool.query(query, params);
            return result.rowCount;
        } catch (error) {
            console.error('[SYSTEM LOG DELETE ERROR] Error deleting logs:', error.message);
            throw error;
        }
    }

    // Static method to delete logs by pattern (for testing)
    static async deleteByPattern(pattern) {
        try {
            const query = `
                DELETE FROM system_logs 
                WHERE message LIKE $1 OR source LIKE $1
            `;
            const result = await pool.query(query, [`%${pattern}%`]);
            return result.rowCount;
        } catch (error) {
            console.error('Error deleting logs by pattern:', error);
            return 0;
        }
    }
}

module.exports = SystemLog;
