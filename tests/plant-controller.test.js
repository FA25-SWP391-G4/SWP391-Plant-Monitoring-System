/**
 * Plant Controller Tests
 */
const { 
    getAllPlants,
    getPlantById,
    createPlant,
    updatePlant,
    deletePlant,
    getPlantHistory,
    getPlantHealthStatus
} = require('../__mocks__/plantController');

describe('Plant Controller Tests', () => {
    let mockRequest;
    let mockResponse;
    
    beforeEach(() => {
        // Mock request and response objects
        mockRequest = {
            params: {},
            body: {},
            user: {
                id: 'user123',
                email: 'test@example.com'
            }
        };
        
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });
    
    describe('UC3: Plant Management', () => {
        it('should get all plants for user', async () => {
            // Call the controller
            await getAllPlants(mockRequest, mockResponse);
            
            // Check if the response contains plants array
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.any(String),
                        name: expect.any(String),
                        species: expect.any(String)
                    })
                ])
            );
        });
        
        it('should get plant by ID', async () => {
            // Setup request params
            mockRequest.params = { id: 'plant123' };
            
            // Call the controller
            await getPlantById(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'plant123',
                    name: expect.any(String),
                    species: expect.any(String)
                })
            );
        });
        
        it('should create a new plant', async () => {
            // Setup request body
            mockRequest.body = {
                name: 'New Plant',
                species: 'Rose',
                location: 'Living Room',
                wateringFrequency: '3'
            };
            
            // Call the controller
            await createPlant(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: expect.any(String),
                    name: 'New Plant',
                    species: 'Rose'
                })
            );
        });
        
        it('should update a plant', async () => {
            // Setup request
            mockRequest.params = { id: 'plant123' };
            mockRequest.body = {
                name: 'Updated Plant',
                location: 'Bedroom'
            };
            
            // Call the controller
            await updatePlant(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'plant123',
                    name: 'Updated Plant',
                    location: 'Bedroom'
                })
            );
        });
        
        it('should delete a plant', async () => {
            // Setup request
            mockRequest.params = { id: 'plant123' };
            
            // Call the controller
            await deletePlant(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('deleted'),
                    id: 'plant123'
                })
            );
        });
    });
    
    describe('UC4: Plant Health Monitoring', () => {
        it('should get plant health status', async () => {
            // Setup request
            mockRequest.params = { id: 'plant123' };
            
            // Call the controller
            await getPlantHealthStatus(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    plantId: 'plant123',
                    status: expect.any(String),
                    lastUpdated: expect.any(String),
                    metrics: expect.objectContaining({
                        moisture: expect.any(Number),
                        temperature: expect.any(Number),
                        light: expect.any(Number)
                    })
                })
            );
        });
        
        it('should get plant history', async () => {
            // Setup request
            mockRequest.params = { id: 'plant123' };
            
            // Call the controller
            await getPlantHistory(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        date: expect.any(String),
                        moisture: expect.any(Number),
                        temperature: expect.any(Number),
                        light: expect.any(Number)
                    })
                ])
            );
        });
    });
});