/**
 * System Integration Test
 * Tests complete integration between main application and AI service
 */

const axios = require('axios');
const mqtt = require('mqtt');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

class SystemIntegrationTest {
  constructor() {
    this.mainServiceUrl = process.env.MAIN_SERVICE_URL || 'http://localhost:3010';
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3001';
    this.mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
    
    this.testResults = {
      services: {
        mainService: false,
        aiService: false,
        mqttBroker: false,
        database: false
      },
      integration: {
        crossServiceCommunication: false,
        mqttMessaging: false,
        fileUpload: false,
        realTimeUpdates: false
      },
      aiFeatures: {
        chatbot: false,
        diseaseDetection: false,
        irrigationPrediction: false
      },
      performance: {
        responseTime: null,
        throughput: null,
        errorRate: null
      },
      errors: []
    };
  }

  /**
   * Run comprehensive system integration test
   */
  async runTests() {
    console.log('🚀 Starting System Integration Tests...');
    console.log('=====================================');

    try {
      await this.testServiceHealth();
      await this.testCrossServiceCommunication();
      await this.testMqttIntegration();
      await this.testAiFeatures();
      await this.testPerformance();
      
      this.printResults();
      return this.testResults;
    } catch (error) {
      console.error('❌ System integration test failed:', error.message);
      this.testResults.errors.push(error.message);
      return this.testResults;
    }
  }

  /**
   * Test health of all services
   */
  async testServiceHealth() {
    console.log('\n🏥 Testing Service Health...');

    // Test Main Service
    try {
      const response = await axios.get(`${this.mainServiceUrl}/`, { timeout: 5000 });
      if (response.status === 200) {
        console.log('✅ Main Service: Healthy');
        this.testResults.services.mainService = true;
      }
    } catch (error) {
      console.log('❌ Main Service: Unhealthy');
      this.testResults.errors.push(`Main Service error: ${error.message}`);
    }

    // Test AI Service
    try {
      const response = await axios.get(`${this.aiServiceUrl}/health`, { timeout: 5000 });
      if (response.status === 200) {
        console.log('✅ AI Service: Healthy');
        this.testResults.services.aiService = true;
      }
    } catch (error) {
      console.log('❌ AI Service: Unhealthy');
      this.testResults.errors.push(`AI Service error: ${error.message}`);
    }

    // Test MQTT Broker
    try {
      await this.testMqttConnection();
      console.log('✅ MQTT Broker: Connected');
      this.testResults.services.mqttBroker = true;
    } catch (error) {
      console.log('❌ MQTT Broker: Disconnected');
      this.testResults.errors.push(`MQTT Broker error: ${error.message}`);
    }

    // Test Database (through AI service)
    try {
      const response = await axios.get(`${this.aiServiceUrl}/health`, { timeout: 5000 });
      if (response.data.database && response.data.database.status === 'healthy') {
        console.log('✅ Database: Connected');
        this.testResults.services.database = true;
      }
    } catch (error) {
      console.log('❌ Database: Connection issues');
      this.testResults.errors.push(`Database error: ${error.message}`);
    }
  }

  /**
   * Test MQTT connection
   */
  async testMqttConnection() {
    return new Promise((resolve, reject) => {
      const client = mqtt.connect(this.mqttUrl, {
        clientId: 'integration-test-' + Math.random().toString(16).slice(3),
        clean: true,
        connectTimeout: 5000
      });

      const timeout = setTimeout(() => {
        client.end();
        reject(new Error('MQTT connection timeout'));
      }, 10000);

      client.on('connect', () => {
        clearTimeout(timeout);
        client.end();
        resolve();
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        client.end();
        reject(error);
      });
    });
  }

  /**
   * Test cross-service communication
   */
  async testCrossServiceCommunication() {
    console.log('\n🔄 Testing Cross-Service Communication...');

    try {
      // Test integration status endpoint
      const response = await axios.get(`${this.mainServiceUrl}/api/ai-integration/status`, {
        timeout: 10000
      });

      if (response.status === 200 && response.data.success) {
        console.log('✅ Integration status endpoint working');
        this.testResults.integration.crossServiceCommunication = true;
      } else {
        throw new Error('Integration status endpoint failed');
      }
    } catch (error) {
      console.log('❌ Cross-service communication failed');
      this.testResults.errors.push(`Cross-service communication error: ${error.message}`);
    }
  }

