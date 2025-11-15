const WateringHistory = require('../../../models/WateringHistory');
const { pool } = require('../../../config/db');
const { isValidUUID } = require('../../../utils/uuidGenerator');

// Mock dependencies
jest.mock('../../../config/db');
jest.mock('../../../utils/uuidGenerator');

describe('WateringHistory Model', () => {
  let mockQuery;

  beforeEach(() => {
    mockQuery = jest.fn();
    pool.query = mockQuery;
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create a WateringHistory instance with all properties', () => {
      const historyData = {
        history_id: 1,
        plant_id: 1,
        timestamp: new Date('2023-01-01'),
        trigger_type: 'manual',
        duration_seconds: 30
      };

      const history = new WateringHistory(historyData);

      expect(history.history_id).toBe(1);
      expect(history.plant_id).toBe(1);
      expect(history.timestamp).toEqual(new Date('2023-01-01'));
      expect(history.trigger_type).toBe('manual');
      expect(history.duration_seconds).toBe(30);
    });
  });

  describe('findAll', () => {
    it('should return all watering history with default limit', async () => {
      const mockRows = [
        { history_id: 1, plant_id: 'plant-1', trigger_type: 'manual' },
        { history_id: 2, plant_id: 'plant-2', trigger_type: 'automatic_threshold' }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await WateringHistory.findAll();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT wh.*'), [100]);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(WateringHistory);
    });

    it('should return all watering history with custom limit', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await WateringHistory.findAll(50);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('LIMIT $1'), [50]);
    });

    it('should throw error when database query fails', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(WateringHistory.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return watering history by ID', async () => {
      const mockRow = { history_id: 1, plant_id: 'plant-1', trigger_type: 'manual' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await WateringHistory.findById(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE wh.history_id = $1'), [1]);
      expect(result).toBeInstanceOf(WateringHistory);
      expect(result.history_id).toBe(1);
    });

    it('should return null when no history found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await WateringHistory.findById(999);

      expect(result).toBeNull();
    });

    it('should throw error when database query fails', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(WateringHistory.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('findByPlantId', () => {
    it('should return watering history by plant ID with default limit', async () => {
      const mockRows = [{ history_id: 1, plant_id: 'plant-1' }];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await WateringHistory.findByPlantId('plant-1');

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE wh.plant_id = $1'), ['plant-1', 50]);
      expect(result).toHaveLength(1);
    });

    it('should return watering history by plant ID with custom limit', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await WateringHistory.findByPlantId('plant-1', 25);

      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), ['plant-1', 25]);
    });
  });

  describe('findByUserId', () => {
    it('should return watering history by user ID when UUID is valid', async () => {
      isValidUUID.mockReturnValue(true);
      const mockRows = [{ history_id: 1, plant_id: 'plant-1' }];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await WateringHistory.findByUserId('user-123');

      expect(isValidUUID).toHaveBeenCalledWith('user-123');
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE u.user_id = $1'), ['user-123', 100]);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when UUID is invalid', async () => {
      isValidUUID.mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await WateringHistory.findByUserId('invalid-uuid');

      expect(consoleSpy).toHaveBeenCalledWith('[WATERING_HISTORY] Invalid user_id UUID:', 'invalid-uuid');
      expect(result).toEqual([]);
      expect(mockQuery).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should throw error when database query fails', async () => {
      isValidUUID.mockReturnValue(true);
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(WateringHistory.findByUserId('user-123')).rejects.toThrow('Database error');
    });
  });

  describe('findByTriggerType', () => {
    it('should return watering history by trigger type', async () => {
      const mockRows = [{ history_id: 1, trigger_type: 'manual' }];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await WateringHistory.findByTriggerType('manual');

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE wh.trigger_type = $1'), ['manual', 100]);
      expect(result).toHaveLength(1);
    });
  });

  describe('findByDateRange', () => {
    it('should return watering history within date range', async () => {
      const mockRows = [{ history_id: 1, plant_id: 'plant-1' }];
      mockQuery.mockResolvedValue({ rows: mockRows });
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const result = await WateringHistory.findByDateRange('plant-1', startDate, endDate);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND wh.timestamp >= $2 AND wh.timestamp <= $3'),
        ['plant-1', startDate, endDate]
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getStatsByPlantId', () => {
    it('should return statistics for a plant with default days', async () => {
      const mockStats = {
        plant_id: 'plant-1',
        total_waterings: '5',
        avg_duration: '30.5',
        manual_count: '2'
      };
      mockQuery.mockResolvedValue({ rows: [mockStats] });

      const result = await WateringHistory.getStatsByPlantId('plant-1');

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '30 days'"), ['plant-1']);
      expect(result).toEqual(mockStats);
    });

    it('should return null when no statistics found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await WateringHistory.getStatsByPlantId('plant-1');

      expect(result).toBeNull();
    });

    it('should use custom days parameter', async () => {
      mockQuery.mockResolvedValue({ rows: [{}] });

      await WateringHistory.getStatsByPlantId('plant-1', 7);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '7 days'"), ['plant-1']);
    });
  });

  describe('save', () => {
    it('should create new watering history when no history_id', async () => {
      const mockRow = { history_id: 1, plant_id: 'plant-1', trigger_type: 'manual' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const history = new WateringHistory({
        plant_id: 'plant-1',
        trigger_type: 'manual',
        duration_seconds: 30
      });

      const result = await history.save();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO watering_history'),
        ['plant-1', expect.any(Date), 'manual', 30]
      );
      expect(result.history_id).toBe(1);
    });

    it('should update existing watering history when history_id exists', async () => {
      const mockRow = { history_id: 1, plant_id: 'plant-1', trigger_type: 'manual' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const history = new WateringHistory({
        history_id: 1,
        plant_id: 'plant-1',
        trigger_type: 'manual',
        duration_seconds: 30
      });

      const result = await history.save();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE watering_history'),
        ['plant-1', expect.any(Date), 'manual', 30, 1]
      );
      expect(result.history_id).toBe(1);
    });

    it('should use current timestamp when timestamp is not provided', async () => {
      const mockRow = { history_id: 1, plant_id: 'plant-1' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const history = new WateringHistory({
        plant_id: 'plant-1',
        trigger_type: 'manual'
      });

      await history.save();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([expect.any(Date)])
      );
    });
  });

  describe('logWatering', () => {
    it('should create and save watering history', async () => {
      const mockRow = { history_id: 1, plant_id: 'plant-1', trigger_type: 'manual' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await WateringHistory.logWatering('plant-1', 'manual', 30);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO watering_history'),
        ['plant-1', expect.any(Date), 'manual', 30]
      );
      expect(result).toBeInstanceOf(WateringHistory);
    });

    it('should handle null duration seconds', async () => {
      const mockRow = { history_id: 1, plant_id: 'plant-1', trigger_type: 'manual' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      await WateringHistory.logWatering('plant-1', 'manual');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        ['plant-1', expect.any(Date), 'manual', null]
      );
    });
  });

  describe('delete', () => {
    it('should delete watering history when history_id exists', async () => {
      mockQuery.mockResolvedValue({});

      const history = new WateringHistory({ history_id: 1 });
      const result = await history.delete();

      expect(mockQuery).toHaveBeenCalledWith('DELETE FROM watering_history WHERE history_id = $1', [1]);
      expect(result).toBe(true);
    });

    it('should throw error when no history_id', async () => {
      const history = new WateringHistory({});

      await expect(history.delete()).rejects.toThrow('Cannot delete watering history without ID');
    });
  });

  describe('cleanupOldHistory', () => {
    it('should cleanup old history with default days', async () => {
      mockQuery.mockResolvedValue({ rowCount: 5 });

      const result = await WateringHistory.cleanupOldHistory();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '365 days'"));
      expect(result).toBe(5);
    });

    it('should cleanup old history with custom days', async () => {
      mockQuery.mockResolvedValue({ rowCount: 3 });

      const result = await WateringHistory.cleanupOldHistory(30);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '30 days'"));
      expect(result).toBe(3);
    });
  });

  describe('getDurationString', () => {
    it('should return "Unknown duration" when duration_seconds is null', () => {
      const history = new WateringHistory({ duration_seconds: null });
      expect(history.getDurationString()).toBe('Unknown duration');
    });

    it('should return seconds format for duration < 60', () => {
      const history = new WateringHistory({ duration_seconds: 45 });
      expect(history.getDurationString()).toBe('45 seconds');
    });

    it('should return minutes and seconds format for duration < 3600', () => {
      const history = new WateringHistory({ duration_seconds: 150 });
      expect(history.getDurationString()).toBe('2m 30s');
    });

    it('should return hours and minutes format for duration >= 3600', () => {
      const history = new WateringHistory({ duration_seconds: 3900 });
      expect(history.getDurationString()).toBe('1h 5m');
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation with duration string', () => {
      const historyData = {
        history_id: 1,
        plant_id: 'plant-1',
        timestamp: new Date('2023-01-01'),
        trigger_type: 'manual',
        duration_seconds: 30
      };
      const history = new WateringHistory(historyData);

      const json = history.toJSON();

      expect(json).toEqual({
        history_id: 1,
        plant_id: 'plant-1',
        timestamp: new Date('2023-01-01'),
        trigger_type: 'manual',
        duration_seconds: 30,
        duration_string: '30 seconds'
      });
    });
  });

  describe('countToday', () => {
    it('should return count of today watering events', async () => {
      mockQuery.mockResolvedValue({ rows: [{ count: '5' }] });

      const result = await WateringHistory.countToday();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CURRENT_DATE'));
      expect(result).toBe(5);
    });

    it('should log error and throw when database query fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(WateringHistory.countToday()).rejects.toThrow('Database error');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[WATERING HISTORY COUNT TODAY ERROR] Error counting today watering events:',
        'Database error'
      );

      consoleSpy.mockRestore();
    });
  });
});