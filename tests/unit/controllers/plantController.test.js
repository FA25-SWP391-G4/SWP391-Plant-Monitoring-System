/**
 * PLANT CONTROLLER UNIT TESTS
 * ============================
 * 
 * Tests for UC2: Manage Plant Information
 * Tests for UC3: View Plant Care Reminders  
 * Tests for UC4: View Plant Monitoring Dashboard
 * 
 * Coverage:
 * - Plant CRUD operations
 * - Plant care reminder logic
 * - Dashboard data aggregation
 * - Error handling and validation
 */

const {
    getUserPlants,
    getPlantById,
    createPlant,
    waterPlant,
    getWateringSchedule,
    setWateringSchedule,
    toggleAutoWatering,
    setSensorThresholds,
    getWateringHistory,
    getSensorHistory,
    getCurrentSensorData,
    getSensorStats,
    getLastWatered
} = require('../../../controllers/plantController');

const Plant = require('../../../models/Plant');
const Zone = require('../../../models/Zone');
const PlantProfile = require('../../../models/PlantProfile');
const SystemLog = require('../../../models/SystemLog');

// Mock external dependencies
jest.mock('../../../models/Plant');
jest.mock('../../../models/Zone');
jest.mock('../../../models/PlantProfile');
jest.mock('../../../models/SystemLog');

