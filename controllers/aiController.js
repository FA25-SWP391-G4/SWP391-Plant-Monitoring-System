const AIModel = require('../models/AIModel');
const AIPrediction = require('../models/AIPrediction');
const SystemLog = require('../models/SystemLog');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const axios = require('axios');
const FormData = require('form-data');
const execPromise = util.promisify(exec);

// AI Service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3001';

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

// Enhanced chatbot processing with error handling and caching
const processChatbotQuery = async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { message, conversation_id, plant_id, context } = req.body;
        const userId = req.user?.user_id || req.user?.id;
        
        // Input validation
        const validationErrors = aiErrorHandler.validateInput(req.body, {
            message: { required: true, type: 'string' },
            conversation_id: { type: 'string' },
            plant_id: { type: 'number' },
            context: { type: 'object' }
        });

        if (validationErrors.length > 0) {
            return res.status(400).json(
                aiErrorHandler.createErrorResponse('Validation failed', { validationErrors }, 400)
            );
        }

        if (!userId) {
            return res.status(401).json(
                aiErrorHandler.createErrorResponse('User authentication required', null, 401)
            );
        }

        // Generate conversation ID if not provided
        const conversationId = conversation_id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Check cache first
        const cacheKey = { message, context, userId };
        const cachedResponse = await aiCacheService.getCachedChatbotResponse(message, cacheKey);
        
        if (cachedResponse) {
            await aiErrorHandler.logEvent('INFO', 'Chatbot response served from cache', { userId, message: message.substring(0, 50) });
            
            return res.json({
                success: true,
                data: {
                    ...cachedResponse,
                    conversation_id: conversationId,
                    cached: true,
                    processing_time_ms: Date.now() - startTime
                }
            });
        }

        // Log the chatbot query
        await aiErrorHandler.logEvent('INFO', `Chatbot query received from user ${userId}`, { 
            message: message.substring(0, 50),
            conversationId,
            plantId: plant_id
        });

        // Get conversation history with error handling
        const conversationHistory = await aiErrorHandler.handleDatabaseOperation(async () => {
            const ChatHistory = require('../models/ChatHistory');
            return await ChatHistory.getConversationContext(conversationId, 10);
        }, { userId, conversationId });

        // Process chatbot request with retry mechanism
        const chatResult = await aiErrorHandler.executeWithRetry(async () => {
            // This method is deprecated - AI processing now handled by AI microservice
            // Return error directing to use AI service endpoint
            throw new Error('AI processing has been moved to microservice. Use /api/ai/chatbot endpoint instead.');
        }, 'chatbot processing', { userId, message: message.substring(0, 50) });

        // If we get here, it means the operation succeeded (which shouldn't happen with current implementation)
        // Store the conversation in database with error handling
        await aiErrorHandler.handleDatabaseOperation(async () => {
            const ChatHistory = require('../models/ChatHistory');
            return await ChatHistory.createChat(
                userId,
                message,
                chatResult.response,
                plant_id,
                conversationId,
                {
                    ...context,
                    source: chatResult.source,
                    model: chatResult.model,
                    confidence: chatResult.confidence,
                    isPlantRelated: chatResult.isPlantRelated
                }
            );
        }, { userId, conversationId });

        // Cache the response
        await aiCacheService.cacheChatbotResponse(message, cacheKey, chatResult);

        // Log successful response
        await aiErrorHandler.logEvent('INFO', 'Chatbot response generated successfully', {
            userId,
            source: chatResult.source,
            confidence: chatResult.confidence,
            processingTime: Date.now() - startTime
        });

        return res.json({
            success: true,
            data: {
                response: chatResult.response,
                conversation_id: conversationId,
                timestamp: new Date(),
                isPlantRelated: chatResult.isPlantRelated,
                confidence: chatResult.confidence,
                source: chatResult.source,
                model: chatResult.model,
                usage: chatResult.usage,
                processing_time_ms: Date.now() - startTime
            }
        });

    } catch (error) {
        console.error('Error processing chatbot query:', error);
        
        // Get fallback response
        const fallbackResponse = aiErrorHandler.getFallbackResponse('chatbot', error, {
            userId: req.user?.user_id || req.user?.id,
            message: req.body.message?.substring(0, 50)
        });

        // Log the error
        await aiErrorHandler.logEvent('ERROR', 'Chatbot processing failed, using fallback', {
            error: error.message,
            userId: req.user?.user_id || req.user?.id,
            processingTime: Date.now() - startTime
        });

        return res.status(200).json(fallbackResponse); // Return 200 with fallback response
    }
};