  /**
   * Test MQTT integration
   */
  async testMqttIntegration() {
    console.log('\n📡 Testing MQTT Integration...');

    return new Promise((resolve) => {
      const client = mqtt.connect(this.mqttUrl, {
        clientId: 'mqtt-integration-test-' + Math.random().toString(16).slice(3),
        clean: true,
        connectTimeout: 5000
      });

      const testTopic = 'test/integration';
      const testMessage = {
        type: 'integration_test',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(16).slice(3)
      };

      let messageReceived = false;

      const timeout = setTimeout(() => {
        if (!messageReceived) {
          console.log('❌ MQTT integration test timeout');
          this.testResults.errors.push('MQTT integration timeout');
        }
        client.end();
        resolve();
      }, 10000);

      client.on('connect', () => {
        client.subscribe(testTopic, { qos: 1 }, (err) => {
          if (err) {
            console.log('❌ MQTT subscribe failed');
            this.testResults.errors.push(`MQTT subscribe error: ${err.message}`);
            clearTimeout(timeout);
            client.end();
            resolve();
            return;
          }

          client.publish(testTopic, JSON.stringify(testMessage), { qos: 1 });
        });
      });

      client.on('message', (topic, payload) => {
        if (topic === testTopic) {
          try {
            const receivedMessage = JSON.parse(payload.toString());
            if (receivedMessage.testId === testMessage.testId) {
              console.log('✅ MQTT integration working');
              this.testResults.integration.mqttMessaging = true;
              messageReceived = true;
              clearTimeout(timeout);
              client.end();
              resolve();
            }
          } catch (error) {
            console.log('❌ MQTT message parsing failed');
            this.testResults.errors.push(`MQTT message parsing error: ${error.message}`);
          }
        }
      });

      client.on('error', (error) => {
        console.log('❌ MQTT integration error');
        this.testResults.errors.push(`MQTT integration error: ${error.message}`);
        clearTimeout(timeout);
        client.end();
        resolve();
      });
    });
  }

  /**
   * Test AI features integration
   */
  async testAiFeatures() {
    console.log('\n🤖 Testing AI Features Integration...');

    // Test Chatbot
    await this.testChatbotIntegration();
    
    // Test Disease Detection (if test image exists)
    await this.testDiseaseDetectionIntegration();
    
    // Test Irrigation Prediction
    await this.testIrrigationPredictionIntegration();
  }

  /**
   * Test chatbot integration
   */
  async testChatbotIntegration() {
    try {
      const response = await axios.post(`${this.mainServiceUrl}/api/ai-integration/chatbot/message`, {
        message: 'Hello, this is a test message about plant care',
        userId: 1,
        plantId: 1,
        sessionId: 'test-session-' + Date.now()
      }, { timeout: 15000 });

      if (response.status === 200 && response.data.success) {
        console.log('✅ Chatbot integration working');
        this.testResults.aiFeatures.chatbot = true;
      } else {
        throw new Error('Chatbot integration failed');
      }
    } catch (error) {
      console.log('❌ Chatbot integration failed');
      this.testResults.errors.push(`Chatbot integration error: ${error.message}`);
    }
  }

