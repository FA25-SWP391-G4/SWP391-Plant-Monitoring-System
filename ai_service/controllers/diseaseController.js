const { validationResult } = require('express-validator');
const { imageUtils, modelUtils, predictionUtils } = require('../services/aiUtils');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Attempt to load TensorFlow, but don't fail if not available
let tf;
try {
    tf = require('@tensorflow/tfjs-node');
} catch (error) {
    console.warn('TensorFlow.js not available, using fallback mode for disease recognition');
}

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
        }
    }
});

// Cache for model instance to avoid reloading
let enhancedModelInstance = null;
let imagePreprocessorInstance = null;

/**
 * Analyze plant image for disease recognition
 */
const analyzePlantImage = async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const { plant_type } = req.body;
        const userId = req.user?.user_id || req.user?.id;

        console.log(`Disease analysis request from user ${userId} for ${plant_type || 'unknown'} plant`);

        // Save uploaded image temporarily for processing
        const filename = `disease_analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
        const tempPath = path.join('./temp/images', filename);
        const sharedPath = path.join('../uploads/images', filename);
        
        // Ensure temp directory exists
        await fs.mkdir('./temp/images', { recursive: true });
        await fs.mkdir('../uploads/images', { recursive: true });
        
        // Save to temp for processing
        await fs.writeFile(tempPath, req.file.buffer);

        try {
            let analysis;
            let modelVersion = 'v1.0.0-placeholder';
            let reliability = 'medium';
            let warnings = [];
            
            // Try to use enhanced model if TensorFlow.js is available
            try {
                // Load enhanced model if not already loaded
                if (!enhancedModelInstance) {
                    const EnhancedModelLoader = require('../../ai_models/disease_recognition/enhancedModelLoader');
                    enhancedModelInstance = new EnhancedModelLoader();
                    await enhancedModelInstance.loadModel();
                }
                
                // Load image preprocessor if not already loaded
                if (!imagePreprocessorInstance) {
                    const ImagePreprocessor = require('../../ai_models/disease_recognition/imagePreprocessor');
                    imagePreprocessorInstance = new ImagePreprocessor();
                }
                
                // Validate image quality
                const imageFeatures = await imagePreprocessorInstance.extractImageFeatures(tempPath);
                
                if (imageFeatures.quality.score < 0.2) {
                    warnings.push('Image quality is poor, results may be less reliable');
                }
                
                // Preprocess image for model
                const imageTensor = await imagePreprocessorInstance.preprocessImage(tempPath);
                
                // Run enhanced prediction
                const prediction = await enhancedModelInstance.predict(imageTensor);
                
                // Get enhanced recommendations
                const topPrediction = prediction.topPrediction;
                const treatments = enhancedModelInstance.getTreatmentRecommendations(
                    topPrediction.disease, 
                    topPrediction.severity
                );
                const prevention = enhancedModelInstance.getPreventionTips(topPrediction.disease);
                const urgency = enhancedModelInstance.getUrgencyLevel(topPrediction.disease, topPrediction.confidence);
                
                // Create enhanced analysis result
                analysis = {
                    disease: topPrediction.disease,
                    confidence: topPrediction.confidence,
                    severity: topPrediction.severity,
                    description: `${topPrediction.disease} detected with ${Math.round(topPrediction.confidence * 100)}% confidence`,
                    treatments: treatments,
                    prevention: prevention,
                    urgency: urgency,
                    allPredictions: prediction.allPredictions.slice(0, 3)
                };
                
                modelVersion = enhancedModelInstance.modelVersion;
                reliability = topPrediction.confidence > 0.7 ? 'high' : 'medium';
                
                // Clean up tensor
                imageTensor.dispose();
                
            } catch (modelError) {
                console.warn('Enhanced model failed, falling back to simulated analysis:', modelError.message);
                warnings.push('Using fallback analysis mode due to model unavailability');
                
                // Fallback to simulated analysis
                analysis = generateDiseaseAnalysis(plant_type, req.file);
            }

            // Move processed image to shared storage for permanent storage
            await fs.copyFile(tempPath, sharedPath);

            return res.json({
                success: true,
                data: {
                    image_id: filename,
                    image_path: `uploads/images/${filename}`, // Relative to project root
                    plant_type: plant_type || 'unknown',
                    disease_detected: analysis.disease,
                    confidence: analysis.confidence,
                    severity: analysis.severity,
                    description: analysis.description,
                    treatment_suggestions: analysis.treatments,
                    prevention_tips: analysis.prevention,
                    urgency: analysis.urgency || 'medium',
                    reliability: reliability,
                    warnings: warnings,
                    timestamp: new Date(),
                    model_version: modelVersion,
                    processing_time_ms: Date.now() - startTime
                }
            });

        } finally {
            // Clean up temporary image file
            try {
                await fs.unlink(tempPath);
            } catch (cleanupError) {
                console.warn('Failed to cleanup temporary image:', cleanupError.message);
            }
        }

    } catch (error) {
        console.error('Error analyzing plant image:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Failed to analyze plant image',
            error: error.message
        });
    }
};

/**
 * Generate disease analysis (placeholder implementation)
 */
function generateDiseaseAnalysis(plantType, imageFile) {
    // Simulate disease detection based on filename or random selection
    const diseases = [
        {
            name: 'Healthy',
            confidence: 0.85,
            severity: 'none',
            description: 'Plant appears healthy with no visible signs of disease',
            treatments: ['Continue current care routine'],
            prevention: ['Maintain proper watering', 'Ensure good air circulation']
        },
        {
            name: 'Early Blight',
            confidence: 0.78,
            severity: 'moderate',
            description: 'Fungal disease causing dark spots on leaves',
            treatments: ['Apply copper-based fungicide', 'Remove affected leaves', 'Improve air circulation'],
            prevention: ['Water at soil level', 'Avoid overhead watering', 'Space plants properly']
        },
        {
            name: 'Leaf Spot',
            confidence: 0.72,
            severity: 'mild',
            description: 'Bacterial or fungal infection causing spotted leaves',
            treatments: ['Remove affected leaves', 'Apply appropriate fungicide', 'Reduce humidity'],
            prevention: ['Avoid wetting leaves', 'Ensure proper drainage', 'Maintain plant hygiene']
        },
        {
            name: 'Powdery Mildew',
            confidence: 0.68,
            severity: 'moderate',
            description: 'White powdery coating on leaves and stems',
            treatments: ['Apply sulfur-based fungicide', 'Increase air circulation', 'Reduce humidity'],
            prevention: ['Avoid overcrowding', 'Water at base of plant', 'Ensure good ventilation']
        }
    ];
    
    // Simple logic to select disease based on filename patterns
    const filename = imageFile.originalname?.toLowerCase() || '';
    let selectedDisease;
    
    if (filename.includes('healthy') || filename.includes('good')) {
        selectedDisease = diseases[0]; // Healthy
    } else if (filename.includes('blight') || filename.includes('dark')) {
        selectedDisease = diseases[1]; // Early Blight
    } else if (filename.includes('spot') || filename.includes('leaf')) {
        selectedDisease = diseases[2]; // Leaf Spot
    } else if (filename.includes('mildew') || filename.includes('white')) {
        selectedDisease = diseases[3]; // Powdery Mildew
    } else {
        // Random selection for demonstration
        selectedDisease = diseases[Math.floor(Math.random() * diseases.length)];
    }
    
    return {
        disease: selectedDisease.name,
        confidence: selectedDisease.confidence,
        severity: selectedDisease.severity,
        description: selectedDisease.description,
        treatments: selectedDisease.treatments,
        prevention: selectedDisease.prevention
    };
}

module.exports = {
    analyzePlantImage,
    upload
};