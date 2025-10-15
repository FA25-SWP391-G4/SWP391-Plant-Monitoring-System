#!/usr/bin/env node

/**
 * Test Runner for Disease Detection Unit Tests
 * Runs the disease detection tests and reports results
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Disease Detection Unit Tests...\n');

try {
  // Run the specific test file
  const testCommand = 'npx jest tests/disease-detection-unit.test.js --verbose --no-cache';
  
  console.log(`Executing: ${testCommand}\n`);
  
  const output = execSync(testCommand, {
    cwd: __dirname,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log(output);
  console.log('\n✅ Disease Detection Unit Tests completed successfully!');
  
} catch (error) {
  console.error('❌ Test execution failed:');
  console.error(error.stdout || error.message);
  
  if (error.stderr) {
    console.error('\nError details:');
    console.error(error.stderr);
  }
  
  process.exit(1);
}