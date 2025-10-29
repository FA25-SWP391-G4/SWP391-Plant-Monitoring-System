/**
 * Enhanced Device Mock Service
 * 
 * Provides realistic device data simulation matching the format from real IoT devices
 */

const realDeviceDataTemplate = {
  messageType: "sensor",
  deviceId: 3,
  timestamp: "2025-10-22T03:36:24Z",
  soil_moisture: 100,
  temperature: 26.4,
  air_humidity: 78.2, 
  light_intensity: 0,
  pump: "OFF",
  thresholds: {
    soil: 35,
    light: 20000,
    tempMin: 18,
    tempMax: 30,
    humidityMax: 70
  }
};

class EnhancedDeviceMock {
  /**
   * Generate mock device data in the real device format
   * 
   * @param {Number} deviceId - The device ID
   * @param {Object} overrides - Optional values to override defaults
   * @returns {Object} Mock device data
   */
  static generateMockData(deviceId = 3, overrides = {}) {
    // Get current time in ISO format
    const timestamp = new Date().toISOString();
    
    // Time-based parameters
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour <= 18;
    
    // Generate realistic values based on time of day
    const soil_moisture = overrides.soil_moisture ?? 
      Math.floor(Math.random() * 35 + 65); // 65-100%
      
    const temperature = overrides.temperature ?? 
      (isDaytime ? 
        (22 + Math.random() * 8) :  // 22-30°C during day
        (18 + Math.random() * 6));  // 18-24°C during night
        
    const air_humidity = overrides.air_humidity ?? 
      (isDaytime ? 
        (50 + Math.random() * 20) : // 50-70% during day
        (70 + Math.random() * 15)); // 70-85% during night
        
    const light_intensity = overrides.light_intensity ?? 
      (isDaytime ? 
        (5000 + Math.random() * 15000) : // 5000-20000 lux during day
        Math.random() * 50);             // 0-50 lux during night
    
    // Pump status - 90% chance of being OFF, 10% chance of being ON
    const pump = overrides.pump ?? 
      (Math.random() < 0.1 ? "ON" : "OFF");
    
    // Generate thresholds
    const thresholds = overrides.thresholds ?? {
      soil: 35, // 35% soil moisture threshold
      light: 20000, // 20,000 lux light threshold
      tempMin: 18, // 18°C minimum temperature
      tempMax: 30, // 30°C maximum temperature 
      humidityMax: 70 // 70% maximum humidity
    };
    
    // Return the mock data in the same format as the real device
    return {
      messageType: "sensor",
      deviceId: deviceId,
      timestamp: timestamp,
      soil_moisture: parseFloat(soil_moisture.toFixed(1)),
      temperature: parseFloat(temperature.toFixed(1)),
      air_humidity: parseFloat(air_humidity.toFixed(1)),
      light_intensity: Math.floor(light_intensity),
      pump: pump,
      thresholds: thresholds
    };
  }
  
  /**
   * Generate a mock watering event
   * 
   * @param {Number} deviceId - The device ID
   * @returns {Object} Mock watering event data
   */
  static generateWateringEvent(deviceId = 3) {
    return {
      messageType: "watering",
      deviceId: deviceId,
      timestamp: new Date().toISOString(),
      pump: "ON",
      duration: Math.floor(Math.random() * 10) + 5, // 5-15 seconds
      amount_ml: Math.floor(Math.random() * 200) + 100 // 100-300ml
    };
  }
  
  /**
   * Generate a mock alarm event
   * 
   * @param {Number} deviceId - The device ID
   * @param {String} type - The alarm type ('moisture', 'temperature', 'humidity', 'light')
   * @returns {Object} Mock alarm event data
   */
  static generateAlarmEvent(deviceId = 3, type = 'moisture') {
    let value, threshold, message;
    
    switch(type) {
      case 'moisture':
        value = Math.floor(Math.random() * 20) + 10; // 10-30%
        threshold = 35;
        message = "Low soil moisture detected";
        break;
      case 'temperature':
        value = Math.floor(Math.random() * 5) + 32; // 32-37°C
        threshold = 30;
        message = "High temperature detected";
        break;
      case 'humidity':
        value = Math.floor(Math.random() * 10) + 75; // 75-85%
        threshold = 70;
        message = "High humidity detected";
        break;
      case 'light':
        value = Math.floor(Math.random() * 5000) + 25000; // 25000-30000 lux
        threshold = 20000;
        message = "High light intensity detected";
        break;
      default:
        value = 0;
        threshold = 0;
        message = "Unknown alarm";
    }
    
    return {
      messageType: "alarm",
      deviceId: deviceId,
      timestamp: new Date().toISOString(),
      type: type,
      value: value,
      threshold: threshold,
      message: message
    };
  }
}

module.exports = EnhancedDeviceMock;