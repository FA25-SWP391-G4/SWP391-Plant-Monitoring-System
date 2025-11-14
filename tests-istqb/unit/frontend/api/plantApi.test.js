import plantApi from './plantApi';
import axiosClient from './axiosClient';

// Mock axiosClient
jest.mock('./axiosClient');
const mockedAxiosClient = axiosClient;

describe('plantApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe('getAll', () => {
        it('should return plants data from new format (with success wrapper)', async () => {
            const mockData = [{ id: 1, name: 'Plant 1' }, { id: 2, name: 'Plant 2' }];
            const mockResponse = { data: { success: true, data: mockData } };
            mockedAxiosClient.get.mockResolvedValue(mockResponse);

            const result = await plantApi.getAll();

            expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/plants');
            expect(result).toEqual(mockData);
        });

        it('should return plants data from old format (direct array)', async () => {
            const mockData = [{ id: 1, name: 'Plant 1' }, { id: 2, name: 'Plant 2' }];
            const mockResponse = { data: mockData };
            mockedAxiosClient.get.mockResolvedValue(mockResponse);

            const result = await plantApi.getAll();

            expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/plants');
            expect(result).toEqual(mockData);
        });

        it('should handle errors and log them', async () => {
            const mockError = new Error('Network error');
            mockedAxiosClient.get.mockRejectedValue(mockError);

            await expect(plantApi.getAll()).rejects.toThrow('Network error');
            expect(console.error).toHaveBeenCalledWith('Error fetching plants:', mockError);
        });
    });

    describe('getById', () => {
        it('should return plant data by ID', async () => {
            const mockPlant = { id: 1, name: 'Plant 1' };
            const mockResponse = { data: mockPlant };
            mockedAxiosClient.get.mockResolvedValue(mockResponse);

            const result = await plantApi.getById(1);

            expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/plants/1');
            expect(result).toEqual(mockPlant);
        });

        it('should handle errors and log them', async () => {
            const mockError = new Error('Plant not found');
            mockedAxiosClient.get.mockRejectedValue(mockError);

            await expect(plantApi.getById(1)).rejects.toThrow('Plant not found');
            expect(console.error).toHaveBeenCalledWith('Error fetching plant 1:', mockError);
        });
    });

    describe('waterPlant', () => {
        it('should water plant with duration', async () => {
            const mockResponse = { data: { success: true } };
            mockedAxiosClient.post.mockResolvedValue(mockResponse);

            const result = await plantApi.waterPlant(1, 5000);

            expect(mockedAxiosClient.post).toHaveBeenCalledWith('/api/plants/1/water', { duration: 5000 });
            expect(result).toEqual({ success: true });
        });

        it('should stop watering with action', async () => {
            const mockResponse = { data: { success: true } };
            mockedAxiosClient.post.mockResolvedValue(mockResponse);

            const result = await plantApi.waterPlant(1, null, 'pump_off');

            expect(mockedAxiosClient.post).toHaveBeenCalledWith('/api/plants/1/water', { action: 'pump_off' });
            expect(result).toEqual({ success: true });
        });

        it('should handle errors and log them', async () => {
            const mockError = new Error('Watering failed');
            mockedAxiosClient.post.mockRejectedValue(mockError);

            await expect(plantApi.waterPlant(1, 5000)).rejects.toThrow('Watering failed');
            expect(console.error).toHaveBeenCalledWith('Error watering plant 1:', mockError);
        });
    });

    describe('getWateringSchedule', () => {
        it('should return watering schedule', async () => {
            const mockSchedule = { enabled: true, times: ['08:00', '18:00'] };
            const mockResponse = { data: mockSchedule };
            mockedAxiosClient.get.mockResolvedValue(mockResponse);

            const result = await plantApi.getWateringSchedule(1);

            expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/plants/1/schedule');
            expect(result).toEqual(mockSchedule);
        });

        it('should handle errors and log them', async () => {
            const mockError = new Error('Schedule not found');
            mockedAxiosClient.get.mockRejectedValue(mockError);

            await expect(plantApi.getWateringSchedule(1)).rejects.toThrow('Schedule not found');
            expect(console.error).toHaveBeenCalledWith('Error fetching watering schedule for plant 1:', mockError);
        });
    });

    describe('getSensorHistory', () => {
        it('should return sensor history', async () => {
            const mockHistory = [{ timestamp: '2023-01-01', moisture: 65 }];
            const mockResponse = { data: mockHistory };
            mockedAxiosClient.get.mockResolvedValue(mockResponse);

            const result = await plantApi.getSensorHistory(1);

            expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/plants/1/history/sensors');
            expect(result).toEqual(mockHistory);
        });

        it('should handle errors and log them', async () => {
            const mockError = new Error('History not found');
            mockedAxiosClient.get.mockRejectedValue(mockError);

            await expect(plantApi.getSensorHistory(1)).rejects.toThrow('History not found');
            expect(console.error).toHaveBeenCalledWith('Error fetching sensor history:', mockError);
        });
    });

    describe('getSensorStats', () => {
        it('should return sensor statistics', async () => {
            const mockStats = { avgMoisture: 65, maxTemp: 25 };
            const mockResponse = { data: mockStats };
            mockedAxiosClient.get.mockResolvedValue(mockResponse);

            const result = await plantApi.getSensorStats(1);

            expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/plants/1/stats/sensors');
            expect(result).toEqual(mockStats);
        });

        it('should handle errors and log them', async () => {
            const mockError = new Error('Stats not found');
            mockedAxiosClient.get.mockRejectedValue(mockError);

            await expect(plantApi.getSensorStats(1)).rejects.toThrow('Stats not found');
            expect(console.error).toHaveBeenCalledWith('Error fetching sensor stats:', mockError);
        });
    });

    describe('getWateringHistory', () => {
        it('should return watering history', async () => {
            const mockHistory = [{ timestamp: '2023-01-01', duration: 5000 }];
            const mockResponse = { data: mockHistory };
            mockedAxiosClient.get.mockResolvedValue(mockResponse);

            const result = await plantApi.getWateringHistory(1);

            expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/plants/1/history/watering');
            expect(result).toEqual(mockHistory);
        });

        it('should handle errors and log them', async () => {
            const mockError = new Error('History not found');
            mockedAxiosClient.get.mockRejectedValue(mockError);

            await expect(plantApi.getWateringHistory(1)).rejects.toThrow('History not found');
            expect(console.error).toHaveBeenCalledWith('Error fetching watering history:', mockError);
        });
    });

    describe('getLastWatered', () => {
        it('should return last watered information', async () => {
            const mockLastWatered = { timestamp: '2023-01-01T10:00:00Z', duration: 5000 };
            const mockResponse = { data: mockLastWatered };
            mockedAxiosClient.get.mockResolvedValue(mockResponse);

            const result = await plantApi.getLastWatered(1);

            expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/plants/1/last-watered');
            expect(result).toEqual(mockLastWatered);
        });

        it('should handle errors and log them', async () => {
            const mockError = new Error('Last watered info not found');
            mockedAxiosClient.get.mockRejectedValue(mockError);

            await expect(plantApi.getLastWatered(1)).rejects.toThrow('Last watered info not found');
            expect(console.error).toHaveBeenCalledWith('Error fetching last watered info:', mockError);
        });
    });

    describe('setWateringSchedule', () => {
        it('should set watering schedule', async () => {
            const mockSchedule = { enabled: true, times: ['08:00', '18:00'] };
            const mockResponse = { data: { success: true } };
            mockedAxiosClient.post.mockResolvedValue(mockResponse);

            const result = await plantApi.setWateringSchedule(1, mockSchedule);

            expect(mockedAxiosClient.post).toHaveBeenCalledWith('/api/plants/1/schedule', mockSchedule);
            expect(result).toEqual({ success: true });
        });

        it('should handle errors and log them', async () => {
            const mockError = new Error('Schedule update failed');
            mockedAxiosClient.post.mockRejectedValue(mockError);

            await expect(plantApi.setWateringSchedule(1, {})).rejects.toThrow('Schedule update failed');
            expect(console.error).toHaveBeenCalledWith('Error setting watering schedule for plant 1:', mockError);
        });
    });

    describe('toggleAutoWatering', () => {
        it('should toggle auto-watering on', async () => {
            const mockResponse = { data: { success: true, enabled: true } };
            mockedAxiosClient.post.mockResolvedValue(mockResponse);

            const result = await plantApi.toggleAutoWatering(1, true);

            expect(mockedAxiosClient.post).toHaveBeenCalledWith('/api/plants/1/auto-watering', { enabled: true });
            expect(result).toEqual({ success: true, enabled: true });
        });

        it('should toggle auto-watering off', async () => {
            const mockResponse = { data: { success: true, enabled: false } };
            mockedAxiosClient.post.mockResolvedValue(mockResponse);

            const result = await plantApi.toggleAutoWatering(1, false);

            expect(mockedAxiosClient.post).toHaveBeenCalledWith('/api/plants/1/auto-watering', { enabled: false });
            expect(result).toEqual({ success: true, enabled: false });
        });

        it('should handle errors and log them', async () => {
            const mockError = new Error('Toggle failed');
            mockedAxiosClient.post.mockRejectedValue(mockError);

            await expect(plantApi.toggleAutoWatering(1, true)).rejects.toThrow('Toggle failed');
            expect(console.error).toHaveBeenCalledWith('Error toggling auto-watering for plant 1:', mockError);
        });
    });

    describe('setSensorThresholds', () => {
        it('should set sensor thresholds', async () => {
            const mockThresholds = { moistureMin: 30, moistureMax: 70, tempMax: 30 };
            const mockResponse = { data: { success: true } };
            mockedAxiosClient.put.mockResolvedValue(mockResponse);

            const result = await plantApi.setSensorThresholds(1, mockThresholds);

            expect(mockedAxiosClient.put).toHaveBeenCalledWith('/api/plants/1/thresholds', mockThresholds);
            expect(result).toEqual({ success: true });
        });

        it('should handle errors and log them', async () => {
            const mockError = new Error('Thresholds update failed');
            mockedAxiosClient.put.mockRejectedValue(mockError);

            await expect(plantApi.setSensorThresholds(1, {})).rejects.toThrow('Thresholds update failed');
            expect(console.error).toHaveBeenCalledWith('Error setting thresholds for plant 1:', mockError);
        });
    });
});