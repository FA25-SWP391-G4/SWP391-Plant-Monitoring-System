/**
 * Simple test runner script to diagnose issues with Jest
 */
console.log('Starting test runner...');

try {
  // Print node and npm versions
  console.log('Node version:', process.version);
  console.log('NPM version:', require('child_process').execSync('"C:\\Program Files\\nodejs\\npm" -v').toString());
  
  // Check if Jest is installed
  try {
    const jestPath = require.resolve('jest');
    console.log('Jest is installed at:', jestPath);
  } catch (err) {
    console.error('Jest is not installed properly:', err.message);
  }
  
  // Check for test files
  const fs = require('fs');
  const testDir = __dirname + '/tests';
  console.log('Looking for test files in:', testDir);
  
  if (fs.existsSync(testDir)) {
    const files = fs.readdirSync(testDir);
    const testFiles = files.filter(f => f.endsWith('.test.js'));
    console.log('Found test files:', testFiles);
  } else {
    console.error('Test directory not found');
  }
  
  // Try running a simple test with Jest programmatically
  console.log('Trying to run Jest programmatically...');
  try {
    const jest = require('jest');
    jest.run(['--no-cache', '--verbose']);
  } catch (err) {
    console.error('Failed to run Jest:', err);
  }
} catch (err) {
  console.error('Error in test runner:', err);
}