/**
 * MQTT Client for Plant Monitoring System
 * Handles both local MQTT broker and AWS IoT connectivity
 */

const mqtt = require('mqtt');
const fs = require('fs');
const dotenv = require('dotenv');
const SystemLog = require('../models/SystemLog');
const db = require('../config/db');

dotenv.config();

const pendingCommands = new Map(); // key: commandId, value: { resolve, reject, timeout }

const DEFAULT_COMMAND_TIMEOUT_MS = 20000;

// Determine which MQTT connection to use
const USE_AWS_IOT = process.env.USE_AWS_IOT === 'true';
let client = null;
let isClientConnected = false;

if (USE_AWS_IOT) {
  // AWS IoT connection
  const awsIot = require('aws-iot-device-sdk');
  
  client = awsIot.device({
    keyPath: process.env.AWS_PRIVATE_KEY_PATH,
    certPath: process.env.AWS_CERT_PATH,
    caPath: process.env.AWS_ROOT_CA_PATH,
    clientId: 'ESP32_SmartPlant_Server' + Math.random().toString(16).slice(3),
    host: process.env.AWS_IOT_ENDPOINT
  });
} else {
  // Local or cloud MQTT broker connection
  const mqttUrl = process.env.MQTT_URL;
  
  client = mqtt.connect(mqttUrl, {
    clientId: 'ESP32_SmartPlant_Server' + Math.random().toString(16).slice(3),
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000
  });
}

// Attach packet-level debug for mqtt.js (harmless if client doesn't emit)
try {
  client.on && client.on('packetsend', (packet) => {
    if (packet && packet.topic) console.log('⬆️ [MQTT-PACKET] packetsend', packet.cmd, packet.topic);
  });
  client.on && client.on('packetreceive', (packet) => {
    console.log('⬇️ [MQTT-PACKET] packetreceive', packet.cmd);
  });
} catch (e) {
  // ignore if client doesn't support these events
}




// Connection event handlers
client.on('connect', async() => {
  isClientConnected = true;
  console.log('Connected to MQTT broker');
  SystemLog.create('INFO', 'MQTT client connected').catch(console.error);
  // console.log('✅ Connected to AWS IoT as', client.options.clientId);
  
  const topic = [
    'smartplant/pub',
    'smartplant/+/sensor-data',
    'smartplant/+/status',
    'smartplant/+/response',  // Add response topic
    'smartplant/device/+/command',
    'smartplant/device/+/response'  // Add device response topic
  ];

  // Subscribe to topics
  topic.forEach((t) => {
    client.subscribe(t, (err) => {
      if (!err) {
        console.log(`Subscribed to ${t}`);
      } else {
        console.error('Subscription error:', err);
      }
    });
  });

  try {
    await scheduleAllPumps();
    console.log('✅ All pump schedules loaded and cron jobs registered');
  } catch (err) {
    console.error('❌ Failed to schedule pumps:', err.message);
  }
});
client.on('close', () => { isClientConnected = false; console.log('🔴 MQTT connection closed'); });
client.on('reconnect', () => console.log('🔄 MQTT reconnecting...'));
client.on('offline', () => { isClientConnected = false; console.log('⚪ MQTT offline'); });




// Message handler
client.on('message', async (topic, payload) => {
  console.log(`Received message on topic: ${topic}`);
  
  try {
    const message = JSON.parse(payload.toString());

    if(topic === 'smartplant/pub') {
      console.log('Smartplant message:', message);
      await handleSmartplantMessage(message);
      return;
    }
    
    const topicParts = topic.split('/');
    const deviceKey = topicParts[1];

    // Route message based on topic structure
    if (topic.includes('/sensor-data')) {
      // Extract device key from topic
      await processSensorData(deviceKey, message);
    } else if (topic.includes('/status')) {
      await processDeviceStatus(deviceKey, message);
    } else if (topic.includes('/response')) {
      // Handle device responses (acknowledgments)
      await processDeviceResponse(deviceKey, message);
    }
  } catch (error) {
    console.error('Error processing MQTT message:', error);
    SystemLog.create('ERROR', `MQTT message processing error: ${error.message}`).catch(console.error);
  }
});

// Handle errors
client.on('error', (error) => {
  console.error('MQTT error:', error);
  SystemLog.create('ERROR', `MQTT client error: ${error.message}`).catch(console.error);
});

