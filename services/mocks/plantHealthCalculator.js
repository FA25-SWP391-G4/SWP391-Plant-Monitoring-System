/**
 * Plant Health Calculator
 * 
 * This utility calculates plant health scores based on sensor readings
 * and thresholds. It analyzes soil moisture, temperature, humidity, and
 * light intensity to determine overall plant health.
 */

/**
 * Calculate plant health based on sensor data and thresholds
 * 
 * @param {Object} mockDeviceData - Device data from the enhanced mock
 * @param {Object} options - Additional options like past readings
 * @returns {Number} Health score from 0-100
 */
const calculatePlantHealth = (mockDeviceData, options = {}) => {
  // Extract sensor values from device data
  const {
    soil_moisture,
    temperature,
    air_humidity,
    light_intensity,
    thresholds = {}
  } = mockDeviceData;
  
  // Extract thresholds with defaults
  const {
    soil = 35,
    light = 20000,
    tempMin = 18, 
    tempMax = 30,
    humidityMax = 70
  } = thresholds;
  
  // Default minimums if not provided
  const humidityMin = 30; // Default minimum humidity
  const lightMin = 500;   // Default minimum light
  
  // Individual health factors (0-100 scale)
  let moistureHealth = 100;
  let temperatureHealth = 100;
  let humidityHealth = 100;
  let lightHealth = 100;
  
  // Calculate moisture health (most important factor)
  // Optimal is between threshold and threshold * 1.5
  if (soil_moisture < soil * 0.7) {
    // Critical: below 70% of threshold
    moistureHealth = Math.max(0, (soil_moisture / (soil * 0.7)) * 50);
  } else if (soil_moisture < soil) {
    // Low: between 70% and 100% of threshold
    moistureHealth = 50 + ((soil_moisture - (soil * 0.7)) / (soil * 0.3)) * 30;
  } else if (soil_moisture <= soil * 1.5) {
    // Optimal: between threshold and 150% of threshold
    moistureHealth = 80 + ((soil_moisture - soil) / (soil * 0.5)) * 20;
  } else if (soil_moisture <= soil * 2) {
    // Too wet: between 150% and 200% of threshold
    moistureHealth = 100 - ((soil_moisture - (soil * 1.5)) / (soil * 0.5)) * 30;
  } else {
    // Severely over-watered: above 200% of threshold
    moistureHealth = Math.max(0, 70 - ((soil_moisture - (soil * 2)) / soil) * 30);
  }
  
  // Calculate temperature health
  // Optimal is in the middle of the range
  const optimalTemp = (tempMax + tempMin) / 2;
  const tempRange = tempMax - tempMin;
  
  if (temperature < tempMin) {
    // Too cold
    temperatureHealth = Math.max(0, 70 - ((tempMin - temperature) / 5) * 20);
  } else if (temperature > tempMax) {
    // Too hot
    temperatureHealth = Math.max(0, 70 - ((temperature - tempMax) / 5) * 20);
  } else {
    // Within range - higher score the closer to optimal
    const distanceFromOptimal = Math.abs(temperature - optimalTemp);
    const percentFromOptimal = distanceFromOptimal / (tempRange / 2);
    temperatureHealth = 100 - (percentFromOptimal * 20); // 80-100% if within range
  }
  
  // Calculate humidity health
  if (air_humidity < humidityMin) {
    // Too dry
    humidityHealth = Math.max(0, 70 - ((humidityMin - air_humidity) / 10) * 20);
  } else if (air_humidity > humidityMax) {
    // Too humid
    humidityHealth = Math.max(0, 70 - ((air_humidity - humidityMax) / 10) * 20);
  } else {
    // Within range - optimal in middle
    const optimalHumidity = (humidityMin + humidityMax) / 2;
    const humidityRange = humidityMax - humidityMin;
    const distanceFromOptimal = Math.abs(air_humidity - optimalHumidity);
    const percentFromOptimal = distanceFromOptimal / (humidityRange / 2);
    humidityHealth = 100 - (percentFromOptimal * 15); // 85-100% if within range
  }
  
  // Calculate light health
  if (light_intensity < lightMin) {
    // Too dark
    lightHealth = Math.max(0, 70 - ((lightMin - light_intensity) / lightMin) * 30);
  } else if (light_intensity > light * 1.2) {
    // Too bright
    lightHealth = Math.max(0, 70 - ((light_intensity - (light * 1.2)) / light) * 15);
  } else {
    // Within range
    lightHealth = 85 + ((light_intensity - lightMin) / (light - lightMin)) * 15;
    if (lightHealth > 100) lightHealth = 100;
  }
  
  // Weight factors based on importance
  const weightedHealth = (
    (moistureHealth * 0.45) +    // Soil moisture is most important
    (temperatureHealth * 0.25) + // Temperature is second most important
    (humidityHealth * 0.15) +    // Humidity is third most important
    (lightHealth * 0.15)         // Light is also important
  );
  
  // Add trend factor from historical data if available
  let trendFactor = 0;
  if (options.pastHealth) {
    // Trend adjustment - reward improvement, penalize decline
    const healthDifference = weightedHealth - options.pastHealth;
    trendFactor = healthDifference * 0.5; // +/- up to 5 points for trends
  }
  
  // Calculate final health score
  const healthScore = Math.min(100, Math.max(0, weightedHealth + trendFactor));
  
  // Return the calculated health and individual factors for detailed reporting
  return {
    health: Math.round(healthScore), // Round to nearest integer
    factors: {
      moisture: Math.round(moistureHealth),
      temperature: Math.round(temperatureHealth),
      humidity: Math.round(humidityHealth),
      light: Math.round(lightHealth)
    }
  };
};

/**
 * Determine plant status based on health score
 * 
 * @param {Number} health - Health score from 0-100
 * @returns {String} Plant status description
 */
const getPlantStatus = (health) => {
  if (health >= 80) {
    return 'healthy';
  } else if (health >= 60) {
    return 'needs_attention';
  } else if (health >= 40) {
    return 'stressed';
  } else if (health >= 20) {
    return 'critical';
  } else {
    return 'dying';
  }
};

module.exports = {
  calculatePlantHealth,
  getPlantStatus
};