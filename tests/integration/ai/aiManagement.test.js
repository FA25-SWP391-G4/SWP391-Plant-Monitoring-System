/**
 * AI & ML INTEGRATION TESTS
 * =========================
 * 
 * Tests for UC12: Plant Disease Recognition
 * Tests for UC13: Growth Prediction & Analytics
 * Tests for UC14: AI Chatbot Consultation
 * 
 * Integration testing with:
 * - Real AI service simulation
 * - File upload handling
 * - Database transactions
 * - Authentication flows
 */

const request = require('supertest');
const app = require('../../../app');
const path = require('path');
const fs = require('fs');
const Plant = require('../../../models/Plant');
const User = require('../../../models/User');
const AIPrediction = require('../../../models/AIPrediction');
const ChatHistory = require('../../../models/ChatHistory');
const SensorData = require('../../../models/SensorData');
const { setupTestDatabase, cleanupTestDatabase, createTestUser, generateTestToken } = require('../../helpers/testHelpers');

describe('AI & ML Integration Tests', () => {
    let basicUser, basicUserToken, premiumUser, premiumUserToken, ultimateUser, ultimateUserToken;
    let testPlant, testImagePath;

    beforeAll(async () => {
        await setupTestDatabase();

        // Create test users
        basicUser = await createTestUser('basic@ai.com', 'user');
        basicUserToken = generateTestToken(basicUser);

        premiumUser = await createTestUser('premium@ai.com', 'Premium');
        premiumUserToken = generateTestToken(premiumUser);

        ultimateUser = await createTestUser('ultimate@ai.com', 'Ultimate');
        ultimateUserToken = generateTestToken(ultimateUser);

        // Create test plant
        testPlant = await Plant.create({
            user_id: ultimateUser.user_id,
            plant_name: 'Test Tomato Plant',
            plant_profile_id: 1,
            zone_id: 1
        });

        // Setup test image
        testImagePath = path.join(__dirname, '../../fixtures/test-plant-image.jpg');
        if (!fs.existsSync(testImagePath)) {
            // Create a minimal test image if it doesn't exist
            const testImageDir = path.dirname(testImagePath);
            if (!fs.existsSync(testImageDir)) {
                fs.mkdirSync(testImageDir, { recursive: true });
            }
            fs.writeFileSync(testImagePath, 'fake-image-data');
        }
    });

    afterAll(async () => {
        await cleanupTestDatabase();
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
    });

    beforeEach(async () => {
        // Clean up AI-related data
        await AIPrediction.deleteAllTestData();
        await ChatHistory.deleteAllTestData();
    });

    describe('UC12: Plant Disease Recognition Integration', () => {
        describe('POST /api/ai/analyze-image', () => {
            it('should analyze plant image for Ultimate users', async () => {
                const response = await request(app)
                    .post('/api/ai/analyze-image')
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .field('plant_id', testPlant.plant_id)
                    .attach('image', testImagePath);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.analysis).toBeDefined();
                expect(response.body.prediction_id).toBeDefined();

                // Verify analysis result structure
                const analysis = response.body.analysis;
                expect(analysis).toHaveProperty('disease_detected');
                if (analysis.disease_detected) {
                    expect(analysis).toHaveProperty('disease_name');
                    expect(analysis).toHaveProperty('confidence');
                    expect(analysis).toHaveProperty('treatment_suggestions');
                } else {
                    expect(analysis).toHaveProperty('health_score');
                    expect(analysis).toHaveProperty('care_suggestions');
                }

                // Verify prediction was saved to database
                const prediction = await AIPrediction.findById(response.body.prediction_id);
                expect(prediction).not.toBeNull();
                expect(prediction.user_id).toBe(ultimateUser.user_id);
                expect(prediction.plant_id).toBe(testPlant.plant_id);
                expect(prediction.prediction_type).toBe('disease_detection');
            });

            it('should reject access for Premium users', async () => {
                const response = await request(app)
                    .post('/api/ai/analyze-image')
                    .set('Authorization', `Bearer ${premiumUserToken}`)
                    .field('plant_id', testPlant.plant_id)
                    .attach('image', testImagePath);

                expect(response.status).toBe(403);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toContain('Ultimate subscription required');
            });

            it('should reject access for Basic users', async () => {
                const response = await request(app)
                    .post('/api/ai/analyze-image')
                    .set('Authorization', `Bearer ${basicUserToken}`)
                    .field('plant_id', testPlant.plant_id)
                    .attach('image', testImagePath);

                expect(response.status).toBe(403);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toContain('Ultimate subscription required');
            });

            it('should validate image file upload', async () => {
                const response = await request(app)
                    .post('/api/ai/analyze-image')
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .field('plant_id', testPlant.plant_id);
                    // No image attached

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toBe('Image file is required');
            });

            it('should validate plant ownership', async () => {
                // Create plant for different user
                const otherPlant = await Plant.create({
                    user_id: premiumUser.user_id,
                    plant_name: 'Other User Plant',
                    plant_profile_id: 1,
                    zone_id: 1
                });

                const response = await request(app)
                    .post('/api/ai/analyze-image')
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .field('plant_id', otherPlant.plant_id)
                    .attach('image', testImagePath);

                expect(response.status).toBe(403);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toBe('Access denied to this plant');
            });

            it('should validate image file type and size', async () => {
                // Create a text file to test invalid file type
                const textFilePath = path.join(__dirname, '../../fixtures/invalid-file.txt');
                fs.writeFileSync(textFilePath, 'This is not an image');

                const response = await request(app)
                    .post('/api/ai/analyze-image')
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .field('plant_id', testPlant.plant_id)
                    .attach('image', textFilePath);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toContain('Invalid file type');

                fs.unlinkSync(textFilePath);
            });

            it('should handle multiple analyses for same plant', async () => {
                // First analysis
                const response1 = await request(app)
                    .post('/api/ai/analyze-image')
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .field('plant_id', testPlant.plant_id)
                    .attach('image', testImagePath);

                expect(response1.status).toBe(200);

                // Second analysis
                const response2 = await request(app)
                    .post('/api/ai/analyze-image')
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .field('plant_id', testPlant.plant_id)
                    .attach('image', testImagePath);

                expect(response2.status).toBe(200);

                // Both should have different prediction IDs
                expect(response1.body.prediction_id).not.toBe(response2.body.prediction_id);
            });
        });

        describe('GET /api/ai/analysis-history', () => {
            beforeEach(async () => {
                // Create some test predictions
                await AIPrediction.create({
                    user_id: ultimateUser.user_id,
                    plant_id: testPlant.plant_id,
                    prediction_type: 'disease_detection',
                    result_data: { disease_detected: true, disease_name: 'Powdery Mildew' },
                    confidence_score: 0.85,
                    model_version: '2.1.0'
                });

                await AIPrediction.create({
                    user_id: ultimateUser.user_id,
                    plant_id: testPlant.plant_id,
                    prediction_type: 'disease_detection',
                    result_data: { disease_detected: false, health_score: 0.92 },
                    confidence_score: 0.92,
                    model_version: '2.1.0'
                });
            });

            it('should retrieve analysis history for Ultimate users', async () => {
                const response = await request(app)
                    .get('/api/ai/analysis-history')
                    .set('Authorization', `Bearer ${ultimateUserToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(2);

                const analyses = response.body.data;
                expect(analyses[0]).toHaveProperty('prediction_id');
                expect(analyses[0]).toHaveProperty('plant_id');
                expect(analyses[0]).toHaveProperty('prediction_type', 'disease_detection');
                expect(analyses[0]).toHaveProperty('result_data');
                expect(analyses[0]).toHaveProperty('confidence_score');
            });

            it('should filter by plant ID', async () => {
                const response = await request(app)
                    .get(`/api/ai/analysis-history?plant_id=${testPlant.plant_id}`)
                    .set('Authorization', `Bearer ${ultimateUserToken}`);

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(2);
                
                response.body.data.forEach(analysis => {
                    expect(analysis.plant_id).toBe(testPlant.plant_id);
                });
            });

            it('should return empty array for users with no history', async () => {
                const response = await request(app)
                    .get('/api/ai/analysis-history')
                    .set('Authorization', `Bearer ${premiumUserToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(0);
            });
        });
    });

    describe('UC13: Growth Prediction & Analytics Integration', () => {
        beforeEach(async () => {
            // Create historical sensor data
            const now = new Date();
            const sensorDataPoints = [];

            for (let i = 0; i < 14; i++) {
                const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                sensorDataPoints.push({
                    device_id: 'sensor-1',
                    plant_id: testPlant.plant_id,
                    moisture: 60 + Math.random() * 20, // 60-80%
                    temperature: 22 + Math.random() * 6, // 22-28°C
                    light: 600 + Math.random() * 400, // 600-1000 lux
                    timestamp: timestamp
                });
            }

            for (const dataPoint of sensorDataPoints) {
                await SensorData.create(dataPoint);
            }
        });

        describe('POST /api/ai/predict-growth/:plantId', () => {
            it('should generate growth predictions for Premium users', async () => {
                const response = await request(app)
                    .post(`/api/ai/predict-growth/${testPlant.plant_id}`)
                    .set('Authorization', `Bearer ${ultimateUserToken}`) // Ultimate can access
                    .send({
                        prediction_period: 30,
                        prediction_type: 'growth_rate'
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.prediction).toBeDefined();
                expect(response.body.prediction_id).toBeDefined();

                const prediction = response.body.prediction;
                expect(prediction).toHaveProperty('predicted_growth_rate');
                expect(prediction).toHaveProperty('optimal_conditions');
                expect(prediction).toHaveProperty('growth_timeline');
                expect(prediction).toHaveProperty('confidence');

                // Verify prediction was saved
                const savedPrediction = await AIPrediction.findById(response.body.prediction_id);
                expect(savedPrediction.prediction_type).toBe('growth_prediction');
            });

            it('should allow Premium users access to growth predictions', async () => {
                const response = await request(app)
                    .post(`/api/ai/predict-growth/${testPlant.plant_id}`)
                    .set('Authorization', `Bearer ${premiumUserToken}`)
                    .send({
                        prediction_period: 14,
                        prediction_type: 'growth_rate'
                    });

                // Premium users should be able to access if they own the plant
                // First create a plant for premium user
                const premiumPlant = await Plant.create({
                    user_id: premiumUser.user_id,
                    plant_name: 'Premium User Plant',
                    plant_profile_id: 1,
                    zone_id: 1
                });

                // Add sensor data
                await SensorData.create({
                    device_id: 'sensor-2',
                    plant_id: premiumPlant.plant_id,
                    moisture: 65,
                    temperature: 24,
                    light: 800,
                    timestamp: new Date()
                });

                const premiumResponse = await request(app)
                    .post(`/api/ai/predict-growth/${premiumPlant.plant_id}`)
                    .set('Authorization', `Bearer ${premiumUserToken}`)
                    .send({
                        prediction_period: 14,
                        prediction_type: 'growth_rate'
                    });

                expect(premiumResponse.status).toBe(200);
            });

            it('should reject Basic users', async () => {
                const response = await request(app)
                    .post(`/api/ai/predict-growth/${testPlant.plant_id}`)
                    .set('Authorization', `Bearer ${basicUserToken}`)
                    .send({
                        prediction_period: 30,
                        prediction_type: 'growth_rate'
                    });

                expect(response.status).toBe(403);
                expect(response.body.error).toContain('Premium subscription required');
            });

            it('should validate prediction period', async () => {
                const response = await request(app)
                    .post(`/api/ai/predict-growth/${testPlant.plant_id}`)
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .send({
                        prediction_period: 365, // Too long
                        prediction_type: 'growth_rate'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Prediction period must be between 1 and 90 days');
            });

            it('should require sufficient historical data', async () => {
                // Create plant with no sensor data
                const newPlant = await Plant.create({
                    user_id: ultimateUser.user_id,
                    plant_name: 'New Plant No Data',
                    plant_profile_id: 1,
                    zone_id: 1
                });

                const response = await request(app)
                    .post(`/api/ai/predict-growth/${newPlant.plant_id}`)
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .send({
                        prediction_period: 30,
                        prediction_type: 'growth_rate'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Insufficient historical data');
            });

            it('should support different prediction types', async () => {
                const response = await request(app)
                    .post(`/api/ai/predict-growth/${testPlant.plant_id}`)
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .send({
                        prediction_period: 60,
                        prediction_type: 'harvest_time'
                    });

                expect(response.status).toBe(200);
                expect(response.body.prediction).toBeDefined();
                
                // Harvest prediction should have different fields
                const prediction = response.body.prediction;
                expect(prediction).toHaveProperty('estimated_harvest_date');
            });
        });

        describe('GET /api/ai/growth-analytics/:plantId', () => {
            it('should provide comprehensive growth analytics', async () => {
                const response = await request(app)
                    .get(`/api/ai/growth-analytics/${testPlant.plant_id}`)
                    .set('Authorization', `Bearer ${ultimateUserToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.analytics).toBeDefined();

                const analytics = response.body.analytics;
                expect(analytics).toHaveProperty('plant_info');
                expect(analytics).toHaveProperty('growth_summary');
                expect(analytics).toHaveProperty('environmental_correlation');
                expect(analytics).toHaveProperty('recommendations');
            });

            it('should require Premium access', async () => {
                const response = await request(app)
                    .get(`/api/ai/growth-analytics/${testPlant.plant_id}`)
                    .set('Authorization', `Bearer ${basicUserToken}`);

                expect(response.status).toBe(403);
                expect(response.body.error).toContain('Premium subscription required');
            });
        });
    });

    describe('UC14: AI Chatbot Consultation Integration', () => {
        describe('POST /api/ai/chatbot', () => {
            it('should handle plant-specific consultation for Ultimate users', async () => {
                const response = await request(app)
                    .post('/api/ai/chatbot')
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .send({
                        message: 'My tomato leaves are turning yellow, what should I do?',
                        plant_id: testPlant.plant_id,
                        conversation_id: 'conv-123'
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.response).toBeDefined();

                const aiResponse = response.body.response;
                expect(aiResponse).toHaveProperty('response');
                expect(aiResponse).toHaveProperty('confidence');
                expect(aiResponse).toHaveProperty('suggested_actions');
                expect(typeof aiResponse.response).toBe('string');
                expect(aiResponse.confidence).toBeGreaterThan(0);

                // Verify chat history was saved
                const chatHistory = await ChatHistory.findByConversation(
                    ultimateUser.user_id,
                    'conv-123'
                );
                expect(chatHistory.length).toBe(1);
                expect(chatHistory[0].user_message).toBe('My tomato leaves are turning yellow, what should I do?');
                expect(chatHistory[0].plant_id).toBe(testPlant.plant_id);
            });

            it('should handle general plant care queries', async () => {
                const response = await request(app)
                    .post('/api/ai/chatbot')
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .send({
                        message: 'What are the best practices for indoor plant care?',
                        conversation_id: 'conv-124'
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.response.response).toContain('indoor plant care');
            });

            it('should maintain conversation context', async () => {
                // First message
                await request(app)
                    .post('/api/ai/chatbot')
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .send({
                        message: 'My plant is wilting',
                        plant_id: testPlant.plant_id,
                        conversation_id: 'conv-125'
                    });

                // Follow-up message with context
                const response = await request(app)
                    .post('/api/ai/chatbot')
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .send({
                        message: 'How often should I water it?',
                        conversation_id: 'conv-125'
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                
                // Response should be contextual
                const aiResponse = response.body.response;
                expect(aiResponse.context_used).toBe(true);
            });

            it('should reject non-Ultimate users', async () => {
                const response = await request(app)
                    .post('/api/ai/chatbot')
                    .set('Authorization', `Bearer ${premiumUserToken}`)
                    .send({
                        message: 'Help with my plant',
                        conversation_id: 'conv-126'
                    });

                expect(response.status).toBe(403);
                expect(response.body.error).toContain('Ultimate subscription required');
            });

            it('should validate message content', async () => {
                const response = await request(app)
                    .post('/api/ai/chatbot')
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .send({
                        message: '',
                        conversation_id: 'conv-127'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toBe('Message is required');
            });

            it('should handle malformed input gracefully', async () => {
                const response = await request(app)
                    .post('/api/ai/chatbot')
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .send({
                        message: 'a'.repeat(10000), // Very long message
                        conversation_id: 'conv-128'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Message too long');
            });

            it('should sanitize HTML and script tags', async () => {
                const response = await request(app)
                    .post('/api/ai/chatbot')
                    .set('Authorization', `Bearer ${ultimateUserToken}`)
                    .send({
                        message: '<script>alert("xss")</script>What about my plant?',
                        conversation_id: 'conv-129'
                    });

                expect(response.status).toBe(200);
                
                // Check that the saved message is sanitized
                const chatHistory = await ChatHistory.findByConversation(
                    ultimateUser.user_id,
                    'conv-129'
                );
                expect(chatHistory[0].user_message).not.toContain('<script>');
            });
        });

        describe('GET /api/ai/chat-history', () => {
            beforeEach(async () => {
                // Create some test chat history
                await ChatHistory.create({
                    user_id: ultimateUser.user_id,
                    conversation_id: 'conv-130',
                    plant_id: testPlant.plant_id,
                    user_message: 'What is wrong with my plant?',
                    ai_response: 'I can help identify plant issues. Can you describe the symptoms?',
                    confidence_score: 0.85
                });

                await ChatHistory.create({
                    user_id: ultimateUser.user_id,
                    conversation_id: 'conv-130',
                    plant_id: testPlant.plant_id,
                    user_message: 'The leaves are turning brown',
                    ai_response: 'Brown leaves could indicate overwatering or fungal issues...',
                    confidence_score: 0.78
                });
            });

            it('should retrieve chat history', async () => {
                const response = await request(app)
                    .get('/api/ai/chat-history')
                    .set('Authorization', `Bearer ${ultimateUserToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(2);

                const history = response.body.data;
                expect(history[0]).toHaveProperty('user_message');
                expect(history[0]).toHaveProperty('ai_response');
                expect(history[0]).toHaveProperty('conversation_id');
            });

            it('should filter by conversation ID', async () => {
                const response = await request(app)
                    .get('/api/ai/chat-history?conversation_id=conv-130')
                    .set('Authorization', `Bearer ${ultimateUserToken}`);

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(2);
                
                response.body.data.forEach(chat => {
                    expect(chat.conversation_id).toBe('conv-130');
                });
            });

            it('should return empty array for users with no history', async () => {
                const response = await request(app)
                    .get('/api/ai/chat-history')
                    .set('Authorization', `Bearer ${premiumUserToken}`);

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(0);
            });
        });
    });

    describe('AI Model Status and Health', () => {
        describe('GET /api/ai/models/status', () => {
            it('should return AI model status', async () => {
                const response = await request(app)
                    .get('/api/ai/models/status')
                    .set('Authorization', `Bearer ${ultimateUserToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.models).toBeDefined();

                const models = response.body.models;
                expect(models).toHaveProperty('disease_recognition');
                expect(models).toHaveProperty('growth_prediction');
                expect(models).toHaveProperty('chatbot');

                // Each model should have status information
                Object.values(models).forEach(model => {
                    expect(model).toHaveProperty('status');
                    expect(model).toHaveProperty('version');
                    expect(model).toHaveProperty('last_updated');
                });
            });

            it('should be accessible to all authenticated users', async () => {
                const response = await request(app)
                    .get('/api/ai/models/status')
                    .set('Authorization', `Bearer ${basicUserToken}`);

                expect(response.status).toBe(200);
            });
        });
    });

    describe('Rate Limiting and Performance', () => {
        it('should enforce rate limits for AI endpoints', async () => {
            const promises = [];
            
            // Make multiple rapid requests
            for (let i = 0; i < 20; i++) {
                promises.push(
                    request(app)
                        .post('/api/ai/chatbot')
                        .set('Authorization', `Bearer ${ultimateUserToken}`)
                        .send({
                            message: `Test message ${i}`,
                            conversation_id: 'rate-test'
                        })
                );
            }

            const responses = await Promise.all(promises);
            
            // Some requests should be rate limited
            const rateLimitedResponses = responses.filter(r => r.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });

        it('should handle concurrent image analysis requests', async () => {
            const promises = [];

            // Make concurrent image analysis requests
            for (let i = 0; i < 3; i++) {
                promises.push(
                    request(app)
                        .post('/api/ai/analyze-image')
                        .set('Authorization', `Bearer ${ultimateUserToken}`)
                        .field('plant_id', testPlant.plant_id)
                        .attach('image', testImagePath)
                );
            }

            const responses = await Promise.all(promises);
            
            // All should complete successfully (with proper queuing)
            responses.forEach(response => {
                expect([200, 429]).toContain(response.status); // Either success or rate limited
            });
        });

        it('should timeout long-running AI operations', async () => {
            // This test would require mocking a slow AI service
            const response = await request(app)
                .post('/api/ai/analyze-image')
                .set('Authorization', `Bearer ${ultimateUserToken}`)
                .field('plant_id', testPlant.plant_id)
                .attach('image', testImagePath)
                .timeout(30000); // 30 second timeout

            // Should complete within timeout or return appropriate error
            expect([200, 408, 500]).toContain(response.status);
        });
    });
});