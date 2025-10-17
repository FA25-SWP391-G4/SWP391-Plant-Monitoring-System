/**
 * Watering Prediction Module
 * Main entry point for the watering prediction system
 * Now uses Hybrid Model for best reliability and accuracy
 */

const HybridWateringModel = require('./hybridModel');
const WateringPredictionModel = require('./model');
const WateringPredictionModelFixed = require('./modelFixed');
const SmartRuleWateringModel = require('./smartRuleModel');
const DataPreprocessor = require('./dataPreprocessor');
const { ModelLoader, getModelLoader } = require('./modelLoader');

// Singleton hybrid model instance
let hybridModelInstance = null;

/**
 * Get singleton instance of Hybrid Model
 */
function getHybridModel() {
  if (!hybridModelInstance) {
    hybridModelInstance = new HybridWateringModel();
  }
  return hybridModelInstance;
}

// Export all components
module.exports = {
  // Main models
  HybridWateringModel,
  WateringPredictionModel,
  WateringPredictionModelFixed,
  SmartRuleWateringModel,
  DataPreprocessor,
  ModelLoader,
  getModelLoader,
  getHybridModel,
  
  // Convenience functions using Hybrid Model (recommended)
  async predict(sensorData, historicalData = [], plantId = null) {
    const model = getHybridModel();
    if (!model.initialized) {
      await model.initialize();
    }
    return await model.predict(sensorData, historicalData, plantId);
  },
  
  async initialize() {
    const model = getHybridModel();
    return await model.initialize();
  },
  
  async retrain(newData) {
    const model = getHybridModel();
    return await model.retrain(newData);
  },
  
  getModelInfo() {
    const model = getHybridModel();
    return model.getModelInfo();
  },
  
  async healthCheck() {
    const model = getHybridModel();
    return await model.healthCheck();
  },
  
  validateSensorData(sensorData) {
    const ruleModel = new SmartRuleWateringModel();
    return ruleModel.validateSensorData(sensorData);
  },

  // Model selection functions
  async predictWithTensorFlow(sensorData, historicalData = [], plantId = null) {
    const loader = getModelLoader();
    return await loader.predict(sensorData, historicalData, plantId);
  },

  async predictWithRules(sensorData, historicalData = [], plantId = null) {
    const ruleModel = new SmartRuleWateringModel();
    return await ruleModel.predict(sensorData, historicalData, plantId);
  },

  // Utility functions
  setModelPreferences(options) {
    const model = getHybridModel();
    return model.setPreferences(options);
  },

  dispose() {
    if (hybridModelInstance) {
      hybridModelInstance.dispose();
      hybridModelInstance = null;
    }
  }
};