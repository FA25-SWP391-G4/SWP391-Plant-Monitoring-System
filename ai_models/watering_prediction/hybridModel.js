/**
 * Hybrid Watering Prediction Model
 * Combines TensorFlow.js with Smart Rule-Based fallback
 */

const WateringPredictionModelFixed = require('./modelFixed');
const SmartRuleWateringModel = require('./smartRuleModel');

class HybridWateringModel {
  constructor() {
    this.tensorflowModel = new WateringPredictionModelFixed();
    this.ruleModel = new SmartRuleWateringModel();
    this.version = '1.0.0-hybrid';
    this.preferTensorFlow = true;
    this.fallbackThreshold = 0.6; // Switch to rules if TF confidence is low
  }

  /**
   * Initialize the hybrid model
   */
  async initialize() {
    console.log('Initializing Hybrid Watering Model...');
    
    try {
      // Try to initialize TensorFlow model
      await this.tensorflowModel.loadModel();
      console.log('✓ TensorFlow model initialized');
    } catch (error) {
      console.warn('⚠ TensorFlow model failed to initialize:', error.message);
      this.preferTensorFlow = false;
    }
    
    // Rule model is always available
    console.log('✓ Rule-based model ready');
    console.log(`Hybrid model initialized (TensorFlow: ${this.preferTensorFlow ? 'enabled' : 'disabled'})`);
  }

  /**
   * Make prediction using hybrid approach
   */
  async predict(sensorData, historicalData = [], plantId = null) {
    let tensorflowPrediction = null;
    let rulePrediction = null;
    let finalPrediction = null;
    let modelUsed = 'unknown';

    try {
      // Always get rule-based prediction as baseline
      rulePrediction = await this.ruleModel.predict(sensorData, historicalData, plantId);
      
      // Try TensorFlow prediction if available
      if (this.preferTensorFlow && !this.tensorflowModel.fallbackMode) {
        try {
          tensorflowPrediction = await this.tensorflowModel.predict(sensorData, historicalData);
          
          // Decide which prediction to use
          finalPrediction = this.selectBestPrediction(tensorflowPrediction, rulePrediction, sensorData);
          modelUsed = finalPrediction.modelUsed;
          
        } catch (tfError) {
          console.warn('TensorFlow prediction failed, using rules:', tfError.message);
          finalPrediction = rulePrediction;
          modelUsed = 'rule-based (tf-failed)';
        }
      } else {
        finalPrediction = rulePrediction;
        modelUsed = 'rule-based (tf-disabled)';
      }

      // Add hybrid metadata
      finalPrediction.modelType = 'hybrid';
      finalPrediction.modelUsed = modelUsed;
      finalPrediction.version = this.version;
      finalPrediction.hybridInfo = {
        tensorflowAvailable: !this.tensorflowModel.fallbackMode,
        tensorflowPrediction: tensorflowPrediction ? {
          shouldWater: tensorflowPrediction.shouldWater,
          confidence: tensorflowPrediction.confidence
        } : null,
        rulePrediction: {
          shouldWater: rulePrediction.shouldWater,
          confidence: rulePrediction.confidence
        }
      };

      return finalPrediction;

    } catch (error) {
      console.error('Hybrid prediction failed:', error.message);
      
      // Last resort: simple fallback
      return this.emergencyFallback(sensorData);
    }
  }

