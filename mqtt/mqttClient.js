import fs from 'fs';
import awsIot from 'aws-iot-device-sdk';

import dotenv from "dotenv";
dotenv.config();

//initialize aws iot device client
const device = awsIot.device({
    keyPath: process.env.AWS_PRIVATE_KEY_PATH,
    certPath: process.env.AWS_CERT_PATH,
    caPath: process.env.AWS_ROOT_CA_PATH,
    clientId: 'plant-monitoring-system-client',
    host: process.env.AWS_IOT_ENDPOINT
});

device.on("connect", function () {
    console.log("Connected to AWS IoT Core");
    device.subscribe("smartplant/pub", function (err) {
        if (!err) {
            console.log("Subscribed to topic: smartplant/pub");
        } else {
            console.error("Subscription error:", err);
        }
    });
});

device.on("message", function (topic, payload) {
    console.log("Receive message on topic:", topic);
    try {
        const message = JSON.parse(payload.toString());
        console.log("Message payload:", message);

        // Save to database

    } catch (error) {
        console.error("Error parsing message payload:", error);
    }
});

export const sendPumpCommand = (command) => {
    const payload = JSON.stringify({ pump : command }); //pump: ON
    device.publish("smartplant/sub", payload, (err) => {
        if (err) {
            console.error("Publish error:", err);
        } else {
            console.log("Command sent:", payload);
        }
    });
};
export default device;