// Enhanced Image Recognition API endpoint with comprehensive error handling
const processImageRecognition = async (req, res) => {
    const startTime = Date.now();
    
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(
                aiErrorHandler.createErrorResponse('Validation failed', { errors: errors.array() }, 400)
            );
        }

        // Enhanced security: File validation already done by middleware
        if (!req.file) {
            return res.status(400).json(
                aiErrorHandler.createErrorResponse('No image file provided', null, 400)
            );
        }

        const userId = req.user?.user_id || req.user?.id;
        if (!userId) {
            return res.status(401).json(
                aiErrorHandler.createErrorResponse('User authentication required', null, 401)
            );
        }

        const { plant_id, plant_type } = req.body;

        // Generate image hash for caching
        const imageHash = await aiCacheService.generateImageHash(req.file.path);
        
        // Check cache first
        if (imageHash) {
            const cachedResult = await aiCacheService.getCachedDiseaseRecognition(imageHash);
            
            if (cachedResult) {
                await aiErrorHandler.logEvent('INFO', 'Disease recognition served from cache', { 
                    userId,
                    imageHash: imageHash.substring(0, 16),
                    plantId: plant_id
                });
                
                // Clean up uploaded file since we're using cached result
                try {
                    const fs = require('fs');
                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                } catch (cleanupError) {
                    console.warn('Warning cleaning up cached file:', cleanupError.message);
                }
                
                return res.json({
                    success: true,
                    data: {
                        ...cachedResult,
                        cached: true,
                        processing_time_ms: Date.now() - startTime,
                        timestamp: new Date().toISOString()
                    }
                });
            }
        }

        // Enhanced logging with more details
        await aiErrorHandler.logEvent('INFO', 'Enhanced image recognition requested', {
            userId,
            plantId: plant_id || 'unknown',
            filename: req.file.originalname,
            fileSize: req.file.size
        });

        // Process image with comprehensive error handling
        const analysisResult = await aiErrorHandler.handleImageProcessing(async () => {
            // Use enhanced disease recognition model
            const EnhancedModelLoader = require('../ai_models/disease_recognition/enhancedModelLoader');
            const enhancedModel = new EnhancedModelLoader();
            
            try {
                // Load the enhanced model with error handling
                await enhancedModel.loadModel();
                
                // Enhanced image preprocessing
                const ImagePreprocessor = require('../ai_models/disease_recognition/imagePreprocessor');
                const preprocessor = new ImagePreprocessor();
                
                // Validate image quality
                const imageFeatures = await preprocessor.extractImageFeatures(req.file.path);
                
                if (imageFeatures.quality.score < 0.2) {
                    throw new Error(`Image quality too poor for reliable analysis: ${imageFeatures.quality.score}`);
                }
                
                // Preprocess image for model
                const imageTensor = await preprocessor.preprocessImage(req.file.path);
                
                try {
                    // Run enhanced prediction
                    const predictionStart = Date.now();
                    const prediction = await enhancedModel.predict(imageTensor);
                    const processingTime = Date.now() - predictionStart;
                    
                    // Get enhanced recommendations
                    const topPrediction = prediction.topPrediction;
                    const treatments = enhancedModel.getTreatmentRecommendations(
                        topPrediction.disease, 
                        topPrediction.severity
                    );
                    const prevention = enhancedModel.getPreventionTips(topPrediction.disease);
                    const urgency = enhancedModel.getUrgencyLevel(topPrediction.disease, topPrediction.confidence);
                    
                    // Create thumbnail
                    const thumbnail = await preprocessor.createThumbnail(req.file.path);
                    
                    // Enhanced analysis result with better structure
                    const result = {
                        diseaseDetected: topPrediction.disease,
                        confidence: Math.round(topPrediction.confidence * 10000) / 10000,
                        severity: topPrediction.severity,
                        isHealthy: topPrediction.disease === 'Healthy',
                        allPredictions: prediction.allPredictions.map(p => ({
                            disease: p.disease,
                            confidence: Math.round(p.confidence * 10000) / 10000,
                            severity: p.severity
                        })),
                        treatmentSuggestions: treatments,
                        preventionTips: prevention,
                        urgency: urgency,
                        reliability: {
                            score: Math.round(topPrediction.confidence * 100),
                            level: topPrediction.confidence > 0.8 ? 'high' : 
                                   topPrediction.confidence > 0.6 ? 'medium' : 
                                   topPrediction.confidence > 0.4 ? 'low' : 'very_low',
                            factors: [
                                `Enhanced CNN model used`,
                                `Image quality: ${imageFeatures.quality.score.toFixed(2)}`,
                                `Processing time: ${processingTime}ms`
                            ],
                            recommendation: topPrediction.confidence > 0.7 ? 
                                'Results are reliable for guidance, but consult experts for treatment' :
                                'Results should be verified with additional analysis'
                        },
                        imageQuality: imageFeatures.quality,
                        processingTime: processingTime,
                        warnings: [],
                        disclaimers: [
                            'This AI analysis is for informational purposes only',
                            'Always consult with plant care professionals for treatment decisions',
                            'Results may vary based on image quality and lighting conditions',
                            'This system is designed to assist, not replace, expert diagnosis'
                        ],
                        modelVersion: prediction.modelVersion
                    };
                    
                    // Add warnings based on confidence and quality
                    if (topPrediction.confidence < 0.6) {
                        result.warnings.push('Low confidence prediction - consider retaking photo with better lighting');
                    }
                    
                    if (imageFeatures.quality.score < 0.5) {
                        result.warnings.push('Image quality could be improved for better results');
                    }
                    
                    if (urgency === 'high') {
                        result.warnings.push('URGENT: This condition may require immediate attention');
                    }
                    
                    return result;
                    
                } finally {
                    // Always clean up tensor
                    if (imageTensor) {
                        imageTensor.dispose();
                    }
                }
                
            } finally {
                // Always clean up model
                if (enhancedModel) {
                    enhancedModel.dispose();
                }
            }
        }, { userId, filename: req.file.originalname });

        // Handle the case where image processing returns fallback response
        if (!analysisResult.success) {
            // Cache the fallback response briefly
            if (imageHash) {
                await aiCacheService.cacheDiseaseRecognition(imageHash, analysisResult.data);
            }
            
            return res.json({
                success: true,
                data: {
                    ...analysisResult.data,
                    analysis_id: null,
                    plant_id: plant_id || null,
                    timestamp: new Date().toISOString(),
                    processing_time_ms: Date.now() - startTime,
                    fallback: true
                }
            });
        }

        // Upload image to cloud storage first
        const cloudStorageService = require('../services/cloudStorageService');
        let uploadedFile;
        
        try {
            uploadedFile = await cloudStorageService.uploadImage(req.file, {
                userId: userId,
                plantId: plant_id,
                category: 'disease_analysis'
            });
            
            console.log(`✅ Image uploaded to storage: ${uploadedFile.filename}`);
            
        } catch (uploadError) {
            console.error('❌ Error uploading to storage:', uploadError);
            uploadedFile = {
                filename: req.file.filename || 'unknown',
                path: req.file.path,
                url: null,
                thumbnailUrl: null
            };
        }

        // Enhanced database storage with cloud storage info
        const ImageAnalysis = require('../models/ImageAnalysis');
        let savedAnalysis;
        
        try {
            savedAnalysis = await ImageAnalysis.create({
                user_id: userId,
                plant_id: plant_id || null,
                image_path: uploadedFile.path || req.file.path,
                original_filename: req.fileValidation?.sanitizedFilename || req.file.originalname,
                analysis_result: {
                    ...analysisResult,
                    storage: {
                        filename: uploadedFile.filename,
                        url: uploadedFile.url,
                        thumbnailUrl: uploadedFile.thumbnailUrl,
                        uploadedAt: uploadedFile.uploadedAt || new Date()
                    }
                },
                disease_detected: analysisResult.diseaseDetected,
                confidence_score: analysisResult.confidence,
                treatment_suggestions: analysisResult.treatmentSuggestions
            });
            
            console.log(`✅ Analysis saved to database with ID: ${savedAnalysis.analysis_id}`);
            
        } catch (dbError) {
            console.error('❌ Database error saving image analysis:', dbError);
            savedAnalysis = { analysis_id: null };
            
            await SystemLog.create({
                log_level: 'ERROR',
                source: 'AIService',
                message: `Failed to save image analysis to database: ${dbError.message}`
            });
        }

        // Enhanced logging with performance metrics
        const totalTime = Date.now() - startTime;
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Enhanced image analysis completed for user ${userId}: ${analysisResult.diseaseDetected} detected (${Math.round(analysisResult.confidence * 100)}% confidence) in ${totalTime}ms`
        });

        // Schedule file cleanup (keep file for 1 hour for potential reprocessing)
        const fileCleanupService = require('../services/fileCleanupService');
        if (!process.env.KEEP_UPLOADED_IMAGES) {
            fileCleanupService.scheduleFileCleanup(req.file.path, 60 * 60 * 1000); // 1 hour
        }

        // Enhanced response with comprehensive data
        return res.json({
            success: true,
            data: {
                analysis_id: savedAnalysis.analysis_id,
                plant_id: plant_id || null,
                disease_detected: analysisResult.diseaseDetected,
                confidence: analysisResult.confidence,
                severity: analysisResult.severity,
                is_healthy: analysisResult.isHealthy,
                treatment_suggestions: analysisResult.treatmentSuggestions,
                prevention_tips: analysisResult.preventionTips,
                urgency: analysisResult.urgency,
                reliability: analysisResult.reliability,
                image_quality: analysisResult.imageQuality,
                processing_time_ms: analysisResult.processingTime,
                total_time_ms: totalTime,
                warnings: analysisResult.warnings,
                disclaimers: analysisResult.disclaimers,
                model_version: modelVersion,
                timestamp: new Date().toISOString(),
                all_predictions: analysisResult.allPredictions,
                file_info: {
                    original_name: req.file.originalname,
                    size_bytes: req.file.size,
                    mime_type: req.file.mimetype,
                    validation_warnings: req.fileValidation?.warnings || []
                }
            }
        });

    } catch (error) {
        console.error('❌ Critical error in enhanced image recognition:', error);
        
        // Enhanced cleanup with better error handling
        if (req.file && req.file.path) {
            try {
                const fs = require('fs');
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                    console.log('🧹 Cleaned up file after error');
                }
            } catch (cleanupError) {
                console.error('❌ Failed to clean up file after error:', cleanupError.message);
            }
        }
        
        // Enhanced error logging
        try {
            await SystemLog.create({
                log_level: 'ERROR',
                source: 'AIService',
                message: `Critical error in enhanced image recognition: ${error.message}, Stack: ${error.stack?.substring(0, 500)}`
            });
        } catch (logError) {
            console.error('❌ Failed to log critical error:', logError);
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to process image recognition',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
            timestamp: new Date().toISOString(),
            request_id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        });
    }
};

// Analyze plant health from image
const analyzeHealth = async (req, res) => {
    try {
        // Check if user is premium
        if (!req.user.isPremium) {
            return res.status(403).json({ message: 'Premium subscription required for image analysis features' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Get file path and validate image
        const imagePath = req.file.path;
        const fileSize = req.file.size;
        const fileType = req.file.mimetype;

        // Validate file type and size
        if (!fileType.startsWith('image/')) {
            // Delete the invalid file
            fs.unlinkSync(imagePath);
            return res.status(400).json({ message: 'Invalid file type. Please upload an image.' });
        }

        if (fileSize > 5 * 1024 * 1024) { // 5MB limit
            // Delete the oversized file
            fs.unlinkSync(imagePath);
            return res.status(400).json({ message: 'Image size exceeds the 5MB limit.' });
        }

        // Log analysis request
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Plant health analysis requested for image: ${req.file.originalname}`
        });

        // In a production system, we would send the image to the AI service
        // For this demo, we'll simulate the analysis results
        
        // Generate a random health score between 0.6 and 1.0 (mostly healthy plants)
        const healthScore = (0.6 + Math.random() * 0.4).toFixed(2);
        
        // Determine health details based on score
        const healthDetails = [
            { aspect: "Leaf Health", status: healthScore > 0.7 ? "good" : "needs_attention" },
            { aspect: "Hydration", status: healthScore > 0.75 ? "good" : "needs_attention" },
            { aspect: "Stem Structure", status: healthScore > 0.8 ? "good" : "needs_attention" },
            { aspect: "Color", status: healthScore > 0.85 ? "good" : "needs_attention" }
        ];
        
        // Generate some issues if the health score is not perfect
        const detectedIssues = [];
        if (healthScore < 0.95) {
            detectedIssues.push({
                name: "Slight Yellowing",
                description: "Minor yellowing detected on some leaf edges, possibly due to over-watering or nutrient imbalance."
            });
        }
        if (healthScore < 0.85) {
            detectedIssues.push({
                name: "Early Signs of Pests",
                description: "Tiny spots on leaves suggest early signs of pest activity, possibly spider mites or aphids."
            });
        }
        if (healthScore < 0.75) {
            detectedIssues.push({
                name: "Dehydration",
                description: "Plant shows signs of dehydration with curling leaf edges. Increase watering frequency."
            });
        }
        
        // Generate recommendations based on issues
        const recommendations = [
            "Ensure the plant is receiving adequate but indirect sunlight",
            "Maintain regular watering schedule, allowing soil to partially dry between waterings"
        ];
        
        if (detectedIssues.some(i => i.name === "Slight Yellowing")) {
            recommendations.push("Reduce watering frequency by 20% for the next 2 weeks");
            recommendations.push("Consider adding iron-rich fertilizer to address potential deficiency");
        }
        
        if (detectedIssues.some(i => i.name === "Early Signs of Pests")) {
            recommendations.push("Inspect leaves closely for pests and consider a gentle neem oil treatment");
            recommendations.push("Increase humidity around the plant by misting or using a pebble tray");
        }
        
        if (detectedIssues.some(i => i.name === "Dehydration")) {
            recommendations.push("Increase watering frequency for the next week");
            recommendations.push("Consider using a moisture meter to monitor soil moisture levels");
        }
        
        // Generate a plant identification with high confidence
        const plantIdentification = {
            name: "Monstera Deliciosa", // Mock plant name
            confidence: 0.92
        };
        
        // Generate the analysis result
        const analysisResult = {
            health_score: parseFloat(healthScore),
            health_details: healthDetails,
            detected_issues: detectedIssues,
            recommendations: recommendations,
            plant_identification: plantIdentification,
            analysis_date: new Date(),
            image_path: imagePath
        };
        
        // Store analysis in database (in a real system)
        // await PlantAnalysis.create({ ...analysisResult, user_id: req.user.id });
        
        // Log successful analysis
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Plant health analysis completed with score: ${healthScore}`
        });
        
        // Return the analysis to the client
        res.json(analysisResult);
        
    } catch (error) {
        console.error('Error analyzing plant health:', error);
        
        // Log error
        await SystemLog.create({
            log_level: 'ERROR',
            source: 'AIService',
            message: `Error analyzing plant health: ${error.message}`
        });
        
        res.status(500).json({ message: 'Error analyzing plant health', error: error.message });
    }
};

// Identify plant species from image
const identifyPlant = async (req, res) => {
    try {
        // Check if user is premium
        if (!req.user.isPremium) {
            return res.status(403).json({ message: 'Premium subscription required for plant identification features' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Get file path and validate image
        const imagePath = req.file.path;
        
        // Log identification request
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Plant identification requested for image: ${req.file.originalname}`
        });

        // In a production system, we would send the image to the AI service
        // For this demo, we'll simulate the identification results
        
        // Array of common houseplants with scientific names
        const commonHouseplants = [
            { common: "Monstera", scientific: "Monstera deliciosa" },
            { common: "Snake Plant", scientific: "Sansevieria trifasciata" },
            { common: "Peace Lily", scientific: "Spathiphyllum wallisii" },
            { common: "Pothos", scientific: "Epipremnum aureum" },
            { common: "Spider Plant", scientific: "Chlorophytum comosum" },
            { common: "Fiddle Leaf Fig", scientific: "Ficus lyrata" },
            { common: "ZZ Plant", scientific: "Zamioculcas zamiifolia" },
            { common: "Rubber Plant", scientific: "Ficus elastica" },
            { common: "Philodendron", scientific: "Philodendron hederaceum" },
            { common: "Aloe Vera", scientific: "Aloe barbadensis miller" }
        ];
        
        // Select a random plant
        const randomPlant = commonHouseplants[Math.floor(Math.random() * commonHouseplants.length)];
        
        // Generate a confidence score between 0.85 and 0.98
        const confidenceScore = (0.85 + Math.random() * 0.13).toFixed(2);
        
        // Generate the identification result
        const identificationResult = {
            plant_name: {
                common: randomPlant.common,
                scientific: randomPlant.scientific
            },
            confidence: parseFloat(confidenceScore),
            similar_plants: [
                commonHouseplants[Math.floor(Math.random() * commonHouseplants.length)].common,
                commonHouseplants[Math.floor(Math.random() * commonHouseplants.length)].common
            ],
            identification_date: new Date(),
            image_path: imagePath
        };
        
        // Log successful identification
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Plant identified as ${randomPlant.common} with ${confidenceScore} confidence`
        });
        
        // Return the identification to the client
        res.json(identificationResult);
        
    } catch (error) {
        console.error('Error identifying plant:', error);
        
        // Log error
        await SystemLog.create({
            log_level: 'ERROR',
            source: 'AIService',
            message: `Error identifying plant: ${error.message}`
        });
        
        res.status(500).json({ message: 'Error identifying plant', error: error.message });
    }
};

// Get analysis history for a plant
const getAnalysisHistory = async (req, res) => {
    try {
        const plantId = req.params.plantId;
        const userId = req.user.id;
        
        // In a production system, we would fetch from database
        // For this demo, we'll generate mock history data
        
        // Generate between 3-8 mock analysis entries
        const entryCount = 3 + Math.floor(Math.random() * 6);
        const mockHistory = [];
        
        for (let i = 0; i < entryCount; i++) {
            // Create a date within the last 30 days
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            
            // Generate a health score that generally improves over time (older entries have lower scores)
            const baseScore = 0.5 + (i / entryCount) * 0.4;
            const healthScore = (baseScore + Math.random() * 0.1).toFixed(2);
            
            mockHistory.push({
                id: `analysis_${i + 1}`,
                plant_id: plantId,
                analysis_date: date,
                health_score: parseFloat(healthScore),
                image_url: `/uploads/plants/analysis_${plantId}_${i + 1}.jpg`,
                summary: healthScore > 0.8 
                    ? "Plant shows excellent health and growth" 
                    : healthScore > 0.6 
                        ? "Plant is healthy but shows minor stress signs"
                        : "Plant shows multiple signs of stress, requiring attention"
            });
        }
        
        // Sort by date, newest first
        mockHistory.sort((a, b) => b.analysis_date - a.analysis_date);
        
        res.json({
            plant_id: plantId,
            analysis_count: mockHistory.length,
            analysis_history: mockHistory
        });
        
    } catch (error) {
        console.error(`Error getting analysis history for plant ${req.params.plantId}:`, error);
        res.status(500).json({ message: 'Error retrieving analysis history', error: error.message });
    }
};

// Detect disease from plant image
const detectDisease = async (req, res) => {
    try {
        // Check if user is premium
        if (!req.user.isPremium) {
            return res.status(403).json({ message: 'Premium subscription required for disease detection features' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Get file path
        const imagePath = req.file.path;
        
        // Log disease detection request
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Plant disease detection requested for image: ${req.file.originalname}`
        });

        // Mock disease detection
        // Randomly decide if plant has disease or not (70% chance healthy)
        const isHealthy = Math.random() > 0.3;
        
        let detectionResult;
        
        if (isHealthy) {
            detectionResult = {
                is_healthy: true,
                disease_detected: null,
                confidence: (0.85 + Math.random() * 0.14).toFixed(2),
                recommendations: [
                    "Continue with your current care routine",
                    "Monitor the plant regularly for any signs of stress",
                    "Ensure adequate lighting and watering schedule is maintained"
                ],
                detection_date: new Date(),
                image_path: imagePath
            };
        } else {
            // Common plant diseases
            const commonDiseases = [
                { 
                    name: "Powdery Mildew", 
                    description: "White powdery spots on leaves and stems", 
                    treatment: "Remove affected leaves and improve air circulation. Apply fungicide if necessary." 
                },
                { 
                    name: "Leaf Spot", 
                    description: "Brown or black spots on leaves", 
                    treatment: "Remove affected leaves, avoid overhead watering, and apply appropriate fungicide." 
                },
                { 
                    name: "Root Rot", 
                    description: "Yellowing leaves, wilting, and stunted growth", 
                    treatment: "Reduce watering, ensure proper drainage, and consider repotting with fresh soil." 
                },
                { 
                    name: "Spider Mites", 
                    description: "Tiny spots on leaves, webbing between leaves/stems", 
                    treatment: "Increase humidity, spray leaves with water, and consider insecticidal soap or neem oil." 
                }
            ];
            
            // Select a random disease
            const randomDisease = commonDiseases[Math.floor(Math.random() * commonDiseases.length)];
            
            detectionResult = {
                is_healthy: false,
                disease_detected: {
                    name: randomDisease.name,
                    description: randomDisease.description,
                    severity: (Math.random() * 0.6 + 0.3).toFixed(2) // 0.3-0.9 severity
                },
                confidence: (0.75 + Math.random() * 0.2).toFixed(2),
                recommendations: [
                    randomDisease.treatment,
                    "Isolate the affected plant to prevent spread to other plants",
                    "Monitor the plant closely for any changes after treatment"
                ],
                detection_date: new Date(),
                image_path: imagePath
            };
        }
        
        // Log successful detection
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AIService',
            message: `Plant disease detection completed: ${isHealthy ? 'No disease detected' : 'Disease detected'}`
        });
        
        // Return the detection results
        res.json(detectionResult);
        
    } catch (error) {
        console.error('Error detecting plant disease:', error);
        
        // Log error
        await SystemLog.create({
            log_level: 'ERROR',
            source: 'AIService',
            message: `Error detecting plant disease: ${error.message}`
        });
        
        res.status(500).json({ message: 'Error detecting plant disease', error: error.message });
    }
};

