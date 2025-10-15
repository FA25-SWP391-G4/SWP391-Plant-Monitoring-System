#!/usr/bin/env node

/**
 * Simple AI Service Test - Step by Step
 * Test từng bước để tìm lỗi
 */

console.log('🔍 AI Service Step-by-Step Test');
console.log('='.repeat(50));

async function testStepByStep() {
  try {
    // Step 1: Test basic modules
    console.log('\n📦 Step 1: Testing basic modules...');
    
    const express = require('express');
    console.log('   ✅ express loaded');
    
    const axios = require('axios');
    console.log('   ✅ axios loaded');
    
    const cors = require('cors');
    console.log('   ✅ cors loaded');
    
    const dotenv = require('dotenv');
    console.log('   ✅ dotenv loaded');
    
    // Step 2: Test models
    console.log('\n📊 Step 2: Testing models...');
    
    const ChatbotLog = require('./models/ChatbotLog');
    console.log('   ✅ ChatbotLog loaded');
    
    const Alert = require('./models/Alert');
    console.log('   ✅ Alert loaded');
    
    const Plant = require('./models/Plant');
    console.log('   ✅ Plant loaded');
    
    // Step 3: Test services
    console.log('\n⚙️ Step 3: Testing services...');
    
    const sensorService = require('./services/sensorService');
    console.log('   ✅ sensorService loaded');
    
    const aiPredictionService = require('./services/aiPredictionService');
    console.log('   ✅ aiPredictionService loaded');
    
    const earlyWarningService = require('./services/earlyWarningService');
    console.log('   ✅ earlyWarningService loaded');
    
    // Step 4: Test controllers
    console.log('\n🎮 Step 4: Testing controllers...');
    
    const chatbotController = require('./controllers/chatbotController');
    console.log('   ✅ chatbotController loaded');
    
    const irrigationPredictionController = require('./controllers/irrigationPredictionController');
    console.log('   ✅ irrigationPredictionController loaded');
    
    const earlyWarningController = require('./controllers/earlyWarningController');
    console.log('   ✅ earlyWarningController loaded');
    
    // Step 5: Test routes
    console.log('\n🛣️ Step 5: Testing routes...');
    
    const aiRoutes = require('./routes/aiRoutes');
    console.log('   ✅ aiRoutes loaded');
    
    const chatbotRoutes = require('./routes/chatbot');
    console.log('   ✅ chatbotRoutes loaded');
    
    // Step 6: Test app.js
    console.log('\n🚀 Step 6: Testing app.js...');
    
    const app = require('./app.js');
    console.log('   ✅ app.js loaded successfully');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 All steps completed successfully!');
    console.log('✅ AI Service is ready to run!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm start');
    console.log('   2. Test with: node quick-test.js');
    
  } catch (error) {
    console.log('\n❌ Error found:', error.message);
    console.log('Stack trace:', error.stack);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Run: npm install');
    console.log('   2. Check if all files exist');
    console.log('   3. Check for syntax errors');
  }
}

// Run test
testStepByStep();
