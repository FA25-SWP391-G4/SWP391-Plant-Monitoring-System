const Alert = require('../../../models/Alert');
const { pool } = require('../../../config/db');
const { isValidUUID } = require('../../../utils/uuidGenerator');

jest.mock('../../../config/db');
jest.mock('../../../utils/uuidGenerator');

describe('Alert Model - Unit Tests', () => {
  let mockPool;
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const invalidUUID = 'invalid-uuid';

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = {
      query: jest.fn()
    };
    pool.query = mockPool.query;
    isValidUUID.mockImplementation((uuid) => uuid === validUUID);
  });

  describe('Constructor', () => {
    it('should create alert instance with all fields', () => {
      const alertData = {
        alert_id: '1',
        user_id: validUUID,
        title: 'Test Alert',
        message: 'Test message',
        type: 'warning',
        details: '{"key":"value"}',
        status: 'unread',
        created_at: new Date()
      };

      const alert = new Alert(alertData);

      expect(alert.alert_id).toBe('1');
      expect(alert.user_id).toBe(validUUID);
      expect(alert.title).toBe('Test Alert');
      expect(alert.message).toBe('Test message');
      expect(alert.type).toBe('warning');
      expect(alert.is_read).toBe(false);
      expect(alert.status).toBe('unread');
    });

    it('should set default values for optional fields', () => {
      const alertData = {
        user_id: validUUID,
        message: 'Test message'
      };

      const alert = new Alert(alertData);

      expect(alert.title).toBe('');
      expect(alert.type).toBe('general');
      expect(alert.details).toBe('{}');
      expect(alert.status).toBe('unread');
    });

    it('should convert status to is_read boolean', () => {
      const readAlert = new Alert({ status: 'read', message: 'Test' });
      const unreadAlert = new Alert({ status: 'unread', message: 'Test' });

      expect(readAlert.is_read).toBe(true);
      expect(unreadAlert.is_read).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all alerts with default limit', async () => {
      const mockRows = [
        { alert_id: '1', user_id: validUUID, message: 'Alert 1', status: 'unread' },
        { alert_id: '2', user_id: validUUID, message: 'Alert 2', status: 'read' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockRows });

      const alerts = await Alert.findAll();

      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [100]);
      expect(alerts).toHaveLength(2);
      expect(alerts[0]).toBeInstanceOf(Alert);
    });

    it('should return alerts with custom limit', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await Alert.findAll(50);

      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [50]);
    });

    it('should throw error on database failure', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await expect(Alert.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return alert by ID', async () => {
      const mockRow = { alert_id: '1', user_id: validUUID, message: 'Test', status: 'unread' };
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      const alert = await Alert.findById('1');

      expect(alert).toBeInstanceOf(Alert);
      expect(alert.alert_id).toBe('1');
    });

    it('should return null if alert not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const alert = await Alert.findById('999');

      expect(alert).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await expect(Alert.findById('1')).rejects.toThrow('Database error');
    });
  });

  describe('findByUserId', () => {
    it('should return alerts for valid user ID', async () => {
      const mockRows = [
        { alert_id: '1', user_id: validUUID, message: 'Alert 1', status: 'unread' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockRows });

      const alerts = await Alert.findByUserId(validUUID);

      expect(alerts).toHaveLength(1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [validUUID, 50]);
    });

    it('should return empty array for invalid UUID', async () => {
      const alerts = await Alert.findByUserId(invalidUUID);

      expect(alerts).toEqual([]);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should use custom limit', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await Alert.findByUserId(validUUID, 25);

      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [validUUID, 25]);
    });
  });

  describe('findByStatus', () => {
    it('should return alerts by status', async () => {
      const mockRows = [
        { alert_id: '1', user_id: validUUID, message: 'Alert 1', status: 'unread' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockRows });

      const alerts = await Alert.findByStatus('unread');

      expect(alerts).toHaveLength(1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), ['unread', 100]);
    });
  });

  describe('findUnreadByUserId', () => {
    it('should return unread alerts for valid user', async () => {
      const mockRows = [
        { alert_id: '1', user_id: validUUID, message: 'Unread', status: 'unread' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockRows });

      const alerts = await Alert.findUnreadByUserId(validUUID);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].status).toBe('unread');
    });

    it('should return empty array for invalid UUID', async () => {
      const alerts = await Alert.findUnreadByUserId(invalidUUID);

      expect(alerts).toEqual([]);
    });
  });

  describe('getUnreadCountByUserId', () => {
    it('should return unread count for valid user', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ unread_count: '5' }] });

      const count = await Alert.getUnreadCountByUserId(validUUID);

      expect(count).toBe(5);
    });

    it('should return 0 for invalid UUID', async () => {
      const count = await Alert.getUnreadCountByUserId(invalidUUID);

      expect(count).toBe(0);
    });

    it('should return 0 on database error', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      const count = await Alert.getUnreadCountByUserId(validUUID);

      expect(count).toBe(0);
    });
  });

  describe('save', () => {
    it('should create new alert', async () => {
      const mockRow = {
        alert_id: '1',
        user_id: validUUID,
        title: 'New Alert',
        message: 'Test',
        type: 'general',
        details: '{}',
        status: 'unread',
        created_at: new Date()
      };
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      const alert = new Alert({ user_id: validUUID, message: 'Test' });
      await alert.save();

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO alerts'),
        expect.any(Array)
      );
      expect(alert.alert_id).toBe('1');
    });

    it('should update existing alert', async () => {
      const mockRow = {
        alert_id: '1',
        user_id: validUUID,
        title: 'Updated',
        message: 'Updated message',
        type: 'general',
        details: '{}',
        status: 'read',
        created_at: new Date()
      };
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      const alert = new Alert({
        alert_id: '1',
        user_id: validUUID,
        message: 'Updated message',
        is_read: true
      });
      await alert.save();

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE alerts'),
        expect.any(Array)
      );
    });

    it('should throw error for invalid UUID', async () => {
      const alert = new Alert({ user_id: invalidUUID, message: 'Test' });

      await expect(alert.save()).rejects.toThrow('Valid user_id UUID is required');
    });
  });

  describe('markAsRead', () => {
    it('should mark alert as read', async () => {
      const mockRow = {
        alert_id: '1',
        user_id: validUUID,
        message: 'Test',
        status: 'read',
        created_at: new Date()
      };
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      const alert = new Alert({ alert_id: '1', user_id: validUUID, message: 'Test' });
      await alert.markAsRead();

      expect(alert.status).toBe('read');
      expect(alert.is_read).toBe(true);
    });
  });

  describe('markAsUnread', () => {
    it('should mark alert as unread', async () => {
      const mockRow = {
        alert_id: '1',
        user_id: validUUID,
        message: 'Test',
        status: 'unread',
        created_at: new Date()
      };
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      const alert = new Alert({ alert_id: '1', user_id: validUUID, message: 'Test' });
      await alert.markAsUnread();

      expect(alert.status).toBe('unread');
      expect(alert.is_read).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete alert successfully', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      const alert = new Alert({ alert_id: '1', user_id: validUUID, message: 'Test' });
      const result = await alert.delete();

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM alerts WHERE alert_id = $1',
        ['1']
      );
    });

    it('should throw error if alert has no ID', async () => {
      const alert = new Alert({ user_id: validUUID, message: 'Test' });

      await expect(alert.delete()).rejects.toThrow('Cannot delete alert without ID');
    });
  });

  describe('createAlert', () => {
    it('should create alert with valid data', async () => {
      const mockRow = {
        alert_id: '1',
        user_id: validUUID,
        message: 'Test alert',
        status: 'unread',
        created_at: new Date()
      };
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      const alert = await Alert.createAlert(validUUID, 'Test alert');

      expect(alert).toBeInstanceOf(Alert);
      expect(alert.message).toBe('Test alert');
    });

    it('should throw error for invalid UUID', async () => {
      await expect(Alert.createAlert(invalidUUID, 'Test')).rejects.toThrow('Valid user_id UUID is required');
    });
  });

  describe('create', () => {
    it('should create alert with detailed data', async () => {
      const mockRow = {
        alert_id: '1',
        user_id: validUUID,
        title: 'Test Title',
        message: 'Test message',
        type: 'warning',
        details: '{}',
        status: 'unread',
        created_at: new Date()
      };
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      const alert = await Alert.create({
        user_id: validUUID,
        title: 'Test Title',
        message: 'Test message',
        type: 'warning'
      });

      expect(alert.title).toBe('Test Title');
      expect(alert.type).toBe('warning');
    });
  });

  describe('markAllAsReadByUserId', () => {
    it('should mark all alerts as read for valid user', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 5 });

      const count = await Alert.markAllAsReadByUserId(validUUID);

      expect(count).toBe(5);
    });

    it('should return 0 for invalid UUID', async () => {
      const count = await Alert.markAllAsReadByUserId(invalidUUID);

      expect(count).toBe(0);
    });
  });

  describe('cleanupOldAlerts', () => {
    it('should delete old alerts with default days', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 10 });

      const count = await Alert.cleanupOldAlerts();

      expect(count).toBe(10);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '30 days'"));
    });

    it('should delete old alerts with custom days', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 5 });

      const count = await Alert.cleanupOldAlerts(60);

      expect(count).toBe(5);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '60 days'"));
    });
  });

  describe('createPlantAlert', () => {
    it('should create low moisture alert', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{
          alert_id: '1',
          user_id: validUUID,
          title: 'Low Moisture Alert',
          message: '🌱 Rose Plant: Soil moisture is below threshold.',
          type: 'lowMoisture',
          details: '{}',
          status: 'unread',
          created_at: new Date()
        }]
      });

      const alert = await Alert.createPlantAlert(validUUID, 'Rose Plant', 'lowMoisture');

      expect(alert.title).toBe('Low Moisture Alert');
      expect(alert.message).toContain('Rose Plant');
    });

    it('should create watering completed alert', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{
          alert_id: '1',
          user_id: validUUID,
          title: 'Watering Completed',
          message: '💧 Tomato Plant: Watering completed successfully.',
          type: 'watering_completed',
          details: '{}',
          status: 'unread',
          created_at: new Date()
        }]
      });

      const alert = await Alert.createPlantAlert(validUUID, 'Tomato Plant', 'watering_completed');

      expect(alert.title).toBe('Watering Completed');
    });
  });

  describe('createSystemAlert', () => {
    it('should create payment success alert', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{
          alert_id: '1',
          user_id: validUUID,
          title: 'Payment Successful',
          message: '💳 Payment completed successfully.',
          type: 'payment_success',
          details: '{}',
          status: 'unread',
          created_at: new Date()
        }]
      });

      const alert = await Alert.createSystemAlert(validUUID, 'payment_success');

      expect(alert.title).toBe('Payment Successful');
    });
  });

  describe('getAgeString', () => {
    it('should return "Just now" for recent alerts', () => {
      const alert = new Alert({
        user_id: validUUID,
        message: 'Test',
        created_at: new Date()
      });

      expect(alert.getAgeString()).toBe('Just now');
    });

    it('should return minutes for alerts less than 1 hour old', () => {
      const past = new Date(Date.now() - 30 * 60 * 1000);
      const alert = new Alert({
        user_id: validUUID,
        message: 'Test',
        created_at: past
      });

      expect(alert.getAgeString()).toMatch(/\d+m ago/);
    });

    it('should return "Unknown" for alerts without created_at', () => {
      const alert = new Alert({ user_id: validUUID, message: 'Test' });

      expect(alert.getAgeString()).toBe('Unknown');
    });
  });

  describe('toJSON', () => {
    it('should convert alert to JSON format', () => {
      const alert = new Alert({
        alert_id: '1',
        user_id: validUUID,
        title: 'Test',
        message: 'Test message',
        type: 'general',
        details: '{"key":"value"}',
        status: 'unread',
        created_at: new Date()
      });

      const json = alert.toJSON();

      expect(json).toHaveProperty('alert_id');
      expect(json).toHaveProperty('title');
      expect(json).toHaveProperty('message');
      expect(json).toHaveProperty('age_string');
      expect(typeof json.details).toBe('object');
    });
  });

  describe('findByUserAndType', () => {
    it('should return alerts for user and type', async () => {
      const mockRows = [
        { alert_id: '1', user_id: validUUID, message: 'Alert 1', type: 'warning', status: 'unread' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockRows });

      const alerts = await Alert.findByUserAndType(validUUID, 'warning');

      expect(alerts).toHaveLength(1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [validUUID, 'warning', 50]);
    });
  });

  describe('findByType', () => {
    it('should return alerts by type', async () => {
      const mockRows = [
        { alert_id: '1', user_id: validUUID, message: 'Alert 1', type: 'system', status: 'unread' }
      ];
      mockPool.query.mockResolvedValue({ rows: mockRows });

      const alerts = await Alert.findByType('system');

      expect(alerts).toHaveLength(1);
    });
  });

  describe('deleteByPattern', () => {
    it('should delete alerts matching pattern', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 3 });

      const count = await Alert.deleteByPattern('test');

      expect(count).toBe(3);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), ['%test%']);
    });

    it('should return 0 on error', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      const count = await Alert.deleteByPattern('test');

      expect(count).toBe(0);
    });
  });
});