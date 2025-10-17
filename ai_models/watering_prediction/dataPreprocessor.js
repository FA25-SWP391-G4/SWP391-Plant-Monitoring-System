/**
 * Data Preprocessing Utilities for Watering Prediction Model
 * Handles data cleaning, feature engineering, and preparation for training
 */

class DataPreprocessor {
  constructor() {
    this.sensorFeatures = ['moisture', 'temperature', 'humidity', 'light'];
    this.windowSize = 7; // Days of historical data to consider
  }

  /**
   * Clean and validate sensor data
   */
  cleanSensorData(rawData) {
    return rawData.map(record => {
      const cleaned = {
        timestamp: new Date(record.timestamp || record.created_at),
        plant_id: record.plant_id,
        moisture: this.clampValue(record.moisture, 0, 100),
        temperature: this.clampValue(record.temperature, -10, 50),
        humidity: this.clampValue(record.humidity, 0, 100),
        light: this.clampValue(record.light, 0, 2000),
        watered: Boolean(record.watered || record.was_watered)
      };

      // Fill missing values with reasonable defaults
      if (cleaned.moisture === null || isNaN(cleaned.moisture)) cleaned.moisture = 50;
      if (cleaned.temperature === null || isNaN(cleaned.temperature)) cleaned.temperature = 22;
      if (cleaned.humidity === null || isNaN(cleaned.humidity)) cleaned.humidity = 60;
      if (cleaned.light === null || isNaN(cleaned.light)) cleaned.light = 500;

      return cleaned;
    }).filter(record => record.timestamp && !isNaN(record.timestamp.getTime()));
  }

  /**
   * Clamp values to reasonable ranges
   */
  clampValue(value, min, max) {
    if (value === null || value === undefined || isNaN(value)) {
      return null;
    }
    return Math.max(min, Math.min(max, parseFloat(value)));
  }

  /**
   * Generate training samples from historical data
   */
  generateTrainingSamples(cleanedData, plantId = null) {
    // Filter by plant if specified
    let data = plantId ? cleanedData.filter(d => d.plant_id === plantId) : cleanedData;
    
    // Sort by timestamp
    data = data.sort((a, b) => a.timestamp - b.timestamp);

    const samples = [];
    
    // Generate samples with sliding window
    for (let i = this.windowSize; i < data.length; i++) {
      const currentRecord = data[i];
      const historicalRecords = data.slice(i - this.windowSize, i);

      // Skip if we don't have enough historical data
      if (historicalRecords.length < this.windowSize) continue;

      const sample = {
        sensorData: {
          moisture: currentRecord.moisture,
          temperature: currentRecord.temperature,
          humidity: currentRecord.humidity,
          light: currentRecord.light
        },
        historicalData: historicalRecords.map(record => ({
          moisture: record.moisture,
          temperature: record.temperature,
          humidity: record.humidity,
          light: record.light
        })),
        shouldWater: this.determineWateringNeed(currentRecord, historicalRecords),
        timestamp: currentRecord.timestamp,
        plant_id: currentRecord.plant_id
      };

      samples.push(sample);
    }

    return samples;
  }

  /**
   * Determine if watering was needed based on sensor data and outcomes
   */
  determineWateringNeed(currentRecord, historicalRecords) {
    // If the plant was actually watered, assume it needed watering
    if (currentRecord.watered) {
      return true;
    }

    // Use heuristics to determine if watering was needed
    const moistureThreshold = 40; // Below this, watering is likely needed
    const temperatureBoost = currentRecord.temperature > 25 ? 10 : 0; // Higher temp = higher threshold
    const humidityPenalty = currentRecord.humidity < 50 ? 5 : 0; // Low humidity = higher threshold
    
    const adjustedThreshold = moistureThreshold + temperatureBoost + humidityPenalty;
    
    // Check if moisture was below threshold
    if (currentRecord.moisture < adjustedThreshold) {
      return true;
    }

    // Check moisture trend - if rapidly declining, might need water
    if (historicalRecords.length >= 3) {
      const recentMoisture = historicalRecords.slice(-3).map(r => r.moisture);
      const moistureDecline = recentMoisture[0] - recentMoisture[recentMoisture.length - 1];
      
      if (moistureDecline > 15) { // Rapid decline
        return true;
      }
    }

    return false;
  }

