/**
 * Dashboard Mock Controller
 * 
 * This controller uses the dynamic plant mock service to provide realistic
 * data for the dashboard while maintaining compatibility with the real controllers.
 * 
 * Enhanced to use the enhanced device mock for real-time data and calculate
 * plant health metrics based on sensor readings.
 */

const dynamicMock = require('../services/mocks/dynamicPlantMock');
const EnhancedDeviceMock = require('../services/mocks/enhancedDeviceMock');

/**
 * Get dashboard overview data including plants and sensor readings
 */
const getDashboardOverview = async (req, res) => {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.id || 11; // Default to mock user ID 11 if no user in request
    
    // Get plants for the user from mock
    const plants = await dynamicMock.getPlantsByUserId(userId);
    
    if (!plants || plants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No plants found for this user'
      });
    }
    
    // Get sensor data for these plants
    const plantIds = plants.map(plant => plant.plant_id);
    const sensorData = await dynamicMock.getSensorDataByPlantIds(plantIds);
    
    // Get watering schedules
    const schedules = await dynamicMock.getWateringSchedules(userId);
    
    // Get health history data for each plant
    const healthHistory = {};
    try {
      // Query the database for recent health history
      for (const plantId of plantIds) {
        const result = await dynamicMock.dbPool.query(
          `SELECT * FROM health_history 
           WHERE plant_id = $1 
           ORDER BY timestamp DESC 
           LIMIT 10`,
          [plantId]
        );
        healthHistory[plantId] = result.rows;
      }
    } catch (error) {
      console.log('Health history not available yet:', error.message);
    }
    
    // Get the latest device data from enhanced device mock for each plant
    const realtimeData = {};
    for (const plant of plants) {
      const deviceId = plant.device_id || 3;
      realtimeData[plant.plant_id] = EnhancedDeviceMock.generateMockData(deviceId);
    }
    
    res.json({
      success: true,
      data: {
        plants,
        sensorData,
        schedules,
        healthHistory,
        realtimeData
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load dashboard data',
      error: error.message 
    });
  }
};

/**
 * Get sensor data for specific plants or all user plants
 */
const getSensorData = async (req, res) => {
  try {
    const userId = req.user?.id || 11; // Default to mock user ID 11 if no user in request
    const { plantIds } = req.query;
    
    let plants = await dynamicMock.getPlantsByUserId(userId);
    
    // Filter plants if specific plantIds were requested
    if (plantIds) {
      // Convert comma-separated string to array of numbers
      const ids = plantIds.split(',').map(id => parseInt(id, 10));
      plants = plants.filter(p => ids.includes(p.plant_id));
    }
    
    if (!plants || plants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No plants found'
      });
    }
    
    const plantIdsToFetch = plants.map(p => p.plant_id);
    const sensorData = await dynamicMock.getSensorDataByPlantIds(plantIdsToFetch);
    
    res.json({
      success: true,
      data: sensorData
    });
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load sensor data',
      error: error.message 
    });
  }
};

/**
 * Get watering history for specific plant or all plants
 * Queries the database for watering history records
 */
const getWateringHistory = async (req, res) => {
  try {
    const userId = req.user?.id || 11; // Default to mock user ID 11 if no user in request
    const { plantId, limit = 20 } = req.query;
    
    // Get plants first
    const plants = await dynamicMock.getPlantsByUserId(userId);
    
    if (!plants || plants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No plants found for this user'
      });
    }
    
    let history;
    const limitNum = parseInt(limit, 10);
    
    try {
      // Connect to database to fetch watering history
      if (plantId) {
        const plantIdNum = parseInt(plantId, 10);
        // Check if plant belongs to user
        if (!plants.some(p => p.plant_id === plantIdNum)) {
          return res.status(403).json({
            success: false,
            message: 'Plant does not belong to this user'
          });
        }
        
        // Query database for specific plant's watering history
        const result = await dynamicMock.dbPool.query(
          `SELECT * FROM watering_history 
           WHERE plant_id = $1 
           ORDER BY timestamp DESC
           LIMIT $2`,
          [plantIdNum, limitNum]
        );
        history = result.rows;
      } else {
        // Get all user plants
        const plantIds = plants.map(p => p.plant_id);
        
        // Query database for all user plants' watering history
        const result = await dynamicMock.dbPool.query(
          `SELECT * FROM watering_history 
           WHERE plant_id = ANY($1::int[]) 
           ORDER BY timestamp DESC
           LIMIT $2`,
          [plantIds, limitNum]
        );
        history = result.rows;
      }
    } catch (error) {
      console.error('Error querying watering history from DB:', error);
      // Fallback to in-memory history
      history = dynamicMock.wateringHistory
        .filter(event => plantId ? 
          event.plant_id === parseInt(plantId, 10) : 
          plants.some(p => p.plant_id === event.plant_id))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limitNum);
    }
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching watering history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load watering history',
      error: error.message 
    });
  }
};