// Alias for setModelActive to match route naming in mock
const activateModel = setModelActive;

// AI Service Proxy Methods
const proxyChatbotRequest = async (req, res) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/api/test/chatbot`, req.body, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('AI Service chatbot proxy error:', error.message);
        res.status(500).json({
            success: false,
            error: 'AI service unavailable',
            message: 'Could not connect to AI service'
        });
    }
};

const proxyImageAnalysis = async (req, res) => {
    try {
        const formData = new FormData();
        if (req.file) {
            formData.append('image', fs.createReadStream(req.file.path));
        }
        
        // Add other form fields
        Object.keys(req.body).forEach(key => {
            formData.append(key, req.body[key]);
        });
        
        const response = await axios.post(`${AI_SERVICE_URL}/api/test/plant-analysis`, formData, {
            timeout: 30000,
            headers: {
                ...formData.getHeaders()
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('AI Service image analysis proxy error:', error.message);
        res.status(500).json({
            success: false,
            error: 'AI service unavailable',
            message: 'Could not connect to AI service'
        });
    }
};

const proxyWateringPrediction = async (req, res) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/api/irrigation`, req.body, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('AI Service watering prediction proxy error:', error.message);
        res.status(500).json({
            success: false,
            error: 'AI service unavailable',
            message: 'Could not connect to AI service'
        });
    }
};

const proxyHistoricalAnalysis = async (req, res) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/api/historical-analysis`, req.body, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('AI Service historical analysis proxy error:', error.message);
        res.status(500).json({
            success: false,
            error: 'AI service unavailable',
            message: 'Could not connect to AI service'
        });
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
    activateModel, // Alias for setModelActive
    deleteModel,
    runPredictionForPlant,
    testModelPerformance,
    analyzePlantCondition,
    optimizeWateringSchedule,
    analyzeHistoricalData,
    processPlantImage,
    processChatbotQuery,
    
    // New image analysis methods
    analyzeHealth,
    identifyPlant,
    getAnalysisHistory,
    detectDisease,
    
    // AI Service proxy methods
    proxyChatbotRequest,
    proxyImageAnalysis,
    proxyWateringPrediction,
    proxyHistoricalAnalysis
};