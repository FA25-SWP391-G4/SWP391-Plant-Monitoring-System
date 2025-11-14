import planApi from './planApi';
import axiosClient from './axiosClient';

// Mock axiosClient
jest.mock('./axiosClient');

describe('planApi', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getPublicPlans', () => {
        it('should return public plans data', async () => {
            const mockData = [{ id: 1, name: 'Basic Plan', public: true }];
            axiosClient.get.mockResolvedValue({ data: mockData });

            const result = await planApi.getPublicPlans();

            expect(axiosClient.get).toHaveBeenCalledWith('/api/plans');
            expect(result).toEqual(mockData);
        });

        it('should throw error when request fails', async () => {
            const mockError = new Error('Network error');
            axiosClient.get.mockRejectedValue(mockError);

            await expect(planApi.getPublicPlans()).rejects.toThrow('Network error');
            expect(axiosClient.get).toHaveBeenCalledWith('/api/plans');
        });
    });

    describe('getAllPlans', () => {
        it('should return all plans data', async () => {
            const mockData = [{ id: 1, name: 'Basic Plan' }, { id: 2, name: 'Premium Plan' }];
            axiosClient.get.mockResolvedValue({ data: mockData });

            const result = await planApi.getAllPlans();

            expect(axiosClient.get).toHaveBeenCalledWith('/api/plans/all');
            expect(result).toEqual(mockData);
        });

        it('should throw error when request fails', async () => {
            const mockError = new Error('Unauthorized');
            axiosClient.get.mockRejectedValue(mockError);

            await expect(planApi.getAllPlans()).rejects.toThrow('Unauthorized');
            expect(axiosClient.get).toHaveBeenCalledWith('/api/plans/all');
        });
    });

    describe('getPlanById', () => {
        it('should return plan data for valid ID', async () => {
            const mockData = { id: 1, name: 'Basic Plan' };
            axiosClient.get.mockResolvedValue({ data: mockData });

            const result = await planApi.getPlanById(1);

            expect(axiosClient.get).toHaveBeenCalledWith('/api/plans/1');
            expect(result).toEqual(mockData);
        });

        it('should throw error when plan not found', async () => {
            const mockError = new Error('Plan not found');
            axiosClient.get.mockRejectedValue(mockError);

            await expect(planApi.getPlanById(999)).rejects.toThrow('Plan not found');
            expect(axiosClient.get).toHaveBeenCalledWith('/api/plans/999');
        });
    });

    describe('checkAdminAccess', () => {
        it('should return admin access status', async () => {
            const mockData = { hasAdminAccess: true };
            axiosClient.get.mockResolvedValue({ data: mockData });

            const result = await planApi.checkAdminAccess();

            expect(axiosClient.get).toHaveBeenCalledWith('/api/plans/admin-access');
            expect(result).toEqual(mockData);
        });

        it('should throw error when access check fails', async () => {
            const mockError = new Error('Access denied');
            axiosClient.get.mockRejectedValue(mockError);

            await expect(planApi.checkAdminAccess()).rejects.toThrow('Access denied');
            expect(axiosClient.get).toHaveBeenCalledWith('/api/plans/admin-access');
        });
    });

    describe('createPlan', () => {
        it('should create plan successfully', async () => {
            const planData = { name: 'New Plan', price: 29.99 };
            const mockResponse = { id: 3, ...planData };
            axiosClient.post.mockResolvedValue({ data: mockResponse });

            const result = await planApi.createPlan(planData);

            expect(axiosClient.post).toHaveBeenCalledWith('/api/plans', planData);
            expect(result).toEqual(mockResponse);
        });

        it('should throw error when creation fails', async () => {
            const planData = { name: 'Invalid Plan' };
            const mockError = new Error('Validation error');
            axiosClient.post.mockRejectedValue(mockError);

            await expect(planApi.createPlan(planData)).rejects.toThrow('Validation error');
            expect(axiosClient.post).toHaveBeenCalledWith('/api/plans', planData);
        });
    });

    describe('updatePlan', () => {
        it('should update plan successfully', async () => {
            const planId = 1;
            const planData = { name: 'Updated Plan', price: 39.99 };
            const mockResponse = { id: planId, ...planData };
            axiosClient.put.mockResolvedValue({ data: mockResponse });

            const result = await planApi.updatePlan(planId, planData);

            expect(axiosClient.put).toHaveBeenCalledWith('/api/plans/1', planData);
            expect(result).toEqual(mockResponse);
        });

        it('should throw error when update fails', async () => {
            const planId = 999;
            const planData = { name: 'Non-existent Plan' };
            const mockError = new Error('Plan not found');
            axiosClient.put.mockRejectedValue(mockError);

            await expect(planApi.updatePlan(planId, planData)).rejects.toThrow('Plan not found');
            expect(axiosClient.put).toHaveBeenCalledWith('/api/plans/999', planData);
        });
    });
});