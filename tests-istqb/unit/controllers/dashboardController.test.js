const dashboardController = require('../../../controllers/dashboardController');
const Plant = require('../../../models/Plant');
const SensorData = require('../../../models/SensorData');
const User = require('../../../models/User');
const Device = require('../../../models/Device');
const Alert = require('../../../models/Alert');
const { pool } = require('../../../config/db');
const { isValidUUID } = require('../../../utils/uuidGenerator');

// Mock all dependencies
jest.mock('../../../models/Plant');
jest.mock('../../../models/SensorData');
jest.mock('../../../models/User');
jest.mock('../../../models/Device');
jest.mock('../../../models/Alert');
jest.mock('../../../config/db');
jest.mock('../../../utils/uuidGenerator');

describe('Dashboard Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: {
        user_id: 'valid-uuid-123',
        role: 'Basic'
      },
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Reset all mocks
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('getDashboardData', () => {
    it('should return dashboard data with plants successfully', async () => {
      const mockPlants = [
        { plant_id: 'plant1', name: 'Plant 1', user_id: 'valid-uuid-123' },
        { plant_id: 'plant2', name: 'Plant 2', user_id: 'valid-uuid-123' }
      ];
      const mockLatestReadings = { plant1: { temperature: 25 }, plant2: { temperature: 23 } };
      const mockDeviceStatus = { plant1: 'online', plant2: 'offline' };
      const mockNotificationStats = { total: 5, unread: 2, critical: 1 };
      const mockRecentAlerts = [{ id: 1, message: 'Alert 1' }];

      isValidUUID.mockReturnValue(true);
      Plant.findByUserId.mockResolvedValue(mockPlants);
      SensorData.findLatestForPlants.mockResolvedValue(mockLatestReadings);
      Device.getStatusForPlants.mockResolvedValue(mockDeviceStatus);
      Alert.findByUserId.mockResolvedValue(mockRecentAlerts);
      pool.query.mockResolvedValue({ rows: [{ stats: mockNotificationStats }] });

      await dashboardController.getDashboardData(req, res);

      expect(isValidUUID).toHaveBeenCalledWith('valid-uuid-123');
      expect(Plant.findByUserId).toHaveBeenCalledWith('valid-uuid-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          plants: mockPlants,
          latestReadings: mockLatestReadings,
          deviceStatus: mockDeviceStatus,
          notifications: {
            stats: mockNotificationStats,
            recentAlerts: mockRecentAlerts
          },
          systemStatus: expect.objectContaining({
            totalPlants: 2,
            activeDevices: 1
          })
        })
      });
    });

    it('should return error for invalid UUID', async () => {
      isValidUUID.mockReturnValue(false);

      await dashboardController.getDashboardData(req, res);

      expect(console.error).toHaveBeenCalledWith('[DASHBOARD] Invalid user_id UUID:', 'valid-uuid-123');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid user ID format'
      });
    });

    it('should return empty data when no plants found', async () => {
      isValidUUID.mockReturnValue(true);
      Plant.findByUserId.mockResolvedValue([]);
      pool.query.mockResolvedValue({ rows: [{ stats: { total: 0, unread: 0 } }] });
      Alert.findByUserId.mockResolvedValue([]);

      await dashboardController.getDashboardData(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'No plants found',
        data: {
          plants: [],
          latestReadings: {},
          deviceStatus: {},
          notifications: {
            stats: { total: 0, unread: 0 },
            recentAlerts: []
          }
        }
      });
    });

    it('should handle database errors', async () => {
      isValidUUID.mockReturnValue(true);
      Plant.findByUserId.mockRejectedValue(new Error('Database error'));

      await dashboardController.getDashboardData(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve dashboard data'
      });
    });
  });

  describe('getRealTimeSensorData', () => {
    beforeEach(() => {
      req.params = { plantId: 'plant123' };
    });

    it('should return real-time sensor data successfully', async () => {
      const mockPlant = { plant_id: 'plant123', user_id: 'valid-uuid-123' };
      const mockSensorData = { temperature: 25, humidity: 60 };

      Plant.findById.mockResolvedValue(mockPlant);
      SensorData.findLatestForPlant.mockResolvedValue(mockSensorData);

      await dashboardController.getRealTimeSensorData(req, res);

      expect(Plant.findById).toHaveBeenCalledWith('plant123');
      expect(SensorData.findLatestForPlant).toHaveBeenCalledWith('plant123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSensorData
      });
    });

    it('should return 404 when plant not found', async () => {
      Plant.findById.mockResolvedValue(null);

      await dashboardController.getRealTimeSensorData(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Plant not found'
      });
    });

    it('should return 403 when user does not own the plant', async () => {
      const mockPlant = { plant_id: 'plant123', user_id: 'different-uuid' };
      Plant.findById.mockResolvedValue(mockPlant);

      await dashboardController.getRealTimeSensorData(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'You do not have permission to access this plant'
      });
    });

    it('should return null data when no sensor data available', async () => {
      const mockPlant = { plant_id: 'plant123', user_id: 'valid-uuid-123' };
      Plant.findById.mockResolvedValue(mockPlant);
      SensorData.findLatestForPlant.mockResolvedValue(null);

      await dashboardController.getRealTimeSensorData(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'No sensor data available for this plant',
        data: null
      });
    });

    it('should handle errors', async () => {
      Plant.findById.mockRejectedValue(new Error('Database error'));

      await dashboardController.getRealTimeSensorData(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve real-time sensor data'
      });
    });
  });

  describe('getDashboardPreferences', () => {
    it('should return dashboard preferences for premium user', async () => {
      req.user.role = 'Premium';
      const mockUser = {
        user_id: 'valid-uuid-123',
        dashboard_preferences: {
          widgets: ['widget1', 'widget2'],
          layout: 'custom',
          refreshRate: 5
        }
      };

      User.findById.mockResolvedValue(mockUser);

      await dashboardController.getDashboardPreferences(req, res);

      expect(User.findById).toHaveBeenCalledWith('valid-uuid-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser.dashboard_preferences
      });
    });

    it('should return default preferences when user has no saved preferences', async () => {
      req.user.role = 'Premium';
      const mockUser = { user_id: 'valid-uuid-123' };

      User.findById.mockResolvedValue(mockUser);

      await dashboardController.getDashboardPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          widgets: [],
          layout: 'grid',
          refreshRate: 10
        }
      });
    });

    it('should return 403 for non-premium user', async () => {
      req.user.role = 'Basic';

      await dashboardController.getDashboardPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'This feature requires a Premium subscription'
      });
    });

    it('should allow Admin access', async () => {
      req.user.role = 'Admin';
      const mockUser = { user_id: 'valid-uuid-123' };

      User.findById.mockResolvedValue(mockUser);

      await dashboardController.getDashboardPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when user not found', async () => {
      req.user.role = 'Premium';
      User.findById.mockResolvedValue(null);

      await dashboardController.getDashboardPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });

    it('should handle errors', async () => {
      req.user.role = 'Premium';
      User.findById.mockRejectedValue(new Error('Database error'));

      await dashboardController.getDashboardPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve dashboard preferences'
      });
    });
  });

  describe('updateDashboardPreferences', () => {
    beforeEach(() => {
      req.user.role = 'Premium';
      req.body = {
        widgets: ['widget1', 'widget2'],
        layout: 'custom',
        refreshRate: 5
      };
    });

    it('should update dashboard preferences successfully', async () => {
      const mockUser = {
        user_id: 'valid-uuid-123',
        save: jest.fn().mockResolvedValue()
      };

      User.findById.mockResolvedValue(mockUser);

      await dashboardController.updateDashboardPreferences(req, res);

      expect(mockUser.dashboard_preferences).toEqual({
        widgets: ['widget1', 'widget2'],
        layout: 'custom',
        refreshRate: 5
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Dashboard preferences updated successfully',
        data: {
          widgets: ['widget1', 'widget2'],
          layout: 'custom',
          refreshRate: 5
        }
      });
    });

    it('should use default values for missing fields', async () => {
      req.body = { widgets: ['widget1'] };
      const mockUser = {
        user_id: 'valid-uuid-123',
        save: jest.fn().mockResolvedValue()
      };

      User.findById.mockResolvedValue(mockUser);

      await dashboardController.updateDashboardPreferences(req, res);

      expect(mockUser.dashboard_preferences).toEqual({
        widgets: ['widget1'],
        layout: 'grid',
        refreshRate: 10
      });
    });

    it('should return 403 for non-premium user', async () => {
      req.user.role = 'Basic';

      await dashboardController.updateDashboardPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'This feature requires a Premium subscription'
      });
    });

    it('should return 404 when user not found', async () => {
      User.findById.mockResolvedValue(null);

      await dashboardController.updateDashboardPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });

    it('should return 400 for invalid widgets configuration', async () => {
      req.body = { widgets: 'invalid' };

      await dashboardController.updateDashboardPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid widgets configuration'
      });
    });

    it('should return 400 when widgets is missing', async () => {
      req.body = { layout: 'custom' };

      await dashboardController.updateDashboardPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid widgets configuration'
      });
    });

    it('should handle errors', async () => {
      User.findById.mockRejectedValue(new Error('Database error'));

      await dashboardController.updateDashboardPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to update dashboard preferences'
      });
    });
  });
});