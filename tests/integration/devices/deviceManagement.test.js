/**
 * DEVICE & IOT INTEGRATION TESTS
 * ===============================
 * 
 * Integration tests for UC5-UC8: Device Management, Sensor Data, MQTT, and Automation
 * Tests real MQTT communication and database interactions
 * 
 * Coverage:
 * - Device registration and management via API
 * - Real MQTT message publishing and receiving
 * - Sensor data ingestion pipeline
 * - Automated watering system
 * - Device health monitoring
 */

const request = require('supertest');
const app = require('../../../app');
const mqtt = require('mqtt');
const { Pool } = require('pg');

describe('Device & IoT Integration Tests', () => {
    let authToken;
    let testUserId;
    let testDeviceKey;
    let mqttClient;

    // Setup test database, authentication, and MQTT
    beforeAll(async () => {
        // Create test user and get auth token
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'devicetest@test.com',
                password: 'password123',
                firstName: 'Device',
                lastName: 'Tester'
            });

        authToken = registerResponse.body.token;
        testUserId = registerResponse.body.user.id;

        // Setup MQTT client for testing
        mqttClient = mqtt.connect(process.env.MQTT_URL || 'mqtt://localhost:1883', {
            clientId: 'integration-test-' + Math.random().toString(16).slice(3)
        });

        // Wait for MQTT connection
        await new Promise((resolve) => {
            mqttClient.on('connect', resolve);
        });
    });

    afterAll(async () => {
        // Clean up MQTT connection
        if (mqttClient) {
            mqttClient.end();
        }
    });

    describe('UC5: Device Management', () => {
        describe('POST /api/devices', () => {
            it('should register a new device', async () => {
                const deviceData = {
                    device_name: 'Integration Test Device',
                    device_type: 'sensor',
                    location: 'Test Lab'
                };

                const response = await request(app)
                    .post('/api/devices')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(deviceData);

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toMatchObject({
                    device_name: deviceData.device_name,
                    device_type: deviceData.device_type,
                    status: 'offline'
                });

                testDeviceKey = response.body.data.device_key;
            });

            it('should validate device registration data', async () => {
                const response = await request(app)
                    .post('/api/devices')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        // Missing device_name
                        device_type: 'sensor'
                    });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toContain('device_name');
            });

            it('should prevent duplicate device names', async () => {
                const deviceData = {
                    device_name: 'Duplicate Test Device',
                    device_type: 'sensor'
                };

                // First registration should succeed
                const firstResponse = await request(app)
                    .post('/api/devices')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(deviceData);

                expect(firstResponse.status).toBe(201);

                // Second registration with same name should fail
                const secondResponse = await request(app)
                    .post('/api/devices')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(deviceData);

                expect(secondResponse.status).toBe(409);
                expect(secondResponse.body.error).toContain('already exists');
            });
        });

        describe('GET /api/devices', () => {
            it('should retrieve user devices', async () => {
                const response = await request(app)
                    .get('/api/devices')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body.data.length).toBeGreaterThan(0);
            });

            it('should filter devices by status', async () => {
                const response = await request(app)
                    .get('/api/devices')
                    .set('Authorization', `Bearer ${authToken}`)
                    .query({ status: 'offline' });

                expect(response.status).toBe(200);
                expect(response.body.data.every(device => device.status === 'offline')).toBe(true);
            });

            it('should paginate device list', async () => {
                const response = await request(app)
                    .get('/api/devices')
                    .set('Authorization', `Bearer ${authToken}`)
                    .query({ 
                        limit: 5,
                        offset: 0
                    });

                expect(response.status).toBe(200);
                expect(response.body.data.length).toBeLessThanOrEqual(5);
            });
        });

        describe('GET /api/devices/:id', () => {
            it('should retrieve specific device details', async () => {
                const response = await request(app)
                    .get(`/api/devices/${testDeviceKey}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toMatchObject({
                    device_key: testDeviceKey,
                    device_name: 'Integration Test Device',
                    device_type: 'sensor'
                });
            });

            it('should return 404 for non-existent device', async () => {
                const fakeDeviceKey = '00000000-0000-0000-0000-000000000000';
                
                const response = await request(app)
                    .get(`/api/devices/${fakeDeviceKey}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        describe('PUT /api/devices/:id', () => {
            it('should update device information', async () => {
                const updateData = {
                    device_name: 'Updated Test Device',
                    location: 'Updated Location'
                };

                const response = await request(app)
                    .put(`/api/devices/${testDeviceKey}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toMatchObject({
                    device_name: updateData.device_name
                });
            });
        });
    });

    describe('UC6: Sensor Data Collection', () => {
        describe('POST /api/devices/:id/sensor-data', () => {
            it('should accept sensor data from device', async () => {
                const sensorData = {
                    timestamp: new Date().toISOString(),
                    soil_moisture: 75.5,
                    temperature: 23.2,
                    air_humidity: 65.8,
                    light_intensity: 850
                };

                const response = await request(app)
                    .post(`/api/devices/${testDeviceKey}/sensor-data`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(sensorData);

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toMatchObject({
                    device_key: testDeviceKey,
                    soil_moisture: sensorData.soil_moisture,
                    temperature: sensorData.temperature
                });
            });

            it('should validate sensor data ranges', async () => {
                const invalidSensorData = {
                    timestamp: new Date().toISOString(),
                    soil_moisture: 150, // Invalid range
                    temperature: 23.2,
                    air_humidity: -10, // Invalid range
                    light_intensity: 850
                };

                const response = await request(app)
                    .post(`/api/devices/${testDeviceKey}/sensor-data`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(invalidSensorData);

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('invalid range');
            });

            it('should update device last_seen when receiving data', async () => {
                const beforeTime = Date.now();
                
                const sensorData = {
                    timestamp: new Date().toISOString(),
                    soil_moisture: 80.0,
                    temperature: 24.0,
                    air_humidity: 70.0,
                    light_intensity: 900
                };

                await request(app)
                    .post(`/api/devices/${testDeviceKey}/sensor-data`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(sensorData);

                // Check if device last_seen was updated
                const deviceResponse = await request(app)
                    .get(`/api/devices/${testDeviceKey}`)
                    .set('Authorization', `Bearer ${authToken}`);

                const lastSeen = new Date(deviceResponse.body.data.last_seen);
                expect(lastSeen.getTime()).toBeGreaterThan(beforeTime);
            });
        });

        describe('GET /api/devices/:id/sensor-data', () => {
            it('should retrieve sensor data history', async () => {
                const response = await request(app)
                    .get(`/api/devices/${testDeviceKey}/sensor-data`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .query({
                        limit: 10,
                        period: '24h'
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
            });

            it('should filter data by date range', async () => {
                const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
                const endDate = new Date();

                const response = await request(app)
                    .get(`/api/devices/${testDeviceKey}/sensor-data`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .query({
                        start_date: startDate.toISOString(),
                        end_date: endDate.toISOString()
                    });

                expect(response.status).toBe(200);
                
                if (response.body.data.length > 0) {
                    response.body.data.forEach(reading => {
                        const timestamp = new Date(reading.timestamp);
                        expect(timestamp).toBeGreaterThanOrEqual(startDate);
                        expect(timestamp).toBeLessThanOrEqual(endDate);
                    });
                }
            });
        });

        describe('GET /api/devices/:id/sensor-stats', () => {
            it('should calculate sensor statistics', async () => {
                const response = await request(app)
                    .get(`/api/devices/${testDeviceKey}/sensor-stats`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .query({ period: '7d' });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                
                if (response.body.data && response.body.data.readings_count > 0) {
                    expect(response.body.data).toHaveProperty('moisture');
                    expect(response.body.data.moisture).toHaveProperty('avg');
                    expect(response.body.data.moisture).toHaveProperty('min');
                    expect(response.body.data.moisture).toHaveProperty('max');
                }
            });
        });
    });

    describe('UC7: MQTT Communication', () => {
        describe('MQTT Publishing', () => {
            it('should publish sensor data via MQTT', async () => {
                const sensorMessage = {
                    messageType: 'sensor',
                    deviceId: testDeviceKey,
                    timestamp: new Date().toISOString(),
                    soil_moisture: 78,
                    temperature: 25.1,
                    air_humidity: 68.5,
                    light_intensity: 920
                };

                // Subscribe to response topic to verify message processing
                const responseReceived = new Promise((resolve) => {
                    mqttClient.subscribe(`smartplant/${testDeviceKey}/response`, (err) => {
                        if (!err) {
                            mqttClient.on('message', (topic, message) => {
                                if (topic === `smartplant/${testDeviceKey}/response`) {
                                    const response = JSON.parse(message.toString());
                                    resolve(response);
                                }
                            });
                        }
                    });
                });

                // Publish sensor data
                mqttClient.publish('smartplant/pub', JSON.stringify(sensorMessage));

                // Wait for acknowledgment (with timeout)
                const response = await Promise.race([
                    responseReceived,
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Response timeout')), 5000)
                    )
                ]);

                expect(response).toMatchObject({
                    status: 'received',
                    messageType: 'sensor'
                });
            });

            it('should handle device status updates via MQTT', async () => {
                const statusMessage = {
                    messageType: 'status',
                    deviceId: testDeviceKey,
                    status: 'online',
                    battery_level: 85,
                    signal_strength: -45
                };

                mqttClient.publish(`smartplant/${testDeviceKey}/status`, JSON.stringify(statusMessage));

                // Wait a moment for message processing
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Verify device status was updated
                const deviceResponse = await request(app)
                    .get(`/api/devices/${testDeviceKey}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(deviceResponse.body.data.status).toBe('online');
            });
        });

        describe('MQTT Command Publishing', () => {
            it('should send pump control command via MQTT', async () => {
                // Subscribe to device command topic
                const commandReceived = new Promise((resolve) => {
                    mqttClient.subscribe(`smartplant/device/${testDeviceKey}/command`, (err) => {
                        if (!err) {
                            mqttClient.on('message', (topic, message) => {
                                if (topic === `smartplant/device/${testDeviceKey}/command`) {
                                    const command = JSON.parse(message.toString());
                                    resolve(command);
                                }
                            });
                        }
                    });
                });

                // Send pump command via API
                const response = await request(app)
                    .post(`/api/devices/${testDeviceKey}/command`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        command: 'water',
                        duration: 10
                    });

                expect(response.status).toBe(200);

                // Verify command was published to MQTT
                const receivedCommand = await Promise.race([
                    commandReceived,
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Command timeout')), 5000)
                    )
                ]);

                expect(receivedCommand).toMatchObject({
                    command: 'water',
                    duration: 10
                });
            });
        });
    });

    describe('UC8: Automation & Control', () => {
        describe('Automated Watering', () => {
            it('should trigger automatic watering when moisture is low', async () => {
                // First, create a plant associated with the device
                const plantResponse = await request(app)
                    .post('/api/plants')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        custom_name: 'Auto Water Test Plant',
                        device_key: testDeviceKey,
                        moisture_threshold: 70,
                        auto_watering_enabled: true
                    });

                const plantId = plantResponse.body.data.id;

                // Subscribe to pump commands
                const pumpCommandReceived = new Promise((resolve) => {
                    mqttClient.subscribe(`smartplant/device/${testDeviceKey}/command`, (err) => {
                        if (!err) {
                            mqttClient.on('message', (topic, message) => {
                                if (topic === `smartplant/device/${testDeviceKey}/command`) {
                                    const command = JSON.parse(message.toString());
                                    if (command.pump === 'ON') {
                                        resolve(command);
                                    }
                                }
                            });
                        }
                    });
                });

                // Send sensor data with low moisture
                const lowMoistureSensorData = {
                    messageType: 'sensor',
                    deviceId: testDeviceKey,
                    timestamp: new Date().toISOString(),
                    soil_moisture: 60, // Below threshold of 70
                    temperature: 25.0,
                    air_humidity: 65.0,
                    light_intensity: 800
                };

                mqttClient.publish('smartplant/pub', JSON.stringify(lowMoistureSensorData));

                // Wait for automatic pump command
                const pumpCommand = await Promise.race([
                    pumpCommandReceived,
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Auto watering timeout')), 10000)
                    )
                ]);

                expect(pumpCommand).toMatchObject({
                    pump: 'ON',
                    duration: expect.any(Number)
                });
            });

            it('should not trigger watering during cooldown period', async () => {
                // Water the plant manually first
                await request(app)
                    .post(`/api/devices/${testDeviceKey}/water`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ duration: 5 });

                // Wait a moment for watering to be recorded
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Send low moisture data immediately after watering
                const lowMoistureSensorData = {
                    messageType: 'sensor',
                    deviceId: testDeviceKey,
                    timestamp: new Date().toISOString(),
                    soil_moisture: 60,
                    temperature: 25.0,
                    air_humidity: 65.0,
                    light_intensity: 800
                };

                let pumpCommandReceived = false;
                mqttClient.subscribe(`smartplant/device/${testDeviceKey}/command`, (err) => {
                    if (!err) {
                        mqttClient.on('message', (topic, message) => {
                            if (topic === `smartplant/device/${testDeviceKey}/command`) {
                                const command = JSON.parse(message.toString());
                                if (command.pump === 'ON') {
                                    pumpCommandReceived = true;
                                }
                            }
                        });
                    }
                });

                mqttClient.publish('smartplant/pub', JSON.stringify(lowMoistureSensorData));

                // Wait to see if pump command is sent (it shouldn't be)
                await new Promise(resolve => setTimeout(resolve, 3000));

                expect(pumpCommandReceived).toBe(false);
            });
        });

        describe('Device Health Monitoring', () => {
            it('should detect and handle device offline status', async () => {
                // Simulate device going offline by not sending heartbeat
                const healthCheckResponse = await request(app)
                    .get('/api/admin/device-health')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(healthCheckResponse.status).toBe(200);
                
                // Check if any devices are marked as having issues
                if (healthCheckResponse.body.data && healthCheckResponse.body.data.length > 0) {
                    const deviceHealth = healthCheckResponse.body.data.find(
                        device => device.device_key === testDeviceKey
                    );
                    
                    if (deviceHealth) {
                        expect(deviceHealth).toHaveProperty('status');
                        expect(deviceHealth).toHaveProperty('last_seen');
                    }
                }
            });

            it('should handle device error status', async () => {
                const errorMessage = {
                    messageType: 'error',
                    deviceId: testDeviceKey,
                    error_code: 'SENSOR_FAIL',
                    error_message: 'Moisture sensor malfunction',
                    timestamp: new Date().toISOString()
                };

                mqttClient.publish(`smartplant/${testDeviceKey}/error`, JSON.stringify(errorMessage));

                // Wait for error processing
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Check if device status reflects the error
                const deviceResponse = await request(app)
                    .get(`/api/devices/${testDeviceKey}`)
                    .set('Authorization', `Bearer ${authToken}`);

                // The device should be marked with error status or have error logged
                expect(deviceResponse.status).toBe(200);
                // Additional assertions would depend on how errors are handled in the system
            });
        });

        describe('Safety and Security', () => {
            it('should validate device authentication for commands', async () => {
                const unauthorizedResponse = await request(app)
                    .post(`/api/devices/${testDeviceKey}/command`)
                    .send({
                        command: 'water',
                        duration: 10
                    });

                expect(unauthorizedResponse.status).toBe(401);
            });

            it('should limit pump operation duration', async () => {
                const response = await request(app)
                    .post(`/api/devices/${testDeviceKey}/command`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        command: 'water',
                        duration: 300 // 5 minutes - should be too long
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('duration');
            });

            it('should prevent concurrent watering operations', async () => {
                // Start first watering command
                const firstRequest = request(app)
                    .post(`/api/devices/${testDeviceKey}/command`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        command: 'water',
                        duration: 10
                    });

                // Immediately start second watering command
                const secondRequest = request(app)
                    .post(`/api/devices/${testDeviceKey}/command`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        command: 'water',
                        duration: 10
                    });

                const [firstResponse, secondResponse] = await Promise.all([
                    firstRequest,
                    secondRequest
                ]);

                // One should succeed, one should fail due to concurrent operation
                const responses = [firstResponse, secondResponse];
                const successCount = responses.filter(r => r.status === 200).length;
                const failureCount = responses.filter(r => r.status === 409).length;

                expect(successCount).toBe(1);
                expect(failureCount).toBe(1);
            });
        });
    });

    describe('Performance and Scalability', () => {
        it('should handle multiple concurrent sensor readings', async () => {
            const concurrentReadings = [];
            
            for (let i = 0; i < 10; i++) {
                const sensorData = {
                    timestamp: new Date().toISOString(),
                    soil_moisture: 70 + Math.random() * 20,
                    temperature: 20 + Math.random() * 10,
                    air_humidity: 50 + Math.random() * 30,
                    light_intensity: 500 + Math.random() * 500
                };

                concurrentReadings.push(
                    request(app)
                        .post(`/api/devices/${testDeviceKey}/sensor-data`)
                        .set('Authorization', `Bearer ${authToken}`)
                        .send(sensorData)
                );
            }

            const responses = await Promise.all(concurrentReadings);

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
            });
        });

        it('should respond within reasonable time limits', async () => {
            const startTime = Date.now();

            const response = await request(app)
                .get(`/api/devices/${testDeviceKey}/sensor-data`)
                .set('Authorization', `Bearer ${authToken}`)
                .query({ limit: 100 });

            const responseTime = Date.now() - startTime;

            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
        });
    });
});