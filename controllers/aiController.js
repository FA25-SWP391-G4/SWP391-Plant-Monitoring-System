const AIModel = require('../models/AIModel');
const AIPrediction = require('../models/AIPrediction');
const SystemLog = require('../models/SystemLog');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Enhanced error handling and caching services
const aiErrorHandler = require('../services/aiErrorHandler');
const aiCacheService = require('../services/aiCacheService');
const aiModelManager = require('../services/aiModelManager');
const optimizedImageProcessor = require('../services/optimizedImageProcessor');

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

// Enhanced watering prediction with error handling and caching
const predictWatering = async (req, res) => {
    const startTime = Date.now();
    
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(
                aiErrorHandler.createErrorResponse('Validation failed', { errors: errors.array() }, 400)
            );
        }

        const { plant_id, sensor_data } = req.body;
        
        // Enhanced input validation
        const validationErrors = aiErrorHandler.validateInput(req.body, {
            plant_id: { type: 'number' }, // Allow null/undefined
            sensor_data: { required: true, type: 'object' }
        });

        if (validationErrors.length > 0) {
            return res.status(400).json(
                aiErrorHandler.createErrorResponse('Input validation failed', { validationErrors }, 400)
            );
        }

        // Check cache first
        const cachedPrediction = await aiCacheService.getCachedWateringPrediction(sensor_data, plant_id);
        
        if (cachedPrediction) {
            await aiErrorHandler.logEvent('INFO', 'Watering prediction served from cache', { 
                plantId: plant_id,
                sensorData: sensor_data
            });
            
            return res.json({
                success: true,
                data: {
                    prediction_id: null,
                    plant_id: plant_id,
                    prediction: {
                        ...cachedPrediction,
                        cached: true
                    },
                    model_version: cachedPrediction.modelUsed || 'cached',
                    timestamp: new Date().toISOString(),
                    input_data: sensor_data,
                    processing_time_ms: Date.now() - startTime
                }
            });
        }

        // Log the prediction request
        await aiErrorHandler.logEvent('INFO', `Watering prediction requested for plant ${plant_id}`, {
            plantId: plant_id,
            sensorData: sensor_data
        });

        // Get historical data with error handling
        let historicalData = [];
        if (plant_id) {
            historicalData = await aiErrorHandler.handleDatabaseOperation(async () => {
                const SensorData = require('../models/SensorData');
                return await SensorData.getRecentData(plant_id, 7); // last 7 days
            }, { plantId: plant_id }) || [];
        }

        // Load and run prediction model with error handling
        const predictionResult = await aiErrorHandler.handleModelOperation(async () => {
            const UltimateWateringPredictionSystem = require('../ai_models/watering_prediction/ultimateSolution');
            const predictionSystem = new UltimateWateringPredictionSystem();
            
            try {
                const prediction = await predictionSystem.predict(sensor_data, historicalData, plant_id);
                
                const result = {
                    shouldWater: prediction.shouldWater,
                    confidence: prediction.confidence > 1 ? prediction.confidence / 100 : prediction.confidence,
                    recommendedAmount: prediction.recommendedAmount || 0,
                    reasoning: prediction.reasoning,
                    modelUsed: prediction.modelUsed,
                    processingTime: prediction.processingTime,
                    nextWateringDate: prediction.shouldWater ? new Date() : null,
                    recommendations: []
                };

                // Add recommendations based on prediction
                if (prediction.shouldWater) {
                    result.recommendations.push('Water your plant now');
                    if (result.recommendedAmount > 0) {
                        result.recommendations.push(`Recommended amount: ${result.recommendedAmount}ml`);
                    }
                } else {
                    result.recommendations.push('No watering needed at this time');
                    
                    const moisture = sensor_data.moisture || 50;
                    if (moisture > 70) {
                        result.recommendations.push('Check again in 3-4 days');
                    } else if (moisture > 50) {
                        result.recommendations.push('Check again in 1-2 days');
                    } else {
                        result.recommendations.push('Monitor closely, may need water soon');
                    }
                }

                return {
                    result,
                    modelVersion: prediction.systemVersion || '3.0.0-ultimate'
                };
            } finally {
                // Always dispose of the prediction system
                try {
                    predictionSystem.dispose();
                } catch (disposeError) {
                    console.warn('Warning disposing prediction system:', disposeError.message);
                }
            }
        }, 'watering prediction', { plantId: plant_id, sensorData: sensor_data });

        // Handle the case where model operation returns fallback response
        if (!predictionResult.success) {
            // Cache the fallback response briefly
            await aiCacheService.cacheWateringPrediction(sensor_data, plant_id, predictionResult.data.prediction);
            
            return res.json({
                success: true,
                data: {
                    prediction_id: null,
                    plant_id: plant_id,
                    prediction: predictionResult.data.prediction,
                    model_version: 'fallback',
                    timestamp: new Date().toISOString(),
                    input_data: sensor_data,
                    processing_time_ms: Date.now() - startTime,
                    fallback: true
                }
            });
        }

        // Store the prediction in the database with error handling
        const savedPrediction = await aiErrorHandler.handleDatabaseOperation(async () => {
            return await AIPrediction.createWateringPrediction(
                plant_id,
                sensor_data,
                predictionResult.result,
                predictionResult.result.confidence,
                predictionResult.modelVersion
            );
        }, { plantId: plant_id }) || { prediction_id: null };

        // Cache the successful prediction
        await aiCacheService.cacheWateringPrediction(sensor_data, plant_id, predictionResult.result);

        // Log successful prediction
        await aiErrorHandler.logEvent('INFO', 'Watering prediction completed successfully', {
            plantId: plant_id,
            shouldWater: predictionResult.result.shouldWater,
            confidence: Math.round(predictionResult.result.confidence * 100),
            processingTime: Date.now() - startTime
        });

        // Trigger automatic watering notifications if needed (requirement 2.5)
        if (predictionResult.result.shouldWater && predictionResult.result.confidence > 0.7 && plant_id) {
            // Handle notification creation with error handling (don't fail the main request)
            aiErrorHandler.executeWithRetry(async () => {
                const Plant = require('../models/Plant');
                const plant = await Plant.findById(plant_id);
                
                if (plant && plant.user_id) {
                    const Alert = require('../models/Alert');
                    await Alert.create({
                        user_id: plant.user_id,
                        title: 'Watering Needed',
                        message: `Your plant "${plant.custom_name || 'Plant #' + plant_id}" needs watering. ${predictionResult.result.reasoning}`,
                        type: 'watering_alert',
                        details: JSON.stringify({
                            plant_id: plant_id,
                            confidence: predictionResult.result.confidence,
                            recommended_amount: predictionResult.result.recommendedAmount,
                            prediction_id: savedPrediction.prediction_id
                        })
                    });
                }
            }, 'watering alert creation', { plantId: plant_id }).catch(alertError => {
                console.warn('Failed to create watering alert:', alertError.message);
            });
        }

        // Return the prediction result
        return res.json({
            success: true,
            data: {
                prediction_id: savedPrediction.prediction_id,
                plant_id: plant_id,
                prediction: predictionResult.result,
                model_version: predictionResult.modelVersion,
                timestamp: new Date().toISOString(),
                input_data: sensor_data,
                processing_time_ms: Date.now() - startTime
            }
        });

    } catch (error) {
        console.error('Error in watering prediction:', error);
        
        // Get fallback response
        const fallbackResponse = aiErrorHandler.getFallbackResponse('wateringPrediction', error, {
            plantId: req.body.plant_id,
            sensorData: req.body.sensor_data
        });

        // Log the error
        await aiErrorHandler.logEvent('ERROR', 'Watering prediction failed, using fallback', {
            error: error.message,
            plantId: req.body.plant_id,
            processingTime: Date.now() - startTime
        });

        return res.status(200).json(fallbackResponse); // Return 200 with fallback response
    }
};

