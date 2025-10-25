const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Alternative TensorFlow.js Node installation script
 * Tries multiple approaches to install TensorFlow.js Node
 */
async function installTensorFlowNode() {
    console.log('🔧 Attempting to install TensorFlow.js Node...\n');
    
    const approaches = [
        {
            name: 'Standard Installation',
            command: 'npm install @tensorflow/tfjs-node',
            description: 'Try standard npm install'
        },
        {
            name: 'Force Rebuild',
            command: 'npm install @tensorflow/tfjs-node --build-from-source',
            description: 'Build from source'
        },
        {
            name: 'CPU Only Version',
            command: 'npm install @tensorflow/tfjs-node-cpu',
            description: 'Install CPU-only version (lighter)'
        },
        {
            name: 'Alternative Registry',
            command: 'npm install @tensorflow/tfjs-node --registry https://registry.npmjs.org/',
            description: 'Use alternative registry'
        }
    ];

    for (const approach of approaches) {
        try {
            console.log(`📦 Trying: ${approach.name}`);
            console.log(`   Description: ${approach.description}`);
            console.log(`   Command: ${approach.command}\n`);
            
            const { stdout, stderr } = await execPromise(approach.command, {
                timeout: 300000 // 5 minutes timeout
            });
            
            console.log('✅ Success!');
            console.log('Output:', stdout);
            
            // Test the installation
            try {
                const tf = require('@tensorflow/tfjs-node');
                console.log('🎉 TensorFlow.js Node installed and working!');
                console.log('Version:', tf.version.tfjs);
                return true;
            } catch (testError) {
                console.log('❌ Installation completed but module not working:', testError.message);
            }
            
        } catch (error) {
            console.log(`❌ Failed: ${approach.name}`);
            console.log('Error:', error.message);
            
            if (error.stderr) {
                console.log('Stderr:', error.stderr);
            }
            console.log('');
        }
    }
    
    console.log('⚠️  All installation attempts failed.');
    console.log('📋 Manual installation steps:');
    console.log('1. Install Visual Studio Build Tools:');
    console.log('   npm install --global windows-build-tools');
    console.log('2. Or install Visual Studio Community with C++ workload');
    console.log('3. Then try: npm install @tensorflow/tfjs-node');
    console.log('');
    console.log('🔄 Fallback: Using browser version of TensorFlow.js');
    
    return false;
}

/**
 * Check if TensorFlow.js Node is available
 */
function checkTensorFlowNode() {
    try {
        const tf = require('@tensorflow/tfjs-node');
        console.log('✅ TensorFlow.js Node is available');
        console.log('Version:', tf.version.tfjs);
        return true;
    } catch (error) {
        console.log('❌ TensorFlow.js Node not available:', error.message);
        return false;
    }
}

/**
 * Setup optimal TensorFlow.js configuration
 */
async function setupTensorFlowOptimal() {
    console.log('🚀 Setting up optimal TensorFlow.js configuration...\n');
    
    // Check current status
    const hasNodeVersion = checkTensorFlowNode();
    
    if (!hasNodeVersion) {
        console.log('🔧 Attempting to install TensorFlow.js Node...');
        const installed = await installTensorFlowNode();
        
        if (!installed) {
            console.log('📱 Configuring browser version for optimal performance...');
            
            try {
                const tf = require('@tensorflow/tfjs');
                await tf.ready();
                
                // Set backend to CPU for consistency
                if (tf.getBackend() !== 'cpu') {
                    await tf.setBackend('cpu');
                }
                
                console.log('✅ Browser version configured');
                console.log('Backend:', tf.getBackend());
                console.log('Memory info:', tf.memory());
                
                return { success: true, version: 'browser', backend: tf.getBackend() };
            } catch (error) {
                console.log('❌ Failed to configure browser version:', error.message);
                return { success: false, error: error.message };
            }
        } else {
            return { success: true, version: 'node' };
        }
    } else {
        return { success: true, version: 'node' };
    }
}

// Run if called directly
if (require.main === module) {
    (async () => {
        try {
            const result = await setupTensorFlowOptimal();
            console.log('\n🎯 Final Result:', result);
            process.exit(result.success ? 0 : 1);
        } catch (error) {
            console.error('💥 Setup failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = {
    installTensorFlowNode,
    checkTensorFlowNode,
    setupTensorFlowOptimal
};