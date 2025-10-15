#!/usr/bin/env node

/**
 * Simple Debug Script for AI Service
 * Script đơn giản để debug các vấn đề cơ bản
 */

console.log('🔍 AI Service Debug Script');
console.log('='.repeat(40));

// Test 1: Check Node.js version
console.log('\n1. Checking Node.js version...');
console.log(`   Node.js: ${process.version}`);
console.log(`   Platform: ${process.platform}`);

// Test 2: Check if required modules can be loaded
console.log('\n2. Checking required modules...');
try {
  const express = require('express');
  console.log('   ✅ express loaded');
} catch (error) {
  console.log('   ❌ express failed:', error.message);
}

try {
  const axios = require('axios');
  console.log('   ✅ axios loaded');
} catch (error) {
  console.log('   ❌ axios failed:', error.message);
}

try {
  const cors = require('cors');
  console.log('   ✅ cors loaded');
} catch (error) {
  console.log('   ❌ cors failed:', error.message);
}

try {
  const dotenv = require('dotenv');
  console.log('   ✅ dotenv loaded');
} catch (error) {
  console.log('   ❌ dotenv failed:', error.message);
}

// Test 3: Check if app.js can be loaded
console.log('\n3. Checking app.js...');
try {
  const app = require('./app.js');
  console.log('   ✅ app.js loaded successfully');
} catch (error) {
  console.log('   ❌ app.js failed:', error.message);
  console.log('   Stack trace:', error.stack);
}

// Test 4: Check if controllers can be loaded
console.log('\n4. Checking controllers...');
const controllers = [
  'chatbotController',
  'irrigationPredictionController',
  'earlyWarningController',
  'automationController',
  'selfLearningController',
  'historicalAnalysisController',
  'imageRecognitionController'
];

controllers.forEach(controllerName => {
  try {
    const controller = require(`./controllers/${controllerName}.js`);
    console.log(`   ✅ ${controllerName} loaded`);
  } catch (error) {
    console.log(`   ❌ ${controllerName} failed:`, error.message);
  }
});

// Test 5: Check if services can be loaded
console.log('\n5. Checking services...');
const services = [
  'sensorService',
  'aiPredictionService',
  'earlyWarningService',
  'automationService',
  'selfLearningService',
  'irrigationOptimizationService'
];

services.forEach(serviceName => {
  try {
    const service = require(`./services/${serviceName}.js`);
    console.log(`   ✅ ${serviceName} loaded`);
  } catch (error) {
    console.log(`   ❌ ${serviceName} failed:`, error.message);
  }
});

// Test 6: Check if routes can be loaded
console.log('\n6. Checking routes...');
const routes = [
  'aiRoutes',
  'chatbot',
  'irrigation',
  'irrigationSchedule',
  'historicalAnalysis',
  'selfLearning',
  'imageRecognition'
];

routes.forEach(routeName => {
  try {
    const route = require(`./routes/${routeName}.js`);
    console.log(`   ✅ ${routeName} loaded`);
  } catch (error) {
    console.log(`   ❌ ${routeName} failed:`, error.message);
  }
});

console.log('\n' + '='.repeat(40));
console.log('🔍 Debug check completed!');
console.log('\n💡 If you see any ❌ errors above, those need to be fixed first.');
console.log('   Run: npm install to install missing dependencies');
console.log('   Then try: npm start to run the service');
