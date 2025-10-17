/**
 * MQTT Client for Plant Monitoring System
 * Handles both local MQTT broker and AWS IoT connectivity
 */

const mqtt = require('mqtt');
const fs = require('fs');
const dotenv = require('dotenv');
const SystemLog = require('../models/SystemLog');
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
  
  // Subscribe to topics
  client.subscribe('plant-system/+/sensor-data', (err) => {
    if (!err) {
      console.log('Subscribed to sensor data topic');
    } else {
      console.error('Subscription error:', err);
    }
  });
  
  client.subscribe('plant-system/+/status', (err) => {
    if (!err) {
      console.log('Subscribed to device status topic');
    } else {
      console.error('Subscription error:', err);
    }
  });
});

// Message handler
client.on('message', (topic, payload) => {
  console.log(`Received message on topic: ${topic}`);
  
  try {
    const message = JSON.parse(payload.toString());
    
    // Route message based on topic structure
    if (topic.includes('/sensor-data')) {
      // Extract device ID from topic
      const deviceId = topic.split('/')[1];
      processSensorData(deviceId, message);
    } else if (topic.includes('/status')) {
      // Extract device ID from topic
      const deviceId = topic.split('/')[1];
      processDeviceStatus(deviceId, message);
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
async function processSensorData(deviceId, data) {
  try {
    // In a production system, we would save this to the database
    // This is a placeholder for that functionality
    console.log(`Processing sensor data for device ${deviceId}:`, data);
    
    // Emit event or call API to process sensor data
    // For now, we'll just log it
    SystemLog.create('INFO', `Received sensor data from device ${deviceId}`).catch(console.error);
  } catch (error) {
    console.error('Error processing sensor data:', error);
    SystemLog.create('ERROR', `Error processing sensor data: ${error.message}`).catch(console.error);
  }
}

// Process device status updates
async function processDeviceStatus(deviceId, data) {
  try {
    console.log(`Processing status update for device ${deviceId}:`, data);
    
    // In a production system, we would update the device status in the database
    SystemLog.create('INFO', `Device ${deviceId} status updated to ${data.status}`).catch(console.error);
  } catch (error) {
    console.error('Error processing device status:', error);
    SystemLog.create('ERROR', `Error processing device status: ${error.message}`).catch(console.error);
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

// Export the MQTT client and utility functions
module.exports = {
  client,
  sendDeviceCommand,
  sendPumpCommand
};