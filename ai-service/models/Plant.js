/**
 * Plant Model - Mock model for plant data
 */

class Plant {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.description = data.description;
    this.userId = data.userId;
    this.location = data.location;
    this.plantedDate = data.plantedDate || new Date();
    this.status = data.status || 'healthy';
    this.imageUrl = data.imageUrl;
    this.notes = data.notes;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async findById(id) {
    // Mock plant data
    const mockPlants = {
      1: {
        id: 1,
        name: 'Cà chua Cherry',
        type: 'tomato',
        description: 'Cà chua cherry ngọt, dễ trồng trong chậu',
        userId: 'user123',
        location: 'Ban công',
        plantedDate: new Date('2024-09-01'),
        status: 'healthy',
        imageUrl: '/uploads/tomato-cherry.jpg',
        notes: 'Phát triển tốt, đã có hoa'
      },
      2: {
        id: 2,
        name: 'Xà lách xoăn',
        type: 'lettuce',
        description: 'Xà lách xoăn tươi ngon, phát triển nhanh',
        userId: 'user123',
        location: 'Vườn nhỏ',
        plantedDate: new Date('2024-09-15'),
        status: 'growing',
        imageUrl: '/uploads/lettuce-curly.jpg',
        notes: 'Lá đang xanh tốt'
      },
      3: {
        id: 3,
        name: 'Ớt chuông',
        type: 'pepper',
        description: 'Ớt chuông ngọt, màu sắc đẹp',
        userId: 'user123',
        location: 'Chậu lớn',
        plantedDate: new Date('2024-08-15'),
        status: 'flowering',
        imageUrl: '/uploads/bell-pepper.jpg',
        notes: 'Đã có hoa, sắp ra quả'
      }
    };

    const plantData = mockPlants[id] || mockPlants[1];
    return new Plant(plantData);
  }

  static async findByUserId(userId) {
    const plants = [];
    for (let i = 1; i <= 3; i++) {
      const plant = await this.findById(i);
      if (plant.userId === userId) {
        plants.push(plant);
      }
    }
    return plants;
  }

  static async findAll() {
    const plants = [];
    for (let i = 1; i <= 3; i++) {
      plants.push(await this.findById(i));
    }
    return plants;
  }

  static async create(data) {
    return new Plant({
      id: Math.floor(Math.random() * 1000),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  static async update(id, data) {
    const existing = await this.findById(id);
    return new Plant({
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date()
    });
  }

  static async delete(id) {
    // Mock delete operation
    console.log(`Plant ${id} deleted`);
    return true;
  }

  // Helper methods
  getAge() {
    const now = new Date();
    const planted = new Date(this.plantedDate);
    const diffTime = Math.abs(now - planted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getGrowthStage() {
    const age = this.getAge();
    if (age < 14) return 'seedling';
    if (age < 30) return 'young';
    if (age < 60) return 'mature';
    return 'adult';
  }

  getHealthStatus() {
    return this.status;
  }
}

module.exports = Plant;