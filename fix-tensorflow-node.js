/**
 * Fix TensorFlow.js Node installation for Node.js v22.19.0
 * Addresses compatibility issues and installs proper dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing TensorFlow.js Node installation for Node.js v22.19.0...\n');

// Check current Node.js version
const nodeVersion = process.version;
console.log(`📋 Current Node.js version: ${nodeVersion}`);

// Check if we're on Node.js v22
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion >= 22) {
    console.log('⚠️  Node.js v22+ detected - using compatible TensorFlow.js versions\n');
}

async function installTensorFlowNode() {
    try {
        console.log('📦 Installing TensorFlow.js Node dependencies...');
        
        // For Node.js v22, we need specific versions that are compatible
        const packages = [
            '@tensorflow/tfjs-node@4.15.0',  // Stable version for Node.js v22
            '@tensorflow/tfjs@4.15.0',       // Matching core version
            '@tensorflow/tfjs-backend-cpu@4.15.0'  // Matching backend version
        ];
        
        for (const pkg of packages) {
            console.log(`Installing ${pkg}...`);
            try {
                execSync(`npm install ${pkg}`, { 
                    stdio: 'inherit',
                    cwd: process.cwd()
                });
                console.log(`✅ ${pkg} installed successfully`);
            } catch (error) {
                console.log(`⚠️  Failed to install ${pkg}, trying alternative...`);
                
                // Try without specific version
                const pkgName = pkg.split('@')[0] + '@' + pkg.split('@')[1];
                const fallbackPkg = pkgName.split('@')[0];
                
                try {
                    execSync(`npm install ${fallbackPkg}`, { 
                        stdio: 'inherit',
                        cwd: process.cwd()
                    });
                    console.log(`✅ ${fallbackPkg} installed as fallback`);
                } catch (fallbackError) {
                    console.log(`❌ Failed to install ${fallbackPkg}: ${fallbackError.message}`);
                }
            }
        }
        
        console.log('\n🔍 Verifying TensorFlow.js installation...');
        
        // Test TensorFlow.js Node import
        try {
            const tf = require('@tensorflow/tfjs-node');
            console.log('✅ @tensorflow/tfjs-node imported successfully');
            console.log(`📊 TensorFlow.js version: ${tf.version.tfjs}`);
            
            // Test basic tensor operations
            const testTensor = tf.tensor([1, 2, 3, 4]);
            console.log(`🧪 Test tensor created: shape ${testTensor.shape}`);
            testTensor.dispose();
            console.log('✅ Basic tensor operations working');
            
        } catch (nodeError) {
            console.log('⚠️  @tensorflow/tfjs-node not available, testing browser version...');
            
            try {
                const tf = require('@tensorflow/tfjs');
                require('@tensorflow/tfjs-backend-cpu');
                console.log('✅ @tensorflow/tfjs browser version working');
                console.log(`📊 TensorFlow.js version: ${tf.version.tfjs}`);
                
                // Test basic tensor operations
                const testTensor = tf.tensor([1, 2, 3, 4]);
                console.log(`🧪 Test tensor created: shape ${testTensor.shape}`);
                testTensor.dispose();
                console.log('✅ Browser version tensor operations working');
                
            } catch (browserError) {
                console.error('❌ Both Node and browser versions failed:', browserError.message);
                throw browserError;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Installation failed:', error.message);
        return false;
    }
}

async function createTensorFlowConfig() {
    console.log('\n⚙️  Creating TensorFlow.js configuration...');
    
    const configContent = `/**
 * TensorFlow.js Configuration for Node.js v22+
 * Handles compatibility and fallback scenarios
 */

let tf;
let tfNode = false;

try {
    // Try to load TensorFlow.js Node first (better performance)
    tf = require('@tensorflow/tfjs-node');
    tfNode = true;
    console.log('🚀 Using TensorFlow.js Node backend for optimal performance');
} catch (error) {
    console.warn('⚠️  TensorFlow.js Node not available, using CPU backend');
    
    try {
        // Fallback to browser version with CPU backend
        tf = require('@tensorflow/tfjs');
        require('@tensorflow/tfjs-backend-cpu');
        
        // Set CPU backend explicitly
        tf.setBackend('cpu');
        console.log('✅ Using TensorFlow.js CPU backend');
    } catch (fallbackError) {
        console.error('❌ Failed to load any TensorFlow.js backend:', fallbackError.message);
        throw new Error('TensorFlow.js initialization failed');
    }
}

// Configure memory management for Node.js v22
if (typeof global !== 'undefined') {
    // Enable memory growth for better performance
    tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
    tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
}