// Process sensor data received via MQTT
async function processSensorData(deviceKey, data) {
  try {
    console.log(`Sensor data received from ${deviceKey}:`, data);

    // Save sensor data to database
    await db.pool.query(
      `INSERT INTO sensors_data (device_key, timestamp, soil_moisture, temperature, air_humidity, light_intensity)
       VALUES ($1, NOW(), $2, $3, $4, $5)`,
      [deviceKey, data.soilMoisture, data.temperature, data.airHumidity, data.lightIntensity]
    );

    //update device last seen
    await db.pool.query(
      `UPDATE devices SET last_seen = NOW(), status = 'online' WHERE device_key = $1`,
      [deviceKey]
    );
    await SystemLog.create('INFO', `Inserted sensor data from device ${deviceKey}`).catch(console.error);
  } catch (error) {
    console.error('Error processing sensor data:', error);
    await SystemLog.create('ERROR', `Failed to process sensor data for ${deviceKey}: ${error.message}`);
  }
}

// Process device status updates
async function processDeviceStatus(deviceKey, data) {
  try {
    console.log(`Device ${deviceKey} status:`, data);

    const status = data.status || 'offline';

    await db.pool.query(
      `UPDATE devices SET status = $1, last_seen = NOW() WHERE device_key = $2`,
      [status, deviceKey]
    );

    await SystemLog.create('INFO', `Device ${deviceKey} status updated to ${data.status}`).catch(console.error);
  } catch (error) {
    console.error('Error processing device status:', error);
    await SystemLog.create('ERROR', `Error updating ${deviceKey} status: ${error.message}`).catch(console.error);
  }
}

// Process device command responses
async function processDeviceResponse(deviceKey, data) {
  try {
    console.log(`✅ [MQTT-RESPONSE] Device ${deviceKey} response:`, data);
    
    // Log the response
    await SystemLog.create('INFO', `Device ${deviceKey} responded: ${JSON.stringify(data)}`);
    
    // Handle specific response types
    if (data.command === 'pump_on' || data.command === 'pump_off') {
      const status = data.status || 'unknown';
      const message = data.message || 'No message';
      
      console.log(`🚰 [PUMP-RESPONSE] Pump command ${data.command} status: ${status} - ${message}`);

      if (data.commandId && pendingCommands.has(data.commandId)) {
        const { resolve, timeout } = pendingCommands.get(data.commandId);
        clearTimeout(timeout);
        pendingCommands.delete(data.commandId);
        resolve({ status: data.status, message: data.message });
      }

      
      // Update device status if pump operation affects it
      if (status === 'success') {
        await db.pool.query(
          `UPDATE devices SET last_seen = NOW(), status = 'online' WHERE device_key = $1`,
          [deviceKey.trim()]
        );
      }
    }
  } catch (error) {
    console.error('Error processing device response:', error);
    await SystemLog.create('ERROR', `Error processing response from ${deviceKey}: ${error.message}`).catch(console.error);
  }
}

// Send command to a specific device
async function sendDeviceCommand(deviceId, command, parameters = {}, timeoutMs = DEFAULT_COMMAND_TIMEOUT_MS) {
  if (!deviceId) return Promise.reject(new Error('Missing deviceId'));

  // Trim device ID to remove any padding spaces
  const trimmedDeviceId = String(deviceId).trim();
  
  console.log('🔄 [MQTT-DEVICE] Preparing device command:', {
    originalDeviceId: deviceId,
    trimmedDeviceId,
    command,
    parameters
  });
  
  
  const topic = `smartplant/device/${trimmedDeviceId}/command`;
  
  // ✅ Ensure connection before publishing
  await ensureConnected();

  return new Promise((resolve, reject) => {
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payloadWithId = {
      command,
      parameters,
      commandId,
      timestamp: new Date().toISOString()
    };
    const finalPayload = JSON.stringify(payloadWithId);

    console.log('📦 [MQTT-DEVICE] Command payload (final):', { topic, finalPayload, typeOfPayload: typeof finalPayload, qos: 0 });

    // Timeout setup
    const timeout = setTimeout(() => {
      pendingCommands.delete(commandId);
      console.warn(`⏱️ [MQTT-CMD] Command ${commandId} timed out after ${timeoutMs}ms`);
      resolve({ status: 'timeout', message: 'Device did not respond within timeout period' });
    }, timeoutMs);

    pendingCommands.set(commandId, { resolve, reject, timeout });
    console.log(`🟢 [MQTT-CMD] Pending commands size: ${pendingCommands.size} (added ${commandId})`);

    // Ensure client connection state is visible
    try {
      let connected;
      if (client) {
        if (typeof client.connected === 'function') {
          connected = client.connected();
        } else if (typeof client.connected === 'boolean') {
          connected = client.connected;
        } else {
          connected = '(unknown)';
        }
      }
      console.log('🔌 [MQTT] client.connected =', connected);
    } catch (e) {
      console.log('🔌 [MQTT] client.connected check failed:', e.message);
    }

    // Publish and support either callback-style or promise-style client.publish
    try {
      // ensure payload is a string
      if (typeof finalPayload !== 'string') {
        console.warn('⚠️ finalPayload is not string, converting via JSON.stringify');
      }
      const publishResult = client.publish(topic, String(finalPayload), { qos: 0 }, (err) => {
        if (err) {
          clearTimeout(timeout);
          pendingCommands.delete(commandId);
          console.error(`❌ [MQTT-DEVICE] Publish callback error for ${commandId}:`, err);
          return reject(err);
        }
        console.log(`📤 [MQTT-DEVICE] Published (cb) commandId=${commandId} to ${topic}`);
      });

      // If publish returns a promise (some AWS helpers do), await and log
      if (publishResult && typeof publishResult.then === 'function') {
        publishResult
          .then(() => {
            console.log(`📤 [MQTT-DEVICE] Published (promise) commandId=${commandId} to ${topic}`);
          })
          .catch((err) => {
            clearTimeout(timeout);
            pendingCommands.delete(commandId);
            console.error(`❌ [MQTT-DEVICE] Publish promise error for ${commandId}:`, err);
            reject(err);
          });
      }
    } catch (err) {
      clearTimeout(timeout);
      pendingCommands.delete(commandId);
      console.error('❌ [MQTT-DEVICE] Publish threw error:', err);
      return reject(err);
    }
  });
}

