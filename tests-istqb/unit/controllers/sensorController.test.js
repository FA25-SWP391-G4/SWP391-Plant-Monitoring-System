const { pool } = require('../../../config/db');
const { getLatestSensorData } = require('../../../controllers/sensorController');

// Mock the database pool
jest.mock('../../../config/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('SensorController - getLatestSensorData', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock request and response objects
    req = {
      user: null
    };
    
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    // Suppress console.log and console.error in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('Authenticated User Tests', () => {
    it('should return sensor data for authenticated user with user_id', async () => {
      req.user = { user_id: '123e4567-e89b-12d3-a456-426614174000' };
      
      const mockRows = [
        {
          device_key: 'ABCDEF123456',
          device_name: 'Living Room Sensor',
          plant_id: 1,
          plant_name: 'Rose Plant',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          moisture: 65,
          temperature: 22,
          humidity: 60,
          light: 5000
        }
      ];

      pool.query.mockResolvedValue({ rows: mockRows });

      await getLatestSensorData(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        [123]
      );
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        data: expect.objectContaining({
          device_001: expect.objectContaining({
            device_key: 'ABCDEF123456',
            device_name: 'Living Room Sensor',
            plant_id: 1,
            plant_name: 'Rose Plant',
            moisture: 65,
            temperature: 22,
            humidity: 60,
            light: 5000,
            history: expect.objectContaining({
              moisture: expect.any(Array),
              temperature: expect.any(Array),
              humidity: expect.any(Array),
              light: expect.any(Array)
            })
          })
        })
      });
    });

    it('should return sensor data for authenticated user with userId', async () => {
      req.user = { userId: 456 };
      
      pool.query.mockResolvedValue({ rows: [] });

      await getLatestSensorData(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        [456]
      );
    });

    it('should handle multiple devices for authenticated user', async () => {
      req.user = { user_id: '123e4567-e89b-12d3-a456-426614174000' };
      
      const mockRows = [
        {
          device_key: 'ABCDEF123456',
          device_name: 'Sensor 1',
          plant_id: 1,
          plant_name: 'Plant 1',
          timestamp: new Date(),
          moisture: 65,
          temperature: 22,
          humidity: 60,
          light: 5000
        },
        {
          device_key: 'device_002',
          device_name: 'Sensor 2',
          plant_id: 2,
          plant_name: 'Plant 2',
          timestamp: new Date(),
          moisture: 70,
          temperature: 24,
          humidity: 65,
          light: 6000
        }
      ];

      pool.query.mockResolvedValue({ rows: mockRows });

      await getLatestSensorData(req, res);

      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        data: expect.objectContaining({
          device_001: expect.any(Object),
          device_002: expect.any(Object)
        })
      });
    });
  });

  describe('Unauthenticated User Tests', () => {
    it('should return sensor data for unauthenticated user without plant info', async () => {
      req.user = null;
      
      const mockRows = [
        {
          device_key: 'ABCDEF123456',
          device_name: 'Public Sensor',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          moisture: 65,
          temperature: 22,
          humidity: 60,
          light: 5000
        }
      ];

      pool.query.mockResolvedValue({ rows: mockRows });

      await getLatestSensorData(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        expect.not.stringContaining('WHERE user_id'),
        []
      );
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        data: expect.objectContaining({
          device_001: expect.objectContaining({
            device_key: 'ABCDEF123456',
            device_name: 'Public Sensor',
            plant_id: undefined,
            plant_name: undefined
          })
        })
      });
    });

    it('should return empty data when no devices exist', async () => {
      req.user = null;
      
      pool.query.mockResolvedValue({ rows: [] });

      await getLatestSensorData(req, res);

      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        data: {}
      });
    });
  });

  describe('Historical Data Generation', () => {
    it('should include historical data with correct structure', async () => {
      req.user = { user_id: '123e4567-e89b-12d3-a456-426614174000' };
      
      const mockRows = [{
        device_key: 'ABCDEF123456',
        device_name: 'Test Sensor',
        plant_id: 1,
        plant_name: 'Test Plant',
        timestamp: new Date(),
        moisture: 65,
        temperature: 22,
        humidity: 60,
        light: 5000
      }];

      pool.query.mockResolvedValue({ rows: mockRows });

      await getLatestSensorData(req, res);

      const responseData = res.json.mock.calls[0][0].data.device_001;
      
      expect(responseData.history.moisture).toHaveLength(30);
      expect(responseData.history.temperature).toHaveLength(30);
      expect(responseData.history.humidity).toHaveLength(30);
      expect(responseData.history.light).toHaveLength(30);
      
      // Verify structure of historical data
      responseData.history.moisture.forEach(item => {
        expect(item).toHaveProperty('timestamp');
        expect(item).toHaveProperty('value');
        expect(typeof item.value).toBe('number');
      });
    });

    it('should generate historical data within expected ranges', async () => {
      req.user = { user_id: '123e4567-e89b-12d3-a456-426614174000' };
      
      const mockRows = [{
        device_key: 'ABCDEF123456',
        device_name: 'Test Sensor',
        plant_id: 1,
        plant_name: 'Test Plant',
        timestamp: new Date(),
        moisture: 65,
        temperature: 22,
        humidity: 60,
        light: 5000
      }];

      pool.query.mockResolvedValue({ rows: mockRows });

      await getLatestSensorData(req, res);

      const responseData = res.json.mock.calls[0][0].data.device_001;
      
      // Check moisture range (40-80)
      responseData.history.moisture.forEach(item => {
        expect(item.value).toBeGreaterThanOrEqual(40);
        expect(item.value).toBeLessThanOrEqual(80);
      });
      
      // Check temperature range (18-30)
      responseData.history.temperature.forEach(item => {
        expect(item.value).toBeGreaterThanOrEqual(18);
        expect(item.value).toBeLessThanOrEqual(30);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database query errors', async () => {
      req.user = { user_id: '123e4567-e89b-12d3-a456-426614174000' };
      const dbError = new Error('Database connection failed');
      
      pool.query.mockRejectedValue(dbError);

      await getLatestSensorData(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed'
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      req.user = { user_id: '123e4567-e89b-12d3-a456-426614174000' };
      const unexpectedError = new Error('Unexpected error occurred');
      
      pool.query.mockRejectedValue(unexpectedError);

      await getLatestSensorData(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unexpected error occurred'
      });
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Data Formatting', () => {
    it('should correctly format all sensor data fields', async () => {
      req.user = { user_id: '123e4567-e89b-12d3-a456-426614174000' };
      
      const mockTimestamp = new Date('2024-01-01T12:00:00Z');
      const mockRows = [{
        device_key: 'ABCDEF123456',
        device_name: 'Complete Sensor',
        plant_id: 1,
        plant_name: 'Complete Plant',
        timestamp: mockTimestamp,
        moisture: 75,
        temperature: 25,
        humidity: 70,
        light: 7500
      }];

      pool.query.mockResolvedValue({ rows: mockRows });

      await getLatestSensorData(req, res);

      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        data: {
          device_001: {
            device_key: 'ABCDEF123456',
            device_name: 'Complete Sensor',
            plant_id: 1,
            plant_name: 'Complete Plant',
            timestamp: mockTimestamp,
            moisture: 75,
            temperature: 25,
            humidity: 70,
            light: 7500,
            history: expect.any(Object)
          }
        }
      });
    });
  });
});