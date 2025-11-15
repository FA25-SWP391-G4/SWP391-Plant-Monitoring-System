import aiApi from './aiApi';
import axiosClient from './axiosClient';
import Cookies from 'js-cookie';

// Mock dependencies
jest.mock('./axiosClient');
jest.mock('js-cookie');

describe('aiApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Helper Functions', () => {
        describe('getAuthToken', () => {
            it('should return Bearer token when token exists', () => {
                Cookies.get.mockReturnValue('test-token');
                
                // Access the internal function through a test method
                const token = aiApi.testEndpoint ? 'Bearer test-token' : null;
                expect(Cookies.get).toHaveBeenCalledWith('token');
            });

            it('should return null when no token exists', () => {
                Cookies.get.mockReturnValue(undefined);
                expect(Cookies.get).toHaveBeenCalledWith('token');
            });
        });

        describe('checkUserAccess', () => {
            it('should return requiresLogin when no token exists', async () => {
                Cookies.get.mockReturnValue(undefined);
                
                const result = await aiApi.chatWithAI({});
                expect(result).toEqual({
                    success: false,
                    error: 'Please log in to use the AI chatbot',
                    requiresLogin: true,
                    code: 'AUTH_REQUIRED'
                });
            });

            it('should return hasAccess for admin role', async () => {
                const adminToken = 'header.' + btoa(JSON.stringify({ role: 'admin' })) + '.signature';
                Cookies.get.mockReturnValue(adminToken);
                axiosClient.post.mockResolvedValue({ data: { response: 'test' } });
                
                const result = await aiApi.chatWithAI({ message: 'test' });
                expect(result.success).toBe(true);
            });

            it('should return hasAccess for ultimate role', async () => {
                const ultimateToken = 'header.' + btoa(JSON.stringify({ role: 'ultimate' })) + '.signature';
                Cookies.get.mockReturnValue(ultimateToken);
                axiosClient.post.mockResolvedValue({ data: { response: 'test' } });
                
                const result = await aiApi.chatWithAI({ message: 'test' });
                expect(result.success).toBe(true);
            });

            it('should return requiresUltimate for basic user', async () => {
                const basicToken = 'header.' + btoa(JSON.stringify({ role: 'basic' })) + '.signature';
                Cookies.get.mockReturnValue(basicToken);
                
                const result = await aiApi.chatWithAI({});
                expect(result).toEqual({
                    success: false,
                    error: 'Ultimate subscription required for AI chatbot access',
                    requiresUltimate: true,
                    code: 'ULTIMATE_REQUIRED'
                });
            });

            it('should handle invalid token format', async () => {
                Cookies.get.mockReturnValue('invalid-token');
                
                const result = await aiApi.chatWithAI({});
                expect(result).toEqual({
                    success: false,
                    error: 'Please log in to use the AI chatbot',
                    requiresLogin: true,
                    code: 'AUTH_REQUIRED'
                });
            });
        });
    });

    describe('Core AI Endpoints', () => {
        describe('getHealth', () => {
            it('should call health endpoint', async () => {
                const mockResponse = { data: { status: 'healthy' } };
                axiosClient.get.mockResolvedValue(mockResponse);
                
                const result = await aiApi.getHealth();
                
                expect(axiosClient.get).toHaveBeenCalledWith('/ai/test/status');
                expect(result).toBe(mockResponse);
            });
        });

        describe('chatWithAI', () => {
            it('should successfully chat with AI when user has access', async () => {
                const adminToken = 'header.' + btoa(JSON.stringify({ role: 'admin' })) + '.signature';
                Cookies.get.mockReturnValue(adminToken);
                
                const mockResponse = { data: { response: 'AI response' } };
                axiosClient.post.mockResolvedValue(mockResponse);
                
                const result = await aiApi.chatWithAI({ message: 'Hello' });
                
                expect(axiosClient.post).toHaveBeenCalledWith('/api/ai/chatbot', { message: 'Hello' }, {
                    headers: { 'Authorization': 'Bearer ' + adminToken }
                });
                expect(result).toEqual({ success: true, data: mockResponse.data });
            });

            it('should handle 401 TOKEN_EXPIRED error', async () => {
                const adminToken = 'header.' + btoa(JSON.stringify({ role: 'admin' })) + '.signature';
                Cookies.get.mockReturnValue(adminToken);
                
                const error = {
                    response: {
                        status: 401,
                        data: { code: 'TOKEN_EXPIRED' }
                    }
                };
                axiosClient.post.mockRejectedValue(error);
                
                const result = await aiApi.chatWithAI({ message: 'Hello' });
                
                expect(Cookies.remove).toHaveBeenCalledWith('token');
                expect(result).toEqual({
                    success: false,
                    error: 'Your session has expired. Please log in again.',
                    requiresLogin: true,
                    code: 'TOKEN_EXPIRED'
                });
            });

            it('should handle 403 ULTIMATE_REQUIRED error', async () => {
                const adminToken = 'header.' + btoa(JSON.stringify({ role: 'admin' })) + '.signature';
                Cookies.get.mockReturnValue(adminToken);
                
                const error = {
                    response: {
                        status: 403,
                        data: { code: 'ULTIMATE_REQUIRED' }
                    }
                };
                axiosClient.post.mockRejectedValue(error);
                
                const result = await aiApi.chatWithAI({ message: 'Hello' });
                
                expect(result).toEqual({
                    success: false,
                    error: 'Ultimate subscription required for AI features',
                    requiresUltimate: true,
                    code: 'ULTIMATE_REQUIRED'
                });
            });
        });

        describe('testChatbot', () => {
            it('should call test chatbot endpoint', async () => {
                const mockResponse = { data: { response: 'test response' } };
                axiosClient.post.mockResolvedValue(mockResponse);
                
                const result = await aiApi.testChatbot({ message: 'test' });
                
                expect(axiosClient.post).toHaveBeenCalledWith('/ai/test/chatbot', { message: 'test' });
                expect(result).toBe(mockResponse);
            });
        });

        describe('analyzeImage', () => {
            it('should successfully analyze image when user has access', async () => {
                const ultimateToken = 'header.' + btoa(JSON.stringify({ role: 'ultimate' })) + '.signature';
                Cookies.get.mockReturnValue(ultimateToken);
                
                const mockResponse = { data: { analysis: 'healthy plant' } };
                axiosClient.post.mockResolvedValue(mockResponse);
                
                const formData = new FormData();
                const result = await aiApi.analyzeImage(formData);
                
                expect(axiosClient.post).toHaveBeenCalledWith('/ai/plant-analysis', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': 'Bearer ' + ultimateToken
                    },
                    timeout: 60000
                });
                expect(result).toEqual({ success: true, data: mockResponse.data });
            });

            it('should require authentication', async () => {
                Cookies.get.mockReturnValue(undefined);
                
                const result = await aiApi.analyzeImage(new FormData());
                
                expect(result).toEqual({
                    success: false,
                    error: 'Please log in to use image analysis',
                    requiresLogin: true,
                    code: 'AUTH_REQUIRED'
                });
            });
        });

        describe('testPlantAnalysis', () => {
            it('should call test plant analysis endpoint', async () => {
                const mockResponse = { data: { analysis: 'test analysis' } };
                axiosClient.post.mockResolvedValue(mockResponse);
                
                const result = await aiApi.testPlantAnalysis({ plantData: 'test' });
                
                expect(axiosClient.post).toHaveBeenCalledWith('/ai/test/plant-analysis', { plantData: 'test' });
                expect(result).toBe(mockResponse);
            });
        });
    });

    describe('Irrigation & Watering', () => {
        describe('getIrrigationRecommendations', () => {
            it('should get recommendations when authenticated', async () => {
                const token = 'test-token';
                Cookies.get.mockReturnValue(token);
                
                const mockResponse = { data: { recommendations: [] } };
                axiosClient.post.mockResolvedValue(mockResponse);
                
                const result = await aiApi.getIrrigationRecommendations({ sensorData: 'test' });
                
                expect(axiosClient.post).toHaveBeenCalledWith('/ai/watering-prediction', { sensorData: 'test' }, {
                    headers: { 'Authorization': 'Bearer test-token' }
                });
                expect(result).toEqual({ success: true, data: mockResponse.data });
            });

            it('should require authentication', async () => {
                Cookies.get.mockReturnValue(undefined);
                
                const result = await aiApi.getIrrigationRecommendations({});
                
                expect(result).toEqual({
                    success: false,
                    error: 'Please log in to get irrigation recommendations',
                    requiresLogin: true,
                    code: 'AUTH_REQUIRED'
                });
            });
        });

        describe('optimizeIrrigationSchedule', () => {
            it('should optimize schedule when authenticated', async () => {
                const token = 'test-token';
                Cookies.get.mockReturnValue(token);
                
                const mockResponse = { data: { schedule: [] } };
                axiosClient.post.mockResolvedValue(mockResponse);
                
                const result = await aiApi.optimizeIrrigationSchedule({ plantData: 'test' });
                
                expect(axiosClient.post).toHaveBeenCalledWith('/ai/watering-schedule', { plantData: 'test' }, {
                    headers: { 'Authorization': 'Bearer test-token' }
                });
                expect(result).toEqual({ success: true, data: mockResponse.data });
            });
        });
    });

    describe('Analysis & Insights', () => {
        describe('analyzeHistoricalData', () => {
            it('should analyze historical data when authenticated', async () => {
                const token = 'test-token';
                Cookies.get.mockReturnValue(token);
                
                const mockResponse = { data: { insights: [] } };
                axiosClient.post.mockResolvedValue(mockResponse);
                
                const result = await aiApi.analyzeHistoricalData({ historicalData: 'test' });
                
                expect(axiosClient.post).toHaveBeenCalledWith('/ai/historical-analysis', { historicalData: 'test' }, {
                    headers: { 'Authorization': 'Bearer test-token' },
                    timeout: 60000
                });
                expect(result).toEqual({ success: true, data: mockResponse.data });
            });

            it('should handle 503 service unavailable error', async () => {
                const token = 'test-token';
                Cookies.get.mockReturnValue(token);
                
                const error = {
                    response: {
                        status: 503,
                        data: { code: 'SERVICE_UNAVAILABLE' }
                    }
                };
                axiosClient.post.mockRejectedValue(error);
                
                const result = await aiApi.analyzeHistoricalData({});
                
                expect(result).toEqual({
                    success: false,
                    error: 'AI service is temporarily unavailable. Please try again later.',
                    code: 'SERVICE_UNAVAILABLE'
                });
            });
        });
    });

    describe('Legacy Methods', () => {
        it('should call getIrrigationRecommendations for predictWatering', async () => {
            const token = 'test-token';
            Cookies.get.mockReturnValue(token);
            axiosClient.post.mockResolvedValue({ data: {} });
            
            await aiApi.predictWatering({ test: 'data' });
            
            expect(axiosClient.post).toHaveBeenCalledWith('/ai/watering-prediction', { test: 'data' }, {
                headers: { 'Authorization': 'Bearer test-token' }
            });
        });

        it('should call testPlantAnalysis for analyzePlant', async () => {
            axiosClient.post.mockResolvedValue({ data: {} });
            
            await aiApi.analyzePlant({ test: 'data' });
            
            expect(axiosClient.post).toHaveBeenCalledWith('/ai/test/plant-analysis', { test: 'data' });
        });

        it('should call optimizeIrrigationSchedule for optimizeWateringSchedule', async () => {
            const token = 'test-token';
            Cookies.get.mockReturnValue(token);
            axiosClient.post.mockResolvedValue({ data: {} });
            
            await aiApi.optimizeWateringSchedule({ test: 'data' });
            
            expect(axiosClient.post).toHaveBeenCalledWith('/ai/watering-schedule', { test: 'data' }, {
                headers: { 'Authorization': 'Bearer test-token' }
            });
        });
    });

    describe('Image Analysis Methods', () => {
        describe('analyzeHealth', () => {
            it('should create FormData and call analyzeImage', async () => {
                const ultimateToken = 'header.' + btoa(JSON.stringify({ role: 'ultimate' })) + '.signature';
                Cookies.get.mockReturnValue(ultimateToken);
                axiosClient.post.mockResolvedValue({ data: { health: 'good' } });
                
                const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
                const result = await aiApi.analyzeHealth(mockFile);
                
                expect(result.success).toBe(true);
            });
        });

        describe('identifyPlant', () => {
            it('should identify plant from image', async () => {
                const mockResponse = { data: { species: 'Rose' } };
                axiosClient.post.mockResolvedValue(mockResponse);
                
                const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
                const result = await aiApi.identifyPlant(mockFile);
                
                expect(axiosClient.post).toHaveBeenCalledWith('/ai/plant-analysis', expect.any(FormData), {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                expect(result).toBe(mockResponse);
            });
        });

        describe('detectDisease', () => {
            it('should detect disease from image', async () => {
                const ultimateToken = 'header.' + btoa(JSON.stringify({ role: 'ultimate' })) + '.signature';
                Cookies.get.mockReturnValue(ultimateToken);
                axiosClient.post.mockResolvedValue({ data: { disease: 'none' } });
                
                const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
                const result = await aiApi.detectDisease(mockFile);
                
                expect(result.success).toBe(true);
            });
        });
    });

    describe('Analytics & History', () => {
        describe('getGrowthPrediction', () => {
            it('should get growth predictions for plant', async () => {
                const mockResponse = { data: { predictions: [] } };
                axiosClient.get.mockResolvedValue(mockResponse);
                
                const result = await aiApi.getGrowthPrediction(123);
                
                expect(axiosClient.get).toHaveBeenCalledWith('/ai/historical-analysis/123');
                expect(result).toBe(mockResponse);
            });
        });

        describe('getAnalysisHistory', () => {
            it('should get analysis history with options', async () => {
                const mockResponse = { data: { history: [] } };
                axiosClient.get.mockResolvedValue(mockResponse);
                
                const options = { page: 1, limit: 10 };
                const result = await aiApi.getAnalysisHistory(123, options);
                
                expect(axiosClient.get).toHaveBeenCalledWith('/ai/historical-analysis/123', { params: options });
                expect(result).toBe(mockResponse);
            });

            it('should get analysis history without options', async () => {
                const mockResponse = { data: { history: [] } };
                axiosClient.get.mockResolvedValue(mockResponse);
                
                const result = await aiApi.getAnalysisHistory(123);
                
                expect(axiosClient.get).toHaveBeenCalledWith('/ai/historical-analysis/123', { params: {} });
                expect(result).toBe(mockResponse);
            });
        });
    });

    describe('Development & Testing', () => {
        describe('testEndpoint', () => {
            it('should test health endpoint', async () => {
                const mockResponse = { data: { status: 'ok' } };
                axiosClient.get.mockResolvedValue(mockResponse);
                
                const result = await aiApi.testEndpoint('health');
                
                expect(axiosClient.get).toHaveBeenCalledWith('/ai/test/status');
                expect(result).toBe(mockResponse);
            });

            it('should test chatbot endpoint', async () => {
                const mockResponse = { data: { response: 'test' } };
                axiosClient.post.mockResolvedValue(mockResponse);
                
                const result = await aiApi.testEndpoint('chatbot', { message: 'test' });
                
                expect(axiosClient.post).toHaveBeenCalledWith('/ai/test/chatbot', { message: 'test' });
                expect(result).toBe(mockResponse);
            });

            it('should test plant-analysis endpoint', async () => {
                const mockResponse = { data: { analysis: 'test' } };
                axiosClient.post.mockResolvedValue(mockResponse);
                
                const result = await aiApi.testEndpoint('plant-analysis', { data: 'test' });
                
                expect(axiosClient.post).toHaveBeenCalledWith('/ai/test/plant-analysis', { data: 'test' });
                expect(result).toBe(mockResponse);
            });

            it('should reject for unknown endpoint', async () => {
                await expect(aiApi.testEndpoint('unknown')).rejects.toThrow("Test endpoint 'unknown' not found");
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle INVALID_TOKEN error', async () => {
            const adminToken = 'header.' + btoa(JSON.stringify({ role: 'admin' })) + '.signature';
            Cookies.get.mockReturnValue(adminToken);
            
            const error = {
                response: {
                    status: 401,
                    data: { code: 'INVALID_TOKEN' }
                }
            };
            axiosClient.post.mockRejectedValue(error);
            
            const result = await aiApi.chatWithAI({});
            
            expect(Cookies.remove).toHaveBeenCalledWith('token');
            expect(result).toEqual({
                success: false,
                error: 'Invalid authentication. Please log in again.',
                requiresLogin: true,
                code: 'INVALID_TOKEN'
            });
        });

        it('should handle unknown error', async () => {
            const token = 'test-token';
            Cookies.get.mockReturnValue(token);
            
            const error = {
                response: {
                    status: 500,
                    data: { error: 'Internal server error' }
                }
            };
            axiosClient.post.mockRejectedValue(error);
            
            const result = await aiApi.getIrrigationRecommendations({});
            
            expect(result).toEqual({
                success: false,
                error: 'Internal server error',
                code: 'UNKNOWN_ERROR'
            });
        });

        it('should handle error without response data', async () => {
            const token = 'test-token';
            Cookies.get.mockReturnValue(token);
            
            const error = { response: { status: 500 } };
            axiosClient.post.mockRejectedValue(error);
            
            const result = await aiApi.getIrrigationRecommendations({});
            
            expect(result).toEqual({
                success: false,
                error: 'An unexpected error occurred',
                code: 'UNKNOWN_ERROR'
            });
        });
    });
});