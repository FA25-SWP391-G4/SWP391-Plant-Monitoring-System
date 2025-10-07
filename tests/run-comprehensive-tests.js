const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define paths
const rootDir = __dirname;
const clientDir = path.join(rootDir, 'client');
const testsDir = path.join(rootDir, 'tests');
const nodePath = 'C:\\Program Files\\nodejs\\node';
const npmPath = 'C:\\Program Files\\nodejs\\npm';

console.log('Starting comprehensive test execution');
console.log('Root directory:', rootDir);
console.log('Client directory:', clientDir);
console.log('Tests directory:', testsDir);

// Function to run a command and capture output
function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`Running command: ${command} in ${cwd || rootDir}`);
    
    exec(command, { cwd: cwd || rootDir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command failed with error: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }
      
      console.log(`stdout: ${stdout}`);
      if (stderr) console.error(`stderr: ${stderr}`);
      resolve(stdout);
    });
  });
}

// Main execution function
async function runTests() {
  try {
    // 1. Check Node.js and npm versions
    await runCommand(`"${nodePath}" --version`);
    await runCommand(`"${npmPath}" --version`);
    
    // 2. Check if the test files exist
    const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js'));
    console.log('Found test files:', testFiles);
    
    // 3. Run backend tests using Jest directly
    try {
      console.log('Running backend tests...');
      await runCommand(`"${npmPath}" test`);
    } catch (err) {
      console.error('Backend tests failed:', err.message);
    }
    
    // 4. Run frontend tests using React Scripts
    try {
      console.log('Running frontend tests...');
      await runCommand(`"${npmPath}" test`, clientDir);
    } catch (err) {
      console.error('Frontend tests failed:', err.message);
    }
    
    console.log('Test execution complete');
  } catch (error) {
    console.error('Test execution failed:', error.message);
  }
}

runTests().catch(console.error);