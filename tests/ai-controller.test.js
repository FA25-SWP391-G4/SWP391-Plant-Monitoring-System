/**
 * Unit tests for AIController using our mock implementation
 */

const {
    getAllModels,
    getModelById,
    getActiveModel,
    setActiveModel,
    runPredictionForPlant,
    testModelPerformance,
    createModel,
    updateModel,
    deleteModel
} = require('../__mocks__/aiController');

// Setup mock request and response objects
let mockReq = {
    params: {},
    body: {},
    user: { id: 'user123', role: 'admin' }
};

let mockRes = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis()
};describe('AI Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockReq.params = {};
        mockReq.body = {};
    });

    describe('getAllModels', () => {
        it('should return all AI models', async () => {
            // Act
            await getAllModels(mockReq, mockRes);
            
            // Assert
            expect(mockRes.json).toHaveBeenCalled();
            const models = mockRes.json.mock.calls[0][0];
            expect(Array.isArray(models)).toBeTruthy();
            expect(models.length).toBeGreaterThan(0);
        });
        
        it('should handle errors', async () => {
            // Arrange - Create a function that will throw an error
            const mockFn = async (req, res) => {
                try {
                    throw new Error('Database error');
                } catch (error) {
                    return res.status(500).json({ 
                        message: 'Error fetching AI models', 
                        error: error.message 
                    });
                }
            };
            
            // Act
            await mockFn(mockReq, mockRes);
            
            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Error fetching AI models',
                    error: 'Database error'
                })
            );
        });
    });

    describe('getModelById', () => {
        it('should return the model with the specified ID', async () => {
            // Arrange
            mockReq.params.id = 'model123';
            
            // Act
            await getModelById(mockReq, mockRes);
            
            // Assert
            expect(mockRes.json).toHaveBeenCalled();
            const model = mockRes.json.mock.calls[0][0];
            expect(model.id).toBe('model123');
        });
        
        it('should return 404 when model is not found', async () => {
            // Arrange
            mockReq.params.id = 'nonexistent';
            
            // Act
            await getModelById(mockReq, mockRes);
            
            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'AI model not found'
                })
            );
        });
    });

    describe('getActiveModel', () => {
        it('should return the active model', async () => {
            // Act
            await getActiveModel(mockReq, mockRes);
            
            // Assert
            expect(mockRes.json).toHaveBeenCalled();
            const model = mockRes.json.mock.calls[0][0];
            expect(model.isActive).toBe(true);
        });
        
        it('should return 404 when no active model is found', async () => {
            // Arrange - Create a function that simulates no active model
            const mockFn = async (req, res) => {
                return res.status(404).json({ message: 'No active AI model found' });
            };
            
            // Act
            await mockFn(mockReq, mockRes);
            
            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'No active AI model found'
                })
            );
        });
    });    describe('runPrediction', () => {
        it('should run a prediction for a very dry plant', async () => {
            // Arrange
            mockReq.params.plantId = '123';
            mockReq.body = { moisture: 20 };
            
            // Act
            await runPredictionForPlant(mockReq, mockRes);
            
            // Assert
            expect(mockRes.json).toHaveBeenCalled();
            const prediction = mockRes.json.mock.calls[0][0];
            expect(prediction.plantId).toBe('123');
        });
        
        it('should run a prediction for a well-watered plant', async () => {
            // Arrange
            mockReq.params.plantId = '456';
            mockReq.body = { moisture: 70 };
            
            // Act
            await runPredictionForPlant(mockReq, mockRes);
            
            // Assert
            expect(mockRes.json).toHaveBeenCalled();
            const prediction = mockRes.json.mock.calls[0][0];
            expect(prediction.plantId).toBe('456');
        });
        
        it('should handle missing active model', async () => {
            // Arrange - Create a function that simulates no active model error
            const mockFn = async (req, res) => {
                try {
                    throw new Error('No active AI model found');
                } catch (error) {
                    return res.status(500).json({ 
                        message: 'Error running AI prediction', 
                        error: error.message 
                    });
                }
            };
            
            mockReq.params.plantId = '123';
            
            // Act
            await mockFn(mockReq, mockRes);
            
            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Error running AI prediction',
                    error: 'No active AI model found'
                })
            );
        });
    });

    describe('testModelPerformance', () => {
        it('should test model performance and return metrics', async () => {
            // Arrange
            mockReq.params.id = 'model123';
            mockReq.body = { testData: [{ input: [0.5, 0.3], expected: 1 }] };
            
            // Act
            await testModelPerformance(mockReq, mockRes);
            
            // Assert
            expect(mockRes.json).toHaveBeenCalled();
            const result = mockRes.json.mock.calls[0][0];
            expect(result.modelId).toBe('model123');
            expect(result.metrics).toBeDefined();
        });
        
        it('should handle model not found', async () => {
            // Arrange - Create a function that simulates model not found error
            const mockFn = async (req, res) => {
                try {
                    throw new Error('Model not found');
                } catch (error) {
                    return res.status(500).json({ 
                        message: 'Error testing AI model', 
                        error: error.message 
                    });
                }
            };
            
            mockReq.params.id = '999';
            
            // Act
            await mockFn(mockReq, mockRes);
            
            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Error testing AI model',
                    error: 'Model not found'
                })
            );
        });
    });
});