  /**
   * Test disease detection integration
   */
  async testDiseaseDetectionIntegration() {
    try {
      // Create a test image if it doesn't exist
      const testImagePath = path.join(__dirname, '../ai-service/test-image.jpg');
      
      if (!fs.existsSync(testImagePath)) {
        console.log('⚠️ Test image not found, skipping disease detection test');
        return;
      }

      const formData = new FormData();
      formData.append('image', fs.createReadStream(testImagePath));
      formData.append('plantId', '1');
      formData.append('userId', '1');

      const response = await axios.post(
        `${this.mainServiceUrl}/api/ai-integration/disease/analyze`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000
        }
      );

      if (response.status === 200 && response.data.success) {
        console.log('✅ Disease detection integration working');
        this.testResults.aiFeatures.diseaseDetection = true;
      } else {
        throw new Error('Disease detection integration failed');
      }
    } catch (error) {
      console.log('❌ Disease detection integration failed');
      this.testResults.errors.push(`Disease detection integration error: ${error.message}`);
    }
  }

  /**
   * Test irrigation prediction integration
   */
  async testIrrigationPredictionIntegration() {
    try {
      const sensorData = {
        soilMoisture: 45,
        temperature: 25,
        humidity: 60,
        lightLevel: 800,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(
        `${this.mainServiceUrl}/api/ai-integration/irrigation/predict/1`,
        sensorData,
        { timeout: 15000 }
      );

      if (response.status === 200 && response.data.success) {
        console.log('✅ Irrigation prediction integration working');
        this.testResults.aiFeatures.irrigationPrediction = true;
      } else {
        throw new Error('Irrigation prediction integration failed');
      }
    } catch (error) {
      console.log('❌ Irrigation prediction integration failed');
      this.testResults.errors.push(`Irrigation prediction integration error: ${error.message}`);
    }
  }

  /**
   * Test system performance
   */
  async testPerformance() {
    console.log('\n⚡ Testing System Performance...');

    const startTime = Date.now();
    let successfulRequests = 0;
    let failedRequests = 0;

    // Test multiple concurrent requests
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        axios.get(`${this.aiServiceUrl}/health`, { timeout: 5000 })
          .then(() => successfulRequests++)
          .catch(() => failedRequests++)
      );
    }

    await Promise.allSettled(requests);

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const totalRequests = successfulRequests + failedRequests;

    this.testResults.performance.responseTime = totalTime / totalRequests;
    this.testResults.performance.throughput = (totalRequests / totalTime) * 1000; // requests per second
    this.testResults.performance.errorRate = (failedRequests / totalRequests) * 100;

    console.log(`✅ Performance test completed:`);
    console.log(`   Average response time: ${this.testResults.performance.responseTime.toFixed(2)}ms`);
    console.log(`   Throughput: ${this.testResults.performance.throughput.toFixed(2)} req/s`);
    console.log(`   Error rate: ${this.testResults.performance.errorRate.toFixed(2)}%`);
  }

  /**
   * Print comprehensive test results
   */
  printResults() {
    console.log('\n📊 System Integration Test Results:');
    console.log('===================================');

    // Service Health
    console.log('\n🏥 Service Health:');
    Object.entries(this.testResults.services).forEach(([service, status]) => {
      console.log(`  ${status ? '✅' : '❌'} ${service}`);
    });

    // Integration Tests
    console.log('\n🔄 Integration Tests:');
    Object.entries(this.testResults.integration).forEach(([test, status]) => {
      console.log(`  ${status ? '✅' : '❌'} ${test}`);
    });

    // AI Features
    console.log('\n🤖 AI Features:');
    Object.entries(this.testResults.aiFeatures).forEach(([feature, status]) => {
      console.log(`  ${status ? '✅' : '❌'} ${feature}`);
    });

    // Performance
    console.log('\n⚡ Performance:');
    if (this.testResults.performance.responseTime) {
      console.log(`  📈 Average Response Time: ${this.testResults.performance.responseTime.toFixed(2)}ms`);
      console.log(`  🚀 Throughput: ${this.testResults.performance.throughput.toFixed(2)} req/s`);
      console.log(`  ❌ Error Rate: ${this.testResults.performance.errorRate.toFixed(2)}%`);
    }

    // Errors
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.testResults.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }

    // Overall Status
    const servicesHealthy = Object.values(this.testResults.services).every(status => status);
    const integrationWorking = Object.values(this.testResults.integration).some(status => status);
    const aiFeaturesWorking = Object.values(this.testResults.aiFeatures).some(status => status);

    const overallSuccess = servicesHealthy && integrationWorking && aiFeaturesWorking;

    console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    if (overallSuccess) {
      console.log('🎉 System integration is working correctly!');
    } else {
      console.log('⚠️ System integration needs attention.');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (!servicesHealthy) {
      console.log('  • Ensure all services are running and healthy');
    }
    if (!integrationWorking) {
      console.log('  • Check cross-service communication and MQTT configuration');
    }
    if (!aiFeaturesWorking) {
      console.log('  • Verify AI service endpoints and model availability');
    }
    if (this.testResults.performance.errorRate > 10) {
      console.log('  • High error rate detected, investigate service stability');
    }
    if (this.testResults.performance.responseTime > 5000) {
      console.log('  • Slow response times detected, consider performance optimization');
    }
  }
}

// Run test if called directly
if (require.main === module) {
  const test = new SystemIntegrationTest();
  test.runTests()
    .then(results => {
      const success = Object.values(results.services).every(status => status) &&
                     Object.values(results.integration).some(status => status) &&
                     Object.values(results.aiFeatures).some(status => status);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Integration test failed:', error);
      process.exit(1);
    });
}

module.exports = SystemIntegrationTest;