  /**
   * Split data into training and validation sets
   */
  splitData(samples, trainRatio = 0.8) {
    // Shuffle the samples
    const shuffled = [...samples].sort(() => Math.random() - 0.5);
    
    const splitIndex = Math.floor(shuffled.length * trainRatio);
    
    return {
      training: shuffled.slice(0, splitIndex),
      validation: shuffled.slice(splitIndex)
    };
  }

  /**
   * Generate synthetic training data for initial model training
   */
  generateSyntheticData(numSamples = 1000) {
    const samples = [];
    
    for (let i = 0; i < numSamples; i++) {
      // Generate realistic sensor readings
      const moisture = Math.random() * 100;
      const temperature = 15 + Math.random() * 20; // 15-35°C
      const humidity = 30 + Math.random() * 50; // 30-80%
      const light = Math.random() * 1500; // 0-1500 lux

      // Generate historical data with some correlation
      const historicalData = [];
      let histMoisture = moisture + (Math.random() - 0.5) * 20;
      
      for (let j = 0; j < this.windowSize; j++) {
        histMoisture = Math.max(0, Math.min(100, histMoisture + (Math.random() - 0.5) * 10));
        historicalData.push({
          moisture: histMoisture,
          temperature: temperature + (Math.random() - 0.5) * 5,
          humidity: humidity + (Math.random() - 0.5) * 15,
          light: light + (Math.random() - 0.5) * 300
        });
      }

      // Determine watering need based on rules
      let shouldWater = false;
      if (moisture < 30) shouldWater = true;
      if (moisture < 50 && temperature > 28) shouldWater = true;
      if (moisture < 45 && humidity < 40) shouldWater = true;

      samples.push({
        sensorData: { moisture, temperature, humidity, light },
        historicalData,
        shouldWater,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        plant_id: Math.floor(Math.random() * 10) + 1
      });
    }

    return samples;
  }

  /**
   * Analyze data quality and provide statistics
   */
  analyzeDataQuality(samples) {
    if (samples.length === 0) {
      return { error: 'No samples provided' };
    }

    const stats = {
      totalSamples: samples.length,
      wateringSamples: samples.filter(s => s.shouldWater).length,
      noWateringSamples: samples.filter(s => !s.shouldWater).length,
      sensorStats: {}
    };

    // Calculate sensor statistics
    this.sensorFeatures.forEach(feature => {
      const values = samples.map(s => s.sensorData[feature]).filter(v => v !== null && !isNaN(v));
      
      if (values.length > 0) {
        stats.sensorStats[feature] = {
          min: Math.min(...values),
          max: Math.max(...values),
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          median: this.calculateMedian(values),
          missing: samples.length - values.length
        };
      }
    });

    // Class balance
    stats.classBalance = {
      wateringRatio: stats.wateringSamples / stats.totalSamples,
      balanced: Math.abs(0.5 - (stats.wateringSamples / stats.totalSamples)) < 0.2
    };

    return stats;
  }

  /**
   * Calculate median value
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  /**
   * Export processed data to JSON format
   */
  exportData(samples, filename) {
    const data = {
      metadata: {
        generated: new Date().toISOString(),
        samples: samples.length,
        features: this.sensorFeatures,
        windowSize: this.windowSize
      },
      samples: samples
    };

    const fs = require('fs');
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Data exported to ${filename}`);
  }

  /**
   * Import data from JSON format
   */
  importData(filename) {
    const fs = require('fs');
    try {
      const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
      return data.samples || data;
    } catch (error) {
      console.error('Error importing data:', error.message);
      return [];
    }
  }
}

module.exports = DataPreprocessor;