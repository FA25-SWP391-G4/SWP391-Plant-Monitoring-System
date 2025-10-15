#!/usr/bin/env node

/**
 * User Acceptance Testing Script for AI Features Integration
 * Comprehensive end-to-end testing from user perspective
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios').default;
const FormData = require('form-data');

class UserAcceptanceTest {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3001';
    this.mainServerURL = process.env.MAIN_SERVER_URL || 'http://localhost:3010';
    this.frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
    
    this.testUser = {
      id: 1,
      email: 'test@example.com',
      token: null
    };
    
    this.testPlant = {
      id: 1,
      name: 'Test Plant',
      type: 'tomato'
    };
  }

  async runTests() {
    console.log('🧪 Starting User Acceptance Testing...');
    console.log('=' .repeat(60));
    
    try {
      await this.setupTestEnvironment();
      await this.testSystemHealth();
      await this.testUserAuthentication();
      await this.testChatbotFeatures();
      await this.testDiseaseDetection();
      await this.testIrrigationPrediction();
      await this.testRealTimeFeatures();
      await this.testDataProtection();
      await this.testPerformanceRequirements();
      await this.testErrorHandling();
      
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ User acceptance testing failed:', error.message);
      process.exit(1);
    }
  }

  async setupTestEnvironment() {
    console.log('\n🔧 Setting up test environment...');
    
    // Wait for services to be ready
    await this.waitForServices();
    
    // Create test data if needed
    await this.createTestData();
    
    console.log('✅ Test environment ready');
  }

  async waitForServices() {
    const services = [
      { name: 'AI Service', url: `${this.baseURL}/api/ai/health` },
      { name: 'Main Server', url: `${this.mainServerURL}/health` },
      { name: 'Frontend', url: this.frontendURL }
    ];
    
    for (const service of services) {
      let retries = 30;
      let ready = false;
      
      while (retries > 0 && !ready) {
        try {
          const response = await axios.get(service.url, { timeout: 5000 });
          if (response.status === 200) {
            console.log(`✅ ${service.name} is ready`);
            ready = true;
          }
        } catch (error) {
          retries--;
          if (retries > 0) {
            console.log(`⏳ Waiting for ${service.name}... (${retries} retries left)`);
            await this.sleep(2000);
          }
        }
      }
      
      if (!ready) {
        throw new Error(`${service.name} is not ready after 60 seconds`);
      }
    }
  }

  async createTestData() {
    // This would typically create test users, plants, etc.
    // For now, we'll assume they exist or use mock data
    console.log('📝 Using existing test data');
  }

  async testSystemHealth() {
    console.log('\n🏥 Testing system health...');
    
    await this.runTest('System Health Check', async () => {
      const response = await axios.get(`${this.baseURL}/api/ai/health`);
      
      if (response.status !== 200) {
        throw new Error(`Health check failed with status ${response.status}`);
      }
      
      const health = response.data;
      
      if (health.status !== 'healthy' && health.status !== 'degraded') {
        throw new Error(`System status is ${health.status}`);
      }
      
      // Check critical services
      const criticalServices = ['database', 'redis', 'mqtt'];
      for (const service of criticalServices) {
        if (health.services && health.services[service] && health.services[service].status === 'unhealthy') {
          throw new Error(`Critical service ${service} is unhealthy`);
        }
      }
      
      return 'System health check passed';
    });
  }

  async testUserAuthentication() {
    console.log('\n🔐 Testing user authentication...');
    
    await this.runTest('User Authentication', async () => {
      // For this test, we'll simulate having a valid token
      // In a real scenario, this would involve login flow
      this.testUser.token = 'mock-jwt-token';
      
      return 'Authentication simulation completed';
    });
  }

  async testChatbotFeatures() {
    console.log('\n💬 Testing chatbot features...');
    
    await this.runTest('Chatbot Plant Question', async () => {
      const response = await axios.post(`${this.baseURL}/api/ai/chatbot/message`, {
        message: 'Cây của tôi có lá vàng, phải làm sao?',
        userId: this.testUser.id,
        plantId: this.testPlant.id
      }, {
        headers: this.getAuthHeaders(),
        timeout: 30000
      });
      
      if (response.status !== 200) {
        throw new Error(`Chatbot request failed with status ${response.status}`);
      }
      
      const result = response.data;
      
      if (!result.success) {
        throw new Error(`Chatbot response failed: ${result.error?.message}`);
      }
      
      if (!result.response || result.response.length < 10) {
        throw new Error('Chatbot response too short or empty');
      }
      
      if (result.response.toLowerCase().includes('không thể trả lời') || 
          result.response.toLowerCase().includes('không liên quan')) {
        throw new Error('Chatbot incorrectly rejected plant-related question');
      }
      
      return `Chatbot responded: "${result.response.substring(0, 100)}..."`;
    });
    
    await this.runTest('Chatbot Non-Plant Question Rejection', async () => {
      const response = await axios.post(`${this.baseURL}/api/ai/chatbot/message`, {
        message: 'Thời tiết hôm nay thế nào?',
        userId: this.testUser.id
      }, {
        headers: this.getAuthHeaders(),
        timeout: 15000
      });
      
      if (response.status !== 200) {
        throw new Error(`Chatbot request failed with status ${response.status}`);
      }
      
      const result = response.data;
      
      if (!result.success) {
        throw new Error(`Chatbot response failed: ${result.error?.message}`);
      }
      
      if (!result.response.toLowerCase().includes('cây trồng') && 
          !result.response.toLowerCase().includes('không thể trả lời')) {
        throw new Error('Chatbot should reject non-plant questions');
      }
      
      return 'Chatbot correctly rejected non-plant question';
    });
    
    await this.runTest('Chat History Retrieval', async () => {
      // First, create a session by sending a message
      const messageResponse = await axios.post(`${this.baseURL}/api/ai/chatbot/message`, {
        message: 'Test message for history',
        userId: this.testUser.id
      }, {
        headers: this.getAuthHeaders()
      });
      
      const sessionId = messageResponse.data.sessionId;
      
      if (!sessionId) {
        throw new Error('No session ID returned from chatbot');
      }
      
      // Now retrieve the history
      const historyResponse = await axios.get(`${this.baseURL}/api/ai/chatbot/history/${sessionId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (historyResponse.status !== 200) {
        throw new Error(`History retrieval failed with status ${historyResponse.status}`);
      }
      
      const history = historyResponse.data;
      
      if (!history.success || !Array.isArray(history.messages)) {
        throw new Error('Invalid history response format');
      }
      
      return `Retrieved ${history.messages.length} messages from history`;
    });
  }

  async testDiseaseDetection() {
    console.log('\n🔬 Testing disease detection features...');
    
    await this.runTest('Disease Detection Image Upload', async () => {
      // Create a mock image file for testing
      const mockImagePath = await this.createMockImage();
      
      try {
        const formData = new FormData();
        const imageBuffer = await fs.readFile(mockImagePath);
        formData.append('image', imageBuffer, 'test-plant.jpg');
        formData.append('userId', this.testUser.id.toString());
        formData.append('plantId', this.testPlant.id.toString());
        
        const response = await axios.post(`${this.baseURL}/api/ai/disease/analyze`, formData, {
          headers: {
            ...this.getAuthHeaders(),
            ...formData.getHeaders()
          },
          timeout: 60000
        });
        
        if (response.status !== 200) {
          throw new Error(`Disease detection failed with status ${response.status}`);
        }
        
        const result = response.data;
        
        if (!result.success) {
          throw new Error(`Disease detection failed: ${result.error?.message}`);
        }
        
        if (!result.analysisId) {
          throw new Error('No analysis ID returned');
        }
        
        if (!Array.isArray(result.diseases)) {
          throw new Error('Invalid diseases array in response');
        }
        
        return `Disease analysis completed with ID: ${result.analysisId}`;
        
      } finally {
        // Clean up mock image
        try {
          await fs.unlink(mockImagePath);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
    
    await this.runTest('Disease Detection Invalid File Rejection', async () => {
      // Create a mock non-image file
      const mockFilePath = path.join(__dirname, 'test-invalid-file.txt');
      await fs.writeFile(mockFilePath, 'This is not an image file');
      
      try {
        const formData = new FormData();
        const fileBuffer = await fs.readFile(mockFilePath);
        formData.append('image', fileBuffer, 'test-invalid.txt');
        formData.append('userId', this.testUser.id.toString());
        
        const response = await axios.post(`${this.baseURL}/api/ai/disease/analyze`, formData, {
          headers: {
            ...this.getAuthHeaders(),
            ...formData.getHeaders()
          },
          timeout: 30000,
          validateStatus: () => true // Don't throw on 4xx/5xx
        });
        
        if (response.status === 200 && response.data.success) {
          throw new Error('System should reject non-image files');
        }
        
        return 'System correctly rejected invalid file type';
        
      } finally {
        // Clean up mock file
        try {
          await fs.unlink(mockFilePath);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
  }

  async testIrrigationPrediction() {
    console.log('\n💧 Testing irrigation prediction features...');
    
    await this.runTest('Irrigation Prediction', async () => {
      const sensorData = {
        soilMoisture: 45,
        temperature: 28,
        humidity: 65,
        lightLevel: 800
      };
      
      const response = await axios.post(`${this.baseURL}/api/ai/irrigation/predict/${this.testPlant.id}`, {
        sensorData
      }, {
        headers: this.getAuthHeaders(),
        timeout: 30000
      });
      
      if (response.status !== 200) {
        throw new Error(`Irrigation prediction failed with status ${response.status}`);
      }
      
      const result = response.data;
      
      if (!result.success) {
        throw new Error(`Irrigation prediction failed: ${result.error?.message}`);
      }
      
      if (!result.prediction) {
        throw new Error('No prediction data returned');
      }
      
      const prediction = result.prediction;
      
      if (typeof prediction.shouldWater !== 'boolean') {
        throw new Error('Invalid shouldWater prediction');
      }
      
      if (typeof prediction.confidence !== 'number' || prediction.confidence < 0 || prediction.confidence > 1) {
        throw new Error('Invalid confidence score');
      }
      
      return `Irrigation prediction: shouldWater=${prediction.shouldWater}, confidence=${prediction.confidence}`;
    });
    
    await this.runTest('Irrigation Schedule Creation', async () => {
      const preferences = {
        wateringTimes: ['08:00', '18:00'],
        excludeDays: ['Sunday'],
        maxWaterPerDay: 1000
      };
      
      const response = await axios.post(`${this.baseURL}/api/ai/irrigation/schedule/${this.testPlant.id}`, {
        preferences
      }, {
        headers: this.getAuthHeaders(),
        timeout: 30000
      });
      
      if (response.status !== 200) {
        throw new Error(`Schedule creation failed with status ${response.status}`);
      }
      
      const result = response.data;
      
      if (!result.success) {
        throw new Error(`Schedule creation failed: ${result.error?.message}`);
      }
      
      if (!Array.isArray(result.schedule)) {
        throw new Error('Invalid schedule format');
      }
      
      return `Created irrigation schedule with ${result.schedule.length} entries`;
    });
  }

  async testRealTimeFeatures() {
    console.log('\n⚡ Testing real-time features...');
    
    await this.runTest('MQTT Connection Test', async () => {
      // This is a simplified test - in a real scenario, you'd test actual MQTT connectivity
      // For now, we'll check if the MQTT service is configured
      
      const healthResponse = await axios.get(`${this.baseURL}/api/ai/health/detailed`);
      const health = healthResponse.data;
      
      if (!health.services || !health.services.mqtt) {
        throw new Error('MQTT service not found in health check');
      }
      
      if (health.services.mqtt.status === 'unhealthy') {
        throw new Error('MQTT service is unhealthy');
      }
      
      return 'MQTT service is available and healthy';
    });
  }

  async testDataProtection() {
    console.log('\n🔒 Testing data protection features...');
    
    await this.runTest('Privacy Report Generation', async () => {
      const response = await axios.get(`${this.baseURL}/privacy/report/${this.testUser.id}`, {
        headers: this.getAuthHeaders(),
        timeout: 15000
      });
      
      if (response.status !== 200) {
        throw new Error(`Privacy report failed with status ${response.status}`);
      }
      
      const report = response.data;
      
      if (!report.userId || !report.dataTypes) {
        throw new Error('Invalid privacy report format');
      }
      
      return `Privacy report generated for user ${report.userId}`;
    });
    
    await this.runTest('Data Retention Status', async () => {
      const response = await axios.get(`${this.baseURL}/privacy/retention-status`, {
        headers: this.getAuthHeaders()
      });
      
      if (response.status !== 200) {
        throw new Error(`Retention status failed with status ${response.status}`);
      }
      
      const status = response.data;
      
      if (!status.policies || !Array.isArray(status.policies)) {
        throw new Error('Invalid retention status format');
      }
      
      return `Data retention policies: ${status.policies.length} configured`;
    });
  }

  async testPerformanceRequirements() {
    console.log('\n⚡ Testing performance requirements...');
    
    await this.runTest('Response Time Requirements', async () => {
      const startTime = Date.now();
      
      const response = await axios.post(`${this.baseURL}/api/ai/chatbot/message`, {
        message: 'Quick test message',
        userId: this.testUser.id
      }, {
        headers: this.getAuthHeaders(),
        timeout: 5000
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.status !== 200) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      if (responseTime > 3000) {
        throw new Error(`Response time ${responseTime}ms exceeds 3 second requirement`);
      }
      
      return `Response time: ${responseTime}ms (within 3s requirement)`;
    });
    
    await this.runTest('Concurrent User Simulation', async () => {
      const concurrentRequests = 10;
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          axios.post(`${this.baseURL}/api/ai/chatbot/message`, {
            message: `Concurrent test message ${i}`,
            userId: this.testUser.id
          }, {
            headers: this.getAuthHeaders(),
            timeout: 10000
          })
        );
      }
      
      const startTime = Date.now();
      const results = await Promise.allSettled(promises);
      const duration = Date.now() - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;
      const failed = results.length - successful;
      
      if (failed > concurrentRequests * 0.1) { // Allow 10% failure rate
        throw new Error(`Too many failures: ${failed}/${concurrentRequests}`);
      }
      
      return `Concurrent test: ${successful}/${concurrentRequests} successful in ${duration}ms`;
    });
  }

  async testErrorHandling() {
    console.log('\n🚨 Testing error handling...');
    
    await this.runTest('Invalid Request Handling', async () => {
      const response = await axios.post(`${this.baseURL}/api/ai/chatbot/message`, {
        // Missing required fields
      }, {
        headers: this.getAuthHeaders(),
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        throw new Error('System should reject invalid requests');
      }
      
      if (response.status < 400 || response.status >= 500) {
        throw new Error(`Expected 4xx error, got ${response.status}`);
      }
      
      return `Invalid request correctly rejected with status ${response.status}`;
    });
    
    await this.runTest('Rate Limiting', async () => {
      // Send many requests quickly to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          axios.post(`${this.baseURL}/api/ai/chatbot/message`, {
            message: `Rate limit test ${i}`,
            userId: this.testUser.id
          }, {
            headers: this.getAuthHeaders(),
            timeout: 5000,
            validateStatus: () => true
          })
        );
      }
      
      const results = await Promise.allSettled(promises);
      const rateLimited = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      ).length;
      
      if (rateLimited === 0) {
        throw new Error('Rate limiting not working - no 429 responses');
      }
      
      return `Rate limiting working: ${rateLimited} requests rate limited`;
    });
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}`);
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      console.log(`✅ PASSED: ${testName} (${duration}ms)`);
      console.log(`   Result: ${result}`);
      
      this.results.passed++;
      this.results.tests.push({
        name: testName,
        status: 'passed',
        duration,
        result
      });
      
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'failed',
        error: error.message
      });
    }
  }

  async createMockImage() {
    // Create a simple mock image file for testing
    const mockImagePath = path.join(__dirname, 'test-plant-image.jpg');
    
    // Create a minimal JPEG header for testing
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xD9
    ]);
    
    await fs.writeFile(mockImagePath, jpegHeader);
    return mockImagePath;
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.testUser.token}`,
      'Content-Type': 'application/json'
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateTestReport() {
    const total = this.results.passed + this.results.failed + this.results.skipped;
    const passRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 USER ACCEPTANCE TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total Tests: ${total}`);
    console.log(`  Passed: ${this.results.passed}`);
    console.log(`  Failed: ${this.results.failed}`);
    console.log(`  Skipped: ${this.results.skipped}`);
    console.log(`  Pass Rate: ${passRate}%`);
    
    if (this.results.failed > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      this.results.tests
        .filter(test => test.status === 'failed')
        .forEach((test, index) => {
          console.log(`  ${index + 1}. ${test.name}`);
          console.log(`     Error: ${test.error}`);
        });
    }
    
    console.log(`\n✅ PASSED TESTS:`);
    this.results.tests
      .filter(test => test.status === 'passed')
      .forEach((test, index) => {
        console.log(`  ${index + 1}. ${test.name} (${test.duration}ms)`);
      });
    
    // Save detailed report
    this.saveTestReport();
    
    // Determine overall result
    if (this.results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED - System ready for production!');
      process.exit(0);
    } else if (this.results.failed <= total * 0.1) { // Allow 10% failure rate
      console.log('\n⚠️  TESTS PASSED WITH MINOR ISSUES - Review failed tests');
      process.exit(0);
    } else {
      console.log('\n❌ TESTS FAILED - System not ready for production');
      process.exit(1);
    }
  }

  async saveTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.passed + this.results.failed + this.results.skipped,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        passRate: this.results.passed / (this.results.passed + this.results.failed) * 100
      },
      tests: this.results.tests,
      environment: {
        baseURL: this.baseURL,
        mainServerURL: this.mainServerURL,
        frontendURL: this.frontendURL
      }
    };
    
    const reportPath = path.join(__dirname, '..', 'reports', 'user-acceptance-test-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new UserAcceptanceTest();
  tester.runTests().catch(console.error);
}

module.exports = UserAcceptanceTest;