  /**
   * Select the best prediction from TensorFlow and Rules
   */
  selectBestPrediction(tfPrediction, rulePrediction, sensorData) {
    // Strategy 1: If TensorFlow confidence is very low, prefer rules
    if (tfPrediction.confidence < this.fallbackThreshold) {
      return {
        ...rulePrediction,
        modelUsed: 'rule-based (low-tf-confidence)',
        reason: `TensorFlow confidence too low (${tfPrediction.confidence}), using rules`
      };
    }

    // Strategy 2: For critical conditions, prefer rules (more conservative)
    if (sensorData.moisture < 20) {
      return {
        ...rulePrediction,
        modelUsed: 'rule-based (critical-condition)',
        reason: 'Critical moisture level, using conservative rule-based approach'
      };
    }

    // Strategy 3: If both models agree, use the one with higher confidence
    if (tfPrediction.shouldWater === rulePrediction.shouldWater) {
      if (tfPrediction.confidence >= rulePrediction.confidence) {
        return {
          ...tfPrediction,
          modelUsed: 'tensorflow (agreement)',
          reason: `Both models agree, TensorFlow has higher confidence (${tfPrediction.confidence} vs ${rulePrediction.confidence})`
        };
      } else {
        return {
          ...rulePrediction,
          modelUsed: 'rule-based (agreement)',
          reason: `Both models agree, Rules have higher confidence (${rulePrediction.confidence} vs ${tfPrediction.confidence})`
        };
      }
    }

    // Strategy 4: Models disagree - use weighted decision
    const tfWeight = Math.min(tfPrediction.confidence, 0.8); // Cap TF weight
    const ruleWeight = rulePrediction.confidence;
    
    if (tfWeight > ruleWeight) {
      return {
        ...tfPrediction,
        modelUsed: 'tensorflow (disagreement-weighted)',
        reason: `Models disagree, TensorFlow weighted higher (${tfWeight} vs ${ruleWeight})`
      };
    } else {
      return {
        ...rulePrediction,
        modelUsed: 'rule-based (disagreement-weighted)',
        reason: `Models disagree, Rules weighted higher (${ruleWeight} vs ${tfWeight})`
      };
    }
  }

  /**
   * Emergency fallback when everything fails
   */
  emergencyFallback(sensorData) {
    const moisture = sensorData.moisture || 50;
    const shouldWater = moisture < 35;
    const confidence = moisture < 20 ? 0.9 : moisture > 70 ? 0.8 : 0.6;
    
    return {
      shouldWater,
      confidence,
      recommendedAmount: shouldWater ? Math.max(100, (70 - moisture) * 4) : 0,
      reasoning: `Emergency fallback prediction based on moisture level (${moisture}%)`,
      modelType: 'emergency-fallback',
      modelUsed: 'emergency',
      version: this.version,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check for hybrid model
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      healthy: true,
      modelType: 'hybrid',
      version: this.version,
      components: {}
    };

    try {
      // Check TensorFlow model
      const tfHealth = await this.tensorflowModel.healthCheck();
      health.components.tensorflow = {
        available: tfHealth.tensorflowAvailable,
        healthy: tfHealth.healthy,
        fallbackMode: tfHealth.fallbackMode
      };

      // Check Rule model
      const ruleHealth = await this.ruleModel.healthCheck();
      health.components.rules = {
        available: true,
        healthy: ruleHealth.healthy
      };

      // Test prediction
      const testData = { moisture: 45, temperature: 22, humidity: 60, light: 500 };
      const prediction = await this.predict(testData);
      health.testPrediction = {
        shouldWater: prediction.shouldWater,
        confidence: prediction.confidence,
        modelUsed: prediction.modelUsed
      };

      // Overall health
      health.healthy = ruleHealth.healthy; // At least rules must work
      health.status = health.healthy ? 'healthy' : 'degraded';

    } catch (error) {
      health.healthy = false;
      health.status = 'error';
      health.error = error.message;
    }

    return health;
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      modelType: 'hybrid',
      version: this.version,
      components: {
        tensorflow: {
          available: !this.tensorflowModel.fallbackMode,
          version: '1.1.0-fixed'
        },
        rules: {
          available: true,
          version: '1.0.0-rules'
        }
      },
      strategy: 'TensorFlow with Rule-based fallback',
      fallbackThreshold: this.fallbackThreshold,
      status: 'ready'
    };
  }

  /**
   * Update model preferences
   */
  setPreferences(options = {}) {
    if (options.preferTensorFlow !== undefined) {
      this.preferTensorFlow = options.preferTensorFlow;
    }
    if (options.fallbackThreshold !== undefined) {
      this.fallbackThreshold = Math.max(0.1, Math.min(0.9, options.fallbackThreshold));
    }
    
    console.log(`Preferences updated: TensorFlow=${this.preferTensorFlow}, threshold=${this.fallbackThreshold}`);
  }

  /**
   * Retrain TensorFlow component
   */
  async retrain(newData) {
    if (!this.preferTensorFlow || this.tensorflowModel.fallbackMode) {
      console.log('TensorFlow not available for retraining');
      return false;
    }

    try {
      return await this.tensorflowModel.retrain(newData);
    } catch (error) {
      console.error('Retraining failed:', error.message);
      return false;
    }
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.tensorflowModel.dispose();
    // Rule model doesn't need disposal
  }
}

module.exports = HybridWateringModel;