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

// Determine which MQTT connection to use
const USE_AWS_IOT = process.env.USE_AWS_IOT === 'true';
let client = null;

if (USE_AWS_IOT) {
  // AWS IoT connection
  const awsIot = require('aws-iot-device-sdk');
  
  client = awsIot.device({
    keyPath: process.env.AWS_PRIVATE_KEY_PATH,
    certPath: process.env.AWS_CERT_PATH,
    caPath: process.env.AWS_ROOT_CA_PATH,
    clientId: 'plant-monitoring-system-' + Math.random().toString(16).slice(3),
    host: process.env.AWS_IOT_ENDPOINT
  });
} else {
  // Local or cloud MQTT broker connection
  const mqttUrl = process.env.MQTT_URL;
  
  client = mqtt.connect(mqttUrl, {
    clientId: 'plant-monitoring-system-' + Math.random().toString(16).slice(3),
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000
  });
}

// Connection event handlers
client.on('connect', () => {
  console.log('Connected to MQTT broker');
  SystemLog.create('INFO', 'MQTT client connected').catch(console.error);
  
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
});

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
function sendDeviceCommand(deviceId, command, parameters = {}) {
  // Trim device ID to remove any padding spaces
  const trimmedDeviceId = deviceId.trim();
  
  console.log('🔄 [MQTT-DEVICE] Preparing device command:', {
    originalDeviceId: deviceId,
    trimmedDeviceId: trimmedDeviceId,
    command,
    parameters
  });

  const topic = `smartplant/device/${trimmedDeviceId}/command`;
  
  const payload = JSON.stringify({
    command,
    parameters,
    timestamp: new Date().toISOString()
  });
  
  return new Promise((resolve, reject) => {
    // Set up timeout for command response
    const timeoutMs = 10000; // 10 seconds timeout
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add command ID to payload for tracking
    const payloadWithId = {
      command,
      parameters,
      commandId,
      timestamp: new Date().toISOString()
    };
    const finalPayload = JSON.stringify(payloadWithId);
    
    console.log('📦 [MQTT-DEVICE] Command payload:', {
      topic,
      payload: payloadWithId,
      qos: 1
    });
    
    const timeout = setTimeout(() => {
      console.log(`⏰ [MQTT-DEVICE] Command timeout for device ${trimmedDeviceId}:`, {
        command,
        commandId,
        timeoutMs
      });
      resolve({ status: 'timeout', message: 'Device did not respond within timeout period' });
    }, timeoutMs);
    
    client.publish(topic, finalPayload, { qos: 1 }, (error) => {
      if (error) {
        clearTimeout(timeout);
        console.error('❌ [MQTT-DEVICE] Command failed:', {
          deviceId: trimmedDeviceId,
          command,
          error: error.message,
          stack: error.stack
        });
        
        SystemLog.create('ERROR', JSON.stringify({
          event: 'device_command_failed',
          deviceId: trimmedDeviceId,
          command,
          error: error.message
        })).catch(console.error);
        
        reject(error);
      } else {
        clearTimeout(timeout);
        console.log('✅ [MQTT-DEVICE] Command sent successfully:', {
          deviceId: trimmedDeviceId,
          command,
          commandId,
          topic
        });
        
        SystemLog.create('INFO', JSON.stringify({
          event: 'device_command_sent',
          deviceId: trimmedDeviceId,
          command,
          parameters,
          commandId
        })).catch(console.error);
        
        resolve({ status: 'sent', message: 'Command sent successfully' });
      }
    });
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