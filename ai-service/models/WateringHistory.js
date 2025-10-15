/**
 * WateringHistory Model - Mock model for watering history
 */

class WateringHistory {
  constructor(data) {
    this.id = data.id;
    this.plantId = data.plantId;
    this.amount = data.amount;
    this.timestamp = data.timestamp || new Date();
    this.userId = data.userId;
    this.automatic = data.automatic || false;
    this.moistureBefore = data.moistureBefore;
    this.moistureAfter = data.moistureAfter;
    this.notes = data.notes;
  }

  static async findByPlantId(plantId, limit = 10) {
    // Mock watering history
    const mockHistory = [];
    for (let i = 0; i < limit; i++) {
      mockHistory.push(new WateringHistory({
        id: i + 1,
        plantId,
        amount: 150 + Math.random() * 200, // 150-350ml
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // i days ago
        userId: 'user123',
        automatic: Math.random() > 0.3, // 70% automatic
        moistureBefore: 30 + Math.random() * 20,
        moistureAfter: 50 + Math.random() * 20,
        notes: i === 0 ? 'Latest watering' : `Watering ${i + 1} days ago`
      }));
    }
    return mockHistory;
  }

  static async getRecent(plantId, days = 7) {
    const history = await this.findByPlantId(plantId, days);
    return history.filter(h => {
      const daysDiff = (Date.now() - h.timestamp) / (1000 * 60 * 60 * 24);
      return daysDiff <= days;
    });
  }

  static async create(data) {
    return new WateringHistory({
      id: Math.floor(Math.random() * 1000),
      ...data,
      timestamp: new Date()
    });
  }

  static async getTotalAmount(plantId, days = 7) {
    const history = await this.getRecent(plantId, days);
    return history.reduce((total, h) => total + h.amount, 0);
  }

  static async getAverageInterval(plantId, limit = 10) {
    const history = await this.findByPlantId(plantId, limit);
    if (history.length < 2) return 24; // Default 24 hours

    const intervals = [];
    for (let i = 1; i < history.length; i++) {
      const diff = (history[i-1].timestamp - history[i].timestamp) / (1000 * 60 * 60);
      intervals.push(diff);
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }
}

module.exports = WateringHistory;