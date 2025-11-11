/**
 * DASHBOARD CONTROLLER TESTS
 * ===========================
 * 
 * Comprehensive unit tests for dashboard controller
 * Covers dashboard data aggregation, real-time monitoring, analytics, and widgets
 */

const dashboardController = require('../../../controllers/dashboardController');
const User = require('../../../models/User');
const Plant = require('../../../models/Plant');
const Device = require('../../../models/Device');
const SensorData = require('../../../models/SensorData');
const WateringHistory = require('../../../models/WateringHistory');
const SystemLog = require('../../../models/SystemLog');

// Mock dependencies
jest.mock('../../../models/User');
jest.mock('../../../models/Plant');
jest.mock('../../../models/Device');
jest.mock('../../../models/SensorData');
jest.mock('../../../models/WateringHistory');
jest.mock('../../../models/SystemLog');

describe('Dashboard Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            user: {
                id: 'user-123',
                email: 'test@example.com',
                role: 'Regular'
            },
            query: {},
            params: {},
            ip: '127.0.0.1'
        };

        mockRes = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();

        // Reset mocks
        jest.clearAllMocks();
    });

    // UC4: Dashboard Overview
    describe('Dashboard Overview (UC4)', () => {
        describe('getDashboardOverview', () => {
            it('should get complete dashboard data successfully', async () => {
                const mockPlants = [
                    {
                        id: 'plant-1',
                        name: 'Tomato Plant',
                        status: 'Healthy',
                        moisture_level: 75,
                        last_watered: new Date('2024-01-15')
                    },
                    {
                        id: 'plant-2',
                        name: 'Rose Bush',
                        status: 'Needs Water',
                        moisture_level: 25,
                        last_watered: new Date('2024-01-10')
                    }
                ];

                const mockDevices = [
                    {
                        id: 'device-1',
                        name: 'Moisture Sensor 1',
                        type: 'moisture_sensor',
                        status: 'online',
                        battery_level: 85
                    },
                    {
                        id: 'device-2',
                        name: 'Water Pump 1',
                        type: 'pump',
                        status: 'offline',
                        battery_level: 0
                    }
                ];

                const mockRecentActivity = [
                    {
                        id: 'activity-1',
                        type: 'watering',
                        description: 'Tomato Plant watered automatically',
                        timestamp: new Date('2024-01-15T10:00:00Z')
                    }
                ];

                const mockWeatherData = {
                    temperature: 22.5,
                    humidity: 65,
                    forecast: 'Partly Cloudy'
                };

                Plant.findByUserId.mockResolvedValue(mockPlants);
                Device.findByUserId.mockResolvedValue(mockDevices);
                SensorData.getRecentActivity.mockResolvedValue(mockRecentActivity);
                SensorData.getWeatherData.mockResolvedValue(mockWeatherData);

                await dashboardController.getDashboardOverview(mockReq, mockRes);

                expect(Plant.findByUserId).toHaveBeenCalledWith('user-123');
                expect(Device.findByUserId).toHaveBeenCalledWith('user-123');
                expect(SensorData.getRecentActivity).toHaveBeenCalledWith('user-123', 10);
                expect(mockRes.json).toHaveBeenCalledWith({
                    plants: {
                        total: 2,
                        healthy: 1,
                        needsAttention: 1,
                        list: mockPlants
                    },
                    devices: {
                        total: 2,
                        online: 1,
                        offline: 1,
                        list: mockDevices
                    },
                    recentActivity: mockRecentActivity,
                    weather: mockWeatherData,
                    summary: {
                        totalPlants: 2,
                        activePlants: 1,
                        totalDevices: 2,
                        onlineDevices: 1,
                        averageMoisture: 50,
                        lastUpdate: expect.any(Date)
                    }
                });
            });

            it('should handle empty dashboard data', async () => {
                Plant.findByUserId.mockResolvedValue([]);
                Device.findByUserId.mockResolvedValue([]);
                SensorData.getRecentActivity.mockResolvedValue([]);
                SensorData.getWeatherData.mockResolvedValue(null);

                await dashboardController.getDashboardOverview(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    plants: {
                        total: 0,
                        healthy: 0,
                        needsAttention: 0,
                        list: []
                    },
                    devices: {
                        total: 0,
                        online: 0,
                        offline: 0,
                        list: []
                    },
                    recentActivity: [],
                    weather: null,
                    summary: {
                        totalPlants: 0,
                        activePlants: 0,
                        totalDevices: 0,
                        onlineDevices: 0,
                        averageMoisture: 0,
                        lastUpdate: expect.any(Date)
                    }
                });
            });

            it('should handle database errors gracefully', async () => {
                Plant.findByUserId.mockRejectedValue(new Error('Database connection failed'));

                await dashboardController.getDashboardOverview(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(500);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Failed to load dashboard data'
                });
            });
        });

        describe('getPlantSummary', () => {
            it('should get plant summary statistics', async () => {
                const mockStats = {
                    total: 5,
                    healthy: 3,
                    needsWater: 1,
                    needsAttention: 1,
                    averageMoisture: 68,
                    averageTemperature: 23.5,
                    totalWaterings: 25
                };

                Plant.getStatistics.mockResolvedValue(mockStats);

                await dashboardController.getPlantSummary(mockReq, mockRes);

                expect(Plant.getStatistics).toHaveBeenCalledWith('user-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    plantStats: mockStats
                });
            });

            it('should handle errors in plant summary', async () => {
                Plant.getStatistics.mockRejectedValue(new Error('Statistics calculation failed'));

                await dashboardController.getPlantSummary(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(500);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Failed to get plant summary'
                });
            });
        });
    });

    // UC6: Real-time Monitoring
    describe('Real-time Monitoring (UC6)', () => {
        describe('getRealtimeData', () => {
            it('should get real-time sensor data', async () => {
                const mockSensorData = [
                    {
                        deviceId: 'device-1',
                        type: 'moisture',
                        value: 75,
                        timestamp: new Date('2024-01-15T10:00:00Z')
                    },
                    {
                        deviceId: 'device-2',
                        type: 'temperature',
                        value: 22.5,
                        timestamp: new Date('2024-01-15T10:01:00Z')
                    }
                ];

                const mockAlerts = [
                    {
                        id: 'alert-1',
                        plantId: 'plant-1',
                        type: 'low_moisture',
                        severity: 'warning',
                        message: 'Moisture level below threshold',
                        timestamp: new Date('2024-01-15T09:30:00Z')
                    }
                ];

                SensorData.getLatestReadings.mockResolvedValue(mockSensorData);
                SensorData.getActiveAlerts.mockResolvedValue(mockAlerts);

                await dashboardController.getRealtimeData(mockReq, mockRes);

                expect(SensorData.getLatestReadings).toHaveBeenCalledWith('user-123');
                expect(SensorData.getActiveAlerts).toHaveBeenCalledWith('user-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    sensorData: mockSensorData,
                    alerts: mockAlerts,
                    timestamp: expect.any(Date)
                });
            });

            it('should handle filtering by device type', async () => {
                mockReq.query.deviceType = 'moisture_sensor';

                const mockFilteredData = [
                    {
                        deviceId: 'device-1',
                        type: 'moisture',
                        value: 75,
                        timestamp: new Date('2024-01-15T10:00:00Z')
                    }
                ];

                SensorData.getLatestReadingsByType.mockResolvedValue(mockFilteredData);
                SensorData.getActiveAlerts.mockResolvedValue([]);

                await dashboardController.getRealtimeData(mockReq, mockRes);

                expect(SensorData.getLatestReadingsByType).toHaveBeenCalledWith('user-123', 'moisture_sensor');
                expect(mockRes.json).toHaveBeenCalledWith({
                    sensorData: mockFilteredData,
                    alerts: [],
                    timestamp: expect.any(Date)
                });
            });
        });

        describe('getDeviceStatus', () => {
            it('should get current device statuses', async () => {
                const mockDeviceStatuses = [
                    {
                        id: 'device-1',
                        name: 'Moisture Sensor 1',
                        status: 'online',
                        lastSeen: new Date('2024-01-15T10:00:00Z'),
                        batteryLevel: 85,
                        signalStrength: 90
                    },
                    {
                        id: 'device-2',
                        name: 'Water Pump 1',
                        status: 'offline',
                        lastSeen: new Date('2024-01-14T15:30:00Z'),
                        batteryLevel: 0,
                        signalStrength: 0
                    }
                ];

                Device.getStatusSummary.mockResolvedValue(mockDeviceStatuses);

                await dashboardController.getDeviceStatus(mockReq, mockRes);

                expect(Device.getStatusSummary).toHaveBeenCalledWith('user-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    devices: mockDeviceStatuses,
                    summary: {
                        total: 2,
                        online: 1,
                        offline: 1,
                        lowBattery: 1
                    }
                });
            });
        });
    });

    // UC13: Data Analytics & Trends
    describe('Data Analytics & Trends (UC13)', () => {
        describe('getAnalyticsTrends', () => {
            it('should get analytics data for specified period', async () => {
                mockReq.query = {
                    period: '7d',
                    metric: 'moisture'
                };

                const mockTrendData = [
                    {
                        date: '2024-01-09',
                        averageMoisture: 70,
                        wateringCount: 2
                    },
                    {
                        date: '2024-01-10',
                        averageMoisture: 65,
                        wateringCount: 3
                    }
                ];

                const mockInsights = {
                    moistureTrend: 'decreasing',
                    wateringFrequency: 'normal',
                    recommendations: ['Consider increasing watering frequency']
                };

                SensorData.getTrendData.mockResolvedValue(mockTrendData);
                SensorData.generateInsights.mockResolvedValue(mockInsights);

                await dashboardController.getAnalyticsTrends(mockReq, mockRes);

                expect(SensorData.getTrendData).toHaveBeenCalledWith('user-123', '7d', 'moisture');
                expect(mockRes.json).toHaveBeenCalledWith({
                    trendData: mockTrendData,
                    insights: mockInsights,
                    period: '7d',
                    metric: 'moisture'
                });
            });

            it('should default to 30-day period if not specified', async () => {
                const mockTrendData = [];
                const mockInsights = {};

                SensorData.getTrendData.mockResolvedValue(mockTrendData);
                SensorData.generateInsights.mockResolvedValue(mockInsights);

                await dashboardController.getAnalyticsTrends(mockReq, mockRes);

                expect(SensorData.getTrendData).toHaveBeenCalledWith('user-123', '30d', 'all');
            });

            it('should validate period parameter', async () => {
                mockReq.query.period = 'invalid';

                await dashboardController.getAnalyticsTrends(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid period specified. Valid periods: 1d, 7d, 30d, 90d'
                });
            });
        });

        describe('getWateringAnalytics', () => {
            it('should get watering frequency and effectiveness analytics', async () => {
                const mockWateringData = {
                    totalWaterings: 45,
                    averagePerDay: 2.1,
                    mostActiveHour: 8,
                    waterSaved: 15.5,
                    effectiveness: 85
                };

                const mockEfficiencyData = [
                    {
                        plantId: 'plant-1',
                        plantName: 'Tomato Plant',
                        wateringsCount: 20,
                        moistureImprovement: 40,
                        efficiency: 90
                    }
                ];

                WateringHistory.getAnalytics.mockResolvedValue(mockWateringData);
                WateringHistory.getEfficiencyData.mockResolvedValue(mockEfficiencyData);

                await dashboardController.getWateringAnalytics(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    wateringData: mockWateringData,
                    efficiency: mockEfficiencyData,
                    recommendations: expect.any(Array)
                });
            });
        });
    });

    // Dashboard Widgets
    describe('Dashboard Widgets', () => {
        describe('getWeatherWidget', () => {
            it('should get weather information for dashboard', async () => {
                const mockWeather = {
                    current: {
                        temperature: 22.5,
                        humidity: 65,
                        condition: 'Partly Cloudy',
                        windSpeed: 8
                    },
                    forecast: [
                        {
                            date: '2024-01-16',
                            high: 25,
                            low: 18,
                            condition: 'Sunny',
                            rainfall: 0
                        }
                    ],
                    lastUpdated: new Date('2024-01-15T10:00:00Z')
                };

                SensorData.getWeatherData.mockResolvedValue(mockWeather);

                await dashboardController.getWeatherWidget(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    weather: mockWeather
                });
            });

            it('should handle weather service unavailable', async () => {
                SensorData.getWeatherData.mockResolvedValue(null);

                await dashboardController.getWeatherWidget(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    weather: null,
                    message: 'Weather data unavailable'
                });
            });
        });

        describe('getQuickActions', () => {
            it('should get available quick actions for user', async () => {
                const mockActions = [
                    {
                        id: 'water_all_plants',
                        title: 'Water All Plants',
                        description: 'Start watering cycle for all plants',
                        available: true,
                        estimatedTime: 10
                    },
                    {
                        id: 'check_sensors',
                        title: 'Check All Sensors',
                        description: 'Run diagnostic on all sensors',
                        available: true,
                        estimatedTime: 2
                    },
                    {
                        id: 'generate_report',
                        title: 'Generate Weekly Report',
                        description: 'Create comprehensive plant health report',
                        available: false,
                        reason: 'Premium feature'
                    }
                ];

                Device.getAvailableActions.mockResolvedValue(mockActions);

                await dashboardController.getQuickActions(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    actions: mockActions
                });
            });
        });

        describe('getSystemHealth', () => {
            it('should get system health indicators', async () => {
                const mockHealthData = {
                    database: 'healthy',
                    apiResponse: 150,
                    deviceConnectivity: 95,
                    lastBackup: new Date('2024-01-14T02:00:00Z'),
                    systemLoad: 45,
                    memoryUsage: 68,
                    status: 'operational'
                };

                SystemLog.getSystemHealth.mockResolvedValue(mockHealthData);

                await dashboardController.getSystemHealth(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    health: mockHealthData
                });
            });

            it('should only show system health for admin users', async () => {
                mockReq.user.role = 'Regular';

                await dashboardController.getSystemHealth(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(403);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Admin access required'
                });
            });
        });
    });

    // Error handling
    describe('Error Handling', () => {
        it('should handle concurrent data loading failures', async () => {
            Plant.findByUserId.mockRejectedValue(new Error('Plant data failed'));
            Device.findByUserId.mockRejectedValue(new Error('Device data failed'));
            SensorData.getRecentActivity.mockResolvedValue([]);

            await dashboardController.getDashboardOverview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to load dashboard data'
            });
        });

        it('should handle timeout in real-time data', async () => {
            SensorData.getLatestReadings.mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 10000))
            );

            await dashboardController.getRealtimeData(mockReq, mockRes);

            // Should implement timeout handling
        });

        it('should handle invalid user context', async () => {
            mockReq.user = null;

            await dashboardController.getDashboardOverview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'User authentication required'
            });
        });
    });
});