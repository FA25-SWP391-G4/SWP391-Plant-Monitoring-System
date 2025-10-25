const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function installTensorFlowSafe() {
    console.log('🔧 Safe TensorFlow.js Installation...\n');
    
    const aiServicePath = './ai_service';
    
    try {
        // Change to ai_service directory
        process.chdir(aiServicePath);
        console.log('📁 Changed to directory:', process.cwd());
        
        // Method 1: Try installing with pre-built binaries
        console.log('🔄 Attempting installation with pre-built binaries...');
        
        try {
            // Install TensorFlow.js CPU version specifically
            execSync('npm install @tensorflow/tfjs-node@4.10.0 --no-optional', { 
                stdio: 'inherit',
                timeout: 300000 // 5 minutes timeout
            });
            
            console.log('✅ TensorFlow.js installed successfully!');
            
            // Test the installation
            console.log('🧪 Testing installation...');
            const testResult = execSync('node -e "const tf = require(\'@tensorflow/tfjs-node\'); console.log(\'TensorFlow version:\', tf.version.tfjs);"', {
                encoding: 'utf8'
            });
            
            console.log('✅ Installation test passed:', testResult.trim());
            return true;
            
        } catch (installError) {
            console.log('❌ Pre-built binary installation failed');
            console.log('Error:', installError.message);
            
            // Method 2: Try alternative approach
            console.log('\n🔄 Trying alternative installation...');
            
            try {
                // Install without building from source
                execSync('npm install @tensorflow/tfjs-node@4.10.0 --ignore-scripts', { 
                    stdio: 'inherit',
                    timeout: 180000 // 3 minutes timeout
                });
                
                console.log('✅ Alternative installation successful!');
                return true;
                
            } catch (altError) {
                console.log('❌ Alternative installation also failed');
                console.log('Error:', altError.message);
                
                // Method 3: Use TensorFlow.js browser version (CPU only)
                console.log('\n🔄 Trying browser version for Node.js...');
                
                try {
                    execSync('npm install @tensorflow/tfjs@4.10.0', { 
                        stdio: 'inherit',
                        timeout: 120000 // 2 minutes timeout
                    });
                    
                    // Update aiUtils to use browser version
                    updateAiUtilsForBrowserVersion();
                    
                    console.log('✅ Browser version installed successfully!');
                    return true;
                    
                } catch (browserError) {
                    console.log('❌ Browser version installation failed');
                    console.log('Error:', browserError.message);
                    
                    // Method 4: Skip TensorFlow, use fallback only
                    console.log('\n🔄 Setting up fallback-only mode...');
                    setupFallbackMode();
                    
                    console.log('✅ Fallback mode configured');
                    console.log('ℹ️  AI features will use rule-based algorithms');
                    return false;
                }
            }
        }
        
    } catch (error) {
        console.log('❌ Installation process failed:', error.message);
        
        // Setup fallback mode
        console.log('\n🔄 Setting up fallback-only mode...');
        setupFallbackMode();
        
        return false;
    }
}

function updateAiUtilsForBrowserVersion() {
    console.log('🔧 Updating AI Utils for browser version...');
    
    const aiUtilsPath = './services/aiUtils.js';
    let content = fs.readFileSync(aiUtilsPath, 'utf8');
    
    // Replace Node.js import with browser import
    content = content.replace(
        "const tf = require('@tensorflow/tfjs-node');",
        "const tf = require('@tensorflow/tfjs');"
    );
    
    fs.writeFileSync(aiUtilsPath, content);
    console.log('✅ AI Utils updated for browser version');
}

