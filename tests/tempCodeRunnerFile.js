const { connectAwsIoT } = require('../services/awsIOTClient');

(async () => {
  try {
    const connection = await connectAwsIoT();
    console.log('✅ Connected to AWS IoT');

    const topic = 'smartplant/device/88ab2b3c1c78/command';
    const message = JSON.stringify({
      command: 'pump_on',
      parameters: { duration: 5, state: 'ON' }
    });

    await connection.publish(topic, message, 1);
    console.log('📤 Published test message to:', topic);
  } catch (error) {
    console.error('❌ Failed to publish:', error);
  }
})();