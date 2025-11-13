const Device = require('../../../models/Device');
const { pool } = require('../../../config/db');
const { isValidUUID } = require('../../../utils/uuidGenerator');

// Mock dependencies
jest.mock('../../../config/db');
jest.mock('../../../utils/uuidGenerator');

describe('Device Model - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create device instance with provided data', () => {
      const deviceData = {
        device_key: 'ABC123DEF456',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        device_name: 'Test Device',
        status: 'online',
        last_seen: new Date(),
        created_at: new Date()
      };

      const device = new Device(deviceData);

      expect(device.device_key).toBe(deviceData.device_key);
      expect(device.user_id).toBe(deviceData.user_id);
      expect(device.device_name).toBe(deviceData.device_name);
      expect(device.status).toBe(deviceData.status);
    });

    it('should default status to offline when not provided', () => {
      const deviceData = {
        device_key: 'ABC123DEF456',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        device_name: 'Test Device'
      };

      const device = new Device(deviceData);

      expect(device.status).toBe('offline');
    });
  });

  describe('findAll()', () => {
    it('should return all devices with owner names', async () => {
      const mockRows = [
        { device_key: 'DEV001', device_name: 'Device 1', owner_name: 'Owner 1' },
        { device_key: 'DEV002', device_name: 'Device 2', owner_name: 'Owner 2' }
      ];
      pool.query.mockResolvedValue({ rows: mockRows });

      const devices = await Device.findAll();

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT d.*, u.family_name as owner_name'));
      expect(devices).toHaveLength(2);
      expect(devices[0]).toBeInstanceOf(Device);
    });

    it('should throw error on database failure', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(Device.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById()', () => {
    it('should return device when found', async () => {
      const mockDevice = {
        device_key: 'ABC123DEF456',
        device_name: 'Test Device',
        user_id: '123e4567-e89b-12d3-a456-426614174000'
      };
      pool.query.mockResolvedValue({ rows: [mockDevice] });

      const device = await Device.findById('ABC123DEF456');

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['ABC123DEF456']);
      expect(device).toBeInstanceOf(Device);
      expect(device.device_key).toBe('ABC123DEF456');
    });

    it('should return null when device not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const device = await Device.findById('NOTFOUND');

      expect(device).toBeNull();
    });

    it('should throw error on database failure', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(Device.findById('ABC123')).rejects.toThrow('Database error');
    });
  });

  describe('findByDeviceKey()', () => {
    it('should call findById with device key', async () => {
      const mockDevice = { device_key: 'TEST123', device_name: 'Test' };
      pool.query.mockResolvedValue({ rows: [mockDevice] });

      const device = await Device.findByDeviceKey('TEST123');

      expect(device).toBeInstanceOf(Device);
      expect(device.device_key).toBe('TEST123');
    });
  });

  describe('findByUserId()', () => {
    it('should return devices for valid user UUID', async () => {
      isValidUUID.mockReturnValue(true);
      const mockRows = [
        { device_key: 'DEV001', user_id: '123e4567-e89b-12d3-a456-426614174000' }
      ];
      pool.query.mockResolvedValue({ rows: mockRows });

      const devices = await Device.findByUserId('123e4567-e89b-12d3-a456-426614174000');

      expect(devices).toHaveLength(1);
      expect(devices[0]).toBeInstanceOf(Device);
    });

    it('should return empty array for invalid UUID', async () => {
      isValidUUID.mockReturnValue(false);

      const devices = await Device.findByUserId('invalid-uuid');

      expect(devices).toEqual([]);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('should return empty array for null userId', async () => {
      const devices = await Device.findByUserId(null);

      expect(devices).toEqual([]);
    });
  });

  describe('findByStatus()', () => {
    it('should return devices with specified status', async () => {
      const mockRows = [
        { device_key: 'DEV001', status: 'online' },
        { device_key: 'DEV002', status: 'online' }
      ];
      pool.query.mockResolvedValue({ rows: mockRows });

      const devices = await Device.findByStatus('online');

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE d.status = $1'), ['online']);
      expect(devices).toHaveLength(2);
    });
  });

  describe('getStatusForPlants()', () => {
    it('should return status map for multiple plants', async () => {
      const plants = [
        { device_key: 'DEV001' },
        { device_key: 'DEV002' }
      ];
      const mockRows = [
        { device_key: 'DEV001', status: 'online', last_seen: new Date() },
        { device_key: 'DEV002', status: 'offline', last_seen: new Date() }
      ];
      pool.query.mockResolvedValue({ rows: mockRows });

      const statusMap = await Device.getStatusForPlants(plants);

      expect(statusMap['DEV001']).toBeDefined();
      expect(statusMap['DEV001'].status).toBe('online');
      expect(statusMap['DEV002'].status).toBe('offline');
    });

    it('should return empty object for empty plants array', async () => {
      const statusMap = await Device.getStatusForPlants([]);

      expect(statusMap).toEqual({});
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('should return empty object for null plants', async () => {
      const statusMap = await Device.getStatusForPlants(null);

      expect(statusMap).toEqual({});
    });
  });

  describe('save()', () => {
    it('should insert new device when device_key is not valid UUID', async () => {
      isValidUUID.mockReturnValue(false);
      const mockResult = {
        rows: [{ device_key: 'NEW123', device_name: 'New Device', status: 'offline' }]
      };
      pool.query.mockResolvedValue(mockResult);

      const device = new Device({
        device_key: 'NEW123',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        device_name: 'New Device'
      });

      await device.save();

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO devices'),
        expect.any(Array)
      );
    });

    it('should update existing device when device_key is valid UUID', async () => {
      isValidUUID.mockReturnValue(true);
      const mockResult = {
        rows: [{ device_key: 'ABC123', device_name: 'Updated Device', status: 'online' }]
      };
      pool.query.mockResolvedValue(mockResult);

      const device = new Device({
        device_key: 'ABC123',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        device_name: 'Updated Device',
        status: 'online'
      });

      await device.save();

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE devices'),
        expect.any(Array)
      );
    });

    it('should throw error when updating non-existent device', async () => {
      isValidUUID.mockReturnValue(true);
      pool.query.mockResolvedValue({ rows: [] });

      const device = new Device({
        device_key: 'NOTFOUND',
        device_name: 'Test'
      });

      await expect(device.save()).rejects.toThrow('Device not found for update');
    });
  });

  describe('updateStatus()', () => {
    it('should update device status and last_seen', async () => {
      const mockResult = {
        rows: [{ status: 'maintenance', last_seen: new Date() }]
      };
      pool.query.mockResolvedValue(mockResult);

      const device = new Device({ device_key: 'ABC123' });
      await device.updateStatus('maintenance');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE devices'),
        ['maintenance', 'ABC123']
      );
      expect(device.status).toBe('maintenance');
    });
  });

  describe('ping()', () => {
    it('should update last_seen and set status to online', async () => {
      const mockResult = {
        rows: [{ status: 'online', last_seen: new Date() }]
      };
      pool.query.mockResolvedValue(mockResult);

      const device = new Device({ device_key: 'ABC123' });
      await device.ping();

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('status = \'online\''),
        ['ABC123']
      );
      expect(device.status).toBe('online');
    });
  });

  describe('delete()', () => {
    it('should delete device successfully', async () => {
      pool.query.mockResolvedValue({});

      const device = new Device({ device_key: 'ABC123' });
      const result = await device.delete();

      expect(pool.query).toHaveBeenCalledWith('DELETE FROM devices WHERE device_key = $1', ['ABC123']);
      expect(result).toBe(true);
    });

    it('should throw error when device_key is missing', async () => {
      const device = new Device({});

      await expect(device.delete()).rejects.toThrow('Cannot delete device without device_key');
    });
  });

  describe('isOnline()', () => {
    it('should return true when last_seen is within 5 minutes', () => {
      const device = new Device({
        device_key: 'ABC123',
        status: 'online',
        last_seen: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      });

      expect(device.isOnline()).toBe(true);
    });

    it('should return false when last_seen is over 5 minutes ago', () => {
      const device = new Device({
        device_key: 'ABC123',
        status: 'online',
        last_seen: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      });

      expect(device.isOnline()).toBe(false);
    });

    it('should return false when status is offline', () => {
      const device = new Device({
        device_key: 'ABC123',
        status: 'offline',
        last_seen: new Date()
      });

      expect(device.isOnline()).toBe(false);
    });

    it('should return false when last_seen is null', () => {
      const device = new Device({
        device_key: 'ABC123',
        status: 'online',
        last_seen: null
      });

      expect(device.isOnline()).toBe(false);
    });
  });

  describe('toJSON()', () => {
    it('should return JSON representation with is_online flag', () => {
      const device = new Device({
        device_key: 'ABC123',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        device_name: 'Test Device',
        status: 'online',
        last_seen: new Date(Date.now() - 1 * 60 * 1000),
        created_at: new Date()
      });

      const json = device.toJSON();

      expect(json).toHaveProperty('device_key', 'ABC123');
      expect(json).toHaveProperty('user_id');
      expect(json).toHaveProperty('device_name', 'Test Device');
      expect(json).toHaveProperty('status', 'online');
      expect(json).toHaveProperty('is_online');
    });
  });

  describe('countAll()', () => {
    it('should return total device count', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '42' }] });

      const count = await Device.countAll();

      expect(pool.query).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM devices');
      expect(count).toBe(42);
    });

    it('should throw error on database failure', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(Device.countAll()).rejects.toThrow('Database error');
    });
  });

  describe('countActive()', () => {
    it('should return active device count', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '15' }] });

      const count = await Device.countActive();

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("last_seen >= NOW() - INTERVAL '1 hour'"));
      expect(count).toBe(15);
    });

    it('should throw error on database failure', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(Device.countActive()).rejects.toThrow('Database error');
    });
  });
});