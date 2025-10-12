/**
 * IoT Sensor Data Mock Generator
 * Creates realistic dummy data for testing IoT-related functionality
 */

const fs = require('fs');
const path = require('path');

// Configuration for different sensor types
const sensorRanges = {
  temperature: { min: 15, max: 35, unit: '°C', precision: 1 },
  humidity: { min: 30, max: 90, unit: '%', precision: 1 },
  moisture: { min: 20, max: 80, unit: '%', precision: 1 },
  light: { min: 100, max: 10000, unit: 'lux', precision: 0 },
  pH: { min: 4.0, max: 9.0, unit: '', precision: 1 }
};

// Plant types and their ideal ranges
const plantTypes = {
  'Monstera': {
    temperature: { min: 18, max: 30, ideal: 24 },
    humidity: { min: 60, max: 80, ideal: 70 },
    moisture: { min: 40, max: 70, ideal: 55 },
    light: { min: 500, max: 2000, ideal: 1200 },
    pH: { min: 5.5, max: 7.0, ideal: 6.5 }
  },
  'Succulent': {
    temperature: { min: 18, max: 32, ideal: 25 },
    humidity: { min: 20, max: 50, ideal: 30 },
    moisture: { min: 20, max: 40, ideal: 30 },
    light: { min: 2000, max: 8000, ideal: 5000 },
    pH: { min: 6.0, max: 7.5, ideal: 6.8 }
  },
  'Fern': {
    temperature: { min: 16, max: 24, ideal: 21 },
    humidity: { min: 70, max: 90, ideal: 80 },
    moisture: { min: 50, max: 80, ideal: 65 },
    light: { min: 200, max: 1000, ideal: 500 },
    pH: { min: 5.0, max: 6.5, ideal: 5.5 }
  }
};

/**
 * Generate a random number within a range and with specified precision
 */
function getRandomInRange(min, max, precision = 1) {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(precision));
}

/**
 * Generate a single sensor reading based on sensor type and optional plant type
 */
function generateSensorReading(sensorType, plantType = null) {
  const range = sensorRanges[sensorType];
  
  if (!range) {
    throw new Error(`Unknown sensor type: ${sensorType}`);
  }
  
  // If a plant type is specified and exists in our data, use its ideal range
  if (plantType && plantTypes[plantType] && plantTypes[plantType][sensorType]) {
    const plantRange = plantTypes[plantType][sensorType];
    // Bias towards the ideal value with some random variation
    const idealValue = plantRange.ideal;
    const variance = Math.min(
      Math.abs(idealValue - plantRange.min) / 2,
      Math.abs(plantRange.max - idealValue) / 2
    );
    
    return getRandomInRange(
      idealValue - variance,
      idealValue + variance,
      range.precision
    );
  }
  
  // Otherwise use the general range for this sensor type
  return getRandomInRange(range.min, range.max, range.precision);
}

/**
 * Generate a full set of IoT sensor readings
 */
function generateIoTData(plantType = null, includeTimestamp = true) {
  const data = {
    temperature: generateSensorReading('temperature', plantType),
    humidity: generateSensorReading('humidity', plantType),
    moisture: generateSensorReading('moisture', plantType),
    light: generateSensorReading('light', plantType),
    pH: generateSensorReading('pH', plantType),
  };
  
  if (includeTimestamp) {
    data.timestamp = new Date().toISOString();
  }
  
  return data;
}

/**
 * Generate a series of IoT readings over time
 */
function generateTimeSeriesData(hours = 24, intervalMinutes = 30, plantType = null) {
  const readings = [];
  const now = new Date();
  
  // Start from "hours" ago
  const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
  
  // Generate data points at specified intervals
  for (let i = 0; i < (hours * 60) / intervalMinutes; i++) {
    const timestamp = new Date(startTime.getTime() + i * intervalMinutes * 60 * 1000);
    const reading = generateIoTData(plantType, false);
    readings.push({
      ...reading,
      timestamp: timestamp.toISOString()
    });
  }
  
  return readings;
}

// Export as both module functions and CLI tool
module.exports = {
  generateIoTData,
  generateTimeSeriesData,
  sensorRanges,
  plantTypes
};

// If called directly as a script
if (require.main === module) {
  const args = process.argv.slice(2);
  const plantType = args[0] || null;
  
  console.log('Generating mock IoT sensor data...');
  const singleReading = generateIoTData(plantType);
  console.log(JSON.stringify(singleReading, null, 2));
  
  // Save to a file if a second argument is provided
  if (args[1]) {
    const outputPath = path.resolve(args[1]);
    const timeSeriesData = generateTimeSeriesData(24, 30, plantType);
    
    fs.writeFileSync(
      outputPath, 
      JSON.stringify({ 
        metadata: {
          plantType,
          generatedAt: new Date().toISOString(),
          readings: timeSeriesData.length
        },
        readings: timeSeriesData 
      }, null, 2)
    );
    
    console.log(`Time series data with ${timeSeriesData.length} readings saved to ${outputPath}`);
  }
}