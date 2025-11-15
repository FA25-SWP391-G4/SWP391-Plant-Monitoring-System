const { getAllDevices } = require('../../../controllers/deviceController');
const { pool } = require('../../../config/db');
const SystemLog = require('../../../models/SystemLog');

    /**
     * ============================================================================
     * UNIT TEST: Device Controller
     * ============================================================================
     * ISTQB Level: Unit Testing
     * Component: controllers/deviceController.js
     */


    jest.mock('../../../config/db');
    jest.mock('../../../models/SystemLog');

    describe('deviceController', () => {
      let mockReq;
      let mockRes;

      beforeEach(() => {
        mockReq = {
          user: null
        };
        mockRes = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
      });

      afterEach(() => {
        jest.resetAllMocks();
      });

      describe('getAllDevices()', () => {
        test('should retrieve all devices for authenticated user', async () => {
          mockReq.user = { user_id: 1 };
          const mockDevices = [
            {
              device_key: 'dev-123  ',
              device_name: 'Sensor 1',
              device_type: 'sensor',
              status: 'online',
              last_seen: '2024-01-01T10:00:00Z',
              created_at: '2024-01-01T09:00:00Z',
              plant_id: 1,
              plant_name: 'Rose'
            }
          ];
          pool.query.mockResolvedValue({ rows: mockDevices });

          await getAllDevices(mockReq, mockRes);

          expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('WHERE d.user_id = $1'),
            [1]
          );
          expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            data: expect.arrayContaining([
              expect.objectContaining({
                device_key: 'dev-123',
                device_name: 'Sensor 1',
                device_type: 'sensor',
                status: 'online',
                last_active: '2024-01-01T10:00:00Z'
              })
            ])
          });
          expect(SystemLog.info).toHaveBeenCalled();
        });

        test('should retrieve all devices for unauthenticated request', async () => {
          const mockDevices = [
            {
              device_key: 'dev-456',
              device_name: 'Sensor 2',
              device_type: 'sensor',
              status: 'offline',
              created_at: '2024-01-01T09:00:00Z',
              plant_id: null,
              plant_name: null,
              owner_name: 'John Doe'
            }
          ];
          pool.query.mockResolvedValue({ rows: mockDevices });

          await getAllDevices(mockReq, mockRes);

          expect(pool.query).toHaveBeenCalledWith(
            expect.not.stringContaining('WHERE d.user_id'),
            []
          );
          expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            data: expect.arrayContaining([
              expect.objectContaining({
                owner_name: 'John Doe'
              })
            ])
          });
        });

        test('should handle devices with default values', async () => {
          mockReq.user = { user_id: 1 };
          const mockDevices = [
            {
              device_key: 'dev-789',
              device_name: 'Test Device',
              created_at: '2024-01-01T09:00:00Z'
            }
          ];
          pool.query.mockResolvedValue({ rows: mockDevices });

          await getAllDevices(mockReq, mockRes);

          expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            data: expect.arrayContaining([
              expect.objectContaining({
                device_type: 'sensor',
                status: 'offline',
                last_active: '2024-01-01T09:00:00Z'
              })
            ])
          });
        });

        test('should handle database errors', async () => {
          mockReq.user = { user_id: 1 };
          const dbError = new Error('Database connection failed');
          pool.query.mockRejectedValue(dbError);

          await getAllDevices(mockReq, mockRes);

          expect(SystemLog.error).toHaveBeenCalledWith(
            'DeviceController',
            'getAllDevices',
            'Database connection failed'
          );
          expect(mockRes.status).toHaveBeenCalledWith(500);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            error: 'Failed to retrieve devices'
          });
        });

        test('should trim device_key padding correctly', async () => {
          mockReq.user = { user_id: 1 };
          const mockDevices = [
            {
              device_key: 'abc-123-def                         ',
              device_name: 'Padded Device',
              created_at: '2024-01-01T09:00:00Z'
            }
          ];
          pool.query.mockResolvedValue({ rows: mockDevices });

          await getAllDevices(mockReq, mockRes);

          expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            data: expect.arrayContaining([
              expect.objectContaining({
                device_key: 'abc-123-def'
              })
            ])
          });
        });
      });

      describe('registerDevice()', () => {
        test('should register new IoT device', () => {});
      });

      describe('getUserDevices()', () => {
        test('should retrieve user devices', () => {});
      });

      describe('updateDeviceStatus()', () => {
        test('should update device status', () => {});
      });

      describe('deleteDevice()', () => {
        test('should remove device', () => {});
      });
    });