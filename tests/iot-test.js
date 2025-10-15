import { mqtt, iot, io } from "aws-iot-device-sdk-v2";
import dotenv from "dotenv";
import path from "path";

// ✅ Load environment variables
dotenv.config();

// ✅ Enable SDK debug logs (you’ll see detailed connection events)
io.enable_logging(io.LogLevel.DEBUG);

// ✅ Validate .env values
if (!process.env.AWS_IOT_ENDPOINT) {
  console.error("❌ AWS_IOT_ENDPOINT is missing from .env");
  process.exit(1);
}

// ✅ Print the endpoint to confirm
console.log("🛰️  AWS IoT Endpoint:", process.env.AWS_IOT_ENDPOINT);

const certPath = "./certs/certificate.pem.crt";
const keyPath = "./certs/private.pem.key";
const rootCAPath = "./certs/AmazonRootCA1.pem";
const clientId = "ESP32_SmartPlant"; // matches your AWS policy

// ✅ Setup MQTT client with mutual TLS authentication
const bootstrap = new io.ClientBootstrap();
const configBuilder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(
  certPath,
  keyPath
);

configBuilder.with_certificate_authority_from_path(undefined, rootCAPath);
configBuilder.with_endpoint(process.env.AWS_IOT_ENDPOINT);
configBuilder.with_client_id(clientId);
configBuilder.with_clean_session(true);
configBuilder.with_keep_alive_seconds(30);

// Build final config and client
const config = configBuilder.build();
const client = new mqtt.MqttClient(bootstrap);
const connection = client.new_connection(config);

connection.on("connect", () => console.log("✅ Connected to AWS IoT Core"));
connection.on("interrupt", (err) => console.error("⚠️ Connection interrupted:", err));
connection.on("resume", (returnCode, sessionPresent) =>
  console.log("🔄 Connection resumed:", { returnCode, sessionPresent })
);
connection.on("disconnect", () => console.log("🔌 Disconnected"));
connection.on("error", (err) => console.error("❌ MQTT Error:", err));

async function main() {
  try {
    console.log("🚀 Attempting connection to AWS IoT Core...");
    await connection.connect();

    console.log("✅ Connected! Subscribing to topic...");
    await connection.subscribe("smartplant/sub", mqtt.QoS.AtLeastOnce, (topic, payload) => {
      const msg = new TextDecoder().decode(payload);
      console.log(`📥 Message on '${topic}':`, msg);
    });

    console.log("📤 Publishing test message...");
    await connection.publish(
      "smartplant/pub",
      JSON.stringify({ message: "Hello from Node.js AWS IoT test!" }),
      mqtt.QoS.AtLeastOnce
    );

    console.log("✅ Message published successfully!");

    // Keep connection alive for 30 seconds to receive responses
    await new Promise((resolve) => setTimeout(resolve, 30000));

    console.log("🔌 Disconnecting...");
    await connection.disconnect();
    console.log("👋 Done.");
  } catch (error) {
    console.error("💥 Connection or MQTT error:", error);
  }
}

main();
