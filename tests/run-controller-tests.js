/**
 * Controller Test Runner for Plant Monitoring System
 * This script runs all controller tests to verify functionality
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const ROOT_DIR = __dirname;
const TEST_DIR = path.join(ROOT_DIR, 'tests');
const NODE_PATH = 'C:\\Program Files\\nodejs\\node';
const NPM_PATH = 'C:\\Program Files\\nodejs\\npm';
const NPXX_PATH = 'C:\\Program Files\\nodejs\\npx';

// Results file
const TEST_RESULTS_FILE = path.join(ROOT_DIR, 'controller-test-results.md');

// Core controller test files to run
const CONTROLLER_TEST_FILES = [
  'user-controller.test.js',
  'plant-controller.test.js',
  'sensor-controller.test.js',
  'payment-controller.test.js',
  'notification-controller.test.js',
  'ai-controller.test.js',
  'admin-controller.test.js',
  'vnpay.test.js',
  'language-controller.test.js'
];

// Helper function to run a command and capture output
function runCommand(command, cwd = ROOT_DIR) {
  try {
    console.log(`Running command: ${command} in ${cwd}`);
    const output = execSync(command, { cwd, encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || '', 
      error: error.stderr || error.message || 'Unknown error' 
    };
  }
}

// Start collecting test results
let testResults = `# Controller Test Results\n\n`;
testResults += `_Generated on ${new Date().toLocaleString()}_\n\n`;

// Step 1: Verify Node.js installation
console.log('\n=== Verifying Node.js installation ===');
const nodeVersionResult = runCommand(`"${NODE_PATH}" --version`);
testResults += `## Environment Check\n\n`;
testResults += `Node.js version: ${nodeVersionResult.success ? nodeVersionResult.output.trim() : 'ERROR'}\n`;

if (nodeVersionResult.success) {
  console.log(`Node.js is installed: ${nodeVersionResult.output.trim()}`);
} else {
  console.error(`Error checking Node.js version: ${nodeVersionResult.error}`);
  testResults += `Error checking Node.js: ${nodeVersionResult.error}\n`;
}

// Step 2: Run controller tests
console.log('\n=== Running Controller Tests ===');
testResults += `## Controller Tests\n\n`;

// Get list of controller test files
const testFiles = CONTROLLER_TEST_FILES.map(file => path.join(TEST_DIR, file));

console.log(`Found ${testFiles.length} controller test files`);
testResults += `Running ${testFiles.length} controller test files:\n\n`;
testFiles.forEach(file => {
  testResults += `- ${path.basename(file)}\n`;
});
testResults += '\n';

// Run individual test files
let testsSucceeded = 0;
let testsFailed = 0;

testFiles.forEach((testFile) => {
  const fileName = path.basename(testFile);
  console.log(`Running test: ${fileName}`);
  testResults += `### ${fileName}\n\n`;
  
  try {
    // Run test with Jest
    const jestCommand = `"${NPXX_PATH}" jest "${testFile}" --no-cache --testTimeout=10000`;
    const result = runCommand(jestCommand);
    
    if (result.success) {
      console.log(`✅ Test ${fileName} passed!`);
      testResults += `✅ PASSED\n\n`;
      testResults += '```\n' + result.output + '\n```\n\n';
      testsSucceeded++;
    } else {
      console.log(`❌ Test ${fileName} failed`);
      testResults += `❌ FAILED\n\n`;
      testResults += '```\n' + (result.output || '') + '\n' + (result.error || '') + '\n```\n\n';
      testsFailed++;
    }
  } catch (error) {
    console.error(`Error running test ${fileName}: ${error.message}`);
    testResults += `❌ ERROR: ${error.message}\n\n`;
    testsFailed++;
  }
});

// Step 3: Summarize results
console.log('\n=== Test Summary ===');
testResults += `## Summary\n\n`;
testResults += `Controller Tests: ${testsSucceeded} passed, ${testsFailed} failed\n\n`;

// Write test results to file
fs.writeFileSync(TEST_RESULTS_FILE, testResults);
console.log(`Test results saved to ${TEST_RESULTS_FILE}`);

// Return success status for CI/CD pipelines
if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}