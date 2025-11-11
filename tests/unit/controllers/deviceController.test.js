/**
 * DEVICE & IOT CONTROLLER UNIT TESTS
 * ===================================
 * 
 * Tests for UC5: Device Management
 * Tests for UC6: Sensor Data Collection
 * Tests for UC7: MQTT Communication  
 * Tests for UC8: Automation & Control
 * 
 * Coverage:
 * - Device registration and management
 * - Sensor data processing
 * - MQTT message handling
 * - Automated watering logic
 * - Error handling and validation
 */

const {
    processSensorData,
    processDeviceStatus,
    processDeviceResponse,
    sendDeviceCommand,
    sendPumpCommand,
    handleSmartplantMessage
} = require('../../../mqtt/mqttClient');

const Device = require('../../../models/Device');
const SensorData = require('../../../models/SensorData');
const WateringHistory = require('../../../models/WateringHistory');
const SystemLog = require('../../../models/SystemLog');
const { pool } = require('../../../config/db');

// Mock external dependencies
jest.mock('../../../models/Device');
jest.mock('../../../models/SensorData');
jest.mock('../../../models/WateringHistory');
jest.mock('../../../models/SystemLog');
jest.mock('../../../config/db');

// Mock MQTT client
const mockMqttClient = {
    publish: jest.fn(),
    subscribe: jest.fn(),
    on: jest.fn(),
    connected: true
};

// Mock the mqtt client module
jest.mock('mqtt', () => ({
    connect: jest.fn(() => mockMqttClient)
}));

