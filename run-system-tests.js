#!/usr/bin/env node

/**
 * Simple System Test Runner
 * Entry point for running comprehensive system tests
 * Requirements: 4.1, 4.2, 4.3
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Comprehensive System Testing Suite');
console.log('=' .repeat(60));

// Check if AI service is running
const axios = require('axios');

async function checkServices() {
  console.log('🔍 Checking service availability...');
  
  try {
    await axios.get('http://localhost:3001/api/health', { timeout: 5000 });
    console.log('✅ AI Service is running on port 3001');
    return true;
  } catch (error) {
    console.log('❌ AI Service is not available on port 3001');
    console.log('   Please start the AI service first:');
    console.log('   cd ai-service && npm start');
    return false;
  }
}

async function runSystemTests() {
  const servicesAvailable = await checkServices();
  
  if (!servicesAvailable) {
    console.log('\n🛑 Cannot proceed without required services');
    process.exit(1);
  }

  console.log('\n🧪 Launching comprehensive system tests...');
  console.log('   This may take 15-25 minutes to complete');
  console.log('   Reports will be generated in the tests/ directory\n');

  // Run the comprehensive system tests with proper Node.js flags
  const testProcess = spawn('node', [
    '--expose-gc',
    '--max-old-space-size=4096',
    path.join(__dirname, 'tests', 'run-comprehensive-system-tests.js')
  ], {
    stdio: 'inherit',
    cwd: __dirname
  });

  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n🎉 System testing completed successfully!');
      console.log('📊 Check the tests/ directory for detailed reports');
    } else {
      console.log('\n❌ System testing failed');
      console.log('📊 Check the failure reports in tests/ directory');
    }
    process.exit(code);
  });

  testProcess.on('error', (error) => {
    console.error('\n❌ Failed to start system tests:', error);
    process.exit(1);
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 System testing interrupted');
  process.exit(1);
});

// Run the tests
runSystemTests().catch(error => {
  console.error('❌ Error starting system tests:', error);
  process.exit(1);
});