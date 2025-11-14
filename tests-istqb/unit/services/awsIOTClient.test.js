const { connectAwsIoT, sendCommand, addMessageInterceptor, clearMessageInterceptors, getInterceptorCount } = require('./awsIOTClient');
const { mqtt } = require("aws-iot-device-sdk-v2");
const { pool } = require("../config/db");
const notificationService = require("./notificationService");

// Mock AWS IoT SDK
jest.mock("aws-iot-device-sdk-v2", () => ({
    mqtt: {
        MqttClient: jest.fn().mockImplementation(() => ({
            new_connection: jest.fn().mockReturnValue({
                on: jest.fn(),
                connect: jest.fn(),
                subscribe: jest.fn(),
                publish: jest.fn()
            })
        })),
        QoS: {
            AtLeastOnce: 1
        }
    },
    iot: {
        AwsIotMqttConnectionConfigBuilder: {
            new_mtls_builder_from_path: jest.fn().mockReturnValue({
                with_certificate_authority_from_path: jest.fn().mockReturnThis(),
                with_client_id: jest.fn().mockReturnThis(),
                with_endpoint: jest.fn().mockReturnThis(),
                build: jest.fn().mockReturnValue({})
            })
        }
    },
    io: {
        ClientBootstrap: jest.fn()
    }
}));

// Mock database
jest.mock("../config/db", () => ({
    pool: {
        query: jest.fn()
    }
}));

// Mock notification service
jest.mock("./notificationService", () => ({
    broadcastSensorUpdate: jest.fn()
}));

// Mock dotenv
jest.mock("dotenv", () => ({
    config: jest.fn()
}));

