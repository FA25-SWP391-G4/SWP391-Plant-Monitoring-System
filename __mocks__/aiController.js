/**
 * AI Controller Mock
 */

// Mock data
const aiModels = [
    {
        id: "model123",
        name: "PlantHealthV1",
        description: "First version of plant health prediction model",
        version: "1.0.0",
        type: "classification",
        accuracy: 0.85,
        dateCreated: "2023-09-01T09:00:00.000Z",
        lastUpdated: "2023-09-15T14:30:00.000Z",
        isActive: true,
        parameters: {
            features: ["moisture", "temperature", "light", "humidity"],
            thresholds: {
                moisture: { low: 30, high: 70 },
                temperature: { low: 15, high: 30 },
                light: { low: 40, high: 90 }
            }
        }
    },
    {
        id: "model456",
        name: "PlantIrrigationV2",
        description: "Improved irrigation recommendation model",
        version: "2.1.0",
        type: "regression",
        accuracy: 0.92,
        dateCreated: "2023-10-15T10:00:00.000Z",
        lastUpdated: "2023-11-20T15:45:00.000Z",
        isActive: false,
        parameters: {
            features: ["moisture", "temperature", "light", "humidity", "soilType", "plantSpecies"],
            thresholds: {
                moisture: { low: 25, high: 75 },
                temperature: { low: 18, high: 32 },
                light: { low: 35, high: 95 }
            }
        }
    }
];

// Get all AI models
const getAllModels = async (req, res) => {
    try {
        return res.json(aiModels);
    } catch (error) {
        console.error('Error fetching AI models:', error);
        return res.status(500).json({ message: 'Error fetching AI models', error: error.message });
    }
};

// Get AI model by ID
const getModelById = async (req, res) => {
    try {
        const modelId = req.params.id;
        const model = aiModels.find(model => model.id === modelId);
        
        if (!model) {
            return res.status(404).json({ message: 'AI model not found' });
        }
        
        return res.json(model);
    } catch (error) {
        console.error(`Error fetching AI model ${req.params.id}:`, error);
        return res.status(500).json({ message: 'Error fetching AI model', error: error.message });
    }
};

// Get active AI model
const getActiveModel = async (req, res) => {
    try {
        const activeModel = aiModels.find(model => model.isActive);
        
        if (!activeModel) {
            return res.status(404).json({ message: 'No active AI model found' });
        }
        
        return res.json(activeModel);
    } catch (error) {
        console.error('Error fetching active AI model:', error);
        return res.status(500).json({ message: 'Error fetching active AI model', error: error.message });
    }
};

// Set active AI model
const setActiveModel = async (req, res) => {
    try {
        const modelId = req.params.id;
        const modelIndex = aiModels.findIndex(model => model.id === modelId);
        
        if (modelIndex === -1) {
            return res.status(404).json({ message: 'AI model not found' });
        }
        
        // Reset all models to inactive
        aiModels.forEach(model => model.isActive = false);
        
        // Set selected model to active
        aiModels[modelIndex].isActive = true;
        
        return res.json({
            message: `Model ${aiModels[modelIndex].name} set as active`,
            model: aiModels[modelIndex]
        });
    } catch (error) {
        console.error(`Error setting active AI model ${req.params.id}:`, error);
        return res.status(500).json({ message: 'Error setting active AI model', error: error.message });
    }
};

// Run prediction for a plant
const runPredictionForPlant = async (req, res) => {
    try {
        const plantId = req.params.plantId;
        const activeModel = aiModels.find(model => model.isActive);
        
        if (!activeModel) {
            throw new Error('No active AI model found');
        }
        
        // Mock plant data
        const plantData = {
            moisture: 35,
            temperature: 24,
            light: 65,
            humidity: 55
        };
        
        // Mock prediction result
        const prediction = {
            plantId,
            timestamp: new Date().toISOString(),
            modelId: activeModel.id,
            modelName: activeModel.name,
            healthStatus: plantData.moisture < 30 ? 'Needs Water' : 'Healthy',
            confidence: 0.89,
            metrics: plantData,
            recommendations: [
                plantData.moisture < 30 ? 'Water your plant immediately' : 'Plant is well-watered',
                plantData.light < 40 ? 'Move to a brighter location' : 'Light levels are adequate'
            ]
        };
        
        return res.json(prediction);
    } catch (error) {
        console.error(`Error running prediction for plant ${req.params.plantId}:`, error);
        return res.status(500).json({ message: 'Error running AI prediction', error: error.message });
    }
};

