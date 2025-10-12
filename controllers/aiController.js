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

// Analyze plant condition using AI
const analyzePlantCondition = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Extract data from request body
        const { plantId, imageData, sensorData } = req.body;
        
        if (!plantId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Plant ID is required' 
            });
        }

        // Log the analysis request
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Plant condition analysis requested for plant ${plantId}`
        });

        // Process the analysis
        // This would normally call an AI service or model to analyze the plant
        // For demonstration, we'll simulate an analysis result based on sensor data
        
        let analysisResult = {
            plantId,
            timestamp: new Date(),
            healthStatus: 'healthy',
            confidence: 85,
            issues: [],
            recommendations: ['Maintain current care routine'],
        };
        
        if (sensorData) {
            // If moisture is too low
            if (sensorData.moisture && sensorData.moisture < 30) {
                analysisResult.healthStatus = 'stressed';
                analysisResult.issues.push('Low moisture detected');
                analysisResult.recommendations.push('Water your plant immediately');
                analysisResult.confidence = 90;
            }
            
            // If temperature is too high
            if (sensorData.temperature && sensorData.temperature > 30) {
                analysisResult.healthStatus = 'stressed';
                analysisResult.issues.push('High temperature detected');
                analysisResult.recommendations.push('Move plant to cooler location');
                analysisResult.confidence = Math.max(analysisResult.confidence, 85);
            }
            
            // If light is too low
            if (sensorData.light && sensorData.light < 20) {
                analysisResult.healthStatus = 'stressed';
                analysisResult.issues.push('Low light conditions detected');
                analysisResult.recommendations.push('Move plant to brighter location');
                analysisResult.confidence = Math.max(analysisResult.confidence, 80);
            }
        }
        
        // If image data provided, we would normally analyze it here
        // For now, just acknowledge it was received
        if (imageData) {
            analysisResult.imageAnalyzed = true;
        }
        
        // Log the analysis results
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Plant condition analysis completed for plant ${plantId}: ${analysisResult.healthStatus} (${analysisResult.confidence}% confidence)`
        });

        return res.json({
            success: true,
            data: analysisResult
        });
    } catch (error) {
        console.error('Error analyzing plant condition:', error);
        
        // Log the error
        await SystemLog.create({
            log_level: 'ERROR',
            source: 'AIService',
            message: `Error analyzing plant condition: ${error.message}`
        });
        
        return res.status(500).json({
            success: false,
            message: 'Failed to analyze plant condition',
            error: error.message
        });
    }
};

// Optimize watering schedule using AI
const optimizeWateringSchedule = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { plantId, historicalData, preferences } = req.body;
        
        if (!plantId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Plant ID is required' 
            });
        }

        // Log the optimization request
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Watering schedule optimization requested for plant ${plantId}`
        });

        // Process the optimization request
        // In a real system, this would analyze historical data and user preferences
        // For now, we'll generate a simulated schedule
        
        // Default times (8 AM, 6 PM)
        let schedule = {
            plantId,
            generatedAt: new Date(),
            scheduleType: preferences?.scheduleType || 'fixed', // fixed or adaptive
            wateringDays: preferences?.wateringDays || ['Monday', 'Thursday', 'Saturday'],
            wateringTimes: preferences?.wateringTimes || ['08:00', '18:00'],
            wateringDuration: preferences?.wateringDuration || 20, // seconds
            recommendations: [
                'Adjust watering based on temperature changes',
                'Monitor moisture levels between waterings'
            ],
            efficiency: 85 // percent
        };
        
        // If we have historical data, make the schedule more "intelligent"
        if (historicalData && historicalData.length > 0) {
            // Simulate analyzing the data for optimal times
            schedule.efficiency = 92;
            schedule.recommendations.push('Schedule optimized based on past 30 days of plant data');
            
            // If user has morning preference, adjust schedule
            if (preferences && preferences.morningPreference) {
                schedule.wateringTimes = ['07:30', ''];
                schedule.recommendations.push('Morning-only schedule applied based on preferences');
            }
        }

        // Log the schedule generation
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Watering schedule generated for plant ${plantId} with ${schedule.efficiency}% efficiency`
        });

        return res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        console.error('Error optimizing watering schedule:', error);
        
        // Log the error
        await SystemLog.create({
            log_level: 'ERROR',
            source: 'AIService',
            message: `Error optimizing watering schedule: ${error.message}`
        });
        
        return res.status(500).json({
            success: false,
            message: 'Failed to optimize watering schedule',
            error: error.message
        });
    }
};

