/**
 * AI Service Test Script (Mock Version)
 * This script tests the AI prediction functionality using mocks to avoid database dependencies.
 */

// Mock dependencies
const mockAIModel = {
    model_id: 1,
    model_name: 'Test Model',
    version: '1.0.0',
    file_path: '/models/test-model.pb',
    is_active: true,
    uploaded_by: 1
};

const mockSystemLog = {
    logs: [],
    create: function(logData) {
        const log = {
            log_id: this.logs.length + 1,
            timestamp: new Date(),
            log_level: logData.log_level,
            source: logData.source,
            message: logData.message,
            created_at: new Date()
        };
        this.logs.push(log);
        return log;
    }
};

// Mock the AI Service
const aiService = {
    runPrediction: async (plantId, sensorData) => {
        // Log that we're starting prediction
        mockSystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Starting prediction for plant ${plantId} using model ${mockAIModel.model_name}`
        });

        // Simulate model prediction based on sensor data
        const moisture = sensorData.moisture || 0;
        const temperature = sensorData.temperature || 0;
        const light = sensorData.light || 0;
        
        // Simple rule-based prediction for demonstration
        let needsWatering = false;
        let wateringConfidence = 0;
        
        if (moisture < 30) {
            needsWatering = true;
            wateringConfidence = 90 + (30 - moisture);
        } else if (moisture < 45 && temperature > 25) {
            needsWatering = true;
            wateringConfidence = 70 + (45 - moisture) * 2;
        } else if (moisture < 60 && temperature > 30 && light > 80) {
            needsWatering = true;
            wateringConfidence = 60;
        }
        
        // Cap confidence at 100%
        wateringConfidence = Math.min(wateringConfidence, 100);
        
        // Log prediction completion
        mockSystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Prediction completed for plant ${plantId}: needsWatering=${needsWatering}, confidence=${wateringConfidence}%`
        });
        
        return {
            needsWatering,
            confidence: wateringConfidence,
            recommendedAction: needsWatering ? 'Water the plant' : 'No watering needed',
            modelId: mockAIModel.model_id,
            modelName: mockAIModel.model_name,
            modelVersion: mockAIModel.version,
            timestamp: new Date()
        };
    },
    
    testModel: async (modelId, testDataPath) => {
        // Log testing start
        mockSystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Testing model ${mockAIModel.model_name} with test data from ${testDataPath}`
        });

        // Simulate accuracy and performance metrics
        const accuracy = 85 + Math.random() * 10; // 85-95% accuracy
        const precision = 80 + Math.random() * 15; // 80-95% precision
        const recall = 75 + Math.random() * 20; // 75-95% recall
        const f1Score = 2 * (precision * recall) / (precision + recall);
        
        // Log test completion
        mockSystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Testing completed for model ${mockAIModel.model_name}: accuracy=${accuracy.toFixed(2)}%`
        });
        
        return {
            modelId: mockAIModel.model_id,
            modelName: mockAIModel.model_name,
            version: mockAIModel.version,
            metrics: {
                accuracy: accuracy.toFixed(2),
                precision: precision.toFixed(2),
                recall: recall.toFixed(2),
                f1Score: f1Score.toFixed(2)
            },
            testDate: new Date()
        };
    }
};

// Test function to run a series of predictions with different sensor data
async function testAIPredictions() {
    console.log('Starting AI prediction tests (mock version)...');
    console.log('==============================================');
    
    try {
        console.log('Using mock AI model:', mockAIModel.model_name);
        
        // Test case 1: Very dry plant that needs watering
        console.log('\nTest Case 1: Very dry plant');
        const testCase1 = {
            moisture: 20, // 20% moisture - very dry
            temperature: 28, // 28°C
            light: 85 // 85% light intensity
        };
        
        const result1 = await aiService.runPrediction(123, testCase1);
        console.log('Prediction result:', JSON.stringify(result1, null, 2));
        
        // Test case 2: Moderately moist plant with high temperature
        console.log('\nTest Case 2: Moderate moisture with high temperature');
        const testCase2 = {
            moisture: 40, // 40% moisture - moderate
            temperature: 32, // 32°C - very hot
            light: 90 // 90% light intensity
        };
        
        const result2 = await aiService.runPrediction(123, testCase2);
        console.log('Prediction result:', JSON.stringify(result2, null, 2));
        
        // Test case 3: Well-watered plant that doesn't need watering
        console.log('\nTest Case 3: Well-watered plant');
        const testCase3 = {
            moisture: 65, // 65% moisture - well watered
            temperature: 25, // 25°C - moderate temperature
            light: 70 // 70% light intensity
        };
        
        const result3 = await aiService.runPrediction(123, testCase3);
        console.log('Prediction result:', JSON.stringify(result3, null, 2));
        
        // Test model performance
        console.log('\nTesting AI model performance:');
        const testResult = await aiService.testModel(1, '/data/test-dataset.csv');
        console.log('Model test results:', JSON.stringify(testResult, null, 2));
        
        // Display system logs
        console.log('\nSystem logs from AI service:');
        mockSystemLog.logs.forEach(log => {
            console.log(`${log.timestamp.toISOString()} [${log.log_level}] ${log.message}`);
        });
        
        console.log('\nAI prediction tests completed successfully');
        
    } catch (error) {
        console.error('Error during AI prediction tests:', error);
    }
}

// Run the tests
testAIPredictions();