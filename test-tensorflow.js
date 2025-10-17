require('dotenv').config({ path: './ai_service/.env' });

async function testTensorFlow() {
    console.log('🧪 Testing TensorFlow.js Setup...\n');
    
    try {
        // Test 1: Check if TensorFlow can be imported
        console.log('1️⃣  Testing TensorFlow.js import...');
        const tf = require('@tensorflow/tfjs-node');
        console.log('✅ TensorFlow.js imported successfully');
        console.log('   Version:', tf.version.tfjs);
        
        // Test 2: Initialize backend
        console.log('\n2️⃣  Testing backend initialization...');
        await tf.setBackend('cpu');
        console.log('✅ Backend set to:', tf.getBackend());
        
        // Test 3: Simple tensor operations
        console.log('\n3️⃣  Testing tensor operations...');
        const a = tf.tensor2d([[1, 2], [3, 4]]);
        const b = tf.tensor2d([[5, 6], [7, 8]]);
        const c = a.add(b);
        
        const result = await c.data();
        console.log('✅ Tensor operations working');
        console.log('   Result:', Array.from(result));
        
        // Clean up tensors
        a.dispose();
        b.dispose();
        c.dispose();
        
        // Test 4: Model creation
        console.log('\n4️⃣  Testing model creation...');
        const model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [4], units: 8, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'sigmoid' })
            ]
        });
        
        model.compile({
            optimizer: 'adam',
            loss: 'binaryCrossentropy'
        });
        
        console.log('✅ Model created successfully');
        console.log('   Input shape:', model.inputShape);
        console.log('   Output shape:', model.outputShape);
        
        // Test 5: Prediction
        console.log('\n5️⃣  Testing prediction...');
        const testInput = tf.tensor2d([[0.3, 0.5, 0.6, 0.4]]);
        const prediction = model.predict(testInput);
        const predictionValue = await prediction.data();
        
        console.log('✅ Prediction working');
        console.log('   Prediction value:', predictionValue[0]);
        
        testInput.dispose();
        prediction.dispose();
        model.dispose();
        
        // Test 6: AI Utils service
        console.log('\n6️⃣  Testing AI Utils service...');
        const aiUtils = require('./ai_service/services/aiUtils');
        
        const initialized = await aiUtils.initializeTensorFlow();
        console.log('✅ AI Utils service working');
        console.log('   Initialized:', initialized);
        
        if (initialized) {
            const sensorData = {
                moisture: 25,
                temperature: 28,
                humidity: 45,
                lightLevel: 70
            };
            
            const wateringPrediction = await aiUtils.predictWateringNeeds(sensorData);
            console.log('✅ Watering prediction working');
            console.log('   Needs watering:', wateringPrediction.needsWatering);
            console.log('   Confidence:', wateringPrediction.confidence);
            console.log('   Recommendation:', wateringPrediction.recommendation);
            console.log('   Source:', wateringPrediction.source);
        }
        
        console.log('\n🎉 All TensorFlow.js tests passed!');
        console.log('✅ TensorFlow.js is ready for production use');
        
    } catch (error) {
        console.log('\n❌ TensorFlow.js test failed:');
        console.log('Error:', error.message);
        
        if (error.message.includes('Cannot find module')) {
            console.log('\n💡 Solution: Install TensorFlow.js dependencies');
            console.log('   Run: cd ai_service && npm install');
        } else if (error.message.includes('Visual Studio')) {
            console.log('\n💡 Solution: Use pre-built binaries or cloud ML');
            console.log('   Option 1: Wait for pre-built binaries to download');
            console.log('   Option 2: Use cloud-based ML APIs');
            console.log('   Option 3: Install Visual Studio Build Tools');
        } else {
            console.log('\n💡 Fallback: Use rule-based predictions');
            console.log('   The system can work without TensorFlow.js');
            console.log('   ML features will use fallback algorithms');
        }
    }
}

testTensorFlow();