// Validate pump command parameters
function validatePumpCommand(command, duration) {
  if (command !== 'pump_on' && command !== 'pump_off') {
    throw new Error('Invalid pump command. Must be pump_on or pump_off');
  }

  if (command === 'pump_on') {
    if (!duration) {
      throw new Error('Duration is required for pump_on command');
    }
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 300) {
      throw new Error('Duration must be between 1 and 300 seconds');
    }
  }

  return true;
}

// Send pump control command
function sendPumpCommand(device_key, command, duration = null) {
  try {
    console.log('🚰 [MQTT-PUMP] Validating pump command:', { command, duration });
    validatePumpCommand(command, duration);

    const state = command === 'pump_on' ? 'ON' : 'OFF';
    const parameters = {
      duration: command === 'pump_on' ? parseInt(duration) : 0,
      state: state
    };

    console.log('📤 [MQTT-PUMP] Sending pump command:', {
      command: command,
      parameters: parameters
    });
    
    return sendDeviceCommand(device_key, command, parameters)
      .then((result) => {
        console.log('✅ [MQTT-PUMP] Command result:', result);
        return result;
      })
      .catch(error => {
        console.error('❌ [MQTT-PUMP] Command failed:', {
          error: error.message,
          command: command,
          state: parameters.state
        });
        throw error;
      });
  } catch (error) {
    console.error('❌ [MQTT-PUMP] Validation failed:', {
      error: error.message,
      command,
      duration
    });
    return Promise.reject(error);
  }
}

function ensureConnected() {
  return new Promise((resolve, reject) => {
    if (!client) return reject(new Error('MQTT client not initialized'));

    // Use internal flag set from event handlers for reliable detection
    console.log('🔌 ensureConnected: clientType=', client && client.constructor && client.constructor.name, 'flagIsConnected=', isClientConnected);
    if (isClientConnected) return resolve();

    console.log('⏳ Waiting for MQTT connection...');
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('MQTT not connected'));
    }, 10000);

    const onConnect = () => {
      clearTimeout(timeout);
      cleanup();
      isClientConnected = true;
      console.log('✅ MQTT connected, proceeding');
      resolve();
    };

    const onError = (err) => {
      clearTimeout(timeout);
      cleanup();
      reject(err || new Error('MQTT connection error'));
    };

    function cleanup() {
      try {
        client.removeListener && client.removeListener('connect', onConnect);
        client.removeListener && client.removeListener('ready', onConnect);
        client.removeListener && client.removeListener('error', onError);
      } catch (e) { /* ignore */ }
    }

    client.on && client.on('connect', onConnect);
    client.on && client.on('ready', onConnect);
    client.on && client.on('error', onError);
  });
}



async function handleSmartplantMessage(message) {
  try {
    console.log('💡 Handling Smartplant message:', message);
    // Example: message could contain { type: "command", deviceKey: "...", action: "reboot" }
    if (message.type === 'command' && message.deviceKey) {
      await sendDeviceCommand(message.deviceKey, message.action, message.parameters || {});
    } else {
      console.log('⚠️ Unrecognized smartplant message structure.');
    }
  } catch (error) {
    console.error('❌ Error handling Smartplant message:', error);
    await SystemLog.create('ERROR', `Smartplant message error: ${error.message}`).catch(console.error);
  }
}
// Export the MQTT client and utility functions
module.exports = {
  client,
  sendDeviceCommand,
  sendPumpCommand
};