/**
 * Get recent activities for the user
 * Combines watering history and sensor events into a single timeline
 */
const getRecentActivities = async (req, res) => {
  try {
    const userId = req.user?.id || 11; // Default to mock user ID 11 if no user in request
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit, 10);
    
    // Get plants first
    const plants = await dynamicMock.getPlantsByUserId(userId);
    
    if (!plants || plants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No plants found for this user'
      });
    }
    
    const plantIds = plants.map(p => p.plant_id);
    
    // Get recent watering history as activities
    let activities = [];
    
    try {
      // Get watering history
      const wateringResult = await dynamicMock.dbPool.query(
        `SELECT * FROM watering_history 
         WHERE plant_id = ANY($1::int[]) 
         ORDER BY timestamp DESC
         LIMIT $2`,
        [plantIds, limitNum]
      );
      
      // Format watering events as activities
      const wateringActivities = wateringResult.rows.map(event => {
        const plant = plants.find(p => p.plant_id === event.plant_id);
        return {
          id: `watering-${event.id}`,
          type: 'watering',
          title: `${plant?.name || 'Plant'} was watered`,
          description: `${event.amount_ml}ml of water (${event.source})`,
          timestamp: event.timestamp,
          plantId: event.plant_id,
          data: event
        };
      });
      
      // Add to activities
      activities = wateringActivities;
      
    } catch (error) {
      console.error('Error getting watering activities:', error);
      // Leave activities empty as fallback
    }
    
    // Sort activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit to requested number
    activities = activities.slice(0, limitNum);
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load activities',
      error: error.message 
    });
  }
};

/**
 * Water a plant manually
 * Creates a watering event in the database
 */
const waterPlant = async (req, res) => {
  try {
    const userId = req.user?.id || 11; // Default to mock user ID 11 if no user in request
    const { plantId } = req.params;
    const { duration = 15, amount_ml = 200 } = req.body;
    
    // Find the plant
    const plantIdNum = parseInt(plantId, 10);
    const plants = await dynamicMock.getPlantsByUserId(userId);
    const plant = plants.find(p => p.plant_id === plantIdNum);
      
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found'
      });
    }
    
    // Water the plant
    const wateringEvent = await dynamicMock.triggerWatering(plantIdNum, {
      user_id: userId,
      amount_ml: amount_ml, 
      duration_seconds: duration,
      source: 'manual'
    });
    
    res.json({
      success: true,
      message: 'Plant watered successfully',
      data: wateringEvent
    });
  } catch (error) {
    console.error('Error watering plant:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to water plant',
      error: error.message 
    });
  }
};

/**
 * Get weather data (mock)
 */
const getWeatherData = async (req, res) => {
  try {
    // Generate random weather data
    const weather = {
      temperature: Math.round((15 + Math.random() * 15) * 10) / 10, // 15-30°C
      humidity: Math.round(40 + Math.random() * 50), // 40-90%
      conditions: ['sunny', 'partly cloudy', 'cloudy', 'light rain', 'rain'][Math.floor(Math.random() * 5)],
      wind: Math.round((1 + Math.random() * 19) * 10) / 10, // 1-20 km/h
      forecast: [
        {
          day: 'Today',
          conditions: ['sunny', 'partly cloudy', 'cloudy', 'light rain', 'rain'][Math.floor(Math.random() * 5)],
          temperature: {
            high: Math.round((22 + Math.random() * 8) * 10) / 10,
            low: Math.round((15 + Math.random() * 5) * 10) / 10
          }
        },
        {
          day: 'Tomorrow',
          conditions: ['sunny', 'partly cloudy', 'cloudy', 'light rain', 'rain'][Math.floor(Math.random() * 5)],
          temperature: {
            high: Math.round((22 + Math.random() * 8) * 10) / 10,
            low: Math.round((15 + Math.random() * 5) * 10) / 10
          }
        }
      ]
    };
    
    res.json({
      success: true,
      data: weather
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load weather data',
      error: error.message 
    });
  }
};

