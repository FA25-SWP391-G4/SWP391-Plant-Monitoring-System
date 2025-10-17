const { initializeTensorFlow, aiConfig } = require('../services/aiUtils');
const tf = require('@tensorflow/tfjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

describe('AI Infrastructure Setup', () => {
  test('TensorFlow.js should initialize successfully', async () => {
    const initialized = await initializeTensorFlow();
    expect(initialized).toBe(true);
    expect(tf.getBackend()).toBe('cpu');
  });

  test('Sharp should be available for image processing', () => {
    expect(sharp).toBeDefined();
    expect(typeof sharp).toBe('function');
  });

  test('AI configuration should be loaded', () => {
    expect(aiConfig).toBeDefined();
    expect(aiConfig.openRouter).toBeDefined();
    expect(aiConfig.models).toBeDefined();
    expect(aiConfig.images).toBeDefined();
    expect(aiConfig.tensorflow).toBeDefined();
  });

  test('AI models directory structure should exist', () => {
    expect(fs.existsSync('../ai_models')).toBe(true);
    expect(fs.existsSync('../ai_models/watering_prediction')).toBe(true);
    expect(fs.existsSync('../ai_models/disease_recognition')).toBe(true);
    expect(fs.existsSync('../ai_models/config.json')).toBe(true);
  });

  test('Uploads directory should exist', () => {
    expect(fs.existsSync('./uploads')).toBe(true);
    expect(fs.existsSync('./uploads/images')).toBe(true);
  });

  test('Environment variables should be configured', () => {
    // These might not be set in test environment, so we check if they're defined in config
    expect(aiConfig.openRouter.baseUrl).toBeDefined();
    expect(aiConfig.models.wateringPrediction).toBeDefined();
    expect(aiConfig.models.diseaseRecognition).toBeDefined();
    expect(aiConfig.images.uploadPath).toBeDefined();
  });

  test('AI config validation functions should work', () => {
    const mockFile = {
      mimetype: 'image/jpeg',
      size: 1024 * 1024 // 1MB
    };
    
    const validation = aiConfig.validateImageFile(mockFile);
    expect(validation.valid).toBe(true);
    
    const invalidFile = {
      mimetype: 'text/plain',
      size: 1024
    };
    
    const invalidValidation = aiConfig.validateImageFile(invalidFile);
    expect(invalidValidation.valid).toBe(false);
    expect(invalidValidation.error).toContain('Invalid file type');
  });

  test('Model path utilities should work', () => {
    const wateringPath = aiConfig.getModelPath('wateringPrediction');
    expect(wateringPath).toContain('watering_prediction');
    
    const diseaseExists = aiConfig.modelExists('diseaseRecognition');
    expect(typeof diseaseExists).toBe('boolean');
  });

  afterAll(() => {
    // Clean up TensorFlow.js resources
    tf.disposeVariables();
  });
});