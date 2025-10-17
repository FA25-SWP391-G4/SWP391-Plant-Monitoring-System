/**
 * Smart Rule-Based Watering Prediction Model
 * Reliable fallback when TensorFlow.js has issues
 */

class SmartRuleWateringModel {
  constructor() {
    this.version = '1.0.0-rules';
    this.modelType = 'rule-based';
  }

  /**
   * Main prediction method using intelligent rules
   */
  async predict(sensorData, historicalData = [], plantId = null) {
    // Validate input data
    const validationErrors = this.validateSensorData(sensorData);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid sensor data: ${validationErrors.join(', ')}`);
    }

    // Extract sensor values with defaults
    const moisture = sensorData.moisture || 50;
    const temperature = sensorData.temperature || 22;
    const humidity = sensorData.humidity || 60;
    const light = sensorData.light || 500;

    // Calculate historical trends if available
    const trends = this.calculateTrends(historicalData);
    
    // Apply intelligent watering rules
    const decision = this.applyWateringRules(moisture, temperature, humidity, light, trends);
    
    // Calculate recommended amount
    const recommendedAmount = this.calculateWateringAmount(moisture, temperature, humidity, decision.shouldWater);
    
    // Generate detailed reasoning
    const reasoning = this.generateDetailedReasoning(moisture, temperature, humidity, light, trends, decision);

    return {
      shouldWater: decision.shouldWater,
      confidence: decision.confidence,
      recommendedAmount,
      reasoning,
      probabilities: {
        dontWater: decision.shouldWater ? 1 - decision.confidence : decision.confidence,
        water: decision.shouldWater ? decision.confidence : 1 - decision.confidence
      },
      modelType: this.modelType,
      version: this.version,
      timestamp: new Date().toISOString(),
      plantId: plantId,
      factors: decision.factors
    };
  }

  /**
   * Apply intelligent watering rules
   */
  applyWateringRules(moisture, temperature, humidity, light, trends) {
    const factors = [];
    let score = 0; // Positive score = water, negative = don't water
    let confidence = 0.5;

    // Rule 1: Moisture level (most important factor)
    if (moisture < 20) {
      score += 3;
      confidence = Math.max(confidence, 0.9);
      factors.push({ factor: 'critical_low_moisture', weight: 3, description: 'Critically low soil moisture' });
    } else if (moisture < 35) {
      score += 2;
      confidence = Math.max(confidence, 0.8);
      factors.push({ factor: 'low_moisture', weight: 2, description: 'Low soil moisture' });
    } else if (moisture < 50) {
      score += 1;
      confidence = Math.max(confidence, 0.7);
      factors.push({ factor: 'moderate_low_moisture', weight: 1, description: 'Moderately low moisture' });
    } else if (moisture > 80) {
      score -= 2;
      confidence = Math.max(confidence, 0.8);
      factors.push({ factor: 'high_moisture', weight: -2, description: 'High soil moisture' });
    } else if (moisture > 65) {
      score -= 1;
      confidence = Math.max(confidence, 0.7);
      factors.push({ factor: 'adequate_moisture', weight: -1, description: 'Adequate soil moisture' });
    }

    // Rule 2: Temperature effects
    if (temperature > 30) {
      score += 1.5;
      confidence = Math.max(confidence, 0.75);
      factors.push({ factor: 'high_temperature', weight: 1.5, description: 'High temperature increases evaporation' });
    } else if (temperature > 25) {
      score += 0.5;
      factors.push({ factor: 'warm_temperature', weight: 0.5, description: 'Warm temperature' });
    } else if (temperature < 15) {
      score -= 0.5;
      factors.push({ factor: 'cool_temperature', weight: -0.5, description: 'Cool temperature reduces water needs' });
    }

    // Rule 3: Humidity effects
    if (humidity < 30) {
      score += 1;
      confidence = Math.max(confidence, 0.75);
      factors.push({ factor: 'very_low_humidity', weight: 1, description: 'Very low humidity increases evaporation' });
    } else if (humidity < 45) {
      score += 0.5;
      factors.push({ factor: 'low_humidity', weight: 0.5, description: 'Low humidity' });
    } else if (humidity > 80) {
      score -= 0.5;
      factors.push({ factor: 'high_humidity', weight: -0.5, description: 'High humidity reduces evaporation' });
    }

    // Rule 4: Light intensity effects
    if (light > 1000) {
      score += 0.5;
      factors.push({ factor: 'high_light', weight: 0.5, description: 'High light intensity increases water consumption' });
    } else if (light > 700) {
      score += 0.25;
      factors.push({ factor: 'moderate_light', weight: 0.25, description: 'Moderate light intensity' });
    } else if (light < 200) {
      score -= 0.25;
      factors.push({ factor: 'low_light', weight: -0.25, description: 'Low light reduces water needs' });
    }

    // Rule 5: Historical trends
    if (trends.moistureDecline > 15) {
      score += 1;
      confidence = Math.max(confidence, 0.8);
      factors.push({ factor: 'rapid_moisture_decline', weight: 1, description: 'Rapid moisture decline detected' });
    } else if (trends.moistureDecline > 8) {
      score += 0.5;
      factors.push({ factor: 'moderate_moisture_decline', weight: 0.5, description: 'Moderate moisture decline' });
    }

    if (trends.temperatureIncrease > 5) {
      score += 0.5;
      factors.push({ factor: 'temperature_rising', weight: 0.5, description: 'Rising temperature trend' });
    }

    // Rule 6: Combined stress conditions
    if (moisture < 40 && temperature > 25 && humidity < 50) {
      score += 1;
      confidence = Math.max(confidence, 0.85);
      factors.push({ factor: 'stress_conditions', weight: 1, description: 'Multiple stress conditions detected' });
    }

    // Rule 7: Time-based adjustments
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 10) {
      // Morning is best time for watering
      if (score > 0) {
        score += 0.25;
        factors.push({ factor: 'morning_time', weight: 0.25, description: 'Optimal watering time (morning)' });
      }
    } else if (hour >= 12 && hour <= 16) {
      // Avoid midday watering
      if (score > 0) {
        score -= 0.25;
        factors.push({ factor: 'midday_time', weight: -0.25, description: 'Suboptimal watering time (midday)' });
      }
    }

    // Final decision
    const shouldWater = score > 0;
    
    // Adjust confidence based on score magnitude
    if (Math.abs(score) > 2) {
      confidence = Math.min(0.95, confidence + 0.1);
    } else if (Math.abs(score) < 0.5) {
      confidence = Math.max(0.6, confidence - 0.1);
    }

    return {
      shouldWater,
      confidence: Math.round(confidence * 100) / 100,
      score: Math.round(score * 100) / 100,
      factors
    };
  }

  /**
   * Calculate historical trends
   */
  calculateTrends(historicalData) {
    const trends = {
      moistureDecline: 0,
      temperatureIncrease: 0,
      humidityChange: 0,
      dataPoints: historicalData.length
    };

    if (historicalData.length < 2) {
      return trends;
    }

    // Calculate trends over the historical period
    const recent = historicalData.slice(-3); // Last 3 readings
    const older = historicalData.slice(0, 3); // First 3 readings

    if (recent.length > 0 && older.length > 0) {
      const recentAvg = {
        moisture: recent.reduce((sum, d) => sum + (d.moisture || 0), 0) / recent.length,
        temperature: recent.reduce((sum, d) => sum + (d.temperature || 0), 0) / recent.length,
        humidity: recent.reduce((sum, d) => sum + (d.humidity || 0), 0) / recent.length
      };

      const olderAvg = {
        moisture: older.reduce((sum, d) => sum + (d.moisture || 0), 0) / older.length,
        temperature: older.reduce((sum, d) => sum + (d.temperature || 0), 0) / older.length,
        humidity: older.reduce((sum, d) => sum + (d.humidity || 0), 0) / older.length
      };

      trends.moistureDecline = olderAvg.moisture - recentAvg.moisture;
      trends.temperatureIncrease = recentAvg.temperature - olderAvg.temperature;
      trends.humidityChange = recentAvg.humidity - olderAvg.humidity;
    }

    return trends;
  }

  /**
   * Calculate recommended watering amount
   */
  calculateWateringAmount(moisture, temperature, humidity, shouldWater) {
    if (!shouldWater) {
      return 0;
    }

    // Base amount on moisture deficit
    const targetMoisture = 65; // Target moisture level
    const moistureDeficit = Math.max(0, targetMoisture - moisture);
    let baseAmount = moistureDeficit * 4; // 4ml per percentage point

    // Adjust for environmental conditions
    if (temperature > 25) {
      baseAmount *= 1.2; // 20% more for high temperature
    }
    if (humidity < 45) {
      baseAmount *= 1.1; // 10% more for low humidity
    }

    // Clamp to reasonable range
    const amount = Math.max(50, Math.min(500, Math.round(baseAmount)));
    
    return amount;
  }

  /**
   * Generate detailed reasoning
   */
  generateDetailedReasoning(moisture, temperature, humidity, light, trends, decision) {
    const reasons = [];
    
    // Primary factors
    if (moisture < 30) {
      reasons.push(`Low soil moisture (${moisture}%)`);
    } else if (moisture > 70) {
      reasons.push(`Adequate soil moisture (${moisture}%)`);
    }

    if (temperature > 25) {
      reasons.push(`High temperature (${temperature}°C) increases evaporation`);
    }

    if (humidity < 45) {
      reasons.push(`Low humidity (${humidity}%) accelerates water loss`);
    }

    if (light > 800) {
      reasons.push(`High light intensity (${light} lux) increases transpiration`);
    }

    // Trends
    if (trends.moistureDecline > 10) {
      reasons.push(`Moisture declining rapidly (${trends.moistureDecline.toFixed(1)}% drop)`);
    }

    // Decision factors
    const significantFactors = decision.factors.filter(f => Math.abs(f.weight) >= 1);
    significantFactors.forEach(factor => {
      if (!reasons.some(r => r.toLowerCase().includes(factor.factor.split('_')[0]))) {
        reasons.push(factor.description);
      }
    });

    if (reasons.length === 0) {
      reasons.push('Based on current sensor readings and environmental conditions');
    }

    const action = decision.shouldWater ? 'watering recommended' : 'watering not needed';
    const confidenceText = decision.confidence > 0.8 ? 'high confidence' : 
                          decision.confidence > 0.6 ? 'moderate confidence' : 'low confidence';

    return `${reasons.join(', ')} - ${action} (${confidenceText}, score: ${decision.score})`;
  }

  /**
   * Validate sensor data
   */
  validateSensorData(sensorData) {
    const errors = [];
    
    if (!sensorData || typeof sensorData !== 'object') {
      errors.push('Sensor data must be an object');
      return errors;
    }

    const requiredFields = ['moisture', 'temperature', 'humidity', 'light'];
    requiredFields.forEach(field => {
      if (sensorData[field] === undefined || sensorData[field] === null) {
        errors.push(`Missing required field: ${field}`);
      } else if (isNaN(sensorData[field])) {
        errors.push(`Invalid value for ${field}: must be a number`);
      }
    });

    // Check value ranges
    if (sensorData.moisture < 0 || sensorData.moisture > 100) {
      errors.push('Moisture must be between 0 and 100');
    }
    if (sensorData.temperature < -20 || sensorData.temperature > 60) {
      errors.push('Temperature must be between -20 and 60 degrees Celsius');
    }
    if (sensorData.humidity < 0 || sensorData.humidity > 100) {
      errors.push('Humidity must be between 0 and 100');
    }
    if (sensorData.light < 0 || sensorData.light > 5000) {
      errors.push('Light must be between 0 and 5000 lux');
    }

    return errors;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const testData = { moisture: 45, temperature: 22, humidity: 60, light: 500 };
      const prediction = await this.predict(testData);
      
      return {
        status: 'healthy',
        healthy: true,
        modelType: this.modelType,
        version: this.version,
        testPrediction: prediction,
        features: ['moisture_analysis', 'temperature_effects', 'humidity_effects', 'light_analysis', 'trend_analysis', 'time_optimization']
      };
    } catch (error) {
      return {
        status: 'error',
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      modelType: this.modelType,
      version: this.version,
      features: [
        'Rule-based decision making',
        'Multi-factor analysis',
        'Historical trend analysis',
        'Environmental stress detection',
        'Time-based optimization',
        'Confidence scoring'
      ],
      status: 'ready'
    };
  }
}

module.exports = SmartRuleWateringModel;