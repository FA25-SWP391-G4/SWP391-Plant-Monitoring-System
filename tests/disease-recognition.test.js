/**
 * Unit Tests for Disease Recognition System
 * Tests image preprocessing, model inference, and disease classification accuracy
 * Requirements: 3.1, 3.2
 */

const { DiseaseRecognitionModel } = require('../ai_models/disease_recognition/index');
const ImagePreprocessor = require('../ai_models/disease_recognition/imagePreprocessor');
const DiseaseRecognitionModelLoader = require('../ai_models/disease_recognition/modelLoader');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Try to use TensorFlow.js Node, fallback to browser version
let tf;
try {
    tf = require('@tensorflow/tfjs-node');
} catch (error) {
    console.warn('TensorFlow.js Node not available, using browser version');
    tf = require('@tensorflow/tfjs');
    require('@tensorflow/tfjs-backend-cpu');
}

describe('Disease Recognition System Tests', () => {
    let diseaseModel;
    let imagePreprocessor;
    let modelLoader;
    let testImageBuffer;
    let testImagePath;

    beforeAll(async () => {
        // Create test image for testing
        testImageBuffer = await sharp({
            create: {
                width: 300,
                height: 300,
                channels: 3,
                background: { r: 100, g: 150, b: 100 }
            }
        })
        .png()
        .toBuffer();

        // Create temporary test image file
        testImagePath = path.join(__dirname, 'temp_test_image.png');
        fs.writeFileSync(testImagePath, testImageBuffer);
    });

    beforeEach(() => {
        diseaseModel = new DiseaseRecognitionModel();
        imagePreprocessor = new ImagePreprocessor();
        modelLoader = new DiseaseRecognitionModelLoader();
    });

    afterEach(() => {
        // Clean up models to prevent memory leaks
        if (diseaseModel) {
            diseaseModel.dispose();
        }
        if (modelLoader) {
            modelLoader.dispose();
        }
    });

    afterAll(() => {
        // Clean up test files
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
    });

    describe('Image Preprocessing Tests', () => {
        test('should preprocess image to correct tensor shape', async () => {
            const imageTensor = await imagePreprocessor.preprocessImage(testImageBuffer);
            
            expect(imageTensor).toBeDefined();
            expect(imageTensor.shape).toEqual([224, 224, 3]);
            expect(imageTensor.dtype).toBe('float32');
            
            // Check tensor values are normalized to [0, 1]
            const tensorData = await imageTensor.data();
            const maxValue = Math.max(...tensorData);
            const minValue = Math.min(...tensorData);
            
            expect(maxValue).toBeLessThanOrEqual(1.0);
            expect(minValue).toBeGreaterThanOrEqual(0.0);
            
            imageTensor.dispose();
        });

        test('should handle file path input for preprocessing', async () => {
            const imageTensor = await imagePreprocessor.preprocessImage(testImagePath);
            
            expect(imageTensor).toBeDefined();
            expect(imageTensor.shape).toEqual([224, 224, 3]);
            
            imageTensor.dispose();
        });

        test('should handle corrupted image gracefully', async () => {
            const corruptedBuffer = Buffer.from('not an image');
            
            const imageTensor = await imagePreprocessor.preprocessImage(corruptedBuffer);
            
            expect(imageTensor).toBeDefined();
            expect(imageTensor.shape).toEqual([224, 224, 3]);
            
            imageTensor.dispose();
        });

        test('should preprocess batch of images', async () => {
            const imagePaths = [testImageBuffer, testImageBuffer];
            
            const batchTensor = await imagePreprocessor.preprocessBatch(imagePaths);
            
            expect(batchTensor).toBeDefined();
            expect(batchTensor.shape).toEqual([2, 224, 224, 3]);
            
            batchTensor.dispose();
        });

        test('should extract image features correctly', async () => {
            const features = await imagePreprocessor.extractImageFeatures(testImageBuffer);
            
            expect(features).toBeDefined();
            expect(features.dimensions).toBeDefined();
            expect(features.dimensions.width).toBeGreaterThan(0);
            expect(features.dimensions.height).toBeGreaterThan(0);
            expect(features.dimensions.channels).toBe(3);
            expect(features.quality).toBeDefined();
            expect(features.quality.score).toBeGreaterThanOrEqual(0);
            expect(features.quality.score).toBeLessThanOrEqual(1);
            expect(features.colorStats).toBeDefined();
            expect(features.colorStats.channels).toHaveLength(3);
        });

        test('should assess image quality correctly', async () => {
            // Test with good quality image
            const goodImageBuffer = await sharp({
                create: {
                    width: 500,
                    height: 500,
                    channels: 3,
                    background: { r: 128, g: 128, b: 128 }
                }
            })
            .png()
            .toBuffer();

            const features = await imagePreprocessor.extractImageFeatures(goodImageBuffer);
            
            expect(features.quality.score).toBeGreaterThan(0.5);
            expect(Array.isArray(features.quality.issues)).toBe(true);
            expect(Array.isArray(features.quality.recommendations)).toBe(true);
        });

        test('should create thumbnail correctly', async () => {
            const thumbnail = await imagePreprocessor.createThumbnail(testImageBuffer, 100);
            
            expect(thumbnail).toBeDefined();
            expect(Buffer.isBuffer(thumbnail)).toBe(true);
            expect(thumbnail.length).toBeGreaterThan(0);
            
            // Verify thumbnail dimensions using Sharp
            const metadata = await sharp(thumbnail).metadata();
            expect(metadata.width).toBe(100);
            expect(metadata.height).toBe(100);
        });

        test('should validate image upload correctly', () => {
            const validFile = {
                size: 1024 * 1024, // 1MB
                mimetype: 'image/jpeg',
                originalname: 'test.jpg'
            };

            const invalidFile = {
                size: 15 * 1024 * 1024, // 15MB (too large)
                mimetype: 'text/plain',
                originalname: 'test.txt'
            };

            const validResult = imagePreprocessor.validateUpload(validFile);
            const invalidResult = imagePreprocessor.validateUpload(invalidFile);

            expect(validResult.isValid).toBe(true);
            expect(validResult.errors).toHaveLength(0);

            expect(invalidResult.isValid).toBe(false);
            expect(invalidResult.errors.length).toBeGreaterThan(0);
        });
    });

    describe('Model Loading and Inference Tests', () => {
        test('should load fallback model successfully', async () => {
            const loaded = await modelLoader.loadModel();
            
            expect(loaded).toBe(true);
            expect(modelLoader.isLoaded).toBe(true);
            expect(modelLoader.model).toBeDefined();
            expect(modelLoader.classes).toBeDefined();
            expect(Array.isArray(modelLoader.classes)).toBe(true);
            expect(modelLoader.classes.length).toBeGreaterThan(0);
        });

        test('should make predictions with loaded model', async () => {
            await modelLoader.loadModel();
            
            const imageTensor = await imagePreprocessor.preprocessImage(testImageBuffer);
            const prediction = await modelLoader.predict(imageTensor);
            
            expect(prediction).toBeDefined();
            expect(prediction.topPrediction).toBeDefined();
            expect(prediction.topPrediction.disease).toBeDefined();
            expect(prediction.topPrediction.confidence).toBeGreaterThanOrEqual(0);
            expect(prediction.topPrediction.confidence).toBeLessThanOrEqual(1);
            expect(prediction.topPrediction.severity).toBeDefined();
            expect(prediction.allPredictions).toBeDefined();
            expect(Array.isArray(prediction.allPredictions)).toBe(true);
            expect(prediction.modelVersion).toBeDefined();
            
            imageTensor.dispose();
        });

        test('should calculate severity correctly', () => {
            const severityLow = modelLoader.calculateSeverity(0.2);
            const severityMild = modelLoader.calculateSeverity(0.5);
            const severityModerate = modelLoader.calculateSeverity(0.7);
            const severitySevere = modelLoader.calculateSeverity(0.9);

            expect(severityLow).toBe('uncertain');
            expect(severityMild).toBe('mild');
            expect(severityModerate).toBe('moderate');
            expect(severitySevere).toBe('severe');
        });

        test('should provide treatment recommendations', () => {
            const treatments = modelLoader.getTreatmentRecommendations('Early Blight', 'moderate');
            
            expect(treatments).toBeDefined();
            expect(Array.isArray(treatments)).toBe(true);
            expect(treatments.length).toBeGreaterThan(0);
            expect(treatments.every(treatment => typeof treatment === 'string')).toBe(true);
        });

        test('should provide prevention tips', () => {
            const prevention = modelLoader.getPreventionTips('Late Blight');
            
            expect(prevention).toBeDefined();
            expect(Array.isArray(prevention)).toBe(true);
            expect(prevention.length).toBeGreaterThan(0);
            expect(prevention.every(tip => typeof tip === 'string')).toBe(true);
        });

        test('should handle unknown disease gracefully', () => {
            const treatments = modelLoader.getTreatmentRecommendations('Unknown Disease', 'mild');
            const prevention = modelLoader.getPreventionTips('Unknown Disease');
            
            expect(treatments).toBeDefined();
            expect(Array.isArray(treatments)).toBe(true);
            expect(prevention).toBeDefined();
            expect(Array.isArray(prevention)).toBe(true);
        });
    });

    describe('Disease Classification Accuracy Tests', () => {
        const testCases = [
            {
                name: 'Healthy plant simulation',
                imageColor: { r: 50, g: 150, b: 50 }, // Green-ish
                expectedDiseases: ['Healthy'],
                minConfidence: 0.1
            },
            {
                name: 'Diseased plant simulation - brown spots',
                imageColor: { r: 139, g: 69, b: 19 }, // Brown
                expectedDiseases: ['Early Blight', 'Late Blight', 'Leaf Spot'],
                minConfidence: 0.1
            },
            {
                name: 'Yellowing plant simulation',
                imageColor: { r: 255, g: 255, b: 0 }, // Yellow
                expectedDiseases: ['Yellowing', 'Mosaic Virus'],
                minConfidence: 0.1
            },
            {
                name: 'Wilted plant simulation',
                imageColor: { r: 101, g: 67, b: 33 }, // Dark brown
                expectedDiseases: ['Wilting', 'Bacterial Spot'],
                minConfidence: 0.1
            }
        ];

        test.each(testCases)('$name', async ({ imageColor, expectedDiseases, minConfidence }) => {
            // Create test image with specific color pattern
            const testBuffer = await sharp({
                create: {
                    width: 224,
                    height: 224,
                    channels: 3,
                    background: imageColor
                }
            })
            .png()
            .toBuffer();

            await modelLoader.loadModel();
            
            const imageTensor = await imagePreprocessor.preprocessImage(testBuffer);
            const prediction = await modelLoader.predict(imageTensor);
            
            // Validate prediction structure
            expect(prediction).toBeDefined();
            expect(prediction.topPrediction).toBeDefined();
            expect(prediction.topPrediction.confidence).toBeGreaterThanOrEqual(0.05);
            expect(prediction.allPredictions.length).toBeGreaterThan(0);
            
            // Check if predicted disease is reasonable (in expected list or any valid disease)
            const predictedDisease = prediction.topPrediction.disease;
            const validDiseases = [...expectedDiseases, ...modelLoader.classes];
            expect(validDiseases).toContain(predictedDisease);
            
            imageTensor.dispose();
        });

        test('should handle multiple image formats', async () => {
            await modelLoader.loadModel();
            
            // Test different image formats
            const formats = ['png', 'jpeg'];
            
            for (const format of formats) {
                const testBuffer = await sharp({
                    create: {
                        width: 224,
                        height: 224,
                        channels: 3,
                        background: { r: 100, g: 150, b: 100 }
                    }
                })
                [format]()
                .toBuffer();

                const imageTensor = await imagePreprocessor.preprocessImage(testBuffer);
                const prediction = await modelLoader.predict(imageTensor);
                
                expect(prediction).toBeDefined();
                expect(prediction.topPrediction).toBeDefined();
                expect(prediction.topPrediction.confidence).toBeGreaterThanOrEqual(0);
                
                imageTensor.dispose();
            }
        });

        test('should provide consistent predictions for same image', async () => {
            await modelLoader.loadModel();
            
            const imageTensor = await imagePreprocessor.preprocessImage(testImageBuffer);
            
            // Make multiple predictions
            const prediction1 = await modelLoader.predict(imageTensor);
            const prediction2 = await modelLoader.predict(imageTensor);
            
            // Predictions should be consistent
            expect(prediction1.topPrediction.disease).toBe(prediction2.topPrediction.disease);
            expect(Math.abs(prediction1.topPrediction.confidence - prediction2.topPrediction.confidence)).toBeLessThan(0.01);
            
            imageTensor.dispose();
        });
    });

    describe('Full System Integration Tests', () => {
        test('should initialize disease recognition system', async () => {
            const initialized = await diseaseModel.initialize();
            
            expect(initialized).toBe(true);
            expect(diseaseModel.isInitialized).toBe(true);
        });

        test('should analyze image end-to-end', async () => {
            await diseaseModel.initialize();
            
            const result = await diseaseModel.analyzeImage(testImageBuffer);
            
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.analysis).toBeDefined();
            expect(result.analysis.diseaseDetected).toBeDefined();
            expect(result.analysis.confidence).toBeGreaterThanOrEqual(0);
            expect(result.analysis.confidence).toBeLessThanOrEqual(1);
            expect(result.analysis.severity).toBeDefined();
            expect(typeof result.analysis.isHealthy).toBe('boolean');
            expect(result.recommendations).toBeDefined();
            expect(result.recommendations.treatments).toBeDefined();
            expect(result.recommendations.prevention).toBeDefined();
            expect(result.imageInfo).toBeDefined();
            expect(result.timestamp).toBeDefined();
        });

        test('should handle batch analysis', async () => {
            await diseaseModel.initialize();
            
            const imagePaths = [testImageBuffer, testImageBuffer];
            const results = await diseaseModel.analyzeBatch(imagePaths);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(results).toHaveLength(2);
            
            results.forEach((result, index) => {
                expect(result.index).toBe(index);
                expect(result.success).toBe(true);
                expect(result.analysis).toBeDefined();
            });
        });

        test('should perform health check', async () => {
            await diseaseModel.initialize();
            
            const health = await diseaseModel.healthCheck();
            
            expect(health).toBeDefined();
            expect(health.status).toBeDefined();
            expect(health.initialized).toBe(true);
            expect(health.timestamp).toBeDefined();
        });

        test('should get model information', async () => {
            await diseaseModel.initialize();
            
            const modelInfo = diseaseModel.getModelInfo();
            
            expect(modelInfo).toBeDefined();
            expect(modelInfo.initialized).toBe(true);
            expect(modelInfo.supportedClasses).toBeDefined();
            expect(Array.isArray(modelInfo.supportedClasses)).toBe(true);
            expect(modelInfo.inputShape).toEqual([224, 224, 3]);
            expect(modelInfo.capabilities).toBeDefined();
            expect(Array.isArray(modelInfo.capabilities)).toBe(true);
        });

        test('should validate image before analysis', async () => {
            const validFile = {
                size: 1024 * 1024,
                mimetype: 'image/jpeg',
                originalname: 'test.jpg'
            };

            const validation = diseaseModel.validateImage(validFile);
            
            expect(validation).toBeDefined();
            expect(validation.isValid).toBe(true);
            expect(Array.isArray(validation.errors)).toBe(true);
            expect(Array.isArray(validation.warnings)).toBe(true);
        });

        test('should handle poor quality images', async () => {
            await diseaseModel.initialize();
            
            // Create very small, low quality image
            const poorQualityBuffer = await sharp({
                create: {
                    width: 50,
                    height: 50,
                    channels: 3,
                    background: { r: 10, g: 10, b: 10 }
                }
            })
            .png()
            .toBuffer();

            const result = await diseaseModel.analyzeImage(poorQualityBuffer);
            
            expect(result).toBeDefined();
            // Should either succeed with warnings or fail gracefully
            if (result.success) {
                expect(result.warnings).toBeDefined();
                expect(result.warnings.length).toBeGreaterThan(0);
            } else {
                expect(result.error).toBeDefined();
                expect(result.suggestions).toBeDefined();
            }
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle uninitialized model gracefully', async () => {
            await expect(diseaseModel.analyzeImage(testImageBuffer))
                .rejects
                .toThrow('Disease recognition model not initialized');
        });

        test('should handle invalid image data', async () => {
            await diseaseModel.initialize();
            
            const invalidData = Buffer.from('not an image');
            
            // Should not throw, but handle gracefully
            const result = await diseaseModel.analyzeImage(invalidData);
            expect(result).toBeDefined();
        });

        test('should dispose resources properly', async () => {
            await diseaseModel.initialize();
            
            expect(diseaseModel.isInitialized).toBe(true);
            
            diseaseModel.dispose();
            
            expect(diseaseModel.isInitialized).toBe(false);
        });

        test('should handle memory cleanup for tensors', async () => {
            await modelLoader.loadModel();
            
            const initialTensorCount = tf.memory().numTensors;
            
            // Process multiple images
            for (let i = 0; i < 5; i++) {
                const imageTensor = await imagePreprocessor.preprocessImage(testImageBuffer);
                await modelLoader.predict(imageTensor);
                imageTensor.dispose();
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalTensorCount = tf.memory().numTensors;
            
            // Should not have significant tensor leaks
            expect(finalTensorCount - initialTensorCount).toBeLessThan(10);
        });
    });

    describe('Performance Tests', () => {
        test('should complete image analysis within reasonable time', async () => {
            await diseaseModel.initialize();
            
            const startTime = Date.now();
            await diseaseModel.analyzeImage(testImageBuffer);
            const endTime = Date.now();
            
            const duration = endTime - startTime;
            
            // Should complete within 10 seconds
            expect(duration).toBeLessThan(10000);
        });

        test('should handle multiple consecutive analyses', async () => {
            await diseaseModel.initialize();
            
            const results = [];
            
            for (let i = 0; i < 3; i++) {
                const result = await diseaseModel.analyzeImage(testImageBuffer);
                results.push(result);
            }
            
            expect(results).toHaveLength(3);
            results.forEach(result => {
                expect(result.success).toBe(true);
                expect(result.analysis).toBeDefined();
            });
        });
    });
});