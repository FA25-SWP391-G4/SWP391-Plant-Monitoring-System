/**
 * PlantInfo Model - Mock model for plant information
 */

class PlantInfo {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.description = data.description;
    this.optimalSoilMoisture = data.optimalSoilMoisture || { min: 40, max: 60 };
    this.optimalTemp = data.optimalTemp || { min: 20, max: 30 };
    this.optimalHumidity = data.optimalHumidity || { min: 40, max: 70 };
    this.optimalLight = data.optimalLight || { min: 2000, max: 5000 };
    this.optimalPH = data.optimalPH || { min: 6.0, max: 7.0 };
    this.age = data.age || 30;
    this.careInstructions = data.careInstructions;
    this.createdAt = data.createdAt || new Date();
  }

  static async findById(id) {
    // Mock plant data
    const mockPlants = {
      1: {
        id: 1,
        name: 'Cà chua Cherry',
        type: 'tomato',
        description: 'Cà chua cherry ngọt, dễ trồng trong chậu',
        optimalSoilMoisture: { min: 45, max: 65 },
        optimalTemp: { min: 18, max: 28 },
        optimalHumidity: { min: 50, max: 70 },
        optimalLight: { min: 3000, max: 6000 },
        optimalPH: { min: 6.0, max: 6.8 },
        age: 45,
        careInstructions: 'Tưới đều đặn, cần nhiều ánh sáng, bón phân 2 tuần/lần'
      },
      2: {
        id: 2,
        name: 'Xà lách xoăn',
        type: 'lettuce',
        description: 'Xà lách xoăn tươi ngon, phát triển nhanh',
        optimalSoilMoisture: { min: 50, max: 70 },
        optimalTemp: { min: 15, max: 25 },
        optimalHumidity: { min: 60, max: 80 },
        optimalLight: { min: 2000, max: 4000 },
        optimalPH: { min: 6.2, max: 7.0 },
        age: 25,
        careInstructions: 'Giữ ẩm liên tục, tránh nhiệt độ cao, thu hoạch sớm'
      },
      3: {
        id: 3,
        name: 'Ớt chuông',
        type: 'pepper',
        description: 'Ớt chuông ngọt, màu sắc đẹp',
        optimalSoilMoisture: { min: 40, max: 60 },
        optimalTemp: { min: 20, max: 30 },
        optimalHumidity: { min: 45, max: 65 },
        optimalLight: { min: 4000, max: 7000 },
        optimalPH: { min: 6.0, max: 6.8 },
        age: 60,
        careInstructions: 'Cần nhiều ánh sáng, tưới vừa phải, đỡ cành khi có quả'
      }
    };

    const plantData = mockPlants[id] || mockPlants[1];
    return new PlantInfo(plantData);
  }

  static async findAll() {
    const plants = [];
    for (let i = 1; i <= 3; i++) {
      plants.push(await this.findById(i));
    }
    return plants;
  }

  static async create(data) {
    return new PlantInfo({
      id: Math.floor(Math.random() * 1000),
      ...data,
      createdAt: new Date()
    });
  }

  static async update(id, data) {
    const existing = await this.findById(id);
    return new PlantInfo({
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date()
    });
  }
}

module.exports = PlantInfo;