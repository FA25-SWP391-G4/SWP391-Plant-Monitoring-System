require('dotenv').config();

async function testTensorFlowLocal() {
    console.log('🧪 Testing TensorFlow.js from AI Service Directory...\n');
    
    try {
        // Test 1: Import TensorFlow
        console.log('1️⃣  Testing TensorFlow.js import...');
        const tf = require('@tensorflow/tfjs-node');
        console.log('✅ TensorFlow.js imported successfully');
        console.log('   Version:', tf.version.tfjs);
        
        // Test 2: Simple operations
        console.log('\n2️⃣  Testing basic operations...');
        const a = tf.tensor([1, 2, 3, 4]);
        const b = tf.tensor([5, 6, 7, 8]);
        const c = a.add(b);
        
        const result = await c.data();
        console.log('✅ Basic operations working');
        console.log('   Result:', Array.from(result));
        
        a.dispose();
        b.dispose();
        c.dispose();
        
        // Test 3: AI Utils
        console.log('\n3️⃣  Testing AI Utils...');
        const aiUtils = require('./services/aiUtils');
        
        const initialized = await aiUtils.initializeTensorFlow();
        console.log('✅ AI Utils test result:', initialized);
        
        if (initialized) {
            console.log('   TensorFlow backend:', tf.getBackend());
            
            // Test prediction
            const sensorData = {
                moisture: 25,
                temperature: 28,
                humidity: 45,
                lightLevel: 70
            };
            
            const prediction = await aiUtils.predictWateringNeeds(sensorData);
            console.log('✅ Watering prediction test:');
            console.log('   Needs watering:', prediction.needsWatering);
            console.log('   Confidence:', prediction.confidence);
            console.log('   Recommendation:', prediction.recommendation);
            console.log('   Source:', prediction.source);
        }
        
        console.log('\n🎉 All tests passed! TensorFlow.js is working correctly.');
        
    } catch (error) {
        console.log('\n❌ Test failed:', error.message);
        
        if (error.message.includes('Cannot find module')) {
            console.log('\n💡 Module not found. Checking installation...');
            const fs = require('fs');
            const path = require('path');
            
            const nodeModulesPath = './node_modules/@tensorflow';
            if (fs.existsSync(nodeModulesPath)) {
                console.log('✅ TensorFlow modules exist in node_modules');
                const tfDirs = fs.readdirSync(nodeModulesPath);
                console.log('   Available modules:', tfDirs);
            } else {
                console.log('❌ TensorFlow modules not found in node_modules');
            }
        } else {
            console.log('Stack:', error.stack);
        }
    }
}

testTensorFlowLocal();