/**
 * SensorData Model - Mock model for sensor data
 */

class SensorData {
  constructor(data) {
    this.id = data.id;
    this.plantId = data.plantId;
    this.temperature = data.temperature;
    this.soilMoisture = data.soilMoisture;
    this.humidity = data.humidity;
    this.lightLevel = data.lightLevel;
    this.soilPH = data.soilPH;
    this.timestamp = data.timestamp || new Date();
  }

  static async findByPlantId(plantId, limit = 10) {
    // Mock data for testing
    const mockData = [];
    for (let i = 0; i < limit; i++) {
      mockData.push(new SensorData({
        id: i + 1,
        plantId,
        temperature: 20 + Math.random() * 15,
        soilMoisture: 30 + Math.random() * 40,
        humidity: 40 + Math.random() * 30,
        lightLevel: 2000 + Math.random() * 3000,
        soilPH: 6.0 + Math.random() * 2.0,
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000) // i hours ago
      }));
    }
    return mockData;
  }

  static async getLatest(plantId) {
    return new SensorData({
      id: 1,
      plantId,
      temperature: 25 + Math.random() * 5,
      soilMoisture: 45 + Math.random() * 20,
      humidity: 55 + Math.random() * 15,
      lightLevel: 3000 + Math.random() * 1000,
      soilPH: 6.5 + Math.random() * 0.5,
      timestamp: new Date()
    });
  }

  static async create(data) {
    return new SensorData({
      id: Math.floor(Math.random() * 1000),
      ...data,
      timestamp: new Date()
    });
  }
}

module.exports = SensorData;