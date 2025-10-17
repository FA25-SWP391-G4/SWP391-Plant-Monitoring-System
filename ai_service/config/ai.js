const path = require('path');
const fs = require('fs');

// Load AI configuration
const loadAIConfig = () => {
  try {
    const configPath = process.env.AI_CONFIG_PATH || '../ai_models/config.json';
    const configFile = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configFile);
  } catch (error) {
    console.warn('AI config file not found, using defaults:', error.message);
    return getDefaultConfig();
  }
};

// Default configuration if config file is not available
const getDefaultConfig = () => ({
  models: {
    watering_prediction: {
      path: '../ai_models/watering_prediction',
      version: '1.0.0',
      input_shape: [1, 7],
      output_classes: 2,
      description: 'Neural network for predicting watering needs based on sensor data'
    },
    disease_recognition: {
      path: '../ai_models/disease_recognition',
      version: '1.0.0',
      input_shape: [224, 224, 3],
      output_classes: 11,
      description: 'MobileNetV2-based CNN for plant disease classification'
    }
  },
  preprocessing: {
    image: {
      resize: [224, 224],
      normalize: true,
      format: 'RGB'
    },
    sensor: {
      features: ['moisture', 'temperature', 'humidity', 'light'],
      window_size: 7,
      normalize: true
    }
  },
  inference: {
    batch_size: 1,
    confidence_threshold: 0.6,
    backend: 'cpu'
  }
});

// AI service configuration
const aiConfig = {
  // OpenRouter API configuration
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct',
    maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE) || 0.7
  },

  // Model paths (relative to AI service)
  models: {
    wateringPrediction: process.env.WATERING_MODEL_PATH || '../ai_models/watering_prediction',
    diseaseRecognition: process.env.DISEASE_MODEL_PATH || '../ai_models/disease_recognition'
  },

  // Image processing configuration
  images: {
    uploadPath: process.env.IMAGE_UPLOAD_PATH || './uploads/images',
    tempPath: process.env.IMAGE_PROCESSING_TEMP || './temp/images',
    sharedPath: process.env.SHARED_IMAGE_STORAGE || '../uploads/images',
    maxSize: parseInt(process.env.MAX_IMAGE_SIZE) || 10485760, // 10MB
    allowedTypes: process.env.ALLOWED_IMAGE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/jpg'],
    resize: {
      width: 224,
      height: 224,
      fit: 'cover'
    }
  },

  // TensorFlow.js configuration
  tensorflow: {
    backend: process.env.TFJS_BACKEND || 'cpu',
    platform: process.env.TFJS_PLATFORM || 'node'
  },

  // Load model configuration
  modelConfig: loadAIConfig(),

  // Validation functions
  validateImageFile: (file) => {
    if (!file) return { valid: false, error: 'No file provided' };
    
    const allowedTypes = aiConfig.images.allowedTypes;
    if (!allowedTypes.includes(file.mimetype)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
      };
    }
    
    if (file.size > aiConfig.images.maxSize) {
      return { 
        valid: false, 
        error: `File too large. Maximum size: ${aiConfig.images.maxSize / 1024 / 1024}MB` 
      };
    }
    
    return { valid: true };
  },

  // Get model path
  getModelPath: (modelType) => {
    const modelPath = aiConfig.models[modelType];
    if (!modelPath) {
      throw new Error(`Unknown model type: ${modelType}`);
    }
    return path.resolve(modelPath);
  },

  // Check if model exists
  modelExists: (modelType) => {
    try {
      const modelPath = aiConfig.getModelPath(modelType);
      return fs.existsSync(modelPath);
    } catch (error) {
      return false;
    }
  }
};

module.exports = aiConfig;