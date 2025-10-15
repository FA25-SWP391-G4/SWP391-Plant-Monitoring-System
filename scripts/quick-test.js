#!/usr/bin/env node

/**
 * Quick Test Script for Local Development
 * Tests basic functionality of AI services
 */

const axios = require('axios').default;

class QuickTester {
  constructor() {
    this.baseURL = 'http://localhost:3001';
    this.mainURL = 'http://localhost:3010';
  }

  async runTests() {
    console.log('🧪 Running Quick Tests...');
    console.log('=' .repeat(40));
    
    await this.testHealthChecks();
    await this.testChatbot();
    await this.testIrrigation();
    
    console.log('\n✅ Quick tests completed!');
  }

  async testHealthChecks() {
    console.log('\n🏥 Testing Health Checks...');
    
    try {
      const aiHealth = await axios.get(`${this.baseURL}/api/ai/health`);
      console.log('✅ AI Service health:', aiHealth.data.status);
    } catch (error) {
      console.log('❌ AI Service health failed');
    }
    
    try {
      const mainHealth = await axios.get(`${this.mainURL}/health`);
      console.log('✅ Main Server health: OK');
    } catch (error) {
      console.log('❌ Main Server health failed');
    }
  }

  async testChatbot() {
    console.log('\n💬 Testing Chatbot...');
    
    try {
      const response = await axios.post(`${this.baseURL}/api/ai/chatbot/message`, {
        message: 'Cây của tôi có lá vàng',
        userId: 1
      });
      
      console.log('✅ Chatbot response:', response.data.response?.substring(0, 50) + '...');
    } catch (error) {
      console.log('❌ Chatbot test failed:', error.message);
    }
  }

  async testIrrigation() {
    console.log('\n💧 Testing Irrigation Prediction...');
    
    try {
      const response = await axios.post(`${this.baseURL}/api/ai/irrigation/predict/1`, {
        sensorData: {
          soilMoisture: 45,
          temperature: 28,
          humidity: 65,
          lightLevel: 800
        }
      });
      
      console.log('✅ Irrigation prediction:', response.data.prediction?.shouldWater);
    } catch (error) {
      console.log('❌ Irrigation test failed:', error.message);
    }
  }
}

if (require.main === module) {
  const tester = new QuickTester();
  tester.runTests().catch(console.error);
}

module.exports = QuickTester;