// Analyze historical data
const analyzeHistoricalData = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { plantId, startDate, endDate, dataType } = req.body;
        
        if (!plantId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Plant ID is required' 
            });
        }

        // Log the analysis request
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Historical data analysis requested for plant ${plantId} from ${startDate} to ${endDate}`
        });

        // Process the analysis request
        // In a real system, this would retrieve historical sensor and watering data
        // For now, we'll generate simulated analysis results
        
        let analysisResult = {
            plantId,
            analyzedAt: new Date(),
            dateRange: {
                start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
                end: endDate || new Date().toISOString().split('T')[0] // today
            },
            dataPoints: 86, // simulated number of data points analyzed
            insights: [
                'Plant has been consistently healthy over the analyzed period',
                'Moisture levels have been optimal 78% of the time',
                'Light conditions were below optimal for 3 days in the period'
            ],
            recommendations: [
                'Consider increasing water frequency during warmer days',
                'Current care routine is generally appropriate for this plant'
            ],
            charts: {
                moisture: {
                    trend: 'stable',
                    average: 65,
                    min: 32,
                    max: 89
                },
                temperature: {
                    trend: 'increasing',
                    average: 24,
                    min: 18,
                    max: 31
                },
                light: {
                    trend: 'fluctuating',
                    average: 70,
                    min: 25,
                    max: 95
                }
            }
        };
        
        // If specific data type was requested, focus the analysis
        if (dataType) {
            analysisResult.focusArea = dataType;
            analysisResult.insights = analysisResult.insights.filter(insight => 
                insight.toLowerCase().includes(dataType.toLowerCase()));
                
            if (analysisResult.insights.length === 0) {
                analysisResult.insights.push(`No specific insights found for ${dataType}`);
            }
        }

        // Log the analysis completion
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Historical data analysis completed for plant ${plantId} with ${analysisResult.insights.length} insights`
        });

        return res.json({
            success: true,
            data: analysisResult
        });
    } catch (error) {
        console.error('Error analyzing historical data:', error);
        
        // Log the error
        await SystemLog.create({
            log_level: 'ERROR',
            source: 'AIService',
            message: `Error analyzing historical data: ${error.message}`
        });
        
        return res.status(500).json({
            success: false,
            message: 'Failed to analyze historical data',
            error: error.message
        });
    }
};

