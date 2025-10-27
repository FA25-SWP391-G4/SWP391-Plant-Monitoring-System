/*
 Simple MQTT subscriber script for debugging ESP32/device connectivity.
 Usage:
   node scripts/device-connection.js

 It will connect to the broker defined by MQTT_URL or mqtt://localhost:1883
 and subscribe to topics used by the project: plant-system/+/sensor-data and plant-system/+/status
*/
/*
Device provisioning + connectivity test for ESP32.

This test will publish WiFi credentials to the device and wait for an ACK.
It supports local MQTT (default) and AWS IoT (mTLS) when USE_AWS_IOT=true and
the AWS cert env vars are set.

Usage examples (PowerShell):
  # Local MQTT broker
  node .\tests\device-connection.js --deviceId=device123 --ssid=MyWiFi --password=p@ss

  # AWS IoT (mTLS)
  $env:USE_AWS_IOT='true'
  $env:AWS_IOT_ENDPOINT='...'
  $env:AWS_CERT_PATH='C:\path\cert.pem'
  $env:AWS_PRIVATE_KEY_PATH='C:\path\private.key'
  $env:AWS_ROOT_CA_PATH='C:\path\AmazonRootCA1.pem'
  node .\tests\device-connection.js --deviceId=device123 --ssid=MyWiFi --password=p@ss

Notes:
 - The device firmware must subscribe to the provisioning topic and publish an ACK
   to one of these topics when done:
     - plant-system/device/<deviceId>/status
     - plant-system/device/<deviceId>/ack
     - smartplant/ack/<deviceId>
 - The script waits up to `--timeout` seconds (default 20) for an ACK.
*/

const fs = require('fs');
require('dotenv').config();
const mqtt = require('mqtt');
let awsSdk = null;
try { awsSdk = require('aws-iot-device-sdk-v2'); } catch (e) { /* optional */ }

const argv = require('minimist')(process.argv.slice(2), { string: ['deviceId', 'ssid', 'password', 'broker'], default: { timeout: 20 } });
// Allow deviceId from CLI or .env (DEVICE_ID)
const deviceId = argv.deviceId || process.env.DEVICE_ID;
// Allow CLI override, otherwise read from .env (WIFI_SSID, WIFI_PASSWORD)
const ssid = argv.ssid || process.env.WIFI_SSID;
const password = argv.password || process.env.WIFI_PASSWORD || null;
const broker = argv.broker || process.env.MQTT_URL || 'mqtt://localhost:1883';
const timeoutSec = Number(argv.timeout) || 20;
const useAws = (process.env.USE_AWS_IOT === 'true') || argv.useAws;

if (!deviceId || !ssid) {
  const missing = [];
  if (!deviceId) missing.push('deviceId (CLI: --deviceId or env: DEVICE_ID)');
  if (!ssid) missing.push('ssid (CLI: --ssid or env: WIFI_SSID)');
  console.error('Missing required:', missing.join(' and '));
  process.exit(1);
}

const payload = { command: 'provision_wifi', ssid, password, timestamp: new Date().toISOString() };

const ackTopics = [
  `plant-system/device/${deviceId}/status`,
  `plant-system/device/${deviceId}/ack`,
  `smartplant/ack/${deviceId}`
];

function onAckMessage(topic, msg) {
  let parsed = null;
  try { parsed = JSON.parse(msg.toString()); } catch (e) { parsed = msg.toString(); }
  console.log('\n[device-connection] ACK received', { topic, payload: parsed });
  cleanupAndExit(0);
}

function cleanupAndExit(code) {
  if (client && client.end) {
    try { client.end(true); } catch (e) { /* ignore */ }
  }
  if (awsConnection) {
    try { awsConnection.disconnect().catch(()=>{}); } catch(e){}
  }
  process.exit(code);
}

let client = null;
let awsConnection = null;

