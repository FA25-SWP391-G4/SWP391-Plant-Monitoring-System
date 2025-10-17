const DiseaseRecognitionModelLoader = require('./modelLoader');
const ImagePreprocessor = require('./imagePreprocessor');
// Try to use TensorFlow.js Node, fallback to browser version
let tf;
try {
    tf = require('@tensorflow/tfjs-node');
} catch (error) {
    console.warn('TensorFlow.js Node not available, using browser version');
    tf = require('@tensorflow/tfjs');
    require('@tensorflow/tfjs-backend-cpu');
}

class DiseaseRecognitionModel {
    constructor() {
        this.modelLoader = new DiseaseRecognitionModelLoader();
        this.imagePreprocessor = new ImagePreprocessor();
        this.isInitialized = false;
    }

    /**
     * Initialize the disease recognition system
     */
    async initialize() {
        try {
            console.log('Initializing disease recognition model...');
            
            // Load the TensorFlow.js model
            await this.modelLoader.loadModel();
            
            this.isInitialized = true;
            console.log('Disease recognition model initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize disease recognition model:', error);
            throw error;
        }
    }

    /**
     * Analyze plant image for disease detection
     * @param {string|Buffer} imagePath - Path to image file or Buffer
     * @param {Object} options - Analysis options
     * @returns {Object} Disease analysis results
     */
    async analyzeImage(imagePath, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Disease recognition model not initialized. Call initialize() first.');
        }

        try {
            // Extract image features for quality assessment
            const imageFeatures = await this.imagePreprocessor.extractImageFeatures(imagePath);
            
            // Check image quality
            if (imageFeatures.quality.score < 0.3) {
                return {
                    success: false,
                    error: 'Image quality too poor for reliable analysis',
                    quality: imageFeatures.quality,
                    suggestions: imageFeatures.quality.recommendations
                };
            }

            // Preprocess image for model inference
            const imageTensor = await this.imagePreprocessor.preprocessImage(imagePath);
            
            // Perform disease prediction
            const prediction = await this.modelLoader.predict(imageTensor);
            
            // Clean up tensor
            imageTensor.dispose();
            
            // Get treatment recommendations
            const topPrediction = prediction.topPrediction;
            const treatments = this.modelLoader.getTreatmentRecommendations(
                topPrediction.disease, 
                topPrediction.severity
            );
            const prevention = this.modelLoader.getPreventionTips(topPrediction.disease);
            
            // Create thumbnail for response
            const thumbnail = await this.imagePreprocessor.createThumbnail(imagePath);
            
            // Add warnings for low confidence or fallback model
            const warnings = [];
            const disclaimers = [
                'This is an AI-powered analysis tool for reference only',
                'Results should not replace professional plant care advice',
                'Consult with agricultural experts for serious plant health issues'
            ];

            if (topPrediction.confidence < 0.6) {
                warnings.push('Low confidence prediction - results may be unreliable');
            }

            if (!this.modelLoader.model || this.modelLoader.model.layers.length < 10) {
                warnings.push('Using development model - not suitable for production use');
                disclaimers.push('Current model is for demonstration purposes only');
            }

            return {
                success: true,
                analysis: {
                    diseaseDetected: topPrediction.disease,
                    confidence: Math.round(topPrediction.confidence * 100) / 100,
                    severity: topPrediction.severity,
                    isHealthy: topPrediction.disease === 'Healthy',
                    allPredictions: prediction.allPredictions.slice(0, 3), // Top 3 predictions
                    modelVersion: prediction.modelVersion,
                    reliability: this.assessReliability(topPrediction.confidence, imageFeatures.quality.score)
                },
                recommendations: {
                    treatments: treatments,
                    prevention: prevention,
                    urgency: this.calculateUrgency(topPrediction.confidence, topPrediction.severity)
                },
                imageInfo: {
                    dimensions: imageFeatures.dimensions,
                    quality: imageFeatures.quality,
                    thumbnail: thumbnail.toString('base64')
                },
                warnings: warnings,
                disclaimers: disclaimers,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error analyzing image for disease:', error);
            throw new Error(`Disease analysis failed: ${error.message}`);
        }
    }

    /**
     * Batch analyze multiple images
     * @param {Array<string|Buffer>} imagePaths - Array of image paths or buffers
     * @param {Object} options - Analysis options
     * @returns {Array<Object>} Array of analysis results
     */
    async analyzeBatch(imagePaths, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Disease recognition model not initialized');
        }

        const results = [];
        
