#!/usr/bin/env node

/**
 * AI Service Startup and Testing Script
 * Khởi động AI service và chạy tests tự động
 */

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

const AI_SERVICE_URL = 'http://localhost:3001';
const MAX_WAIT_TIME = 30000; // 30 seconds
const CHECK_INTERVAL = 2000; // 2 seconds

let serverProcess = null;

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForService(url, maxWaitTime = MAX_WAIT_TIME) {
  log(`Waiting for service to start at ${url}...`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      if (response.status === 200) {
        log(`Service is ready! Health check passed.`, 'success');
        return true;
      }
    } catch (error) {
      // Service not ready yet, continue waiting
    }
    
    await sleep(CHECK_INTERVAL);
  }
  
  log(`Service failed to start within ${maxWaitTime / 1000} seconds`, 'error');
  return false;
}

function startAIService() {
  return new Promise((resolve, reject) => {
    log('Starting AI Service...');
    
    // Change to ai-service directory (current directory)
    const aiServicePath = __dirname;
    
    serverProcess = spawn('node', ['app.js'], {
      cwd: aiServicePath,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let output = '';
    let errorOutput = '';

    serverProcess.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      log(`[AI Service] ${message.trim()}`);
      
      // Check if service is ready
      if (message.includes('AI Service đang chạy trên cổng')) {
        resolve(true);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      log(`[AI Service Error] ${message.trim()}`, 'error');
    });

    serverProcess.on('close', (code) => {
      if (code !== 0) {
        log(`AI Service exited with code ${code}`, 'error');
        reject(new Error(`Service exited with code ${code}`));
      }
    });

    serverProcess.on('error', (error) => {
      log(`Failed to start AI Service: ${error.message}`, 'error');
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverProcess.killed) {
        log('Service startup timeout reached', 'warning');
        resolve(false);
      }
    }, MAX_WAIT_TIME);
  });
}

async function runTests() {
  log('Running comprehensive tests...');
  
  try {
    const testScript = require('./test-all-features.js');
    await testScript.runAllTests();
    return true;
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    return false;
  }
}

function stopAIService() {
  if (serverProcess && !serverProcess.killed) {
    log('Stopping AI Service...');
    serverProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        log('Force stopping AI Service...', 'warning');
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

async function main() {
  log('🚀 AI Service Testing Suite Starting...');
  
  try {
    // Step 1: Start AI Service
    const serviceStarted = await startAIService();
    if (!serviceStarted) {
      throw new Error('Failed to start AI Service');
    }

    // Step 2: Wait for service to be ready
    const serviceReady = await waitForService(AI_SERVICE_URL);
    if (!serviceReady) {
      throw new Error('Service not ready within timeout');
    }

    // Step 3: Run tests
    const testsPassed = await runTests();
    
    if (testsPassed) {
      log('🎉 All tests completed successfully!', 'success');
    } else {
      log('⚠️ Some tests failed. Check the output above.', 'warning');
    }

  } catch (error) {
    log(`❌ Testing suite failed: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    // Cleanup
    stopAIService();
    log('🏁 Testing suite finished.');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('Received SIGINT, cleaning up...', 'warning');
  stopAIService();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, cleaning up...', 'warning');
  stopAIService();
  process.exit(0);
});

// Run main function
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  startAIService,
  waitForService,
  runTests,
  stopAIService
};