const AIModel = require('../models/AIModel');
const SystemLog = require('../models/SystemLog');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// AI Service methods
const runPrediction = async (plantId, sensorData) => {
    try {
        // Get the active model
        const activeModel = await AIModel.findActive();
        if (!activeModel) {
            throw new Error('No active AI model found');
        }
        
        // Log that we're starting prediction
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Starting prediction for plant ${plantId} using model ${activeModel.model_name}`
        });

        // In a real system, we would load the model from the file_path and use it for prediction
        // For this example, we'll simulate a prediction
        
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
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Prediction completed for plant ${plantId}: needsWatering=${needsWatering}, confidence=${wateringConfidence}%`
        });
        
        return {
            needsWatering,
            confidence: wateringConfidence,
            recommendedAction: needsWatering ? 'Water the plant' : 'No watering needed',
            modelId: activeModel.model_id,
            modelName: activeModel.model_name,
            modelVersion: activeModel.version,
            timestamp: new Date()
        };
    } catch (error) {
        // Log error
        await SystemLog.create({
            log_level: 'ERROR',
            source: 'AIService',
            message: `Error in prediction for plant ${plantId}: ${error.message}`
        });
        
        throw error;
    }
};

// Test the AI model performance
const testModel = async (modelId, testDataPath) => {
    try {
        const model = await AIModel.findById(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        // Log testing start
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Testing model ${model.model_name} with test data from ${testDataPath}`
        });

        // In a real system, we would load the model and test data
        // For this example, we'll simulate test results
        
        // Simulate accuracy and performance metrics
        const accuracy = 85 + Math.random() * 10; // 85-95% accuracy
        const precision = 80 + Math.random() * 15; // 80-95% precision
        const recall = 75 + Math.random() * 20; // 75-95% recall
        const f1Score = 2 * (precision * recall) / (precision + recall);
        
        // Log test completion
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Testing completed for model ${model.model_name}: accuracy=${accuracy.toFixed(2)}%`
        });
        
        return {
            modelId: model.model_id,
            modelName: model.model_name,
            version: model.version,
            metrics: {
                accuracy: accuracy.toFixed(2),
                precision: precision.toFixed(2),
                recall: recall.toFixed(2),
                f1Score: f1Score.toFixed(2)
            },
            testDate: new Date()
        };
    } catch (error) {
        // Log error
        await SystemLog.create({
            log_level: 'ERROR',
            source: 'AIService',
            message: `Error testing model ${modelId}: ${error.message}`
        });
        
        throw error;
    }
};

// Controller methods
// Get all AI models
const getAllModels = async (req, res) => {
    try {
        const models = await AIModel.findAll();
        res.json(models);
    } catch (error) {
        console.error('Error fetching AI models:', error);
        res.status(500).json({ message: 'Error fetching AI models', error: error.message });
    }
};

// Get AI model by ID
const getModelById = async (req, res) => {
    try {
        const model = await AIModel.findById(req.params.id);
        if (!model) {
            return res.status(404).json({ message: 'AI model not found' });
        }
        res.json(model);
    } catch (error) {
        console.error(`Error fetching AI model ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error fetching AI model', error: error.message });
    }
};

// Get active AI model
const getActiveModel = async (req, res) => {
    try {
        const model = await AIModel.findActive();
        if (!model) {
            return res.status(404).json({ message: 'No active AI model found' });
        }
        res.json(model);
    } catch (error) {
        console.error('Error fetching active AI model:', error);
        res.status(500).json({ message: 'Error fetching active AI model', error: error.message });
    }
};

// Create new AI model
const createModel = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // Create model from request body
        const newModel = new AIModel({
            model_name: req.body.model_name,
            version: req.body.version,
            file_path: req.body.file_path,
            is_active: req.body.is_active || false,
            uploaded_by: req.user.id // Assuming user is available from authentication middleware
        });
        
        // Save the model
        const savedModel = await newModel.save();
        
        // If set as active, activate it
        if (req.body.is_active) {
            await savedModel.setAsActive();
        }
        
        res.status(201).json(savedModel);
    } catch (error) {
        console.error('Error creating AI model:', error);
        res.status(500).json({ message: 'Error creating AI model', error: error.message });
    }
};

// Update AI model
const updateModel = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // Find the model to update
        let model = await AIModel.findById(req.params.id);
        if (!model) {
            return res.status(404).json({ message: 'AI model not found' });
        }
        
        // Update model properties
        model.model_name = req.body.model_name || model.model_name;
        model.version = req.body.version || model.version;
        model.file_path = req.body.file_path || model.file_path;
        model.is_active = req.body.is_active !== undefined ? req.body.is_active : model.is_active;
        
        // Save the updated model
        const updatedModel = await model.save();
        
        // If set as active, activate it
        if (req.body.is_active) {
            await updatedModel.setAsActive();
        }
        
        res.json(updatedModel);
    } catch (error) {
        console.error(`Error updating AI model ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error updating AI model', error: error.message });
    }
};

// Set model as active
const setModelActive = async (req, res) => {
    try {
        // Find the model
        let model = await AIModel.findById(req.params.id);
        if (!model) {
            return res.status(404).json({ message: 'AI model not found' });
        }
        
        // Set as active
        await model.setAsActive();
        
        res.json({ 
            message: `Model ${model.model_name} set as active`,
            model
        });
    } catch (error) {
        console.error(`Error setting AI model ${req.params.id} as active:`, error);
        res.status(500).json({ message: 'Error setting AI model as active', error: error.message });
    }
};

// Delete AI model
const deleteModel = async (req, res) => {
    try {
        // Find the model
        let model = await AIModel.findById(req.params.id);
        if (!model) {
            return res.status(404).json({ message: 'AI model not found' });
        }
        
        // Check if it's active
        if (model.is_active) {
            return res.status(400).json({ message: 'Cannot delete the active AI model. Set another model as active first.' });
        }
        
        // Delete the model
        await model.delete();
        
        res.json({ message: `AI model ${req.params.id} deleted successfully` });
    } catch (error) {
        console.error(`Error deleting AI model ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error deleting AI model', error: error.message });
    }
};

// Run prediction for a plant
const runPredictionForPlant = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const plantId = req.params.plantId;
        const sensorData = req.body;
        
        // Run prediction
        const prediction = await runPrediction(plantId, sensorData);
        
        res.json(prediction);
    } catch (error) {
        console.error(`Error running prediction for plant ${req.params.plantId}:`, error);
        res.status(500).json({ message: 'Error running AI prediction', error: error.message });
    }
};

// Test model performance
const testModelPerformance = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const modelId = req.params.id;
        const testDataPath = req.body.testDataPath;
        
        // Run tests
        const testResults = await testModel(modelId, testDataPath);
        
        res.json(testResults);
    } catch (error) {
        console.error(`Error testing AI model ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error testing AI model', error: error.message });
    }
};

module.exports = {
    // Service methods exported for use in other parts of the application
    runPrediction,
    testModel,
    
    // Controller methods for Express routes
    getAllModels,
    getModelById,
    getActiveModel,
    createModel,
    updateModel,
    setModelActive,
    deleteModel,
    runPredictionForPlant,
    testModelPerformance
};