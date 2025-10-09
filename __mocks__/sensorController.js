/**
 * Sensor Controller Mock
 */

// Get sensor data for a specific sensor
const getSensorData = async (req, res) => {
    try {
        const sensorId = req.params.id;
        const userId = req.user.id;
        
        // Mock sensor data - 24 hours of hourly readings
        const now = new Date();
        const data = [];
        
        for (let i = 24; i >= 0; i--) {
            const time = new Date(now);
            time.setHours(time.getHours() - i);
            
            data.push({
                sensorId,
                timestamp: time.toISOString(),
                value: 50 + Math.floor(Math.random() * 30), // Random value between 50-80
                unit: 'percent'
            });
        }
        
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching sensor data', error: error.message });
    }
};

// Get recent sensor data
const getRecentSensorData = async (req, res) => {
    try {
        const sensorId = req.params.id;
        const userId = req.user.id;
        const hours = req.query.hours || 24;
        
        // Mock recent sensor data
        const now = new Date();
        const data = [];
        
        for (let i = hours; i >= 0; i--) {
            const time = new Date(now);
            time.setHours(time.getHours() - i);
            
            data.push({
                sensorId,
                timestamp: time.toISOString(),
                value: 50 + Math.floor(Math.random() * 30), // Random value between 50-80
                unit: 'percent'
            });
        }
        
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching recent sensor data', error: error.message });
    }
};

// Set sensor thresholds
const setSensorThresholds = async (req, res) => {
    try {
        const sensorId = req.params.id;
        const userId = req.user.id;
        const { min, max, alertEnabled } = req.body;
        
        // Validate thresholds
        if (min !== undefined && max !== undefined && min > max) {
            return res.status(400).json({ message: 'Minimum threshold cannot be greater than maximum threshold' });
        }
        
        // Mock sensor
        const sensor = {
            id: sensorId,
            name: 'Moisture Sensor',
            type: 'moisture',
            ownerId: userId
        };
        
        // Check if sensor exists and belongs to user
        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }
        
        if (sensor.ownerId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access to this sensor' });
        }
        
        // Mock updated thresholds
        const thresholds = {
            sensorId,
            thresholds: {
                min: min !== undefined ? min : 30,
                max: max !== undefined ? max : 80,
                alertEnabled: alertEnabled !== undefined ? alertEnabled : true
            }
        };
        
        return res.json(thresholds);
    } catch (error) {
        return res.status(500).json({ message: 'Error setting sensor thresholds', error: error.message });
    }
};

// Register a new sensor
const registerSensor = async (req, res) => {
    try {
        const { name, type, plantId, location } = req.body;
        const userId = req.user.id;
        
        // Validate required fields
        if (!name || !type || !plantId) {
            return res.status(400).json({ message: 'Name, type, and plant ID are required' });
        }
        
        // Mock creating a new sensor
        const newSensor = {
            id: `sensor${Date.now()}`,
            name,
            type,
            plantId,
            location: location || 'Not specified',
            dateRegistered: new Date().toISOString(),
            ownerId: userId
        };
        
        return res.status(201).json(newSensor);
    } catch (error) {
        return res.status(500).json({ message: 'Error registering sensor', error: error.message });
    }
};

// Update a sensor
const updateSensor = async (req, res) => {
    try {
        const sensorId = req.params.id;
        const userId = req.user.id;
        const updates = req.body;
        
        // Mock finding sensor by ID
        const sensor = {
            id: sensorId,
            name: 'Moisture Sensor',
            type: 'moisture',
            plantId: 'plant123',
            location: 'Living Room',
            dateRegistered: '2023-03-20T10:15:00Z',
            ownerId: userId
        };
        
        // Check if sensor exists and belongs to user
        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }
        
        if (sensor.ownerId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access to this sensor' });
        }
        
        // Mock updating the sensor
        const updatedSensor = {
            ...sensor,
            ...updates,
            id: sensorId,  // Ensure ID doesn't change
            ownerId: userId  // Ensure owner doesn't change
        };
        
        return res.json(updatedSensor);
    } catch (error) {
        return res.status(500).json({ message: 'Error updating sensor', error: error.message });
    }
};

// Delete a sensor
const deleteSensor = async (req, res) => {
    try {
        const sensorId = req.params.id;
        const userId = req.user.id;
        
        // Mock finding sensor by ID
        const sensor = {
            id: sensorId,
            name: 'Moisture Sensor',
            ownerId: userId
        };
        
        // Check if sensor exists and belongs to user
        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }
        
        if (sensor.ownerId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access to this sensor' });
        }
        
        // Mock successful deletion
        return res.json({
            message: 'Sensor successfully deleted',
            id: sensorId
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting sensor', error: error.message });
    }
};

module.exports = {
    getSensorData,
    getRecentSensorData,
    setSensorThresholds,
    registerSensor,
    updateSensor,
    deleteSensor
};