// Process plant image for identification and analysis
const processPlantImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Log the image analysis request
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Plant image analysis requested by user ${req.user.user_id}`
        });

        // Extract file information
        const filePath = req.file.path;
        const fileType = req.file.mimetype;
        
        // In a real system, we would send this to an image recognition model
        // For this example, we'll simulate a response
        
        // Simulated delay for "processing"
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simulated analysis result
        const analysisResult = {
            timestamp: new Date(),
            imageId: req.file.filename,
            plantIdentification: {
                species: {
                    scientificName: "Monstera deliciosa",
                    commonNames: ["Swiss cheese plant", "Split-leaf philodendron"],
                    confidence: 92.4
                },
                alternatives: [
                    {
                        scientificName: "Philodendron bipinnatifidum",
                        commonNames: ["Tree philodendron"],
                        confidence: 8.6
                    }
                ]
            },
            healthAssessment: {
                status: "healthy",
                confidence: 88.2,
                issues: [],
                recommendations: [
                    "Continue current care routine",
                    "This plant thrives in indirect bright light"
                ]
            }
        };
        
        // If file path starts with "problem_" or contains specific patterns, simulate disease detection
        if (req.file.originalname.toLowerCase().includes('problem') || 
            req.file.originalname.toLowerCase().includes('disease') ||
            req.file.originalname.toLowerCase().includes('yellow')) {
            
            analysisResult.healthAssessment.status = "unhealthy";
            analysisResult.healthAssessment.confidence = 79.5;
            analysisResult.healthAssessment.issues = [
                {
                    type: "Leaf yellowing",
                    confidence: 86.7,
                    description: "Some leaves show yellowing which may indicate overwatering"
                },
                {
                    type: "Possible root rot",
                    confidence: 65.3,
                    description: "Signs consistent with early stage root rot"
                }
            ];
            analysisResult.healthAssessment.recommendations = [
                "Check soil moisture and reduce watering frequency",
                "Ensure proper drainage in pot",
                "Remove affected leaves"
            ];
        }
        
        // Log the completion
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Plant image analysis completed with ${analysisResult.healthAssessment.status} result`
        });

        // In a production system, we might clean up the uploaded file or move it to permanent storage
        // For now we'll just leave it in the uploads directory
        
        return res.json({
            success: true,
            data: analysisResult
        });
    } catch (error) {
        console.error('Error processing plant image:', error);
        
        // Log the error
        await SystemLog.create({
            log_level: 'ERROR',
            source: 'AIService',
            message: `Error processing plant image: ${error.message}`
        });
        
        return res.status(500).json({
            success: false,
            message: 'Failed to process plant image',
            error: error.message
        });
    }
};

// Process chatbot queries
const processChatbotQuery = async (req, res) => {
    try {
        const { query, conversationId, previousMessages } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'No query provided'
            });
        }

        // Log the chatbot query
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Chatbot query received: "${query.substring(0, 50)}..."`
        });

        // In a real system, this would connect to a language model API
        // For this example, we'll simulate responses based on keywords
        
        let response = "I'm your plant care assistant. How can I help you?";
        
        // Simple pattern matching for demo purposes
        if (query.toLowerCase().includes('water')) {
            response = "Most indoor plants need water when the top inch of soil feels dry. However, it depends on the specific plant species, pot size, and environmental conditions. What plant are you asking about?";
        } else if (query.toLowerCase().includes('fertilize') || query.toLowerCase().includes('fertilizer')) {
            response = "Generally, indoor plants should be fertilized during their active growing season (spring and summer) with a balanced fertilizer diluted to half strength. During fall and winter, most plants need less fertilizer.";
        } else if (query.toLowerCase().includes('light') || query.toLowerCase().includes('sunlight')) {
            response = "Different plants have different light requirements. Some need bright, direct light while others prefer indirect light or even shade. It's important to match the plant's natural habitat.";
        } else if (query.toLowerCase().includes('yellow') || query.toLowerCase().includes('yellowing')) {
            response = "Yellowing leaves can indicate several issues: overwatering, underwatering, nutrient deficiency, too much direct sunlight, or pest problems. Can you describe where on the plant the yellowing is occurring?";
        } else if (query.toLowerCase().includes('repot') || query.toLowerCase().includes('repotting')) {
            response = "Most plants should be repotted every 1-2 years. Signs your plant needs repotting include: roots growing out of drainage holes, water running straight through the pot, slowed growth, or the plant becoming top-heavy.";
        }
        
        // Log the response
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Chatbot response sent for query "${query.substring(0, 30)}..."`
        });

        return res.json({
            success: true,
            data: {
                response,
                conversationId: conversationId || Math.random().toString(36).substring(2, 15),
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Error processing chatbot query:', error);
        
        // Log the error
        await SystemLog.create({
            log_level: 'ERROR',
            source: 'AIService',
            message: `Error processing chatbot query: ${error.message}`
        });
        
        return res.status(500).json({
            success: false,
            message: 'Failed to process chatbot query',
            error: error.message
        });
    }
};

// Alias for setModelActive to match route naming in mock
const activateModel = setModelActive;

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
    activateModel, // Alias for setModelActive
    deleteModel,
    runPredictionForPlant,
    testModelPerformance,
    analyzePlantCondition,
    optimizeWateringSchedule,
    analyzeHistoricalData,
    processPlantImage,
    processChatbotQuery
};