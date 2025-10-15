/**
 * Alert Model - Mock model for alerts
 */

class Alert {
  constructor(data) {
    this.id = data.id;
    this.plantId = data.plantId;
    this.userId = data.userId;
    this.type = data.type; // 'warning', 'error', 'info'
    this.severity = data.severity; // 'low', 'medium', 'high', 'critical'
    this.title = data.title;
    this.message = data.message;
    this.acknowledged = data.acknowledged || false;
    this.acknowledgedBy = data.acknowledgedBy;
    this.acknowledgedAt = data.acknowledgedAt;
    this.resolved = data.resolved || false;
    this.resolvedAt = data.resolvedAt;
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async findByPlantId(plantId, limit = 10) {
    // Mock alerts data
    const mockAlerts = [];
    const alertTypes = [
      {
        type: 'warning',
        severity: 'medium',
        title: 'Độ ẩm đất thấp',
        message: 'Độ ẩm đất hiện tại là 35%, thấp hơn mức khuyến nghị'
      },
      {
        type: 'error',
        severity: 'high',
        title: 'Nhiệt độ quá cao',
        message: 'Nhiệt độ đạt 35°C, có thể gây stress cho cây'
      },
      {
        type: 'info',
        severity: 'low',
        title: 'Thời gian bón phân',
        message: 'Đã đến thời gian bón phân định kỳ cho cây'
      },
      {
        type: 'warning',
        severity: 'critical',
        title: 'Nguy cơ bệnh nấm',
        message: 'Độ ẩm cao kéo dài, có nguy cơ phát triển bệnh nấm'
      }
    ];

    for (let i = 0; i < Math.min(limit, alertTypes.length); i++) {
      const alertTemplate = alertTypes[i];
      mockAlerts.push(new Alert({
        id: i + 1,
        plantId,
        userId: 'user123',
        ...alertTemplate,
        acknowledged: Math.random() > 0.5,
        resolved: Math.random() > 0.7,
        metadata: {
          sensorValue: 35 + Math.random() * 30,
          threshold: 40,
          source: 'ai_analysis'
        },
        createdAt: new Date(Date.now() - i * 60 * 60 * 1000) // i hours ago
      }));
    }

    return mockAlerts;
  }

  static async findById(id) {
    const alerts = await this.findByPlantId(1, 10);
    return alerts.find(alert => alert.id === parseInt(id));
  }

  static async findByUserId(userId, limit = 20) {
    // Mock user alerts across all plants
    const allAlerts = [];
    for (let plantId = 1; plantId <= 3; plantId++) {
      const plantAlerts = await this.findByPlantId(plantId, 5);
      allAlerts.push(...plantAlerts);
    }
    
    return allAlerts
      .filter(alert => alert.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  static async findUnacknowledged(plantId) {
    const alerts = await this.findByPlantId(plantId, 20);
    return alerts.filter(alert => !alert.acknowledged);
  }

  static async findBySeverity(plantId, severity) {
    const alerts = await this.findByPlantId(plantId, 20);
    return alerts.filter(alert => alert.severity === severity);
  }

  static async create(data) {
    return new Alert({
      id: Math.floor(Math.random() * 1000),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  static async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    return new Alert({
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date()
    });
  }

  static async acknowledge(id, userId) {
    return this.update(id, {
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date()
    });
  }

  static async resolve(id, userId) {
    return this.update(id, {
      resolved: true,
      resolvedBy: userId,
      resolvedAt: new Date()
    });
  }

  static async delete(id) {
    console.log(`Alert ${id} deleted`);
    return true;
  }

  static async getStatistics(plantId) {
    const alerts = await this.findByPlantId(plantId, 50);
    
    const stats = {
      total: alerts.length,
      acknowledged: alerts.filter(a => a.acknowledged).length,
      resolved: alerts.filter(a => a.resolved).length,
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length
      },
      byType: {
        warning: alerts.filter(a => a.type === 'warning').length,
        error: alerts.filter(a => a.type === 'error').length,
        info: alerts.filter(a => a.type === 'info').length
      }
    };

    return stats;
  }

  // Instance methods
  acknowledge(userId) {
    this.acknowledged = true;
    this.acknowledgedBy = userId;
    this.acknowledgedAt = new Date();
    this.updatedAt = new Date();
    return this;
  }

  resolve(userId) {
    this.resolved = true;
    this.resolvedBy = userId;
    this.resolvedAt = new Date();
    this.updatedAt = new Date();
    return this;
  }

  isActive() {
    return !this.resolved;
  }

  getAge() {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffTime = Math.abs(now - created);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours;
  }
}

module.exports = Alert;