const SensorData = require('../../../models/SensorData');
const { pool } = require('../../../config/db');
const { isValidUUID } = require('../../../utils/uuidGenerator');

jest.mock('../../../config/db');
jest.mock('../../../utils/uuidGenerator');

describe('SensorData Model - Unit Tests', () => {
  let mockQuery;

  beforeEach(() => {
    mockQuery = jest.fn();
    pool.query = mockQuery;
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create SensorData instance with all properties', () => {
      const data = {
        data_id: 1,
        device_key: 'DEVICE123456',
        timestamp: new Date(),
        soil_moisture: 45.5,
        temperature: 22.3,
        air_humidity: 60.0,
        light_intensity: 5000
      };

      const sensorData = new SensorData(data);

      expect(sensorData.data_id).toBe(1);
      expect(sensorData.device_key).toBe('DEVICE123456');
      expect(sensorData.soil_moisture).toBe(45.5);
      expect(sensorData.temperature).toBe(22.3);
      expect(sensorData.air_humidity).toBe(60.0);
      expect(sensorData.light_intensity).toBe(5000);
    });
  });

  describe('findAll', () => {
    it('should return all sensor data with default limit', async () => {
      const mockRows = [
        { data_id: 1, device_key: 'DEV001', soil_moisture: 50 },
        { data_id: 2, device_key: 'DEV002', soil_moisture: 60 }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await SensorData.findAll();

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [100]);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(SensorData);
    });

    it('should return sensor data with custom limit', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await SensorData.findAll(50);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [50]);
    });

    it('should throw error on database failure', async () => {
      mockQuery.mockRejectedValue(new Error('DB Error'));

      await expect(SensorData.findAll()).rejects.toThrow('DB Error');
    });
  });

  describe('findById', () => {
    it('should return sensor data by ID', async () => {
      const mockRow = { data_id: 1, device_key: 'DEV001', soil_moisture: 50 };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await SensorData.findById(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [1]);
      expect(result).toBeInstanceOf(SensorData);
      expect(result.data_id).toBe(1);
    });

    it('should return null when sensor data not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await SensorData.findById(999);

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockQuery.mockRejectedValue(new Error('DB Error'));

      await expect(SensorData.findById(1)).rejects.toThrow('DB Error');
    });
  });

  describe('findByDeviceKey', () => {
    it('should return sensor data for device key', async () => {
      const mockRows = [
        { data_id: 1, device_key: 'DEV001', soil_moisture: 50 }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await SensorData.findByDeviceKey('DEV001');

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['DEV001', 100]);
      expect(result).toHaveLength(1);
      expect(result[0].device_key).toBe('DEV001');
    });

    it('should return empty array when no data found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await SensorData.findByDeviceKey('NONEXISTENT');

      expect(result).toEqual([]);
    });
  });

  describe('findByDeviceId (deprecated)', () => {
    it('should call findByDeviceKey and log deprecation warning', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockQuery.mockResolvedValue({ rows: [] });

      await SensorData.findByDeviceId('DEV001', 50);

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('deprecated'));
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['DEV001', 50]);
      consoleWarnSpy.mockRestore();
    });
  });

  describe('findByUserId', () => {
    it('should return sensor data for valid user UUID', async () => {
      isValidUUID.mockReturnValue(true);
      const mockRows = [{ data_id: 1, device_key: 'DEV001' }];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await SensorData.findByUserId('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toHaveLength(1);
    });

    it('should return empty array for invalid UUID', async () => {
      isValidUUID.mockReturnValue(false);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await SensorData.findByUserId('invalid-uuid');

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should return empty array for null userId', async () => {
      const result = await SensorData.findByUserId(null);

      expect(result).toEqual([]);
    });
  });

  describe('findLatestForPlants', () => {
    it('should return empty object for empty plants array', async () => {
      const result = await SensorData.findLatestForPlants([]);

      expect(result).toEqual({});
    });

    it('should return latest readings map for plants', async () => {
      const plants = [
        { device_key: 'DEV001' },
        { device_key: 'DEV002' }
      ];
      const mockRows = [
        { device_key: 'DEV001', data_id: 1, soil_moisture: 50 },
        { device_key: 'DEV002', data_id: 2, soil_moisture: 60 }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await SensorData.findLatestForPlants(plants);

      expect(result['DEV001']).toBeInstanceOf(SensorData);
      expect(result['DEV002']).toBeInstanceOf(SensorData);
    });

    it('should throw error on database failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockQuery.mockRejectedValue(new Error('DB Error'));

      await expect(SensorData.findLatestForPlants([{ device_key: 'DEV001' }])).rejects.toThrow();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('findByDateRange', () => {
    it('should return sensor data within date range', async () => {
      const mockRows = [{ data_id: 1, device_key: 'DEV001' }];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await SensorData.findByDateRange('DEV001', startDate, endDate);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['DEV001', startDate, endDate]);
      expect(result).toHaveLength(1);
    });
  });

  describe('getLatestByDeviceId', () => {
    it('should return latest sensor data', async () => {
      const mockRow = { data_id: 1, device_key: 'DEV001', soil_moisture: 50 };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await SensorData.getLatestByDeviceId('DEV001');

      expect(result).toBeInstanceOf(SensorData);
      expect(result.device_key).toBe('DEV001');
    });

    it('should return null when no data found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await SensorData.getLatestByDeviceId('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('getAveragesByDeviceKey', () => {
    it('should return averages for device', async () => {
      const mockRow = {
        device_key: 'DEV001',
        avg_soil_moisture: 50.5,
        avg_temperature: 22.0,
        data_points: 10
      };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await SensorData.getAveragesByDeviceKey('DEV001', 24);

      expect(result.avg_soil_moisture).toBe(50.5);
      expect(result.data_points).toBe(10);
    });

    it('should return null when no data found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await SensorData.getAveragesByDeviceKey('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should insert new sensor data', async () => {
      const mockRow = { data_id: 1, device_key: 'DEV001', soil_moisture: 50 };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const sensorData = new SensorData({
        device_key: 'DEV001',
        soil_moisture: 50,
        temperature: 22
      });

      const result = await sensorData.save();

      expect(mockQuery).toHaveBeenCalled();
      expect(result.data_id).toBe(1);
    });

    it('should update existing sensor data', async () => {
      const mockRow = { data_id: 1, device_key: 'DEV001', soil_moisture: 60 };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const sensorData = new SensorData({
        data_id: 1,
        device_key: 'DEV001',
        soil_moisture: 60
      });

      const result = await sensorData.save();

      expect(result.soil_moisture).toBe(60);
    });
  });

  describe('createFromDevice', () => {
    it('should create sensor data from device readings', async () => {
      const mockRow = { data_id: 1, device_key: 'DEV001' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const readings = {
        soil_moisture: 50,
        temperature: 22,
        air_humidity: 60,
        light_intensity: 5000
      };

      const result = await SensorData.createFromDevice('DEV001', readings);

      expect(result).toBeInstanceOf(SensorData);
    });
  });

  describe('delete', () => {
    it('should delete sensor data', async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });

      const sensorData = new SensorData({ data_id: 1, device_key: 'DEV001' });
      const result = await sensorData.delete();

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [1]);
    });

    it('should throw error when deleting without ID', async () => {
      const sensorData = new SensorData({ device_key: 'DEV001' });

      await expect(sensorData.delete()).rejects.toThrow('Cannot delete sensor data without ID');
    });
  });

  describe('cleanupOldData', () => {
    it('should delete old sensor data', async () => {
      mockQuery.mockResolvedValue({ rowCount: 50 });

      const result = await SensorData.cleanupOldData(30);

      expect(result).toBe(50);
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('isWithinNormalRanges', () => {
    it('should return true for normal readings', () => {
      const sensorData = new SensorData({
        soil_moisture: 50,
        temperature: 22,
        air_humidity: 60,
        light_intensity: 5000
      });

      expect(sensorData.isWithinNormalRanges()).toBe(true);
    });

    it('should return false for out-of-range soil moisture', () => {
      const sensorData = new SensorData({
        soil_moisture: 150,
        temperature: 22,
        air_humidity: 60,
        light_intensity: 5000
      });

      expect(sensorData.isWithinNormalRanges()).toBe(false);
    });

    it('should return false for out-of-range temperature', () => {
      const sensorData = new SensorData({
        soil_moisture: 50,
        temperature: 60,
        air_humidity: 60,
        light_intensity: 5000
      });

      expect(sensorData.isWithinNormalRanges()).toBe(false);
    });

    it('should handle null values', () => {
      const sensorData = new SensorData({
        soil_moisture: null,
        temperature: 22,
        air_humidity: 60,
        light_intensity: 5000
      });

      expect(sensorData.isWithinNormalRanges()).toBe(true);
    });
  });

  describe('getRecentData', () => {
    it('should return formatted recent data for plant', async () => {
      const mockRows = [
        {
          soil_moisture: 50,
          temperature: 22,
          air_humidity: 60,
          light_intensity: 5000,
          timestamp: new Date()
        }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await SensorData.getRecentData('plant-id', 7);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('moisture', 50);
      expect(result[0]).toHaveProperty('temperature', 22);
    });

    it('should return empty array on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockQuery.mockRejectedValue(new Error('DB Error'));

      const result = await SensorData.getRecentData('plant-id');

      expect(result).toEqual([]);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON with is_normal flag', () => {
      const sensorData = new SensorData({
        data_id: 1,
        device_key: 'DEV001',
        soil_moisture: 50,
        temperature: 22,
        air_humidity: 60,
        light_intensity: 5000
      });

      const json = sensorData.toJSON();

      expect(json).toHaveProperty('data_id', 1);
      expect(json).toHaveProperty('device_key', 'DEV001');
      expect(json).toHaveProperty('is_normal', true);
    });
  });

  describe('countToday', () => {
    it('should return count of today sensor readings', async () => {
      mockQuery.mockResolvedValue({ rows: [{ count: '42' }] });

      const result = await SensorData.countToday();

      expect(result).toBe(42);
    });

    it('should throw error on database failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockQuery.mockRejectedValue(new Error('DB Error'));

      await expect(SensorData.countToday()).rejects.toThrow('DB Error');
      consoleErrorSpy.mockRestore();
    });


  });
});