// AI Performance and Optimization endpoints
const getAIPerformanceStats = async (req, res) => {
    try {
        const stats = {
            errorHandler: await aiErrorHandler.healthCheck(),
            cache: await aiCacheService.healthCheck(),
            modelManager: await aiModelManager.healthCheck(),
            imageProcessor: await optimizedImageProcessor.healthCheck(),
            system: {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            }
        };

        return res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting AI performance stats:', error);
        return res.status(500).json(
            aiErrorHandler.createErrorResponse('Failed to get performance stats', error)
        );
    }
};

const optimizeAIPerformance = async (req, res) => {
    try {
        const results = {
            cache: await aiCacheService.optimizeCache(),
            modelManager: await aiModelManager.optimizePerformance(),
            imageProcessor: await optimizedImageProcessor.optimizePerformance()
        };

        await aiErrorHandler.logEvent('INFO', 'AI performance optimization completed', {
            results: Object.keys(results).map(key => ({ [key]: results[key].success }))
        });

        return res.json({
            success: true,
            message: 'AI performance optimization completed',
            data: results
        });
    } catch (error) {
        console.error('Error optimizing AI performance:', error);
        return res.status(500).json(
            aiErrorHandler.createErrorResponse('Failed to optimize performance', error)
        );
    }
};

const clearAICache = async (req, res) => {
    try {
        const { type = 'all' } = req.body;
        
        const result = await aiCacheService.clearCache(type);
        
        await aiErrorHandler.logEvent('INFO', `AI cache cleared: ${type}`, {
            type,
            success: result
        });

        return res.json({
            success: true,
            message: `Cache cleared: ${type}`,
            data: { type, cleared: result }
        });
    } catch (error) {
        console.error('Error clearing AI cache:', error);
        return res.status(500).json(
            aiErrorHandler.createErrorResponse('Failed to clear cache', error)
        );
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
    processChatbotQuery,
    predictWatering, // Enhanced watering prediction endpoint
    processImageRecognition, // Enhanced image recognition endpoint
    
    // Performance and optimization endpoints
    getAIPerformanceStats,
    optimizeAIPerformance,
    clearAICache
};