        for (let i = 0; i < imagePaths.length; i++) {
            try {
                const result = await this.analyzeImage(imagePaths[i], options);
                results.push({
                    index: i,
                    ...result
                });
            } catch (error) {
                results.push({
                    index: i,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    /**
     * Calculate urgency level based on confidence and severity
     * @param {number} confidence - Prediction confidence
     * @param {string} severity - Disease severity
     * @returns {string} Urgency level
     */
    calculateUrgency(confidence, severity) {
        if (confidence < 0.5) return 'low';
        
        if (severity === 'severe' && confidence > 0.8) return 'high';
        if (severity === 'moderate' && confidence > 0.7) return 'medium';
        if (severity === 'mild') return 'low';
        
        return 'medium';
    }

    /**
     * Assess overall reliability of the prediction
     * @param {number} confidence - Model confidence
     * @param {number} imageQuality - Image quality score
     * @returns {Object} Reliability assessment
     */
    assessReliability(confidence, imageQuality) {
        let score = 0;
        let level = 'very_low';
        let factors = [];

        // Confidence factor (40% weight)
        if (confidence > 0.8) {
            score += 40;
            factors.push('High model confidence');
        } else if (confidence > 0.6) {
            score += 25;
            factors.push('Moderate model confidence');
        } else if (confidence > 0.4) {
            score += 15;
            factors.push('Low model confidence');
        } else {
            factors.push('Very low model confidence');
        }

        // Image quality factor (30% weight)
        if (imageQuality > 0.8) {
            score += 30;
            factors.push('High image quality');
        } else if (imageQuality > 0.6) {
            score += 20;
            factors.push('Good image quality');
        } else if (imageQuality > 0.4) {
            score += 10;
            factors.push('Fair image quality');
        } else {
            factors.push('Poor image quality');
        }

        // Model type factor (30% weight)
        if (this.modelLoader.model && this.modelLoader.model.layers.length > 10) {
            score += 30;
            factors.push('Production model');
        } else {
            factors.push('Development/fallback model');
        }

        // Determine reliability level
        if (score >= 80) level = 'high';
        else if (score >= 60) level = 'medium';
        else if (score >= 40) level = 'low';
        else level = 'very_low';

        return {
            score: Math.round(score),
            level: level,
            factors: factors,
            recommendation: this.getReliabilityRecommendation(level)
        };
    }

    /**
     * Get recommendation based on reliability level
     * @param {string} level - Reliability level
     * @returns {string} Recommendation
     */
    getReliabilityRecommendation(level) {
        const recommendations = {
            'high': 'Results are reliable, but still consult experts for treatment decisions',
            'medium': 'Results may be helpful, but verify with additional sources',
            'low': 'Results should be used with caution - seek professional advice',
            'very_low': 'Results are unreliable - do not base treatment decisions on this analysis'
        };
        return recommendations[level] || recommendations['very_low'];
    }

    /**
     * Get model information and statistics
     * @returns {Object} Model information
     */
    getModelInfo() {
        if (!this.isInitialized) {
            return { initialized: false };
        }

        return {
            initialized: true,
            modelLoaded: this.modelLoader.isLoaded,
            supportedClasses: this.modelLoader.classes,
            inputShape: [224, 224, 3],
            modelVersion: 'v1.0.0',
            capabilities: [
                'Disease classification',
                'Confidence scoring',
                'Severity assessment',
                'Treatment recommendations',
                'Prevention tips'
            ]
        };
    }

    /**
     * Validate image before analysis
     * @param {Object} file - Multer file object
     * @returns {Object} Validation result
     */
    validateImage(file) {
        return this.imagePreprocessor.validateUpload(file);
    }

    /**
     * Health check for the disease recognition system
     * @returns {Object} Health status
     */
    async healthCheck() {
        try {
            const status = {
                status: 'healthy',
                initialized: this.isInitialized,
                modelLoaded: this.modelLoader.isLoaded,
                timestamp: new Date().toISOString()
            };

            if (!this.isInitialized) {
                status.status = 'not_initialized';
                status.message = 'Model not initialized';
                return status;
            }

            // Test with a small dummy tensor
            const testTensor = tf.randomNormal([1, 224, 224, 3]);
            const testPrediction = await this.modelLoader.predict(testTensor);
            testTensor.dispose();

            if (testPrediction && testPrediction.topPrediction) {
                status.testPassed = true;
                status.message = 'All systems operational';
            } else {
                status.status = 'degraded';
                status.testPassed = false;
                status.message = 'Model prediction test failed';
            }

            return status;
        } catch (error) {
            return {
                status: 'error',
                initialized: this.isInitialized,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Dispose of resources and clean up
     */
    dispose() {
        if (this.modelLoader) {
            this.modelLoader.dispose();
        }
        this.isInitialized = false;
        console.log('Disease recognition model disposed');
    }
}

// Export singleton instance
let instance = null;

module.exports = {
    DiseaseRecognitionModel,
    getInstance: () => {
        if (!instance) {
            instance = new DiseaseRecognitionModel();
        }
        return instance;
    }
};