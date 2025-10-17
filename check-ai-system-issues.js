/**
 * Kiểm tra các vấn đề và hạn chế của hệ thống AI
 */

console.log('🔍 Kiểm tra hệ thống AI...\n');

// 1. Kiểm tra dependencies
console.log('1. Kiểm tra Dependencies:');
const requiredDeps = [
    'node-cache',
    'sharp',
    '@tensorflow/tfjs',
    'express-validator'
];

requiredDeps.forEach(dep => {
    try {
        require(dep);
        console.log(`✅ ${dep} - OK`);
    } catch (error) {
        console.log(`❌ ${dep} - MISSING: ${error.message}`);
    }
});

// 2. Kiểm tra services
console.log('\n2. Kiểm tra AI Services:');
const services = [
    './services/aiErrorHandler',
    './services/aiCacheService', 
    './services/aiModelManager',
    './services/optimizedImageProcessor'
];

services.forEach(service => {
    try {
        const serviceModule = require(service);
        console.log(`✅ ${service} - Loaded`);
        
        // Kiểm tra health check nếu có
        if (typeof serviceModule.healthCheck === 'function') {
            serviceModule.healthCheck().then(health => {
                console.log(`   Health: ${health.healthy ? '✅' : '❌'} ${health.status}`);
            }).catch(err => {
                console.log(`   Health check failed: ${err.message}`);
            });
        }
    } catch (error) {
        console.log(`❌ ${service} - ERROR: ${error.message}`);
    }
});

// 3. Kiểm tra memory usage
console.log('\n3. Memory Usage:');
const memUsage = process.memoryUsage();
console.log(`Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
console.log(`Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
console.log(`RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);

// 4. Kiểm tra TensorFlow.js
console.log('\n4. TensorFlow.js Status:');
try {
    const tf = require('@tensorflow/tfjs');
    console.log(`✅ TensorFlow.js version: ${tf.version.tfjs}`);
    console.log(`Backend: ${tf.getBackend()}`);
} catch (error) {
    console.log(`❌ TensorFlow.js error: ${error.message}`);
}

// 5. Kiểm tra file system permissions
console.log('\n5. File System Permissions:');
const fs = require('fs');
const testDirs = ['uploads/images', 'ai_models', 'temp'];

testDirs.forEach(dir => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Test write permission
        const testFile = `${dir}/test-write.tmp`;
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        
        console.log(`✅ ${dir} - Read/Write OK`);
    } catch (error) {
        console.log(`❌ ${dir} - Permission error: ${error.message}`);
    }
});

console.log('\n🏁 Kiểm tra hoàn tất!');

// Cleanup
setTimeout(() => {
    process.exit(0);
}, 2000);