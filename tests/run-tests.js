/**
 * Test Runner Script
 * Runs tests and outputs results to a file
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define paths
const projectRoot = process.cwd();
const testOutputPath = path.join(projectRoot, 'test-results.txt');

console.log('Starting test runner...');
console.log(`Output will be saved to: ${testOutputPath}`);

// Create or clear the output file
fs.writeFileSync(testOutputPath, '=== TEST RESULTS ===\n\n', 'utf8');

// Helper function to append to the output file
function appendToOutput(text) {
  fs.appendFileSync(testOutputPath, text + '\n', 'utf8');
}

// Helper function to run a test and capture output
function runTest(testPath, description) {
  appendToOutput(`\n=== ${description} ===\n`);
  try {
    const npxPath = path.join('C:\\Program Files\\nodejs\\npx');
    const output = execSync(`"${npxPath}" jest ${testPath} --verbose`, { encoding: 'utf8' });
    appendToOutput(output);
    appendToOutput(`✅ ${description} completed successfully.\n`);
    return true;
  } catch (error) {
    appendToOutput(`❌ ${description} failed with error:`);
    appendToOutput(error.stdout || error.message);
    return false;
  }
}

// Run the tests
let passedTests = 0;
let totalTests = 0;

// Test 1: Frontend-Backend Mapping Tests
totalTests++;
if (runTest('tests/frontend-backend-mapping.test.js', 'Frontend-Backend Mapping Tests')) {
  passedTests++;
}

// Test 2: Language API Tests
totalTests++;
if (runTest('tests/language-api.test.js', 'Language API Tests')) {
  passedTests++;
}

// Test 3: Frontend Rendering Tests with i18n
// These might need to be run separately since they're React tests
appendToOutput('\n=== Frontend Rendering Tests with i18n ===\n');
appendToOutput('Frontend rendering tests need to be run from the client directory.\n');

// Final summary
appendToOutput('\n=== SUMMARY ===\n');
appendToOutput(`Tests Run: ${totalTests}`);
appendToOutput(`Tests Passed: ${passedTests}`);
appendToOutput(`Tests Failed: ${totalTests - passedTests}`);
appendToOutput(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

console.log('Test runner completed.');
console.log(`Passed ${passedTests} out of ${totalTests} tests.`);
console.log(`Check ${testOutputPath} for detailed results.`);