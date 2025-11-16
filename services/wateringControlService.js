const waterLevels = new Map();
const SystemLog = require('../models/SystemLog');

async function updateWaterLevel(deviceId, level) {
  if (!deviceId) return;
  const numericLevel = typeof level === 'number' ? level : parseFloat(level);
  const safeLevel = Number.isFinite(numericLevel) ? numericLevel : null;

  const entry = {
    deviceId: String(deviceId).trim(),
    level: safeLevel,
    status: getStatusFromLevel(safeLevel),
    updatedAt: new Date()
  };

  waterLevels.set(entry.deviceId, entry);  

  if (safeLevel !== null && safeLevel < 20) {
    await SystemLog.warning(
      'WaterReservoir',
      `Water level low (<20%) for device ${entry.deviceId}`,
      { deviceKey: entry.deviceId, level: safeLevel }
    );
  }
}

async function getStatusFromLevel(level) {
  if (level === null || level === undefined || Number.isNaN(level)) return 'unknown';
  if (level <= 10) return 'critical';
  if (level <= 30) return 'low';
  return 'ok';
}

async function getWaterStatus(deviceId) {
  if (!deviceId) {
    return { level: null, status: 'unknown', updatedAt: null };
  }
  const entry = waterLevels.get(String(deviceId).trim());
  if (!entry) {
    return { level: null, status: 'unknown', updatedAt: null };
  }
  return entry;
}

async function canWater(deviceId, minLevel = 20) {
  const status = await getWaterStatus(deviceId);
  if (status.level === null || status.level === undefined || Number.isNaN(status.level)) return true;
  return status.level >= minLevel;
}

module.exports = {
  updateWaterLevel,
  getWaterStatus,
  canWater
};
