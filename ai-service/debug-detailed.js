#!/usr/bin/env node

/**
 * AI Service Debug Script
 * Script để debug các lỗi cụ thể
 */

console.log('🔍 AI Service Debug Script');
console.log('='.repeat(40));

// Test 1: Check Node.js version
console.log('\n1. Node.js Information:');
console.log(`   Version: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Architecture: ${process.arch}`);

// Test 2: Check current directory
console.log('\n2. Directory Information:');
console.log(`   Current: ${process.cwd()}`);
console.log(`   __dirname: ${__dirname}`);

// Test 3: Check if key files exist
console.log('\n3. File Existence Check:');
const fs = require('fs');
const path = require('path');

const keyFiles = [
  'package.json',
  'app.js',
  'controllers/chatbotController.js',
  'services/sensorService.js',
  'models/ChatbotLog.js',
  'routes/aiRoutes.js'
];

keyFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Test 4: Check package.json
console.log('\n4. Package.json Check:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`   ✅ Name: ${packageJson.name}`);
  console.log(`   ✅ Version: ${packageJson.version}`);
  console.log(`   ✅ Main: ${packageJson.main}`);
  
  const dependencies = Object.keys(packageJson.dependencies || {});
  console.log(`   ✅ Dependencies: ${dependencies.length} packages`);
  
  // Check critical dependencies
  const criticalDeps = ['express', 'axios', 'cors', 'dotenv'];
  criticalDeps.forEach(dep => {
    const hasDep = dependencies.includes(dep);
    console.log(`   ${hasDep ? '✅' : '❌'} ${dep}`);
  });
  
} catch (error) {
  console.log(`   ❌ Error reading package.json: ${error.message}`);
}

// Test 5: Try to load modules one by one
console.log('\n5. Module Loading Test:');

const modules = [
  { name: 'express', path: 'express' },
  { name: 'axios', path: 'axios' },
  { name: 'cors', path: 'cors' },
  { name: 'dotenv', path: 'dotenv' },
  { name: 'multer', path: 'multer' },
  { name: 'sharp', path: 'sharp' },
  { name: '@tensorflow/tfjs-node', path: '@tensorflow/tfjs-node' }
];

modules.forEach(module => {
  try {
    require(module.path);
    console.log(`   ✅ ${module.name}`);
  } catch (error) {
    console.log(`   ❌ ${module.name}: ${error.message}`);
  }
});

// Test 6: Try to load local files
console.log('\n6. Local File Loading Test:');

const localFiles = [
  { name: 'sensorService', path: './services/sensorService' },
  { name: 'ChatbotLog', path: './models/ChatbotLog' },
  { name: 'Alert', path: './models/Alert' },
  { name: 'Plant', path: './models/Plant' }
];

localFiles.forEach(file => {
  try {
    require(file.path);
    console.log(`   ✅ ${file.name}`);
  } catch (error) {
    console.log(`   ❌ ${file.name}: ${error.message}`);
    if (error.stack) {
      console.log(`      Stack: ${error.stack.split('\n')[1]}`);
    }
  }
});

// Test 7: Check environment
console.log('\n7. Environment Check:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   PORT: ${process.env.PORT || 'not set'}`);

// Test 8: Try to load app.js
console.log('\n8. App.js Loading Test:');
try {
  const app = require('./app.js');
  console.log('   ✅ app.js loaded successfully');
  console.log(`   ✅ App type: ${typeof app}`);
} catch (error) {
  console.log(`   ❌ app.js failed: ${error.message}`);
  console.log(`   Stack trace:`);
  console.log(error.stack);
}

console.log('\n' + '='.repeat(40));
console.log('🔍 Debug completed!');
console.log('\n💡 If you see ❌ errors above:');
console.log('   1. Run: npm install');
console.log('   2. Check file paths');
console.log('   3. Check syntax errors');
console.log('   4. Check missing dependencies');