describe('Plant Controller Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: {
                user_id: 'test-user-uuid',
                email: 'test@test.com',
                role: 'user'
            },
            params: {},
            body: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('UC2: Manage Plant Information', () => {
        describe('getUserPlants', () => {
            it('should return user plants successfully', async () => {
                const mockPlants = [
                    {
                        id: 1,
                        custom_name: 'My Rose',
                        species_name: 'Rosa rubiginosa',
                        status: 'healthy',
                        zone_id: 1,
                        zone_name: 'Living Room',
                        created_at: '2023-01-01'
                    }
                ];

                Plant.findByUserId = jest.fn().mockResolvedValue(mockPlants);

                await getUserPlants(req, res);

                expect(Plant.findByUserId).toHaveBeenCalledWith('test-user-uuid');
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            id: 1,
                            name: 'My Rose',
                            species: 'Rosa rubiginosa'
                        })
                    ])
                });
            });

            it('should handle empty plant list', async () => {
                Plant.findByUserId = jest.fn().mockResolvedValue([]);

                await getUserPlants(req, res);

                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    data: []
                });
            });

            it('should handle database errors gracefully', async () => {
                const error = new Error('Database connection failed');
                Plant.findByUserId = jest.fn().mockRejectedValue(error);
                SystemLog.error = jest.fn().mockResolvedValue();

                await getUserPlants(req, res);

                expect(SystemLog.error).toHaveBeenCalledWith(
                    'plantController',
                    expect.stringContaining('Error fetching plants')
                );
                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: 'Failed to fetch plants'
                });
            });
        });

        describe('getPlantById', () => {
            beforeEach(() => {
                req.params.plantId = '1';
            });

            it('should return specific plant details', async () => {
                const mockPlant = {
                    id: 1,
                    custom_name: 'My Rose',
                    species_name: 'Rosa rubiginosa',
                    status: 'healthy',
                    last_watered: '2023-01-01T10:00:00Z',
                    device_key: 'device-uuid',
                    moisture: 75,
                    temperature: 22.5,
                    humidity: 60,
                    light: 500
                };

                Plant.findByIdAndUserId = jest.fn().mockResolvedValue(mockPlant);

                await getPlantById(req, res);

                expect(Plant.findByIdAndUserId).toHaveBeenCalledWith('1', 'test-user-uuid');
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        id: 1,
                        name: 'My Rose',
                        species: 'Rosa rubiginosa',
                        data: expect.objectContaining({
                            moisture: 75,
                            temperature: 22.5
                        })
                    })
                );
            });

            it('should handle plant not found', async () => {
                Plant.findByIdAndUserId = jest.fn().mockResolvedValue(null);
                SystemLog.error = jest.fn().mockResolvedValue();

                await getPlantById(req, res);

                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: 'Failed to fetch plant details'
                });
            });
        });

        describe('createPlant', () => {
            beforeEach(() => {
                req.body = {
                    custom_name: 'New Rose',
                    profile_id: 1,
                    notes: 'Beautiful red roses',
                    zone_id: 1,
                    moisture_threshold: 70
                };
            });

            it('should create new plant successfully', async () => {
                const mockProfile = { id: 1, species_name: 'Rosa rubiginosa' };
                const mockZone = { id: 1, zone_name: 'Living Room' };
                const mockCreatedPlant = {
                    id: 1,
                    custom_name: 'New Rose',
                    profile_id: 1,
                    user_id: 'test-user-uuid'
                };

                PlantProfile.findById = jest.fn().mockResolvedValue(mockProfile);
                Zone.findByIdAndUserId = jest.fn().mockResolvedValue(mockZone);
                Plant.create = jest.fn().mockResolvedValue(mockCreatedPlant);
                SystemLog.info = jest.fn().mockResolvedValue();

                await createPlant(req, res);

                expect(PlantProfile.findById).toHaveBeenCalledWith(1);
                expect(Zone.findByIdAndUserId).toHaveBeenCalledWith(1, 'test-user-uuid');
                expect(Plant.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        custom_name: 'New Rose',
                        user_id: 'test-user-uuid'
                    })
                );
                expect(res.status).toHaveBeenCalledWith(201);
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    message: 'Plant created successfully',
                    data: mockCreatedPlant
                });
            });

            it('should validate required fields', async () => {
                req.body.custom_name = '';

                await createPlant(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Plant name is required'
                });
            });

            it('should validate zone existence', async () => {
                PlantProfile.findById = jest.fn().mockResolvedValue({ id: 1 });
                Zone.findByIdAndUserId = jest.fn().mockResolvedValue(null);

                await createPlant(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Invalid zone ID or zone does not belong to user'
                });
            });
        });
    });

    describe('UC3: View Plant Care Reminders', () => {
        describe('getWateringSchedule', () => {
            beforeEach(() => {
                req.params.plantId = '1';
            });

            it('should return watering schedule for plant', async () => {
                const mockSchedule = {
                    plant_id: 1,
                    schedule_time: '08:00',
                    frequency_days: 3,
                    is_active: true,
                    last_watered: '2023-01-01T08:00:00Z'
                };

                Plant.getWateringSchedule = jest.fn().mockResolvedValue(mockSchedule);

                await getWateringSchedule(req, res);

                expect(Plant.getWateringSchedule).toHaveBeenCalledWith('1', 'test-user-uuid');
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    data: mockSchedule
                });
            });

            it('should handle no schedule found', async () => {
                Plant.getWateringSchedule = jest.fn().mockResolvedValue(null);

                await getWateringSchedule(req, res);

                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    data: null
                });
            });
        });

        describe('setWateringSchedule', () => {
            beforeEach(() => {
                req.params.plantId = '1';
                req.body = {
                    schedule_time: '08:00',
                    frequency_days: 3,
                    is_active: true
                };
            });

            it('should create watering schedule successfully', async () => {
                const mockSchedule = {
                    plant_id: 1,
                    schedule_time: '08:00',
                    frequency_days: 3,
                    is_active: true
                };

                Plant.setWateringSchedule = jest.fn().mockResolvedValue(mockSchedule);
                SystemLog.info = jest.fn().mockResolvedValue();

                await setWateringSchedule(req, res);

                expect(Plant.setWateringSchedule).toHaveBeenCalledWith(
                    '1',
                    'test-user-uuid',
                    {
                        schedule_time: '08:00',
                        frequency_days: 3,
                        is_active: true
                    }
                );
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    message: 'Watering schedule updated successfully',
                    data: mockSchedule
                });
            });

            it('should validate schedule time format', async () => {
                req.body.schedule_time = 'invalid-time';

                await setWateringSchedule(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Invalid schedule time format. Use HH:MM format'
                });
            });

            it('should validate frequency days', async () => {
                req.body.frequency_days = 0;

                await setWateringSchedule(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Frequency days must be between 1 and 30'
                });
            });
        });
    });

    describe('UC4: View Plant Monitoring Dashboard', () => {
        describe('getCurrentSensorData', () => {
            beforeEach(() => {
                req.params.plantId = '1';
            });

            it('should return current sensor readings', async () => {
                const mockSensorData = {
                    plant_id: 1,
                    moisture: 75,
                    temperature: 22.5,
                    humidity: 60,
                    light: 500,
                    timestamp: '2023-01-01T10:00:00Z'
                };

                Plant.getCurrentSensorData = jest.fn().mockResolvedValue(mockSensorData);

                await getCurrentSensorData(req, res);

                expect(Plant.getCurrentSensorData).toHaveBeenCalledWith('1', 'test-user-uuid');
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    data: mockSensorData
                });
            });

            it('should handle no sensor data available', async () => {
                Plant.getCurrentSensorData = jest.fn().mockResolvedValue(null);

                await getCurrentSensorData(req, res);

                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    data: null,
                    message: 'No sensor data available'
                });
            });
        });

        describe('getSensorStats', () => {
            beforeEach(() => {
                req.params.plantId = '1';
                req.query = { period: '7d' };
            });

            it('should return sensor statistics', async () => {
                const mockStats = {
                    moisture: {
                        avg: 75.5,
                        min: 60,
                        max: 90,
                        readings_count: 168
                    },
                    temperature: {
                        avg: 22.3,
                        min: 18.5,
                        max: 25.2,
                        readings_count: 168
                    },
                    period: '7d',
                    generated_at: '2023-01-01T10:00:00Z'
                };

                Plant.getSensorStats = jest.fn().mockResolvedValue(mockStats);

                await getSensorStats(req, res);

                expect(Plant.getSensorStats).toHaveBeenCalledWith('1', 'test-user-uuid', '7d');
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    data: mockStats
                });
            });

            it('should validate period parameter', async () => {
                req.query.period = 'invalid';

                await getSensorStats(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Invalid period. Use 1d, 7d, 30d, or 90d'
                });
            });
        });

        describe('waterPlant', () => {
            beforeEach(() => {
                req.params.plantId = '1';
                req.body = { amount: 250 };
            });

            it('should water plant manually', async () => {
                const mockWateringResult = {
                    id: 1,
                    plant_id: 1,
                    amount: 250,
                    method: 'manual',
                    watered_at: '2023-01-01T10:00:00Z'
                };

                Plant.waterPlant = jest.fn().mockResolvedValue(mockWateringResult);
                SystemLog.info = jest.fn().mockResolvedValue();

                await waterPlant(req, res);

                expect(Plant.waterPlant).toHaveBeenCalledWith('1', 'test-user-uuid', 250, 'manual');
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    message: 'Plant watered successfully',
                    data: mockWateringResult
                });
            });

            it('should validate watering amount', async () => {
                req.body.amount = -50;

                await waterPlant(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Water amount must be between 1 and 1000ml'
                });
            });

            it('should handle plant not found', async () => {
                Plant.waterPlant = jest.fn().mockRejectedValue(new Error('Plant not found'));
                SystemLog.error = jest.fn().mockResolvedValue();

                await waterPlant(req, res);

                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: 'Failed to water plant'
                });
            });
        });

        describe('toggleAutoWatering', () => {
            beforeEach(() => {
                req.params.plantId = '1';
                req.body = { enabled: true };
            });

            it('should enable auto watering', async () => {
                const mockResult = {
                    plant_id: 1,
                    auto_watering_enabled: true,
                    updated_at: '2023-01-01T10:00:00Z'
                };

                Plant.toggleAutoWatering = jest.fn().mockResolvedValue(mockResult);
                SystemLog.info = jest.fn().mockResolvedValue();

                await toggleAutoWatering(req, res);

                expect(Plant.toggleAutoWatering).toHaveBeenCalledWith('1', 'test-user-uuid', true);
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    message: 'Auto watering enabled successfully',
                    data: mockResult
                });
            });

            it('should disable auto watering', async () => {
                req.body.enabled = false;
                
                const mockResult = {
                    plant_id: 1,
                    auto_watering_enabled: false,
                    updated_at: '2023-01-01T10:00:00Z'
                };

                Plant.toggleAutoWatering = jest.fn().mockResolvedValue(mockResult);
                SystemLog.info = jest.fn().mockResolvedValue();

                await toggleAutoWatering(req, res);

                expect(Plant.toggleAutoWatering).toHaveBeenCalledWith('1', 'test-user-uuid', false);
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    message: 'Auto watering disabled successfully',
                    data: mockResult
                });
            });
        });

        describe('setSensorThresholds', () => {
            beforeEach(() => {
                req.params.plantId = '1';
                req.body = {
                    moisture_threshold: 70,
                    temperature_min: 18,
                    temperature_max: 25,
                    humidity_min: 40,
                    humidity_max: 70
                };
            });

            it('should update sensor thresholds', async () => {
                const mockResult = {
                    plant_id: 1,
                    moisture_threshold: 70,
                    temperature_min: 18,
                    temperature_max: 25,
                    humidity_min: 40,
                    humidity_max: 70,
                    updated_at: '2023-01-01T10:00:00Z'
                };

                Plant.setSensorThresholds = jest.fn().mockResolvedValue(mockResult);
                SystemLog.info = jest.fn().mockResolvedValue();

                await setSensorThresholds(req, res);

                expect(Plant.setSensorThresholds).toHaveBeenCalledWith(
                    '1',
                    'test-user-uuid',
                    req.body
                );
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    message: 'Sensor thresholds updated successfully',
                    data: mockResult
                });
            });

            it('should validate threshold ranges', async () => {
                req.body.moisture_threshold = 150; // Invalid range

                await setSensorThresholds(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Moisture threshold must be between 0 and 100'
                });
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle SystemLog errors gracefully', async () => {
            Plant.findByUserId = jest.fn().mockRejectedValue(new Error('Database error'));
            SystemLog.error = jest.fn().mockRejectedValue(new Error('Logging failed'));

            await getUserPlants(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to fetch plants'
            });
        });

        it('should handle invalid plant IDs', async () => {
            req.params.plantId = 'invalid-id';
            
            await getPlantById(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid plant ID format'
            });
        });

        it('should handle missing authentication', async () => {
            req.user = null;

            await getUserPlants(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Authentication required'
            });
        });
    });
});