/**
 * Unit Tests for Watering Prediction TensorFlow.js Model
 * Tests model inference, prediction accuracy, and core functionality
 * Requirements: 2.1, 2.2
 */

const WateringPredictionModel = require('../ai_models/watering_prediction/model');
const HybridWateringModel = require('../ai_models/watering_prediction/hybridModel');
const wateringPrediction = require('../ai_models/watering_prediction/index');

describe('Watering Prediction Model Tests', () => {
    let model;
    let hybridModel;

    beforeEach(() => {
        // Create fresh instances for each test
        model = new WateringPredictionModel();
        hybridModel = new HybridWateringModel();
    });

    afterEach(() => {
        // Clean up models to prevent memory leaks
        if (model) {
            model.dispose();
        }
        if (hybridModel) {
            hybridModel.dispose();
        }
    });

    describe('TensorFlow.js Model Inference', () => {
        test('should create model with correct architecture', () => {
            const createdModel = model.createModel();
            
            expect(createdModel).toBeDefined();
            expect(model.model).toBeDefined();
            expect(model.inputFeatures).toEqual(['moisture', 'temperature', 'humidity', 'light']);
        });

        test('should preprocess sensor data correctly', () => {
            const sensorData = {
                moisture: 45,
                temperature: 25,
                humidity: 60,
                light: 500
            };

            const preprocessed = model.preprocessData(sensorData);
            
            expect(preprocessed).toBeDefined();
            expect(preprocessed.shape).toEqual([1, 11]); // 1 sample, 11 features
            
            // Clean up tensor
            preprocessed.dispose();
        });

        test('should handle missing sensor data with defaults', () => {
            const incompleteSensorData = {
                moisture: 30
                // missing temperature, humidity, light
            };

            const preprocessed = model.preprocessData(incompleteSensorData);
            
            expect(preprocessed).toBeDefined();
            expect(preprocessed.shape).toEqual([1, 11]);
            
            // Clean up tensor
            preprocessed.dispose();
        });

        test('should make predictions with TensorFlow model', async () => {
            // Create and initialize model
            model.createModel();
            
            const sensorData = {
                moisture: 25,
                temperature: 28,
                humidity: 45,
                light: 700
            };

            const prediction = await model.predict(sensorData);
            
            expect(prediction).toBeDefined();
            expect(typeof prediction.shouldWater).toBe('boolean');
            expect(prediction.confidence).toBeGreaterThanOrEqual(0);
            expect(prediction.confidence).toBeLessThanOrEqual(1);
            expect(prediction.recommendedAmount).toBeGreaterThanOrEqual(0);
            expect(prediction.reasoning).toBeDefined();
            expect(prediction.probabilities).toBeDefined();
            expect(prediction.probabilities.dontWater).toBeGreaterThanOrEqual(0);
            expect(prediction.probabilities.water).toBeGreaterThanOrEqual(0);
        });

        test('should generate appropriate reasoning for predictions', () => {
            const drySensorData = {
                moisture: 20,
                temperature: 30,
                humidity: 35,
                light: 900
            };

            const reasoning = model.generateReasoning(drySensorData, true, 0.9);
            
            expect(reasoning).toContain('Low soil moisture detected');
            expect(reasoning).toContain('High temperature increases water needs');
            expect(reasoning).toContain('Low humidity increases evaporation');
            expect(reasoning).toContain('High light levels increase water consumption');
            expect(reasoning).toContain('watering recommended');
            expect(reasoning).toContain('high confidence');
        });
    });

    describe('Prediction Accuracy with Sample Sensor Data', () => {
        const testCases = [
            {
                name: 'Very dry soil - should water',
                sensorData: { moisture: 15, temperature: 25, humidity: 50, light: 600 },
                expectedWater: true,
                expectedHighConfidence: true
            },
            {
                name: 'Dry soil with high temperature - should water',
                sensorData: { moisture: 35, temperature: 32, humidity: 40, light: 800 },
                expectedWater: true,
                expectedHighConfidence: true
            },
            {
                name: 'Well-watered soil - should not water',
                sensorData: { moisture: 75, temperature: 22, humidity: 65, light: 400 },
                expectedWater: false,
                expectedHighConfidence: true
            },
            {
                name: 'Moderate conditions - variable result',
                sensorData: { moisture: 50, temperature: 24, humidity: 55, light: 500 },
                expectedWater: null, // Can be either
                expectedHighConfidence: false
            },
            {
                name: 'Hot and dry conditions - should water',
                sensorData: { moisture: 40, temperature: 35, humidity: 30, light: 900 },
                expectedWater: true,
                expectedHighConfidence: true
            }
        ];

        test.each(testCases)('$name', async ({ sensorData, expectedWater, expectedHighConfidence }) => {
            // Test with TensorFlow model
            model.createModel();
            const prediction = await model.predict(sensorData);
            
            // Validate prediction structure
            expect(prediction).toBeDefined();
            expect(typeof prediction.shouldWater).toBe('boolean');
            expect(prediction.confidence).toBeGreaterThanOrEqual(0);
            expect(prediction.confidence).toBeLessThanOrEqual(1);
            
            // Check expected watering decision (if specified)
            if (expectedWater !== null) {
                expect(prediction.shouldWater).toBe(expectedWater);
            }
            
            // Check confidence level expectations
            if (expectedHighConfidence) {
                expect(prediction.confidence).toBeGreaterThan(0.6);
            }
            
            // Validate recommended amount logic
            if (prediction.shouldWater) {
                expect(prediction.recommendedAmount).toBeGreaterThan(0);
                expect(prediction.recommendedAmount).toBeLessThanOrEqual(500);
            } else {
                expect(prediction.recommendedAmount).toBe(0);
            }
        });

        test('should handle historical data in predictions', async () => {
            model.createModel();
            
            const currentSensorData = {
                moisture: 45,
                temperature: 26,
                humidity: 52,
                light: 580
            };
            
            const historicalData = [
                { moisture: 60, temperature: 23, humidity: 58, light: 480 },
                { moisture: 55, temperature: 24, humidity: 56, light: 520 },
                { moisture: 50, temperature: 25, humidity: 54, light: 550 }
            ];

            const prediction = await model.predict(currentSensorData, historicalData);
            
            expect(prediction).toBeDefined();
            expect(typeof prediction.shouldWater).toBe('boolean');
            expect(prediction.confidence).toBeGreaterThanOrEqual(0);
            expect(prediction.confidence).toBeLessThanOrEqual(1);
        });
    });

    describe('Hybrid Model Integration Tests', () => {
        test('should initialize hybrid model successfully', async () => {
            await hybridModel.initialize();
            
            expect(hybridModel.initialized).toBe(true);
            expect(hybridModel.getModelInfo()).toBeDefined();
        });

        test('should make predictions with hybrid model', async () => {
            await hybridModel.initialize();
            
            const sensorData = {
                moisture: 30,
                temperature: 27,
                humidity: 48,
                light: 650
            };

            const prediction = await hybridModel.predict(sensorData);
            
            expect(prediction).toBeDefined();
            expect(typeof prediction.shouldWater).toBe('boolean');
            expect(prediction.confidence).toBeGreaterThanOrEqual(0);
            expect(prediction.confidence).toBeLessThanOrEqual(1);
            expect(prediction.modelUsed).toBeDefined();
            expect(prediction.processingTime).toBeGreaterThan(0);
        });

        test('should perform health check', async () => {
            await hybridModel.initialize();
            
            const health = await hybridModel.healthCheck();
            
            expect(health).toBeDefined();
            expect(health.status).toBeDefined();
            expect(typeof health.healthy).toBe('boolean');
            expect(health.models).toBeDefined();
        });
    });

    describe('Main Module Interface Tests', () => {
        test('should validate sensor data correctly', () => {
            const validData = { moisture: 45, temperature: 22, humidity: 60, light: 500 };
            const invalidData = { moisture: 150, temperature: 'invalid', humidity: -10 };
            
            const validErrors = wateringPrediction.validateSensorData(validData);
            const invalidErrors = wateringPrediction.validateSensorData(invalidData);
            
            expect(validErrors).toHaveLength(0);
            expect(invalidErrors.length).toBeGreaterThan(0);
        });

        test('should make predictions through main interface', async () => {
            const sensorData = {
                moisture: 35,
                temperature: 28,
                humidity: 45,
                light: 700
            };

            const prediction = await wateringPrediction.predict(sensorData);
            
            expect(prediction).toBeDefined();
            expect(typeof prediction.shouldWater).toBe('boolean');
            expect(prediction.confidence).toBeGreaterThanOrEqual(0);
            expect(prediction.confidence).toBeLessThanOrEqual(1);
        });

        test('should get model information', async () => {
            await wateringPrediction.initialize();
            
            const modelInfo = wateringPrediction.getModelInfo();
            
            expect(modelInfo).toBeDefined();
            expect(modelInfo.status).toBeDefined();
            expect(modelInfo.version).toBeDefined();
        });

        test('should perform health check through main interface', async () => {
            await wateringPrediction.initialize();
            
            const health = await wateringPrediction.healthCheck();
            
            expect(health).toBeDefined();
            expect(typeof health.healthy).toBe('boolean');
            expect(health.status).toBeDefined();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle extreme sensor values', async () => {
            model.createModel();
            
            const extremeData = {
                moisture: 0,
                temperature: 50,
                humidity: 0,
                light: 1000
            };

            const prediction = await model.predict(extremeData);
            
            expect(prediction).toBeDefined();
            expect(typeof prediction.shouldWater).toBe('boolean');
            expect(prediction.confidence).toBeGreaterThanOrEqual(0);
            expect(prediction.confidence).toBeLessThanOrEqual(1);
        });

        test('should handle empty historical data', async () => {
            model.createModel();
            
            const sensorData = { moisture: 40, temperature: 25, humidity: 55, light: 500 };
            const emptyHistory = [];

            const prediction = await model.predict(sensorData, emptyHistory);
            
            expect(prediction).toBeDefined();
            expect(typeof prediction.shouldWater).toBe('boolean');
        });

        test('should dispose models properly', () => {
            model.createModel();
            expect(model.model).toBeDefined();
            
            model.dispose();
            expect(model.model).toBeNull();
            expect(model.isLoaded).toBe(false);
        });

        test('should handle model loading failures gracefully', async () => {
            // Try to load from non-existent path
            const result = await model.loadModel('/non/existent/path');
            
            // Should create new model instead of failing
            expect(model.model).toBeDefined();
            expect(model.isLoaded).toBe(true);
        });
    });

    describe('Performance and Memory Tests', () => {
        test('should complete predictions within reasonable time', async () => {
            model.createModel();
            
            const sensorData = { moisture: 40, temperature: 25, humidity: 55, light: 500 };
            const startTime = Date.now();
            
            await model.predict(sensorData);
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Should complete within 5 seconds
            expect(duration).toBeLessThan(5000);
        });

        test('should handle multiple consecutive predictions', async () => {
            model.createModel();
            
            const testData = [
                { moisture: 20, temperature: 25, humidity: 50, light: 600 },
                { moisture: 50, temperature: 22, humidity: 65, light: 400 },
                { moisture: 80, temperature: 28, humidity: 45, light: 700 }
            ];

            const predictions = [];
            for (const sensorData of testData) {
                const prediction = await model.predict(sensorData);
                predictions.push(prediction);
            }
            
            expect(predictions).toHaveLength(3);
            predictions.forEach(prediction => {
                expect(prediction).toBeDefined();
                expect(typeof prediction.shouldWater).toBe('boolean');
                expect(prediction.confidence).toBeGreaterThanOrEqual(0);
                expect(prediction.confidence).toBeLessThanOrEqual(1);
            });
        });
    });
});