describe('AWS IoT Client', () => {
    let mockConnection;
    
    beforeEach(() => {
        jest.clearAllMocks();
        clearMessageInterceptors();
        
        const mockClient = new mqtt.MqttClient();
        mockConnection = mockClient.new_connection();
    });

    describe('connectAwsIoT', () => {
        it('should connect successfully', async () => {
            mockConnection.connect.mockResolvedValue();
            
            const result = await connectAwsIoT();
            
            expect(mockConnection.connect).toHaveBeenCalled();
            expect(result).toBe(mockConnection);
        });

        it('should throw error on connection failure', async () => {
            const error = new Error('Connection failed');
            mockConnection.connect.mockRejectedValue(error);
            
            await expect(connectAwsIoT()).rejects.toThrow('Connection failed');
        });
    });

    describe('sendCommand', () => {
        it('should publish command to MQTT topic', async () => {
            const command = 'on';
            mockConnection.publish.mockResolvedValue();
            
            await sendCommand(command);
            
            expect(mockConnection.publish).toHaveBeenCalledWith(
                "smartplant/sub",
                JSON.stringify({ pump: command }),
                1
            );
        });
    });

    describe('Message Interceptors', () => {
        it('should add message interceptor and return unsubscribe function', () => {
            const interceptor = jest.fn();
            
            const unsubscribe = addMessageInterceptor(interceptor);
            
            expect(getInterceptorCount()).toBe(1);
            expect(typeof unsubscribe).toBe('function');
            
            unsubscribe();
            expect(getInterceptorCount()).toBe(0);
        });

        it('should clear all message interceptors', () => {
            const interceptor1 = jest.fn();
            const interceptor2 = jest.fn();
            
            addMessageInterceptor(interceptor1);
            addMessageInterceptor(interceptor2);
            
            expect(getInterceptorCount()).toBe(2);
            
            clearMessageInterceptors();
            expect(getInterceptorCount()).toBe(0);
        });

        it('should return correct interceptor count', () => {
            expect(getInterceptorCount()).toBe(0);
            
            addMessageInterceptor(jest.fn());
            expect(getInterceptorCount()).toBe(1);
            
            addMessageInterceptor(jest.fn());
            expect(getInterceptorCount()).toBe(2);
        });
    });

    describe('Message Handling', () => {
        let handleIncomingMessage;

        beforeEach(() => {
            // Setup connection event handler
            const connectHandler = mockConnection.on.mock.calls.find(
                call => call[0] === 'connect'
            );
            
            if (connectHandler) {
                // Execute connect handler to setup subscriptions
                connectHandler[1]();
                
                // Get the message handler from subscribe calls
                const subscribeCall = mockConnection.subscribe.mock.calls[0];
                if (subscribeCall) {
                    handleIncomingMessage = subscribeCall[2];
                }
            }
        });

        it('should handle sensor data with deviceId in payload', async () => {
            const topic = 'smartplant/pub';
            const payload = new TextEncoder().encode(JSON.stringify({
                deviceId: 'test-device-123',
                soil_moisture: 45,
                temperature: 25.5,
                air_humidity: 60,
                light_intensity: 800,
                timestamp: '2023-01-01T12:00:00Z'
            }));

            pool.query.mockResolvedValueOnce({ rows: [{ plant_id: 1 }] });
            pool.query.mockResolvedValueOnce({});

            await handleIncomingMessage(topic, payload);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT plant_id FROM plants WHERE device_key = $1',
                ['test-device-123']
            );
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO sensors_data'),
                expect.arrayContaining(['test-device-123', 1])
            );
        });

        it('should extract deviceId from topic when not in payload', async () => {
            const topic = 'smartplant/device/esp32-001/response';
            const payload = new TextEncoder().encode(JSON.stringify({
                soil_moisture: 30,
                temperature: 22
            }));

            pool.query.mockResolvedValueOnce({ rows: [] });
            pool.query.mockResolvedValueOnce({});

            await handleIncomingMessage(topic, payload);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT plant_id FROM plants WHERE device_key = $1',
                ['esp32-001']
            );
        });

        it('should handle missing deviceId by logging warning', async () => {
            const topic = 'smartplant/pub';
            const payload = new TextEncoder().encode(JSON.stringify({
                soil_moisture: 30
            }));

            pool.query.mockResolvedValueOnce({});

            await handleIncomingMessage(topic, payload);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO system_logs'),
                ["warn", "awsIotClient", expect.any(String)]
            );
        });

        it('should notify message interceptors', async () => {
            const interceptor = jest.fn();
            addMessageInterceptor(interceptor);

            const topic = 'smartplant/pub';
            const payload = new TextEncoder().encode(JSON.stringify({
                deviceId: 'test-device',
                soil_moisture: 40
            }));

            pool.query.mockResolvedValueOnce({ rows: [] });
            pool.query.mockResolvedValueOnce({});

            await handleIncomingMessage(topic, payload);

            expect(interceptor).toHaveBeenCalledWith(
                expect.objectContaining({
                    deviceId: 'test-device',
                    soil_moisture: 40,
                    topic
                })
            );
        });

        it('should broadcast sensor update via notification service', async () => {
            const topic = 'smartplant/pub';
            const payload = new TextEncoder().encode(JSON.stringify({
                deviceId: 'test-device',
                temperature: 25
            }));

            pool.query.mockResolvedValueOnce({ rows: [] });
            pool.query.mockResolvedValueOnce({});

            await handleIncomingMessage(topic, payload);

            expect(notificationService.broadcastSensorUpdate).toHaveBeenCalledWith(
                'test-device',
                expect.objectContaining({
                    deviceId: 'test-device',
                    temperature: 25
                })
            );
        });

        it('should handle database errors gracefully', async () => {
            const topic = 'smartplant/pub';
            const payload = new TextEncoder().encode(JSON.stringify({
                deviceId: 'test-device'
            }));

            pool.query.mockRejectedValue(new Error('Database error'));

            // Should not throw
            await expect(handleIncomingMessage(topic, payload)).resolves.toBeUndefined();
        });

        it('should handle notification service errors gracefully', async () => {
            const topic = 'smartplant/pub';
            const payload = new TextEncoder().encode(JSON.stringify({
                deviceId: 'test-device'
            }));

            pool.query.mockResolvedValueOnce({ rows: [] });
            pool.query.mockResolvedValueOnce({});
            notificationService.broadcastSensorUpdate.mockImplementation(() => {
                throw new Error('Notification error');
            });

            // Should not throw
            await expect(handleIncomingMessage(topic, payload)).resolves.toBeUndefined();
        });

        it('should handle interceptor errors gracefully', async () => {
            const faultyInterceptor = jest.fn().mockImplementation(() => {
                throw new Error('Interceptor error');
            });
            addMessageInterceptor(faultyInterceptor);

            const topic = 'smartplant/pub';
            const payload = new TextEncoder().encode(JSON.stringify({
                deviceId: 'test-device'
            }));

            pool.query.mockResolvedValueOnce({ rows: [] });
            pool.query.mockResolvedValueOnce({});

            // Should not throw
            await expect(handleIncomingMessage(topic, payload)).resolves.toBeUndefined();
            expect(faultyInterceptor).toHaveBeenCalled();
        });
    });
});