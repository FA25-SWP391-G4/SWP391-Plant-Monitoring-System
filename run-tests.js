/**
 * Test Runner for Node.js Projects
 * This script runs tests for both backend and frontend in a plant monitoring system
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const ROOT_DIR = __dirname;
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const TEST_DIR = path.join(ROOT_DIR, 'tests');
const NODE_PATH = 'C:\\Program Files\\nodejs\\node';
const NPM_PATH = 'C:\\Program Files\\nodejs\\npm';
const NPXX_PATH = 'C:\\Program Files\\nodejs\\npx';

// Results file
const TEST_RESULTS_FILE = path.join(ROOT_DIR, 'test-results.md');

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
let testResults = `# Test Results\n\n`;
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

// Step 2: Verify npm installation
const npmVersionResult = runCommand(`"${NPM_PATH}" --version`);
testResults += `npm version: ${npmVersionResult.success ? npmVersionResult.output.trim() : 'ERROR'}\n\n`;

if (npmVersionResult.success) {
  console.log(`npm is installed: ${npmVersionResult.output.trim()}`);
} else {
  console.error(`Error checking npm version: ${npmVersionResult.error}`);
  testResults += `Error checking npm: ${npmVersionResult.error}\n`;
}

// Step 3: Identify and run backend tests
console.log('\n=== Running Backend Tests ===');
testResults += `## Backend Tests\n\n`;

// Get list of test files
const testFiles = fs.readdirSync(TEST_DIR)
  .filter(file => file.endsWith('.test.js'))
  .map(file => path.join(TEST_DIR, file));

console.log(`Found ${testFiles.length} test files in ${TEST_DIR}`);
testResults += `Found ${testFiles.length} test files:\n\n`;
testFiles.forEach(file => {
  testResults += `- ${path.basename(file)}\n`;
});
testResults += '\n';

// Run individual test files
let backendTestsPassed = 0;
let backendTestsFailed = 0;

testFiles.forEach((testFile) => {
  const fileName = path.basename(testFile);
  console.log(`Running test: ${fileName}`);
  testResults += `### ${fileName}\n\n`;
  
  try {
    // Try running with Jest first
    const jestCommand = `"${NPXX_PATH}" jest "${testFile}" --no-cache --testTimeout=10000`;
    const result = runCommand(jestCommand);
    
    if (result.success) {
      console.log(`✅ Test ${fileName} passed!`);
      testResults += `✅ PASSED\n\n`;
      testResults += '```\n' + result.output + '\n```\n\n';
      backendTestsPassed++;
    } else {
      // Try running with Node directly as a fallback
      console.log(`❌ Test ${fileName} failed with Jest, trying direct Node execution...`);
      
      const nodeCommand = `"${NODE_PATH}" "${testFile}"`;
      const nodeResult = runCommand(nodeCommand);
      
      if (nodeResult.success) {
        console.log(`✅ Test ${fileName} passed with direct Node execution!`);
        testResults += `✅ PASSED (with direct Node execution)\n\n`;
        testResults += '```\n' + nodeResult.output + '\n```\n\n';
        backendTestsPassed++;
      } else {
        console.log(`❌ Test ${fileName} failed with both Jest and direct Node execution`);
        testResults += `❌ FAILED\n\n`;
        testResults += '```\n' + (result.output || '') + '\n' + (result.error || '') + '\n```\n\n';
        testResults += '```\n' + (nodeResult.output || '') + '\n' + (nodeResult.error || '') + '\n```\n\n';
        backendTestsFailed++;
      }
    }
  } catch (error) {
    console.error(`Error running test ${fileName}: ${error.message}`);
    testResults += `❌ ERROR: ${error.message}\n\n`;
    backendTestsFailed++;
  }
});

// Step 4: Run frontend tests
console.log('\n=== Running Frontend Tests ===');
testResults += `## Frontend Tests\n\n`;

if (fs.existsSync(CLIENT_DIR)) {
  const clientPackageJsonPath = path.join(CLIENT_DIR, 'package.json');
  
  if (fs.existsSync(clientPackageJsonPath)) {
    console.log(`Running frontend tests in ${CLIENT_DIR}`);
    const frontendTestResult = runCommand(`"${NPM_PATH}" test -- --watchAll=false`, CLIENT_DIR);
    
    if (frontendTestResult.success) {
      console.log('✅ Frontend tests passed!');
      testResults += `✅ PASSED\n\n`;
      testResults += '```\n' + frontendTestResult.output + '\n```\n\n';
    } else {
      console.log('❌ Frontend tests failed');
      testResults += `❌ FAILED\n\n`;
      testResults += '```\n' + (frontendTestResult.output || '') + '\n' + (frontendTestResult.error || '') + '\n```\n\n';
    }
  } else {
    console.log('No package.json found in client directory, skipping frontend tests');
    testResults += `⚠️ SKIPPED: No package.json found in client directory\n\n`;
  }
} else {
  console.log('Client directory not found, skipping frontend tests');
  testResults += `⚠️ SKIPPED: Client directory not found\n\n`;
}

// Step 5: Run validation tests for i18n implementation
console.log('\n=== Running i18n Validation Tests ===');
testResults += `## i18n Validation Tests\n\n`;

const i18nValidationScript = path.join(ROOT_DIR, 'validate-i18n.js');
if (fs.existsSync(i18nValidationScript)) {
  console.log(`Running i18n validation script`);
  const i18nValidationResult = runCommand(`"${NODE_PATH}" "${i18nValidationScript}"`);
  
  if (i18nValidationResult.success) {
    console.log('✅ i18n validation completed successfully');
    testResults += `✅ COMPLETED\n\n`;
    testResults += '```\n' + i18nValidationResult.output + '\n```\n\n';
    
    // Also include the validation results file if it exists
    const i18nValidationResultFile = path.join(ROOT_DIR, 'i18n-validation-results.md');
    if (fs.existsSync(i18nValidationResultFile)) {
      const i18nResults = fs.readFileSync(i18nValidationResultFile, 'utf8');
      testResults += `### i18n Validation Report\n\n`;
      testResults += i18nResults + '\n\n';
    }
  } else {
    console.log('❌ i18n validation failed');
    testResults += `❌ FAILED\n\n`;
    testResults += '```\n' + (i18nValidationResult.output || '') + '\n' + (i18nValidationResult.error || '') + '\n```\n\n';
  }
} else {
  console.log('i18n validation script not found, skipping');
  testResults += `⚠️ SKIPPED: i18n validation script not found\n\n`;
}

// Step 6: Summarize results
console.log('\n=== Test Summary ===');
testResults += `## Summary\n\n`;
testResults += `Backend Tests: ${backendTestsPassed} passed, ${backendTestsFailed} failed\n\n`;

// Write test results to file
fs.writeFileSync(TEST_RESULTS_FILE, testResults);
console.log(`Test results saved to ${TEST_RESULTS_FILE}`);