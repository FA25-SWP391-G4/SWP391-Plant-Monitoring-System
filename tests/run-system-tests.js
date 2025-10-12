/**
 * Run all system controller tests
 * This script runs all the critical controller tests for the plant system
 */

const { exec } = require('child_process');
const path = require('path');

// List of test files to run
const testFiles = [
    'auth-simplified.test.js',
    'language-controller.test.js',
    'plant-controller.test.js',
    'sensor-controller.test.js',
    'user-controller.test.js',  // If available
    'notification-controller.test.js',  // If available
    'vnpay.test.js'  // If available
].map(file => path.join('tests', file));

// Build the command to run tests
const command = `npm test -- ${testFiles.join(' ')}`;

console.log(`Running tests: ${testFiles.join(', ')}`);

// Execute the command
const child = exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error running tests: ${error.message}`);
        return;
    }
    
    if (stderr) {
        console.error(`Test stderr: ${stderr}`);
    }
    
    console.log(stdout);
});

// Forward the output to the console in real-time
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);