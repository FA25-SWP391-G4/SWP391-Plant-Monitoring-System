// awsIotClient.js

const { mqtt, iot, io } = require("aws-iot-device-sdk-v2");
const dotenv = require("dotenv");
dotenv.config();

const clientBootstrap = new io.ClientBootstrap();

const configBuilder = iot.AwsIotMqttConnectionConfigBuilder
  .new_mtls_builder_from_path(
    process.env.AWS_CERT_PATH,
    process.env.AWS_PRIVATE_KEY_PATH
  );

configBuilder.with_certificate_authority_from_path(
  undefined,
  process.env.AWS_ROOT_CA_PATH
);
configBuilder.with_client_id("ESP32_SmartPlant_1");
configBuilder.with_endpoint(process.env.AWS_IOT_ENDPOINT);

const config = configBuilder.build();

const client = new mqtt.MqttClient(clientBootstrap);
const connection = client.new_connection(config);

connection.on("connect", async () => {
  console.log("✅ Connected to AWS IoT Core");

    const handleIncomingMessage = async (topic, payload) => {
    const data = JSON.parse(new TextDecoder().decode(payload));
    console.log("📩 Received message from ESP32:", topic, data);

      try {
        const { pool } = require("../config/db");
        const payloadObj = data || {};

        // determine device id (payload-first, then topic)
        let deviceId = payloadObj.deviceId || payloadObj.device_id || null;

        // If payload didn't include a device id, try to extract from topic
        if (!deviceId && typeof topic === 'string') {
          // match smartplant/device/<deviceKey>/...
          const m = topic.match(/^smartplant\/device\/([^\/]+)\/?/);
          if (m && m[1]) deviceId = m[1];
        }

        // Normalize/truncate device key and guard
        if (deviceId && typeof deviceId === 'string') {
          deviceId = deviceId.trim().substring(0, 36); // match DB length if needed
        } else {
          console.warn(`⚠️ Missing device id for incoming message on ${topic}. Skipping sensors_data insert.`);
          await pool.query(
            `INSERT INTO system_logs (log_level, source, message)
             VALUES ($1, $2, $3)`,
            ["warn", "awsIotClient", JSON.stringify({ topic, payload: payloadObj, note: 'no device key' })]
          );
          return; // bail out: avoid inserting null device_key
        }

        // now deviceId is safe to use in DB insert
        const ts = payloadObj.timestamp
          ? new Date(payloadObj.timestamp)
          : new Date();
        const soil = payloadObj.soil_moisture ?? payloadObj.soilMoisture ?? null;
        const temp = payloadObj.temperature ?? null;
        const humidity = payloadObj.air_humidity ?? payloadObj.humidity ?? null;
        const light = payloadObj.light_intensity ?? payloadObj.light ?? null;

        await pool.query(
          `INSERT INTO sensors_data(device_key, timestamp, soil_moisture, temperature, air_humidity, light_intensity)
           VALUES($1, $2, $3, $4, $5, $6)`,
          [deviceId, ts, soil, temp, humidity, light]
        );
        console.log(`📥 Stored sensor data for device ${deviceId}`);
        return;
      } catch (dbErr) {
        console.error("❌ Failed to save IoT payload to DB", dbErr);
      }
    };

    // 🌿 Subscribe to both topics
  await connection.subscribe("smartplant/pub", mqtt.QoS.AtLeastOnce, handleIncomingMessage);
  console.log("🌿 Subscribed to smartplant/pub");

  await connection.subscribe("smartplant/device/+/response", mqtt.QoS.AtLeastOnce, handleIncomingMessage);
  console.log("🌿 Subscribed to smartplant/device/+/response");
});

async function connectAwsIoT() {
  try {
    await connection.connect();
    return connection;
  } catch (error) {
    console.error("Failed to connect to AWS IoT:", error);
    throw error;
  }
}

async function sendCommand(command) {
  const payload = JSON.stringify({ pump: command });
  await connection.publish("smartplant/sub", payload, mqtt.QoS.AtLeastOnce);
  console.log(`🚀 Sent command to ESP32: ${command}`);
}

module.exports = {
  connectAwsIoT,
  sendCommand
};
