/**
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
};