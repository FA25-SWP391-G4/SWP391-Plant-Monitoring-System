const dotenv = require("dotenv");
dotenv.config();

// Fallback mode for local development
let connection = null;
let isAwsIotAvailable = false;

// Check if AWS IoT credentials are available
const hasAwsCredentials = process.env.AWS_CERT_PATH && 
                          process.env.AWS_PRIVATE_KEY_PATH && 
                          process.env.AWS_ROOT_CA_PATH &&
                          process.env.AWS_IOT_ENDPOINT;

// Only try to initialize AWS IoT if credentials are available
if (hasAwsCredentials) {
    try {
        const { mqtt, iot, io } = require("aws-iot-device-sdk-v2");
        
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
        connection = client.new_connection(config);

        connection.on("connect", () => {
            console.log("Connected to AWS IoT Core");
            isAwsIotAvailable = true;
            connection.subscribe("smartplant/sub", mqtt.QoS.AtLeastOnce, (topic, payload) => {
                const data = JSON.parse(new TextDecoder().decode(payload));
                console.log("Received message:", data);
                //save to database
            });
        });
    } catch (error) {
        console.warn("AWS IoT initialization failed, running in fallback mode:", error.message);
    }
}

async function connectAwsIoT() {
    if (!hasAwsCredentials) {
        console.log("AWS IoT credentials not configured, running in fallback mode");
        return { 
            isConnected: false,
            publish: () => console.log("AWS IoT in fallback mode, message not sent")
        };
    }
    
    try {
        if (connection) {
            await connection.connect();
            return connection;
        } else {
            console.log("AWS IoT connection not initialized, running in fallback mode");
            return { 
                isConnected: false,
                publish: () => console.log("AWS IoT in fallback mode, message not sent")
            };
        }
    } catch (error) {
        console.error("Failed to connect to AWS IoT:", error);
        return { 
            isConnected: false,
            publish: () => console.log("AWS IoT connection failed, message not sent")
        };
    }
}   

module.exports = { connectAwsIoT, isAwsIotAvailable };