// Test model performance
const testModelPerformance = async (req, res) => {
    try {
        const modelId = req.params.id;
        const model = aiModels.find(model => model.id === modelId);
        
        if (!model) {
            throw new Error('Model not found');
        }
        
        // Mock test results
        const testResults = {
            modelId,
            modelName: model.name,
            timestamp: new Date().toISOString(),
            metrics: {
                accuracy: model.accuracy,
                precision: 0.88,
                recall: 0.91,
                f1Score: 0.89,
                testSamples: 500
            },
            confusionMatrix: [
                [220, 30],
                [25, 225]
            ],
            executionTime: '3.5 seconds'
        };
        
        return res.json(testResults);
    } catch (error) {
        console.error(`Error testing AI model ${req.params.id}:`, error);
        return res.status(500).json({ message: 'Error testing AI model', error: error.message });
    }
};

// Create new AI model
const createModel = async (req, res) => {
    try {
        const { name, description, type, parameters } = req.body;
        
        if (!name || !type || !parameters) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Create a new model
        const newModel = {
            id: `model${Date.now()}`,
            name,
            description: description || '',
            version: '1.0.0',
            type,
            accuracy: 0.8, // Default initial accuracy
            dateCreated: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            isActive: false,
            parameters
        };
        
        // Add to models array
        aiModels.push(newModel);
        
        return res.status(201).json(newModel);
    } catch (error) {
        console.error('Error creating AI model:', error);
        return res.status(500).json({ message: 'Error creating AI model', error: error.message });
    }
};

// Update AI model
const updateModel = async (req, res) => {
    try {
        const modelId = req.params.id;
        const updates = req.body;
        const modelIndex = aiModels.findIndex(model => model.id === modelId);
        
        if (modelIndex === -1) {
            return res.status(404).json({ message: 'AI model not found' });
        }
        
        // Update model with new data
        const updatedModel = {
            ...aiModels[modelIndex],
            ...updates,
            id: modelId, // Ensure ID doesn't change
            lastUpdated: new Date().toISOString()
        };
        
        aiModels[modelIndex] = updatedModel;
        
        return res.json(updatedModel);
    } catch (error) {
        console.error(`Error updating AI model ${req.params.id}:`, error);
        return res.status(500).json({ message: 'Error updating AI model', error: error.message });
    }
};

// Delete AI model
const deleteModel = async (req, res) => {
    try {
        const modelId = req.params.id;
        const modelIndex = aiModels.findIndex(model => model.id === modelId);
        
        if (modelIndex === -1) {
            return res.status(404).json({ message: 'AI model not found' });
        }
        
        // Check if trying to delete the active model
        if (aiModels[modelIndex].isActive) {
            return res.status(400).json({ message: 'Cannot delete the active model. Set another model as active first.' });
        }
        
        // Remove the model from array
        const deletedModel = aiModels.splice(modelIndex, 1)[0];
        
        return res.json({
            message: `Model ${deletedModel.name} successfully deleted`,
            id: deletedModel.id
        });
    } catch (error) {
        console.error(`Error deleting AI model ${req.params.id}:`, error);
        return res.status(500).json({ message: 'Error deleting AI model', error: error.message });
    }
};

// Train model with new data
const trainModel = async (req, res) => {
    try {
        const modelId = req.params.id;
        const { trainingData, epochs } = req.body;
        const model = aiModels.find(model => model.id === modelId);
        
        if (!model) {
            return res.status(404).json({ message: 'AI model not found' });
        }
        
        if (!trainingData || !trainingData.length) {
            return res.status(400).json({ message: 'Training data is required' });
        }
        
        // Mock training process
        const trainingResult = {
            modelId,
            modelName: model.name,
            startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            endTime: new Date().toISOString(),
            epochs: epochs || 50,
            accuracy: Math.min(0.99, model.accuracy + 0.05), // Improved accuracy
            lossHistory: [0.4, 0.25, 0.15, 0.08, 0.05],
            trainingDataSize: trainingData.length
        };
        
        // Update model with improved accuracy
        const modelIndex = aiModels.findIndex(m => m.id === modelId);
        aiModels[modelIndex].accuracy = trainingResult.accuracy;
        aiModels[modelIndex].lastUpdated = new Date().toISOString();
        
        return res.json(trainingResult);
    } catch (error) {
        console.error(`Error training AI model ${req.params.id}:`, error);
        return res.status(500).json({ message: 'Error training AI model', error: error.message });
    }
};

module.exports = {
    getAllModels,
    getModelById,
    getActiveModel,
    setActiveModel,
    runPredictionForPlant,
    testModelPerformance,
    createModel,
    updateModel,
    deleteModel,
    trainModel
};