const reportController = require('./reportController');
const WateringHistory = require('../models/WateringHistory');
const SensorData = require('../models/SensorData');
const Plant = require('../models/Plant');
const SystemLog = require('../models/SystemLog');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../models/WateringHistory');
jest.mock('../models/SensorData');
jest.mock('../models/Plant');
jest.mock('../models/SystemLog');
jest.mock('csv-writer');
jest.mock('fs');
jest.mock('path');

describe('Report Controller', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            params: {},
            query: {},
            body: {},
            user: {
                user_id: 1,
                role: 'Regular'
            }
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            download: jest.fn()
        };

        // Clear all mocks
        jest.clearAllMocks();
        console.error = jest.fn();
    });

    describe('getWateringHistory', () => {
        it('should return watering history for a valid plant', async () => {
            const mockPlant = {
                plant_id: 1,
                user_id: 1,
                name: 'Test Plant'
            };
            const mockHistory = [
                { watering_id: 1, duration: 30, water_amount: 100 },
                { watering_id: 2, duration: 25, water_amount: 90 }
            ];

            mockReq.params.plantId = '1';
            Plant.findById.mockResolvedValue(mockPlant);
            WateringHistory.findByPlantId.mockResolvedValue(mockHistory);

            await reportController.getWateringHistory(mockReq, mockRes);

            expect(Plant.findById).toHaveBeenCalledWith('1');
            expect(WateringHistory.findByPlantId).toHaveBeenCalledWith('1', null, null);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockHistory
            });
        });

        it('should return 404 when plant not found', async () => {
            mockReq.params.plantId = '999';
            Plant.findById.mockResolvedValue(null);

            await reportController.getWateringHistory(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Plant not found'
            });
        });

        it('should return 403 when user does not own the plant', async () => {
            const mockPlant = {
                plant_id: 1,
                user_id: 2,
                name: 'Other User Plant'
            };

            mockReq.params.plantId = '1';
            Plant.findById.mockResolvedValue(mockPlant);

            await reportController.getWateringHistory(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'You do not have permission to access this plant'
            });
        });

        it('should allow admin to access any plant', async () => {
            const mockPlant = {
                plant_id: 1,
                user_id: 2,
                name: 'Other User Plant'
            };
            const mockHistory = [];

            mockReq.params.plantId = '1';
            mockReq.user.role = 'Admin';
            Plant.findById.mockResolvedValue(mockPlant);
            WateringHistory.findByPlantId.mockResolvedValue(mockHistory);

            await reportController.getWateringHistory(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockHistory
            });
        });

        it('should handle date filtering', async () => {
            const mockPlant = {
                plant_id: 1,
                user_id: 1,
                name: 'Test Plant'
            };
            const mockHistory = [];

            mockReq.params.plantId = '1';
            mockReq.query.startDate = '2023-01-01';
            mockReq.query.endDate = '2023-12-31';
            Plant.findById.mockResolvedValue(mockPlant);
            WateringHistory.findByPlantId.mockResolvedValue(mockHistory);

            await reportController.getWateringHistory(mockReq, mockRes);

            expect(WateringHistory.findByPlantId).toHaveBeenCalledWith(
                '1',
                new Date('2023-01-01'),
                new Date('2023-12-31')
            );
        });

        it('should return 400 for invalid date format', async () => {
            const mockPlant = {
                plant_id: 1,
                user_id: 1,
                name: 'Test Plant'
            };

            mockReq.params.plantId = '1';
            mockReq.query.startDate = 'invalid-date';
            Plant.findById.mockResolvedValue(mockPlant);

            await reportController.getWateringHistory(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid date format'
            });
        });

        it('should handle server errors', async () => {
            mockReq.params.plantId = '1';
            Plant.findById.mockRejectedValue(new Error('Database error'));

            await reportController.getWateringHistory(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to retrieve watering history'
            });
        });
    });

    describe('exportWateringHistory', () => {
        const mockCsvWriter = {
            writeRecords: jest.fn().mockResolvedValue()
        };

        beforeEach(() => {
            createObjectCsvWriter.mockReturnValue(mockCsvWriter);
            fs.existsSync.mockReturnValue(true);
            fs.mkdirSync.mockImplementation();
            fs.unlink.mockImplementation((path, callback) => callback());
            path.join.mockImplementation((...args) => args.join('/'));
        });

        it('should export watering history as CSV', async () => {
            const mockPlant = {
                plant_id: 1,
                user_id: 1,
                name: 'Test Plant'
            };
            const mockHistory = [
                { watering_id: 1, duration: 30, water_amount: 100 }
            ];

            mockReq.params.plantId = '1';
            Plant.findById.mockResolvedValue(mockPlant);
            WateringHistory.findByPlantId.mockResolvedValue(mockHistory);

            await reportController.exportWateringHistory(mockReq, mockRes);

            expect(createObjectCsvWriter).toHaveBeenCalled();
            expect(mockCsvWriter.writeRecords).toHaveBeenCalledWith(mockHistory);
            expect(mockRes.download).toHaveBeenCalled();
        });

        it('should create directory if it does not exist', async () => {
            const mockPlant = {
                plant_id: 1,
                user_id: 1,
                name: 'Test Plant'
            };
            const mockHistory = [];

            mockReq.params.plantId = '1';
            fs.existsSync.mockReturnValue(false);
            Plant.findById.mockResolvedValue(mockPlant);
            WateringHistory.findByPlantId.mockResolvedValue(mockHistory);

            await reportController.exportWateringHistory(mockReq, mockRes);

            expect(fs.mkdirSync).toHaveBeenCalled();
        });
    });

    describe('searchWateringHistory', () => {
        it('should search watering history for premium users', async () => {
            const mockPlants = [
                { plant_id: 1, name: 'Plant 1' },
                { plant_id: 2, name: 'Plant 2' }
            ];
            const mockSearchResults = [
                { watering_id: 1, duration: 30 }
            ];

            mockReq.user.role = 'Premium';
            mockReq.body = {
                startDate: '2023-01-01',
                endDate: '2023-12-31',
                method: 'auto'
            };

            Plant.findByUserId.mockResolvedValue(mockPlants);
            WateringHistory.search.mockResolvedValue(mockSearchResults);

            await reportController.searchWateringHistory(mockReq, mockRes);

            expect(Plant.findByUserId).toHaveBeenCalledWith(1);
            expect(WateringHistory.search).toHaveBeenCalledWith({
                plantId: [1, 2],
                startDate: new Date('2023-01-01'),
                endDate: new Date('2023-12-31'),
                method: 'auto',
                minDuration: undefined,
                maxDuration: undefined,
                userId: 1
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockSearchResults
            });
        });

        it('should return 403 for non-premium users', async () => {
            mockReq.user.role = 'Regular';

            await reportController.searchWateringHistory(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'This feature requires a Premium subscription'
            });
        });

        it('should allow admin users', async () => {
            const mockPlants = [];
            const mockSearchResults = [];

            mockReq.user.role = 'Admin';
            mockReq.body = {};

            Plant.findByUserId.mockResolvedValue(mockPlants);
            WateringHistory.search.mockResolvedValue(mockSearchResults);

            await reportController.searchWateringHistory(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getPlantHealthReport', () => {
        it('should generate health report for premium users', async () => {
            const mockPlant = {
                plant_id: 1,
                user_id: 1,
                name: 'Test Plant',
                thresholds: {
                    moisture_min: 30,
                    moisture_max: 70,
                    temperature_min: 15,
                    temperature_max: 30,
                    light_min: 20,
                    light_max: 80
                }
            };
            const mockSensorData = [
                { sensor_type: 'moisture', value: 50 },
                { sensor_type: 'temperature', value: 25 },
                { sensor_type: 'light', value: 60 }
            ];
            const mockWateringHistory = [
                { duration: 30, water_amount: 100, method: 'auto' }
            ];

            mockReq.user.role = 'Premium';
            mockReq.params.plantId = '1';
            mockReq.query.timeframe = 'week';

            Plant.findById.mockResolvedValue(mockPlant);
            SensorData.findByPlantId.mockResolvedValue(mockSensorData);
            WateringHistory.findByPlantId.mockResolvedValue(mockWateringHistory);

            await reportController.getPlantHealthReport(mockReq, mockRes);

            expect(Plant.findById).toHaveBeenCalledWith('1');
            expect(SensorData.findByPlantId).toHaveBeenCalled();
            expect(WateringHistory.findByPlantId).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            
            const responseData = mockRes.json.mock.calls[0][0].data;
            expect(responseData.plant_id).toBe(1);
            expect(responseData.plant_name).toBe('Test Plant');
            expect(responseData.timeframe).toBe('week');
            expect(responseData.sensor_summary).toBeDefined();
            expect(responseData.watering_summary).toBeDefined();
            expect(responseData.health_assessment).toBeDefined();
        });

        it('should return 403 for non-premium users', async () => {
            mockReq.user.role = 'Regular';
            mockReq.params.plantId = '1';

            await reportController.getPlantHealthReport(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'This feature requires a Premium subscription'
            });
        });

        it('should return 400 for invalid timeframe', async () => {
            mockReq.user.role = 'Premium';
            mockReq.params.plantId = '1';
            mockReq.query.timeframe = 'invalid';

            await reportController.getPlantHealthReport(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid timeframe. Must be day, week, or month'
            });
        });

        it('should default to week timeframe', async () => {
            const mockPlant = {
                plant_id: 1,
                user_id: 1,
                name: 'Test Plant'
            };

            mockReq.user.role = 'Premium';
            mockReq.params.plantId = '1';
            // No timeframe specified

            Plant.findById.mockResolvedValue(mockPlant);
            SensorData.findByPlantId.mockResolvedValue([]);
            WateringHistory.findByPlantId.mockResolvedValue([]);

            await reportController.getPlantHealthReport(mockReq, mockRes);

            const responseData = mockRes.json.mock.calls[0][0].data;
            expect(responseData.timeframe).toBe('week');
        });

        it('should calculate health assessment correctly', async () => {
            const mockPlant = {
                plant_id: 1,
                user_id: 1,
                name: 'Test Plant',
                thresholds: {
                    moisture_min: 30,
                    moisture_max: 70,
                    temperature_min: 15,
                    temperature_max: 30,
                    light_min: 20,
                    light_max: 80
                }
            };
            const mockSensorData = [
                { sensor_type: 'moisture', value: 50 }, // optimal
                { sensor_type: 'temperature', value: 25 }, // optimal
                { sensor_type: 'light', value: 60 } // optimal
            ];

            mockReq.user.role = 'Premium';
            mockReq.params.plantId = '1';

            Plant.findById.mockResolvedValue(mockPlant);
            SensorData.findByPlantId.mockResolvedValue(mockSensorData);
            WateringHistory.findByPlantId.mockResolvedValue([]);

            await reportController.getPlantHealthReport(mockReq, mockRes);

            const responseData = mockRes.json.mock.calls[0][0].data;
            expect(responseData.health_assessment.overall_status).toBe('excellent');
            expect(responseData.recommendations).toContain('Plant conditions are optimal. Continue current care routine.');
        });

        it('should include raw data for daily reports', async () => {
            const mockPlant = {
                plant_id: 1,
                user_id: 1,
                name: 'Test Plant'
            };
            const mockSensorData = [
                { sensor_type: 'moisture', value: 50 }
            ];

            mockReq.user.role = 'Premium';
            mockReq.params.plantId = '1';
            mockReq.query.timeframe = 'day';

            Plant.findById.mockResolvedValue(mockPlant);
            SensorData.findByPlantId.mockResolvedValue(mockSensorData);
            WateringHistory.findByPlantId.mockResolvedValue([]);

            await reportController.getPlantHealthReport(mockReq, mockRes);

            const responseData = mockRes.json.mock.calls[0][0].data;
            expect(responseData.raw_data.sensor_data).toEqual(mockSensorData);
        });

        it('should not include raw sensor data for non-daily reports', async () => {
            const mockPlant = {
                plant_id: 1,
                user_id: 1,
                name: 'Test Plant'
            };

            mockReq.user.role = 'Premium';
            mockReq.params.plantId = '1';
            mockReq.query.timeframe = 'week';

            Plant.findById.mockResolvedValue(mockPlant);
            SensorData.findByPlantId.mockResolvedValue([]);
            WateringHistory.findByPlantId.mockResolvedValue([]);

            await reportController.getPlantHealthReport(mockReq, mockRes);

            const responseData = mockRes.json.mock.calls[0][0].data;
            expect(responseData.raw_data.sensor_data).toBeNull();
        });
    });
});