module.exports = {
    tf,
    tfNode,
    isNodeBackend: () => tfNode,
    getBackend: () => tf.getBackend(),
    version: () => tf.version.tfjs,
    
    // Memory management utilities
    disposeVariables: () => {
        const numTensors = tf.memory().numTensors;
        tf.disposeVariables();
        console.log(\`🧹 Disposed variables, tensors: \${numTensors} -> \${tf.memory().numTensors}\`);
    },
    
    // Performance monitoring
    getMemoryInfo: () => {
        const memory = tf.memory();
        return {
            numTensors: memory.numTensors,
            numDataBuffers: memory.numDataBuffers,
            numBytes: memory.numBytes,
            unreliable: memory.unreliable
        };
    }
};
`;

    fs.writeFileSync('ai_models/tensorflow-config.js', configContent);
    console.log('✅ TensorFlow.js configuration created at ai_models/tensorflow-config.js');
}

async function updateDiseaseRecognitionModels() {
    console.log('\n🔄 Updating disease recognition models to use new TensorFlow config...');
    
    // Update modelLoader.js
    const modelLoaderPath = 'ai_models/disease_recognition/modelLoader.js';
    if (fs.existsSync(modelLoaderPath)) {
        let content = fs.readFileSync(modelLoaderPath, 'utf8');
        
        // Replace TensorFlow import with our config
        const oldImport = `// Try to use TensorFlow.js Node, fallback to browser version
let tf;
try {
    tf = require('@tensorflow/tfjs-node');
} catch (error) {
    console.warn('TensorFlow.js Node not available, using browser version');
    tf = require('@tensorflow/tfjs');
    // Set CPU backend for browser version
    require('@tensorflow/tfjs-backend-cpu');
}`;

        const newImport = `// Use centralized TensorFlow.js configuration
const { tf } = require('../tensorflow-config');`;
        
        content = content.replace(oldImport, newImport);
        fs.writeFileSync(modelLoaderPath, content);
        console.log('✅ Updated modelLoader.js');
    }
    
    // Update imagePreprocessor.js
    const preprocessorPath = 'ai_models/disease_recognition/imagePreprocessor.js';
    if (fs.existsSync(preprocessorPath)) {
        let content = fs.readFileSync(preprocessorPath, 'utf8');
        
        const oldImport = `// Try to use TensorFlow.js Node, fallback to browser version
let tf;
try {
    tf = require('@tensorflow/tfjs-node');
} catch (error) {
    console.warn('TensorFlow.js Node not available, using browser version');
    tf = require('@tensorflow/tfjs');
    require('@tensorflow/tfjs-backend-cpu');
}`;

        const newImport = `// Use centralized TensorFlow.js configuration
const { tf } = require('../tensorflow-config');`;
        
        content = content.replace(oldImport, newImport);
        fs.writeFileSync(preprocessorPath, content);
        console.log('✅ Updated imagePreprocessor.js');
    }
    
    // Update index.js
    const indexPath = 'ai_models/disease_recognition/index.js';
    if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf8');
        
        const oldImport = `// Try to use TensorFlow.js Node, fallback to browser version
let tf;
try {
    tf = require('@tensorflow/tfjs-node');
} catch (error) {
    console.warn('TensorFlow.js Node not available, using browser version');
    tf = require('@tensorflow/tfjs');
    require('@tensorflow/tfjs-backend-cpu');
}`;

        const newImport = `// Use centralized TensorFlow.js configuration
const { tf } = require('../tensorflow-config');`;
        
        content = content.replace(oldImport, newImport);
        fs.writeFileSync(indexPath, content);
        console.log('✅ Updated index.js');
    }
}

async function testTensorFlowIntegration() {
    console.log('\n🧪 Testing TensorFlow.js integration...');
    
    try {
        // Test the configuration
        const tfConfig = require('./ai_models/tensorflow-config');
        console.log(`📊 TensorFlow.js version: ${tfConfig.version()}`);
        console.log(`🔧 Backend: ${tfConfig.getBackend()}`);
        console.log(`⚡ Node backend: ${tfConfig.isNodeBackend()}`);
        
        // Test tensor operations
        const testTensor = tfConfig.tf.randomNormal([2, 3]);
        console.log(`🧪 Test tensor shape: [${testTensor.shape}]`);
        
        const memoryBefore = tfConfig.getMemoryInfo();
        console.log(`💾 Memory before: ${memoryBefore.numTensors} tensors`);
        
        testTensor.dispose();
        
        const memoryAfter = tfConfig.getMemoryInfo();
        console.log(`💾 Memory after: ${memoryAfter.numTensors} tensors`);
        
        console.log('✅ TensorFlow.js integration test passed');
        return true;
        
    } catch (error) {
        console.error('❌ TensorFlow.js integration test failed:', error.message);
        return false;
    }
}

async function main() {
    try {
        console.log('🚀 Starting TensorFlow.js Node.js v22 compatibility fix...\n');
        
        // Step 1: Install TensorFlow.js Node
        const installSuccess = await installTensorFlowNode();
        if (!installSuccess) {
            console.log('⚠️  Installation had issues, but continuing with configuration...');
        }
        
        // Step 2: Create configuration
        await createTensorFlowConfig();
        
        // Step 3: Update models
        await updateDiseaseRecognitionModels();
        
        // Step 4: Test integration
        const testSuccess = await testTensorFlowIntegration();
        
        if (testSuccess) {
            console.log('\n🎉 TensorFlow.js Node.js v22 compatibility fix completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('1. Run your disease recognition tests again');
            console.log('2. The system should now use TensorFlow.js Node for better performance');
            console.log('3. If Node backend fails, it will automatically fallback to CPU backend');
        } else {
            console.log('\n⚠️  Fix completed with warnings. System will use fallback mode.');
        }
        
    } catch (error) {
        console.error('\n❌ Fix failed:', error.message);
        console.log('\n🔄 The system will continue to use fallback mode.');
    }
}

// Run the fix
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };