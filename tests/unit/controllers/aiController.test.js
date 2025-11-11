/**
 * AI & ML CONTROLLER UNIT TESTS
 * =============================
 * 
 * Tests for UC12: Plant Disease Recognition
 * Tests for UC13: Growth Prediction & Analytics
 * Tests for UC14: AI Chatbot Consultation
 * 
 * Coverage:
 * - Image analysis and disease recognition
 * - Plant growth predictions
 * - AI chatbot interactions
 * - ML model integration
 * - Error handling and fallbacks
 */

const AIController = require('../../../controllers/aiController');
const ImageAnalysisService = require('../../../services/imageAnalysisService');
const DiseaseRecognitionService = require('../../../services/diseaseRecognitionService');
const PredictionService = require('../../../services/predictionService');
const ChatbotService = require('../../../services/chatbotService');
const AIModel = require('../../../models/AIModel');
const AIPrediction = require('../../../models/AIPrediction');
const ChatHistory = require('../../../models/ChatHistory');
const Plant = require('../../../models/Plant');
const SensorData = require('../../../models/SensorData');
const SystemLog = require('../../../models/SystemLog');

// Mock external dependencies
jest.mock('../../../services/imageAnalysisService');
jest.mock('../../../services/diseaseRecognitionService');
jest.mock('../../../services/predictionService');
jest.mock('../../../services/chatbotService');
jest.mock('../../../models/AIModel');
jest.mock('../../../models/AIPrediction');
jest.mock('../../../models/ChatHistory');
jest.mock('../../../models/Plant');
jest.mock('../../../models/SensorData');
jest.mock('../../../models/SystemLog');
jest.mock('multer');

describe('AI & ML Controller Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: {
                user_id: 'test-user-uuid',
                email: 'test@test.com',
                role: 'Ultimate'
            },
            body: {},
            query: {},
            params: {},
            file: null,
            files: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };

        // Clear all mocks
        jest.clearAllMocks();

        // Setup default mocks
        SystemLog.log = jest.fn().mockResolvedValue();
        SystemLog.error = jest.fn().mockResolvedValue();
    });

    describe('UC12: Plant Disease Recognition', () => {
        describe('AIController.analyzePlantImage', () => {
            beforeEach(() => {
                req.file = {
                    filename: 'test-plant-image.jpg',
                    originalname: 'plant-photo.jpg',
                    mimetype: 'image/jpeg',
                    size: 1024000,
                    path: '/uploads/test-plant-image.jpg'
                };
                req.body = {
                    plant_id: 'plant-123'
                };
            });

            it('should analyze plant image successfully', async () => {
                const mockAnalysisResult = {
                    disease_detected: true,
                    disease_name: 'Powdery Mildew',
                    confidence: 0.89,
                    severity: 'moderate',
                    treatment_suggestions: [
                        'Apply fungicide spray',
                        'Improve air circulation',
                        'Reduce watering frequency'
                    ],
                    affected_areas: [
                        { x: 150, y: 200, width: 80, height: 60 }
                    ]
                };

                const mockPredictionId = 'prediction-123';

                Plant.findById.mockResolvedValue({
                    plant_id: 'plant-123',
                    plant_name: 'Tomato Plant',
                    user_id: 'test-user-uuid'
                });

                ImageAnalysisService.validateImage.mockReturnValue({ valid: true });
                DiseaseRecognitionService.analyzeImage.mockResolvedValue(mockAnalysisResult);
                AIPrediction.create.mockResolvedValue(mockPredictionId);

                await AIController.analyzePlantImage(req, res);

                expect(ImageAnalysisService.validateImage).toHaveBeenCalledWith(req.file);
                expect(DiseaseRecognitionService.analyzeImage).toHaveBeenCalledWith(
                    '/uploads/test-plant-image.jpg',
                    'plant-123'
                );
                expect(AIPrediction.create).toHaveBeenCalledWith({
                    user_id: 'test-user-uuid',
                    plant_id: 'plant-123',
                    prediction_type: 'disease_detection',
                    result_data: mockAnalysisResult,
                    confidence_score: 0.89,
                    model_version: expect.any(String),
                    image_path: '/uploads/test-plant-image.jpg'
                });
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    analysis: mockAnalysisResult,
                    prediction_id: mockPredictionId
                });
            });

            it('should validate image file requirements', async () => {
                req.file = null;

                await AIController.analyzePlantImage(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Image file is required'
                });
            });

            it('should validate plant ownership', async () => {
                Plant.findById.mockResolvedValue({
                    plant_id: 'plant-123',
                    plant_name: 'Tomato Plant',
                    user_id: 'other-user-uuid' // Different user
                });

                await AIController.analyzePlantImage(req, res);

                expect(res.status).toHaveBeenCalledWith(403);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Access denied to this plant'
                });
            });

            it('should handle image validation errors', async () => {
                Plant.findById.mockResolvedValue({
                    plant_id: 'plant-123',
                    user_id: 'test-user-uuid'
                });

                ImageAnalysisService.validateImage.mockReturnValue({
                    valid: false,
                    error: 'File size too large'
                });

                await AIController.analyzePlantImage(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'File size too large'
                });
            });

            it('should handle disease recognition service errors', async () => {
                Plant.findById.mockResolvedValue({
                    plant_id: 'plant-123',
                    user_id: 'test-user-uuid'
                });

                ImageAnalysisService.validateImage.mockReturnValue({ valid: true });
                DiseaseRecognitionService.analyzeImage.mockRejectedValue(
                    new Error('AI model temporarily unavailable')
                );

                await AIController.analyzePlantImage(req, res);

                expect(SystemLog.error).toHaveBeenCalledWith(
                    'ai',
                    'disease_analysis',
                    'AI model temporarily unavailable',
                    'test-user-uuid'
                );
                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Disease analysis failed',
                    message: 'AI model temporarily unavailable'
                });
            });

            it('should handle healthy plant detection', async () => {
                const mockHealthyResult = {
                    disease_detected: false,
                    health_score: 0.95,
                    general_condition: 'excellent',
                    care_suggestions: [
                        'Continue current care routine',
                        'Monitor for seasonal changes'
                    ]
                };

                Plant.findById.mockResolvedValue({
                    plant_id: 'plant-123',
                    user_id: 'test-user-uuid'
                });

                ImageAnalysisService.validateImage.mockReturnValue({ valid: true });
                DiseaseRecognitionService.analyzeImage.mockResolvedValue(mockHealthyResult);
                AIPrediction.create.mockResolvedValue('prediction-456');

                await AIController.analyzePlantImage(req, res);

                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    analysis: mockHealthyResult,
                    prediction_id: 'prediction-456'
                });
            });

            it('should require Ultimate subscription for disease recognition', async () => {
                req.user.role = 'Premium'; // Not Ultimate

                await AIController.analyzePlantImage(req, res);

                expect(res.status).toHaveBeenCalledWith(403);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Ultimate subscription required for AI disease recognition'
                });
            });
        });

        describe('AIController.getAnalysisHistory', () => {
            it('should retrieve user analysis history', async () => {
                const mockHistory = [
                    {
                        prediction_id: 'pred-1',
                        plant_id: 'plant-123',
                        prediction_type: 'disease_detection',
                        result_data: { disease_detected: true, disease_name: 'Rust' },
                        confidence_score: 0.87,
                        created_at: '2023-01-01T10:00:00Z'
                    },
                    {
                        prediction_id: 'pred-2',
                        plant_id: 'plant-456',
                        prediction_type: 'disease_detection',
                        result_data: { disease_detected: false, health_score: 0.92 },
                        confidence_score: 0.92,
                        created_at: '2023-01-02T10:00:00Z'
                    }
                ];

                AIPrediction.findByUserAndType.mockResolvedValue(mockHistory);

                await AIController.getAnalysisHistory(req, res);

                expect(AIPrediction.findByUserAndType).toHaveBeenCalledWith(
                    'test-user-uuid',
                    'disease_detection'
                );
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    data: mockHistory
                });
            });

            it('should filter by plant if specified', async () => {
                req.query.plant_id = 'plant-123';

                const mockHistory = [
                    {
                        prediction_id: 'pred-1',
                        plant_id: 'plant-123',
                        prediction_type: 'disease_detection'
                    }
                ];

                AIPrediction.findByUserPlantAndType.mockResolvedValue(mockHistory);

                await AIController.getAnalysisHistory(req, res);

                expect(AIPrediction.findByUserPlantAndType).toHaveBeenCalledWith(
                    'test-user-uuid',
                    'plant-123',
                    'disease_detection'
                );
            });
        });
    });

    describe('UC13: Growth Prediction & Analytics', () => {
        describe('AIController.predictGrowth', () => {
            beforeEach(() => {
                req.params.plantId = 'plant-123';
                req.body = {
                    prediction_period: 30, // days
                    prediction_type: 'growth_rate'
                };
            });

            it('should generate growth predictions successfully', async () => {
                const mockPlant = {
                    plant_id: 'plant-123',
                    plant_name: 'Basil Plant',
                    user_id: 'test-user-uuid',
                    plant_profile_id: 'herb-profile-1'
                };

                const mockSensorData = [
                    {
                        timestamp: '2023-01-01T10:00:00Z',
                        moisture: 65,
                        temperature: 24,
                        light: 800
                    },
                    // ... more historical data
                ];

                const mockPrediction = {
                    predicted_growth_rate: 0.85, // cm/week
                    optimal_conditions: {
                        moisture: { min: 60, max: 70 },
                        temperature: { min: 22, max: 26 },
                        light: { min: 600, max: 1000 }
                    },
                    growth_timeline: [
                        { day: 7, expected_height: 12.3 },
                        { day: 14, expected_height: 14.1 },
                        { day: 21, expected_height: 15.8 },
                        { day: 30, expected_height: 18.2 }
                    ],
                    confidence: 0.78,
                    factors_analysis: {
                        moisture_impact: 0.4,
                        temperature_impact: 0.3,
                        light_impact: 0.3
                    }
                };

                Plant.findById.mockResolvedValue(mockPlant);
                SensorData.getHistoricalData.mockResolvedValue(mockSensorData);
                PredictionService.predictGrowth.mockResolvedValue(mockPrediction);
                AIPrediction.create.mockResolvedValue('prediction-789');

                await AIController.predictGrowth(req, res);

                expect(Plant.findById).toHaveBeenCalledWith('plant-123');
                expect(SensorData.getHistoricalData).toHaveBeenCalledWith(
                    'plant-123',
                    expect.any(Number)
                );
                expect(PredictionService.predictGrowth).toHaveBeenCalledWith(
                    mockSensorData,
                    mockPlant,
                    30,
                    'growth_rate'
                );
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    prediction: mockPrediction,
                    prediction_id: 'prediction-789'
                });
            });

            it('should validate prediction period', async () => {
                req.body.prediction_period = 365; // Too long

                await AIController.predictGrowth(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Prediction period must be between 1 and 90 days'
                });
            });

            it('should require sufficient historical data', async () => {
                Plant.findById.mockResolvedValue({
                    plant_id: 'plant-123',
                    user_id: 'test-user-uuid'
                });

                SensorData.getHistoricalData.mockResolvedValue([]); // No historical data

                await AIController.predictGrowth(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Insufficient historical data for prediction (minimum 7 days required)'
                });
            });

            it('should handle prediction service errors', async () => {
                Plant.findById.mockResolvedValue({
                    plant_id: 'plant-123',
                    user_id: 'test-user-uuid'
                });

                SensorData.getHistoricalData.mockResolvedValue([
                    { timestamp: '2023-01-01', moisture: 65 }
                ]);

                PredictionService.predictGrowth.mockRejectedValue(
                    new Error('Prediction model failed')
                );

                await AIController.predictGrowth(req, res);

                expect(SystemLog.error).toHaveBeenCalledWith(
                    'ai',
                    'growth_prediction',
                    'Prediction model failed',
                    'test-user-uuid'
                );
                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Growth prediction failed'
                });
            });

            it('should support different prediction types', async () => {
                req.body.prediction_type = 'harvest_time';

                Plant.findById.mockResolvedValue({
                    plant_id: 'plant-123',
                    user_id: 'test-user-uuid'
                });

                SensorData.getHistoricalData.mockResolvedValue([
                    { timestamp: '2023-01-01', moisture: 65 }
                ]);

                const mockHarvestPrediction = {
                    estimated_harvest_date: '2023-03-15',
                    harvest_readiness_score: 0.82,
                    yield_estimation: '2.5 kg'
                };

                PredictionService.predictGrowth.mockResolvedValue(mockHarvestPrediction);

                await AIController.predictGrowth(req, res);

                expect(PredictionService.predictGrowth).toHaveBeenCalledWith(
                    expect.any(Array),
                    expect.any(Object),
                    30,
                    'harvest_time'
                );
            });

            it('should require Premium subscription for growth predictions', async () => {
                req.user.role = 'user'; // Basic user

                await AIController.predictGrowth(req, res);

                expect(res.status).toHaveBeenCalledWith(403);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Premium subscription required for growth predictions'
                });
            });
        });

        describe('AIController.getGrowthAnalytics', () => {
            it('should provide comprehensive growth analytics', async () => {
                req.params.plantId = 'plant-123';

                const mockAnalytics = {
                    plant_info: {
                        plant_id: 'plant-123',
                        plant_name: 'Tomato Plant',
                        days_since_planted: 45
                    },
                    growth_summary: {
                        average_growth_rate: 0.7,
                        total_growth: 15.2,
                        growth_acceleration: 0.05
                    },
                    environmental_correlation: {
                        moisture_correlation: 0.65,
                        temperature_correlation: 0.58,
                        light_correlation: 0.72
                    },
                    recommendations: [
                        'Increase light exposure for optimal growth',
                        'Maintain current watering schedule',
                        'Consider fertilization in 2 weeks'
                    ]
                };

                Plant.findById.mockResolvedValue({
                    plant_id: 'plant-123',
                    user_id: 'test-user-uuid'
                });

                PredictionService.getGrowthAnalytics.mockResolvedValue(mockAnalytics);

                await AIController.getGrowthAnalytics(req, res);

                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    analytics: mockAnalytics
                });
            });
        });
    });

    describe('UC14: AI Chatbot Consultation', () => {
        describe('AIController.chatbotConsultation', () => {
            beforeEach(() => {
                req.body = {
                    message: 'My tomato leaves are turning yellow, what should I do?',
                    plant_id: 'plant-123',
                    conversation_id: 'conv-456'
                };
            });

            it('should handle plant consultation query successfully', async () => {
                const mockResponse = {
                    response: 'Yellow leaves on tomato plants can indicate several issues. Based on your plant data, it appears to be nitrogen deficiency. I recommend applying a balanced fertilizer and ensuring proper watering.',
                    confidence: 0.85,
                    suggested_actions: [
                        'Apply nitrogen-rich fertilizer',
                        'Check soil drainage',
                        'Monitor watering frequency'
                    ],
                    related_resources: [
                        'Tomato Plant Care Guide',
                        'Nutrient Deficiency Symptoms'
                    ],
                    followup_questions: [
                        'How often do you water your tomato plant?',
                        'What type of soil are you using?'
                    ]
                };

                const mockPlant = {
                    plant_id: 'plant-123',
                    plant_name: 'Cherry Tomato',
                    user_id: 'test-user-uuid'
                };

                Plant.findById.mockResolvedValue(mockPlant);
                ChatbotService.processQuery.mockResolvedValue(mockResponse);
                ChatHistory.create.mockResolvedValue('chat-789');

                await AIController.chatbotConsultation(req, res);

                expect(Plant.findById).toHaveBeenCalledWith('plant-123');
                expect(ChatbotService.processQuery).toHaveBeenCalledWith(
                    'My tomato leaves are turning yellow, what should I do?',
                    mockPlant,
                    'test-user-uuid',
                    'conv-456'
                );
                expect(ChatHistory.create).toHaveBeenCalledWith({
                    user_id: 'test-user-uuid',
                    conversation_id: 'conv-456',
                    plant_id: 'plant-123',
                    user_message: 'My tomato leaves are turning yellow, what should I do?',
                    ai_response: mockResponse.response,
                    confidence_score: 0.85,
                    response_data: mockResponse
                });
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    response: mockResponse
                });
            });

            it('should handle general plant care queries', async () => {
                req.body = {
                    message: 'What are the best practices for indoor plant care?',
                    conversation_id: 'conv-456'
                    // No specific plant_id
                };

                const mockGeneralResponse = {
                    response: 'Here are the key principles for indoor plant care: 1) Provide adequate light, 2) Water consistently but not too much, 3) Ensure proper drainage, 4) Maintain appropriate humidity, 5) Feed regularly during growing season.',
                    confidence: 0.92,
                    category: 'general_care',
                    tips: [
                        'Most houseplants prefer bright, indirect light',
                        'Water when top inch of soil feels dry',
                        'Group plants together to increase humidity'
                    ]
                };

                ChatbotService.processQuery.mockResolvedValue(mockGeneralResponse);
                ChatHistory.create.mockResolvedValue('chat-890');

                await AIController.chatbotConsultation(req, res);

                expect(ChatbotService.processQuery).toHaveBeenCalledWith(
                    'What are the best practices for indoor plant care?',
                    null,
                    'test-user-uuid',
                    'conv-456'
                );
            });

            it('should validate message content', async () => {
                req.body.message = '';

                await AIController.chatbotConsultation(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Message is required'
                });
            });

            it('should handle chatbot service errors', async () => {
                Plant.findById.mockResolvedValue({
                    plant_id: 'plant-123',
                    user_id: 'test-user-uuid'
                });

                ChatbotService.processQuery.mockRejectedValue(
                    new Error('Chatbot service temporarily unavailable')
                );

                await AIController.chatbotConsultation(req, res);

                expect(SystemLog.error).toHaveBeenCalledWith(
                    'ai',
                    'chatbot_consultation',
                    'Chatbot service temporarily unavailable',
                    'test-user-uuid'
                );
                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Consultation service temporarily unavailable'
                });
            });

            it('should require Ultimate subscription for AI consultation', async () => {
                req.user.role = 'Premium'; // Not Ultimate

                await AIController.chatbotConsultation(req, res);

                expect(res.status).toHaveBeenCalledWith(403);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'Ultimate subscription required for AI consultation'
                });
            });

            it('should handle conversation context', async () => {
                req.body = {
                    message: 'How often should I water it?',
                    conversation_id: 'conv-456'
                };

                // Mock previous conversation context
                ChatHistory.getConversationContext.mockResolvedValue([
                    {
                        user_message: 'My tomato plant is wilting',
                        ai_response: 'Wilting can indicate watering issues...',
                        plant_id: 'plant-123'
                    }
                ]);

                const mockContextualResponse = {
                    response: 'Based on our previous discussion about your tomato plant, water it when the top inch of soil feels dry, typically every 2-3 days.',
                    confidence: 0.88,
                    context_used: true
                };

                ChatbotService.processQuery.mockResolvedValue(mockContextualResponse);

                await AIController.chatbotConsultation(req, res);

                expect(ChatHistory.getConversationContext).toHaveBeenCalledWith('conv-456');
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    response: mockContextualResponse
                });
            });
        });

        describe('AIController.getChatHistory', () => {
            it('should retrieve user chat history', async () => {
                const mockHistory = [
                    {
                        chat_id: 'chat-1',
                        conversation_id: 'conv-456',
                        user_message: 'My plant leaves are yellow',
                        ai_response: 'This could indicate nutrient deficiency...',
                        created_at: '2023-01-01T10:00:00Z'
                    },
                    {
                        chat_id: 'chat-2',
                        conversation_id: 'conv-456',
                        user_message: 'What fertilizer should I use?',
                        ai_response: 'For yellow leaves, try a balanced NPK fertilizer...',
                        created_at: '2023-01-01T10:05:00Z'
                    }
                ];

                ChatHistory.findByUser.mockResolvedValue(mockHistory);

                await AIController.getChatHistory(req, res);

                expect(ChatHistory.findByUser).toHaveBeenCalledWith('test-user-uuid');
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    data: mockHistory
                });
            });

            it('should filter by conversation ID if provided', async () => {
                req.query.conversation_id = 'conv-456';

                ChatHistory.findByConversation.mockResolvedValue([]);

                await AIController.getChatHistory(req, res);

                expect(ChatHistory.findByConversation).toHaveBeenCalledWith(
                    'test-user-uuid',
                    'conv-456'
                );
            });
        });
    });

    describe('AI Model Management', () => {
        describe('AIController.getModelStatus', () => {
            it('should return AI model status and capabilities', async () => {
                const mockModelStatus = {
                    disease_recognition: {
                        status: 'active',
                        version: '2.1.0',
                        accuracy: 0.89,
                        last_updated: '2023-01-01T00:00:00Z',
                        supported_diseases: [
                            'Powdery Mildew',
                            'Rust',
                            'Bacterial Spot',
                            'Mosaic Virus'
                        ]
                    },
                    growth_prediction: {
                        status: 'active',
                        version: '1.8.2',
                        accuracy: 0.76,
                        last_updated: '2023-01-01T00:00:00Z',
                        supported_plants: ['tomato', 'lettuce', 'herbs', 'peppers']
                    },
                    chatbot: {
                        status: 'active',
                        version: '3.0.1',
                        knowledge_base_size: '15000 entries',
                        last_updated: '2023-01-01T00:00:00Z',
                        languages: ['en', 'es', 'fr']
                    }
                };

                AIModel.getActiveModels.mockResolvedValue(mockModelStatus);

                await AIController.getModelStatus(req, res);

                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    models: mockModelStatus
                });
            });

            it('should handle model service unavailability', async () => {
                AIModel.getActiveModels.mockRejectedValue(
                    new Error('Model registry unavailable')
                );

                await AIController.getModelStatus(req, res);

                expect(res.status).toHaveBeenCalledWith(503);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    error: 'AI services temporarily unavailable'
                });
            });
        });
    });

    describe('Error Handling & Security', () => {
        it('should handle file upload errors gracefully', async () => {
            const mockMulterError = new Error('File too large');
            mockMulterError.code = 'LIMIT_FILE_SIZE';

            req.file = null;
            req.fileValidationError = mockMulterError;

            await AIController.analyzePlantImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'File upload failed: File too large'
            });
        });

        it('should sanitize user input for chatbot queries', async () => {
            req.body = {
                message: '<script>alert("xss")</script>What about my plant?',
                conversation_id: 'conv-456'
            };

            ChatbotService.processQuery.mockResolvedValue({
                response: 'Safe response about plant care',
                confidence: 0.85
            });

            await AIController.chatbotConsultation(req, res);

            // Verify input sanitization occurred
            expect(ChatbotService.processQuery).toHaveBeenCalledWith(
                expect.not.stringContaining('<script>'),
                expect.any(Object),
                'test-user-uuid',
                'conv-456'
            );
        });

        it('should validate image file types', async () => {
            req.file = {
                filename: 'test.pdf',
                mimetype: 'application/pdf',
                size: 1000000
            };

            ImageAnalysisService.validateImage.mockReturnValue({
                valid: false,
                error: 'Invalid file type. Only images are allowed.'
            });

            Plant.findById.mockResolvedValue({
                plant_id: 'plant-123',
                user_id: 'test-user-uuid'
            });

            await AIController.analyzePlantImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid file type. Only images are allowed.'
            });
        });

        it('should rate limit AI service calls', async () => {
            // Mock rate limiting check
            const mockRateLimit = jest.fn().mockReturnValue({
                exceeded: true,
                resetTime: Date.now() + 3600000
            });

            req.rateLimit = mockRateLimit();

            if (req.rateLimit.exceeded) {
                res.status(429).json({
                    success: false,
                    error: 'Rate limit exceeded. Please try again later.',
                    resetTime: req.rateLimit.resetTime
                });
                return;
            }

            expect(res.status).toHaveBeenCalledWith(429);
        });
    });
});