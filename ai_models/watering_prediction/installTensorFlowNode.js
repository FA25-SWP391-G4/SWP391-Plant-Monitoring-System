/**
 * Script to install TensorFlow.js Node backend with fallback options
 */

const { execSync } = require('child_process');
const fs = require('fs');

async function installTensorFlowNode() {
  console.log('🔧 Attempting to install TensorFlow.js Node backend...\n');

  const installOptions = [
    {
      name: 'TensorFlow.js Node (CPU)',
      command: 'npm install @tensorflow/tfjs-node --no-optional',
      description: 'Standard CPU backend'
    },
    {
      name: 'TensorFlow.js Node (CPU) - Force',
      command: 'npm install @tensorflow/tfjs-node --force --no-optional',
      description: 'Force install ignoring conflicts'
    },
    {
      name: 'TensorFlow.js Node (CPU) - Legacy',
      command: 'npm install @tensorflow/tfjs-node@3.21.0 --no-optional',
      description: 'Older stable version'
    },
    {
      name: 'Skip Node Backend',
      command: null,
      description: 'Continue with browser backend (slower but works)'
    }
  ];

  for (const option of installOptions) {
    try {
      console.log(`\n📦 Trying: ${option.name}`);
      console.log(`Description: ${option.description}`);
      
      if (!option.command) {
        console.log('⏭️  Skipping TensorFlow Node backend installation');
        console.log('✅ Will use browser backend (functional but slower)');
        return { success: true, backend: 'browser', message: 'Using browser backend' };
      }

      console.log(`Command: ${option.command}`);
      
      const output = execSync(option.command, { 
        encoding: 'utf8', 
        timeout: 300000, // 5 minutes timeout
        stdio: 'pipe'
      });
      
      console.log('✅ Installation successful!');
      console.log('Testing import...');
      
      // Test if we can import the module
      try {
        require('@tensorflow/tfjs-node');
        console.log('✅ TensorFlow.js Node backend is working!');
        return { 
          success: true, 
          backend: 'node', 
          message: 'TensorFlow.js Node backend installed successfully',
          method: option.name
        };
      } catch (importError) {
        console.log('❌ Import failed:', importError.message);
        continue;
      }
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      
      // Check for specific error types
      if (error.message.includes('Visual Studio')) {
        console.log('💡 Hint: This error is due to missing Visual Studio build tools');
        console.log('   You can install them from: https://visualstudio.microsoft.com/visual-cpp-build-tools/');
      }
      
      if (error.message.includes('node-gyp')) {
        console.log('💡 Hint: This error is due to missing node-gyp or build tools');
      }
      
      if (error.message.includes('404')) {
        console.log('💡 Hint: Pre-built binary not available for your Node.js version');
      }
      
      continue;
    }
  }

  console.log('\n⚠️  All TensorFlow.js Node installation attempts failed');
  console.log('✅ Falling back to browser backend (will work but slower)');
  
  return { 
    success: false, 
    backend: 'browser', 
    message: 'Using browser backend as fallback',
    errors: 'All Node backend installation attempts failed'
  };
}

// Test current TensorFlow setup
function testCurrentSetup() {
  console.log('🧪 Testing current TensorFlow.js setup...\n');
  
  try {
    const tf = require('@tensorflow/tfjs');
    console.log('✅ @tensorflow/tfjs: OK');
    console.log(`   Version: ${tf.version.tfjs}`);
    
    try {
      require('@tensorflow/tfjs-backend-cpu');
      console.log('✅ @tensorflow/tfjs-backend-cpu: OK');
    } catch (e) {
      console.log('❌ @tensorflow/tfjs-backend-cpu: Missing');
    }
    
    try {
      require('@tensorflow/tfjs-node');
      console.log('✅ @tensorflow/tfjs-node: OK');
      return { hasNode: true, hasBrowser: true };
    } catch (e) {
      console.log('❌ @tensorflow/tfjs-node: Missing');
      return { hasNode: false, hasBrowser: true };
    }
    
  } catch (e) {
    console.log('❌ TensorFlow.js not found:', e.message);
    return { hasNode: false, hasBrowser: false };
  }
}

// Create optimized TensorFlow config
function createOptimizedConfig() {
  const configPath = './ai_models/watering_prediction/tfConfig.js';
  
  const config = `/**
 * Optimized TensorFlow.js Configuration
 * Automatically generated configuration for best performance
 */

// Set TensorFlow.js backend preference
const tf = require('@tensorflow/tfjs');

// Try to use Node backend if available, fallback to CPU
async function setupOptimalBackend() {
  try {
    // Try Node backend first
    require('@tensorflow/tfjs-node');
    console.log('🚀 Using TensorFlow.js Node backend (optimal performance)');
    return 'node';
  } catch (e) {
    try {
      // Fallback to CPU backend
      require('@tensorflow/tfjs-backend-cpu');
      await tf.setBackend('cpu');
      console.log('⚡ Using TensorFlow.js CPU backend (good performance)');
      return 'cpu';
    } catch (e2) {
      console.log('⚠️  Using default backend (basic performance)');
      return 'default';
    }
  }
}

// Configure for optimal performance
tf.env().set('WEBGL_PACK', false);
tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
tf.env().set('WEBGL_RENDER_FLOAT32_CAPABLE', true);

module.exports = {
  setupOptimalBackend,
  tf
};`;

  fs.writeFileSync(configPath, config);
  console.log(`✅ Created optimized config at: ${configPath}`);
}

// Main execution
if (require.main === module) {
  (async () => {
    console.log('🔧 TensorFlow.js Node Backend Installation Tool\n');
    
    // Test current setup
    const currentSetup = testCurrentSetup();
    
    if (currentSetup.hasNode) {
      console.log('\n✅ TensorFlow.js Node backend is already installed and working!');
      createOptimizedConfig();
      return;
    }
    
    if (!currentSetup.hasBrowser) {
      console.log('\n❌ TensorFlow.js is not installed at all!');
      console.log('Please run: npm install @tensorflow/tfjs @tensorflow/tfjs-backend-cpu');
      return;
    }
    
    // Try to install Node backend
    const result = await installTensorFlowNode();
    
    console.log('\n📋 Installation Summary:');
    console.log(`Backend: ${result.backend}`);
    console.log(`Status: ${result.success ? 'Success' : 'Partial Success'}`);
    console.log(`Message: ${result.message}`);
    
    if (result.method) {
      console.log(`Method: ${result.method}`);
    }
    
    // Create optimized config regardless
    createOptimizedConfig();
    
    console.log('\n🎯 Next Steps:');
    if (result.backend === 'node') {
      console.log('✅ You now have optimal TensorFlow.js performance!');
    } else {
      console.log('⚡ Your setup will work but with reduced performance');
      console.log('💡 Consider installing Visual Studio Build Tools for optimal performance');
    }
    
  })().catch(console.error);
}

module.exports = {
  installTensorFlowNode,
  testCurrentSetup,
  createOptimizedConfig
};