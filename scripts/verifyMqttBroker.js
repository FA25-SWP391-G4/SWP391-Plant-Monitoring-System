/**
 * MQTT Broker Verification Script
 * Tests MQTT broker configuration and connectivity
 */

const mqtt = require('mqtt');
const { logger } = require('../utils/logger');

class MqttBrokerVerifier {
  constructor() {
    this.mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
    this.testTopics = [
      'test/connection',
      'ai/chatbot/test',
      'ai/irrigation/test',
      'ai/disease/test',
      'ai/system/test'
    ];
    this.results = {
      connection: false,
      publish: false,
      subscribe: false,
      topics: {},
      latency: null,
      errors: []
    };
  }

  /**
   * Run comprehensive MQTT broker verification
   */
  async verify() {
    console.log('🔍 Starting MQTT Broker Verification...');
    console.log(`📡 Connecting to: ${this.mqttUrl}`);

    try {
      await this.testConnection();
      await this.testPublishSubscribe();
      await this.testTopicStructure();
      await this.testLatency();
      
      this.printResults();
      return this.results;
    } catch (error) {
      console.error('❌ MQTT Broker verification failed:', error.message);
      this.results.errors.push(error.message);
      return this.results;
    }
  }

  /**
   * Test basic MQTT connection
   */
  async testConnection() {
    return new Promise((resolve, reject) => {
      console.log('🔌 Testing MQTT connection...');
      
      const client = mqtt.connect(this.mqttUrl, {
        clientId: 'mqtt-verifier-' + Math.random().toString(16).slice(3),
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 0 // Disable auto-reconnect for testing
      });

      const timeout = setTimeout(() => {
        client.end();
        reject(new Error('Connection timeout'));
      }, 10000);

      client.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ MQTT connection successful');
        this.results.connection = true;
        client.end();
        resolve();
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ MQTT connection failed:', error.message);
        this.results.errors.push(`Connection error: ${error.message}`);
        client.end();
        reject(error);
      });
    });
  }

  /**
   * Test publish and subscribe functionality
   */
  async testPublishSubscribe() {
    return new Promise((resolve, reject) => {
      console.log('📤📥 Testing publish/subscribe functionality...');
      
      const client = mqtt.connect(this.mqttUrl, {
        clientId: 'mqtt-pubsub-test-' + Math.random().toString(16).slice(3),
        clean: true,
        connectTimeout: 5000
      });

      const testTopic = 'test/pubsub';
      const testMessage = {
        message: 'MQTT verification test',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(16).slice(3)
      };

      let messageReceived = false;

      const timeout = setTimeout(() => {
        if (!messageReceived) {
          console.error('❌ Publish/Subscribe test timeout');
          this.results.errors.push('Publish/Subscribe timeout');
          client.end();
          reject(new Error('Publish/Subscribe timeout'));
        }
      }, 10000);

      client.on('connect', () => {
        // Subscribe to test topic
        client.subscribe(testTopic, { qos: 1 }, (err) => {
          if (err) {
            clearTimeout(timeout);
            console.error('❌ Subscribe failed:', err.message);
            this.results.errors.push(`Subscribe error: ${err.message}`);
            client.end();
            reject(err);
            return;
          }

          console.log(`📥 Subscribed to topic: ${testTopic}`);
          this.results.subscribe = true;

          // Publish test message
          client.publish(testTopic, JSON.stringify(testMessage), { qos: 1 }, (err) => {
            if (err) {
              clearTimeout(timeout);
              console.error('❌ Publish failed:', err.message);
              this.results.errors.push(`Publish error: ${err.message}`);
              client.end();
              reject(err);
              return;
            }

            console.log('📤 Test message published');
            this.results.publish = true;
          });
        });
      });

      client.on('message', (topic, payload) => {
        if (topic === testTopic) {
          try {
            const receivedMessage = JSON.parse(payload.toString());
            if (receivedMessage.testId === testMessage.testId) {
              clearTimeout(timeout);
              messageReceived = true;
              console.log('✅ Message received successfully');
              console.log(`📨 Round-trip successful for topic: ${topic}`);
              client.end();
              resolve();
            }
          } catch (error) {
            console.error('❌ Error parsing received message:', error.message);
            this.results.errors.push(`Message parsing error: ${error.message}`);
          }
        }
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ MQTT client error:', error.message);
        this.results.errors.push(`Client error: ${error.message}`);
        client.end();
        reject(error);
      });
    });
  }

  /**
   * Test AI-specific topic structure
   */
  async testTopicStructure() {
    return new Promise((resolve, reject) => {
      console.log('🏗️ Testing AI topic structure...');
      
      const client = mqtt.connect(this.mqttUrl, {
        clientId: 'mqtt-topics-test-' + Math.random().toString(16).slice(3),
        clean: true,
        connectTimeout: 5000
      });

      let topicsSubscribed = 0;
      const totalTopics = this.testTopics.length;

      const timeout = setTimeout(() => {
        console.log(`⚠️ Topic structure test completed with ${topicsSubscribed}/${totalTopics} topics`);
        client.end();
        resolve();
      }, 5000);

      client.on('connect', () => {
        this.testTopics.forEach(topic => {
          client.subscribe(topic, { qos: 1 }, (err) => {
            if (err) {
              console.error(`❌ Failed to subscribe to ${topic}:`, err.message);
              this.results.topics[topic] = false;
              this.results.errors.push(`Topic subscription error (${topic}): ${err.message}`);
            } else {
              console.log(`✅ Successfully subscribed to: ${topic}`);
              this.results.topics[topic] = true;
              topicsSubscribed++;
            }

            if (topicsSubscribed === totalTopics) {
              clearTimeout(timeout);
              console.log('✅ All AI topics tested successfully');
              client.end();
              resolve();
            }
          });
        });
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Topic structure test error:', error.message);
        this.results.errors.push(`Topic structure error: ${error.message}`);
        client.end();
        reject(error);
      });
    });
  }

  /**
   * Test MQTT latency
   */
  async testLatency() {
    return new Promise((resolve, reject) => {
      console.log('⏱️ Testing MQTT latency...');
      
      const client = mqtt.connect(this.mqttUrl, {
        clientId: 'mqtt-latency-test-' + Math.random().toString(16).slice(3),
        clean: true,
        connectTimeout: 5000
      });

      const latencyTopic = 'test/latency';
      const startTime = Date.now();
      let latencyMeasured = false;

      const timeout = setTimeout(() => {
        if (!latencyMeasured) {
          console.error('❌ Latency test timeout');
          this.results.errors.push('Latency test timeout');
          client.end();
          reject(new Error('Latency test timeout'));
        }
      }, 10000);

      client.on('connect', () => {
        client.subscribe(latencyTopic, { qos: 1 }, (err) => {
          if (err) {
            clearTimeout(timeout);
            console.error('❌ Latency test subscribe failed:', err.message);
            client.end();
            reject(err);
            return;
          }

          // Publish latency test message
          const latencyMessage = {
            type: 'latency_test',
            timestamp: startTime
          };

          client.publish(latencyTopic, JSON.stringify(latencyMessage), { qos: 1 });
        });
      });

      client.on('message', (topic, payload) => {
        if (topic === latencyTopic && !latencyMeasured) {
          try {
            const message = JSON.parse(payload.toString());
            if (message.type === 'latency_test' && message.timestamp === startTime) {
              const latency = Date.now() - startTime;
              this.results.latency = latency;
              latencyMeasured = true;
              
              clearTimeout(timeout);
              console.log(`✅ MQTT latency: ${latency}ms`);
              client.end();
              resolve();
            }
          } catch (error) {
            console.error('❌ Latency test message parsing error:', error.message);
          }
        }
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Latency test error:', error.message);
        this.results.errors.push(`Latency test error: ${error.message}`);
        client.end();
        reject(error);
      });
    });
  }

  /**
   * Print verification results
   */
  printResults() {
    console.log('\n📊 MQTT Broker Verification Results:');
    console.log('=====================================');
    
    console.log(`🔌 Connection: ${this.results.connection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📤 Publish: ${this.results.publish ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📥 Subscribe: ${this.results.subscribe ? '✅ PASS' : '❌ FAIL'}`);
    
    if (this.results.latency !== null) {
      const latencyStatus = this.results.latency < 100 ? '✅ EXCELLENT' : 
                           this.results.latency < 500 ? '⚠️ GOOD' : '❌ SLOW';
      console.log(`⏱️ Latency: ${this.results.latency}ms (${latencyStatus})`);
    }

    console.log('\n🏗️ Topic Structure:');
    Object.entries(this.results.topics).forEach(([topic, success]) => {
      console.log(`  ${success ? '✅' : '❌'} ${topic}`);
    });

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }

    const overallSuccess = this.results.connection && 
                          this.results.publish && 
                          this.results.subscribe && 
                          this.results.errors.length === 0;

    console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    if (overallSuccess) {
      console.log('🎉 MQTT Broker is ready for AI integration!');
    } else {
      console.log('⚠️ MQTT Broker needs attention before AI integration.');
    }
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new MqttBrokerVerifier();
  verifier.verify()
    .then(results => {
      process.exit(results.connection && results.publish && results.subscribe ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = MqttBrokerVerifier;