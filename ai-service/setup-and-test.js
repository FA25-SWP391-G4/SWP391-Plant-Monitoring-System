#!/usr/bin/env node

/**
 * AI Service Setup and Test Script
 * Script để cài đặt dependencies và test
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 AI Service Setup and Test');
console.log('='.repeat(50));

async function setupAndTest() {
  try {
    // Step 1: Check if package.json exists
    console.log('\n📦 Step 1: Checking package.json...');
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found!');
    }
    console.log('   ✅ package.json found');
    
    // Step 2: Install dependencies
    console.log('\n📥 Step 2: Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('   ✅ Dependencies installed');
    } catch (error) {
      console.log('   ⚠️ npm install failed, trying with --force...');
      try {
        execSync('npm install --force', { stdio: 'inherit' });
        console.log('   ✅ Dependencies installed with --force');
      } catch (forceError) {
        console.log('   ❌ npm install failed completely');
        throw forceError;
      }
    }
    
    // Step 3: Test step by step
    console.log('\n🔍 Step 3: Testing step by step...');
    try {
      execSync('node test-step-by-step.js', { stdio: 'inherit' });
      console.log('   ✅ Step-by-step test passed');
    } catch (error) {
      console.log('   ❌ Step-by-step test failed');
      throw error;
    }
    
    // Step 4: Try to start the service
    console.log('\n🚀 Step 4: Starting AI Service...');
    console.log('   Starting service in background...');
    
    const { spawn } = require('child_process');
    const serverProcess = spawn('node', ['app.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });
    
    let serverStarted = false;
    let serverError = null;
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`   [Server] ${output.trim()}`);
      
      if (output.includes('AI Service đang chạy trên cổng')) {
        serverStarted = true;
        console.log('   ✅ AI Service started successfully!');
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.log(`   [Server Error] ${error.trim()}`);
      serverError = error;
    });
    
    // Wait for server to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!serverStarted) {
          serverProcess.kill();
          reject(new Error('Server failed to start within timeout'));
        }
      }, 10000);
      
      serverProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0 && !serverStarted) {
          reject(new Error(`Server exited with code ${code}`));
        } else {
          resolve();
        }
      });
      
      if (serverStarted) {
        clearTimeout(timeout);
        resolve();
      }
    });
    
    // Step 5: Test API endpoints
    console.log('\n🌐 Step 5: Testing API endpoints...');
    
    const axios = require('axios');
    const AI_SERVICE_URL = 'http://localhost:3001';
    
    try {
      // Test health endpoint
      const healthResponse = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
      console.log('   ✅ Health endpoint working');
      console.log(`   📊 Status: ${healthResponse.data.status}`);
      
      // Test chatbot endpoint
      const chatbotResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/chatbot/message`, {
        message: 'Test message',
        userId: 'test_user',
        plantId: '1'
      }, { timeout: 10000 });
      
      console.log('   ✅ Chatbot endpoint working');
      console.log(`   💬 Response: ${chatbotResponse.data.success ? 'Success' : 'Failed'}`);
      
    } catch (apiError) {
      console.log('   ❌ API test failed:', apiError.message);
      throw apiError;
    }
    
    // Cleanup
    serverProcess.kill();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Setup and test completed successfully!');
    console.log('✅ AI Service is working correctly!');
    console.log('\n💡 You can now:');
    console.log('   1. Run: npm start');
    console.log('   2. Test with: node quick-test.js');
    console.log('   3. Access: http://localhost:3001');
    
  } catch (error) {
    console.log('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure Node.js is installed');
    console.log('   2. Check internet connection for npm install');
    console.log('   3. Check if port 3001 is available');
    console.log('   4. Run: npm install --force');
  }
}

// Run setup
setupAndTest();
