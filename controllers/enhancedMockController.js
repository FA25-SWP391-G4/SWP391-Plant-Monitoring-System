/**
 * Enhanced Device Mock API Controller
 * 
 * This controller provides endpoints to access the enhanced device mock data
 * that matches the format from real IoT devices.
 */

const EnhancedDeviceMock = require('../services/mocks/enhancedDeviceMock');

/**
 * Get mock device data in the same format as real device
 */
const getMockDeviceData = (req, res) => {
  try {
    // Extract parameters from request
    const deviceId = parseInt(req.query.deviceId || 3, 10);
    
    // Generate mock data
    const mockData = EnhancedDeviceMock.generateMockData(deviceId);
    
    res.json(mockData);
  } catch (error) {
    console.error('Error generating mock device data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate mock device data',
      error: error.message 
    });
  }
};

/**
 * Get mock watering event data
 */
const getMockWateringEvent = (req, res) => {
  try {
    // Extract parameters from request
    const deviceId = parseInt(req.query.deviceId || 3, 10);
    
    // Generate mock watering event
    const mockEvent = EnhancedDeviceMock.generateWateringEvent(deviceId);
    
    res.json(mockEvent);
  } catch (error) {
    console.error('Error generating mock watering event:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate mock watering event',
      error: error.message 
    });
  }
};

/**
 * Get mock alarm event data
 */
const getMockAlarmEvent = (req, res) => {
  try {
    // Extract parameters from request
    const deviceId = parseInt(req.query.deviceId || 3, 10);
    const type = req.query.type || 'moisture';
    
    // Generate mock alarm event
    const mockEvent = EnhancedDeviceMock.generateAlarmEvent(deviceId, type);
    
    res.json(mockEvent);
  } catch (error) {
    console.error('Error generating mock alarm event:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate mock alarm event',
      error: error.message 
    });
  }
};

module.exports = {
  getMockDeviceData,
  getMockWateringEvent,
  getMockAlarmEvent
};