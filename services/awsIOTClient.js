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

  await connection.subscribe(
    "smartplant/pub",
    mqtt.QoS.AtLeastOnce,
    async (topic, payload) => {
    const data = JSON.parse(new TextDecoder().decode(payload));
      console.log("📩 Received message from ESP32:", data);

      try {
        const { pool } = require("../config/db");
        const payloadObj = data || {};

        if (
          payloadObj.deviceId ||
          payloadObj.device_id ||
          payloadObj.soil_moisture !== undefined
        ) {
          const deviceId = payloadObj.deviceId || payloadObj.device_id;
        const ts = payloadObj.timestamp
          ? new Date(payloadObj.timestamp)
          : new Date();
        const soil = payloadObj.soil_moisture ?? payloadObj.soilMoisture ?? null;
        const temp = payloadObj.temperature ?? null;
        const humidity = payloadObj.air_humidity ?? payloadObj.humidity ?? null;
        const light = payloadObj.light_intensity ?? payloadObj.light ?? null;

          // Look up plant_id for this device_key
          let plantId = null;
          try {
            const plantQuery = await pool.query(
              `SELECT plant_id FROM plants WHERE device_key = $1`,
              [deviceId]
            );
            if (plantQuery.rows.length > 0) {
              plantId = plantQuery.rows[0].plant_id;
            }
          } catch (error) {
            console.error(`⚠️ Failed to lookup plant_id for device ${deviceId}:`, error);
          }

          await pool.query(
            `INSERT INTO sensors_data(device_key, plant_id, timestamp, soil_moisture, temperature, air_humidity, light_intensity)
             VALUES($1, $2, $3, $4, $5, $6, $7)`,
            [deviceId, plantId, ts, soil, temp, humidity, light]
          );
          console.log(`📥 Stored sensor data for device ${deviceId}${plantId ? ` (plant ${plantId})` : ' (no plant linked)'}`);
          return;
        }

        if (payloadObj.event === "watering" || payloadObj.type === "watering") {
          const plantId = payloadObj.plantId || payloadObj.plant_id;
          const trigger = payloadObj.trigger_type || payloadObj.trigger || "manual";
          const duration = payloadObj.duration_seconds || payloadObj.duration || null;

          await pool.query(
            `INSERT INTO watering_history(plant_id, timestamp, trigger_type, duration_seconds)
             VALUES($1, NOW(), $2, $3)`,
            [plantId, trigger, duration]
          );
          console.log(`💧 Logged watering event for plant ${plantId}`);
          return;
        }

        if (payloadObj.alert_message || payloadObj.alert) {
          const userId = payloadObj.userId || payloadObj.user_id || null;
          const msg = payloadObj.alert_message || payloadObj.alert;

          await pool.query(
            `INSERT INTO alerts(user_id, message, created_at) VALUES($1, $2, NOW())`,
            [userId, msg]
          );
          console.log(`⚠️ Stored alert for user ${userId || "unknown"}`);
          return;
        }

        await pool.query(
          `INSERT INTO system_logs (log_level, source, message) VALUES($1, $2, $3)`,
          ["info", "awsIOTClient", JSON.stringify(payloadObj)]
        );
        console.log("🪵 Logged unrecognized message to system_logs");
      } catch (dbErr) {
        console.error("❌ Failed to save IoT payload to DB", dbErr);
      }
    }
  );

  console.log("🌿 Subscribed to smartplant/pub");
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

// Enhanced pump command function that matches the interface expected by plantController
async function sendPumpCommand(device_key, command, duration = null) {
  try {
    console.log('🚰 [AWS-IOT-PUMP] Sending pump command:', { device_key, command, duration });
    
    // Validate command
    if (command !== 'pump_on' && command !== 'pump_off') {
      throw new Error('Invalid pump command. Must be pump_on or pump_off');
    }

    if (command === 'pump_on' && (!duration || duration < 1 || duration > 300)) {
      throw new Error('Duration must be between 1 and 300 seconds for pump_on command');
    }

    const state = command === 'pump_on' ? 'ON' : 'OFF';
    const parameters = {
      duration: command === 'pump_on' ? parseInt(duration) : 0,
      state: state
    };

    // Generate command ID for tracking
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare the command payload
    const commandPayload = {
      command,
      parameters,
      commandId,
      timestamp: new Date().toISOString(),
      responseRequired: true
    };

    // Use the device-specific topic structure
    const topic = `smartplant/device/${device_key.trim()}/command`;
    const payload = JSON.stringify(commandPayload);

    console.log('📦 [AWS-IOT-PUMP] Command payload:', {
      topic,
      payload: commandPayload,
      qos: mqtt.QoS.AtLeastOnce
    });

    // Publish the command using AWS IoT v2 SDK
    await connection.publish(topic, payload, mqtt.QoS.AtLeastOnce);
    
    console.log('✅ [AWS-IOT-PUMP] Pump command sent successfully via AWS IoT');
    
    // Return success response (matching the expected interface)
    return {
      status: 'sent',
      message: 'Command sent successfully via AWS IoT',
      commandId: commandId,
      topic: topic
    };

  } catch (error) {
    console.error('❌ [AWS-IOT-PUMP] Failed to send pump command:', {
      device_key,
      command,
      error: error.message
    });
    
    // Return error response (matching the expected interface)
    return {
      status: 'error',
      message: error.message,
      device_key: device_key
    };
  }
}

module.exports = {
  connectAwsIoT,
  sendCommand,
  sendPumpCommand
};
