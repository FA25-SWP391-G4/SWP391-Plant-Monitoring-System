const fs = require('fs');
const path = require('path');

console.log('🧠 Setting up TensorFlow.js for AI Service...\n');

// Check system requirements
console.log('1️⃣  Checking system requirements...');
console.log('   Node.js version:', process.version);
console.log('   Platform:', process.platform);
console.log('   Architecture:', process.arch);

// Option 1: Use CPU-only version (recommended for most cases)
const packageJsonPath = './ai_service/package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('\n2️⃣  Updating package.json with TensorFlow.js CPU version...');

// Add TensorFlow.js CPU-only dependencies
packageJson.dependencies = {
    ...packageJson.dependencies,
    '@tensorflow/tfjs-node': '^4.10.0',  // CPU version
    'sharp': '^0.32.0',                   // Image processing
    'multer': '^2.0.2'                    // File upload handling
};

// Update description
packageJson.description = 'AI microservice for plant monitoring system - handles chatbot, watering prediction, and disease recognition';

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Package.json updated with TensorFlow.js dependencies');

console.log('\n3️⃣  Creating TensorFlow.js configuration...');

// Create AI utils service with proper error handling
const aiUtilsContent = `const tf = require('@tensorflow/tfjs-node');

let tensorflowInitialized = false;
let initializationError = null;

/**
 * Initialize TensorFlow.js with proper error handling
 */
async function initializeTensorFlow() {
    if (tensorflowInitialized) {
        return true;
    }
    
    try {
        console.log('🧠 Initializing TensorFlow.js...');
        
        // Set backend to CPU (more stable)
        await tf.setBackend('cpu');
        
        // Test TensorFlow with a simple operation
        const testTensor = tf.tensor2d([[1, 2], [3, 4]]);
        const result = testTensor.sum();
        const value = await result.data();
        
        testTensor.dispose();
        result.dispose();
        
        console.log('✅ TensorFlow.js initialized successfully');
        console.log('   Backend:', tf.getBackend());
        console.log('   Test operation result:', value[0]);
        
        tensorflowInitialized = true;
        return true;
        
    } catch (error) {
        console.warn('⚠️  TensorFlow.js initialization failed:', error.message);
        console.warn('   Falling back to non-ML mode');
        
        initializationError = error;
        return false;
    }
}

/**
 * Check if TensorFlow is available
 */
function isTensorFlowAvailable() {
    return tensorflowInitialized;
}

/**
 * Get TensorFlow initialization error
 */
function getTensorFlowError() {
    return initializationError;
}

/**
 * Create a simple prediction model (placeholder)
 */
async function createWateringPredictionModel() {
    if (!tensorflowInitialized) {
        throw new Error('TensorFlow.js not initialized');
    }
    
    try {
        // Create a simple sequential model for watering prediction
        const model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [4], units: 8, activation: 'relu' }),
                tf.layers.dense({ units: 4, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'sigmoid' })
            ]
        });
        
        model.compile({
            optimizer: 'adam',
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });
        
        console.log('✅ Watering prediction model created');
        return model;
        
    } catch (error) {
        console.error('❌ Failed to create watering prediction model:', error.message);
        throw error;
    }
}

/**
 * Predict watering needs (placeholder implementation)
 */
async function predictWateringNeeds(sensorData) {
    if (!tensorflowInitialized) {
        // Fallback to rule-based prediction
        return predictWateringNeedsFallback(sensorData);
    }
    
    try {
        // Convert sensor data to tensor
        const { moisture, temperature, humidity, lightLevel } = sensorData;
        const inputTensor = tf.tensor2d([[moisture / 100, temperature / 50, humidity / 100, lightLevel / 100]]);
        
        // For now, use a simple rule-based approach
        // In the future, this would use a trained model
        const prediction = moisture < 30 ? 0.8 : moisture < 50 ? 0.5 : 0.2;
        
        inputTensor.dispose();
        
        return {
            needsWatering: prediction > 0.5,
            confidence: prediction,
            recommendation: prediction > 0.7 ? 'Water immediately' : 
                          prediction > 0.5 ? 'Water soon' : 'No watering needed',
            source: 'tensorflow'
        };
        
    } catch (error) {
        console.error('❌ TensorFlow prediction failed:', error.message);
        return predictWateringNeedsFallback(sensorData);
    }
}

/**
 * Fallback prediction without TensorFlow
 */
function predictWateringNeedsFallback(sensorData) {
    const { moisture, temperature, humidity } = sensorData;
    
    let needsWatering = false;
    let confidence = 0.5;
    let recommendation = 'Monitor conditions';
    
    // Simple rule-based logic
    if (moisture < 20) {
        needsWatering = true;
        confidence = 0.9;
        recommendation = 'Water immediately - soil is very dry';
    } else if (moisture < 40) {
        needsWatering = true;
        confidence = 0.7;
        recommendation = 'Water soon - soil is getting dry';
    } else if (moisture < 60) {
        needsWatering = false;
        confidence = 0.6;
        recommendation = 'Monitor - soil moisture is adequate';
    } else {
        needsWatering = false;
        confidence = 0.8;
        recommendation = 'No watering needed - soil is moist';
    }
    
    // Adjust based on temperature and humidity
    if (temperature > 30 && humidity < 40) {
        confidence = Math.min(confidence + 0.1, 1.0);
        if (!needsWatering && moisture < 50) {
            needsWatering = true;
            recommendation = 'Water due to hot, dry conditions';
        }
    }
    
    return {
        needsWatering,
        confidence,
        recommendation,
        source: 'fallback'
    };
}

module.exports = {
    initializeTensorFlow,
    isTensorFlowAvailable,
    getTensorFlowError,
    createWateringPredictionModel,
    predictWateringNeeds,
    predictWateringNeedsFallback
};
`;

fs.writeFileSync('./ai_service/services/aiUtils.js', aiUtilsContent);
console.log('✅ AI utils service created with TensorFlow.js support');

console.log('\n4️⃣  Installation options:');
console.log('');
console.log('Option A - CPU Only (Recommended):');
console.log('   cd ai_service && npm install');
console.log('   This will install TensorFlow.js CPU version');
console.log('');
console.log('Option B - Skip TensorFlow for now:');
console.log('   Keep current chatbot-only setup');
console.log('   Add TensorFlow later when needed');
console.log('');
console.log('Option C - Use cloud-based ML:');
console.log('   Use external ML APIs instead of local TensorFlow');
console.log('   More reliable but requires internet connection');

console.log('\n5️⃣  Next steps:');
console.log('1. Choose installation option above');
console.log('2. Test the setup with: node test-tensorflow.js');
console.log('3. Update app.js to re-enable TensorFlow initialization');

console.log('\n✅ TensorFlow.js setup configuration complete!');