async function publishAws() {
  if (!awsSdk) {
    console.error('aws-iot-device-sdk-v2 not installed. Install or use local MQTT.');
    process.exit(2);
  }
  const { mqtt: awsmqtt, iot, io } = awsSdk;
  const endpoint = process.env.AWS_IOT_ENDPOINT;
  const certPath = process.env.AWS_CERT_PATH;
  const keyPath = process.env.AWS_PRIVATE_KEY_PATH;
  const rootCaPath = process.env.AWS_ROOT_CA_PATH;
  if (!endpoint || !certPath || !keyPath || !rootCaPath) {
    console.error('Missing AWS env vars: AWS_IOT_ENDPOINT, AWS_CERT_PATH, AWS_PRIVATE_KEY_PATH, AWS_ROOT_CA_PATH');
    process.exit(2);
  }
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath) || !fs.existsSync(rootCaPath)) {
    console.error('AWS cert/key/CA file not found');
    process.exit(2);
  }

  const clientBootstrap = new io.ClientBootstrap();
  const configBuilder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(certPath, keyPath);
  configBuilder.with_certificate_authority_from_path(undefined, rootCaPath);
  // Use provided CLIENT_ID env var or fall back to ESP32_SmartPlant to match your policy
  const clientId = process.env.CLIENT_ID || 'ESP32_SmartPlant';
  configBuilder.with_client_id(clientId);
  configBuilder.with_endpoint(endpoint);
  const config = configBuilder.build();
  const mqttClient = new awsmqtt.MqttClient(clientBootstrap);
  const connection = mqttClient.new_connection(config);
  awsConnection = connection;

  connection.on('interrupt', (e) => console.error('[aws] interrupted', e && e.message ? e.message : e));
  connection.on('resume', (rc, sp) => console.log('[aws] resumed', { rc, sp }));

  try {
    console.log('[aws] connecting...');
    await connection.connect();
    console.log('[aws] connected');

    // Subscribe to ack topics (smartplant wildcard + specific plant-system topics)
    for (const t of ackTopics) {
      try {
        await connection.subscribe(t, awsmqtt.QoS.AtLeastOnce, (topic, payload) => {
          onAckMessage(topic, new TextDecoder().decode(payload));
        });
        console.log('[aws] subscribed to', t);
      } catch (e) {
        console.warn('[aws] subscribe failed for', t, e && e.message ? e.message : e);
      }
    }

    // Publish provisioning message
    const pubTopic = `smartplant/pub/${deviceId}`;
    await connection.publish(pubTopic, new TextEncoder().encode(JSON.stringify(payload)), awsmqtt.QoS.AtLeastOnce);
    console.log('[aws] published provisioning to', pubTopic, payload);

  } catch (err) {
    console.error('[aws] connection error:', err);
    if (err && err.code) console.error('Error code:', err.code);
    process.exit(3);
  }
}

function publishLocal() {
  console.log('[mqtt] connecting to', broker);
  client = mqtt.connect(broker, { clientId: 'device-connection-test-' + Math.random().toString(16).slice(3), clean: true, connectTimeout: 4000 });

  client.on('connect', () => {
    console.log('[mqtt] connected');
    // Subscribe ack topics
    ackTopics.forEach((t) => {
      client.subscribe(t, { qos: 1 }, (err) => {
        if (err) console.warn('[mqtt] subscribe failed', t, err.message || err);
        else console.log('[mqtt] subscribed to', t);
      });
    });

    client.on('message', (topic, message) => onAckMessage(topic, message));

    const pubTopic = `plant-system/device/${deviceId}/command`;
    client.publish(pubTopic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) {
        console.error('[mqtt] publish error', err);
        cleanupAndExit(2);
      } else {
        console.log('[mqtt] published provisioning to', pubTopic, payload);
      }
    });
  });

  client.on('error', (e) => {
    console.error('[mqtt] error', e && e.message ? e.message : e);
    cleanupAndExit(4);
  });
}

// Start
if (useAws) publishAws(); else publishLocal();

// Timeout
setTimeout(() => {
  console.error(`[device-connection] timed out after ${timeoutSec} seconds waiting for ACK`);
  cleanupAndExit(5);
}, timeoutSec * 1000);
