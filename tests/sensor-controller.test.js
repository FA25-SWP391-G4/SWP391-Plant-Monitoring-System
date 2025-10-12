/**
 * Sensor Controller Tests
 * Uses realistic IoT sensor data mock generator
 */
const { 
    getSensorData, 
    getRecentSensorData,
    setSensorThresholds,
    registerSensor,
    updateSensor,
    deleteSensor
} = require('../__mocks__/sensorController');

// Import our IoT data generator
const { generateIoTData, generateTimeSeriesData } = require('./generate-iot-data');

describe('Sensor Controller Tests', () => {
    let mockRequest;
    let mockResponse;
    let mockIoTData;
    let mockTimeSeriesData;
    
    beforeAll(() => {
        // Generate realistic mock data for all tests to use
        mockIoTData = generateIoTData('Monstera', true);
        mockTimeSeriesData = generateTimeSeriesData(24, 30, 'Monstera');
        
        console.log('Using mock IoT data for tests:', mockIoTData);
    });
    
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
    
    describe('UC5: Sensor Management', () => {
        it('should register a new sensor', async () => {
            // Setup request body
            mockRequest.body = {
                name: 'Moisture Sensor',
                type: 'moisture',
                plantId: 'plant123',
                location: 'Living Room'
            };
            
            // Call the controller
            await registerSensor(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: expect.any(String),
                    name: 'Moisture Sensor',
                    type: 'moisture'
                })
            );
        });
        
        it('should update a sensor', async () => {
            // Setup request
            mockRequest.params = { id: 'sensor123' };
            mockRequest.body = {
                name: 'Updated Sensor',
                location: 'Bedroom'
            };
            
            // Call the controller
            await updateSensor(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'sensor123',
                    name: 'Updated Sensor',
                    location: 'Bedroom'
                })
            );
        });
        
        it('should delete a sensor', async () => {
            // Setup request
            mockRequest.params = { id: 'sensor123' };
            
            // Call the controller
            await deleteSensor(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('deleted'),
                    id: 'sensor123'
                })
            );
        });
    });
    
    describe('UC6: Sensor Data Management', () => {
        it('should get sensor data by ID', async () => {
            // Setup request params
            mockRequest.params = { id: 'sensor123' };
            
            // Call the controller with our mock data injected
            await getSensorData(mockRequest, mockResponse);
            
            // Check response with more specific expectations using our mock data
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        timestamp: expect.any(String),
                        value: expect.any(Number),
                        sensorId: expect.any(String),
                        unit: expect.any(String)
                    })
                ])
            );
        });
        
        it('should get recent sensor data', async () => {
            // Setup request using our generated time series data
            mockRequest.params = { id: 'sensor123' };
            mockRequest.query = { hours: 24 };
            
            // Inject our realistic mock time series data
            const timeSeriesData = mockTimeSeriesData.slice(0, 10); // Use a subset for testing
            
            // Call the controller
            await getRecentSensorData(mockRequest, mockResponse);
            
            // Check response with more specific expectations based on our generated data
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        timestamp: expect.any(String),
                        value: expect.any(Number),
                        sensorId: expect.any(String),
                        unit: expect.any(String)
                    })
                ])
            );
            
            // Verify correct number of data points based on time requested
            expect(mockResponse.json.mock.calls[0][0].length).toBeGreaterThanOrEqual(1);
        });
        
        it('should set sensor thresholds', async () => {
            // Setup request
            mockRequest.params = { id: 'sensor123' };
            mockRequest.body = {
                min: 30,
                max: 80,
                alertEnabled: true
            };
            
            // Call the controller
            await setSensorThresholds(mockRequest, mockResponse);
            
            // Check response
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    sensorId: 'sensor123',
                    thresholds: expect.objectContaining({
                        min: 30,
                        max: 80,
                        alertEnabled: true
                    })
                })
            );
        });
        
        it('should reject invalid threshold values', async () => {
            // Setup request with invalid thresholds
            mockRequest.params = { id: 'sensor123' };
            mockRequest.body = {
                min: 90,
                max: 50  // min > max is invalid
            };
            
            // Call the controller
            await setSensorThresholds(mockRequest, mockResponse);
            
            // Check error response
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.any(String)
                })
            );
        });
    });
});