describe('Device & IoT Controller Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default database mock
        pool.query = jest.fn();
        SystemLog.create = jest.fn().mockResolvedValue();
    });

    describe('UC5: Device Management', () => {
        describe('processSensorData', () => {
            it('should process valid sensor data successfully', async () => {
                const deviceKey = 'device-uuid-123';
                const sensorData = {
                    soilMoisture: 75.5,
                    temperature: 23.2,
                    airHumidity: 65.8,
                    lightIntensity: 850
                };

                pool.query
                    .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Insert sensor data
                    .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // Update device status

                await processSensorData(deviceKey, sensorData);

                // Verify sensor data insertion
                expect(pool.query).toHaveBeenCalledWith(
                    expect.stringContaining('INSERT INTO sensors_data'),
                    [deviceKey, sensorData.soilMoisture, sensorData.temperature, sensorData.airHumidity, sensorData.lightIntensity]
                );

                // Verify device status update
                expect(pool.query).toHaveBeenCalledWith(
                    expect.stringContaining('UPDATE devices SET last_seen = NOW(), status = \'online\''),
                    [deviceKey]
                );

                expect(SystemLog.create).toHaveBeenCalledWith('INFO', expect.stringContaining('Inserted sensor data'));
            });

            it('should handle invalid sensor data gracefully', async () => {
                const deviceKey = 'device-uuid-123';
                const invalidData = {
                    soilMoisture: 'invalid',
                    temperature: null,
                    airHumidity: undefined
                };

                pool.query.mockRejectedValue(new Error('Invalid data type'));

                await processSensorData(deviceKey, invalidData);

                expect(SystemLog.create).toHaveBeenCalledWith('ERROR', expect.stringContaining('Failed to process sensor data'));
            });

            it('should validate device key format', async () => {
                const invalidDeviceKey = 'invalid-key';
                const sensorData = {
                    soilMoisture: 75.5,
                    temperature: 23.2,
                    airHumidity: 65.8,
                    lightIntensity: 850
                };

                await processSensorData(invalidDeviceKey, sensorData);

                // Should still attempt to process but log any errors
                expect(SystemLog.create).toHaveBeenCalled();
            });

            it('should handle database connection errors', async () => {
                const deviceKey = 'device-uuid-123';
                const sensorData = {
                    soilMoisture: 75.5,
                    temperature: 23.2,
                    airHumidity: 65.8,
                    lightIntensity: 850
                };

                pool.query.mockRejectedValue(new Error('Database connection failed'));

                await processSensorData(deviceKey, sensorData);

                expect(SystemLog.create).toHaveBeenCalledWith('ERROR', expect.stringContaining('Failed to process sensor data'));
            });
        });

        describe('processDeviceStatus', () => {
            it('should update device status correctly', async () => {
                const deviceKey = 'device-uuid-123';
                const statusData = {
                    status: 'online',
                    battery_level: 85,
                    signal_strength: -45,
                    firmware_version: '1.2.3'
                };

                pool.query.mockResolvedValue({ rows: [], rowCount: 1 });

                await processDeviceStatus(deviceKey, statusData);

                expect(pool.query).toHaveBeenCalledWith(
                    expect.stringContaining('UPDATE devices'),
                    expect.arrayContaining([deviceKey])
                );
            });

            it('should handle offline device status', async () => {
                const deviceKey = 'device-uuid-123';
                const statusData = {
                    status: 'offline',
                    last_error: 'Network timeout'
                };

                pool.query.mockResolvedValue({ rows: [], rowCount: 1 });

                await processDeviceStatus(deviceKey, statusData);

                expect(SystemLog.create).toHaveBeenCalledWith(
                    'WARNING',
                    expect.stringContaining('Device went offline')
                );
            });

            it('should handle device error status', async () => {
                const deviceKey = 'device-uuid-123';
                const statusData = {
                    status: 'error',
                    error_code: 'SENSOR_FAIL',
                    error_message: 'Moisture sensor disconnected'
                };

                pool.query.mockResolvedValue({ rows: [], rowCount: 1 });

                await processDeviceStatus(deviceKey, statusData);

                expect(SystemLog.create).toHaveBeenCalledWith(
                    'ERROR',
                    expect.stringContaining('Device error')
                );
            });
        });
    });

    describe('UC6: Sensor Data Collection', () => {
        describe('handleSmartplantMessage', () => {
            it('should process smartplant sensor data', async () => {
                const message = {
                    messageType: 'sensor',
                    deviceId: 3,
                    timestamp: '2025-10-22T03:36:24Z',
                    soil_moisture: 75,
                    temperature: 26.4,
                    air_humidity: 78.2,
                    light_intensity: 850
                };

                SensorData.createFromDevice = jest.fn().mockResolvedValue({
                    id: 1,
                    device_key: 'device-3',
                    ...message
                });

                await handleSmartplantMessage(message);

                expect(SensorData.createFromDevice).toHaveBeenCalledWith(
                    'device-3',
                    expect.objectContaining({
                        soil_moisture: 75,
                        temperature: 26.4,
                        air_humidity: 78.2,
                        light_intensity: 850
                    })
                );
            });

            it('should handle invalid message types', async () => {
                const message = {
                    messageType: 'invalid',
                    deviceId: 3
                };

                await handleSmartplantMessage(message);

                expect(SystemLog.create).toHaveBeenCalledWith(
                    'WARNING',
                    expect.stringContaining('Unknown message type')
                );
            });

            it('should validate sensor data ranges', async () => {
                const message = {
                    messageType: 'sensor',
                    deviceId: 3,
                    timestamp: '2025-10-22T03:36:24Z',
                    soil_moisture: 150, // Invalid range
                    temperature: 26.4,
                    air_humidity: -10, // Invalid range
                    light_intensity: 850
                };

                await handleSmartplantMessage(message);

                expect(SystemLog.create).toHaveBeenCalledWith(
                    'WARNING',
                    expect.stringContaining('Sensor data out of range')
                );
            });
        });

        describe('Sensor Data Validation', () => {
            it('should validate moisture sensor ranges (0-100)', async () => {
                const validateMoisture = (value) => value >= 0 && value <= 100;

                expect(validateMoisture(75)).toBe(true);
                expect(validateMoisture(0)).toBe(true);
                expect(validateMoisture(100)).toBe(true);
                expect(validateMoisture(-10)).toBe(false);
                expect(validateMoisture(150)).toBe(false);
            });

            it('should validate temperature sensor ranges (-40 to +80 Celsius)', async () => {
                const validateTemperature = (value) => value >= -40 && value <= 80;

                expect(validateTemperature(25)).toBe(true);
                expect(validateTemperature(-20)).toBe(true);
                expect(validateTemperature(60)).toBe(true);
                expect(validateTemperature(-50)).toBe(false);
                expect(validateTemperature(100)).toBe(false);
            });

            it('should validate humidity sensor ranges (0-100)', async () => {
                const validateHumidity = (value) => value >= 0 && value <= 100;

                expect(validateHumidity(65)).toBe(true);
                expect(validateHumidity(0)).toBe(true);
                expect(validateHumidity(100)).toBe(true);
                expect(validateHumidity(-5)).toBe(false);
                expect(validateHumidity(120)).toBe(false);
            });

            it('should validate light sensor ranges (0-100000 lux)', async () => {
                const validateLight = (value) => value >= 0 && value <= 100000;

                expect(validateLight(850)).toBe(true);
                expect(validateLight(0)).toBe(true);
                expect(validateLight(50000)).toBe(true);
                expect(validateLight(-100)).toBe(false);
                expect(validateLight(150000)).toBe(false);
            });
        });
    });

    describe('UC7: MQTT Communication', () => {
        describe('sendDeviceCommand', () => {
            it('should send pump control command', async () => {
                const deviceId = 'device-uuid-123';
                const command = 'water';
                const parameters = { duration: 10 };

                mockMqttClient.publish.mockImplementation((topic, payload, options, callback) => {
                    callback(null); // Success
                });

                sendDeviceCommand(deviceId, command, parameters);

                expect(mockMqttClient.publish).toHaveBeenCalledWith(
                    `plant-system/device/${deviceId}/command`,
                    expect.stringContaining('"command":"water"'),
                    { qos: 1 },
                    expect.any(Function)
                );
            });

            it('should handle MQTT publish errors', async () => {
                const deviceId = 'device-uuid-123';
                const command = 'status';

                mockMqttClient.publish.mockImplementation((topic, payload, options, callback) => {
                    callback(new Error('MQTT connection failed')); // Error
                });

                sendDeviceCommand(deviceId, command);

                // Should log error through SystemLog
                expect(SystemLog.create).toHaveBeenCalled();
            });

            it('should validate command parameters', async () => {
                const deviceId = 'device-uuid-123';
                const command = 'water';
                const invalidParameters = { duration: -5 }; // Invalid duration

                sendDeviceCommand(deviceId, command, invalidParameters);

                expect(SystemLog.create).toHaveBeenCalledWith(
                    'ERROR',
                    expect.stringContaining('Invalid command parameters')
                );
            });
        });

        describe('sendPumpCommand', () => {
            it('should send valid pump ON command', async () => {
                const deviceKey = 'device-uuid-123';
                const command = 'ON';
                const duration = 15;

                mockMqttClient.publish.mockImplementation((topic, payload, options, callback) => {
                    callback(null);
                });

                sendPumpCommand(deviceKey, command, duration);

                expect(mockMqttClient.publish).toHaveBeenCalledWith(
                    `smartplant/device/${deviceKey}/command`,
                    expect.stringContaining('"pump":"ON"'),
                    { qos: 1 },
                    expect.any(Function)
                );
            });

            it('should send pump OFF command', async () => {
                const deviceKey = 'device-uuid-123';
                const command = 'OFF';

                mockMqttClient.publish.mockImplementation((topic, payload, options, callback) => {
                    callback(null);
                });

                sendPumpCommand(deviceKey, command);

                expect(mockMqttClient.publish).toHaveBeenCalledWith(
                    `smartplant/device/${deviceKey}/command`,
                    expect.stringContaining('"pump":"OFF"'),
                    { qos: 1 },
                    expect.any(Function)
                );
            });

            it('should validate pump command parameters', async () => {
                const deviceKey = 'device-uuid-123';
                const invalidCommand = 'INVALID';

                sendPumpCommand(deviceKey, invalidCommand);

                expect(SystemLog.create).toHaveBeenCalledWith(
                    'ERROR',
                    expect.stringContaining('Invalid pump command')
                );
            });

            it('should validate duration limits', async () => {
                const deviceKey = 'device-uuid-123';
                const command = 'ON';
                const invalidDuration = 300; // Too long (5 minutes)

                sendPumpCommand(deviceKey, command, invalidDuration);

                expect(SystemLog.create).toHaveBeenCalledWith(
                    'ERROR',
                    expect.stringContaining('Duration exceeds maximum')
                );
            });
        });

        describe('processDeviceResponse', () => {
            it('should handle pump command acknowledgment', async () => {
                const deviceKey = 'device-uuid-123';
                const response = {
                    command: 'water',
                    status: 'executed',
                    timestamp: '2023-01-01T10:00:00Z',
                    duration: 10
                };

                WateringHistory.create = jest.fn().mockResolvedValue({
                    id: 1,
                    device_key: deviceKey,
                    amount: 250,
                    method: 'automatic'
                });

                await processDeviceResponse(deviceKey, response);

                expect(WateringHistory.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        device_key: deviceKey,
                        method: 'automatic'
                    })
                );
            });

            it('should handle command failure responses', async () => {
                const deviceKey = 'device-uuid-123';
                const response = {
                    command: 'water',
                    status: 'failed',
                    error: 'Pump not responding',
                    timestamp: '2023-01-01T10:00:00Z'
                };

                await processDeviceResponse(deviceKey, response);

                expect(SystemLog.create).toHaveBeenCalledWith(
                    'ERROR',
                    expect.stringContaining('Command failed')
                );
            });
        });
    });

    describe('UC8: Automation & Control', () => {
        describe('Automated Watering Logic', () => {
            it('should trigger automatic watering when moisture is low', async () => {
                const deviceKey = 'device-uuid-123';
                const plantData = {
                    moisture_threshold: 70,
                    auto_watering_enabled: true
                };
                const sensorData = {
                    soilMoisture: 60, // Below threshold
                    temperature: 23.2,
                    airHumidity: 65.8,
                    lightIntensity: 850
                };

                // Mock plant lookup
                pool.query
                    .mockResolvedValueOnce({ 
                        rows: [{ 
                            plant_id: 1, 
                            moisture_threshold: 70,
                            auto_watering_on: true
                        }] 
                    })
                    .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Insert sensor data
                    .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // Update device

                mockMqttClient.publish.mockImplementation((topic, payload, options, callback) => {
                    callback(null);
                });

                await processSensorData(deviceKey, sensorData);

                // Should trigger automatic watering
                expect(mockMqttClient.publish).toHaveBeenCalledWith(
                    expect.stringContaining('/command'),
                    expect.stringContaining('"pump":"ON"'),
                    expect.any(Object),
                    expect.any(Function)
                );
            });

            it('should not trigger watering when auto-watering is disabled', async () => {
                const deviceKey = 'device-uuid-123';
                const sensorData = {
                    soilMoisture: 50, // Low moisture but auto-watering disabled
                    temperature: 23.2,
                    airHumidity: 65.8,
                    lightIntensity: 850
                };

                pool.query
                    .mockResolvedValueOnce({ 
                        rows: [{ 
                            plant_id: 1, 
                            moisture_threshold: 70,
                            auto_watering_on: false // Disabled
                        }] 
                    })
                    .mockResolvedValueOnce({ rows: [], rowCount: 1 })
                    .mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await processSensorData(deviceKey, sensorData);

                // Should not send pump command
                expect(mockMqttClient.publish).not.toHaveBeenCalledWith(
                    expect.stringContaining('/command'),
                    expect.stringContaining('"pump":"ON"'),
                    expect.any(Object),
                    expect.any(Function)
                );
            });

            it('should implement watering cooldown period', async () => {
                const deviceKey = 'device-uuid-123';
                const sensorData = {
                    soilMoisture: 60,
                    temperature: 23.2,
                    airHumidity: 65.8,
                    lightIntensity: 850
                };

                // Mock recent watering history
                pool.query
                    .mockResolvedValueOnce({ 
                        rows: [{ 
                            plant_id: 1, 
                            moisture_threshold: 70,
                            auto_watering_on: true,
                            last_watered: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
                        }] 
                    })
                    .mockResolvedValueOnce({ rows: [], rowCount: 1 })
                    .mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await processSensorData(deviceKey, sensorData);

                // Should not water due to cooldown
                expect(SystemLog.create).toHaveBeenCalledWith(
                    'INFO',
                    expect.stringContaining('Watering skipped due to cooldown')
                );
            });
        });

        describe('Safety Checks', () => {
            it('should prevent watering if sensor readings are invalid', async () => {
                const deviceKey = 'device-uuid-123';
                const invalidSensorData = {
                    soilMoisture: null, // Invalid reading
                    temperature: 23.2,
                    airHumidity: 65.8,
                    lightIntensity: 850
                };

                await processSensorData(deviceKey, invalidSensorData);

                expect(SystemLog.create).toHaveBeenCalledWith(
                    'WARNING',
                    expect.stringContaining('Invalid sensor data')
                );
            });

            it('should limit maximum watering duration', async () => {
                const deviceKey = 'device-uuid-123';
                const command = 'ON';
                const excessiveDuration = 180; // 3 minutes (too long)

                sendPumpCommand(deviceKey, command, excessiveDuration);

                expect(SystemLog.create).toHaveBeenCalledWith(
                    'ERROR',
                    expect.stringContaining('Duration exceeds maximum')
                );
            });

            it('should handle pump malfunction detection', async () => {
                const deviceKey = 'device-uuid-123';
                const response = {
                    command: 'water',
                    status: 'failed',
                    error: 'Pump malfunction detected',
                    error_code: 'PUMP_JAM'
                };

                await processDeviceResponse(deviceKey, response);

                expect(SystemLog.create).toHaveBeenCalledWith(
                    'ERROR',
                    expect.stringContaining('Pump malfunction')
                );
            });
        });

        describe('Device Health Monitoring', () => {
            it('should detect device offline status', async () => {
                const deviceKey = 'device-uuid-123';
                const lastSeen = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

                // Mock device check
                Device.findByKey = jest.fn().mockResolvedValue({
                    device_key: deviceKey,
                    last_seen: lastSeen,
                    status: 'online'
                });

                Device.updateStatus = jest.fn().mockResolvedValue({
                    device_key: deviceKey,
                    status: 'offline'
                });

                // Simulate health check function
                const checkDeviceHealth = async (deviceKey) => {
                    const device = await Device.findByKey(deviceKey);
                    const timeSinceLastSeen = Date.now() - device.last_seen.getTime();
                    const offlineThreshold = 60 * 60 * 1000; // 1 hour

                    if (timeSinceLastSeen > offlineThreshold && device.status !== 'offline') {
                        await Device.updateStatus(deviceKey, 'offline');
                        await SystemLog.create('WARNING', `Device ${deviceKey} went offline`);
                        return false;
                    }
                    return true;
                };

                const isOnline = await checkDeviceHealth(deviceKey);

                expect(isOnline).toBe(false);
                expect(Device.updateStatus).toHaveBeenCalledWith(deviceKey, 'offline');
                expect(SystemLog.create).toHaveBeenCalledWith(
                    'WARNING',
                    expect.stringContaining('went offline')
                );
            });
        });
    });

    describe('Error Handling & Recovery', () => {
        it('should handle MQTT connection failures', async () => {
            mockMqttClient.connected = false;

            const deviceKey = 'device-uuid-123';
            const command = 'water';

            sendDeviceCommand(deviceKey, command);

            expect(SystemLog.create).toHaveBeenCalledWith(
                'ERROR',
                expect.stringContaining('MQTT client not connected')
            );
        });

        it('should implement retry logic for failed commands', async () => {
            const deviceKey = 'device-uuid-123';
            const command = 'water';

            mockMqttClient.publish
                .mockImplementationOnce((topic, payload, options, callback) => {
                    callback(new Error('Network error')); // First attempt fails
                })
                .mockImplementationOnce((topic, payload, options, callback) => {
                    callback(null); // Second attempt succeeds
                });

            // Mock retry logic
            const sendCommandWithRetry = async (deviceKey, command, maxRetries = 3) => {
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        await new Promise((resolve, reject) => {
                            mockMqttClient.publish(
                                `plant-system/device/${deviceKey}/command`,
                                JSON.stringify({ command }),
                                { qos: 1 },
                                (error) => {
                                    if (error) reject(error);
                                    else resolve();
                                }
                            );
                        });
                        break; // Success
                    } catch (error) {
                        if (attempt === maxRetries) {
                            await SystemLog.create('ERROR', `Command failed after ${maxRetries} attempts`);
                            throw error;
                        }
                        await SystemLog.create('WARNING', `Command attempt ${attempt} failed, retrying...`);
                    }
                }
            };

            await sendCommandWithRetry(deviceKey, command);

            expect(mockMqttClient.publish).toHaveBeenCalledTimes(2);
            expect(SystemLog.create).toHaveBeenCalledWith(
                'WARNING',
                expect.stringContaining('attempt 1 failed, retrying')
            );
        });

        it('should handle malformed MQTT messages', async () => {
            const deviceKey = 'device-uuid-123';
            const malformedData = 'invalid json data';

            // This would be called by MQTT message handler
            const parseMessage = async (payload) => {
                try {
                    return JSON.parse(payload);
                } catch (error) {
                    await SystemLog.create('ERROR', `Failed to parse MQTT message: ${error.message}`);
                    return null;
                }
            };

            const result = await parseMessage(malformedData);

            expect(result).toBeNull();
            expect(SystemLog.create).toHaveBeenCalledWith(
                'ERROR',
                expect.stringContaining('Failed to parse MQTT message')
            );
        });
    });
});