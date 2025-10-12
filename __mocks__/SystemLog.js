/**
 * ============================================================================
 * SYSTEM LOG MODEL - MONITORING, DEBUGGING & AUDITING (MOCK VERSION)
 * ============================================================================
 *
 * This model supports UC27: Monitor System Logs
 * Critical for system debugging, monitoring, and security auditing
 */

// Mock version for testing
const SystemLog = {
    // Mock logging methods
    info: jest.fn().mockImplementation((source, message, details = {}, userId = null) => {
        return Promise.resolve({
            log_id: Math.floor(Math.random() * 1000),
            timestamp: new Date(),
            log_level: 'info',
            source,
            message,
            details,
            user_id: userId
        });
    }),
    
    warning: jest.fn().mockImplementation((source, message, details = {}, userId = null) => {
        return Promise.resolve({
            log_id: Math.floor(Math.random() * 1000),
            timestamp: new Date(),
            log_level: 'warning',
            source,
            message,
            details,
            user_id: userId
        });
    }),
    
    error: jest.fn().mockImplementation((source, message, details = {}, userId = null) => {
        return Promise.resolve({
            log_id: Math.floor(Math.random() * 1000),
            timestamp: new Date(),
            log_level: 'error',
            source,
            message,
            details,
            user_id: userId
        });
    }),

    // Find all logs
    findAll: jest.fn().mockResolvedValue([
        {
            log_id: 1,
            timestamp: new Date(),
            log_level: 'info',
            source: 'system',
            message: 'System started',
            details: {},
            user_id: null
        },
        {
            log_id: 2,
            timestamp: new Date(),
            log_level: 'error',
            source: 'auth',
            message: 'Authentication failed',
            details: { reason: 'Invalid credentials' },
            user_id: 2
        }
    ]),

    // Find log by ID
    findById: jest.fn().mockImplementation((id) => {
        if (id === 1) {
            return Promise.resolve({
                log_id: 1,
                timestamp: new Date(),
                log_level: 'info',
                source: 'system',
                message: 'System started',
                details: {},
                user_id: null
            });
        }
        return Promise.resolve(null);
    }),
    
    // Delete old logs
    deleteOldLogs: jest.fn().mockResolvedValue(5),
    
    // Shorthand methods for logging
    logInfo: jest.fn().mockImplementation((message, source, userId, details) => {
        return SystemLog.info(source, message, details, userId);
    }),
    
    logWarning: jest.fn().mockImplementation((message, source, userId, details) => {
        return SystemLog.warning(source, message, details, userId);
    }),
    
    logError: jest.fn().mockImplementation((message, source, userId, details) => {
        return SystemLog.error(source, message, details, userId);
    }),
    
    // Get logs by level
    getLogsByLevel: jest.fn().mockImplementation((level) => {
        if (level === 'error') {
            return Promise.resolve([{
                log_id: 2,
                timestamp: new Date(),
                log_level: 'error',
                source: 'auth',
                message: 'Authentication failed',
                details: { reason: 'Invalid credentials' },
                user_id: 2
            }]);
        }
        return Promise.resolve([]);
    }),
    
    // Get logs by user
    getLogsByUser: jest.fn().mockImplementation((userId) => {
        if (userId === 2) {
            return Promise.resolve([{
                log_id: 2,
                timestamp: new Date(),
                log_level: 'error',
                source: 'auth',
                message: 'Authentication failed',
                details: { reason: 'Invalid credentials' },
                user_id: 2
            }]);
        }
        return Promise.resolve([]);
    }),
    
    // Get logs by date range
    getLogsByDateRange: jest.fn().mockResolvedValue([]),
    
    // Count logs by level
    countByLevel: jest.fn().mockImplementation((level) => {
        if (level === 'error') {
            return Promise.resolve(1);
        }
        return Promise.resolve(0);
    }),
    
    // Additional mock methods
    findBySource: jest.fn().mockResolvedValue([]),
    findByUserId: jest.fn().mockResolvedValue([]),
    findByDateRange: jest.fn().mockResolvedValue([]),
    findByLevel: jest.fn().mockResolvedValue([]),
    searchByMessage: jest.fn().mockResolvedValue([]),
    deleteById: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue({ log_id: 1 }),
    logSecurity: jest.fn().mockImplementation((message, userId, details) => {
        return SystemLog.info('SECURITY', message, details, userId);
    }),
    logAudit: jest.fn().mockImplementation((message, userId, details) => {
        return SystemLog.info('AUDIT', message, details, userId);
    })
};

module.exports = SystemLog;