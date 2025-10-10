import { mqtt, iot, io } from "aws-iot-device-sdk-v2";
import dotenv from "dotenv";
dotenv.config();

const clientBootstrap = new io.ClientBootstrap();
const configBuilder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(
    process.env.AWS_CERT_PATH,
    process.env.AWS_PRIVATE_KEY_PATH
);
configBuilder.with_certificate_authority_from_path(undefined, process.env.AWS_ROOT_CA_PATH);
configBuilder.with_client_id("plant-monitoring-system-client");
configBuilder.with_endpoint(process.env.AWS_IOT_ENDPOINT);

const config = configBuilder.build();
const client = new mqtt.MqttClient(clientBootstrap);
const connection = client.new_connection(config);

connection.on("connect", () => {
    console.log("Connected to AWS IoT Core");
    connection.subscribe("smartplant/pub", mqtt.QoS.AtLeastOnce, (topic, payload) => {
        const data = JSON.parse(new TextDecoder().decode(payload));
        console.log("Received message:", data);

        //save to database
    });
});    

export async function connectAwsIoT() {
    await connection.connect();
}   