/**
 * Get watering schedules for user
 * Queries the database for watering schedule records
 */
const getWateringSchedules = async (req, res) => {
  try {
    const userId = req.user?.id || 11; // Default to mock user ID 11 if no user in request
    
    const schedules = await dynamicMock.getWateringSchedules(userId);
    
    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching watering schedules:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load watering schedules',
      error: error.message 
    });
  }
};

/**
 * Get plant health history
 * Returns detailed health history for a plant or all user plants
 */
const getPlantHealthHistory = async (req, res) => {
  try {
    const userId = req.user?.id || 11; // Default to mock user ID 11 if no user in request
    const { plantId, limit = 30 } = req.query;
    
    // Get plants first
    const plants = await dynamicMock.getPlantsByUserId(userId);
    
    if (!plants || plants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No plants found for this user'
      });
    }
    
    let healthHistory = [];
    const limitNum = parseInt(limit, 10);
    
    // Query database for health history
    try {
      if (plantId) {
        const plantIdNum = parseInt(plantId, 10);
        // Check if plant belongs to user
        if (!plants.some(p => p.plant_id === plantIdNum)) {
          return res.status(403).json({
            success: false,
            message: 'Plant does not belong to this user'
          });
        }
        
        // Get health history for specific plant
        const result = await dynamicMock.dbPool.query(
          `SELECT * FROM health_history 
           WHERE plant_id = $1 
           ORDER BY timestamp DESC
           LIMIT $2`,
          [plantIdNum, limitNum]
        );
        healthHistory = result.rows;
      } else {
        // Get health history for all user plants
        const plantIds = plants.map(p => p.plant_id);
        
        const result = await dynamicMock.dbPool.query(
          `SELECT * FROM health_history 
           WHERE plant_id = ANY($1::int[]) 
           ORDER BY timestamp DESC
           LIMIT $2`,
          [plantIds, limitNum]
        );
        healthHistory = result.rows;
      }
    } catch (error) {
      console.error('Error querying health history from DB:', error);
      // Generate mock health history if DB fails
      healthHistory = plants.flatMap(plant => {
        return Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          plant_id: plant.plant_id,
          timestamp: new Date(Date.now() - i * 86400000).toISOString(),
          health_score: Math.max(0, Math.min(100, plant.health + (Math.random() * 10) - 5)),
          moisture_factor: Math.floor(Math.random() * 40) + 60,
          temperature_factor: Math.floor(Math.random() * 20) + 80,
          humidity_factor: Math.floor(Math.random() * 30) + 70,
          light_factor: Math.floor(Math.random() * 25) + 75
        }));
      }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limitNum);
    }
    
    res.json({
      success: true,
      data: healthHistory
    });
  } catch (error) {
    console.error('Error fetching plant health history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load plant health history',
      error: error.message 
    });
  }
};

/**
 * Get realtime device data
 * Returns the latest data from the enhanced device mock
 */
const getRealtimeDeviceData = async (req, res) => {
  try {
    const { deviceId } = req.query;
    const deviceIdNum = parseInt(deviceId || 3, 10);
    
    // Generate mock data from enhanced device mock
    const realtimeData = EnhancedDeviceMock.generateMockData(deviceIdNum);
    
    res.json({
      success: true,
      data: realtimeData
    });
  } catch (error) {
    console.error('Error generating realtime device data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate realtime device data',
      error: error.message 
    });
  }
};

module.exports = {
  getDashboardOverview,
  getSensorData,
  getWateringHistory,
  getRecentActivities,
  getWateringSchedules,
  waterPlant,
  getWeatherData,
  getPlantHealthHistory,
  getRealtimeDeviceData
};