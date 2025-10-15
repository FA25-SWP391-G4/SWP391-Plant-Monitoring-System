const IrrigationMqttService = require('./services/irrigationMqttService');
const EventEmitter = require('events');

// Mock MQTT Client
class MockMqttClient extends EventEmitter {
  constructor() {
    super();
    this.subscriptions = new Set();
    this.publishedMessages = [];
    this.connected = false;
  }

  subscribe(topic, callback) {
    this.subscriptions.add(topic);
    console.log(`📡 Subscribed to: ${topic}`);
    if (callback) callback(null);
  }

  unsubscribe(topic) {
    this.subscriptions.delete(topic);
    console.log(`📡 Unsubscribed from: ${topic}`);
  }

  publish(topic, message, options, callback) {
    const publishData = {
      topic,
      message: JSON.parse(message),
      options,
      timestamp: new Date().toISOString()
    };
    
    this.publishedMessages.push(publishData);
    console.log(`📤 Published to ${topic}:`, JSON.stringify(publishData.message, null, 2));
    
    if (callback) callback(null);
  }

  simulateConnect() {
    this.connected = true;
    this.emit('connect');
  }

  simulateDisconnect() {
    this.connected = false;
    this.emit('disconnect');
  }

  simulateMessage(topic, message) {
    this.emit('message', topic, Buffer.from(JSON.stringify(message)));
  }

  getPublishedMessages() {
    return this.publishedMessages;
  }

  clearMessages() {
    this.publishedMessages = [];
  }
}

async function testIrrigationMqtt() {
  console.log('🌱 Testing Irrigation MQTT Service...\n');

  try {
    // Create mock MQTT client
    const mockMqttClient = new MockMqttClient();
    
    // Initialize irrigation MQTT service
    console.log('1. Initializing Irrigation MQTT Service');
    const irrigationMqtt = new IrrigationMqttService(mockMqttClient);
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate MQTT connection
    console.log('\n2. Simulating MQTT Connection');
    mockMqttClient.simulateConnect();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ MQTT Service initialized and connected');
    console.log('Subscriptions:', Array.from(mockMqttClient.subscriptions));

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 3: Simulate sensor data input
    console.log('3. Testing Sensor Data Processing');
    
    const testSensorData = {
      soilMoisture: 25, // Low moisture
      temperature: 32,  // High temperature
      humidity: 45,
      lightLevel: 55000,
      timestamp: new Date().toISOString()
    };

    console.log('Simulating sensor data for plant 1:', testSensorData);
    mockMqttClient.simulateMessage('sensors/plant/1/data', testSensorData);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const messages = mockMqttClient.getPublishedMessages();
    console.log(`✅ Processed sensor data, published ${messages.length} messages`);

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 4: Test urgent alert conditions
    console.log('4. Testing Urgent Alert Conditions');
    
    const criticalSensorData = {
      soilMoisture: 10, // Critical low
      temperature: 38,  // Very high
      humidity: 25,     // Very low
      lightLevel: 70000,
      timestamp: new Date().toISOString()
    };

    mockMqttClient.clearMessages();
    console.log('Simulating critical sensor data for plant 2:', criticalSensorData);
    mockMqttClient.simulateMessage('sensors/plant/2/data', criticalSensorData);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const alertMessages = mockMqttClient.getPublishedMessages();
    console.log(`✅ Critical conditions processed, published ${alertMessages.length} messages`);
    
    // Check for alert messages
    const alerts = alertMessages.filter(msg => msg.topic.includes('/alert/'));
    if (alerts.length > 0) {
      console.log('🚨 Alert published:', alerts[0].message.level, '-', alerts[0].message.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 5: Test watering commands
    console.log('5. Testing Watering Commands');
    
    mockMqttClient.clearMessages();
    
    const commandId = await irrigationMqtt.sendWateringCommand(1, 500, 30);
    console.log('✅ Watering command sent, ID:', commandId);
    
    const stopCommandId = await irrigationMqtt.sendStopCommand(1, 'test_stop');
    console.log('✅ Stop command sent, ID:', stopCommandId);
    
    const commandMessages = mockMqttClient.getPublishedMessages();
    console.log(`Published ${commandMessages.length} command messages`);

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 6: Test irrigation system status handling
    console.log('6. Testing Irrigation System Status Handling');
    
    const systemStatus = {
      status: 'watering',
      waterAmount: 450,
      duration: 25,
      timestamp: new Date().toISOString()
    };

    console.log('Simulating irrigation system status:', systemStatus);
    mockMqttClient.simulateMessage('irrigation/status/1/system', systemStatus);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✅ System status processed');

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 7: Test watering confirmation
    console.log('7. Testing Watering Confirmation');
    
    const wateringConfirmation = {
      success: true,
      waterAmount: 480,
      duration: 28,
      sensorDataBefore: { soilMoisture: 25 },
      sensorDataAfter: { soilMoisture: 65 },
      timestamp: new Date().toISOString()
    };

    console.log('Simulating watering confirmation:', wateringConfirmation);
    mockMqttClient.simulateMessage('irrigation/status/1/watering', wateringConfirmation);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✅ Watering confirmation processed');

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 8: Test error handling
    console.log('8. Testing Error Handling');
    
    const errorStatus = {
      status: 'error',
      error: 'Pump malfunction detected',
      errorCode: 'PUMP_001',
      timestamp: new Date().toISOString()
    };

    mockMqttClient.clearMessages();
    console.log('Simulating irrigation system error:', errorStatus);
    mockMqttClient.simulateMessage('irrigation/status/3/system', errorStatus);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const errorMessages = mockMqttClient.getPublishedMessages();
    const errorAlerts = errorMessages.filter(msg => msg.topic.includes('/alert/'));
    
    if (errorAlerts.length > 0) {
      console.log('🚨 Error alert published:', errorAlerts[0].message.message);
    }
    console.log('✅ Error handling tested');

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 9: Test connection status
    console.log('9. Testing Connection Status');
    
    const connectionStatus = irrigationMqtt.getConnectionStatus();
    console.log('Connection Status:', {
      connected: connectionStatus.connected,
      subscriptionCount: connectionStatus.subscriptions.length,
      topicCount: Object.keys(connectionStatus.topics).length
    });
    
    console.log('✅ Connection status retrieved');

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 10: Test cleanup
    console.log('10. Testing Service Cleanup');
    
    await irrigationMqtt.cleanup();
    console.log('✅ Service cleanup completed');

    // Summary
    console.log('\n🎉 All MQTT irrigation tests completed successfully!\n');
    
    console.log('📊 Test Summary:');
    console.log(`- Total messages published: ${mockMqttClient.getPublishedMessages().length}`);
    console.log(`- Subscriptions created: ${mockMqttClient.subscriptions.size}`);
    console.log('- All core functionalities tested ✅');

  } catch (error) {
    console.error('❌ MQTT irrigation test failed:', error);
    console.error(error.stack);
  }
}

// Run tests
if (require.main === module) {
  testIrrigationMqtt().catch(console.error);
}

module.exports = testIrrigationMqtt;