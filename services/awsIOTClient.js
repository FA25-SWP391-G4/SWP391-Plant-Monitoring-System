import { mqtt, iot, io } from "aws-iot-device-sdk-v2";
import dotenv from "dotenv";
dotenv.config();

console.log("AWS IoT Endpoint loaded:", process.env.AWS_IOT_ENDPOINT);

const clientBootstrap = new io.ClientBootstrap();
const configBuilder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(
    process.env.AWS_CERT_PATH,
    process.env.AWS_PRIVATE_KEY_PATH
);
configBuilder.with_certificate_authority_from_path(undefined, process.env.AWS_ROOT_CA_PATH);
configBuilder.with_client_id("ESP32_SmartPlant");
configBuilder.with_endpoint(process.env.AWS_IOT_ENDPOINT);

const config = configBuilder.build();
const client = new mqtt.MqttClient(clientBootstrap);
const connection = client.new_connection(config);

connection.on("connect", () => {
    console.log("Connected to AWS IoT Core");
    connection.subscribe("smartplant/sub", mqtt.QoS.AtLeastOnce, (topic, payload) => {
        try {
            const decoded = new TextDecoder().decode(payload);  
            const data = JSON.parse(decoded);
            console.log("Received message:", data);
            //save to database
        } catch (error) {
            console.error("Failed to process message:", error);
        }

    });
});    

connection.on("error", (error) => {
    console.error("AWS IoT Connection Error:", error);
});

connection.on("interrupt", (error) => {
    console.warn("Connection interrupted:", error);
});

connection.on("resume", (returnCode, sessionPresent) => {
    console.log("Connection resumed:", { returnCode, sessionPresent });
});


export async function connectAwsIoT() {
    await connection.connect();
}   