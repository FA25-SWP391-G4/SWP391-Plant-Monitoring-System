/**
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
        console.log(`🧹 Disposed variables, tensors: ${numTensors} -> ${tf.memory().numTensors}`);
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
