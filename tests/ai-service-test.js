/**
 * AI Service Test Script
 * This script tests the AI prediction service by simulating different sensor data
 * and analyzing the prediction results.
 */

const aiController = require('../controllers/aiController');
const AIModel = require('../models/AIModel');
const SystemLog = require('../models/SystemLog');

// Mock a plant ID for testing
const TEST_PLANT_ID = 123;

// Test function to run a series of predictions with different sensor data
async function testAIPredictions() {
    console.log('Starting AI prediction tests...');
    console.log('==================================');
    
    try {
        // First, check if we have an active model
        const activeModel = await AIModel.findActive();
        console.log('Active AI model:', activeModel ? activeModel.model_name : 'None');
        
        if (!activeModel) {
            console.log('Creating a test AI model for predictions...');
            const testModel = new AIModel({
                model_name: 'Test Prediction Model',
                version: '1.0.0',
                file_path: '/models/test-model.pb',
                is_active: true,
                uploaded_by: 1 // Assuming user ID 1 exists
            });
            
            await testModel.save();
            await testModel.setAsActive();
            console.log('Test model created and activated:', testModel.model_name);
        }
        
        // Test case 1: Very dry plant that needs watering
        console.log('\nTest Case 1: Very dry plant');
        const testCase1 = {
            moisture: 20, // 20% moisture - very dry
            temperature: 28, // 28°C
            light: 85 // 85% light intensity
        };
        
        const result1 = await aiController.runPrediction(TEST_PLANT_ID, testCase1);
        console.log('Prediction result:', JSON.stringify(result1, null, 2));
        
        // Test case 2: Moderately moist plant with high temperature
        console.log('\nTest Case 2: Moderate moisture with high temperature');
        const testCase2 = {
            moisture: 40, // 40% moisture - moderate
            temperature: 32, // 32°C - very hot
            light: 90 // 90% light intensity
        };
        
        const result2 = await aiController.runPrediction(TEST_PLANT_ID, testCase2);
        console.log('Prediction result:', JSON.stringify(result2, null, 2));
        
        // Test case 3: Well-watered plant that doesn't need watering
        console.log('\nTest Case 3: Well-watered plant');
        const testCase3 = {
            moisture: 65, // 65% moisture - well watered
            temperature: 25, // 25°C - moderate temperature
            light: 70 // 70% light intensity
        };
        
        const result3 = await aiController.runPrediction(TEST_PLANT_ID, testCase3);
        console.log('Prediction result:', JSON.stringify(result3, null, 2));
        
        // Check system logs from the AI predictions
        console.log('\nRetrieving system logs from AI service:');
        const logs = await SystemLog.findBySource('AIService');
        console.log(`Found ${logs.length} log entries from AI service`);
        
        logs.slice(-5).forEach(log => {
            console.log(`${log.created_at} [${log.log_level}] ${log.message}`);
        });
        
        console.log('\nAI prediction tests completed successfully');
        
    } catch (error) {
        console.error('Error during AI prediction tests:', error);
    }
}

// Self-invoking function to run tests
(async () => {
    try {
        await testAIPredictions();
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
})();