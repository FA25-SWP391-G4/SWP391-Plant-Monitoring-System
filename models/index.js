// Models index file - exports all models for easy importing
const User = require('./User');
const PlantProfile = require('./PlantProfile');
const AIModel = require('./AIModel');
const Device = require('./Device');
const Plant = require('./Plant');
const SensorData = require('./SensorData');
const WateringHistory = require('./WateringHistory');
const PumpSchedule = require('./PumpSchedule');
const Alert = require('./Alert');
const Payment = require('./Payment');
const SystemLog = require('./SystemLog');
const ChatHistory = require('./ChatHistory');

module.exports = {
    User,
    PlantProfile,
    AIModel,
    Device,
    Plant,
    SensorData,
    WateringHistory,
    PumpSchedule,
    Alert,
    Payment,
    SystemLog,
    ChatHistory
};
