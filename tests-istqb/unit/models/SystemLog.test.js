const SystemLog = require('../../../models/SystemLog');
const { pool } = require('../../../config/db');

// Mock the database pool
jest.mock('../../../config/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock the event notification service
jest.mock('../../../services/eventNotificationService', () => ({
  processEvent: jest.fn()
}));

describe('SystemLog Model - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    console.log.mockRestore();
  });

  describe('Constructor', () => {
    it('should create SystemLog instance with valid data', () => {
      const logData = {
        log_id: 1,
        timestamp: new Date(),
        log_level: 'INFO',
        source: 'TestSource',
        message: 'Test message'
      };

      const log = new SystemLog(logData);

      expect(log.log_id).toBe(1);
      expect(log.log_level).toBe('INFO');
      expect(log.source).toBe('TestSource');
      expect(log.message).toBe('Test message');
    });
  });

  describe('create()', () => {
    it('should create log with string parameters', async () => {
      const mockLog = {
        log_id: 1,
        timestamp: new Date(),
        log_level: 'INFO',
        source: 'TestSource',
        message: 'Test message'
      };

      pool.query.mockResolvedValue({ rows: [mockLog] });

      const result = await SystemLog.create('info', 'TestSource', 'Test message');

      expect(result).toBeDefined();
      expect(result.log_level).toBe('INFO');
      expect(pool.query).toHaveBeenCalled();
    });

    it('should create log with object parameter', async () => {
      const mockLog = {
        log_id: 2,
        timestamp: new Date(),
        log_level: 'ERROR',
        source: 'ErrorSource',
        message: 'Error occurred'
      };

      pool.query.mockResolvedValue({ rows: [mockLog] });

      const result = await SystemLog.create({
        log_level: 'error',
        source: 'ErrorSource',
        message: 'Error occurred'
      });

      expect(result).toBeDefined();
      expect(result.log_level).toBe('ERROR');
    });

    it('should normalize log level to uppercase', async () => {
      const mockLog = {
        log_id: 3,
        log_level: 'WARNING',
        source: 'Test',
        message: 'Warning'
      };

      pool.query.mockResolvedValue({ rows: [mockLog] });

      const result = await SystemLog.create('warning', 'Test', 'Warning');

      expect(result.log_level).toBe('WARNING');
    });

    it('should default invalid log level to INFO', async () => {
      const mockLog = {
        log_id: 4,
        log_level: 'INFO',
        source: 'Test',
        message: 'Message'
      };

      pool.query.mockResolvedValue({ rows: [mockLog] });

      const result = await SystemLog.create('INVALID', 'Test', 'Message');

      expect(result.log_level).toBe('INFO');
    });

    it('should handle database error gracefully', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      const result = await SystemLog.create('info', 'Test', 'Message');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('should retrieve all logs with default limit', async () => {
      const mockLogs = [
        { log_id: 1, log_level: 'INFO', source: 'Test1', message: 'Message1', timestamp: new Date() },
        { log_id: 2, log_level: 'ERROR', source: 'Test2', message: 'Message2', timestamp: new Date() }
      ];

      pool.query.mockResolvedValue({ rows: mockLogs });

      const result = await SystemLog.findAll();

      expect(result).toHaveLength(2);
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [100]);
    });

    it('should respect custom limit parameter', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await SystemLog.findAll(50);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [50]);
    });
  });

  describe('findById()', () => {
    it('should find log by ID', async () => {
      const mockLog = {
        log_id: 1,
        log_level: 'INFO',
        source: 'Test',
        message: 'Message',
        timestamp: new Date()
      };

      pool.query.mockResolvedValue({ rows: [mockLog] });

      const result = await SystemLog.findById(1);

      expect(result).toBeInstanceOf(SystemLog);
      expect(result.log_id).toBe(1);
    });

    it('should return null if log not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await SystemLog.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByLevel()', () => {
    it('should find logs by level', async () => {
      const mockLogs = [
        { log_id: 1, log_level: 'ERROR', source: 'Test', message: 'Error1', timestamp: new Date() }
      ];

      pool.query.mockResolvedValue({ rows: mockLogs });

      const result = await SystemLog.findByLevel('ERROR');

      expect(result).toHaveLength(1);
      expect(result[0].log_level).toBe('ERROR');
    });
  });

  describe('findBySource()', () => {
    it('should find logs by source', async () => {
      const mockLogs = [
        { log_id: 1, log_level: 'INFO', source: 'TestSource', message: 'Message', timestamp: new Date() }
      ];

      pool.query.mockResolvedValue({ rows: mockLogs });

      const result = await SystemLog.findBySource('TestSource');

      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('TestSource');
    });
  });

  describe('findByDateRange()', () => {
    it('should find logs within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockLogs = [
        { log_id: 1, log_level: 'INFO', source: 'Test', message: 'Message', timestamp: new Date('2024-06-15') }
      ];

      pool.query.mockResolvedValue({ rows: mockLogs });

      const result = await SystemLog.findByDateRange(startDate, endDate);

      expect(result).toHaveLength(1);
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [startDate, endDate, 1000]);
    });
  });

  describe('findWithFilters()', () => {
    it('should apply multiple filters correctly', async () => {
      const filters = {
        logLevel: 'ERROR',
        source: 'TestSource',
        searchTerm: 'error',
        sortOrder: 'asc',
        limit: 50,
        offset: 10
      };

      pool.query.mockResolvedValue({ rows: [] });

      await SystemLog.findWithFilters(filters);

      expect(pool.query).toHaveBeenCalled();
    });

    it('should handle array of log levels', async () => {
      const filters = {
        logLevel: ['ERROR', 'WARNING']
      };

      pool.query.mockResolvedValue({ rows: [] });

      await SystemLog.findWithFilters(filters);

      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('findErrorsAndWarnings()', () => {
    it('should find only error and warning logs', async () => {
      const mockLogs = [
        { log_id: 1, log_level: 'ERROR', source: 'Test', message: 'Error', timestamp: new Date() },
        { log_id: 2, log_level: 'WARNING', source: 'Test', message: 'Warning', timestamp: new Date() }
      ];

      pool.query.mockResolvedValue({ rows: mockLogs });

      const result = await SystemLog.findErrorsAndWarnings();

      expect(result).toHaveLength(2);
    });
  });

  describe('searchByMessage()', () => {
    it('should search logs by message content', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await SystemLog.searchByMessage('test search');

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['%test search%', 100]);
    });
  });

  describe('getLogStats()', () => {
    it('should return log statistics', async () => {
      const mockStats = [
        { log_level: 'ERROR', count: '5' },
        { log_level: 'INFO', count: '10' }
      ];

      pool.query.mockResolvedValue({ rows: mockStats });

      const result = await SystemLog.getLogStats(24);

      expect(result).toEqual(mockStats);
    });
  });

  describe('save()', () => {
    it('should create new log entry', async () => {
      const mockLog = {
        log_id: 1,
        timestamp: new Date(),
        log_level: 'INFO',
        source: 'Test',
        message: 'Message'
      };

      pool.query.mockResolvedValue({ rows: [mockLog] });

      const log = new SystemLog({ log_level: 'INFO', source: 'Test', message: 'Message' });
      const result = await log.save();

      expect(result.log_id).toBe(1);
    });

    it('should update existing log entry', async () => {
      const mockLog = {
        log_id: 1,
        timestamp: new Date(),
        log_level: 'ERROR',
        source: 'Test',
        message: 'Updated'
      };

      pool.query.mockResolvedValue({ rows: [mockLog] });

      const log = new SystemLog({ ...mockLog });
      const result = await log.save();

      expect(result.message).toBe('Updated');
    });
  });

  describe('delete()', () => {
    it('should delete log entry', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const log = new SystemLog({ log_id: 1, log_level: 'INFO', source: 'Test', message: 'Message' });
      const result = await log.delete();

      expect(result).toBe(true);
    });

    it('should throw error if log has no ID', async () => {
      const log = new SystemLog({ log_level: 'INFO', source: 'Test', message: 'Message' });

      await expect(log.delete()).rejects.toThrow('Cannot delete log without ID');
    });
  });

  describe('Static logging methods', () => {
    beforeEach(() => {
      pool.query.mockResolvedValue({
        rows: [{
          log_id: 1,
          timestamp: new Date(),
          log_level: 'INFO',
          source: 'Test',
          message: 'Message'
        }]
      });
    });

    it('should create info log', async () => {
      const result = await SystemLog.info('Test', 'Info message');
      expect(result).toBeDefined();
    });

    it('should create warning log', async () => {
      const result = await SystemLog.warning('Test', 'Warning message');
      expect(result).toBeDefined();
    });

    it('should create error log', async () => {
      const result = await SystemLog.error('Test', 'Error message');
      expect(result).toBeDefined();
    });

    it('should create debug log', async () => {
      const result = await SystemLog.debug('Test', 'Debug message');
      expect(result).toBeDefined();
    });
  });

  describe('cleanupOldLogs()', () => {
    it('should delete old logs', async () => {
      pool.query.mockResolvedValue({ rowCount: 10 });

      const result = await SystemLog.cleanupOldLogs(30);

      expect(result).toBe(10);
    });
  });

  describe('cleanupLogsByLevel()', () => {
    it('should cleanup logs by level with different retention periods', async () => {
      pool.query
        .mockResolvedValueOnce({ rowCount: 5 })
        .mockResolvedValueOnce({ rowCount: 3 })
        .mockResolvedValueOnce({ rowCount: 2 });

      const result = await SystemLog.cleanupLogsByLevel();

      expect(result).toEqual({
        debug_deleted: 5,
        info_deleted: 3,
        error_deleted: 2
      });
    });
  });

  describe('getAgeString()', () => {
    it('should return "Just now" for recent logs', () => {
      const log = new SystemLog({
        log_id: 1,
        timestamp: new Date(),
        log_level: 'INFO',
        source: 'Test',
        message: 'Message'
      });

      expect(log.getAgeString()).toBe('Just now');
    });

    it('should return minutes ago', () => {
      const log = new SystemLog({
        log_id: 1,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        log_level: 'INFO',
        source: 'Test',
        message: 'Message'
      });

      expect(log.getAgeString()).toBe('5m ago');
    });

    it('should return "Unknown" for missing timestamp', () => {
      const log = new SystemLog({
        log_id: 1,
        log_level: 'INFO',
        source: 'Test',
        message: 'Message'
      });

      expect(log.getAgeString()).toBe('Unknown');
    });
  });

  describe('getLevelColor()', () => {
    it('should return red for ERROR', () => {
      const log = new SystemLog({ log_level: 'ERROR' });
      expect(log.getLevelColor()).toBe('#dc3545');
    });

    it('should return yellow for WARNING', () => {
      const log = new SystemLog({ log_level: 'WARNING' });
      expect(log.getLevelColor()).toBe('#ffc107');
    });

    it('should return blue for INFO', () => {
      const log = new SystemLog({ log_level: 'INFO' });
      expect(log.getLevelColor()).toBe('#17a2b8');
    });

    it('should return gray for DEBUG', () => {
      const log = new SystemLog({ log_level: 'DEBUG' });
      expect(log.getLevelColor()).toBe('#6c757d');
    });
  });

  describe('toJSON()', () => {
    it('should convert log to JSON with additional fields', () => {
      const log = new SystemLog({
        log_id: 1,
        timestamp: new Date(),
        log_level: 'INFO',
        source: 'Test',
        message: 'Message'
      });

      const json = log.toJSON();

      expect(json).toHaveProperty('log_id');
      expect(json).toHaveProperty('age_string');
      expect(json).toHaveProperty('level_color');
    });
  });

  describe('Admin methods', () => {
    it('should find logs by user ID', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await SystemLog.findByUserId(1);

      expect(pool.query).toHaveBeenCalled();
    });

    it('should count all logs with filters', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '10' }] });

      const result = await SystemLog.countAll({ log_level: 'ERROR' });

      expect(result).toBe(10);
    });

    it('should get distinct values', async () => {
      pool.query.mockResolvedValue({ rows: [{ source: 'Source1' }, { source: 'Source2' }] });

      const result = await SystemLog.getDistinctValues('source');

      expect(result).toEqual(['Source1', 'Source2']);
    });

    it('should delete all logs with filters', async () => {
      pool.query.mockResolvedValue({ rowCount: 5 });

      const result = await SystemLog.deleteAll({ log_level: 'DEBUG' });

      expect(result).toBe(5);
    });

    it('should delete logs by pattern', async () => {
      pool.query.mockResolvedValue({ rowCount: 3 });

      const result = await SystemLog.deleteByPattern('test');

      expect(result).toBe(3);
    });
  });
});