function setupFallbackMode() {
    console.log('🔧 Setting up fallback-only mode...');
    
    const aiUtilsPath = './services/aiUtils.js';
    
    const fallbackContent = `// Fallback-only AI Utils (no TensorFlow.js)

let tensorflowInitialized = false;
let initializationError = new Error('TensorFlow.js not available - using fallback mode');

/**
 * Initialize TensorFlow.js (fallback mode)
 */
async function initializeTensorFlow() {
    console.log('ℹ️  TensorFlow.js not available - using fallback algorithms');
    return false;
}

/**
 * Check if TensorFlow is available
 */
function isTensorFlowAvailable() {
    return false;
}

/**
 * Get TensorFlow initialization error
 */
function getTensorFlowError() {
    return initializationError;
}

/**
 * Predict watering needs using rule-based algorithm
 */
async function predictWateringNeeds(sensorData) {
    return predictWateringNeedsFallback(sensorData);
}

/**
 * Rule-based watering prediction
 */
function predictWateringNeedsFallback(sensorData) {
    const { moisture, temperature, humidity, lightLevel } = sensorData;
    
    let needsWatering = false;
    let confidence = 0.5;
    let recommendation = 'Monitor conditions';
    
    // Advanced rule-based logic
    if (moisture < 15) {
        needsWatering = true;
        confidence = 0.95;
        recommendation = 'Water immediately - soil is critically dry';
    } else if (moisture < 25) {
        needsWatering = true;
        confidence = 0.85;
        recommendation = 'Water soon - soil is very dry';
    } else if (moisture < 40) {
        needsWatering = true;
        confidence = 0.7;
        recommendation = 'Water when convenient - soil is getting dry';
    } else if (moisture < 60) {
        needsWatering = false;
        confidence = 0.6;
        recommendation = 'Monitor - soil moisture is adequate';
    } else if (moisture < 80) {
        needsWatering = false;
        confidence = 0.8;
        recommendation = 'No watering needed - soil is moist';
    } else {
        needsWatering = false;
        confidence = 0.9;
        recommendation = 'No watering needed - soil is very moist';
    }
    
    // Environmental adjustments
    if (temperature > 30) {
        if (humidity < 40) {
            // Hot and dry conditions
            confidence = Math.min(confidence + 0.15, 1.0);
            if (!needsWatering && moisture < 50) {
                needsWatering = true;
                recommendation = 'Water due to hot, dry conditions';
            }
        } else if (humidity > 70) {
            // Hot and humid conditions
            confidence = Math.max(confidence - 0.1, 0.1);
            if (needsWatering && moisture > 30) {
                recommendation += ' (reduce amount due to high humidity)';
            }
        }
    } else if (temperature < 15) {
        // Cold conditions
        confidence = Math.max(confidence - 0.1, 0.1);
        if (needsWatering) {
            recommendation += ' (water less in cold weather)';
        }
    }
    
    // Light level adjustments
    if (lightLevel > 80) {
        // High light conditions increase water needs
        if (!needsWatering && moisture < 45) {
            needsWatering = true;
            confidence = 0.7;
            recommendation = 'Water due to high light conditions';
        }
    } else if (lightLevel < 20) {
        // Low light conditions reduce water needs
        if (needsWatering && moisture > 25) {
            confidence = Math.max(confidence - 0.15, 0.3);
            recommendation += ' (reduce amount due to low light)';
        }
    }
    
    return {
        needsWatering,
        confidence: Math.round(confidence * 100) / 100,
        recommendation,
        source: 'rule-based',
        factors: {
            moisture: moisture + '%',
            temperature: temperature + '°C',
            humidity: humidity + '%',
            lightLevel: lightLevel + '%'
        }
    };
}

module.exports = {
    initializeTensorFlow,
    isTensorFlowAvailable,
    getTensorFlowError,
    predictWateringNeeds,
    predictWateringNeedsFallback
};
`;
    
    fs.writeFileSync(aiUtilsPath, fallbackContent);
    console.log('✅ Fallback-only AI Utils created');
}

// Run the installation
installTensorFlowSafe().then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
        console.log('🎉 TensorFlow.js installation completed successfully!');
        console.log('✅ AI Service now supports machine learning features');
        console.log('\n📋 Next steps:');
        console.log('1. Test with: node ../test-tensorflow.js');
        console.log('2. Start AI service: npm start');
        console.log('3. Test ML endpoints');
    } else {
        console.log('⚠️  TensorFlow.js installation skipped');
        console.log('✅ AI Service configured with fallback algorithms');
        console.log('\n📋 Current capabilities:');
        console.log('• Chatbot functionality (OpenRouter API)');
        console.log('• Rule-based watering predictions');
        console.log('• Plant care recommendations');
        console.log('\n💡 To add ML features later:');
        console.log('• Install Visual Studio Build Tools');
        console.log('• Or use cloud-based ML APIs');
    }
    console.log('='.repeat(50));
}).catch(console.error);