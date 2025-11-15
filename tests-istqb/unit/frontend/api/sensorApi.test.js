import sensorApi from './sensorApi';
import axiosClient from './axiosClient';

// Mock the axiosClient
jest.mock('./axiosClient');

describe('sensorApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSensorData', () => {
        it('should get sensor data with default timeRange', async () => {
            const mockData = { data: 'sensor data' };
            axiosClient.get.mockResolvedValue(mockData);

            const result = await sensorApi.getSensorData('plant-123');

            expect(axiosClient.get).toHaveBeenCalledWith('/sensor/plant-123/data?timeRange=24h');
            expect(result).toBe(mockData);
        });

        it('should get sensor data with custom timeRange', async () => {
            const mockData = { data: 'sensor data' };
            axiosClient.get.mockResolvedValue(mockData);

            const result = await sensorApi.getSensorData('plant-123', '7d');

            expect(axiosClient.get).toHaveBeenCalledWith('/sensor/plant-123/data?timeRange=7d');
            expect(result).toBe(mockData);
        });
    });

    describe('getLatestReadings', () => {
        it('should get latest sensor readings', async () => {
            const mockData = { data: 'latest readings' };
            axiosClient.get.mockResolvedValue(mockData);

            const result = await sensorApi.getLatestReadings('plant-123');

            expect(axiosClient.get).toHaveBeenCalledWith('/sensor/plant-123/latest');
            expect(result).toBe(mockData);
        });
    });

    describe('getHistoricalData', () => {
        it('should get historical data with default pagination', async () => {
            const mockData = { data: 'historical data' };
            axiosClient.get.mockResolvedValue(mockData);

            const result = await sensorApi.getHistoricalData('plant-123', '2024-01-01', '2024-01-31');

            expect(axiosClient.get).toHaveBeenCalledWith('/sensor/plant-123/history', {
                params: { 
                    startDate: '2024-01-01', 
                    endDate: '2024-01-31', 
                    limit: 100, 
                    offset: 0 
                }
            });
            expect(result).toBe(mockData);
        });

        it('should get historical data with custom pagination', async () => {
            const mockData = { data: 'historical data' };
            axiosClient.get.mockResolvedValue(mockData);

            const result = await sensorApi.getHistoricalData('plant-123', '2024-01-01', '2024-01-31', 50, 20);

            expect(axiosClient.get).toHaveBeenCalledWith('/sensor/plant-123/history', {
                params: { 
                    startDate: '2024-01-01', 
                    endDate: '2024-01-31', 
                    limit: 50, 
                    offset: 20 
                }
            });
            expect(result).toBe(mockData);
        });
    });

    describe('getSensorSummary', () => {
        it('should get sensor summary with default period', async () => {
            const mockData = { data: 'sensor summary' };
            axiosClient.get.mockResolvedValue(mockData);

            const result = await sensorApi.getSensorSummary('plant-123');

            expect(axiosClient.get).toHaveBeenCalledWith('/sensor/plant-123/summary?period=daily');
            expect(result).toBe(mockData);
        });

        it('should get sensor summary with custom period', async () => {
            const mockData = { data: 'sensor summary' };
            axiosClient.get.mockResolvedValue(mockData);

            const result = await sensorApi.getSensorSummary('plant-123', 'weekly');

            expect(axiosClient.get).toHaveBeenCalledWith('/sensor/plant-123/summary?period=weekly');
            expect(result).toBe(mockData);
        });
    });

    describe('getUserSensors', () => {
        it('should get all user sensors', async () => {
            const mockData = { data: 'user sensors' };
            axiosClient.get.mockResolvedValue(mockData);

            const result = await sensorApi.getUserSensors();

            expect(axiosClient.get).toHaveBeenCalledWith('/sensor/user/sensors');
            expect(result).toBe(mockData);
        });
    });

    describe('updateSensorConfig', () => {
        it('should update sensor configuration', async () => {
            const mockData = { data: 'updated config' };
            const config = { threshold: 50 };
            axiosClient.put.mockResolvedValue(mockData);

            const result = await sensorApi.updateSensorConfig('sensor-123', config);

            expect(axiosClient.put).toHaveBeenCalledWith('/sensor/sensor-123/config', config);
            expect(result).toBe(mockData);
        });
    });

    describe('calibrateSensor', () => {
        it('should calibrate sensor', async () => {
            const mockData = { data: 'calibration result' };
            const calibrationData = { value: 100 };
            axiosClient.post.mockResolvedValue(mockData);

            const result = await sensorApi.calibrateSensor('sensor-123', calibrationData);

            expect(axiosClient.post).toHaveBeenCalledWith('/sensor/sensor-123/calibrate', calibrationData);
            expect(result).toBe(mockData);
        });
    });

    describe('getSensorStatus', () => {
        it('should get sensor status', async () => {
            const mockData = { data: 'sensor status' };
            axiosClient.get.mockResolvedValue(mockData);

            const result = await sensorApi.getSensorStatus('sensor-123');

            expect(axiosClient.get).toHaveBeenCalledWith('/sensor/sensor-123/status');
            expect(result).toBe(mockData);
        });
    });
});