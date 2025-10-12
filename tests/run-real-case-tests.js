/**
 * Real Case Scenario Test Runner
 * This script runs tests with dummy IoT inputs to simulate real scenarios
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define paths and configuration
const testOutputFile = path.join(__dirname, 'test-results.md');
const testReportFile = path.join(__dirname, 'controller-test-results.md');

// Create mock data for IoT inputs
const mockIoTData = {
  temperature: 27.5,
  humidity: 65.3,
  moisture: 42.8,
  light: 5670
};

// Set environment variables for the tests
process.env.TEST_MODE = 'real-case';
process.env.IOT_MOCK_DATA = JSON.stringify(mockIoTData);

console.log('Starting Real Case Scenario Tests');
console.log('------------------------------------');
console.log('Using mock IoT data:', mockIoTData);

// Helper function to run a test and capture output
function runTest(testPattern, description) {
  console.log(`\nRunning ${description}...`);
  
  try {
    // Run the test using Jest
    const output = execSync(`npx jest ${testPattern} --verbose`, { 
      encoding: 'utf8',
      env: { ...process.env }
    });
    
    console.log('✅ Test completed successfully');
    return { success: true, output };
  } 
  catch (error) {
    console.log('❌ Test failed');
    console.error(error.stdout || error.message);
    return { success: false, output: error.stdout || error.message };
  }
}

// Create a clean test report file
fs.writeFileSync(testReportFile, '# Controller Test Results\n\n', 'utf8');

// Run controller tests individually with detailed reporting
const controllers = [
  { name: 'Auth Controller', pattern: 'auth-simplified.test.js' },
  { name: 'Email Service', pattern: 'real-case-email.test.js' },  // Use our fixed email test instead
  { name: 'User Controller', pattern: 'user-controller.test.js' },
  { name: 'Plant Controller', pattern: 'plant-controller.test.js' },
  { name: 'AI Controller', pattern: 'ai-controller.test.js' },
  { name: 'Notification Controller', pattern: 'notification-controller.test.js' },
  { name: 'Admin Controller', pattern: 'admin-controller.test.js' },
  { name: 'Language Controller', pattern: 'language-controller.test.js' },
  { name: 'Payment Controller', pattern: 'payment-controller.test.js' },
  { name: 'Sensor Controller', pattern: 'sensor-controller.test.js' }
];

let totalTests = 0;
let passedTests = 0;

controllers.forEach(controller => {
  fs.appendFileSync(testReportFile, `\n## ${controller.name} Tests\n\n`, 'utf8');
  
  const result = runTest(controller.pattern, `${controller.name} Tests`);
  totalTests++;
  
  if (result.success) {
    passedTests++;
    fs.appendFileSync(testReportFile, '✅ All tests passed\n\n', 'utf8');
    
    // Extract test results for successful runs
    const successLines = result.output
      .split('\n')
      .filter(line => line.includes('PASS') || line.includes('test completed'))
      .join('\n');
      
    fs.appendFileSync(testReportFile, '```\n' + successLines + '\n```\n\n', 'utf8');
  } else {
    fs.appendFileSync(testReportFile, '❌ Tests failed\n\n', 'utf8');
    
    // Extract failure messages for better readability
    const failureLines = result.output
      .split('\n')
      .filter(line => 
        line.includes('FAIL') || 
        line.includes('Error:') || 
        line.includes('expect(') ||
        line.includes('Received')
      )
      .join('\n');
      
    fs.appendFileSync(testReportFile, '```\n' + failureLines + '\n```\n\n', 'utf8');
  }
});

// Run i18n validation tests
const i18nResult = runTest('tests/i18n-validation.test.js', 'i18n Validation');
totalTests++;
if (i18nResult.success) passedTests++;

// Write summary to report file
fs.appendFileSync(testReportFile, `\n## Summary\n\n`, 'utf8');
fs.appendFileSync(testReportFile, `- Tests Run: ${totalTests}\n`, 'utf8');
fs.appendFileSync(testReportFile, `- Tests Passed: ${passedTests}\n`, 'utf8');
fs.appendFileSync(testReportFile, `- Tests Failed: ${totalTests - passedTests}\n`, 'utf8');
fs.appendFileSync(testReportFile, `- Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`, 'utf8');

console.log('\nTest Execution Complete');
console.log('------------------------------------');
console.log(`Tests Run: ${totalTests}`);
console.log(`Tests Passed: ${passedTests}`);
console.log(`Tests Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
console.log(`Detailed results saved to: ${testReportFile}`);