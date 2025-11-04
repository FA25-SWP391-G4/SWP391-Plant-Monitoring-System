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
    'plant-system/+/sensor-data',
    'plant-system/+/status'
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
    
    const deviceKey = topic.split('/')[1];
    // Route message based on topic structure
    if (topic.includes('/sensor-data')) {
      // Extract device key from topic
      await processSensorData(deviceKey, message);
    } else if (topic.includes('/status')) {
      await processDeviceStatus(deviceKey, message);
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
      `INSERT INTO sensors_data (, timestamp, soil_moisture, temperature, air_humidity, light_intensity)
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

// Send command to a specific device
function sendDeviceCommand(deviceId, command, parameters = {}) {
  const topic = `plant-system/device/${deviceId}/command`;
  const payload = JSON.stringify({
    command,
    parameters,
    timestamp: new Date().toISOString()
  });
  
  return new Promise((resolve, reject) => {
    client.publish(topic, payload, { qos: 1 }, (error) => {
      if (error) {
        console.error(`Error sending command to device ${deviceId}:`, error);
        SystemLog.create('ERROR', `Failed to send command to device ${deviceId}: ${error.message}`).catch(console.error);
        reject(error);
      } else {
        console.log(`Command sent to device ${deviceId}: ${command}`);
        SystemLog.create('INFO', `Command sent to device ${deviceId}: ${command}`).catch(console.error);
        resolve();
      }
    });
  });
}

// Send pump control command
function sendPumpCommand(command) {
  return sendDeviceCommand('pump', 'set_state', { state: command });
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