import deviceApi from './deviceApi';
import axiosClient from './axiosClient';

// Mock axiosClient
jest.mock('./axiosClient');
const mockedAxiosClient = axiosClient;

describe('deviceApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe('getAll', () => {
        it('should fetch all devices successfully', async () => {
            const mockDevices = [
                { id: 1, name: 'Device 1', type: 'sensor' },
                { id: 2, name: 'Device 2', type: 'pump' }
            ];
            mockedAxiosClient.get.mockResolvedValueOnce({ data: mockDevices });

            const result = await deviceApi.getAll();

            expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/devices');
            expect(result).toEqual(mockDevices);
        });

        it('should handle errors when fetching devices', async () => {
            const mockError = new Error('Network error');
            mockedAxiosClient.get.mockRejectedValueOnce(mockError);

            await expect(deviceApi.getAll()).rejects.toThrow('Network error');
            expect(console.error).toHaveBeenCalledWith('Error fetching devices:', mockError);
        });
    });

    describe('getById', () => {
        it('should fetch device by ID successfully', async () => {
            const deviceId = 1;
            const mockDevice = { id: 1, name: 'Device 1', type: 'sensor' };
            mockedAxiosClient.get.mockResolvedValueOnce({ data: mockDevice });

            const result = await deviceApi.getById(deviceId);

            expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/devices/1');
            expect(result).toEqual(mockDevice);
        });

        it('should handle errors when fetching device by ID', async () => {
            const deviceId = 1;
            const mockError = new Error('Device not found');
            mockedAxiosClient.get.mockRejectedValueOnce(mockError);

            await expect(deviceApi.getById(deviceId)).rejects.toThrow('Device not found');
            expect(console.error).toHaveBeenCalledWith('Error fetching device 1:', mockError);
        });
    });

    describe('getLatestSensorData', () => {
        it('should fetch latest sensor data successfully', async () => {
            const mockSensorData = [
                { deviceId: 1, temperature: 25, humidity: 60 },
                { deviceId: 2, temperature: 22, humidity: 55 }
            ];
            mockedAxiosClient.get.mockResolvedValueOnce({ data: mockSensorData });

            const result = await deviceApi.getLatestSensorData();

            expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/sensor/latest');
            expect(result).toEqual(mockSensorData);
        });

        it('should handle errors when fetching latest sensor data', async () => {
            const mockError = new Error('Sensor data unavailable');
            mockedAxiosClient.get.mockRejectedValueOnce(mockError);

            await expect(deviceApi.getLatestSensorData()).rejects.toThrow('Sensor data unavailable');
            expect(console.error).toHaveBeenCalledWith('Error fetching latest sensor data:', mockError);
        });
    });

    describe('getSensorHistory', () => {
        it('should fetch sensor history successfully', async () => {
            const deviceId = 1;
            const params = { startDate: '2023-01-01', endDate: '2023-01-31' };
            const mockHistory = [
                { timestamp: '2023-01-01T00:00:00Z', temperature: 25, humidity: 60 },
                { timestamp: '2023-01-02T00:00:00Z', temperature: 24, humidity: 58 }
            ];
            mockedAxiosClient.get.mockResolvedValueOnce({ data: mockHistory });

            const result = await deviceApi.getSensorHistory(deviceId, params);

            expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/sensor/history/1', { params });
            expect(result).toEqual(mockHistory);
        });

        it('should fetch sensor history without params', async () => {
            const deviceId = 1;
            const mockHistory = [];
            mockedAxiosClient.get.mockResolvedValueOnce({ data: mockHistory });

            const result = await deviceApi.getSensorHistory(deviceId);

            expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/sensor/history/1', { params: {} });
            expect(result).toEqual(mockHistory);
        });

        it('should handle errors when fetching sensor history', async () => {
            const deviceId = 1;
            const mockError = new Error('History not available');
            mockedAxiosClient.get.mockRejectedValueOnce(mockError);

            await expect(deviceApi.getSensorHistory(deviceId)).rejects.toThrow('History not available');
            expect(console.error).toHaveBeenCalledWith('Error fetching sensor history for device 1:', mockError);
        });
    });

    describe('registerDevice', () => {
        it('should register device successfully', async () => {
            const deviceData = { name: 'New Device', type: 'sensor', macAddress: '00:11:22:33:44:55' };
            const mockResponse = { id: 3, ...deviceData, status: 'active' };
            mockedAxiosClient.post.mockResolvedValueOnce({ data: mockResponse });

            const result = await deviceApi.registerDevice(deviceData);

            expect(mockedAxiosClient.post).toHaveBeenCalledWith('/api/devices', deviceData);
            expect(result).toEqual(mockResponse);
        });

        it('should handle errors when registering device', async () => {
            const deviceData = { name: 'New Device', type: 'sensor' };
            const mockError = new Error('Registration failed');
            mockedAxiosClient.post.mockRejectedValueOnce(mockError);

            await expect(deviceApi.registerDevice(deviceData)).rejects.toThrow('Registration failed');
            expect(console.error).toHaveBeenCalledWith('Error registering device:', mockError);
        });
    });

    describe('updateDevice', () => {
        it('should update device successfully', async () => {
            const deviceId = 1;
            const deviceData = { name: 'Updated Device', type: 'pump' };
            const mockResponse = { id: 1, ...deviceData, status: 'active' };
            mockedAxiosClient.put.mockResolvedValueOnce({ data: mockResponse });

            const result = await deviceApi.updateDevice(deviceId, deviceData);

            expect(mockedAxiosClient.put).toHaveBeenCalledWith('/api/devices/1', deviceData);
            expect(result).toEqual(mockResponse);
        });

        it('should handle errors when updating device', async () => {
            const deviceId = 1;
            const deviceData = { name: 'Updated Device' };
            const mockError = new Error('Update failed');
            mockedAxiosClient.put.mockRejectedValueOnce(mockError);

            await expect(deviceApi.updateDevice(deviceId, deviceData)).rejects.toThrow('Update failed');
            expect(console.error).toHaveBeenCalledWith('Error updating device 1:', mockError);
        });
    });

    describe('deleteDevice', () => {
        it('should delete device successfully', async () => {
            const deviceId = 1;
            const mockResponse = { message: 'Device deleted successfully' };
            mockedAxiosClient.delete.mockResolvedValueOnce({ data: mockResponse });

            const result = await deviceApi.deleteDevice(deviceId);

            expect(mockedAxiosClient.delete).toHaveBeenCalledWith('/api/devices/1');
            expect(result).toEqual(mockResponse);
        });

        it('should handle errors when deleting device', async () => {
            const deviceId = 1;
            const mockError = new Error('Delete failed');
            mockedAxiosClient.delete.mockRejectedValueOnce(mockError);

            await expect(deviceApi.deleteDevice(deviceId)).rejects.toThrow('Delete failed');
            expect(console.error).toHaveBeenCalledWith('Error deleting device 1:', mockError);
        });
    });
});